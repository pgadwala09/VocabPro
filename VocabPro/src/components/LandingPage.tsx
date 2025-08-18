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
      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-purple-900 mb-12">Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-purple-400">
              <svg className="w-10 h-10 text-purple-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 4v16" /></svg>
              <h3 className="text-lg font-bold text-purple-800 mb-2">Record & Upload Your Voice and Video</h3>
              <p className="text-gray-600 text-center">Capture your speech in real-time and upload videos to refine your delivery, improve vocal pitch, and track your speaking progress.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-blue-400">
              <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              <h3 className="text-lg font-bold text-blue-800 mb-2">Content Generation</h3>
              <p className="text-gray-600 text-center">Generate original and engaging content instantly based on your given title or description — perfect for JAM sessions, debates, or storytelling prompts.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-indigo-400">
              <svg className="w-10 h-10 text-indigo-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
              <h3 className="text-lg font-bold text-indigo-800 mb-2">Speech & Expression Insights</h3>
              <p className="text-gray-600 text-center">Get detailed feedback on your vocal delivery — including clarity, pitch, expression, and word usage — to identify improvement areas and boost your confidence.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-pink-400">
              <svg className="w-10 h-10 text-pink-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
              <h3 className="text-lg font-bold text-pink-800 mb-2">Interactive AI Coach</h3>
              <p className="text-gray-600 text-center">Learn through fun, AI-driven interactions with personalized timers, real-time feedback, and dynamic practice sessions tailored to your pace.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-green-400">
              <svg className="w-10 h-10 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16" /><path d="M8 12l2 2 4-4" /></svg>
              <h3 className="text-lg font-bold text-green-800 mb-2">Smart Spell & Pronounce Tool</h3>
              <p className="text-gray-600 text-center">Practice accurate pronunciation, receive correct spellings, and learn word meanings — all in one interactive experience.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border-t-4 border-yellow-400">
              <svg className="w-10 h-10 text-yellow-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Instant Sharing</h3>
              <p className="text-gray-600 text-center">Automatically share your progress and insights across WhatsApp, Email, Facebook, Twitter, and more — celebrate your wins and stay connected!</p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-96 h-96 bg-purple-400/30 rounded-full blur-3xl absolute -top-32 -left-32"></div>
          <div className="w-96 h-96 bg-blue-400/30 rounded-full blur-3xl absolute -bottom-32 -right-32"></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 drop-shadow-lg">Features</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center border border-white/20 hover:border-purple-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 12V4m0 0L3 9m9-5l9 5" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Record & Upload</h3>
              <p className="text-blue-100 text-center">Capture your speech and upload files to refine your delivery and track your progress.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center border border-white/20 hover:border-blue-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 4v16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Feedback</h3>
              <p className="text-blue-100 text-center">Receive instant, AI-driven feedback on pronunciation, clarity, and word usage.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center border border-white/20 hover:border-indigo-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 4v16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Practice & Progress</h3>
              <p className="text-blue-100 text-center">Practice vocabulary, track your achievements, and celebrate your learning milestones.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-purple-900 mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah" className="w-20 h-20 rounded-full mb-4 border-4 border-blue-200" />
              <p className="text-gray-700 text-center mb-4">“My students' vocabulary retention improved dramatically. The visual associations make learning so much more engaging!”</p>
              <span className="font-bold text-purple-700">Sarah Chen</span>
              <span className="text-sm text-gray-500">ESL Teacher</span>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael" className="w-20 h-20 rounded-full mb-4 border-4 border-purple-200" />
              <p className="text-gray-700 text-center mb-4">“I've tried many vocabulary apps, but this one is different. The images help me remember words I used to forget immediately.”</p>
              <span className="font-bold text-purple-700">Michael Rodriguez</span>
              <span className="text-sm text-gray-500">Language Student</span>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Emily" className="w-20 h-20 rounded-full mb-4 border-4 border-indigo-200" />
              <p className="text-gray-700 text-center mb-4">“The AI's ability to create contextually relevant images is impressive. It's revolutionizing how we approach vocabulary teaching.”</p>
              <span className="font-bold text-purple-700">Dr. Emily Watson</span>
              <span className="text-sm text-gray-500">Linguistics Professor</span>
            </div>
          </div>
        </div>
      </section>
      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Vocab Pro</span>
          <span className="text-gray-500 mt-2 md:mt-0">&copy; {new Date().getFullYear()} Vocab Pro. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 