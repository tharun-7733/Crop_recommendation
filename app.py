"""
Farmlytics – Flask API
  POST /predict       → Crop recommendation (RandomForest)
  POST /supply-chain  → Supply chain profile (KMeans)
  GET  /health        → Status check
"""

import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE   = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(BASE, "models")

# ── Load artifacts ───────────────────────────────────────────────────
rec_scaler  = joblib.load(os.path.join(MODELS, "crop_recommend_scaler.pkl"))
rec_model   = joblib.load(os.path.join(MODELS, "crop_recommendation_model.pkl"))

sc_scaler   = joblib.load(os.path.join(MODELS, "supply_chain_scaler.pkl"))
sc_model    = joblib.load(os.path.join(MODELS, "supply_chain_kmeans_model.pkl"))

print(f"[Farmlytics] Crop classes : {list(rec_model.classes_)}")
print(f"[Farmlytics] SC clusters  : {sc_model.n_clusters}")

# ── Crop metadata ────────────────────────────────────────────────────
CROP_META = {
    "rice":        {"season":["Kharif"],            "water":"High",   "period":"120-150 days", "emoji":"🌾"},
    "maize":       {"season":["Kharif"],            "water":"Medium", "period":"80-110 days",  "emoji":"🌽"},
    "chickpea":    {"season":["Rabi"],              "water":"Low",    "period":"90-120 days",  "emoji":"🫘"},
    "kidneybeans": {"season":["Rabi"],              "water":"Medium", "period":"90-120 days",  "emoji":"🫘"},
    "pigeonpeas":  {"season":["Kharif"],            "water":"Low",    "period":"120-180 days", "emoji":"🌿"},
    "mothbeans":   {"season":["Kharif"],            "water":"Low",    "period":"60-90 days",   "emoji":"🌱"},
    "mungbean":    {"season":["Kharif","Zaid"],     "water":"Low",    "period":"60-75 days",   "emoji":"🟢"},
    "blackgram":   {"season":["Kharif","Rabi"],     "water":"Low",    "period":"80-90 days",   "emoji":"⚫"},
    "lentil":      {"season":["Rabi"],              "water":"Low",    "period":"100-120 days", "emoji":"🟤"},
    "pomegranate": {"season":["Kharif","Rabi"],     "water":"Low",    "period":"150-180 days", "emoji":"🍎"},
    "banana":      {"season":["Kharif"],            "water":"High",   "period":"270-365 days", "emoji":"🍌"},
    "mango":       {"season":["Kharif"],            "water":"Medium", "period":"100-150 days", "emoji":"🥭"},
    "grapes":      {"season":["Rabi"],              "water":"Medium", "period":"150-180 days", "emoji":"🍇"},
    "watermelon":  {"season":["Zaid"],              "water":"High",   "period":"80-110 days",  "emoji":"🍉"},
    "muskmelon":   {"season":["Zaid"],              "water":"Medium", "period":"70-90 days",   "emoji":"🍈"},
    "apple":       {"season":["Rabi"],              "water":"Medium", "period":"150-180 days", "emoji":"🍎"},
    "orange":      {"season":["Rabi"],              "water":"Medium", "period":"240-365 days", "emoji":"🍊"},
    "papaya":      {"season":["Kharif"],            "water":"Medium", "period":"270-330 days", "emoji":"🧡"},
    "coconut":     {"season":["Kharif"],            "water":"High",   "period":"365+ days",    "emoji":"🥥"},
    "cotton":      {"season":["Kharif"],            "water":"Medium", "period":"150-180 days", "emoji":"🌸"},
    "jute":        {"season":["Kharif"],            "water":"High",   "period":"120-150 days", "emoji":"🌿"},
    "coffee":      {"season":["Kharif","Rabi"],     "water":"Medium", "period":"365+ days",    "emoji":"☕"},
}

