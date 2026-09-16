"""create broadcasts table and decouple notifications

Revision ID: 8b9fa0113456
Revises: 7a8e9f102345
Create Date: 2026-09-16 16:15:00.000000

Development-phase migration. Historical SYSTEM_ANNOUNCEMENT recipient rows are intentionally not recreated on downgrade.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = '8b9fa0113456'
down_revision: Union[str, Sequence[str], None] = '7a8e9f102345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create broadcasts table
    op.create_table(
        'broadcasts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('broadcast_id', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('target_role', sa.String(length=30), nullable=False, server_default='ALL'),
        sa.Column('announcement_type', sa.String(length=30), nullable=False, server_default='INFORMATIONAL'),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recipient_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('broadcast_id')
    )
    op.create_index(op.f('ix_broadcasts_id'), 'broadcasts', ['id'], unique=False)
    op.create_index(op.f('ix_broadcasts_broadcast_id'), 'broadcasts', ['broadcast_id'], unique=True)

    # 2. Extract existing SYSTEM_ANNOUNCEMENT rows and group into broadcasts
    bind = op.get_bind()

    query = text("""
        SELECT 
            id, broadcast_id, title, message, announcement_type, starts_at, ends_at, created_at
        FROM in_app_notifications
        WHERE type = 'SYSTEM_ANNOUNCEMENT'
    """)
    rows = bind.execute(query).fetchall()

    import hashlib
    groups = {}
    for r in rows:
        b_id = r.broadcast_id or f"legacy_{hashlib.md5(f'{r.title}_{r.message}'.encode('utf-8')).hexdigest()[:12]}"
        if b_id not in groups:
            groups[b_id] = {
                "broadcast_id": b_id,
                "title": r.title,
                "message": r.message,
                "announcement_type": r.announcement_type or "INFORMATIONAL",
                "starts_at": r.starts_at,
                "ends_at": r.ends_at,
                "recipient_count": 0,
                "created_at": r.created_at,
            }
        groups[b_id]["recipient_count"] += 1

    for g in groups.values():
        bind.execute(
            text("""
                INSERT INTO broadcasts (
                    broadcast_id, title, message, target_role, announcement_type,
                    starts_at, ends_at, recipient_count, created_by, created_at, updated_at
                ) VALUES (
                    :broadcast_id, :title, :message, 'ALL', :announcement_type,
                    :starts_at, :ends_at, :recipient_count, NULL, :created_at, :created_at
                )
            """),
            g
        )

    # 3. Delete ONLY SYSTEM_ANNOUNCEMENT rows from in_app_notifications
    bind.execute(text("DELETE FROM in_app_notifications WHERE type = 'SYSTEM_ANNOUNCEMENT'"))

    # 4. Remove PATCH-23 lifecycle columns and index from in_app_notifications
    op.drop_index(op.f('ix_in_app_notifications_broadcast_id'), table_name='in_app_notifications')
    op.drop_column('in_app_notifications', 'broadcast_id')
    op.drop_column('in_app_notifications', 'announcement_type')
    op.drop_column('in_app_notifications', 'ends_at')
    op.drop_column('in_app_notifications', 'starts_at')


def downgrade() -> None:
    """
    Development-phase migration. Historical SYSTEM_ANNOUNCEMENT recipient rows are intentionally not recreated on downgrade.
    """
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

    op.drop_index(op.f('ix_broadcasts_broadcast_id'), table_name='broadcasts')
    op.drop_index(op.f('ix_broadcasts_id'), table_name='broadcasts')
    op.drop_table('broadcasts')
