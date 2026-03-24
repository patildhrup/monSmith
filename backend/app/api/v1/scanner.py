from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from typing import List, Optional
import uuid
import asyncio
import logging
import json
from app.scanner.scanner import scanner_service
from app.core.auth_utils import get_current_user
from app.db.redis import get_redis
from app.db.db import db
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)
redis_client = get_redis()

class ScanRequest(BaseModel):
    target: str

class ScanStatus(BaseModel):
    job_id: str
    target: str
    status: str
    current_stage: Optional[str] = None
    message: Optional[str] = None
    results: Optional[dict] = None

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
        # The scanner_service now updates Redis internally, 
        # but we still want to broadcast to WebSockets
        job_data = redis_client.get(f"scan_job:{job_id}")
        if job_data:
            await broadcast_status(job_id, json.loads(job_data))

    try:
        await scanner_service.run_scan(target, user_email, job_id, on_progress)
    except Exception as e:
        logger.error(f"Background scan task failed: {e}")
        error_data = {"status": "failed", "message": str(e)}
        redis_client.set(f"scan_job:{job_id}", json.dumps(error_data), ex=3600)
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
    
    # Store in Redis
    try:
        redis_client.set(f"scan_job:{job_id}", json.dumps(job_info), ex=3600)
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Could not connect to Redis. Please ensure Redis is running and REDIS_HOST is configured properly."
        )
    
    background_tasks.add_task(run_scan_task, job_id, request.target, current_user["email"])
    
    return job_info

@router.get("/status/{job_id}", response_model=ScanStatus)
async def get_scan_status(job_id: str, current_user: dict = Depends(get_current_user)):
    job_data = redis_client.get(f"scan_job:{job_id}")
    if not job_data:
        # Check MongoDB if not in Redis
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
    return json.loads(job_data)

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

@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    
    if job_id not in active_connections:
        active_connections[job_id] = []
    
    active_connections[job_id].append(websocket)
    
    # Send current status immediately
    job_data = redis_client.get(f"scan_job:{job_id}")
    if job_data:
        await websocket.send_json(json.loads(job_data))
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections[job_id].remove(websocket)
        if not active_connections[job_id]:
            del active_connections[job_id]
