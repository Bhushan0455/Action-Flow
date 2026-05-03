import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const API_URL = 'https://action-flow-nrak.onrender.com';

const TrendChart = ({ developerId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!developerId) return;
    
    const fetchTrend = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/trend/${developerId}`);
        if (res.ok) {
          const rawData = await res.json();
          // Transform for recharts: [{ name: "Mon", PRs: 2, Deployments: 1 }]
          const chartData = rawData.dates.map((date, index) => ({
            name: date,
            PRs: rawData.prCounts[index] || 0,
            Deployments: rawData.deployments[index] || 0
          }));
          setData(chartData);
        }
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [developerId]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-500" />
          Productivity Trend
        </h3>
      </div>
      
      <div className="flex-grow min-h-[250px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            Loading chart...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            No activity found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                tickMargin={10} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                name="Merged PRs"
                dataKey="PRs" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                name="Deployments"
                dataKey="Deployments" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
