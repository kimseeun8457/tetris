import unittest

from tetris.server import app


class SpaRouteTests(unittest.TestCase):
    def test_root_serves_game_shell_and_client_assets(self):
        client = app.test_client()
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertIn('id="game-board"', html)
        self.assertIn('id="screen-overlay"', html)
        self.assertIn("static/js/game.js", html)
        self.assertIn("static/css/style.css", html)

    def test_client_declares_spa_states_and_frame_loop(self):
        response = app.test_client().get("/static/js/game.js")
        self.assertEqual(response.status_code, 200)
        script = response.get_data(as_text=True)
        for fragment in (
            "let phase = 'start'", "phase = 'playing'", "phase = 'paused'",
            "phase = 'over'", "requestAnimationFrame(frame)", "function clearLines()",
            "function canPlace(", "function hardDrop()",
        ):
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, script)

    def test_board_and_piece_contract_matches_the_requested_dimensions(self):
        response = app.test_client().get("/static/js/game.js")
        script = response.get_data(as_text=True)
        self.assertIn("const WIDTH = 10", script)
        self.assertIn("const HEIGHT = 20", script)
        shape_block = script.split("const SHAPES = {", 1)[1].split("\n  };", 1)[0]
        for kind in ("I", "O", "T", "S", "Z", "J", "L"):
            self.assertIn(f"    {kind}: [", shape_block)


if __name__ == "__main__":
    unittest.main()
