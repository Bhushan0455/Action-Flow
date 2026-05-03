import React, { useState, useEffect } from 'react';
import MetricsCards from './MetricsCards';
import InsightsPanel from './InsightsPanel';
import ActionSuggestions from './ActionSuggestions';
import TrendChart from './TrendChart';
import { RefreshCw, Code2 } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [developerId, setDeveloperId] = useState('');

  const API_URL = 'https://action-flow-nrak.onrender.com';

  const fetchDevelopers = async () => {
    try {
      const res = await fetch(`${API_URL}/developers`);
      if (res.ok) {
        const data = await res.json();
        setDevelopers(data);
        if (data.length > 0) {
          setDeveloperId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
    }
  };

  const fetchData = async () => {
    if (!developerId) return;
    setLoading(true);
    try {
      const [metricsRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/metrics/${developerId}`).catch(() => null),
        fetch(`${API_URL}/insights/${developerId}`).catch(() => null)
      ]);

      if (metricsRes && insightsRes) {
        setMetrics(await metricsRes.json());
        setInsights(await insightsRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [developerId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Code2 size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Action Flow</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <select 
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.team})
                  </option>
                ))}
                {developers.length === 0 && <option value="">Loading...</option>}
              </select>
              
              <button 
                onClick={fetchData}
                className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? "animate-spin text-indigo-500" : ""} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Analyzing metrics...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Performance Overview</h2>
              <p className="text-slate-500 dark:text-slate-400">Your development performance metrics.</p>
            </div>
            
            <MetricsCards metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col">
                <InsightsPanel insight={insights?.insight} />
                <ActionSuggestions actions={insights?.actions} />
              </div>
              
              <div className="space-y-6">
                <TrendChart developerId={developerId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
