from sqlalchemy.orm import Session

from database.models.report_detection import ReportDetection


def create_detection(
    db: Session,
    report_id: int,
    class_name: str,
    confidence: float,
    bbox,
    mask_area: float,
    model_version: str,
    inference_time_ms: int,
):
    detection = ReportDetection(
        report_id=report_id,
        class_name=class_name,
        confidence=confidence,
        bbox=bbox,
        mask_area=mask_area,
        model_version=model_version,
        inference_time_ms=inference_time_ms,
    )

    db.add(detection)
    db.commit()
    db.refresh(detection)

    return detection


def create_many_detections(
    db: Session,
    report_id: int,
    detections: list,
    model_version: str,
    inference_time_ms: int,
):
    objects = []

    for detection in detections:

        obj = ReportDetection(
            report_id=report_id,
            class_name=detection["class_name"],
            confidence=detection["confidence"],
            bbox=detection["bbox"],
            mask_area=detection["mask_area"],
            model_version=model_version,
            inference_time_ms=inference_time_ms,
        )

        objects.append(obj)

    db.add_all(objects)
    db.commit()

    return objects


def get_report_detections(
    db: Session,
    report_id: int,
):
    return (
        db.query(ReportDetection)
        .filter(
            ReportDetection.report_id == report_id
        )
        .all()
    )