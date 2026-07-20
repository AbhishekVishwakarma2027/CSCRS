"""add_user_security_fields

Revision ID: ce829be09c46
Revises: 2250c9dfc66a
Create Date: 2026-07-20 21:19:43.300332

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce829be09c46'
down_revision: Union[str, Sequence[str], None] = '2250c9dfc66a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.add_column(
        "users",
        sa.Column(
            "last_successful_login",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "last_failed_login",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "account_locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Existing rows ke liye default set ho jayega,
    # uske baad model ka default use hoga.

def downgrade():

    op.drop_column(
        "users",
        "account_locked_until",
    )

    op.drop_column(
        "users",
        "failed_login_attempts",
    )

    op.drop_column(
        "users",
        "last_failed_login",
    )

    op.drop_column(
        "users",
        "last_successful_login",
    )