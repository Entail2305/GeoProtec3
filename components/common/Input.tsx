
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, name, className, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <input
        id={name}
        name={name}
        className={`w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-colors duration-150 ${className}`}
        {...props}
      />
    </div>
  );
};
    