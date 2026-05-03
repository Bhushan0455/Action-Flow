import React from 'react';
import { Target } from 'lucide-react';

const ActionSuggestions = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
          <Target size={20} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Actionable Next Steps</h2>
      </div>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const stepNumber = typeof action === 'object' && action.step ? action.step : index + 1;
          const actionText = typeof action === 'string' ? action : action.text;
          const metricTag = typeof action === 'object' ? action.metric : null;
          
          return (
            <div 
              key={index} 
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-slate-700/80 transition-all duration-200 group"
            >
              {/* Step Number Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-200 dark:border-emerald-800 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 dark:group-hover:bg-emerald-600 dark:group-hover:border-emerald-600 transition-all duration-200">
                {stepNumber}
              </div>
              
              {/* Action Content */}
              <div className="flex-grow flex flex-col gap-2 min-w-0">
                <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                  {actionText}
                </p>
                {metricTag && (
                  <span className="inline-flex items-center self-start px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                    {metricTag}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionSuggestions;
