import { useState, useRef, DragEvent } from "react";
import { Link, useLocation } from "wouter";
import { useListCaseStudies, useDeleteCaseStudy, customFetch, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Loader2, MoreVertical, Download, Trash2, Upload, CloudUpload, Activity, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function getSectorColor(sector: string) {
  const s = sector.toLowerCase();
  if (s.includes("pharma") || s.includes("herbal"))
    return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
  if (s.includes("textile"))
    return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800";
  if (s.includes("cetp") || s.includes("municipal"))
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  if (s.includes("food") || s.includes("beverage"))
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
  return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
}

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [technology, setTechnology] = useState("all");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteCaseStudy();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const caseStudiesQuery = useListCaseStudies({
    search: search || undefined,
    sector: sector !== "all" ? sector : undefined,
    technology: technology !== "all" ? technology : undefined,
  });

  const { data: caseStudies, isLoading } = caseStudiesQuery;

  const { data: meData } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const currentUserRole = (meData as any)?.user?.role || "user";
  const canEdit = currentUserRole === "admin" || currentUserRole === "operator";

  const handleFileProcess = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File", description: "Only PDF files are supported.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await customFetch("/api/case-studies/upload", { method: "POST", body: formData });
      toast({ title: "Success", description: "Case study uploaded and added to the library." });
      queryClient.invalidateQueries({ queryKey: caseStudiesQuery.queryKey });
    } catch (error: any) {
      toast({ title: "Upload Error", description: error?.message || "Failed to upload case study.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const isStaticStudy = (clientName: string) => {
    const staticNames = [
      "European Pharmaceutical Major (Gropello, Italy)",
      "Jeedimetla Effluent Treatment Limited (JETL)",
      "World's Largest Stevia Plant",
      "Nandesari Industries Association (NIA)",
      "Serratiopeptidase Production Facility"
    ];
    return staticNames.includes(clientName);
  };

  const triggerDownload = (cs: any) => {
    if (isStaticStudy(cs.clientName || "")) {
      window.open(`/api/case-studies/${cs.id}/download`, '_blank');
    } else {
      setLocation(`/library/${cs.id}?download=true`);
    }
  };

  const handleDelete = async (cs: any) => {
    if (confirm(`Are you sure you want to permanently delete "${cs.clientName}"?`)) {
      try {
        await deleteMutation.mutateAsync({ id: cs.id });
        toast({ title: "Deleted", description: "Case study deleted from library." });
        queryClient.invalidateQueries({ queryKey: caseStudiesQuery.queryKey });
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to delete case study.", variant: "destructive" });
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    try {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return format(d, 'MMM d, yyyy');
    } catch {
      return "-";
    }
  };

  const safeCaseStudies = Array.isArray(caseStudies) ? caseStudies : [];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 text-foreground pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight">Case Study Library</h1>
          <p className="text-muted-foreground mt-1.5 font-medium">Browse, filter, and access all client case studies and outcomes.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {canEdit && (
            <Button onClick={() => setLocation("/generator")} className="h-10 rounded-xl px-5 font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          )}
        </motion.div>
      </div>

      {/* MacOS Spotlight Style Search Bar & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative glass rounded-3xl p-3 flex flex-col md:flex-row gap-3 shadow-xl z-20"
        style={{ border: "1px solid var(--glass-border)", background: "var(--glass-bg)" }}
      >
        <div className="relative flex-1 flex items-center bg-white/5 dark:bg-black/20 rounded-2xl px-4 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <Search className="w-6 h-6 text-muted-foreground/60 flex-shrink-0" />
          <input 
            placeholder="Search clients, keywords, tags..." 
            className="w-full h-14 pl-4 pr-4 bg-transparent border-none outline-none text-lg font-medium placeholder:text-muted-foreground/50 text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-full md:w-[200px] h-14 rounded-2xl bg-white/5 dark:bg-black/20 border-border/50 text-base font-medium transition-all hover:bg-white/10 dark:hover:bg-white/5">
              <SelectValue placeholder="Filter by Sector" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50 rounded-2xl shadow-xl">
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="Pharma/Herbal">Pharma/Herbal</SelectItem>
              <SelectItem value="Textile">Textile</SelectItem>
              <SelectItem value="CETP/Municipal">CETP/Municipal</SelectItem>
              <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
            </SelectContent>
          </Select>
          <Select value={technology} onValueChange={setTechnology}>
            <SelectTrigger className="w-full md:w-[200px] h-14 rounded-2xl bg-white/5 dark:bg-black/20 border-border/50 text-base font-medium transition-all hover:bg-white/10 dark:hover:bg-white/5">
              <SelectValue placeholder="Filter by Tech" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50 rounded-2xl shadow-xl">
              <SelectItem value="all">All Technologies</SelectItem>
              <SelectItem value="RO">RO</SelectItem>
              <SelectItem value="UF">UF</SelectItem>
              <SelectItem value="NF">NF</SelectItem>
              <SelectItem value="ZLD">ZLD</SelectItem>
              <SelectItem value="MBR">MBR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* PDF Upload Dropzone */}
      {canEdit && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`glass rounded-3xl p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group overflow-hidden relative
              ${isDragging ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.2)]" : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"}
              ${isUploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            {isDragging && <div className="absolute inset-0 bg-primary/5 blur-3xl z-0 rounded-3xl" />}
            
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-[0_10px_20px_rgba(var(--primary),0.2)]">
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <CloudUpload className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 relative z-10">
              {isUploading ? "Uploading & Analyzing..." : "Import PDF Case Study"}
            </h3>
            <p className="text-sm font-medium text-muted-foreground relative z-10">
              {isDragging ? "Drop to upload" : "Drag and drop or click to browse files"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Case Study Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-3xl glass animate-pulse" />
          ))}
        </div>
      ) : safeCaseStudies.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {safeCaseStudies.map((cs, i) => (
              <motion.div
                key={cs.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group relative"
              >
                <div
                  onClick={() => setLocation(`/library/${cs.id}`)}
                  className="h-full glass rounded-3xl p-6 flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-glass-border hover:border-primary/30 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <FileText className="w-6 h-6" />
                    </div>
                    
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-white/10">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border/50 rounded-2xl shadow-xl w-44">
                          <DropdownMenuItem className="cursor-pointer font-medium py-2" onClick={() => triggerDownload(cs)}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          {canEdit && !isStaticStudy(cs.clientName || "") && (
                            <DropdownMenuItem className="cursor-pointer font-medium py-2 text-primary" onClick={() => setLocation(`/generator/library/${cs.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit in Generator
                            </DropdownMenuItem>
                          )}
                          {canEdit && (
                            <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer font-medium py-2 focus:bg-red-500/10" onClick={() => handleDelete(cs)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold leading-tight mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {cs.clientName || "Unnamed Project"}
                  </h3>
                  {(cs as any).richData?.projectName && (
                    <p className="text-sm font-medium text-muted-foreground line-clamp-1 mb-4">
                      {(cs as any).richData.projectName}
                    </p>
                  )}

                  <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSectorColor(cs.sector || "")}`}>
                      {cs.sector || "Unknown"}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none px-2.5 rounded-full font-bold">
                      {cs.technologyStack || "N/A"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/30 text-xs font-semibold text-muted-foreground">
                    <span className="truncate pr-4 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      {cs.capacity || "Capacity unlisted"}
                    </span>
                    <span className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      {formatDate(cs.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center glass rounded-3xl border-dashed border-2 border-border/50"
        >
          <Search className="w-12 h-12 mb-4 opacity-20 text-foreground" />
          <p className="text-lg font-bold text-foreground">No case studies found</p>
          <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">
            Try adjusting your search filters or upload a new case study to populate the library.
          </p>
        </motion.div>
      )}
    </div>
  );
}
