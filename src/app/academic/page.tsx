
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateMockExam } from '@/ai/flows/academic-tutor-flow';
import { generateNeuralAudit, type AuditOutput } from '@/ai/flows/strategic-auditor-flow';
import { 
  Brain, 
  ChevronRight, 
  Loader2, 
  Trophy, 
  History, 
  Zap, 
  GraduationCap,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  Menu,
  RotateCcw,
  Database,
  Sparkles,
  FileText,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: 'Σ' },
  { id: 'physics', name: 'Physics', icon: 'Ω' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
  { id: 'english', name: 'English Language', icon: 'Aa' },
  { id: 'islamic', name: 'Islamic Studies', icon: '☪' },
];

export default function JimskayAcademicPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [examData, setExamData] = useState<any[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [viewingPastSession, setViewingPastSession] = useState<any | null>(null);
  const [auditResult, setAuditResult] = useState<AuditOutput | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/auth');
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (examData && !showResults && timeLeft > 0 && !viewingPastSession) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && examData && !showResults && !viewingPastSession) {
      calculateResults();
    }
  }, [timeLeft, examData, showResults, viewingPastSession]);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'academic'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user]);

  const { data: history } = useCollection(historyQuery);

  const startExam = async (subjectName: string) => {
    setIsGenerating(true);
    setExamData(null);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setViewingPastSession(null);
    setAuditResult(null);
    setSelectedSubject(subjectName);
    
    try {
      const response = await generateMockExam({ subject: subjectName, difficulty: 'Advanced' });
      if (response && response.questions && response.questions.length > 0) {
        setExamData(response.questions);
        setTimeLeft(response.questions.length * 60); 
      } else {
        throw new Error("The system returned no questions. Please try again.");
      }
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Sync Failure",
        description: e.message || "Please try again."
      });
      setSelectedSubject(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (viewingPastSession) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (!examData) return;
    if (currentIndex < examData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (!viewingPastSession) {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    if (!examData || !user || !db) return;
    setShowResults(true);
    
    const correctCount = examData.reduce((acc, q, idx) => {
      return acc + (answers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'academic'), {
        subject: selectedSubject,
        score: correctCount,
        totalQuestions: examData.length,
        questions: examData.map((q, idx) => ({
          ...q,
          userAnswer: answers[idx] || null
        })),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Session Saved" });
    } catch (e) {
      console.error("Saving Error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!examData || isAuditing) return;
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const correctCount = examData.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0);
      const sessionHistory = [{
        subject: selectedSubject || 'General',
        score: correctCount,
        totalQuestions: examData.length,
        date: new Date().toLocaleDateString()
      }];
      
      const result = await generateNeuralAudit({ history: sessionHistory, daysToMission: 365 });
      setAuditResult(result);
      toast({ title: "Study Plan Ready" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Advice Link Failed', description: e.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const reviewSession = (session: any) => {
    setViewingPastSession(session);
    setExamData(session.questions);
    setShowResults(true);
    setSelectedSubject(session.subject);
    setAuditResult(null);
    
    const sessionAnswers: Record<number, string> = {};
    session.questions.forEach((q: any, idx: number) => {
      sessionAnswers[idx] = q.userAnswer;
    });
    setAnswers(sessionAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-[#020205] overflow-hidden fixed inset-0">
      <div 
        className={`fixed inset-0 z-[60] bg-black/90 transition-opacity duration-500 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 z-[70] h-full w-60 bg-[#020205] border-r border-white/5 transition-transform duration-500 transform md:relative md:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentChatId={null} 
          onSelectChat={(id) => router.push(id ? `/chat?id=${id}` : '/chat')} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      <main className="flex-1 h-[100dvh] bg-[#05050a] relative flex flex-col overflow-hidden">
        <div className="shrink-0 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-b from-black to-transparent z-50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white rounded-xl bg-white/5 h-10 w-10" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard')}
              className="rounded-lg h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-black text-white tracking-tighter uppercase italic leading-none">
                Study<span className="text-primary">Lab</span>
              </h1>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/60 mt-1 flex items-center gap-1">
                <Sparkles className="w-2 h-2 animate-pulse" />
                Mastery Phase
              </p>
            </div>
          </div>
          {examData && !showResults && !viewingPastSession && (
            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black text-white tabular-nums tracking-widest">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">
          {!examData && !showResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                  <h2 className="font-serif text-md font-black text-white tracking-tighter uppercase italic">Practice Session</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {SUBJECTS.map((subject) => (
                    <Card 
                      key={subject.id} 
                      className="glass-panel border-none rounded-2xl p-6 hover:bg-white/[0.06] transition-all cursor-pointer group text-center relative overflow-hidden h-32 flex flex-col items-center justify-center shadow-xl"
                      onClick={() => !isGenerating && startExam(subject.name)}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-all duration-700">{subject.icon}</div>
                      <h3 className="text-[8px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{subject.name}</h3>
                      {isGenerating && selectedSubject === subject.name && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-[6px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing...</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-accent" />
                  <h2 className="font-serif text-md font-black text-white tracking-tighter uppercase italic">Past Work</h2>
                </div>
                <div className="space-y-3">
                  {history?.map((session) => (
                    <Card 
                      key={session.id} 
                      onClick={() => reviewSession(session)}
                      className="glass-panel border-none rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer group flex items-center justify-between shadow-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{session.subject}</p>
                        <p className="text-[6px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] mt-1">
                          {format(session.createdAt?.toDate() || new Date(), 'MMM d')} • {session.totalQuestions || 40} Qs
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs font-black text-primary">{Math.round((session.score / (session.totalQuestions || 1)) * 100)}%</p>
                      </div>
                    </Card>
                  ))}
                  {!history?.length && (
                    <div className="py-12 text-center glass-panel rounded-2xl border-dashed border-white/5 border-2 bg-transparent opacity-30">
                      <History className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
                      <p className="text-[7px] font-black uppercase tracking-[0.3em]">Empty.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : showResults ? (
            <div className="max-w-2xl mx-auto w-full space-y-8 pb-10">
              <Card className="glass-panel border-none rounded-[2rem] p-8 text-center relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-black text-white tracking-tighter mb-1 italic">
                  {viewingPastSession ? 'Review' : 'Complete'}
                </h2>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6">
                  {selectedSubject} Session
                </p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                      {examData?.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0)}<span className="text-muted-foreground/20 text-lg">/{examData?.length || 40}</span>
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Raw Score</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-primary tabular-nums tracking-tighter">
                      {Math.round((examData?.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0) || 0) / (examData?.length || 40) * 100)}%
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Accuracy</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleGetAdvice}
                    disabled={isAuditing}
                    className="rounded-xl h-11 bg-accent text-black font-black hover:bg-accent/80 text-[8px] uppercase tracking-widest px-8 shadow-xl glow-accent border-none"
                  >
                    {isAuditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Get Advice
                  </Button>
                  <Button 
                    onClick={() => { setExamData(null); setShowResults(false); setSelectedSubject(null); setViewingPastSession(null); setAuditResult(null); }}
                    className="rounded-xl h-11 bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 text-[8px] uppercase tracking-widest px-8"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Menu
                  </Button>
                </div>
              </Card>

              {auditResult && (
                <Card className="glass-panel border-accent/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Target className="w-24 h-24 text-accent" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-black text-white tracking-tighter uppercase italic">Study Protocol</h3>
                      <p className="text-[7px] font-black text-accent uppercase tracking-widest">Mastery Advisor Node</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 opacity-40">Assessment:</p>
                      <p className="text-[12px] text-white/90 leading-relaxed font-medium italic">{auditResult.assessment}</p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">24-Hour Intensive Protocol:</p>
                      <div className="text-[11px] text-muted-foreground/90 leading-relaxed font-bold uppercase tracking-tight">
                         {auditResult.remediationPlan}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {examData?.map((q, idx) => (
                  <Card key={idx} className="glass-panel border-white/5 rounded-2xl p-6 bg-white/[0.01]">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${answers[idx] === q.correctAnswer ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {answers[idx] === q.correctAnswer ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="space-y-3 flex-1 overflow-hidden">
                        <div className="markdown-content text-sm text-white/90 leading-relaxed font-bold">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.question}
                          </ReactMarkdown>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[7px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-3 py-1 rounded border border-green-500/20">Target: {q.correctAnswer}</span>
                          {answers[idx] !== q.correctAnswer && (
                            <span className="text-[7px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 px-3 py-1 rounded border border-red-600/20">Yours: {answers[idx] || 'Empty'}</span>
                          )}
                        </div>
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                          <p className="text-[7px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Explanation:</p>
                          <div className="markdown-content text-[11px] text-muted-foreground/80 leading-relaxed italic">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {q.explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-[9px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary" />
                  {selectedSubject} Session
                </h2>
                <span className="text-[11px] font-black text-white tabular-nums tracking-tighter italic">Q {currentIndex + 1}<span className="text-muted-foreground/20">/{examData?.length || 40}</span></span>
              </div>

              <Card className="glass-panel border-white/5 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6 bg-white/[0.01]">
                <div ref={scrollRef} className="space-y-6 flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] pr-2">
                  <div className="markdown-content text-lg md:text-xl font-bold text-white tracking-tight leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {examData?.[currentIndex]?.question}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {examData?.[currentIndex]?.options.map((option: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswer(option)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-4 relative overflow-hidden group/opt ${
                          answers[currentIndex] === option 
                            ? 'bg-primary/10 border-primary text-white shadow-xl' 
                            : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 ${
                          answers[currentIndex] === option ? 'bg-primary text-black' : 'bg-white/5'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="markdown-content text-[12px] font-bold tracking-tight flex-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {option}
                          </ReactMarkdown>
                        </div>
                        {answers[currentIndex] === option && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <Button 
                    type="button"
                    onClick={handleNext}
                    disabled={!answers[currentIndex] && !viewingPastSession}
                    className="cyber-button rounded-xl h-11 bg-primary text-black font-black shadow-xl glow-primary text-[9px] uppercase tracking-[0.2em] px-10 border-none group"
                  >
                    {currentIndex === (examData?.length || 40) - 1 ? 'Finish' : 'Next Question'}
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-card/50 backdrop-blur-3xl h-8 flex items-center overflow-hidden border-t border-white/10 z-[100]">
          <div className="animate-marquee inline-block whitespace-nowrap">
            <span className="text-primary/30 font-black uppercase tracking-[0.5em] text-[8px] mx-12">
              &bull; STUDY LAB &bull; PRACTICE ACTIVE &bull; 100% CURRICULUM SYNC &bull; ADVANCED MASTERY &bull;
            </span>
            <span className="text-primary/30 font-black uppercase tracking-[0.5em] text-[8px] mx-12">
              &bull; STUDY LAB &bull; PRACTICE ACTIVE &bull; 100% CURRICULUM SYNC &bull; ADVANCED MASTERY &bull;
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
