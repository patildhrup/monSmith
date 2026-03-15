import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

async def send_otp_email(email: str, otp: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"DEBUG: OTP for {email} is {otp} (SMTP not configured)")
        return True

    msg = MIMEMultipart()
    msg['From'] = f"monSmith Support <{SMTP_USER}>"
    msg['To'] = email
    msg['Subject'] = "Your monSmith Verification Code"

    body = f"""
    <h2>Welcome to monSmith</h2>
    <p>Your verification code is: <strong>{otp}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
