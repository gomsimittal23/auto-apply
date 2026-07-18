import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

// Define the structure of the tailored resume response from AI
export interface TailoredResumeData {
  company: string;
  role: string;
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  summary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
  };
  experience: {
    company: string;
    role: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    tech_stack: string;
    description: string;
  }[];
}

// Define JSON Schema for Gemini structured output
const tailoredSchema = {
  type: "OBJECT",
  properties: {
    company: {
      type: "STRING",
      description: "The name of the hiring company extracted from the job description. Default to 'Unknown' if not clearly identified."
    },
    role: {
      type: "STRING",
      description: "The job title or role being applied for, extracted from the job description. Default to 'Unknown' if not clearly identified."
    },
    ats_score: {
      type: "INTEGER",
      description: "Calculated ATS compatibility score (0-100) based on how well the candidate's skills and experiences match the JD requirements."
    },
    matched_keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of skills, technologies, and methodologies from the JD that are matched in the resume."
    },
    missing_keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of key requirements from the JD that the candidate does not have in their master resume."
    },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Concise actionable advice for the candidate to bridge any critical skill gaps (e.g. learning certain libraries)."
    },
    summary: {
      type: "STRING",
      description: "A tailored professional summary highlighting relevant experience for the target job."
    },
    skills: {
      type: "OBJECT",
      properties: {
        languages: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Filtered list of relevant programming languages from the master resume, ordered by relevance."
        },
        frameworks: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Filtered list of relevant frameworks/libraries from the master resume, ordered by relevance."
        },
        databases: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Filtered list of relevant databases from the master resume, ordered by relevance."
        },
        tools: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Filtered list of relevant tools/DevOps from the master resume, ordered by relevance."
        }
      },
      required: ["languages", "frameworks", "databases", "tools"]
    },
    experience: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          role: { type: "STRING" },
          bullets: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Customized and tailored bullet points for this role, emphasizing matching skills and achievements relevant to the JD."
          }
        },
        required: ["company", "role", "bullets"]
      },
      description: "Roles from the master resume with rewritten bullets to match the job description."
    },
    projects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          tech_stack: { type: "STRING" },
          description: { type: "STRING", description: "Tailored project description highlighting relevant skills used." }
        },
        required: ["name", "tech_stack", "description"]
      },
      description: "Relevant projects from the master resume with tailored descriptions."
    }
  },
  required: [
    "company",
    "role",
    "ats_score",
    "matched_keywords",
    "missing_keywords",
    "suggestions",
    "summary",
    "skills",
    "experience",
    "projects"
  ]
};

export class AIService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables or .env file.");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates tailored resume content based on the master resume and job description.
   */
  async tailorResume(masterResume: any, jobDescription: string): Promise<TailoredResumeData> {
    const prompt = `
You are an expert technical recruiter and resume writer specializing in ATS (Applicant Tracking System) optimization.
Your task is to tailor a candidate's master resume to fit a specific Job Description (JD) to achieve an ATS match score above 90%.

Here is the candidate's master resume:
${JSON.stringify(masterResume, null, 2)}

Here is the target Job Description:
${jobDescription}

INSTRUCTIONS FOR HIGH ATS RATING:
1. **Truthfulness:** Do NOT invent any new companies, roles, projects, degrees, skills, or achievements. Keep the candidate's history 100% truthful.
2. **Quantifying Impact:** You MUST preserve and highlight every single metric, percentage, scale, and numeric value from the master resume (e.g., "30M+ users", "50% performance improvement", "70% search latency reduction", "20% system efficiency", "40% load speed", "30% production issues reduction", "25% user adoption"). Do not dilute, summarize away, or remove these numbers.
3. **Strict Verb Restriction (CRITICAL):** To avoid repetition, you are strictly FORBIDDEN from using the words "developed", "engineered", and "implemented" (in any tense, including "develop", "developing", "engineered", "engineered", "implemented", "implemented", "developed", "developed") anywhere in the summary, experience bullets, or project descriptions. Instead, you MUST use diverse synonyms such as "designed", "built", "authored", "constructed", "launched", "architected", "created", "spearheaded", "managed", "configured", "optimized", "integrated". Do not repeat exact terms like "RESTful APIs" in every single job description or project unless necessary.
4. **Professional Summary:** Rewrite the summary to highlight experience, languages, and frameworks that directly match the JD. Focus on results and key technologies.
5. **Skills:** From the master resume's skills list, extract and group the skills most relevant to the JD. Order them by relevance, placing matching skills first.
6. **Experience Bullets:** For each experience entry, customize the bullet points:
   - Rewrite or emphasize accomplishments that utilize technologies or skills requested in the JD (e.g., if the JD asks for Playwright, Redis, Docker, or PostgreSQL, highlight those accomplishments).
   - Rephrase bullets using exact keywords from the JD (e.g., "RESTful APIs" instead of "backend services" if the JD uses "RESTful APIs") to optimize keyword matching.
   - Retain the exact original metrics, but frame the context to match what the recruiter/JD seeks.
7. **Projects:** Select and highlight the projects from the master resume that showcase skills relevant to the JD. Reword descriptions to focus on relevant tech stack details and matching skills.

CRITICAL GRAMMAR, SPELLING & CASING SANITY RULES (MUST FOLLOW STRICTLY):
- **NO Double Qualifiers:** NEVER write double qualifiers like "over 50k+", "more than 30M+", or "over 100k+". Use either the word ("over 50k", "more than 30M") OR the plus sign ("50k+", "30M+"), but never both together.
- **Flawless Parallel Structure:** Ensure list items or bullet points maintain a clean parallel structure. For example, do not mix nouns with active verbs (do NOT write: "...resulting in a 40% speed improvement, a 30% reduction in bugs, and saving 8 hours". Instead write: "...resulting in a 40% speed improvement, a 30% reduction in bugs, and 8+ saved hours" or "...resulting in a 40% speed improvement, a 30% reduction in bugs, and a savings of 8 hours").
- **Complete Sentences:** All tailored descriptions and bullet points must be complete, grammatically sound sentences.
- **Standardized Capitalization:** Keep technology names exactly as they are capitalized in the master resume. Do NOT rewrite them. Specifically, always write:
  - "Node.js" (never Nodejs or NodeJs)
  - "ClickHouse" (never Clickhouse)
  - "AngularJS" (never Angularjs or AngularJs)
  - "PostgreSQL" (never Postgresql)
  - "RESTful APIs" (never REST APIs or RESTful apis)

Return the result strictly conforming to the specified JSON schema.
`;

    const response = await this.client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tailoredSchema as any,
        temperature: 0.2 // low temperature for consistent and precise structure mapping
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Failed to get response text from Gemini API.");
    }

    try {
      return JSON.parse(responseText) as TailoredResumeData;
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      throw new Error("Gemini output was not valid JSON matching the schema.");
    }
  }
}
