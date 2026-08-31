// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { CaseStudyData, PhotoConfig, Palette, PALETTES } from "../creator_types";

interface Props {
  data: CaseStudyData;
  palette: string;
  onPaletteChange: (p: string) => void;
  onChange: (data: CaseStudyData) => void;
  onPrint: () => void;
  onBack: () => void;
  saved: boolean;
  onSaveNow: () => void;
  editableMode: boolean;
  onToggleEditable: () => void;
  projectName: string;
  onPublishToLibrary?: () => void;
  isPublishing?: boolean;
}

type Tab = "client" | "content" | "data" | "images" | "style";

const FIT_OPTS: { value: PhotoConfig["fit"]; label: string }[] = [
  { value: "cover", label: "Cover (crop to fill)" },
  { value: "contain", label: "Contain (show all)" },
  { value: "fill", label: "Stretch to fill" },
];

const POS_OPTS = [
  { value: "center", label: "Centre" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top left", label: "Top-left" },
  { value: "top right", label: "Top-right" },
  { value: "bottom left", label: "Bottom-left" },
  { value: "bottom right", label: "Bottom-right" },
];

export function Sidebar({ data, palette, onPaletteChange, onChange, onPrint, onBack, saved, onSaveNow, editableMode, onToggleEditable, projectName, onPublishToLibrary, isPublishing }: Props) {
  const [tab, setTab] = useState<Tab>("client");
  const plantRef = useRef<HTMLInputElement>(null);
  const handshakeRef = useRef<HTMLInputElement>(null);
  const beakersRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaseStudyData>(key: K, value: CaseStudyData[K]) => {
    const patch: any = { [key]: value };
    // Synchronize to dynamic siteInfoFields if the user edits the main fields
    if (data.siteInfoFields) {
      const idx = data.siteInfoFields.findIndex(f => f.id === key);
      if (idx !== -1) {
        const fields = [...data.siteInfoFields];
        fields[idx] = { ...fields[idx], value: String(value) };
        patch.siteInfoFields = fields;
      }
    }
    onChange({ ...data, ...patch });
  };

  const updateSiteInfoField = (idx: number, patch: Partial<any>) => {
    const fields = [...(data.siteInfoFields || [])];
    fields[idx] = { ...fields[idx], ...patch };
    onChange({ ...data, siteInfoFields: fields });
  };

  const deleteSiteInfoField = (idx: number) => {
    const fields = (data.siteInfoFields || []).filter((_, i) => i !== idx);
    onChange({ ...data, siteInfoFields: fields });
  };

  const addSiteInfoField = () => {
    const fields = [...(data.siteInfoFields || [])];
    fields.push({
      id: `custom_${Date.now()}`,
      label: "Custom Field:",
      value: "Value",
      visible: true
    });
    onChange({ ...data, siteInfoFields: fields });
  };

  const setCfg = (
    field: "plantImgCfg" | "handshakeImgCfg" | "beakersImgCfg",
    patch: Partial<PhotoConfig>
  ) => onChange({ ...data, [field]: { ...data[field], ...patch } });

  const setCard = (idx: number, f: keyof typeof data.cards[0], value: string) => {
    const cards = [...data.cards];
    cards[idx] = { ...cards[idx], [f]: value };
    onChange({ ...data, cards });
  };

  const handleImg = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "plantImg" | "handshakeImg" | "beakersImg"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ ...data, [field]: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "client", label: "Client" },
    { id: "content", label: "Content" },
    { id: "data", label: "Data" },
    { id: "images", label: "Images" },
    { id: "style", label: "Style" },
  ];

  const inp = "w-full text-[11px] px-2 py-1.5 border border-border rounded-md bg-card text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const ta = inp + " resize-y font-mono";
  const lbl = "text-[10px] font-medium text-muted-foreground mb-0.5 block";
  const sec = "text-[9px] font-semibold uppercase tracking-widest text-primary border-b-2 border-primary pb-1 mt-3 mb-2";
  const sel = inp + " cursor-pointer";

  function PhotoControls({
    label,
    imgField,
    cfgField,
    inputRef,
  }: {
    label: string;
    imgField: "plantImg" | "handshakeImg" | "beakersImg";
    cfgField: "plantImgCfg" | "handshakeImgCfg" | "beakersImgCfg";
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) {
    const cfg = data[cfgField];
    const img = data[imgField];
    return (
      <div className="border border-border rounded-lg p-2.5 flex flex-col gap-2 bg-card">
        <div className="text-[10px] font-semibold text-foreground">{label}</div>
        <div
          className="relative border-2 border-dashed border-border rounded-lg p-2 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImg(e, imgField)} />
          {img ? (
            <div>
              <img src={img} alt="preview" className="mx-auto object-cover rounded mb-1" style={{ height: "56px", width: "100%", objectFit: "cover" }} />
              <span className="text-[10px] text-primary font-medium">Click to change</span>
            </div>
          ) : (
            <div className="py-1">
              <div className="text-muted-foreground text-[10px] mb-0.5">No photo yet</div>
              <span className="text-[10px] text-primary font-medium">Click to upload</span>
            </div>
          )}
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className={lbl + " mb-0"}>Height</span>
            <span className="text-[10px] font-semibold text-primary">{cfg.height}px</span>
          </div>
          <input type="range" min={60} max={360} step={10} value={cfg.height} onChange={(e) => setCfg(cfgField, { height: Number(e.target.value) })} className="w-full accent-primary cursor-pointer" />
          <div className="flex justify-between text-[9px] text-muted-foreground -mt-0.5"><span>60px</span><span>360px</span></div>
        </div>
        <div>
          <label className={lbl}>Fit mode</label>
          <select className={sel} value={cfg.fit} onChange={(e) => setCfg(cfgField, { fit: e.target.value as PhotoConfig["fit"] })}>
            {FIT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {cfg.fit === "cover" && (
          <div>
            <label className={lbl}>Crop anchor</label>
            <select className={sel} value={cfg.position} onChange={(e) => setCfg(cfgField, { position: e.target.value })}>
              {POS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        {img && (
          <div className="rounded overflow-hidden border border-gray-200" style={{ height: `${Math.min(cfg.height, 100)}px` }}>
            <img src={img} alt="preview" style={{ width: "100%", height: "100%", objectFit: cfg.fit, objectPosition: cfg.position }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ width: "300px", minWidth: "300px" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-3.5 py-3" style={{ background: "#003466" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "5px", color: "#7ec8e3", fontSize: "10px", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "6px" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All Projects
        </button>
        <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "#7ec8e3" }}>Permionics</div>
        <div className="text-sm font-medium text-white truncate" style={{ maxWidth: "260px" }}>{projectName || "Case Study Generator"}</div>
        <div className="text-[10px] mt-1" style={{ color: "#BDD5F0" }}>
          {saved ? "All changes saved" : "Unsaved changes"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0 border-b border-border bg-muted/40 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[10px] font-medium border-b-2 transition-colors whitespace-nowrap px-1 border-0 cursor-pointer ${tab === t.id ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {/* CLIENT TAB */}
        {tab === "client" && <>
          <div className={sec}>Client &amp; Project</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Client / Project Name *</label><input className={inp} value={data.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Nandesari Industries Association (NIA)" /></div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-1"><label className={lbl}>Sector *</label><input className={inp} value={data.sector} onChange={(e) => set("sector", e.target.value)} placeholder="API & Chemical" /></div>
            <div className="flex flex-col gap-1"><label className={lbl}>Location *</label><input className={inp} value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="Gujarat, India" /></div>
          </div>
          <div className="flex flex-col gap-1"><label className={lbl}>Case Study Title *</label><input className={inp} value={data.csTitle} onChange={(e) => set("csTitle", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Title highlight (must match start of title)</label><input className={inp} value={data.titleHL} onChange={(e) => set("titleHL", e.target.value)} placeholder="Gujarat's Largest" /></div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-1"><label className={lbl}>Application</label><input className={inp} value={data.application} onChange={(e) => set("application", e.target.value)} /></div>
            <div className="flex flex-col gap-1"><label className={lbl}>Capacity</label><input className={inp} value={data.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
          </div>
          <div className="flex flex-col gap-1"><label className={lbl}>Stat bar headline</label><input className={inp} value={data.statBar} onChange={(e) => set("statBar", e.target.value)} /></div>

          {/* CUSTOM SITE INFORMATION CONFIGURATION */}
          <div className={sec} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Site Info Fields</span>
            <button 
              type="button" 
              onClick={addSiteInfoField}
              className="text-[9px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded cursor-pointer"
            >
              + Add Field
            </button>
          </div>
          <div className="flex flex-col gap-3.5 border border-border/80 p-3 rounded-lg bg-muted/10">
            {(data.siteInfoFields || []).map((field, idx) => (
              <div key={field.id} className="flex flex-col gap-1.5 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id={`vis-${field.id}`}
                      checked={field.visible} 
                      onChange={(e) => updateSiteInfoField(idx, { visible: e.target.checked })} 
                      className="cursor-pointer h-3.5 w-3.5"
                    />
                    <label htmlFor={`vis-${field.id}`} className="text-[10px] font-semibold text-muted-foreground uppercase cursor-pointer select-none">Show on study</label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => deleteSiteInfoField(idx)}
                    className="text-[10px] text-destructive hover:text-destructive/80 font-bold bg-transparent border-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className={lbl}>Field Name</label>
                    <input className={inp} value={field.label} onChange={(e) => updateSiteInfoField(idx, { label: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className={lbl}>Value</label>
                    <input className={inp} value={field.value} onChange={(e) => updateSiteInfoField(idx, { value: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={sec}>Sidebar Bullets</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Key outcome bullets (one per line)</label><textarea className={ta} rows={5} value={data.sidebarBullets} onChange={(e) => set("sidebarBullets", e.target.value)} /></div>

          {/* EDITABLE/TOGGLEABLE SIDEBAR SECTIONS */}
          <div className={sec}>Custom Sections</div>
          
          {/* Technologies Used Section */}
          <div className="border border-border p-2 rounded mb-1 bg-card flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                id="sec-tech-show"
                checked={data.showTech ?? true} 
                onChange={(e) => set("showTech", e.target.checked)} 
                className="cursor-pointer"
              />
              <label htmlFor="sec-tech-show" className="text-[10px] font-bold text-foreground cursor-pointer select-none">Show Technologies</label>
            </div>
            {(data.showTech ?? true) && (
              <div className="flex flex-col gap-1">
                <label className={lbl}>Section Title</label>
                <input className={inp} value={data.techLabel || "Technologies Used"} onChange={(e) => set("techLabel", e.target.value)} />
                <label className={lbl}>Items (one per line)</label>
                <textarea className={ta} rows={4} value={data.techList} onChange={(e) => set("techList", e.target.value)} />
              </div>
            )}
          </div>

          {/* Delivery Model Section */}
          <div className="border border-border p-2 rounded mb-1 bg-card flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                id="sec-del-show"
                checked={data.showDelivery ?? true} 
                onChange={(e) => set("showDelivery", e.target.checked)} 
                className="cursor-pointer"
              />
              <label htmlFor="sec-del-show" className="text-[10px] font-bold text-foreground cursor-pointer select-none">Show Delivery Model</label>
            </div>
            {(data.showDelivery ?? true) && (
              <div className="flex flex-col gap-1">
                <label className={lbl}>Section Title</label>
                <input className={inp} value={data.deliveryLabel || "Delivery Model"} onChange={(e) => set("deliveryLabel", e.target.value)} />
                <label className={lbl}>Description</label>
                <textarea className={ta} rows={3} value={data.delivery} onChange={(e) => set("delivery", e.target.value)} />
              </div>
            )}
          </div>

          {/* Operations Section */}
          <div className="border border-border p-2 rounded mb-1 bg-card flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                id="sec-op-show"
                checked={data.showOperations ?? true} 
                onChange={(e) => set("showOperations", e.target.checked)} 
                className="cursor-pointer"
              />
              <label htmlFor="sec-op-show" className="text-[10px] font-bold text-foreground cursor-pointer select-none">Show Operations</label>
            </div>
            {(data.showOperations ?? true) && (
              <div className="flex flex-col gap-1">
                <label className={lbl}>Section Title</label>
                <input className={inp} value={data.operationsLabel || "Operations"} onChange={(e) => set("operationsLabel", e.target.value)} />
                <label className={lbl}>Description</label>
                <textarea className={ta} rows={3} value={data.operations} onChange={(e) => set("operations", e.target.value)} />
              </div>
            )}
          </div>

          <div className={sec}>Header &amp; Footer</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Category label (header banner)</label><input className={inp} value={data.categoryLabel} onChange={(e) => set("categoryLabel", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Company name</label><input className={inp} value={data.companyName} onChange={(e) => set("companyName", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Website</label><input className={inp} value={data.website} onChange={(e) => set("website", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Division</label><input className={inp} value={data.division} onChange={(e) => set("division", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Regions</label><input className={inp} value={data.regions} onChange={(e) => set("regions", e.target.value)} /></div>
        </>}

        {/* CONTENT TAB */}
        {tab === "content" && <>
          <div className={sec}>Introduction</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Introduction paragraph(s) — blank line = new paragraph *</label><textarea className={ta} rows={6} value={data.intro} onChange={(e) => set("intro", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Plant image caption</label><input className={inp} value={data.plantCap} onChange={(e) => set("plantCap", e.target.value)} /></div>
          <div className={sec}>The Challenge</div>
          <div className="flex flex-col gap-1"><label className={lbl}>The Problem paragraph *</label><textarea className={ta} rows={4} value={data.challengeProblem} onChange={(e) => set("challengeProblem", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Existing Limitations paragraph</label><textarea className={ta} rows={3} value={data.challengeLimits} onChange={(e) => set("challengeLimits", e.target.value)} /></div>
          <div className={sec}>Technical Solution</div>
          <div className="flex flex-col gap-1"><label className={lbl}>System Design paragraph *</label><textarea className={ta} rows={3} value={data.solDesign} onChange={(e) => set("solDesign", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Automation &amp; Control paragraph</label><textarea className={ta} rows={3} value={data.solAuto} onChange={(e) => set("solAuto", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Delivery Model paragraph</label><textarea className={ta} rows={3} value={data.solBOO} onChange={(e) => set("solBOO", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Partnership image caption</label><input className={inp} value={data.handshakeCap} onChange={(e) => set("handshakeCap", e.target.value)} /></div>
        </>}

        {/* DATA TAB */}
        {tab === "data" && <>
          <div className={sec}>Result Cards (up to 4)</div>
          {data.cards.map((card, i) => (
            <div key={i} className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-1"><label className={lbl}>Card {i + 1} — Number</label><input className={inp} value={card.number} onChange={(e) => setCard(i, "number", e.target.value)} /></div>
              <div className="flex flex-col gap-1"><label className={lbl}>Card {i + 1} — Label (↵ = new line)</label><textarea className={ta} rows={2} value={card.label} onChange={(e) => setCard(i, "label", e.target.value)} /></div>
            </div>
          ))}
          <div className={sec}>Water Quality Table</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Rows: Parameter | Unit | Feed | Treated (one per line)</label><textarea className={ta} rows={10} value={data.waterData} onChange={(e) => set("waterData", e.target.value)} /></div>
          <div className={sec}>Page 2 Sidebar</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Performance Stability bullets (one per line)</label><textarea className={ta} rows={4} value={data.perfStab} onChange={(e) => set("perfStab", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Value Delivered bullets (one per line)</label><textarea className={ta} rows={4} value={data.valueDel} onChange={(e) => set("valueDel", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Environmental Impact</label><textarea className={ta} rows={2} value={data.envImpact} onChange={(e) => set("envImpact", e.target.value)} /></div>
          <div className={sec}>Conclusions</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Beakers image caption</label><input className={inp} value={data.beakersCap} onChange={(e) => set("beakersCap", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Figure 1 text</label><textarea className={ta} rows={4} value={data.fig1text} onChange={(e) => set("fig1text", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Conclusions paragraph</label><textarea className={ta} rows={5} value={data.conclusions} onChange={(e) => set("conclusions", e.target.value)} /></div>
        </>}

        {/* IMAGES TAB */}
        {tab === "images" && <>
          <div className={sec}>Photo Settings</div>
          <p className="text-[10px] text-gray-500 leading-relaxed">Upload each photo then adjust height, fit mode, and crop anchor.</p>
          <PhotoControls label="Plant / Facility Photo" imgField="plantImg" cfgField="plantImgCfg" inputRef={plantRef} />
          <PhotoControls label="Partnership / Client Photo" imgField="handshakeImg" cfgField="handshakeImgCfg" inputRef={handshakeRef} />
          <PhotoControls label="Before / After Beakers Photo" imgField="beakersImg" cfgField="beakersImgCfg" inputRef={beakersRef} />
        </>}

        {/* STYLE TAB */}
        {tab === "style" && <>
          <div className={sec}>Colour Palette</div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-1">Choose a colour scheme for the case study. Changes are reflected instantly in the preview.</p>
          <div className="flex flex-col gap-2">
            {PALETTES.map((p: Palette) => (
              <button
                key={p.id}
                onClick={() => onPaletteChange(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  border: palette === p.id ? `2px solid ${p.accent}` : "2px solid var(--border)",
                  borderRadius: "8px",
                  background: palette === p.id ? p.light : "var(--card)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: p.primary, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: p.accent, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: p.light, border: "1px solid rgba(0,0,0,0.1)" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: palette === p.id ? 700 : 500, color: palette === p.id ? p.primary : "var(--foreground)" }}>{p.name}</div>
                </div>
                {palette === p.id && (
                  <div style={{ marginLeft: "auto" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className={sec} style={{ marginTop: "16px" }}>Inline Editing</div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-1">When click-to-edit is on, you can click directly on text in the preview to edit it in place.</p>
          <button
            onClick={onToggleEditable}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              border: editableMode ? "2px solid #f59e0b" : "2px solid var(--border)",
              borderRadius: "8px",
              background: editableMode ? "#fef3c7" : "var(--card)",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: editableMode ? "#92400e" : "var(--foreground)" }}>
              Click-to-edit mode
            </span>
            <div style={{
              width: "36px", height: "20px", borderRadius: "10px",
              background: editableMode ? "#f59e0b" : "#d1d5db",
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: "3px",
                left: editableMode ? "18px" : "3px",
                width: "14px", height: "14px", borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
          </button>
        </>}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-border flex flex-col gap-2 bg-muted/40">
        <button
          onClick={onPrint}
          className="w-full flex items-center justify-center gap-2 text-white text-[12px] font-medium py-2 px-4 rounded-md transition-colors hover:opacity-90 border-0 cursor-pointer animate-none"
          style={{ background: "var(--primary)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Save as PDF
        </button>

        {onPublishToLibrary && (
          <button
            onClick={onPublishToLibrary}
            disabled={isPublishing}
            className="w-full flex items-center justify-center gap-2 text-white text-[12px] font-semibold py-2 px-4 rounded-md transition-colors hover:opacity-90 bg-emerald-600 disabled:bg-emerald-600/40"
          >
            {isPublishing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Publish to Library
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
