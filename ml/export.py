"""Turns fitted scikit-learn pipelines into plain JSON that the Node server can evaluate."""
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC

def _est(e):
    if isinstance(e, LogisticRegression):
        return {"type": "logreg", "coef": e.coef_[0].tolist(), "intercept": float(e.intercept_[0])}
    if isinstance(e, RandomForestClassifier):
        trees = []
        for t in e.estimators_:
            s = t.tree_; v = s.value[:, 0, :]
            trees.append({"left": s.children_left.tolist(), "right": s.children_right.tolist(),
                          "feature": s.feature.tolist(), "threshold": s.threshold.tolist(),
                          "p1": (v[:, 1] / v.sum(axis=1)).round(6).tolist()})
        return {"type": "rf", "trees": trees}
    if isinstance(e, SVC):
        o = {"type": "svm", "kernel": e.kernel, "intercept": float(e.intercept_[0]),
             "probA": float(e.probA_[0]), "probB": float(e.probB_[0])}
        if e.kernel == "linear":
            o["coef"] = e.coef_[0].tolist()
        elif e.kernel == "rbf":
            o.update(gamma=float(e._gamma), sv=e.support_vectors_.tolist(), dual=e.dual_coef_[0].tolist())
        else:
            raise ValueError("unsupported kernel " + e.kernel)
        return o
    if isinstance(e, VotingClassifier):
        return {"type": "vote", "members": [_est(m) for m in e.estimators_]}
    raise ValueError("unsupported estimator " + type(e).__name__)

def export_pipeline(pipe):
    sc = pipe.named_steps["scale"]
    return {"mean": sc.mean_.tolist(), "scale": sc.scale_.tolist(), "model": _est(pipe.named_steps["clf"])}
