import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Home, 
  Plus, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Share, 
  LogOut,
  X,
  Flower2, 
  List,
  User,
  Moon,
  Sun,
  Download,
  Clock,
  Mail,
  Lock,
  ArrowRight,
  Camera,
  Edit2,
  Check
} from 'lucide-react';
import { auth } from './firebaseClient';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

// --- Constants & Config ---

const PROMPTS = [
  "How did today feel in one sentence?",
  "What surprised you today?",
  "What drained you today?",
  "What gave you energy today?",
  "What’s one thing you’ll remember about today?",
  "What moment are you holding onto?",
  "If today had a color, what would it be?",
  "What did your body feel like today?",
  "Who are you grateful for today?",
  "What’s one thing you wish you did differently?",
  "What felt overwhelming today?",
  "What gave you peace today?",
  "What made you feel loved today?",
  "What made you feel distant today?",
  "How did you connect with others today?",
  "What’s one thing you were proud of today?",
  "What made you laugh today?",
  "What made you mad today?",
  "What helped you survive today?",
  "What did you notice about your thoughts today?",
  "How would you title today like a movie?",
  "What would your inner child say about today?",
  "What made you feel stuck?",
  "What helped you cope?",
  "What’s something small that mattered?",
  "What do you want to remember tomorrow?",
  "What do you need more of?",
  "What are you hiding from?",
  "What softened your heart today?",
  "What held you together today?",
  "What moment did you want to run from?",
  "What gave you hope?"
];

const MOODS = [
  { emoji: '😌', label: 'Peaceful', color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
  { emoji: '😔', label: 'Sad', color: 'bg-blue-100 text-blue-600', darkColor: 'bg-blue-900/30 text-blue-300' },
  { emoji: '😤', label: 'Frustrated', color: 'bg-red-100 text-red-600', darkColor: 'bg-red-900/30 text-red-300' },
  { emoji: '🥰', label: 'Loved', color: 'bg-pink-100 text-pink-600', darkColor: 'bg-pink-900/30 text-pink-300' },
  { emoji: '🤯', label: 'Overwhelmed', color: 'bg-purple-100 text-purple-600', darkColor: 'bg-purple-900/30 text-purple-300' }
];

const WELCOME_MESSAGES = [
  "Welcome, {name}.",
  "Ready, {name}?",
  "Hello, {name}.",
  "Hi, {name}.",
  "Begin, {name}."
];

// --- Helper Functions ---

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const getDayName = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const getLastThirtyDaysEntries = (entries) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 29);
  return entries.filter((entry) => new Date(entry.date) >= cutoff);
};

// --- Sub-Components (Defined outside App to prevent re-render bugs) ---

