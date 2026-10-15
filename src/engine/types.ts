// Shared contract between the engine (src/engine) and the UI (src/ui).
//
// Engine modules implement (all pure; `now` is ms, e.g. Date.now()):
//   words.ts : ENGLISH_200: readonly string[]
//              randomWords(count: number, rng?: () => number): string[]
//   test.ts  : createTest(opts: { duration: number; words?: string[]; rng?: () => number }): TestState
//              applyKey(state: TestState, key: Key, now: number): TestState
//              tick(state: TestState, now: number): TestState   // records per-second samples, finishes when time is up
//              timeLeft(state: TestState, now: number): number  // whole seconds remaining (duration before start)
//   stats.ts : computeStats(state: TestState): Stats
//
// State is immutable: every function returns a new object.

export type Key =
  | { type: 'char'; ch: string } // a single printable character, never a space
  | { type: 'space' }
  | { type: 'backspace' }
  | { type: 'deleteWord' }; // ctrl/alt+backspace: clear the current word's input

export type Phase = 'waiting' | 'running' | 'finished';

export interface TestState {
  readonly duration: number; // seconds
  readonly phase: Phase;
  // Target words. Always kept at least 50 words ahead of `index` (engine appends more as needed).
  readonly words: readonly string[];
  // What the user typed for each word, indices 0..index (inclusive). typed[index] is the current word.
  readonly typed: readonly string[];
  readonly index: number;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  // Keystroke counters for accuracy (backspaces are not counted).
  readonly correctKeys: number;
  readonly incorrectKeys: number;
  // One sample per elapsed second: raw wpm during that second and error count during that second.
  readonly samples: readonly { raw: number; errors: number }[];
}

export interface Stats {
  wpm: number;
  raw: number;
  accuracy: number; // 0..100
  consistency: number; // 0..100
  chars: { correct: number; incorrect: number; extra: number; missed: number };
  duration: number; // seconds actually elapsed
}

// Per-character rendering status for the current/finished words.
export type CharStatus = 'untyped' | 'correct' | 'incorrect' | 'extra';
