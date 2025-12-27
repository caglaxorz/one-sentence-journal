import React, { useState, useEffect, useRef, useMemo } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { 
  Calendar as CalendarIcon, 
  Home, 
  Plus, 
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
  Palette,
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
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { subscribeToEntries, saveEntry, deleteEntry, migrateLocalEntries } from './services/database';
import { sanitizeText, validateName, validatePassword, validateEmail, RateLimiter } from './utils/security';

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

const MOOD_PALETTES = {
  emotions: [
    { emoji: '😌', label: 'Peaceful', color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
    { emoji: '😔', label: 'Sad', color: 'bg-blue-100 text-blue-600', darkColor: 'bg-blue-900/30 text-blue-300' },
    { emoji: '😤', label: 'Frustrated', color: 'bg-red-100 text-red-600', darkColor: 'bg-red-900/30 text-red-300' },
    { emoji: '🥰', label: 'Loved', color: 'bg-pink-100 text-pink-600', darkColor: 'bg-pink-900/30 text-pink-300' },
    { emoji: '🤯', label: 'Overwhelmed', color: 'bg-purple-100 text-purple-600', darkColor: 'bg-purple-900/30 text-purple-300' }
  ],
  colors: [
    { emoji: '🔴', label: 'Red', color: 'bg-red-100 text-red-600', darkColor: 'bg-red-900/30 text-red-300' },
    { emoji: '🟢', label: 'Green', color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
    { emoji: '🟡', label: 'Yellow', color: 'bg-yellow-100 text-yellow-600', darkColor: 'bg-yellow-900/30 text-yellow-300' },
    { emoji: '🔵', label: 'Blue', color: 'bg-blue-100 text-blue-600', darkColor: 'bg-blue-900/30 text-blue-300' },
    { emoji: '🟣', label: 'Purple', color: 'bg-purple-100 text-purple-600', darkColor: 'bg-purple-900/30 text-purple-300' }
  ],
  animals: [
    { emoji: '🦋', label: 'Butterfly', color: 'bg-pink-100 text-pink-600', darkColor: 'bg-pink-900/30 text-pink-300' },
    { emoji: '🐢', label: 'Turtle', color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
    { emoji: '🦁', label: 'Lion', color: 'bg-orange-100 text-orange-600', darkColor: 'bg-orange-900/30 text-orange-300' },
    { emoji: '🐋', label: 'Whale', color: 'bg-blue-100 text-blue-600', darkColor: 'bg-blue-900/30 text-blue-300' },
    { emoji: '🦉', label: 'Owl', color: 'bg-purple-100 text-purple-600', darkColor: 'bg-purple-900/30 text-purple-300' }
  ]
};

const MOODS = MOOD_PALETTES.emotions; // Default for backward compatibility

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

const EmailVerificationBanner = ({ user, isDarkMode, onResend, onDismiss }) => {
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleResend = async () => {
    setSending(true);
    try {
      await onResend();
    } finally {
      setSending(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload the current user from Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Error: No user found. Please try logging in again.");
        setRefreshing(false);
        return;
      }
      
      await currentUser.reload();
      
      // Check if email is now verified
      if (currentUser.emailVerified) {
        window.location.reload();
      } else {
        alert("It seems your email isn't verified yet. Please check your inbox for the verification link. If you're still having issues, reach out to hello@walruscreativeworks.com");
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      alert("Error checking verification status. Please reach out to hello@walruscreativeworks.com");
      setRefreshing(false);
    }
  };
  
  return (
    <>
      {/* Blocking overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md" />
      
      {/* Banner */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-14 pb-4 px-4 ${isDarkMode ? 'bg-indigo-900/90' : 'bg-amber-100/95'} backdrop-blur-md border-b ${isDarkMode ? 'border-indigo-700/50' : 'border-amber-300'}`}>
        <div className="max-w-md mx-auto flex items-start space-x-3">
        <Mail size={20} className={isDarkMode ? 'text-indigo-300 mt-0.5' : 'text-amber-700 mt-0.5'} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-indigo-100' : 'text-amber-900'}`}>
            Please verify your email address
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-200/80' : 'text-amber-700/80'}`}>
            We sent a verification link to {user?.email}. Check your inbox and click the link to verify your account.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleResend}
              disabled={sending}
              className={`text-xs underline ${isDarkMode ? 'text-indigo-200 hover:text-white' : 'text-amber-800 hover:text-amber-900'} ${sending ? 'opacity-50' : ''}`}
            >
              {sending ? 'Sending...' : 'Resend verification email'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`text-xs underline ${isDarkMode ? 'text-indigo-200 hover:text-white' : 'text-amber-800 hover:text-amber-900'} ${refreshing ? 'opacity-50' : ''}`}
            >
              {refreshing ? 'Checking...' : "I've verified"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

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

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isAuthBusy}
        className={`w-full max-w-xs py-3 rounded-2xl border flex items-center justify-center space-x-3 font-medium transition-colors ${isAuthBusy ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'border-white/10 bg-white/5 text-indigo-100 hover:bg-white/10' : 'border-white/60 bg-white/80 text-slate-700 hover:bg-white'}`}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-slate-700 text-sm font-bold">G</span>
        <span>Continue with Google</span>
      </button>

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

          <button
            type="submit"
            disabled={isAuthBusy}
            className={`w-full py-4 rounded-2xl font-medium shadow-lg transition-all flex items-center justify-center space-x-2 ${isAuthBusy ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-900/50' : 'bg-white/80 hover:bg-white text-rose-500 shadow-rose-200'}`}
          >
            <span>Begin Journaling</span>
            <ArrowRight size={18} />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={!loginEmail || isAuthBusy}
              className={`text-xs font-medium ${isAuthBusy || !loginEmail ? 'opacity-60 cursor-not-allowed' : ''} ${isDarkMode ? 'text-indigo-300 hover:text-white' : 'text-slate-500 hover:text-rose-500'}`}
            >
              Forgot Password?
            </button>
          </div>
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
    const today = formatDate(new Date());
    
    // Filter entries that were CREATED on the same day as their date (not backdated)
    const validEntries = entries.filter(e => {
      if (!e.createdAt) return true; // Legacy entries without createdAt
      const entryDate = formatDate(new Date(e.date));
      const createdDate = formatDate(new Date(e.createdAt));
      return entryDate === createdDate; // Only count entries created on their actual date
    });
    
    const sortedEntries = [...validEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
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
      </div>

      {/* Today's Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 text-center space-y-4 border shadow-xl backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 shadow-indigo-900/20' : 'bg-white/60 border-white/40 shadow-rose-200/50'}`}>
        {todayEntry ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(todayEntry.date);
                setView('write');
              }}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-indigo-300' : 'bg-white/60 hover:bg-white/80 text-slate-600'}`}
            >
              <Edit2 size={16} />
            </button>
            <div onClick={() => { setSelectedDate(todayEntry.date); setView('details'); }} className="cursor-pointer">
              <span className="text-6xl filter drop-shadow-sm">{todayEntry.mood}</span>
              <p className={`mt-4 font-serif text-lg italic ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>"{todayEntry.text}"</p>
              <div className={`mt-2 text-xs uppercase tracking-widest font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Recorded Today</div>
            </div>
          </>
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

const WriteView = ({ selectedDate, entries, user, setView, dailyPrompt, isDarkMode, selectedPalette, customPalette }) => {
    // Initialize with selectedDate passed from Calendar/Dashboard
    const [entryDate, setEntryDate] = useState(selectedDate);
    const [text, setText] = useState('');
    const [mood, setMood] = useState(null);
    const [mattered, setMattered] = useState(false);
    const [saving, setSaving] = useState(false);

    // Helpers
    const getEntryForDate = (date) => entries.find(e => e.date === date);

    // Fetch existing data if editing/backdating
    useEffect(() => {
      const existing = getEntryForDate(entryDate);
      if (existing) {
        setText(existing.text);
        setMood(existing.mood);
        setMattered(existing.mattered);
      } else {
        setText('');
        setMood(null);
        setMattered(false);
      }
    }, [entryDate]);

    const handleSave = async () => {
      if (!mood) {
        alert("Please select a mood first");
        return;
      }
      
      if (!user || !user.uid) {
        alert("You must be logged in to save entries");
        return;
      }
      
      setSaving(true);
      
      try {
        const newEntry = {
          date: entryDate,
          text: text.trim(),
          mood,
          mattered,
          prompt: dailyPrompt,
          createdAt: new Date().toISOString(), // Track actual creation time
        };
        
        await saveEntry(user.uid, newEntry);
        setView('dashboard');
      } catch (error) {
        console.error('Failed to save entry:', error);
        alert('Failed to save entry. Please try again.');
      } finally {
        setSaving(false);
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
            {(() => {
              const currentMoods = selectedPalette === 'custom' && customPalette.length > 0 
                ? customPalette 
                : MOOD_PALETTES[selectedPalette] || MOOD_PALETTES.emotions;
              return currentMoods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(m.emoji)}
                  className={`flex flex-col items-center space-y-2 transition-transform ${mood === m.emoji ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                >
                  <span className="text-4xl filter drop-shadow-sm">{m.emoji}</span>
                </button>
              ));
            })()}
          </div>

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
          <div className="flex items-center space-x-4 mb-3">
            <button 
              onClick={() => setMattered(!mattered)}
              className={`flex-1 p-3 rounded-2xl border flex items-center justify-center space-x-2 transition-colors ${mattered ? 'border-amber-300 bg-amber-50 text-amber-600' : (isDarkMode ? 'border-indigo-800 text-indigo-400' : 'border-white/50 bg-white/30 text-slate-500')}`}
            >
              <Star size={20} fill={mattered ? "currentColor" : "none"} />
              <span className="text-sm font-medium">This entry mattered</span>
            </button>
          </div>

          {/* Save Button */}
          <div className={`p-2 rounded-3xl ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/60'} backdrop-blur-md`}>
            <button 
            onClick={handleSave}
            disabled={!text || !mood || saving}
            className={`w-full py-3 rounded-2xl font-medium transition-colors ${text && mood && !saving ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-rose-400 text-white shadow-md') : (isDarkMode ? 'bg-indigo-900/50 text-indigo-500/50' : 'bg-white/80 text-slate-400 shadow-sm')}`}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
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

    // History Logic
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
           <h2 className={`text-2xl font-serif ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>History</h2>
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
                     : (isDarkMode ? 'bg-indigo-900/20 text-indigo-200 hover:bg-indigo-900/40' : 'bg-white/30 text-slate-500 hover:bg-white/50')
                   } ${isToday ? (isDarkMode ? 'ring-2 ring-indigo-400' : 'ring-2 ring-rose-400') : ''}`}
               >
                 {entry ? <span className="text-xl">{entry.mood}</span> : day}
                 {entry?.mattered && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full" />}
               </button>
             );
           })}
         </div>

         {/* --- HISTORY SECTION --- */}
         <div className="grid grid-cols-1 gap-3 mt-4">
         </div>

         {/* Palette Section - Show ALL emojis ever used */}
         <div className={`p-4 rounded-2xl border backdrop-blur-md mt-3 ${isDarkMode ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white/40 border-white/50 shadow-rose-100'}`}>
           <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>Your Palette</h4>
           <div className="flex justify-between items-end h-16 space-x-2">
             {(() => {
               // Get all unique emojis from entries
               const emojiCounts = {};
               entries.forEach(e => {
                 if (e.mood) {
                   emojiCounts[e.mood] = (emojiCounts[e.mood] || 0) + 1;
                 }
               });
               
               // Sort by count descending
               const sortedEmojis = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1]);
               
               // If no entries, show current palette
               if (sortedEmojis.length === 0) {
                 return MOODS.map(m => (
                   <div key={m.emoji} className="flex-1 flex flex-col items-center space-y-2">
                     <div className={`w-full rounded-t-lg ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`} style={{ height: '10%' }} />
                     <span className="text-lg opacity-30">{m.emoji}</span>
                     <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>0</span>
                   </div>
                 ));
               }
               
               return sortedEmojis.map(([emoji, count]) => {
                 const height = Math.max(10, count * 5) + '%';
                 return (
                   <div key={emoji} className="flex-1 flex flex-col items-center space-y-2 group">
                     <div className={`w-full rounded-t-lg relative ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`} style={{ height }}>
                        <div className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 opacity-50 ${isDarkMode ? 'bg-indigo-500/30' : 'bg-rose-200/50'} h-full`} />
                     </div>
                     <span className="text-lg">{emoji}</span>
                     <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>{count}</span>
                   </div>
                 );
               });
             })()}
           </div>
         </div>
      </div>
    );
};

const ProfileView = ({ user, setUser, isDarkMode, setIsDarkMode, handleLogout, selectedPalette, setSelectedPalette, customPalette, setCustomPalette }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
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

    const handleSendPasswordResetEmail = async () => {
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert('Password reset link sent to your email!');
        setShowChangePassword(false);
      } catch (error) {
        console.error('Failed to send password reset:', error);
        alert('Failed to send password reset email. Please try again.');
      }
    };

    const handleChangePassword = async (e) => {
      e.preventDefault();
      
      if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
      }

      try {
        const currentUser = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        
        // Reauthenticate user
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, newPassword);
        
        alert('Password changed successfully!');
        setShowChangePassword(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        console.error('Failed to change password:', error);
        if (error.code === 'auth/wrong-password') {
          alert('Current password is incorrect.');
        } else if (error.code === 'auth/requires-recent-login') {
          alert('For security, please log out and log back in before changing your password.');
        } else {
          alert('Failed to change password. Please try again.');
        }
      }
    };

    const handleDeleteAllData = async () => {
      if (deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
        alert('Email does not match. Please enter your email correctly to confirm.');
        return;
      }

      const finalConfirm = window.confirm(
        '⚠️ FINAL WARNING ⚠️\n\nThis will permanently delete:\n• All your journal entries\n• Your account\n• All associated data\n\nTHIS CANNOT BE UNDONE.\n\nAre you absolutely sure?'
      );

      if (!finalConfirm) {
        return;
      }

      try {
        const currentUser = auth.currentUser;
        
        // Delete user account (this will also trigger Firestore rules to prevent access)
        await deleteUser(currentUser);
        
        alert('Your account and all data have been permanently deleted.');
        
        // Clear local data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('journal_entries_') || key.startsWith('journal_user_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
      } catch (error) {
        console.error('Failed to delete account:', error);
        if (error.code === 'auth/requires-recent-login') {
          alert('For security, please log out and log back in before deleting your account.');
        } else {
          alert('Failed to delete account. Please contact support at hello@walruscreativeworks.com');
        }
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

          {/* Change Password */}
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className={`w-full p-4 flex items-center space-x-3 transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-white/5 text-indigo-200' : 'hover:bg-white/50 text-slate-600'}`}
          >
            <Lock size={20} />
            <span className="font-medium">Change Password</span>
          </button>

          <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}`} />

          {/* Contact Developer */}
          <button
            onClick={async () => {
              try {
                await AppLauncher.openUrl({ 
                  url: 'mailto:hello@walruscreativeworks.com' 
                });
              } catch (error) {
                console.error('Failed to open email:', error);
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

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className={`p-6 rounded-3xl border shadow-lg ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-white/40 shadow-rose-100 border-white/40'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className={isDarkMode ? 'text-indigo-300' : 'text-slate-500'}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-white/60 text-slate-800'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-rose-300'}`}
                />
              </div>
              
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-white/60 text-slate-800'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-rose-300'}`}
                />
              </div>
              
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-white/60 text-slate-800'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-rose-300'}`}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={handleSendPasswordResetEmail}
                  className={`flex-1 py-2 rounded-xl font-medium border transition-colors ${isDarkMode ? 'border-indigo-400 text-indigo-300 hover:bg-white/5' : 'border-rose-300 text-rose-600 hover:bg-rose-50'}`}
                >
                  Email Reset Link
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Management */}
        <div className={`p-6 rounded-3xl border shadow-lg ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50/40 shadow-red-100 border-red-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Account Management</h3>
          <p className={`text-xs mb-4 ${isDarkMode ? 'text-red-200/70' : 'text-red-600/70'}`}>
            Delete your account or all your journal data. These actions cannot be undone.
          </p>
          
          {!showDeleteAccount ? (
            <button
              onClick={() => setShowDeleteAccount(true)}
              className={`w-full py-2 rounded-xl font-medium border-2 transition-colors ${isDarkMode ? 'border-red-500 text-red-400 hover:bg-red-500/20' : 'border-red-500 text-red-600 hover:bg-red-100'}`}
            >
              Delete All Data
            </button>
          ) : (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100/60'}`}>
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                  ⚠️ This will permanently delete:
                </p>
                <ul className={`text-xs mt-2 space-y-1 ${isDarkMode ? 'text-red-300/80' : 'text-red-700/80'}`}>
                  <li>• All your journal entries</li>
                  <li>• Your account</li>
                  <li>• All associated data</li>
                </ul>
                <p className={`text-xs font-bold mt-2 ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                  THIS CANNOT BE UNDONE!
                </p>
              </div>
              
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                  Type your email to confirm: <span className="font-bold">{user?.email}</span>
                </label>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full mt-1 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-white/5 border-red-700 text-white' : 'bg-white border-red-300 text-slate-800'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 py-2 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmEmail('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-medium border transition-colors ${isDarkMode ? 'border-white/20 text-indigo-300 hover:bg-white/5' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
            Your entries are private and secured. Only you can access them through the app. We do not access user entries except when necessary for technical support or legal compliance, with your explicit consent.
          </p>
        </div>
      </div>
    );
};

const ListView = ({ entries, setSelectedDate, setView, isDarkMode }) => {
    const [showMatteredOnly, setShowMatteredOnly] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedMoodFilter, setSelectedMoodFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ENTRIES_PER_PAGE = 20;
    
    // Logic
    const sortedEntries = [...entries]
        .filter(e => {
          if (showMatteredOnly && !e.mattered) return false;
          if (dateFrom && e.date < dateFrom) return false;
          if (dateTo && e.date > dateTo) return false;
          if (selectedMoodFilter && e.mood !== selectedMoodFilter) return false;
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination calculations
    const totalPages = Math.ceil(sortedEntries.length / ENTRIES_PER_PAGE);
    const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
    const endIndex = startIndex + ENTRIES_PER_PAGE;
    const paginatedEntries = sortedEntries.slice(startIndex, endIndex);
    
    // Reset to page 1 when filters change
    useEffect(() => {
      setCurrentPage(1);
    }, [showMatteredOnly, dateFrom, dateTo, selectedMoodFilter]);

    // PDF Generator - iOS compatible version using native share
    const generatePDF = async () => {
        if (sortedEntries.length === 0) {
          alert("No entries to export!");
          return;
        }
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>My Journal</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Georgia', serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
    .entry { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; page-break-inside: avoid; }
    .date { color: #666; font-size: 14px; text-transform: uppercase; font-weight: bold; }
    .mood { font-size: 20px; }
    .text { font-size: 18px; line-height: 1.5; font-style: italic; margin-top: 10px; }
    @media print {
      body { padding: 20px; }
    }
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
  <script>
    // Auto-print on web
    if (!window.Capacitor) {
      window.onload = function() { window.print(); }
    }
  </script>
</body>
</html>`;
        
        if (Capacitor.isNativePlatform()) {
          // For iOS: Create a data URL and open in browser for printing
          try {
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
            await AppLauncher.openUrl({ url: dataUrl });
          } catch (error) {
            console.error('Failed to open:', error);
            alert("Unable to open export. Please try again.");
          }
        } else {
          // Web version: open in new window with print dialog
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
          } else {
            alert("Please allow popups to export PDF");
          }
        }
    };

    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-serif ${isDarkMode ? 'text-indigo-50' : 'text-slate-800'}`}>Entries</h2>
          <button 
            onClick={generatePDF}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-transform hover:scale-105 ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-white text-rose-500 shadow-sm'}`}
          >
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>
        
        {/* Compact Filters Section */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40'}`}>
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button 
              onClick={() => setShowMatteredOnly(!showMatteredOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showMatteredOnly ? 'bg-rose-400 text-white shadow-md' : (isDarkMode ? 'bg-white/10 text-indigo-300' : 'bg-white/60 text-slate-600')}`}
            >
              ⭐ Core {showMatteredOnly && '✓'}
            </button>
            
            {MOOD_PALETTES.emotions.map(moodObj => (
              <button
                key={moodObj.emoji}
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === moodObj.emoji ? null : moodObj.emoji)}
                className={`px-2.5 py-1.5 rounded-full text-lg transition-all ${selectedMoodFilter === moodObj.emoji ? (isDarkMode ? 'bg-indigo-500/30 ring-2 ring-indigo-400' : 'bg-rose-100 ring-2 ring-rose-300') : (isDarkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-white/60 hover:bg-white/80')}`}
              >
                {moodObj.emoji}
              </button>
            ))}
            
            {selectedMoodFilter && (
              <button
                onClick={() => setSelectedMoodFilter(null)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-white/10 text-indigo-300' : 'bg-white/60 text-slate-600'}`}
              >
                Clear mood
              </button>
            )}
          </div>
          
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10 text-indigo-200' : 'bg-white/80 border-white/60 text-slate-700'}`}
            />
            <span className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10 text-indigo-200' : 'bg-white/80 border-white/60 text-slate-700'}`}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10 text-indigo-300 hover:bg-white/20' : 'bg-white/80 text-slate-500 hover:bg-white'}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {paginatedEntries.map(entry => (
            <div 
              key={entry.date} 
              className={`relative p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/40 border-white/40 hover:bg-white/60 shadow-rose-100'}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(entry.date);
                  setView('write');
                }}
                className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-indigo-300' : 'bg-white/60 hover:bg-white/80 text-slate-600'}`}
              >
                <Edit2 size={14} />
              </button>
              <div onClick={() => { setSelectedDate(entry.date); setView('details'); }}>
                <div className="flex justify-between items-start mb-2 pr-8">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{entry.mood}</span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-200' : 'text-slate-600'}`}>{getDayName(entry.date)}</span>
                  </div>
                  {entry.mattered && <Star size={14} className="text-amber-400" fill="currentColor" />}
                </div>
                <p className={`text-sm font-serif italic truncate ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>{entry.text}</p>
              </div>
            </div>
          ))}
          {sortedEntries.length === 0 && (
            <div className={`text-center py-10 ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No memories found.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={`mt-6 flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40'}`}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : (isDarkMode ? 'bg-indigo-500/30 hover:bg-indigo-500/40 text-white' : 'bg-rose-100 hover:bg-rose-200 text-rose-700')}`}
            >
              <ChevronLeft size={16} />
              <span className="text-sm font-medium">Previous</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${isDarkMode ? 'text-indigo-300' : 'text-slate-600'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>
                ({sortedEntries.length} total)
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : (isDarkMode ? 'bg-indigo-500/30 hover:bg-indigo-500/40 text-white' : 'bg-rose-100 hover:bg-rose-200 text-rose-700')}`}
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
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
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => { setView('write'); }}
              className={`p-2 ${isDarkMode ? 'text-indigo-300 hover:bg-white/10' : 'text-slate-600 hover:bg-white/60'} rounded-full transition-colors`}
            >
              <Edit2 size={18} />
            </button>
            <button onClick={() => alert("Sharing...")} className={`p-2 ${isDarkMode ? 'text-indigo-300' : 'text-slate-500'}`}>
              <Share size={18} />
            </button>
          </div>
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
             <p className={`text-2xl font-serif leading-relaxed italic ${isDarkMode ? 'text-indigo-100' : 'text-slate-800'}`}>"{entry.text}"</p>
           </div>
        </div>
      </div>
    );
};

// --- Palette Modal Component ---

const PaletteModal = ({ show, onClose, selectedPalette, setSelectedPalette, customPalette, setCustomPalette, isDarkMode, MOOD_PALETTES, onEditCustom }) => {
  if (!show) return null;

  const handlePaletteSelect = (palette) => {
    if (palette === 'custom') {
      if (customPalette.length === 0) {
        const defaultCustom = [
          { emoji: '⭐', label: 'Star', color: 'bg-yellow-100 text-yellow-600', darkColor: 'bg-yellow-900/30 text-yellow-300' },
          { emoji: '💎', label: 'Diamond', color: 'bg-cyan-100 text-cyan-600', darkColor: 'bg-cyan-900/30 text-cyan-300' },
          { emoji: '🌸', label: 'Blossom', color: 'bg-pink-100 text-pink-600', darkColor: 'bg-pink-900/30 text-pink-300' },
          { emoji: '🍃', label: 'Leaf', color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
          { emoji: '🌙', label: 'Moon', color: 'bg-indigo-100 text-indigo-600', darkColor: 'bg-indigo-900/30 text-indigo-300' }
        ];
        setCustomPalette(defaultCustom);
        localStorage.setItem('journal_custom_palette', JSON.stringify(defaultCustom));
      }
      setSelectedPalette('custom');
      localStorage.setItem('journal_palette', 'custom');
      // Don't close modal, show edit button
      return;
    }
    setSelectedPalette(palette);
    localStorage.setItem('journal_palette', palette);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'} backdrop-blur-sm`} />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-3xl shadow-2xl p-6 ${isDarkMode ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center space-x-3 ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>
            <Palette size={24} />
            <h3 className="text-xl font-medium">Choose Your Palette</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-indigo-300' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Palette Options */}
        <div className="space-y-3">
          <button
            onClick={() => handlePaletteSelect('emotions')}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${selectedPalette === 'emotions' ? (isDarkMode ? 'bg-indigo-500/30 border-2 border-indigo-400 shadow-lg' : 'bg-rose-100 border-2 border-rose-300 shadow-md') : (isDarkMode ? 'bg-white/5 hover:bg-white/10 border-2 border-transparent' : 'bg-white/50 hover:bg-white/70 border-2 border-transparent')}`}
          >
            <span className={`text-base font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>Emotions</span>
            <div className="flex space-x-2 text-2xl">{MOOD_PALETTES.emotions.map((m, i) => <span key={i}>{m.emoji}</span>)}</div>
          </button>
          <button
            onClick={() => handlePaletteSelect('colors')}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${selectedPalette === 'colors' ? (isDarkMode ? 'bg-indigo-500/30 border-2 border-indigo-400 shadow-lg' : 'bg-rose-100 border-2 border-rose-300 shadow-md') : (isDarkMode ? 'bg-white/5 hover:bg-white/10 border-2 border-transparent' : 'bg-white/50 hover:bg-white/70 border-2 border-transparent')}`}
          >
            <span className={`text-base font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>Colors</span>
            <div className="flex space-x-2 text-2xl">{MOOD_PALETTES.colors.map((m, i) => <span key={i}>{m.emoji}</span>)}</div>
          </button>
          <button
            onClick={() => handlePaletteSelect('animals')}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${selectedPalette === 'animals' ? (isDarkMode ? 'bg-indigo-500/30 border-2 border-indigo-400 shadow-lg' : 'bg-rose-100 border-2 border-rose-300 shadow-md') : (isDarkMode ? 'bg-white/5 hover:bg-white/10 border-2 border-transparent' : 'bg-white/50 hover:bg-white/70 border-2 border-transparent')}`}
          >
            <span className={`text-base font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>Animals</span>
            <div className="flex space-x-2 text-2xl">{MOOD_PALETTES.animals.map((m, i) => <span key={i}>{m.emoji}</span>)}</div>
          </button>
          <button
            onClick={() => handlePaletteSelect('custom')}
            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${selectedPalette === 'custom' ? (isDarkMode ? 'bg-indigo-500/30 border-2 border-indigo-400 shadow-lg' : 'bg-rose-100 border-2 border-rose-300 shadow-md') : (isDarkMode ? 'bg-white/5 hover:bg-white/10 border-2 border-transparent' : 'bg-white/50 hover:bg-white/70 border-2 border-transparent')}`}
          >
            <span className={`text-base font-medium ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>Custom (DIY)</span>
            <div className="flex space-x-2 text-2xl">
              {customPalette.length > 0 ? 
                customPalette.map((m, i) => <span key={i}>{m.emoji}</span>) : 
                <span className={`text-xs ${isDarkMode ? 'text-indigo-300/50' : 'text-slate-400'}`}>Tap to create</span>
              }
            </div>
          </button>
        </div>

        {selectedPalette === 'custom' && customPalette.length > 0 && (
          <button
            onClick={() => {
              onEditCustom();
              onClose();
            }}
            className={`w-full mt-4 p-4 rounded-2xl border-2 border-dashed transition-colors ${isDarkMode ? 'border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200' : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700'}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Edit2 size={18} />
              <span className="font-medium">Customize Your 5 Emojis</span>
            </div>
          </button>
        )}

        <p className={`mt-6 text-xs text-center ${isDarkMode ? 'text-indigo-300/70' : 'text-slate-500'}`}>
          Your palette will be used for mood tracking in journal entries
        </p>
      </div>
    </div>
  );
};

// --- Emoji Picker Modal Component ---

const EmojiPickerModal = ({ show, onClose, customPalette, setCustomPalette, isDarkMode }) => {
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (show) {
      setSelectedEmojis(customPalette.map(p => p.emoji));
    }
  }, [show, customPalette]);

  if (!show) return null;

  const handleEmojiClick = (emojiData) => {
    if (selectedEmojis.length < 5 && !selectedEmojis.includes(emojiData.emoji)) {
      setSelectedEmojis([...selectedEmojis, emojiData.emoji]);
    }
    setShowPicker(false);
  };

  const removeEmoji = (index) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (selectedEmojis.length !== 5) {
      alert('Please select exactly 5 emojis');
      return;
    }

    const colorOptions = [
      { color: 'bg-red-100 text-red-600', darkColor: 'bg-red-900/30 text-red-300' },
      { color: 'bg-orange-100 text-orange-600', darkColor: 'bg-orange-900/30 text-orange-300' },
      { color: 'bg-yellow-100 text-yellow-600', darkColor: 'bg-yellow-900/30 text-yellow-300' },
      { color: 'bg-green-100 text-green-600', darkColor: 'bg-green-900/30 text-green-300' },
      { color: 'bg-blue-100 text-blue-600', darkColor: 'bg-blue-900/30 text-blue-300' },
      { color: 'bg-indigo-100 text-indigo-600', darkColor: 'bg-indigo-900/30 text-indigo-300' },
      { color: 'bg-purple-100 text-purple-600', darkColor: 'bg-purple-900/30 text-purple-300' },
      { color: 'bg-pink-100 text-pink-600', darkColor: 'bg-pink-900/30 text-pink-300' },
      { color: 'bg-cyan-100 text-cyan-600', darkColor: 'bg-cyan-900/30 text-cyan-300' }
    ];

    const newPalette = selectedEmojis.map((emoji, index) => ({
      emoji,
      label: `Mood ${index + 1}`,
      ...colorOptions[index % colorOptions.length]
    }));

    setCustomPalette(newPalette);
    localStorage.setItem('journal_custom_palette', JSON.stringify(newPalette));
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'} backdrop-blur-sm`} />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-3xl shadow-2xl p-6 ${isDarkMode ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center space-x-3 ${isDarkMode ? 'text-indigo-100' : 'text-slate-700'}`}>
            <Palette size={24} />
            <h3 className="text-xl font-medium">Pick 5 Emojis</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-indigo-300' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Emojis Display */}
        <div className={`p-4 rounded-2xl mb-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-indigo-200' : 'text-slate-700'}`}>
              Selected ({selectedEmojis.length}/5)
            </span>
            {selectedEmojis.length > 0 && (
              <button
                onClick={() => setSelectedEmojis([])}
                className={`text-xs ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-rose-500 hover:text-rose-600'}`}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-16 rounded-xl flex items-center justify-center text-3xl relative ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}
              >
                {selectedEmojis[index] ? (
                  <>
                    <span>{selectedEmojis[index]}</span>
                    <button
                      onClick={() => removeEmoji(index)}
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white'} shadow-lg`}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <span className={`text-2xl ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`}>?</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Emoji Button */}
        {selectedEmojis.length < 5 && !showPicker && (
          <button
            onClick={() => setShowPicker(true)}
            className={`w-full p-4 rounded-2xl border-2 border-dashed transition-colors mb-4 ${isDarkMode ? 'border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200' : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700'}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus size={20} />
              <span className="font-medium">Add Emoji</span>
            </div>
          </button>
        )}

        {/* Emoji Picker */}
        {showPicker && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-slate-700'}`}>Choose an emoji:</span>
              <button
                onClick={() => setShowPicker(false)}
                className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                Cancel
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height="350px"
                theme={isDarkMode ? 'dark' : 'light'}
                searchPlaceHolder="Search emojis..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-2xl font-medium transition-colors ${isDarkMode ? 'bg-white/5 text-indigo-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedEmojis.length !== 5}
            className={`flex-1 py-3 rounded-2xl font-medium transition-colors ${selectedEmojis.length === 5 ? (isDarkMode ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-rose-500 text-white hover:bg-rose-600') : (isDarkMode ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Check size={18} />
              <span>Save Palette</span>
            </div>
          </button>
        </div>
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState('emotions'); // emotions, colors, animals, custom
  const [customPalette, setCustomPalette] = useState([]);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [showEmojiPickerModal, setShowEmojiPickerModal] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);
  const [showEmailVerificationPrompt, setShowEmailVerificationPrompt] = useState(false);
  
  // Rate limiters
  const authRateLimiterRef = useRef(new RateLimiter(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes

  useEffect(() => {
    console.log('🟢 Current view:', view);
    console.log('🟢 Current user:', user ? user.email : 'No user');
  }, [view]);

  // Initialize GoogleAuth on iOS
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '300506798842-vpve57mlcv9k13vjlek31n5d1t6j7lun.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true
      });
    }
  }, []);

  // Load data & settings
  useEffect(() => {
    setDailyPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    const savedTheme = localStorage.getItem('journal_theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    
    const savedPalette = localStorage.getItem('journal_palette');
    if (savedPalette) setSelectedPalette(savedPalette);
    
    const savedCustomPalette = localStorage.getItem('journal_custom_palette');
    if (savedCustomPalette) {
      try {
        setCustomPalette(JSON.parse(savedCustomPalette));
      } catch (e) {
        console.error('Failed to parse custom palette:', e);
      }
    }
  }, []);

  // Sync authentication state with Firebase
  useEffect(() => {
    console.log('Setting up Firebase auth listener...');
    let authFired = false;
    let unsubscribeEntries = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      authFired = true;
      
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Dreamer',
          avatar: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
        setLoginEmail(firebaseUser.email || '');
        setLoginPassword('');
        setAuthMode('login');
        setAuthMessage(null);
        
        // Check email verification
        if (!firebaseUser.emailVerified) {
          setShowEmailVerificationPrompt(true);
        }
        
        // Subscribe to real-time Firestore updates
        unsubscribeEntries = subscribeToEntries(firebaseUser.uid, (entries) => {
          console.log('Loaded', entries.length, 'entries from Firestore');
          setEntries(entries);
        });
        
        // One-time migration: move localStorage entries to Firestore
        const storageKey = `journal_entries_${firebaseUser.uid}`;
        const localEntries = localStorage.getItem(storageKey);
        if (localEntries) {
          try {
            const parsed = JSON.parse(localEntries);
            if (parsed.length > 0) {
              console.log('Migrating', parsed.length, 'entries to Firestore...');
              const result = await migrateLocalEntries(firebaseUser.uid, parsed);
              console.log('Migration complete:', result);
              // Clear localStorage after successful migration
              localStorage.removeItem(storageKey);
            }
          } catch (error) {
            console.error('Migration failed:', error);
          }
        }
        
        setView('dashboard');
      } else {
        setUser(null);
        setEntries([]);
        setAuthMode('login');
        setLoginPassword('');
        setShowEmailVerificationPrompt(false);
        
        // Unsubscribe from entries when logged out
        if (unsubscribeEntries) {
          unsubscribeEntries();
          unsubscribeEntries = null;
        }
        
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
      if (unsubscribeEntries) {
        unsubscribeEntries();
      }
      clearTimeout(timeout);
    };
  }, []);

  // Theme persistence
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
    
    // Validate email
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setAuthMessage({ type: 'error', text: emailValidation.error });
      return;
    }

    if (!passwordValue) {
      setAuthMessage({ type: 'error', text: 'Enter your password to continue.' });
      return;
    }
    
    // Check rate limit
    const rateLimit = authRateLimiterRef.current.checkLimit(trimmedEmail);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      setAuthMessage({ type: 'error', text: `Too many attempts. Please wait ${minutes} minute(s) before trying again.` });
      return;
    }

    setIsAuthBusy(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, passwordValue);
      // Reset rate limit on successful login
      authRateLimiterRef.current.reset(trimmedEmail);
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
    
    setAuthMessage(null);

    // Validate name
    const nameValidation = validateName(signupName);
    if (!nameValidation.isValid) {
      setAuthMessage({ type: 'error', text: nameValidation.error });
      return;
    }
    const trimmedName = nameValidation.sanitized;

    // Validate email
    const emailValidation = validateEmail(signupEmail);
    if (!emailValidation.isValid) {
      setAuthMessage({ type: 'error', text: emailValidation.error });
      return;
    }
    const trimmedEmail = signupEmail.trim().toLowerCase();

    // Validate password strength
    const passwordValidation = validatePassword(signupPassword);
    if (!passwordValidation.isValid) {
      setAuthMessage({ type: 'error', text: passwordValidation.error });
      return;
    }
    const passwordValue = signupPassword.trim();
    
    // Check rate limit
    const rateLimit = authRateLimiterRef.current.checkLimit(trimmedEmail);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      setAuthMessage({ type: 'error', text: `Too many attempts. Please wait ${minutes} minute(s) before trying again.` });
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
      
      // Reset rate limit on successful signup
      authRateLimiterRef.current.reset(trimmedEmail);

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
      if (Capacitor.isNativePlatform()) {
        // Use native Google Auth plugin on iOS
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        if (result.user && !result.user.emailVerified) {
          await sendEmailVerification(result.user);
        }
        setAuthMessage({ type: 'success', text: 'Signed in with Google.' });
      } else {
        // Use popup on web
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
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
      
      // Clear all localStorage entries for security
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('journal_entries_') || key.startsWith('journal_user_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (previousEmail) setLoginEmail(previousEmail);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setEntries([]);
      setShowEmailVerificationPrompt(false);
      setAuthMessage({ type: 'success', text: 'Signed out safely. See you soon!' });
    } catch (error) {
      setAuthMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
      console.error('Sign-out failed:', error);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert('Verification email sent! Please check your inbox.');
      } catch (error) {
        console.error('Failed to send verification email:', error);
        alert('Failed to send verification email. Please try again later.');
      }
    }
  };

  if (view === 'loading') return null;

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-200 transition-colors duration-1000 ${isDarkMode ? 'bg-slate-900' : 'bg-rose-50'}`}>
      
      {/* Email Verification Banner */}
      {showEmailVerificationPrompt && user && !user.emailVerified && view !== 'auth' && (
        <EmailVerificationBanner 
          user={user}
          isDarkMode={isDarkMode}
          onResend={handleResendVerification}
          onDismiss={() => setShowEmailVerificationPrompt(false)}
        />
      )}
      
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
        
        <main className="h-full overflow-y-auto px-6 pt-16 pb-28 scrollbar-hide relative z-10">
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
              user={user}
              setView={setView}
              dailyPrompt={dailyPrompt}
              isDarkMode={isDarkMode}
              selectedPalette={selectedPalette}
              customPalette={customPalette}
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
              selectedPalette={selectedPalette}
              setSelectedPalette={setSelectedPalette}
              customPalette={customPalette}
              setCustomPalette={setCustomPalette}
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
      </div>

      {/* FROZEN BOTTOM MENU - Always visible, like Excel frozen row */}
      {['dashboard', 'calendar', 'list', 'profile'].includes(view) && (
        <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-20 shadow-2xl flex items-center justify-center justify-between px-8 border-t z-[9999] transition-colors duration-500 ${isDarkMode ? 'bg-slate-800/98 border-white/10 text-indigo-300' : 'bg-white/98 border-white/40 text-slate-500 shadow-rose-200'} backdrop-blur-xl`}>
          
          <button onClick={() => { Haptics.selectionChanged(); setView('dashboard'); }} className={`p-2 flex items-center justify-center ${view === 'dashboard' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
            <Home size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
          </button>

          <button onClick={() => { Haptics.selectionChanged(); setView('list'); }} className={`p-2 flex items-center justify-center ${view === 'list' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
            <List size={24} strokeWidth={view === 'list' ? 2.5 : 2} />
          </button>

          <button 
            onClick={() => { Haptics.selectionChanged(); setSelectedDate(formatDate(new Date())); setView('write'); }}
            className={`w-14 h-14 rounded-full shadow-lg transform -translate-y-8 hover:scale-110 transition-all flex items-center justify-center ${isDarkMode ? 'bg-indigo-500 text-white shadow-indigo-500/50' : 'bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-rose-300/50'}`}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>

          <button onClick={() => { Haptics.selectionChanged(); setView('calendar'); }} className={`p-2 flex items-center justify-center ${view === 'calendar' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
            <CalendarIcon size={24} strokeWidth={view === 'calendar' ? 2.5 : 2} />
          </button>

          <button onClick={() => { Haptics.selectionChanged(); setView('profile'); }} className={`p-2 flex items-center justify-center ${view === 'profile' ? (isDarkMode ? 'text-white' : 'text-rose-600') : ''}`}>
            <User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
          </button>
        </nav>
      )}
      
      {/* Palette Modal */}
      <PaletteModal
        show={showPaletteModal}
        onClose={() => setShowPaletteModal(false)}
        selectedPalette={selectedPalette}
        setSelectedPalette={setSelectedPalette}
        customPalette={customPalette}
        setCustomPalette={setCustomPalette}
        isDarkMode={isDarkMode}
        MOOD_PALETTES={MOOD_PALETTES}
        onEditCustom={() => setShowEmojiPickerModal(true)}
      />
      
      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        show={showEmojiPickerModal}
        onClose={() => setShowEmojiPickerModal(false)}
        customPalette={customPalette}
        setCustomPalette={setCustomPalette}
        isDarkMode={isDarkMode}
      />
      
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