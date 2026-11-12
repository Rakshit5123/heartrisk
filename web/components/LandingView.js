import Link from "next/link";
import Monitor from "./Monitor";
import Trace from "./Trace";
import { pct } from "../lib/fields";

const MODELS = [
  { key: "logreg", name: "Logistic Regression", tag: "Simple and transparent", text: "Gives each measurement one weight. Fast, easy to audit, and a strong baseline." },
  { key: "rf", name: "Random Forest", tag: "Many trees, one vote", text: "Hundreds of decision trees vote together, which smooths out noise in a small dataset." },
  { key: "xgb", name: "XGBoost", tag: "Boosted trees", text: "Builds trees one after another, each correcting the mistakes of the last." },
  { key: "svm", name: "Support Vector Machine", tag: "Widest margin", text: "Draws the widest possible boundary between patients with and without disease." },
  { key: "ensemble", name: "Soft-Voting Ensemble", tag: "The committee", text: "Averages the probabilities of several models so no single one decides alone." },
];
const STEPS = [
  ["01", "Enter 13 measurements", "Age, blood pressure, cholesterol, ECG, the exercise test and imaging findings, all in plain language."],
  ["02", "Pick a model", "Choose any of the trained models, including the ensemble. Each one returns a probability."],
  ["03", "Read the risk and the reasons", "You get a risk band, a probability and the measurements that pushed it up or down."],
];

export default function LandingView({ metrics }) {
  const models = metrics?.models, meta = metrics?.meta;
  const best = models ? Object.values(models).sort((a, b) => b.cv_mean - a.cv_mean)[0] : null;
  const patients = meta ? meta.n_train + meta.n_test : null;
  const stats = [
    ["13", "clinical measurements"],
    ["5", "model types compared (tuned versions included)"],
    [best ? pct(best.cv_mean) + "%" : "-", best ? `best cross-validated accuracy (${best.name})` : "best cross-validated accuracy"],
    [patients ?? "-", "patients in the dataset"],
  ];
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <p className="kicker">Cross-validated classifiers · UCI Heart Disease</p>
            <h1>Spot heart disease risk <em>early</em>.</h1>
            <p className="lede">HeartRisk turns 13 routine clinical measurements into a risk estimate, using five machine-learning models that were compared with cross-validation, and shows you why each estimate came out the way it did.</p>
            <div className="cta">
              <Link href="/screen" className="btn">Start a screening</Link>
              <Link href="/evidence" className="btn ghost">See the evidence</Link>
            </div>
            <p className="hero-note">Educational tool. Not a diagnosis.</p>
          </div>
          <Monitor />
        </div>
      </section>

      <section className="band-ink" aria-label="Key figures">
        <div className="wrap stats">
          {stats.map(([v, l]) => <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">How it works</p>
          <h2 className="big-h">Three steps from measurements to a reasoned estimate.</h2>
          <div className="steps">
            {STEPS.map(([n, t, d]) => <div className="step" key={n}><span className="n">{n}</span><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section tint">
        <div className="wrap">
          <p className="kicker">The models</p>
          <h2 className="big-h">Four classifiers and one committee, compared properly.</h2>
          <div className="models">
            {MODELS.map((m) => (
              <div className="mcard" key={m.key}>
                <span className="tag">{m.tag}</span>
                <h3>{m.name}</h3>
                <p>{m.text}</p>
                {models?.[m.key] && <span className="acc">{pct(models[m.key].cv_mean)}%<small> cross-validated</small></span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap honest">
          <div>
            <p className="kicker">Built to be honest</p>
            <h2 className="big-h">We show the cross-validated number, not just the flattering one.</h2>
            <p className="lede">A single train and test split on a few hundred patients can look better than it should. So every model is shown with both its test score and its cross-validated score.</p>
          </div>
          <ul className="checks">
            <li><span className="tick">✓</span><div><b>Cross-validation first.</b> Five-fold results sit next to the single-split numbers on the evidence page.</div></li>
            <li><span className="tick">✓</span><div><b>Small data, said plainly.</b> {patients ? `The dataset has ${patients} patients` : "The dataset is a few hundred patients"}, so treat every estimate as a rough guide.</div></li>
            <li><span className="tick">✓</span><div><b>Reasons, not just a score.</b> Each result lists the measurements that moved it the most.</div></li>
            <li><span className="tick">✓</span><div><b>Not a diagnosis.</b> It is built for learning and research, and it says so on every result.</div></li>
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <h2>Try it with an example patient.</h2>
          <p>Open the screening page and choose Fill example values to see a full result in a few seconds.</p>
          <Trace />
          <Link href="/screen" className="btn light">Start a screening</Link>
        </div>
      </section>
    </>
  );
}
