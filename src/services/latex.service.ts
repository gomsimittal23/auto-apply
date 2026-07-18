import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { escapeLatex } from "../utils/latex-escaper";
import { TailoredResumeData } from "./ai.service";

export class LatexService {
  private templatePath: string;

  constructor(templatePath: string) {
    this.templatePath = templatePath;
  }

  /**
   * Builds the LaTeX code by replacing placeholders with escaped dynamic content,
   * then compiles it to PDF using Tectonic.
   */
  async generatePDF(
    tailoredData: TailoredResumeData,
    masterResume: any,
    outputPath: string
  ): Promise<string> {
    // 1. Read LaTeX template
    let latexCode = fs.readFileSync(this.templatePath, "utf-8");

    // 2. Escape and replace Personal Info
    const personalInfo = masterResume.personal_info;
    latexCode = latexCode
      .replace(/<<NAME>>/g, escapeLatex(personalInfo.name))
      .replace(/<<EMAIL>>/g, escapeLatex(personalInfo.email))
      .replace(/<<PHONE>>/g, escapeLatex(personalInfo.phone))
      .replace(/<<LOCATION>>/g, escapeLatex(personalInfo.location))
      .replace(/<<LINKEDIN>>/g, escapeLatex(personalInfo.linkedin))
      .replace(/<<GITHUB>>/g, escapeLatex(personalInfo.website));

    // 3. Escape and replace Summary
    latexCode = latexCode.replace(/<<SUMMARY>>/g, escapeLatex(tailoredData.summary));

    // 4. Escape and replace Skills
    const skills = tailoredData.skills;
    latexCode = latexCode
      .replace(/<<SKILLS_LANGUAGES>>/g, escapeLatex(skills.languages.join(", ")))
      .replace(/<<SKILLS_FRAMEWORKS>>/g, escapeLatex(skills.frameworks.join(", ")))
      .replace(/<<SKILLS_DATABASES>>/g, escapeLatex(skills.databases.join(", ")))
      .replace(/<<SKILLS_TOOLS>>/g, escapeLatex(skills.tools.join(", ")));

    // 5. Format and replace Experience
    let experienceLatex = "";
    // We want to preserve the order of dates from master resume but match the tailored bullets
    const matchedIndices = new Set<number>();
    
    for (const exp of tailoredData.experience) {
      // Find the corresponding original experience by company and role, or fallback to index matching
      let originalExpIndex = masterResume.experience.findIndex(
        (e: any, idx: number) =>
          !matchedIndices.has(idx) &&
          (e.company.toLowerCase().includes(exp.company.toLowerCase()) ||
           exp.company.toLowerCase().includes(e.company.toLowerCase())) &&
          (e.role.toLowerCase().includes(exp.role.toLowerCase()) ||
           exp.role.toLowerCase().includes(e.role.toLowerCase()))
      );

      // Fallback: match by company only (first unused one)
      if (originalExpIndex === -1) {
        originalExpIndex = masterResume.experience.findIndex(
          (e: any, idx: number) =>
            !matchedIndices.has(idx) &&
            (e.company.toLowerCase().includes(exp.company.toLowerCase()) ||
             exp.company.toLowerCase().includes(e.company.toLowerCase()))
        );
      }

      const originalExp = originalExpIndex !== -1 ? masterResume.experience[originalExpIndex] : null;
      if (originalExpIndex !== -1) {
        matchedIndices.add(originalExpIndex);
      }

      const location = originalExp ? originalExp.location : "";
      const startDate = originalExp ? originalExp.start_date : "";
      const endDate = originalExp ? originalExp.end_date : "";

      experienceLatex += `\\noindent\n`;
      experienceLatex += `\\textbf{${escapeLatex(exp.role)}} $|$ \\textbf{${escapeLatex(exp.company)} (${escapeLatex(location)})} \\hfill \\textbf{${escapeLatex(startDate)} -- ${escapeLatex(endDate)}}\n`;
      experienceLatex += `\\begin{itemize}\n`;
      for (const bullet of exp.bullets) {
        experienceLatex += `    \\item ${escapeLatex(bullet)}\n`;
      }
      experienceLatex += `\\end{itemize}\n\\vspace{3pt}\n\n`;
    }
    latexCode = latexCode.replace(/<<EXPERIENCE>>/g, experienceLatex);

    // 6. Format and replace Projects
    let projectsLatex = "";
    for (const project of tailoredData.projects) {
      projectsLatex += `\\noindent\n`;
      projectsLatex += `\\textbf{${escapeLatex(project.name)}} \\hfill \\textit{${escapeLatex(project.tech_stack)}} \\\\\n`;
      projectsLatex += `${escapeLatex(project.description)}\n\\vspace{3pt}\n\n`;
    }
    latexCode = latexCode.replace(/<<PROJECTS>>/g, projectsLatex);

    // 7. Format and replace Education (comes directly from master resume as it doesn't change)
    let educationLatex = "";
    for (const edu of masterResume.education) {
      educationLatex += `\\noindent\n`;
      educationLatex += `\\textbf{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.location)} \\\\\n`;
      educationLatex += `\\textit{${escapeLatex(edu.degree)}} \\hfill ${escapeLatex(edu.start_date)} -- ${escapeLatex(edu.end_date)}\n\\vspace{3pt}\n\n`;
    }
    latexCode = latexCode.replace(/<<EDUCATION>>/g, educationLatex);

    // 8. Create Output Directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 9. Write intermediate .tex file
    const texPath = outputPath.replace(/\.pdf$/, ".tex");
    fs.writeFileSync(texPath, latexCode, "utf-8");
    console.log(`Generated LaTeX file at: ${texPath}`);

    // 10. Compile via Tectonic
    try {
      console.log(`Compiling LaTeX via Tectonic...`);
      // Run tectonic on the intermediate file, directing output to the correct folder
      execSync(`tectonic "${texPath}" --outdir "${outputDir}"`, { stdio: "inherit" });
      console.log(`PDF compiled successfully to: ${outputPath}`);
      return outputPath;
    } catch (error: any) {
      console.error("Compilation error:", error);
      throw new Error(`Failed to compile LaTeX to PDF. Ensure 'tectonic' is installed globally. Error: ${error.message}`);
    }
  }
}
