from verification.base_detector import BaseDetector

from .parser import ExifParser
from .utils import get_tag
from .rules import EXIF_RULES, KNOWN_EDITORS


class EXIFDetector(BaseDetector):

    def predict(self, image_path):

        tags = ExifParser.extract(image_path)

        has_exif = len(tags) > 0

        result = {
            "success": True,
            "detector": "exif",

            "has_exif": has_exif,

            "camera_make": get_tag(tags, "Image Make"),
            "camera_model": get_tag(tags, "Image Model"),

            "software": get_tag(tags, "Image Software"),

            "datetime_original": get_tag(
                tags,
                "EXIF DateTimeOriginal"
            ),

            "gps_latitude": get_tag(
                tags,
                "GPS GPSLatitude"
            ),

            "gps_longitude": get_tag(
                tags,
                "GPS GPSLongitude"
            ),

            "gps_altitude": get_tag(
                tags,
                "GPS GPSAltitude"
            ),

            "orientation": get_tag(
                tags,
                "Image Orientation"
            )
        }

        ###################################################
        # Risk Calculation
        ###################################################

        risk = 0.0
        flags = []

        if not has_exif:
            risk += EXIF_RULES["missing_exif"]
            flags.append("NO_EXIF")

        if not result["camera_make"]:
            risk += EXIF_RULES["missing_camera"]
            flags.append("NO_CAMERA")

        if not result["datetime_original"]:
            risk += EXIF_RULES["missing_datetime"]
            flags.append("NO_DATETIME")

        if not result["gps_latitude"]:
            risk += EXIF_RULES["missing_gps"]
            flags.append("NO_GPS")

        software = (result["software"] or "").lower()

        for editor in KNOWN_EDITORS:

            if editor.lower() in software:

                risk += EXIF_RULES["editing_software"]

                flags.append("EDITING_SOFTWARE")

                break

        ###################################################
        # Final Result
        ###################################################

        result["risk_score"] = round(min(risk, 1.0), 2)

        result["flags"] = flags

        return result