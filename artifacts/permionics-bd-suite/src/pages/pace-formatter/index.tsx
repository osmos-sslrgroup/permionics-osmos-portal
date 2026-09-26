import React, { useState } from "react";
import { FileEdit, UploadCloud, File, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PaceFormatterPage() {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-lg">
          <FileEdit className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">PACE Document Formatter</h1>
          <p className="text-muted-foreground mt-1">Upload a PACE projection DOCX and a Logo to generate a formatted output.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Left Column: Form */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col h-full overflow-y-auto space-y-6">
          <h2 className="text-xl font-semibold">Document Details</h2>
          
          <div className="space-y-4">
            {/* File Uploads */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raw DOCX File</Label>
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
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
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
            <Button className="w-full" disabled={!docxFile}>
              Process Document
            </Button>
          </div>
        </div>

        {/* Right Column: Preview (To be implemented) */}
        <div className="bg-muted/30 rounded-xl border shadow-inner flex flex-col h-full overflow-hidden relative">
          <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
            <h2 className="font-medium text-sm">Preview</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 text-center">
             <div className="max-w-xs text-muted-foreground">
               <FileEdit className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="text-sm">Upload a document and fill in the details to see a preview of the generated DOCX file.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
