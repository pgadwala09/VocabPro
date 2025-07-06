import React, { useState } from 'react';
import { X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-['Open_Sans',sans-serif]">
      {/* Header with Complete White Background */}
      <header className="relative bg-white shadow-sm overflow-hidden">
        {/* Navigation */}
        <nav className="relative z-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20 bg-white">
              {/* Logo - Top Left (No Icon) */}
              <div className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Vocab Pro
                </span>
              </div>
              {/* Desktop Navigation - Center */}
              <div className="hidden md:flex items-center space-x-12">
                <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">
                  Features
                </a>
                <a href="#solutions" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">
                  Solutions
                </a>
                <a href="#about" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">
                  Resources
                </a>
                <a href="#contact" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">
                  Company
                </a>
              </div>
              {/* Login/Sign Up - Top Right */}
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign Up
                </button>
              </div>
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-gray-100 rounded-lg mt-4 py-4 mb-8 shadow-lg">
                <div className="flex flex-col space-y-4">
                  <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 px-4">
                    Features
                  </a>
                  <a href="#solutions" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 px-4">
                    Solutions
                  </a>
                  <a href="#about" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 px-4">
                    Resources
                  </a>
                  <a href="#contact" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 px-4">
                    Company
                  </a>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 px-4 text-left"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-left"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <h1 className="text-5xl md:text-6xl font-bold text-white text-center mt-24 mb-6">
          Stories that Speak.<br />
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Debates that Dazzle.</span>
        </h1>
        <p className="text-xl text-gray-200 text-center max-w-2xl mb-8">
          From scrambled letters to structured arguments, build power through play and performance.
        </p>
        <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
          Start Speaking today!!!
        </button>
      </section>
    </div>
  );
};

export default LandingPage; 