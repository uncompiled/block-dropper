# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server at http://localhost:5173/
npm run build    # TypeScript check + Vite build (outputs to dist/)
npm run preview  # Preview the built dist/ locally
npm run test     # Run Vitest unit tests
npm run deploy   # Build + sync dist/ to S3
```

To run a single test file:
```bash
npx vitest run src/board.test.ts
```

## Architecture

The game logic is layered, with clear separation of concerns:

- **[tetrominoes.ts](src/tetrominoes.ts)** — Static definitions for the 7 Tetromino shapes as 2D matrices with RGB colors, plus rotation utilities. Pure data/functions, no state.
- **[piece.ts](src/piece.ts)** — A `Piece` wraps a Tetromino with mutable position (x, y). Handles movement and rotation calls.
- **[board.ts](src/board.ts)** — The 10×20 grid. Owns collision detection, piece freezing (writing a piece into the grid), and line clearing.
- **[game.ts](src/game.ts)** — Orchestrates everything: current/next pieces, score/level/lines, pause and game-over state. Accepts UI update callbacks so it stays DOM-free.
- **[renderer.ts](src/renderer.ts)** — Canvas drawing only. Draws blocks with a 3D bevel effect. Uses two canvases: main board and next-piece preview.
- **[main.ts](src/main.ts)** — Application entry point. Wires the `Game` to DOM elements, runs the `requestAnimationFrame` loop with drop timing, and handles keyboard + touch/pointer events.

### Scoring

Classic Tetris scoring: 40 / 100 / 300 / 1200 points for 1 / 2 / 3 / 4 lines cleared, multiplied by current level. Level increases every 10 lines. Drop interval scales from 1000ms down to 100ms minimum.
