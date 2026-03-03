"""
train_model.py
Trains a Decision Tree classifier on dummy data and saves the model.
Inputs : quizScore (0-100), attempts (1-5), timeTaken (minutes, 1-120)
Outputs: predictedPerformance (Low/Medium/High), dropoutRisk (Yes/No)
"""

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# ── Reproducibility ───────────────────────────────────────────────────────────
np.random.seed(42)
NUM_SAMPLES = 1000

# ── Feature generation ────────────────────────────────────────────────────────
quiz_score  = np.random.randint(0, 101, NUM_SAMPLES)
attempts    = np.random.randint(1, 6,   NUM_SAMPLES)
time_taken  = np.random.randint(5, 121, NUM_SAMPLES)

# ── Label derivation (deterministic rules + small noise) ──────────────────────
def derive_labels(score, attempt, time):
    # predictedPerformance
    if score >= 75:
        perf = "High"
    elif score >= 40:
        perf = "Medium"
    else:
        perf = "Low"

    # dropoutRisk – high risk if low score AND many attempts AND long time
    if score < 40 and attempt >= 3 and time > 60:
        risk = "Yes"
    elif score < 55 and attempt >= 4:
        risk = "Yes"
    else:
        risk = "No"

    return perf, risk

performances, risks = [], []
for s, a, t in zip(quiz_score, attempts, time_taken):
    p, r = derive_labels(s, a, t)
    performances.append(p)
    risks.append(r)

# Add small random noise so the model has to learn rather than memorise
noise_idx = np.random.choice(NUM_SAMPLES, size=int(NUM_SAMPLES * 0.05), replace=False)
for i in noise_idx:
    performances[i] = np.random.choice(["Low", "Medium", "High"])
    risks[i]        = np.random.choice(["Yes", "No"])

# ── DataFrame ─────────────────────────────────────────────────────────────────
df = pd.DataFrame({
    "quizScore":  quiz_score,
    "attempts":   attempts,
    "timeTaken":  time_taken,
    "performance": performances,
    "dropoutRisk": risks,
})

# ── Encode target labels ───────────────────────────────────────────────────────
le_perf = LabelEncoder()  # High=0, Low=1, Medium=2
le_risk = LabelEncoder()  # No=0,  Yes=1

df["perf_enc"] = le_perf.fit_transform(df["performance"])
df["risk_enc"] = le_risk.fit_transform(df["dropoutRisk"])

X = df[["quizScore", "attempts", "timeTaken"]].values
y = df[["perf_enc", "risk_enc"]].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Train ─────────────────────────────────────────────────────────────────────
base_clf = DecisionTreeClassifier(max_depth=8, random_state=42)
model    = MultiOutputClassifier(base_clf)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"[train_model] Multi-output accuracy: {accuracy:.4f}")

# ── Persist artefacts ─────────────────────────────────────────────────────────
os.makedirs("model", exist_ok=True)

joblib.dump(model,   "model/saved_model.pkl")
joblib.dump(le_perf, "model/le_perf.pkl")
joblib.dump(le_risk, "model/le_risk.pkl")

print("[train_model] Saved: model/saved_model.pkl, model/le_perf.pkl, model/le_risk.pkl")
