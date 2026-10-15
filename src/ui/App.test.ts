import type { Key } from 'ink';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../engine/test.js', () => ({}));
vi.mock('../engine/stats.js', () => ({}));
const { mapInput } = await import('./App.js');

const none: Key = {
  upArrow: false, downArrow: false, leftArrow: false, rightArrow: false, pageDown: false, pageUp: false,
  home: false, end: false, return: false, escape: false, ctrl: false, shift: false, tab: false,
  backspace: false, delete: false, meta: false, super: false, hyper: false, capsLock: false, numLock: false,
};

describe('mapInput', () => {
  it.each([
    ['a', {}, [{ type: 'char', ch: 'a' }]],
    ['A', { shift: true }, [{ type: 'char', ch: 'A' }]],
    [' ', {}, [{ type: 'space' }]],
    ['', { backspace: true }, [{ type: 'backspace' }]],
    ['', { delete: true }, [{ type: 'backspace' }]],
    ['', { backspace: true, meta: true }, [{ type: 'deleteWord' }]],
    ['', { delete: true, ctrl: true }, [{ type: 'deleteWord' }]],
    ['w', { ctrl: true }, [{ type: 'deleteWord' }]],
    ['', { tab: true }, [{ type: 'restart' }]],
    ['', { escape: true }, [{ type: 'quit' }]],
    ['a', { ctrl: true }, []],
    ['\r', { return: true }, []],
    ['a b', {}, [{ type: 'char', ch: 'a' }, { type: 'space' }, { type: 'char', ch: 'b' }]],
  ] as const)('%j %j', (input, mods, expected) => {
    expect(mapInput(input, { ...none, ...mods })).toEqual(expected);
  });
});
