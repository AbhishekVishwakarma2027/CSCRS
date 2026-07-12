from api.auth import router as auth_router
from fastapi import APIRouter
from api.worker import router as worker_router
from api.assignment import router as assignment_router
from api.resolution import router as resolution_router
from api.admin import router as admin_router
from api.city_admin import router as city_admin_router
from api.department import router as department_router
from api.report import router as report_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(worker_router)
router.include_router(admin_router)
router.include_router(city_admin_router)
router.include_router(assignment_router,prefix="/api/v1",)
router.include_router(resolution_router,prefix="/api/v1",)
router.include_router(department_router)
router.include_router(report_router)