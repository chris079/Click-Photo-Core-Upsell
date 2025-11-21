import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 border rounded-md ${error ? 'border-red-500' : 'border-slate-200'} focus:border-[#0047BB] focus:ring-2 focus:ring-[#0047BB]/20 outline-none transition-all bg-white text-slate-900 placeholder-slate-400 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};