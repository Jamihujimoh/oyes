
"use client"

import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, RefreshCw, Code2, Sparkles, ArrowLeft, Play, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @fileOverview Jimskay Live Matrix Viewport.
 * Sector 3: Dedicated full-screen preview.
 * UPGRADED: Integrated Python 3.11 Runtime & Firebase Backend SDKs.
 * HARDENED: Collapsible Python Terminal & Zero-Branding Protocol.
 */
export default function StandaloneViewPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isUserLoading && !user) router.push('/auth');
  }, [user, isUserLoading, router, isClient]);

  const projectDocQuery = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return doc(db, 'users', user.uid, 'projects', projectId);
  }, [db, user?.uid, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectDocQuery);

  const bundledCode = useMemo(() => {
    if (!project || !project.files) return '';
    
    const htmlFile = project.files.find((f: any) => f.name.endsWith('.html')) || project.files[0];
    const cssFile = project.files.find((f: any) => f.name.endsWith('.css'));
    const jsFile = project.files.find((f: any) => f.name.endsWith('.js'));
    const pythonFile = project.files.find((f: any) => f.name.endsWith('.py'));

    if (!htmlFile && !pythonFile) return '<html><body style="background:#020205; color:white; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; padding:2rem;"><h1 style="font-weight:900; text-transform:uppercase;">No Matrix Entry Point</h1></body></html>';

    let content = htmlFile?.content || '<!DOCTYPE html>\n<html>\n<head>\n  <title>Application Matrix</title>\n</head>\n<body style="background:#020205"></body>\n</html>';

    const headInjections = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Alegreya:ital,wght@0,900;1,900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        .font-serif { font-family: 'Alegreya', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ${cssFile ? cssFile.content : ''}
        
        #python-terminal-container {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 9999;
          display: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #python-terminal-container.active { display: block; }
        #python-terminal-container.collapsed { height: 40px; overflow: hidden; }
        #python-terminal-container.expanded { height: 35%; }

        #terminal-header {
          height: 40px;
          background: #020205;
          border-top: 1px solid rgba(255,215,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          cursor: pointer;
        }
        #terminal-header span { color: #ffd700; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        
        #terminal-content {
          background: #020205;
          height: calc(100% - 40px);
          color: #00ff88;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 20px;
          overflow-y: auto;
        }
        .term-toggle-btn {
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.2);
          color: #ffd700;
          font-size: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
      </style>
    `;

    const safeJsContent = jsFile ? jsFile.content.replace(/<\/script>/g, '<\\/script>').replace(/`/g, '\\`').replace(/\$/g, '\\$') : '';
    const safePyContent = pythonFile ? pythonFile.content.replace(/`/g, '\\`').replace(/\$/g, '\\$') : '';

    const pythonEngine = pythonFile ? `
      <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"></script>
      <div id="python-terminal-container" class="collapsed">
        <div id="terminal-header" onclick="toggleTerminal()">
          <span>Python Terminal 3.11</span>
          <button class="term-toggle-btn" id="term-btn">Expand</button>
        </div>
        <div id="terminal-content">
          <div id="term-output"></div>
        </div>
      </div>
      <script>
        function toggleTerminal() {
          const container = document.getElementById('python-terminal-container');
          const btn = document.getElementById('term-btn');
          if (container.classList.contains('collapsed')) {
            container.classList.remove('collapsed');
            container.classList.add('expanded');
            btn.innerText = 'Collapse';
          } else {
            container.classList.remove('expanded');
            container.classList.add('collapsed');
            btn.innerText = 'Expand';
          }
        }

        async function runPython() {
          const container = document.getElementById('python-terminal-container');
          const output = document.getElementById('term-output');
          container.classList.add('active');
          output.innerHTML = "[SYSTEM] Initializing Python Runtime...\\n";
          
          try {
            window.pyodide = await loadPyodide();
            output.innerHTML += "[SYSTEM] Runtime Synchronized.\\n\\n";
            
            window.pyodide.setStdout({
              batched: (str) => {
                output.innerHTML += \`<span style="color:#00ff88">>>> \${str}</span>\\n\`;
                const content = document.getElementById('terminal-content');
                content.scrollTop = content.scrollHeight;
              }
            });

            const pyCode = \`${safePyContent}\`;
            await window.pyodide.runPythonAsync(pyCode);
          } catch (e) {
            output.innerHTML += \`\\n<span style="color:#ff3333">[ERROR] \${e.message}</span>\\n\`;
          }
        }
        window.addEventListener('load', runPython);
      </script>
    ` : '';

    const bodyInjections = `
      <script>
        (function() {
          try {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const studioLogic = \`${safeJsContent}\`;
            if (studioLogic.trim()) eval(studioLogic);
          } catch(e) {
            console.error("Matrix Logic Error:", e);
          }
        })();
      </script>
      ${pythonEngine}
    `;

    if (content.includes('</head>')) {
      content = content.replace('</head>', `${headInjections}</head>`);
    } else {
      content = headInjections + content;
    }

    if (content.includes('</body>')) {
      content = content.replace('</body>', `${bodyInjections}</body>`);
    } else {
      content = content + bodyInjections;
    }

    return content;
  }, [project]);

  if (!isClient || isUserLoading || (isProjectLoading && !project)) {
    return (
      <div className="fixed inset-0 bg-[#020205] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-16 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
          <Loader2 className="w-14 h-14 text-primary animate-spin relative" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 animate-pulse">Booting Matrix Viewport</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#020205] flex flex-col overflow-hidden scanline-effect">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/80 backdrop-blur-3xl shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/studio/workspace/${projectId}`)} className="rounded-xl h-9 w-9 bg-white/5 text-primary hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-black shadow-2xl glow-accent">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-lg font-black tracking-tighter uppercase italic leading-none shimmer-text">Live Matrix View</h1>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-accent/60 mt-0.5">Application Matrix Sector</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Button 
             onClick={() => router.push(`/studio/workspace/${projectId}`)}
             className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-primary border border-primary/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2 group"
           >
             <Code2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Code Forge
           </Button>
           <Button 
             onClick={() => router.push(`/studio/architect/${projectId}`)}
             className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-accent border border-accent/20 px-5 text-[10px] font-black uppercase tracking-widest gap-2 group"
           >
             <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
             AI Architect
           </Button>
        </div>
      </header>

      <main className="flex-1 bg-white relative">
        <iframe 
          key={bundledCode}
          srcDoc={bundledCode} 
          className="w-full h-full border-0" 
          title="Matrix Output"
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
        />
      </main>
      
      <footer className="h-8 bg-card border-t border-white/5 flex items-center px-8 shrink-0 overflow-hidden">
        <div className="animate-marquee inline-block whitespace-nowrap">
          <span className="text-accent/30 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; LIVE MATRIX VIEWPORT ACTIVE &bull; BACKEND NODE LINKED &bull; PYTHON ENGINE 3.11 RUNNING &bull;
          </span>
          <span className="text-accent/30 font-black uppercase tracking-[0.6em] text-[8px] mx-16">
            &bull; LIVE MATRIX VIEWPORT ACTIVE &bull; BACKEND NODE LINKED &bull; PYTHON ENGINE 3.11 RUNNING &bull;
          </span>
        </div>
      </footer>
    </div>
  );
}
