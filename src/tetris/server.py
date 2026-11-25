"""Flask application serving the Tetris single-page client."""

from flask import Flask, render_template

app = Flask(__name__)


@app.get("/")
def index() -> str:
    """Serve the game shell; gameplay remains entirely in the browser."""
    return render_template("index.html")


def main() -> None:
    """Run the local development server."""
    app.run(host="127.0.0.1", port=8000, debug=False)
