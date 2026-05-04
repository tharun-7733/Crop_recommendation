"""
CropWise — Flask API for crop prediction.
Loads the GMM clustering model + scaler, accepts soil/environment
parameters, and returns recommended crops.
"""

import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Load model artifacts ────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(BASE, "Crop_Model")

scaler = joblib.load(os.path.join(MODELS, "scaler.pkl"))
model  = joblib.load(os.path.join(MODELS, "crop_clustering_model.pkl"))

# ── Build cluster → crop mapping ────────────────────────────────────
cluster_df = pd.read_csv(os.path.join(MODELS, "cluster_mapping.csv"))
CLUSTER_TO_CROPS = {}
for _, row in cluster_df.iterrows():
    cid = int(row["gmm_(new)_labels"])
    crop = str(row["label"]).strip()
    if cid not in CLUSTER_TO_CROPS:
        CLUSTER_TO_CROPS[cid] = []
    if crop not in CLUSTER_TO_CROPS[cid]:
        CLUSTER_TO_CROPS[cid].append(crop)

print(f"[CropWise] Loaded {len(CLUSTER_TO_CROPS)} clusters")


# ── Crop metadata for enriched responses ────────────────────────────
CROP_META = {
    "rice":         {"season": ["kharif"], "water": "High", "period": "120-150 days"},
    "maize":        {"season": ["kharif"], "water": "Medium", "period": "80-110 days"},
    "chickpea":     {"season": ["rabi"], "water": "Low", "period": "90-120 days"},
    "kidneybeans":  {"season": ["rabi"], "water": "Medium", "period": "90-120 days"},
    "pigeonpeas":   {"season": ["kharif"], "water": "Low", "period": "120-180 days"},
    "mothbeans":    {"season": ["kharif"], "water": "Low", "period": "60-90 days"},
    "mungbean":     {"season": ["kharif", "zaid"], "water": "Low", "period": "60-75 days"},
    "blackgram":    {"season": ["kharif", "rabi"], "water": "Low", "period": "80-90 days"},
    "lentil":       {"season": ["rabi"], "water": "Low", "period": "100-120 days"},
    "pomegranate":  {"season": ["kharif", "rabi"], "water": "Low", "period": "150-180 days"},
    "banana":       {"season": ["kharif"], "water": "High", "period": "270-365 days"},
    "mango":        {"season": ["kharif"], "water": "Medium", "period": "100-150 days"},
    "grapes":       {"season": ["rabi"], "water": "Medium", "period": "150-180 days"},
    "watermelon":   {"season": ["zaid"], "water": "High", "period": "80-110 days"},
    "muskmelon":    {"season": ["zaid"], "water": "Medium", "period": "70-90 days"},
    "apple":        {"season": ["rabi"], "water": "Medium", "period": "150-180 days"},
    "orange":       {"season": ["rabi"], "water": "Medium", "period": "240-365 days"},
    "papaya":       {"season": ["kharif"], "water": "Medium", "period": "270-330 days"},
    "coconut":      {"season": ["kharif"], "water": "High", "period": "365+ days"},
    "cotton":       {"season": ["kharif"], "water": "Medium", "period": "150-180 days"},
    "jute":         {"season": ["kharif"], "water": "High", "period": "120-150 days"},
    "coffee":       {"season": ["kharif", "rabi"], "water": "Medium", "period": "365+ days"},
}


@app.route("/predict", methods=["POST"])
def predict():
    """Accept soil/environment JSON → return crop recommendation."""
    try:
        data = request.get_json(force=True)

        features = np.array([[
            float(data["N"]),
            float(data["P"]),
            float(data["K"]),
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["ph"]),
            float(data["rainfall"]),
        ]])

        scaled = scaler.transform(features)
        cluster = int(model.predict(scaled)[0])
        crops = CLUSTER_TO_CROPS.get(cluster, ["Unknown"])

        results = []
        for c in crops:
            meta = CROP_META.get(c, {})
            results.append({
                "name": c,
                "season": meta.get("season", []),
                "water": meta.get("water", "N/A"),
                "period": meta.get("period", "N/A"),
            })

        return jsonify({
            "success": True,
            "cluster": cluster,
            "primary": crops[0],
            "recommendations": results,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
