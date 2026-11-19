import os
from fastapi import FastAPI,HTTPException,Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.weather import cityweather, current_weather, forecast
from app.database import Base,engine,SessionLocal
from app.models import WeatherSearch
from app.schemas import WeatherSearchCreate, WeatherSearchResponse
from sqlalchemy import select
 
app = FastAPI()
origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"]
)
Base.metadata.create_all(bind=engine)

@app.get("/health")
async def root():
    return{"status":"ok", "service":"weather-application-PMAccelerator"}

@app.get("/api/locations/search")
async def search_city(name:str):
    locations = await cityweather(name)
    return locations

@app.get("/api/weather/current")
async def get_current_weather(latitude:float = Query(..., ge = -90, le=90) , longitude:float = Query(..., ge=-180, le=180)):
    current = await current_weather(latitude,longitude)
    return current

@app.get("/api/weather/forecast")
async def get_forecast(latitude:float = Query(..., ge = -90, le=90) , longitude:float = Query(..., ge=-180, le=180)):
    five_forecast = await forecast(latitude,longitude)
    return five_forecast

@app.post("/api/history")
def create_weather_search(weather: WeatherSearchCreate):
    with SessionLocal() as db:
        record = WeatherSearch(**weather.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
    return weather

@app.get("/api/history", response_model=list[WeatherSearchResponse])
def get_history():
    with SessionLocal() as db:
        records = db.scalars(select(WeatherSearch).order_by(WeatherSearch.id)).all()
        return records


@app.get("/api/history/{id}", response_model=WeatherSearchResponse)
def get_weather_search(id: int):
    with SessionLocal() as db:
        record = db.get(WeatherSearch, id)
        if record is None:
            raise HTTPException(status_code=404, detail="Weather search not found")
        return record


@app.put("/api/history/{id}", response_model=WeatherSearchResponse)
def update_weather_search(id: int, weather: WeatherSearchCreate):
    with SessionLocal() as db:
        record = db.get(WeatherSearch, id)
        if record is None:
            raise HTTPException(status_code=404, detail="Weather search not found")
        record.city = weather.city
        record.country = weather.country
        record.latitude = weather.latitude
        record.longitude = weather.longitude
        record.temperature = weather.temperature
        db.commit()
        db.refresh(record)
        return record


@app.delete("/api/history/{id}", status_code=204)
def delete_weather_search(id: int):
    with SessionLocal() as db:
        record = db.get(WeatherSearch, id)
        if record is None:
            raise HTTPException(status_code=404, detail="Weather search not found")
        db.delete(record)
        db.commit()
