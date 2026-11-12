"use client";
import { useEffect, useState } from "react";
import { getMetrics } from "../../lib/api";
import PageHead from "../../components/PageHead";
import EvidenceView from "../../components/EvidenceView";

export default function Evidence() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { getMetrics().then(setData).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="wrap page">
      <PageHead kicker="Model evidence" title="How the classifiers compare">Accuracy, precision, recall, F1 and AUC for every model, plus the ROC curves and the features that matter most.</PageHead>
      <EvidenceView data={data} err={err} />
    </div>
  );
}
