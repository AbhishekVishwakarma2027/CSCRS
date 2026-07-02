from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import shutil
import psutil
import torch
import ultralytics

from configs.production_config import *

"""
=============================================================
CSCRS Environment Validator
Version : 1.0

Checks:
- Python
- CUDA
- GPU
- Torch
- Ultralytics
- Dataset
- YAML
- Model
- Disk Space
- RAM
=============================================================
"""

import shutil
import sys
from pathlib import Path

import psutil
import torch
import ultralytics

from configs.production_config import *


def line():
    print("=" * 80)


def ok(msg):
    print(f"[PASS]  {msg}")


def warn(msg):
    print(f"[WARN]  {msg}")


def fail(msg):
    print(f"[FAIL]  {msg}")


def main():

    line()
    print("CSCRS Environment Validation")
    line()

    # ---------------------------------------------------------
    # Python
    # ---------------------------------------------------------

    print("\nPython")

    print("Executable :", sys.executable)
    print("Version    :", sys.version.split()[0])

    # ---------------------------------------------------------
    # Torch
    # ---------------------------------------------------------

    print("\nPyTorch")

    print("Version :", torch.__version__)

    if torch.cuda.is_available():
        ok("CUDA Available")
    else:
        fail("CUDA NOT AVAILABLE")
        return

    # ---------------------------------------------------------
    # GPU
    # ---------------------------------------------------------

    print("\nGPU")

    gpu = torch.cuda.get_device_name(0)

    print("Name :", gpu)

    props = torch.cuda.get_device_properties(0)

    print(f"VRAM : {props.total_memory/1024**3:.2f} GB")

    ok("GPU Detected")

    # ---------------------------------------------------------
    # cuDNN
    # ---------------------------------------------------------

    print("\ncuDNN")

    print("Enabled :", torch.backends.cudnn.enabled)

    print("Version :", torch.backends.cudnn.version())

    # ---------------------------------------------------------
    # Ultralytics
    # ---------------------------------------------------------

    print("\nUltralytics")

    print("Version :", ultralytics.__version__)

    print("Location :", Path(ultralytics.__file__).parent)

    if "Roaming" in str(Path(ultralytics.__file__)):

        warn("Ultralytics loaded from USER SITE")

    else:

        ok("Ultralytics loaded from Conda Environment")

    # ---------------------------------------------------------
    # Dataset
    # ---------------------------------------------------------

    print("\nDataset")

    if DATASET_DIR.exists():

        ok(DATASET_DIR)

    else:

        fail(DATASET_DIR)

    if DATA_YAML.exists():

        ok(DATA_YAML)

    else:

        fail(DATA_YAML)

    # ---------------------------------------------------------
    # Model
    # ---------------------------------------------------------

    print("\nModel")

    if YOLO_SEG.exists():

        ok(YOLO_SEG)

    else:

        fail(YOLO_SEG)

    # ---------------------------------------------------------
    # Disk
    # ---------------------------------------------------------

    print("\nDisk")

    usage = shutil.disk_usage(ROOT)

    free = usage.free / 1024**3

    total = usage.total / 1024**3

    print(f"Free  : {free:.1f} GB")
    print(f"Total : {total:.1f} GB")

    if free < 20:

        warn("Less than 20GB free")

    else:

        ok("Enough Disk Space")

    # ---------------------------------------------------------
    # RAM
    # ---------------------------------------------------------

    print("\nRAM")

    ram = psutil.virtual_memory()

    print(f"Available : {ram.available/1024**3:.1f} GB")

    print(f"Used      : {ram.percent}%")

    if ram.percent > 90:

        warn("RAM usage above 90%")

    else:

        ok("RAM OK")

    line()
    print("ENVIRONMENT READY")
    line()


if __name__ == "__main__":
    main()