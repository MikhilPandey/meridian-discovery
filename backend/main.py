import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import deps
from routers import compare, meals, me, predict, profile, snps


@asynccontextmanager
async def lifespan(app: FastAPI):
    deps.initialize()
    yield


app = FastAPI(title="Meridian Discovery API", lifespan=lifespan)

_default_origins = ["http://localhost:3000"]
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meals.router)
app.include_router(predict.router)
app.include_router(compare.router)
app.include_router(profile.router)
app.include_router(snps.router)
app.include_router(me.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
