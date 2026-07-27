from fractions import Fraction
from math import atan2, cos, radians, sin, sqrt

def _parse_fraction(value):

    if isinstance(value, (int, float)):
        return float(value)

    if "/" in value:
        numerator, denominator = value.split("/")

        if denominator == "0":
            return None

    return float(value)


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