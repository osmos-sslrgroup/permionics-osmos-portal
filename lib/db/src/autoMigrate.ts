import { pool } from "./index";

function logAutoMigrate(message: string) {
  console.log(`[AUTO_MIGRATE] ${message}`);
}

export async function autoMigrate() {
  if (!process.env.DATABASE_URL) {
    logAutoMigrate("DATABASE_URL not set. Skipping PostgreSQL AutoMigrate.");
    return;
  }

  logAutoMigrate("Starting PostgreSQL AutoMigrate (GORM AutoMigrate equivalent)...");

  const client = await pool.connect();
  try {
    // 1. Create Tables IF NOT EXISTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        display_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS case_studies (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        sector TEXT NOT NULL,
        location TEXT NOT NULL,
        challenge TEXT NOT NULL,
        solution TEXT NOT NULL,
        technology_stack TEXT NOT NULL,
        capacity TEXT NOT NULL,
        results TEXT NOT NULL,
        testimonial TEXT,
        tags JSONB,
        full_text TEXT,
        rich_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questionnaires (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        sector TEXT NOT NULL,
        questions JSONB,
        answers JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questionnaire_projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        location TEXT,
        date TEXT,
        sector TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assistant_documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS case_creator_projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Check if case_studies is empty and seed default records
    const checkCaseStudies = await client.query("SELECT COUNT(*) FROM case_studies;");
    const count = parseInt(checkCaseStudies.rows[0].count, 10);

    if (count === 0) {
      logAutoMigrate("Seeding initial Permionics case studies into fresh PostgreSQL database...");
      await client.query(`
        INSERT INTO case_studies (client_name, sector, location, challenge, solution, technology_stack, capacity, results, testimonial, tags, full_text)
        VALUES 
        (
          'Waaree Energies Ltd.',
          'Industrial',
          'Surat, Gujarat',
          'Waaree Energies required high-purity process water for solar panel manufacturing. Existing municipal supply had TDS of 900-1200 mg/L with fluctuating quality, causing scaling on production equipment.',
          'Permionics designed and commissioned a two-pass Reverse Osmosis system with an upstream Ultrafiltration pretreatment stage.',
          'UF + 2-Pass RO',
          '50 m3/day',
          'Output water TDS consistently below 10 mg/L (99%+ rejection). Equipment scaling eliminated. ROI achieved within 18 months.',
          'The Permionics system has been running without any major issues for two years. Water quality is consistently excellent.',
          '["Solar", "UF", "RO", "Process Water", "Industrial", "Gujarat"]',
          'Waaree Energies solar panel manufacturing process water Surat Gujarat UF ultrafiltration RO reverse osmosis TDS scaling production'
        ),
        (
          'Nandesari CETP',
          'CETP/Municipal',
          'Nandesari Industrial Estate, Vadodara, Gujarat',
          'The Nandesari Common Effluent Treatment Plant serves over 200 member industries with mixed chemical effluent. Legacy treatment system could not meet revised CPCB discharge norms.',
          'Permionics designed a tertiary treatment upgrade using Nanofiltration (NF) followed by Reverse Osmosis (RO) for concentrated brine stream, with a Multi-Effect Evaporator (MEE) for ZLD.',
          'NF + RO + MEE (ZLD)',
          '3.5 MLD',
          'Treated effluent meets all CPCB discharge standards with 40% margin. 70% of treated water recovered and sold back to member industries.',
          NULL,
          '["CETP", "ZLD", "NF", "RO", "MEE", "Gujarat", "Municipal"]',
          'Nandesari CETP common effluent treatment plant Vadodara Gujarat industrial estate CPCB discharge ZLD nanofiltration reverse osmosis MEE'
        ),
        (
          'Himalaya Herbal Healthcare',
          'Pharma/Herbal',
          'Bangalore, Karnataka',
          'Himalaya required pharmaceutical-grade purified water for herbal extract processing and API formulation. Municipal water was not acceptable for IP-grade production.',
          'Permionics designed a compact packaged RO system with upstream multimedia filtration, activated carbon, and softening, followed by UV sterilization and 0.2 micron polishing.',
          'MF + Softener + RO + UV',
          '15 m3/day',
          'Output water meets IP Purified Water specifications: conductivity below 1.3 microS/cm, TOC below 500 ppb, zero microbial growth.',
          'The documentation and system design quality from Permionics was at par with European suppliers, at a fraction of the cost.',
          '["Pharma", "Herbal", "RO", "UV", "Purified Water", "GMP", "Bangalore"]',
          'Himalaya herbal healthcare Bangalore pharmaceutical grade purified water herbal extract API formulation IP grade CGMP RO UV 0.2 micron'
        ),
        (
          'Jeedimetla Effluent Treatment Ltd (JETL)',
          'CETP/Municipal',
          'Hyderabad, Telangana',
          'High TDS effluent treatment and zero liquid discharge compliance for over 150 chemical and pharmaceutical manufacturing units.',
          'Ultrafiltration followed by High-Recovery Reverse Osmosis system with online monitoring and automated CIP.',
          'UF + RO (ZLD)',
          '6 MLD',
          '< 200 PPM TDS output water, 95% recovery rate, 6 MLD capacity with zero unplanned maintenance downtime.',
          'Permionics delivered robust industrial membrane performance under extreme chemical effluent conditions.',
          '["CETP", "ZLD", "RO", "UF", "Hyderabad", "Telangana"]',
          'Jeedimetla effluent treatment plant JETL Hyderabad Telangana chemical pharma effluent ZLD ultrafiltration reverse osmosis'
        );
      `);
    }

    logAutoMigrate("PostgreSQL AutoMigrate completed successfully.");
  } catch (error) {
    console.error("[AUTO_MIGRATE ERROR]", error);
  } finally {
    client.release();
  }
}
