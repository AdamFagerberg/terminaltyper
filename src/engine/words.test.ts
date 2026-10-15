import { describe, expect, it } from 'vitest';
import { ENGLISH_200, randomWords } from './words.js';

describe('words', () => {
  it('has 200 unique lowercase words', () => {
    expect(ENGLISH_200).toHaveLength(200);
    expect(new Set(ENGLISH_200).size).toBe(200);
    for (const w of ENGLISH_200) expect(w).toMatch(/^[a-z]+$/);
  });

  it('returns the requested count from the list, never repeating a word twice in a row', () => {
    // rng that keeps returning the same value would repeat forever; alternate with a second value
    const values = [0, 0, 0, 0.5, 0.5, 0];
    let i = 0;
    const rng = () => values[i++ % values.length]!;
    const words = randomWords(3, rng);
    expect(words).toEqual(['the', ENGLISH_200[100], 'the']);
    const many = randomWords(1000);
    expect(many).toHaveLength(1000);
    for (let j = 1; j < many.length; j++) expect(many[j]).not.toBe(many[j - 1]);
  });
});
