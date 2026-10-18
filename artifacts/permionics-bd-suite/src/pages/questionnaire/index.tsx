import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SECTORS, Question, Section, SectorState, SavedProject, ClientInfo } from '@/types/questionnaire';
import { DEFAULT_SECTOR_STATES } from '@/data/defaultQuestions';
import { SectionBlock } from '@/components/questionnaire/SectionBlock';
import { QuestionRow } from '@/components/questionnaire/QuestionRow';
import { PreviewModal } from '@/components/questionnaire/PreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { customFetch, useGetMe } from '@workspace/api-client-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Plus, Eye, Save, Loader2, FolderOpen, Trash2, MoreVertical, ClipboardList, ArrowLeft,
  Building2, User2, MapPin, Calendar, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

function deepCopyState(state: SectorState): SectorState {
  return JSON.parse(JSON.stringify(state));
}

function initState(sectorId: string): SectorState {
  const template = DEFAULT_SECTOR_STATES[sectorId];
  if (!template) return { sections: [], questions: [], clientInfo: { companyName: '', contactPerson: '', date: '', location: '' } };
  return deepCopyState(template);
}

// ── Sector colour palette ─────────────────────────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  pharma:   'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  dairy:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  water:    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  food:     'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  textile:  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  cetp:     'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  chemical: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
};

