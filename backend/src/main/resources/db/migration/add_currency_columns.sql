-- 재화 컬럼 추가 마이그레이션
-- Silver Coin과 Gold Coin 컬럼을 users 테이블에 추가

-- Silver Coin 컬럼 추가 (기본값: 1000)
ALTER TABLE users ADD COLUMN IF NOT EXISTS silver_coins INTEGER NOT NULL DEFAULT 1000;

-- Gold Coin 컬럼 추가 (기본값: 0)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gold_coins INTEGER NOT NULL DEFAULT 0;

-- 기존 유저들에게 기본 재화 지급 (이미 컬럼이 있으면 무시)
UPDATE users SET silver_coins = 1000 WHERE silver_coins IS NULL;
UPDATE users SET gold_coins = 0 WHERE gold_coins IS NULL;
