import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from inference.resolution_ai.verifier import ResolutionVerifier

verifier = ResolutionVerifier()

result = verifier.verify(
    original_image= r"D:\Projects\CSCRS\uploads\fdc5b2668fc54bb5bc9d0f9484c38b35.jpg",
    resolution_image= r"D:\Projects\CSCRS\uploads\annotated\571a85606a2e48b696d3e29679172314.jpg",
)

print(result)