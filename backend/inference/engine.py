from inference.predictor import YOLOPredictor
from inference.parser import ResultParser
import time
from inference.visualizer import Visualizer
from utils.file_utils import generate_filename
from verification.verifier import VerificationEngine
from pathlib import Path
from inference.config import (
    MODEL_PATH,
    MODEL_VERSION,
    DEVICE,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
)

class InferenceEngine:

    def __init__(self):

        self.verifier = VerificationEngine()
    def predict(self, image_path):
        start = time.perf_counter()

        ##################################################
        # Verification
        ##################################################

        verification = self.verifier.verify(image_path)

        ##################################################
        # Reject
        ##################################################

        if not verification["verification_passed"]:

            return {

                "success": False,

                "message": "Image rejected during verification.",

                "verification": verification,

                "detections": []
            }

        ##################################################
        # YOLO
        ##################################################

        result = YOLOPredictor.predict(image_path)

        annotated = result.plot()

        annotated_filename = generate_filename(
            Path(image_path).name,
        )

        annotated_path = Visualizer.save_annotated_image(
            annotated,
            annotated_filename,
        )

        detections = ResultParser.parse(
            result,
            include_masks=True
            )

        ##################################################
        # Final
        ##################################################
        processing_time = round(
            time.perf_counter() - start,
            3
        )

        highest = None

        primary = None

        if detections:

            highest_detection = max(
                detections,
                key=lambda x: x["confidence"],
            )

            highest = highest_detection["confidence"]

            primary = highest_detection["class_name"]

        return {

            "success": True,

            "verification": verification,

            "ai": {

                "annotated_image":
                    "/" + annotated_path.replace("\\", "/"),

                "detections": detections,

                "summary": {

                    "objects_detected": len(detections),

                    "primary_issue": primary,

                    "highest_confidence": highest,

                },

                "model_version": MODEL_VERSION,

            },

            "processing_time": processing_time,

        }