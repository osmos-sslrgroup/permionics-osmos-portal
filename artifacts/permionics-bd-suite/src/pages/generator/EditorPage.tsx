import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { CaseStudyData, getPalette, migrateCaseStudyData } from "./creator_types";
import { Sidebar } from "./creator_components/Sidebar";
import { CaseStudyPreview } from "./creator_components/CaseStudyPreview";
import { printCaseStudy } from "./creator_utils/print";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: number;
}

export default function EditorPage({ projectId }: Props) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
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
        tags: data.techList ? data.techList.split("\n").map(t => t.trim()).filter(Boolean) : [],
        fullText: `${data.intro || ""}\n\n${data.challengeProblem || ""}\n\n${data.solDesign || ""}\n\n${data.conclusions || ""}`.trim(),
      };

      await customFetch("/api/case-studies", {
        method: "POST",
        body: JSON.stringify(payload),
      });

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
      <div style={{
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
            onBack={() => navigate("/")}
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
      <div style={{ flex: 1, overflowY: "auto", background: "hsl(var(--background))", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 16px", gap: "10px", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ width: "100%", maxWidth: "860px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Hamburger toggle */}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Show panel" : "Collapse panel"}
              style={{
                width: "32px", height: "32px", borderRadius: "6px",
                background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: "var(--muted-foreground)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "1px", height: "16px", background: "hsl(var(--border))" }} />
            <span style={{ fontSize: "12px", color: "#666", fontWeight: 500 }}>Live Preview</span>
            {editableMode && (
              <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "20px", fontWeight: 600, border: "1px solid #fcd34d" }}>
                Click-to-edit ON
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: saveColor, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: saveColor }} />
              {saveLabel}
            </span>
            <button
              onClick={() => printCaseStudy()}
              style={{
                background: pal.primary, color: "white", border: "none", borderRadius: "7px",
                padding: "7px 16px", fontSize: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", fontWeight: 600,
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>

        <div style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.18)", width: "794px", flexShrink: 0 }}>
          <CaseStudyPreview data={data} palette={pal} editable={editableMode} onChange={handleDataChange} />
        </div>
      </div>
    </div>
  );
}
