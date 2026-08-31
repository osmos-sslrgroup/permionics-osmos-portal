import { CaseStudyData, PhotoConfig } from "@/types/case-study";
import logoUrl from "@assets/logo_white.png";

interface Props {
  data: CaseStudyData;
}

function lines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function parseWaterRows(raw: string) {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((row) => {
    const parts = row.split("|").map((p) => p.trim());
    return { parameter: parts[0] || "", unit: parts[1] || "", feed: parts[2] || "", treated: parts[3] || "" };
  });
}

function highlightTitle(title: string, highlight: string) {
  if (!highlight || !title.startsWith(highlight)) return <>{title}</>;
  const rest = title.slice(highlight.length);
  return <><span style={{ color: "#7ecff5", fontSize: "18px" }}>{highlight}</span>{rest}</>;
}

const DEFAULT_CFG: PhotoConfig = { height: 140, fit: "cover", position: "center" };

function ImgBox({ src, caption, cfg: cfgProp }: { src: string | null; caption: string; cfg?: PhotoConfig }) {
  const cfg = cfgProp ?? DEFAULT_CFG;
  return (
    <div style={{ margin: "12px 0", border: "1px solid #dde4ee", borderRadius: "2px", overflow: "hidden" }}>
      {src ? (
        <img src={src} alt={caption} style={{ width: "100%", display: "block", height: `${cfg.height}px`, objectFit: cfg.fit, objectPosition: cfg.position }} />
      ) : (
        <div style={{ background: "#e8ecef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", color: "#999", height: `${cfg.height}px` }}>
          [ Photo will appear here ]
        </div>
      )}
      {caption && (
        <div style={{ background: "#f0f5fb", padding: "5px 8px", fontSize: "7.5pt", color: "#003466", fontStyle: "italic", lineHeight: 1.4, borderTop: "1px solid #d0dcea" }}>
          {caption}
        </div>
      )}
    </div>
  );
}

