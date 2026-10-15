"""Download the Banking77 train/test CSVs into data/banking77/."""

from pathlib import Path
from urllib.request import urlretrieve

BASE = "https://raw.githubusercontent.com/PolyAI-LDN/task-specific-datasets/master/banking_data"
DEST = Path(__file__).resolve().parents[1] / "data" / "banking77"


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for split in ("train", "test"):
        target = DEST / f"{split}.csv"
        if target.exists():
            print(f"exists: {target}")
            continue
        urlretrieve(f"{BASE}/{split}.csv", target)
        print(f"downloaded: {target}")


if __name__ == "__main__":
    main()
