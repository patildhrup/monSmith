import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "patildhrup.dev@gmail.com") # Should ideally be verified sender

async def send_otp_email(email: str, otp: str):
    if not SENDGRID_API_KEY:
        print(f"DEBUG: OTP for {email} is {otp} (SendGrid API key not configured)")
        return True

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=email,
        subject="Your monSmith Verification Code",
        html_content=f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #10b981; border-radius: 12px; background-color: #020617; color: #f8fafc;">
            <h2 style="color: #10b981; text-align: center;">Welcome to monSmith</h2>
            <p style="text-align: center;">Your verification code is:</p>
            <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; border: 1px solid #1e293b; color: #10b981;">
                {otp}
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 20px;">
                This code will expire in <strong>5 minutes</strong>.
            </p>
        </div>
        """
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"DEBUG: SendGrid response status code: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending email via SendGrid: {str(e)}")
        if hasattr(e, 'body'):
            print(f"SendGrid Error Body: {e.body}")
        return False