export function FullCaseStudyPreview({ data }: Props) {
  const waterRows = parseWaterRows(data.waterData);
  const perfStabLines = lines(data.perfStab);
  const valueDelLines = lines(data.valueDel);
  const sidebarBulletLines = lines(data.sidebarBullets);
  const techLines = lines(data.techList);

  const renderSidebarBullet = (text: string, i: number) => (
    <li key={i} style={{ listStyle: "none", paddingLeft: "11px", position: "relative", marginBottom: "4px", lineHeight: 1.35, fontSize: "7.5pt", color: "#333" }}>
      <span style={{ position: "absolute", left: 0, top: "3px", color: "#1a5fa8", fontSize: "6px" }}>▶</span>
      {text}
    </li>
  );

  const renderSiteBullet = (text: string, i: number) => (
    <li key={i} style={{ listStyle: "none", paddingLeft: "12px", position: "relative", fontSize: "7.5pt", marginBottom: "4px", color: "#333", lineHeight: 1.35 }}>
      <span style={{ position: "absolute", left: 0, color: "#1a5fa8", fontWeight: 700 }}>•</span>
      {text}
    </li>
  );

  const subTitle = [data.capacity && `${data.capacity} Reverse Osmosis Plant`, data.application, `${data.clientName}, ${data.location}`].filter(Boolean).join(" · ");

  return (
    <div id="cs-root" style={{ fontFamily: "'Open Sans', Arial, sans-serif", fontSize: "9pt", color: "#1a1a1a", background: "#fff", width: "794px", margin: "0 auto", position: "relative" }}>

      {/* CLIENT STRIP */}
      <div style={{ background: "#f8f9fa", borderBottom: "3px solid #1a5fa8", padding: "7px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#1a5fa8" }}>Client</div>
          <div style={{ width: "2px", height: "16px", background: "#1a5fa8", borderRadius: "1px" }} />
          <div style={{ fontSize: "11pt", fontWeight: 700, color: "#003466" }}>{data.clientName || "Client Name"}</div>
        </div>
        <div style={{ fontSize: "7pt", color: "#666", textAlign: "right", letterSpacing: "0.3px" }}>
          {data.location} &nbsp;·&nbsp; {data.sector} Sector
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background: "#003466", color: "white", display: "flex", alignItems: "stretch", minHeight: "96px" }}>
        <div style={{ background: "#003466", width: "200px", minWidth: "200px", display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 16px" }}>
          <img src={logoUrl} alt="Permionics" style={{ width: "160px", display: "block" }} />
        </div>
        <div style={{ background: "#1a5fa8", flex: 1, padding: "14px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "7px", letterSpacing: "3px", textTransform: "uppercase", color: "#a8d4f0", marginBottom: "5px", fontWeight: 600 }}>CASE HISTORY | WATER & WASTEWATER</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "0.3px" }}>
            {highlightTitle(data.csTitle || "Case Study Title", data.titleHL)}
          </div>
          <div style={{ fontSize: "9.5px", color: "#c8e0f4", marginTop: "5px" }}>{subTitle}</div>
        </div>
      </div>

      {/* BODY CONTAINER - NO PAGE BREAKS */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        
        {/* LEFT SIDEBAR (Continuous) */}
        <div style={{ width: "200px", minWidth: "200px", background: "#f4f7fa", borderRight: "1px solid #d0dcea", padding: "14px 14px", flexShrink: 0 }}>
          <div style={{ background: "#f4f7fa", borderLeft: "4px solid #1a5fa8", padding: "10px", marginBottom: "20px" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#003466", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", borderBottom: "1px solid #c0d4ea", paddingBottom: "4px" }}>Site Information</div>
            {[["Location:", data.location], ["Industry:", data.sector + " Manufacturing"], ["Application:", data.application], ["Capacity:", data.capacity], ["Client:", data.clientName]].map(([label, val]) => (
              <div key={String(label)} style={{ display: "block", marginBottom: "7px", fontSize: "7.5pt", lineHeight: 1.35 }}>
                <span style={{ display: "block", fontWeight: 700, color: "#003466", textTransform: "uppercase", fontSize: "6.5pt", letterSpacing: "0.5px", marginBottom: "1px" }}>{label}</span>
                <span style={{ display: "block", color: "#333", fontSize: "7.5pt" }}>{val}</span>
              </div>
            ))}
            <ul style={{ marginTop: "10px", paddingLeft: 0 }}>{sidebarBulletLines.map(renderSiteBullet)}</ul>
          </div>

          {[
            ["Technologies Used", techLines.map(renderSidebarBullet)], 
            ["Delivery Model", <span key="del" style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>{data.delivery}</span>], 
            ["Operations", <span key="ops" style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>{data.operations}</span>],
            ["Performance Stability", perfStabLines.map(renderSidebarBullet)],
            ["Value Delivered", valueDelLines.map(renderSidebarBullet)],
            ["Environmental Impact", <span key="env" style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>{data.envImpact}</span>]
          ].map(([heading, content]) => (
            <div key={String(heading)} style={{ marginBottom: "20px", breakInside: "avoid" }}>
              <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#1a5fa8", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #1a5fa8", paddingBottom: "3px", marginBottom: "8px" }}>{heading}</div>
              {Array.isArray(content) ? <ul style={{ paddingLeft: 0, margin: 0 }}>{content}</ul> : <div>{content}</div>}
            </div>
          ))}

          <div style={{ marginBottom: "16px", breakInside: "avoid" }}>
            <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#1a5fa8", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #1a5fa8", paddingBottom: "3px", marginBottom: "8px" }}>For More Information</div>
            <div style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.6 }}>
              <strong>{data.companyName}</strong><br />
              <span style={{ color: "#1a5fa8" }}>{data.website}</span><br /><br />
              {data.division}<br />
              {data.regions}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT (Continuous) */}
        <div style={{ flex: 1, padding: "0 0 14px 0", minWidth: 0 }}>
          {/* Stat Bar matches exact PDF layout now (full width of right column, dark blue) */}
          {data.statBar && (
            <div style={{ background: "#0a2b4e", color: "white", padding: "12px 20px" }}>
              <div style={{ fontSize: "9.5pt", fontWeight: 600, color: "#9cd6f1", letterSpacing: "0.5px", lineHeight: 1.4 }}>{data.statBar}</div>
            </div>
          )}

          <div style={{ padding: "14px 24px" }}>
            <div style={{ fontSize: "11pt", fontWeight: 700, color: "#1a5fa8", marginTop: 0, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Introduction</div>
            {data.intro.split("\n\n").map((para, i) => <p key={i} style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "10px" }}>{para}</p>)}
            
            <div style={{ float: "right", width: "40%", marginLeft: "16px", marginBottom: "8px" }}>
              <ImgBox src={data.plantImg} caption={data.plantCap} cfg={data.plantImgCfg} />
            </div>

            <div style={{ fontSize: "11pt", fontWeight: 700, color: "#1a5fa8", marginTop: "16px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>The Challenge</div>
            {data.challengeProblem && <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}><strong>The Problem.</strong> {data.challengeProblem}</p>}
            {data.challengeLimits && <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}><strong>Existing Limitations.</strong> {data.challengeLimits}</p>}

            {/* In the reference, Feed Water Analysis is sometimes a table inserted here */}
            {/* We'll skip the custom Feed Water Analysis table for now unless they provided it, but they didn't have fields for it in the form. */}

            <div style={{ clear: "both" }} />

            <div style={{ fontSize: "11pt", fontWeight: 700, color: "#1a5fa8", marginTop: "16px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>The Technical Solution</div>
            {data.solDesign && <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}><strong>System Design.</strong> {data.solDesign}</p>}
            {data.solAuto && <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}><strong>Automation &amp; Control.</strong> {data.solAuto}</p>}
            {data.solBOO && <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}><strong>BOO Delivery Model.</strong> {data.solBOO}</p>}
            
            <ImgBox src={data.handshakeImg} caption={data.handshakeCap} cfg={data.handshakeImgCfg} />

            <div style={{ borderTop: "2px solid #1a5fa8", marginTop: "24px", paddingTop: "12px", breakInside: "avoid" }}>
              <div style={{ fontSize: "11pt", fontWeight: 700, color: "#1a5fa8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Operational Results</div>

              <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
                {data.cards.filter((c) => c.number).map((card, i) => (
                  <div key={i} style={{ flex: 1, border: "1px solid #1a5fa8", borderTop: "4px solid #1a5fa8", padding: "12px 10px 10px", borderRadius: "2px", textAlign: "center" }}>
                    <div style={{ fontSize: "18pt", fontWeight: 700, color: "#1a5fa8", lineHeight: 1, marginBottom: "6px" }}>{card.number}</div>
                    <div style={{ fontSize: "7.5pt", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>
                      {card.label.split("\n").map((line, j, arr) => (
                        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "9pt", fontWeight: 700, color: "#003466", marginTop: "20px", marginBottom: "8px" }}>Before &amp; After: Water Quality Comparison</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt", margin: "8px 0" }}>
                <thead>
                  <tr style={{ background: "#f4f7fa", borderBottom: "1px solid #c0d4ea" }}>
                    {["Parameter", "Unit", "Feed (Raw)", "Treated Water"].map((h) => (
                      <th key={h} style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#003466" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waterRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "7px 8px", fontWeight: 600, color: "#333" }}>{row.parameter}</td>
                      <td style={{ padding: "7px 8px", color: "#555" }}>{row.unit}</td>
                      <td style={{ padding: "7px 8px", color: "#555" }}>{row.feed}</td>
                      <td style={{ padding: "7px 8px", color: "#0a7c2e", fontWeight: 700 }}>{row.treated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: "16px", margin: "24px 0", breakInside: "avoid" }}>
              <div style={{ flex: 1 }}>
                <ImgBox src={data.beakersImg} caption={data.beakersCap} cfg={{...data.beakersImgCfg, height: 160}} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#333", height: "100%", boxSizing: "border-box", paddingTop: "12px" }}>
                  <div style={{ fontSize: "9pt", fontWeight: 700, color: "#1a5fa8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Figure 1: Visual Transformation</div>
                  <p style={{ color: "#444", fontSize: "8pt", lineHeight: 1.6, margin: 0 }}>{data.fig1text}</p>
                </div>
              </div>
            </div>

            {data.conclusions && (
              <div style={{ background: "#003466", color: "white", padding: "16px 20px", marginTop: "24px", borderRadius: "2px", breakInside: "avoid" }}>
                <div style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9cd6f1", marginBottom: "10px" }}>Conclusions</div>
                <p style={{ color: "#f8f9fa", fontSize: "8.5pt", lineHeight: 1.6, margin: 0 }}>{data.conclusions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: "#002a54", color: "#a8c8e8", fontSize: "7.5pt", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>© {new Date().getFullYear()} {data.companyName} &nbsp;|&nbsp; Creating Sustainable Environment for Industries and Society</span>
        <span style={{ color: "#9cd6f1" }}>{data.website}</span>
      </div>
    </div>
  );
}
