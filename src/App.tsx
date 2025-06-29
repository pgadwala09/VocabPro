import React, { useState } from 'react';
import { Brain, BookOpen, Mic, Users, Trophy, Star, ArrowRight, Play, CheckCircle, Sparkles } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
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
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
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

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">How It Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-300">Reviews</a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentPage('login')}
                className="text-gray-700 hover:text-purple-600 font-semibold transition-colors duration-300"
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
          </div>
        </div>
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Stories that <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Speak</span>.
              <br />
              Debates that <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Dazzle</span>.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Master vocabulary through immersive storytelling and dynamic debates. 
              Transform your communication skills with AI-powered learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => setCurrentPage('signup')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-6 h-6" />
              </button>
              <button className="flex items-center space-x-3 text-white hover:text-purple-300 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <span className="font-semibold text-lg">Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Benefits
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience revolutionary language learning through our innovative approach
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Interactive Stories */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-purple-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Interactive Stories</h3>
              <p className="text-gray-300 leading-relaxed">
                Immerse yourself in captivating narratives that naturally introduce new vocabulary in context, making learning memorable and engaging.
              </p>
            </div>

            {/* AI-Powered Debates */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-blue-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Debates</h3>
              <p className="text-gray-300 leading-relaxed">
                Practice articulation and critical thinking through dynamic debates with our advanced AI, building confidence in real-world conversations.
              </p>
            </div>

            {/* Personalized Learning */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-indigo-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Personalized Learning</h3>
              <p className="text-gray-300 leading-relaxed">
                Adaptive algorithms tailor content to your learning pace and style, ensuring optimal progress and retention of new vocabulary.
              </p>
            </div>

            {/* Community Challenges */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-green-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Community Challenges</h3>
              <p className="text-gray-300 leading-relaxed">
                Join fellow learners in exciting vocabulary challenges and competitions that make learning social and motivating.
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-yellow-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Progress Tracking</h3>
              <p className="text-gray-300 leading-relaxed">
                Monitor your vocabulary growth with detailed analytics and celebrate milestones with achievement badges and rewards.
              </p>
            </div>

            {/* Expert Content */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-pink-400/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Expert Content</h3>
              <p className="text-gray-300 leading-relaxed">
                Access curated content created by language experts and educators, ensuring high-quality learning materials and proven methodologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to transform your vocabulary and communication skills
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Story</h3>
              <p className="text-gray-600 leading-relaxed">
                Select from our library of engaging stories across various genres and difficulty levels, tailored to your interests and learning goals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Learn & Practice</h3>
              <p className="text-gray-600 leading-relaxed">
                Immerse yourself in interactive storytelling, then practice new vocabulary through AI-powered debates and conversations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your vocabulary growth, earn achievements, and compete with friends as you build confidence in your communication skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of learners who have transformed their vocabulary skills
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl border border-purple-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "VocabPro completely changed how I approach learning. The stories are so engaging that I forget I'm studying!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">SM</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Sarah Martinez</h4>
                  <p className="text-gray-600">College Student</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "The AI debates feature is incredible. It's like having a personal tutor available 24/7 to practice with."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">JC</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">James Chen</h4>
                  <p className="text-gray-600">Business Professional</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "My vocabulary has expanded dramatically in just 3 months. The progress tracking keeps me motivated every day."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">EP</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Emily Parker</h4>
                  <p className="text-gray-600">Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Vocabulary?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of learners who are already mastering vocabulary through stories and debates.
            Start your journey today with our free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => setCurrentPage('signup')}
              className="bg-white text-purple-900 hover:bg-gray-100 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">VocabPro</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Transform your vocabulary and communication skills through immersive storytelling and AI-powered debates.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-300">How It Works</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors duration-300">Testimonials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Pricing</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 VocabPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;