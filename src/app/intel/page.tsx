
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Search, 
  Loader2, 
  ArrowLeft, 
  Zap, 
  Activity, 
  ChevronRight, 
  Database, 
  FileText, 
  Sparkles, 
  ImageIcon,
  Download,
  Eye,
  Lock,
  Terminal,
  Target
} from 'lucide-react';
import { generateIntelReport, type IntelOutput } from '@/ai/flows/intel-synthesis-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function IntelligenceSectorPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<IntelOutput | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/auth');
  }, [user, isUserLoading, router]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setReport(null);
    try {
      const result = await generateIntelReport({ topic: query.trim() });
      setReport(result);
      toast({ title: "Search Complete" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `jimskay-intel-node-${index}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Download Initiated" });
    } catch (e) {
      // Fallback for CORS restricted images
      window.open(url, '_blank');
      toast({ title: "View Opened", description: "Direct download blocked by source. Please save manually." });
    }
  };

  const handleVaultImage = async (url: string) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'vault_items'), {
        label: `Visual Node: ${query || 'Intelligence Fragment'}`,
        content: url,
        securityLevel: 1,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Visual Node Vaulted", description: "committed to Logic Vault." });
    } catch (e) {
      toast({ variant: "destructive", title: "Vaulting Failed" });
    }
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] overflow-hidden fixed inset-0 scanline-effect">
      <div 
        className={`fixed inset-0 z-[60] bg-black/80 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 z-[70] h-full w-64 bg-[#020205] border-r border-white/5 transition-transform duration-300 transform md:relative md:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentChatId={null} 
          onSelectChat={(id) => router.push(id ? `/chat?id=${id}` : '/chat')} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#05050a] relative p-4 md:p-8 flex flex-col gap-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-lg h-8 w-8 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-black glow-accent shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic leading-none shimmer-text">
                  Web<span className="text-accent">Search</span>
                </h1>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mt-1">Information Grid • Fact Finder</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3">
              <Activity className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest tabular-nums">Link Status: Stable</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-8">
          <Card className="glass-panel border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Database className="w-32 h-32 text-white" />
            </div>
            
            <form onSubmit={handleSearch} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Search Objective</label>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                  <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for facts, news, or images..."
                    className="rounded-2xl h-16 bg-white/5 border-white/10 text-xs font-bold text-white px-14 focus-visible:ring-accent/30"
                  />
                </div>
              </div>
              <Button 
                type="submit"
                disabled={isAnalyzing || !query.trim()}
                className="cyber-button w-full rounded-2xl h-14 bg-accent text-black font-black uppercase tracking-widest text-[10px] border-none shadow-xl glow-accent"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Zap className="w-5 h-5 mr-3" />}
                Search Network
              </Button>
            </form>
          </Card>

          {isAnalyzing && (
            <div className="py-20 text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-full h-full rounded-2xl bg-black border border-accent/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Searching Global Grid...</p>
                <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Fact synthesis in progress</p>
              </div>
            </div>
          )}

          {report && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="glass-panel border-accent/20 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic">Search Report</h3>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Neural Synthesis Active</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Accuracy</p>
                    <p className="text-2xl font-black text-accent">{report.confidenceLevel}%</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Summary
                    </h4>
                    <p className="text-[13px] leading-relaxed text-white/90 font-medium italic bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                      {report.summary}
                    </p>
                  </section>

                  {/* Image Gallery Section */}
                  {report.imageUrls && report.imageUrls.length > 0 && (
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-accent" />
                        Visual Context Synapses
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {report.imageUrls.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group/img shadow-xl bg-black/20">
                            <div className="absolute inset-0 bg-accent/5 animate-pulse opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            <Image src={url} alt={`Visual Node ${i}`} fill className="object-cover transition-transform duration-500 group-hover/img:scale-110" unoptimized />
                            
                            {/* Optical Action Hub */}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100 transition-all duration-300 backdrop-blur-sm">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.open(url, '_blank')}
                                className="h-7 w-24 text-[7px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10"
                              >
                                <Eye className="w-3 h-3 mr-1" /> View Node
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadImage(url, i)}
                                className="h-7 w-24 text-[7px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10"
                              >
                                <Download className="w-3 h-3 mr-1" /> Download
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleVaultImage(url)}
                                className="h-7 w-24 text-[7px] font-black uppercase tracking-widest bg-accent/20 hover:bg-accent/30 text-accent rounded-lg border border-accent/20"
                              >
                                <Lock className="w-3 h-3 mr-1" /> Vault Node
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-primary" />
                        Key Facts
                      </h4>
                      <div className="space-y-3">
                        {report.keyFacts.map((fact, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <ChevronRight className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                            <span className="text-[10px] font-bold text-muted-foreground leading-tight uppercase tracking-tight">{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-red-500" />
                        Strategic Value
                      </h4>
                      <div className="p-6 rounded-2xl bg-red-600/5 border border-red-600/10 shadow-xl">
                        <p className="text-[11px] text-white/80 font-bold leading-relaxed">
                          {report.strategicImplication}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-card/30 backdrop-blur-md h-7 flex items-center overflow-hidden border-t border-white/5 z-[100]">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-accent/20 font-black uppercase tracking-[0.5em] text-[7px] mx-8">
            &bull; Web Search &bull; Global Info Grid &bull; Real-time Facts &bull; Neural Synthesis &bull; Advanced Mastery 2026 &bull;
          </span>
          <span className="text-accent/20 font-black uppercase tracking-[0.5em] text-[7px] mx-8">
            &bull; Web Search &bull; Global Info Grid &bull; Real-time Facts &bull; Neural Synthesis &bull; Advanced Mastery 2026 &bull;
          </span>
        </div>
      </div>
    </div>
  );
}
