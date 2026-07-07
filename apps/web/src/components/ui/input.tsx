import React, { forwardRef, InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl overflow-hidden">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border bg-slate-900/60 text-white placeholder-slate-500
              transition-all duration-300 ease-in-out
              outline-none
              ${Icon ? 'pl-11' : 'pl-4'}
              ${error 
                ? 'border-rose-500/50 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20' 
                : 'border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
              }
              ${className}
            `}
            style={{
              boxShadow: !error ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' : undefined
            }}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs font-medium text-rose-500 mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
