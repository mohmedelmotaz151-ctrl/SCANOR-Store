import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy, setDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setIsEmailSubmitted(true);
    }
  }, [user]);

  useEffect(() => {
    if (isEmailSubmitted && email) {
      // 1. Listen to chat session
      const qChat = query(collection(db, "support_chats"), where("userEmail", "==", email));
      const unsubChat = onSnapshot(qChat, async (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const docId = snapshot.docs[0].id;
          setChatData({ id: docId, ...docData });

          // 2. Listen to messages for this chat
          const qMsgs = query(collection(db, "support_chats", docId, "messages"), orderBy("timestamp", "asc"));
          return onSnapshot(qMsgs, (msgSnap) => {
            setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (error) => handleFirestoreError(error, OperationType.LIST, `support_chats/${docId}/messages`));
        } else if (user?.email) {
          // Auto create chat session for logged in user if it doesn't exist
          try {
            await addDoc(collection(db, "support_chats"), {
              userEmail: email,
              status: "active",
              assignedTo: null,
              lastMessageAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Error creating chat session:", e);
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, "support_chats"));

      return () => unsubChat();
    }
  }, [isEmailSubmitted, email, user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || !chatData) return;

    const userText = message;
    setMessage("");
    setLoading(true);

    try {
      const chatRef = doc(db, "support_chats", chatData.id);
      const messagesRef = collection(db, "support_chats", chatData.id, "messages");

      // 1. Add user message
      await addDoc(messagesRef, {
        role: "user",
        text: userText,
        timestamp: serverTimestamp()
      });

      // Update last activity
      await updateDoc(chatRef, { lastMessageAt: serverTimestamp() });

      // 2. If AI mode, get AI response
      if (chatData?.status === "active") {
        try {
          const aiRes = await fetch("/api/support/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: userText, 
              history: messages.map((m: any) => ({ 
                role: m.role === 'user' ? 'user' : 'model', 
                parts: [{ text: m.text }] 
              })) 
            })
          });
          const aiData = await aiRes.json();
          
          if (aiData.text) {
            await addDoc(messagesRef, {
              role: "ai",
              text: aiData.text,
              timestamp: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("AI chat error:", e);
        }
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, `support_chats/${chatData.id}`);
    } finally {
      setLoading(false);
    }
  };

  const requestHuman = async () => {
    if (!chatData) return;
    setLoading(true);
    try {
      const chatRef = doc(db, "support_chats", chatData.id);
      await updateDoc(chatRef, { status: "waiting" });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `support_chats/${chatData.id}`);
    } finally {
      setLoading(false);
    }
  };

  const startAnonymousChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    try {
      const pkgsCollection = collection(db, "support_chats");
      const q = query(pkgsCollection, where("userEmail", "==", email));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        await addDoc(pkgsCollection, {
          userEmail: email,
          status: "active",
          assignedTo: null,
          lastMessageAt: serverTimestamp()
        });
      }
      setIsEmailSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] md:w-[400px] h-[580px] bg-neutral-900 border border-neutral-800 rounded-[2.8rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-neutral-800 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full bg-amber-500/5 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h4 className="font-bold text-white leading-tight">سكانور للدعم</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">
                      {chatData?.status === 'talking' ? `متصل مع ${chatData.assignedTo}` : chatData?.status === 'waiting' ? 'بانتظار العميل...' : 'مساعد ذكي'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-700 rounded-xl transition-colors relative z-10"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            {!isEmailSubmitted ? (
              <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-20 h-20 bg-neutral-800 rounded-3xl flex items-center justify-center mb-4">
                   <MessageSquare className="w-10 h-10 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">الدعم الفني المباشر</h3>
                  <p className="text-sm text-neutral-500">تحدث مباشرة مع محمد المعتز عبر واتساب لحل أي مشكلة أو استفسار</p>
                </div>
                <form onSubmit={startAnonymousChat} className="w-full space-y-4">
                  <input 
                    type="email" 
                    placeholder="بريدك الإلكتروني للمتابعة"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black text-center flex items-center justify-center gap-2 hover:bg-amber-400 transition-all"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'بدء المحادثة الكتابية'}
                  </button>
                </form>
                <div className="relative w-full py-2">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                   <div className="relative flex justify-center text-xs uppercase"><span className="bg-neutral-900 px-2 text-neutral-500 font-bold">أو</span></div>
                </div>
                <a 
                  href="https://wa.me/966552232752" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-center flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                >
                  <MessageSquare className="w-5 h-5" />
                  تحدث عبر واتساب
                </a>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-950/50">
                  {messages.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <Bot className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                      <p className="text-sm">كيف يمكنني مساعدتك اليوم؟</p>
                    </div>
                  )}
                  {messages.map((msg: any, i: number) => (
                    <div 
                      key={msg.id || i} 
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-amber-500 text-black font-medium rounded-tr-none' 
                          : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-end">
                      <div className="bg-neutral-800 p-3 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-4">
                  {chatData?.status === 'active' && (
                    <button 
                      onClick={requestHuman}
                      className="w-full py-2 text-[10px] uppercase font-black tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors border border-amber-500/10 rounded-lg"
                    >
                      التحدث مع موظف خدمة العملاء
                    </button>
                  )}
                  {chatData?.status === 'waiting' && (
                    <div className="text-center py-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <p className="text-[10px] text-amber-500 font-bold animate-pulse">جاري البحث عن موظف متاح...</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-neutral-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-1 focus:ring-amber-500"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button className="p-3 bg-amber-500 text-black rounded-2xl shadow-lg hover:bg-amber-400 transition-all">
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-amber-500 rounded-full shadow-[0_10px_40px_rgba(245,158,11,0.4)] flex items-center justify-center group"
      >
        {isOpen ? <X className="w-8 h-8 text-black" /> : <MessageSquare className="w-8 h-8 text-black group-hover:rotate-12 transition-transform" />}
      </motion.button>
    </div>
  );
}
