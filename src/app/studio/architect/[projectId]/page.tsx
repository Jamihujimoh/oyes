
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Play,
  Paperclip,
  Send,
  Layout,
  Camera,
  X,
  Scan,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Waves,
  Brain,
  Activity
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { studioArchitect } from '@/ai/flows/jimskay-studio-flow';
import { synthesizeSpeech } from '@/ai/flows/text-to-speech-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

/**
 * Sector 2: Neural AI Architect Hub.
 * UPGRADED: Neural Planning Mode (Thoughts) & Active Cogitation Overlay.
 * PROTOCOL: Professional Sentient Duplicate Interaction.
 */
export default function JimskayArchitectPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [chatInput, setChatInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Voice Interaction States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !user) router.push('/auth');
    
    // Initialize Speech Recognition Protocol
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
      }
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [user, isUserLoading, router]);

  const projectDocQuery = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return doc(db, 'users', user.uid, 'projects', projectId);
  }, [db, user?.uid, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectDocQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return query(
      collection(db, 'users', user.uid, 'projects', projectId, 'studio_messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [db, user?.uid, projectId]);

  const { data: messages } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSynthesizing]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Payload Overflow", description: "Limit: 4MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast({ title: "Optical Grid Synced" });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      toast({ title: "Neural Capture Active", description: "Vocal commands synchronized." });
    }
  };

  const playVocalSynthesis = async (text: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const { audioUrl } = await synthesizeSpeech(text);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingId(id);

      audio.onended = () => {
        setPlayingId(null);
        setIsSpeaking(false);
      };

      await audio.play();
    } catch (e) {
      toast({ variant: "destructive", title: "Vocal Link Failed" });
      setIsSpeaking(false);
    }
  };

  const handleSynthesize = async () => {
    if (!user || !project || (!chatInput.trim() && !selectedImage) || isSynthesizing) return;

    setIsSynthesizing(true);
    const command = chatInput.trim() || "Analyze and synthesize project based on attached optical node.";
    const imageToForge = selectedImage;
    
    setChatInput('');
    setSelectedImage(null);

    const messagesRef = collection(db!, 'users', user.uid, 'projects', projectId, 'studio_messages');

    try {
      await addDoc(messagesRef, {
        role: 'user',
        content: command,
        imageUrl: imageToForge,
        timestamp: serverTimestamp(),
      });

      const response = await studioArchitect({
        files: project.files,
        activeFileName: project.files[0]?.name || 'index.html',
        command,
        imageUrl: imageToForge || undefined,
        isCreator: true
      });

      if (response && response.modifiedFiles) {
        const projectRef = doc(db!, 'users', user.uid, 'projects', projectId);
        
        const updatedFiles = [...project.files];
        response.modifiedFiles.forEach(modFile => {
          const index = updatedFiles.findIndex(f => f.name === modFile.name);
          if (index !== -1) {
            updatedFiles[index] = modFile;
          } else {
            updatedFiles.push(modFile);
          }
        });

        await updateDoc(projectRef, {
          files: updatedFiles,
          updatedAt: serverTimestamp(),
        });
        
        const modelMsgRef = await addDoc(messagesRef, {
          role: 'model',
          content: response.explanation,
          thoughts: response.thoughts,
          isUpdate: true,
          timestamp: serverTimestamp(),
          modifiedFiles: response.modifiedFiles.map(f => f.name)
        });

        toast({ title: "Logic Synthesis Applied" });
        
        // Auto-vocalize the explanation
        playVocalSynthesis(response.explanation, modelMsgRef.id);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Synthesis Failed", description: "Link unstable." });
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!isMounted || isUserLoading || (isProjectLoading && !project)) {
    return (
      <div className="h-screen w-screen bg-[#020205] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-20 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary animate-pulse">Booting Architect Hub</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#020205] text-white flex flex-col overflow-hidden scanline-effect font-sans">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/60 backdrop-blur-3xl shrink-0 z-[100]">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/studio/workspace/${projectId}`)} className="rounded-xl h-9 w-9 bg-white/5 text-primary hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-black shadow-2xl glow-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-lg font-black tracking-tighter uppercase italic leading-none shimmer-text">Neural AI Hub</h1>
              <div className="flex items-center gap-2">
                <p className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/60 mt-0.5">Project Synthesis Sector</p>
                {isSpeaking && <Waves className="w-3 h-3 text-green-500 animate-pulse" />}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           <Button onClick={() => router.push(`/studio/workspace/${projectId}`)} className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-primary border border-primary/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2">
             <Code2 className="w-4 h-4" /> Code Forge
           </Button>
           <Button onClick={() => router.push(`/studio/view/${projectId}`)} className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-accent border border-accent/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2">
             <Play className="w-4 h-4" /> Live Matrix
           </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center overflow-hidden relative bg-[#05050a]">
        <div ref={scrollRef} className="w-full max-w-4xl flex-1 overflow-y-auto custom-scrollbar space-y-8 py-10 pb-48 px-6">
          {messages?.map((msg, idx) => (
            <div key={msg.id} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              {msg.isUpdate ? (
                <div className="glass-panel border-primary/20 bg-primary/[0.02] p-8 w-full rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-24 h-24 text-primary" /></div>
                  
                  {/* Planning Mode Logic Block */}
                  {msg.thoughts && (
                    <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-700">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em]">Neural Process Log</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground/60 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-4">
                        {msg.thoughts}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Zap className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-widest">Logic Synthesis Applied</p>
                      <span className="text-[7px] font-bold text-primary/60 uppercase tracking-[0.3em]">Status: Committed</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => playVocalSynthesis(msg.content, msg.id)}
                        className={`h-8 w-8 rounded-lg bg-white/5 border border-white/10 transition-all ${playingId === msg.id ? 'text-green-500' : 'text-white/40 hover:text-primary'}`}
                      >
                        {playingId === msg.id ? <Pause className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed font-medium mb-8 italic border-l-2 border-primary/20 pl-4">{msg.content}</p>
                  {msg.modifiedFiles && (
                    <div className="space-y-3">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Manifest Updates:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.modifiedFiles.map((f: string, i: number) => (
                          <div key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                             <span className="text-[9px] font-bold text-white/60 uppercase tracking-tight">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 items-end max-w-[85%]">
                   {msg.imageUrl && (
                      <div className="relative aspect-video w-64 rounded-xl overflow-hidden border border-primary/20 shadow-2xl group/img">
                        <Image src={msg.imageUrl} alt="Optical Node" fill className="object-cover transition-transform group-hover/img:scale-105 duration-700" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full border border-white/10 flex items-center gap-1.5">
                           <Scan className="w-2.5 h-2.5 text-primary" />
                           <span className="text-[6px] font-black text-white uppercase tracking-widest">Optical Node</span>
                        </div>
                      </div>
                   )}
                   <div className={`p-6 rounded-[1.5rem] text-[14px] font-medium leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30 text-white' : 'bg-white/[0.03] border border-white/10 text-muted-foreground'}`}>
                    {msg.content}
                   </div>
                </div>
              )}
            </div>
          ))}
          
          {isSynthesizing && (
            <div className="w-full relative px-4 md:px-5 py-10 border-y border-white/5 bg-white/[0.01] animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Architect Synthesis</span>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="relative">
                        <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                        <Brain className="w-5 h-5 text-primary animate-pulse" />
                     </div>
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Digital Twin Cogitation...</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40 animate-marquee w-1/2"></div>
                     </div>
                     <span className="text-[7px] font-black text-muted-foreground/20 uppercase tracking-widest">Project Matrix Logic Mapping</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
          <div className="relative">
            {selectedImage && (
               <div className="absolute -top-32 left-0 z-50 p-2 bg-black/90 backdrop-blur-3xl border border-primary/20 rounded-2xl animate-in zoom-in-95 shadow-2xl flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                    <Image src={selectedImage} alt="Optical Buffer" fill className="object-cover" />
                    <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="pr-6">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Optical Node Fragment</p>
                    <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-tight">Ready for Logic Synthesis</p>
                  </div>
               </div>
            )}

            <div className="absolute left-6 top-6 flex items-center gap-4 pointer-events-none z-20">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-serif font-black text-lg shadow-xl">J</div>
              <Paperclip className="w-5 h-5 text-primary/30" />
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageSelect} 
            />

            <textarea 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSynthesize())}
              placeholder={isListening ? "Listening to Creator commands..." : "Command the AI Architect..."}
              className={`w-full min-h-[90px] max-h-[260px] rounded-[2.5rem] bg-black/90 backdrop-blur-3xl border text-[14px] font-bold text-primary pl-24 pr-44 py-8 resize-none focus:outline-none focus:border-primary/50 transition-all placeholder:text-primary/10 shadow-2xl ${isListening ? 'border-primary glow-primary' : 'border-white/10'}`}
            />

            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMic}
                className={`h-12 w-12 rounded-xl bg-white/5 border border-white/10 transition-all ${isListening ? 'text-primary glow-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                className={`h-12 w-12 rounded-xl bg-white/5 border border-white/10 transition-all ${selectedImage ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button 
                onClick={handleSynthesize}
                disabled={isSynthesizing || (!chatInput.trim() && !selectedImage)}
                className="h-12 px-8 bg-primary text-black font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-xl glow-primary border-none"
              >
                {isSynthesizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Forge</>}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-8 bg-card border-t border-white/5 flex items-center px-8 shrink-0 overflow-hidden">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-primary/20 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; NEURAL AI ARCHITECT ACTIVE &bull; PLANNING MODE ENABLED &bull; VISION LINK ESTABLISHED &bull; BIDIRECTIONAL VOICE CAPTURE ENABLED &bull;
          </span>
          <span className="text-primary/20 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; NEURAL AI ARCHITECT ACTIVE &bull; PLANNING MODE ENABLED &bull; VISION LINK ESTABLISHED &bull; BIDIRECTIONAL VOICE CAPTURE ENABLED &bull;
          </span>
        </div>
      </footer>
    </div>
  );
}
