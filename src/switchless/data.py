"""Loading the Banking77 dataset."""

import csv
from dataclasses import dataclass
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "banking77"


@dataclass(frozen=True)
class Example:
    text: str
    intent: str


def load_split(split: str, data_dir: Path = DATA_DIR) -> list[Example]:
    """Load the 'train' or 'test' split. Run scripts/download_banking77.py first."""
    path = data_dir / f"{split}.csv"
    if not path.exists():
        raise FileNotFoundError(f"{path} not found; run scripts/download_banking77.py")
    with path.open(newline="", encoding="utf-8") as f:
        return [Example(row["text"], row["category"]) for row in csv.DictReader(f)]
