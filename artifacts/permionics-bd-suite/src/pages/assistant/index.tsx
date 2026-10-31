import React, { useState, useRef, useEffect } from "react";
import { Send, User, Upload, FileText, Trash2, Loader2, RefreshCw, AlertTriangle, Activity, Sparkles, MessageSquare } from "lucide-react";
import { useSendChatMessage, ChatSource, customFetch, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import botAvatar from "@assets/osmos_logo_blue_transparent.png";

// Lightweight markdown renderer — no external dependency
function MarkdownContent({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");

  // Parse inline formatting: **bold**, *italic*, `code`
  function parseInline(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
    let last = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      if (match[1] !== undefined) parts.push(<strong key={key++} className="font-bold text-foreground">{match[1]}</strong>);
      else if (match[2] !== undefined) parts.push(<em key={key++} className="italic text-foreground/80">{match[2]}</em>);
      else if (match[3] !== undefined) parts.push(<code key={key++} className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-border/50">{match[3]}</code>);
      last = regex.lastIndex;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  }

  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Heading: ### or ## or #
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2]);
      const cls = level === 1 ? "text-xl font-extrabold mt-4 mb-2 text-foreground" : level === 2 ? "text-lg font-bold mt-3 mb-1.5 text-foreground" : "text-base font-bold mt-2 mb-1 text-foreground/90";
      elements.push(<h4 key={i} className={cls}>{content}</h4>);
      i++; continue;
    }

    // Unordered bullet: * item or - item
    if (/^[\*\-]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\*\-]\s+/.test(lines[i])) {
        const text = lines[i].replace(/^[\*\-]\s+/, "");
        items.push(
          <li key={i} className="flex gap-2 items-start mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
            <span>{parseInline(text)}</span>
          </li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="my-2 space-y-1 text-muted-foreground">{items}</ul>);
      continue;
    }

    // Numbered list: 1. item
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const match = lines[i].match(/^(\d+)\.\s+(.*)/);
        if (match) {
          items.push(
            <li key={i} className="flex gap-2 items-start mt-1.5">
              <span className="font-bold text-primary/80 min-w-[20px]">{match[1]}.</span>
              <span>{parseInline(match[2])}</span>
            </li>
          );
        }
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="my-2 space-y-1 text-muted-foreground">{items}</ol>);
      continue;
    }

    // Empty line → spacer
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-3" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={i} className="leading-relaxed text-muted-foreground">{parseInline(line)}</p>);
    i++;
  }

  return <div className={`text-[15px] space-y-1 ${className}`}>{elements}</div>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  contextSummary?: {
    uploadedDocs: number;
    caseStudies: number;
    creatorProjects: number;
    total: number;
    mode?: string;
  };
}

interface Document {
  id: string;
  title: string;
  created_at: string;
  hasContent: boolean;
}

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "library">("chat");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("osmos_ai_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reprocessFileInputRef = useRef<HTMLInputElement>(null);
  const reprocessTargetId = useRef<string | null>(null);
  
  const sendChat = useSendChatMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: meData } = useGetMe();
  const userRole = (meData as any)?.user?.role;
  const canManageDocs = userRole === "admin" || userRole === "operator";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("osmos_ai_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await customFetch<Document[]>("/api/assistant/documents");
      setDocuments(data);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { role: 'user', content: text };
    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setInput("");

    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

    sendChat.mutate({ data: { message: text, history: historyPayload } }, {
      onSuccess: (res: any) => {
        setMessages([...newHistory, { 
          role: 'assistant', 
          content: res.answer, 
          sources: res.sources,
          contextSummary: res.contextSummary
        }]);
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.message || "Failed to get response from Osmos AI.",
          variant: "destructive"
        });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File", description: "Only PDF files are supported.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await customFetch("/api/assistant/upload", {
        method: "POST",
        body: formData,
      });

      toast({ title: "Success", description: "Document uploaded and OCR processed successfully." });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Upload Error", description: error?.message || "Failed to process the document.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await customFetch(`/api/assistant/documents/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Document removed from library." });
      fetchDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  };

  const handleReprocessClick = (id: string) => {
    reprocessTargetId.current = id;
    reprocessFileInputRef.current?.click();
  };

  const handleReprocessUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = reprocessTargetId.current;
    if (!file || !id) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File", description: "Only PDF files are supported.", variant: "destructive" });
      return;
    }

    setReprocessingId(id);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await customFetch(`/api/assistant/documents/${id}/reprocess`, {
        method: "POST",
        body: formData,
      });
      toast({ title: "Re-OCR Complete", description: `"${file.name}" has been re-processed and text extracted via Gemini OCR.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Re-OCR Failed", description: error?.message || "Failed to re-process document.", variant: "destructive" });
    } finally {
      setReprocessingId(null);
      reprocessTargetId.current = null;
      if (reprocessFileInputRef.current) reprocessFileInputRef.current.value = "";
    }
  };

  const examplePrompts = [
    "Summarize our technical capabilities for CETP projects",
    "What results did we get for Waaree Energies?",
    "Pitch angle for textile ZLD client",
    "List the major chemical processing case studies"
  ];

  const messageVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 h-[calc(100vh)] flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto bg-muted/20">
      
      {/* Left: Chat Display */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col glass bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm h-full relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />
        
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-white/40 dark:bg-black/40 backdrop-blur-md z-10">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-foreground">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
              <img src={botAvatar} alt="Osmos AI" className="w-6 h-6 object-contain" />
            </div>
            Osmos AI
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Connected to DB
            </span>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to clear this conversation?")) {
                    setMessages([]);
                  }
                }}
                className="text-xs rounded-lg"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <img src={botAvatar} alt="Osmos AI" className="relative w-24 h-24 object-contain drop-shadow-xl" />
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-extrabold mb-3 tracking-tight text-foreground">How can I assist you?</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Ask me anything. I automatically search and refer to all Library Case Studies, Creator projects, and uploaded reference PDFs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {examplePrompts.map((p, i) => (
                  <motion.button 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="text-left text-sm font-semibold rounded-2xl p-4 bg-background/50 border border-border/50 text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all shadow-sm hover:shadow-md flex items-start gap-3" 
                    onClick={() => handleSend(p)}
                  >
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary/70 flex-shrink-0" />
                    <span className="leading-snug">{p}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  variants={messageVariants}
                  initial="hidden"
                  animate="show"
                  className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0 mt-2">
                    {m.role === 'user' ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg border-2 border-background">
                        <User className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shadow-sm border border-primary/20 backdrop-blur-sm">
                        <img src={botAvatar} alt="Assistant" className="w-6 h-6 object-contain" />
                      </div>
                    )}
                  </div>
                  
                  <div className={`max-w-[85%] ${
                    m.role === 'user' 
                      ? 'bg-foreground text-background shadow-md' 
                      : 'bg-background/80 border border-border/60 shadow-sm'
                  } rounded-3xl px-6 py-5 backdrop-blur-md`}>
                    {m.role === 'assistant' ? (
                      <MarkdownContent text={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{m.content}</p>
                    )}
                    
                    {m.contextSummary && m.contextSummary.total > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                        <span className="font-bold text-[10px] uppercase tracking-widest mr-1">Context:</span>
                        {m.contextSummary.uploadedDocs > 0 && (
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                            {m.contextSummary.uploadedDocs} PDF{m.contextSummary.uploadedDocs !== 1 ? 's' : ''}
                          </span>
                        )}
                        {m.contextSummary.caseStudies > 0 && (
                          <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full font-bold">
                            {m.contextSummary.caseStudies} Library
                          </span>
                        )}
                        {m.contextSummary.creatorProjects > 0 && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                            {m.contextSummary.creatorProjects} Projects
                          </span>
                        )}
                      </div>
                    )}
                    
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Citations:</span>
                        {m.sources.map(s => (
                          <div key={s.id} className="text-xs bg-muted/50 border border-border/50 px-3 py-1.5 rounded-lg text-foreground font-semibold flex items-center gap-2 hover:bg-muted/80 transition-colors cursor-default">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            {s.clientName} <span className="text-muted-foreground font-medium text-[10px] ml-1">({s.sector})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {sendChat.isPending && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 mt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shadow-sm border border-primary/20 backdrop-blur-sm opacity-70">
                  <img src={botAvatar} alt="Assistant" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="bg-background/80 border border-border/60 rounded-3xl px-6 py-5 shadow-sm backdrop-blur-md flex items-center h-[60px]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </motion.div>

      {/* Right: Input Area & Library */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full lg:w-[420px] flex flex-col gap-4"
      >
        <div className="glass bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border/50 rounded-3xl p-2 shadow-sm">
           <div className="flex w-full bg-muted/40 p-1.5 rounded-2xl shadow-inner border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${
                activeTab === "chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Ask Osmos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${
                activeTab === "library" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" /> Custom PDFs
            </button>
          </div>
        </div>
        
        {activeTab === "chat" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col glass bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-bold tracking-tight">Query Input</h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">Chat context includes the entire knowledge base.</p>
            </div>
            
            <div className="flex-1 flex flex-col p-6">
              <Textarea 
                className="flex-1 min-h-[200px] resize-none border-0 focus-visible:ring-0 px-0 text-base leading-relaxed bg-transparent shadow-none" 
                placeholder="E.g. What is the standard recovery rate for textile ZLD plants using MBR and RO technologies?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
              />
              <div className="pt-6 mt-auto border-t border-border/50">
                <Button 
                  size="lg"
                  className="w-full font-bold text-sm h-12 rounded-xl shadow-lg shadow-primary/20" 
                  disabled={!input.trim() || sendChat.isPending}
                  onClick={() => handleSend(input)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Analyze Query
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "library" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col glass bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-bold tracking-tight">Reference Library</h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">{canManageDocs ? "Upload external PDFs to include them in queries." : "Reference PDFs indexed for assistant queries."}</p>
            </div>
            
            <div className="flex-1 flex flex-col p-6 space-y-5">
              {canManageDocs && (
                <>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/60 rounded-2xl bg-muted/20 text-muted-foreground hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 mb-3 animate-spin text-primary" /> 
                        <span className="text-sm font-bold">Extracting Text...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" /> 
                        </div>
                        <span className="text-sm font-bold text-foreground">Upload PDF Document</span>
                        <span className="text-xs font-medium mt-1 opacity-70">Will be processed by Gemini Vision OCR</span>
                      </>
                    )}
                  </button>

                  {/* Hidden file input for re-OCR reprocessing */}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={reprocessFileInputRef}
                    onChange={handleReprocessUpload}
                  />
                </>
              )}

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center text-sm font-medium text-muted-foreground py-10">
                    No reference documents uploaded yet.
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className={`flex items-center justify-between border p-3.5 rounded-xl shadow-sm transition-all hover:shadow-md ${
                      doc.hasContent 
                        ? 'bg-background/80 border-border/60 text-foreground' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${doc.hasContent ? 'bg-primary/10 text-primary' : 'bg-amber-500/20 text-amber-600'}`}>
                          {doc.hasContent ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate text-sm font-bold">{doc.title}</div>
                      </div>
                      
                      {canManageDocs && (
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {!doc.hasContent && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-bold border-amber-500/30 text-amber-700 hover:text-amber-900 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-500/30 px-3 rounded-lg"
                              disabled={reprocessingId === doc.id}
                              onClick={() => handleReprocessClick(doc.id)}
                              title="Re-upload and OCR this document with Gemini Vision"
                            >
                              {reprocessingId === doc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />OCR</>
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
