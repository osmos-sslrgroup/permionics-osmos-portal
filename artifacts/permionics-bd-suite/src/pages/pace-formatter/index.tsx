import React from "react";
import { FileEdit } from "lucide-react";

export default function PaceFormatterPage() {
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
        {/* Left Column: Form (To be implemented) */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col h-full overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Document Details</h2>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground text-sm">Form controls will go here.</p>
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
