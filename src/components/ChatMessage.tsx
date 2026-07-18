"use client"

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math'; // 👈 Added
import rehypeKatex from 'rehype-katex'; // 👈 Added
import { Download, Terminal, Shield, Sparkles, Cpu, Compass, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { jimskayChat } from '@/ai/flows/jimskay-chat-flow';
import { useToast } from '@/hooks/use-toast';

// 🧪 Crucial: Import the KaTeX CSS so the formulas are stylized beautifully!
// @ts-ignore
import 'katex/dist/katex.min.css';

// Embedded syntax block highlight
// Embedded syntax block highlight
function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = async () => {
    const textToCopy = String(children).replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (inline || !match) {
    return (
      <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-accent" {...props}>
        {children}
      </code>
    );
  }

  return (
    <pre className="p-4 my-4 bg-black/40 rounded-xl border border-white/5 text-xs font-mono leading-relaxed relative group whitespace-pre-wrap break-words overflow-x-hidden">
      {/* Copy utilities container */}
      <div className="absolute top-2 right-2 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-10">
        <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-widest hidden sm:inline">
          {match[1]}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all active:scale-95"
          title="Copy Code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  );
}

const markdownComponents = {
  code: CodeBlock,
  img: ({ src, alt }: any) => (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 max-w-md bg-black/20 shadow-lg">
      <img src={src} alt={alt || "Visual Payload"} className="object-cover w-full h-auto max-h-[300px]" loading="lazy" />
    </div>
  ),
  a: ({ href, children }: any) => {
    const isDirectImage = href && /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(href);
    if (isDirectImage) {
      return (
        <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 max-w-md bg-black/20 shadow-lg">
          <img src={href} alt="Sourced Payload" className="object-cover w-full h-auto max-h-[300px]" loading="lazy" />
        </div>
      );
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{children}</a>;
  }
};

interface ChatMessageProps {
  id?: string;
  chatId?: string;
  type?: string; 
  role: 'user' | 'model';
  text: string;
  pdfPayload?: { base64Data: string; filename: string } | null;
  imageUrl?: string | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ id, chatId, type, role, text, pdfPayload, imageUrl }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!pdfPayload?.base64Data) return;
    setIsDownloading(true);
    try {
      const binaryString = window.atob(pdfPayload.base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfPayload.filename || 'schedule.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleModeSwitch = async (mode: string) => {
    if (!db || !user || !chatId) return;
    setIsSwitching(mode);

    try {
      const userMsgRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
      await addDoc(userMsgRef, {
        role: 'user',
        content: `jimskay operation change to ${mode} mode`,
        timestamp: serverTimestamp(),
      });

      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
      await updateDoc(chatDocRef, {
        activeMode: mode,
        lastMessage: `Mode shifted: ${mode.toUpperCase()}`,
        updatedAt: serverTimestamp(),
      });

      const response = await jimskayChat({
        userId: user.uid,
        activeMode: mode,
        history: [{ role: 'user', content: `Confirming system migration to ${mode} mode.` }],
      });

      await addDoc(userMsgRef, {
        role: 'model',
        content: response.text || `System migrated. Mode configured to ${mode.toUpperCase()}. Ready to execute tasks.`,
        timestamp: serverTimestamp(),
      });

      toast({ title: "System Overclocked", description: `Active Node: ${mode.toUpperCase()}` });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Redirect Failed" });
    } finally {
      setIsSwitching(null);
    }
  };

  return (
    <div className={`flex flex-col space-y-2 max-w-[85%] ${role === 'user' ? 'self-end' : 'self-start'}`}>
      <div className={`p-4 rounded-2xl relative ${
        role === 'user' 
          ? 'bg-primary text-white rounded-tr-none' 
          : 'bg-card/30 backdrop-blur-md border border-white/5 rounded-tl-none text-white/90'
      }`}>
        {/* Render user-uploaded image inside the message bubble if present */}
        {imageUrl && (
          <div className="relative mb-3 rounded-xl overflow-hidden border border-white/10 max-w-sm bg-black/20 shadow-md animate-in fade-in duration-300">
            <img src={imageUrl} alt="Uploaded Segment" className="object-cover w-full h-auto max-h-[240px]" />
          </div>
        )}

        {/* 📐 Added remarkMath & rehypeKatex down here to compile the equations */}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {text || ""} 
        </ReactMarkdown>

        {/* PDF Downloader Section */}
        {pdfPayload && (
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="outline"
            className="mt-4 w-full flex items-center justify-center gap-2 py-5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all duration-300 group rounded-xl"
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">
              {isDownloading ? 'Compiling Payload...' : 'Download Document'}
            </span>
          </Button>
        )}

        {/* Interactive Mode Selection Matrix */}
        {type === 'mode-selector' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 border-t border-white/5 pt-4">
            <button
              onClick={() => handleModeSwitch('normal')}
              disabled={isSwitching !== null}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-left transition-all active:scale-95 group"
            >
              <Compass className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-all" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Normal</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Standard Protocol</div>
              </div>
            </button>

            <button
              onClick={() => handleModeSwitch('hacking')}
              disabled={isSwitching !== null}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-left transition-all active:scale-95 group"
            >
              <Shield className="w-5 h-5 text-red-500 group-hover:scale-110 transition-all" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-500">Hacking</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Cyber Shield & Audit</div>
              </div>
            </button>

            <button
              onClick={() => handleModeSwitch('creator')}
              disabled={isSwitching !== null}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/20 text-left transition-all active:scale-95 group"
            >
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-all" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Creator</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Creative Injector</div>
              </div>
            </button>

            <button
              onClick={() => handleModeSwitch('programming')}
              disabled={isSwitching !== null}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 text-left transition-all active:scale-95 group"
            >
              <Cpu className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-all" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Programming</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Syntax Engine</div>
              </div>
            </button>

            <button
              onClick={() => handleModeSwitch('religious')}
              disabled={isSwitching !== null}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-yellow-400/10 hover:border-yellow-400/20 text-left transition-all active:scale-95 group sm:col-span-2"
            >
              <Terminal className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-all animate-pulse" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Religious</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Spiritual Wisdom & Contemplation</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};