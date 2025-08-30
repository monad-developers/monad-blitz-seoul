# models.py — SQLAlchemy 2.0 ORM for MySQL (PyMySQL)
# 실행: python models.py  (테이블/뷰 생성)
from __future__ import annotations
import os
from enum import Enum
from contextlib import contextmanager
from typing import Optional, List

from sqlalchemy import (
    create_engine, text, ForeignKey, UniqueConstraint, Index,
    CheckConstraint, Enum as SAEnum, Computed, JSON
)
from sqlalchemy.orm import (
    DeclarativeBase, mapped_column, Mapped, relationship, sessionmaker
)
from sqlalchemy.dialects.mysql import (
    BIGINT, VARCHAR, CHAR, DATETIME, TIMESTAMP, INTEGER, DECIMAL, TEXT
)

# -------------------------
# DB 설정
# -------------------------
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "your_password")
MYSQL_DB = os.getenv("MYSQL_DB", "raffle")

# mysql+pymysql://user:pass@host:port/dbname?charset=utf8mb4
DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    "?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    isolation_level="AUTOCOMMIT",  # 뷰 생성 DDL 등에 편리
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

@contextmanager
def session_scope():
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()

# -------------------------
# Base
# -------------------------
class Base(DeclarativeBase):
    pass

# -------------------------
# Enums
# -------------------------
class EventStatus(Enum):
    draft = "draft"
    open = "open"
    closed = "closed"
    drawing = "drawing"
    drawn = "drawn"
    cancelled = "cancelled"

class SignatureType(Enum):
    personal_sign = "personal_sign"
    eth_signTypedData_v4 = "eth_signTypedData_v4"
    custom = "custom"

class VRFStatus(Enum):
    requested = "requested"
    fulfilled = "fulfilled"
    failed = "failed"

class TxType(Enum):
    request_randomness = "request_randomness"
    fulfill_randomness = "fulfill_randomness"
    record_entry = "record_entry"
    distribute_prize = "distribute_prize"
    other = "other"

class TxStatus(Enum):
    pending = "pending"
    success = "success"
    failed = "failed"

class EntryStatus(Enum):
    pending = "pending"
    valid = "valid"
    invalid = "invalid"
    duplicate = "duplicate"
    blocked = "blocked"

class ClaimStatus(Enum):
    pending = "pending"
    claimed = "claimed"
    expired = "expired"
    revoked = "revoked"

