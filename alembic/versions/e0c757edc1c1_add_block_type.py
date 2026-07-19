"""add block type

Revision ID: e0c757edc1c1
Revises: e68cfcb6fd83
Create Date: 2026-07-18 22:58:24.763506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0c757edc1c1'
down_revision: Union[str, Sequence[str], None] = 'e68cfcb6fd83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.add_column(
        "users",
        sa.Column(
            "block_type",
            sa.String(length=20),
            nullable=True,
        ),
    )


def downgrade():

    op.drop_column(
        "users",
        "block_type",
    )
