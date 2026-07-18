"use client"

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { LandingPage } from '@/components/LandingPage';
import { useRouter } from 'next/navigation';
import { Loader2, Activity } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <main className="h-[100dvh] w-screen relative overflow-hidden bg-[#020205] fixed inset-0">
      <LandingPage onStartChat={() => router.push(user ? '/onboarding' : '/auth')} />
    </main>
  );
}
