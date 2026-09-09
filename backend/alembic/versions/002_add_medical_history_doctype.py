"""Add MEDICAL_HISTORY to documenttype enum

Revision ID: 002
Revises: 001
Create Date: 2024-01-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add MEDICAL_HISTORY value to the existing documenttype enum in PostgreSQL
    op.execute("ALTER TYPE documenttype ADD VALUE IF NOT EXISTS 'MEDICAL_HISTORY' AFTER 'LAB_REPORT'")


def downgrade() -> None:
    # PostgreSQL does not natively support removing an enum value without recreating the type
    pass
