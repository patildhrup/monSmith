from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends, Security, Header
from fastapi.security import APIKeyHeader
from typing import List, Optional
import uuid
import os
import asyncio
import logging
import json
from datetime import datetime
from app.scanner.scanner import scanner_service
from app.core.auth_utils import get_current_user
from app.db.db import db
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

# Security: API Key for remote scanners
SCANNER_API_KEY_NAME = "X-Scanner-API-Key"
api_key_header = APIKeyHeader(name=SCANNER_API_KEY_NAME, auto_error=False)

async def verify_scanner_key(api_key: str = Security(api_key_header)):
    if not api_key or api_key != os.getenv("SCANNER_API_KEY"):
        raise HTTPException(
            status_code=403,
            detail="Could not validate scanner API key"
        )
    return api_key

# Models
class ScanRequest(BaseModel):
    target: str

class ScanStatus(BaseModel):
    job_id: str
    target: str
    status: str
    current_stage: Optional[str] = None
    message: Optional[str] = None
    results: Optional[dict] = None

class ResultsUpload(BaseModel):
    results: dict
    status: str = "completed"
    current_stage: str = "completed"
    message: str = "Scan completed remotely"

class ProgressUpdate(BaseModel):
    current_stage: str
    message: str
    stage_data: Optional[dict] = None

# In-memory storage for active scans (replacing Redis)
scan_jobs: dict[str, dict] = {}

class ScanRequest(BaseModel):
    target: str

class ScanStatus(BaseModel):
    job_id: str
    target: str
    status: str
    current_stage: Optional[str] = None
    message: Optional[str] = None
    results: Optional[dict] = None

class ResultsUpload(BaseModel):
    results: dict
    status: str = "completed"
    message: str = "Scan results uploaded"

active_connections: dict[str, List[WebSocket]] = {}

async def broadcast_status(job_id: str, status_data: dict):
    if job_id in active_connections:
        for connection in active_connections[job_id]:
            try:
                await connection.send_json(status_data)
            except Exception as e:
                logger.error(f"Error broadcasting to {job_id}: {e}")

async def run_scan_task(job_id: str, target: str, user_email: str):
    async def on_progress(data: dict):
        job_data = scan_jobs.get(job_id)
        if job_data:
            # Update local memory
            job_data.update(data)
            await broadcast_status(job_id, job_data)

    try:
        await scanner_service.run_scan(target, user_email, job_id, on_progress)
    except Exception as e:
        logger.error(f"Background scan task failed: {e}")
        error_data = {"status": "failed", "message": str(e)}
        scan_jobs[job_id].update(error_data)
        await broadcast_status(job_id, error_data)

@router.post("/scan", response_model=ScanStatus)
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    job_info = {
        "job_id": job_id,
        "target": request.target,
        "status": "in_progress",
        "current_stage": "init",
        "message": "Initializing scan...",
        "results": None
    }
    
    # Store in memory
    scan_jobs[job_id] = job_info
    
    background_tasks.add_task(run_scan_task, job_id, request.target, current_user["email"])
    
    return job_info

@router.get("/status/{job_id}", response_model=ScanStatus)
async def get_scan_status(job_id: str, current_user: dict = Depends(get_current_user)):
    job_data = scan_jobs.get(job_id)
    if not job_data:
        # Check MongoDB if not in memory
        scan = await db.scans.find_one({"job_id": job_id})
        if not scan:
            raise HTTPException(status_code=404, detail="Scan job not found")
        return {
            "job_id": scan["job_id"],
            "target": scan["target"],
            "status": scan["status"],
            "current_stage": scan.get("current_stage"),
            "message": scan.get("message"),
            "results": scan.get("results")
        }
    return job_data

@router.get("/history", response_model=List[ScanStatus])
async def get_scan_history(current_user: dict = Depends(get_current_user)):
    cursor = db.scans.find({"user_email": current_user["email"]}).sort("created_at", -1)
    scans = await cursor.to_list(length=100)
    return [
        {
            "job_id": s["job_id"],
            "target": s["target"],
            "status": s["status"],
            "current_stage": s.get("current_stage"),
            "message": s.get("message"),
            "results": s.get("results")
        } for s in scans
    ]

@router.get("/details/{job_id}")
async def get_scan_details(job_id: str, current_user: dict = Depends(get_current_user)):
    scan = await db.scans.find_one({"job_id": job_id, "user_email": current_user["email"]})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    # Return everything including AI report
    scan["_id"] = str(scan["_id"])
    return scan

@router.post("/results/{job_id}")
async def upload_results(
    job_id: str, 
    data: ResultsUpload, 
    api_key: str = Depends(verify_scanner_key)
):
    """
    Endpoint for remote scanners (EC2) to post their findings securely.
    """
    logger.info(f"Authenticated remote results received for job {job_id}")
    
    # Get job info from memory if exists
    job_info = scan_jobs.get(job_id)
    user_email = job_info.get("user_email", "system") if job_info else "system"
    target = job_info.get("target", "unknown") if job_info else data.results.get("target", "unknown")

    # Finalize results and generate AI Report
    results = data.results
    if "ai_report" not in results and scanner_service.llm:
        try:
            results["ai_report"] = await scanner_service._generate_ai_report(results)
        except Exception as e:
            logger.error(f"AI report generation failed for remote upload: {e}")

    scan_doc = {
        "job_id": job_id,
        "user_email": user_email,
        "target": target,
        "status": data.status,
        "current_stage": data.current_stage,
        "message": data.message,
        "results": results,
        "created_at": datetime.utcnow(),
        "completed_at": datetime.utcnow()
    }
    
    # Save to MongoDB
    await db.scans.update_one(
        {"job_id": job_id},
        {"$set": scan_doc},
        upsert=True
    )
    
    # Update local memory and broadcast via WebSocket
    if job_id in scan_jobs:
        scan_jobs[job_id].update({
            "status": data.status,
            "results": results,
            "current_stage": data.current_stage,
            "message": data.message
        })
        await broadcast_status(job_id, scan_jobs[job_id])
        # Clean up memory-based job if completed
        if data.status in ["completed", "failed"]:
            # We keep it for a short while or let browser pull it later
            pass
            
    return {"status": "success", "message": "Final results stored"}

@router.post("/results/{job_id}/progress")
async def update_scan_progress(
    job_id: str, 
    data: ProgressUpdate, 
    api_key: str = Depends(verify_scanner_key)
):
    """
    Endpoint for remote scanners to report progress/stage updates.
    """
    logger.info(f"Progress update for {job_id}: {data.current_stage}")
    
    if job_id in scan_jobs:
        scan_jobs[job_id].update({
            "current_stage": data.current_stage,
            "message": data.message
        })
        # If there's partial data (e.g. subdomains found so far), update it
        if data.stage_data:
            if not scan_jobs[job_id].get("results"):
                scan_jobs[job_id]["results"] = {}
            scan_jobs[job_id]["results"].update(data.stage_data)
            
        await broadcast_status(job_id, scan_jobs[job_id])
    
    # Optional: Update DB for persistence if we want long-term progress tracking
    await db.scans.update_one(
        {"job_id": job_id},
        {"$set": {
            "current_stage": data.current_stage,
            "message": data.message,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"status": "success"}

@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    
    if job_id not in active_connections:
        active_connections[job_id] = []
    
    active_connections[job_id].append(websocket)
    
    # Send current status immediately
    job_data = scan_jobs.get(job_id)
    if job_data:
        await websocket.send_json(job_data)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections[job_id].remove(websocket)
        if not active_connections[job_id]:
            del active_connections[job_id]
