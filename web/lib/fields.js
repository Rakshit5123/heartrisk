export const GROUPS = [
  { title: "Patient", fields: [
    { k: "age", label: "Age", unit: "years", min: 1, max: 120 },
    { k: "sex", label: "Sex", options: [[1, "Male"], [0, "Female"]] },
  ] },
  { title: "Vitals and blood work", fields: [
    { k: "trestbps", label: "Resting blood pressure", unit: "mm Hg", min: 50, max: 260 },
    { k: "chol", label: "Serum cholesterol", unit: "mg/dl", min: 50, max: 700 },
    { k: "fbs", label: "Fasting blood sugar over 120 mg/dl", options: [[0, "No"], [1, "Yes"]] },
    { k: "restecg", label: "Resting ECG", options: [[0, "Normal"], [1, "ST-T wave abnormality"], [2, "Left ventricular hypertrophy"]] },
  ] },
  { title: "Symptoms and exercise test", fields: [
    { k: "cp", label: "Chest pain type", options: [[1, "Typical angina"], [2, "Atypical angina"], [3, "Non-anginal pain"], [4, "No symptoms"]] },
    { k: "thalach", label: "Maximum heart rate reached", unit: "bpm", min: 40, max: 260 },
    { k: "exang", label: "Chest pain during exercise", options: [[0, "No"], [1, "Yes"]] },
    { k: "oldpeak", label: "ST depression from exercise", unit: "mm", min: 0, max: 10, step: 0.1 },
    { k: "slope", label: "Slope of peak-exercise ST segment", options: [[1, "Upsloping"], [2, "Flat"], [3, "Downsloping"]] },
  ] },
  { title: "Imaging", fields: [
    { k: "ca", label: "Major vessels coloured by fluoroscopy", options: [[0, "0"], [1, "1"], [2, "2"], [3, "3"]] },
    { k: "thal", label: "Thalassemia", options: [[3, "Normal"], [6, "Fixed defect"], [7, "Reversible defect"]] },
  ] },
];
export const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);
export const EXAMPLE = { age: 58, sex: 1, cp: 4, trestbps: 130, chol: 250, fbs: 0, restecg: 0, thalach: 140, exang: 1, oldpeak: 1.8, slope: 2, ca: 1, thal: 7 };
export const LABELS = { ca: "Major vessels", thalach: "Max heart rate", age: "Age", thal: "Thalassemia", cp: "Chest pain type", oldpeak: "ST depression", chol: "Cholesterol", trestbps: "Resting BP", exang: "Exercise angina", slope: "ST slope", sex: "Sex", restecg: "Resting ECG", fbs: "Fasting sugar" };
export const pct = (v) => (v * 100).toFixed(1);

export function describe(k, v) {
  const f = ALL_FIELDS.find((x) => x.k === k);
  if (!f) return String(v);
  if (f.options) return (f.options.find(([o]) => Number(o) === Number(v)) || [, String(v)])[1];
  return f.unit ? `${v} ${f.unit}` : String(v);
}
