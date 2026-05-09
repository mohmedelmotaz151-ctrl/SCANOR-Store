import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";
import DownloadPage from "./pages/Download";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Navbar from "./components/Navbar";
import FloatingChat from "./components/FloatingChat";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider } from "./context/LanguageContext";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import SplashScreen from './components/SplashScreen';

import ScanorLogo from './components/ScanorLogo';

function AppContent() {
  const { loading, user, isGuest } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [loading]);

  if (showSplash) return <SplashScreen />;

  return (
    <div key="app-root" className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500/30">
      {!user && !isGuest && window.location.pathname === '/' ? null : <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={user || isGuest ? <Home /> : <Welcome />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </main>
      {user || isGuest || window.location.pathname !== '/' ? (
        <>
          <FloatingChat />
          <footer className="border-t border-neutral-800 py-16 mt-20 bg-black">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex flex-col items-center gap-4 mb-8">
                <ScanorLogo size="lg" className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                <span className="text-xl font-black text-neutral-500 uppercase tracking-tighter">
                  Scanor<span className="text-amber-500/50">STORE</span>
                </span>
              </div>
              <div className="text-neutral-500 text-sm space-y-2">
                <p>© 2026 Scanor STORE. All rights reserved.</p>
                <p className="text-xs">متجر سكانور المعتمد لشحن شدات ببجي موبايل بشكل آمن وسريع</p>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8">
                <a href="/privacy" className="text-neutral-500 hover:text-amber-500 text-xs font-bold transition-colors">Privacy Policy</a>
                <a href="/track" className="text-neutral-500 hover:text-amber-500 text-xs font-bold transition-colors">Track Order</a>
                <a href="/download" className="text-neutral-500 hover:text-amber-500 text-xs font-bold transition-colors">Download App</a>
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
