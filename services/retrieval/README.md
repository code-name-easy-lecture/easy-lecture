# Retrieval service

Python service that finds the relevant part of a lecture for a question. It will deploy to AWS Lambda; for now it contains a placeholder handler.

## Run the checks

    python -m venv .venv
    .venv\Scripts\activate        (macOS/Linux: source .venv/bin/activate)
    pip install -r requirements-dev.txt
    ruff check .
    python -m pytest
