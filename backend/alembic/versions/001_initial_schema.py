"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'patients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('abha_id', sa.String(50), nullable=True),
        sa.Column('aadhaar_hash', sa.String(128), nullable=True),
        sa.Column('phone_hash', sa.String(128), nullable=True),
        sa.Column('name', sa.String(200), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(20), nullable=True),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('consent_given', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('consent_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('abha_id'),
        sa.UniqueConstraint('aadhaar_hash'),
        sa.UniqueConstraint('phone_hash'),
    )
    op.create_index('ix_patients_abha_id', 'patients', ['abha_id'])
    op.create_index('ix_patients_phone_hash', 'patients', ['phone_hash'])

    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EMERGENCY_FLAGGED', name='sessionstatus'), nullable=False, server_default='INITIATED'),
        sa.Column('chief_complaint', sa.String(500), nullable=True),
        sa.Column('current_question_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('red_flag_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_emergency', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sessions_patient_id', 'sessions', ['patient_id'])
    op.create_index('ix_sessions_status', 'sessions', ['status'])

    op.create_table(
        'clinical_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', sa.String(50), nullable=False),
        sa.Column('question_key', sa.String(50), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('answer_value', postgresql.JSONB(), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('is_red_flag', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('question_index', sa.Integer(), nullable=False),
        sa.Column('input_method', sa.String(20), nullable=False, server_default='touch'),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_clinical_responses_session_question', 'clinical_responses', ['session_id', 'question_id'])

    op.create_table(
        'clinical_summaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('structured_history', postgresql.JSONB(), nullable=False),
        sa.Column('socarates_extracted', postgresql.JSONB(), nullable=True),
        sa.Column('red_flags_summary', postgresql.JSONB(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('fhir_bundle_json', postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id'),
    )

    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.Enum('PRESCRIPTION', 'LAB_REPORT', 'ECG', 'DISCHARGE_SUMMARY', 'IMAGING_REPORT', 'VACCINATION_RECORD', 'OTHER', name='documenttype'), nullable=False, server_default='OTHER'),
        sa.Column('status', sa.Enum('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED', name='documentstatus'), nullable=False, server_default='UPLOADED'),
        sa.Column('storage_path', sa.String(1000), nullable=False),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('extracted_entities', postgresql.JSONB(), nullable=True),
        sa.Column('confidence_score', sa.Integer(), nullable=True),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_documents_patient_status', 'documents', ['patient_id', 'status'])
    op.create_index('ix_documents_session_id', 'documents', ['session_id'])

    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(100), nullable=True),
        sa.Column('changes', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('documents')
    op.drop_table('clinical_summaries')
    op.drop_table('clinical_responses')
    op.drop_table('sessions')
    op.drop_table('patients')
    
    op.execute('DROP TYPE IF EXISTS sessionstatus')
    op.execute('DROP TYPE IF EXISTS documentstatus')
    op.execute('DROP TYPE IF EXISTS documenttype')