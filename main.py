from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from service import calculate_transfer
import models
from database import engine, get_db
import auth

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str

class LocationBase(BaseModel):
    lat: float
    lon: float
    acc: int = 0
    city: str = None
    country: str = None
    isp: str = None
    status: str = "Approximate"
    user_agent: str = None

@app.post("/log-location")
def log_location(loc: LocationBase, db: Session = Depends(get_db)):
    db_loc = models.LocationLog(
        lat=loc.lat,
        lon=loc.lon,
        acc=loc.acc,
        city=loc.city,
        country=loc.country,
        isp=loc.isp,
        status=loc.status,
        user_agent=loc.user_agent
    )
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return {"status": "Logged"}

@app.get("/admin/location-logs")
def get_location_logs(db: Session = Depends(get_db)):
    # Retrieve all logs in descending order
    return db.query(models.LocationLog).order_by(models.LocationLog.id.desc()).all()

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name}


@app.get("/transfer")
def transfer(amount: float, from_country: str, to_country: str, recipient_name: str, 
             db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    
    result = calculate_transfer(amount, from_country, to_country)
    
    # Save to Database with sender and recipient
    db_transfer = models.TransferRecord(
        sender_id=current_user.id,
        recipient_name=recipient_name,
        amount=result["amount"],
        from_country=result["from_country"],
        to_country=result["to_country"],
        exchange_rate=result["exchange_rate"],
        fee=result["fee"],
        amount_received=result["amount_received"]
    )
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    
    result["recipient_name"] = recipient_name
    return result

@app.get("/history")
def history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Retrieve last 10 transfers for the CURRENT user
    transfers = db.query(models.TransferRecord).filter(models.TransferRecord.sender_id == current_user.id)\
                  .order_by(models.TransferRecord.id.desc()).limit(10).all()
    return transfers