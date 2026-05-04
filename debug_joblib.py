import joblib
import os

BASE = "/Users/tharuntej/Projects/Crop_recommendation"
MODELS = os.path.join(BASE, "Crop_Model")

try:
    scaler = joblib.load(os.path.join(MODELS, "scaler.pkl"))
    print("Scaler loaded successfully with joblib")
except Exception as e:
    print(f"Error loading scaler with joblib: {e}")

try:
    model = joblib.load(os.path.join(MODELS, "crop_clustering_model.pkl"))
    print("Model loaded successfully with joblib")
except Exception as e:
    print(f"Error loading model with joblib: {e}")
