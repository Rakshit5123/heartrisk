// Unit tests for the JavaScript predictor, using tiny hand-built models so they need no training data.
import test from "node:test";
import assert from "node:assert/strict";
import { predict, explain, FEATURES } from "../src/infer.js";

const zeros = FEATURES.map(() => 0), ones = FEATURES.map(() => 1);
const base = { mean: zeros, scale: ones };
const patient = (over = {}) => ({ ...Object.fromEntries(FEATURES.map((f) => [f, 0])), ...over });
const models = {
  lr_zero: { ...base, model: { type: "logreg", coef: zeros, intercept: 0 } },
  lr: { ...base, model: { type: "logreg", coef: FEATURES.map((f) => (f === "age" ? 1 : 0)), intercept: 0 } },
  // one split: age <= 0.5 goes left (p1 = 0.2), otherwise right (p1 = 0.9)
  stump: { ...base, model: { type: "rf", trees: [{ left: [1, -1, -1], right: [2, -1, -1], feature: [0, -2, -2], threshold: [0.5, -2, -2], p1: [0.5, 0.2, 0.9] }] } },
  svm: { ...base, model: { type: "svm", kernel: "linear", coef: zeros, intercept: 0, probA: -1, probB: 0 } },
  vote: { ...base, model: { type: "vote", members: [
    { type: "logreg", coef: zeros, intercept: 0 },
    { type: "rf", trees: [{ left: [1, -1, -1], right: [2, -1, -1], feature: [0, -2, -2], threshold: [0.5, -2, -2], p1: [0.5, 0.2, 0.9] }] },
  ] } },
  scaled: { mean: FEATURES.map((f) => (f === "age" ? 50 : 0)), scale: FEATURES.map((f) => (f === "age" ? 10 : 1)), model: { type: "logreg", coef: FEATURES.map((f) => (f === "age" ? 1 : 0)), intercept: 0 } },
};

test("logistic regression with zero weights is 0.5", () => assert.equal(predict(models, "lr_zero", patient()), 0.5));
test("logistic regression follows the sigmoid", () => assert.ok(Math.abs(predict(models, "lr", patient({ age: 2 })) - 1 / (1 + Math.exp(-2))) < 1e-12));
test("tree takes the left branch when value <= threshold", () => assert.equal(predict(models, "stump", patient({ age: 0.5 })), 0.2));
test("tree takes the right branch above the threshold", () => assert.equal(predict(models, "stump", patient({ age: 0.6 })), 0.9));
test("linear SVM with zero decision value gives Platt probability 0.5", () => assert.equal(predict(models, "svm", patient()), 0.5));
test("soft voting averages member probabilities", () => assert.ok(Math.abs(predict(models, "vote", patient({ age: 1 })) - (0.5 + 0.9) / 2) < 1e-12));
test("inputs are standardised with the stored mean and scale", () => assert.ok(Math.abs(predict(models, "scaled", patient({ age: 60 })) - 1 / (1 + Math.exp(-1))) < 1e-12));
test("probabilities stay between 0 and 1 for extreme input", () => {
  for (const m of Object.keys(models)) { const p = predict(models, m, patient({ age: 1e6 })); assert.ok(p >= 0 && p <= 1, m); }
});
test("explain ranks the influential measurement first and signs it correctly", () => {
  const f = explain(models, "lr", patient({ age: 3 }));
  assert.equal(f[0].feature, "age");
  assert.ok(f[0].delta > 0);
  assert.equal(f.length, 8);
  assert.ok(f.slice(1).every((x) => x.delta === 0));
  assert.ok(explain(models, "lr", patient({ age: -3 }))[0].delta < 0);
});
