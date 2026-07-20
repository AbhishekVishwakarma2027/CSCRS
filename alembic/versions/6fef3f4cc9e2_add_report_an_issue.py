"""add report an issue

Revision ID: 6fef3f4cc9e2
Revises: 88f069bb0223
Create Date: 2026-07-19 22:46:20.251365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fef3f4cc9e2'
down_revision: Union[str, Sequence[str], None] = '88f069bb0223'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.create_table(
        "system_issues",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "issue_number",
            sa.String(length=20),
            unique=True,
            nullable=False,
        ),

        sa.Column(
            "reporter_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "related_report_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "category",
            sa.Enum(
                "Authentication",
                "Authorization",
                "Report Submission",
                "Report Verification",
                "Duplicate Detection",
                "Worker",
                "Assignment",
                "Resolution Upload",
                "Resolution Verification",
                "Timeline",
                "Notification",
                "Email",
                "Dashboard",
                "Search",
                "Filter",
                "Performance",
                "UI / UX",
                "API",
                "Database",
                "AI Detection",
                "GPS / EXIF",
                "Image Upload",
                "Video Upload",
                "Security",
                "Other",
                name="systemissuecategory",
                native_enum=False,
            ),
            nullable=False,
            server_default="Other",
        ),

        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="OPEN",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["reporter_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["related_report_id"],
            ["reports.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_system_issues_id",
        "system_issues",
        ["id"],
    )

    op.create_index(
        "ix_system_issues_issue_number",
        "system_issues",
        ["issue_number"],
        unique=True,
    )

    op.create_index(
        "ix_system_issues_reporter_id",
        "system_issues",
        ["reporter_id"],
    )

    op.create_index(
        "ix_system_issues_status",
        "system_issues",
        ["status"],
    )

    op.create_index(
        "ix_system_issues_category",
        "system_issues",
        ["category"],
    )

    op.create_table(
        "system_issue_attachments",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "issue_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "original_filename",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "stored_filename",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "file_path",
            sa.String(length=500),
            nullable=False,
        ),

        sa.Column(
            "mime_type",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "file_size",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["issue_id"],
            ["system_issues.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_system_issue_attachments_id",
        "system_issue_attachments",
        ["id"],
    )

    op.create_index(
        "ix_system_issue_attachments_issue_id",
        "system_issue_attachments",
        ["issue_id"],
    )

def downgrade():

    op.drop_index(
        "ix_system_issue_attachments_issue_id",
        table_name="system_issue_attachments",
    )

    op.drop_index(
        "ix_system_issue_attachments_id",
        table_name="system_issue_attachments",
    )

    op.drop_table(
        "system_issue_attachments",
    )

    op.drop_index(
        "ix_system_issues_category",
        table_name="system_issues",
    )

    op.drop_index(
        "ix_system_issues_status",
        table_name="system_issues",
    )

    op.drop_index(
        "ix_system_issues_reporter_id",
        table_name="system_issues",
    )

    op.drop_index(
        "ix_system_issues_issue_number",
        table_name="system_issues",
    )

    op.drop_index(
        "ix_system_issues_id",
        table_name="system_issues",
    )

    op.drop_table(
        "system_issues",
    )
