import React from 'react';
import { Activity, Clock, Bug, GitCommit, GitPullRequest } from 'lucide-react';

const getStatusColor = (metric, value) => {
  if (metric === 'Lead Time for Changes') {
    if (value < 2) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (value <= 5) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  }
  if (metric === 'Cycle Time') {
    if (value < 2) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (value <= 4) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  }
  if (metric === 'Bug Rate') {
    if (value < 5) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (value <= 15) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  }
  if (metric === 'Deployment Freq') {
    if (value > 4) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (value >= 2) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  }
  if (metric === 'PR Throughput') {
    if (value > 8) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (value >= 4) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  }
  return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
};

const MetricCard = ({ title, value, unit, icon: Icon }) => {
  const statusColorClass = getStatusColor(title, value);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${statusColorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const MetricsCards = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <MetricCard 
        title="Lead Time for Changes" 
        value={metrics.leadTime} 
        unit="days" 
        icon={Clock} 
      />
      <MetricCard 
        title="Cycle Time" 
        value={metrics.cycleTime} 
        unit="days" 
        icon={Activity} 
      />
      <MetricCard 
        title="Bug Rate" 
        value={metrics.bugRate} 
        unit="%" 
        icon={Bug} 
      />
      <MetricCard 
        title="Deployment Freq" 
        value={metrics.deploymentFrequency} 
        unit="/mo" 
        icon={GitCommit} 
      />
      <MetricCard 
        title="PR Throughput" 
        value={metrics.prThroughput} 
        unit="/mo" 
        icon={GitPullRequest} 
      />
    </div>
  );
};

export default MetricsCards;
