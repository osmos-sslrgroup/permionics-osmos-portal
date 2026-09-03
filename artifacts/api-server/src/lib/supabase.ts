import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_KEY"];

const isConfigured = Boolean(supabaseUrl && supabaseServiceKey && !supabaseUrl.includes("your-project-ref"));

if (!isConfigured) {
  console.log("==========================================================================");
  console.log("ℹ️  NOTICE: SUPABASE_URL / SUPABASE_SERVICE_KEY not provided.");
  console.log("🚀 Running API Server in LOCAL IN-MEMORY MOCK DATABASE mode.");
  console.log("==========================================================================");
}

// Seed Data for Local In-Memory Mock Database Mode
const initialDb: Record<string, any[]> = {
  case_studies: [
    {
      id: 1,
      client_name: "Waaree Energies Ltd.",
      sector: "Industrial",
      location: "Surat, Gujarat",
      challenge: "Waaree Energies required high-purity process water for solar panel manufacturing. Existing municipal supply had TDS of 900-1200 mg/L with fluctuating quality, causing scaling on production equipment.",
      solution: "Permionics designed and commissioned a two-pass Reverse Osmosis system with an upstream Ultrafiltration pretreatment stage.",
      technology_stack: "UF + 2-Pass RO",
      capacity: "50 m3/day",
      results: "Output water TDS consistently below 10 mg/L (99%+ rejection). Equipment scaling eliminated. ROI achieved within 18 months.",
      testimonial: "The Permionics system has been running without any major issues for two years. Water quality is consistently excellent.",
      tags: ["Solar", "UF", "RO", "Process Water", "Industrial", "Gujarat"],
      full_text: "Waaree Energies solar panel manufacturing process water Surat Gujarat UF ultrafiltration RO reverse osmosis TDS scaling production",
      rich_data: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      client_name: "Nandesari CETP",
      sector: "CETP/Municipal",
      location: "Nandesari Industrial Estate, Vadodara, Gujarat",
      challenge: "The Nandesari Common Effluent Treatment Plant serves over 200 member industries with mixed chemical effluent. Legacy treatment system could not meet revised CPCB discharge norms.",
      solution: "Permionics designed a tertiary treatment upgrade using Nanofiltration (NF) followed by Reverse Osmosis (RO) for concentrated brine stream, with a Multi-Effect Evaporator (MEE) for ZLD.",
      technology_stack: "NF + RO + MEE (ZLD)",
      capacity: "3.5 MLD",
      results: "Treated effluent meets all CPCB discharge standards with 40% margin. 70% of treated water recovered and sold back to member industries.",
      testimonial: null,
      tags: ["CETP", "ZLD", "NF", "RO", "MEE", "Gujarat", "Municipal"],
      full_text: "Nandesari CETP common effluent treatment plant Vadodara Gujarat industrial estate CPCB discharge ZLD nanofiltration reverse osmosis MEE",
      rich_data: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      client_name: "Himalaya Herbal Healthcare",
      sector: "Pharma/Herbal",
      location: "Bangalore, Karnataka",
      challenge: "Himalaya required pharmaceutical-grade purified water for herbal extract processing and API formulation. Municipal water was not acceptable for IP-grade production.",
      solution: "Permionics designed a compact packaged RO system with upstream multimedia filtration, activated carbon, and softening, followed by UV sterilization and 0.2 micron polishing.",
      technology_stack: "MF + Softener + RO + UV",
      capacity: "15 m3/day",
      results: "Output water meets IP Purified Water specifications: conductivity below 1.3 microS/cm, TOC below 500 ppb, zero microbial growth.",
      testimonial: "The documentation and system design quality from Permionics was at par with European suppliers, at a fraction of the cost.",
      tags: ["Pharma", "Herbal", "RO", "UV", "Purified Water", "GMP", "Bangalore"],
      full_text: "Himalaya herbal healthcare Bangalore pharmaceutical grade purified water herbal extract API formulation IP grade CGMP RO UV 0.2 micron",
      rich_data: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      client_name: "Jeedimetla Effluent Treatment Ltd (JETL)",
      sector: "CETP/Municipal",
      location: "Hyderabad, Telangana",
      challenge: "High TDS effluent treatment and zero liquid discharge compliance for over 150 chemical and pharmaceutical manufacturing units.",
      solution: "Ultrafiltration followed by High-Recovery Reverse Osmosis system with online monitoring and automated CIP.",
      technology_stack: "UF + RO (ZLD)",
      capacity: "6 MLD",
      results: "< 200 PPM TDS output water, 95% recovery rate, 6 MLD capacity with zero unplanned maintenance downtime.",
      testimonial: "Permionics delivered robust industrial membrane performance under extreme chemical effluent conditions.",
      tags: ["CETP", "ZLD", "RO", "UF", "Hyderabad", "Telangana"],
      full_text: "Jeedimetla effluent treatment plant JETL Hyderabad Telangana chemical pharma effluent ZLD ultrafiltration reverse osmosis",
      rich_data: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  questionnaires: [
    {
      id: 1,
      client_name: "JETL Hyderabad",
      sector: "CETP/Municipal",
      questions: [],
      answers: {},
      notes: "Initial discovery questionnaire for plant capacity expansion",
      created_at: new Date().toISOString(),
    },
  ],
  questionnaire_projects: [
    {
      id: 1,
      name: "JETL Capacity Expansion Project",
      company_name: "JETL Hyderabad",
      contact_person: "Technical Director",
      location: "Hyderabad",
      date: new Date().toISOString().split("T")[0],
      sector: "CETP/Municipal",
      data: { clientInfo: { companyName: "JETL Hyderabad", sector: "CETP/Municipal" } },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  assistant_documents: [
    {
      id: 1,
      title: "Permionics Core Technical Capabilities.pdf",
      content: "Permionics Membranes Pvt. Ltd. is India's pioneer in membrane separation technology. Key technologies include Reverse Osmosis (RO), Ultrafiltration (UF), Nanofiltration (NF), and Zero Liquid Discharge (ZLD). Applications range from industrial effluent recovery, protein & enzyme extraction, Stevia concentration, to pharmaceutical purified water.",
      created_at: new Date().toISOString(),
    },
  ],
  case_creator_projects: [
    {
      id: 1,
      name: "World's Largest Stevia Plant",
      data: {
        client: "Stevia Peru",
        sector: "Herbal",
        capacity: "100,000 L/hr",
        technologies: ["Nanofiltration", "Reverse Osmosis"],
      },
      updated_at: new Date().toISOString(),
    },
  ],
  chats: [],
};

// In-Memory Table Data Store
const dbStore: Record<string, any[]> = { ...initialDb };
let nextId = 100;

function createMockQueryBuilder(tableName: string) {
  if (!dbStore[tableName]) {
    dbStore[tableName] = [];
  }

  let data = [...dbStore[tableName]];
  let isSingle = false;
  let isCount = false;

  const builder: any = {
    select(fields?: string, options?: { count?: string }) {
      if (options?.count) isCount = true;
      return builder;
    },
    eq(field: string, value: any) {
      data = data.filter((item) => String(item[field]) === String(value));
      return builder;
    },
    neq(field: string, value: any) {
      data = data.filter((item) => String(item[field]) !== String(value));
      return builder;
    },
    ilike(field: string, pattern: string) {
      const cleanPattern = pattern.replace(/%/g, "").toLowerCase();
      data = data.filter((item) => String(item[field] || "").toLowerCase().includes(cleanPattern));
      return builder;
    },
    or(filterString: string) {
      // Basic support for OR text queries
      return builder;
    },
    order(field: string, options?: { ascending?: boolean }) {
      const asc = options?.ascending ?? true;
      data.sort((a, b) => {
        const valA = a[field] ?? "";
        const valB = b[field] ?? "";
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit(n: number) {
      data = data.slice(0, n);
      return builder;
    },
    single() {
      isSingle = true;
      return builder;
    },
    insert(payload: any) {
      const rows = Array.isArray(payload) ? payload : [payload];
      const insertedRows = rows.map((row) => {
        const newRow = {
          id: row.id || ++nextId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...row,
        };
        dbStore[tableName].push(newRow);
        return newRow;
      });
      data = insertedRows;
      return builder;
    },
    update(payload: any) {
      data.forEach((existingRow) => {
        Object.assign(existingRow, payload, { updated_at: new Date().toISOString() });
      });
      return builder;
    },
    delete() {
      const idsToRemove = new Set(data.map((item) => item.id));
      dbStore[tableName] = dbStore[tableName].filter((item) => !idsToRemove.has(item.id));
      data = [];
      return builder;
    },
    // Promise then implementation for await support
    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
      const resultData = isSingle ? (data[0] || null) : data;
      const response = {
        data: resultData,
        error: null,
        count: isCount ? data.length : null,
      };
      return Promise.resolve(response).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

// Export Supabase Client or In-Memory Mock Proxy
export const supabase: any = isConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : {
      from(tableName: string) {
        return createMockQueryBuilder(tableName);
      },
    };

export type CaseStudyRow = {
  id: number;
  client_name: string;
  sector: string;
  location: string;
  challenge: string;
  solution: string;
  technology_stack: string;
  capacity: string;
  results: string;
  testimonial: string | null;
  tags: string[];
  full_text: string;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireRow = {
  id: number;
  client_name: string;
  sector: string;
  questions: QuestionItem[];
  answers: Record<string, string>;
  notes: string | null;
  created_at: string;
};

export type QuestionItem = {
  id: string;
  question: string;
  type: string;
  options?: string[];
};
