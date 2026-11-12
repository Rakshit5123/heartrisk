import { LABELS, pct } from "../lib/fields";
import Roc from "./Roc";

export default function EvidenceView({ data, err }) {
  if (err) return <p className="error" role="alert">{err}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { models, meta } = data;
  const max = Math.max(...meta.importance.map((i) => i.value));
  return (
    <div className="stack">
      <section className="sheet">
        <h2>Test and cross-validated scores</h2>
        <p className="muted">Test split: {meta.n_test} patients. The cross-validated column (5 folds on the {meta.n_train} training patients) is the more honest estimate, because a single small split can flatter a model.</p>
        <div className="scroll"><table>
          <thead><tr><th>Model</th><th>Test acc.</th><th>Precision</th><th>Recall</th><th>F1</th><th>AUC</th><th>CV acc.</th></tr></thead>
          <tbody>{Object.entries(models).map(([k, m]) => (
            <tr key={k}><td>{m.name}</td><td>{pct(m.accuracy)}</td><td>{pct(m.precision)}</td><td>{pct(m.recall)}</td><td>{pct(m.f1)}</td><td>{m.auc.toFixed(2)}</td><td>{pct(m.cv_mean)} ± {pct(m.cv_std)}</td></tr>))}</tbody>
        </table></div>
      </section>
      <div className="split even">
        <section className="sheet"><h2>ROC curves</h2><Roc models={models} /></section>
        <section className="sheet"><h2>What drives the prediction</h2>
          <p className="muted">Random Forest feature importance.</p>
          {meta.importance.map((i) => (
            <div key={i.feature} className="imp"><span>{LABELS[i.feature] || i.feature}</span>
              <div className="ibar"><span style={{ width: (i.value / max) * 100 + "%" }} /></div></div>))}
        </section>
      </div>
    </div>
  );
}
