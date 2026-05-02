import React from 'react';
import { Lightbulb } from 'lucide-react';

const InsightsPanel = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/40 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-indigo-100 dark:text-indigo-900/20 opacity-50">
        <Lightbulb size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Performance Insights</h2>
        </div>
        <p className="text-indigo-800 dark:text-indigo-200 text-lg leading-relaxed max-w-3xl font-medium">
          {insight}
        </p>
      </div>
    </div>
  );
};

export default InsightsPanel;
