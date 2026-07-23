from sqlalchemy import Column, String, Float, Integer
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)
    rate = Column(Float)
    description = Column(String)
    co2_saving = Column(String)
    badge = Column(String)
    min_amount = Column(Float)
    max_amount = Column(Float)
    term = Column(String)
    features = Column(String)  # This can be a JSON string or a separate table depending on requirements.