from api.auth import router as auth_router
from fastapi import APIRouter
from api.worker import router as worker_router
from api.assignment import router as assignment_router
from api.resolution import router as resolution_router
from api.admin import router as admin_router
from api.city_admin import router as city_admin_router
from api.department import router as department_router
from api.report import router as report_router
from api.dashboard import router as dashboard_router
from api import timeline
from api import in_app_notification
from api.forward_request import router as forward_request_router
from api import generate_report
from api import profile
from api.feedback import router as feedback_router
from api.system_issue import router as system_issue
from api.ai_dataset import router as ai_dataset_router
from api.super_admin import router as super_admin_router
from api.announcements import (
    super_admin_router as super_admin_announcements_router,
    user_router as user_announcements_router,
)
from api.public import router as public_router
from api.public_updates_admin import router as super_admin_updates_router
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import text

from database.connection import SessionLocal

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health():

    return {
        "status": "healthy",
        "service": "CSCRS API",
        "version": "1.0.0",
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }
@router.get("/liveness", tags=["Health"])
async def liveness():

    return {
        "status": "alive",
    }
@router.get("/readiness", tags=["Health"])
async def readiness():

    db = SessionLocal()

    try:

        db.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "database": "connected",
        }

    except Exception:

        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "database": "disconnected",
            },
        )

    finally:

        db.close()
router.include_router(auth_router)
router.include_router(worker_router,prefix="/api/v1",)
router.include_router(admin_router,prefix="/api/v1",)
router.include_router(city_admin_router,prefix="/api/v1",)
router.include_router(assignment_router,prefix="/api/v1",) #
router.include_router(resolution_router,prefix="/api/v1",)#
router.include_router(department_router,prefix="/api/v1",)
router.include_router(report_router,prefix="/api/v1",)
router.include_router(dashboard_router,prefix="/api/v1",)
router.include_router(timeline.router,prefix="/api/v1",)#
router.include_router(in_app_notification.router,prefix="/api/v1",) #
router.include_router(forward_request_router,prefix="/api/v1",)
router.include_router(generate_report.router,prefix="/api/v1",)
router.include_router(profile.router,prefix="/api/v1",)
router.include_router(feedback_router,prefix="/api/v1",)
router.include_router(system_issue,prefix="/api/v1",)
router.include_router(ai_dataset_router,prefix="/api/v1",)
router.include_router(super_admin_router,prefix="/api/v1",)
router.include_router(super_admin_announcements_router,prefix="/api/v1",)
router.include_router(user_announcements_router,prefix="/api/v1",)
router.include_router(super_admin_updates_router,prefix="/api/v1",)
router.include_router(public_router,prefix="/api/v1",)