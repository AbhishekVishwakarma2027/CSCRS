"""add announcement lifecycle fields

Revision ID: 7a8e9f102345
Revises: cd2598f26b66
Create Date: 2026-09-16 11:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a8e9f102345'
down_revision: Union[str, Sequence[str], None] = 'cd2598f26b66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'in_app_notifications',
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'in_app_notifications',
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'in_app_notifications',
        sa.Column('announcement_type', sa.String(length=30), nullable=True)
    )
    op.add_column(
        'in_app_notifications',
        sa.Column('broadcast_id', sa.String(length=50), nullable=True)
    )
    op.create_index(
        op.f('ix_in_app_notifications_broadcast_id'),
        'in_app_notifications',
        ['broadcast_id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_in_app_notifications_broadcast_id'), table_name='in_app_notifications')
    op.drop_column('in_app_notifications', 'broadcast_id')
    op.drop_column('in_app_notifications', 'announcement_type')
    op.drop_column('in_app_notifications', 'ends_at')
    op.drop_column('in_app_notifications', 'starts_at')
