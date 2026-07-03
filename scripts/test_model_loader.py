import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from verification.ai_generated.model_loader import ModelLoader

model, preprocess = ModelLoader.load()

print(type(model))
print(type(preprocess))