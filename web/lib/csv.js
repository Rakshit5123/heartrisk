import { ALL_FIELDS } from "./fields";

// Spreadsheet apps run text that starts with = + - @ as a formula, so defuse it with a leading apostrophe.
const cell = (v) => {
  let t = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return '"' + t.replace(/"/g, '""') + '"';
};

export function toCsv(rows) {
  const head = ["id", "created_at_utc", "label", "model", "risk_band", "probability", ...ALL_FIELDS.map((f) => f.k)];
  const lines = rows.map((r) => [r.id, r.created_at, r.label, r.model, r.risk_band, r.probability, ...ALL_FIELDS.map((f) => r.inputs[f.k])].map(cell).join(","));
  return [head.map(cell).join(","), ...lines].join("\r\n");
}

export function downloadCsv(rows) {
  const url = URL.createObjectURL(new Blob(["\ufeff" + toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "heartrisk-history.csv"; a.click();
  URL.revokeObjectURL(url);
}
