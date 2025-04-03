import React from 'react';

const Footer = () => {
  return (
    <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6 pb-4 flex flex-col items-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
      </div>
      <div className="text-xs sm:text-sm">Interactive Weekly Schedule Planner</div>
    </footer>
  );
};

export default Footer;