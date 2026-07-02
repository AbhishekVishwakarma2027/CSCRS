"""
===========================================================
CSCRS Evaluation Lab
Professional Gradio User Interface
===========================================================
"""

from __future__ import annotations

import logging
import tempfile
import shutil
import json
from datetime import datetime
from pathlib import Path
from typing import Any

import cv2
import gradio as gr
import numpy as np
from PIL import Image

from predictor import Predictor
from config import (
    CONFIDENCE,
    IOU,
    IMAGE_SIZE,
    DEVICE,
    IMAGE_OUTPUT_DIR,
    JSON_OUTPUT_DIR,
)

LOGGER = logging.getLogger(__name__)


class EvaluationUI:
    """
    Professional UI for CSCRS Evaluation Lab.
    """

    def _save_result(
        self,
        image: Image.Image,
    ):
        """
        Save the uploaded image and placeholder metadata.
        """

        if image is None:
            raise gr.Error("No image available.")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        image_path = IMAGE_OUTPUT_DIR / f"{timestamp}.png"

        image.save(image_path)

        metadata = {
            "image": image_path.name,
            "saved_at": timestamp,
        }

        json_path = JSON_OUTPUT_DIR / f"{timestamp}.json"

        with open(
            json_path,
            "w",
            encoding="utf-8",
        ) as f:

            json.dump(
                metadata,
                f,
                indent=4,
            )

        return f"Saved:\n{image_path.name}"

    def __init__(self, predictor: Predictor):
        self.predictor = predictor
        self.demo: gr.Blocks | None = None

    @staticmethod
    def _pil_to_bgr(image: Image.Image) -> np.ndarray:
        rgb = np.array(image.convert("RGB"))
        return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    def _save_temp_image(self, image: Image.Image) -> str:
        """
        Save uploaded image to a temporary file for YOLO inference.
        """
        temp_dir = Path(tempfile.gettempdir())
        temp_path = temp_dir / "cscrs_eval_input.png"
        image.save(temp_path)
        return str(temp_path)

    def _predict(self, image: Image.Image):
        if image is None:
            raise gr.Error("Please upload an image.")

        image_path = self._save_temp_image(image)
        prediction = self.predictor.predict(image_path)

        annotated = prediction["annotated_image"]

        annotated = cv2.cvtColor(
            annotated,
            cv2.COLOR_BGR2RGB,
        )

        detections = prediction["detections"]

        detection_count = prediction["object_count"]

        table = [
            [
                item["class"],
                item["confidence"],
            ]
            for item in detections
        ]

        summary_text = (
            f"### Inference Summary\n\n"
            f"**Detected Objects:** {prediction['object_count']}  \n"
            f"**Inference Time:** {prediction['inference_time_ms']} ms"
        )

        return (
            image,
            Image.fromarray(annotated),
            table,
            detection_count,
            summary_text,
        )

    def build(self) -> gr.Blocks:
        """
        Build and return the Gradio interface.
        """
        with gr.Blocks(
            title="CSCRS Evaluation Lab",
            theme=gr.themes.Soft(),
            css="""
            .gradio-container{
                max-width:1600px !important;
                margin:auto;
            }
            .header{
                text-align:center;
                font-size:28px;
                font-weight:700;
                padding:10px;
            }
            .subheader{
                text-align:center;
                color:gray;
                margin-bottom:20px;
            }
            """
        ) as demo:

            gr.Markdown(
                """
                <div class="header">
                CSCRS Evaluation Lab
                </div>
                <div class="subheader">
                Production Model Evaluation Tool
                </div>
                """
            )

            with gr.Row():
                input_image = gr.Image(
                    type="pil",
                    label="Input Image"
                )
                output_image = gr.Image(
                    type="pil",
                    label="Prediction"
                )

            with gr.Row():
                predict_btn = gr.Button(
                    "Predict",
                    variant="primary"
                )
                clear_btn = gr.Button(
                    "Clear"
                )

            with gr.Row():
                object_count = gr.Number(
                    label="Detected Objects",
                    precision=0,
                    interactive=False,
                )
                system_info = gr.Markdown(
                    value=(
                        f"**Confidence Threshold:** {CONFIDENCE}  \n"
                        f"**IoU Threshold:** {IOU}  \n"
                        f"**Image Size:** {IMAGE_SIZE}  \n"
                        f"**Device:** {'GPU' if DEVICE == 0 else 'CPU'}"
                    )
                )

            # Click events mein missing inference_summary field ko define kiya
            inference_summary = gr.Markdown(value="No prediction yet.")

            detection_table = gr.Dataframe(
                headers=["Class", "Confidence (%)"],
                datatype=["str", "number"],
                interactive=False,
                wrap=True,
                label="Detection Summary",
            )

            gr.Markdown("## Future Evaluation Actions")

            with gr.Row():
                correct_btn = gr.Button(
                    "Correct", 
                    interactive=False,
                    variant="secondary",
                    )
                wrong_class_btn = gr.Button(
                    "Wrong Class",
                    interactive=False,
                    variant="secondary",
                )
                missed_btn = gr.Button(
                    "Missed Object",
                    interactive=False,
                    variant="secondary",
                )
                bad_seg_btn = gr.Button(
                    "Bad Segmentation",
                    interactive=False,
                    variant="secondary",
                )

            with gr.Row():
                save_btn = gr.Button(
                    "Save Result",
                    # interactive=False,
                    variant="secondary",
                )
                export_btn = gr.Button(
                    "Export JSON",
                    interactive=False,
                    variant="secondary",
                )
                batch_btn = gr.Button(
                    "Batch Prediction",
                    interactive=False,
                    variant="secondary",
                )
                status_box = gr.Textbox(
                    label="Status",
                    interactive=False,
                )
                
            predict_btn.click(
                fn=self._predict,
                inputs=input_image,
                outputs=[
                    input_image,
                    output_image,
                    detection_table,
                    object_count,
                    inference_summary,
                ],
            )

            save_btn.click(
                fn=self._save_result,
                inputs=input_image,
                outputs=status_box,
            )

            clear_btn.click(
                fn=lambda: (
                    None,
                    None,
                    [],
                    0,
                    "No prediction yet.",
                ),
                inputs=[],
                outputs=[
                    input_image,
                    output_image,
                    detection_table,
                    object_count,
                    inference_summary,
                ],
            )

            self.demo = demo

        return demo


def create_ui(predictor: Predictor) -> gr.Blocks:
    """
    Factory function to create the Evaluation Lab UI.
    """
    return EvaluationUI(predictor).build()