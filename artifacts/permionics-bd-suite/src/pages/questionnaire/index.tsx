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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { customFetch } from '@workspace/api-client-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Eye, Save, Loader2, FolderOpen, Trash2, MoreVertical, ClipboardList, ArrowLeft,
  Building2, User2, MapPin, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

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
  pharma:   'bg-violet-100 text-violet-800 border-violet-200',
  dairy:    'bg-blue-100 text-blue-800 border-blue-200',
  water:    'bg-cyan-100 text-cyan-800 border-cyan-200',
  food:     'bg-amber-100 text-amber-800 border-amber-200',
  textile:  'bg-rose-100 text-rose-800 border-rose-200',
  cetp:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  chemical: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function QuestionnairePage() {
  const { toast } = useToast();

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
      <div className="max-w-5xl mx-auto p-8 space-y-8 text-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Questionnaire Builder</h1>
            <p className="text-muted-foreground mt-1">Build and manage sector-specific technical questionnaires for clients.</p>
          </div>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-xl bg-muted/10">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground mb-2">No questionnaire projects yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create your first sector questionnaire to get started.</p>
            <Button onClick={() => setNewProjectOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Project</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => {
              const sector = SECTORS.find((s) => s.id === p.sector);
              const colorClass = SECTOR_COLORS[p.sector] ?? 'bg-secondary text-secondary-foreground border-border';
              return (
                <Card
                  key={p.id}
                  className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => openProject(p.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight truncate">{p.name}</CardTitle>
                        <Badge className={`mt-1.5 text-xs font-medium border ${colorClass}`} variant="outline">
                          {sector?.name ?? p.sector}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openProject(p.id); }}>
                            <FolderOpen className="w-4 h-4 mr-2" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5 pt-0">
                    {p.companyName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{p.companyName}</span>
                      </div>
                    )}
                    {p.contactPerson && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{p.contactPerson}</span>
                      </div>
                    )}
                    {p.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Updated {format(new Date(p.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Project Dialog */}
        <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Questionnaire Project</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  placeholder="e.g. Waaree Energies — Pharma Water Treatment"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SECTORS.map((s) => (
                    <button key={s.id} type="button"
                      className={`text-left p-3 rounded-lg border text-sm transition-colors ${newProjectSector === s.id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-primary/40'}`}
                      onClick={() => setNewProjectSector(s.id)}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewProjectOpen(false)}>Cancel</Button>
              <Button onClick={createProject} disabled={!newProjectName.trim()}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── RENDER: Builder ────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left sidebar: client info + sector */}
      <div className="w-72 border-r bg-muted/10 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setView('list'); loadProjects(); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{projectName || 'Questionnaire Builder'}</h2>
            <p className="text-xs text-muted-foreground">{activeSector?.name}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Client Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Information</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Company Name</Label>
                  <Input className="h-8 text-xs" placeholder="Company name..." value={sectorState.clientInfo.companyName} onChange={(e) => updateClientInfo('companyName', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contact Person</Label>
                  <Input className="h-8 text-xs" placeholder="Name & designation..." value={sectorState.clientInfo.contactPerson} onChange={(e) => updateClientInfo('contactPerson', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input className="h-8 text-xs" placeholder="City, State..." value={sectorState.clientInfo.location} onChange={(e) => updateClientInfo('location', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input className="h-8 text-xs" type="date" value={sectorState.clientInfo.date} onChange={(e) => updateClientInfo('date', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Sector switcher */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sector</h3>
              {SECTORS.map((s) => (
                <button key={s.id} type="button"
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${activeSectorId === s.id ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                  onClick={() => { if (activeSectorId !== s.id) { setActiveSectorId(s.id); setSectorState(initState(s.id)); } }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className="p-4 border-t space-y-2">
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 mr-2" /> Preview & Export PDF
          </Button>
          <Button size="sm" variant="secondary" className="w-full" onClick={saveProject} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Project
          </Button>
          <Button size="sm" variant="outline" className="w-full border-dashed" onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
        </div>
      </div>

      {/* Main builder area */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">{activeSector?.name ?? activeSectorId} Questionnaire</h1>
              <p className="text-sm text-muted-foreground">{sectorState.questions.length} questions across {sectorState.sections.length} sections</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => addQuestion(undefined)}>
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>

          {sectorState.sections.length === 0 && sectorState.questions.length === 0 && (
            <div className="text-center py-16 border border-dashed rounded-xl bg-card">
              <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No sections yet. Click "Add Section" to start building.</p>
            </div>
          )}

          {sectorState.sections.map((section) => {
            const sectionQuestions = sectorState.questions
              .filter((q) => q.sectionId === section.id)
              .sort((a, b) => a.number - b.number);
            const allQs = sectorState.questions;
            return (
              <SectionBlock
                key={section.id}
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
              />
            );
          })}

          {/* Unsectioned questions */}
          {sectorState.questions.filter((q) => !q.sectionId).length > 0 && (
            <div className="mt-4 bg-card border border-border rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="bg-secondary/30 p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-primary">Other Questions</h3>
              </div>
              <div className="p-4 space-y-3 bg-muted/5">
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
