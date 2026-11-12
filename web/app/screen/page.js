"use client";
import { useEffect, useRef, useState } from "react";
import { GROUPS, ALL_FIELDS, EXAMPLE } from "../../lib/fields";
import { getModels, predict } from "../../lib/api";
import PageHead from "../../components/PageHead";
import ResultPanel from "../../components/ResultPanel";

export default function Screening() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [form, setForm] = useState({});
  const [label, setLabel] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    getModels().then((d) => { setModels(d.models); setModel(d.default); }).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => {
    if (res && window.matchMedia("(max-width: 820px)").matches) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [res]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const missing = ALL_FIELDS.some((f) => form[f.k] === undefined || form[f.k] === "");

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const inputs = Object.fromEntries(ALL_FIELDS.map((f) => [f.k, Number(form[f.k])]));
      setRes(await predict(inputs, model, label));
    } catch (x) { setErr(x.message); setRes(null); }
    setBusy(false);
  }

  return (
    <div className="wrap page">
      <PageHead kicker="Screening" title="Estimate heart disease risk">Enter the 13 measurements below. They go only to your own API, and each result is saved to your history.</PageHead>
      <div className="split">
        <form onSubmit={submit} className="sheet">
          <div className="row"><h2>Patient measurements</h2>
            <button type="button" className="link" onClick={() => setForm(EXAMPLE)}>Fill example values</button></div>
          {GROUPS.map((g) => (
            <fieldset key={g.title}><legend>{g.title}</legend>
              <div className="grid">
                {g.fields.map((f) => (
                  <label key={f.k}><span>{f.label}{f.unit && <span className="unit"> ({f.unit})</span>}</span>
                    {f.options ? (
                      <select value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)}>
                        <option value="" disabled>Choose…</option>
                        {f.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                      </select>
                    ) : (
                      <input type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step || 1} placeholder={`${f.min} to ${f.max}`}
                        value={form[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="grid">
            <label><span>Patient label <span className="unit">(optional, saved to history)</span></span>
              <input value={label} maxLength={80} placeholder="e.g. Case 14" onChange={(e) => setLabel(e.target.value)} /></label>
            <label><span>Model</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {models.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
              </select></label>
          </div>
          <button className="btn" disabled={missing || busy || !model}>{busy ? "Calculating…" : "Estimate risk"}</button>
          {err && <p className="error" role="alert">{err}</p>}
        </form>
        <div className="result" ref={resultRef}><ResultPanel res={res} /></div>
      </div>
    </div>
  );
}
