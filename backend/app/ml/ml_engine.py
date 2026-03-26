from sklearn.ensemble import IsolationForest
import numpy as np

def detect_anomalies(endpoints_data):
    """
    endpoints_data: list of dicts with 'risk_score' and 'endpoint'
    Returns a list of boolean values indicating if the endpoint is an anomaly
    """
    if not endpoints_data or len(endpoints_data) < 2:
        return [False] * len(endpoints_data)
        
    # Extract features for Isolation Forest
    features = []
    for ep in endpoints_data:
        path_length = len(ep.get("endpoint", ""))
        score = ep.get("risk_score", 0.0)
        features.append([path_length, score])
        
    X = np.array(features)
    
    # Train Isolation Forest
    clf = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    predictions = clf.fit_predict(X)
    
    # -1 means anomaly, 1 means normal
    return [True if p == -1 else False for p in predictions]