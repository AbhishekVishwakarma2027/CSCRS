"""create_refresh_tokens_table

Revision ID: 65d2488006d6
Revises: 08a946b86902
Create Date: 2026-07-22 20:09:09.285593

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65d2488006d6'
down_revision: Union[str, Sequence[str], None] = '08a946b86902'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "refresh_tokens",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),

        sa.Column(
            "token_hash",
            sa.String(length=64),
            nullable=False,
        ),

        sa.Column(
            "jwt_id",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "session_id",
            sa.String(length=36),
            nullable=False,
        ),

        sa.Column(
            "ip_address",
            sa.String(length=64),
        ),

        sa.Column(
            "device_type",
            sa.String(length=50),
        ),

        sa.Column(
            "browser",
            sa.String(length=100),
        ),

        sa.Column(
            "operating_system",
            sa.String(length=100),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),

        sa.Column(
            "last_used_at",
            sa.DateTime(timezone=True),
        ),

        sa.Column(
            "revoked_at",
            sa.DateTime(timezone=True),
        ),

        sa.Column(
            "revoked_reason",
            sa.String(length=255),
        ),
    )

    op.create_index(
        "ix_refresh_tokens_user_id",
        "refresh_tokens",
        ["user_id"],
    )

    op.create_index(
        "ix_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    op.create_index(
        "ix_refresh_tokens_jwt_id",
        "refresh_tokens",
        ["jwt_id"],
        unique=True,
    )

    op.create_index(
        "ix_refresh_tokens_session_id",
        "refresh_tokens",
        ["session_id"],
    )
    op.create_index(
        "ix_refresh_tokens_expires_at",
        "refresh_tokens",
        ["expires_at"],
    )
    op.drop_constraint(
        "report_supports_report_id_fkey",
        "report_supports",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "report_supports_report_id_fkey",
        "report_supports",
        "reports",
        ["report_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    
    op.drop_index(
        "ix_refresh_tokens_expires_at",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_refresh_tokens_session_id",
        table_name="refresh_tokens",
    )

    op.drop_index(
        "ix_refresh_tokens_jwt_id",
        table_name="refresh_tokens",
    )

    op.drop_index(
        "ix_refresh_tokens_token_hash",
        table_name="refresh_tokens",
    )

    op.drop_index(
        "ix_refresh_tokens_user_id",
        table_name="refresh_tokens",
    )

    op.drop_constraint(
        "report_supports_report_id_fkey",
        "report_supports",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "report_supports_report_id_fkey",
        "report_supports",
        "reports",
        ["report_id"],
        ["id"],
    )

    op.drop_table(
        "refresh_tokens",
    )