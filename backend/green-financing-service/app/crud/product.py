import csv
import json
import time
from typing import List, Optional
from pathlib import Path
from app.api.v1.schemas.product import ProductCreate, ProductUpdate, Product

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CSV_FILE = DATA_DIR / "green_products.csv"
APPLICATIONS_CSV = DATA_DIR / "applications.csv"

CSV_FIELDS = [
    "id",
    "name",
    "description",
    "rate",
    "min_amount",
    "max_amount",
    "term",
    "features",
]

# Utilities

def _ensure_csv_exists():
    if not CSV_FILE.exists():
        # create with header and seed rows
        seed = [
            {
                "id": 1,
                "name": "Solar Home Loan",
                "description": "Low-rate loan for residential solar installations.",
                "rate": 3.5,
                "min_amount": 1000.0,
                "max_amount": 50000.0,
                "term": "5-15 years",
                "features": ["Low interest", "Flexible repayment", "Green subsidy"],
            },
            {
                "id": 2,
                "name": "Energy Efficient Retrofit",
                "description": "Financing for building energy-efficiency upgrades.",
                "rate": 2.9,
                "min_amount": 5000.0,
                "max_amount": 200000.0,
                "term": "3-10 years",
                "features": ["Performance-based", "Long term", "Low fees"],
            },
            {
                "id": 3,
                "name": "EV Fleet Financing",
                "description": "Tailored loans for electric vehicle fleet purchases.",
                "rate": 4.1,
                "min_amount": 20000.0,
                "max_amount": 1000000.0,
                "term": "2-7 years",
                "features": ["Bulk discounts", "Maintenance package", "CO2 tracking"],
            },
            {
                "id": 4,
                "name": "Green SME Growth Loan",
                "description": "Working capital for small businesses pursuing sustainable projects.",
                "rate": 5.0,
                "min_amount": 5000.0,
                "max_amount": 250000.0,
                "term": "1-5 years",
                "features": ["Fast approval", "Advisory support", "Flexible terms"],
            },
        ]
        with CSV_FILE.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()
            for row in seed:
                r = {k: row.get(k, "") for k in CSV_FIELDS}
                r["features"] = json.dumps(row["features"])
                writer.writerow(r)


def _load_all() -> List[dict]:
    _ensure_csv_exists()
    rows: List[dict] = []
    with CSV_FILE.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            # convert types
            try:
                r["id"] = int(r["id"]) if r.get("id") not in (None, "") else None
            except Exception:
                r["id"] = None
            for fld in ("rate", "min_amount", "max_amount"):
                try:
                    r[fld] = float(r.get(fld)) if r.get(fld) not in (None, "") else None
                except Exception:
                    r[fld] = None
            # features stored as JSON string
            try:
                r["features"] = json.loads(r.get("features") or "[]")
            except Exception:
                r["features"] = []
            rows.append(r)
    return rows


def _save_all(rows: List[dict]):
    with CSV_FILE.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for r in rows:
            rr = {k: r.get(k, "") for k in CSV_FIELDS}
            rr["features"] = json.dumps(rr.get("features") or [])
            writer.writerow(rr)


def _ensure_applications_exists():
    if not APPLICATIONS_CSV.exists():
        with APPLICATIONS_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["application_id", "product_id", "timestamp", "status"])
            writer.writeheader()


def _append_application_row(application_id: str, product_id: int, status: str = "submitted"):
    _ensure_applications_exists()
    with APPLICATIONS_CSV.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["application_id", "product_id", "timestamp", "status"])
        writer.writerow({
            "application_id": application_id,
            "product_id": product_id,
            "timestamp": int(time.time()),
            "status": status,
        })


def _load_applications() -> List[dict]:
    _ensure_applications_exists()
    rows: List[dict] = []
    with APPLICATIONS_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                r["product_id"] = int(r.get("product_id") or 0)
            except Exception:
                r["product_id"] = 0
            try:
                r["timestamp"] = int(r.get("timestamp") or 0)
            except Exception:
                r["timestamp"] = 0
            rows.append(r)
    return rows


# CRUD API (async wrappers)

async def list_products() -> List[Product]:
    rows = _load_all()
    return [Product(**r) for r in rows]


async def get_product(product_id: int) -> Optional[Product]:
    rows = _load_all()
    for r in rows:
        if r.get("id") == product_id:
            return Product(**r)
    return None


async def create_product(product: ProductCreate) -> Product:
    rows = _load_all()
    new_id = max((r.get("id") or 0 for r in rows), default=0) + 1
    item = product.dict()
    item["id"] = new_id
    rows.append(item)
    _save_all(rows)
    return Product(**item)


async def update_product(product_id: int, product: ProductUpdate) -> Optional[Product]:
    rows = _load_all()
    for idx, r in enumerate(rows):
        if r.get("id") == product_id:
            data = product.dict(exclude_unset=True)
            r.update(data)
            rows[idx] = r
            _save_all(rows)
            return Product(**r)
    return None


async def delete_product(product_id: int) -> bool:
    rows = _load_all()
    for idx, r in enumerate(rows):
        if r.get("id") == product_id:
            rows.pop(idx)
            _save_all(rows)
            return True
    return False


async def compare_products() -> dict:
    rows = _load_all()
    if not rows:
        return {"products": [], "best_rate": None, "best_range": None}
    best_rate = min(rows, key=lambda x: x.get("rate", float("inf")))
    best_range = max(rows, key=lambda x: (x.get("max_amount") or 0) - (x.get("min_amount") or 0))
    return {
        "products": [Product(**p).dict() for p in rows],
        "best_rate": {"id": best_rate["id"], "name": best_rate["name"], "rate": best_rate["rate"]},
        "best_range": {"id": best_range["id"], "name": best_range["name"], "range": (best_range.get("max_amount") or 0) - (best_range.get("min_amount") or 0)},
    }


async def apply_product(product_id: int) -> Optional[str]:
    # In CSV mode, simulate creating an application and return an application id
    prod = await get_product(product_id)
    if prod is None:
        return None
    application_id = f"app-{int(time.time() * 1000)}"
    # Persist application record to CSV
    _append_application_row(application_id, product_id, status="submitted")
    return application_id


async def get_applications() -> List[dict]:
    return _load_applications()
