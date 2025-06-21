
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15.036-7.126A1.5 1.5 0 014.5 6H6m12 0h1.5a1.5 1.5 0 011.036 2.626m-1.036-2.626L18 6M6 18h1.5a1.5 1.5 0 001.036-2.626m-1.036 2.626L6 18m12-5.25h-1.5m1.5 0a2.25 2.25 0 01-2.25 2.25M16.5 12a2.25 2.25 0 00-2.25-2.25M12 7.5V3m0 18v-4.5m-4.5-3.75h-1.5m1.5 0a2.25 2.25 0 01-2.25 2.25M7.5 12a2.25 2.25 0 00-2.25-2.25" />
  </svg>
);


export const AppNav: React.FC = () => {
  const location = useLocation();
  const linkBaseClass = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClass = "bg-sky-600 text-white";
  const inactiveClass = "text-gray-300 hover:bg-slate-700 hover:text-white";

  return (
    <nav className="flex space-x-2">
      <Link
        to="/"
        className={`${linkBaseClass} ${location.pathname === '/' ? activeClass : inactiveClass}`}
      >
        <HomeIcon />
        <span>Verificar</span>
      </Link>
      <Link
        to="/admin"
        className={`${linkBaseClass} ${location.pathname === '/admin' ? activeClass : inactiveClass}`}
      >
        <CogIcon />
        <span>Admin</span>
      </Link>
    </nav>
  );
};

    