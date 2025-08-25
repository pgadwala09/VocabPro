<<<<<<< HEAD
import React, { useState } from 'react';
import { Brain, Sparkles, Settings, BarChart3, Clock, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Sparkles, Settings, BarChart3, Clock, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { analyzeDebateTranscript, transcribeAudioWhisper } from '../lib/insights';
>>>>>>> origin/main

const Debates: React.FC = () => {
  const [activeTab, setActiveTab] = useState('studio');
  const [recentDebates, setRecentDebates] = useState<Array<{
    id: string;
    topic: string;
    debateStyle: string;
    sideSelection: string;
<<<<<<< HEAD
    builderCharacter: string;
    breakerCharacter: string;
    duration: string;
=======
    builderCharacter?: string;
    breakerCharacter?: string;
    duration?: string;
>>>>>>> origin/main
    createdAt: Date;
  }>>([]);

  const [selectedDebate, setSelectedDebate] = useState<string | null>(null);
<<<<<<< HEAD
  const [formData, setFormData] = useState({
    topic: '',
    debateStyle: '',
    sideSelection: '',
    builderCharacter: '',
    breakerCharacter: '',
    duration: ''
=======
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    debateStyle: '',
    sideSelection: ''
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======

>>>>>>> origin/main

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
<<<<<<< HEAD

=======
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('liveDebates') || '[]');
      if (Array.isArray(saved) && saved.length) {
        const normalized = saved.map((d: any) => ({
          id: d.id || String(Date.now()),
          topic: d.topic || '',
          debateStyle: d.debate_style || d.debateStyle || 'ai',
          sideSelection: d.sideSelection || '',
          builderCharacter: d.builderCharacter || '',
          breakerCharacter: d.breakerCharacter || '',
          duration: String(d.duration ?? '1'),
          createdAt: d.timestamp ? new Date(d.timestamp) : new Date(),
          recordings: d.recordings || []
        }));
        setRecentDebates(prev => prev.length ? prev : normalized.slice(0, 20));
      }
    } catch {}
  }, []);
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
      builderCharacter: 'AI',
      breakerCharacter: 'AI',
      duration: '5',
>>>>>>> origin/main
      createdAt: new Date()
    };

    // Add to recent debates
    setRecentDebates(prev => [newDebate, ...prev].slice(0, 5)); // Keep only last 5 debates

    // Reset form
    setFormData({
      topic: '',
      debateStyle: '',
<<<<<<< HEAD
      sideSelection: '',
      builderCharacter: '',
      breakerCharacter: '',
      duration: ''
    });

    // Show success message
    alert('Debate saved successfully!');
=======
      sideSelection: ''
    });

    // Show success popup
    setShowSuccessPopup(true);
    
    // Hide popup after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
>>>>>>> origin/main
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
<<<<<<< HEAD
        const durationInMinutes = parseInt(selectedDebateData.duration.split('-')[0]);
=======
        const durationInMinutes = selectedDebateData.duration ? parseInt(selectedDebateData.duration.split('-')[0]) : 5;
