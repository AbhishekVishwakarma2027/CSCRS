"""
=============================================================
CSCRS Production AI Engine
Version : 3.0
Author  : Abhishek Kumar Vishwakarma

Professional Training Launcher
=============================================================
"""

import time
import torch
from ultralytics import YOLO

from configs.production_config import *

def main():
    # =============================================================
    # Banner
    # =============================================================

    print("\n" + "=" * 80)
    print(f"{PROJECT} AI Engine  |  Version {VERSION}")
    print("=" * 80)

    print(f"GPU              : {torch.cuda.get_device_name(DEVICE)}")
    print(f"Dataset          : {DATASET_DIR}")
    print(f"Model            : {YOLO_SEG}")
    print(f"Experiment       : {EXPERIMENT_NAME}")

    print("=" * 80)

    # =============================================================
    # Validation
    # =============================================================

    print("\nRunning Startup Validation...\n")

    if not DATASET_DIR.exists():
        raise FileNotFoundError(
            f"Dataset folder not found:\n{DATASET_DIR}"
        )

    if not DATA_YAML.exists():
        raise FileNotFoundError(
            f"Dataset YAML not found:\n{DATA_YAML}"
        )

    if not YOLO_SEG.exists():
        raise FileNotFoundError(
            f"Pretrained model not found:\n{YOLO_SEG}"
        )

    print("Dataset Folder   ✓")
    print("Dataset YAML     ✓")
    print("Pretrained Model ✓")

    # =============================================================
    # Resume Detection
    # =============================================================

    print("\nStarting Fresh Training...\n")

    model = YOLO(str(YOLO_SEG))

    # =============================================================
    # Training
    # =============================================================

    start_time = time.time()

    model.train(

        data=str(DATA_YAML),

        epochs=EPOCHS,

        imgsz=IMAGE_SIZE,

        batch=BATCH_SIZE,

        device=DEVICE,

        workers=WORKERS,

        optimizer=OPTIMIZER,

        amp=AMP,

        val=VAL,

        save=SAVE,

        save_period=SAVE_PERIOD,

        patience=PATIENCE,

        seed=SEED,

        deterministic=DETERMINISTIC,

        cache=USE_CACHE,
        
        pin_memory=True,

        persistent_workers=True,

        plots=PLOTS,

        verbose=VERBOSE,

        project=str(RUNS_DIR / PROJECT_NAME),

        name=EXPERIMENT_NAME,

        exist_ok=False

    )

    # =============================================================
    # Finish
    # =============================================================

    elapsed = int(time.time() - start_time)

    hours = elapsed // 3600

    minutes = (elapsed % 3600) // 60

    seconds = elapsed % 60

    print("\n" + "=" * 80)

    print("Training Finished Successfully")

    print(f"Total Time : {hours}h {minutes}m {seconds}s")

    print("=" * 80)

if __name__ == "__main__":
    import multiprocessing

    multiprocessing.freeze_support()

    main()