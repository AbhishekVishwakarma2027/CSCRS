import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
import argparse
from pprint import pprint

from verification.verifier import VerificationEngine

parser = argparse.ArgumentParser()

parser.add_argument("image")

args = parser.parse_args()

engine = VerificationEngine()

result = engine.verify(args.image)

pprint(result)