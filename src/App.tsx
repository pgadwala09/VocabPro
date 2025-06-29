import React, { useState } from 'react';
import { Brain, Menu, X, ArrowRight, BookOpen, Users, MessageSquare, Mic, BarChart3, Trophy, Sparkles, ChevronDown } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const { user, loading } = useAuth();

  // Show dashboard if user is authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user && currentPage !== 'login' && currentPage !== 'signup') {
    return <Dashboard onLogout={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'login') {
    return (
      <LoginPage 
        onBack={() => setCurrentPage('home')}
        onSignupClick={() => setCurrentPage('signup')}
        onLoginSuccess={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignupPage 
        onBack={() => setCurrentPage('home')}
        onLoginClick={() => setCurrentPage('login')}
        onSignupSuccess={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Open_Sans',sans-serif]">
      {/* Header */}
      <header className="relative bg-white shadow-sm overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
        </div>
        
        <nav className="relative z-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20 bg-white">
              {/* Enhanced Logo */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {/* Main logo container with gradient background */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <Brain className="w-7 h-7 text-white" />
                    {/* Sparkle accent */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-lg -z-10"></div>
                </div>
                
                {/* Brand text with enhanced styling */}
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    Vocab
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Pro
                    </span>
                  </span>
                  <span className="text-xs text-gray-500 font-medium tracking-wide">
                    Learn • Practice • Excel
                  </span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-12">
                <div className="relative">
                  <button
                    onMouseEnter={() => setIsFeaturesOpen(true)}
                    onMouseLeave={() => setIsFeaturesOpen(false)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300"
                  >
                    <span>Features</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Features Dropdown */}
                  {isFeaturesOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                      onMouseEnter={() => setIsFeaturesOpen(true)}
                      onMouseLeave={() => setIsFeaturesOpen(false)}
                    >
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
                        Learning Features
                      </div>
                      
                      <a href="#vocabulary" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Vocabulary</div>
                          <div className="text-sm text-gray-500">Build your word power</div>
                        </div>
                      </a>
                      
                      <a href="#jam-sessions" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <Mic className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">JAM Sessions</div>
                          <div className="text-sm text-gray-500">Practice speaking fluently</div>
                        </div>
                      </a>
                      
                      <a href="#debate" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Debate</div>
                          <div className="text-sm text-gray-500">Sharpen your arguments</div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
                
                <a href="#about" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">About</a>
                <a href="#pricing" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Pricing</a>
                <a href="#contact" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Contact</a>
              </div>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentPage('login')}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300"
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentPage('signup')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Get Started
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-300"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-4 py-6 space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Features</div>
                  <a href="#vocabulary" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors duration-200">
                    <BookOpen className="w-5 h-5" />
                    <span>Vocabulary</span>
                  </a>
                  <a href="#jam-sessions" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">
                    <Mic className="w-5 h-5" />
                    <span>JAM Sessions</span>
                  </a>
                  <a href="#debate" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200">
                    <MessageSquare className="w-5 h-5" />
                    <span>Debate</span>
                  </a>
                </div>
                
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">About</a>
                  <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Pricing</a>
                  <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Contact</a>
                </div>
                
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <button 
                    onClick={() => setCurrentPage('login')}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setCurrentPage('signup')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-4 h-4 bg-purple-400/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/6 w-6 h-6 bg-blue-400/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-purple-300/20 rounded-full animate-pulse delay-1500"></div>
          <div className="absolute top-1/6 right-1/3 w-2 h-2 bg-blue-300/20 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-indigo-300/20 rounded-full animate-pulse delay-1200"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Stories that <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Speak</span>.
              <br />
              Debates that <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Dazzle</span>.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Master the art of communication with AI-powered vocabulary building, 
              interactive storytelling, and dynamic debate practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => setCurrentPage('signup')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Start Your Journey
              </button>
              <button className="flex items-center space-x-3 text-white hover:text-purple-300 transition-colors duration-300 group">
                <span className="text-lg font-semibold">Watch Demo</span>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Benefits for Speaking Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your communication skills with our comprehensive platform designed for modern learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vocabulary Building */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Vocabulary</h3>
              <p className="text-gray-600 leading-relaxed">
                Build your word power with AI-curated vocabulary lists, contextual learning, and spaced repetition techniques.
              </p>
            </div>

            {/* Interactive Stories */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">JAM Sessions</h3>
              <p className="text-gray-600 leading-relaxed">
                Practice speaking through interactive storytelling sessions that adapt to your skill level and interests.
              </p>
            </div>

            {/* Debate Practice */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dynamic Debates</h3>
              <p className="text-gray-600 leading-relaxed">
                Sharpen your argumentation skills with AI-powered debate partners and real-time feedback on your performance.
              </p>
            </div>

            {/* Speech Analysis */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Speech Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Get detailed feedback on pronunciation, pace, and clarity with advanced speech recognition technology.
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track your progress with detailed analytics and personalized insights to optimize your learning journey.
              </p>
            </div>

            {/* Achievements */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Achievement System</h3>
              <p className="text-gray-600 leading-relaxed">
                Stay motivated with badges, streaks, and milestones that celebrate your communication achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-xl text-purple-100 mb-12">
            Join thousands of learners who have already improved their speaking skills with Vocab Pro
          </p>
          <button 
            onClick={() => setCurrentPage('signup')}
            className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Start Learning Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">VocabPro</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering learners worldwide to master the art of communication through innovative AI-powered tools.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#vocabulary" className="hover:text-white transition-colors duration-300">Vocabulary</a></li>
                <li><a href="#jam-sessions" className="hover:text-white transition-colors duration-300">JAM Sessions</a></li>
                <li><a href="#debate" className="hover:text-white transition-colors duration-300">Debate</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors duration-300">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors duration-300">About</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors duration-300">Contact</a></li>
                <li><a href="#support" className="hover:text-white transition-colors duration-300">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VocabPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;