# -------------------------
# Models
# -------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BIGINT(unsigned=False), primary_key=True, autoincrement=True)
    email: Mapped[Optional[str]] = mapped_column(VARCHAR(255), unique=True)
    email_verified: Mapped[int] = mapped_column(INTEGER, default=0)
    password_hash: Mapped[Optional[str]] = mapped_column(VARCHAR(255))
    nickname: Mapped[Optional[str]] = mapped_column(VARCHAR(50))
    wallet_address: Mapped[Optional[str]] = mapped_column(CHAR(42), unique=True)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"),
                                            onupdate=text("CURRENT_TIMESTAMP"))
    last_login_at: Mapped[Optional[str]] = mapped_column(DATETIME)

    events: Mapped[List["Event"]] = relationship(back_populates="owner")

    __table_args__ = (
        CheckConstraint("(email IS NOT NULL OR wallet_address IS NOT NULL)", name="chk_users_contact"),
        CheckConstraint("(wallet_address IS NULL OR CHAR_LENGTH(wallet_address)=42)", name="chk_users_wallet_len"),
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(120), nullable=False)
    start_at: Mapped[str] = mapped_column(DATETIME, nullable=False)
    end_at: Mapped[str] = mapped_column(DATETIME, nullable=False)
    participant_cap: Mapped[Optional[int]] = mapped_column(INTEGER)
    upload_csv_path: Mapped[Optional[str]] = mapped_column(VARCHAR(1024))
    status: Mapped[EventStatus] = mapped_column(SAEnum(EventStatus), default=EventStatus.draft, nullable=False)

    network: Mapped[Optional[str]] = mapped_column(VARCHAR(50), default="monad-testnet")
    consumer_contract_address: Mapped[Optional[str]] = mapped_column(CHAR(42))
    operator_address: Mapped[Optional[str]] = mapped_column(CHAR(42))
    gelato_task_id: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    gas_tank_id: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    randomness_request_id: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    randomness_value: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    randomness_requested_at: Mapped[Optional[str]] = mapped_column(DATETIME)
    randomness_fulfilled_at: Mapped[Optional[str]] = mapped_column(DATETIME)

    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"),
                                            onupdate=text("CURRENT_TIMESTAMP"))

    owner: Mapped["User"] = relationship(back_populates="events")
    prizes: Mapped[List["Prize"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    form_config: Mapped[Optional["EventFormConfig"]] = relationship(back_populates="event", uselist=False, cascade="all, delete-orphan")
    entries: Mapped[List["Entry"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    vrf_requests: Mapped[List["VRFRequest"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    winners: Mapped[List["Winner"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    tx_logs: Mapped[List["TxLog"]] = relationship(back_populates="event")

    __table_args__ = (
        CheckConstraint("end_at > start_at", name="chk_events_time"),
        CheckConstraint("""
            (consumer_contract_address IS NULL OR CHAR_LENGTH(consumer_contract_address)=42)
            AND (operator_address IS NULL OR CHAR_LENGTH(operator_address)=42)
        """, name="chk_events_addr_len"),
        Index("idx_events_owner", "owner_id"),
        Index("idx_events_time", "start_at", "end_at"),
    )


class EventFormConfig(Base):
    __tablename__ = "event_form_config"

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    require_nickname: Mapped[int] = mapped_column(INTEGER, default=1, nullable=False)
    require_email: Mapped[int] = mapped_column(INTEGER, default=0, nullable=False)
    require_wallet_address: Mapped[int] = mapped_column(INTEGER, default=1, nullable=False)
    unique_email_per_event: Mapped[int] = mapped_column(INTEGER, default=1, nullable=False)
    unique_wallet_per_event: Mapped[int] = mapped_column(INTEGER, default=1, nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    event: Mapped["Event"] = relationship(back_populates="form_config")


class Prize(Base):
    __tablename__ = "prizes"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(TEXT)  # TEXT
    image_path: Mapped[Optional[str]] = mapped_column(VARCHAR(1024))
    winners_count: Mapped[int] = mapped_column(INTEGER, nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    event: Mapped["Event"] = relationship(back_populates="prizes")
    winners: Mapped[List["Winner"]] = relationship(back_populates="prize")

    __table_args__ = (
        CheckConstraint("winners_count >= 1", name="chk_prizes_cnt"),
        Index("idx_prizes_event", "event_id"),
    )


class Signature(Base):
    __tablename__ = "signatures"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[Optional[int]] = mapped_column(ForeignKey("events.id", ondelete="SET NULL"))
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    wallet_address: Mapped[str] = mapped_column(CHAR(42), nullable=False)
    message: Mapped[str] = mapped_column(TEXT, nullable=False)  # TEXT
    signature: Mapped[str] = mapped_column(VARCHAR(500), nullable=False)
    signature_type: Mapped[SignatureType] = mapped_column(SAEnum(SignatureType), default=SignatureType.personal_sign, nullable=False)
    chain_id: Mapped[Optional[int]] = mapped_column(BIGINT)
    signed_at: Mapped[str] = mapped_column(DATETIME, server_default=text("CURRENT_TIMESTAMP"))
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint("CHAR_LENGTH(wallet_address)=42", name="chk_sigs_wallet_len"),
        UniqueConstraint("wallet_address", "signature", name="uq_sig_dedup"),
        Index("idx_sigs_event", "event_id"),
        Index("idx_sigs_user", "user_id"),
    )


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    nickname: Mapped[Optional[str]] = mapped_column(VARCHAR(50))
    email: Mapped[Optional[str]] = mapped_column(VARCHAR(255))
    # VIRTUAL generated column: UNHEX(SHA2(LOWER(COALESCE(email,'')),256))
    email_hash: Mapped[Optional[bytes]] = mapped_column(
        Computed("UNHEX(SHA2(LOWER(COALESCE(email,'')),256))", persisted=False)
    )
    wallet_address: Mapped[Optional[str]] = mapped_column(CHAR(42))
    signature_id: Mapped[Optional[int]] = mapped_column(ForeignKey("signatures.id", ondelete="SET NULL"))
    status: Mapped[EntryStatus] = mapped_column(SAEnum(EntryStatus), default=EntryStatus.pending, nullable=False)
    entry_metadata: Mapped[Optional[dict]] = mapped_column('entry_metadata', JSON)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    event: Mapped["Event"] = relationship(back_populates="entries")
    signature: Mapped[Optional["Signature"]] = relationship()
    user: Mapped[Optional["User"]] = relationship()

    __table_args__ = (
        CheckConstraint("(wallet_address IS NULL OR CHAR_LENGTH(wallet_address)=42)", name="chk_entries_wallet_len"),
        UniqueConstraint("event_id", "email", name="uq_entries_event_email"),
        UniqueConstraint("event_id", "wallet_address", name="uq_entries_event_wallet"),
        Index("idx_entries_event_created", "event_id", "created_at"),
        Index("idx_entries_email_hash", "event_id", "email_hash"),
    )


class VRFRequest(Base):
    __tablename__ = "vrf_requests"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(SAEnum("gelato", "chainlink", "other", name="provider_enum"), default="gelato", nullable=False)
    network: Mapped[Optional[str]] = mapped_column(VARCHAR(50), default="monad-testnet")
    request_tx_hash: Mapped[Optional[str]] = mapped_column(CHAR(66), unique=True)
    fulfill_tx_hash: Mapped[Optional[str]] = mapped_column(CHAR(66))
    request_id: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    random_value: Mapped[Optional[str]] = mapped_column(VARCHAR(128))
    status: Mapped[VRFStatus] = mapped_column(SAEnum(VRFStatus), default=VRFStatus.requested, nullable=False)
    requested_at: Mapped[str] = mapped_column(DATETIME, server_default=text("CURRENT_TIMESTAMP"))
    fulfilled_at: Mapped[Optional[str]] = mapped_column(DATETIME)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    event: Mapped["Event"] = relationship(back_populates="vrf_requests")

    __table_args__ = (
        CheckConstraint("""
            (request_tx_hash IS NULL OR CHAR_LENGTH(request_tx_hash)=66) AND
            (fulfill_tx_hash IS NULL OR CHAR_LENGTH(fulfill_tx_hash)=66)
        """, name="chk_vrf_tx_len"),
        Index("idx_vrf_event_status", "event_id", "status"),
    )


class TxLog(Base):
    __tablename__ = "tx_logs"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[Optional[int]] = mapped_column(ForeignKey("events.id", ondelete="SET NULL"))
    prize_id: Mapped[Optional[int]] = mapped_column(ForeignKey("prizes.id", ondelete="SET NULL"))
    entry_id: Mapped[Optional[int]] = mapped_column(ForeignKey("entries.id", ondelete="SET NULL"))
    tx_hash: Mapped[str] = mapped_column(CHAR(66), unique=True, nullable=False)
    chain_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    tx_type: Mapped[TxType] = mapped_column(SAEnum(TxType), nullable=False)
    status: Mapped[TxStatus] = mapped_column(SAEnum(TxStatus), nullable=False)
    from_address: Mapped[Optional[str]] = mapped_column(CHAR(42))
    to_address: Mapped[Optional[str]] = mapped_column(CHAR(42))
    block_number: Mapped[Optional[int]] = mapped_column(BIGINT)
    block_timestamp: Mapped[Optional[str]] = mapped_column(DATETIME)
    gas_used: Mapped[Optional[int]] = mapped_column(BIGINT)
    gas_price_wei: Mapped[Optional[int]] = mapped_column(DECIMAL(65, 0))
    fee_wei: Mapped[Optional[int]] = mapped_column(DECIMAL(65, 0))
    error_message: Mapped[Optional[str]] = mapped_column(TEXT)
    tx_metadata: Mapped[Optional[dict]] = mapped_column('tx_metadata', JSON)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    event: Mapped[Optional["Event"]] = relationship(back_populates="tx_logs")
    prize: Mapped[Optional["Prize"]] = relationship()
    entry: Mapped[Optional["Entry"]] = relationship()

    __table_args__ = (
        CheckConstraint("""
            (from_address IS NULL OR CHAR_LENGTH(from_address)=42) AND
            (to_address IS NULL OR CHAR_LENGTH(to_address)=42)
        """, name="chk_tx_addr_len"),
        Index("idx_tx_event_time", "event_id", "created_at"),
    )


class Winner(Base):
    __tablename__ = "winners"

    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    prize_id: Mapped[int] = mapped_column(ForeignKey("prizes.id", ondelete="CASCADE"), nullable=False)
    entry_id: Mapped[int] = mapped_column(ForeignKey("entries.id", ondelete="CASCADE"), nullable=False)
    assigned_at: Mapped[str] = mapped_column(DATETIME, server_default=text("CURRENT_TIMESTAMP"))
    claim_status: Mapped[ClaimStatus] = mapped_column(SAEnum(ClaimStatus), default=ClaimStatus.pending, nullable=False)
    claim_tx_hash: Mapped[Optional[str]] = mapped_column(CHAR(66))

    event: Mapped["Event"] = relationship(back_populates="winners")
    prize: Mapped["Prize"] = relationship(back_populates="winners")
    entry: Mapped["Entry"] = relationship()

    __table_args__ = (
        UniqueConstraint("prize_id", "entry_id", name="uq_unique_win"),
        Index("idx_winners_event", "event_id"),
    )

# -------------------------
# 초기화/드롭/뷰
# -------------------------
def create_database_if_needed():
    # 데이터베이스가 없으면 먼저 생성
    root_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/?charset=utf8mb4"
    root_engine = create_engine(root_url, isolation_level="AUTOCOMMIT")
    with root_engine.connect() as conn:
        conn.execute(text("SET time_zone = '+00:00'"))
        conn.execute(text("SET sql_mode = 'STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"))
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` "
                          "DEFAULT CHARACTER SET utf8mb4 "
                          "DEFAULT COLLATE utf8mb4_0900_ai_ci;"))

def create_all():
    create_database_if_needed()
    with engine.begin() as conn:
        conn.exec_driver_sql("SET time_zone = '+00:00'")
        conn.exec_driver_sql("SET sql_mode = 'STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'")
        Base.metadata.create_all(bind=conn)
        # 뷰 생성 (OR REPLACE)
        conn.exec_driver_sql("""
        CREATE OR REPLACE VIEW v_events_summary AS
        SELECT
          e.id            AS event_id,
          e.owner_id,
          e.name,
          e.status,
          e.start_at,
          e.end_at,
          COUNT(DISTINCT en.id) AS entry_count,
          COUNT(DISTINCT w.id)  AS winner_count,
          MAX(e.updated_at)     AS updated_at
        FROM events e
        LEFT JOIN entries  en ON en.event_id = e.id
        LEFT JOIN winners  w  ON w.event_id  = e.id
        GROUP BY e.id;
        """)

def drop_all():
    with engine.begin() as conn:
        # 뷰 먼저
        conn.exec_driver_sql("DROP VIEW IF EXISTS v_events_summary;")
    Base.metadata.drop_all(bind=engine)

# -------------------------
# 예시 조회/삽입 함수 (원하면 더 추가 가능)
# -------------------------
def get_events_by_owner(owner_id: int):
    with session_scope() as s:
        return s.query(Event).filter(Event.owner_id == owner_id).order_by(Event.updated_at.desc()).all()

def create_event(owner_id: int, name: str, start_at: str, end_at: str, participant_cap: int | None = None):
    with session_scope() as s:
        e = Event(owner_id=owner_id, name=name, start_at=start_at, end_at=end_at, participant_cap=participant_cap)
        s.add(e)
        s.flush()
        return e.id

# -------------------------
# 스크립트 실행
# -------------------------
if __name__ == "__main__":
    create_all()
    print("✅ SQLAlchemy 모델 테이블 및 뷰 생성 완료")
