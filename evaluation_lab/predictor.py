"""
===========================================================
CSCRS Evaluation Lab
Predictor Module

Author  : OpenAI + Abhishek
Purpose : Load YOLO model and perform inference.
===========================================================
"""

from pathlib import Path
from typing import Any, Dict, List
import time

import cv2
import numpy as np
from ultralytics import YOLO

from config import (
    MODEL_PATH,
    CONFIDENCE,
    IOU,
    IMAGE_SIZE,
    DEVICE,
)


class Predictor:

    def __init__(self):

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"\nModel not found:\n{MODEL_PATH}"
            )

        print("=" * 60)
        print("Loading YOLO Model...")
        print("=" * 60)

        self.model = YOLO(MODEL_PATH)

        print("Model Loaded Successfully.")
        print("=" * 60)

    def predict(self, image_path: str) -> Dict[str, Any]:
        """
        Perform inference on an image.

        Returns:
            dict containing:
                annotated_image
                detections
                object_count
                inference_time_ms
                result
                masks
                boxes
        """

        start = time.perf_counter()

        results = self.model.predict(
            source=image_path,
            conf=CONFIDENCE,
            iou=IOU,
            imgsz=IMAGE_SIZE,
            device=DEVICE,
            verbose=False,
        )

        inference_time = (time.perf_counter() - start) * 1000

        result = results[0]

        annotated = result.plot()

        detections: List[Dict[str, Any]] = []

        boxes = result.boxes

        if boxes is not None:

            for box in boxes:

                cls_id = int(box.cls.item())

                conf = float(box.conf.item())

                detections.append(
                    {
                        "class": self.model.names[cls_id],
                        "confidence": round(conf * 100, 2),
                    }
                )

        return {
            "annotated_image": annotated,
            "detections": detections,
            "object_count": len(detections),
            "inference_time_ms": round(inference_time, 2),
            "result": result,
            "boxes": result.boxes,
            "masks": result.masks,
        }