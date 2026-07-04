from utils.gps import exif_to_decimal

from schemas.report import ReportCreateInternal


class ReportBuilder:

    @staticmethod
    def build(
        inference_result: dict,
        citizen_id: int,
        department_id: int,
        description: str | None = None,
        address: str | None = None,
    ) -> ReportCreateInternal:

        detections = inference_result.get(
            "detections",
            [],
        )

        if not detections:
            raise ValueError(
                "No civic issue detected."
            )

        detection = detections[0]

        verification = inference_result["verification"]

        exif = verification["exif"]

        latitude = exif_to_decimal(
            exif["gps_latitude"]
        )

        longitude = exif_to_decimal(
            exif["gps_longitude"]
        )

        return ReportCreateInternal(

            citizen_id=citizen_id,

            department_id=department_id,

            issue_type=detection["class"],

            description=description,

            latitude=latitude,

            longitude=longitude,

            address=address,

            risk_score=verification["risk_score"],

            ai_confidence=detection["confidence"],

            verification_decision=verification["decision"],

            verification_passed=verification[
                "verification_passed"
            ],
        )