import React, { useState } from 'react';
import { Brain, LogOut, User, Settings, BookOpen, Mic, BarChart3, Trophy, Sparkles, File, FileText, Music, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LibraryItem } from '../App';

interface DashboardProps {
  onLogout: () => void;
  libraryItems: LibraryItem[];
}

function Dashboard({ onLogout, libraryItems }: DashboardProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const groupByType = (items: LibraryItem[]) => {
    return {
      Documents: items.filter((i) => i.type === 'file' || i.type === 'text'),
      'Audio Files': items.filter((i) => i.type === 'audio'),
      Screenshots: items.filter((i) => i.type === 'screenshot'),
      Links: items.filter((i) => i.type === 'link'),
    };
  };

  const grouped = groupByType(libraryItems);

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 font-['Open_Sans',sans-serif]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
                <span className="text-2xl font-bold text-white tracking-tight">
                  Vocab
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Pro
                  </span>
                </span>
                <span className="text-xs text-gray-300 font-medium tracking-wide">
                  Learn • Practice • Excel
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white">
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.user_metadata?.full_name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome Back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-xl text-gray-300">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Vocabulary Practice */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-purple-400/50 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vocabulary</h3>
            <p className="text-gray-300 mb-4">Practice and expand your vocabulary</p>
            <button
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all duration-300"
              onClick={() => navigate('/vocabpractice')}
            >
              Start Practice
            </button>
          </div>

          {/* Speaking Practice */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-blue-400/50 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Speaking</h3>
            <p className="text-gray-300 mb-4">Record and improve your pronunciation</p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-lg font-semibold transition-all duration-300">
              Start Recording
            </button>
          </div>

          {/* Progress Tracking */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-indigo-400/50 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Progress</h3>
            <p className="text-gray-300 mb-4">Track your learning journey</p>
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-all duration-300">
              View Stats
            </button>
          </div>

          {/* Achievements */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-yellow-400/50 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Achievements</h3>
            <p className="text-gray-300 mb-4">View your accomplishments</p>
            <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-2 rounded-lg font-semibold transition-all duration-300">
              View Badges
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="w-full max-w-4xl bg-white/90 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-lg font-semibold text-blue-700 mb-3">{type}</h3>
                <div className="flex flex-col gap-3">
                  {items.length > 0 ? (
                    items.map((item: LibraryItem) => (
                      <div key={item.name} className="flex items-center bg-white rounded-lg shadow p-3 gap-3 hover:shadow-md transition">
                        <div>{item.icon}</div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">{item.name}</span>
                          <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">No {type.toLowerCase()} yet.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;