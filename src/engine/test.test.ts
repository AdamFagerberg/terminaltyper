import { describe, expect, it } from 'vitest';
import { applyKey, createTest, tick, timeLeft } from './test.js';
import type { Key, TestState } from './types.js';

const T0 = 1_000_000;
const words = ['hello', 'world', 'foo', 'bar'];
const seeded = () => {
  let x = 42;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
};
const fresh = (duration = 15) => createTest({ duration, words: [...words], rng: seeded() });

function type(state: TestState, input: string, now = T0): TestState {
  for (const ch of input) {
    const key: Key =
      ch === ' ' ? { type: 'space' } : ch === '<' ? { type: 'backspace' } : ch === '^' ? { type: 'deleteWord' } : { type: 'char', ch };
    state = applyKey(state, key, now);
  }
  return state;
}

describe('createTest', () => {
  it('starts waiting with fixed words first and 50+ words ahead', () => {
    const s = fresh();
    expect(s.phase).toBe('waiting');
    expect(s.words.slice(0, 4)).toEqual(words);
    expect(s.words.length).toBeGreaterThanOrEqual(51);
    expect(s.typed).toEqual(['']);
  });
});

describe('applyKey', () => {
  it('ignores space/backspace while waiting and starts the timer on the first char', () => {
    let s = fresh();
    s = applyKey(s, { type: 'space' }, T0 - 50);
    s = applyKey(s, { type: 'backspace' }, T0 - 40);
    expect(s.phase).toBe('waiting');
    expect(s.startedAt).toBeNull();
    s = applyKey(s, { type: 'char', ch: 'h' }, T0);
    expect(s.phase).toBe('running');
    expect(s.startedAt).toBe(T0);
    expect(s.typed).toEqual(['h']);
    expect(s.correctKeys).toBe(1);
  });

  it('counts correct, incorrect and extra chars', () => {
    const s = type(fresh(), 'hxllo!');
    expect(s.typed).toEqual(['hxllo!']);
    expect(s.correctKeys).toBe(4);
    expect(s.incorrectKeys).toBe(2);
  });

  it('caps extra chars at target length + 20', () => {
    const s = type(fresh(), 'hello' + 'x'.repeat(30));
    expect(s.typed[0]).toHaveLength(25);
    expect(s.incorrectKeys).toBe(20);
  });

  it('space does nothing on an empty word', () => {
    const s = type(fresh(), 'h<');
    expect(type(s, ' ')).toBe(s);
  });

  it('space moves to the next word and counts as correct only if the word matches', () => {
    let s = type(fresh(), 'hello ');
    expect(s.index).toBe(1);
    expect(s.typed).toEqual(['hello', '']);
    expect(s.correctKeys).toBe(6);
    s = type(s, 'wor ');
    expect(s.index).toBe(2);
    expect(s.correctKeys).toBe(9);
    expect(s.incorrectKeys).toBe(1);
  });

  it('keeps 50+ words ahead as index advances, without changing earlier words', () => {
    let s = fresh();
    for (let i = 0; i < 60; i++) s = type(s, 'x ');
    expect(s.index).toBe(60);
    expect(s.words.length - 1 - s.index).toBeGreaterThanOrEqual(50);
    expect(s.words.slice(0, 4)).toEqual(words);
  });

  it('backspace removes the last char', () => {
    expect(type(fresh(), 'hel<').typed).toEqual(['he']);
  });

  it('backspace on an empty word goes back into a wrong previous word', () => {
    const s = type(fresh(), 'helo <');
    expect(s.index).toBe(0);
    expect(s.typed).toEqual(['helo']);
  });

  it('backspace cannot go back into a correct previous word', () => {
    const s = type(fresh(), 'hello <');
    expect(s.index).toBe(1);
    expect(s.typed).toEqual(['hello', '']);
  });

  it('deleteWord clears the current word', () => {
    const s = type(fresh(), 'hello wor^');
    expect(s.index).toBe(1);
    expect(s.typed).toEqual(['hello', '']);
  });

  it('deleteWord on an empty word goes back into a wrong previous word and clears it', () => {
    expect(type(fresh(), 'helo ^').typed).toEqual(['']);
    expect(type(fresh(), 'hello ^').typed).toEqual(['hello', '']);
  });

  it('a key after the deadline finishes the test instead of being applied', () => {
    let s = type(fresh(5), 'h');
    s = applyKey(s, { type: 'char', ch: 'e' }, T0 + 5000);
    expect(s.phase).toBe('finished');
    expect(s.typed).toEqual(['h']);
    expect(s.endedAt).toBe(T0 + 5000);
    expect(s.samples).toHaveLength(5);
  });

  it('ignores keys once finished', () => {
    const s = tick(type(fresh(5), 'h'), T0 + 6000);
    expect(applyKey(s, { type: 'char', ch: 'e' }, T0 + 7000)).toBe(s);
  });
});

describe('tick', () => {
  it('does nothing while waiting', () => {
    const s = fresh();
    expect(tick(s, T0 + 10_000)).toBe(s);
  });

  it('records one sample per elapsed second with raw and errors for that second', () => {
    let s = type(fresh(5), 'hello ', T0); // 6 keys in second 1
    s = tick(s, T0 + 999);
    expect(s.samples).toHaveLength(0);
    s = tick(s, T0 + 1000);
    expect(s.samples).toEqual([{ raw: 72, errors: 0 }]);
    s = type(s, 'wxrld', T0 + 1500); // 5 keys, 1 error in second 2
    s = tick(s, T0 + 2000);
    expect(s.samples[1]).toEqual({ raw: 60, errors: 1 });
    s = tick(s, T0 + 2500);
    expect(s.samples).toHaveLength(2);
  });

  it('finishes with exactly `duration` samples, even if ticks are late or skipped', () => {
    let s = type(fresh(5), 'h');
    s = tick(s, T0 + 2000);
    s = tick(s, T0 + 9000);
    expect(s.phase).toBe('finished');
    expect(s.endedAt).toBe(T0 + 5000);
    expect(s.samples).toHaveLength(5);
  });
});

describe('timeLeft', () => {
  it('is duration while waiting, counts down while running, 0 when finished', () => {
    let s = fresh(15);
    expect(timeLeft(s, T0)).toBe(15);
    s = type(s, 'h');
    expect(timeLeft(s, T0)).toBe(15);
    expect(timeLeft(s, T0 + 100)).toBe(15);
    expect(timeLeft(s, T0 + 1000)).toBe(14);
    expect(timeLeft(s, T0 + 20_000)).toBe(0);
    s = tick(s, T0 + 15_000);
    expect(timeLeft(s, T0 + 15_000)).toBe(0);
  });
});
