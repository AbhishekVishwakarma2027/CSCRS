from fractions import Fraction


def _parse_fraction(value):

    if isinstance(value, (int, float)):
        return float(value)

    if "/" in value:
        return float(Fraction(value))

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