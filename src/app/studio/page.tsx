"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Code2, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Archive, 
  ChevronRight,
  Database,
  Search,
  Sparkles,
  Layout,
  Terminal,
  Activity
} from 'lucide-react';
import { collection, query, orderBy, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function StudioLibraryPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/auth');
  }, [user, isUserLoading, router]);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'projects'),
      orderBy('updatedAt', 'desc')
    );
  }, [db, user]);

  const { data: projects, isLoading } = useCollection(projectsQuery);

  const handleCreateProject = async () => {
    if (!user || !db || !newProjectName) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
        name: newProjectName,
        description: "Professional high-fidelity application matrix.",
        files: [
          { 
            name: 'index.html', 
            language: 'html', 
            content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Application Matrix</title>\n</head>\n<body class="bg-[#020205] text-white flex flex-col items-center justify-center h-screen font-sans">\n  <div class="text-center p-16 border border-white/5 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl shadow-2xl">\n    <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">\n      <i data-lucide="sparkles" class="w-8 h-8 text-primary"></i>\n    </div>\n    <h1 class="text-5xl font-black tracking-tighter uppercase mb-2">New Matrix</h1>\n    <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Awaiting Creator Synthesis</p>\n  </div>\n</body>\n</html>' 
          },
          { 
            name: 'backend.js', 
            language: 'javascript', 
            content: '// Backend Logic Node\n// Functional Firebase persistence link\n\nconsole.log("Backend Link Synchronized.");' 
          },
          { 
            name: 'bot_logic.py', 
            language: 'python', 
            content: '# Bot Architect Node\n# Synthesize automation or algorithmic logic here\n\nprint("Bot Engine: Active")\n\ndef bot_heartbeat():\n  return "100% Operational"\n\nprint(f"Status: {bot_heartbeat()}")' 
          },
          { 
            name: 'script.js', 
            language: 'javascript', 
            content: '// UI Interaction Logic\nconsole.log("Logic Node Active.");' 
          },
          {
            name: 'styles.css',
            language: 'css',
            content: ':root {\n  --background-color: #020205;\n  --primary-color: #ffcc00;\n}'
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Matrix Fragment Initialized" });
      router.push(`/studio/workspace/${docRef.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Initialization Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white flex flex-col scanline-effect perspective-matrix">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/60 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard')}
            className="rounded-xl h-10 w-10 text-muted-foreground hover:text-white bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-black glow-primary shadow-2xl">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-black tracking-tighter uppercase italic leading-none shimmer-text">
                Jimskay<span className="gradient-text">Studio</span>
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 mt-1">Logic Repository Node</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <Input 
              placeholder="Search logic assets..." 
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 h-10 rounded-xl bg-white/5 border-white/5 text-[11px] font-bold focus-visible:ring-primary/30"
            />
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="cyber-button rounded-xl h-10 bg-primary text-black font-black uppercase tracking-widest text-[9px] px-8 border-none glow-primary shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Matrix
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
             <Card className="glass-panel border-white/5 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
                <div className="space-y-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 mb-4">
                    <Layout className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl font-black text-white uppercase italic">Protocol Initializer</h2>
                  <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">Define the logic repository label</p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Matrix Handle</label>
                     <Input 
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="E.g. Neural Nexus v1"
                        className="rounded-2xl h-14 bg-white/5 border-white/10 text-xs font-bold text-white px-6 focus-visible:ring-primary/30"
                     />
                   </div>
                   <div className="flex gap-3 pt-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsCreating(false)}
                        className="flex-1 rounded-xl h-12 text-muted-foreground font-black uppercase tracking-widest text-[9px]"
                      >
                        Abort
                      </Button>
                      <Button 
                        onClick={handleCreateProject}
                        disabled={isSaving || !newProjectName}
                        className="flex-[2] rounded-xl h-12 bg-primary text-black font-black uppercase tracking-widest text-[9px] border-none glow-primary shadow-xl"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Sync Matrix
                      </Button>
                   </div>
                </div>
             </Card>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex items-center gap-4">
            <Archive className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-black text-white uppercase italic tracking-tighter">Vaulted Assets</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {Array.from({ length: 4 }).map((_, i) => (
                 <Card key={i} className="glass-panel border-white/5 rounded-[2.5rem] p-8 h-72 animate-pulse bg-white/[0.01]" />
               ))}
             </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProjects.map((project: any) => (
                <Card 
                  key={project.id} 
                  onClick={() => router.push(`/studio/workspace/${project.id}`)}
                  className="glass-panel border-beam rounded-[2.5rem] p-8 group cursor-pointer hover:bg-white/[0.05] border-none shadow-2xl relative overflow-hidden flex flex-col h-72 transition-all duration-700"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Database className="w-32 h-32 text-primary" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-all duration-500">
                    <Terminal className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic line-clamp-1 group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-2">
                    {project.files?.length || 0} Files • {project.updatedAt ? format(project.updatedAt.toDate(), 'MMM d, yyyy') : 'Now'}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">Enter Forge</span>
                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Purge this matrix permanently?")) {
                        deleteDocumentNonBlocking(doc(db!, 'users', user.uid, 'projects', project.id));
                      }
                    }}
                    className="absolute top-6 right-6 h-8 w-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center glass-panel rounded-[3rem] border-dashed border-white/10 border-2 bg-transparent max-w-2xl mx-auto w-full">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-full h-full rounded-[1.5rem] bg-black border border-white/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary/40" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-black text-white mb-3 uppercase italic tracking-tighter">No Matrix Fragments</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 max-w-sm mx-auto leading-relaxed">
                The logic repository is empty. Initialize a new programmatic matrix to begin synthesis.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="h-10 bg-card/60 backdrop-blur-3xl border-t border-white/5 flex items-center px-8 shrink-0 overflow-hidden">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-primary/20 font-black uppercase tracking-[0.5em] text-[8px] mx-12">
            &bull; LOGIC REPOSITORY ACTIVE &bull; 100% ONLINE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; 24K GOLD ARCHITECTURE &bull;
          </span>
          <span className="text-primary/20 font-black uppercase tracking-[0.5em] text-[8px] mx-12">
            &bull; LOGIC REPOSITORY ACTIVE &bull; 100% ONLINE &bull; PERSONAL WORKSPACE &bull; SECURE TERMINAL &bull; 24K GOLD ARCHITECTURE &bull;
          </span>
        </div>
      </footer>
    </div>
  );
}
