import React from 'react';
import { Brain, LogOut, User, Settings, BookOpen, Mic, BarChart3, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const { user, signOut } = useAuth();

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
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Vocab Pro</span>
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
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!
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
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all duration-300">
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">
              Start practicing to see your recent activity here!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;