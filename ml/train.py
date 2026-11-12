"""Reproduces the paper's pipeline, then writes everything the server needs.
  python train.py              downloads UCI Heart Disease (id=45)
  python train.py data.csv     CSV with the 13 features + 'num' column
Outputs: ../server/data/model.json and ../server/data/metrics.json"""
import sys, json
from pathlib import Path
import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, roc_curve, confusion_matrix
from export import export_pipeline

FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]
OUT = Path(__file__).resolve().parent.parent / "server" / "data"; OUT.mkdir(parents=True, exist_ok=True)

def load():
    if len(sys.argv) > 1:
        df = pd.read_csv(sys.argv[1])
    else:
        from ucimlrepo import fetch_ucirepo
        d = fetch_ucirepo(id=45)
        df = pd.concat([d.data.features, d.data.targets], axis=1)
    df = df[FEATURES + ["num"]].dropna()
    return df[FEATURES], (df["num"] > 0).astype(int)

def pipe(clf): return Pipeline([("scale", StandardScaler()), ("clf", clf)])

def build_models(Xtr, ytr):
    def tune(clf, grid):
        g = GridSearchCV(pipe(clf), {f"clf__{k}": v for k, v in grid.items()}, cv=5, scoring="accuracy").fit(Xtr, ytr)
        print("best", g.best_params_); return g.best_estimator_, {k[5:]: v for k, v in g.best_params_.items()}
    rf_t, rf_p = tune(RandomForestClassifier(random_state=42), {"n_estimators": [50,100,200], "max_depth": [None,5,10]})
    svm_t, svm_p = tune(SVC(probability=True, random_state=42), {"C": [0.1,1,10], "kernel": ["linear","rbf"]})
    ens = pipe(VotingClassifier([("lr", LogisticRegression(max_iter=1000)),
        ("rf", RandomForestClassifier(random_state=42, **rf_p)),
        ("svm", SVC(probability=True, random_state=42, **svm_p))], voting="soft"))
    m = {"logreg": ("Logistic Regression", pipe(LogisticRegression(max_iter=1000)), True),
         "rf": ("Random Forest", pipe(RandomForestClassifier(random_state=42)), True),
         "svm": ("SVM", pipe(SVC(probability=True, random_state=42)), True),
         "rf_tuned": ("Random Forest (tuned)", rf_t, True),
         "svm_tuned": ("SVM (tuned)", svm_t, True),
         "ensemble": ("Soft-Voting Ensemble", ens, True)}
    try:
        from xgboost import XGBClassifier
        m["xgb"] = ("XGBoost", pipe(XGBClassifier(eval_metric="logloss", random_state=42)), False)  # metrics only
    except ImportError:
        print("xgboost not installed: skipping it")
    return m

if __name__ == "__main__":
    X, y = load()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    cv = StratifiedKFold(5, shuffle=True, random_state=42)
    metrics, exported = {}, {}
    for key, (name, m, live) in build_models(Xtr, ytr).items():
        m.fit(Xtr, ytr)
        p = m.predict(Xte); prob = m.predict_proba(Xte)[:, 1]
        fpr, tpr, _ = roc_curve(yte, prob); idx = np.linspace(0, len(fpr)-1, min(40, len(fpr))).astype(int)
        tn, fp, fn, tp = confusion_matrix(yte, p).ravel()
        cvs = cross_val_score(m, Xtr, ytr, cv=cv, scoring="accuracy")
        metrics[key] = {"name": name, "live": live, "accuracy": accuracy_score(yte, p), "precision": precision_score(yte, p),
            "recall": recall_score(yte, p), "f1": f1_score(yte, p), "auc": roc_auc_score(yte, prob),
            "cv_mean": cvs.mean(), "cv_std": cvs.std(), "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
            "roc": {"fpr": fpr[idx].round(4).tolist(), "tpr": tpr[idx].round(4).tolist()}}
        if live: exported[key] = export_pipeline(m)
        print(f"{name:24s} acc={metrics[key]['accuracy']:.3f} cv={cvs.mean():.3f}±{cvs.std():.3f} auc={metrics[key]['auc']:.3f}")
    imp_rf = RandomForestClassifier(random_state=42).fit(StandardScaler().fit_transform(Xtr), ytr)
    imp = sorted(zip(FEATURES, imp_rf.feature_importances_), key=lambda t: -t[1])
    meta = {"n_train": len(Xtr), "n_test": len(Xte), "features": FEATURES,
            "importance": [{"feature": f, "value": round(float(v), 4)} for f, v in imp]}
    (OUT / "model.json").write_text(json.dumps(exported))
    (OUT / "metrics.json").write_text(json.dumps({"models": metrics, "meta": meta}, default=float, indent=1))
    print("saved to", OUT)