const AuthView = ({
  isDarkMode,
  authMode,
  setAuthMode,
  handleLogin,
  handleSignUp,
  handleResetPassword,
  handleGoogleLogin,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  authMessage,
  isAuthBusy
}) => {
  const isSignUp = authMode === 'signup';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-8 animate-in fade-in duration-700 ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border shadow-xl ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/40 border-white/60'}`}>
        <span className="text-4xl">💭</span>
      </div>
      <div>
        <h1 className="text-3xl font-serif font-medium">One Sentence</h1>
        <p className={`mt-2 ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>Capture your life, one day at a time.</p>
      </div>

      {/* Hide Google Sign-In on iOS native - not fully configured yet */}
      {!Capacitor.isNativePlatform() && (
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isAuthBusy}
          className={`w-full max-w-xs py-3 rounded-2xl border flex items-center justify-center space-x-3 font-medium transition-colors ${isAuthBusy ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'border-white/10 bg-white/5 text-indigo-100 hover:bg-white/10' : 'border-white/60 bg-white/80 text-slate-700 hover:bg-white'}`}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-slate-700 text-sm font-bold">G</span>
          <span>Continue with Google</span>
        </button>
      )}

      <div className={`w-full max-w-xs flex items-center justify-between rounded-2xl p-1 border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-white/50 bg-white/60'}`}>
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${isSignUp ? (isDarkMode ? 'text-indigo-300' : 'text-slate-500') : (isDarkMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-white text-rose-500 shadow-md')}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('signup')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${isSignUp ? (isDarkMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-white text-rose-500 shadow-md') : (isDarkMode ? 'text-indigo-300' : 'text-slate-500')}`}
        >
          Sign Up
        </button>
      </div>

      {authMessage && (
        <div className={`text-sm ${authMessage.type === 'error' ? (isDarkMode ? 'text-rose-300' : 'text-rose-500') : (isDarkMode ? 'text-emerald-300' : 'text-emerald-600')}`}>
          {authMessage.text}
        </div>
      )}

      {isSignUp ? (
        <form onSubmit={handleSignUp} className="w-full max-w-xs space-y-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-800'}`}>
            <User size={20} className={isDarkMode ? 'text-indigo-300' : 'text-slate-400'} />
            <input
              type="text"
              placeholder="Full Name"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder:text-opacity-50 placeholder:text-current"
              maxLength={24}
              required
            />
          </div>

          <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-800'}`}>
            <Mail size={20} className={isDarkMode ? 'text-indigo-300' : 'text-slate-400'} />
            <input
              type="email"
              placeholder="Email Address"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder:text-opacity-50 placeholder:text-current"
              required
            />
          </div>

          <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-800'}`}>
            <Lock size={20} className={isDarkMode ? 'text-indigo-300' : 'text-slate-400'} />
            <input
              type="password"
              placeholder="Create Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder:text-opacity-50 placeholder:text-current"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isAuthBusy}
            className={`w-full py-4 rounded-2xl font-medium shadow-lg transition-all flex items-center justify-center space-x-2 ${isAuthBusy ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-900/50' : 'bg-white/80 hover:bg-white text-rose-500 shadow-rose-200'}`}
          >
            <span>Create Account</span>
            <ArrowRight size={18} />
          </button>

          <p className={`text-xs ${isDarkMode ? 'text-indigo-300' : 'text-slate-500'}`}>
            Already have an account?{' '}
            <button type="button" onClick={() => setAuthMode('login')} className={`font-semibold underline ${isDarkMode ? 'text-indigo-200' : 'text-rose-500'}`}>
              Sign in instead
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-800'}`}>
            <Mail size={20} className={isDarkMode ? 'text-indigo-300' : 'text-slate-400'} />
            <input
              type="email"
              placeholder="Email Address"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder:text-opacity-50 placeholder:text-current"
              required
            />
          </div>

          <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-800'}`}>
            <Lock size={20} className={isDarkMode ? 'text-indigo-300' : 'text-slate-400'} />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder:text-opacity-50 placeholder:text-current"
              required
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={!loginEmail || isAuthBusy}
              className={`text-xs font-medium ${isAuthBusy || !loginEmail ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'text-indigo-300 hover:text-white' : 'text-slate-500 hover:text-rose-500'}`}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isAuthBusy}
            className={`w-full py-4 rounded-2xl font-medium shadow-lg transition-all flex items-center justify-center space-x-2 ${isAuthBusy ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-900/50' : 'bg-white/80 hover:bg-white text-rose-500 shadow-rose-200'}`}
          >
            <span>Begin Journaling</span>
            <ArrowRight size={18} />
          </button>

          <p className={`text-xs ${isDarkMode ? 'text-indigo-300' : 'text-slate-500'}`}>
            Need an account?{' '}
            <button type="button" onClick={() => setAuthMode('signup')} className={`font-semibold underline ${isDarkMode ? 'text-indigo-200' : 'text-rose-500'}`}>
              Sign up for free
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

