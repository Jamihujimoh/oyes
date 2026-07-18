"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  Activity, 
  Terminal, 
  ChevronRight, 
  GraduationCap,
  Globe,
  Loader2,
  Layout,
  Fingerprint,
  UserCircle,
  Gamepad2,
  Code2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * JimskayDashboard: The Command Center.
 * FINAL HIERARCHY: Jimskay AI (Hero) > Avatar Link (3D) > Jimskay Studio (Forge).
 * Protocol: Professional Elite Duplicate Architecture.
 */
export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !user) router.push('/auth');
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user, isUserLoading, router]);

  if (!isMounted || isUserLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020205]">
        <div className="relative">
          <div className="absolute -inset-20 bg-primary/30 rounded-full blur-[60px] animate-pulse"></div>
          <Loader2 className="w-10 h-10 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] overflow-hidden fixed inset-0 scanline-effect perspective-matrix">
      <div className={`fixed inset-0 z-[60] bg-black/95 transition-opacity duration-1000 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={`fixed top-0 left-0 z-[70] h-full w-64 bg-[#020205] border-r border-white/5 transition-all duration-700 transform md:relative md:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentChatId={null} onSelectChat={(id) => router.push(id ? `/chat?id=${id}` : '/chat')} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#05050a] relative p-4 md:p-8 flex flex-col gap-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white rounded-xl bg-white/10 shadow-xl" onClick={() => setIsSidebarOpen(true)}><Terminal className="w-5 h-5" /></Button>
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-black glow-primary shadow-2xl animate-float"><Flame className="w-6 h-6 animate-pulse" /></div>
            <div>
              <h1 className="font-serif text-3xl font-black text-white tracking-tighter uppercase italic leading-none shimmer-text">Jimskay<span className="gradient-text">Hub</span></h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 mt-1.5 flex items-center gap-3"><Activity className="w-3 h-3 text-primary animate-pulse" /> System Online</p>
            </div>
          </div>
          <div className="text-right glass-panel px-5 py-2.5 rounded-xl bg-white/[0.05] border-white/10 hover:glow-primary transition-all shadow-xl group">
            {currentTime && (
              <>
                <p className="text-[16px] font-black text-white tabular-nums tracking-widest">{format(currentTime, 'HH:mm:ss')}</p>
                <p className="text-[9px] font-black text-primary/50 uppercase tracking-[0.4em]">{format(currentTime, 'EEEE, MMM do')}</p>
              </>
            )}
          </div>
        </div>

        {/* PRIORITY 1: JIMSKAY AI HERO (dominant entry point) */}
        <div className="shrink-0 max-w-5xl mx-auto w-full">
          <Card className="glass-panel border-beam rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-primary/[0.02] group cursor-pointer" onClick={() => router.push('/chat')}>
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-all duration-1000"><MessageSquare className="w-64 h-64 text-primary" /></div>
            <div className="relative z-10 flex flex-col gap-6">
               <div className="space-y-4">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>
                 <h2 className="font-serif text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Jimskay AI</h2>
                 <p className="text-[14px] leading-relaxed text-muted-foreground/70 font-medium uppercase tracking-tight max-w-xl">
                   High-intelligence neural link with your Digital Twin. Real-time tactical chat, strategic synthesis, and internet-connected mastery protocols.
                 </p>
               </div>
               <Button className="cyber-button rounded-xl h-14 bg-primary text-black font-black uppercase tracking-[0.3em] text-[11px] px-12 border-none glow-primary w-fit">
                Initialize Neural Link <ChevronRight className="w-5 h-5 ml-2" />
               </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 shrink-0 pb-16 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-xl"><Layout className="w-5 h-5 text-primary animate-pulse" /></div>
            <h2 className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic">Tactical Modules</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PRIORITY 2: 3D AVATAR (comes after AI) */}
            <ModuleCard title="Avatar Link" description="3D high-fidelity digital human. Imposing presence with pure voice and procedural lip-sync." icon={<UserCircle className="w-7 h-7" />} href="/avatar" color="text-primary" tag="3D ACTIVE" />
            
            {/* PRIORITY 3: STUDIO (comes after 3D) */}
            <ModuleCard title="Jimskay Studio" description="Elite IDE with Gemini AI Architect. Synthesize apps, bots, and logic automatically." icon={<Code2 className="w-7 h-7" />} href="/studio" color="text-primary" tag="FORGE" />
            
            <ModuleCard title="Study Lab" description="Practice tests for your subjects like Math and Physics. Preparation for 2026 Mastery." icon={<GraduationCap className="w-7 h-7" />} href="/academic" color="text-primary" tag="GOAL" />
            <ModuleCard title="Web Search" description="Find facts and info from across the internet via global search protocols." icon={<Globe className="w-7 h-7" />} href="/intel" color="text-accent" tag="SYNCED" />
            <ModuleCard title="Game Hub" description="Sharpen your logic and memory with professional cognitive challenges." icon={<Gamepad2 className="w-7 h-7" />} href="/game" color="text-primary" tag="ACTIVE" />
            <ModuleCard title="My Profile" description="Manage your creator identity, bio, and authorization roles." icon={<Fingerprint className="w-7 h-7" />} href="/identity" color="text-accent" tag="SECURED" />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-card/50 backdrop-blur-3xl h-8 flex items-center overflow-hidden border-t border-white/10 z-[100]">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-primary/30 font-black uppercase tracking-[0.5em] text-[8px] mx-12">&bull; ADVANCED MASTERY PHASE &bull; 100% ONLINE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; MAR 2025 ARCHITECTURE &bull;</span>
          <span className="text-primary/30 font-black uppercase tracking-[0.5em] text-[8px] mx-12">&bull; ADVANCED MASTERY PHASE &bull; 100% ONLINE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; MAR 2025 ARCHITECTURE &bull;</span>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, description, icon, href, color, tag }: { title: string; description: string; icon: React.ReactNode; href: string; color: string; tag: string }) {
  const router = useRouter();
  return (
    <Card onClick={() => router.push(href)} className="glass-panel border-beam rounded-[2.5rem] p-7 hover:bg-white/[0.08] cursor-pointer group relative overflow-hidden shadow-xl transition-all h-full">
      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-all border border-white/10 ${color}`}>{icon}</div>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-serif text-[20px] font-black text-white tracking-tighter leading-none italic uppercase">{title}</h3>
        <span className={`text-[9px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 ${color === 'text-primary' ? 'text-primary bg-primary/10' : 'text-muted-foreground/40'}`}>{tag}</span>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground/60 font-medium line-clamp-2 uppercase tracking-tight">{description}</p>
      <div className="mt-6 flex items-center text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">Go Now <ChevronRight className="w-4 h-4 ml-1.5" /></div>
    </Card>
  );
}