"use client";
import { useEffect, useState } from "react";
import { getAssessments, getModels, removeAssessment, clearAssessments } from "../../lib/api";
import PageHead from "../../components/PageHead";
import HistoryView from "../../components/HistoryView";

export default function History() {
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [err, setErr] = useState("");

  const load = () => getAssessments().then(setRows).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    getModels().then((d) => setNames(Object.fromEntries(d.models.map((m) => [m.key, m.name])))).catch(() => {});
  }, []);

  async function del(id) { try { await removeAssessment(id); load(); } catch (e) { setErr(e.message); } }
  async function clear() {
    if (!confirm("Delete all saved assessments?")) return;
    try { await clearAssessments(); load(); } catch (e) { setErr(e.message); }
  }
  return (
    <div className="wrap page">
      <PageHead kicker="History" title="Saved assessments">Every screening is stored in the database so you can compare patients and models over time.</PageHead>
      <HistoryView rows={rows} names={names} err={err} onDelete={del} onClear={clear} />
    </div>
  );
}
