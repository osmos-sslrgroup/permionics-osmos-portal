import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const pdfPath = "/Users/lav/.gemini/antigravity/brain/9bac38f2-02c4-4610-9db0-9f7f32e13d0b/media__1783584017635.pdf";
const dataBuffer = fs.readFileSync(pdfPath);

const parser = new PDFParse({ data: dataBuffer });

parser.getText()
  .then(data => {
    console.log("Success! Text length:", data.text.length);
    console.log("Snippet:", data.text.slice(0, 300));
    process.exit(0);
  })
  .catch(err => {
    console.error("Failed:", err);
    process.exit(1);
  });
