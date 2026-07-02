"""
===========================================================
CSCRS Evaluation Lab
Application Entry Point
===========================================================

Author  : OpenAI + Abhishek
Purpose : Launch the local Gradio Evaluation Interface.
===========================================================
"""

from __future__ import annotations

import logging
import webbrowser
from threading import Timer

import gradio as gr

from predictor import Predictor
from ui import create_ui


# ==========================================================
# Logging Configuration
# ==========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

LOGGER = logging.getLogger(__name__)


# ==========================================================
# Browser Launcher
# ==========================================================

def open_browser() -> None:
    """
    Automatically open the Gradio application
    in the user's default web browser.
    """
    webbrowser.open("http://127.0.0.1:7860")


# ==========================================================
# Application
# ==========================================================

def create_application() -> gr.Blocks:
    """
    Initialize Predictor and build UI.

    Returns
    -------
    gr.Blocks
        Configured Gradio application.
    """

    LOGGER.info("Loading Predictor...")

    predictor = Predictor()

    LOGGER.info("Creating User Interface...")

    demo = create_ui(predictor)

    LOGGER.info("Evaluation Lab Ready.")

    return demo


# ==========================================================
# Main
# ==========================================================

def main() -> None:
    """
    Launch Evaluation Lab.
    """

    LOGGER.info("=" * 60)
    LOGGER.info("CSCRS Evaluation Lab")
    LOGGER.info("=" * 60)

    demo = create_application()

    Timer(
        interval=1.5,
        function=open_browser,
    ).start()

    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        inbrowser=False,
        show_error=True,
        debug=False,
    )


# ==========================================================
# Entry Point
# ==========================================================

if __name__ == "__main__":
    main()  