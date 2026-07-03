from pathlib import Path
import torch

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_ARCH = "CLIP:ViT-L/14"

FC_WEIGHTS = (
    PROJECT_ROOT
    / "third_party"
    / "UniversalFakeDetect"
    / "pretrained_weights"
    / "fc_weights.pth"
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

THRESHOLD = 0.50