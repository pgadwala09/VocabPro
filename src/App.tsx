import React, { useState } from 'react';
import { Play, BookOpen, Zap, Users, Star, Brain, Image, Lightbulb, Target, ChevronDown, ChevronUp, Menu, X, Mic, FileText, BarChart3, Bot, SpellCheck as Spell, Share2, Upload, MessageSquare, HelpCircle, CreditCard, MoreHorizontal, Edit3, TrendingUp, UserCheck, Volume2, Monitor, Smartphone, Tablet, ArrowDown, Activity, Video, BarChart, Sparkles, Twitter, Instagram, Youtube, Linkedin, Github, File, Music, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VocabPractice from './components/vocabpractice';
import LandingPage from './components/LandingPage';
import { RecordingProvider } from './hooks/RecordingContext';
import Flashcards from './components/Flashcards';
import { VocabularyProvider } from './hooks/VocabularyContext';
import { FeedbackProvider } from './hooks/FeedbackContext';
import Insights from './components/Insights';
import TongueTwisterChallenge from './components/TongueTwisterChallenge';
import MysterySoundBox from './components/MysterySoundBox';
import SoundSafari from './components/SoundSafari';
import FlashcardTrainer from './components/FlashcardTrainer';
import SpellingPractice from './components/SpellingPractice';
import SpellingPracticeTrainer from './components/SpellingPracticeTrainer';
import DictationQuiz from './components/DictationQuiz';
import PronunciationPractice from './components/PronunciationPractice';
import JamSessions from './components/JamSessions';

export interface LibraryItem {
  name: string;
  type: 'file' | 'text' | 'audio' | 'screenshot' | 'link';
  icon: React.ReactNode;
}

function App() {
  const [playingVideo, setPlayingVideo] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { user, loading } = useAuth();

  const initialLibraryItems: LibraryItem[] = [
    // Documents
    { name: 'EnglishNotes.pdf', type: 'file', icon: <File className="w-6 h-6 text-purple-600" /> },
    { name: 'VocabularyList.docx', type: 'file', icon: <File className="w-6 h-6 text-purple-600" /> },
    { name: 'EssayDraft.txt', type: 'file', icon: <FileText className="w-6 h-6 text-indigo-600" /> },
    // Audio Files
    { name: 'LectureAudio.wav', type: 'audio', icon: <Music className="w-6 h-6 text-blue-600" /> },
    { name: 'PronunciationPractice.mp3', type: 'audio', icon: <Music className="w-6 h-6 text-blue-600" /> },
    { name: 'StoryRecording.m4a', type: 'audio', icon: <Music className="w-6 h-6 text-blue-600" /> },
    // Screenshots
    { name: 'Screenshot1.png', type: 'screenshot', icon: <ImageIcon className="w-6 h-6 text-green-600" /> },
    { name: 'VocabAppScreen.jpg', type: 'screenshot', icon: <ImageIcon className="w-6 h-6 text-green-600" /> },
    { name: 'HomeworkSnap.png', type: 'screenshot', icon: <ImageIcon className="w-6 h-6 text-green-600" /> },
  ];

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(initialLibraryItems);

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

  const handleLoginSuccess = () => setShowLogin(false);
  const handleSignupSuccess = () => setShowSignup(false);
  const handleLogout = () => {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <FeedbackProvider>
      <VocabularyProvider>
        <RecordingProvider>
          <BrowserRouter>
            <Routes>
                             <Route path="/login" element={<LoginPage onBack={() => setShowLogin(false)} onSignupClick={() => { setShowLogin(false); setShowSignup(true); }} onLoginSuccess={handleLoginSuccess} />} />
               <Route path="/signup" element={<SignupPage onBack={() => setShowSignup(false)} onLoginClick={() => { setShowSignup(false); setShowLogin(true); }} onSignupSuccess={handleSignupSuccess} />} />
               <Route path="/dashboard" element={user ? <Dashboard onLogout={handleLogout} libraryItems={libraryItems} /> : <Navigate to="/login" />} />
               <Route path="/vocabpractice" element={user ? <VocabPractice libraryItems={libraryItems} setLibraryItems={setLibraryItems} /> : <Navigate to="/login" />} />
               <Route path="/jamsessions" element={user ? <JamSessions /> : <Navigate to="/login" />} />
               <Route path="/pronunciation" element={user ? <PronunciationPractice /> : <Navigate to="/login" />} />
               <Route path="/spelling-practice" element={<SpellingPracticeTrainer />} />
               <Route path="/insights" element={<Insights />} />
               <Route path="/tongue-twister" element={<TongueTwisterChallenge />} />
               <Route path="/mystery-sound-box" element={<MysterySoundBox />} />
               <Route path="/sound-safari" element={<SoundSafari />} />
               <Route path="/flashcards-trainer" element={<FlashcardTrainer />} />
               <Route path="/dictation-quiz" element={<DictationQuiz />} />
               <Route path="/*" element={<LandingPage />} />
            </Routes>
          </BrowserRouter>
        </RecordingProvider>
      </VocabularyProvider>
    </FeedbackProvider>
  );
}

export default App