"""add destination_department_id

Revision ID: 3697b7dda552
Revises: 7f58753854ad
Create Date: 2026-07-16 15:33:44.796473

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3697b7dda552'
down_revision: Union[str, Sequence[str], None] = '7f58753854ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass