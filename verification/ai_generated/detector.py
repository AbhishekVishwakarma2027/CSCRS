from pathlib import Path

import torch
from PIL import Image

from verification.base_detector import BaseDetector
from .model_loader import ModelLoader
from .config import DEVICE, THRESHOLD


class AIGeneratedDetector(BaseDetector):

    def __init__(self):
        self.model, self.preprocess = ModelLoader.load()

    @torch.no_grad()
    def predict(self, image_path: str):

        image_path = Path(image_path)

        if not image_path.exists():
            return {
                "success": False,
                "error": "Image not found."
            }

        image = Image.open(image_path).convert("RGB")

        image = self.preprocess(image)

        image = image.unsqueeze(0).to(DEVICE)

        probability = torch.sigmoid(
            self.model(image)
        ).item()

        label = "AI" if probability >= THRESHOLD else "REAL"

        return {
            "success": True,
            "detector": "ai_generated",
            "label": label,
            "confidence": round(probability, 4)
        }