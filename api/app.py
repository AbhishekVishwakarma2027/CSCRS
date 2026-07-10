from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from api.routes import router

app = FastAPI(
    title="CSCRS API",
    version="1.0.0"
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)
app.include_router(router)