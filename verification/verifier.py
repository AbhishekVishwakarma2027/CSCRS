from verification.ai_generated.detector import AIGeneratedDetector


class VerificationEngine:

    def __init__(self):

        self.ai_detector = AIGeneratedDetector()

    def verify(self, image_path):

        result = self.ai_detector.predict(image_path)

        return {
            "verification_passed": True,
            "ai_generated": result
        }