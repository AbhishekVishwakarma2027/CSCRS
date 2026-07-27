from pathlib import Path
import torch

PROJECT_ROOT = Path(__file__).resolve().parents[1]

MODEL_DIR = Path("/app/models")

MODEL_PATH = PROJECT_ROOT / "models" / "best_cscrs_seg_v1.pt"

MODEL_VERSION = "best_cscrs_seg_v1"

DEVICE = 0 if torch.cuda.is_available() else "cpu"

CONFIDENCE_THRESHOLD = 0.55

IOU_THRESHOLD = 0.50

IMAGE_SIZE = 640

MAX_DETECTIONS = 20