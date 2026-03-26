from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from fastapi.responses import RedirectResponse
import requests
import os
import logging
from datetime import datetime
from app.db.db import db
from app.core.auth_utils import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = "http://localhost:5173" # Update if needed

@router.get("/callback")
async def github_callback(code: str, state: Optional[str] = None):
    """
    Handle GitHub OAuth callback.
    Exchanges code for access_token and updates the user's record.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Code not provided")

    # Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    payload = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code
    }
    headers = {"Accept": "application/json"}
    
    response = requests.post(token_url, json=payload, headers=headers)
    token_data = response.json()
    
    if "access_token" not in token_data:
        logger.error(f"GitHub token exchange failed: {token_data}")
        return RedirectResponse(url=f"{FRONTEND_URL}/git-connect?error=token_exchange_failed")

    access_token = token_data["access_token"]

    # Identity user
    email = None
    if state:
        import base64
        try:
            email = base64.b64decode(state).decode()
        except Exception:
            logger.warning(f"Failed to decode state: {state}")

    if not email:
        # Fallback to GitHub user info
        user_url = "https://api.github.com/user"
        user_headers = {"Authorization": f"token {access_token}"}
        user_response = requests.get(user_url, headers=user_headers)
        github_user = user_response.json()
        email = github_user.get("email")
        
        if not email:
            # If email is private, get it from emails endpoint
            emails_url = "https://api.github.com/user/emails"
            emails_response = requests.get(emails_url, headers=user_headers)
            emails = emails_response.json()
            primary_email = next((e["email"] for e in emails if e["primary"]), emails[0]["email"])
            email = primary_email

    # Find the user in our DB and update their github_token
    user = await db.users.find_one({"email": email})
    if not user:
        # If user doesn't exist, we might want to create one or handle as an error
        # For now, let's just log and redirect with error
        logger.warning(f"GitHub callback: user not found for email {email}")
        return RedirectResponse(url=f"{FRONTEND_URL}/git-connect?error=user_not_found")

    await db.users.update_one(
        {"email": email},
        {"$set": {
            "github_token": access_token,
            "has_github_connected": True
        }}
    )

    return RedirectResponse(url=f"{FRONTEND_URL}/git-connect?status=connected")

@router.get("/repos")
async def get_github_repos(current_user: dict = Depends(get_current_user)):
    """
    List repositories for the connected GitHub account.
    """
    token = current_user.get("github_token")
    if not token:
        raise HTTPException(status_code=400, detail="GitHub not connected")

    repos_url = "https://api.github.com/user/repos?per_page=100&sort=updated"
    headers = {"Authorization": f"token {token}"}
    
    response = requests.get(repos_url, headers=headers)
    if response.status_code != 200:
        logger.error(f"Failed to fetch repos: {response.text}")
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories from GitHub")

    repos = response.json()
    logger.info(f"Fetched {len(repos)} repos for {current_user['email']}")
    return [{"name": r["full_name"], "url": r["clone_url"], "private": r["private"]} for r in repos]
