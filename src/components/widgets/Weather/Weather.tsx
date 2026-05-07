import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { useViewStore } from '../../../store/viewStore';
import { MapPin, CloudRain, Settings as SettingsIcon } from 'lucide-react';
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
  const { settings } = useWidgetStore();
  const { setActiveView } = useViewStore();
  const { apiKey, city } = settings.weather;
  
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!apiKey || !city) {
    return (
      <WidgetContainer className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <CloudRain size={32} className="text-theme-muted mb-4" />
        <h3 className="text-lg font-bold text-theme-text mb-2">Weather API Not Configured</h3>
        <p className="text-sm text-theme-muted mb-6 leading-relaxed">
          Please add your OpenWeather API key and city to see the weather forecast.
        </p>
        <button 
          onClick={() => setActiveView('settings')}
          className="flex items-center gap-2 px-6 py-3 bg-theme-glass hover:bg-theme-hover text-theme-text transition-all rounded-xl text-sm font-bold tracking-wider uppercase"
        >
          <SettingsIcon size={16} /> Go to Settings
        </button>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer className="w-full h-full relative overflow-hidden flex flex-col justify-between">
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <div className="animate-pulse text-theme-muted font-medium tracking-widest uppercase text-xs">Fetching Radar...</div>
        </div>
      ) : error ? (
        <div className="text-center h-full flex flex-col items-center justify-center min-h-[120px]">
          <p className="text-red-400 text-sm mb-4 font-medium">{error}</p>
          <button 
            onClick={() => setActiveView('settings')} 
            className="flex items-center gap-2 px-4 py-2 bg-theme-glass hover:bg-theme-hover text-theme-text rounded-lg text-xs font-bold uppercase transition-all"
          >
            <SettingsIcon size={14} /> Fix in Settings
          </button>
        </div>
      ) : data ? (
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-theme-muted text-sm mb-1 font-medium tracking-wide">
                <MapPin size={14} />
                <span>{data.name}</span>
              </div>
              <div className="text-6xl font-bold tracking-tighter mt-2 text-theme-text">{Math.round(data.main.temp)}°</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <img 
                src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`} 
                alt={data.weather[0].description}
                className="w-20 h-20 -mr-4 drop-shadow-xl"
              />
              <div className="text-sm font-medium capitalize text-theme-text pr-1">{data.weather[0].description}</div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-theme-border flex gap-4 text-sm font-medium text-theme-muted">
            <div className="flex items-center gap-2">
              <CloudRain size={14} /> {data.main.humidity}% Humidity
            </div>
          </div>
        </div>
      ) : null}
    </WidgetContainer>
  );
};
