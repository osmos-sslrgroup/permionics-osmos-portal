// @ts-nocheck
import { useRef } from "react";
import { CaseStudyData, PhotoConfig, Palette, formatSectorDefault } from "../creator_types";
import logoUrl from "@assets/logo_white.png";

interface Props {
  data: CaseStudyData;
  palette: Palette;
  editable?: boolean;
  onChange?: (data: CaseStudyData) => void;
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

function highlightTitle(title: string, highlight: string, highlightColor: string) {
  if (!highlight || !title.startsWith(highlight)) return <>{title}</>;
  const rest = title.slice(highlight.length);
  return <><span style={{ color: highlightColor, fontSize: "18px" }}>{highlight}</span>{rest}</>;
}

const DEFAULT_CFG: PhotoConfig = { height: 140, fit: "cover", position: "center" };

function ImgBox({ src, caption, cfg: cfgProp, primary, light, lightBorder }: {
  src: string | null; caption: string; cfg?: PhotoConfig;
  primary: string; light: string; lightBorder: string;
}) {
  const cfg = cfgProp ?? DEFAULT_CFG;
  return (
    <div style={{ margin: "12px 0", border: `1px solid ${lightBorder}`, borderRadius: "2px", overflow: "hidden" }}>
      {src ? (
        <img src={src} alt={caption} style={{ width: "100%", display: "block", height: `${cfg.height}px`, objectFit: cfg.fit, objectPosition: cfg.position }} />
      ) : (
        <div style={{ background: "#e8ecef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", color: "#999", height: `${cfg.height}px` }}>
          [ Photo will appear here ]
        </div>
      )}
      {caption && (
        <div style={{ background: light, padding: "5px 8px", fontSize: "7.5pt", color: primary, fontStyle: "italic", lineHeight: 1.4, borderTop: `1px solid ${lightBorder}` }}>
          {caption}
        </div>
      )}
    </div>
  );
}

type EditableField = keyof CaseStudyData;

export function CaseStudyPreview({ data, palette, editable = false, onChange }: Props) {
  const { primary, accent, light, lightBorder, highlight, headerCat, headerSub, sidebarBullet } = palette;
  const waterRows = parseWaterRows(data.waterData);
  const perfStabLines = lines(data.perfStab);
  const valueDelLines = lines(data.valueDel);
  const sidebarBulletLines = lines(data.sidebarBullets);
  const techLines = lines(data.techList);

  const editField = (field: EditableField, value: string) => {
    if (onChange) onChange({ ...data, [field]: value });
  };

  function EditText({
    field,
    value,
    style,
    multiline = false,
  }: {
    field: EditableField;
    value: string;
    style?: React.CSSProperties;
    multiline?: boolean;
  }) {
    if (!editable) {
      return <span style={style}>{value}</span>;
    }
    return (
      <span
        contentEditable
        suppressContentEditableWarning
        className="cs-editable-text"
        style={{ ...style, display: "inline-block", minWidth: "20px", cursor: "text" }}
        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
          editField(field, e.currentTarget.innerText);
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  const renderSidebarBullet = (text: string, i: number) => (
    <li key={i} style={{ listStyle: "none", paddingLeft: "11px", position: "relative", marginBottom: "4px", lineHeight: 1.35, fontSize: "7.5pt", color: "#333" }}>
      <span style={{ position: "absolute", left: 0, top: "3px", color: sidebarBullet, fontSize: "6px" }}>▶</span>
      {text}
    </li>
  );

  const renderSiteBullet = (text: string, i: number) => (
    <li key={i} style={{ listStyle: "none", paddingLeft: "12px", position: "relative", fontSize: "7.5pt", marginBottom: "4px", color: "#333", lineHeight: 1.35 }}>
      <span style={{ position: "absolute", left: 0, color: sidebarBullet, fontWeight: 700 }}>•</span>
      {text}
    </li>
  );

  const subTitle = [data.capacity && `${data.capacity} Reverse Osmosis Plant`, data.application, `${data.clientName}, ${data.location}`].filter(Boolean).join(" · ");

  const headingStyle: React.CSSProperties = {
    fontSize: "10pt", fontWeight: 700, color: accent, marginTop: 0, marginBottom: "5px",
    paddingBottom: "3px", borderBottom: `2px solid ${accent}`, textTransform: "uppercase", letterSpacing: "0.5px",
  };

  return (
    <div id="cs-root" style={{ fontFamily: "'Open Sans', Arial, sans-serif", fontSize: "9pt", color: "#1a1a1a", background: "#fff", width: "794px", margin: "0 auto" }}>

      {/* CLIENT STRIP */}
      <div style={{ background: light, borderBottom: `3px solid ${accent}`, padding: "7px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent }}>Client</div>
          <div style={{ width: "2px", height: "28px", background: accent, borderRadius: "1px" }} />
          <div style={{ fontSize: "12pt", fontWeight: 700, color: primary }}>
            <EditText field="clientName" value={data.clientName} style={{ fontSize: "12pt", fontWeight: 700, color: primary }} />
          </div>
        </div>
        <div style={{ fontSize: "7pt", color: "#666", textAlign: "right", letterSpacing: "0.3px" }}>
          <EditText field="location" value={data.location} style={{ fontSize: "7pt", color: "#666" }} /> &nbsp;·&nbsp; <EditText field="sector" value={data.sector} style={{ fontSize: "7pt", color: "#666" }} /> Sector
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background: primary, color: "white", display: "flex", alignItems: "stretch", minHeight: "96px" }}>
        <div style={{ background: primary, width: "185px", minWidth: "185px", display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 16px" }}>
          <img id="cs-logo" src={logoUrl} alt="Permionics" style={{ width: "155px", display: "block" }} />
        </div>
        <div style={{ background: accent, flex: 1, padding: "14px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "7px", letterSpacing: "3px", textTransform: "uppercase", color: headerCat, marginBottom: "5px", fontWeight: 600 }}>
            <EditText field="categoryLabel" value={data.categoryLabel} style={{ fontSize: "7px", color: headerCat }} />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "0.3px" }}>
            {highlightTitle(data.csTitle || "Case Study Title", data.titleHL, highlight)}
          </div>
          <div style={{ fontSize: "9.5px", color: headerSub, marginTop: "5px" }}>{subTitle}</div>
        </div>
      </div>

      {/* PAGE 1 BODY */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width: "185px", minWidth: "185px", background: light, borderRight: `1px solid ${lightBorder}`, padding: "14px 12px" }}>
          <div style={{ background: light, borderLeft: `4px solid ${accent}`, padding: "10px", marginBottom: "16px" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 700, color: primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", borderBottom: `1px solid ${lightBorder}`, paddingBottom: "4px" }}>
              Site Information
            </div>
            {(data.siteInfoFields || [
              { id: "location", label: "Location:", value: data.location || "", visible: true },
              { id: "sector", label: "Industry:", value: formatSectorDefault(data.sector), visible: true },
              { id: "application", label: "Application:", value: data.application || "", visible: true },
              { id: "capacity", label: "Capacity:", value: data.capacity || "", visible: true },
              { id: "clientName", label: "Client:", value: data.clientName || "", visible: true },
            ])
              .filter(f => f.visible !== false)
              .map((field) => (
                <div key={field.id} style={{ display: "block", marginBottom: "7px", fontSize: "7.5pt", lineHeight: 1.35 }}>
                  <span style={{ display: "block", fontWeight: 700, color: primary, textTransform: "uppercase", fontSize: "6.5pt", letterSpacing: "0.5px", marginBottom: "1px" }}>{field.label}</span>
                  <span style={{ display: "block", color: "#333", fontSize: "7.5pt" }}>{field.value}</span>
                </div>
              ))
            }
            <ul style={{ marginTop: "10px", paddingLeft: 0 }}>{sidebarBulletLines.map(renderSiteBullet)}</ul>
          </div>

          {/* Technologies Used Section */}
          {(data.showTech ?? true) && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>
                {data.techLabel || "Technologies Used"}
              </div>
              <ul style={{ paddingLeft: 0 }}>{techLines.map(renderSidebarBullet)}</ul>
            </div>
          )}

          {/* Delivery Model Section */}
          {(data.showDelivery ?? true) && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>
                {data.deliveryLabel || "Delivery Model"}
              </div>
              <div style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>{data.delivery}</div>
            </div>
          )}

          {/* Operations Section */}
          {(data.showOperations ?? true) && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>
                {data.operationsLabel || "Operations"}
              </div>
              <div style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>{data.operations}</div>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "14px 20px", minWidth: 0 }}>
          {data.statBar && (
            <div style={{ background: primary, color: "white", padding: "10px 14px", marginBottom: "16px", borderRadius: "2px" }}>
              <div style={{ fontSize: "9pt", fontWeight: 700, color: highlight, letterSpacing: "0.5px", lineHeight: 1.5 }}>
                <EditText field="statBar" value={data.statBar} style={{ fontSize: "9pt", fontWeight: 700, color: highlight }} />
              </div>
            </div>
          )}

          <div style={headingStyle}>Introduction</div>
          {data.intro.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              {editable ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="cs-editable-text"
                  style={{ display: "block" }}
                  onBlur={(e) => {
                    const el = e.currentTarget;
                    const parts = data.intro.split("\n\n");
                    parts[i] = el.innerText;
                    editField("intro", parts.join("\n\n"));
                  }}
                  dangerouslySetInnerHTML={{ __html: para }}
                />
              ) : para}
            </p>
          ))}
          <ImgBox src={data.plantImg} caption={data.plantCap} cfg={data.plantImgCfg} primary={primary} light={light} lightBorder={lightBorder} />

          <div style={headingStyle}>The Challenge</div>
          {data.challengeProblem && (
            <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              <strong>The Problem.</strong>{" "}
              <EditText field="challengeProblem" value={data.challengeProblem} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
            </p>
          )}
          {data.challengeLimits && (
            <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              <strong>Existing Limitations.</strong>{" "}
              <EditText field="challengeLimits" value={data.challengeLimits} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
            </p>
          )}

          <div style={headingStyle}>The Technical Solution</div>
          {data.solDesign && (
            <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              <strong>System Design.</strong>{" "}
              <EditText field="solDesign" value={data.solDesign} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
            </p>
          )}
          {data.solAuto && (
            <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              <strong>Automation &amp; Control.</strong>{" "}
              <EditText field="solAuto" value={data.solAuto} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
            </p>
          )}
          {data.solBOO && (
            <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222", marginBottom: "8px" }}>
              <strong>BOO Delivery Model.</strong>{" "}
              <EditText field="solBOO" value={data.solBOO} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
            </p>
          )}
          <ImgBox src={data.handshakeImg} caption={data.handshakeCap} cfg={data.handshakeImgCfg} primary={primary} light={light} lightBorder={lightBorder} />
        </div>
      </div>

      {/* PAGE BREAK */}
      <div className="cs-page-break" style={{ borderTop: `3px solid ${primary}`, marginTop: "8px" }} />

      {/* PAGE 2 BODY */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* LEFT SIDEBAR PAGE 2 */}
        <div style={{ width: "185px", minWidth: "185px", background: light, borderRight: `1px solid ${lightBorder}`, padding: "14px 12px" }}>
          {[
            ["Performance Stability", perfStabLines.map(renderSidebarBullet)],
            ["Value Delivered", valueDelLines.map(renderSidebarBullet)],
          ].map(([heading, bullets]) => (
            <div key={String(heading)} style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>{heading}</div>
              <ul style={{ paddingLeft: 0 }}>{bullets}</ul>
            </div>
          ))}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>Environmental Impact</div>
            <div style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.45 }}>
              <EditText field="envImpact" value={data.envImpact} multiline style={{ fontSize: "7.5pt", color: "#333" }} />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "7pt", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: `2px solid ${accent}`, paddingBottom: "3px", marginBottom: "7px" }}>For More Information</div>
            <div style={{ fontSize: "7.5pt", color: "#333", lineHeight: 1.6 }}>
              {data.companyName}<br />
              <span style={{ color: accent }}>{data.website}</span><br />
              {data.division}<br />
              {data.regions}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT PAGE 2 */}
        <div style={{ flex: 1, padding: "14px 20px", minWidth: 0 }}>
          <div style={headingStyle}>Operational Results</div>

          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
            {data.cards.filter((c) => c.number).map((card, i) => (
              <div key={i} style={{ flex: 1, border: `1px solid ${accent}`, borderTop: `4px solid ${accent}`, padding: "10px 10px 8px", borderRadius: "2px", textAlign: "center" }}>
                <div style={{ fontSize: "17pt", fontWeight: 700, color: accent, lineHeight: 1, marginBottom: "4px" }}>{card.number}</div>
                <div style={{ fontSize: "7pt", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>
                  {card.label.split("\n").map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={headingStyle}>Before &amp; After: Water Quality Comparison</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", margin: "8px 0" }}>
            <thead>
              <tr style={{ background: primary, color: "white" }}>
                {["Parameter", "Unit", "Feed (Raw)", "Treated Water"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, fontSize: "7.5pt", letterSpacing: "0.3px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waterRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : light }}>
                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${lightBorder}`, fontWeight: 600, color: primary, fontSize: "8pt" }}>{row.parameter}</td>
                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${lightBorder}`, color: "#555", fontSize: "8pt" }}>{row.unit}</td>
                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${lightBorder}`, color: "#333", fontSize: "8pt" }}>{row.feed}</td>
                  <td style={{ padding: "5px 8px", borderBottom: `1px solid ${lightBorder}`, color: "#1a6b3c", fontWeight: 600, fontSize: "8pt" }}>{row.treated}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ImgBox src={data.beakersImg} caption={data.beakersCap} cfg={data.beakersImgCfg} primary={primary} light={light} lightBorder={lightBorder} />
              {data.fig1text && (
                <div style={{ background: light, border: `1px solid ${lightBorder}`, borderRadius: "2px", padding: "8px 10px", fontSize: "7.5pt", color: "#444", lineHeight: 1.5, fontStyle: "italic", marginTop: "6px" }}>
                  <EditText field="fig1text" value={data.fig1text} multiline style={{ fontSize: "7.5pt", color: "#444" }} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={headingStyle}>Conclusions</div>
              <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#222" }}>
                <EditText field="conclusions" value={data.conclusions} multiline style={{ fontSize: "8.5pt", color: "#222" }} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: primary, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
        <div style={{ fontSize: "7pt", color: headerCat, letterSpacing: "0.3px" }}>
          {data.companyName} &nbsp;|&nbsp; {data.website}
        </div>
        <div style={{ fontSize: "7pt", color: headerSub }}>
          {data.division} &nbsp;·&nbsp; {data.regions}
        </div>
      </div>
    </div>
  );
}
