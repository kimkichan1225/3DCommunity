-- ================================================
-- 3D Community Database Schema - Phase 1 (MVP)
-- Version: 1.0
-- Date: 2025-11-16
-- ================================================

-- ================================================
-- 1. 사용자 관리 테이블
-- ================================================

-- users 테이블은 이미 JPA로 생성되므로 생략
-- (User 엔티티가 자동으로 생성함)

-- 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_image_url TEXT,
    status_message VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 세션 테이블 (현재 접속 공간 정보)
CREATE TABLE IF NOT EXISTS user_sessions (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_space_type VARCHAR(20) NOT NULL CHECK (current_space_type IN ('PLAZA', 'LOCAL_ROOM')),
    current_room_id BIGINT,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_space ON user_sessions(current_space_type, current_room_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(last_active_at);

-- ================================================
-- 2. 소셜 기능 테이블
-- ================================================

-- 친구 관계 테이블
CREATE TABLE IF NOT EXISTS friendships (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('PLAZA', 'LOCAL_ROOM', 'DM')),
    room_id BIGINT,
    receiver_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emoticon TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,

    CHECK (
        (message_type = 'DM' AND receiver_id IS NOT NULL AND room_id IS NULL) OR
        (message_type = 'LOCAL_ROOM' AND room_id IS NOT NULL AND receiver_id IS NULL) OR
        (message_type = 'PLAZA' AND room_id IS NULL AND receiver_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_messages_type_room ON messages(message_type, room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_dm ON messages(sender_id, receiver_id, created_at DESC) WHERE message_type = 'DM';
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 차단/뮤트 테이블
CREATE TABLE IF NOT EXISTS user_blocks (
    id BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_type VARCHAR(20) NOT NULL CHECK (block_type IN ('BLOCK', 'MUTE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(blocker_id, blocked_id, block_type),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id, block_type);

-- ================================================
-- 3. Trigger 함수 정의
-- ================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. 초기 데이터 (선택사항)
-- ================================================

-- 테스트용 관리자 계정 생성은 별도의 시드 스크립트에서 수행
