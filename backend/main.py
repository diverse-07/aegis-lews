from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import weather, alerts, risk, analytics
from backend.database import Base, engine
import backend.seed as seed_module

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NER-LEWS API - Team AEGIS",
    description="NER Landslide Early Warning System | MDoNER & NDMA Initiative",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.on_event("startup")
async def startup():
    seed_module.run_seed()

@app.get("/")
def root():
    return {"system": "NER-LEWS", "team": "Team AEGIS", "status": "operational", "version": "2.0.0"}