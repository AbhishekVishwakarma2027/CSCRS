import json
import urllib.request
from pathlib import Path

TOPOJSON_URL = "https://raw.githubusercontent.com/guneetnarula/indian-district-boundaries/master/topojson/state-wise/uttarpradesh.json"

NAME_MAP = {
    'Bara Banki': 'Barabanki',
    'Faizabad': 'Ayodhya',
    'Mahrajganj': 'Maharajganj',
    'Rae Bareli': 'Raebareli',
    'Shrawasti': 'Shravasti'
}

def decode_topojson_to_geojson(topo: dict) -> dict:
    arcs_data = topo['arcs']
    transform = topo.get('transform')
    scale = transform['scale'] if transform else [1, 1]
    translate = transform['translate'] if transform else [0, 0]

    decoded_arcs = []
    for arc in arcs_data:
        curr_x, curr_y = 0, 0
        decoded_arc = []
        for pt in arc:
            curr_x += pt[0]
            curr_y += pt[1]
            lon = round(curr_x * scale[0] + translate[0], 6)
            lat = round(curr_y * scale[1] + translate[1], 6)
            decoded_arc.append([lon, lat])
        decoded_arcs.append(decoded_arc)

    def get_ring(arc_idx: int) -> list:
        if arc_idx < 0:
            return list(reversed(decoded_arcs[~arc_idx]))
        else:
            return list(decoded_arcs[arc_idx])

    def decode_geometry(geom: dict) -> dict:
        gtype = geom['type']
        arcs = geom['arcs']
        if gtype == 'Polygon':
            coordinates = []
            for ring_arcs in arcs:
                ring = []
                for a_idx in ring_arcs:
                    sub_ring = get_ring(a_idx)
                    if ring:
                        ring.extend(sub_ring[1:])
                    else:
                        ring.extend(sub_ring)
                coordinates.append(ring)
            return {'type': 'Polygon', 'coordinates': coordinates}
        elif gtype == 'MultiPolygon':
            all_polys = []
            for poly_arcs in arcs:
                poly_coords = []
                for ring_arcs in poly_arcs:
                    ring = []
                    for a_idx in ring_arcs:
                        sub_ring = get_ring(a_idx)
                        if ring:
                            ring.extend(sub_ring[1:])
                        else:
                            ring.extend(sub_ring)
                    poly_coords.append(ring)
                all_polys.append(poly_coords)
            return {'type': 'MultiPolygon', 'coordinates': all_polys}
        raise ValueError(f"Unsupported geometry type: {gtype}")

    geometries = topo['objects']['uttar-pradesh']['geometries']
    features = []
    for g in geometries:
        raw_name = g['properties']['district']
        dist_name = NAME_MAP.get(raw_name, raw_name)
        geo_geom = decode_geometry(g)
        features.append({
            'type': 'Feature',
            'properties': {
                'district': dist_name,
                'state': 'Uttar Pradesh'
            },
            'geometry': geo_geom
        })

    # Sort features deterministically by district name
    features.sort(key=lambda x: x['properties']['district'])

    return {
        "type": "FeatureCollection",
        "name": "Uttar_Pradesh_Districts",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }

def main():
    print("Fetching authentic Uttar Pradesh district boundary TopoJSON...")
    req = urllib.request.Request(TOPOJSON_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        topo = json.loads(resp.read().decode('utf-8'))

    geojson_data = decode_topojson_to_geojson(topo)

    backend_path = Path(__file__).parent.parent / "assets" / "up_districts_geojson.json"
    frontend_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "assets" / "up_districts.json"

    backend_path.parent.mkdir(exist_ok=True)
    frontend_path.parent.mkdir(exist_ok=True)

    with open(backend_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, indent=2)

    with open(frontend_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, indent=2)

    print(f"Successfully generated authentic GeoJSON for {len(geojson_data['features'])} UP districts.")

if __name__ == "__main__":
    main()

