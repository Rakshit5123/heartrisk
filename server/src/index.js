import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FEATURES, loadModels, predict, explain } from "./infer.js";
import { addAssessment, listAssessments, getAssessment, deleteAssessment, clearAssessments } from "./db.js";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const MODELS = loadModels(path.join(dataDir, "model.json"));
const metricsFile = path.join(dataDir, "metrics.json");
const METRICS = fs.existsSync(metricsFile) ? JSON.parse(fs.readFileSync(metricsFile, "utf8")) : null;
const DEFAULT_MODEL = MODELS.svm_tuned ? "svm_tuned" : Object.keys(MODELS)[0];

// [min, max, integer?, allowed values?]
const RULES = {
  age: [1, 120, true], sex: [0, 1, true], cp: [1, 4, true], trestbps: [50, 260], chol: [50, 700],
  fbs: [0, 1, true], restecg: [0, 2, true], thalach: [40, 260], exang: [0, 1, true],
  oldpeak: [0, 10], slope: [1, 3, true], ca: [0, 3, true], thal: [3, 7, true, [3, 6, 7]],
};
function validate(inputs) {
  const errors = [], clean = {};
  for (const f of FEATURES) {
    const [min, max, int, allowed] = RULES[f];
    const v = inputs?.[f] === "" || inputs?.[f] == null ? NaN : Number(inputs[f]);
    if (!Number.isFinite(v)) errors.push(`${f} is required`);
    else if (v < min || v > max) errors.push(`${f} must be between ${min} and ${max}`);
    else if (int && !Number.isInteger(v)) errors.push(`${f} must be a whole number`);
    else if (allowed && !allowed.includes(v)) errors.push(`${f} must be one of ${allowed.join(", ")}`);
    else clean[f] = v;
  }
  return { errors, clean };
}
const band = (p) => (p < 0.35 ? "low" : p < 0.65 ? "moderate" : "high");

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(",") }));
app.use(express.json({ limit: "20kb" }));

const ready = (req, res, next) =>
  Object.keys(MODELS).length ? next() : res.status(503).json({ error: "Models not trained yet. Run the steps in ml/ first." });

app.get("/api/health", (_req, res) => res.json({ ok: true, models: Object.keys(MODELS).length > 0 }));
app.get("/api/models", ready, (_req, res) =>
  res.json({ default: DEFAULT_MODEL, models: Object.keys(MODELS).map((key) => ({ key, name: METRICS?.models?.[key]?.name || key })) }));
app.get("/api/metrics", ready, (_req, res) => (METRICS ? res.json(METRICS) : res.status(404).json({ error: "metrics.json missing" })));

app.post("/api/predict", ready, (req, res) => {
  const { inputs, model = DEFAULT_MODEL, label = "", save = true } = req.body || {};
  if (!MODELS[model]) return res.status(404).json({ error: `Unknown model '${model}'` });
  const { errors, clean } = validate(inputs);
  if (errors.length) return res.status(422).json({ error: errors.join("; ") });
  const probability = Math.round(predict(MODELS, model, clean) * 10000) / 10000;
  const result = { model, probability, risk_band: band(probability) };
  const comparison = Object.keys(MODELS).map((k) => ({
    model: k, name: METRICS?.models?.[k]?.name || k,
    probability: Math.round(predict(MODELS, k, clean) * 10000) / 10000,
  }));
  if (save) result.id = Number(addAssessment({ ...result, label: String(label).slice(0, 80), inputs: clean }));
  res.json({ ...result, comparison, factors: explain(MODELS, model, clean), disclaimer: "Educational tool trained on about 300 records. Not a medical diagnosis." });
});

app.get("/api/assessments", (_req, res) => res.json(listAssessments()));
app.get("/api/assessments/:id", (req, res) => { const a = getAssessment(Number(req.params.id)); a ? res.json(a) : res.status(404).json({ error: "Not found" }); });
app.delete("/api/assessments/:id", (req, res) => (deleteAssessment(Number(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "Not found" })));
app.delete("/api/assessments", (_req, res) => { clearAssessments(); res.status(204).end(); });

app.use((err, _req, res, _next) => { console.error(err); res.status(400).json({ error: "Bad request" }); });
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`HeartRisk API on http://localhost:${port}` + (Object.keys(MODELS).length ? "" : "  (no models yet: run ml/train.py)")));
