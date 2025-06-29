import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Brain } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
  onSignupClick?: () => void;
}

function LoginPage({ onBack, onSignupClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // Handle login logic here
      console.log('Login attempt:', { email, password });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 font-['Open_Sans',sans-serif] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-4 h-4 bg-purple-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/6 w-6 h-6 bg-blue-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-purple-300/20 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/6 right-1/3 w-2 h-2 bg-blue-300/20 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-indigo-300/20 rounded-full animate-pulse delay-1200"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-300 group"
        >
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Home</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Login
            </h1>
            <p className="text-xl text-gray-300">
              Welcome back to Vocab Pro
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Email Field */}
              <div className="space-y-4">
                <label htmlFor="email" className="block text-lg font-semibold text-white">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-lg"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-4">
                <label htmlFor="password" className="block text-lg font-semibold text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-5 pr-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-lg"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" />
                    ) : (
                      <Eye className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-600/50 disabled:to-blue-600/50 text-white px-8 py-6 rounded-xl font-bold text-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>

            {/* Additional Links */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <button
                  type="button"
                  className="text-purple-300 hover:text-purple-200 transition-colors duration-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300">
                  Don't have an account?{' '}
                  <button 
                    onClick={onSignupClick}
                    className="text-purple-300 hover:text-purple-200 transition-colors duration-300 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;