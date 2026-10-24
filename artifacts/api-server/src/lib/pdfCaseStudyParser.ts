export interface ParsedCaseStudy {
  clientName: string;
  sector: string;
  location: string;
  categoryLabel: string;
  csTitle: string;
  capacity: string;
  application: string;
  techList: string;
  technologyStack: string;
  delivery: string;
  operations: string;
  statBar: string;
  intro: string;
  challengeProblem: string;
  challengeLimits: string;
  solDesign: string;
  solAuto: string;
  solBOO: string;
  cards: Array<{ number: string; label: string }>;
  waterData: string;
  perfStab: string;
  valueDel: string;
  envImpact: string;
  fig1text: string;
  conclusions: string;
  fullText: string;
  richData: Record<string, any>;
}

export function parseCaseStudyText(text: string): ParsedCaseStudy {
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 1. Client Name
  let clientName = "";
  const clientMatch = clean.match(/C\s*L\s*I\s*E\s*N\s*T\s+([^\t\n\r]+)/i);
  if (clientMatch) {
    clientName = clientMatch[1].trim();
  }
  if (!clientName) {
    const siteClientMatch = clean.match(/CLIENT:?\s*\n?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (siteClientMatch) {
      clientName = siteClientMatch[1].replace(/\n/g, " ").trim();
    }
  }
  if (!clientName) {
    clientName = "Permionics Project";
  }

  // 2. Location & Sector from header strip
  let location = "";
  let sector = "";
  const headerStripMatch = clean.match(/C\s*L\s*I\s*E\s*N\s*T[^\n\t]+\t([^\n\r]+)/i);
  if (headerStripMatch) {
    const parts = headerStripMatch[1].split("·").map((s) => s.trim());
    if (parts.length >= 2) {
      location = parts[0];
      sector = parts[1].replace(/Sector/i, "").trim();
    } else if (parts.length === 1) {
      location = parts[0];
    }
  }

  // Fallback location / sector from SITE INFORMATION
  if (!location) {
    const locMatch = clean.match(/LOCATION:?\s*\n?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (locMatch) location = locMatch[1].replace(/\n/g, " ").trim();
  }
  if (!sector) {
    const indMatch = clean.match(/INDUSTRY:?\s*\n?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (indMatch) sector = indMatch[1].replace(/\n/g, " ").trim();
  }
  if (!sector) sector = "General Industrial";
  if (!location) location = "India";

  // 3. Category Label & Title
  let categoryLabel = "Case History | Water & Wastewater";
  const catMatch = clean.match(/C\s*A\s*S\s*E\s*H\s*I\s*S\s*T\s*O\s*R\s*Y\s*\|\s*([^\n\r]+)/i);
  if (catMatch) {
    categoryLabel = `Case History | ${catMatch[1].trim()}`;
  }

  let csTitle = clientName;
  const titleBlockMatch = clean.match(/C\s*A\s*S\s*E\s*H\s*I\s*S\s*T\s*O\s*R\s*Y[^\n]*\n+([^\n\r]+)/i);
  if (titleBlockMatch) {
    csTitle = titleBlockMatch[1].trim();
  }

  // 4. Capacity & Application
  let capacity = "";
  const capMatch = clean.match(/(?:CAPACITY|CAPACITY DESIGNED|RO CAPACITY):?\s*\n?\s*([^\n\r]+)/i);
  if (capMatch) capacity = capMatch[1].trim();

  let application = "";
  const appMatch = clean.match(/(?:APPLICATION|SYSTEM SUPPLIED):?\s*\n?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
  if (appMatch) application = appMatch[1].replace(/\n/g, " ").trim();

  // 5. Technologies Used
  let techList = application || "RO";
  const techSectionMatch = clean.match(/TECHNOLOGIES USED([\s\S]*?)(?:DELIVERY MODEL|OPERATIONS|INTRODUCTION)/i);
  if (techSectionMatch) {
    const rawTech = techSectionMatch[1];
    const techLines = rawTech
      .split("\n")
      .map((l) => l.replace(/^[▶•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 2);
    if (techLines.length > 0) {
      techList = techLines.join("\n");
    }
  }

  // Concise technologyStack tag
  let technologyStack = "RO";
  const allTechText = (techList + " " + application + " " + clean).toLowerCase();
  if (allTechText.includes("mbr")) {
    technologyStack = "MBR";
  } else if (allTechText.includes("zld")) {
    technologyStack = "ZLD";
  } else if (/\buf\b/i.test(allTechText) || allTechText.includes("ultrafiltration")) {
    technologyStack = "UF";
  } else if (/\bnf\b/i.test(allTechText) || allTechText.includes("nanofiltration")) {
    technologyStack = "NF";
  } else if (/\bro\b/i.test(allTechText) || allTechText.includes("reverse osmosis")) {
    technologyStack = "RO";
  }

  // 6. Delivery & Operations
  let delivery = "";
  const delivMatch = clean.match(/DELIVERY MODEL\s*\n([\s\S]*?)(?:OPERATIONS|INTRODUCTION|\d+[,0-9]*\s*PPM)/i);
  if (delivMatch) {
    delivery = delivMatch[1].replace(/\n+/g, " ").trim();
  }

  let operations = "";
  const opsMatch = clean.match(/OPERATIONS\s*\n([\s\S]*?)(?:INTRODUCTION|\d+[,0-9]*\s*PPM)/i);
  if (opsMatch) {
    operations = opsMatch[1].replace(/\n+/g, " ").trim();
  }

  // 7. Stat Bar
  let statBar = "";
  const statMatch = clean.match(/(\d+[,0-9]*\s*PPM\s*→\s*[^\n\r]+)/i);
  if (statMatch) statBar = statMatch[1].trim();

  // 8. Introduction
  let intro = "";
  const introMatch = clean.match(/INTRODUCTION\s*\n([\s\S]*?)(?:THE CHALLENGE|The Problem|The 20 MLD)/i);
  if (introMatch) {
    intro = introMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  // 9. Challenge
  let challengeProblem = "";
  const probMatch = clean.match(/The Problem\.\s*([\s\S]*?)(?:Existing Limitations\.|THE TECHNICAL SOLUTION)/i);
  if (probMatch) {
    challengeProblem = probMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  let challengeLimits = "";
  const limMatch = clean.match(/Existing Limitations\.\s*([\s\S]*?)(?:Feed Water Analysis|THE TECHNICAL SOLUTION)/i);
  if (limMatch) {
    challengeLimits = limMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  // 10. Solution
  let solDesign = "";
  const designMatch = clean.match(/System Design\.\s*([\s\S]*?)(?:Automation & Control\.|BOO Delivery Model\.|Partnership agreement)/i);
  if (designMatch) {
    solDesign = designMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  let solAuto = "";
  const autoMatch = clean.match(/Automation & Control\.\s*([\s\S]*?)(?:BOO Delivery Model\.|Partnership agreement|OPERATIONAL RESULTS)/i);
  if (autoMatch) {
    solAuto = autoMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  let solBOO = "";
  const booMatch = clean.match(/(?:BOO Delivery Model\.|Delivery Model\.)\s*([\s\S]*?)(?:Partnership agreement|OPERATIONAL RESULTS|PERFORMANCE STABILITY)/i);
  if (booMatch) {
    solBOO = booMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  // 11. Result Cards
  const cards: Array<{ number: string; label: string }> = [];
  const resultsBlockMatch = clean.match(/OPERATIONAL RESULTS\s*\n([\s\S]*?)(?:Before & After|Water Quality Comparison|Conclusions|PERFORMANCE STABILITY)/i);
  if (resultsBlockMatch) {
    const rawCardsText = resultsBlockMatch[1];
    const cardLines = rawCardsText.split("\n").map((l) => l.trim()).filter(Boolean);
    const isMetric = (s: string) => /^\d+[\d,\.]*[%+]*$/i.test(s) || /^\d+\s*(?:MLD|KL|PPM|m³\/day|LPH)/i.test(s);

    let currentCard: { number: string; labelParts: string[] } | null = null;
    for (const line of cardLines) {
      if (isMetric(line)) {
        if (currentCard) {
          cards.push({ number: currentCard.number, label: currentCard.labelParts.join("\n") });
        }
        if (cards.length >= 4) break;
        currentCard = { number: line, labelParts: [] };
      } else if (currentCard && currentCard.labelParts.length < 3) {
        currentCard.labelParts.push(line);
      }
    }
    if (currentCard && cards.length < 4) {
      cards.push({ number: currentCard.number, label: currentCard.labelParts.join("\n") });
    }
  }

  // 12. Water Quality Comparison Table
  let waterData = "";
  const waterTableMatch = clean.match(/(?:Before & After:\s*)?Water Quality Comparison\s*\n([\s\S]*?)(?:Feed water|FIGURE 1|CONCLUSIONS|Visual proof)/i);
  if (waterTableMatch) {
    const rawTable = waterTableMatch[1];
    const tableLines = rawTable.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsedRows: string[] = [];
    for (const line of tableLines) {
      if (/^Parameter/i.test(line)) continue;
      const cols = line.split("\t").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 3) {
        if (cols.length === 3) {
          parsedRows.push(`${cols[0]}||${cols[1]}|${cols[2]}`);
        } else {
          parsedRows.push(`${cols[0]}|${cols[1]}|${cols[2]}|${cols[3]}`);
        }
      } else {
        const spaceCols = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
        if (spaceCols.length >= 3) {
          parsedRows.push(`${spaceCols[0]}|${spaceCols[1] || ""}|${spaceCols[2] || ""}|${spaceCols[3] || ""}`);
        }
      }
    }
    if (parsedRows.length > 0) {
      waterData = parsedRows.join("\n");
    }
  }

  // 13. Conclusions & Figure 1
  let fig1text = "";
  const figMatch = clean.match(/FIGURE 1:[^\n]*\n([\s\S]*?)(?:CONCLUSIONS|©|\n\n[A-Z])/i);
  if (figMatch) {
    fig1text = figMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  let conclusions = "";
  const concMatch = clean.match(/CONCLUSIONS\s*\n([\s\S]*?)(?:©|\n\n[A-Z0-9\s·]+www\.permionics\.com|$)/i);
  if (concMatch) {
    conclusions = concMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  // 14. Performance Stability & Value Delivered bullets
  let perfStab = "";
  const perfMatch = clean.match(/PERFORMANCE STABILITY\s*\n([\s\S]*?)(?:VALUE DELIVERED|ENVIRONMENTAL IMPACT)/i);
  if (perfMatch) {
    const lines = perfMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[▶•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 3);
    if (lines.length > 0) perfStab = lines.join("\n");
  }

  let valueDel = "";
  const valMatch = clean.match(/VALUE DELIVERED\s*\n([\s\S]*?)(?:ENVIRONMENTAL IMPACT|FOR MORE INFORMATION)/i);
  if (valMatch) {
    const lines = valMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[▶•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 3);
    if (lines.length > 0) valueDel = lines.join("\n");
  }

  let envImpact = "";
  const envMatch = clean.match(/ENVIRONMENTAL IMPACT\s*\n([\s\S]*?)(?:FOR MORE INFORMATION|OPERATIONAL RESULTS|CONCLUSIONS)/i);
  if (envMatch) {
    envImpact = envMatch[1].trim().replace(/\n(?!\n)/g, " ");
  }

  // Synthesize richData
  const richData = {
    clientName,
    sector,
    location,
    categoryLabel,
    csTitle,
    capacity,
    application,
    techList,
    delivery,
    operations,
    statBar,
    intro,
    challengeProblem,
    challengeLimits,
    solDesign,
    solAuto,
    solBOO,
    cards,
    waterData,
    perfStab,
    valueDel,
    envImpact,
    fig1text,
    conclusions,
    palette: "ocean-blue",
    plantImg: null,
    handshakeImg: null,
    beakersImg: null,
  };

  return {
    clientName,
    sector,
    location,
    categoryLabel,
    csTitle,
    capacity,
    application,
    techList,
    technologyStack,
    delivery,
    operations,
    statBar,
    intro,
    challengeProblem,
    challengeLimits,
    solDesign,
    solAuto,
    solBOO,
    cards,
    waterData,
    perfStab,
    valueDel,
    envImpact,
    fig1text,
    conclusions,
    fullText: clean,
    richData,
  };
}
