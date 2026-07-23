import json
from pathlib import Path
from typing import List, Dict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PATH = PROJECT_ROOT / "backend" / "green_products_mock_data.json"


def load_green_products_data() -> Dict:
    with DATA_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def get_available_green_products() -> List[Dict]:
    catalog = load_green_products_data()
    return [product for product in (catalog.get("products") or []) if product.get("status") == "ACTIVE"]
