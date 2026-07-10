from __future__ import annotations

from typing import Sequence


class Geometry:

    @staticmethod
    def polygon_area(
        polygon: Sequence[Sequence[float]],
    ) -> float:
        """
        Calculates polygon area using the Shoelace formula.
        Polygon format:
        [
            [x1, y1],
            [x2, y2],
            ...
        ]
        """

        if polygon is None or len(polygon) < 3:
            return 0.0

        area = 0.0
        n = len(polygon)

        for i in range(n):

            x1, y1 = polygon[i]

            x2, y2 = polygon[(i + 1) % n]

            area += (x1 * y2) - (x2 * y1)

        return abs(area) / 2.0

    @staticmethod
    def percent_change(
        before: float,
        after: float,
    ) -> float:

        if before <= 0:
            return 0.0

        return round(
            ((before - after) / before) * 100,
            2,
        )