"""add feedback

Revision ID: 88f069bb0223
Revises: e0c757edc1c1
Create Date: 2026-07-19 22:04:41.945443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88f069bb0223'
down_revision: Union[str, Sequence[str], None] = 'e0c757edc1c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "feedbacks",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "rating",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "liked_text",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "suggestion_text",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_feedbacks_id",
        "feedbacks",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_feedbacks_user_id",
        "feedbacks",
        ["user_id"],
        unique=False,
    )


def downgrade():

    op.drop_index(
        "ix_feedbacks_user_id",
        table_name="feedbacks",
    )

    op.drop_index(
        "ix_feedbacks_id",
        table_name="feedbacks",
    )

    op.drop_table("feedbacks")