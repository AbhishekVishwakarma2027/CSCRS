from verification.base_detector import BaseDetector
from .rules import QUALITY_RULES

import cv2

from .metrics import (
    blur_score,
    brightness_score,
    contrast_score,
    resolution
)


class QualityDetector(BaseDetector):

    def predict(self, image_path):

        image = cv2.imread(image_path)

        if image is None:

            return {
                "success": False,
                "message": "Image not found."
            }

        blur = float(blur_score(image))
        brightness = float(brightness_score(image))
        contrast = float(contrast_score(image))
        width, height = resolution(image)
# Risk Calculation
###################################################

        risk = 0.0
        flags = []

        # Blur
        if blur < QUALITY_RULES["blur_threshold"]:
            risk += 0.30
            flags.append("BLUR_IMAGE")

        # Too Dark
        if brightness < QUALITY_RULES["dark_threshold"]:
            risk += 0.20
            flags.append("TOO_DARK")

        # Over Exposed
        if brightness > QUALITY_RULES["bright_threshold"]:
            risk += 0.20
            flags.append("OVER_EXPOSED")

        # Low Contrast
        if contrast < QUALITY_RULES["low_contrast_threshold"]:
            risk += 0.15
            flags.append("LOW_CONTRAST")

        # Resolution
        min_w, min_h = QUALITY_RULES["min_resolution"]

        if width < min_w or height < min_h:
            risk += 0.25
            flags.append("LOW_RESOLUTION")

        return {
    "success": True,

    "detector": "quality",

    "blur_score": round(blur, 2),

    "brightness": round(brightness, 2),

    "contrast": round(contrast, 2),

    "resolution": {
        "width": width,
        "height": height
    },

    "risk_score": round(min(risk, 1.0), 2),

    "flags": flags
}