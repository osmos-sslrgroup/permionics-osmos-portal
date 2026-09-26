import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { customFetch } from "@workspace/api-client-react";
import { DEFAULT_DATA, PALETTES, getPalette } from "./creator_types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderOpen, Trash2, MoreVertical, Calendar, ClipboardList, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      navigate(`~/generator/editor/${res.id}`);
      setIsCreating(false);
      setNewName("");
    } catch (err: any) {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
    } finally {
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
    navigate(`~/generator/editor/${id}`);
  };

  return (
    <div className="min-h-full text-foreground pb-20">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Case Study Projects</h1>
              <p className="text-muted-foreground font-medium mt-1">Create and customize structured client case studies with AI assistance.</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <Button onClick={() => setIsCreating(true)} className="h-11 rounded-xl px-5 font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary">
              <Plus className="w-5 h-5 mr-2" /> New Project
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }} 
              animate={{ opacity: 1, height: "auto", y: 0 }} 
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="glass rounded-3xl border border-border/50 shadow-xl overflow-hidden mb-10"
            >
              <div className="p-8 space-y-6 bg-white/5">
                <h3 className="text-xl font-bold">Create New Project</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Project Name
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="e.g. Nandesari Industries — RO Plant"
                      className="w-full px-4 py-3 border border-border/50 rounded-xl text-base bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Colour Palette
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {PALETTES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setNewPalette(p.id)}
                          className="px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-200"
                          style={{
                            borderColor: newPalette === p.id ? p.primary : "var(--border)",
                            background: newPalette === p.id ? `${p.primary}15` : "transparent",
                            color: newPalette === p.id ? p.primary : "var(--muted-foreground)",
                            boxShadow: newPalette === p.id ? `0 0 10px ${p.primary}30` : "none"
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                    <Button variant="ghost" onClick={() => { setIsCreating(false); setNewName(""); }} className="rounded-xl font-semibold">
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting} className="rounded-xl font-bold shadow-md">
                      {isSubmitting ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 glass rounded-3xl animate-pulse" />)}
          </div>
        ) : !projects.length && !isCreating ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center glass rounded-3xl border-dashed border-2 border-border/50">
            <ClipboardList className="w-12 h-12 text-foreground opacity-20 mb-4" />
            <p className="text-lg font-bold text-foreground mb-1">No projects yet</p>
            <p className="text-sm font-medium text-muted-foreground mb-6 max-w-sm">Create your first case study to get started.</p>
            <Button onClick={() => setIsCreating(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Create Project</Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {(projects ?? []).map((project, index) => {
                const palette = getPalette(project.palette);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group"
                  >
                    <div
                      onClick={() => openProject(project.id)}
                      className="glass rounded-3xl p-6 h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-glass-border hover:border-primary/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: palette.primary }} />
                      
                      <div className="flex items-start justify-between mb-4 mt-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-xl font-bold leading-tight truncate text-foreground group-hover:text-primary transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: palette.primary }} />
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: palette.accent }} />
                            <span className="text-xs font-semibold text-muted-foreground ml-1">{palette.name}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-border/50 rounded-2xl shadow-xl w-40">
                            <DropdownMenuItem onClick={(e) => openProject(project.id, e as any)} className="cursor-pointer font-medium py-2 rounded-xl hover:bg-white/5">
                              <FolderOpen className="w-4 h-4 mr-2" /> Open
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer font-medium py-2 rounded-xl focus:bg-red-500/10" onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-auto flex items-center gap-2 text-[11px] font-semibold text-muted-foreground pt-4 border-t border-border/30">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass border border-red-500/20 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Project?</h3>
            <p className="text-sm font-medium text-muted-foreground mb-8">This action cannot be undone. The project and all its data will be permanently deleted.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
