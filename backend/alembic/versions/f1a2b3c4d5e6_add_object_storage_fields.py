"""add object storage fields
Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-10-02 15:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. report_images
    op.add_column('report_images', sa.Column('object_key', sa.String(length=500), nullable=True))
    op.add_column('report_images', sa.Column('storage_provider', sa.String(length=50), nullable=False, server_default='local'))
    op.add_column('report_images', sa.Column('sha256', sa.String(length=64), nullable=True))
    op.add_column('report_images', sa.Column('width', sa.Integer(), nullable=True))
    op.add_column('report_images', sa.Column('height', sa.Integer(), nullable=True))
    op.create_index('ix_report_images_object_key', 'report_images', ['object_key'], unique=False)
    op.create_index('ix_report_images_sha256', 'report_images', ['sha256'], unique=False)

    # 2. resolution_attempts
    op.add_column('resolution_attempts', sa.Column('object_key', sa.String(length=500), nullable=True))
    op.add_column('resolution_attempts', sa.Column('annotated_object_key', sa.String(length=500), nullable=True))
    op.add_column('resolution_attempts', sa.Column('storage_provider', sa.String(length=50), nullable=False, server_default='local'))
    op.create_index('ix_resolution_attempts_object_key', 'resolution_attempts', ['object_key'], unique=False)

    # 3. system_issue_attachments
    op.add_column('system_issue_attachments', sa.Column('object_key', sa.String(length=500), nullable=True))
    op.add_column('system_issue_attachments', sa.Column('storage_provider', sa.String(length=50), nullable=False, server_default='local'))
    op.add_column('system_issue_attachments', sa.Column('sha256', sa.String(length=64), nullable=True))
    op.create_index('ix_system_issue_attachments_object_key', 'system_issue_attachments', ['object_key'], unique=False)

    # 4. users
    op.add_column('users', sa.Column('profile_image_object_key', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('profile_image_storage_provider', sa.String(length=50), nullable=True, server_default='local'))

    # 5. public_updates
    op.add_column('public_updates', sa.Column('thumbnail_object_key', sa.String(length=500), nullable=True))
    op.add_column('public_updates', sa.Column('thumbnail_storage_provider', sa.String(length=50), nullable=True, server_default='local'))


def downgrade() -> None:
    # 5. public_updates
    op.drop_column('public_updates', 'thumbnail_storage_provider')
    op.drop_column('public_updates', 'thumbnail_object_key')

    # 4. users
    op.drop_column('users', 'profile_image_storage_provider')
    op.drop_column('users', 'profile_image_object_key')

    # 3. system_issue_attachments
    op.drop_index('ix_system_issue_attachments_object_key', table_name='system_issue_attachments')
    op.drop_column('system_issue_attachments', 'sha256')
    op.drop_column('system_issue_attachments', 'storage_provider')
    op.drop_column('system_issue_attachments', 'object_key')

    # 2. resolution_attempts
    op.drop_index('ix_resolution_attempts_object_key', table_name='resolution_attempts')
    op.drop_column('resolution_attempts', 'storage_provider')
    op.drop_column('resolution_attempts', 'annotated_object_key')
    op.drop_column('resolution_attempts', 'object_key')

    # 1. report_images
    op.drop_index('ix_report_images_sha256', table_name='report_images')
    op.drop_index('ix_report_images_object_key', table_name='report_images')
    op.drop_column('report_images', 'height')
    op.drop_column('report_images', 'width')
    op.drop_column('report_images', 'sha256')
    op.drop_column('report_images', 'storage_provider')
    op.drop_column('report_images', 'object_key')
