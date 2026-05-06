# Farmlytics

Farmlytics is a comprehensive agricultural web platform that leverages machine learning to provide intelligent insights for farming operations. The platform offers two primary tools:
1. **Crop Recommendation:** Helps farmers decide the best crop to cultivate based on soil metrics and weather conditions.
2. **Supply Chain Profiler:** Categorizes agricultural supply chains into actionable tiers to optimize inventory and revenue.

## Features

### 1. Crop Recommendation Engine
Uses a trained RandomForest machine learning model to predict the most suitable crop based on the following environmental and soil inputs:
- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Temperature
- Humidity
- pH value
- Rainfall

Returns the primary recommended crop along with a confidence score, growing season, water requirement, and expected cultivation period.

### 2. Supply Chain Profiler
Analyzes supply chain dynamics using a KMeans clustering approach to group products into three tiers based on:
- Price per kg
- Sell-through rate
- Inventory ratio
- Total revenue

**Tiers:**
- **Tier 1 (Premium High-Performers):** High price/revenue products. Strategy focuses on quality retention and premium pricing.
- **Tier 2 (Overstock / Slow-Moving):** High inventory with low sell-through. Immediate action needed to reduce holding costs.
- **Tier 3 (Fast-Moving Essentials):** High sell-through rate with low inventory ratio. Signifies strong market demand; scale up supply.

## Technology Stack

- **Backend:** Python, Flask, scikit-learn, joblib, pandas, numpy
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Deployment:** Pre-configured for deployment on Vercel via `vercel.json`.

## Project Structure

```
├── backend/                  # Flask API and Machine Learning Models
│   ├── app.py                # Main Flask application with API endpoints
│   ├── models/               # Saved scikit-learn models and scalers (.pkl)
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Static web files (HTML, CSS, JS)
│   ├── index.html            # Main landing page
│   ├── recommend.html        # Crop recommendation user interface
│   ├── supply-chain.html     # Supply chain profiler user interface
│   └── ...                   # Supporting CSS/JS, and graphic assets
├── vercel.json               # Vercel deployment configuration
└── README.md                 # Project documentation
```

## Setup & Running Locally

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask development server:
   ```bash
   python app.py
   ```
   The backend API will start on `http://127.0.0.1:5000`.

### Frontend
Since the frontend consists of static files, you can open `frontend/index.html` directly in your browser. Alternatively, you can serve it via a local static web server from the project root. For example:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/frontend/index.html` in your browser.

## API Endpoints

- `POST /predict`: Submit JSON with soil and weather metrics to receive crop recommendations.
- `POST /supply-chain`: Submit JSON with business metrics to receive a supply chain profile tier.
- `GET /health`: Health check endpoint to verify API operational status.
