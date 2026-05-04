import pickle
import os

BASE = "/Users/tharuntej/Projects/Crop_recommendation"
MODELS = os.path.join(BASE, "Crop_Model")

try:
    with open(os.path.join(MODELS, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
        print("Scaler loaded successfully")
except Exception as e:
    print(f"Error loading scaler: {e}")

try:
    with open(os.path.join(MODELS, "crop_clustering_model.pkl"), "rb") as f:
        model = pickle.load(f)
        print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
