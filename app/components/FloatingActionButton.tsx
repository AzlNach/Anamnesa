'use client';

import React, { useState } from 'react';
import { Github, Linkedin, User, X } from 'lucide-react';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const socialLinks = [
    {
      icon: Github,
      label: 'GitHub',
      url: 'https://github.com/AzlNach',
      bgColor: 'bg-gray-800 hover:bg-gray-900',
      textColor: 'text-white'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/azlnach-si26',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Social Links */}
      <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="flex flex-col gap-3">
          {socialLinks.map((link, index) => (
            <div
              key={link.label}
              className="relative"
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
              }}
            >
              {/* Tooltip */}
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {link.label}
                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
              
              {/* Social Button */}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${link.bgColor} ${link.textColor}`}
              >
                <link.icon size={20} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700 rotate-0'
        } text-white focus:outline-none focus:ring-4 focus:ring-blue-300`}
        aria-label={isOpen ? 'Close social menu' : 'Open social menu'}
      >
        {isOpen ? (
          <X size={24} className="transform rotate-45" />
        ) : (
          <User size={24} />
        )}
      </button>

      {/* Developer Badge */}
      <div className={`absolute bottom-0 right-16 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
      }`}>
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
          <div className="text-sm font-medium text-gray-900">Azel</div>
          <div className="text-xs text-gray-500">Full Stack Developer</div>
        </div>
        {/* Arrow pointing to FAB */}
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
      </div>
    </div>
  );
};

export default FloatingActionButton;
