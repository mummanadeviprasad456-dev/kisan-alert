import { Request, Response } from 'express';
import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock weather data for when API key is not available
const getMockWeather = (lat: number, lon: number) => ({
  current: {
    temp: 28 + Math.random() * 8,
    feels_like: 30 + Math.random() * 5,
    humidity: 55 + Math.floor(Math.random() * 30),
    pressure: 1010 + Math.floor(Math.random() * 10),
    wind_speed: 3 + Math.random() * 7,
    description: 'partly cloudy',
    icon: '02d',
    rainfall: Math.random() > 0.6 ? Math.random() * 15 : 0,
    uv_index: 5 + Math.random() * 5,
  },
  forecast: Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
    temp_max: 30 + Math.random() * 8,
    temp_min: 20 + Math.random() * 5,
    humidity: 50 + Math.floor(Math.random() * 35),
    description: ['sunny', 'partly cloudy', 'overcast', 'light rain', 'thunderstorm'][Math.floor(Math.random() * 5)],
    icon: ['01d', '02d', '04d', '10d', '11d'][Math.floor(Math.random() * 5)],
    rain_chance: Math.floor(Math.random() * 100),
  })),
  location: { lat, lon, name: 'Farm Location' },
});

export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon query parameters are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (!OPENWEATHER_API_KEY) {
      console.warn('⚠️  No OpenWeather API key. Returning mock data.');
      return res.json(getMockWeather(latitude, longitude));
    }

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(`${BASE_URL}/weather`, {
        params: { lat: latitude, lon: longitude, appid: OPENWEATHER_API_KEY, units: 'metric' },
      }),
      axios.get(`${BASE_URL}/forecast`, {
        params: { lat: latitude, lon: longitude, appid: OPENWEATHER_API_KEY, units: 'metric' },
      }),
    ]);

    const current = currentRes.data;
    const forecast = forecastRes.data;

    // Process 5-day forecast into daily summaries
    const dailyMap = new Map<string, any>();
    for (const item of forecast.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          humidity: item.main.humidity,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          rain_chance: item.pop ? Math.round(item.pop * 100) : 0,
        });
      } else {
        const existing = dailyMap.get(date);
        existing.temp_max = Math.max(existing.temp_max, item.main.temp_max);
        existing.temp_min = Math.min(existing.temp_min, item.main.temp_min);
      }
    }

    res.json({
      current: {
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        wind_speed: current.wind.speed,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        rainfall: current.rain ? current.rain['1h'] || 0 : 0,
        uv_index: 0, // requires separate UV API call
      },
      forecast: Array.from(dailyMap.values()).slice(0, 5),
      location: {
        lat: latitude,
        lon: longitude,
        name: current.name,
      },
    });
  } catch (error: any) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

export const getIrrigationAdvice = async (req: Request, res: Response) => {
  try {
    const { soilMoisture, temp, humidity, cropType, rainfall } = req.body;

    // Calculate evapotranspiration estimate (simplified Hargreaves)
    const et0 = 0.0023 * ((temp || 30) + 17.8) * Math.sqrt(Math.abs((temp || 30) - (temp ? temp - 8 : 22))) * 0.408;

    const currentMoisture = soilMoisture || 40;
    const optimalMoisture = cropType === 'rice' ? 80 : cropType === 'wheat' ? 50 : 60;

    let recommendation: string;
    let waterNeeded: number; // liters per sq meter
    let urgency: 'low' | 'medium' | 'high' | 'critical';

    if (currentMoisture >= optimalMoisture) {
      recommendation = 'Soil moisture is adequate. No irrigation needed at this time.';
      waterNeeded = 0;
      urgency = 'low';
    } else if (currentMoisture >= optimalMoisture * 0.7) {
      recommendation = `Soil moisture is slightly below optimal. Consider light irrigation of ${(et0 * 2).toFixed(1)}mm in the next 24 hours.`;
      waterNeeded = et0 * 2;
      urgency = 'medium';
    } else if (currentMoisture >= optimalMoisture * 0.4) {
      recommendation = `Soil moisture is low. Irrigate with ${(et0 * 4).toFixed(1)}mm as soon as possible to prevent crop stress.`;
      waterNeeded = et0 * 4;
      urgency = 'high';
    } else {
      recommendation = `Critical: Soil moisture is dangerously low! Immediate irrigation of ${(et0 * 6).toFixed(1)}mm required to prevent crop damage.`;
      waterNeeded = et0 * 6;
      urgency = 'critical';
    }

    // Adjust for upcoming rainfall
    if ((rainfall || 0) > 5) {
      recommendation += ` Note: ${rainfall}mm rainfall expected. Adjust irrigation volume accordingly.`;
      waterNeeded = Math.max(0, waterNeeded - (rainfall || 0));
    }

    res.json({
      recommendation,
      waterNeeded: parseFloat(waterNeeded.toFixed(2)),
      urgency,
      et0: parseFloat(et0.toFixed(3)),
      currentMoisture,
      optimalMoisture,
    });
  } catch (error: any) {
    console.error('Irrigation advice error:', error.message);
    res.status(500).json({ error: 'Failed to generate irrigation advice' });
  }
};
