"""
app.py – Flask ML Microservice
Exposes a POST /predict endpoint consumed by the Node.js backend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ── Load artefacts at startup ──────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

try:
    model   = joblib.load(os.path.join(MODEL_DIR, "saved_model.pkl"))
    le_perf = joblib.load(os.path.join(MODEL_DIR, "le_perf.pkl"))
    le_risk = joblib.load(os.path.join(MODEL_DIR, "le_risk.pkl"))
    print("[app] Model artefacts loaded successfully.")
except FileNotFoundError:
    print("[app] WARNING – model artefacts not found. Run train_model.py first.")
    model = le_perf = le_risk = None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None}), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON: { "quizScore": int, "attempts": int, "timeTaken": int }
    Returns  JSON: { "predictedPerformance": str, "dropoutRisk": str }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json(force=True)

    # ── Validate input ─────────────────────────────────────────────────────────
    required = ["quizScore", "attempts", "timeTaken"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        quiz_score = float(data["quizScore"])
        attempts   = float(data["attempts"])
        time_taken = float(data["timeTaken"])
    except (TypeError, ValueError):
        return jsonify({"error": "All fields must be numeric."}), 400

    # ── Predict ────────────────────────────────────────────────────────────────
    X   = np.array([[quiz_score, attempts, time_taken]])
    raw = model.predict(X)[0]  # [perf_enc, risk_enc]

    predicted_performance = le_perf.inverse_transform([int(raw[0])])[0]
    dropout_risk          = le_risk.inverse_transform([int(raw[1])])[0]

    return jsonify({
        "predictedPerformance": predicted_performance,
        "dropoutRisk":          dropout_risk,
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[app] Starting Flask ML service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
