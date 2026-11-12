import fs from "node:fs";

export const FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"];
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

function prob(m, x) {
  switch (m.type) {
    case "logreg": return sigmoid(dot(m.coef, x) + m.intercept);
    case "rf": {
      const xf = x.map(Math.fround);
      let sum = 0;
      for (const t of m.trees) {
        let n = 0;
        while (t.left[n] !== -1) n = xf[t.feature[n]] <= t.threshold[n] ? t.left[n] : t.right[n];
        sum += t.p1[n];
      }
      return sum / m.trees.length;
    }
    case "svm": {
      let f = m.intercept;
      if (m.kernel === "linear") f += dot(m.coef, x);
      else for (let i = 0; i < m.sv.length; i++) {
        let d = 0; const s = m.sv[i];
        for (let j = 0; j < x.length; j++) { const t = s[j] - x[j]; d += t * t; }
        f += m.dual[i] * Math.exp(-m.gamma * d);
      }
      return 1 / (1 + Math.exp(m.probA * f - m.probB));   // Platt scaling as in libsvm/scikit-learn
    }
    case "vote": return m.members.reduce((s, e) => s + prob(e, x), 0) / m.members.length;
    default: throw new Error("unknown model type " + m.type);
  }
}

export function loadModels(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

const scaled = (p, input) => FEATURES.map((f, i) => (Number(input[f]) - p.mean[i]) / p.scale[i]);

export function predict(models, key, input) {
  const p = models[key];
  return prob(p.model, scaled(p, input));
}

// Replace each measurement, one at a time, with the training-set average (0 after scaling) and see how far
// the estimate moves. Positive delta = this value pushes the risk up compared with an average patient.
export function explain(models, key, input, top = 8) {
  const p = models[key], x = scaled(p, input), base = prob(p.model, x);
  return FEATURES.map((feature, i) => {
    const y = x.slice(); y[i] = 0;
    return { feature, value: Number(input[feature]), delta: Math.round((base - prob(p.model, y)) * 10000) / 10000 };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, top);
}
