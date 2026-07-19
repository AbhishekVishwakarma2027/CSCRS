"""add citizen block fields

Revision ID: e68cfcb6fd83
Revises: d49751a69d32
Create Date: 2026-07-18 16:54:26.315432

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e68cfcb6fd83'
down_revision: Union[str, Sequence[str], None] = 'd49751a69d32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "is_blocked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "blocked_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "blocked_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "block_reason",
            sa.String(length=500),
            nullable=True,
        ),
    )



def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "users",
        "block_reason",
    )

    op.drop_column(
        "users",
        "blocked_by",
    )

    op.drop_column(
        "users",
        "blocked_at",
    )

    op.drop_column(
        "users",
        "is_blocked",
    )
