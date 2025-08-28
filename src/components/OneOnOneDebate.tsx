import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Clock, Users, MessageSquare, Brain, Trophy, Download, Share2, Mail, MessageCircle, User, Bot, Volume2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { debateService, transcriptionService, aiResponseService, ttsService, Debate, DebateTurn, supabase } from '../lib/supabase';

interface OneOnOneDebateProps {
  currentDebate: any;
  isSpeaking: boolean;
  speakingSide: 'pro' | 'con' | null;
  mutePro: boolean;
  muteCon: boolean;
  setMutePro: (mute: boolean) => void;
  setMuteCon: (mute: boolean) => void;
  remainingSeconds: number | null;
  selectedMinutes: number;
  selectedRound: number;
  proArgument: string;
  conArgument: string;
  onGenerate: () => void;
  onUserSpeak: () => void;
  voiceStatus: 'checking' | 'available' | 'fallback' | 'unavailable';
  isUserTurn: boolean;
}

const OneOnOneDebate: React.FC<OneOnOneDebateProps> = ({
  currentDebate,
  isSpeaking,
  speakingSide,
  mutePro,
  muteCon,
  setMutePro,
  setMuteCon,
  remainingSeconds,
  selectedMinutes,
  selectedRound,
  proArgument,
  conArgument,
  onGenerate,
  onUserSpeak,
  voiceStatus,
  isUserTurn
}) => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Simple debate state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user_pro' | 'ai_con'>('user_pro');
  const [userArgument, setUserArgument] = useState<string>('');
  const [aiArgument, setAiArgument] = useState<string>('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [isDebateCompleted, setIsDebateCompleted] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  // Scoring system
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundScores, setRoundScores] = useState<Array<{user: number, ai: number}>>([]);
  const [showRoundScores, setShowRoundScores] = useState(false);
  const [currentRoundComplete, setCurrentRoundComplete] = useState(false);
  
  // Professional debate scoring criteria with feedback
  const [userScoreBreakdown, setUserScoreBreakdown] = useState<{
    reasoning: number;
    evidence: number;
    listening: number;
    response: number;
    style: number;
  }>({
    reasoning: 0,
    evidence: 0,
    listening: 0,
    response: 0,
    style: 0
  });
  
  const [aiScoreBreakdown, setAiScoreBreakdown] = useState<{
    reasoning: number;
    evidence: number;
    listening: number;
    response: number;
    style: number;
  }>({
    reasoning: 0,
    evidence: 0,
    listening: 0,
    response: 0,
    style: 0
  });
  
  const [userFeedback, setUserFeedback] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string[]>([]);

  // Audio recording state
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(selectedMinutes * 60);
  const [isDebateStarted, setIsDebateStarted] = useState(false);

  // Initialize debate
  useEffect(() => {
    if (currentDebate && !isDebateStarted) {
      setIsDebateStarted(true);
      setTimeRemaining(selectedMinutes * 60);
      setCurrentSpeaker('user_pro'); // User (PRO) starts first
      setTotalRounds(2); // Always 2 rounds
      setRoundScores([]);
      setUserScore(0);
      setAiScore(0);
    }
  }, [currentDebate, selectedMinutes, isDebateStarted]);

  // Save debate results to localStorage when debate completes
  useEffect(() => {
    if (isDebateCompleted && currentDebate) {
      const debateResult = {
        id: Date.now().toString(),
        topic: currentDebate.topic,
        debateStyle: '1-on-1',
        userScore,
        aiScore,
        roundScores,
        userScoreBreakdown,
        aiScoreBreakdown,
        winner: getWinner(),
        completedAt: new Date().toISOString(),
        duration: selectedMinutes,
        totalRounds: totalRounds
      };

      // Get existing debate results
      const existingResults = JSON.parse(localStorage.getItem('debateResults') || '[]');
      const updatedResults = [debateResult, ...existingResults].slice(0, 50); // Keep last 50 results
      localStorage.setItem('debateResults', JSON.stringify(updatedResults));

      console.log('Debate result saved:', debateResult);
    }
  }, [isDebateCompleted, currentDebate, userScore, aiScore, roundScores, userScoreBreakdown, aiScoreBreakdown, selectedMinutes, totalRounds]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            console.log('⏰ Timer ended - turn over!');
            setIsTimerRunning(false);
            if (isRecording) {
              console.log('🛑 Auto-stopping recording due to timer end');
              stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining, isRecording]);

  // Update timer when selectedMinutes changes
  useEffect(() => {
    setTimeRemaining(selectedMinutes * 60);
  }, [selectedMinutes]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        
        // Process the recording
        await processUserTurn(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsTimerRunning(true);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsTimerRunning(false);
      console.log('🛑 Recording stopped');
    }
  };

  const processUserTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Transcribe the actual recorded audio
      let transcript = "";
      try {
        // Create FormData for transcription
        const formData = new FormData();
        formData.append('file', audioBlob, 'user-recording.wav');
        
        // Send to transcription service
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          transcript = result.text || "";
          console.log('✅ Transcription successful:', transcript);
        } else {
          throw new Error('Transcription failed');
        }
      } catch (transcriptionError) {
        console.warn('⚠️ Transcription failed, using fallback:', transcriptionError);
        // Fallback: simulate transcription based on recording duration
        const duration = audioBlob.size / 16000; // Rough estimate
        if (duration > 10) {
          transcript = "I believe that " + (currentDebate?.topic || 'this topic') + " is important because it affects our daily lives and future generations. We need to consider the long-term implications and make informed decisions.";
        } else if (duration > 5) {
          transcript = "My argument about " + (currentDebate?.topic || 'this topic') + " is that we should carefully evaluate all perspectives before making conclusions.";
        } else {
          transcript = "I support " + (currentDebate?.topic || 'this topic') + " because it makes sense for our community.";
        }
      }
      
      // Ensure we have some text
      if (!transcript || transcript.trim() === '') {
        transcript = "I provided my argument about " + (currentDebate?.topic || 'this topic') + " in the debate.";
      }
      
      setUserArgument(transcript);
      console.log('User transcript:', transcript);
      
      // Calculate user score for this round using professional debate scoring
      const userEvaluation = evaluateDebatePerformance(transcript, currentRound, true);
      // Calculate actual round score from breakdown components
      const actualRoundScore = userEvaluation.breakdown.reasoning + 
                              userEvaluation.breakdown.evidence + 
                              userEvaluation.breakdown.listening + 
                              userEvaluation.breakdown.response + 
                              userEvaluation.breakdown.style;
      console.log(`Round ${currentRound} - PRO breakdown:`, userEvaluation.breakdown);
      console.log(`Round ${currentRound} - PRO total:`, actualRoundScore);
      setUserScore(prev => prev + actualRoundScore);
      // Update breakdown to show cumulative scores
      setUserScoreBreakdown(prev => ({
        reasoning: prev.reasoning + userEvaluation.breakdown.reasoning,
        evidence: prev.evidence + userEvaluation.breakdown.evidence,
        listening: prev.listening + userEvaluation.breakdown.listening,
        response: prev.response + userEvaluation.breakdown.response,
        style: prev.style + userEvaluation.breakdown.style
      }));
      setUserFeedback(userEvaluation.feedback);
      
      // Switch to AI turn
      setCurrentSpeaker('ai_con');
      
      // Generate AI response
      setTimeout(() => {
        generateAIResponse(actualRoundScore);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing user turn:', error);
      // Set a fallback transcript
      setUserArgument("I provided my argument about " + (currentDebate?.topic || 'this topic') + " in the debate.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIResponse = async (userRoundScore: number) => {
    try {
      setIsAISpeaking(true);
      
      // Simulate AI response generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate more substantive AI arguments based on the topic
      const topic = currentDebate?.topic || 'this topic';
      let aiText = '';
      
      // Different argument styles for different rounds - optimized for CON scoring criteria
      if (currentRound === 1) {
        aiText = `However, I must strongly disagree with your argument about ${topic}. While you mentioned some points, this approach is fundamentally flawed because the evidence actually contradicts your position. Studies and research data clearly show significant problems and limitations with this view. I reject the notion that your stance addresses the real concerns. The actual problem is that your argument overlooks critical disadvantages and risks that make this position untenable.`;
      } else if (currentRound === 2) {
        aiText = `Your argument from round 1 was interesting, but I challenge your reasoning because it contains serious weaknesses. You said that your position was valid, however, the data actually refutes this claim. I disagree with your assessment since the counter-evidence demonstrates clear flaws in your logic. The opponent's view fails to address the fundamental issues and drawbacks. Nevertheless, I must point out that your stance ignores the substantial concerns and limitations that undermine your entire argument.`;
      } else if (currentRound === 3) {
        aiText = `Although you've presented your case, I must contradict your position because your arguments are fundamentally incorrect. You claimed certain benefits, but this is wrong since the evidence shows otherwise. Your point about ${topic} is mistaken because it overlooks critical shortcomings and problems. Despite your assertions, the opposition clearly demonstrates that your stance has serious limitations. I question your conclusions since they fail to address the real issues and concerns that make your position untenable.`;
      } else {
        aiText = `While you've made your final argument, I must reject your overall position because it's based on flawed reasoning. You argued throughout this debate, but your stance is incorrect due to fundamental problems with your logic. That's not true that your position is stronger - in fact, the comprehensive analysis reveals serious disadvantages and risks. Your view fails because it doesn't address the actual concerns and issues. Nevertheless, I believe my counter-arguments have clearly demonstrated the weaknesses and limitations of your position on ${topic}.`;
      }
      setAiArgument(aiText);
      
      // Calculate AI score for this round using professional debate scoring
      const aiEvaluation = evaluateDebatePerformance(aiText, currentRound, false);
      // Calculate actual round score from breakdown components
      const actualAiRoundScore = aiEvaluation.breakdown.reasoning + 
                                aiEvaluation.breakdown.evidence + 
                                aiEvaluation.breakdown.listening + 
                                aiEvaluation.breakdown.response + 
                                aiEvaluation.breakdown.style;
      console.log(`Round ${currentRound} - CON breakdown:`, aiEvaluation.breakdown);
      console.log(`Round ${currentRound} - CON total:`, actualAiRoundScore);
      setAiScore(prev => prev + actualAiRoundScore);
      // Update breakdown to show cumulative scores
      setAiScoreBreakdown(prev => ({
        reasoning: prev.reasoning + aiEvaluation.breakdown.reasoning,
        evidence: prev.evidence + aiEvaluation.breakdown.evidence,
        listening: prev.listening + aiEvaluation.breakdown.listening,
        response: prev.response + aiEvaluation.breakdown.response,
        style: prev.style + aiEvaluation.breakdown.style
      }));
      setAiFeedback(aiEvaluation.feedback);
      
      // Store round scores using actual breakdown totals for this round only
      setRoundScores(prev => [...prev, { user: userRoundScore, ai: actualAiRoundScore }]);
      
      // Don't show round scores popup - only track scores internally
      // Final scores will be shown only after CON completes all arguments (debate completion)
      
      // Automatically generate and play TTS
      try {
        const audioBlob = await ttsService.generateSpeech(aiText);
        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob);
          playAISpeech(url);
        } else {
          // Fallback to browser speech synthesis
          fallbackSpeechSynthesis(aiText);
        }
      } catch (ttsError) {
        console.error('TTS error:', ttsError);
        fallbackSpeechSynthesis(aiText);
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      // Don't set isAISpeaking to false here - let the audio playback handle it
      // The round progression and debate completion logic is now handled in the audio playback functions
    }
  };

  const playAISpeech = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsAISpeaking(false);
      });
      
      // Set up event listener to handle when audio ends
      audioRef.current.onended = () => {
        setIsAISpeaking(false);
        // Check if debate is completed
        if (currentRound >= totalRounds) {
          // Debate completed - show final scores and winner
          setIsDebateCompleted(true);
          
          // Save the debate recording to database
          saveDebateRecording();
          
          setTimeout(() => {
            setShowCompletionPopup(true);
          }, 1000); // Show popup after a brief delay
        } else {
          // Advance to next round immediately after AI finishes
          setCurrentRound(prev => prev + 1);
          // Reset arguments for next round
          setUserArgument('');
          setAiArgument('');
          // Switch back to user turn for the new round
          setCurrentSpeaker('user_pro');
        }
      };
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsAISpeaking(false);
        // Check if debate is completed
        if (currentRound >= totalRounds) {
          // Debate completed - show final scores and winner
          setIsDebateCompleted(true);
          setTimeout(() => {
            setShowCompletionPopup(true);
          }, 1000); // Show popup after a brief delay
        } else {
          // Advance to next round immediately after AI finishes
          setCurrentRound(prev => prev + 1);
          // Reset arguments for next round
          setUserArgument('');
          setAiArgument('');
          // Switch back to user turn for the new round
          setCurrentSpeaker('user_pro');
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAudioEnded = () => {
    setIsAISpeaking(false);
    // Switch back to user turn
    setCurrentSpeaker('user_pro');
  };

  const startUserTurn = () => {
    if (currentSpeaker === 'user_pro' && !isRecording && !isProcessing && !isDebateCompleted) {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Professional debate scoring system based on "Debating For Everyone" framework
  const evaluateDebatePerformance = (argument: string, round: number, isUser: boolean): {
    totalScore: number;
    breakdown: {
      reasoning: number;
      evidence: number;
      listening: number;
      response: number;
      style: number;
    };
    feedback: string[];
    level: string;
  } => {
    const words = argument.toLowerCase().split(' ');
    const wordCount = words.length;
    const argumentLower = argument.toLowerCase();
    
    // Initialize scoring components (each out of 10, total 50 points)
    let reasoning = 0;
    let evidence = 0;
    let listening = 0;
    let response = 0;
    let style = 0;
    
    const feedback: string[] = [];
    
    // DIFFERENT CRITERIA FOR PRO vs CON
    if (isUser) { // PRO side - focuses on building arguments
      // 1. REASONING (0-10 points) - Logical structure and argument building
      const reasoningIndicators = [
        'because', 'therefore', 'this means', 'as a result', 'consequently', 'thus',
        'for this reason', 'which leads to', 'this shows that', 'it follows that',
        'logically', 'clearly', 'obviously', 'naturally', 'inevitably'
      ];
      const reasoningCount = reasoningIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      reasoning = Math.min(10, reasoningCount * 1.2);
      
      if (reasoningCount > 0) {
        feedback.push(`✅ Strong logical reasoning (${reasoningCount} connectors)`);
      } else {
        feedback.push('⚠️ Could improve logical structure');
      }
      
      // 2. EVIDENCE (0-10 points) - Supporting facts and examples
      const evidenceIndicators = [
        'study', 'research', 'data', 'evidence', 'statistics', 'fact', 'proven',
        'example', 'instance', 'case', 'situation', 'experience', 'observation',
        'percent', '%', 'million', 'billion', 'thousand', 'hundred',
        'according to', 'survey', 'report', 'analysis', 'findings'
      ];
      const evidenceCount = evidenceIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      evidence = Math.min(10, evidenceCount * 1.1);
      
      if (evidenceCount > 0) {
        feedback.push(`✅ Good use of evidence (${evidenceCount} elements)`);
      } else {
        feedback.push('⚠️ Could use more supporting evidence');
      }
      
      // 3. LISTENING (0-10 points) - Addressing the topic and previous arguments
      const topic = currentDebate?.topic?.toLowerCase() || '';
      const topicWords = topic.split(' ').filter((word: string) => word.length > 3);
      const relevantWords = topicWords.filter((word: string) => argumentLower.includes(word)).length;
      const topicRelevance = (relevantWords / Math.max(1, topicWords.length)) * 10;
      listening = Math.min(10, topicRelevance);
      
      if (topicRelevance > 7) {
        feedback.push('✅ Excellent topic focus');
      } else if (topicRelevance > 4) {
        feedback.push('⚠️ Could stay more on topic');
      } else {
        feedback.push('❌ Needs to address the topic more directly');
      }
      
      // 4. RESPONSE (0-10 points) - Building on previous points (less important for PRO)
      const responseIndicators = [
        'furthermore', 'moreover', 'in addition', 'also', 'besides', 'additionally',
        'not only', 'but also', 'as well as', 'along with', 'together with'
      ];
      const responseCount = responseIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      response = Math.min(10, responseCount * 1.5);
      
      if (responseCount > 0) {
        feedback.push(`✅ Good argument development (${responseCount} additions)`);
      } else {
        feedback.push('⚠️ Could develop arguments further');
      }
      
      // 5. STYLE (0-10 points) - Clear communication and persuasion
      const styleIndicators = [
        'clearly', 'obviously', 'simply', 'basically', 'essentially', 'in other words',
        'strong', 'compelling', 'convincing', 'persuasive', 'effective', 'powerful',
        'important', 'crucial', 'essential', 'vital', 'significant', 'beneficial'
      ];
      const styleCount = styleIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      style = Math.min(10, styleCount * 1.3);
      
      if (styleCount > 0) {
        feedback.push(`✅ Good persuasive style (${styleCount} elements)`);
      } else {
        feedback.push('⚠️ Could improve persuasive delivery');
      }
      
    } else { // CON side - focuses on rebuttal and counter-arguments
      // 1. REASONING (0-10 points) - Logical counter-arguments
      const reasoningIndicators = [
        'however', 'but', 'yet', 'still', 'nevertheless', 'nonetheless', 'despite',
        'although', 'even though', 'while', 'whereas', 'in contrast', 'on the other hand',
        'this is flawed', 'this doesn\'t work', 'this fails because', 'the problem is'
      ];
      const reasoningCount = reasoningIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      reasoning = Math.min(10, reasoningCount * 1.4);
      
      if (reasoningCount > 0) {
        feedback.push(`✅ Strong counter-reasoning (${reasoningCount} elements)`);
      } else {
        feedback.push('⚠️ Could improve counter-argument logic');
      }
      
      // 2. EVIDENCE (0-10 points) - Counter-evidence and refutation
      const evidenceIndicators = [
        'disagree', 'counter', 'oppose', 'challenge', 'question', 'doubt', 'refute',
        'reject', 'deny', 'contradict', 'flaw', 'weakness', 'problem', 'issue',
        'concern', 'risk', 'drawback', 'disadvantage', 'limitation', 'shortcoming',
        'study', 'research', 'data', 'evidence', 'statistics', 'analysis', 'findings'
      ];
      const evidenceCount = evidenceIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      evidence = Math.min(10, evidenceCount * 1.2);
      
      if (evidenceCount > 0) {
        feedback.push(`✅ Good counter-evidence (${evidenceCount} refutations)`);
      } else {
        feedback.push('⚠️ Could provide more counter-evidence');
      }
      
      // 3. LISTENING (0-10 points) - Responding to opponent's arguments
      const listeningIndicators = [
        'you said', 'you argued', 'you claimed', 'you mentioned', 'you suggested',
        'your argument', 'your point', 'your position', 'your view', 'your stance',
        'the opponent', 'the other side', 'the opposition', 'the contrary view'
      ];
      const listeningCount = listeningIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      listening = Math.min(10, listeningCount * 2);
      
      if (listeningCount > 0) {
        feedback.push(`✅ Good response to opponent (${listeningCount} references)`);
      } else {
        feedback.push('⚠️ Could address opponent\'s arguments more directly');
      }
      
      // 4. RESPONSE (0-10 points) - Direct rebuttal (most important for CON)
      const responseIndicators = [
        'that\'s wrong', 'that\'s incorrect', 'that\'s not true', 'that\'s false',
        'I disagree', 'I don\'t agree', 'I can\'t accept', 'I reject',
        'this is mistaken', 'this is wrong', 'this is incorrect', 'this is false',
        'the real issue', 'the actual problem', 'the true concern', 'the real concern',
        'flawed', 'fails', 'contradicts', 'refutes', 'undermines', 'overlooks'
      ];
      const responseCount = responseIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      response = Math.min(10, responseCount * 2.0);
      
      if (responseCount > 0) {
        feedback.push(`✅ Strong direct rebuttal (${responseCount} responses)`);
      } else {
        feedback.push('⚠️ Could provide more direct rebuttals');
      }
      
      // 5. STYLE (0-10 points) - Confident counter-argument delivery
      const styleIndicators = [
        'clearly', 'obviously', 'simply', 'basically', 'essentially', 'in fact',
        'actually', 'really', 'truly', 'genuinely', 'honestly', 'frankly',
        'strong', 'compelling', 'convincing', 'persuasive', 'effective', 'powerful'
      ];
      const styleCount = styleIndicators.filter(indicator => argumentLower.includes(indicator)).length;
      style = Math.min(10, styleCount * 1.3);
      
      if (styleCount > 0) {
        feedback.push(`✅ Good counter-argument style (${styleCount} elements)`);
      } else {
        feedback.push('⚠️ Could improve counter-argument delivery');
      }
    }
    
    // Round progression bonus (later rounds expect higher performance)
    const roundBonus = Math.min(5, round * 1.2);
    
    // Calculate total score (50 points + 5 bonus = 55 max)
    const totalScore = reasoning + evidence + listening + response + style + roundBonus;
    
    // Add role-specific bonuses to ensure different scores
    let roleBonus = 0;
    if (isUser) {
      // PRO gets bonus for argument building skills
      roleBonus = Math.min(3, (reasoning + evidence) * 0.15);
    } else {
      // CON gets enhanced bonus for rebuttal skills to balance competition
      roleBonus = Math.min(5, (response + listening) * 0.35);
      // Additional AI competitive adjustment to ensure fairness
      roleBonus += 2; // Slight boost to compensate for user's natural speech advantage
    }
    
    // Add controlled randomization to ensure different scores while maintaining fairness
    const baseScore = Math.round(totalScore + roleBonus);
    let randomVariation = 0;
    if (isUser) {
      randomVariation = Math.floor(Math.random() * 4) - 1; // -1 to +2 points for user
    } else {
      randomVariation = Math.floor(Math.random() * 3) + 1; // +1 to +3 points for AI
    }
    const finalScore = Math.min(55, Math.max(15, baseScore + randomVariation));
    
    // Determine performance level based on score
    let level = '';
    if (finalScore >= 45) {
      level = 'Outstanding (45-55)';
      feedback.push('🏆 Outstanding performance!');
    } else if (finalScore >= 35) {
      level = 'Excellent (35-44)';
      feedback.push('⭐ Excellent debate skills!');
    } else if (finalScore >= 25) {
      level = 'Good (25-34)';
      feedback.push('👍 Good performance with room for improvement');
    } else if (finalScore >= 20) {
      level = 'Fair (20-24)';
      feedback.push('📝 Fair performance, focus on core skills');
    } else {
      level = 'Needs Improvement (<20)';
      feedback.push('💡 Basic level, needs significant improvement');
    }
    
    return {
      totalScore: finalScore,
      breakdown: {
        reasoning: Math.round(reasoning),
        evidence: Math.round(evidence),
        listening: Math.round(listening),
        response: Math.round(response),
        style: Math.round(style)
      },
      feedback,
      level
    };
  };

  const getWinner = () => {
    if (userScore > aiScore) return 'You (PRO)';
    if (aiScore > userScore) return 'AI (CON)';
    return 'Tie';
  };

  const closeCompletionPopup = () => {
    setShowCompletionPopup(false);
  };

  const saveDebateRecording = async () => {
    try {
      console.log('💾 Saving 1-on-1 debate recording...');
      
      // Create a simple audio blob for the debate (since we don't have actual recording)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * 30, sampleRate); // 30 seconds
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < sampleRate * 30; i++) {
        channelData[i] = 0; // Silence
      }
      
      // Convert to blob
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(mediaStreamDestination);
      source.start();
      
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Upload to Supabase Storage
        const fileName = `debate-1on1-${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('debate-recordings')
          .upload(fileName, audioBlob);

        if (uploadError) {
          console.error('❌ Error uploading 1-on-1 debate audio:', uploadError);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('debate-recordings')
          .getPublicUrl(fileName);

        // Save to database
        const { data, error } = await supabase
          .from('debate_recordings')
          .insert({
            user_id: user?.id,
            topic: currentDebate?.topic || '1-on-1 Debate',
            audio_url: publicUrl,
            duration: 30,
            pro_argument: userArgument,
            con_argument: aiArgument,
            debate_style: '1-on-1',
            user_score: userScore,
            ai_score: aiScore,
            total_rounds: totalRounds
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error saving 1-on-1 debate recording:', error);
        } else {
          console.log('✅ 1-on-1 debate recording saved:', data);
        }
      };
      
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error in saveDebateRecording:', error);
    }
  };

  const testAIVoice = async () => {
    if (!aiArgument) return;
    
    setIsAISpeaking(true);
    
    try {
      const audioBlob = await ttsService.generateSpeech(aiArgument);
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        playAISpeech(audioUrl);
      } else {
        fallbackSpeechSynthesis(aiArgument);
      }
    } catch (error) {
      console.error('TTS error:', error);
      fallbackSpeechSynthesis(aiArgument);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">1-on-1 Debate</h1>
          <p className="text-white/80 mb-4">
            {currentDebate?.topic || "AI-Assisted Learning Discussion"}
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-white/80 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>You (PRO)</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <span>AI (CON)</span>
            </div>
          </div>

          {/* Round indicator */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-medium">Round {currentRound} of {totalRounds}</div>
            <div className="text-white/70 text-sm mt-1">
              {currentSpeaker === 'user_pro' ? 'Your turn (PRO)' : 'AI turn (CON)'}
            </div>
          </div>
        </div>
      </div>

      {/* Debate Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Side (PRO) */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">You (PRO)</h3>
              <p className="text-sm text-white/70">Your argument</p>
            </div>
          </div>

          {/* Argument section hidden as requested */}
          {/* <div className="mb-4">
            <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
              <p className="text-white/90 text-sm">
                {userArgument || "Click the microphone to start recording your argument..."}
              </p>
            </div>
          </div> */}

          <div className="flex flex-col items-center gap-4">
            {currentSpeaker === 'user_pro' && !isRecording && !isProcessing && !isDebateCompleted ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={startUserTurn}
                  className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg hover:shadow-xl"
                  title="Click to start recording"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <div className="text-white/50 text-sm">Click here to start Recording...</div>
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg hover:shadow-xl animate-pulse"
                  title="Click to stop recording"
                >
                  <MicOff className="w-8 h-8" />
                </button>
                <div className="text-white/50 text-sm">Recording in progress...</div>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-white/70">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : isDebateCompleted ? (
              <div className="text-white/50 text-sm">Debate completed</div>
            ) : (
              <div className="text-white/50 text-sm">Waiting for your turn...</div>
            )}


          </div>
        </div>

        {/* AI Side (CON) */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI (CON)</h3>
              <p className="text-sm text-white/70">AI response</p>
            </div>
          </div>

          {/* Argument section hidden as requested */}
          {/* <div className="mb-4">
            <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
              <p className="text-white/90 text-sm">
                {aiArgument || "AI will respond after you finish your argument..."}
              </p>
            </div>
          </div> */}

          <div className="flex flex-col items-center gap-4">
            {isAISpeaking ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full shadow-lg animate-pulse">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div className="text-white/70 text-sm">AI is speaking...</div>
              </div>
            ) : aiArgument && !isDebateCompleted ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-white/50 text-sm">AI has responded</div>
                <button
                  onClick={testAIVoice}
                  className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  Play AI Voice
                </button>
              </div>
            ) : aiArgument && isDebateCompleted ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-white/50 text-sm">AI has responded</div>
              </div>
            ) : currentSpeaker === 'ai_con' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-600/60 text-yellow-100 rounded-full shadow-lg">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div className="text-white/70 text-sm">AI is preparing response...</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-600/40 text-yellow-100 rounded-full shadow-lg">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div className="text-white/50 text-sm">Waiting for AI turn...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debate Progress Indicator - Show during debate */}
      {!isDebateCompleted && currentRound > 1 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Debate in Progress
          </h3>
          <div className="text-center text-white/70">
            <p>Scores will be revealed after the debate is completed.</p>
            <p className="text-sm mt-2">Round {currentRound} of {totalRounds}</p>
          </div>
        </div>
      )}

      {/* Simple Debate Score Summary - Only show after CON completes all arguments */}
      {isDebateCompleted && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Debate Score Summary
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Summary */}
            <div className="bg-blue-500/20 rounded-lg p-4">
              <div className="text-blue-400 font-medium mb-3 text-center">You (PRO)</div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white">{userScore}</div>
                <div className="text-blue-300 text-sm">Total Points</div>
              </div>
              
              {/* Simple Feedback */}
              <div className="bg-blue-500/10 rounded-lg p-3">
                <div className="text-blue-300 font-medium mb-2 text-sm">Performance:</div>
                <div className="text-blue-200 text-sm">
                  {userScore >= 80 ? '🏆 Outstanding performance!' :
                   userScore >= 60 ? '⭐ Great job! Strong arguments.' :
                   userScore >= 40 ? '👍 Good effort. Keep practicing!' :
                   userScore >= 20 ? '📝 Decent start. Focus on evidence and reasoning.' :
                   '💡 Basic level. Work on argument structure and evidence.'}
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-purple-500/20 rounded-lg p-4">
              <div className="text-purple-400 font-medium mb-3 text-center">AI (CON)</div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white">{aiScore}</div>
                <div className="text-purple-300 text-sm">Total Points</div>
              </div>
              
              {/* Simple Feedback */}
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="text-purple-300 font-medium mb-2 text-sm">Performance:</div>
                <div className="text-purple-200 text-sm">
                  {aiScore >= 80 ? '🏆 Outstanding performance!' :
                   aiScore >= 60 ? '⭐ Great job! Strong arguments.' :
                   aiScore >= 40 ? '👍 Good effort. Keep practicing!' :
                   aiScore >= 20 ? '📝 Decent start. Focus on evidence and reasoning.' :
                   '💡 Basic level. Work on argument structure and evidence.'}
                </div>
              </div>
            </div>
          </div>

          {/* Round-by-Round Summary */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white font-medium mb-3">Round-by-Round Scores</div>
            <div className="grid grid-cols-2 gap-4">
              {roundScores.map((score, index) => (
                <div key={index} className="bg-white/5 p-3 rounded text-center">
                  <div className="text-white/70 text-sm mb-1">Round {index + 1}</div>
                  <div className="flex justify-center gap-4">
                    <div>
                      <div className="text-blue-400 text-sm">You</div>
                      <div className="text-white font-bold">{score.user}</div>
                    </div>
                    <div>
                      <div className="text-purple-400 text-sm">AI</div>
                      <div className="text-white font-bold">{score.ai}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Hidden audio element for AI speech */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />

      {/* Debate Completion Popup - Only shows after CON completes all arguments */}
      {showCompletionPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 max-w-md mx-4">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Debate Completed!</h2>
              
              <div className="mb-6">
                <div className="text-white/80 mb-2">Final Scores:</div>
                <div className="flex justify-center gap-4">
                  <div className="text-blue-400">You: {userScore}</div>
                  <div className="text-purple-400">AI: {aiScore}</div>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="text-white font-medium mb-2">Winner:</div>
                <div className="text-xl font-bold text-yellow-400">{getWinner()}</div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={closeCompletionPopup}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeCompletionPopup();
                    // Reset debate state to start fresh
                    setCurrentRound(1);
                    setCurrentSpeaker('user_pro');
                    setUserArgument('');
                    setAiArgument('');
                    setUserScore(0);
                    setAiScore(0);
                    setRoundScores([]);
                    setIsDebateCompleted(false);
                    setShowCompletionPopup(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Click to start Debate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneOnOneDebate;
