from fractions import Fraction
from math import atan2, cos, radians, sin, sqrt

def _parse_fraction(value):

    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    value = str(value).strip()

    if "/" in value:

        try:

            numerator, denominator = value.split("/")

            numerator = float(numerator)
            denominator = float(denominator)

            if denominator == 0:
                return None

            return numerator / denominator

        except (ValueError, ZeroDivisionError):
            return None

    try:
        return float(value)

    except ValueError:
        return None


def exif_to_decimal(gps_string):

    if not gps_string:
        return None

    gps_string = gps_string.strip("[]")

    values = [
        item.strip()
        for item in gps_string.split(",")
    ]

    degrees = _parse_fraction(values[0])
    minutes = _parse_fraction(values[1])
    seconds = _parse_fraction(values[2])
    if (
        degrees is None
        or minutes is None
        or seconds is None
    ):
        return None

    decimal = (
        degrees
        + minutes / 60
        + seconds / 3600
    )

    return round(decimal, 8)
def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate distance between two GPS coordinates in meters
    using the Haversine formula.
    """

    earth_radius = 6371000

    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)

    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(d_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return earth_radius * c