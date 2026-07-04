from inference.predictor import YOLOPredictor
from inference.parser import ResultParser
import time

from verification.verifier import VerificationEngine


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

        detections = ResultParser.parse(
            result,
            include_masks=False
            )

        ##################################################
        # Final
        ##################################################
        processing_time = round(
            time.perf_counter() - start,
            3
        )
        return {

            "success": True,

            "verification": verification,

            "detections": detections,
            "processing_time": processing_time
        }