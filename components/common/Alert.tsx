
import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type, children, icon, className }) => {
  let baseClasses = "p-4 rounded-lg shadow-md flex items-start";
  let typeClasses = "";

  switch (type) {
    case 'success':
      typeClasses = "bg-green-600/80 border border-green-500 text-green-100";
      break;
    case 'error':
      typeClasses = "bg-red-600/80 border border-red-500 text-red-100";
      break;
    case 'warning':
      typeClasses = "bg-yellow-500/80 border border-yellow-400 text-yellow-100";
      break;
    case 'info':
    default:
      typeClasses = "bg-sky-600/80 border border-sky-500 text-sky-100";
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`}>
      {icon && <div className="flex-shrink-0 mr-3">{icon}</div>}
      <div className="flex-grow">{children}</div>
    </div>
  );
};
    