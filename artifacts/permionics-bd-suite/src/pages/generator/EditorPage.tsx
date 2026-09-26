import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { CaseStudyData, getPalette, migrateCaseStudyData } from "./creator_types";
import { Sidebar } from "./creator_components/Sidebar";
import { CaseStudyPreview } from "./creator_components/CaseStudyPreview";
import { printCaseStudy } from "./creator_utils/print";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  projectId: number;
}

export default function EditorPage({ projectId }: Props) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CaseStudyData | null>(null);
  const [palette, setPalette] = useState("ocean-blue");
  const [editableMode, setEditableMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<{ data: CaseStudyData; palette: string } | null>(null);

  useEffect(() => {
    customFetch(`/api/case-creator/${projectId}`)
      .then((res: any) => {
        setProject(res);
        const migrated = migrateCaseStudyData(res.data);
        setData(migrated);
        setPalette(res.palette ?? "ocean-blue");
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [projectId]);

  const doSave = useCallback(async (saveData: CaseStudyData, savePalette: string) => {
    setSaveStatus("saving");
    try {
      await customFetch(`/api/case-creator/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ data: saveData, palette: savePalette }),
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("unsaved");
    }
  }, [projectId]);

  const scheduleAutosave = useCallback((newData: CaseStudyData, newPalette: string) => {
    setSaveStatus("unsaved");
    latestDataRef.current = { data: newData, palette: newPalette };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (latestDataRef.current) {
        doSave(latestDataRef.current.data, latestDataRef.current.palette);
      }
    }, 1500);
  }, [doSave]);

  const handleDataChange = (newData: CaseStudyData) => {
    setData(newData);
    scheduleAutosave(newData, palette);
  };

  const handlePaletteChange = (newPalette: string) => {
    setPalette(newPalette);
    if (data) scheduleAutosave(data, newPalette);
  };

  const handleSaveNow = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (data) doSave(data, palette);
  };

  const handlePublishToLibrary = async () => {
    if (!data) return;
    setIsPublishing(true);
    try {
      const payload = {
        clientName: data.clientName || project?.name || "Unnamed Client",
        sector: data.sector || "General",
        location: data.location || "",
        challenge: data.challengeProblem || "",
        solution: data.solDesign || "",
        technologyStack: data.techList ? data.techList.split("\n").join(", ") : "",
        capacity: data.capacity || "",
        results: data.cards ? data.cards.map(c => `${c.number}: ${c.label}`).join(" | ") : "",
        testimonial: data.handshakeCap || null,
        richData: { ...data, palette, projectName: project?.name },
        fullText: `${data.intro || ""}\n\n${data.challengeProblem || ""}\n\n${data.solDesign || ""}\n\n${data.conclusions || ""}`.trim(),
      };

      await customFetch("/api/case-studies", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["caseStudies"] });

      toast({
        title: "Published to Library",
        description: "This case study has been added to the Case Library for future search reference.",
      });
    } catch (err: any) {
      console.error("Publish failed:", err);
      toast({
        title: "Publish Failed",
        description: err.message || "Failed to add this case study to the library.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))" }}>
        <div style={{ color: "var(--muted-foreground)", fontSize: "13px" }}>Loading project...</div>
      </div>
    );
  }

  const pal = getPalette(palette);
  const saveLabel = saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes";
  const saveColor = saveStatus === "saving" ? "#f59e0b" : saveStatus === "saved" ? "#22c55e" : "#ef4444";

  return (
    <div className="text-foreground" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "hsl(var(--background))" }}>
      {/* Collapsible sidebar */}
      <div className="print-hide" style={{
        flexShrink: 0,
        width: sidebarCollapsed ? "0px" : "320px",
        overflow: "hidden",
        transition: "width 0.25s ease",
        borderRight: sidebarCollapsed ? "none" : "1px solid hsl(var(--border))",
        display: "flex",
        flexDirection: "column",
        background: "hsl(var(--card))",
      }}>
        {!sidebarCollapsed && (
          <Sidebar
            data={data}
            palette={palette}
            onPaletteChange={handlePaletteChange}
            onChange={handleDataChange}
            onPrint={() => printCaseStudy()}
            onBack={() => navigate("~/generator")}
            saved={saveStatus === "saved"}
            onSaveNow={handleSaveNow}
            editableMode={editableMode}
            onToggleEditable={() => setEditableMode((v) => !v)}
            projectName={project?.name ?? ""}
            onPublishToLibrary={handlePublishToLibrary}
            isPublishing={isPublishing}
          />
        )}
      </div>

      {/* Preview area */}
      <div className="print-full bg-muted/20" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px", gap: "16px", minWidth: 0 }}>
        {/* Top bar */}
        <div className="print-hide glass rounded-2xl px-6 py-4 shadow-sm border border-border/50" style={{ width: "100%", maxWidth: "900px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Hamburger toggle */}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Show panel" : "Collapse panel"}
              className="hover:bg-white/10 transition-colors"
              style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "transparent", border: "1px solid hsl(var(--border))",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: "var(--foreground)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{ width: "1px", height: "20px", background: "hsl(var(--border))" }} />
            <span style={{ fontSize: "14px", color: "var(--foreground)", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>Live Preview</span>
            {editableMode && (
              <span className="animate-pulse" style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "20px", fontWeight: 700, border: "1px solid #fcd34d" }}>
                Click-to-edit ON
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: saveColor, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: saveColor, boxShadow: `0 0 10px ${saveColor}` }} className={saveStatus === "saving" ? "animate-ping" : ""} />
              {saveLabel}
            </span>
            <div className="relative group">
              <button
                className="hover:scale-105 active:scale-95 transition-all"
                style={{
                  background: pal.primary, color: "white", border: "none", borderRadius: "10px",
                  padding: "10px 20px", fontSize: "13px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "8px", fontWeight: 700,
                  boxShadow: `0 4px 14px ${pal.primary}60`,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export / Print ▾
              </button>
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border/50 rounded-xl shadow-xl hidden group-hover:block z-50 p-1.5 backdrop-blur-md bg-white/90 dark:bg-black/90">
                <button
                  onClick={() => printCaseStudy()}
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted rounded-lg flex items-center gap-2 font-bold"
                >
                  📄 Multi-Page A4 PDF
                </button>
                <button
                  onClick={async () => {
                    const { exportToDocx } = await import("./creator_utils/exportUtils");
                    exportToDocx();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted rounded-lg flex items-center gap-2 font-bold"
                >
                  📝 Word Document (.docx)
                </button>
                <button
                  onClick={async () => {
                    const { exportToImage } = await import("./creator_utils/exportUtils");
                    exportToImage("png");
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted rounded-lg flex items-center gap-2 font-bold"
                >
                  🖼️ PNG Image
                </button>
                <button
                  onClick={async () => {
                    const { exportToImage } = await import("./creator_utils/exportUtils");
                    exportToImage("jpeg");
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted rounded-lg flex items-center gap-2 font-bold"
                >
                  🖼️ JPEG Image
                </button>
                <button
                  onClick={async () => {
                    const { triggerNativePrint } = await import("./creator_utils/exportUtils");
                    triggerNativePrint();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted rounded-lg flex items-center gap-2 font-bold border-t border-border/50 mt-1 pt-2"
                >
                  🖨️ Direct Print
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="print-full bg-white rounded-xl border border-border/50 mt-2" style={{ boxShadow: "var(--shadow-2xl)", width: "794px", flexShrink: 0, overflow: "hidden" }}>
          <CaseStudyPreview data={data} palette={pal} editable={editableMode} onChange={handleDataChange} />
        </div>
      </div>
    </div>
  );
}
