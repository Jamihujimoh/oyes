"use client"

import { useState } from 'react';
import { Menu, ChevronLeft, Globe, MoreVertical, Trash2, FileText, Loader2, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function ChatHeader({ onToggleSidebar, onBack, onToggleSearch, isSearchVisible, currentChatId }: {
  onToggleSidebar: () => void;
  onBack: () => void;
  onToggleSearch: () => void;
  isSearchVisible: boolean;
  currentChatId: string | null;
}) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearMessages = async () => {
    if (!user || !db || !currentChatId || isClearing) return;
    
    const confirmed = window.confirm("Clear conversation history?");
    if (!confirmed) return;

    setIsClearing(true);
    try {
      const messagesRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'messages');
      const snap = await getDocs(messagesRef);
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "Memory Wiped" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportChat = async () => {
    if (!user || !db || !currentChatId) {
       toast({ title: "No active session" });
       return;
    }
    try {
      const messagesRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'messages');
      const snap = await getDocs(messagesRef);
      const text = snap.docs.map(doc => {
        const data = doc.data();
        const role = data.role === 'user' ? 'USER' : 'JIMSKAY';
        return `[${data.timestamp?.toDate()?.toLocaleString() || 'N/A'}] ${role}:\n${data.content}`;
      }).join('\n\n---\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${currentChatId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Transcript Exported" });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Failed" });
    }
  };

  return (
    <header className="flex items-center justify-between px-6 h-16 glass-panel border-0 border-b border-white/5 sticky top-0 z-[45]">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={onToggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="hidden md:flex rounded-lg h-8 w-8 hover:bg-white/5 border border-white/10 text-white" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-serif font-black text-lg glow-primary">J</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#020205] glow-accent animate-pulse" />
          </div>
          <div className="hidden xs:block">
            <h2 className="font-serif text-sm font-black leading-none tracking-tighter text-white flex items-center gap-1.5">
              Digital Jimoh
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              <p className="text-[8px] uppercase tracking-[0.3em] font-black text-primary/60">Academic Mastery Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center px-3 py-1 bg-primary/5 border border-primary/10 rounded-full gap-2 mr-2">
          <Activity className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Link Operational</span>
        </div>

        <Button 
          variant={isSearchVisible ? "secondary" : "ghost"} 
          size="icon" 
          onClick={onToggleSearch}
          className={`rounded-full h-8 w-8 ${isSearchVisible ? 'bg-primary/20 text-primary' : 'text-white/40 hover:bg-white/5'}`}
        >
          <Globe className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-white/40 hover:bg-white/5">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-panel rounded-xl p-1.5 border-white/5 shadow-2xl z-[100]">
            <DropdownMenuItem onClick={handleExportChat} className="rounded-lg py-2.5 cursor-pointer font-bold gap-2 text-white text-[10px] uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5 text-accent" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-white/5" />
            <DropdownMenuItem onClick={handleClearMessages} disabled={isClearing} className="rounded-lg py-2.5 text-destructive font-bold gap-2 cursor-pointer text-[10px] uppercase tracking-widest">
              {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Wipe Memory
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
