"""add data retention indexes

Revision ID: e5f6a7b8c9d0
Revises: 9c71a8234567
Create Date: 2026-10-02 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = '9c71a8234567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Index on login_audits(login_at) for efficient timestamp cutoff scans
    op.create_index(
        'ix_login_audits_login_at',
        'login_audits',
        ['login_at'],
        unique=False,
    )

    # 2. Index on in_app_notifications(created_at) for efficient retention scans
    op.create_index(
        'ix_in_app_notifications_created_at',
        'in_app_notifications',
        ['created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        'ix_in_app_notifications_created_at',
        table_name='in_app_notifications',
    )
    op.drop_index(
        'ix_login_audits_login_at',
        table_name='login_audits',
    )
