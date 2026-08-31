import React, { useState, useRef, useEffect } from "react";
import { Send, User, Upload, FileText, Trash2, Loader2, RefreshCw, AlertTriangle, Activity } from "lucide-react";
import { useSendChatMessage, ChatSource, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
      if (match[1] !== undefined) parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
      else if (match[2] !== undefined) parts.push(<em key={key++}>{match[2]}</em>);
      else if (match[3] !== undefined) parts.push(<code key={key++} className="bg-muted px-1 py-0.5 rounded text-[13px] font-mono">{match[3]}</code>);
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
      const cls = level === 1 ? "text-lg font-bold mt-3 mb-1" : level === 2 ? "text-base font-bold mt-2 mb-1" : "text-sm font-semibold mt-2 mb-0.5";
      elements.push(<p key={i} className={cls}>{content}</p>);
      i++; continue;
    }

    // Unordered bullet: * item or - item
    if (/^[\*\-]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\*\-]\s+/.test(lines[i])) {
        const text = lines[i].replace(/^[\*\-]\s+/, "");
        items.push(<li key={i} className="ml-4 list-disc">{parseInline(text)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="my-1 space-y-0.5">{items}</ul>);
      continue;
    }

    // Numbered list: 1. item
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, "");
        items.push(<li key={i} className="ml-4 list-decimal">{parseInline(text)}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="my-1 space-y-0.5">{items}</ol>);
      continue;
    }

    // Empty line → spacer
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={i} className="leading-relaxed">{parseInline(line)}</p>);
    i++;
  }

  return <div className={`text-[15px] space-y-0.5 ${className}`}>{elements}</div>;
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

  return (
    <div className="flex-1 p-6 h-[calc(100vh)] flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      
      {/* Left: Chat Display */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full">
        <div className="bg-primary px-6 py-4 border-b flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-3 text-primary-foreground tracking-wide">
            <img src={botAvatar} alt="Osmos AI" className="w-8 h-8 object-contain" />
            Osmos AI
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-primary-foreground/70 text-sm font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Connected to Knowledge Base
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear this conversation?")) {
                    setMessages([]);
                  }
                }}
                className="text-[11px] font-semibold text-primary-foreground/75 hover:text-white bg-white/10 hover:bg-white/20 transition-all px-2.5 py-1.5 rounded-lg border-0 cursor-pointer"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-background">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <img src={botAvatar} alt="Osmos AI" className="w-20 h-20 object-contain drop-shadow-md" />
              <div className="max-w-md">
                <h3 className="text-2xl font-bold mb-3 tracking-tight">How can I assist you?</h3>
                <p className="text-muted-foreground mb-8 text-base">Ask me anything. I automatically search and refer to all Library Case Studies, Case Study Creator projects, and uploaded reference PDFs.</p>
                <div className="flex flex-col gap-3">
                  {examplePrompts.map((p, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      className="text-sm rounded-xl py-6 bg-card text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all justify-start px-6 shadow-sm" 
                      onClick={() => handleSend(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {m.role === 'user' ? (
                    <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md border-2 border-white">
                      <User className="w-5 h-5" />
                    </div>
                  ) : (
                    <img src={botAvatar} alt="Assistant" className="w-9 h-9 object-contain" />
                  )}
                </div>
                <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-card border border-border shadow-sm text-slate-800 dark:text-slate-100'} rounded-2xl p-5`}>
                  {m.role === 'assistant' ? (
                    <MarkdownContent text={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{m.content}</p>
                  )}
                  
                  {m.contextSummary && m.contextSummary.total > 0 && (
                    <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                      <span className="font-semibold mr-1">Searched:</span>
                      {m.contextSummary.uploadedDocs > 0 && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                          {m.contextSummary.uploadedDocs} PDF{m.contextSummary.uploadedDocs !== 1 ? 's' : ''}
                        </span>
                      )}
                      {m.contextSummary.caseStudies > 0 && (
                        <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                          {m.contextSummary.caseStudies} Library
                        </span>
                      )}
                      {m.contextSummary.creatorProjects > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                          {m.contextSummary.creatorProjects} Projects
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                        {m.contextSummary.mode === 'broad_sweep' ? '📚 Full scan' : '🎯 Targeted'}
                      </span>
                    </div>
                  )}
                  
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">Citations:</span>
                      {m.sources.map(s => (
                        <div key={s.id} className="text-xs bg-muted/50 border px-3 py-1.5 rounded-md text-foreground font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {s.clientName} <span className="text-muted-foreground font-normal">({s.sector})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {sendChat.isPending && (
            <div className="flex gap-4">
               <img src={botAvatar} alt="Assistant" className="w-9 h-9 object-contain opacity-60" />
              <div className="bg-card dark:bg-card rounded-2xl p-5 shadow-sm border flex items-center h-[52px]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Right: Input Area & Library */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chat">Chat Input</TabsTrigger>
            <TabsTrigger value="library">Document Library</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 h-full">
            <Card className="flex-1 flex flex-col shadow-sm border-border">
              <CardHeader className="pb-4 bg-muted/20 border-b">
                <CardTitle className="text-lg">Query Input</CardTitle>
                <CardDescription>Formulate your query for the knowledge base.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6">
                <Textarea 
                  className="flex-1 min-h-[200px] lg:min-h-0 resize-none border-0 focus-visible:ring-0 px-0 text-base leading-relaxed bg-transparent" 
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
                <div className="pt-6 mt-auto border-t">
                  <Button 
                    size="lg"
                    className="w-full font-bold text-base h-12" 
                    disabled={!input.trim() || sendChat.isPending}
                    onClick={() => handleSend(input)}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Analyze Query
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="flex-1 flex flex-col mt-0 h-full">
            <Card className="flex-1 flex flex-col shadow-sm border-border">
              <CardHeader className="pb-4 bg-muted/20 border-b">
                <CardTitle className="text-lg">Reference Library</CardTitle>
                <CardDescription>Upload PDFs for Gemini OCR processing.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 space-y-4">
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <Button 
                  className="w-full border-dashed border-2 py-8 bg-muted/20 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/50" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Extracting Text via OCR...</>
                  ) : (
                    <><Upload className="w-6 h-6 mr-3" /> Upload PDF Document</>
                  )}
                </Button>

                {/* Hidden file input for re-OCR reprocessing */}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={reprocessFileInputRef}
                  onChange={handleReprocessUpload}
                />

                <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No documents uploaded yet.
                    </div>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className={`flex items-center justify-between border p-3 rounded-lg shadow-sm ${
                        doc.hasContent 
                          ? 'bg-card text-foreground border-border' 
                          : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300'
                      }`}>
                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                          {doc.hasContent ? (
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                          <div className="truncate text-sm font-medium">{doc.title}</div>
                          {!doc.hasContent && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 rounded px-1.5 py-0.5 flex-shrink-0">No text</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!doc.hasContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 px-2"
                              disabled={reprocessingId === doc.id}
                              onClick={() => handleReprocessClick(doc.id)}
                              title="Re-upload and OCR this document with Gemini Vision"
                            >
                              {reprocessingId === doc.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <><RefreshCw className="w-3 h-3 mr-1" />Re-OCR</>
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
