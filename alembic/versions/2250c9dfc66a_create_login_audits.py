"""create_login_audits

Revision ID: 2250c9dfc66a
Revises: 993faaba47a8
Create Date: 2026-07-20 20:49:14.535603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2250c9dfc66a'
down_revision: Union[str, Sequence[str], None] = '993faaba47a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.create_table(
        "login_audits",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
            ),
            nullable=True,
        ),

        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "role",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "login_success",
            sa.Boolean(),
            nullable=False,
        ),

        sa.Column(
            "failure_reason",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "ip_address",
            sa.String(length=45),
            nullable=True,
        ),

        sa.Column(
            "user_agent",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "browser",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "browser_version",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "operating_system",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "os_version",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "device_type",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "platform",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "city",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "state",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "country",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "request_path",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "http_method",
            sa.String(length=10),
            nullable=True,
        ),

        sa.Column(
            "login_source",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "login_at",
            sa.DateTime(timezone=True),
            server_default=sa.text('CURRENT_TIMESTAMP'),
            nullable=False,
        ),

        sa.Column(
            "logout_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "session_id",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "jwt_id",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_login_audits_user_id",
        "login_audits",
        ["user_id"],
    )

    op.create_index(
        "ix_login_audits_session_id",
        "login_audits",
        ["session_id"],
    )

    op.create_index(
        "ix_login_audits_jwt_id",
        "login_audits",
        ["jwt_id"],
    )


def downgrade():

    op.drop_index(
        "ix_login_audits_jwt_id",
        table_name="login_audits",
    )

    op.drop_index(
        "ix_login_audits_session_id",
        table_name="login_audits",
    )

    op.drop_index(
        "ix_login_audits_user_id",
        table_name="login_audits",
    )

    op.drop_table(
        "login_audits",
    )
