const COLORS = ["#1d6f6a", "#b42318", "#8a6d12", "#3b4aa0"];
export default function Roc({ models }) {
  const keys = ["logreg", "rf", "xgb", "svm"].filter((k) => models[k]);
  const S = 240, pt = (x, y) => `${(x * S).toFixed(1)},${((1 - y) * S).toFixed(1)}`;
  return (
    <figure>
      <svg viewBox={`-34 -10 ${S + 46} ${S + 40}`} role="img" aria-label="ROC curves of the classifiers">
        <rect width={S} height={S} fill="#fff" stroke="#2a1215" />
        <line x1="0" y1={S} x2={S} y2="0" stroke="#b9a5a2" strokeDasharray="4" />
        {keys.map((k, i) => (
          <polyline key={k} fill="none" stroke={COLORS[i]} strokeWidth="2"
            points={models[k].roc.fpr.map((x, j) => pt(x, models[k].roc.tpr[j])).join(" ")} />
        ))}
        <text x={S / 2} y={S + 26} textAnchor="middle" fontSize="11">False positive rate</text>
        <text x={-S / 2} y="-18" transform="rotate(-90)" textAnchor="middle" fontSize="11">True positive rate</text>
      </svg>
      <figcaption>
        {keys.map((k, i) => (
          <span key={k} className="key"><i style={{ background: COLORS[i] }} />{models[k].name} (AUC {models[k].auc.toFixed(2)})</span>
        ))}
      </figcaption>
    </figure>
  );
}
