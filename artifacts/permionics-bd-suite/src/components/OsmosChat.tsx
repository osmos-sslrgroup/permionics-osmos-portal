import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, ExternalLink } from "lucide-react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import botAvatar from "@assets/osmos_logo_blue_transparent.png";
import { AnimatePresence, motion } from "framer-motion";

// ── Minimal inline markdown renderer ──────────────────────────────────────────
function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");

  function parseInline(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
    let last = 0; let match; let k = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      if (match[1]) parts.push(<strong key={k++} className="font-semibold">{match[1]}</strong>);
      else if (match[2]) parts.push(<em key={k++}>{match[2]}</em>);
      else if (match[3]) parts.push(<code key={k++} className="bg-white/10 px-1 rounded text-xs font-mono">{match[3]}</code>);
      last = regex.lastIndex;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  }

  const els: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[*-]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[*-]\s+/.test(lines[i])) {
        items.push(<li key={i} className="ml-3 list-disc">{parseInline(lines[i].replace(/^[*-]\s+/, ""))}</li>);
        i++;
      }
      els.push(<ul key={`u${i}`} className="my-1 space-y-0.5 text-[13px]">{items}</ul>);
      continue;
    }
    if (line.trim() === "") { els.push(<div key={i} className="h-1.5" />); i++; continue; }
    els.push(<p key={i} className="text-[13px] leading-relaxed">{parseInline(line)}</p>);
    i++;
  }
  return <div className="space-y-0.5">{els}</div>;
}

// ── Message type ─────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant"; content: string; }

// ── OsmosChat floating component ──────────────────────────────────────────────
export function OsmosChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = localStorage.getItem("osmos_chat_widget_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [input, setInput] = useState("");
  const sendChat = useSendChatMessage();
  const { toast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("osmos_chat_widget_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Msg = { role: "user", content: text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");

    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
    sendChat.mutate({ data: { message: text, history: historyPayload } }, {
      onSuccess: (res: any) => {
        setMessages([...updated, { role: "assistant", content: res.answer }]);
      },
      onError: (err: any) => {
        toast({ title: "OSMOS Error", description: err?.message || "Failed to get response.", variant: "destructive" });
      }
    });
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        id="osmos-chat-trigger"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 print-hide rounded-full shadow-2xl"
        style={{
          background: open ? "hsl(222 47% 9%)" : "linear-gradient(135deg, hsl(var(--primary)), hsl(222 71% 17%))",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        title="OSMOS AI Assistant"
        animate={open ? {} : {
          boxShadow: ["0px 0px 0px 0px rgba(37, 99, 235, 0.4)", "0px 0px 0px 15px rgba(37, 99, 235, 0)"]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white"
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.img
              key="avatar"
              src={botAvatar}
              alt="OSMOS"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 object-contain drop-shadow-md"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-28 right-6 z-40 flex flex-col rounded-2xl overflow-hidden print-hide glass"
            style={{
              width: 380,
              height: 540,
              boxShadow: "var(--shadow-2xl)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8))",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="relative">
                <img src={botAvatar} alt="OSMOS" className="w-9 h-9 object-contain" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[hsl(222_47%_9%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">OSMOS</p>
                <p className="text-[11px] text-white/60">Intelligence Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear this conversation?")) {
                        setMessages([]);
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Clear conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
                <Link href="~/assistant">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Open full assistant"
                    onClick={() => setOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3 osmos-scrollbar"
              style={{ background: "rgba(15, 23, 42, 0.4)" }}
            >
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <img src={botAvatar} alt="OSMOS" className="w-20 h-20 object-contain relative z-10 osmos-blob drop-shadow-xl" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Hi, I'm OSMOS</p>
                    <p className="text-white/50 text-xs mt-1 leading-relaxed">Ask me anything about Permionics' case studies, technical capabilities, or project insights.</p>
                  </div>
                  <div className="grid gap-2 w-full mt-2">
                    {[
                      "Summarize our CETP capabilities",
                      "What was the Nandesari recovery rate?",
                      "List all pharmaceutical projects",
                    ].map((p, i) => (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        key={p}
                        onClick={() => handleSend(p)}
                        className="text-left text-xs px-4 py-2.5 rounded-xl text-white/70 hover:text-white transition-all hover:bg-white/10"
                        style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages.map((m, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={i} 
                    className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {m.role === "assistant" && (
                      <img src={botAvatar} alt="OSMOS" className="w-8 h-8 object-contain flex-shrink-0 mt-1" />
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-white ${
                        m.role === "user"
                          ? "rounded-tr-sm bg-primary"
                          : "rounded-tl-sm backdrop-blur-md"
                      }`}
                      style={m.role === "assistant" ? {
                        background: "rgba(30, 41, 59, 0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      } : {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(217 91% 55%))",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {m.role === "assistant" ? (
                        <MiniMarkdown text={m.content} />
                      ) : (
                        <p className="text-[13px] leading-relaxed">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {sendChat.isPending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <img src={botAvatar} alt="OSMOS" className="w-8 h-8 object-contain flex-shrink-0 mt-1" />
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 backdrop-blur-md"
                    style={{ background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div
              className="flex-shrink-0 p-3 bg-slate-900/90 backdrop-blur-xl"
              style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all focus-within:ring-1 focus-within:ring-primary/50"
                style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/40 resize-none outline-none leading-relaxed min-h-[24px] py-1"
                  style={{ maxHeight: 100 }}
                  placeholder="Ask OSMOS anything…"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || sendChat.isPending}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95"
                  style={{ background: "hsl(var(--primary))", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
                >
                  <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                </button>
              </div>
              <p className="text-center text-[10px] text-white/30 mt-2 font-medium">Powered by OSMOS · Permionics</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
