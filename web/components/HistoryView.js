import { pct } from "../lib/fields";
import Link from "next/link";
import { downloadCsv } from "../lib/csv";

const when = (s) => new Date(s.replace(" ", "T") + "Z").toLocaleString();

export default function HistoryView({ rows, names = {}, err, onDelete, onClear }) {
  return (
    <section className="sheet">
      <div className="row"><h2>Saved assessments</h2>
        {rows?.length > 0 && (
          <span className="actions">
            <button className="link" onClick={() => downloadCsv(rows)}>Export CSV</button>
            <button className="link" onClick={onClear}>Delete all</button>
          </span>
        )}</div>
      {err && <p className="error" role="alert">{err}</p>}
      {!rows && !err && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && (
        <div className="empty">
          <p className="muted">Nothing saved yet. Every screening you run is saved here automatically.</p>
          <Link href="/screen" className="btn small">Run a screening</Link>
        </div>
      )}
      {rows?.length > 0 && (
        <div className="scroll"><table className="hist">
          <thead><tr><th>When</th><th>Label</th><th className="hide-sm">Model</th><th className="hide-sm">Age</th><th>Risk</th><th>Probability</th><th><span className="sr">Delete</span></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td>{when(r.created_at)}</td><td>{r.label || "-"}</td>
              <td className="hide-sm">{names[r.model] || r.model}</td><td className="hide-sm">{r.inputs.age}</td>
              <td><span className={"pill " + r.risk_band}>{r.risk_band}</span></td><td>{pct(r.probability)}%</td>
              <td><button className="link" onClick={() => onDelete(r.id)} aria-label={"Delete assessment " + r.id}>Delete</button></td>
            </tr>))}</tbody>
        </table></div>
      )}
    </section>
  );
}
