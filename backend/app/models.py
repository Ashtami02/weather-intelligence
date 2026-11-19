from app.database import Base,engine
from sqlalchemy.orm import Mapped,mapped_column
from datetime import datetime
from sqlalchemy import DateTime, func

class WeatherSearch(Base):
    __tablename__ = "weather_searches"
    id:Mapped[int] = mapped_column(primary_key=True)
    city:Mapped[str] = mapped_column()
    country:Mapped[str] = mapped_column()
    temperature:Mapped[float] = mapped_column()
    latitude:Mapped[float] = mapped_column()
    longitude:Mapped[float] = mapped_column()
    searched_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now()
    )
    
