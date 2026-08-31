import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { customFetch } from "@workspace/api-client-react";
import { DEFAULT_DATA, PALETTES, getPalette } from "./creator_types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderOpen, Trash2, MoreVertical, Calendar, ClipboardList } from "lucide-react";

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPalette, setNewPalette] = useState("ocean-blue");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res: any = await customFetch("/api/case-creator");
      setProjects(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      const res: any = await customFetch("/api/case-creator", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), palette: newPalette, data: DEFAULT_DATA }),
      });
      navigate(`/editor/${res.id}`);
    } catch (err: any) {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await customFetch(`/api/case-creator/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast({ title: "Deleted", description: "Case study removed." });
      await fetchProjects();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openProject = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/editor/${id}`);
  };

  return (
    <div className="min-h-full text-foreground" style={{ background: "hsl(var(--background))" }}>
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Case Study Projects</h1>
            <p className="text-muted-foreground mt-1">Create and customize structured client case studies with AI assistance.</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>

        {/* Create panel modal */}
        {isCreating && (
          <div style={{
            background: "hsl(var(--card))", borderRadius: "16px", padding: "28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid hsl(var(--border))",
            marginBottom: "32px", animation: "slideDown 0.2s ease-out",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 18px 0" }}>Create New Project</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  Project Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Nandesari Industries — RO Plant"
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)", display: "block", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  Colour Palette
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setNewPalette(p.id)}
                      style={{
                        padding: "8px 16px", fontSize: "12px", fontWeight: 600,
                        borderRadius: "8px", border: "1px solid", cursor: "pointer",
                        borderColor: newPalette === p.id ? p.primary : "hsl(var(--border))",
                        background: newPalette === p.id ? `${p.primary}1c` : "hsl(var(--card))",
                        color: newPalette === p.id ? p.primary : "hsl(var(--muted-foreground))",
                        transition: "all 0.15s",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={() => { setIsCreating(false); setNewName(""); }}
                  style={{
                    background: "none", border: "none", color: "var(--muted-foreground)", fontSize: "13px",
                    fontWeight: 600, cursor: "pointer", padding: "8px 16px",
                  }}
                >
                  Cancel
                </button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Project grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--muted-foreground)", fontSize: "14px" }}>
            Loading projects...
          </div>
        ) : !projects.length && !isCreating ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-muted/10">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-muted-foreground mb-2 text-sm">No projects yet</p>
            <p className="text-xs text-muted-foreground mb-6">Create your first case study to get started.</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-3.5 h-3.5" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(projects ?? []).map((project) => {
              const palette = getPalette(project.palette);
              return (
                <Card
                  key={project.id}
                  className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => openProject(project.id)}
                >
                  {/* Color bar */}
                  <div style={{ background: palette.primary, height: "4px" }} />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight truncate">{project.name}</CardTitle>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: palette.primary }} />
                          <span className="w-2 h-2 rounded-full" style={{ background: palette.accent }} />
                          <span className="text-[11px] text-muted-foreground ml-1">{palette.name}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openProject(project.id); }}>
                            <FolderOpen className="w-4 h-4 mr-2" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "14px", padding: "32px", width: "380px", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--foreground)", marginBottom: "12px", marginTop: 0 }}>Delete project?</h3>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "24px" }}>This action cannot be undone. The project and all its data will be permanently deleted.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "9px 18px", border: "1.5px solid hsl(var(--border))", borderRadius: "8px", background: "hsl(var(--card))", fontSize: "13px", cursor: "pointer", color: "var(--muted-foreground)", fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: "9px 18px", border: "none", borderRadius: "8px", background: "#dc2626", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
