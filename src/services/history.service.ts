import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface HistoryRecord {
  id: string;
  date: string;
  company: string;
  role: string;
  atsScore: number;
  pdfPath: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  jobDescription: string;
}

export class HistoryService {
  private historyFilePath: string;

  constructor() {
    // The history file is stored inside the output directory
    this.historyFilePath = path.resolve(process.cwd(), "dist/output/history.json");
  }

  /**
   * Initializes the history JSON file if it doesn't already exist.
   */
  private ensureHistoryFileExists(): void {
    const dir = path.dirname(this.historyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.historyFilePath)) {
      fs.writeFileSync(this.historyFilePath, JSON.stringify([], null, 2), "utf-8");
    }
  }

  /**
   * Retrieves all tailoring history records.
   */
  getHistory(): HistoryRecord[] {
    this.ensureHistoryFileExists();
    try {
      const data = fs.readFileSync(this.historyFilePath, "utf-8");
      return JSON.parse(data) as HistoryRecord[];
    } catch (error) {
      console.error("Failed to read history database file:", error);
      return [];
    }
  }

  /**
   * Appends a new tailoring record to the history database.
   * @returns The saved history record with generated ID and timestamp.
   */
  addRecord(record: Omit<HistoryRecord, "id" | "date">): HistoryRecord {
    this.ensureHistoryFileExists();
    const history = this.getHistory();

    const newRecord: HistoryRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString()
    };

    history.push(newRecord);

    try {
      fs.writeFileSync(this.historyFilePath, JSON.stringify(history, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to write to history database file:", error);
    }

    return newRecord;
  }
}
