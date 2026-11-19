from datetime import datetime
from pydantic import BaseModel, ConfigDict

class WeatherSearchCreate(BaseModel):
    city:str
    country:str
    latitude:float
    longitude:float
    temperature:float


class WeatherSearchResponse(WeatherSearchCreate):
    model_config = ConfigDict(from_attributes=True)

    id:int
    searched_at:datetime
    
