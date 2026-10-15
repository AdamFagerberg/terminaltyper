import { Box, Text } from 'ink';
import type { Stats } from '../engine/types.js';
import { theme } from './theme.js';

interface Props {
  stats: Stats;
  duration: number; // configured test duration, for the test type label
}

export function Results({ stats, duration }: Props) {
  const { correct, incorrect, extra, missed } = stats.chars;
  return (
    <Box flexDirection="column">
      <Box gap={4}>
        <Big label="wpm" value={Math.round(stats.wpm)} />
        <Big label="acc" value={`${Math.round(stats.accuracy)}%`} />
      </Box>
      <Text> </Text>
      <Box gap={3}>
        <Stat label="test type" value={`time ${duration} english`} />
        <Stat label="raw" value={Math.round(stats.raw)} />
        <Stat label="characters" value={`${correct}/${incorrect}/${extra}/${missed}`} />
        <Stat label="consistency" value={`${Math.round(stats.consistency)}%`} />
        <Stat label="time" value={`${Math.round(stats.duration)}s`} />
      </Box>
      <Text> </Text>
      <Text color={theme.sub}>tab - next test   esc - quit</Text>
    </Box>
  );
}

function Big({ label, value }: { label: string; value: string | number }) {
  return (
    <Box flexDirection="column">
      <Text color={theme.sub}>{label}</Text>
      <Text color={theme.main} bold>
        {value}
      </Text>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box flexDirection="column">
      <Text color={theme.sub}>{label}</Text>
      <Text color={theme.main}>{value}</Text>
    </Box>
  );
}