>>>>>>> origin/main
        const debateToSave = {
          id: selectedDebateData.id,
          topic: selectedDebateData.topic,
          debateStyle: selectedDebateData.debateStyle,
          sideSelection: selectedDebateData.sideSelection,
<<<<<<< HEAD
          builderCharacter: selectedDebateData.builderCharacter,
          breakerCharacter: selectedDebateData.breakerCharacter,
=======
          builderCharacter: selectedDebateData.builderCharacter || 'AI',
          breakerCharacter: selectedDebateData.breakerCharacter || 'AI',
>>>>>>> origin/main
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

    // Otherwise, proceed depending on style
    const isAI = formData.debateStyle === 'ai';
    if (isAI) {
      if (!formData.topic || !formData.debateStyle) {
        alert('Please enter a topic and select "Debate with AI" style.');
        return;
      }
      const debateToSave = {
        id: Date.now().toString(),
        topic: formData.topic,
        debateStyle: formData.debateStyle,
        sideSelection: 'builder',
        builderCharacter: 'AI',
        breakerCharacter: 'AI',
        duration: 5,
        createdAt: new Date()
      };
      localStorage.setItem('currentDebate', JSON.stringify(debateToSave));
      navigate('/debate-tournament');
    } else {
<<<<<<< HEAD
      if (formData.topic && formData.debateStyle && formData.sideSelection &&
          formData.builderCharacter && formData.breakerCharacter && formData.duration) {
        const durationInMinutes = parseInt(formData.duration.split('-')[0]);
=======
      if (formData.topic && formData.debateStyle && formData.sideSelection) {
>>>>>>> origin/main
        const debateToSave = {
          id: Date.now().toString(),
          topic: formData.topic,
          debateStyle: formData.debateStyle,
          sideSelection: formData.sideSelection,
<<<<<<< HEAD
          builderCharacter: formData.builderCharacter,
          breakerCharacter: formData.breakerCharacter,
          duration: durationInMinutes,
=======
          builderCharacter: 'AI',
          breakerCharacter: 'AI',
          duration: 5,
>>>>>>> origin/main
          createdAt: new Date()
        };
        localStorage.setItem('currentDebate', JSON.stringify(debateToSave));
        navigate('/debate-tournament');
      } else {
        alert('Please fill in all fields or select a debate from Recent Activity');
      }
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

          {/* Side Selection (hidden for AI style) */}
          <div className={`${formData.debateStyle === 'ai' ? 'hidden' : ''}`}>
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

<<<<<<< HEAD
          {/* Builder Character (hidden for AI style) */}
          <div className={`${formData.debateStyle === 'ai' ? 'hidden' : ''}`}>
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

          {/* Breaker Character (hidden for AI style) */}
          <div className={`${formData.debateStyle === 'ai' ? 'hidden' : ''}`}>
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

          {/* Duration (hidden for AI style) */}
          <div className={`${formData.debateStyle === 'ai' ? 'hidden' : ''}`}>
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
=======

>>>>>>> origin/main
        </div>

        <button
          type="submit"
          className="mt-8 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
        >
          Create and Save Debate
        </button>
      </form>

<<<<<<< HEAD
=======
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
                  {debate.debateStyle !== 'ai' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Side:</span>
                        <span>{sideOptions.find(s => s.value === debate.sideSelection)?.label || debate.sideSelection}</span>
                      </div>

                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

>>>>>>> origin/main
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

<<<<<<< HEAD
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
                  {debate.debateStyle !== 'ai' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

=======
>>>>>>> origin/main
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
<<<<<<< HEAD

  const renderInsightsTab = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Debate Insights</h1>
      <p className="text-xl text-gray-300">Track your progress and performance</p>
    </div>
  );
=======
  const renderInsightsTab = () => <InsightsTab liveDebates={recentDebates} />;

  function InsightsTab({ liveDebates }: { liveDebates: any[] }) {
    // Lazy load chart libraries to avoid startup crashes if not installed
    const [chartsReady, setChartsReady] = useState(false);
    const [RCPie, setRCPie] = useState<any>(null);
    const [RCBar, setRCBar] = useState<any>(null);
    const [RCLine, setRCLine] = useState<any>(null);
    const [RCDoughnut, setRCDoughnut] = useState<any>(null);
    
    useEffect(() => {
      (async () => {
        try {
          const [{ Pie }, { Bar }, { Line }, { Doughnut }, chartjs] = await Promise.all([
            import('react-chartjs-2').catch(() => ({ Pie: () => null })),
            import('react-chartjs-2').catch(() => ({ Bar: () => null })),
            import('react-chartjs-2').catch(() => ({ Line: () => null })),
            import('react-chartjs-2').catch(() => ({ Doughnut: () => null })),
            import('chart.js').catch(() => null),
          ]);
          if (chartjs && (chartjs as any).Chart) {
            const { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } = chartjs as any;
            Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);
          }
          setRCPie(() => Pie);
          setRCBar(() => Bar);
          setRCLine(() => Line);
          setRCDoughnut(() => Doughnut);
          setChartsReady(true);
        } catch {
          setChartsReady(false);
        }
      })();
    }, []);

    // Enhanced analytics data with real debate results
    const analyticsData = useMemo(() => {
      // Get real debate results from localStorage
      const debateResults = JSON.parse(localStorage.getItem('debateResults') || '[]');
      const totalDebates = debateResults.length;
      
      // Categorize debates by type
      const debateTypes = {
        '1-on-1': debateResults.filter((d: any) => d.debateStyle === '1-on-1').length,
        'Debate with AI': debateResults.filter((d: any) => d.debateStyle === 'ai').length,
        'Team': debateResults.filter((d: any) => d.debateStyle === 'team').length,
        'Panel': debateResults.filter((d: any) => d.debateStyle === 'panel').length
      };
      
      // Calculate debate-specific metrics from real data
      const oneOnOneResults = debateResults.filter((d: any) => d.debateStyle === '1-on-1');
      const aiDebateResults = debateResults.filter((d: any) => d.debateStyle === 'ai');
      
      // 1-on-1 Debate specific metrics from real data
      const oneOnOneMetrics = oneOnOneResults.length > 0 ? {
        totalRounds: oneOnOneResults.reduce((sum: number, d: any) => sum + (d.totalRounds || 4), 0),
        averageRoundScore: Math.round(oneOnOneResults.reduce((sum: number, d: any) => sum + d.userScore, 0) / oneOnOneResults.length),
        completionRate: Math.round((oneOnOneResults.filter((d: any) => d.roundScores?.length === 4).length / oneOnOneResults.length) * 100),
        topScore: Math.max(...oneOnOneResults.map((d: any) => d.userScore)),
        improvementTrend: Math.round((oneOnOneResults[0]?.userScore - oneOnOneResults[oneOnOneResults.length - 1]?.userScore) / oneOnOneResults.length)
      } : {
        totalRounds: 0,
        averageRoundScore: 0,
        completionRate: 0,
        topScore: 0,
        improvementTrend: 0
      };
      
      // AI Debate specific metrics from real data
      const aiDebateMetrics = aiDebateResults.length > 0 ? {
        totalSessions: aiDebateResults.length,
        averageSessionLength: Math.round(aiDebateResults.reduce((sum: number, d: any) => sum + (d.duration || 5), 0) / aiDebateResults.length),
        aiResponseQuality: Math.round(aiDebateResults.reduce((sum: number, d: any) => sum + d.aiScore, 0) / aiDebateResults.length),
        userEngagement: Math.round((aiDebateResults.filter((d: any) => d.userScore > 50).length / aiDebateResults.length) * 100),
        topicDiversity: new Set(aiDebateResults.map((d: any) => d.topic)).size
      } : {
        totalSessions: 0,
        averageSessionLength: 0,
        aiResponseQuality: 0,
        userEngagement: 0,
        topicDiversity: 0
      };
      
      const totalRecordings = liveDebates.reduce((s, d) => s + (d.recordings?.length || 0), 0);
      const totalTopics = new Set([...liveDebates.map(d => d.topic), ...debateResults.map((d: any) => d.topic)]).size;
      const totalMinutes = debateResults.reduce((sum: number, d: any) => sum + (d.duration || 5), 0);
      
      // Performance scores from real data
      const performanceScores = debateResults.map((debate: any, index: number) => ({
        debateId: index + 1,
        debateType: debate.debateStyle,
        proScore: debate.userScore || 0,
        conScore: debate.aiScore || 0,
        topic: debate.topic || `Debate ${index + 1}`,
        rounds: debate.totalRounds || 1,
        duration: debate.duration || 5,
        winner: debate.winner,
        completedAt: debate.completedAt
      }));
      
      const averageProScore = performanceScores.length > 0 ? 
        Math.round(performanceScores.reduce((sum, p) => sum + p.proScore, 0) / performanceScores.length) : 0;
      const averageConScore = performanceScores.length > 0 ? 
        Math.round(performanceScores.reduce((sum, p) => sum + p.conScore, 0) / performanceScores.length) : 0;
      
      // Generate contextual feedback based on real debate data
      const feedbackForLowScores = performanceScores
        .filter(p => p.proScore < 75)
        .map(p => ({
          debateId: p.debateId,
          debateType: p.debateType,
          topic: p.topic,
          score: p.proScore,
          feedback: generateContextualFeedback(p.proScore, p.topic, p.debateType)
        }));
      
      return {
        totalDebates,
        debateTypes,
        totalRecordings,
        totalTopics,
        totalMinutes,
        performanceScores,
        averageProScore,
        averageConScore,
        feedbackForLowScores,
        oneOnOneMetrics,
        aiDebateMetrics,
        debateResults // Include raw results for detailed analysis
      };
    }, [liveDebates]);

    // Generate contextual feedback based on debate type and score
    function generateContextualFeedback(score: number, topic: string, debateType: string): string {
      const feedbacks = {
        '1-on-1': {
          low: [
            "In 1-on-1 debates, focus on building strong arguments across all 4 rounds. Practice your rebuttal skills for the CON position.",
            "Work on maintaining consistency throughout all rounds. Each round should build upon the previous one.",
            "Practice transitioning between PRO and CON positions. Both require different argument strategies.",
            "Focus on round-by-round improvement. Your final round should be your strongest."
          ],
          medium: [
            "Good 1-on-1 performance! Try to vary your argument styles between rounds.",
            "Solid multi-round debate! Consider using different evidence types in each round.",
            "Well done! Work on making your later rounds more compelling than earlier ones.",
            "Great effort! Practice making your CON arguments as strong as your PRO arguments."
          ],
          high: [
            "Excellent 1-on-1 debate skills! Your multi-round consistency is impressive.",
            "Outstanding performance across all rounds! Your argument development is strong.",
            "Fantastic 1-on-1 debate! Your ability to maintain quality across rounds is commendable.",
            "Superb multi-round debate! Your PRO and CON skills are well-balanced."
          ]
        },
        'ai': {
          low: [
            "In AI debates, focus on engaging with the AI's responses more directly. Ask follow-up questions.",
            "Work on providing more detailed arguments that the AI can respond to meaningfully.",
            "Practice active listening to the AI's points and address them specifically.",
            "Try to make your arguments more interactive and conversational with the AI."
          ],
          medium: [
            "Good AI debate engagement! Try to challenge the AI's assumptions more.",
            "Solid interaction with AI! Consider asking the AI to elaborate on its points.",
            "Well done! Work on making your arguments more dynamic and responsive.",
            "Great effort! Practice building on the AI's responses to create deeper discussions."
          ],
          high: [
            "Excellent AI debate skills! Your interaction with the AI is highly engaging.",
            "Outstanding AI debate performance! Your arguments complement the AI's responses well.",
            "Fantastic AI debate! Your ability to work with the AI creates meaningful discussions.",
            "Superb AI interaction! Your collaborative debate style is impressive."
          ]
        },
        default: {
          low: [
            "Focus on providing more concrete evidence and examples to strengthen your arguments.",
            "Practice structuring your arguments with clear introduction, body, and conclusion.",
            "Work on anticipating counterarguments and preparing rebuttals in advance.",
            "Try to speak more clearly and at a measured pace to improve delivery."
          ],
          medium: [
            "Good foundation! Try incorporating more statistical data and expert opinions.",
            "Your arguments are solid. Consider adding more emotional appeals and storytelling.",
            "Well done! Focus on improving your rebuttal skills and quick thinking.",
            "Great effort! Practice transitioning more smoothly between arguments."
          ],
          high: [
            "Excellent performance! Your arguments were well-structured and compelling.",
            "Outstanding work! Your evidence and delivery were both strong.",
            "Fantastic debate skills! Keep up this level of preparation and execution.",
            "Superb performance! Your ability to think on your feet is impressive."
          ]
        }
      };
      
      const category = score < 70 ? 'low' : score < 85 ? 'medium' : 'high';
      const debateFeedback = feedbacks[debateType as keyof typeof feedbacks] || feedbacks.default;
      const randomFeedback = debateFeedback[category][Math.floor(Math.random() * debateFeedback[category].length)];
      
      return randomFeedback;
    }

    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Debate Analytics Dashboard</h1>
          <p className="text-lg text-gray-300">Comprehensive insights across all debate formats</p>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{analyticsData.totalDebates}</div>
                <div className="opacity-80 text-sm">Total Debates</div>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{analyticsData.totalRecordings}</div>
                <div className="opacity-80 text-sm">Voice Recordings</div>
              </div>
              <div className="text-4xl">🎤</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{analyticsData.totalTopics}</div>
                <div className="opacity-80 text-sm">Unique Topics</div>
              </div>
              <div className="text-4xl">💭</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{analyticsData.averageProScore}</div>
                <div className="opacity-80 text-sm">Avg Pro Score</div>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Debate Type Distribution */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Debate Type Distribution</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {chartsReady && RCDoughnut ? (
                <RCDoughnut
                  data={{
                    labels: Object.keys(analyticsData.debateTypes),
                    datasets: [{
                      data: Object.values(analyticsData.debateTypes),
                      backgroundColor: ['#a78bfa', '#22d3ee', '#34d399', '#fb7185'],
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.2)'
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: '#e5e7eb', font: { size: 14 } }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-300 text-sm">Charts unavailable</div>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(analyticsData.debateTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      type === '1-on-1' ? 'bg-purple-500' :
                      type === 'Chat' ? 'bg-cyan-500' :
                      type === 'AI' ? 'bg-green-500' : 'bg-pink-500'
                    }`}></div>
                    <span className="text-white font-medium">{type} Debates</span>
                  </div>
                  <span className="text-white font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Performance Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Score Trends</h3>
              {chartsReady && RCLine ? (
                <RCLine
                  data={{
                    labels: analyticsData.performanceScores.map(p => `D${p.debateId}`),
                    datasets: [
                      {
                        label: 'Pro Score',
                        data: analyticsData.performanceScores.map(p => p.proScore),
                        borderColor: '#a78bfa',
                        backgroundColor: 'rgba(167, 139, 250, 0.1)',
                        tension: 0.4
                      },
                      {
                        label: 'Con Score',
                        data: analyticsData.performanceScores.map(p => p.conScore),
                        borderColor: '#22d3ee',
                        backgroundColor: 'rgba(34, 211, 238, 0.1)',
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        labels: { color: '#e5e7eb' }
                      }
                    },
                    scales: {
                      y: {
                        ticks: { color: '#e5e7eb' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                      },
                      x: {
                        ticks: { color: '#e5e7eb' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-300 text-sm">Charts unavailable</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Score Distribution</h3>
              {chartsReady && RCBar ? (
                <RCBar
                  data={{
                    labels: ['60-70', '71-80', '81-90', '91-100'],
                    datasets: [{
                      label: 'Pro Scores',
                      data: [
                        analyticsData.performanceScores.filter(p => p.proScore >= 60 && p.proScore <= 70).length,
                        analyticsData.performanceScores.filter(p => p.proScore >= 71 && p.proScore <= 80).length,
                        analyticsData.performanceScores.filter(p => p.proScore >= 81 && p.proScore <= 90).length,
                        analyticsData.performanceScores.filter(p => p.proScore >= 91 && p.proScore <= 100).length
                      ],
                      backgroundColor: 'rgba(167, 139, 250, 0.6)'
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        ticks: { color: '#e5e7eb' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                      },
                      x: {
                        ticks: { color: '#e5e7eb' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-300 text-sm">Charts unavailable</div>
              )}
            </div>
          </div>
        </div>

        {/* 1-on-1 Debate Insights */}
        {analyticsData.oneOnOneMetrics.totalRounds > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🥊 1-on-1 Debate Insights</h2>
            <p className="text-gray-300 mb-4">Multi-round debate performance analysis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.oneOnOneMetrics.totalRounds}</div>
                <div className="text-sm opacity-80">Total Rounds</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.oneOnOneMetrics.averageRoundScore}</div>
                <div className="text-sm opacity-80">Avg Round Score</div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.oneOnOneMetrics.completionRate}%</div>
                <div className="text-sm opacity-80">Completion Rate</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.oneOnOneMetrics.topScore}</div>
                <div className="text-sm opacity-80">Top Score</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg p-4 border border-purple-500/30">
              <h3 className="text-white font-semibold mb-2">🎯 Key Insights</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• You've completed {analyticsData.oneOnOneMetrics.totalRounds} rounds across {analyticsData.debateTypes['1-on-1']} debates</li>
                <li>• Average round score: {analyticsData.oneOnOneMetrics.averageRoundScore} points</li>
                <li>• {analyticsData.oneOnOneMetrics.completionRate}% of debates completed all 4 rounds</li>
                <li>• Your best performance: {analyticsData.oneOnOneMetrics.topScore} points</li>
                <li>• Improvement trend: +{analyticsData.oneOnOneMetrics.improvementTrend}% over time</li>
              </ul>
            </div>
          </div>
        )}

        {/* AI Debate Insights */}
        {analyticsData.aiDebateMetrics.totalSessions > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🤖 AI Debate Insights</h2>
            <p className="text-gray-300 mb-4">AI-powered debate interaction analysis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.aiDebateMetrics.totalSessions}</div>
                <div className="text-sm opacity-80">AI Sessions</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.aiDebateMetrics.averageSessionLength}m</div>
                <div className="text-sm opacity-80">Avg Session</div>
              </div>
              <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.aiDebateMetrics.aiResponseQuality}%</div>
                <div className="text-sm opacity-80">AI Quality</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{analyticsData.aiDebateMetrics.userEngagement}%</div>
                <div className="text-sm opacity-80">Engagement</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg p-4 border border-pink-500/30">
              <h3 className="text-white font-semibold mb-2">🤖 AI Interaction Analysis</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• {analyticsData.aiDebateMetrics.totalSessions} AI debate sessions completed</li>
                <li>• Average session length: {analyticsData.aiDebateMetrics.averageSessionLength} minutes</li>
                <li>• AI response quality: {analyticsData.aiDebateMetrics.aiResponseQuality}% (excellent)</li>
                <li>• Your engagement level: {analyticsData.aiDebateMetrics.userEngagement}%</li>
                <li>• Topics explored: {analyticsData.aiDebateMetrics.topicDiversity} different subjects</li>
              </ul>
            </div>
          </div>
        )}

        {/* Personalized Feedback Section */}
        {analyticsData.feedbackForLowScores.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Personalized Feedback</h2>
            <p className="text-gray-300 mb-4">Improvement suggestions based on debate type and performance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.feedbackForLowScores.map((feedback, index) => (
                <div key={index} className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{feedback.topic}</h3>
                      <span className="text-xs text-gray-400">{feedback.debateType} Debate</span>
                    </div>
                    <span className="text-orange-400 font-bold">{feedback.score}/100</span>
                  </div>
                  <p className="text-gray-300 text-sm">{feedback.feedback}</p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs text-orange-400">💡</span>
                    <span className="text-xs text-gray-400">Debate #{feedback.debateId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Recent Activity Summary</h2>
          <div className="space-y-3">
            {liveDebates.slice(0, 5).map((debate, index) => (
              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    debate.debateStyle === '1-on-1' ? 'bg-purple-500' :
                    debate.debateStyle === 'chat' ? 'bg-cyan-500' :
                    debate.debateStyle === 'ai' ? 'bg-green-500' : 'bg-pink-500'
                  }`}></div>
                  <div>
                    <div className="text-white font-medium">{debate.topic}</div>
                    <div className="text-gray-400 text-sm">
                      {debate.debateStyle} • {debate.sideSelection} • {new Date(debate.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{analyticsData.performanceScores[index]?.proScore || 'N/A'}</div>
                  <div className="text-gray-400 text-xs">Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recording list for deep dive */}
        <DebateRecordingsPanel liveDebates={liveDebates} />
      </div>
    );
  }

  function DebateRecordingsPanel({ liveDebates }: { liveDebates: any[] }) {
    const [active, setActive] = useState<{ url: string; topic: string; timestamp: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);

    const summaryCards = useMemo(() => {
      const totalArgs = liveDebates.length * 2;
      const facts = Math.max(3, Math.round(totalArgs * 0.6));
      const depth = Math.min(100, 40 + totalArgs * 3);
      return [
        { label: 'Arguments', value: totalArgs, color: 'from-fuchsia-500 to-pink-500' },
        { label: 'Facts', value: facts, color: 'from-sky-500 to-cyan-500' },
        { label: 'Depth', value: depth + '%', color: 'from-amber-500 to-orange-500' },
        { label: 'Engagement', value: Math.min(100, facts * 4) + '%', color: 'from-emerald-500 to-teal-500' },
      ];
    }, [liveDebates]);

    return (
      <div className="space-y-6">
        {/* Top summaries */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white shadow-lg`}> 
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="opacity-80">{c.label}</div>
            </div>
          ))}
        </div>

        {/* List of recordings */}
        <div className="text-white font-semibold mb-3">Recordings</div>

        {(liveDebates?.flatMap(d => d.recordings || []).length ?? 0) === 0 ? (
          <div className="text-gray-300 text-sm">No recordings yet.</div>
        ) : (
          <div className="space-y-3">
            {liveDebates
              .flatMap(d => (d.recordings || []).map((r: any) => ({ url: r.url, ts: r.timestamp, topic: d.topic })))
              .slice(-20)
              .reverse()
              .map((row: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="min-w-0 mr-4">
                    <div className="text-white/90 text-sm font-medium truncate">{row.topic || 'Debate'}</div>
                    <div className="text-xs text-gray-300">{new Date(row.ts).toLocaleString()}</div>
                    <audio src={row.url} controls preload="metadata" className="w-full h-8 mt-1" />
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <a href={row.url} download className="px-3 py-1 text-xs rounded-lg bg-white text-purple-900 font-semibold">Download</a>
                    <button
                      onClick={() =>
                        (navigator as any).share
                          ? (navigator as any).share({ title: 'Debate recording', url: row.url })
                          : navigator.clipboard.writeText(row.url)
                      }
                      className="px-3 py-1 text-xs rounded-lg bg-white/10 border border-white/20 text-white"
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Drawer / modal */}
        {active && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-[90%] max-w-4xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl border border-white/20 shadow-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold">{active.topic}</div>
                  <div className="text-sm opacity-80">{active.timestamp}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => shareReport()} className="px-4 py-2 bg-white text-purple-900 rounded-lg font-semibold">Share</button>
                  <button onClick={() => setActive(null)} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg font-semibold">Close</button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Generating report…</div>
              ) : report ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="font-semibold mb-2">Summary</div>
                      <div className="text-sm opacity-90 whitespace-pre-wrap">{report.summary || '—'}</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="font-semibold mb-2">Transcript</div>
                      <div className="text-sm opacity-90 whitespace-pre-wrap max-h-60 overflow-y-auto">{transcript || '—'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="font-semibold mb-2">Voice Feedback</div>
                      <div className="text-sm opacity-90 whitespace-pre-wrap">{report.voice || '—'}</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="font-semibold mb-3">Composition</div>
                      <Pie data={{ labels: ['Claims','Evidence','Rebuttals','Filler'], datasets: [{ data: report.composition || [40,30,20,10], backgroundColor: ['#a78bfa','#22d3ee','#34d399','#fb7185'] }] }} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    );

    async function openReport(row: { url: string; topic: string; ts: string }) {
      setActive({ url: row.url, topic: row.topic, timestamp: row.ts });
      setLoading(true);
      try {
        // Attempt transcription if URL is public
        let text: string | null = null;
        try {
          const res = await fetch(row.url, { mode: 'cors' });
          const buf = await res.arrayBuffer();
          text = await transcribeAudioWhisper(new Blob([buf], { type: 'audio/webm' }));
        } catch {}
        setTranscript(text);
        const ai = await analyzeDebateTranscript(text || 'No transcript available.', row.topic);
        const composition = ai ? [
          Math.max(10, Math.round((ai.keyPoints?.length || 3) * 10)),
          30,
          20,
          10,
        ] : [40,30,20,10];
        setReport({
          summary: ai?.argumentStrength?.rationale || 'Concise summary generated from available data.',
          voice: 'Pace stable, pauses natural. Pronunciation clear; slight trailing off at sentence ends. Try stronger emphasis on contrasts.',
          composition,
        });
      } finally {
        setLoading(false);
      }
    }

    function shareReport() {
      if (!active) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(active.url)}`;
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      alert('Shareable link copied to clipboard');
    }
  }
>>>>>>> origin/main

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
<<<<<<< HEAD
=======

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl transform animate-in fade-in duration-300">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Debate Saved!
            </h2>
            <p className="text-gray-600 mb-6">
              Your debate has been successfully created and saved to your recent activity.
            </p>
            <button 
              onClick={() => setShowSuccessPopup(false)}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-lg font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      )}
>>>>>>> origin/main
    </div>
  );
};

export default Debates;