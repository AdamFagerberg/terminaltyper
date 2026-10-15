import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { TestState } from '../engine/types.js';
import { TypingView } from './TypingView.js';

const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa'];

function makeState(over: Partial<TestState>): TestState {
  return {
    duration: 15,
    phase: 'waiting',
    words,
    typed: [''],
    index: 0,
    startedAt: null,
    endedAt: null,
    correctKeys: 0,
    incorrectKeys: 0,
    samples: [],
    ...over,
  };
}

const lines = (frame: string) => frame.split('\n').map((l) => l.trimEnd());

describe('TypingView', () => {
  it('shows the mode bar, 3 lines of words and the footer while waiting', () => {
    const { lastFrame } = render(<TypingView state={makeState({})} timeLeft={15} width={30} />);
    const frame = lastFrame()!;
    expect(frame).toContain('time 15 · english');
    expect(frame).toContain('tab - restart   esc - quit');
    expect(lines(frame)[1]).toBe(''); // no countdown before start
    expect(lines(frame).slice(2, 5)).toEqual(['alpha bravo charlie delta', 'echo foxtrot golf hotel india', 'juliet kilo lima mike']);
    expect(frame).not.toContain('november');
  });

  it('shows the countdown, extra chars and scrolls once the cursor reaches line 3', () => {
    const state = makeState({
      phase: 'running',
      startedAt: 0,
      // extra chars on 'india' push it onto line 3; cursor on 'juliet' (line 3) scrolls the view
      typed: ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'indiaxx', 'ju'],
      index: 9,
    });
    const { lastFrame } = render(<TypingView state={state} timeLeft={9} width={30} />);
    const frame = lastFrame()!;
    expect(lines(frame)[1]).toBe('9');
    expect(lines(frame).slice(2, 5)).toEqual(['echo foxtrot golf hotel', 'indiaxx juliet kilo lima mike', 'november oscar papa']);
    expect(lines(frame)[5]).toBe('');
    expect(frame).not.toContain('alpha');
  });
});
