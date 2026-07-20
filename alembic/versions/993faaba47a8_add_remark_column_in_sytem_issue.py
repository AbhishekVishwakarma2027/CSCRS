"""add remark column in sytem issue

Revision ID: 993faaba47a8
Revises: 6fef3f4cc9e2
Create Date: 2026-07-20 18:08:49.229233

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '993faaba47a8'
down_revision: Union[str, Sequence[str], None] = '6fef3f4cc9e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.add_column(
        "system_issues",
        sa.Column(
            "closed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "system_issues",
        sa.Column(
            "remarks",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade():

    op.drop_column(
        "system_issues",
        "remarks",
    )

    op.drop_column(
        "system_issues",
        "closed_at",
    )