const DashboardView = ({ user, entries, setView, setSelectedDate, isDarkMode }) => {
  // Logic
  const getEntryForDate = (date) => entries.find(e => e.date === date);
  const todayEntry = getEntryForDate(formatDate(new Date()));

  const calculateStreak = () => {
    let streak = 0;
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = formatDate(new Date());
    const hasToday = sortedEntries.some(e => e.date === today);

    if (!hasToday) return 0;

    let currentDate = new Date();

    while (true) {
      const dateStr = formatDate(currentDate);
      if (sortedEntries.some(e => e.date === dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getMonthMood = () => {
    const recentEntries = getLastThirtyDaysEntries(entries);
    if (recentEntries.length === 0) return null;
    const counts = {};
    recentEntries.forEach(e => counts[e.mood] = (counts[e.mood] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const streak = calculateStreak();
  const commonMood = getMonthMood();
  
  const lastYearDate = new Date();
  lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
  const lastYearEntry = getEntryForDate(formatDate(lastYearDate));

  // Rotating Welcome Message
  const welcomeMsg = useMemo(() => {
    const template = WELCOME_MESSAGES[new Date().getDate() % WELCOME_MESSAGES.length];
    return template.replace("{name}", user?.name || "Dreamer");
  }, [user?.name]);

  const todayDisplay = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h2 className={`text-xl font-serif leading-tight ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>
            {welcomeMsg}
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>{todayDisplay}</p>
        </div>
        <button onClick={() => setView('calendar')} className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
          Insights &rarr;
        </button>
      </div>

      {/* Today's Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 text-center space-y-4 border shadow-xl backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 shadow-indigo-900/20' : 'bg-white/60 border-white/40 shadow-rose-200/50'}`}>
        {todayEntry ? (
          <div onClick={() => { setSelectedDate(todayEntry.date); setView('details'); }} className="cursor-pointer">
            <span className="text-6xl filter drop-shadow-sm">{todayEntry.mood}</span>
            <p className={`mt-4 font-serif text-lg italic ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>"{todayEntry.text}"</p>
            <div className={`mt-2 text-xs uppercase tracking-widest font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Recorded Today</div>
          </div>
        ) : (
          <div className="py-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${isDarkMode ? 'bg-indigo-900/50' : 'bg-white/60 text-rose-400'}`}>
              <span className="text-2xl">✍️</span>
            </div>
            <p className={`font-medium ${isDarkMode ? 'text-indigo-200' : 'text-slate-600'}`}>You haven't written yet.</p>
            <button 
              onClick={() => { setSelectedDate(formatDate(new Date())); setView('write'); }}
              className={`mt-6 px-8 py-3 rounded-full shadow-lg transition-transform hover:scale-105 ${isDarkMode ? 'bg-indigo-600 text-white shadow-indigo-900/50' : 'bg-white/80 text-rose-500 shadow-rose-300/50'}`}
            >
              Write Entry
            </button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`backdrop-blur-md rounded-3xl p-5 border flex flex-col items-center justify-center space-y-2 shadow-lg ${isDarkMode ? 'bg-white/5 border-white/10 shadow-indigo-900/10' : 'bg-white/40 border-white/40 shadow-rose-100'}`}>
          <Flower2 className={`w-8 h-8 ${streak > 0 ? (isDarkMode ? 'text-pink-400' : 'text-pink-500') : (isDarkMode ? 'text-slate-700' : 'text-slate-400')}`} />
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-indigo-50' : 'text-slate-700'}`}>{streak}</span>
          <span className={`text-xs uppercase tracking-wide font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Current Streak</span>
        </div>
        <div className={`backdrop-blur-md rounded-3xl p-5 border flex flex-col items-center justify-center space-y-2 shadow-lg ${isDarkMode ? 'bg-white/5 border-white/10 shadow-indigo-900/10' : 'bg-white/40 border-white/40 shadow-rose-100'}`}>
          <span className="text-3xl">{commonMood || '—'}</span>
          <span className={`text-xs text-center uppercase tracking-wide font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>30-Day Vibe</span>
        </div>
      </div>

      {/* Last Year */}
      {lastYearEntry && (
        <div className={`backdrop-blur-md rounded-3xl p-6 border cursor-pointer shadow-lg ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-white/40 border-white/40 shadow-rose-100'}`} onClick={() => { setSelectedDate(lastYearEntry.date); setView('details'); }}>
          <div className={`flex items-center space-x-2 mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
            <Star size={16} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider">One Year Ago</span>
          </div>
          <p className={`font-serif italic ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>"{lastYearEntry.text}"</p>
        </div>
      )}
    </div>
  );
};

const WriteView = ({ selectedDate, entries, setEntries, setView, dailyPrompt, isDarkMode }) => {
    // Initialize with selectedDate passed from Calendar/Dashboard
    const [entryDate, setEntryDate] = useState(selectedDate);
    const [text, setText] = useState('');
    const [mood, setMood] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [mattered, setMattered] = useState(false);
    const fileInputRef = useRef(null);

    // Helpers
    const getEntryForDate = (date) => entries.find(e => e.date === date);

    // Fetch existing data if editing/backdating
    useEffect(() => {
      const existing = getEntryForDate(entryDate);
      if (existing) {
        setText(existing.text);
        setMood(existing.mood);
        setPhoto(existing.photo);
        setMattered(existing.mattered);
      } else {
        setText('');
        setMood(null);
        setPhoto(null);
        setMattered(false);
      }
    }, [entryDate]);

    const handleSave = () => {
      if (!mood) {
        alert("Please select a mood first");
        return;
      }
      const newEntry = {
        date: entryDate,
        text: text.trim(),
        mood,
        photo,
        mattered,
        prompt: dailyPrompt,
        timestamp: Date.now()
      };
      
      const filtered = entries.filter(e => e.date !== entryDate);
      setEntries([...filtered, newEntry]);
      setView('dashboard');
    };

    const handlePhoto = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPhoto(reader.result);
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="h-full flex flex-col animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView('dashboard')} className={`p-2 -ml-2 ${isDarkMode ? 'text-indigo-300' : 'text-slate-500'}`}>
            <X />
          </button>
          
          <div className="relative">
            <input 
              type="date" 
              value={entryDate}
              max={formatDate(new Date())}
              onChange={(e) => setEntryDate(e.target.value)}
              className={`bg-transparent text-xs font-bold tracking-widest uppercase text-center focus:outline-none cursor-pointer ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}
            />
          </div>
          
          <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pb-32">
          {/* Mood Selector */}
          <div className="flex justify-between px-2">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => setMood(m.emoji)}
                className={`flex flex-col items-center space-y-2 transition-transform ${mood === m.emoji ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
              >
                <span className="text-4xl filter drop-shadow-sm">{m.emoji}</span>
              </button>
            ))}
          </div>
          {mood && <p className={`text-center text-sm font-medium animate-in fade-in ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>I am feeling {MOODS.find(m => m.emoji === mood)?.label}</p>}

          {/* Text Area */}
          <div className="relative">
            <textarea
              className={`w-full h-64 bg-transparent text-xl font-serif placeholder:text-opacity-50 focus:outline-none resize-none leading-relaxed ${isDarkMode ? 'text-indigo-50 placeholder:text-indigo-400' : 'text-slate-800 placeholder:text-slate-400'}`}
              maxLength={420}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder=""
            />
            {!text && (
              <div className="absolute top-0 left-0 w-full pointer-events-none">
                <p className={`text-xl font-serif italic ${isDarkMode ? 'text-indigo-400/50' : 'text-slate-300/70'}`}>{dailyPrompt}</p>
              </div>
            )}
            <div className={`absolute bottom-2 right-0 text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>
              {text.length}/420
            </div>
          </div>

          <p className={`text-center text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-400/70'}`}>
            I can't force you, but I strongly suggest just one sentence.
          </p>

          {/* Extras */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-2xl border flex items-center justify-center transition-colors ${photo ? 'border-rose-300 bg-rose-50 text-rose-500' : (isDarkMode ? 'border-indigo-800 text-indigo-400' : 'border-white/50 bg-white/30 text-slate-500')}`}
            >
              <ImageIcon size={20} />
            </button>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhoto} />

            <button 
              onClick={() => setMattered(!mattered)}
              className={`flex-1 p-3 rounded-2xl border flex items-center justify-center space-x-2 transition-colors ${mattered ? 'border-amber-300 bg-amber-50 text-amber-600' : (isDarkMode ? 'border-indigo-800 text-indigo-400' : 'border-white/50 bg-white/30 text-slate-500')}`}
            >
              <Star size={20} fill={mattered ? "currentColor" : "none"} />
              <span className="text-sm font-medium">This entry mattered</span>
            </button>
          </div>
          
          {photo && (
            <div className="relative rounded-2xl overflow-hidden shadow-md">
              <img src={photo} alt="Attached" className="w-full h-48 object-cover" />
              <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className={`absolute bottom-6 left-6 right-6 p-2 rounded-3xl ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/60'} backdrop-blur-md`}>
           <button 
            onClick={handleSave}
            disabled={!text || !mood}
            className={`w-full py-3 rounded-2xl font-medium transition-colors ${text && mood ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-rose-400 text-white shadow-md') : (isDarkMode ? 'bg-indigo-900/50 text-indigo-500/50' : 'bg-white/80 text-slate-400 shadow-sm')}`}
          >
            Save Entry
          </button>
        </div>
      </div>
    );
  };

const CalendarView = ({ entries, setSelectedDate, setView, isDarkMode }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const getEntryForDate = (date) => entries.find(e => e.date === date);

    // Monday Start Logic
    let firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const changeMonth = (offset) => {
      const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
      setCurrentMonth(new Date(newDate));
    };

    // Insights Logic
    const getDominantMood = (filteredEntries) => {
      if (!filteredEntries || filteredEntries.length === 0) return null;
      const counts = {};
      filteredEntries.forEach(e => counts[e.mood] = (counts[e.mood] || 0) + 1);
      const topEmoji = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      return MOODS.find(m => m.emoji === topEmoji);
    };

     // 1. Last 30 Days
     const recentEntries = getLastThirtyDaysEntries(entries);
     const lastMonthVibe = getDominantMood(recentEntries);
    // ---------------------------

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div className="space-y-6 pb-24">
         <div className="flex items-center justify-between">
           <h2 className={`text-2xl font-serif ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>Insights</h2>
           <div className="flex space-x-4">
             <button onClick={() => changeMonth(-1)} className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-indigo-800 text-indigo-300' : 'hover:bg-white/50 text-slate-600'}`}><ChevronLeft size={20} /></button>
             <span className={`font-medium w-24 text-center ${isDarkMode ? 'text-indigo-200' : 'text-slate-600'}`}>
               {currentMonth.toLocaleString('default', { month: 'short' })} {currentMonth.getFullYear()}
             </span>
             <button onClick={() => changeMonth(1)} className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-indigo-800 text-indigo-300' : 'hover:bg-white/50 text-slate-600'}`}><ChevronRight size={20} /></button>
           </div>
         </div>

         <div className="grid grid-cols-7 gap-2 text-center mb-2">
           {['M','T','W','T','F','S','S'].map((d, i) => <span key={i} className={`text-xs font-bold ${isDarkMode ? 'text-indigo-500' : 'text-slate-400'}`}>{d}</span>)}
         </div>

         <div className="grid grid-cols-7 gap-2">
           {blanks.map(b => <div key={`blank-${b}`} />)}
           {days.map(day => {
             const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const entry = getEntryForDate(dateStr);
             const isToday = dateStr === formatDate(new Date());
             const isFuture = new Date(dateStr) > new Date();

             return (
               <button 
                 key={day}
                 disabled={isFuture}
                 onClick={() => {
                   setSelectedDate(dateStr);
                   if (entry) {
                     setView('details');
                   } else {
                     // BACKDATING ENABLED
                     setView('write');
                   }
                 }}
                 className={`aspect-square rounded-2xl flex items-center justify-center text-sm transition-all relative 
                   ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                   ${entry 
                     ? (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/80 shadow-md text-slate-700 hover:scale-105') 
                     : (isDarkMode ? 'bg-indigo-900/20 text-indigo-800 hover:bg-indigo-900/40' : 'bg-white/30 text-slate-500 hover:bg-white/50')
                   } ${isToday ? (isDarkMode ? 'ring-2 ring-indigo-400' : 'ring-2 ring-rose-400') : ''}`}
               >
                 {entry ? <span className="text-xl">{entry.mood}</span> : day}
                 {entry?.mattered && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />}
               </button>
             );
           })}
         </div>

         {/* --- INSIGHTS SECTION --- */}
         <div className="grid grid-cols-1 gap-3 mt-4">
            {/* Last 30 Days Card */}
            <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white/40 border-white/50 shadow-rose-100'}`}>
                <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Last 30 Days</h4>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>
                        {lastMonthVibe 
                          ? `You were mostly ${lastMonthVibe.label} ${lastMonthVibe.emoji}` 
                    : "No data recorded"}
                    </p>
                </div>
                <div className="text-2xl">{lastMonthVibe?.emoji || '—'}</div>
            </div>
         </div>

         {/* Palette Section */}
         <div className={`p-4 rounded-2xl border backdrop-blur-md mt-3 ${isDarkMode ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white/40 border-white/50 shadow-rose-100'}`}>
           <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Your Palette</h4>
           <div className="flex justify-between items-end h-16 space-x-2">
             {MOODS.map(m => {
               const count = entries.filter(e => e.mood === m.emoji).length;
               const height = Math.max(10, count * 5) + '%';
               return (
                 <div key={m.emoji} className="flex-1 flex flex-col items-center space-y-2 group">
                   <div className={`w-full rounded-t-lg relative ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`} style={{ height }}>
                      <div className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 opacity-50 ${isDarkMode ? m.darkColor.split(' ')[0] : m.color.split(' ')[0]} h-full`} />
                   </div>
                   <span className="text-lg">{m.emoji}</span>
                   <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>{count}</span>
                 </div>
               );
             })}
           </div>
         </div>
      </div>
    );
};

const ProfileView = ({ user, setUser, isDarkMode, setIsDarkMode, handleLogout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const fileInputRef = useRef(null);

    const handleSaveProfile = () => {
      const trimmedName = editName.trim();
      if (trimmedName.length === 0) {
        alert('Please enter a name.');
        return;
      }
      if (trimmedName.length > 24) {
        alert('Name must be 24 characters or fewer.');
        return;
      }
      const updatedUser = { ...user, name: trimmedName };
        setUser(updatedUser);
        localStorage.setItem('journal_user_v3', JSON.stringify(updatedUser));
        setIsEditing(false);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedUser = { ...user, avatar: reader.result };
                setUser(updatedUser);
                localStorage.setItem('journal_user_v3', JSON.stringify(updatedUser));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
      <div className="space-y-6 pb-24">
        <h2 className={`text-2xl font-serif ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>Settings</h2>

        {/* User Card */}
        <div className={`p-6 rounded-3xl border flex items-center space-x-4 shadow-lg ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-white/40 shadow-rose-100 border-white/40'}`}>
          <div className="relative">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-2xl text-white font-serif overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
             >
                {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : (user?.name?.[0] || 'D')}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
             <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md text-slate-500">
                <Camera size={12} />
             </div>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
                <div className="flex items-center space-x-2">
                    <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full bg-transparent border-b ${isDarkMode ? 'border-indigo-400 text-white' : 'border-slate-400 text-slate-800'} focus:outline-none`}
                    />
                    <button onClick={handleSaveProfile} className="text-green-500"><Check size={18} /></button>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <h3 className={`font-bold ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>{user?.name || 'Dreamer'}</h3>
                    <button onClick={() => setIsEditing(true)} className={`${isDarkMode ? 'text-indigo-400' : 'text-slate-400'} hover:scale-110 transition-transform`}><Edit2 size={14} /></button>
                </div>
            )}
            <p className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>{user?.email}</p>
          </div>
        </div>

        <div className={`rounded-3xl border overflow-hidden shadow-lg ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40 shadow-rose-100'}`}>
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full p-4 flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/50'}`}
          >
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon size={20} className="text-purple-300" /> : <Sun size={20} className="text-amber-500" />}
              <span className={`font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>Dream Mode</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-purple-500' : 'bg-rose-200'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : ''}`} />
            </div>
          </button>
          
          <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}`} />

          {/* Contact Developer */}
          <button
            onClick={async () => {
              try {
                const { completed } = await AppLauncher.openUrl({ 
                  url: 'mailto:hello@walruscreativeworks.com' 
                });
                if (!completed) {
                  alert('Email: hello@walruscreativeworks.com\n\nMail app not available in simulator. This will work on a real device!');
                }
              } catch (error) {
                console.error('Failed to open email:', error);
                alert('Email: hello@walruscreativeworks.com\n\nMail app not available in simulator. This will work on a real device!');
              }
            }}
            className={`w-full p-4 flex items-center space-x-3 transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-white/5 text-indigo-200' : 'hover:bg-white/50 text-slate-600'}`}
          >
            <Mail size={20} />
            <span className="font-medium">Contact Developer</span>
          </button>

          <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}`} />

          <button onClick={handleLogout} className="w-full p-4 flex items-center space-x-3 text-red-400 hover:text-red-500 transition-colors hover:bg-red-50/50">
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        <div className="text-center text-xs mt-4">
          <a
            href="https://walruscreativeworks.com/one-sentence-privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${isDarkMode ? 'text-indigo-300 hover:text-white' : 'text-slate-500 hover:text-rose-500'} underline`}
          >
            Privacy Policy
          </a>
          <p className={`${isDarkMode ? 'text-indigo-300/70' : 'text-slate-400'} text-[10px] mt-2 leading-snug`}>
            Your journal entries are completely private. Only you can access your entries. Not even the app creator or admins can view, read, or open them. The only information we can see is your email address and the name you provided when signing up, nothing more. This space is designed to be safe, secure, and just for you.
          </p>
        </div>
      </div>
    );
};

const ListView = ({ entries, setSelectedDate, setView, isDarkMode }) => {
    const [showMatteredOnly, setShowMatteredOnly] = useState(false);
    
    // Logic
    const sortedEntries = [...entries]
        .filter(e => showMatteredOnly ? e.mattered : true)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // PDF Generator
    const generatePDF = () => {
        if (sortedEntries.length === 0) {
          alert("No entries to export!");
          return;
        }
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) { alert("Please allow popups"); return; }
        const htmlContent = `
          <html>
            <head>
              <title>My Journal</title>
              <style>
                body { font-family: 'Georgia', serif; padding: 40px; color: #333; }
                .entry { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                .date { color: #666; font-size: 14px; text-transform: uppercase; font-weight: bold; }
                .mood { font-size: 20px; }
                .text { font-size: 18px; line-height: 1.5; font-style: italic; margin-top: 10px; }
              </style>
            </head>
            <body>
              <h1 style="text-align:center;color:#e11d48">My One Sentence Journal</h1>
              ${sortedEntries.map(e => `
                <div class="entry">
                  <div><span class="date">${new Date(e.date).toLocaleDateString()}</span> <span class="mood">${e.mood}</span> ${e.mattered ? '⭐' : ''}</div>
                  <div class="text">"${e.text}"</div>
                </div>
              `).join('')}
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-serif ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>Entries</h2>
          <button 
            onClick={generatePDF}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-transform hover:scale-105 ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-white text-rose-500 shadow-sm'}`}
          >
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>
        
        {/* Filter Toggle */}
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setShowMatteredOnly(!showMatteredOnly)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${showMatteredOnly ? 'bg-rose-400 text-white shadow-lg shadow-rose-200' : (isDarkMode ? 'bg-white/10 text-indigo-300' : 'bg-white/60 text-slate-500')}`}
            >
                {showMatteredOnly ? 'Showing: Core Memories' : 'Filter: Core Memories'} {showMatteredOnly && <X size={12} className="inline ml-1" />}
            </button>
        </div>

        <div className="space-y-4">
          {sortedEntries.map(entry => (
            <div 
              key={entry.date} 
              onClick={() => { setSelectedDate(entry.date); setView('details'); }}
              className={`p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/40 border-white/40 hover:bg-white/60 shadow-rose-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{entry.mood}</span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-200' : 'text-slate-600'}`}>{getDayName(entry.date)}</span>
                </div>
                {entry.mattered && <Star size={14} className="text-amber-400" fill="currentColor" />}
              </div>
              <p className={`text-sm font-serif italic truncate ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>{entry.text}</p>
            </div>
          ))}
          {sortedEntries.length === 0 && (
            <div className={`text-center py-10 ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No memories found.</p>
            </div>
          )}
        </div>
      </div>
    );
};

const EntryDetailView = ({ entries, selectedDate, setView, isDarkMode }) => {
    const getEntryForDate = (date) => entries.find(e => e.date === date);
    const entry = getEntryForDate(selectedDate);
    if (!entry) return null;

    return (
      <div className="h-full flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setView('dashboard')} className={`p-2 -ml-2 ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>
            <ChevronLeft />
          </button>
          <span className={`text-xs font-bold tracking-widest uppercase ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>{entry.date}</span>
          <button onClick={() => alert("Sharing...")} className={`p-2 ${isDarkMode ? 'text-indigo-300' : 'text-slate-500'}`}>
            <Share size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pb-20">
           <div className="text-center space-y-2">
             <span className="text-6xl animate-bounce-slow inline-block">{entry.mood}</span>
             <div className="flex justify-center">
               {entry.mattered && (
                 <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                   <Star size={10} fill="currentColor" /> <span>Core Memory</span>
                 </span>
               )}
             </div>
           </div>

           <div className={`p-8 rounded-[2rem] shadow-sm border backdrop-blur-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60 shadow-rose-100'}`}>
             <p className={`text-sm mb-4 font-medium uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>{entry.prompt}</p>
             <p className={`text-2xl font-serif leading-relaxed italic ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>"{entry.text}"</p>
           </div>

           {entry.photo && (
             <div className="rounded-[2rem] overflow-hidden shadow-lg border-4 border-white/20">
               <img src={entry.photo} alt="Memory" className="w-full h-auto" />
             </div>
           )}
        </div>
      </div>
    );
};

// --- Main App Component ---

const App = () => {
  // State
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('loading'); 
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date())); 
  const [dailyPrompt, setDailyPrompt] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  useEffect(() => {
    console.log('🟢 Current view:', view);
    console.log('🟢 Current user:', user ? user.email : 'No user');
  }, [view]);

  // Load data & settings
  useEffect(() => {
    setDailyPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    const savedTheme = localStorage.getItem('journal_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  // Sync authentication state with Firebase
  useEffect(() => {
    console.log('Setting up Firebase auth listener...');
    let authFired = false;
    
    // Check for redirect result first (Google Sign-In on iOS)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Google Sign-In redirect successful');
          if (!result.user.emailVerified) {
            sendEmailVerification(result.user).catch(console.error);
          }
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
      });
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      authFired = true;
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Dreamer',
          avatar: firebaseUser.photoURL,
        });
        setLoginEmail(firebaseUser.email || '');
        setLoginPassword('');
        setAuthMode('login');
        setAuthMessage(null);
        setView('dashboard');
      } else {
        setUser(null);
        setEntries([]);
        setAuthMode('login');
        setLoginPassword('');
        setView('auth');
      }
    }, (error) => {
      console.error('Firebase auth error:', error);
      authFired = true;
      setView('auth');
    });

    // Fallback: if auth doesn't fire within 3 seconds, assume no user and show auth
    const timeout = setTimeout(() => {
      if (!authFired) {
        console.warn('Firebase auth listener timeout - forcing auth view');
        setView('auth');
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Load entries when the authenticated user changes
  useEffect(() => {
    if (!user) return;
    const storageKey = `journal_entries_${user.uid}`;
    const savedEntries = localStorage.getItem(storageKey);

    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.warn('Failed to parse saved entries', error);
        setEntries([]);
      }
    } else {
      setEntries([]);
    }
  }, [user]);

  // Persist entries per user
  useEffect(() => {
    if (!user) return;
    const storageKey = `journal_entries_${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, user]);

  useEffect(() => {
    localStorage.setItem('journal_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const describeAuthError = (error) => {
    const code = error?.code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'That email is already registered. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/weak-password':
        return 'Password must be at least six characters long.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support if you need help.';
      case 'auth/popup-closed-by-user':
        return 'Popup closed before finishing sign-in.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in popup was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'That email is linked to another sign-in method. Try signing in with that provider instead.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = loginEmail.trim().toLowerCase();
    const passwordValue = loginPassword.trim();

    setAuthMessage(null);

    if (!trimmedEmail || !passwordValue) {
      setAuthMessage({ type: 'error', text: 'Enter your email and password to continue.' });
      return;
    }

    setIsAuthBusy(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, passwordValue);
      setAuthMessage({ type: 'success', text: 'Signed in successfully.' });
    } catch (error) {
      setAuthMessage({ type: 'error', text: describeAuthError(error) });
      console.error('Sign-in failed:', error);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    console.log('Sign-up clicked');
    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim().toLowerCase();
    const passwordValue = signupPassword.trim();

    setAuthMessage(null);

    if (!trimmedName) {
      setAuthMessage({ type: 'error', text: 'Please enter your name so we know how to greet you.' });
      return;
    }

    if (trimmedName.length > 24) {
      setAuthMessage({ type: 'error', text: 'Name must be 24 characters or fewer.' });
      return;
    }

    if (!trimmedEmail) {
      setAuthMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (passwordValue.length < 6) {
      setAuthMessage({ type: 'error', text: 'Password must be at least six characters long.' });
      return;
    }

    console.log('Creating account for:', trimmedEmail);
    setIsAuthBusy(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, passwordValue);
      console.log('Account created:', userCredential.user.uid);
      if (trimmedName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: trimmedName });
      }

      if (userCredential.user && !userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
      }

      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setAuthMessage({ type: 'success', text: 'Account created! Check your inbox to verify your email.' });
    } catch (error) {
      console.error('Sign-up error:', error);
      setAuthMessage({ type: 'error', text: describeAuthError(error) });
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = loginEmail.trim().toLowerCase();

    setAuthMessage(null);

    if (!trimmedEmail) {
      setAuthMessage({ type: 'error', text: 'Add your email address above so we can send the reset link.' });
      return;
    }

    setIsAuthBusy(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setAuthMessage({ type: 'success', text: 'Reset link sent! Check your inbox.' });
    } catch (error) {
      setAuthMessage({ type: 'error', text: describeAuthError(error) });
      console.error('Password reset failed:', error);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isAuthBusy) return;
    setAuthMessage(null);
    setIsAuthBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Use redirect flow on native iOS, popup on web
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider);
        // User will be redirected away, auth state will update on return
      } else {
        const result = await signInWithPopup(auth, provider);
        if (result.user && !result.user.emailVerified) {
          await sendEmailVerification(result.user);
        }
        setAuthMessage({ type: 'success', text: 'Signed in with Google.' });
      }
    } catch (error) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthMessage({ type: 'error', text: describeAuthError(error) });
      }
      console.error('Google sign-in failed:', error);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (isAuthBusy) return;
    const previousEmail = user?.email || '';
    setIsAuthBusy(true);
    try {
      await signOut(auth);
      if (previousEmail) setLoginEmail(previousEmail);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setEntries([]);
      setAuthMessage({ type: 'success', text: 'Signed out safely. See you soon!' });
    } catch (error) {
      setAuthMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
      console.error('Sign-out failed:', error);
    } finally {
      setIsAuthBusy(false);
    }
  };

  if (view === 'loading') return null;

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-200 transition-colors duration-1000 ${isDarkMode ? 'bg-slate-900' : 'bg-rose-50'}`}>
      
      {/* Backgrounds */}
      {isDarkMode ? (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900/0 to-slate-900/0" />
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-pink-200 via-purple-100 to-indigo-200">
           <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-300/30 blur-[120px] animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-300/30 blur-[120px] animate-pulse delay-700" />
        </div>
      )}

      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden bg-white/5 backdrop-blur-[2px]">
        
        <main className="h-full overflow-y-auto px-6 pt-16 scrollbar-hide relative z-10">
          {view === 'auth' && (
            <AuthView 
              isDarkMode={isDarkMode}
              authMode={authMode}
              setAuthMode={setAuthMode}
              handleLogin={handleLogin}
              handleSignUp={handleSignUp}
              handleResetPassword={handleResetPassword}
              handleGoogleLogin={handleGoogleLogin}
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              signupName={signupName}
              setSignupName={setSignupName}
              signupEmail={signupEmail}
              setSignupEmail={setSignupEmail}
              signupPassword={signupPassword}
              setSignupPassword={setSignupPassword}
              authMessage={authMessage}
              isAuthBusy={isAuthBusy}
            />
          )}
          {view === 'dashboard' && (
            <DashboardView 
              user={user}
              entries={entries}
              setView={setView}
              setSelectedDate={setSelectedDate}
              isDarkMode={isDarkMode}
            />
          )}
          {view === 'write' && (
            <WriteView 
              selectedDate={selectedDate}
              entries={entries}
              setEntries={setEntries}
              setView={setView}
              dailyPrompt={dailyPrompt}
              isDarkMode={isDarkMode}
            />
          )}
          {view === 'calendar' && (
            <CalendarView 
              entries={entries}
              setSelectedDate={setSelectedDate}
              setView={setView}
              isDarkMode={isDarkMode}
            />
          )}
          {view === 'list' && (
            <ListView 
              entries={entries}
              setSelectedDate={setSelectedDate}
              setView={setView}
              isDarkMode={isDarkMode}
            />
          )}
          {view === 'profile' && (
            <ProfileView 
              user={user}
              setUser={setUser}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              handleLogout={handleLogout}
            />
          )}
          {view === 'details' && (
            <EntryDetailView 
              entries={entries}
              selectedDate={selectedDate}
              setView={setView}
              isDarkMode={isDarkMode}
            />
          )}
        </main>

        {['dashboard', 'calendar', 'list', 'profile'].includes(view) && (
          <nav className={`absolute bottom-6 left-6 right-6 h-18 rounded-3xl shadow-xl flex items-center justify-between px-6 border z-50 transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/80 border-white/10 text-indigo-300' : 'bg-white/60 border-white/40 text-slate-500 shadow-rose-200'} backdrop-blur-xl`}>
            
            <button onClick={() => setView('dashboard')} className={`p-2 flex flex-col items-center space-y-1 ${view === 'dashboard' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
              <Home size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
            </button>

            <button onClick={() => setView('list')} className={`p-2 flex flex-col items-center space-y-1 ${view === 'list' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
              <List size={24} strokeWidth={view === 'list' ? 2.5 : 2} />
            </button>

            <button 
              onClick={() => { setSelectedDate(formatDate(new Date())); setView('write'); }}
              className={`w-14 h-14 rounded-full shadow-lg transform -translate-y-6 hover:scale-110 transition-all flex items-center justify-center ${isDarkMode ? 'bg-indigo-500 text-white shadow-indigo-500/50' : 'bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-rose-300/50'}`}
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>

            <button onClick={() => setView('calendar')} className={`p-2 flex flex-col items-center space-y-1 ${view === 'calendar' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
              <CalendarIcon size={24} strokeWidth={view === 'calendar' ? 2.5 : 2} />
            </button>

            <button onClick={() => setView('profile')} className={`p-2 flex flex-col items-center space-y-1 ${view === 'profile' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
              <User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
            </button>
          </nav>
        )}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;