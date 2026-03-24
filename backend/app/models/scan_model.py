from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class VulnerabilityModel(BaseModel):
    name: str
    severity: str
    target: str
    description: str
    impact: str
    attack_scenario: str
    fix: str
    cve: Optional[str] = "N/A"
    confidence: Optional[str] = "Medium"

class AIReportModel(BaseModel):
    target: str
    risk_score: float
    summary: str
    vulnerabilities: List[VulnerabilityModel]

class ScanModel(BaseModel):
    job_id: str
    user_email: str
    target: str
    status: str # in_progress, completed, failed
    current_stage: str
    message: str
    results: Optional[dict] = None
    ai_report: Optional[AIReportModel] = None
    raw_output: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
