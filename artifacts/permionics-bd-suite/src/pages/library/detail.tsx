import { useParams, Link, useLocation } from "wouter";
import { useGetCaseStudy, getGetCaseStudyQueryKey, useDeleteCaseStudy, useUpdateCaseStudy, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CaseStudyPreview } from "../generator/creator_components/CaseStudyPreview";
import { getPalette, DEFAULT_PHOTO_CFG } from "../generator/creator_types";
import { printCaseStudy } from "../generator/creator_utils/print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Download, Loader2, Trash2, FileText, Settings, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getSectorColor } from "@/components/case-study/CaseStudyPreview";

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

  const { data: meData } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const currentUserRole = (meData as any)?.user?.role || "user";
  const canEdit = currentUserRole === "admin" || currentUserRole === "operator";

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

  const isStatic = false;

  const handleDownload = () => {
    if (isStatic) {
      window.open(`/api/case-studies/${numId}/download`, '_blank');
    } else {
      printCaseStudy();
    }
  };

  useEffect(() => {
    if (data && window.location.search.includes("download=true")) {
      window.history.replaceState(null, "", window.location.pathname);
      toast({
        title: "Downloading File",
        description: "Preparing your professional case study download...",
      });
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
      <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] space-y-4">
        <h2 className="text-xl font-bold text-foreground">Case Study Not Found</h2>
        <Link href="/library">
          <Button variant="outline" className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Library</Button>
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
    plantImg: (data as any).richData?.plantImg || null,
    plantCap: (data as any).richData?.plantCap || "",
    plantImgCfg: (data as any).richData?.plantImgCfg || DEFAULT_PHOTO_CFG,
    handshakeImg: (data as any).richData?.handshakeImg || null,
    handshakeCap: data.testimonial || (data as any).richData?.handshakeCap || "",
    handshakeImgCfg: (data as any).richData?.handshakeImgCfg || DEFAULT_PHOTO_CFG,
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
    beakersImg: (data as any).richData?.beakersImg || null,
    beakersCap: (data as any).richData?.beakersCap || "",
    beakersImgCfg: (data as any).richData?.beakersImgCfg || DEFAULT_PHOTO_CFG,
    fig1text: "",
    conclusions: data.fullText ? data.fullText.split("\n\n").slice(-1)[0] || "" : "",
    showTech: true,
    showDelivery: true,
    showOperations: true,
  };

  return (
    <div className="relative min-h-full pb-20 bg-background/50 animate-fade-in print-full print:bg-white print:p-0">
      
      {/* ── Hero Section ── */}
      <div className="relative h-[280px] md:h-[320px] w-full overflow-hidden flex items-end print-hide" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(222, 71%, 17%))" }}>
        {/* Subtle patterned overlay or vignette */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Floating Top Nav */}
        <div className="absolute top-6 left-0 w-full px-6 flex justify-between z-20">
          <Link href="/library">
            <button className="glass text-white border-white/20 rounded-full px-5 h-10 flex items-center gap-2 hover:bg-white/10 transition-colors shadow-lg backdrop-blur-md">
              <ArrowLeft className="w-4 h-4" /> 
              <span className="font-semibold text-sm">Library</span>
            </button>
          </Link>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="glass text-white border-white/20 rounded-full px-5 h-10 flex items-center gap-2 hover:bg-white/10 transition-colors shadow-lg backdrop-blur-md">
                  <Download className="w-4 h-4" /> 
                  <span className="font-semibold text-sm hidden sm:inline">Export</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/50 rounded-2xl shadow-xl w-56 mt-2 p-2">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Download Formats</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30 my-1" />
                <DropdownMenuItem onClick={handleDownload} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                  📄 Multi-Page A4 PDF
                </DropdownMenuItem>
                {!isStatic && (
                  <>
                    <DropdownMenuItem onClick={async () => {
                      const { exportToDocx } = await import("../generator/creator_utils/exportUtils");
                      exportToDocx();
                    }} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                      📝 Word Document (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      const { exportToImage } = await import("../generator/creator_utils/exportUtils");
                      exportToImage("png");
                    }} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                      🖼️ PNG Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      const { exportToImage } = await import("../generator/creator_utils/exportUtils");
                      exportToImage("jpeg");
                    }} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                      🖼️ JPEG Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30 my-1" />
                    <DropdownMenuItem onClick={async () => {
                      const { triggerNativePrint } = await import("../generator/creator_utils/exportUtils");
                      triggerNativePrint();
                    }} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                      🖨️ Direct Print
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="glass text-white border-white/20 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg backdrop-blur-md">
                    <Settings className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-border/50 rounded-2xl shadow-xl w-48 mt-2 p-2">
                  <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Manage Project</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/30 my-1" />
                  {isStatic ? (
                    <DropdownMenuItem disabled className="opacity-50 font-medium py-2.5">
                      <Edit className="w-4 h-4 mr-2" /> Cannot Edit Static
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setIsEditingModalOpen(true)} className="cursor-pointer font-medium py-2.5 rounded-xl hover:bg-white/5">
                      <Edit className="w-4 h-4 mr-2" /> Edit Details
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/30 my-1" />
                  
                  {/* Danger Zone hidden inside dropdown */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full flex items-center px-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors outline-none text-left">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Project
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass border-red-500/20 rounded-3xl p-6">
                      <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold">Delete Case Study?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                          Are you sure you want to permanently delete <strong className="text-foreground">{data.clientName}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl font-semibold border-border/50 hover:bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">
                          {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Delete Permanently"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative z-10 w-full max-w-5xl mx-auto px-8 pb-10 flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest border-white/20 text-white shadow-sm backdrop-blur-md`}>
              {data.sector || "Unknown"}
            </Badge>
            <Badge className="bg-white/10 text-white hover:bg-white/20 border-transparent shadow-none px-3 py-1 rounded-full font-bold backdrop-blur-md">
              {data.technologyStack || "N/A"}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight max-w-3xl">
            {data.clientName || "Unnamed Project"}
          </h1>
        </motion.div>
      </div>

      {/* ── Main Content Area ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative z-20 max-w-5xl mx-auto px-6 md:px-8 -mt-6 print-hide"
      >
        {isStatic ? (
          <div className="flex flex-col items-center justify-center border border-border/50 rounded-3xl p-16 glass max-w-2xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner">
              <FileText className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-foreground text-center mb-4">
              Legacy Document Archive
            </h3>
            <p className="text-sm font-medium text-muted-foreground text-center mb-10 max-w-md leading-relaxed">
              This document has been archived directly in the library as a high-quality PDF report. The preview is not available in the builder. Click below to view and download the official file.
            </p>
            <Button 
              onClick={() => window.open(`/api/case-studies/${numId}/download`, '_blank')} 
              className="w-full max-w-xs h-14 rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
              style={{
                background: "linear-gradient(135deg, hsl(222 71% 18%), hsl(217 91% 28%))",
                color: "white"
              }}
            >
              <Download className="w-5 h-5" /> Download Original PDF
            </Button>
          </div>
        ) : (
          <div className="flex justify-center bg-muted/20 border border-border/40 rounded-[2rem] p-4 md:p-8 overflow-x-auto shadow-2xl">
            {/* The Document Container */}
            <div 
              className="relative bg-white rounded-xl overflow-hidden shrink-0 transition-all duration-300 hover:shadow-2xl"
              style={{ 
                width: "794px", 
                boxShadow: "var(--shadow-xl)", 
              }}
            >
              <CaseStudyPreview data={mappedData} palette={getPalette("ocean-blue")} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Editing Modal */}
      {canEdit && !isStatic && (
        <Dialog open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass border-border/50 rounded-3xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Edit Case Study</DialogTitle>
              <DialogDescription className="text-sm font-medium">
                Modify the text fields and outcomes for this generated case study.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-2 text-sm">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name</Label>
                  <Input id="clientName" value={editForm.clientName} onChange={e => setEditForm({ ...editForm, clientName: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sector" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sector</Label>
                  <Input id="sector" value={editForm.sector} onChange={e => setEditForm({ ...editForm, sector: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</Label>
                  <Input id="location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="technologyStack" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Technology Stack</Label>
                  <Input id="technologyStack" value={editForm.technologyStack} onChange={e => setEditForm({ ...editForm, technologyStack: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</Label>
                <Input id="capacity" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="challenge" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Challenge / Problem</Label>
                <Textarea id="challenge" rows={3} value={editForm.challenge} onChange={e => setEditForm({ ...editForm, challenge: e.target.value })} className="rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 resize-none p-3" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="solution" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Solution Design</Label>
                <Textarea id="solution" rows={3} value={editForm.solution} onChange={e => setEditForm({ ...editForm, solution: e.target.value })} className="rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 resize-none p-3" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="results" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Results (separated by ' | ')</Label>
                <Input id="results" value={editForm.results} onChange={e => setEditForm({ ...editForm, results: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="testimonial" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Testimonial / Caption</Label>
                <Input id="testimonial" value={editForm.testimonial} onChange={e => setEditForm({ ...editForm, testimonial: e.target.value })} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullText" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Summary Text</Label>
                <Textarea id="fullText" rows={4} value={editForm.fullText} onChange={e => setEditForm({ ...editForm, fullText: e.target.value })} className="rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 resize-none p-3" />
              </div>
            </div>
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsEditingModalOpen(false)} className="rounded-xl font-semibold h-12">Cancel</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="rounded-xl font-bold h-12 shadow-lg hover:scale-105 active:scale-95 transition-all">
                {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print rendering hack area */}
      <div className="hidden print:block print-full bg-white">
        {!isStatic && <CaseStudyPreview data={mappedData} palette={getPalette("ocean-blue")} />}
      </div>
    </div>
  );
}
