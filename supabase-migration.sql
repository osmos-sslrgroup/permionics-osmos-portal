-- Permionics BD Suite - Supabase Migration (Full)
-- Run this entire script in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)

-- ─── Case Studies table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_studies (
  id BIGSERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  challenge TEXT NOT NULL,
  solution TEXT NOT NULL,
  technology_stack TEXT NOT NULL DEFAULT '',
  capacity TEXT NOT NULL DEFAULT '',
  results TEXT NOT NULL DEFAULT '',
  testimonial TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  full_text TEXT NOT NULL DEFAULT '',
  rich_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Questionnaires table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questionnaires (
  id BIGSERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Questionnaire Projects table (for the full Builder workflow) ─────────────
-- Stores named projects with full sector state (questions + sections + clientInfo)
CREATE TABLE IF NOT EXISTS questionnaire_projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Disable RLS (internal tool — service key used server-side only) ──────────
ALTER TABLE case_studies DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_projects DISABLE ROW LEVEL SECURITY;

-- ─── Assistant Documents table (for PDF library/OCR context) ──────────────────
CREATE TABLE IF NOT EXISTS assistant_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE assistant_documents DISABLE ROW LEVEL SECURITY;

-- ─── Add rich_data column if migration was already run without it ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_studies' AND column_name = 'rich_data'
  ) THEN
    ALTER TABLE case_studies ADD COLUMN rich_data JSONB;
  END IF;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_case_studies_sector ON case_studies(sector);
CREATE INDEX IF NOT EXISTS idx_case_studies_created_at ON case_studies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questionnaires_sector ON questionnaires(sector);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created_at ON questionnaires(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_q_projects_sector ON questionnaire_projects(sector);
CREATE INDEX IF NOT EXISTS idx_q_projects_updated_at ON questionnaire_projects(updated_at DESC);

-- ─── Seed data ────────────────────────────────────────────────────────────────
INSERT INTO case_studies (client_name, sector, location, challenge, solution, technology_stack, capacity, results, testimonial, tags, full_text) VALUES
(
  'Waaree Energies Ltd.',
  'Industrial',
  'Surat, Gujarat',
  'Waaree Energies required high-purity process water for solar panel manufacturing. Existing municipal supply had TDS of 900-1200 mg/L with fluctuating quality, causing scaling on production equipment and impacting panel efficiency.',
  'Permionics designed and commissioned a two-pass Reverse Osmosis system with an upstream Ultrafiltration pretreatment stage. The system includes online TDS monitoring, automatic flush cycles, and a CIP module to maintain membrane performance.',
  'UF + 2-Pass RO',
  '50 m3/day',
  'Output water TDS consistently below 10 mg/L (99%+ rejection). Equipment scaling eliminated. Zero production downtime attributed to water quality since commissioning. ROI achieved within 18 months through reduced chemical cleaning costs and improved product yield.',
  'The Permionics system has been running without any major issues for two years. The water quality is consistently excellent and the after-sales support is responsive.',
  ARRAY['Solar', 'UF', 'RO', 'Process Water', 'Industrial', 'Gujarat'],
  'Waaree Energies solar panel manufacturing process water Surat Gujarat UF ultrafiltration RO reverse osmosis TDS scaling production'
),
(
  'Nandesari CETP',
  'CETP/Municipal',
  'Nandesari Industrial Estate, Vadodara, Gujarat',
  'The Nandesari Common Effluent Treatment Plant serves over 200 member industries with mixed chemical effluent. Legacy treatment system could not meet revised CPCB discharge norms for COD, TDS, and heavy metals.',
  'Permionics designed a tertiary treatment upgrade using Nanofiltration (NF) followed by Reverse Osmosis (RO) for the concentrated brine stream, with a Multi-Effect Evaporator (MEE) for ZLD compliance.',
  'NF + RO + MEE (ZLD)',
  '3.5 MLD',
  'Treated effluent now meets all CPCB discharge standards with 40% margin. 70% of treated water recovered and sold back to member industries as process water. Full ZLD compliance achieved.',
  NULL,
  ARRAY['CETP', 'ZLD', 'NF', 'RO', 'MEE', 'Gujarat', 'Municipal'],
  'Nandesari CETP common effluent treatment plant Vadodara Gujarat industrial estate CPCB discharge ZLD nanofiltration reverse osmosis MEE'
),
(
  'Himalaya Herbal Healthcare',
  'Pharma/Herbal',
  'Bangalore, Karnataka',
  'Himalaya required pharmaceutical-grade purified water for herbal extract processing and API formulation. Municipal water with seasonal variation in quality was not acceptable for IP-grade production.',
  'Permionics designed a compact packaged RO system with upstream multimedia filtration, activated carbon, and softening, followed by UV sterilization and 0.2 micron polishing. Built to CGMP guidelines.',
  'MF + Softener + RO + UV',
  '15 m3/day',
  'Output water meets IP Purified Water specifications: conductivity below 1.3 microS/cm, TOC below 500 ppb, no microbial growth in 100 consecutive tests.',
  'The documentation and system design quality from Permionics was at par with what we have seen from European suppliers, but at a fraction of the cost.',
  ARRAY['Pharma', 'Herbal', 'RO', 'UV', 'Purified Water', 'GMP', 'Bangalore'],
  'Himalaya herbal healthcare Bangalore pharmaceutical grade purified water herbal extract API formulation IP grade CGMP RO UV 0.2 micron'
)
ON CONFLICT DO NOTHING;

-- ─── Confirm ──────────────────────────────────────────────────────────────────
SELECT 'case_studies' as table_name, COUNT(*) as row_count FROM case_studies
UNION ALL
SELECT 'questionnaires', COUNT(*) FROM questionnaires
UNION ALL
SELECT 'questionnaire_projects', COUNT(*) FROM questionnaire_projects;
