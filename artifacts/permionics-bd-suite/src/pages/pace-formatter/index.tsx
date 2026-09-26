import React, { useState, useRef } from "react";
import { FileEdit, UploadCloud, File, Image as ImageIcon, Download, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as docx from "docx-preview";
import { motion, AnimatePresence } from "framer-motion";

export default function PaceFormatterPage() {
  const { toast } = useToast();
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<"docx" | "pdf" | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  const [formData, setFormData] = useState({
    projectName: "",
    date: "",
    company: "",
    designedBy: "",
    elementModel: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!docxFile) return;
    
    setIsProcessing(true);
    setProcessedBlob(null);

    const form = new FormData();
    form.append("docx", docxFile);
    if (logoFile) {
      form.append("logo", logoFile);
    }
    
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value);
    });

    try {
      const response = await fetch("/api/documents/format-pace", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const blob = await response.blob();
      setProcessedBlob(blob);
      
      toast({
        title: "Success",
        description: "Document formatted successfully. See preview on the right.",
      });

      // Render Preview
      if (previewRef.current) {
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.body.innerHTML = "";
          const style = doc.createElement("style");
          style.textContent = `
            body { margin: 0; padding: 40px; background-color: transparent; }
            .docx-wrapper { 
                background: transparent; 
                padding: 0; 
                align-items: center !important; 
                zoom: 0.7;
            }
            .docx {
                margin: 0 auto;
                box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1) !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                border: 1px solid rgba(0,0,0,0.05) !important;
            }
          `;
          doc.head.appendChild(style);

          docx.renderAsync(blob, doc.body, doc.body, {
             className: "docx",
             inWrapper: true,
             ignoreWidth: false,
             ignoreHeight: false,
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while formatting the document.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PACE_Formatted_${formData.projectName || "Export"}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadSuccess("docx");
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!docxFile) return;
    setIsPdfProcessing(true);
    try {
      const form = new FormData();
      form.append("docx", docxFile);
      if (logoFile) form.append("logo", logoFile);
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));

      const response = await fetch("/api/documents/format-pace?pdf=true", {
        method: "POST",
        body: form,
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PACE_Formatted_${formData.projectName || "Export"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadSuccess("pdf");
      setTimeout(() => setDownloadSuccess(null), 2000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsPdfProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-[1400px] animate-fade-in pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">PACE Formatter</h1>
            <p className="text-muted-foreground font-medium mt-1">Upload a PACE projection DOCX and a Logo to generate a perfectly formatted PDF output.</p>
          </div>
        </div>
        
        <AnimatePresence>
          {processedBlob && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-sm"
            >
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                className={`gap-2 h-11 rounded-xl font-bold transition-all ${downloadSuccess === 'docx' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'hover:border-primary/50'}`}
              >
                {downloadSuccess === 'docx' ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                DOCX
              </Button>
              <Button 
                onClick={handleDownloadPdf} 
                disabled={isPdfProcessing} 
                className={`gap-2 h-11 rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all ${downloadSuccess === 'pdf' ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
              >
                {isPdfProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : downloadSuccess === 'pdf' ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isPdfProcessing ? "Generating PDF..." : "Download PDF"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-220px)] min-h-[700px]">
        {/* Left Column: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="xl:col-span-4 glass rounded-3xl border border-border/50 shadow-xl flex flex-col h-full overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent" />
          
          <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar">
            <h2 className="text-xl font-bold text-foreground">Configuration</h2>
            
            <div className="space-y-6">
              {/* File Uploads */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Raw DOCX File *</Label>
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 group ${docxFile ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-background/30 hover:border-primary/40 hover:bg-white/5'}`}>
                    <File className={`w-8 h-8 mb-3 transition-colors ${docxFile ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                    <span className={`text-sm font-bold text-center truncate w-full px-4 ${docxFile ? 'text-primary' : 'text-foreground'}`}>
                      {docxFile ? docxFile.name : "Click to browse file"}
                    </span>
                    <input type="file" accept=".docx" className="hidden" onChange={(e) => handleFileChange(e, setDocxFile)} />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Replacement Logo (Optional)</Label>
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 group ${logoFile ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-background/30 hover:border-primary/40 hover:bg-white/5'}`}>
                    <ImageIcon className={`w-8 h-8 mb-3 transition-colors ${logoFile ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                    <span className={`text-sm font-bold text-center truncate w-full px-4 ${logoFile ? 'text-primary' : 'text-foreground'}`}>
                      {logoFile ? logoFile.name : "Click to browse image"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setLogoFile)} />
                  </label>
                </div>
              </div>

              <div className="border-t border-border/30 pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Name</Label>
                  <Input id="projectName" name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="e.g. 23r2BW" className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                  <Input id="date" name="date" type="text" value={formData.date} onChange={handleInputChange} placeholder="e.g. 2025/9/8" className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. IOCL DUMAD" className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="designedBy" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Designed By</Label>
                    <Input id="designedBy" name="designedBy" value={formData.designedBy} onChange={handleInputChange} placeholder="e.g. 121" className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elementModel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Element Model</Label>
                    <Input id="elementModel" name="elementModel" value={formData.elementModel} onChange={handleInputChange} placeholder="e.g. HPA RO-8040" className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/30 bg-black/5 dark:bg-white/5">
            <Button 
              className="w-full h-12 rounded-xl font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all text-white bg-primary hover:bg-primary/90" 
              disabled={!docxFile || isProcessing} 
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Document...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Generate Output</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Right Column: Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="xl:col-span-8 glass rounded-3xl border border-border/50 shadow-xl flex flex-col h-full overflow-hidden"
        >
          <div className="bg-secondary/30 border-b border-border/50 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-md">
            <h2 className="font-bold text-sm tracking-wide text-primary uppercase">Live Preview</h2>
          </div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-background/50 to-muted/20">
             {/* Manually manipulated DOM node */}
             <iframe ref={previewRef} title="DOCX Preview" className={`w-full h-full border-none transition-opacity duration-500 ${!processedBlob ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 relative'}`} />
             
             {/* React controlled placeholder */}
             <AnimatePresence>
               {!processedBlob && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none"
                  >
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-border/30">
                      <FileEdit className="w-10 h-10 text-primary/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground mb-1">No Document Generated</p>
                    <p className="text-sm font-medium">Upload a file and process it to view the preview here.</p>
                  </motion.div>
               )}
             </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
