from abc import ABC, abstractmethod


class BaseDetector(ABC):
    """Base interface for all verification detectors."""

    @abstractmethod
    def predict(self, image_path: str) -> dict:
        """
        Returns standardized prediction.

        Example:
        {
            "success": True,
            "detector": "ai_generated",
            "confidence": 0.97,
            "label": "AI"
        }
        """
        pass