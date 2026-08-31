import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useListCaseStudies, useDeleteCaseStudy, customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getSectorColor } from "@/components/case-study/CaseStudyPreview";
import { Search, Plus, FileText, Loader2, MoreVertical, Download, Trash2, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [technology, setTechnology] = useState("all");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteCaseStudy();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const caseStudiesQuery = useListCaseStudies({
    search: search || undefined,
    sector: sector !== "all" ? sector : undefined,
    technology: technology !== "all" ? technology : undefined,
  });

  const { data: caseStudies, isLoading } = caseStudiesQuery;

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
      await customFetch("/api/case-studies/upload", {
        method: "POST",
        body: formData,
      });

      toast({ title: "Success", description: "Case study uploaded and added to the library." });
      queryClient.invalidateQueries({ queryKey: caseStudiesQuery.queryKey });
    } catch (error: any) {
      toast({ title: "Upload Error", description: error?.message || "Failed to upload case study.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        toast({ 
          title: "Error", 
          description: err?.message || "Failed to delete case study.", 
          variant: "destructive" 
        });
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
    <div className="max-w-5xl mx-auto p-8 space-y-8 text-foreground animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Case Study Library</h1>
          <p className="text-muted-foreground mt-1 font-normal text-sm">Browse, filter, and access all client case studies and outcomes.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept="application/pdf"
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload Case Study</>
            )}
          </Button>
          <Button onClick={() => setLocation("/generator")}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients, keywords, tags..." 
            className="pl-9 h-10 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-full lg:w-[200px] h-10 bg-background">
              <SelectValue placeholder="Filter by Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="Pharma/Herbal">Pharma/Herbal</SelectItem>
              <SelectItem value="Textile">Textile</SelectItem>
              <SelectItem value="CETP/Municipal">CETP/Municipal</SelectItem>
              <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
            </SelectContent>
          </Select>
          <Select value={technology} onValueChange={setTechnology}>
            <SelectTrigger className="w-full lg:w-[200px] h-10 bg-background">
              <SelectValue placeholder="Filter by Tech" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technologies</SelectItem>
              <SelectItem value="RO">RO</SelectItem>
              <SelectItem value="UF">UF</SelectItem>
              <SelectItem value="NF">NF</SelectItem>
              <SelectItem value="ZLD">ZLD</SelectItem>
              <SelectItem value="MBR">MBR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[280px] py-4">Client Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Technology</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Date Added</TableHead>
                <TableHead className="text-right pr-6 w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : safeCaseStudies.length > 0 ? (
                safeCaseStudies.map((cs) => (
                  <TableRow 
                    key={cs.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setLocation(`/library/${cs.id}`)}
                  >
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        {cs.clientName || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getSectorColor(cs.sector || "")} whitespace-nowrap`}>
                        {cs.sector || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">
                        {cs.technologyStack || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cs.capacity || "-"}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(cs.createdAt)}
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => triggerDownload(cs)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-700 cursor-pointer"
                              onClick={() => handleDelete(cs)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-muted-foreground/50" />
                      <p>No case studies found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
