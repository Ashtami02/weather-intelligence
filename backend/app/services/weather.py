
import httpx
import asyncio

async def cityweather(city):
    newcity = city.strip()

    if (len(newcity)==0):
        print("Enter a proper name:")
        return []

    else:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params = {"name" : newcity, "count" : 4}
            )

        response.raise_for_status()
        data = response.json()
        result = []

        if ("results" in data):
            for i in range(0,len(data["results"])):
                result.append({
                    "latitude" : data["results"][i]["latitude"],
                    "longitude" : data["results"][i]["longitude"],
                    "country" : data["results"][i].get("country", ""),
                    "timezone" : data["results"][i].get("timezone"),
                    "name" : data["results"][i]["name"],
                    "state": data["results"][i].get("admin1")
                    
                })

        return result


async def current_weather(latitude,longitude):
    async with httpx.AsyncClient() as client:
                response = await client.get("https://api.open-meteo.com/v1/forecast",params = {
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                "timezone": "auto"
})
                response.raise_for_status()
                data = response.json()
                
    return data["current"]

    
async def forecast(latitude, longitude):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset",
                "timezone": "auto",
                "forecast_days": 5
            }
        )
        response.raise_for_status()
        data = response.json()
        
    return (data["daily"])
