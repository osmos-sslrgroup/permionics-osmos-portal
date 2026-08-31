import React, { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2, Maximize2, Loader2, ExternalLink } from "lucide-react";
import { useSendChatMessage, ChatSource, customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import botAvatar from "@assets/osmos_logo_blue_transparent.png";

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
      <button
        id="osmos-chat-trigger"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-20 h-20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 print-hide"
        style={{
          background: "transparent",
        }}
        title="OSMOS AI Assistant"
      >
        {open ? (
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-900 text-white shadow-2xl border border-slate-800">
            <X className="w-6 h-6" />
          </div>
        ) : (
          <img src={botAvatar} alt="OSMOS" className="w-16 h-16 object-contain drop-shadow-xl" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 flex flex-col rounded-2xl overflow-hidden print-hide chat-panel-enter"
          style={{
            width: 380,
            height: 540,
            background: "hsl(222 47% 9%)",
            boxShadow: "0 24px 64px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(217 91% 60% / 0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(222 47% 12%), hsl(222 47% 9%))",
              borderBottom: "1px solid hsl(222 30% 16%)",
            }}
          >
            <div className="relative">
              <img src={botAvatar} alt="OSMOS" className="w-9 h-9 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[hsl(222_47%_9%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">OSMOS</p>
              <p className="text-[11px] text-white/50">Intelligence Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear this conversation?")) {
                      setMessages([]);
                    }
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  title="Clear conversation"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                </button>
              )}
              <Link href="~/assistant">
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  title="Open full assistant"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 osmos-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
                <img src={botAvatar} alt="OSMOS" className="w-16 h-16 object-contain osmos-blob" />
                <div>
                  <p className="text-white/80 font-semibold text-sm">Hi, I'm OSMOS</p>
                  <p className="text-white/40 text-xs mt-1">Ask me anything about Permionics' case studies, technical capabilities, or project insights.</p>
                </div>
                <div className="grid gap-2 w-full">
                  {[
                    "Summarize our CETP capabilities",
                    "What was the Nandesari recovery rate?",
                    "List all pharmaceutical projects",
                  ].map(p => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="text-left text-xs px-3 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
                      style={{ background: "hsl(222 30% 14%)", border: "1px solid hsl(222 30% 20%)" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "assistant" && (
                    <img src={botAvatar} alt="OSMOS" className="w-7 h-7 object-contain flex-shrink-0 mt-0.5" />
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-white ${
                      m.role === "user"
                        ? "rounded-tr-sm"
                        : "rounded-tl-sm"
                    }`}
                    style={m.role === "user"
                      ? { background: "hsl(217 91% 55%)" }
                      : { background: "hsl(222 30% 14%)", border: "1px solid hsl(222 30% 20%)" }
                    }
                  >
                    {m.role === "assistant" ? (
                      <MiniMarkdown text={m.content} />
                    ) : (
                      <p className="text-[13px] leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {sendChat.isPending && (
              <div className="flex gap-2.5">
                <img src={botAvatar} alt="OSMOS" className="w-7 h-7 object-contain flex-shrink-0 mt-0.5" />
                <div
                  className="px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2"
                  style={{ background: "hsl(222 30% 14%)", border: "1px solid hsl(222 30% 20%)" }}
                >
                  <Loader2 className="w-3.5 h-3.5 text-white/50 animate-spin" />
                  <span className="text-xs text-white/50">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: "1px solid hsl(222 30% 16%)" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "hsl(222 30% 14%)", border: "1px solid hsl(222 30% 22%)" }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/30 resize-none outline-none leading-relaxed"
                style={{ maxHeight: 80 }}
                placeholder="Ask OSMOS anything…"
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
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
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30"
                style={{ background: "hsl(217 91% 60%)" }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2">Powered by OSMOS · Permionics Insights</p>
          </div>
        </div>
      )}
    </>
  );
}
