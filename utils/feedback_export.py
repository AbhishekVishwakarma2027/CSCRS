from __future__ import annotations

import csv
from io import BytesIO, StringIO

from openpyxl import Workbook


class FeedbackExportUtil:

    @staticmethod
    def generate_excel(rows: list[dict]) -> BytesIO:

        workbook = Workbook()

        worksheet = workbook.active

        worksheet.title = "Feedback"

        worksheet.append(
            [
                "Rating",
                "Liked",
                "Suggestion",
                "Created Date",
            ]
        )

        for row in rows:

            worksheet.append(
                [
                    row["rating"],
                    row["liked_text"],
                    row["suggestion_text"],
                    row["created_at"],
                ]
            )

        stream = BytesIO()

        workbook.save(stream)

        stream.seek(0)

        return stream

    @staticmethod
    def generate_csv(rows: list[dict]) -> StringIO:

        stream = StringIO()

        writer = csv.writer(stream)

        writer.writerow(
            [
                "Rating",
                "Liked",
                "Suggestion",
                "Created Date",
            ]
        )

        for row in rows:

            writer.writerow(
                [
                    row["rating"],
                    row["liked_text"],
                    row["suggestion_text"],
                    row["created_at"],
                ]
            )

        stream.seek(0)

        return stream