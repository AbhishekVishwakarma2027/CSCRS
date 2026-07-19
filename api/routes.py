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


router = APIRouter()

router.include_router(auth_router)
router.include_router(worker_router)
router.include_router(admin_router)
router.include_router(city_admin_router)
router.include_router(assignment_router,prefix="/api/v1",)
router.include_router(resolution_router,prefix="/api/v1",)
router.include_router(department_router)
router.include_router(report_router)
router.include_router(dashboard_router)
router.include_router(timeline.router,prefix="/api/v1",)
router.include_router(in_app_notification.router,prefix="/api/v1",)
router.include_router(forward_request_router)
router.include_router(generate_report.router)
router.include_router(profile.router)