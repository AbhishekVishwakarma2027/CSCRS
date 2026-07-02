from pathlib import Path
import torch

# ======================================================
# CSCRS Production Configuration
# ======================================================
PROJECT = "CSCRS"

VERSION = "3.0"

AUTHOR = "Abhishek Kumar Vishwakarma"

TRAIN_TASK = "segmentation"

USE_CACHE = "disk"

PLOTS = True

VERBOSE = True
# -----------------------------
# Project Root
# -----------------------------

ROOT = Path(__file__).resolve().parents[1]

# -----------------------------
# Dataset
# -----------------------------

DATASET_DIR = ROOT / "datasets" / "Master_Dataset"

DATA_YAML = ROOT / "configs" / "production_data.yaml"

# -----------------------------
# Pretrained Models
# -----------------------------

MODEL_DIR = ROOT / "models" / "pretrained"

YOLO_SEG = MODEL_DIR / "yolov8m-seg.pt"

YOLO_NANO = MODEL_DIR / "yolo26n.pt"

# -----------------------------
# Training Parameters
# -----------------------------

EPOCHS = 100

IMAGE_SIZE = 640

BATCH_SIZE = 16

WORKERS = 4

if not torch.cuda.is_available():
    raise RuntimeError(
        "CUDA not detected. Training is allowed only on the NVIDIA RTX 5060."
    )

DEVICE = 0

# -----------------------------
# Output
# -----------------------------

RUNS_DIR = ROOT / "runs"

PROJECT_NAME = "production_engine"

EXPERIMENT_NAME = "cscrs_v2_segmentation" 

# -----------------------------
# Training Behaviour
# -----------------------------

SAVE = True

SAVE_PERIOD = 5

PATIENCE = 30

AMP = True

OPTIMIZER = "auto"

SEED = 42

DETERMINISTIC = False

VAL = True