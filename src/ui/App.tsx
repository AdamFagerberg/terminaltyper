import { Box, useApp, useInput, useWindowSize, type Key as InkKey } from 'ink';
import { useEffect, useState } from 'react';
import { computeStats } from '../engine/stats.js';
import { applyKey, createTest, tick, timeLeft } from '../engine/test.js';
import type { Key } from '../engine/types.js';
import { Results } from './Results.js';
import { TypingView } from './TypingView.js';

const DURATION = 15;

type Action = Key | { type: 'restart' } | { type: 'quit' };

// Fast typing can reach Ink as one multi-char chunk (real pastes go to usePaste
// instead), so plain text is split into one key per character.
export function mapInput(input: string, key: InkKey): Action[] {
  if (key.tab) return [{ type: 'restart' }];
  if (key.escape) return [{ type: 'quit' }];
  // Terminals disagree on which code Backspace sends; Ink may report it as delete.
  const isBackspace = key.backspace || key.delete;
  if (isBackspace && (key.ctrl || key.meta)) return [{ type: 'deleteWord' }];
  if (key.ctrl && input === 'w') return [{ type: 'deleteWord' }];
  if (isBackspace) return [{ type: 'backspace' }];
  if (key.ctrl || key.meta) return [];
  return [...input].flatMap((ch): Key[] =>
    ch === ' ' ? [{ type: 'space' }] : ch > ' ' ? [{ type: 'char', ch }] : [],
  );
}

export function App() {
  const { exit } = useApp();
  const { columns } = useWindowSize();
  const [state, setState] = useState(() => createTest({ duration: DURATION }));

  useInput((input, inkKey) => {
    for (const action of mapInput(input, inkKey)) {
      if (action.type === 'quit') exit();
      else if (action.type === 'restart') setState(createTest({ duration: DURATION }));
      else setState((s) => (s.phase === 'finished' ? s : applyKey(s, action, Date.now())));
    }
  });

  useEffect(() => {
    if (state.phase !== 'running') return;
    const id = setInterval(() => setState((s) => tick(s, Date.now())), 100);
    return () => clearInterval(id);
  }, [state.phase]);

  const width = Math.min(columns - 4, 80);
  return (
    <Box width={columns} justifyContent="center" paddingY={1}>
      {state.phase === 'finished' ? (
        <Results stats={computeStats(state)} duration={state.duration} />
      ) : (
        <TypingView state={state} timeLeft={timeLeft(state, Date.now())} width={width} />
      )}
    </Box>
  );
}
