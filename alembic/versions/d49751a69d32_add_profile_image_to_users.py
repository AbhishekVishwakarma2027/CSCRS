"""add profile image to users

Revision ID: d49751a69d32
Revises: 3697b7dda552
Create Date: 2026-07-18 16:06:51.308100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd49751a69d32'
down_revision: Union[str, Sequence[str], None] = '3697b7dda552'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
    "users",
    sa.Column(
        "profile_image",
        sa.String(length=500),
        nullable=True,
    ),
)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column(
    "users",
    "profile_image",
)
