import React, { useState } from 'react';
import { Brain, Sparkles, Settings, BarChart3, Clock, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Debates: React.FC = () => {
  const [activeTab, setActiveTab] = useState('studio');
  const [recentDebates, setRecentDebates] = useState<Array<{
    id: string;
    topic: string;
    debateStyle: string;
    sideSelection: string;
    builderCharacter: string;
    breakerCharacter: string;
    duration: string;
    createdAt: Date;
  }>>([]);

  const [selectedDebate, setSelectedDebate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    debateStyle: '',
    sideSelection: '',
    builderCharacter: '',
    breakerCharacter: '',
    duration: ''
  });

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const debateStyles = [
    { value: 'ai', label: 'Debate with AI' },
    { value: '1-on-1', label: '1-on-1 Debate' },
    { value: 'team', label: 'Team Debate' },
    { value: 'panel', label: 'Panel Debate' }
  ];

  const sideOptions = [
    { value: 'builder', label: 'Builder' },
    { value: 'breaker', label: 'Breaker' }
  ];

  const characterOptions = [
    { value: 'spongebob', label: 'SpongeBob' },
    { value: 'mickey', label: 'Mickey Mouse' },
    { value: 'elsa', label: 'Elsa' },
    { value: 'simba', label: 'Simba' },
    { value: 'pikachu', label: 'Pikachu' },
    { value: 'mario', label: 'Mario' }
  ];

  const durationOptions = [
    { value: '1', label: '1 minute' },
    { value: '2-3', label: '2-3 minutes' },
    { value: '3-5', label: '3-5 minutes' },
    { value: '7', label: '7 minutes' },
    { value: '8-10', label: '8-10 minutes' }
  ];

  const debateTopics = [
    {
      id: 1,
      title: "Technology in Education",
      description: "Should technology replace traditional classroom learning?",
      difficulty: "Intermediate",
      duration: "5-7 minutes",
      participants: "2-4 people",
      category: "Education",
      icon: "💻",
      points: [
        "Digital literacy skills",
        "Access to information",
        "Personalized learning",
        "Social interaction concerns"
      ]
    },
    {
      id: 2,
      title: "Environmental Conservation",
      description: "Individual actions vs. Government policies for climate change",
      difficulty: "Advanced",
      duration: "7-10 minutes",
      participants: "3-5 people",
      category: "Environment",
      icon: "🌱",
      points: [
        "Personal responsibility",
        "Policy effectiveness",
        "Economic impact",
        "Global cooperation"
      ]
    },
    {
      id: 3,
      title: "Junk Food vs Healthy Food",
      description: "Which is better for kids: tasty junk food or nutritious healthy food?",
      difficulty: "Beginner",
      duration: "3-5 minutes",
      participants: "2-3 people",
      category: "Health",
      icon: "🍎",
      points: [
        "Taste and enjoyment",
        "Nutritional value",
        "Energy levels",
        "Long-term health"
      ]
    },
    {
      id: 4,
      title: "Social Media Impact",
      description: "Is social media helping or harming society?",
      difficulty: "Intermediate",
      duration: "5-7 minutes",
      participants: "2-4 people",
      category: "Technology",
      icon: "📱",
      points: [
        "Communication benefits",
        "Mental health effects",
        "Privacy concerns",
        "Information sharing"
      ]
    },
    {
      id: 5,
      title: "Online vs Traditional Learning",
      description: "Which learning method is more effective?",
      difficulty: "Beginner",
      duration: "3-5 minutes",
      participants: "2-3 people",
      category: "Education",
      icon: "🎓",
      points: [
        "Flexibility",
        "Interaction quality",
        "Resource accessibility",
        "Self-discipline"
      ]
    },
    {
      id: 6,
      title: "Video Games: Good or Bad?",
      description: "Do video games help or harm child development?",
      difficulty: "Beginner",
      duration: "3-5 minutes",
      participants: "2-3 people",
      category: "Entertainment",
      icon: "🎮",
      points: [
        "Problem-solving skills",
        "Social interaction",
        "Physical activity",
        "Time management"
      ]
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new debate entry
    const newDebate = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date()
    };

    // Add to recent debates
    setRecentDebates(prev => [newDebate, ...prev].slice(0, 5)); // Keep only last 5 debates

    // Reset form
    setFormData({
      topic: '',
      debateStyle: '',
      sideSelection: '',
      builderCharacter: '',
      breakerCharacter: '',
      duration: ''
    });

    // Show success message
    alert('Debate saved successfully!');
  };

  const handleSelectTopic = (topic: any) => {
    setFormData(prev => ({
      ...prev,
      topic: topic.title
    }));
  };

  const navigate = useNavigate();

  const handleNext = () => {
    console.log('handleNext called');
    console.log('selectedDebate:', selectedDebate);
    console.log('formData:', formData);

    // If a debate is selected from recent activity, use that
    if (selectedDebate) {
      const selectedDebateData = recentDebates.find(d => d.id === selectedDebate);
      console.log('selectedDebateData:', selectedDebateData);
      
      if (selectedDebateData) {
        // Convert duration to minutes for selected debate
        const durationInMinutes = parseInt(selectedDebateData.duration.split('-')[0]);
        const debateToSave = {
          id: selectedDebateData.id,
          topic: selectedDebateData.topic,
          debateStyle: selectedDebateData.debateStyle,
          sideSelection: selectedDebateData.sideSelection,
          builderCharacter: selectedDebateData.builderCharacter,
          breakerCharacter: selectedDebateData.breakerCharacter,
          duration: durationInMinutes,
          createdAt: selectedDebateData.createdAt || new Date()
        };
        console.log('Saving selected debate:', debateToSave);
        
        // Store the selected debate data in localStorage for the tournament page
        localStorage.setItem('currentDebate', JSON.stringify(debateToSave));
        navigate('/debate-tournament');
        return;
      }
    }

    // Otherwise, check if form is filled
    if (formData.topic && formData.debateStyle && formData.sideSelection && 
        formData.builderCharacter && formData.breakerCharacter && formData.duration) {
      // Convert duration to minutes (take the first number for ranges)
      const durationInMinutes = parseInt(formData.duration.split('-')[0]);
      const debateToSave = {
        id: Date.now().toString(),
        topic: formData.topic,
        debateStyle: formData.debateStyle,
        sideSelection: formData.sideSelection,
        builderCharacter: formData.builderCharacter,
        breakerCharacter: formData.breakerCharacter,
        duration: durationInMinutes,
        createdAt: new Date()
      };
      console.log('Saving form data:', debateToSave);
      
      // Store the form data in localStorage for the tournament page
      localStorage.setItem('currentDebate', JSON.stringify(debateToSave));
      navigate('/debate-tournament');
    } else {
      console.log('Form validation failed');
      // Show error or alert that all fields are required
      alert('Please either fill in all fields or select a debate from Recent Activity');
    }
  };

  const renderDebateStudioTab = () => (
    <div className="w-full max-w-7xl mx-auto space-y-8 relative pb-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Create Debate</h1>
        <p className="text-xl text-gray-300">Set up your debate session</p>
      </div>

      {/* Create Debate Form */}
      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic */}
          <div className="col-span-2">
            <label className="block text-white text-sm font-medium mb-2">Select Topic</label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
              placeholder="Enter your debate topic"
            />
          </div>

          {/* Debate Style */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Select Debate Style</label>
            <select
              name="debateStyle"
              value={formData.debateStyle}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">Select style</option>
              {debateStyles.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          {/* Side Selection */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Side Selection</label>
            <select
              name="sideSelection"
              value={formData.sideSelection}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">Select side</option>
              {sideOptions.map(side => (
                <option key={side.value} value={side.value}>{side.label}</option>
              ))}
            </select>
          </div>

          {/* Builder Character */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Builder Character</label>
            <select
              name="builderCharacter"
              value={formData.builderCharacter}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">Select character</option>
              {characterOptions.map(char => (
                <option key={char.value} value={char.value}>{char.label}</option>
              ))}
            </select>
          </div>

          {/* Breaker Character */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Breaker Character</label>
            <select
              name="breakerCharacter"
              value={formData.breakerCharacter}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">Select character</option>
              {characterOptions.map(char => (
                <option key={char.value} value={char.value}>{char.label}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Duration</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full bg-white border border-white/20 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">Select duration</option>
              {durationOptions.map(duration => (
                <option key={duration.value} value={duration.value}>{duration.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
        >
          Create and Save Debate
        </button>
      </form>

      {/* Debate Topics */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Debate Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debateTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleSelectTopic(topic)}
            >
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">{topic.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{topic.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    topic.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                    topic.difficulty === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{topic.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {topic.duration}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {topic.participants}
                </div>
              </div>

              <div className="space-y-2">
                {topic.points.map((point, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    • {point}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-4">
          {recentDebates.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-gray-300 text-center">No recent debates yet. Create your first debate above!</p>
            </div>
          ) : (
            recentDebates.map((debate) => (
              <div
                key={debate.id}
                onClick={() => setSelectedDebate(debate.id)}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border cursor-pointer ${
                  selectedDebate === debate.id 
                    ? 'border-purple-400 bg-white/20' 
                    : 'border-white/20 hover:bg-white/20'
                } transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{debate.topic}</h3>
                  <span className="text-sm text-gray-400">
                    {new Date(debate.createdAt).toLocaleDateString()} {new Date(debate.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Style:</span>
                    <span>{debateStyles.find(s => s.value === debate.debateStyle)?.label || debate.debateStyle}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Side:</span>
                    <span>{sideOptions.find(s => s.value === debate.sideSelection)?.label || debate.sideSelection}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Duration:</span>
                    <span>{durationOptions.find(d => d.value === debate.duration)?.label || debate.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Builder:</span>
                    <span>{characterOptions.find(c => c.value === debate.builderCharacter)?.label || debate.builderCharacter}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Breaker:</span>
                    <span>{characterOptions.find(c => c.value === debate.breakerCharacter)?.label || debate.breakerCharacter}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span>Next</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Debate Insights</h1>
      <p className="text-xl text-gray-300">Track your progress and performance</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="flex items-center justify-between px-16 py-4 bg-white/10 shadow-md">
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>
          <div className="flex flex-col ml-4">
            <span className="text-2xl font-bold text-white tracking-tight">
              Vocab<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Pro</span>
            </span>
            <span className="text-xs text-gray-300 font-medium tracking-wide">Learn • Practice • Excel</span>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <h1 className="text-5xl font-bold text-white">Debates</h1>
        </div>
        
        <div className="flex items-center flex-1 justify-end">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
        </div>
      </header>

      <div className="flex justify-center pt-8 px-4">
        <div className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-2">
          {[
            { id: 'studio', label: 'Debate Studio', icon: Settings },
            { id: 'insights', label: 'Insights', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center ${
                activeTab === tab.id
                  ? 'bg-white text-purple-900 shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex justify-center pt-8 px-4 pb-8">
        <div className="w-full">
          {activeTab === 'studio' && renderDebateStudioTab()}
          {activeTab === 'insights' && renderInsightsTab()}
        </div>
      </main>
    </div>
  );
};

export default Debates;