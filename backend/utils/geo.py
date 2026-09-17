import json
from pathlib import Path
from typing import Optional, Any


def is_point_in_ring(px: float, py: float, ring: list[list[float]]) -> bool:
    """
    Ray-casting algorithm to test if point (px=longitude, py=latitude) is inside a linear ring.
    """
    n = len(ring)
    if n < 3:
        return False
    inside = False
    p1x, p1y = ring[0][0], ring[0][1]
    for i in range(n + 1):
        p2x, p2y = ring[i % n][0], ring[i % n][1]
        if py > min(p1y, p2y):
            if py <= max(p1y, p2y):
                if px <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (py - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or px <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def is_point_in_polygon(px: float, py: float, polygon: list[list[list[float]]]) -> bool:
    """
    Test if point (px=lon, py=lat) is inside a polygon (outer ring minus holes).
    """
    if not polygon:
        return False
    # Must be inside outer ring
    if not is_point_in_ring(px, py, polygon[0]):
        return False
    # Must NOT be inside any hole ring
    for hole in polygon[1:]:
        if is_point_in_ring(px, py, hole):
            return False
    return True


def is_point_in_multipolygon(px: float, py: float, multipolygon: list[list[list[list[float]]]]) -> bool:
    """
    Test if point (px=lon, py=lat) is inside any polygon of a MultiPolygon.
    """
    for polygon in multipolygon:
        if is_point_in_polygon(px, py, polygon):
            return True
    return False


class DistrictResolver:
    """
    Pure Python spatial resolver mapping (latitude, longitude) coordinates to Uttar Pradesh districts
    using GeoJSON boundary data.
    """

    _instance: Optional["DistrictResolver"] = None

    def __init__(self, geojson_path: Optional[Path] = None):
        if geojson_path is None:
            geojson_path = Path(__file__).parent.parent / "assets" / "up_districts_geojson.json"

        self.districts: list[dict[str, Any]] = []

        if geojson_path.exists():
            with open(geojson_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for feature in data.get("features", []):
                    name = feature.get("properties", {}).get("district") or feature.get("properties", {}).get("name")
                    geometry = feature.get("geometry", {})
                    if name and geometry:
                        self.districts.append({
                            "name": name,
                            "type": geometry.get("type"),
                            "coordinates": geometry.get("coordinates")
                        })

    @classmethod
    def get_instance(cls) -> "DistrictResolver":
        if cls._instance is None:
            cls._instance = DistrictResolver()
        return cls._instance

    def resolve_district(self, lat: float, lon: float) -> Optional[str]:
        """
        Given latitude and longitude, returns the matching District name or None if outside known boundaries.
        Note: GeoJSON coordinates are in [longitude, latitude] order.
        """
        px, py = lon, lat
        for district in self.districts:
            gtype = district["type"]
            coords = district["coordinates"]
            if gtype == "Polygon":
                if is_point_in_polygon(px, py, coords):
                    return district["name"]
            elif gtype == "MultiPolygon":
                if is_point_in_multipolygon(px, py, coords):
                    return district["name"]
        return None
