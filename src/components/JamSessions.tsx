import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, StopCircle, X, Brain, Sparkles, Volume2, BookOpen, MessageSquare, Music, Clock, FileText, BarChart3, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';

// Custom CSS for enhanced talking animations
const talkingStyles = `
  @keyframes talkBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes mouthMove {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.2); }
  }
  
  @keyframes sparkleFloat {
    0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
    50% { transform: translateY(-10px) rotate(180deg); opacity: 0.7; }
    100% { transform: translateY(0px) rotate(360deg); opacity: 1; }
  }
  
  @keyframes soundWave {
    0%, 100% { height: 4px; }
    50% { height: 16px; }
  }
  
  .talking-character {
    animation: talkBounce 0.8s ease-in-out infinite;
  }
  
  .mouth-animation {
    animation: mouthMove 0.6s ease-in-out infinite;
  }
  
  .sparkle-effect {
    animation: sparkleFloat 2s ease-in-out infinite;
  }
  
  .sound-wave {
    animation: soundWave 0.5s ease-in-out infinite;
  }
`;

const JamSessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('JAM Session');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const [originalWaveform, setOriginalWaveform] = useState<number[]>([]);
  const [latestRecordedWord, setLatestRecordedWord] = useState<string>('JAM Session');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Content creation state
  const [createdContent, setCreatedContent] = useState<any>(null);
  const [summary, setSummary] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [recordedText, setRecordedText] = useState<string>('');

  // Recording Studio state
  const [selectedCharacter, setSelectedCharacter] = useState('superhero1');
  const [selectedTimer, setSelectedTimer] = useState('2');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { vocabList } = useVocabulary();

  // Character options with icons
  const characterOptions = [
    // Superhero Characters
    { id: 'superhero1', name: 'Captain Courage', icon: '🦸‍♀️', description: 'Brave superhero who protects the galaxy' },
    { id: 'superhero2', name: 'Lightning Bolt', icon: '⚡', description: 'Speedster who runs faster than light' },
    { id: 'superhero3', name: 'Aqua Girl', icon: '🧜‍♀️', description: 'Ocean guardian who talks to sea creatures' },
    { id: 'superhero4', name: 'Tech Whiz', icon: '🤖', description: 'Genius inventor with robot friends' },
    
    // Magical Characters
    { id: 'wizard', name: 'Merlin the Wise', icon: '🧙‍♂️', description: 'Ancient wizard who knows all spells' },
    { id: 'fairy', name: 'Sparkle the Fairy', icon: '🧚‍♀️', description: 'Magical fairy who grants wishes' },
    { id: 'dragon', name: 'Flame the Dragon', icon: '🐉', description: 'Friendly dragon who breathes rainbow fire' },
    { id: 'phoenix', name: 'Blaze the Phoenix', icon: '🦅', description: 'Mystical bird that rises from ashes' },
    
    // Space Explorers
    { id: 'astronaut', name: 'Star Explorer', icon: '👨‍🚀', description: 'Space adventurer who visits planets' },
    { id: 'alien', name: 'Ziggy the Alien', icon: '👽', description: 'Friendly alien from Planet Zog' },
    { id: 'robot', name: 'Beep the Robot', icon: '🤖', description: 'Smart robot who loves to learn' },
    { id: 'spaceship', name: 'Rocket Ship', icon: '🚀', description: 'Fastest spaceship in the universe' },
    
    // Animal Characters
    { id: 'lion', name: 'King Leo', icon: '🦁', description: 'Noble lion king of the jungle' },
    { id: 'elephant', name: 'Ellie the Wise', icon: '🐘', description: 'Gentle giant with amazing memory' },
    { id: 'dolphin', name: 'Splash the Dolphin', icon: '🐬', description: 'Playful dolphin who loves to swim' },
    { id: 'penguin', name: 'Waddle the Penguin', icon: '🐧', description: 'Adventurous penguin from Antarctica' },
    { id: 'giraffe', name: 'Tall Sally', icon: '🦒', description: 'Tallest giraffe who sees everything' },
    { id: 'koala', name: 'Cuddles the Koala', icon: '🐨', description: 'Sleepy koala who loves to hug' },
    { id: 'panda', name: 'Bamboo the Panda', icon: '🐼', description: 'Gentle panda who loves to eat bamboo' },
    { id: 'tiger', name: 'Stripe the Tiger', icon: '🐯', description: 'Brave tiger with orange stripes' },
    
    // Fantasy Characters
    { id: 'unicorn', name: 'Rainbow the Unicorn', icon: '🦄', description: 'Magical unicorn with rainbow mane' },
    { id: 'mermaid', name: 'Coral the Mermaid', icon: '🧜‍♀️', description: 'Beautiful mermaid who sings underwater' },
    { id: 'knight', name: 'Sir Braveheart', icon: '⚔️', description: 'Brave knight who protects the kingdom' },
    { id: 'ninja', name: 'Shadow the Ninja', icon: '🥷', description: 'Silent ninja who moves like wind' },
    
    // Fun Characters
    { id: 'clown', name: 'Giggles the Clown', icon: '🤡', description: 'Funny clown who makes everyone laugh' },
    { id: 'pirate', name: 'Captain Hook', icon: '🏴‍☠️', description: 'Adventurous pirate who hunts for treasure' },
    { id: 'cowboy', name: 'Wild West Will', icon: '🤠', description: 'Cowboy who rides horses in the desert' },
    { id: 'detective', name: 'Sherlock Junior', icon: '🔍', description: 'Smart detective who solves mysteries' },
    
    // Nature Characters
    { id: 'tree', name: 'Oak the Tree', icon: '🌳', description: 'Wise old tree who tells stories' },
    { id: 'flower', name: 'Blossom the Flower', icon: '🌸', description: 'Beautiful flower that blooms in spring' },
    { id: 'butterfly', name: 'Flutter the Butterfly', icon: '🦋', description: 'Colorful butterfly who loves to dance' },
    { id: 'bee', name: 'Buzz the Bee', icon: '🐝', description: 'Busy bee who makes honey' },
    
    // Food Characters
    { id: 'pizza', name: 'Pepperoni Pete', icon: '🍕', description: 'Delicious pizza who loves to share' },
    { id: 'icecream', name: 'Scoops the Ice Cream', icon: '🍦', description: 'Sweet ice cream who never melts' },
    { id: 'cookie', name: 'Chip the Cookie', icon: '🍪', description: 'Chocolate chip cookie who is always fresh' },
    { id: 'apple', name: 'Red Apple Annie', icon: '🍎', description: 'Healthy apple who keeps doctors away' },
    
    // 3D Animated Characters for Kids
    { id: 'minion', name: 'Bello the Minion', icon: '💛', description: 'Silly minion who loves bananas and fun' },
    { id: 'pikachu', name: 'Sparky the Pikachu', icon: '⚡', description: 'Electric Pokémon who loves adventures' },
    { id: 'mickey', name: 'Magic Mickey', icon: '🐭', description: 'Magical mouse who makes dreams come true' },
    { id: 'elsa', name: 'Princess Elsa', icon: '❄️', description: 'Ice princess with magical powers' },
    { id: 'spiderman', name: 'Webby Spider-Man', icon: '🕷️', description: 'Friendly neighborhood superhero' },
    { id: 'buzz', name: 'Space Ranger Buzz', icon: '🚀', description: 'Space ranger who protects the galaxy' },
    { id: 'woody', name: 'Sheriff Woody', icon: '🤠', description: 'Brave cowboy who leads the toys' },
    { id: 'nemo', name: 'Swimmy Nemo', icon: '🐠', description: 'Adventurous clownfish who explores the ocean' },
    { id: 'dory', name: 'Forgetful Dory', icon: '🐟', description: 'Friendly fish who helps friends' },
    { id: 'simba', name: 'King Simba', icon: '🦁', description: 'Lion king who rules the pride lands' },
    { id: 'ariel', name: 'Mermaid Ariel', icon: '🧜‍♀️', description: 'Curious mermaid who loves to sing' },
    { id: 'aladdin', name: 'Street Rat Aladdin', icon: '🕌', description: 'Clever boy who finds magic lamps' },
    { id: 'jasmine', name: 'Princess Jasmine', icon: '👑', description: 'Brave princess who seeks adventure' },
    { id: 'genie', name: 'Wishful Genie', icon: '🧞‍♂️', description: 'Magical genie who grants wishes' },
    { id: 'belle', name: 'Bookworm Belle', icon: '📚', description: 'Smart princess who loves to read' },
    { id: 'beast', name: 'Gentle Beast', icon: '🐻', description: 'Kind beast who learns to love' },
    { id: 'cinderella', name: 'Dreamy Cinderella', icon: '👗', description: 'Kind girl who never gives up' },
    { id: 'snowwhite', name: 'Sweet Snow White', icon: '🍎', description: 'Gentle princess who befriends animals' },
    { id: 'rapunzel', name: 'Long Hair Rapunzel', icon: '👸', description: 'Adventurous princess with magic hair' },
    { id: 'moana', name: 'Ocean Moana', icon: '🌊', description: 'Brave girl who saves her island' },
    { id: 'maui', name: 'Strong Maui', icon: '🏝️', description: 'Mighty demigod who shapes the world' },
    { id: 'anna', name: 'Sister Anna', icon: '❄️', description: 'Loving sister who never gives up' },
    { id: 'olaf', name: 'Warm Olaf', icon: '☃️', description: 'Friendly snowman who loves summer' },
    { id: 'sven', name: 'Loyal Sven', icon: '🦌', description: 'Faithful reindeer who helps friends' },
    { id: 'kristoff', name: 'Ice Man Kristoff', icon: '⛏️', description: 'Kind ice harvester who loves his reindeer' }
  ];

  // Timer options
  const timerOptions = [
    { value: '1', label: '1 minute' },
    { value: '2', label: '2 minutes' },
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '7', label: '7 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '20', label: '20 minutes' }
  ];

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const startWaveformAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateWaveform = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const waveformData = Array.from(dataArray).slice(0, 32);
      setRecordingWaveform(waveformData);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
  };

  const stopWaveformAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRecordingWaveform([]);
  };

  const handleStartRecording = async () => {
    setAudioURL(null);
    setAudioBlob(null);
    setRecordedText('');
    audioChunks.current = [];
    setRecordingWaveform([]);
    
    // Start timer
    const selectedTimeInMinutes = parseInt(selectedTimer);
    const selectedTimeInSeconds = selectedTimeInMinutes * 60;
    setTimeRemaining(selectedTimeInSeconds);
    setTimerActive(true);
    
    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setTimerActive(false);
          // Auto-stop recording when timer reaches zero
          if (mediaRecorderRef.current && isRecording) {
            handleStopRecording();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setLatestRecordedWord(currentWord);
        stream.getTracks().forEach(track => track.stop());
        stopWaveformAnalysis();
        setTimerActive(false);
        clearInterval(timerInterval);
        
        // Generate transcription after audio is processed
        setTimeout(() => {
          const sampleTranscriptions = [
            "Hello everyone, today I want to talk about the importance of environmental conservation and how we can all contribute to making our planet a better place for future generations.",
            "In my opinion, technology has revolutionized the way we learn and communicate. It has opened up new opportunities for education and collaboration across the globe.",
            "I believe that mental health awareness is crucial in today's fast-paced world. We need to prioritize our well-being and support those around us who may be struggling.",
            "The future of renewable energy looks promising. Solar and wind power are becoming more efficient and affordable, offering sustainable alternatives to fossil fuels.",
            "Education is the key to unlocking human potential. It empowers individuals to think critically, solve problems, and contribute meaningfully to society."
          ];
          const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
          setRecordedText(randomTranscription);
        }, 500);
      };
      mediaRecorder.start();
      setIsRecording(true);
      startWaveformAnalysis(stream);
    } catch (err) {
      alert('Microphone access denied or not available.');
      setTimerActive(false);
      clearInterval(timerInterval);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopWaveformAnalysis();
    }
  };

  const handleClearRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingWaveform([]);
    setRecordedText('');
    stopWaveformAnalysis();
  };

  const handleCreateContent = async () => {
    if (!summary || !ageGroup || !proficiencyLevel || !curriculum) {
      alert('Please fill in all fields');
      return;
    }

    // Show loading state
    setCreatedContent({
      title: summary,
      ageGroup: ageGroup,
      proficiencyLevel: proficiencyLevel,
      curriculum: curriculum,
      createdAt: new Date().toLocaleString(),
      status: 'Generating...',
      isLoading: true
    });

    // Simulate content generation
    setTimeout(() => {
      const generatedContent = {
        content: `I'd be happy to explain "${summary}" using a simple analogy that young learners can understand!

Imagine you're at a birthday party with lots of delicious cupcakes. The cupcakes represent the main idea of ${summary}, and the party guests are like different ways to understand it. 

Here's how ${summary} works in simple terms:

• **What is it?** ${summary} is like a special tool or concept that helps us understand something important in our world.

• **Why does it matter?** Just like how knowing how to read helps us understand stories, understanding ${summary} helps us make sense of things around us.

• **Real-world example:** Think about how ${summary} might be like learning to ride a bicycle - at first it seems complicated, but once you understand the basics, it becomes natural and fun!

• **Fun fact:** Did you know that ${summary} is connected to many things you see every day? It's like a hidden puzzle piece that makes everything work better.

**Discussion ideas for your JAM session:**
1. "What would the world be like without ${summary}?"
2. "How does ${summary} make our lives easier?"
3. "Can you think of three examples of ${summary} in your daily life?"
4. "What questions do you have about ${summary}?"

**Activities to try:**
• Draw a picture showing ${summary} in action
• Create a simple story about a character learning about ${summary}
• Play a guessing game where you describe ${summary} without saying its name
• Make a mini-presentation explaining ${summary} to your friends

Remember, the best way to understand ${summary} is to explore it with curiosity and imagination! What aspect of ${summary} interests you the most?`,
        webSources: [
          'Educational Research Database',
          'Academic Journals',
          'International Education Resources',
          'Curriculum Development Centers',
          'Peer-reviewed Publications',
          'Expert Analysis Reports'
        ],
        keywords: [summary.toLowerCase(), ageGroup, proficiencyLevel, curriculum, 'education', 'learning', 'interactive', 'analogy', 'explanation']
      };
      
      setCreatedContent({
        ...generatedContent,
        title: summary,
        ageGroup: ageGroup,
        proficiencyLevel: proficiencyLevel,
        curriculum: curriculum,
        createdAt: new Date().toLocaleString(),
        status: 'Generated',
        isLoading: false
      });
    }, 2000);

    // Clear form
    setSummary('');
    setAgeGroup('');
    setProficiencyLevel('');
    setCurriculum('');
  };

  const renderCreateContentTab = () => (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Content</h2>
        
        <div className="space-y-6">
          {/* Content Creation Form */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Content Creation</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Summary</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter your JAM session topic..."
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Age Group</label>
                <select 
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select age group...</option>
                  <option value="primary" className="bg-gray-800 text-white">Primary (6–10 years)</option>
                  <option value="secondary" className="bg-gray-800 text-white">Secondary (11–14 years)</option>
                  <option value="higher-secondary" className="bg-gray-800 text-white">Higher secondary / Adult learners</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Language Proficiency Level</label>
                <select 
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select proficiency level...</option>
                  <option value="beginner" className="bg-gray-800 text-white">Beginner</option>
                  <option value="intermediate" className="bg-gray-800 text-white">Intermediate</option>
                  <option value="advanced" className="bg-gray-800 text-white">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Curriculum</label>
                <select 
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select curriculum...</option>
                  <option value="ib-pyp" className="bg-gray-800 text-white">IB PYP</option>
                  <option value="ib-myp" className="bg-gray-800 text-white">IB MYP</option>
                  <option value="ib-dp" className="bg-gray-800 text-white">IB DP</option>
                  <option value="cbse" className="bg-gray-800 text-white">CBSE</option>
                  <option value="cambridge" className="bg-gray-800 text-white">Cambridge</option>
                </select>
              </div>
            
              <button 
                onClick={handleCreateContent}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Create Content
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-12">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Recent Activity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Activity Item 1 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Environmental Conservation</h4>
              <p className="text-gray-300 text-sm mb-3">Content created for Primary students</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">2 hours ago</p>
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">Completed</span>
              </div>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Technology Impact Discussion</h4>
              <p className="text-gray-300 text-sm mb-3">Recording session completed</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">1 day ago</p>
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">Recording</span>
              </div>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Mental Health Awareness</h4>
              <p className="text-gray-300 text-sm mb-3">Analytics report generated</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">3 days ago</p>
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">Analysis</span>
              </div>
            </div>
          </div>

          {/* Activity Item 4 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Renewable Energy Debate</h4>
              <p className="text-gray-300 text-sm mb-3">Discussion topic created</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">1 week ago</p>
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">Topic</span>
              </div>
            </div>
          </div>
        </div>

        {/* View All Activities Button */}
        <div className="text-center pt-8">
          <button className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30 text-lg">
            View All Activities
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecordingStudioTab = () => (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Recording Studio</h2>
        
        <div className="space-y-8">
          {/* Unified Recording Interface */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-8 border border-purple-500/30 relative">
            {/* Character and Timer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Character Selection Dropdown */}
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Choose Your Character</label>
                <select 
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  {characterOptions.map((character) => (
                    <option key={character.id} value={character.id} className="bg-gray-800 text-white text-lg py-2">
                      <span className="text-2xl mr-3">{character.icon}</span> {character.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timer Selection Dropdown */}
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Session Duration</label>
                <select 
                  value={selectedTimer}
                  onChange={(e) => setSelectedTimer(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-green-400"
                >
                  {timerOptions.map((timer) => (
                    <option key={timer.value} value={timer.value} className="bg-gray-800 text-white">
                      {timer.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Character Display */}
            <div className="mb-8 flex items-center justify-center relative">
              <div className={`relative transition-all duration-300 ${
                isRecording ? 'scale-110' : 'scale-100'
              }`}>
                {/* Character Icon with Enhanced Talking Animation */}
                <div className="relative">
                  <span className={`text-9xl transition-all duration-300 ${
                    isRecording ? 'animate-bounce talking-character' : ''
                  }`}>
                    {characterOptions.find(c => c.id === selectedCharacter)?.icon}
                  </span>
                  
                  {/* Enhanced Talking Animation - Mouth Movement Effect */}
                  {isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full animate-ping opacity-75 mouth-animation"></div>
                    </div>
                  )}
                </div>
                
                {/* Character-specific talking effects */}
                {isRecording && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Sparkle effects for magical characters */}
                    {['wizard', 'fairy', 'unicorn', 'phoenix', 'genie', 'elsa', 'ariel', 'rapunzel'].includes(selectedCharacter) && (
                      <div className="absolute -top-4 -right-4">
                        <div className="text-yellow-300 text-lg sparkle-effect">✨</div>
                      </div>
                    )}
                    
                    {/* Lightning effects for superhero characters */}
                    {['superhero1', 'superhero2', 'superhero3', 'superhero4', 'spiderman', 'pikachu'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -left-2">
                        <div className="text-yellow-400 text-sm animate-pulse">⚡</div>
                      </div>
                    )}
                    
                    {/* Water effects for ocean characters */}
                    {['dolphin', 'mermaid', 'nemo', 'dory', 'aqua'].includes(selectedCharacter) && (
                      <div className="absolute -bottom-2 -left-2">
                        <div className="text-blue-400 text-sm animate-bounce" style={{ animationDuration: '1s' }}>💧</div>
                      </div>
                    )}
                    
                    {/* Fire effects for dragon and phoenix */}
                    {['dragon', 'phoenix'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -right-2">
                        <div className="text-orange-500 text-sm animate-pulse">🔥</div>
                      </div>
                    )}
                    
                    {/* Robot effects for robot characters */}
                    {['robot', 'buzz', 'tech'].includes(selectedCharacter) && (
                      <div className="absolute -top-3 -left-3">
                        <div className="text-cyan-400 text-sm animate-pulse">⚙️</div>
                      </div>
                    )}
                    
                    {/* Space effects for space characters */}
                    {['astronaut', 'alien', 'spaceship'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -right-2">
                        <div className="text-purple-400 text-sm animate-pulse">🚀</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Timer Display - Top right of robot */}
              {timerActive && (
                <div className="absolute -top-4 -right-4 text-2xl font-bold text-red-400 bg-black/50 rounded-full px-3 py-1">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Animated Waveform */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="flex items-end space-x-1 h-16">
                {isRecording ? (
                  // Animated waveform during recording
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-cyan-400 to-pink-400 rounded-sm animate-pulse"
                      style={{
                        width: '4px',
                        height: `${Math.random() * 60 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))
                ) : recordingWaveform.length > 0 ? (
                  // Static waveform from recorded audio
                  recordingWaveform.map((value, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-cyan-400 to-pink-400 rounded-sm"
                      style={{
                        width: '4px',
                        height: `${(value / 255) * 60}px`,
                        minHeight: '4px'
                      }}
                    />
                  ))
                ) : (
                  // Placeholder waveform
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gray-400 rounded-sm"
                      style={{
                        width: '4px',
                        height: '8px'
                      }}
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Recording Controls - Centered */}
            <div className="flex flex-col items-center space-y-4">
              {/* Record Button - Centered */}
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isRecording 
                    ? 'bg-white animate-pulse' 
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {isRecording ? (
                  <StopCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>
            
            {/* Audio Playback - Only show when audio is available */}
            {audioURL && (
              <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-center mb-3">
                  <h4 className="text-white font-semibold text-lg">Recording Complete!</h4>
                  <p className="text-gray-300 text-sm">Your audio is ready to play</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-white/20">
                  <audio 
                    controls 
                    src={audioURL} 
                    className="w-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleClearRecording}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Record New Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-12">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Recent Activity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Activity Item 1 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Environmental Conservation Discussion</h4>
              <p className="text-gray-300 text-sm mb-3">Recording session with Captain Courage</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">1 hour ago</p>
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">Completed</span>
              </div>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Technology Impact Debate</h4>
              <p className="text-gray-300 text-sm mb-3">Recording session with Lightning Bolt</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">3 hours ago</p>
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">Recording</span>
              </div>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Mental Health Awareness Talk</h4>
              <p className="text-gray-300 text-sm mb-3">Recording session with Sparkle the Fairy</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">1 day ago</p>
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">Analysis</span>
              </div>
            </div>
          </div>

          {/* Activity Item 4 */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Renewable Energy Presentation</h4>
              <p className="text-gray-300 text-sm mb-3">Recording session with Splash the Dolphin</p>
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">2 days ago</p>
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">Topic</span>
              </div>
            </div>
          </div>
        </div>

        {/* View All Activities Button */}
        <div className="text-center pt-8">
          <button className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30 text-lg">
            View All Activities
          </button>
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Insights & Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
            <div className="text-white font-semibold">Clarity Score</div>
          </div>
          <div className="bg-white/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">127</div>
            <div className="text-white font-semibold">Words Spoken</div>
          </div>
          <div className="bg-white/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">2m 15s</div>
            <div className="text-white font-semibold">Session Duration</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Pronunciation Accuracy</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Speaking Pace</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Confidence Level</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Custom CSS for talking animations */}
      <style dangerouslySetInnerHTML={{ __html: talkingStyles }} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-16 py-4 bg-white/10 shadow-md">
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
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
          <h1 className="text-5xl font-bold text-white">JAM Sessions</h1>
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

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-12 px-4">
        <div className="max-w-8xl w-full flex justify-center gap-12">
          {/* Left Section */}
          <div className="flex flex-col items-center flex-1 max-w-4xl">
            {/* Tab Bar */}
            <div className="flex gap-6 mb-4 mt-8">
              {[
                { id: 'create', label: 'Create Content', icon: Plus },
                { id: 'record', label: 'Recording Studio', icon: Mic },
                { id: 'insights', label: 'Insights', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 rounded-lg font-semibold text-xl transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900 border-2 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/40 hover:text-white border-2 border-white/30 hover:border-white/50'
                  }`}
                >
                  <tab.icon className="w-6 h-6 inline mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="w-full flex justify-center">
              {activeTab === 'create' && renderCreateContentTab()}
              {activeTab === 'record' && renderRecordingStudioTab()}
              {activeTab === 'insights' && renderInsightsTab()}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[380px] h-[680px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-blue-200/50 p-10 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">
                {activeTab === 'create' ? 'Content Notes' : 'Audio Notes'}
              </h3>
            </div>
            
            {activeTab === 'record' ? (
              // Show Audio Notes only for Recording Studio tab
              <>
                {recordedText ? (
                  // Show recorded text when available
                  <div className="flex-1 overflow-y-auto">
                    <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-lg p-4 border border-green-500/30">
                      <h4 className="font-semibold text-white mb-3">Recorded Audio Text</h4>
                      <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                        {recordedText}
                      </div>
                    </div>
                  </div>
                ) : audioURL && !recordedText ? (
                  // Show loading state when audio is recorded but text is not yet available
                  <div className="flex-1 overflow-y-auto">
                    <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-lg p-4 border border-yellow-500/30">
                      <h4 className="font-semibold text-white mb-3">Processing Audio...</h4>
                      <div className="text-gray-200 text-sm leading-relaxed">
                        Converting your recorded audio to text. This may take a few moments...
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show default Audio Notes content when no recording
                  <>
                    <p className="text-gray-300 text-sm mb-6">
                      Your recorded audio will appear here as text after you complete a recording session.
                    </p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="bg-white/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-400 mb-2">0</div>
                        <div className="text-white font-semibold">Recordings</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
                        <div className="text-white font-semibold">Words Transcribed</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-2">0m</div>
                        <div className="text-white font-semibold">Total Time</div>
                      </div>
                    </div>
                    
                    <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                      Start Recording
                    </button>
                  </>
                )}
              </>
            ) : activeTab === 'create' && createdContent ? (
              // Show created content when Create Content tab is active
              <div className="flex-1 overflow-y-auto">
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-3">AI-Generated Content</h4>
                  <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {createdContent.content}
                  </div>
                </div>
              </div>
            ) : (
              // Show default insights for other tabs
              <>
                <p className="text-gray-300 text-sm mb-6">
                  Track your JAM session progress and get personalized feedback to improve your speaking skills.
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
                    <div className="text-white font-semibold">Accuracy Score</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">127</div>
                    <div className="text-white font-semibold">Words Practiced</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">2h 15m</div>
                    <div className="text-white font-semibold">Practice Time</div>
                  </div>
                </div>
                
                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  View Detailed Report
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JamSessions;

