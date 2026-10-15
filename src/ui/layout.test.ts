import { describe, expect, it } from 'vitest';
import { charStatuses, visibleLines, wrapWords } from './layout.js';

describe('charStatuses', () => {
  it('marks correct, incorrect and untyped chars', () => {
    expect(charStatuses('hello', 'hxl')).toEqual(['correct', 'incorrect', 'correct', 'untyped', 'untyped']);
  });
  it('marks chars past the target as extra', () => {
    expect(charStatuses('hi', 'hiya')).toEqual(['correct', 'correct', 'extra', 'extra']);
  });
  it('handles empty input', () => {
    expect(charStatuses('ab', '')).toEqual(['untyped', 'untyped']);
  });
});

describe('wrapWords', () => {
  // each word takes length + 1 (trailing space)
  const words = ['aaa', 'bbb', 'ccc', 'ddd', 'eee'];

  it('wraps greedily to the width', () => {
    expect(wrapWords(words, [], 8)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it('lets extra typed chars push words to the next line', () => {
    expect(wrapWords(words, ['aaaxx'], 8)).toEqual([[0], [1, 2], [3, 4]]);
  });

  it('puts an over-long word on its own line', () => {
    expect(wrapWords(['abcdefghij', 'x'], [], 5)).toEqual([[0], [1]]);
  });
});

describe('visibleLines', () => {
  const lines = [[0, 1], [2, 3], [4, 5], [6, 7], [8]];

  it('shows the first 3 lines while the cursor is on line 1 or 2', () => {
    expect(visibleLines(lines, 0)).toEqual([[0, 1], [2, 3], [4, 5]]);
    expect(visibleLines(lines, 3)).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it('scrolls when the cursor reaches the 3rd visible line', () => {
    expect(visibleLines(lines, 4)).toEqual([[2, 3], [4, 5], [6, 7]]);
    expect(visibleLines(lines, 6)).toEqual([[4, 5], [6, 7], [8]]);
  });
});
