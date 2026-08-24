'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart3, Brain, Sprout,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Capsicum', 'Okra'];

const DEMO_CHART_DATA = [
  { month: 'Jan', historical: 350, predicted: 380, planned: 360 },
  { month: 'Feb', historical: 400, predicted: 420, planned: 390 },
  { month: 'Mar', historical: 380, predicted: 450, planned: 410 },
  { month: 'Apr', historical: 420, predicted: 480, planned: 400 },
  { month: 'May', historical: 450, predicted: 520, planned: 460 },
  { month: 'Jun', historical: 500, predicted: 550, planned: 480 },
  { month: 'Jul', historical: 480, predicted: 580, planned: 500 },
  { month: 'Aug', historical: 460, predicted: 560, planned: 470 },
  { month: 'Sep', historical: 420, predicted: 500, planned: 440 },
  { month: 'Oct', historical: 400, predicted: 460, planned: 410 },
  { month: 'Nov', historical: 380, predicted: 430, planned: 390 },
  { month: 'Dec', historical: 360, predicted: 400, planned: 370 },
];

interface DemandData {
  predictedDemand: number;
  changePercent: number;
  aiExplanation: string;
  chartData?: typeof DEMO_CHART_DATA;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{p.value} kg</span>
        </div>
      ))}
    </div>
  );
}

export default function DemandForecast() {
  const { showToast } = useAppStore();
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DemandData | null>(null);
  const [chartData, setChartData] = useState(DEMO_CHART_DATA);

  useEffect(() => {
    const fetchDemand = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/demand?crop=${selectedCrop}`);
        const json = await res.json();
        if (json && json.predictedDemand !== undefined) {
          setData(json);
          if (json.chartData && json.chartData.length > 0) {
            setChartData(json.chartData);
          } else {
            setChartData(DEMO_CHART_DATA);
          }
        } else {
          setData({
            predictedDemand: 480,
            changePercent: 20,
            aiExplanation: `Demand for ${selectedCrop} is expected to increase because historical demand is higher during this period and current weather conditions may increase local purchases. Market trends also suggest a seasonal uptick in ${selectedCrop.toLowerCase()} consumption across the region.`,
          });
          setChartData(DEMO_CHART_DATA);
        }
      } catch {
        setData({
          predictedDemand: 480,
          changePercent: 20,
          aiExplanation: `Demand for ${selectedCrop} is expected to increase because historical demand is higher during this period and current weather conditions may increase local purchases.`,
        });
        setChartData(DEMO_CHART_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchDemand();
  }, [selectedCrop]);

  const isUp = (data?.changePercent ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Demand Forecast</h1>
          <p className="text-gray-500 mt-1">AI-powered demand prediction for your crops</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger><Sprout className="h-4 w-4 mr-2 text-green-600" /><SelectValue /></SelectTrigger>
            <SelectContent>{CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Predicted Demand</p>
            {loading ? <Skeleton className="h-8 w-24 mt-1" /> : (
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.predictedDemand ?? '-'} kg</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Change vs Usual</p>
            {loading ? <Skeleton className="h-8 w-28 mt-1" /> : (
              <div className="flex items-center gap-1.5 mt-1">
                {isUp ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                <span className={`text-2xl font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>{isUp ? '↑' : '↓'} {Math.abs(data?.changePercent ?? 0)}%</span>
                <span className="text-sm text-gray-400">{isUp ? 'higher' : 'lower'} than usual</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Trend</p>
            <div className="flex items-center gap-2 mt-1">
              <BarChart3 className="h-5 w-5 text-green-600" />
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <Badge className={isUp ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'} variant="secondary">
                  {isUp ? 'Upward' : 'Downward'} Trend
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold">Demand Over Time</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" unit=" kg" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="historical" name="Historical Demand" stroke="#9ca3af" strokeWidth={2} fill="url(#historicalGrad)" />
                <Area type="monotone" dataKey="predicted" name="AI Predicted Demand" stroke="#16a34a" strokeWidth={2.5} fill="url(#predictedGrad)" />
                <Area type="monotone" dataKey="planned" name="Planned Supply" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" fill="url(#plannedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-400 rounded" /> Historical</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-600 rounded" /> AI Predicted</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 rounded border-dashed" style={{ borderTop: '2px dashed #3b82f6', height: 0 }} /> Planned Supply</span>
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
        <CardContent className="p-5 flex gap-3">
          <Brain className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Analysis</h3>
            {loading ? <Skeleton className="h-12 w-full" /> : (
              <p className="text-sm text-gray-600 leading-relaxed">{data?.aiExplanation || 'AI analysis is being generated...'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
