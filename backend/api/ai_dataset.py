from io import BytesIO

import pandas as pd
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from authentication.dependencies import get_current_user
from database.models.user import (
    User,
    UserRole,
)
from database.dependencies import get_db
from schemas.ai_dataset import DatasetExportFormat
from services.ai_dataset_service import AIDatasetService

router = APIRouter(
    prefix="/ai-dataset",
    tags=["AI Dataset"],
)


@router.get("/export")
def export_ai_dataset(
    format: DatasetExportFormat = Query(
        DatasetExportFormat.CSV,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only Super Admin can export AI dataset.",
        )

    dataset = AIDatasetService.get_dataset(db)

    df = pd.DataFrame(dataset)

    if format == DatasetExportFormat.CSV:

        stream = BytesIO()

        df.to_csv(
            stream,
            index=False,
        )

        stream.seek(0)

        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    "attachment; "
                    'filename="ai_dataset.csv"'
                )
            },
        )

    stream = BytesIO()

    with pd.ExcelWriter(
        stream,
        engine="openpyxl",
    ) as writer:

        df.to_excel(
            writer,
            index=False,
            sheet_name="AI Dataset",
        )

    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; "
                'filename="ai_dataset.xlsx"'
            )
        },
    )