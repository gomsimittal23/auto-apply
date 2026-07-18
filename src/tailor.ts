import * as fs from "fs";
import * as path from "path";
import { AIService } from "./services/ai.service";
import { LatexService } from "./services/latex.service";
import { HistoryService } from "./services/history.service";

// ANSI Terminal Formatting Helpers
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

function getScoreColor(score: number): string {
  if (score >= 90) return GREEN;
  if (score >= 70) return YELLOW;
  return RED;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_") // Replace non-alphanumeric with underscores
    .replace(/_+/g, "_")          // Collapse multiple underscores
    .replace(/^_+|_+$/g, "");      // Trim leading/trailing underscores
}

async function main() {
  console.log(`${BOLD}${CYAN}=== AI LaTeX Resume Tailoring Tool ===${RESET}`);

  // 1. Get Job Description Path from command-line arguments
  let jdPath = process.argv[2];
  if (!jdPath) {
    jdPath = path.resolve(process.cwd(), "job_description.txt");
    console.log(`No job description file specified. Defaulting to: ${jdPath}`);
  } else {
    jdPath = path.resolve(process.cwd(), jdPath);
  }

  // 2. Read Job Description Content
  if (!fs.existsSync(jdPath)) {
    console.error(`${RED}Error: Job description file not found at ${jdPath}${RESET}`);
    process.exit(1);
  }

  const jobDescription = fs.readFileSync(jdPath, "utf-8");
  console.log(`Loaded Job Description (${jobDescription.length} characters).`);

  // 3. Load Master Resume
  const resumePath = path.resolve(process.cwd(), "src/data/master_resume.json");
  if (!fs.existsSync(resumePath)) {
    console.error(`${RED}Error: Master resume JSON not found at ${resumePath}${RESET}`);
    process.exit(1);
  }

  const masterResume = JSON.parse(fs.readFileSync(resumePath, "utf-8"));
  console.log(`Loaded Master Resume for ${BOLD}${masterResume.personal_info.name}${RESET}.`);

  // 4. Run AI Customizer
  console.log("\nContacting Gemini AI to tailor your resume details...");
  try {
    const aiService = new AIService();
    const tailoredData = await aiService.tailorResume(masterResume, jobDescription);
    console.log(`${GREEN}Resume details successfully tailored by AI!${RESET}`);

    // Create timestamp for unique filenames
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, "_")
      .replace(/\..+/, "")
      .replace(/:/g, ""); // Format: YYYY-MM-DD_HHMMSS

    const safeCompany = sanitizeFilename(tailoredData.company);
    const safeRole = sanitizeFilename(tailoredData.role);
    const fileBaseName = `resume_${safeCompany}_${safeRole}_${timestamp}`;

    // Define output directory under dist/output/resumes
    const outputDir = path.resolve(process.cwd(), "dist/output/resumes");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPdfPath = path.resolve(outputDir, `${fileBaseName}.pdf`);
    const templatePath = path.resolve(process.cwd(), "src/templates/resume.tex");

    // 5. Compile to LaTeX & PDF
    const latexService = new LatexService(templatePath);
    await latexService.generatePDF(tailoredData, masterResume, outputPdfPath);

    // 6. Write record to local JSON database
    const historyService = new HistoryService();
    const savedRecord = historyService.addRecord({
      company: tailoredData.company,
      role: tailoredData.role,
      atsScore: tailoredData.ats_score,
      pdfPath: outputPdfPath,
      matchedKeywords: tailoredData.matched_keywords,
      missingKeywords: tailoredData.missing_keywords,
      jobDescription: jobDescription
    });

    // 7. Display Premium Terminal Score Card
    const scoreColor = getScoreColor(tailoredData.ats_score);
    const border = "═".repeat(60);
    const divider = "─".repeat(60);

    console.log(`\n${BOLD}${scoreColor}╔${border}╗${RESET}`);
    console.log(`${BOLD}${scoreColor}║${" ".repeat(21)}ATS MATCH SCORE${" ".repeat(22)}║${RESET}`);
    
    const scoreStr = `${tailoredData.ats_score}%`;
    const scorePaddingLeft = Math.floor((60 - scoreStr.length) / 2);
    const scorePaddingRight = 60 - scoreStr.length - scorePaddingLeft;
    console.log(`${BOLD}${scoreColor}║${" ".repeat(scorePaddingLeft)}${scoreStr}${" ".repeat(scorePaddingRight)}║${RESET}`);
    console.log(`${BOLD}${scoreColor}╠${border}╣${RESET}`);
    
    console.log(`${BOLD} Company:${RESET} ${tailoredData.company}`);
    console.log(`${BOLD} Position:${RESET} ${tailoredData.role}`);
    console.log(`${BOLD} Output PDF:${RESET} ${outputPdfPath}`);
    console.log(`${BOLD} Log ID:${RESET} ${savedRecord.id}`);
    console.log(`${BOLD}${scoreColor}╟${divider}╢${RESET}`);

    console.log(`${BOLD}${GREEN} MATCHED KEYWORDS:${RESET}`);
    if (tailoredData.matched_keywords.length > 0) {
      console.log(`  • ${tailoredData.matched_keywords.join(", ")}`);
    } else {
      console.log("  None");
    }
    console.log(`${BOLD}${scoreColor}╟${divider}╢${RESET}`);

    console.log(`${BOLD}${RED} MISSING KEYWORDS:${RESET}`);
    if (tailoredData.missing_keywords.length > 0) {
      console.log(`  • ${tailoredData.missing_keywords.join(", ")}`);
    } else {
      console.log("  None");
    }
    console.log(`${BOLD}${scoreColor}╟${divider}╢${RESET}`);

    console.log(`${BOLD}${YELLOW} SUGGESTED IMPROVEMENTS:${RESET}`);
    if (tailoredData.suggestions.length > 0) {
      tailoredData.suggestions.forEach(sug => {
        console.log(`  → ${sug}`);
      });
    } else {
      console.log("  None");
    }
    console.log(`${BOLD}${scoreColor}╚${border}╝${RESET}\n`);

  } catch (error: any) {
    console.error(`\n${RED}❌ Pipeline failed during execution:${RESET}`);
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

main();
