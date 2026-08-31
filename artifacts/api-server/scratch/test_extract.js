import fs from "fs";
// Polyfill DOMMatrix for Node.js to prevent pdfjs-dist crash
if (!globalThis.DOMMatrix) {
  globalThis.DOMMatrix = class DOMMatrix { constructor() { return {}; } };
}
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const extractPdfText = async (filePath) => {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
};

const pdfPath = "/Users/lav/.gemini/antigravity/brain/9bac38f2-02c4-4610-9db0-9f7f32e13d0b/media__1783584017635.pdf";
extractPdfText(pdfPath)
  .then(text => {
    console.log("Success! Extracted text length:", text.length);
    console.log("Snippet:", text.slice(0, 300));
    process.exit(0);
  })
  .catch(err => {
    console.error("Extraction failed:", err);
    process.exit(1);
  });
