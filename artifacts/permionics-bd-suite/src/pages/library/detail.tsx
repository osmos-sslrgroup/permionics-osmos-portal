import { useParams, Link, useLocation } from "wouter";
import { useGetCaseStudy, getGetCaseStudyQueryKey, useDeleteCaseStudy, useUpdateCaseStudy } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CaseStudyPreview } from "../generator/creator_components/CaseStudyPreview";
import { getPalette } from "../generator/creator_types";
import { printCaseStudy } from "../generator/creator_utils/print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Download, Loader2, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CaseStudyDetail() {
  const { id } = useParams();
  const numId = id ? parseInt(id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: "",
    sector: "",
    location: "",
    technologyStack: "",
    capacity: "",
    challenge: "",
    solution: "",
    results: "",
    testimonial: "",
    fullText: "",
  });
  
  const { data, isLoading } = useGetCaseStudy(numId, {
    query: {
      enabled: !!numId,
      queryKey: getGetCaseStudyQueryKey(numId)
    }
  });

  const deleteMutation = useDeleteCaseStudy();
  const updateMutation = useUpdateCaseStudy();

  useEffect(() => {
    if (data) {
      setEditForm({
        clientName: data.clientName || "",
        sector: data.sector || "",
        location: data.location || "",
        technologyStack: data.technologyStack || "",
        capacity: data.capacity || "",
        challenge: data.challenge || "",
        solution: data.solution || "",
        results: data.results || "",
        testimonial: data.testimonial || "",
        fullText: data.fullText || "",
      });
    }
  }, [data, isEditingModalOpen]);

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

  const isStatic = data ? isStaticStudy(data.clientName || "") : false;

  const handleDownload = () => {
    if (isStatic) {
      window.open(`/api/case-studies/${numId}/download`, '_blank');
    } else {
      printCaseStudy();
    }
  };

  useEffect(() => {
    if (data && window.location.search.includes("download=true")) {
      // Clean up URL query parameters so it only runs once
      window.history.replaceState(null, "", window.location.pathname);
      
      toast({
        title: "Downloading File",
        description: "Preparing your professional case study download...",
      });
      
      // Trigger download
      setTimeout(() => {
        handleDownload();
      }, 500);
    }
  }, [data]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: numId });
      toast({ title: "Deleted", description: "Case study deleted from library." });
      setLocation("/library");
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to delete case study.", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({ id: numId, data: editForm });
      toast({ title: "Updated", description: "Case study updated successfully." });
      setIsEditingModalOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetCaseStudyQueryKey(numId) });
    } catch (err: any) {
      toast({ 
        title: "Update Failed", 
        description: err?.message || "Failed to update case study.", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Case Study Not Found</h2>
        <Link href="/library">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Library</Button>
        </Link>
      </div>
    );
  }

  const mappedData = {
    clientName: data.clientName || "",
    sector: data.sector || "",
    location: data.location || "",
    csTitle: data.clientName || "Case Study",
    titleHL: "",
    categoryLabel: data.sector || "CASE HISTORY",
    application: data.technologyStack || "",
    capacity: data.capacity || "",
    tagLine: "",
    intro: data.fullText ? data.fullText.split("\n\n")[0] || "" : "",
    challengeProblem: data.challenge || "",
    challengeLimits: "",
    solDesign: data.solution || "",
    solAuto: "",
    solBOO: "",
    techList: data.technologyStack || "",
    techLabel: "Technologies Used",
    deliveryLabel: "Delivery Model",
    delivery: "Engineered, supplied, and commissioned by Permionics.",
    operationsLabel: "Operations",
    operations: "Continuous operation with zero unplanned downtime.",
    waterData: "",
    perfStab: "",
    valueDel: "",
    sidebarBullets: "",
    statBar: "",
    plantImg: null,
    plantCap: "",
    plantImgCfg: null,
    handshakeImg: null,
    handshakeCap: data.testimonial || "",
    handshakeImgCfg: null,
    envImpact: "Purified water returned to member industries for process reuse, supporting zero discharge compliance.",
    companyName: "Permionics Membranes Pvt. Ltd.",
    website: "www.permionics.com",
    division: "Water & Wastewater Division",
    regions: "India · Asia-Pacific · Global",
    cards: data.results ? data.results.split(" | ").map((cardStr) => {
      const idx = cardStr.indexOf(":");
      if (idx !== -1) {
        return { number: cardStr.slice(0, idx).trim(), label: cardStr.slice(idx + 1).trim() };
      }
      return { number: "", label: cardStr.trim() };
    }) : [],
    beakersImg: null,
    beakersCap: "",
    beakersImgCfg: null,
    fig1text: "",
    conclusions: data.fullText ? data.fullText.split("\n\n").slice(-1)[0] || "" : "",
    showTech: true,
    showDelivery: true,
    showOperations: true,
  };

  return (
    <div className="max-w-[1000px] mx-auto p-8 space-y-6 print-full print:p-0 animate-fade-in">
      <div className="flex items-center justify-between print-hide mb-8">
        <Link href="/library" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownload} className="bg-background">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          {isStatic ? (
            <Button variant="secondary" className="bg-secondary text-secondary-foreground" disabled>
              <Edit className="w-4 h-4 mr-2" /> Edit Case Study
            </Button>
          ) : (
            <Dialog open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  <Edit className="w-4 h-4 mr-2" /> Edit Case Study
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Case Study</DialogTitle>
                  <DialogDescription>
                    Modify the text fields and outcomes for this generated case study.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={editForm.clientName}
                        onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sector">Sector</Label>
                      <Input
                        id="sector"
                        value={editForm.sector}
                        onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="technologyStack">Technology Stack</Label>
                      <Input
                        id="technologyStack"
                        value={editForm.technologyStack}
                        onChange={(e) => setEditForm({ ...editForm, technologyStack: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      value={editForm.capacity}
                      onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="challenge">Challenge / Problem</Label>
                    <Textarea
                      id="challenge"
                      rows={3}
                      value={editForm.challenge}
                      onChange={(e) => setEditForm({ ...editForm, challenge: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="solution">Solution Design</Label>
                    <Textarea
                      id="solution"
                      rows={3}
                      value={editForm.solution}
                      onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="results">Results (separated by ' | ')</Label>
                    <Input
                      id="results"
                      value={editForm.results}
                      onChange={(e) => setEditForm({ ...editForm, results: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="testimonial">Testimonial / Handshake Caption</Label>
                    <Input
                      id="testimonial"
                      value={editForm.testimonial}
                      onChange={(e) => setEditForm({ ...editForm, testimonial: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fullText">Full Summary Text</Label>
                    <Textarea
                      id="fullText"
                      rows={4}
                      value={editForm.fullText}
                      onChange={(e) => setEditForm({ ...editForm, fullText: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditingModalOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleUpdate} 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-white">
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Case Study?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete "{data.clientName}" from the library? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {isStatic ? (
        <div className="flex flex-col items-center justify-center border border-slate-200 rounded-2xl p-16 bg-white max-w-xl mx-auto shadow-md">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {data.clientName}
          </h3>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">{data.sector}</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">{data.technologyStack}</span>
          </div>
          <p className="text-sm text-slate-500 text-center mb-8 max-w-md leading-relaxed">
            This document has been archived directly in the library as a high-quality PDF report. Click below to view and download the official file.
          </p>
          <Button 
            onClick={() => window.open(`/api/case-studies/${numId}/download`, '_blank')} 
            className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, hsl(222 71% 18%), hsl(217 91% 28%))",
              color: "white"
            }}
          >
            <Download className="w-4 h-4" /> Download Original PDF
          </Button>
        </div>
      ) : (
        <div className="print-full pb-16 flex justify-center bg-slate-50 border rounded-2xl p-6 md:p-12 overflow-x-auto">
          <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.12)", width: "794px", flexShrink: 0, background: "#ffffff" }}>
            <CaseStudyPreview data={mappedData} palette={getPalette("ocean-blue")} />
          </div>
        </div>
      )}
    </div>
  );
}
