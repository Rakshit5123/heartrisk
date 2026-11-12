import Link from "next/link";
import { LABELS, pct, describe } from "../lib/fields";

const MEANING = {
  low: "The model sees a pattern that is mostly seen in patients without heart disease.",
  moderate: "The model is unsure. Patients with a profile like this go either way.",
  high: "The model sees a pattern that is mostly seen in patients with heart disease.",
};

export default function ResultPanel({ res }) {
  if (!res) {
    return (
      <aside className="sheet" aria-live="polite">
        <p className="kicker">Result</p>
        <p className="muted">Fill in all 13 measurements and choose Estimate risk. The estimate appears here and is saved to your history.</p>
      </aside>
    );
  }
  const cmp = res.comparison || [];
  const highSide = cmp.filter((c) => c.probability >= 0.5).length;
  const agree = cmp.length > 1 && (highSide === 0 || highSide === cmp.length);
  const max = Math.max(...(res.factors || []).map((x) => Math.abs(x.delta)), 0.01);
  return (
    <aside className="sheet" aria-live="polite">
      <p className="kicker">Estimated probability of heart disease</p>
      <p className={"big " + res.risk_band}>{pct(res.probability)}<small>%</small></p>
      <div className="strip" role="img" aria-label={`Risk marker at ${pct(res.probability)} percent`}>
        <span className="zone low" /><span className="zone moderate" /><span className="zone high" />
        <i style={{ left: pct(res.probability) + "%" }} />
      </div>
      <p className={"band " + res.risk_band}>{res.risk_band} risk band</p>
      <p className="guide">{MEANING[res.risk_band]}</p>
      {cmp.length > 1 && (
        <div className="all">
          <h2>How every model scored this patient</h2>
          <p className={"agree " + (agree ? "yes" : "no")}>
            {agree ? `All ${cmp.length} models land on the same side: ${highSide ? "higher" : "lower"} risk.` : "The models disagree. Treat this estimate as uncertain."}
          </p>
          <ul>
            {cmp.map((c) => (
              <li key={c.model} className={c.model === res.model ? "sel" : ""}>
                <span>{c.name}</span>
                <span className="dots" aria-hidden="true"><i style={{ left: pct(c.probability) + "%" }} /></span>
                <b>{pct(c.probability)}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      {res.factors?.length > 0 && (
        <div className="why">
          <h2>Why this estimate</h2>
          <ul>
            {res.factors.map((f) => {
              const w = (Math.abs(f.delta) / max) * 50;
              const up = f.delta > 0;
              const pts = Math.abs(Math.round(f.delta * 100));
              return (
                <li key={f.feature}>
                  <span>{LABELS[f.feature]}: <b>{describe(f.feature, f.value)}</b></span>
                  <span className="diverge" aria-hidden="true">
                    <i className={up ? "up" : "down"} style={up ? { left: "50%", width: w + "%" } : { right: "50%", width: w + "%" }} />
                  </span>
                  <span className={"delta " + (up ? "up" : "down")}>{up ? "raises" : "lowers"} {pts} {pts === 1 ? "point" : "points"}</span>
                </li>
              );
            })}
          </ul>
          <p className="note">Each bar shows how far the estimate moves when that measurement is swapped for the training-set average. It is an approximation, not a cause.</p>
        </div>
      )}
      <p className="note">{res.disclaimer} Talk to a clinician about any health concern.</p>
      <p className="actions">
        <Link href="/history" className="link">View history</Link>
        <button type="button" className="link" onClick={() => window.print()}>Print this result</button>
      </p>
    </aside>
  );
}
