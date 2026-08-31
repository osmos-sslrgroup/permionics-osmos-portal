export interface SidebarField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
}

export interface ResultCard {
  number: string;
  label: string;
}

export interface WaterRow {
  parameter: string;
  unit: string;
  feed: string;
  treated: string;
}

export interface PhotoConfig {
  height: number;
  fit: "cover" | "contain" | "fill";
  position: string;
}

export interface CaseStudyData {
  clientName: string;
  sector: string;
  location: string;
  csTitle: string;
  titleHL: string;
  application: string;
  capacity: string;
  statBar: string;
  sidebarBullets: string;
  techList: string;
  delivery: string;
  operations: string;

  // Dynamic custom fields for left sidebar
  siteInfoFields?: SidebarField[];
  showTech?: boolean;
  techLabel?: string;
  showDelivery?: boolean;
  deliveryLabel?: string;
  showOperations?: boolean;
  operationsLabel?: string;

  companyName: string;
  website: string;
  categoryLabel: string;
  division: string;
  regions: string;

  intro: string;
  plantCap: string;
  challengeProblem: string;
  challengeLimits: string;
  solDesign: string;
  solAuto: string;
  solBOO: string;
  handshakeCap: string;

  cards: ResultCard[];
  waterData: string;
  perfStab: string;
  valueDel: string;
  envImpact: string;
  beakersCap: string;
  fig1text: string;
  conclusions: string;

  plantImg: string | null;
  handshakeImg: string | null;
  beakersImg: string | null;

  plantImgCfg: PhotoConfig;
  handshakeImgCfg: PhotoConfig;
  beakersImgCfg: PhotoConfig;
}

export interface Palette {
  id: string;
  name: string;
  primary: string;
  accent: string;
  light: string;
  lightBorder: string;
  highlight: string;
  headerCat: string;
  headerSub: string;
  sidebarBullet: string;
}

export const PALETTES: Palette[] = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primary: "#003466",
    accent: "#1a5fa8",
    light: "#f0f5fb",
    lightBorder: "#d0dcea",
    highlight: "#7ec8e3",
    headerCat: "#a8d4f0",
    headerSub: "#c8e0f4",
    sidebarBullet: "#1a5fa8",
  },
  {
    id: "herbal-green",
    name: "Herbal Green",
    primary: "#1a3a2a",
    accent: "#2d7a4a",
    light: "#f0f8f2",
    lightBorder: "#bcd8c8",
    highlight: "#86c99a",
    headerCat: "#a0d4b4",
    headerSub: "#c2e8d0",
    sidebarBullet: "#2d7a4a",
  },
  {
    id: "warm-terra",
    name: "Warm Terra",
    primary: "#4a1a08",
    accent: "#b84a14",
    light: "#fdf3ef",
    lightBorder: "#e8c8b8",
    highlight: "#f0a070",
    headerCat: "#f4b894",
    headerSub: "#f8d0b8",
    sidebarBullet: "#b84a14",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    primary: "#2d1558",
    accent: "#6b3fa0",
    light: "#f5f0fc",
    lightBorder: "#d8c8ef",
    highlight: "#c090e0",
    headerCat: "#d0aaf0",
    headerSub: "#e0c8f8",
    sidebarBullet: "#6b3fa0",
  },
  {
    id: "carbon-slate",
    name: "Carbon Slate",
    primary: "#1a2433",
    accent: "#3d5a7a",
    light: "#f0f4f8",
    lightBorder: "#c8d4e0",
    highlight: "#8ab0d0",
    headerCat: "#a0bcd4",
    headerSub: "#c0d4e8",
    sidebarBullet: "#3d5a7a",
  },
];

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export const DEFAULT_PHOTO_CFG: PhotoConfig = {
  height: 140,
  fit: "cover",
  position: "center",
};

