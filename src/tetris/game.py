"""Deterministic Tetris board and scoring rules."""

from __future__ import annotations

from dataclasses import dataclass, field

WIDTH = 10
HEIGHT = 20

# Each rotation is represented by its occupied (x, y) offsets.
PIECES: dict[str, tuple[tuple[tuple[int, int], ...], ...]] = {
    "I": (((0, 1), (1, 1), (2, 1), (3, 1)), ((2, 0), (2, 1), (2, 2), (2, 3))),
    "O": (((1, 0), (2, 0), (1, 1), (2, 1)),),
    "T": (((1, 0), (0, 1), (1, 1), (2, 1)), ((1, 0), (1, 1), (2, 1), (1, 2)), ((0, 1), (1, 1), (2, 1), (1, 2)), ((1, 0), (0, 1), (1, 1), (1, 2))),
    "S": (((1, 0), (2, 0), (0, 1), (1, 1)), ((1, 0), (1, 1), (2, 1), (2, 2))),
    "Z": (((0, 0), (1, 0), (1, 1), (2, 1)), ((2, 0), (1, 1), (2, 1), (1, 2))),
    "J": (((0, 0), (0, 1), (1, 1), (2, 1)), ((1, 0), (2, 0), (1, 1), (1, 2)), ((0, 1), (1, 1), (2, 1), (2, 2)), ((1, 0), (1, 1), (0, 2), (1, 2))),
    "L": (((2, 0), (0, 1), (1, 1), (2, 1)), ((1, 0), (1, 1), (1, 2), (2, 2)), ((0, 1), (1, 1), (2, 1), (0, 2)), ((0, 0), (1, 0), (1, 1), (1, 2))),
}


@dataclass
class Board:
    """A 10-by-20 settled-cell grid."""

    cells: list[list[str | None]] = field(
        default_factory=lambda: [[None for _ in range(WIDTH)] for _ in range(HEIGHT)]
    )

    def can_place(
        self, shape: tuple[tuple[int, int], ...], x: int, y: int
    ) -> bool:
        """Return whether all cells of a piece fit in the board and empty cells."""
        return all(
            0 <= x + dx < WIDTH
            and y + dy < HEIGHT
            and (y + dy < 0 or self.cells[y + dy][x + dx] is None)
            for dx, dy in shape
        )

    def lock_piece(
        self, shape: tuple[tuple[int, int], ...], x: int, y: int, kind: str
    ) -> None:
        """Copy a piece into settled cells."""
        for dx, dy in shape:
            row, column = y + dy, x + dx
            if 0 <= row < HEIGHT and 0 <= column < WIDTH:
                self.cells[row][column] = kind

    def clear_lines(self) -> int:
        """Remove filled rows and return how many were cleared."""
        remaining = [row for row in self.cells if any(cell is None for cell in row)]
        cleared = HEIGHT - len(remaining)
        empty_rows: list[list[str | None]] = [
            [None for _ in range(WIDTH)] for _ in range(cleared)
        ]
        self.cells = empty_rows + remaining
        return cleared


def score_for_lines(lines: int, level: int) -> int:
    """Return classic line-clear score, multiplied by the active level."""
    base_scores = (0, 100, 300, 500, 800)
    return base_scores[min(max(lines, 0), 4)] * max(level, 1)
