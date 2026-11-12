"""Checks that the JavaScript predictor (server/src/infer.js) reproduces scikit-learn.
Trains small models on synthetic data, exports them, and compares probabilities. Needs Node 22+.
Usage: python check_parity.py"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from export import export_pipeline

FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]
rng = np.random.default_rng(0)
X = pd.DataFrame(rng.normal(size=(250, 13)) * [9,1,1,17,50,1,1,22,1,1,1,1,1] + [54,.6,3,131,246,.15,1,150,.3,1,1.5,.7,5], columns=FEATURES)
y = ((X["age"] / 9 - X["thalach"] / 22 + X["slope"] + rng.normal(size=250)) > 0.2).astype(int)
P = lambda c: Pipeline([("scale", StandardScaler()), ("clf", c)])
models = {
    "logreg": P(LogisticRegression(max_iter=1000)),
    "rf": P(RandomForestClassifier(n_estimators=40, random_state=1)),
    "svm_rbf": P(SVC(probability=True, random_state=1)),
    "svm_linear": P(SVC(kernel="linear", C=.1, probability=True, random_state=1)),
    "ensemble": P(VotingClassifier([("lr", LogisticRegression(max_iter=1000)), ("rf", RandomForestClassifier(n_estimators=30, random_state=1)),
                                    ("svm", SVC(probability=True, random_state=1))], voting="soft")),
}
sample = X.head(40)
payload = {"models": {}, "rows": sample.to_dict("records"), "expected": {}}
for k, m in models.items():
    m.fit(X, y); payload["models"][k] = export_pipeline(m); payload["expected"][k] = m.predict_proba(sample)[:, 1].tolist()

infer = (Path(__file__).resolve().parent.parent / "server" / "src" / "infer.js").as_uri()
js = f"""import fs from 'node:fs'; import {{ predict }} from '{infer}';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); let worst = 0, flips = 0;
for (const k of Object.keys(d.models)) {{ let mx = 0, fl = 0;
  d.rows.forEach((r, i) => {{ const a = predict(d.models, k, r), b = d.expected[k][i]; mx = Math.max(mx, Math.abs(a - b)); if ((a >= .5) !== (b >= .5)) fl++; }});
  console.log(k.padEnd(11), 'max |diff| =', mx.toExponential(2), ' class flips =', fl); worst = Math.max(worst, mx); flips += fl; }}
process.exit(worst < 0.01 && flips === 0 ? 0 : 1);"""
with tempfile.TemporaryDirectory() as d:
    (Path(d) / "p.json").write_text(json.dumps(payload)); (Path(d) / "c.mjs").write_text(js)
    r = subprocess.run(["node", str(Path(d) / "c.mjs"), str(Path(d) / "p.json")], capture_output=True, text=True)
print(r.stdout + r.stderr, end=""); print("PARITY OK" if r.returncode == 0 else "PARITY FAILED"); sys.exit(r.returncode)
