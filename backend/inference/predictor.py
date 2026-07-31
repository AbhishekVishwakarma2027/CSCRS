from ultralytics import YOLO

from .config import (
    MODEL_PATH,
    DEVICE,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
    IMAGE_SIZE
)


class YOLOPredictor:

    _model = None

    @classmethod
    def load(cls):

        if cls._model is None:

            cls._model = YOLO(MODEL_PATH)

        return cls._model

    @classmethod
    def predict(cls, image_path):

        model = cls.load()

        results = model.predict(

            source=image_path,

            conf=CONFIDENCE_THRESHOLD,

            iou=IOU_THRESHOLD,

            imgsz=IMAGE_SIZE,

            device=DEVICE,

            verbose=False

        )

        return results[0]