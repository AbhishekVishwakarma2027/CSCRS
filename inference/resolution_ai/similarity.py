from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image

import open_clip


class SceneSimilarityEngine:

    def __init__(
        self,
        model_name: str = "ViT-B-32",
        pretrained: str = "laion2b_s34b_b79k",
    ):

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name=model_name,
            pretrained=pretrained,
        )

        self.model = self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def get_embedding(
        self,
        image_path: str,
    ):

        image = Image.open(image_path).convert("RGB")

        image = self.preprocess(image).unsqueeze(0).to(self.device)

        embedding = self.model.encode_image(image)

        embedding = F.normalize(
            embedding,
            dim=-1,
        )

        return embedding

    @torch.no_grad()
    def compare(
        self,
        original_image: str,
        resolution_image: str,
    ) -> float:

        emb1 = self.get_embedding(original_image)

        emb2 = self.get_embedding(resolution_image)

        similarity = (emb1 @ emb2.T).item()

        return round(float(similarity), 4)