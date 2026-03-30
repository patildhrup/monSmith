

# 
# You are a senior cybersecurity engineer and AI/ML architect.

# Design and implement a robust "API Classification Engine" for a cybersecurity platform that detects Zombie (stale/defunct) APIs in large-scale cloud-native systems.

# The system should take API metadata as input and classify each API into one of the following categories:
# - ACTIVE
# - DEPRECATED
# - ORPHANED
# - ZOMBIE

# Input data includes:
# - endpoint (string)
# - method (GET, POST, etc.)
# - last_accessed (timestamp)
# - request_count_7d (integer)
# - request_count_30d (integer)
# - error_rate (float)
# - in_codebase (boolean)
# - documented (boolean)
# - has_owner (boolean)
# - status_flag (optional: deprecated/active)

# Requirements:

# 1. Implement a hybrid classification approach:
#    - Rule-based logic (primary, explainable)
#    - Machine Learning model (Isolation Forest) for anomaly detection

# 2. Define clear classification rules such as:
#    - ACTIVE → high usage in last 30 days
#    - DEPRECATED → explicitly marked deprecated
#    - ORPHANED → no owner but exists in codebase
#    - ZOMBIE → no usage for 90+ days and not present in codebase

# 3. Include time-based logic using last_accessed field.

# 4. Use Isolation Forest to detect anomalous APIs based on:
#    - request_count_30d
#    - error_rate
#    - access patterns

# 5. Combine rule-based and ML outputs to produce final classification.

# 6. Output should include:
#    - classification (string)
#    - confidence score (0 to 1)
#    - reason (explainable logic)
#    - risk_score (0–100)

# 7. Implement the solution in Python using:
#    - FastAPI (for API service)
#    - scikit-learn (for ML model)

# 8. Provide:
#    - Clean, production-ready code
#    - Modular structure (feature extraction, rules engine, ML model)
#    - Example input and output
#    - Comments explaining logic

# 9. Ensure the system is scalable and suitable for integration with:
#    
#    - GitHub repository scanning
#    - MongoDB storage

# 10. Add extensibility for future enhancements like:
#    - Real-time classification
#    - CI/CD integration
#    - Continuous monitoring

# Focus on clarity, scalability, and real-world cybersecurity applicability.

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