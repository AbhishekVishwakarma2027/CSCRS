import torch

from third_party.UniversalFakeDetect.models import get_model
from .config import MODEL_ARCH, FC_WEIGHTS, DEVICE


class ModelLoader:

    _model = None
    _preprocess = None

    @classmethod
    def load(cls):

        if cls._model is not None:
            return cls._model, cls._preprocess

        model = get_model(MODEL_ARCH)

        state_dict = torch.load(FC_WEIGHTS, map_location="cpu")

        model.fc.load_state_dict(state_dict)

        model.eval()

        model.to(DEVICE)

        cls._model = model
        cls._preprocess = model.preprocess

        return cls._model, cls._preprocess