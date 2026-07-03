import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import argparse

from verification.ai_generated.detector import AIGeneratedDetector

parser = argparse.ArgumentParser()
parser.add_argument("image")

args = parser.parse_args()

detector = AIGeneratedDetector()

result = detector.predict(args.image)

print(result)