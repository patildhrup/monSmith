from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta
from ...db.db import db
from ...models.user_model import UserModel, OTPModel
from ...schemas.user_schema import UserSignup, UserLogin, VerifyOTP, Token, GoogleLogin, ForgotPasswordRequest, ResetPassword
from ...core.auth_utils import get_password_hash, verify_password, create_access_token, generate_otp
from ...services.email_service import send_otp_email
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignup):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        if existing_user.get("is_verified"):
            raise HTTPException(status_code=400, detail="Email already registered")
        # If not verified, reuse the account but update password and send new OTP
    
    otp = generate_otp()
    # Save OTP to database
    await db.otps.update_one(
        {"email": user_data.email},
        {"$set": {"otp": otp, "created_at": datetime.utcnow()}, 
         "$setOnInsert": {"email": user_data.email}},
        upsert=True
    )
    
    # Save temporary user info if not exists
    if not existing_user:
        new_user = {
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "full_name": user_data.full_name,
            "is_verified": False,
            "auth_provider": "email",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user)
    else:
        await db.users.update_one(
            {"email": user_data.email},
            {"$set": {"hashed_password": get_password_hash(user_data.password), "full_name": user_data.full_name}}
        )

    # Send OTP email
    email_sent = await send_otp_email(user_data.email, otp)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": "OTP sent to your email"}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(data: VerifyOTP):
    otp_record = await db.otps.find_one({"email": data.email, "otp": data.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check expiry (5 mins)
    if datetime.utcnow() - otp_record["created_at"] > timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Mark user as verified
    await db.users.update_one({"email": data.email}, {"$set": {"is_verified": True}})
    
    # Delete OTP record
    await db.otps.delete_one({"_id": otp_record["_id"]})
    
    # Generate token
    access_token = create_access_token(data={"sub": data.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    # Always return 200 to prevent email enumeration
    user = await db.users.find_one({"email": data.email})
    if user:
        otp = generate_otp()
        await db.otps.update_one(
            {"email": data.email},
            {"$set": {"otp": otp, "created_at": datetime.utcnow(), "purpose": "reset"},
             "$setOnInsert": {"email": data.email}},
            upsert=True
        )
        email_sent = await send_otp_email(data.email, otp)
        if not email_sent:
            logger.warning(f"Failed to send reset OTP to {data.email}")
    return {"message": "If that email is registered, an OTP has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPassword):
    otp_record = await db.otps.find_one({"email": data.email, "otp": data.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() - otp_record["created_at"] > timedelta(minutes=5):
        await db.otps.delete_one({"_id": otp_record["_id"]})
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    # Update password
    hashed = get_password_hash(data.new_password)
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"hashed_password": hashed}}
    )
    await db.otps.delete_one({"_id": otp_record["_id"]})

    return {"message": "Password reset successful. You can now log in."}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not user.get("is_verified"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": credentials.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login", response_model=Token)
async def google_login(data: GoogleLogin):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    print(f"DEBUG: Processing Google login for Client ID prefix: {client_id[:10] if client_id else 'None'}")
    logger.info(f"Processing Google login for Client ID prefix: {client_id[:10] if client_id else 'None'}")
    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            data.id_token, 
            requests.Request(), 
            client_id,
            clock_skew_in_seconds=10
        )
        
        # ID token is valid. Get the user's Google ID from the decoded token.
        email = idinfo['email']
        full_name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        logger.info(f"Token verified for email: {email}")
        
        user = await db.users.find_one({"email": email})
        
        if not user:
            new_user = {
                "email": email,
                "full_name": full_name,
                "picture": picture,
                "is_verified": True,
                "auth_provider": "google",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(new_user)
        else:
            # Update user info if needed
            await db.users.update_one(
                {"email": email},
                {"$set": {"full_name": full_name, "picture": picture, "auth_provider": "google", "is_verified": True}}
            )
        
        access_token = create_access_token(data={"sub": email})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        logger.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        logger.error(f"General error during Google login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")
