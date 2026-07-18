"use client"

import { useState } from 'react';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, writeBatch, getDocs, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MessageSquare, 
  LogOut, 
  Trash2, 
  X, 
  Clock, 
  Loader2, 
  Zap, 
  Sparkles, 
  LayoutDashboard,
  Fingerprint,
  Lock,
  History
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';

interface ChatSession {
  id: string;
  lastMessage: string;
  updatedAt: any;
}

export function Sidebar({ currentChatId, onSelectChat, onClose }: { 
  currentChatId: string | null; 
  onSelectChat: (id: string | null) => void; 
  onClose: () => void;
}) {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDeleting, setIsDeleting] = useState(false);

  const chatsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('updatedAt', 'desc'),
      limit(15)
    );
  }, [db, user?.uid]);

  const { data: chats, isLoading: isChatsLoading } = useCollection<ChatSession>(chatsQuery);

  const handleDeleteHistory = async () => {
    if (!user || !db || isDeleting) return;
    setIsDeleting(true);
    try {
      const chatsRef = collection(db, 'users', user.uid, 'chats');
      const snapshot = await getDocs(chatsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      onSelectChat(null);
      toast({ title: "History Deleted", description: "All past chats have been removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete history." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDecommission = (id: string) => {
    if (!user || !db) return;
    const docRef = doc(db, 'users', user.uid, 'chats', id);
    deleteDocumentNonBlocking(docRef);
    if (currentChatId === id) onSelectChat(null);
    toast({ title: "Chat Deleted" });
  };

  return (
    <aside className="w-full h-full flex flex-col glass-panel border-none shadow-2xl bg-[#020205]/98 transition-all duration-500">
      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all hover:scale-110 hover:rotate-6">
            <Zap className="w-5 h-5 text-black animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-black text-white tracking-tighter leading-none italic uppercase">Menu</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40 mt-1.5 animate-pulse">Online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full text-white/30 h-8 w-8 hover:bg-white/10" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-5 py-6 space-y-3 shrink-0 border-b border-white/5 bg-white/[0.01]">
        <Button 
          onClick={() => {
            onSelectChat(null);
            onClose();
          }} 
          className="w-full justify-start gap-4 bg-primary text-black hover:bg-primary/80 rounded-[1.25rem] h-12 font-black shadow-lg border-none group text-[11px] uppercase tracking-widest glow-primary transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>New Chat</span>
          <Sparkles className="w-3.5 h-3.5 ml-auto text-black/40 animate-pulse" />
        </Button>

        <div className="space-y-1.5 mt-4">
          <SidebarNavButton 
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
            active={pathname === '/dashboard'}
            onClick={() => { router.push('/dashboard'); onClose(); }}
            color="text-primary"
          />
          <SidebarNavButton 
            icon={<History className="w-4 h-4" />}
            label="Past Chats"
            active={pathname === '/history'}
            onClick={() => { router.push('/history'); onClose(); }}
            color="text-primary"
          />
          <SidebarNavButton 
            icon={<Lock className="w-4 h-4" />}
            label="Saved Items"
            active={pathname === '/vault'}
            onClick={() => { router.push('/vault'); onClose(); }}
            color="text-primary"
          />
          <SidebarNavButton 
            icon={<Fingerprint className="w-4 h-4" />}
            label="My Profile"
            active={pathname === '/identity'}
            onClick={() => { router.push('/identity'); onClose(); }}
            color="text-accent"
          />
        </div>
      </div>

      <div className="px-6 py-4 shrink-0 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">Recent Chats</p>
        <div className="h-px flex-1 bg-white/5 mx-3"></div>
      </div>

      <ScrollArea className="flex-1 px-4 min-h-0">
        <div className="space-y-2 pb-6">
          {isChatsLoading ? (
            <div className="py-10 text-center animate-in fade-in duration-700">
              <Loader2 className="w-5 h-5 animate-spin text-primary/40 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mt-2">Loading...</p>
            </div>
          ) : chats && chats.length > 0 ? (
            chats.map((chat, idx) => (
              <div key={chat.id} className="relative group animate-in fade-in slide-in-from-left-2 duration-500" style={{ transitionDelay: `${idx * 50}ms` }}>
                <button
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-[1.25rem] transition-all relative border border-transparent group/btn ${
                    currentChatId === chat.id 
                      ? 'bg-white/[0.06] border-white/10 text-primary shadow-xl scale-[1.01]' 
                      : 'hover:bg-white/[0.03] text-muted-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${currentChatId === chat.id ? 'bg-primary/20 scale-110 shadow-[0_0_15px_rgba(255,215,0,0.3)] rotate-6' : 'bg-white/5 group-hover/btn:rotate-3'}`}>
                      <MessageSquare className={`w-3.5 h-3.5 ${currentChatId === chat.id ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate leading-none mb-1.5 tracking-tight group-hover/btn:text-white transition-colors">
                        {chat.lastMessage || 'Continuing Chat...'}
                      </p>
                      {chat.updatedAt && (
                        <div className="flex items-center gap-1.5 opacity-30">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {formatDistanceToNow(chat.updatedAt.toDate(), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20" onClick={(e) => e.stopPropagation()}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-panel border-none rounded-[2rem] bg-[#020205]/95 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-xl font-black text-white tracking-tighter uppercase italic shimmer-text">Delete Chat?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 leading-relaxed mt-3">
                          Permanently remove this chat history? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-xl bg-white/5 border-white/10 text-white font-black text-[10px] uppercase tracking-widest px-6">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecommission(chat.id);
                          }}
                          className="h-10 rounded-xl bg-destructive text-white font-black text-[10px] uppercase tracking-widest border-none glow-dragon px-6"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center opacity-20 animate-in zoom-in-95 duration-1000">
              <History className="w-10 h-10 mx-auto mb-3 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">Empty</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.01] space-y-2 shrink-0 pb-10">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              disabled={isDeleting}
              className="w-full justify-start gap-4 h-10 rounded-[1rem] text-muted-foreground/50 hover:text-destructive font-black hover:bg-destructive/10 transition-all text-[11px] uppercase tracking-widest border-none group"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete All History</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-panel border-none rounded-[2.5rem] bg-[#020205]/98">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic animate-glitch text-red-500">WARNING</AlertDialogTitle>
              <AlertDialogDescription className="text-[11px] font-bold uppercase tracking-[0.4em] text-red-500/60 leading-relaxed mt-4">
                This will delete every single chat history you have. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8">
              <AlertDialogCancel className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-black text-[11px] uppercase tracking-widest px-8">No, Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteHistory}
                className="rounded-xl h-12 bg-destructive text-white font-black text-[11px] uppercase tracking-widest border-none glow-dragon px-8"
              >
                Yes, Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button 
          variant="ghost" 
          onClick={() => {
            auth?.signOut();
            router.push('/');
          }}
          className="w-full justify-start gap-4 h-10 rounded-[1rem] text-white font-black bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-[11px] uppercase tracking-widest group"
        >
          <LogOut className="w-4 h-4 text-accent transition-all group-hover:translate-x-1" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}

function SidebarNavButton({ icon, label, active, onClick, color }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, color: string }) {
  return (
    <Button 
      variant="ghost"
      onClick={onClick} 
      className={`w-full justify-start gap-4 rounded-[1rem] h-10 font-bold text-[12px] uppercase tracking-[0.1em] transition-all border-none group relative overflow-hidden ${
        active ? 'bg-white/10 ' + color : 'text-muted-foreground hover:bg-white/5'
      }`}
    >
      <div className={`transition-all duration-500 ${active ? color + ' scale-110' : 'text-muted-foreground/40 group-hover:' + color + ' group-hover:scale-110 group-hover:rotate-6'}`}>
        {icon}
      </div>
      <span className="relative z-10">{label}</span>
      {active && <div className={`absolute left-0 w-0.5 h-1/2 rounded-full ${color === 'text-primary' ? 'bg-primary' : 'bg-accent'}`}></div>}
    </Button>
  );
}