import { render } from 'ink-testing-library';
import { expect, it } from 'vitest';
import { Results } from './Results.js';

it('renders the stats', () => {
  const stats = {
    wpm: 72.4,
    raw: 80.6,
    accuracy: 96.2,
    consistency: 81.5,
    chars: { correct: 180, incorrect: 5, extra: 2, missed: 1 },
    duration: 15,
  };
  const frame = render(<Results stats={stats} duration={15} />).lastFrame()!;
  for (const text of ['wpm', '72', 'acc', '96%', 'raw', '81', 'consistency', '82%', '180/5/2/1', '15s', 'time 15 english', 'tab - next test   esc - quit']) {
    expect(frame).toContain(text);
  }
});
