"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { AvatarScene } from '@/components/Avatar/AvatarScene';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  ArrowLeft, 
  Activity, 
  Loader2,
  Cpu,
  ShieldCheck,
  Zap,
  Volume2,
  Lock,
  Globe,
  Waves,
  Fingerprint,
  Menu
} from 'lucide-react';
import { jimskayChat } from '@/ai/flows/jimskay-chat-flow';
import { synthesizeSpeech } from '@/ai/flows/text-to-speech-flow';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * JimskayAvatarPage: The Tactical 3D Workspace.
 * Optimized for 100% visual focus on the 3D Human Entity.
 * Relocated Mic controls to the HUD to remove visual obstruction.
 */
export default function JimskayAvatarPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gesture, setGesture] = useState<'idle' | 'explaining' | 'thinking'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/auth');
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setGesture('idle');
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendVoice(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [user, isUserLoading, router]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSendVoice = async (text: string) => {
    if (!text.trim() || !user || !db) return;
    
    setIsAiThinking(true);
    setGesture('thinking');
    
    try {
      // Archive session fragment
      await addDoc(collection(db, 'users', user.uid, 'chats'), {
        userId: user.uid,
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });

      const response = await jimskayChat({
        userId: user.uid,
        history: [{ role: 'user', content: text }],
        currentUser: { isVerifiedCreator: true }
      });

      if (response && response.text) {
        // High-Fidelity Synthesis Protocol: Remove Markdown for pure audio link
        const cleanText = response.text
          .replace(/\[SPLIT\]/g, ' ')
          .replace(/[#*`_]/g, '')
          .replace(/\$\$[\s\S]*?\$\$/g, '') 
          .replace(/\$([\s\S]*?)\$/g, '$1') 
          .replace(/🔥|✅|🎯|💡|⚠️|👉/g, '')
          .trim();
        
        await playNeuralVoice(cleanText);
      }
    } catch (e: any) {
       toast({ variant: 'destructive', title: 'Neural Link Error', description: e.message });
       setGesture('idle');
    } finally {
      setIsAiThinking(false);
    }
  };

  const playNeuralVoice = async (text: string) => {
    try {
      const { audioUrl } = await synthesizeSpeech(text);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setGesture('explaining');
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setGesture('idle');
      };

      await audio.play();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Vocal Synthesis Failed' });
      setGesture('idle');
    }
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="h-[100dvh] w-screen bg-[#020205] overflow-hidden relative font-sans scanline-effect perspective-matrix">
      {/* Full-Body 3D Virtual Human (The Star of the Sector) */}
      <AvatarScene isSpeaking={isSpeaking} gesture={gesture} />

      {/* Tactical Holographic HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 p-6 md:p-10 flex flex-col justify-between">
        <header className="flex justify-between items-start pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-5">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/dashboard')}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
                <h1 className="font-serif text-3xl font-black text-white tracking-tighter uppercase italic leading-none shimmer-text">
                    Jimskay<span className="text-primary">Entity</span>
                </h1>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse glow-accent" />
                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em]">Neural Link: Stable</p>
                </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-end">
             {/* Discreet Mic Toggle in HUD */}
             <Button 
                onClick={toggleMic}
                className={`h-14 w-48 rounded-xl transition-all duration-500 border border-white/10 flex items-center justify-between px-6 bg-black/60 backdrop-blur-3xl group ${
                    isListening ? 'bg-primary/20 border-primary text-primary' : 'bg-black/40 text-muted-foreground hover:text-white'
                }`}
            >
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isListening ? 'Neural Capture Active' : 'Initialize Capture'}
                </span>
                {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4 opacity-40" />}
             </Button>

             <div className="glass-panel px-5 py-2.5 rounded-xl flex items-center gap-5 bg-black/60 border-primary/20 shadow-2xl">
                <div className="flex flex-col text-right">
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Neural Stream</span>
                    <span className="text-[10px] font-black text-white tabular-nums">1.2 TB/s</span>
                </div>
                <Waves className="w-4 h-4 text-primary animate-pulse" />
             </div>
          </div>
        </header>

        {/* Floating Lateral HUD Widgets (Opacity lowered for 3D visibility) */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-12 opacity-30 hover:opacity-100 transition-opacity duration-500">
           <HUDWidget icon={<Lock className="w-3 h-3" />} label="Sect-Vault" value="AES-256" color="text-primary" />
           <HUDWidget icon={<Globe className="w-3 h-3" />} label="Grid-Sync" value="Active" color="text-accent" />
           <HUDWidget icon={<Cpu className="w-3 h-3" />} label="Bio-Logic" value="Stable" color="text-green-500" />
        </div>

        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-12 opacity-30 hover:opacity-100 transition-opacity duration-500 items-end">
           <HUDWidget icon={<Activity className="w-3 h-3" />} label="Pulse" value="84 BPM" color="text-red-500" reverse />
           <HUDWidget icon={<ShieldCheck className="w-3 h-3" />} label="Auth" value="L-1 Verif" color="text-primary" reverse />
           <HUDWidget icon={<Zap className="w-3 h-3" />} label="Latency" value="14ms" color="text-accent" reverse />
        </div>

        <main className="flex-1 flex items-center justify-center">
            {isAiThinking && (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                  <div className="relative">
                    <div className="absolute -inset-16 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
                    <Loader2 className="w-14 h-14 text-primary animate-spin relative" />
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.6em] animate-pulse">Synthesizing Voice</span>
               </div>
            )}
        </main>

        <footer className="flex flex-col items-center gap-10 pointer-events-auto pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-24">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isSpeaking ? 'bg-primary glow-primary' : 'bg-white/5 border border-white/10'}`} />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Skeletal Talk Node</span>
             </div>
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isListening ? 'bg-accent glow-accent' : 'bg-white/5 border border-white/10'}`} />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Aural Capture</span>
             </div>
          </div>

          <div className="h-[2px] w-full max-w-3xl bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-primary transition-all duration-500 shadow-[0_0_20px_rgba(255,215,0,1)]" 
                style={{ width: isSpeaking || isListening ? '100%' : '0%' }} 
              />
          </div>
        </footer>
      </div>

      {/* Cyber Marquee Ticker */}
      <div className="fixed bottom-0 left-0 w-full bg-card/30 backdrop-blur-md h-10 flex items-center overflow-hidden border-t border-white/5 z-[100]">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-white/10 font-black uppercase tracking-[0.8em] text-[10px] mx-16">&bull; JIMSKAY VIRTUAL HUMAN ACTIVE &bull; PURE VOICE PROTOCOL &bull; NEURAL HUD ONLINE &bull; 0% TEXT DISTRACTION &bull; ACADEMIC MASTERY PHASE ACTIVE &bull;</span>
          <span className="text-white/10 font-black uppercase tracking-[0.8em] text-[10px] mx-16">&bull; JIMSKAY VIRTUAL HUMAN ACTIVE &bull; PURE VOICE PROTOCOL &bull; NEURAL HUD ONLINE &bull; 0% TEXT DISTRACTION &bull; ACADEMIC MASTERY PHASE ACTIVE &bull;</span>
        </div>
      </div>
    </div>
  );
}

function HUDWidget({ icon, label, value, color, reverse = false }: { icon: React.ReactNode, label: string, value: string, color: string, reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-4 ${reverse ? 'flex-row-reverse text-right' : ''}`}>
        <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl ${color}`}>
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>{value}</span>
        </div>
    </div>
  );
}