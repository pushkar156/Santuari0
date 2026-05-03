import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { MapPin, Settings } from 'lucide-react';
import { WidgetContainer } from '../../layout/WidgetContainer';

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  name: string;
}

export const Weather: React.FC = () => {
  const { settings, updateWeatherSettings } = useWidgetStore();
  const { apiKey, city } = settings.weather;
  
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    if (apiKey && city) {
      fetchWeather();
    }
  }, [apiKey, city]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error fetching weather data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeatherSettings({ apiKey: tempKey, city: tempCity });
    setIsSettingUp(false);
  };

  if (!apiKey || isSettingUp) {
    return (
      <WidgetContainer className="w-full max-w-sm mx-auto">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Settings size={20} /> Weather Setup
        </h3>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">OpenWeatherMap API Key</label>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full bg-black/20 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/50"
              placeholder="Enter API Key"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">City</label>
            <input
              type="text"
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              className="w-full bg-black/20 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/50"
              placeholder="e.g. London"
            />
          </div>
          <button type="submit" className="mt-2 bg-white/20 hover:bg-white/30 transition-colors py-2 rounded text-sm font-medium">
            Save Settings
          </button>
          {!apiKey && (
            <p className="text-[10px] text-white/40 mt-1">
              Get a free key at <a href="https://openweathermap.org/" target="_blank" rel="noreferrer" className="underline">openweathermap.org</a>
            </p>
          )}
        </form>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer className="group relative w-full max-w-sm mx-auto overflow-hidden">
      <button 
        onClick={() => setIsSettingUp(true)}
        className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <Settings size={16} />
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-pulse text-white/50">Loading weather...</div>
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button onClick={() => setIsSettingUp(true)} className="text-xs underline text-white/60 hover:text-white">
            Fix Settings
          </button>
        </div>
      ) : data ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-white/60 text-sm mb-1">
                <MapPin size={14} />
                <span>{data.name}</span>
              </div>
              <div className="text-4xl font-bold">{Math.round(data.main.temp)}°</div>
            </div>
            <div className="text-right">
              <img 
                src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`} 
                alt={data.weather[0].description}
                className="w-16 h-16 -mr-2"
              />
              <div className="text-sm capitalize text-white/80">{data.weather[0].description}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs text-white/60">
            <div>Humidity: {data.main.humidity}%</div>
          </div>
        </div>
      ) : null}
    </WidgetContainer>
  );
};
