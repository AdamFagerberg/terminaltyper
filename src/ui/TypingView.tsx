import { Box, Text } from 'ink';
import type { CharStatus, TestState } from '../engine/types.js';
import { charStatuses, visibleLines, VISIBLE_LINES, wrapWords } from './layout.js';
import { theme } from './theme.js';

const statusColor: Record<CharStatus, string> = {
  untyped: theme.sub,
  correct: theme.text,
  incorrect: theme.error,
  extra: theme.errorExtra,
};

interface Props {
  state: TestState;
  timeLeft: number;
  width: number;
}

export function TypingView({ state, timeLeft, width }: Props) {
  const lines = visibleLines(wrapWords(state.words, state.typed, width), state.index);
  const rows = Array.from({ length: VISIBLE_LINES }, (_, i) => lines[i] ?? []);

  return (
    <Box flexDirection="column" width={width}>
      <Text color={theme.sub}>time {state.duration} · english</Text>
      <Text color={theme.main}>{state.phase === 'running' ? timeLeft : ' '}</Text>
      {rows.map((line, i) => (
        <Text key={i}>
          {line.length === 0 ? ' ' : line.map((w) => <Word key={w} state={state} i={w} />)}
        </Text>
      ))}
      <Text> </Text>
      <Text color={theme.sub}>tab - restart   esc - quit</Text>
    </Box>
  );
}

function Word({ state, i }: { state: TestState; i: number }) {
  const target = state.words[i]!;
  const typed = state.typed[i] ?? '';
  const statuses = charStatuses(target, typed);
  const caret = i === state.index && state.phase !== 'finished' ? typed.length : -1;
  const underline = i < state.index && typed !== target;

  return (
    <>
      {statuses.map((status, j) => (
        <Text
          key={j}
          color={j === caret ? theme.main : statusColor[status]}
          inverse={j === caret}
          underline={underline}
        >
          {status === 'extra' ? typed[j] : target[j]}
        </Text>
      ))}
      <Text color={theme.main} inverse={caret >= statuses.length}>
        {' '}
      </Text>
    </>
  );
}
