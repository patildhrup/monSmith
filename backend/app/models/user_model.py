from pydantic import BaseModel, EmailStr, Field, ConfigDict, BeforeValidator, PlainSerializer
from typing import Optional, Any, Annotated
from datetime import datetime
from bson import ObjectId

# Pydantic v2 compatible ObjectId handling
PyObjectId = Annotated[
    Any,
    BeforeValidator(lambda x: ObjectId(x) if isinstance(x, str) and ObjectId.is_valid(x) else x),
    PlainSerializer(lambda x: str(x), return_type=str),
]

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: Optional[str] = None
    full_name: Optional[str] = None
    is_verified: bool = False
    picture: Optional[str] = None
    auth_provider: str = "email" # email or google
    github_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class OTPModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
