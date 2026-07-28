"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Save, 
  ArrowLeft, 
  Loader2, 
  FileCode, 
  Folder, 
  Play,
  MessageSquare,
  ChevronRight,
  Search,
  X,
  Sparkles,
  ChevronDown,
  Database,
  Download,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-python';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Sector 1: The Code Forge.
 * UPGRADED: Absolute Gutter Correction (Left-Aligned Protocol).
 * HARDENED: Functional Firebase Backend Matrix Sector.
 */
export default function JimskayWorkspacePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [tempCode, setTempCode] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'explorer'>('editor');
  const [isFirebaseExpanded, setIsFirebaseExpanded] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !user) router.push('/auth');
  }, [user, isUserLoading, router]);

  const projectDocQuery = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return doc(db, 'users', user.uid, 'projects', projectId);
  }, [db, user?.uid, projectId]);

  const { data: project, isLoading } = useDoc(projectDocQuery);

  useEffect(() => {
    if (project?.files?.[activeFileIndex]) {
      setTempCode(project.files[activeFileIndex].content);
    }
  }, [project, activeFileIndex]);

  const handleSave = () => {
    if (!user || !db || !project) return;
    setIsSaving(true);
    
    const updatedFiles = [...project.files];
    updatedFiles[activeFileIndex] = { ...updatedFiles[activeFileIndex], content: tempCode };
    
    const docRef = doc(db, 'users', user.uid, 'projects', projectId);
    
    updateDoc(docRef, {
      files: updatedFiles,
      updatedAt: serverTimestamp(),
    }).then(() => {
      toast({ title: "Logic Vaulted" });
    }).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: { files: updatedFiles }
      });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsSaving(false);
    });
  };

  const handleDownloadFile = () => {
    if (!project?.files?.[activeFileIndex]) return;
    const activeFile = project.files[activeFileIndex];
    const blob = new Blob([tempCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ 
      title: "Asset Exported", 
      description: `${activeFile.name} downloaded successfully.` 
    });
  };

  const navigateToBackend = () => {
    if (!project?.files) return;
    const backendIdx = project.files.findIndex(f => f.name.toLowerCase().includes('backend'));
    if (backendIdx !== -1) {
      setActiveFileIndex(backendIdx);
      setActiveMobileTab('editor');
    } else {
      toast({ title: "Backend Node Offline", description: "Initialize a backend.js file to link." });
    }
  };

  const highlightCode = (input: string, language: string) => {
    try {
      let lang = Prism.languages.markup;
      if (language === 'javascript' && Prism.languages.js) lang = Prism.languages.js;
      else if (language === 'css' && Prism.languages.css) lang = Prism.languages.css;
      else if (language === 'python' && Prism.languages.python) lang = Prism.languages.python;
      return Prism.highlight(input || '', lang, language);
    } catch (e) {
      return input || '';
    }
  };

  if (!isMounted || isUserLoading || isLoading || !project) {
    return (
      <div className="h-screen w-screen bg-[#020205] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-20 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary animate-pulse">Establishing Code Forge</p>
      </div>
    );
  }

  const activeFile = project.files[activeFileIndex] || { name: 'index.html', language: 'html', content: '' };
  const lines = tempCode.split('\n');

  return (
    <div className="h-[100dvh] w-screen bg-[#020205] text-white flex flex-col overflow-hidden scanline-effect font-sans">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/60 backdrop-blur-3xl shrink-0 z-[100]">
        <div className="flex items-center gap-2 md:gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/studio')} className="rounded-xl h-9 w-9 bg-white/5 text-primary hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-black shadow-2xl glow-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="hidden xs:block">
              <h1 className="font-serif text-sm md:text-lg font-black tracking-tighter uppercase italic leading-none shimmer-text truncate max-w-[120px] md:max-w-none">
                {project.name}
              </h1>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/60 mt-0.5 hidden md:block">Primary Sector • Forge Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           <div className="hidden md:flex items-center gap-2">
              <Button 
                onClick={() => router.push(`/studio/architect/${projectId}`)}
                className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-primary border border-primary/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2 group"
              >
                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Neural AI
              </Button>
              <Button 
                onClick={() => router.push(`/studio/view/${projectId}`)}
                className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-accent border border-accent/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2 group"
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Live Matrix
              </Button>
           </div>
           
           <div className="w-px h-8 bg-white/10 hidden md:block" />

           <div className="flex items-center gap-2">
             <Button 
               onClick={handleDownloadFile}
               variant="ghost"
               size="icon"
               className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:bg-white/10"
             >
               <Download className="w-4 h-4" />
             </Button>
             
             <Button 
               onClick={handleSave} 
               disabled={isSaving}
               className="rounded-xl h-10 bg-primary text-black font-black text-[9px] md:text-[10px] uppercase tracking-widest px-4 md:px-8 hover:bg-primary/80 shadow-xl glow-primary border-none"
             >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin md:mr-2" /> : <Save className="w-4 h-4 md:mr-2" />}
               <span className="hidden md:inline">Vault Logic</span>
               <span className="md:hidden">Vault</span>
             </Button>
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-[#05050a] relative">
        <div className={`${activeMobileTab === 'explorer' ? 'flex' : 'hidden'} md:flex w-full md:w-64 border-r border-white/5 bg-black/40 flex-col shrink-0 z-40 relative`}>
          <div className="h-10 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Explorer</span>
            <div className="flex gap-2">
               <Search className="w-3.5 h-3.5 text-white/20 hover:text-primary cursor-pointer" onClick={() => setShowSearch(!showSearch)} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsFirebaseExpanded(!isFirebaseExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between group cursor-pointer border-b border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-2">
                {isFirebaseExpanded ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
                <Database className={`w-4 h-4 ${isFirebaseExpanded ? 'text-primary' : 'text-primary/60'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Firebase</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ${isFirebaseExpanded ? 'opacity-100' : 'opacity-40'}`} />
            </button>

            {isFirebaseExpanded && (
              <div className="p-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Link Status</span>
                     <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter flex items-center gap-1">
                       <Zap className="w-2.5 h-2.5" /> OPERATIONAL
                     </span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Auth Protocol</span>
                     <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter">AES-256 SYNC</span>
                   </div>
                   <div className="pt-1">
                     <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-full animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                     </div>
                   </div>
                </div>
                
                <button 
                  onClick={navigateToBackend}
                  className="w-full px-3 py-1.5 flex items-center gap-2 group cursor-pointer rounded-md hover:bg-white/5 text-left"
                >
                   <ShieldCheck className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                   <span className="text-[8px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">Firestore Registry</span>
                </button>
              </div>
            )}
            
            <div className="h-10 px-6 border-b border-t border-white/5 flex items-center bg-white/[0.01] mt-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Logic Tree</span>
            </div>

            <div className="p-1 space-y-0.5">
              {project.files.map((file: any, idx: number) => (
                <button
                  key={file.name}
                  onClick={() => {
                    setActiveFileIndex(idx);
                    setActiveMobileTab('editor');
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-2.5 rounded-lg transition-all ${activeFileIndex === idx ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-white/[0.02]'}`}
                >
                  <FileCode className={`w-4 h-4 ${activeFileIndex === idx ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  <span className="text-[11px] font-bold tracking-tight truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col min-w-0 relative ${activeMobileTab === 'explorer' ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-11 flex items-center bg-black/40 border-b border-white/5 px-4 overflow-x-auto scrollbar-none gap-0.5 shrink-0">
            {project.files.map((file: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveFileIndex(idx)}
                className={`h-full px-5 flex items-center gap-3 border-r border-white/5 transition-all relative group shrink-0 ${activeFileIndex === idx ? 'bg-[#05050a] text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary' : 'text-white/30 hover:bg-white/5'}`}
              >
                <FileCode className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{file.name}</span>
                {activeFileIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              </button>
            ))}
          </div>

          {/* ABSOLUTE FIX: Editor Container with Left-Aligned Gutter */}
          <div className="editor-container">
            <div className="editor-gutter">
              {lines.map((_, i) => (
                <div key={i} className="gutter-number">{i + 1}</div>
              ))}
            </div>
            <div className="forge-editor-root">
              <Editor
                value={tempCode}
                onValueChange={setTempCode}
                highlight={code => highlightCode(code, activeFile.language)}
                padding={0}
                className="min-h-full"
                textareaId="forge-editor-textarea"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {showSearch && (
            <div className="absolute top-16 right-4 md:right-10 z-50 glass-panel border-white/10 bg-black/80 rounded-xl p-3 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-2">
              <Search className="w-3.5 h-3.5 text-primary" />
              <input placeholder="Find..." className="bg-transparent border-none outline-none text-[11px] text-white font-bold w-32 md:w-48" />
              <X className="w-3.5 h-3.5 text-white/20 hover:text-red-500 cursor-pointer" onClick={() => setShowSearch(false)} />
            </div>
          )}

          <div className="md:hidden h-16 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 shrink-0 z-50">
             <button onClick={() => setActiveMobileTab('explorer')} className={`flex flex-col items-center gap-1 ${activeMobileTab === 'explorer' ? 'text-primary' : 'text-white/20'}`}>
               <Folder className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-widest">Files</span>
             </button>
             <button onClick={() => setActiveMobileTab('editor')} className={`flex flex-col items-center gap-1 ${activeMobileTab === 'editor' ? 'text-primary' : 'text-white/20'}`}>
               <FileCode className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-widest">Code</span>
             </button>
             <button onClick={() => router.push(`/studio/view/${projectId}`)} className="flex flex-col items-center gap-1 text-white/20">
               <Play className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-widest">Run</span>
             </button>
             <button onClick={() => router.push(`/studio/architect/${projectId}`)} className="flex flex-col items-center gap-1 text-white/20">
               <MessageSquare className="w-5 h-5" />
               <span className="text-[8px] font-black uppercase tracking-widest">AI</span>
             </button>
          </div>
        </div>
      </main>

      <footer className="h-8 bg-card border-t border-white/5 flex items-center px-8 shrink-0 overflow-hidden hidden md:flex">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-primary/20 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; CODE FORGE ACTIVE &bull; FIREBASE BACKEND NODE ONLINE &bull; ASSET EXPORT ENABLED &bull; SECURE LOGIC VAULT &bull;
          </span>
          <span className="text-primary/20 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; CODE FORGE ACTIVE &bull; FIREBASE BACKEND NODE ONLINE &bull; ASSET EXPORT ENABLED &bull; SECURE LOGIC VAULT &bull;
          </span>
        </div>
      </footer>
    </div>
  );
}
