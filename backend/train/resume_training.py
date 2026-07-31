import multiprocessing
from ultralytics import YOLO


def main():

    checkpoint = r"D:\Projects\CSCRS\runs\production_engine\cscrs_v2_segmentation-3\weights\last.pt"

    print("=" * 70)
    print("CSCRS Resume Training")
    print("=" * 70)
    print(f"Checkpoint:\n{checkpoint}\n")

    model = YOLO(checkpoint)

    model.train(resume=True)


if __name__ == "__main__":

    multiprocessing.freeze_support()

    main()