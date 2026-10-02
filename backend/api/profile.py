from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)

from sqlalchemy.orm import Session

from authentication.dependencies import (
    get_current_user,
)

from database.dependencies import (
    get_db,
)

from database.models.user import User

from schemas.profile import (
    ProfileResponse,
    UpdateProfileRequest,
)

from schemas.user import (
    MessageResponse,
)

from services.profile_service import (
    ProfileService,
)




router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)

@router.get(
    "/me",
    response_model=ProfileResponse,
)
def get_my_profile(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    service = ProfileService(
        db,
    )

    return service.get_my_profile(
        current_user,
    )


@router.patch(
    "/me",
    response_model=MessageResponse,
)
def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    service = ProfileService(
        db,
    )

    return service.update_profile(
        current_user=current_user,
        name=request.name,
        phone=request.phone,
    )
@router.post(
    "/photo",
)
def upload_profile_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    service = ProfileService(
        db,
    )

    return service.upload_profile_photo(
        current_user=current_user,
        photo=photo,
    )
@router.get(
    "/photo",
)
def get_my_profile_photo(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):
    service = ProfileService(
        db,
    )
    return service.get_profile_photo_stream(
        current_user.id,
    )


@router.get(
    "/{user_id}/photo",
)
def get_user_profile_photo(
    user_id: int,
    db: Session = Depends(
        get_db,
    ),
):
    service = ProfileService(
        db,
    )
    return service.get_profile_photo_stream(
        user_id,
    )


@router.delete(
    "/photo",
    response_model=MessageResponse,
)
def delete_profile_photo(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):
    service = ProfileService(
        db,
    )
    return service.delete_profile_photo(
        current_user=current_user,
    )
