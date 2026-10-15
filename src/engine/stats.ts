import type { Stats, TestState } from './types.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

// monkeytype's consistency: kogasa of the coefficient of variation of per-second raw wpm.
function consistency(raws: number[]): number {
  if (raws.length === 0) return 0;
  const mean = raws.reduce((a, b) => a + b, 0) / raws.length;
  if (mean === 0) return 0;
  const variance = raws.reduce((a, r) => a + (r - mean) ** 2, 0) / raws.length;
  const cov = Math.sqrt(variance) / mean;
  return 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
}

export function computeStats(state: TestState): Stats {
  const chars = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  let wpmChars = 0;
  let rawChars = state.index; // one space after each finished word

  for (let i = 0; i <= state.index; i++) {
    const typed = state.typed[i]!;
    const target = state.words[i]!;
    const finished = i < state.index;
    let correct = 0;
    for (let j = 0; j < typed.length; j++) {
      if (j >= target.length) chars.extra++;
      else if (typed[j] === target[j]) correct++;
      else chars.incorrect++;
    }
    chars.correct += correct;
    if (finished) chars.missed += Math.max(0, target.length - typed.length);
    rawChars += typed.length;
    if (finished ? typed === target : target.startsWith(typed)) wpmChars += typed.length + (finished ? 1 : 0);
  }

  const seconds =
    state.endedAt !== null && state.startedAt !== null
      ? (state.endedAt - state.startedAt) / 1000
      : state.samples.length;
  const minutes = seconds / 60;
  const keys = state.correctKeys + state.incorrectKeys;

  return {
    wpm: minutes > 0 ? round2(wpmChars / 5 / minutes) : 0,
    raw: minutes > 0 ? round2(rawChars / 5 / minutes) : 0,
    accuracy: keys > 0 ? round2((state.correctKeys / keys) * 100) : 0,
    consistency: round2(consistency(state.samples.map((s) => s.raw))),
    chars,
    duration: seconds,
  };
}
