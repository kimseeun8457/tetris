
# BLOCK / FALL — Tetris

A browser-based single-page Tetris game served locally by Flask. Gameplay and
the start / play / pause / game-over state machine run entirely in the browser.

## Run locally

From `/home/student/prj/tetris`:

```sh
uv sync
uv run tetris
```

Open <http://127.0.0.1:8000>. The project pins Python 3.12 in `.python-version`;
`uv sync` creates and uses the project `.venv`.

## Controls

- Move: Left/Right or A/D
- Rotate: Up, W, or X
- Soft drop: Down or S
- Hard drop: Space
- Pause/resume: P or Esc
- Start/restart: Enter or the on-screen button

## Project layout

- `src/tetris/server.py` — Flask development server and page route.
- `src/tetris/game.py` — Python reference board, collision, line-clear, and score logic.
- `src/tetris/templates/index.html` — SPA shell, board canvases, and game UI.
- `src/tetris/static/css/style.css` — responsive dark arcade layout and screen styles.
- `src/tetris/static/js/game.js` — client-side game loop, state, controls, rendering, and scoring.
- `tests/test_game_logic.py` — board, collision, line-clear, and scoring tests.
- `pyproject.toml`, `uv.lock`, `.python-version` — Python 3.12 project configuration.

## Verify

```sh
uv run --with pytest pytest -q
```
