"""increase system issue number length

Revision ID: cd2598f26b66
Revises: 2a344703429c
Create Date: 2026-08-17 17:09:09.546175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd2598f26b66'
down_revision: Union[str, Sequence[str], None] = '2a344703429c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "system_issues",
        "issue_number",
        existing_type=sa.String(length=20),
        type_=sa.String(length=50),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "system_issues",
        "issue_number",
        existing_type=sa.String(length=50),
        type_=sa.String(length=20),
        existing_nullable=False,
    )
