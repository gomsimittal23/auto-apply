import * as fs from "fs";
import * as path from "path";
import { AIService } from "./services/ai.service";
import { LatexService } from "./services/latex.service";

async function main() {
  console.log("=== AI LaTeX Resume Tailoring Tool ===");

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
    // If default file doesn't exist, create a dummy one for demonstration
    if (process.argv[2]) {
      console.error(`Error: Job description file not found at ${jdPath}`);
      process.exit(1);
    } else {
      console.log("Creating default 'job_description.txt' with a sample description...");
      const sampleJD = `
Job Title: Senior Backend Engineer (Node.js & TypeScript)
Company: NextGen Financial
Location: Remote (India)

About the Role:
We are looking for a Senior Backend Engineer to build robust financial services. You will design APIs, manage database scaling, and orchestrate background queues.

Requirements:
- Strong experience with Node.js and TypeScript.
- Hands-on experience with SQL databases (PostgreSQL or SQLite).
- Experience with key-value caches like Redis and background queue systems.
- Familiarity with browser automation tools like Playwright is a major plus.
- Experience containerizing services with Docker.
      `;
      fs.writeFileSync(jdPath, sampleJD.trim(), "utf-8");
    }
  }

  const jobDescription = fs.readFileSync(jdPath, "utf-8");
  console.log(`Loaded Job Description (${jobDescription.length} characters).`);

  // 3. Load Master Resume (Resolve relative to project root)
  const resumePath = path.resolve(process.cwd(), "src/data/master_resume.json");
  if (!fs.existsSync(resumePath)) {
    console.error(`Error: Master resume JSON not found at ${resumePath}`);
    process.exit(1);
  }

  const masterResume = JSON.parse(fs.readFileSync(resumePath, "utf-8"));
  console.log(`Loaded Master Resume for ${masterResume.personal_info.name}.`);

  // 4. Run AI Customizer
  console.log("Contacting Gemini AI to tailor your resume details...");
  try {
    const aiService = new AIService();
    const tailoredData = await aiService.tailorResume(masterResume, jobDescription);
    console.log("Resume details successfully tailored by AI!");

    // Save intermediate JSON for debugging/transparency
    const debugJsonPath = path.resolve(process.cwd(), "dist/output/tailored_resume.json");
    const outputDir = path.dirname(debugJsonPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(debugJsonPath, JSON.stringify(tailoredData, null, 2), "utf-8");
    console.log(`Saved intermediate tailored JSON data to: ${debugJsonPath}`);

    // 5. Compile to LaTeX & PDF
    const templatePath = path.resolve(process.cwd(), "src/templates/resume.tex");
    const outputPdfPath = path.resolve(process.cwd(), "dist/output/customized_resume.pdf");

    const latexService = new LatexService(templatePath);
    await latexService.generatePDF(tailoredData, masterResume, outputPdfPath);

    console.log("\n==========================================");
    console.log(" SUCCESS: Customized resume is ready!");
    console.log(` PDF Path: ${outputPdfPath}`);
    console.log("==========================================\n");

  } catch (error: any) {
    console.error("\n❌ Pipeline failed during execution:");
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
