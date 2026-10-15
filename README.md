# terminaltyper

A [monkeytype](https://monkeytype.com/)-inspired typing test for the terminal.

Currently: english (200 most common words), time mode, 15 seconds, no numbers or punctuation, serika dark colors.

## Run

```sh
npm install
npm run dev        # run from source
npm run build && npm start
```

Start typing to begin the timer. `tab` restarts, `esc` quits. `alt+backspace` / `ctrl+w` deletes a word.

## Develop

```sh
npm test           # vitest
npm run typecheck
```

- `src/engine` – pure typing logic: word list, test state machine, stats (monkeytype formulas)
- `src/ui` – Ink (React) components: typing view, results, layout
- `src/cli.tsx` – entry point
