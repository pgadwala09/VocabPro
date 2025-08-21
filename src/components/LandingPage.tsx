import React, { useState } from 'react';
import { X, Menu, Mic, Edit3, TrendingUp, UserCheck, Volume2, Share2, Brain, Sparkles, Target, Zap } from 'lucide-react';
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
              {/* Logo - Top Left with Brain Icon */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Vocab Pro
                </span>
              </div>
              {/* Desktop Navigation - Center */}
              <div className="hidden md:flex items-center space-x-12">
                <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105">
                  Features
                </a>
                <a href="#solutions" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105">
                  Solutions
                </a>
                <a href="#about" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105">
                  Resources
                </a>
                <a href="#contact" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105">
                  Company
                </a>
              </div>
              {/* Login/Sign Up - Top Right */}
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Sign Up
                </button>
              </div>
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700 hover:text-purple-600 transition-all duration-300 hover:scale-105"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-gray-100 rounded-lg mt-4 py-4 mb-8 shadow-lg animate-in slide-in-from-top-2">
                <div className="flex flex-col space-y-4">
                  <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 px-4 hover:bg-purple-50 rounded-lg py-2">
                    Features
                  </a>
                  <a href="#solutions" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 px-4 hover:bg-purple-50 rounded-lg py-2">
                    Solutions
                  </a>
                  <a href="#about" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 px-4 hover:bg-purple-50 rounded-lg py-2">
                    Resources
                  </a>
                  <a href="#contact" className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 px-4 hover:bg-purple-50 rounded-lg py-2">
                    Company
                  </a>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 px-4 text-left hover:bg-purple-50 rounded-lg py-2"
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

      {/* Hero Section with Enhanced Background */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Stories that <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Speak.</span><br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Debates that Dazzle.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 text-center max-w-3xl mb-8 leading-relaxed">
            From scrambled letters to structured arguments, build power through play and performance.
          </p>
          <button className="px-10 py-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-xl shadow-2xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25">
            Start Speaking today!!!
          </button>
        </div>
      </section>

      {/* Why Choose VocabPro Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-200/30 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4">Why Choose VocabPro</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Experience the difference with our innovative learning approach</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Record & Upload */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-purple-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-purple-500">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">Record & Upload Your Voice and Video</h3>
              <p className="text-gray-600 text-center leading-relaxed">Capture your speech in real-time and upload videos to refine your delivery, improve vocal pitch, and track your speaking progress.</p>
            </div>

            {/* Content Generation */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-blue-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-blue-500">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Content Generation</h3>
              <p className="text-gray-600 text-center leading-relaxed">Generate original and engaging content instantly based on your given title or description — perfect for JAM sessions, debates, or storytelling prompts.</p>
            </div>

            {/* Speech & Expression Insights */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-indigo-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-indigo-500">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-indigo-800 mb-4 text-center">Speech & Expression Insights</h3>
              <p className="text-gray-600 text-center leading-relaxed">Get detailed feedback on your vocal delivery — including clarity, pitch, expression, and word usage — to identify improvement areas and boost your confidence.</p>
            </div>

            {/* Interactive AI Coach */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-pink-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-pink-500">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-pink-800 mb-4 text-center">Interactive AI Coach</h3>
              <p className="text-gray-600 text-center leading-relaxed">Learn through fun, AI-driven interactions with personalized timers, real-time feedback, and dynamic practice sessions tailored to your pace.</p>
            </div>

            {/* Smart Spell & Pronounce Tool */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-green-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-green-500">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-4 text-center">Smart Spell & Pronounce Tool</h3>
              <p className="text-gray-600 text-center leading-relaxed">Practice accurate pronunciation, receive correct spellings, and learn word meanings — all in one interactive experience.</p>
            </div>

            {/* Instant Sharing */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border-t-4 border-yellow-400 hover:shadow-2xl hover:scale-105 transition-all duration-500 hover:border-yellow-500">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800 mb-4 text-center">Instant Sharing</h3>
              <p className="text-gray-600 text-center leading-relaxed">Automatically share your progress and insights across WhatsApp, Email, Facebook, Twitter, and more — celebrate your wins and stay connected!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-96 h-96 bg-purple-400/20 rounded-full blur-3xl absolute -top-32 -left-32 animate-pulse"></div>
          <div className="w-96 h-96 bg-blue-400/20 rounded-full blur-3xl absolute -bottom-32 -right-32 animate-pulse delay-1000"></div>
          <div className="w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Zap className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Features</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Powerful tools designed to accelerate your learning journey</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl flex flex-col items-center border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Record & Upload</h3>
              <p className="text-blue-100 text-center leading-relaxed">Capture your speech and upload files to refine your delivery and track your progress with advanced analytics.</p>
            </div>
            
            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl flex flex-col items-center border border-white/20 hover:border-blue-400/50 hover:bg-white/15 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">AI Feedback</h3>
              <p className="text-blue-100 text-center leading-relaxed">Receive instant, AI-driven feedback on pronunciation, clarity, and word usage with personalized recommendations.</p>
            </div>
            
            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-10 shadow-2xl flex flex-col items-center border border-white/20 hover:border-indigo-400/50 hover:bg-white/15 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Practice & Progress</h3>
              <p className="text-blue-100 text-center leading-relaxed">Practice vocabulary, track your achievements, and celebrate your learning milestones with detailed analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-100 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied learners worldwide</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="group bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="w-24 h-24 rounded-full mb-6 overflow-hidden border-4 border-blue-200 group-hover:border-blue-400 transition-colors duration-300">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah" className="w-full h-full object-cover" />
              </div>
              <p className="text-gray-700 text-center mb-6 leading-relaxed text-lg">"My students' vocabulary retention improved dramatically. The visual associations make learning so much more engaging!"</p>
              <span className="font-bold text-purple-700 text-lg">Sarah Chen</span>
              <span className="text-sm text-gray-500">ESL Teacher</span>
            </div>
            
            <div className="group bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="w-24 h-24 rounded-full mb-6 overflow-hidden border-4 border-purple-200 group-hover:border-purple-400 transition-colors duration-300">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael" className="w-full h-full object-cover" />
              </div>
              <p className="text-gray-700 text-center mb-6 leading-relaxed text-lg">"I've tried many vocabulary apps, but this one is different. The images help me remember words I used to forget immediately."</p>
              <span className="font-bold text-purple-700 text-lg">Michael Rodriguez</span>
              <span className="text-sm text-gray-500">Language Student</span>
            </div>
            
            <div className="group bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="w-24 h-24 rounded-full mb-6 overflow-hidden border-4 border-indigo-200 group-hover:border-indigo-400 transition-colors duration-300">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Emily" className="w-full h-full object-cover" />
              </div>
              <p className="text-gray-700 text-center mb-6 leading-relaxed text-lg">"The AI's ability to create contextually relevant images is impressive. It's revolutionizing how we approach vocabulary teaching."</p>
              <span className="font-bold text-purple-700 text-lg">Dr. Emily Watson</span>
              <span className="text-sm text-gray-500">Linguistics Professor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer Section */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Vocab Pro</span>
            </div>
            <span className="text-gray-500 text-lg">&copy; {new Date().getFullYear()} Vocab Pro. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 