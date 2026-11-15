import React, { useState, useMemo, useRef } from "react";
import { 
  useListTechnicalOffers, 
  useCreateTechnicalOffer, 
  useUpdateTechnicalOffer, 
  useDeleteTechnicalOffer, 
  useBatchImportTechnicalOffers,
  useGetMe,
  TechnicalOffer,
  TechnicalOfferInput
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Edit, 
  Loader2, 
  Building2, 
  Cpu, 
  Tag, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  FilterX
} from "lucide-react";

function getSegmentBadgeColor(segment: string) {
  const s = (segment || "").toLowerCase();
  if (s.includes("pharma") || s.includes("herbal")) {
    return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
  }
  if (s.includes("textile")) {
    return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800";
  }
  if (s.includes("cetp") || s.includes("municipal") || s.includes("zld")) {
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  }
  if (s.includes("food") || s.includes("beverage") || s.includes("dairy")) {
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
  }
  if (s.includes("solar") || s.includes("industrial")) {
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

function getStatusBadge(status: string) {
  const st = (status || "").toLowerCase();
  if (st === "won") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">Won</Badge>;
  }
  if (st === "lost") {
    return <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-700">Lost</Badge>;
  }
  if (st.includes("review")) {
    return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">In Review</Badge>;
  }
  if (st === "draft") {
    return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
  }
  return <Badge className="bg-sky-500/15 text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-700">Submitted</Badge>;
}

function normalizeStatus(val: string): string {
  const s = val.trim().toLowerCase();
  if (s === "won") return "Won";
  if (s === "lost") return "Lost";
  if (s === "in review" || s === "in-review" || s === "review") return "In Review";
  if (s === "draft") return "Draft";
  if (s === "submitted") return "Submitted";
  return val.trim();
}

export default function TechnicalOffersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: meData } = useGetMe();
  const userRole = (meData as any)?.user?.role;
  const canEdit = userRole === "admin" || userRole === "operator";

  // Filter state
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Query
  const offersQuery = useListTechnicalOffers({
    search: search || undefined,
    segment: segmentFilter !== "all" ? segmentFilter : undefined,
    system: systemFilter !== "all" ? systemFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: offers = [], isLoading } = offersQuery;

  // Mutations
  const createMutation = useCreateTechnicalOffer();
  const updateMutation = useUpdateTechnicalOffer();
  const deleteMutation = useDeleteTechnicalOffer();
  const batchImportMutation = useBatchImportTechnicalOffers();

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<TechnicalOffer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TechnicalOfferInput>({
    offerNumber: "",
    clientName: "",
    segment: "",
    enquiryDate: "",
    enquiryOwner: "",
    proposalOwner: "",
    system: "",
    capacity: "",
    status: "Submitted",
    notes: "",
  });

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvParsedOffers, setCsvParsedOffers] = useState<TechnicalOfferInput[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Metric computations
  const metrics = useMemo(() => {
    const total = offers.length;
    const clients = new Set(offers.map((o) => o.clientName.trim().toLowerCase())).size;
    const systems = new Set(offers.filter((o) => o.system).map((o) => o.system.trim().toLowerCase())).size;
    const segments = new Set(offers.filter((o) => o.segment).map((o) => o.segment.trim().toLowerCase())).size;
    return { total, clients, systems, segments };
  }, [offers]);

  // Unique segments & systems for dropdown filters
  const availableSegments = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.segment) set.add(o.segment.trim());
    });
    return Array.from(set).sort();
  }, [offers]);

  const availableSystems = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.system) set.add(o.system.trim());
    });
    return Array.from(set).sort();
  }, [offers]);

  // Handlers for New / Edit
  const handleOpenNewModal = () => {
    setFormData({
      offerNumber: "",
      clientName: "",
      segment: "",
      enquiryDate: new Date().toISOString().split("T")[0],
      enquiryOwner: "",
      proposalOwner: "",
      system: "",
      capacity: "",
      status: "Submitted",
      notes: "",
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (offer: TechnicalOffer) => {
    setEditingOffer(offer);
    setFormData({
      offerNumber: offer.offerNumber,
      clientName: offer.clientName,
      segment: offer.segment,
      enquiryDate: offer.enquiryDate || "",
      enquiryOwner: offer.enquiryOwner || "",
      proposalOwner: offer.proposalOwner || "",
      system: offer.system || "",
      capacity: offer.capacity || "",
      status: offer.status || "Submitted",
      notes: offer.notes || "",
    });
  };

  const handleSubmitSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.offerNumber.trim() || !formData.clientName.trim() || !formData.segment.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Offer Number, Client Name, and Segment are required.",
        variant: "destructive",
      });
      return;
    }

    const targetOffer = editingOffer;
    try {
      if (targetOffer) {
        await updateMutation.mutateAsync({
          id: targetOffer.id,
          data: formData,
        });
        toast({ title: "Updated", description: `Offer ${formData.offerNumber} updated successfully.` });
        setEditingOffer((current) => (current?.id === targetOffer.id ? null : current));
      } else {
        await createMutation.mutateAsync({
          data: formData,
        });
        toast({ title: "Created", description: `Offer ${formData.offerNumber} added to technical offers.` });
        setIsNewModalOpen(false);
      }
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        title: "Error Saving Offer",
        description: err?.message || "Could not save technical offer.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted", description: "Technical offer deleted." });
      setDeletingId(null);
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.message || "Could not delete technical offer.",
        variant: "destructive",
      });
    }
  };

  // RFC 4180 CSV Parsing helpers
  const parseCSVRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          currentRow.push(currentField.trim());
          currentField = "";
        } else if (char === "\r") {
          if (nextChar === "\n") i++;
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
        } else if (char === "\n") {
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
        } else {
          currentField += char;
        }
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const parseCSVContent = (text: string) => {
    const rows = parseCSVRows(text);
    if (rows.length < 2) return [];

    // Find the header row (skip leading blank or comma-only rows)
    let headerRowIdx = 0;
    while (headerRowIdx < rows.length) {
      const cells = rows[headerRowIdx].map((c) => c.toLowerCase());
      if (cells.some((c) => c.includes("offer number") || c.includes("client name") || c.includes("enquiry date"))) {
        break;
      }
      headerRowIdx++;
    }

    if (headerRowIdx >= rows.length) {
      headerRowIdx = 0;
    }

    const headerCells = rows[headerRowIdx];
    const colMap: Record<string, number> = {};
    headerCells.forEach((h, idx) => {
      const lower = h.toLowerCase().trim();
      if (lower.includes("enquiry date")) colMap["enquiryDate"] = idx;
      else if (lower.includes("client name") || lower === "client") colMap["clientName"] = idx;
      else if (lower.includes("segment") || lower.includes("sector")) colMap["segment"] = idx;
      else if (lower.includes("enquiry owner")) colMap["enquiryOwner"] = idx;
      else if (lower.includes("proposal owner")) colMap["proposalOwner"] = idx;
      else if (lower.includes("system") || lower.includes("technology")) colMap["system"] = idx;
      else if (lower.includes("capacity")) colMap["capacity"] = idx;
      else if (lower.includes("offer number") || lower.includes("offer no")) colMap["offerNumber"] = idx;
      else if (lower.includes("status")) colMap["status"] = idx;
      else if (lower.includes("notes")) colMap["notes"] = idx;
    });

    const parsed: TechnicalOfferInput[] = [];
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const cells = rows[i];
      const clientName = colMap["clientName"] !== undefined ? (cells[colMap["clientName"]] || "") : "";
      const segment = colMap["segment"] !== undefined ? (cells[colMap["segment"]] || "") : "";
      const offerNumber = colMap["offerNumber"] !== undefined ? (cells[colMap["offerNumber"]] || "") : "";

      if (clientName || offerNumber) {
        const rawStatus = colMap["status"] !== undefined ? cells[colMap["status"]] : "";
        parsed.push({
          enquiryDate: colMap["enquiryDate"] !== undefined ? (cells[colMap["enquiryDate"]] || "") : "",
          clientName: clientName || "Unknown Client",
          segment: segment || "Industrial",
          enquiryOwner: colMap["enquiryOwner"] !== undefined ? (cells[colMap["enquiryOwner"]] || "") : "",
          proposalOwner: colMap["proposalOwner"] !== undefined ? (cells[colMap["proposalOwner"]] || "") : "",
          system: colMap["system"] !== undefined ? (cells[colMap["system"]] || "") : "",
          capacity: colMap["capacity"] !== undefined ? (cells[colMap["capacity"]] || "") : "",
          offerNumber: offerNumber || `PERM/AUTO/${Date.now()}-${i}`,
          status: rawStatus ? normalizeStatus(rawStatus) : "Submitted",
          notes: colMap["notes"] !== undefined ? (cells[colMap["notes"]] || "") : "",
        });
      }
    }
    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous payload immediately before reading the replacement file
    setCsvParsedOffers([]);
    setCsvPreviewRows([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSVContent(content);
      if (parsed.length === 0) {
        setCsvParsedOffers([]);
        setCsvPreviewRows([]);
        toast({
          title: "No Valid Rows Found",
          description: "Please check your CSV format and column headers.",
          variant: "destructive",
        });
        return;
      }
      setCsvParsedOffers(parsed);
      setCsvPreviewRows(parsed.slice(0, 4));
    };
    reader.readAsText(file);
  };

  const handleExecuteBatchImport = async () => {
    if (csvParsedOffers.length === 0) return;
    setIsImporting(true);
    try {
      const res = await batchImportMutation.mutateAsync({
        data: {
          offers: csvParsedOffers,
        },
      });
      toast({
        title: "Import Finished",
        description: `Imported ${res.inserted} of ${res.count} offers successfully.`,
      });
      setIsImportModalOpen(false);
      setCsvParsedOffers([]);
      setCsvPreviewRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        title: "Import Error",
        description: err?.message || "Failed to batch import offers.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // CSV Blob Download Helper
  const downloadCsvBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Export & Template Generators
  const handleExportCSV = () => {
    if (offers.length === 0) {
      toast({ title: "No Data to Export", description: "Table is empty or filters returned zero results." });
      return;
    }

    const headers = ["Enquiry Date", "Client Name", "Segment", "Enquiry Owner", "Proposal Owner", "System", "Capacity", "Offer Number", "Status", "Notes"];
    const rows = offers.map((o) => [
      `"${(o.enquiryDate || "").replace(/"/g, '""')}"`,
      `"${o.clientName.replace(/"/g, '""')}"`,
      `"${o.segment.replace(/"/g, '""')}"`,
      `"${(o.enquiryOwner || "").replace(/"/g, '""')}"`,
      `"${(o.proposalOwner || "").replace(/"/g, '""')}"`,
      `"${(o.system || "").replace(/"/g, '""')}"`,
      `"${(o.capacity || "").replace(/"/g, '""')}"`,
      `"${(o.offerNumber || "").replace(/"/g, '""')}"`,
      `"${(o.status || "").replace(/"/g, '""')}"`,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsvBlob(csvContent, `technical_offers_export_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Enquiry Date", "Client Name", "Segment", "Enquiry Owner", "Proposal Owner", "System", "Capacity ", "Offer Number"];
    const sampleRow = ["2026-03-15", "Acme Pharmaceuticals", "Pharma", "Rajesh Sharma", "Amit Patel", "UF + 2-Pass RO", "50 m3/day", "PERM/2026/TO-0201"];
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    downloadCsvBlob(csvContent, "technical_offers_template.csv");
  };

  const resetFilters = () => {
    setSearch("");
    setSegmentFilter("all");
    setSystemFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Technical Offers</h1>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">
            Track and search commercial enquiries, technical proposals, enquiry owners, and separation systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-9 gap-1.5 rounded-lg border-border/70">
            <Download className="w-4 h-4 text-muted-foreground" />
            Template
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 gap-1.5 rounded-lg border-border/70">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="h-9 gap-1.5 rounded-lg border-border/70">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>

              <Button size="sm" onClick={handleOpenNewModal} className="h-9 gap-1.5 rounded-lg shadow-sm">
                <Plus className="w-4 h-4" />
                New Offer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.total}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Proposals</div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.clients}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Clients</div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.systems}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membrane Systems</div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.segments}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry Segments</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Offer #, Client Name, System, or Owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-lg bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Segment Filter */}
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-lg bg-background">
                <SelectValue placeholder="All Segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {availableSegments.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* System Filter */}
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-lg bg-background">
                <SelectValue placeholder="All Systems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                {availableSystems.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-lg bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {(search || segmentFilter !== "all" || systemFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10 px-3 text-muted-foreground hover:text-foreground">
                <FilterX className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Offers Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading technical offers...</p>
          </div>
        ) : offersQuery.isError ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">Failed to Load Technical Offers</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              An error occurred while communicating with the server. Please check your connection and try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => offersQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold">No Technical Offers Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search || segmentFilter !== "all" || systemFilter !== "all" || statusFilter !== "all"
                ? "No technical offers match your filter criteria. Try clearing search or filters."
                : "Get started by adding a technical offer or importing an enquiry spreadsheet."}
            </p>
            {canEdit && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Import CSV
                </Button>
                <Button size="sm" onClick={handleOpenNewModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Offer
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Offer Number</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Enquiry Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Client Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Segment</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">System & Capacity</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Enquiry Owner</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Proposal Owner</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  {canEdit && <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {offer.offerNumber}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {offer.enquiryDate || "N/A"}
                    </TableCell>

                    <TableCell className="font-bold text-sm">
                      {offer.clientName}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={`font-medium text-xs px-2.5 py-0.5 rounded-md ${getSegmentBadgeColor(offer.segment)}`}>
                        {offer.segment}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-semibold">{offer.system || "Membrane System"}</div>
                      {offer.capacity && (
                        <div className="text-xs text-muted-foreground">{offer.capacity}</div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {offer.enquiryOwner ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {offer.enquiryOwner}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {offer.proposalOwner ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {offer.proposalOwner}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(offer.status)}
                    </TableCell>

                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                            onClick={() => handleOpenEditModal(offer)}
                            title="Edit Offer"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
                            onClick={() => setDeletingId(offer.id)}
                            title="Delete Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* New / Edit Offer Dialog */}
      <Dialog open={isNewModalOpen || !!editingOffer} onOpenChange={(open) => {
        if (!open) {
          setIsNewModalOpen(false);
          setEditingOffer(null);
        }
      }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Technical Offer" : "New Technical Offer"}</DialogTitle>
            <DialogDescription>
              {editingOffer ? "Update proposal parameters, owners, and system design." : "Enter technical proposal details for tracking in OSMOS."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="offer-number-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Offer Number *</label>
                <Input
                  id="offer-number-input"
                  required
                  placeholder="e.g. PERM/2026/TO-0150"
                  value={formData.offerNumber}
                  onChange={(e) => setFormData({ ...formData, offerNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enquiry-date-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enquiry Date</label>
                <Input
                  id="enquiry-date-input"
                  type="date"
                  value={formData.enquiryDate}
                  onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-name-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name *</label>
              <Input
                id="client-name-input"
                required
                placeholder="e.g. Waaree Energies Ltd."
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="segment-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Segment / Sector *</label>
                <Input
                  id="segment-input"
                  required
                  placeholder="e.g. Pharma, CETP, Solar"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status-select-trigger" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger id="status-select-trigger">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="system-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System / Technology</label>
                <Input
                  id="system-input"
                  placeholder="e.g. UF + 2-Pass RO"
                  value={formData.system}
                  onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="capacity-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</label>
                <Input
                  id="capacity-input"
                  placeholder="e.g. 50 m3/day"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="enquiry-owner-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enquiry Owner (Sales)</label>
                <Input
                  id="enquiry-owner-input"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.enquiryOwner}
                  onChange={(e) => setFormData({ ...formData, enquiryOwner: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="proposal-owner-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proposal Owner (Engineer)</label>
                <Input
                  id="proposal-owner-input"
                  placeholder="e.g. Amit Patel"
                  value={formData.proposalOwner}
                  onChange={(e) => setFormData({ ...formData, proposalOwner: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Scope of Work</label>
              <Input
                id="notes-input"
                placeholder="Brief technical description or requirements..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsNewModalOpen(false);
                setEditingOffer(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingOffer ? "Save Changes" : "Create Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Technical Offer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this technical offer record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && handleDeleteConfirm(deletingId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Import Technical Offers CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file containing enquiry and proposal columns: Enquiry Date, Client Name, Segment, Enquiry Owner, Proposal Owner, System, Capacity, and Offer Number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 p-8 rounded-xl text-center cursor-pointer transition-colors block"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-primary/70 mb-3" />
              <div className="text-sm font-bold">Click to select CSV spreadsheet</div>
              <div className="text-xs text-muted-foreground mt-1">Columns will be automatically mapped and trimmed</div>
            </button>

            {csvPreviewRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Detected {csvParsedOffers.length} offers (showing first {csvPreviewRows.length})</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Import
                  </span>
                </div>

                <div className="border border-border/60 rounded-lg overflow-x-auto max-h-[220px]">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="text-[11px]">
                        <TableHead>Offer #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>System</TableHead>
                        <TableHead>Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreviewRows.map((row, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-mono font-bold text-primary">{row.offerNumber}</TableCell>
                          <TableCell className="font-semibold">{row.clientName}</TableCell>
                          <TableCell>{row.segment}</TableCell>
                          <TableCell>{row.system}</TableCell>
                          <TableCell>{row.capacity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExecuteBatchImport} 
                disabled={csvParsedOffers.length === 0 || isImporting}
              >
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import {csvParsedOffers.length > 0 ? `${csvParsedOffers.length} Offers` : ""}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
