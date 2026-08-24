'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, Eye, CloudLightning, Brain, Sprout, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Capsicum', 'Okra'];

const DEMO_FORECAST = [
  { day: 'Today', condition: 'sunny', tempHigh: 32, tempLow: 22, humidity: 65, wind: 12, rain: 0 },
  { day: 'Tomorrow', condition: 'partly_cloudy', tempHigh: 30, tempLow: 21, humidity: 70, wind: 15, rain: 10 },
  { day: 'Day 3', condition: 'cloudy', tempHigh: 28, tempLow: 20, humidity: 78, wind: 18, rain: 30 },
  { day: 'Day 4', condition: 'rainy', tempHigh: 25, tempLow: 19, humidity: 88, wind: 22, rain: 80 },
  { day: 'Day 5', condition: 'partly_cloudy', tempHigh: 29, tempLow: 20, humidity: 72, wind: 14, rain: 15 },
];

const DEMO_CURRENT = { temp: 31, feelsLike: 33, humidity: 65, wind: 12, condition: 'Partly Cloudy', uv: 7, visibility: 10 };

const DEMO_ADVICE = {
  growing: 'Current temperature and humidity are suitable for Tomato cultivation. Ensure consistent watering. Consider mulching to retain soil moisture.',
  harvesting: 'Good conditions for harvesting today. Low rainfall expected. Harvest in the early morning for best freshness.',
  selling: 'Favorable weather may increase local market demand. Transport conditions are good with minimal rain risk.',
};

const DEMO_CLIMATE = {
  tempRange: '20-30°C', rainfall: '600-1200 mm', humidity: '60-80%', soil: 'Well-drained loamy soil', ph: '6.0-6.8', season: 'Kharif (June-Sept), Rabi (Oct-Feb)',
};

const conditionIcon = (c: string) => {
  switch (c) {
    case 'sunny': return <Sun className="h-8 w-8 text-yellow-400" />;
    case 'partly_cloudy': return <Cloud className="h-8 w-8 text-gray-400" />;
    case 'cloudy': return <Cloud className="h-8 w-8 text-gray-500" />;
    case 'rainy': return <CloudRain className="h-8 w-8 text-blue-500" />;
    case 'stormy': return <CloudLightning className="h-8 w-8 text-purple-500" />;
    default: return <Sun className="h-8 w-8 text-yellow-400" />;
  }
};

export default function WeatherFarming() {
  const { showToast } = useAppStore();
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState(DEMO_FORECAST);
  const [current, setCurrent] = useState(DEMO_CURRENT);
  const [advice, setAdvice] = useState(DEMO_ADVICE);
  const [climateGuide, setClimateGuide] = useState(DEMO_CLIMATE);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather?crop=${selectedCrop}`);
        const data = await res.json();
        if (data && data.current) {
          setCurrent(data.current);
          setForecast(data.forecast || DEMO_FORECAST);
          setAdvice(data.advice || DEMO_ADVICE);
          setClimateGuide(data.climateGuide || DEMO_CLIMATE);
        }
      } catch {
        // Use demo data
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [selectedCrop]);

  const hasRainAlert = forecast.some((f) => f.rain > 50);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Weather & Farming</h1>
          <p className="text-gray-500 mt-1">Weather insights and AI farming recommendations</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger><Sprout className="h-4 w-4 mr-2 text-green-600" /><SelectValue /></SelectTrigger>
            <SelectContent>{CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Rain Alert */}
      {hasRainAlert && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Rain Alert</p>
            <p className="text-sm text-blue-600">Heavy rain expected in the next 3-4 days. Consider harvesting ripe produce before the rain to prevent damage.</p>
          </div>
        </motion.div>
      )}

      {/* Current Weather */}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/80 rounded-2xl p-3 shadow-sm">{conditionIcon('partly_cloudy')}</div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900">{current.temp}°C</h2>
                  <p className="text-gray-500">Feels like {current.feelsLike}°C · {current.condition}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center"><Thermometer className="h-5 w-5 mx-auto text-red-400 mb-1" /><p className="text-xs text-gray-500">Temp</p><p className="text-sm font-semibold">{current.temp}°C</p></div>
                <div className="text-center"><Droplets className="h-5 w-5 mx-auto text-blue-400 mb-1" /><p className="text-xs text-gray-500">Humidity</p><p className="text-sm font-semibold">{current.humidity}%</p></div>
                <div className="text-center"><Wind className="h-5 w-5 mx-auto text-gray-400 mb-1" /><p className="text-xs text-gray-500">Wind</p><p className="text-sm font-semibold">{current.wind} km/h</p></div>
                <div className="text-center"><Eye className="h-5 w-5 mx-auto text-gray-400 mb-1" /><p className="text-xs text-gray-500">Visibility</p><p className="text-sm font-semibold">{current.visibility} km</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5-Day Forecast */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">5-Day Forecast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) :
            forecast.map((day, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">{day.day}</p>
                    <div className="flex justify-center mb-2">{conditionIcon(day.condition)}</div>
                    <p className="font-bold text-gray-900">{day.tempHigh}°<span className="text-gray-400 font-normal">/{day.tempLow}°</span></p>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500"><Droplets className="h-3 w-3" />{day.rain}%</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Farming Advisor */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Brain className="h-5 w-5 text-green-600" /> AI Farming Advisor</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : (
              <>
                <div className="bg-green-50 rounded-lg p-3"><p className="text-xs font-medium text-green-700 mb-1">🌱 Growing</p><p className="text-sm text-gray-700">{advice.growing}</p></div>
                <div className="bg-yellow-50 rounded-lg p-3"><p className="text-xs font-medium text-yellow-700 mb-1">🌾 Harvesting</p><p className="text-sm text-gray-700">{advice.harvesting}</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-medium text-blue-700 mb-1">💰 Selling</p><p className="text-sm text-gray-700">{advice.selling}</p></div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Crop Climate Guide */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Sprout className="h-5 w-5 text-green-600" /> {selectedCrop} Climate Guide</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(climateGuide).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
