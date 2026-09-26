import React, { useState, useRef } from "react";
import { FileEdit, UploadCloud, File, Image as ImageIcon, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as docx from "docx-preview";

export default function PaceFormatterPage() {
  const { toast } = useToast();
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
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
          // Inject some base styles into the iframe to ensure good padding and background
          // align-items: flex-start prevents the left-clipping bug on small screens!
          const style = doc.createElement("style");
          style.textContent = `
            body { margin: 0; padding: 20px; background-color: #f3f4f6; }
            .docx-wrapper { 
                background: transparent; 
                padding: 0; 
                align-items: center !important; 
                /* Physically zoom out the document so the A4 page fits the screen */
                zoom: 0.65;
            }
            .docx {
                margin: 0 auto;
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
  };

  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
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
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsPdfProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileEdit className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">PACE Document Formatter</h1>
            <p className="text-muted-foreground mt-1">Upload a PACE projection DOCX and a Logo to generate a formatted output.</p>
          </div>
        </div>
        {processedBlob && (
          <div className="flex items-center gap-3">
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download DOCX
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isPdfProcessing} className="gap-2">
              {isPdfProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isPdfProcessing ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Left Column: Form */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col h-full overflow-y-auto space-y-6">
          <h2 className="text-xl font-semibold">Document Details</h2>
          
          <div className="space-y-4">
            {/* File Uploads */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raw DOCX File *</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                  <File className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium text-center truncate w-full px-2">
                    {docxFile ? docxFile.name : "Select DOCX"}
                  </span>
                  <input type="file" accept=".docx" className="hidden" onChange={(e) => handleFileChange(e, setDocxFile)} />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Replacement Logo</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                  <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium text-center truncate w-full px-2">
                    {logoFile ? logoFile.name : "Select Image"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setLogoFile)} />
                </label>
              </div>
            </div>

            {/* Text Inputs */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="e.g. 23r2BW" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="text" value={formData.date} onChange={handleInputChange} placeholder="e.g. 2025/9/8" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. IOCL DUMAD" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designedBy">Designed By</Label>
              <Input id="designedBy" name="designedBy" value={formData.designedBy} onChange={handleInputChange} placeholder="e.g. 121" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="elementModel">Element Model</Label>
              <Input id="elementModel" name="elementModel" value={formData.elementModel} onChange={handleInputChange} placeholder="e.g. HPA RO-8040-LF-WW" />
            </div>
          </div>

          <div className="pt-4 mt-auto border-t">
            <Button className="w-full" disabled={!docxFile || isProcessing} onClick={handleSubmit}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Document"
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="bg-muted/30 rounded-xl border shadow-inner flex flex-col h-full overflow-hidden relative">
          <div className="bg-card border-b px-4 py-3 flex items-center justify-between z-10">
            <h2 className="font-medium text-sm">Preview</h2>
          </div>
          <div className="flex-1 bg-muted/20 relative">
             {/* Manually manipulated DOM node - React should not manage its children */}
             <iframe ref={previewRef} title="DOCX Preview" className={`w-full h-full border-none ${!processedBlob ? 'hidden' : ''}`} />
             
             {/* React controlled placeholder */}
             {!processedBlob && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-white/50 dark:bg-black/50">
                  <FileEdit className="w-12 h-12 mb-4" />
                  <p className="text-sm">Upload and process a document to see the preview.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