export const DEFAULT_DATA: CaseStudyData = {
  clientName: "Nandesari Industries Association (NIA)",
  sector: "API & Chemical",
  location: "Nandesari, Gujarat, India",
  csTitle: "Gujarat's Largest Industrial Water Reuse Project",
  titleHL: "Gujarat's Largest",
  application: "Brackish Water RO, ZLD, BOO",
  capacity: "20 MLD permeate",
  statBar: "5,000 PPM → <200 PPM · 95% Recovery · 150 Industries · 1 Plant",
  sidebarBullets:
    "TDS reduced from 5,000 PPM to <200 PPM\n95%+ system recovery\n150 industries served via metered pipeline\n24/7 automated SCADA operation\nCOD and suspended solids reduced to nil",
  techList:
    "Multi-stage Brackish Water RO\nLow Fouling RO Membranes\nPre-treatment System\nZero Liquid Discharge (ZLD)\nPLC-controlled SCADA\nRemote Plant Monitoring\nDigital Twin (in progress)",
  delivery:
    "Build-Own-Operate (BOO). Permionics owns and operates the plant; treated water is metered and sold to 150 member industries through a dedicated pipeline.",
  operations:
    "Fully trained manpower, 24/7. Automated PLC-SCADA control. Plant analytics accessible remotely.",

  intro:
    "Nandesari Industrial Estate in Gujarat is home to 150 chemical and pharmaceutical production units operating under the Nandesari Industries Association (NIA). Over time, industrial wastewater intrusion into the estate's shared borewells had driven feed water TDS to 5,000 PPM, causing widespread production quality failures across member units. No individual unit had the scale or mandate to solve a shared infrastructure crisis on its own.\n\nNIA approached Permionics to design and operate a centralised water treatment solution capable of purifying contaminated groundwater at scale and redistributing clean, process-grade water to all 150 member units. Permionics responded with Gujarat's largest industrial water reuse project — a 20 MLD reverse osmosis plant engineered, built, and operated by Permionics under a full Build-Own-Operate (BOO) model.",
  plantCap:
    "The 20 MLD reverse osmosis plant installed and operated by Permionics at Nandesari. The SCADA-controlled system runs 24/7 and delivers purified water to 150 industrial units via metered pipeline.",
  challengeProblem:
    "Industrial effluent intrusion had contaminated shared groundwater across the entire estate, raising TDS to 5,000 PPM — 25 times the acceptable threshold for industrial process use (<200 PPM). Turbidity, hardness, silica, and COD were all elevated, causing quality rejections in pharmaceutical and chemical production lines. Because all 150 units drew from the same source, this was an estate-wide crisis, not an individual plant problem.",
  challengeLimits:
    "No centralised treatment infrastructure existed. The scale of contamination required a high-recovery system capable of handling variable feed quality, and any solution needed to serve the entire estate simultaneously, with guaranteed uptime and consistent permeate quality.",
  solDesign:
    "Permionics deployed a multi-stage brackish water RO system with pre-treatment, configured to handle a 24 MLD feed and deliver 20 MLD of purified permeate at <200 PPM TDS. The system uses Permionics' low fouling RO membranes, engineered for high-salinity, variable-quality industrial feed water.",
  solAuto:
    "The plant is fully automated via a PLC-controlled SCADA system with remote monitoring capability. This allows Permionics engineers to track performance, trigger alarms, and adjust operating parameters without on-site intervention, ensuring 24/7 uptime and consistent permeate quality.",
  solBOO:
    "Rather than a one-time EPC handover, Permionics owns and operates the plant. Treated water is metered and sold to all 150 NIA member industries through a dedicated pipeline network, eliminating individual CAPEX for each unit and creating a reliable, shared water utility.",
  handshakeCap:
    "Partnership agreement between Permionics and the Nandesari Industries Association (NIA), Gujarat — enabling Gujarat's largest industrial water reuse project under a Build-Own-Operate model.",

  cards: [
    { number: "96%", label: "TDS REDUCTION\n5,000 → <200 PPM" },
    { number: "95%+", label: "WATER RECOVERY\nSUSTAINED CONTINUOUSLY" },
    { number: "150", label: "INDUSTRIES SERVED\nVIA METERED PIPELINE" },
    { number: "20 MLD", label: "PERMEATE CAPACITY\nGUJARAT'S LARGEST" },
  ],
  waterData:
    "Feed Flow Rate|MLD|24|20\nTotal Dissolved Solids|ppm|5,000|<200\nSuspended Solids|ppm|25|Nil\nTotal Hardness (as CaCO3)|ppm|<2,000|<50\nSilica (as SiO2)|ppm|<44|<2\nCOD|ppm|<100|Nil\nTurbidity|NTU|<10|Nil\nColour|—|Tinge Yellow|Transparent White\npH (at 32°C)|—|7.11|6.5–7.0",
  perfStab:
    "95%+ water recovery, sustained continuously\nSCADA automation maintains consistent outlet quality despite feed variability\nRemote monitoring enables real-time fault detection without on-site dependency\nPlant moving toward digital twin for predictive maintenance",
  valueDel:
    "96% TDS reduction (5,000 PPM to <200 PPM)\nCOD, suspended solids, turbidity reduced to nil\n150 units freed from individual treatment CAPEX\nProcess-grade water recycled directly back into production\nClosed-loop supply eliminates untreated discharge to water bodies",
  envImpact:
    "No untreated industrial effluent discharged to groundwater or surface bodies. Purified water returned to process, completing the loop. Supports member industries' ZLD compliance objectives.",
  beakersCap:
    "Feed water (left, orange-tinted, 5,000 PPM TDS) vs. Permionics-treated permeate (right, transparent, <200 PPM TDS). Visual proof of the system's performance.",
  fig1text:
    "The before-and-after comparison captures the scale of the challenge and the precision of the solution. Feed water drawn from contaminated borewells was visually turbid, tinge-yellow, and laden with dissolved salts, hardness, silica, and organic load. The Permionics-treated permeate is fully transparent, with TDS below 200 PPM and suspended solids, COD, and turbidity reduced to nil.",
  conclusions:
    "Gujarat's largest industrial water reuse project demonstrates that centralised, shared water infrastructure — engineered and operated by a specialist — is the most efficient path to estate-wide water quality compliance. By deploying under a BOO model, Permionics eliminated the financial and technical burden from 150 individual units while delivering process-grade water reliably at scale. The 20 MLD RO plant at Nandesari remains a reference-grade installation for industrial water reuse across India.",

  companyName: "Permionics Membranes Pvt. Ltd.",
  website: "www.permionics.com",
  categoryLabel: "Case History | Water & Wastewater",
  division: "Water & Wastewater Division",
  regions: "India · Asia-Pacific · Global",

  plantImg: null,
  handshakeImg: null,
  beakersImg: null,

  plantImgCfg: { height: 160, fit: "cover", position: "center" },
  handshakeImgCfg: { height: 180, fit: "cover", position: "center" },
  beakersImgCfg: { height: 140, fit: "cover", position: "center" },
};

