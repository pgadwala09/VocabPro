import React, { useState } from 'react';
import { Play, BookOpen, Zap, Users, Star, Brain, Image, Lightbulb, Target, ChevronDown, ChevronUp, Menu, X, Mic, FileText, BarChart3, Bot, SpellCheck as Spell, Share2, Upload, MessageSquare, HelpCircle, CreditCard, MoreHorizontal, Edit3, TrendingUp, UserCheck, Volume2, Monitor, Smartphone, Tablet, ArrowDown, Activity, Video, BarChart, Sparkles, Twitter, Instagram, Youtube, Linkedin, Github } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

function App() {
  const [playingVideo, setPlayingVideo] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const mainFeatures = [
    {
      icon: <Mic className="w-8 h-8 text-white" />,
      title: "Record & Upload Your Voice and Video",
      description: "Capture your speech in real-time and upload videos to refine your delivery, improve vocal pitch, and track your speaking progress."
    },
    {
      icon: <Edit3 className="w-8 h-8 text-white" />,
      title: "Content Generation",
      description: "Generate original and engaging content instantly based on your given title or description. Perfect for JAM sessions, Debates and Story Telling."
    }
  ];

  const additionalFeatures = [
    {
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: "Speech and Expression Insights",
      description: "Receive detailed AI-driven feedback on clarity, pitch, word usage, and expression — helping you grow into a confident communicator."
    },
    {
      icon: <UserCheck className="w-6 h-6 text-white" />,
      title: "Interactive AI Coach",
      description: "Practice with a smart, fun coach that gives you personalized timers, real-time corrections, and session feedback tailored to your pace."
    },
    {
      icon: <Volume2 className="w-6 h-6 text-white" />,
      title: "Smart Spell & Pronounce Tool",
      description: "Master pronunciation, learn correct spellings, and discover word meanings through an all-in-one interactive vocabulary tool."
    },
    {
      icon: <Share2 className="w-6 h-6 text-white" />,
      title: "Instant Sharing",
      description: "Share your progress instantly on WhatsApp, Email, Facebook, Twitter, and more — celebrate milestones and stay motivated with your community."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "ESL Teacher",
      image: "https://images.pexels.com/photos/3782806/pexels-photo-3782806.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      text: "My students' vocabulary retention improved dramatically. The visual associations make learning so much more engaging!"
    },
    {
      name: "Michael Rodriguez",
      role: "Language Student",
      image: "https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      text: "I've tried many vocabulary apps, but this one is different. The images help me remember words I used to forget immediately."
    },
    {
      name: "Dr. Emily Watson",
      role: "Linguistics Professor",
      image: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      text: "The AI's ability to create contextually relevant images is impressive. It's revolutionizing how we approach vocabulary teaching."
    }
  ];

  const faqs = [
    {
      question: "How does the AI generate images for vocabulary words?",
      answer: "Our advanced AI analyzes the meaning, context, and usage of each vocabulary word, then creates custom images that best represent the concept. The system uses state-of-the-art image generation technology to produce unique, relevant visuals for every word."
    },
    {
      question: "Is this suitable for all English proficiency levels?",
      answer: "Absolutely! Our adaptive learning system automatically adjusts to your current level, from beginner to advanced. The AI customizes both the vocabulary selection and image complexity to match your learning needs."
    },
    {
      question: "Can I use this for specific vocabulary sets like TOEFL or IELTS?",
      answer: "Yes! We offer specialized vocabulary sets for major English exams including TOEFL, IELTS, GRE, and more. You can also create custom word lists for specific subjects or interests."
    },
    {
      question: "How much does it cost?",
      answer: "We offer a free tier with 50 words per month, plus premium plans starting at $9.99/month for unlimited access, advanced features, and priority support."
    },
    {
      question: "Does it work offline?",
      answer: "The app requires an internet connection for generating new images, but you can review your saved vocabulary and images offline. Premium users get enhanced offline capabilities."
    },
    {
      question: "How is this different from other vocabulary apps?",
      answer: "Unlike traditional apps that use generic stock photos, our AI creates unique, contextually relevant images for each word. This personalized approach significantly improves memory retention and makes learning more engaging."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

  if (showSignup) {
    return <SignupPage onBack={() => setShowSignup(false)} />;
  }

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
                  onClick={() => setShowLogin(true)}
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300"
                >
                  Login
                </button>
                <button 
                  onClick={() => setShowSignup(true)}
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
                  <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300 text-left"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => setShowSignup(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 w-full"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Curved Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 md:h-20"
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C480,80 960,80 1440,0 L1440,80 L0,80 Z"
              fill="#7c3aed"
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </header>

      {/* Hero Section - Centered, Full Width & Height */}
      <section className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center relative overflow-hidden -mt-16 md:-mt-20 pt-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Stories that Speak. <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Debates that Dazzle.
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              From scrambled letters to structured arguments, build power through play and performance.
            </p>
            
            {/* Single Call to Action */}
            <div className="flex justify-center items-center pt-8">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-5 rounded-lg font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                Start Speaking today!!!
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cartoon Character Section - Debates and Speaking */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Cartoon Illustration */}
            <div className="relative order-2 lg:order-1">
              <div className="relative">
                {/* Main Character Container */}
                <div className="relative bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 rounded-3xl p-12 shadow-2xl">
                  {/* Cartoon Character - Using a debate/speaking themed image */}
                  <div className="relative">
                    <img 
                      src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600&h=500&fit=crop"
                      alt="Animated character engaged in debate and speaking"
                      className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    />
                    
                    {/* Speech Bubbles */}
                    <div className="absolute -top-8 -left-8 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl animate-bounce">
                      💬 "Great point!"
                    </div>
                    <div className="absolute -top-4 -right-8 bg-green-400 text-green-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl animate-bounce delay-300">
                      🎯 "I disagree because..."
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-purple-400 text-purple-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl animate-bounce delay-500">
                      🌟 "Let me explain..."
                    </div>
                  </div>

                  {/* Floating Debate Elements */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg animate-pulse">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg animate-pulse delay-700">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute -z-10 -top-8 -left-8 w-32 h-32 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -z-10 -bottom-8 -right-8 w-24 h-24 bg-blue-200 rounded-full opacity-60 animate-pulse delay-1000"></div>
                <div className="absolute -z-10 top-1/2 -right-12 w-16 h-16 bg-yellow-200 rounded-full opacity-60 animate-pulse delay-500"></div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold">
                  <Brain className="w-5 h-5" />
                  <span>Interactive Learning</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Master the Art of 
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Debate & Discussion</span>
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform your communication skills through engaging debates, storytelling sessions, and interactive speaking challenges. Our AI-powered platform makes learning fun and effective!
                </p>
              </div>
              
              {/* Feature Highlights */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Real-time Feedback</h4>
                    <p className="text-gray-600">Get instant AI-powered suggestions to improve your arguments</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Structured Practice</h4>
                    <p className="text-gray-600">Follow guided exercises to build confidence step by step</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Community Challenges</h4>
                    <p className="text-gray-600">Join debates with learners worldwide and showcase your skills</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Join the Debate Arena
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-purple-400/30 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/6 w-4 h-4 bg-blue-400/30 rounded-full animate-ping delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-yellow-400/30 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-green-400/30 rounded-full animate-ping delay-1500"></div>
        </div>
      </section>

      {/* Features Section - Redesigned to Match Reference */}
      <section id="features" className="py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for 
              <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent"> Speaking Success</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your communication skills with our comprehensive AI-powered platform designed for modern learners
            </p>
          </div>
          
          {/* Main Features - Large Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-gray-800/40 backdrop-blur-lg p-8 rounded-3xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>

          {/* Additional Features - Smaller Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-gray-800/30 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/40 hover:border-purple-500/40 transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-purple-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/6 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-indigo-400/30 rounded-full animate-pulse delay-500"></div>
        </div>
      </section>

      {/* Platform Availability Section - Simple White Background */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Available on All Your Devices
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Access Vocab Pro anywhere, anytime. Seamless sync across all platforms ensures your learning never stops.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {/* Desktop */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Monitor className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Desktop</h3>
              <p className="text-gray-600 leading-relaxed">
                Full-featured experience on Windows, Mac, and Linux. Perfect for in-depth practice sessions and detailed analysis.
              </p>
            </div>
            
            {/* Android */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Smartphone className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Android</h3>
              <p className="text-gray-600 leading-relaxed">
                Native Android app with offline capabilities. Practice on-the-go with voice recording and instant feedback.
              </p>
            </div>
            
            {/* iOS */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Tablet className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">iOS</h3>
              <p className="text-gray-600 leading-relaxed">
                Optimized for iPhone and iPad. Seamless integration with iOS features for the best mobile learning experience.
              </p>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              Download for Desktop
            </button>
            <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              Get on Google Play
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              Download on App Store
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section - Clean Vertical Workflow */}
      <section id="solutions" className="py-32 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-4 h-4 bg-purple-400/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/6 w-6 h-6 bg-blue-400/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-purple-300/20 rounded-full animate-pulse delay-1500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              How It 
              <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent"> Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our revolutionary 4-step process transforms communication learning into an engaging experience that builds confidence and skills
            </p>
          </div>
          
          {/* Vertical Workflow Container */}
          <div className="max-w-2xl mx-auto">
            {/* Vertical Flow with Connecting Line */}
            <div className="relative">
              {/* Vertical Connecting Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 via-indigo-500 to-purple-500 transform -translate-x-1/2 rounded-full shadow-lg"></div>
              
              <div className="space-y-16">
                {/* Step 1: Choose Your Activity */}
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:border-purple-400/50 transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Activity className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors duration-300">
                        Choose Your Activity
                      </h3>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        Select from a range of resources — vocabulary practice, JAM sessions, debates, or storytelling prompts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ArrowDown className="w-6 h-6 text-purple-300 animate-bounce" />
                  </div>
                </div>
                
                {/* Step 2: Create and Upload */}
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:border-blue-400/50 transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Video className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">
                        Create and Upload
                      </h3>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        Record your voice or video, upload existing files, or auto-generate creative content using AI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ArrowDown className="w-6 h-6 text-blue-300 animate-bounce delay-300" />
                  </div>
                </div>

                {/* Step 3: Analyze Your Performance */}
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:border-indigo-400/50 transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <BarChart className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-200 transition-colors duration-300">
                        Analyze Your Performance
                      </h3>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        Receive a smart summary with insights on pitch, clarity, expression, and areas for improvement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ArrowDown className="w-6 h-6 text-indigo-300 animate-bounce delay-600" />
                  </div>
                </div>

                {/* Step 4: Share & Shine */}
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:border-purple-400/50 transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors duration-300">
                        Share & Shine
                      </h3>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        Publish your progress and share your insights across social platforms or directly with mentors and friends
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of learners who have transformed their vocabulary learning experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-purple-100"
                  />
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Modern Design with Purple/Blue Tones */}
      <section className="py-32 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-4 h-4 bg-purple-400/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/6 w-6 h-6 bg-blue-400/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-purple-300/20 rounded-full animate-pulse delay-1500"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Frequently Asked 
              <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent"> Questions</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about Vocab Pro and how it transforms your learning experience
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="group relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-purple-400/50 transition-all duration-500 overflow-hidden"
              >
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none group-hover:bg-white/5 transition-colors duration-300"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-bold text-white text-lg group-hover:text-purple-200 transition-colors duration-300 pr-4">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    {openFAQ === index ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <ChevronUp className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-blue-500 transition-all duration-300">
                        <ChevronDown className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-300" />
                      </div>
                    )}
                  </div>
                </button>
                
                {openFAQ === index && (
                  <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="border-t border-white/10 pt-6">
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - White Background with Modern Layout */}
      <footer id="contact" className="bg-white py-20 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Vocab Pro
              </span>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transforming communication skills through AI-powered learning experiences that build confidence and expertise
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Useful Links */}
            <div>
              <h3 className="text-lg font-bold text-purple-600 mb-6">Useful Links</h3>
              <div className="space-y-4">
                <a href="#contact" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Contact us
                </a>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-bold text-purple-600 mb-6">Features</h3>
              <div className="space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Vocabulary
                </a>
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Debates
                </a>
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Storytelling
                </a>
              </div>
            </div>

            {/* Learning */}
            <div>
              <h3 className="text-lg font-bold text-purple-600 mb-6">Learning</h3>
              <div className="space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Vocabulary Building
                </a>
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Pronunciation
                </a>
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  JAM Sessions
                </a>
                <a href="#features" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Progress Tracking
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-bold text-purple-600 mb-6">Support</h3>
              <div className="space-y-4">
                <a href="#contact" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Help Center
                </a>
                <a href="#solutions" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  How to Use
                </a>
                <a href="#faq" className="block text-gray-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  FAQs
                </a>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex justify-center space-x-6 mb-12">
            <a href="#" className="w-12 h-12 bg-gray-100 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group">
              <Twitter className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
            </a>
            <a href="#" className="w-12 h-12 bg-gray-100 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group">
              <Instagram className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
            </a>
            <a href="#" className="w-12 h-12 bg-gray-100 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group">
              <Youtube className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
            </a>
            <a href="#" className="w-12 h-12 bg-gray-100 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group">
              <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
            </a>
            <a href="#" className="w-12 h-12 bg-gray-100 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group">
              <Github className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-300 font-medium">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-300 font-medium">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-300 font-medium">
              Cookie Policy
            </a>
          </div>

          {/* Made with Love */}
          <div className="text-center mb-8">
            <p className="text-gray-500 font-medium">
              Made with <span className="text-red-500">❤️</span> by a global team
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center border-t border-gray-200 pt-8">
            <p className="text-gray-500">
              © Copyright 2025 Vocab Pro. All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;