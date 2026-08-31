import { useRef } from "react";
import { CaseStudyData, PhotoConfig, ResultCard } from "@/types/case-study";

interface Props {
  data: CaseStudyData;
  onChange: (data: CaseStudyData) => void;
  onPrint: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

type Tab = "client" | "content" | "data" | "images";

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

import { useState } from "react";

export function CaseStudySidebar({ data, onChange, onPrint, onSave, isSaving }: Props) {
  const [tab, setTab] = useState<Tab>("client");
  const plantRef = useRef<HTMLInputElement>(null);
  const handshakeRef = useRef<HTMLInputElement>(null);
  const beakersRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CaseStudyData>(key: K, value: CaseStudyData[K]) =>
    onChange({ ...data, [key]: value });

  const setCfg = (field: "plantImgCfg" | "handshakeImgCfg" | "beakersImgCfg", patch: Partial<PhotoConfig>) =>
    onChange({ ...data, [field]: { ...data[field], ...patch } });

  const setCard = (idx: number, f: keyof ResultCard, value: string) => {
    const cards = [...data.cards];
    cards[idx] = { ...cards[idx], [f]: value };
    onChange({ ...data, cards });
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>, field: "plantImg" | "handshakeImg" | "beakersImg") => {
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
  ];

  const inp = "w-full text-[11px] px-2 py-1.5 border border-border rounded-md bg-card text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const ta = inp + " resize-y font-mono";
  const lbl = "text-[10px] font-medium text-muted-foreground mb-0.5 block";
  const sec = "text-[9px] font-semibold uppercase tracking-widest text-primary border-b-2 border-primary pb-1 mt-3 mb-2";
  const sel = inp + " cursor-pointer";

  function PhotoControls({ label, imgField, cfgField, inputRef }: {
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
        <div className="relative border-2 border-dashed border-border rounded-lg p-2 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => inputRef.current?.click()}>
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
          <div className="rounded overflow-hidden border border-border" style={{ height: `${Math.min(cfg.height, 100)}px` }}>
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
        <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "#7ec8e3" }}>Permionics</div>
        <div className="text-sm font-medium text-white">Case Study Generator</div>
        <div className="text-[10px] mt-1" style={{ color: "#BDD5F0" }}>Fill all tabs → Print / Save PDF</div>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0 border-b border-border bg-muted/40">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[10px] font-medium border-b-2 transition-colors border-0 cursor-pointer ${tab === t.id ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

        {/* CLIENT TAB */}
        {tab === "client" && <>
          <div className={sec}>Client &amp; Project</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Client / Project Name *</label><input className={inp} value={data.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="e.g. Nandesari Industries Association (NIA)" /></div>
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
          <div className={sec}>Sidebar Bullets</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Key outcome bullets (one per line)</label><textarea className={ta} rows={5} value={data.sidebarBullets} onChange={(e) => set("sidebarBullets", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Technologies Used (one per line)</label><textarea className={ta} rows={5} value={data.techList} onChange={(e) => set("techList", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Delivery Model</label><textarea className={ta} rows={3} value={data.delivery} onChange={(e) => set("delivery", e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className={lbl}>Operations</label><textarea className={ta} rows={3} value={data.operations} onChange={(e) => set("operations", e.target.value)} /></div>
          <div className={sec}>Header &amp; Footer</div>
          <div className="flex flex-col gap-1"><label className={lbl}>Category label</label><input className={inp} value={data.categoryLabel} onChange={(e) => set("categoryLabel", e.target.value)} /></div>
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
              <div className="flex flex-col gap-1"><label className={lbl}>Card {i + 1} — Number</label><input className={inp} value={card.number} onChange={(e) => setCard(i, "number", e.target.value)} placeholder="96%" /></div>
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
          <p className="text-[10px] text-muted-foreground leading-relaxed">Upload each photo then adjust height, fit mode, and crop anchor to get the perfect look in the case study.</p>
          <PhotoControls label="Plant / Facility Photo" imgField="plantImg" cfgField="plantImgCfg" inputRef={plantRef} />
          <PhotoControls label="Partnership / Client Photo" imgField="handshakeImg" cfgField="handshakeImgCfg" inputRef={handshakeRef} />
          <PhotoControls label="Before / After Beakers Photo" imgField="beakersImg" cfgField="beakersImgCfg" inputRef={beakersRef} />
        </>}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-border bg-muted/40 flex flex-col gap-2">
        <button onClick={onSave} disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 text-primary text-[12px] font-medium py-2.5 px-4 rounded-md transition-colors bg-card border border-primary hover:bg-primary hover:text-white disabled:opacity-50 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
          </svg>
          {isSaving ? "Saving..." : "Save Draft (Local)"}
        </button>
        <button onClick={onPrint}
          className="w-full flex items-center justify-center gap-2 text-white text-[12px] font-medium py-2.5 px-4 rounded-md transition-colors hover:opacity-90 border-0 cursor-pointer"
          style={{ background: "var(--primary)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
