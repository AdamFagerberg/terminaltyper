import type { CharStatus } from '../engine/types.js';

export const VISIBLE_LINES = 3;

export function charStatuses(target: string, typed: string): CharStatus[] {
  const len = Math.max(target.length, typed.length);
  return Array.from({ length: len }, (_, i): CharStatus => {
    if (i >= typed.length) return 'untyped';
    if (i >= target.length) return 'extra';
    return typed[i] === target[i] ? 'correct' : 'incorrect';
  });
}

// Greedy word wrap. Returns lines as arrays of word indices.
// Each word takes max(target, typed) cells plus one trailing space, so the
// caret always has room after the last word of a line.
export function wrapWords(
  words: readonly string[],
  typed: readonly string[],
  width: number,
): number[][] {
  const lines: number[][] = [];
  let line: number[] = [];
  let used = 0;
  words.forEach((word, i) => {
    const cells = Math.max(word.length, typed[i]?.length ?? 0) + 1;
    if (line.length > 0 && used + cells > width) {
      lines.push(line);
      line = [];
      used = 0;
    }
    line.push(i);
    used += cells;
  });
  if (line.length > 0) lines.push(line);
  return lines;
}

// Monkeytype scrolling: the cursor's line is shown first only at the very
// start; otherwise it sits on the 2nd visible line.
export function visibleLines(lines: number[][], index: number): number[][] {
  const cursorLine = Math.max(0, lines.findIndex((l) => l.includes(index)));
  const top = Math.max(0, cursorLine - 1);
  return lines.slice(top, top + VISIBLE_LINES);
}