export function formatSectorDefault(sector?: string): string {
  if (!sector) return "";
  const s = sector.trim();
  if (/manufacturing/i.test(s)) return s;
  if (/water|waste|municipal|sewage|effluent|reuse/i.test(s)) return s;
  return s + " Manufacturing";
}

export function migrateCaseStudyData(raw: any): CaseStudyData {
  const d = { ...raw };
  if (!d.siteInfoFields) {
    d.siteInfoFields = [
      { id: "location", label: "Location:", value: d.location || "", visible: true },
      { id: "sector", label: "Industry:", value: formatSectorDefault(d.sector), visible: true },
      { id: "application", label: "Application:", value: d.application || "", visible: true },
      { id: "capacity", label: "Capacity:", value: d.capacity || "", visible: true },
      { id: "clientName", label: "Client:", value: d.clientName || "", visible: true },
    ];
  }
  if (d.showTech === undefined) d.showTech = true;
  if (d.techLabel === undefined) d.techLabel = "Technologies Used";
  if (d.showDelivery === undefined) d.showDelivery = true;
  if (d.deliveryLabel === undefined) d.deliveryLabel = "Delivery Model";
  if (d.showOperations === undefined) d.showOperations = true;
  if (d.operationsLabel === undefined) d.operationsLabel = "Operations";
  return d;
}
