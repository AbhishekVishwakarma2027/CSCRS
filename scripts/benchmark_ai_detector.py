import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pathlib import Path
from verification.ai_generated.detector import AIGeneratedDetector

detector = AIGeneratedDetector()

DATASET = Path("verification/test_dataset")

ai_dir = DATASET / "ai"
real_dir = DATASET / "real"

ai_correct = 0
real_correct = 0

print("=" * 60)
print("AI IMAGES")
print("=" * 60)

for img in ai_dir.iterdir():
    if img.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
        continue

    result = detector.predict(str(img))
    ok = result["label"] == "AI"

    if ok:
        ai_correct += 1

    print(f"{img.name:25} {result['label']:5} {result['confidence']:.4f}")

print()

print("=" * 60)
print("REAL IMAGES")
print("=" * 60)

for img in real_dir.iterdir():
    if img.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
        continue

    result = detector.predict(str(img))
    ok = result["label"] == "REAL"

    if ok:
        real_correct += 1

    print(f"{img.name:25} {result['label']:5} {result['confidence']:.4f}")

ai_total = len(list(ai_dir.glob("*")))
real_total = len(list(real_dir.glob("*")))

print()
print("=" * 60)
print(f"AI Accuracy   : {ai_correct}/{ai_total}")
print(f"Real Accuracy : {real_correct}/{real_total}")
print("=" * 60)