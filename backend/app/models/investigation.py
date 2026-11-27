"""
SQLAlchemy Database Models for Forensics, Behavioral Events, Correlations, and Reports
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(128), nullable=False)
    mime_type = Column(String(128), nullable=True)

    status = Column(String(32), default="QUEUED", index=True)  # QUEUED, PROCESSING, COMPLETED, FAILED
    risk_score = Column(Float, default=0.0)  # 0 to 100
    risk_level = Column(String(16), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    coverage_score = Column(Float, default=0.0)  # 0.0 to 1.0

    is_synthetic = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    evidence_items = relationship("EvidenceItem", back_populates="investigation", cascade="all, delete-orphan")
    behavioral_events = relationship("BehavioralEvent", back_populates="investigation", cascade="all, delete-orphan")
    correlations = relationship("EventCorrelation", back_populates="investigation", cascade="all, delete-orphan")
    attack_graph = relationship("AttackGraph", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    report = relationship("ForensicReport", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    defensive_actions = relationship("DefensiveAction", back_populates="investigation", cascade="all, delete-orphan")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # METADATA, ENTROPY, STRINGS, NETWORK, EMBEDDED, STRUCTURE, YARA, ML_FEATURE, BEHAVIORAL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(16), default="INFO")  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    observed_value = Column(Text, nullable=False)
    extraction_source = Column(String(128), nullable=False)
    offset_or_location = Column(String(128), nullable=True)
    explanation = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0)
    limitations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    investigation = relationship("Investigation", back_populates="evidence_items")


class BehavioralEvent(Base):
    __tablename__ = "behavioral_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)  # PROCESS_CREATE, FILE_WRITE, FILE_DELETE, NETWORK_CONNECT, DNS_QUERY, REGISTRY_SET
    timestamp = Column(DateTime(timezone=True), nullable=False)
    process_id = Column(Integer, nullable=True)
    process_name = Column(String(255), nullable=True)
    parent_process_id = Column(Integer, nullable=True)
    parent_process_name = Column(String(255), nullable=True)
    command_line = Column(Text, nullable=True)
    target_path = Column(String(512), nullable=True)
    destination_ip = Column(String(64), nullable=True)
    destination_port = Column(Integer, nullable=True)
    domain = Column(String(255), nullable=True)
    is_simulated = Column(Boolean, default=False)
    event_source = Column(String(128), default="EXTERNAL_TELEMETRY_API")
    raw_payload = Column(Text, nullable=True)  # JSON representation

    investigation = relationship("Investigation", back_populates="behavioral_events")


class EventCorrelation(Base):
    __tablename__ = "event_correlations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String(64), nullable=False)  # SPAWNED, DROPPED_FILE, CONNECTED_OUTBOUND, CORRELATED_HASH, INFERRED_PIVOT
    source_entity = Column(String(255), nullable=False)
    target_entity = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.8)
    supporting_evidence_ids = Column(Text, nullable=True)  # JSON list of strings
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)

    investigation = relationship("Investigation", back_populates="correlations")


class AttackGraph(Base):
    __tablename__ = "attack_graphs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, unique=True)
    nodes_json = Column(Text, nullable=False)  # JSON list of node dicts
    edges_json = Column(Text, nullable=False)  # JSON list of edge dicts
    summary = Column(Text, nullable=False)
    missing_evidence_notes = Column(Text, nullable=True)
    timeline_json = Column(Text, nullable=True)  # JSON list of timeline event dicts
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    investigation = relationship("Investigation", back_populates="attack_graph")


class ForensicReport(Base):
    __tablename__ = "forensic_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, unique=True)
    executive_summary = Column(Text, nullable=False)
    pdf_path = Column(String(512), nullable=True)
    json_data = Column(Text, nullable=False)  # Comprehensive structured export
    defensive_actions = Column(Text, nullable=False)  # JSON list of action steps
    limitations_disclaimer = Column(Text, nullable=False)
    generated_by = Column(String(64), default="DETERMINISTIC_EXPERT_SYSTEM")  # or OLLAMA_LOCAL_LLM
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    investigation = relationship("Investigation", back_populates="report")


class DefensiveAction(Base):
    __tablename__ = "defensive_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # NETWORK_CONTAINMENT, PROCESS_TERMINATION, SIGNATURE_DEPLOYMENT, HOST_ISOLATION, PERSISTENCE_REMEDIATION
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    target = Column(String(255), nullable=False)
    rule_syntax = Column(Text, nullable=False)
    status = Column(String(32), default="PROPOSED")  # PROPOSED, SIMULATING, ENFORCED, VERIFIED_BLOCKED, FAILED
    risk_reduction = Column(Float, default=15.0)
    simulated_output = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    executed_at = Column(DateTime(timezone=True), nullable=True)

    investigation = relationship("Investigation", back_populates="defensive_actions")
