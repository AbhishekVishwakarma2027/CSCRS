from verification.exif.detector import EXIFDetector
from verification.quality.detector import QualityDetector
from verification.risk_engine import RiskEngine


class VerificationEngine:

    def __init__(self):

        self.exif = EXIFDetector()
        self.quality = QualityDetector()

        self.risk_engine = RiskEngine()

    def verify(self, image_path):

        exif = self.exif.predict(image_path)

        quality = self.quality.predict(image_path)

        detectors = {

            "exif": exif,

            "quality": quality
        }

        risk = self.risk_engine.evaluate(detectors)

        return {

            "success": True,

            **risk,

            "exif": exif,

            "quality": quality
        }