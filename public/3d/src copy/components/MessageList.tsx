"use client"

import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, Zap, Brain, Copy, Check, Volume2, Pause } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="relative group/code my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 w-full animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/[0.03] px-5 py-2.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">{match[1].toUpperCase()} NODE</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-2 text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-primary">
            {copied ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Extract Logic</>}
          </Button>
        </div>
        <pre className="!m-0 !p-6 overflow-x-auto custom-scrollbar font-mono text-[12px] leading-relaxed">
          <code className={className} {...props}>{children}</code>
        </pre>
      </div>
    );
  }
  return <code className={cn("bg-white/5 px-1.5 py-0.5 rounded text-primary font-bold", className)} {...props}>{children}</code>;
}

const markdownComponents = { code: CodeBlock };

export function MessageList({ chatId, isAiThinking }: { chatId: string | null; isAiThinking?: boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileQuery);
  const isCreator = profile?.isVerifiedCreator || profile?.username?.trim().toLowerCase() === 'jimoh jamihu adekilekun';

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !chatId) return null;
    return query(collection(db, 'users', user.uid, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [db, user, chatId]);
  const { data: messages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isAiThinking]);

  if (!chatId) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-black/40">
      <div className="relative mx-auto w-20 h-20 mb-8">
        <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[40px] animate-pulse-dragon" />
        <div className="relative w-full h-full rounded-[2rem] bg-card border border-white/10 flex items-center justify-center shadow-2xl glow-primary">
          <span className="text-5xl font-serif font-black gradient-text">J</span>
        </div>
      </div>
      <h3 className="text-4xl font-serif font-black text-white tracking-tighter italic shimmer-text">Jimskay Link Established</h3>
    </div>
  );

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-y-auto custom-scrollbar scroll-smooth">
      {messages?.map((msg, index) => {
        const isConsecutive = index > 0 && messages[index - 1].role === msg.role;
        const thoughtMatch = msg.content.match(/\[THOUGHTS\]([\s\S]*?)\[\/THOUGHTS\]/);
        const thoughts = thoughtMatch ? thoughtMatch[1].trim() : null;
        const mainContent = msg.content.replace(/\[THOUGHTS\][\s\S]*?\[\/THOUGHTS\]/, '').trim();

        return (
          <div key={msg.id} className={cn("flex flex-col w-full animate-in fade-in slide-in-from-bottom-8 duration-1000", isConsecutive ? "mt-0" : "mt-10")}>
            {!isConsecutive && (
              <div className={cn("flex items-center gap-3 px-4 mb-2", msg.role === 'user' ? 'flex-row-reverse' : '')}>
                <Avatar className="w-8 h-8 rounded-lg bg-card border border-white/20">
                  <AvatarFallback className="text-[8px] font-black">{msg.role === 'user' ? 'USR' : 'JIM'}</AvatarFallback>
                </Avatar>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{msg.role === 'user' ? 'Creator' : 'Neural Response'}</span>
              </div>
            )}
            <div className={cn("w-full relative px-4 md:px-5 py-10 border-y border-white/5 backdrop-blur-3xl shadow-2xl", msg.role === 'user' ? 'bg-primary/[0.03]' : 'bg-white/[0.01]')}>
              {thoughts && (
                <div className="mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4"><Brain className="w-4 h-4 text-primary animate-pulse" /><span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em]">Neural Process Log</span></div>
                  <p className="text-[12px] text-muted-foreground/60 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-4">{thoughts}</p>
                </div>
              )}
              <div className="markdown-content prose prose-invert prose-sm max-w-none font-medium w-full break-words">
                {/* Fixed: Passed the required context props to activate interactive templates */}
                <ChatMessage 
                  id={msg.id} 
                  chatId={chatId || undefined} 
                  type={msg.type} 
                  role={msg.role as 'user' | 'model'} 
                  text={mainContent} 
                  pdfPayload={msg.pdfPayload} 
                  imageUrl={msg.imageUrl}
                />
              </div>
              {msg.role === 'model' && (
                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-4">
                    {isCreator && <div className="flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/10 rounded-xl"><Zap className="w-3 h-3 text-accent" /><span className="text-[8px] font-black text-accent uppercase tracking-widest">Link: 100%</span></div>}
                    {msg.timestamp && <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">SYNC: {format(msg.timestamp.toDate(), 'HH:mm:ss')}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isAiThinking && (
        <div className="w-full relative px-4 md:px-5 py-10 border-y border-white/5 bg-white/[0.01] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-6"><Avatar className="w-8 h-8 rounded-lg bg-card border border-white/20"><AvatarFallback className="text-[8px] font-black">JIM</AvatarFallback></Avatar><span className="text-[8px] font-black uppercase tracking-widest text-white/30">Neural Synthesis</span></div>
          <div className="space-y-4"><div className="flex items-center gap-3"><div className="relative"><div className="absolute -inset-2 bg-primary/20 rounded-full blur-md animate-pulse" /><Brain className="w-5 h-5 text-primary animate-pulse" /></div><p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Digital Twin Cogitation...</p></div></div>
        </div>
      )}
      <div className="h-32" />
    </div>
  );
}