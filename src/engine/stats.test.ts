import { describe, expect, it } from 'vitest';
import { computeStats } from './stats.js';
import type { TestState } from './types.js';

const base: TestState = {
  duration: 30,
  phase: 'finished',
  words: ['hello', 'world', 'foo', 'bar', 'baz'],
  typed: [''],
  index: 0,
  startedAt: 0,
  endedAt: 30_000,
  correctKeys: 0,
  incorrectKeys: 0,
  samples: [],
};

describe('computeStats', () => {
  it('computes char counts, wpm, raw and accuracy for a known state', () => {
    const s: TestState = {
      ...base,
      // hello: correct; wrld: 1 correct, 3 incorrect, 1 missed; foox: 3 correct, 1 extra; current "ba": correct prefix
      typed: ['hello', 'wrld', 'foox', 'ba'],
      index: 3,
      correctKeys: 15,
      incorrectKeys: 5,
    };
    const st = computeStats(s);
    expect(st.chars).toEqual({ correct: 11, incorrect: 3, extra: 1, missed: 1 });
    // wpm: (5 + 1 space + 2) / 5 / 0.5 = 3.2
    expect(st.wpm).toBe(3.2);
    // raw: (5 + 4 + 4 + 2 typed + 3 spaces) / 5 / 0.5 = 7.2
    expect(st.raw).toBe(7.2);
    expect(st.accuracy).toBe(75);
    expect(st.duration).toBe(30);
  });

  it('does not count missed chars or wpm for a wrong current word', () => {
    const st = computeStats({ ...base, typed: ['hx'], index: 0 });
    expect(st.chars).toEqual({ correct: 1, incorrect: 1, extra: 0, missed: 0 });
    expect(st.wpm).toBe(0);
    expect(st.raw).toBe(0.8);
  });

  it('uses the sample count for elapsed time when not finished', () => {
    const st = computeStats({
      ...base,
      phase: 'running',
      endedAt: null,
      typed: ['hello', ''],
      index: 1,
      samples: [{ raw: 36, errors: 0 }],
    });
    expect(st.duration).toBe(1);
    expect(st.wpm).toBe(72);
  });

  it('computes consistency with kogasa of the raw samples', () => {
    const steady = computeStats({ ...base, samples: [{ raw: 60, errors: 0 }, { raw: 60, errors: 0 }] });
    expect(steady.consistency).toBe(100);
    // mean 60, stddev 20 -> cov 1/3
    const cov = 1 / 3;
    const expected = 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
    const varied = computeStats({ ...base, samples: [{ raw: 40, errors: 0 }, { raw: 80, errors: 0 }] });
    expect(varied.consistency).toBe(Math.round(expected * 100) / 100);
  });

  it('returns zeros with no keys, samples or time', () => {
    const st = computeStats({ ...base, phase: 'waiting', startedAt: null, endedAt: null, typed: [''] });
    expect(st).toEqual({
      wpm: 0,
      raw: 0,
      accuracy: 0,
      consistency: 0,
      chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
      duration: 0,
    });
    expect(computeStats({ ...base, samples: [{ raw: 0, errors: 0 }] }).consistency).toBe(0);
  });
});
