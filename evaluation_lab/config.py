from pathlib import Path

# -------------------------------
# Project Paths
# -------------------------------

ROOT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = ROOT_DIR.parent

MODEL_PATH = PROJECT_DIR / "models" / "best_cscrs_seg_v1.pt"

OUTPUT_DIR = ROOT_DIR / "outputs"

IMAGE_OUTPUT_DIR = OUTPUT_DIR / "images"
JSON_OUTPUT_DIR = OUTPUT_DIR / "json"
LOG_OUTPUT_DIR = OUTPUT_DIR / "logs"

for folder in [
    IMAGE_OUTPUT_DIR,
    JSON_OUTPUT_DIR,
    LOG_OUTPUT_DIR,
]:
    folder.mkdir(parents=True, exist_ok=True)

# -------------------------------
# Inference Settings
# -------------------------------

CONFIDENCE = 0.25
IOU = 0.50
IMAGE_SIZE = 640

DEVICE = 0        # GPU