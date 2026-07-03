import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import argparse
from pprint import pprint

from verification.exif.detector import EXIFDetector

parser = argparse.ArgumentParser()

parser.add_argument("image")

args = parser.parse_args()

detector = EXIFDetector()

result = detector.predict(args.image)

pprint(result)