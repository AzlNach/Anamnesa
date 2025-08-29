'use client';

import React from 'react';
import { Heart, Code, Coffee } from 'lucide-react';

const DeveloperFooter = () => {
  return (
    <footer className="w-full mt-auto  border-gray-200 bg-white/50 backdrop-blur-sm">
      <div className="max-w-none w-full px-4 py-8">
        <div className="text-center">
          {/* Developer Info */}
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by</span>
            <a 
              href="https://github.com/AzlNach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Azel (AzlNach)
            </a>
          </div>

          {/* Tech Stack Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Code className="w-4 h-4" />
            <span>Built with Next.js • TypeScript • Tailwind CSS • Google Gemini AI</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <a 
              href="https://github.com/AzlNach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>GitHub</span>
            </a>
            <span className="text-gray-300">•</span>
            <a 
              href="https://www.linkedin.com/in/azlnach-si26" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>LinkedIn</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 border-gray-100 text-xs text-gray-400">
            <p>&copy; 2025 Anamnesa AI. All rights reserved.</p>
            <p className="mt-1">This application is for educational purposes and is not a substitute for professional medical advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DeveloperFooter;