export default function QuestionnairePage() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const currentUserRole = (user as any)?.user?.role || "user";
  const canEdit = currentUserRole === "admin" || currentUserRole === "operator";

  // ── Project list state ─────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('');

  // ── New project dialog ─────────────────────────────────────────────────────
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSector, setNewProjectSector] = useState('pharma');

  // ── Builder state ──────────────────────────────────────────────────────────
  const [activeSectorId, setActiveSectorId] = useState('pharma');
  const [sectorState, setSectorState] = useState<SectorState>(() => initState('pharma'));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draggedQId, setDraggedQId] = useState<string | null>(null);

  // ── Load projects ──────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await customFetch<SavedProject[]>('/api/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Could not load projects.', variant: 'destructive' });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [toast]);

  // Load on mount
  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Open project ───────────────────────────────────────────────────────────
  const openProject = async (id: number) => {
    try {
      const proj = await customFetch<SavedProject>(`/api/projects/${id}`);
      setActiveSectorId(proj.sector);
      const savedState = proj.data && Object.keys(proj.data).length > 0
        ? (proj.data as unknown as SectorState)
        : initState(proj.sector);
      setSectorState(deepCopyState(savedState));
      setActiveProjectId(id);
      setProjectName(proj.name);
      setView('builder');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Could not open project.', variant: 'destructive' });
    }
  };

  // ── Create project ─────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const initialState = initState(newProjectSector);
      const proj = await customFetch<SavedProject>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName.trim(),
          sector: newProjectSector,
          data: initialState,
        }),
      });
      setNewProjectOpen(false);
      setNewProjectName('');
      await openProject(proj.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Could not create project.', variant: 'destructive' });
    }
  };

  // ── Save current project ───────────────────────────────────────────────────
  const saveProject = async () => {
    if (!activeProjectId) return;
    setIsSaving(true);
    try {
      await customFetch(`/api/projects/${activeProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: projectName,
          companyName: sectorState.clientInfo.companyName,
          contactPerson: sectorState.clientInfo.contactPerson,
          location: sectorState.clientInfo.location,
          date: sectorState.clientInfo.date,
          data: sectorState,
        }),
      });
      toast({ title: 'Saved', description: 'Project saved successfully.' });
      await loadProjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Could not save project.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete project ─────────────────────────────────────────────────────────
  const deleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await customFetch(`/api/projects/${id}`, { method: 'DELETE' });
      toast({ title: 'Deleted', description: 'Project deleted successfully.' });
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
      await loadProjects();
    } catch {
      toast({ title: 'Error', description: 'Could not delete project.', variant: 'destructive' });
    }
  };

  // ── Sector state helpers ───────────────────────────────────────────────────
  const updateClientInfo = (field: keyof ClientInfo, value: string) => {
    setSectorState((prev) => ({ ...prev, clientInfo: { ...prev.clientInfo, [field]: value } }));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSectorState((prev) => ({ ...prev, sections: prev.sections.map((s) => s.id === id ? { ...s, ...updates } : s) }));
  };

  const deleteSection = (id: string) => {
    setSectorState((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
      questions: prev.questions.filter((q) => q.sectionId !== id),
    }));
  };

  const addSection = () => {
    const id = `s-${Date.now()}`;
    setSectorState((prev) => ({ ...prev, sections: [...prev.sections, { id, title: 'New Section', isExpanded: true }] }));
  };

  const addQuestion = (sectionId?: string) => {
    setSectorState((prev) => {
      const maxNum = prev.questions.reduce((m, q) => Math.max(m, q.number), 0);
      const newQ: Question = {
        id: `q-${Date.now()}`, number: maxNum + 1, text: 'New question...', type: 'Text', required: false, sectionId,
      };
      return { ...prev, questions: [...prev.questions, newQ] };
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSectorState((prev) => ({ ...prev, questions: prev.questions.map((q) => q.id === id ? { ...q, ...updates } : q) }));
  };

  const deleteQuestion = (id: string) => {
    setSectorState((prev) => {
      const filtered = prev.questions.filter((q) => q.id !== id);
      return { ...prev, questions: filtered.map((q, i) => ({ ...q, number: i + 1 })) };
    });
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    setSectorState((prev) => {
      const qs = [...prev.questions];
      const idx = qs.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= qs.length) return prev;
      [qs[idx], qs[targetIdx]] = [qs[targetIdx], qs[idx]];
      return { ...prev, questions: qs.map((q, i) => ({ ...q, number: i + 1 })) };
    });
  };

  // drag-and-drop
  const handleDragStart = (_e: React.DragEvent, id: string) => setDraggedQId(id);
  const handleDragOver = (e: React.DragEvent, _id: string) => { e.preventDefault(); };
  const handleDrop = (_e: React.DragEvent, targetId: string) => {
    if (!draggedQId || draggedQId === targetId) return;
    setSectorState((prev) => {
      const qs = [...prev.questions];
      const fromIdx = qs.findIndex((q) => q.id === draggedQId);
      const toIdx = qs.findIndex((q) => q.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = qs.splice(fromIdx, 1);
      qs.splice(toIdx, 0, moved);
      return { ...prev, questions: qs.map((q, i) => ({ ...q, number: i + 1 })) };
    });
    setDraggedQId(null);
  };

  const activeSector = SECTORS.find((s) => s.id === activeSectorId);

  // ── RENDER: Project list ───────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-10 text-foreground pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-extrabold tracking-tight">Questionnaire Builder</h1>
            <p className="text-muted-foreground mt-1.5 font-medium">Build and manage sector-specific technical questionnaires for clients.</p>
          </motion.div>
          {canEdit && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Button onClick={() => setNewProjectOpen(true)} className="h-10 rounded-xl px-5 font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            </motion.div>
          )}
        </div>

        {loadingProjects ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => <div key={i} className="h-48 glass rounded-3xl animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center glass rounded-3xl border-dashed border-2 border-border/50">
            <ClipboardList className="w-12 h-12 text-foreground opacity-20 mb-4" />
            <p className="text-lg font-bold text-foreground mb-1">No questionnaire projects yet</p>
            <p className="text-sm font-medium text-muted-foreground mb-6 max-w-sm">Create your first sector questionnaire to get started building discovery documents.</p>
            {canEdit && <Button onClick={() => setNewProjectOpen(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Create Project</Button>}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((p, index) => {
                const sector = SECTORS.find((s) => s.id === p.sector);
                const colorClass = SECTOR_COLORS[p.sector] ?? 'bg-secondary text-secondary-foreground border-border';
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group"
                  >
                    <div
                      onClick={() => openProject(p.id)}
                      className="glass rounded-3xl p-6 h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-glass-border hover:border-primary/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                          <FileText className="w-6 h-6" />
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-white/10 transition-colors">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-border/50 rounded-2xl shadow-xl w-40">
                              <DropdownMenuItem onClick={() => openProject(p.id)} className="cursor-pointer font-medium py-2 rounded-xl hover:bg-white/5">
                                <FolderOpen className="w-4 h-4 mr-2" /> Open
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer font-medium py-2 rounded-xl focus:bg-red-500/10" onClick={() => deleteProject(p.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold leading-tight mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      
                      <div className="mb-6 flex">
                        <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${colorClass}`}>
                          {sector?.name ?? p.sector}
                        </Badge>
                      </div>

                      <div className="mt-auto space-y-2.5 bg-muted/10 p-3.5 rounded-2xl">
                        {p.companyName && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Building2 className="w-4 h-4 flex-shrink-0 text-foreground/50" />
                            <span className="truncate">{p.companyName}</span>
                          </div>
                        )}
                        {p.contactPerson && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <User2 className="w-4 h-4 flex-shrink-0 text-foreground/50" />
                            <span className="truncate">{p.contactPerson}</span>
                          </div>
                        )}
                        {p.location && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0 text-foreground/50" />
                            <span className="truncate">{p.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground pt-4 mt-4 border-t border-border/30">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Updated {format(new Date(p.updatedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* New Project Dialog */}
        <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
          <DialogContent className="max-w-2xl glass border-border/50 rounded-3xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">New Questionnaire Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Name</Label>
                <Input
                  placeholder="e.g. Waaree Energies — Pharma Water Treatment"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  autoFocus
                  className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 text-base"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Sector</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SECTORS.map((s) => (
                    <button key={s.id} type="button"
                      className={`text-left p-4 rounded-2xl border transition-all duration-200 ${newProjectSector === s.id ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.15)]' : 'border-border/50 bg-background/30 hover:border-primary/40 hover:bg-white/5'}`}
                      onClick={() => setNewProjectSector(s.id)}
                    >
                      <div className={`font-bold ${newProjectSector === s.id ? 'text-primary' : 'text-foreground'}`}>{s.name}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1 leading-snug">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button variant="ghost" onClick={() => setNewProjectOpen(false)} className="rounded-xl font-semibold h-12">Cancel</Button>
              <Button onClick={createProject} disabled={!newProjectName.trim()} className="rounded-xl font-bold h-12 shadow-lg hover:scale-105 active:scale-95 transition-all">Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── RENDER: Builder ────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left sidebar: client info + sector */}
      <div className="w-80 flex-shrink-0 flex flex-col z-10 glass rounded-r-3xl my-4 ml-4 overflow-hidden border border-glass-border shadow-xl">
        <div className="p-5 border-b border-border/50 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => { setView('list'); loadProjects(); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate text-foreground leading-tight">{projectName || 'Questionnaire Builder'}</h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{activeSector?.name}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Information</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Company Name</Label>
                  <Input disabled={!canEdit} className="h-9 rounded-lg bg-background/50 border-border/50" placeholder="Company name..." value={sectorState.clientInfo.companyName} onChange={(e) => updateClientInfo('companyName', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Contact Person</Label>
                  <Input disabled={!canEdit} className="h-9 rounded-lg bg-background/50 border-border/50" placeholder="Name & designation..." value={sectorState.clientInfo.contactPerson} onChange={(e) => updateClientInfo('contactPerson', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Location</Label>
                  <Input disabled={!canEdit} className="h-9 rounded-lg bg-background/50 border-border/50" placeholder="City, State..." value={sectorState.clientInfo.location} onChange={(e) => updateClientInfo('location', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Date</Label>
                  <Input disabled={!canEdit} className="h-9 rounded-lg bg-background/50 border-border/50" type="date" value={sectorState.clientInfo.date} onChange={(e) => updateClientInfo('date', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Sector switcher */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sector</h3>
              <div className="space-y-1.5">
                {SECTORS.map((s) => (
                  <button key={s.id} type="button"
                    disabled={!canEdit}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all font-medium ${activeSectorId === s.id ? 'bg-primary text-white shadow-md' : 'hover:bg-white/10 text-foreground'} ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={() => { if (activeSectorId !== s.id) { setActiveSectorId(s.id); setSectorState(initState(s.id)); } }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className="p-5 border-t border-border/50 space-y-3 bg-white/5 backdrop-blur-md">
          <Button className="w-full h-11 rounded-xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 mr-2" /> Preview & Export PDF
          </Button>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 h-11 rounded-xl font-semibold" onClick={saveProject} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold border-dashed hover:border-primary/50 hover:bg-primary/5" onClick={addSection}>
                <Plus className="w-4 h-4 mr-2" /> Section
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main builder area */}
      <ScrollArea className="flex-1 pb-20">
        <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="flex items-center justify-between glass rounded-3xl p-6 md:px-10 border border-border/50 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold">{activeSector?.name ?? activeSectorId} Questionnaire</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">{sectorState.questions.length} questions across {sectorState.sections.length} sections</p>
            </div>
            {canEdit && (
              <Button variant="outline" onClick={() => addQuestion(undefined)} className="h-10 rounded-xl font-bold border-border/50 shadow-sm hover:scale-[1.02] transition-transform">
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            )}
          </div>

          {sectorState.sections.length === 0 && sectorState.questions.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl glass">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-lg font-bold text-foreground">No sections yet</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Click "Add Section" in the sidebar to start building.</p>
            </div>
          )}

          {sectorState.sections.map((section) => {
            const sectionQuestions = sectorState.questions
              .filter((q) => q.sectionId === section.id)
              .sort((a, b) => a.number - b.number);
            const allQs = sectorState.questions;
            return (
              <div key={section.id} className="glass rounded-3xl border border-border/50 shadow-sm overflow-hidden mb-8">
                <SectionBlock
                  section={section}
                  questions={sectionQuestions}
                  onUpdateSection={updateSection}
                  onDeleteSection={deleteSection}
                  onAddQuestion={addQuestion}
                  onUpdateQuestion={updateQuestion}
                  onDeleteQuestion={deleteQuestion}
                  onMoveQuestionUp={(id) => { const idx = allQs.findIndex((q) => q.id === id); if (idx > 0) moveQuestion(id, 'up'); }}
                  onMoveQuestionDown={(id) => { const idx = allQs.findIndex((q) => q.id === id); if (idx < allQs.length - 1) moveQuestion(id, 'down'); }}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  canEdit={canEdit}
                />
              </div>
            );
          })}

          {/* Unsectioned questions */}
          {sectorState.questions.filter((q) => !q.sectionId).length > 0 && (
            <div className="glass border border-border/50 rounded-3xl shadow-sm overflow-hidden mb-8">
              <div className="bg-secondary/30 p-4 px-6 border-b border-border/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Other Questions</h3>
              </div>
              <div className="p-6 space-y-4 bg-muted/5">
                {sectorState.questions.filter((q) => !q.sectionId).sort((a, b) => a.number - b.number).map((q, idx, arr) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    index={idx}
                    totalQuestions={arr.length}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    onMoveUp={(id) => moveQuestion(id, 'up')}
                    onMoveDown={(id) => moveQuestion(id, 'down')}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sectorName={activeSector?.name ?? activeSectorId}
        clientInfo={sectorState.clientInfo}
        questions={sectorState.questions}
        sections={sectorState.sections}
      />
    </div>
  );
}
