from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np # (Assuming you still have your imports here)
from sklearn.neural_network import MLPRegressor
from typing import Optional
import requests

app = FastAPI()

# Add this CORS configuration block right after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Enable CORS so your React frontend can talk to this local API


# 1. Initialize and Train the Artificial Neural Network (ANN)
# In production, you will train this on historical TAHMO gauge data and TAMSAT/CHIRPS satellite data.
ann_model = MLPRegressor(hidden_layer_sizes=(10, 10), max_iter=1500, random_state=42)

# Simulated training data:
X_train = np.array([
    [0.0, 10.0, 30.0],
    [5.0, 20.0, 28.0],
    [15.0, 40.0, 24.0],
    [30.0, 65.0, 21.0]
])
# Target ground truth from TAHMO rain gauges (showing how satellites often underestimate heavy rain)
y_train = np.array([0.0, 4.2, 18.5, 38.0]) 

# Train the model
ann_model.fit(X_train, y_train)

@app.get("/api/predict-runoff")
def predict_runoff(lat: float, lon: float, device_sn: Optional[str] = None):
    # Instead of hardcoding, use lat/lon to simulate or fetch location-specific data
    # For now, let's derive features based on the coordinates to show variety
    live_satellite_rain = 10.0 + abs(lat) # Example: variation based on latitude
    live_soil_moisture = 30.0 + (lon * 0.1)
    live_temp = 20.0 + (abs(lat) * 0.5)
    
    features = np.array([[live_satellite_rain, live_soil_moisture, live_temp]])
    bias_corrected_rainfall_mm = ann_model.predict(features)
    
    final_rainfall_mm = max(0, bias_corrected_rainfall_mm[0])
    
    return {"ann_corrected_rainfall_mm": float(final_rainfall_mm)}
