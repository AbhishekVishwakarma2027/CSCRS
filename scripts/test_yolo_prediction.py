import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import argparse
from pprint import pprint

from inference.predictor import YOLOPredictor
from inference.parser import ResultParser

parser = argparse.ArgumentParser()

parser.add_argument("image")

args = parser.parse_args()

result = YOLOPredictor.predict(args.image)

detections = ResultParser.parse(result)

pprint(detections)