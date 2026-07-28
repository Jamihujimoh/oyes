
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatHeader } from '@/components/ChatHeader';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { webSearch } from '@/ai/flows/web-search-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export function ChatInterface({ onBackToLanding }: { onBackToLanding: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(searchParams.get('id'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Sync state with URL parameters
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl !== currentChatId) {
      setCurrentChatId(idFromUrl);
    }
  }, [searchParams, currentChatId]);

  const handleWebSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching || !user || !db) return;

    setIsSearching(true);
    setIsAiThinking(true);
    const originalQuery = searchQuery.trim();
    let activeChatId = currentChatId;

    try {
      if (!activeChatId) {
        const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          userId: user.uid,
          lastMessage: `Search: ${originalQuery}`,
          updatedAt: serverTimestamp(),
        });
        activeChatId = chatRef.id;
        router.push(`/chat?id=${activeChatId}`);
      }

      await addDoc(collection(db, 'users', user.uid, 'chats', activeChatId, 'messages'), {
        role: 'user',
        content: `🔍 Initiating Global Search: **${originalQuery}**`,
        timestamp: serverTimestamp(),
      });

      setSearchQuery('');
      const response = await webSearch({ query: originalQuery });

      await addDoc(collection(db, 'users', user.uid, 'chats', activeChatId, 'messages'), {
        role: 'model',
        content: response.results,
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid, 'chats', activeChatId), {
        lastMessage: `Search: ${originalQuery}`,
        updatedAt: serverTimestamp(),
      });

      setShowSearch(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Network Protocol Severed',
        description: 'Global intelligence link failed.',
      });
    } finally {
      setIsSearching(false);
      setIsAiThinking(false);
    }
  };

  const handleSelectChat = (id: string | null) => {
    if (id) {
      router.push(`/chat?id=${id}`);
    } else {
      setCurrentChatId(null);
      router.push('/chat');
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] overflow-hidden fixed inset-0">
      <div 
        className={`fixed inset-0 z-[60] bg-black/80 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 z-[70] h-full w-64 bg-[#020205] border-r border-white/5 transition-transform duration-300 transform md:relative md:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentChatId={currentChatId} 
          onSelectChat={handleSelectChat} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#05050a] relative h-[100dvh] overflow-hidden">
        <ChatHeader 
          onToggleSidebar={() => setIsSidebarOpen(true)} 
          onBack={onBackToLanding}
          onToggleSearch={() => setShowSearch(!showSearch)}
          isSearchVisible={showSearch}
          currentChatId={currentChatId}
        />
        
        {showSearch && (
          <div className="px-6 py-3 glass-panel border-b border-white/5 shrink-0 z-40">
            <form onSubmit={handleWebSearch} className="max-w-3xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input 
                  placeholder="Query global network..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-lg bg-white/5 border-white/10 h-9 text-[11px] font-bold text-white focus-visible:ring-accent/30"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching || !searchQuery.trim()}
                className="rounded-lg px-4 h-9 bg-accent text-black font-black uppercase tracking-widest text-[8px] border-none"
              >
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Access"}
              </Button>
            </form>
          </div>
        )}

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <MessageList chatId={currentChatId} isAiThinking={isAiThinking} />
        </div>
        
        <div className="shrink-0 bg-[#020205] border-t border-white/5">
          <ChatInput 
            chatId={currentChatId} 
            onChatCreated={(id) => router.push(`/chat?id=${id}`)} 
            onThinkingChange={setIsAiThinking}
          />
        </div>
      </div>
    </div>
  );
}
