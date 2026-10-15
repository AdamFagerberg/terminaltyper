import type { Key, TestState } from './types.js';
import { randomWords } from './words.js';

const WORDS_AHEAD = 50;
const MAX_EXTRA = 20;

// Engine-internal fields; the UI only sees TestState.
export interface InternalTestState extends TestState {
  readonly rng: () => number;
  // Cumulative key counts at the time of the last sample, for per-second deltas.
  readonly sampledKeys: number;
  readonly sampledErrors: number;
}

function withWords(state: InternalTestState): InternalTestState {
  if (state.words.length - 1 - state.index >= WORDS_AHEAD) return state;
  const more = randomWords(WORDS_AHEAD + 50, state.rng);
  if (more[0] === state.words.at(-1)) more.shift();
  return { ...state, words: [...state.words, ...more] };
}

export function createTest(opts: { duration: number; words?: string[]; rng?: () => number }): TestState {
  const state: InternalTestState = {
    duration: opts.duration,
    phase: 'waiting',
    words: opts.words ?? [],
    typed: [''],
    index: 0,
    startedAt: null,
    endedAt: null,
    correctKeys: 0,
    incorrectKeys: 0,
    samples: [],
    rng: opts.rng ?? Math.random,
    sampledKeys: 0,
    sampledErrors: 0,
  };
  return withWords(state);
}

// Index to step back to from an empty current word: only into a previous word typed incorrectly.
function previousWrongWord(s: TestState): number | null {
  const prev = s.index - 1;
  return prev >= 0 && s.typed[prev] !== s.words[prev] ? prev : null;
}

function setCurrent(s: TestState, text: string): readonly string[] {
  return [...s.typed.slice(0, s.index), text];
}

function goBack(s: TestState, prev: number, text: string): Partial<TestState> {
  return { index: prev, typed: [...s.typed.slice(0, prev), text] };
}

export function applyKey(state: TestState, key: Key, now: number): TestState {
  const s = tick(state, now) as InternalTestState;
  if (s.phase === 'finished') return s;
  if (s.phase === 'waiting' && key.type !== 'char') return s;

  const current = s.typed[s.index]!;
  const target = s.words[s.index]!;

  switch (key.type) {
    case 'char': {
      if (current.length >= target.length + MAX_EXTRA) return s;
      const correct = key.ch === target[current.length];
      return {
        ...s,
        ...(s.phase === 'waiting' && { phase: 'running', startedAt: now }),
        typed: setCurrent(s, current + key.ch),
        correctKeys: s.correctKeys + (correct ? 1 : 0),
        incorrectKeys: s.incorrectKeys + (correct ? 0 : 1),
      };
    }
    case 'space': {
      if (current === '') return s;
      const correct = current === target;
      return withWords({
        ...s,
        index: s.index + 1,
        typed: [...s.typed, ''],
        correctKeys: s.correctKeys + (correct ? 1 : 0),
        incorrectKeys: s.incorrectKeys + (correct ? 0 : 1),
      });
    }
    case 'backspace': {
      if (current !== '') return { ...s, typed: setCurrent(s, current.slice(0, -1)) };
      const prev = previousWrongWord(s);
      return prev === null ? s : { ...s, ...goBack(s, prev, s.typed[prev]!) };
    }
    case 'deleteWord': {
      if (current !== '') return { ...s, typed: setCurrent(s, '') };
      const prev = previousWrongWord(s);
      return prev === null ? s : { ...s, ...goBack(s, prev, '') };
    }
  }
}

export function tick(state: TestState, now: number): TestState {
  if (state.phase !== 'running') return state;
  const s = state as InternalTestState;
  const elapsedMs = now - s.startedAt!;
  const seconds = Math.min(s.duration, Math.floor(elapsedMs / 1000));
  let next = s;
  while (next.samples.length < seconds) {
    const keys = next.correctKeys + next.incorrectKeys;
    next = {
      ...next,
      samples: [
        ...next.samples,
        { raw: ((keys - next.sampledKeys) / 5) * 60, errors: next.incorrectKeys - next.sampledErrors },
      ],
      sampledKeys: keys,
      sampledErrors: next.incorrectKeys,
    };
  }
  if (elapsedMs >= s.duration * 1000) {
    next = { ...next, phase: 'finished', endedAt: s.startedAt! + s.duration * 1000 };
  }
  return next;
}

export function timeLeft(state: TestState, now: number): number {
  if (state.phase === 'waiting') return state.duration;
  if (state.phase === 'finished') return 0;
  return Math.max(0, Math.ceil(state.duration - (now - state.startedAt!) / 1000));
}
