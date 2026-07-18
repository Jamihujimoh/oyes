"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Zap, ArrowLeft, Loader2, Save, Award, Fingerprint, Cpu, Camera, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JimskayIdentityPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const userDocQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userDocQuery);
  const isCreator = profile?.isVerifiedCreator || profile?.username?.trim().toLowerCase() === 'jimoh jamihu adekilekun';
  const syncRate = isCreator ? 1.0 : 0.50;

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/auth');
    if (profile) {
      setBio(profile.bio || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatarUrl || user?.photoURL || '');
    }
  }, [user, isUserLoading, router, profile]);

  const handleSave = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        bio, username, avatarUrl, updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: "Identity Passport Synced" });
    } catch (e) {
      toast({ variant: "destructive", title: "Link Failure" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] overflow-hidden fixed inset-0 scanline-effect">
      <div className={`fixed top-0 left-0 z-[70] h-full w-64 bg-[#020205] border-r border-white/5 transition-transform duration-300 transform md:relative md:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentChatId={null} onSelectChat={(id) => router.push(id ? `/chat?id=${id}` : '/chat')} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#05050a] p-4 md:p-8 flex flex-col gap-8 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-lg bg-white/5 h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-black shadow-2xl glow-accent"><Fingerprint className="w-6 h-6" /></div>
            <div><h1 className="font-serif text-2xl font-black text-white tracking-tighter uppercase italic">IdentityHub</h1><p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mt-1">Creator Protocol</p></div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="cyber-button rounded-xl h-12 bg-accent text-black font-black uppercase px-8 border-none shadow-2xl">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Commit Changes</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu className="w-32 h-32 text-white" /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAvatarUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                    <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-accent/20"><AvatarImage src={avatarUrl} /><AvatarFallback className="bg-white/5 text-accent font-serif text-4xl font-black">{username?.[0] || 'J'}</AvatarFallback></Avatar>
                    <div className="absolute bottom-0 right-0 p-2 bg-accent rounded-full text-black"><Camera className="w-4 h-4" /></div>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-white tracking-tighter flex items-center justify-center md:justify-start gap-3">{username || 'Unidentified'}<ShieldCheck className="w-6 h-6 text-accent" /></h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground/60"><Mail className="w-3.5 h-3.5" /><p className="text-[10px] font-black uppercase tracking-widest">{user?.email}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2"><label className="text-[8px] font-black uppercase text-muted-foreground/60">Handle</label><Input value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-xl h-12 bg-white/5 border-white/10" /></div>
                  <div className="space-y-2"><label className="text-[8px] font-black uppercase text-muted-foreground/60">Digital Coordinates (Avatar URL)</label><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="rounded-xl h-12 bg-white/5 border-white/10" /></div>
                </div>
                <div className="space-y-2"><label className="text-[8px] font-black uppercase text-muted-foreground/60">Mission Biography</label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl min-h-[120px] bg-white/5 border-white/10" /></div>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="glass-panel border-white/5 rounded-[2.5rem] p-8 text-center bg-accent/[0.02] shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 border border-accent/20"><Award className="w-8 h-8 text-accent" /></div>
              <h3 className="font-serif text-2xl font-black text-white italic">Master Sync</h3>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-8">Overall Creator Integrity</p>
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full rotate-[-90deg]"><circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" /><circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 * (1 - syncRate)} className="text-accent" /></svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-white animate-pulse">{Math.round(syncRate * 100)}%</span></div>
              </div>
              <p className="text-[9px] font-medium text-muted-foreground/60 italic px-4">{isCreator ? '"Your jimskay link with the core is absolute."' : '"Access restricted to normal node parameters."'}</p>
            </Card>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-card/30 backdrop-blur-md h-7 border-t border-white/5 z-[100] flex items-center overflow-hidden"><div className="animate-marquee inline-block whitespace-nowrap"><span className="text-accent/20 font-black uppercase tracking-[0.5em] text-[7px] mx-8">&bull; Identity Protocol Active &bull; Sync Rate: {Math.round(syncRate * 100)}% &bull; Level 1 Auth Synced &bull;</span><span className="text-accent/20 font-black uppercase tracking-[0.5em] text-[7px] mx-8">&bull; Identity Protocol Active &bull; Sync Rate: {Math.round(syncRate * 100)}% &bull; Level 1 Auth Synced &bull;</span></div></div>
    </div>
  );
}
