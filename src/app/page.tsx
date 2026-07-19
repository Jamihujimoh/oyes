"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Activity, Cpu, BarChart3, Binary, Orbit, Sliders, X, BookOpen, Compass, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // true = First Image (Get Started), false = Second Image (3D Sci-Fi)
  const [showImageDashboard, setShowImageDashboard] = useState(true); 
  const [isFading, setIsFading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [modalType, setModalType] = useState<'hub' | 'guide'>('hub');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fades out the first image and switches to the 3D image
  const handleStartTransition = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowImageDashboard(false);
      setIsFading(false);
      setShowFeatures(false);
    }, 500);
  };

  // Triggers your actual app routing when they click "ENTER APP" on the 3D image
  const handleEnterApp = () => {
    router.push(user ? '/onboarding' : '/auth');
  };

  if (!isMounted || isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020205] overflow-hidden fixed inset-0 z-[999]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute -inset-8 bg-primary/20 rounded-full blur-[40px] animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-card border border-white/10 flex items-center justify-center shadow-2xl glow-primary">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.5em] animate-pulse">
              Verifying Entry Protocol
            </p>
            <div className="flex items-center justify-center gap-3 text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
              <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> Core Sync</span>
              <span>&bull;</span>
              <span>AES-256 Active</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main 
      className={`h-[100dvh] w-screen flex items-center justify-center p-4 fixed inset-0 overflow-hidden select-none antialiased transition-opacity duration-500 ${
        showImageDashboard ? 'bg-[#020205]' : 'bg-[#050505]'
      } ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative w-full max-w-[1280px] shadow-[0_0_100px_rgba(0,0,0,0.95)] rounded-xl overflow-hidden bg-[#020202]">
        
        {showImageDashboard ? (
          /* ================================== */
          /* STAGE 1: GET STARTED SCREEN        */
          /* ================================== */
          <>
            <img 
              src="/3d/jimskay-bg.png" 
              alt="Jimskay AI Dashboard"
              className="w-full h-auto block"
            />
            <div className="absolute top-[21.5%] left-[26.5%] w-[47.5%] h-[4.5%] bg-[#09090b] z-10" />
            
            <button 
              onClick={handleStartTransition}
              className="absolute left-[12.5%] bottom-[29.7%] w-[11.6%] h-[6.0%] cursor-pointer hover:bg-amber-500/10 rounded-full transition-colors duration-200 z-20"
              aria-label="Get Started"
            />
            
            <button 
              onClick={() => {
                setModalType('hub');
                setShowFeatures(true);
              }}
              className="absolute left-[24.5%] bottom-[30.2%] w-[12.2%] h-[5.3%] cursor-pointer hover:bg-white/5 rounded-full transition-colors duration-200 z-20"
              aria-label="Explore Features"
            />
          </>
        ) : (
          /* ================================== */
          /* STAGE 2: 3D HUB (REPLACES OLD APP) */
          /* ================================== */
          <>
            <img 
              src="/3d/new-bg.png" 
              alt="Jimskay AI Core Hub"
              className="w-full h-auto block"
            />
            
            {/* ENTER APP BUTTON (Triggers actual routing) */}
            <button 
              onClick={handleEnterApp}
              className="absolute left-[19.5%] bottom-[5.5%] w-[23.0%] h-[11.0%] cursor-pointer hover:bg-amber-500/20 rounded-xl transition-colors duration-200 z-20"
              aria-label="Enter App"
            />

            {/* HUB BUTTON */}
            <button 
              onClick={() => {
                setModalType('hub');
                setShowFeatures(true);
              }}
              className="absolute left-[46.5%] bottom-[4.8%] w-[15.5%] h-[11.0%] cursor-pointer hover:bg-white/10 rounded-xl transition-colors duration-200 z-20"
              aria-label="Hub"
            />

            {/* GUIDE BUTTON */}
            <button 
              onClick={() => {
                setModalType('guide');
                setShowFeatures(true);
              }}
              className="absolute left-[64.8%] bottom-[5.0%] w-[18.2%] h-[11.0%] cursor-pointer hover:bg-white/10 rounded-xl transition-colors duration-200 z-20"
              aria-label="Guide"
            />
          </>
        )}

        {/* ================================== */
        /*  DYNAMIC MODAL OVERLAY             */
        /* ================================== */}
        {showFeatures && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="bg-[#09090b] border border-amber-500/20 max-w-3xl w-full rounded-2xl p-8 relative shadow-[0_0_50px_rgba(245,158,11,0.15)] text-left">
              
              <button 
                onClick={() => setShowFeatures(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-amber-500 tracking-wider uppercase mb-1">
                  {showImageDashboard 
                    ? "Jimskay AI Core Capabilities" 
                    : modalType === 'hub' 
                      ? "Central Hub Analytics" 
                      : "System Execution Guide"}
                </h2>
                <p className="text-xs text-zinc-400">
                  {showImageDashboard || modalType === 'hub'
                    ? "Next-generation architectural modules running live inside the intelligence framework."
                    : "Complete documentation and onboarding protocol for Jimskay AI."}
                </p>
              </div>

              {/* STAGE 1 MODAL GRID */}
              {showImageDashboard && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <Cpu className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Machine Learning</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Neural processing chains designed for high-precision pattern optimization.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <BarChart3 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Data Analytics</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Real-time analytical pipelines parsing multi-layered enterprise datasets.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <Binary className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Automation Engine</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Systemic operational macros configured to streamline system actions.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <Orbit className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Predictive Models</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Forecasting matrices structured to map upcoming trends and behaviors.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <Sliders className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Custom Solutions</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Modular, sandbox-ready architectures matching dedicated technical scope.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex gap-3 items-start">
                    <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Core Algorithms</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">High-velocity parallel execution paths maximizing processing math blocks.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2 HUB MODAL GRID */}
              {!showImageDashboard && modalType === 'hub' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <Cpu className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Intelligence</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Neural processing chains designed for high-precision pattern optimization.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <BarChart3 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Adaptability</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Real-time analytical pipelines parsing multi-layered enterprise datasets.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <Binary className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Growth</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Systemic operational macros configured to streamline structural evolution.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <Orbit className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Security</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Encrypted forecasting matrices structuring robust behavioral firewalls.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2 GUIDE MODAL GRID */}
              {!showImageDashboard && modalType === 'guide' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">1. Initialization</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Click 'Enter App' to authenticate your user profile and access the workspace.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">2. Core Navigation</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Use the Hub interface to review real-time parameters and system diagnostics.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">3. Security Protocol</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">All active user sessions are protected by enterprise-grade encryption channels.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 flex gap-3 items-start">
                    <Sliders className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">4. Custom Tuning</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Configure model preferences directly during your initial setup sequence.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={showImageDashboard ? handleStartTransition : handleEnterApp}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {showImageDashboard ? "Initialize Central Hub" : "Launch Interface"}
                </button>
              </div>

            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}