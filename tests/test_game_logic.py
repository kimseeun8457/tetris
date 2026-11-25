from tetris.game import Board, PIECES, score_for_lines


def test_board_is_ten_by_twenty_and_has_seven_pieces():
    board = Board()
    assert len(board.cells) == 20
    assert all(len(row) == 10 for row in board.cells)
    assert set(PIECES) == {"I", "O", "T", "S", "Z", "J", "L"}


def test_piece_collision_checks_walls_floor_and_locked_cells():
    board = Board()
    shape = PIECES["O"][0]
    assert not board.can_place(shape, -2, 0)
    assert not board.can_place(shape, 9, 0)
    assert not board.can_place(shape, 0, 19)
    board.cells[2][2] = "#"
    assert not board.can_place(shape, 1, 1)
    assert board.can_place(shape, 1, 0)


def test_locking_piece_clears_complete_lines_and_shifts_rows_down():
    board = Board()
    board.cells[19] = ["#"] * 8 + [None, None]
    board.cells[18] = ["#"] * 8 + [None, None]
    board.cells[17][0] = "above"
    board.lock_piece(PIECES["O"][0], 7, 18, "O")
    assert board.clear_lines() == 2
    assert board.cells[19][0] == "above"
    assert board.cells[0] == [None] * 10


def test_line_score_uses_classic_clear_values_and_current_level():
    assert [score_for_lines(n, 1) for n in range(5)] == [0, 100, 300, 500, 800]
    assert score_for_lines(2, 3) == 900


def test_top_out_is_detected_when_spawned_piece_cannot_fit():
    board = Board()
    shape = PIECES["O"][0]
    board.cells[0][4] = "blocked"
    assert not board.can_place(shape, 3, -1)


def test_four_line_clear_shifts_board_and_awards_level_scaled_score():
    board = Board()
    for row in range(16, 20):
        board.cells[row] = ["#"] * 10
    board.cells[15][0] = "above"
    assert board.clear_lines() == 4
    assert board.cells[19][0] == "above"
    assert score_for_lines(4, 2) == 1600
