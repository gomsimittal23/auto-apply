# AI LaTeX Resume Tailoring Tool

A local CLI-first application that automatically tailors your master resume to fit any job description, calculates an automated ATS match score, and compiles the tailored resume into a beautiful, print-ready PDF using LaTeX and the Google Gemini API.

---

## Features

- **Zero-Prompt Automation:** Paste a job description into a file and run the command. The AI automatically extracts the hiring company name and job title from the text.
- **ATS Match Scorecard:** Evaluates and displays a structured, colored matching scorecard directly in the terminal—reporting your score, matching keywords, missing keywords, and specific improvements.
- **Job History Tracking:** Every single run is recorded in a local JSON database (`dist/output/history.json`) alongside the full job description text and matching metadata.
- **Override Protection:** Instead of overwriting previous results, each run outputs a uniquely named LaTeX and PDF file:
  `dist/output/resumes/resume_[Company]_[Role]_[Timestamp].pdf`
- **Flawless Spacing & Margins:** Dynamically formatted using a compact LaTeX template to ensure the tailored resume fits **exactly on 1 page** without text spillovers.
- **Grammar & Casing Guard:** Enforces strict styling guidelines to prevent double qualifiers (e.g. "over 50k+"), grammatical parallel structure errors, and incorrect technology casing (Node.js, AngularJS, ClickHouse, PostgreSQL).

---

## Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher recommended)
2. **Tectonic** (A modern, self-contained LaTeX engine)
   - Install via Homebrew (macOS): `brew install tectonic`
   - Or download from [Tectonic Installation Guide](https://tectonic-typesetting.github.io/en-US/install.html).

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd auto-apply
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and insert your Google Gemini API Key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Prepare your Resume:**
   Initialize your master resume from the template:
   ```bash
   cp src/data/master_resume.example.json src/data/master_resume.json
   ```
   Open `src/data/master_resume.json` and fill in your actual skills, contact details, experiences, metrics, and education.

---

## How to Run

1. Paste your target job description text into `job_description.txt` at the root of the project.
2. Build the TypeScript compiler and run the tailor command:
   ```bash
   npm run build
   npm run tailor
   ```
3. Look at your terminal for the generated **ATS Score Card**! Your customized PDF and LaTeX source will be generated in `dist/output/resumes/`.

---

## File Structure

- `src/data/master_resume.json`: Your local master resume data (ignored by git).
- `src/data/master_resume.example.json`: Generic placeholder template for version control.
- `src/templates/resume.tex`: Core LaTeX styling template.
- `src/services/ai.service.ts`: Google GenAI interface handling prompting and structured JSON schema validations.
- `src/services/latex.service.ts`: Translates tailored resume data to LaTeX files and runs the Tectonic compiler.
- `src/services/history.service.ts`: Manages log records stored in the JSON database.
- `dist/output/history.json`: Local database showing your application history (ignored by git).
