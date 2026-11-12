import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
fs.mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, "heartrisk.db"));
db.exec(`CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  label TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL,
  probability REAL NOT NULL,
  risk_band TEXT NOT NULL,
  inputs TEXT NOT NULL
)`);

export const addAssessment = (a) =>
  db.prepare("INSERT INTO assessments (label, model, probability, risk_band, inputs) VALUES (?,?,?,?,?)")
    .run(a.label, a.model, a.probability, a.risk_band, JSON.stringify(a.inputs)).lastInsertRowid;

const row = (r) => ({ ...r, inputs: JSON.parse(r.inputs) });  // node:sqlite returns null-prototype rows, so copy them
export const listAssessments = (limit = 100) =>
  db.prepare("SELECT * FROM assessments ORDER BY id DESC LIMIT ?").all(limit).map(row);
export const getAssessment = (id) => { const r = db.prepare("SELECT * FROM assessments WHERE id = ?").get(id); return r ? row(r) : null; };
export const deleteAssessment = (id) => db.prepare("DELETE FROM assessments WHERE id = ?").run(id).changes > 0;
export const clearAssessments = () => db.prepare("DELETE FROM assessments").run();
