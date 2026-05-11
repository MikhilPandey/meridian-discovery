"""Add backend/ to sys.path so test modules can import services / routers /
deps without a packaging step. Keeps the demo lean."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