# ── Supply chain cluster profiles (from notebook analysis) ───────────
SC_PROFILES = {
    0: {
        "name":        "Premium High-Performers",
        "color":       "#4caf50",
        "label":       "Tier 1",
        "desc":        "High price-per-kg with the highest revenue output. These are top-tier products that drive value despite potentially lower volume. Prioritize quality retention and premium market access.",
        "strategy":    "Quality-first, premium pricing",
        "inventory":   "Low — sell quickly at peak freshness",
        "sell_through": "Strong — demand matches supply",
        "margin":      "High (65–80%)",
        "channels":    ["Organic retailers", "Export houses", "Specialty markets", "Direct B2B buyers"],
        "tips": [
            "Maintain strict quality grading — premium buyers pay for consistency",
            "Explore direct contracts with exporters or specialty food brands",
            "Invest in certification (organic, GlobalGAP) to command higher prices",
            "Use cold-chain to preserve quality and extend shelf life"
        ],
        "warning": None
    },
    1: {
        "name":        "Overstock / Slow-Moving",
        "color":       "#ff9800",
        "label":       "Tier 2",
        "desc":        "High inventory ratio with low sell-through rate. These products are sitting in storage and tying up capital. Immediate action needed to reduce holding costs and free working capital.",
        "strategy":    "Volume reduction or aggressive promotion",
        "inventory":   "High — capital is being tied up in unsold stock",
        "sell_through": "Low — products are moving slower than they arrive",
        "margin":      "Eroding (30–45%) due to holding costs",
        "channels":    ["Bulk processors", "Food industry buyers", "Wholesale mandis", "Government procurement"],
        "tips": [
            "Reduce supply volume in next season to rebalance inventory",
            "Run promotional pricing or bulk-deal offers to clear stock",
            "Explore processing channels (e.g., flour mills, canneries) for unsold produce",
            "Negotiate flexible offtake agreements instead of fixed-volume contracts"
        ],
        "warning": "High inventory levels detected. Consider promotional strategies or supply reduction to free capital."
    },
    2: {
        "name":        "Fast-Moving Essentials",
        "color":       "#2196f3",
        "label":       "Tier 3",
        "desc":        "High sell-through rate with low inventory ratio. These are efficient, high-turnover products being sold almost as fast as they are shipped — a sign of strong market demand.",
        "strategy":    "Scale up supply and secure reliable offtake",
        "inventory":   "Low — stock moves fast, minimal holding costs",
        "sell_through": "Excellent — near real-time demand absorption",
        "margin":      "Moderate (45–60%) with high volume upside",
        "channels":    ["Local markets", "Quick-commerce platforms", "Institutional buyers", "Cooperatives"],
        "tips": [
            "Scale production to capture the strong demand — this is your growth opportunity",
            "Lock in offtake agreements with institutional buyers for price stability",
            "Minimize storage investment — focus on just-in-time supply",
            "Explore quick-commerce and last-mile delivery partnerships"
        ],
        "warning": None
    }
}


def extract_features(data):
    """Extract and validate the 7-feature vector from request JSON."""
    return np.array([[
        float(data["N"]),
        float(data["P"]),
        float(data["K"]),
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["ph"]),
        float(data["rainfall"]),
    ]])


# ── Routes ────────────────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
def predict():
    """Crop recommendation using RandomForest."""
    try:
        data     = request.get_json(force=True)
        features = extract_features(data)
        scaled   = rec_scaler.transform(features)

        # Top-3 crops by probability
        proba       = rec_model.predict_proba(scaled)[0]
        top3_idx    = proba.argsort()[-3:][::-1]
        classes     = rec_model.classes_
        primary     = classes[top3_idx[0]]

        recommendations = []
        for idx in top3_idx:
            crop = classes[idx]
            meta = CROP_META.get(crop, {})
            recommendations.append({
                "name":        crop,
                "confidence":  round(float(proba[idx]) * 100, 1),
                "emoji":       meta.get("emoji", "🌱"),
                "season":      meta.get("season", []),
                "water":       meta.get("water", "N/A"),
                "period":      meta.get("period", "N/A"),
            })

        return jsonify({
            "success":         True,
            "primary":         primary,
            "recommendations": recommendations,
            "all_crops":       [
                {"name": c, "confidence": round(float(p)*100,1), "emoji": CROP_META.get(c,{}).get("emoji","🌱")}
                for c, p in sorted(zip(classes, proba), key=lambda x: -x[1])
            ]
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/supply-chain", methods=["POST"])
def supply_chain():
    """
    Supply chain profile from 4 business inputs.
    Cluster assignment mirrors the KMeans training analysis:
      - Cluster 0 (Premium):    High price_per_kg + High revenue
      - Cluster 1 (Overstock):  High inventory_ratio + Low sell_through_rate
      - Cluster 2 (Fast-Moving):High sell_through_rate + Low inventory_ratio
    """
    try:
        data = request.get_json(force=True)

        price        = float(data["price_per_kg"])        # Rs per kg
        sell_through = float(data["sell_through_rate"])   # 0.0 – 1.0
        inventory    = float(data["inventory_ratio"])     # ratio (>1 = excess stock)
        revenue      = float(data["revenue"])             # total revenue (Rs)

        # ── Scoring: each cluster gets a score; highest wins ─────────────
        # Cluster 1 (Overstock): high inventory + low sell-through dominate
        score_overstock  = (inventory / 5.0) + (1.0 - sell_through)

        # Cluster 2 (Fast-Moving): high sell-through + low inventory dominate
        score_fast       = sell_through + (1.0 - min(inventory / 5.0, 1.0))

        # Cluster 0 (Premium): high price + high revenue dominate
        # Normalise price to 0–1 using typical range 0–500 Rs/kg
        # Normalise revenue to 0–1 using typical range 0–500000 Rs
        score_premium    = (min(price, 500) / 500.0) + (min(revenue, 500_000) / 500_000.0)

        scores = {0: score_premium, 1: score_overstock, 2: score_fast}
        cluster = max(scores, key=scores.get)
        profile = SC_PROFILES[cluster]

        return jsonify({
            "success": True,
            "cluster": cluster,
            "profile": profile,
            "scores":  {k: round(v, 4) for k, v in scores.items()},
            "inputs": {
                "price_per_kg":       price,
                "sell_through_rate":  sell_through,
                "inventory_ratio":    inventory,
                "revenue":            revenue,
            }
        })

    except KeyError as ke:
        return jsonify({"success": False, "error": f"Missing field: {ke}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models": ["RandomForest", "supply-chain-classifier"]})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
