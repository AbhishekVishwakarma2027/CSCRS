"""create public updates table

Revision ID: 9c71a8234567
Revises: 8b9fa0113456
Create Date: 2026-09-17 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9c71a8234567'
down_revision: Union[str, Sequence[str], None] = '8b9fa0113456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'public_updates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='Press'),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_time_minutes', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_public_updates_id'), 'public_updates', ['id'], unique=False)
    op.create_index(op.f('ix_public_updates_slug'), 'public_updates', ['slug'], unique=True)
    op.create_index(op.f('ix_public_updates_is_published'), 'public_updates', ['is_published'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_public_updates_is_published'), table_name='public_updates')
    op.drop_index(op.f('ix_public_updates_slug'), table_name='public_updates')
    op.drop_index(op.f('ix_public_updates_id'), table_name='public_updates')
    op.drop_table('public_updates')
