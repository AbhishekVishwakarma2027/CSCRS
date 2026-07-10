from pathlib import Path

import cv2


ANNOTATED_DIR = Path(
    "uploads/annotated"
)

ANNOTATED_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


class Visualizer:

    @staticmethod
    def save_annotated_image(
        annotated_image,
        filename: str,
    ) -> str:

        output_path = (
            ANNOTATED_DIR
            / filename
        )

        cv2.imwrite(
            str(output_path),
            annotated_image,
        )

        return str(output_path)