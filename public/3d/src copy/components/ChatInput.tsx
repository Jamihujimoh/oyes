"use client"

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, query, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { jimskayChat } from '@/ai/flows/jimskay-chat-flow';
import { Send, Loader2, Mic, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ChatInputProps {
  chatId: string | null;
  onChatCreated: (id: string) => void;
  onThinkingChange?: (isThinking: boolean) => void;
}

// 📸 Native client-side image compression (fully bypasses Next.js component namespace conflicts)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img'); // 👈 Safe browser element instantiation
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // Fallback to raw if canvas context fails
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG with 0.7 quality to stay well under Firestore's 1MB limit
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(event.target?.result as string); // Fallback to raw if loading image elements fails
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

export function ChatInput({ chatId, onChatCreated, onThinkingChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const profileQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileQuery);

  // Monitor active mode of current chat
  const chatQuery = useMemoFirebase(() => {
    if (!db || !user || !chatId) return null;
    return doc(db, 'users', user.uid, 'chats', chatId);
  }, [db, user, chatId]);
  const { data: chatData } = useDoc(chatQuery);
  const activeMode = chatData?.activeMode || 'normal';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast({ variant: 'destructive', title: 'Voice Link Failed' });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [toast]);

  const toggleListening = () => {
    if (profile?.isBanned) return;
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast({ title: "Speech Protocol Unavailable" });
        return;
      }
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to ensure it flies under Firestore rules and loads instantly
        const compressedBase64 = await compressImage(file);
        setSelectedImage(compressedBase64);
        toast({ title: "Optical Fragment Ready" });
      } catch (error) {
        console.error("Compression failed:", error);
        toast({ variant: "destructive", title: "Optical Read Error", description: "Could not process image." });
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || profile?.isBanned) return;

    const rawContent = input.trim();
    // 💡 Fallback: If sending an image with empty text, default to analyzing instructions
    const messageContent = rawContent === "" && selectedImage ? "Analyze this image" : rawContent;
    const imageToUpload = selectedImage;
    const cleanLowerCommand = messageContent.toLowerCase().trim();
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    if (onThinkingChange) onThinkingChange(true);

    let activeChatId = chatId;

    try {
      if (!activeChatId) {
        const chatRef = await addDoc(collection(db!, 'users', user!.uid, 'chats'), {
          userId: user!.uid,
          lastMessage: messageContent,
          activeMode: 'normal',
          updatedAt: serverTimestamp(),
        });
        activeChatId = chatRef.id;
        onChatCreated(activeChatId);
      }

      // 🛑 OPTION A: Intercept "jimskay operation list mode"
      if (cleanLowerCommand === 'jimskay operation list mode') {
        const userMsgRef = collection(db!, 'users', user!.uid, 'chats', activeChatId, 'messages');
        await addDoc(userMsgRef, {
          role: 'user',
          content: messageContent,
          timestamp: serverTimestamp(),
        });

        await addDoc(userMsgRef, {
          role: 'model',
          content: "Initiating Operation Mode matrix. Select an operating layer below to redirect my system nodes:",
          type: 'mode-selector',
          timestamp: serverTimestamp(),
        });

        setIsLoading(false);
        if (onThinkingChange) onThinkingChange(false);
        return;
      }

      // 🛑 OPTION B: Intercept "jimskay operation change to [name] mode"
      if (cleanLowerCommand.startsWith('jimskay operation change to ') && cleanLowerCommand.endsWith(' mode')) {
        const targetMode = cleanLowerCommand
          .replace('jimskay operation change to ', '')
          .replace(' mode', '')
          .trim();

        const validModes = ['normal', 'hacking', 'creator', 'programming', 'religious'];

        if (validModes.includes(targetMode)) {
          const userMsgRef = collection(db!, 'users', user!.uid, 'chats', activeChatId, 'messages');
          await addDoc(userMsgRef, {
            role: 'user',
            content: messageContent,
            timestamp: serverTimestamp(),
          });

          // Sync database
          const chatDocRef = doc(db!, 'users', user!.uid, 'chats', activeChatId);
          await updateDoc(chatDocRef, {
            activeMode: targetMode,
            lastMessage: `Mode shifted: ${targetMode.toUpperCase()}`,
            updatedAt: serverTimestamp(),
          });

          // Generate confirming response with target mode active
          const response = await jimskayChat({
            userId: user!.uid,
            activeMode: targetMode,
            history: [{ role: 'user', content: `Confirming system migration to ${targetMode} mode.` }],
            currentUser: { username: profile?.username }
          });

          await addDoc(userMsgRef, {
            role: 'model',
            content: response.text || `System migrated. Mode configured to ${targetMode.toUpperCase()}. Ready to execute tasks.`,
            timestamp: serverTimestamp(),
          });

          setIsLoading(false);
          if (onThinkingChange) onThinkingChange(false);
          return;
        }
      }

      // Standard user message routing
      const userMsgRef = collection(db!, 'users', user!.uid, 'chats', activeChatId, 'messages');
      addDocumentNonBlocking(userMsgRef, {
        role: 'user',
        content: messageContent,
        imageUrl: imageToUpload,
        timestamp: serverTimestamp(),
      });

      const chatDocRef = doc(db!, 'users', user!.uid, 'chats', activeChatId);
      updateDocumentNonBlocking(chatDocRef, {
        lastMessage: imageToUpload ? "Optical Analysis Protocol" : messageContent,
        updatedAt: serverTimestamp(),
      });

      const messagesQuery = query(
        collection(db!, 'users', user!.uid, 'chats', activeChatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(messagesQuery);
      
      let history = snapshot.docs
        .map(doc => ({
          role: (doc.data().role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: doc.data().content || "",
          imageUrl: doc.data().imageUrl || undefined
        }))
        .filter(m => m.content !== messageContent)
        .reverse();

      history.push({ 
        role: 'user', 
        content: messageContent,
        imageUrl: imageToUpload || undefined
      });

      const response = await jimskayChat({ 
        userId: user!.uid,
        imageUrl: imageToUpload || undefined,
        activeMode, 
        history,
        currentUser: {
          username: profile?.username,
          status: profile?.status,
          syncRate: profile?.syncRate,
          isVerifiedCreator: profile?.isVerifiedCreator || false,
          isBanned: profile?.isBanned || false
        }
      });

      if (response && response.text) {
        addDocumentNonBlocking(collection(db!, 'users', user!.uid, 'chats', activeChatId, 'messages'), {
          role: 'model',
          content: response.text.trim(),
          pdfPayload: response.pdfPayload || null,
          timestamp: serverTimestamp(),
        });
      }

    } catch (error: any) {
      console.error("Link Failure:", error);
      toast({ variant: "destructive", title: "Operation Error", description: "System synchronization failure." });
      setInput(rawContent); 
      setSelectedImage(imageToUpload);
    } finally {
      setIsLoading(false);
      if (onThinkingChange) onThinkingChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(48, Math.min(textareaRef.current.scrollHeight, 240))}px`;
    }
  }, [input]);

  if (profile?.isBanned) {
    return (
      <footer className="px-4 py-6 bg-destructive/10 border-t border-destructive/20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-destructive animate-pulse">
          TERMINAL LOCKOUT: YOU HAVE BEEN BANNED FROM THE GRID.
        </p>
      </footer>
    );
  }

  return (
    <footer className="px-4 py-6 bg-card/40 backdrop-blur-3xl border-t border-white/5 relative z-10 w-full shrink-0">
      <div className="max-w-4xl mx-auto space-y-4">
        {selectedImage && (
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10 w-fit animate-in zoom-in-95 duration-300">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-accent/20">
              {/* 📸 Fixed: Swapped Next.js <Image> with native browser <img> to support raw dynamic Base64 previews */}
              <img src={selectedImage} alt="Injection Preview" className="object-cover w-full h-full" />
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-accent uppercase tracking-widest">Optical Node Ready</span>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className={`flex-1 flex items-end glass-panel rounded-[2rem] border-white/10 focus-within:border-primary/50 px-5 py-2 transition-all min-h-[56px] shadow-2xl ${isListening || selectedImage ? 'glow-primary ring-1 ring-primary/30' : ''}`}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageSelect} 
            />
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = ""; 
                fileInputRef.current?.click();
              }} 
              className="h-10 w-10 mb-1.5 shrink-0 text-muted-foreground/40 hover:text-accent"
            >
              <Camera className="w-5 h-5" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening to protocol..." : `Command Jimskay (${activeMode.toUpperCase()})...`}
              className="flex-1 min-h-[48px] max-h-[240px] resize-none bg-transparent border-0 focus-visible:ring-0 text-[14px] font-medium py-3.5 text-white scrollbar-none leading-relaxed"
              rows={1}
            />

            <Button type="button" variant="ghost" size="icon" onClick={toggleListening} className={`h-10 w-10 mb-1.5 shrink-0 transition-all ${isListening ? 'text-primary animate-pulse' : 'text-muted-foreground/40 hover:text-primary'}`}>
              <Mic className="w-5 h-5" />
            </Button>
          </div>

          <Button onClick={() => handleSend()} disabled={(!input.trim() && !selectedImage) || isLoading} size="icon" className="rounded-[1.5rem] h-14 w-14 shrink-0 bg-primary text-white shadow-xl glow-primary">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
          </Button>
        </div>
      </div>
    </footer>
  );
}