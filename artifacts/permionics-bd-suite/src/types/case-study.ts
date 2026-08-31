export interface ResultCard {
  number: string;
  label: string;
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
    "Multi-stage Brackish Water RO\nLow Fouling RO Membranes\nPre-treatment System\nZero Liquid Discharge (ZLD)\nPLC-controlled SCADA\nRemote Plant Monitoring",
  delivery:
    "Build-Own-Operate (BOO). Permionics owns and operates the plant; treated water is metered and sold to 150 member industries through a dedicated pipeline.",
  operations:
    "Fully trained manpower, 24/7. Automated PLC-SCADA control. Plant analytics accessible remotely.",

  intro:
    "Nandesari Industrial Estate in Gujarat is home to 150 chemical and pharmaceutical production units operating under the Nandesari Industries Association (NIA). Over time, industrial wastewater intrusion into the estate's shared borewells had driven feed water TDS to 5,000 PPM, causing widespread production quality failures across member units.\n\nNIA approached Permionics to design and operate a centralised water treatment solution capable of purifying contaminated groundwater at scale and redistributing clean, process-grade water to all 150 member units.",
  plantCap:
    "The 20 MLD reverse osmosis plant installed and operated by Permionics at Nandesari.",
  challengeProblem:
    "Industrial effluent intrusion had contaminated shared groundwater across the entire estate, raising TDS to 5,000 PPM — 25 times the acceptable threshold for industrial process use (<200 PPM).",
  challengeLimits:
    "No centralised treatment infrastructure existed. The scale of contamination required a high-recovery system capable of handling variable feed quality.",
  solDesign:
    "Permionics deployed a multi-stage brackish water RO system with pre-treatment, configured to handle a 24 MLD feed and deliver 20 MLD of purified permeate at <200 PPM TDS.",
  solAuto:
    "The plant is fully automated via a PLC-controlled SCADA system with remote monitoring capability.",
  solBOO:
    "Rather than a one-time EPC handover, Permionics owns and operates the plant. Treated water is metered and sold to all 150 NIA member industries through a dedicated pipeline network.",
  handshakeCap:
    "Partnership agreement between Permionics and the Nandesari Industries Association (NIA), Gujarat.",

  cards: [
    { number: "96%", label: "TDS REDUCTION\n5,000 → <200 PPM" },
    { number: "95%+", label: "WATER RECOVERY\nSUSTAINED CONTINUOUSLY" },
    { number: "150", label: "INDUSTRIES SERVED\nVIA METERED PIPELINE" },
    { number: "20 MLD", label: "PERMEATE CAPACITY\nGUJARAT'S LARGEST" },
  ],
  waterData:
    "Feed Flow Rate|MLD|24|20\nTotal Dissolved Solids|ppm|5,000|<200\nSuspended Solids|ppm|25|Nil\nTotal Hardness (as CaCO3)|ppm|<2,000|<50\nCOD|ppm|<100|Nil\nTurbidity|NTU|<10|Nil\npH (at 32C)|--|7.11|6.5-7.0",
  perfStab:
    "95%+ water recovery, sustained continuously\nSCADA automation maintains consistent outlet quality\nRemote monitoring enables real-time fault detection",
  valueDel:
    "96% TDS reduction (5,000 PPM to <200 PPM)\nCOD, suspended solids, turbidity reduced to nil\n150 units freed from individual treatment CAPEX",
  envImpact:
    "No untreated industrial effluent discharged to groundwater or surface bodies. Purified water returned to process, completing the loop.",
  beakersCap:
    "Feed water (left, orange-tinted, 5,000 PPM TDS) vs. Permionics-treated permeate (right, transparent, <200 PPM TDS).",
  fig1text:
    "The before-and-after comparison captures the scale of the challenge and the precision of the solution. Feed water drawn from contaminated borewells was visually turbid while the Permionics-treated permeate is fully transparent.",
  conclusions:
    "Gujarat's largest industrial water reuse project demonstrates that centralised, shared water infrastructure engineered and operated by a specialist is the most efficient path to estate-wide water quality compliance.",

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

export interface SavedCaseStudy extends CaseStudyData {
  id: string;
  lastModified: number;
}
