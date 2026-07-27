from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image

import open_clip


class SceneSimilarityEngine:

    _model = None
    _preprocess = None
    _device = None

    def __init__(
        self,
        model_name: str = "ViT-B-32",
        pretrained: str = "laion2b_s34b_b79k",
    ):

        device = "cuda" if torch.cuda.is_available() else "cpu"

        OPENCLIP_MODEL = Path(
            "/app/models/huggingface/hub/"
            "models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/"
            "snapshots/"
            "1a25a446712ba5ee05982a381eed697ef9b435cf/"
            "open_clip_model.safetensors"
        )

        if SceneSimilarityEngine._model is None:

            model, _, preprocess = open_clip.create_model_and_transforms(
                model_name=model_name,
                pretrained=str(OPENCLIP_MODEL),
            )

            model = model.to(device)
            model.eval()

            SceneSimilarityEngine._model = model
            SceneSimilarityEngine._preprocess = preprocess
            SceneSimilarityEngine._device = device

        self.model = SceneSimilarityEngine._model
        self.preprocess = SceneSimilarityEngine._preprocess
        self.device = SceneSimilarityEngine._device

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