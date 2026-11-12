const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function req(path, opts) {
  let r;
  try { r = await fetch(BASE + path, opts); }
  catch { throw new Error("Cannot reach the API at " + BASE + ". Is the server running?"); }
  if (r.status === 204) return null;
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Request failed (" + r.status + ")");
  return body;
}
const json = (method, data) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const getModels = () => req("/api/models");
export const getMetrics = () => req("/api/metrics");
export const predict = (inputs, model, label) => req("/api/predict", json("POST", { inputs, model, label }));
export const getAssessments = () => req("/api/assessments");
export const removeAssessment = (id) => req("/api/assessments/" + id, { method: "DELETE" });
export const clearAssessments = () => req("/api/assessments", { method: "DELETE" });
