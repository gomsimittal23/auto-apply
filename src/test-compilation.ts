import * as fs from "fs";
import * as path from "path";
import { LatexService } from "./services/latex.service";
import { TailoredResumeData } from "./services/ai.service";

async function testCompile() {
  console.log("=== Testing Resume Template Compilation ===");

  const masterResumePath = path.resolve(process.cwd(), "src/data/master_resume.json");
  const masterResume = JSON.parse(fs.readFileSync(masterResumePath, "utf-8"));

  // Create mock tailored data mimicking Gemini's expected output format
  const mockTailoredData: TailoredResumeData = {
    summary: "Dedicated Backend Engineer with 2+ years of experience specializing in Node.js, Fastify, TypeScript, and Laravel. Expert in database optimizations (PostgreSQL/SQLite) and Playwright browser automation.",
    skills: {
      languages: ["TypeScript", "JavaScript", "Python", "PHP", "SQL"],
      frameworks: ["Fastify", "Express", "Laravel", "React", "Next.js"],
      databases: ["PostgreSQL", "SQLite", "Redis"],
      tools: ["Docker", "AWS (EC2, S3)", "Playwright", "Git", "GitHub Actions"]
    },
    experience: [
      {
        company: "Tech Solutions Pvt. Ltd.",
        role: "Software Engineer",
        bullets: [
          "Developed high-performance RESTful APIs using Fastify & TypeScript, achieving 35% faster response times.",
          "Constructed high-throughput queue workers using Laravel and Redis for asynchronous job processing.",
          "Built a robust browser automation scraping pipeline with Playwright, saving 15 engineering hours weekly."
        ]
      },
      {
        company: "Innovate Labs",
        role: "Associate Backend Developer",
        bullets: [
          "Maintained core backend API services using Laravel and PostgreSQL.",
          "Implemented Redis caching systems, dropping database query latency by 40%.",
          "Built stripe payment integrations for seamless subscription billing."
        ]
      }
    ],
    projects: [
      {
        name: "Auto-Apply Job Agent",
        tech_stack: "Node.js, TypeScript, Playwright, SQLite, Gemini API",
        description: "Implemented a local daemon that automatically scrapes LinkedIn jobs, ranks them, and customizes resumes in LaTeX."
      }
    ]
  };

  const templatePath = path.resolve(process.cwd(), "src/templates/resume.tex");
  const outputPath = path.resolve(process.cwd(), "dist/output/test_resume.pdf");

  console.log(`Compiling test resume to: ${outputPath}`);
  const latexService = new LatexService(templatePath);
  try {
    await latexService.generatePDF(mockTailoredData, masterResume, outputPath);
    console.log("SUCCESS: Mock resume compiled perfectly!");
  } catch (error) {
    console.error("FAILURE: Mock resume compilation failed:", error);
    process.exit(1);
  }
}

testCompile();
