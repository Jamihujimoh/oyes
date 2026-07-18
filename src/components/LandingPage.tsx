"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Terminal,
  LayoutDashboard,
  Trophy,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

interface LandingPageProps {
  onStartChat: () => void;
}

export function LandingPage({ onStartChat }: LandingPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [bootSequence, setBootSequence] = useState(0);
  const [systemCheck, setSystemCheck] = useState<string[]>([]);

  useEffect(() => {
    const sequence = [
      "Connecting to Jimoh...",
      "System is ready.",
      "Secure login ready.",
      "Hello, I'm Jimoh.",
      "Everything is working fine."
    ];

    const timer = setInterval(() => {
      setBootSequence(prev => {
        if (prev < sequence.length) {
          setSystemCheck(s => [...s, sequence[prev]]);
          return prev + 1;
        }
        return prev;
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#020205] overflow-hidden flex flex-col items-center justify-center relative px-4 py-8 scanline-effect perspective-matrix">
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[180px] pointer-events-none animate-pulse-dragon"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-accent/5 rounded-full blur-[180px] pointer-events-none animate-pulse-dragon delay-1000"></div>
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i}
            className="neural-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-4xl flex flex-col items-center text-center z-10">
        <div className={`flex items-center gap-5 mb-6 text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-1000 ${bootSequence >= 1 ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="flex items-center gap-2 text-green-500"><Activity className="w-3 h-3 animate-pulse" /> Online</span>
          <span className="flex items-center gap-2 text-primary"><ShieldCheck className="w-3 h-3" /> Secure</span>
          <span className="flex items-center gap-2 text-accent"><Terminal className="w-3 h-3" /> Active</span>
        </div>

        <div className={`relative mb-8 group cursor-default transition-all duration-1000 ${bootSequence >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="absolute -inset-20 bg-primary/30 rounded-full blur-[80px] animate-pulse"></div>
          <div className="relative w-20 h-20 bg-card border border-white/15 rounded-[2rem] flex items-center justify-center text-white shadow-2xl glow-primary transition-all duration-700 hover:scale-110 hover:rotate-12">
            <span className="font-serif text-4xl font-black gradient-text">J</span>
          </div>
        </div>
        
        <div className={`space-y-4 mb-10 transition-all duration-1000 ${bootSequence >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-serif text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase shimmer-text drop-shadow-2xl">
            Jimskays<span className="gradient-text">AI</span>
          </h1>
          <p className="text-[10px] text-muted-foreground/60 max-w-md mx-auto font-black uppercase tracking-[1em] leading-relaxed animate-in fade-in duration-1000">
            My Personal AI
          </p>
        </div>

        <div className="h-16 mb-8 overflow-hidden flex flex-col gap-1">
          {systemCheck.map((msg, i) => (
            <p key={i} className="text-[9px] font-black text-primary/50 uppercase tracking-widest animate-in slide-in-from-left-4 fade-in duration-500">
              [INFO] {msg}
            </p>
          ))}
        </div>
        
        <div className={`flex flex-col sm:flex-row items-center gap-4 transition-all duration-1000 ${bootSequence >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <Button 
            onClick={() => router.push(user ? '/onboarding' : '/auth')}
            size="lg" 
            className="cyber-button bg-primary text-black text-[11px] px-12 py-6 rounded-2xl shadow-xl glow-primary uppercase tracking-[0.3em] font-black h-auto border-none"
          >
            {user ? 'Enter App' : 'Get Started'}
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>

          <div className="flex gap-3">
            {user && (
              <Link href="/dashboard">
                <Button 
                  variant="outline"
                  className="rounded-xl h-12 px-6 border-white/10 bg-white/[0.03] text-white text-[9px] uppercase tracking-widest font-black hover:bg-white/10"
                >
                  <LayoutDashboard className="mr-2 w-3.5 h-3.5 text-primary" />
                  Hub
                </Button>
              </Link>
            )}
            <Link href="/briefing">
              <Button 
                variant="outline"
                className="rounded-xl h-12 px-6 border-white/10 bg-white/[0.03] text-white text-[9px] uppercase tracking-widest font-black hover:bg-white/10"
              >
                <Trophy className="mr-2 w-3.5 h-3.5 text-primary" />
                Guide
              </Button>
            </Link>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-card/60 backdrop-blur-md h-10 flex items-center overflow-hidden border-t border-white/10 z-[100]">
          <div className="animate-marquee inline-block whitespace-nowrap">
            <span className="text-white/20 font-black uppercase tracking-[0.8em] text-[9px] mx-16">
              &bull; 100% ONLINE &bull; SS3 RUBY ACTIVE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; 
            </span>
            <span className="text-white/20 font-black uppercase tracking-[0.8em] text-[9px] mx-16">
              &bull; 100% ONLINE &bull; SS3 RUBY ACTIVE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; 
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
