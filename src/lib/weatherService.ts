import { WeatherInfo, Language } from '../types';

interface GeocodeResult {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface ForecastResult {
  current_weather?: {
    temperature: number;
    weathercode: number;
    is_day: number;
  };
}

const CACHE_KEY_PREFIX = 'alchemy_weather_cache_';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function getWeatherDescription(code: number, lang: Language = 'nl'): string {
  const isNl = lang === 'nl';
  switch (code) {
    case 0:
      return isNl ? 'Heldere hemel' : 'Clear sky';
    case 1:
      return isNl ? 'Vrijwel helder' : 'Mainly clear';
    case 2:
      return isNl ? 'Half bewolkt' : 'Partly cloudy';
    case 3:
      return isNl ? 'Bewolkt' : 'Overcast';
    case 45:
    case 48:
      return isNl ? 'Mist' : 'Fog';
    case 51:
    case 53:
    case 55:
      return isNl ? 'Lichte motregen' : 'Drizzle';
    case 61:
    case 63:
    case 65:
      return isNl ? 'Regen' : 'Rain';
    case 71:
    case 73:
    case 75:
      return isNl ? 'Sneeuw' : 'Snow';
    case 80:
    case 81:
    case 82:
      return isNl ? 'Regenbuien' : 'Rain showers';
    case 95:
    case 96:
    case 99:
      return isNl ? 'Onweer' : 'Thunderstorm';
    default:
      return isNl ? 'Wisselvallig' : 'Scattered clouds';
  }
}

export async function fetchLiveWeather(
  locationQuery: string | undefined,
  lang: Language = 'nl'
): Promise<WeatherInfo | null> {
  const query = locationQuery?.trim();
  if (!query) return null;

  const cacheKey = `${CACHE_KEY_PREFIX}${query.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore cache error
  }

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=1&language=${lang}`
    );
    if (!geoRes.ok) return null;
    const geoData: GeocodeResult = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;

    const loc = geoData.results[0];
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
    );
    if (!forecastRes.ok) return null;
    const forecastData: ForecastResult = await forecastRes.json();
    if (!forecastData.current_weather) return null;

    const cw = forecastData.current_weather;
    const weatherInfo: WeatherInfo = {
      temperature: Math.round(cw.temperature),
      weatherCode: cw.weathercode,
      description: getWeatherDescription(cw.weathercode, lang),
      locationName: loc.name,
      isDay: cw.is_day === 1,
    };

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: weatherInfo })
      );
    } catch {
      // Ignore cache storage error
    }

    return weatherInfo;
  } catch (err) {
    console.warn('Could not fetch real weather for location:', query, err);
    return null;
  }
}
