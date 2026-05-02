import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

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
        {actions.map((action, index) => (
          <div 
            key={index} 
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group"
          >
            <div className="mt-1 sm:mt-0 flex-shrink-0">
              <ArrowRight size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">
                {typeof action === 'string' ? action : action.text}
              </p>
              {typeof action === 'object' && action.metric && (
                <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md uppercase tracking-wider self-start sm:self-auto">
                  {action.metric}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionSuggestions;
