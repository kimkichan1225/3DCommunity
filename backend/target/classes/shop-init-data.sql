-- 상점 시스템 초기 데이터

-- 아이템 카테고리
INSERT INTO item_categories (name, description, display_order, is_active, created_at, updated_at)
VALUES
('헤어', '다양한 헤어스타일', 1, true, NOW(), NOW()),
('의상', '캐릭터 의상', 2, true, NOW(), NOW()),
('악세서리', '장신구 및 악세서리', 3, true, NOW(), NOW()),
('이펙트', '특수 효과', 4, true, NOW(), NOW());

-- 샘플 아이템 (카테고리 ID는 실제 생성된 ID에 맞게 조정 필요)
-- INSERT INTO shop_items (name, description, category_id, price, image_url, model_url, item_type, is_active, created_at, updated_at)
-- VALUES
-- ('기본 헤어', '기본 헤어스타일', 1, 0, '/images/hair/basic.png', '/models/hair/basic.glb', 'HAIR', true, NOW(), NOW()),
-- ('캐주얼 티셔츠', '편안한 캐주얼 티셔츠', 2, 100, '/images/clothing/tshirt.png', '/models/clothing/tshirt.glb', 'CLOTHING', true, NOW(), NOW()),
-- ('선글라스', '멋진 선글라스', 3, 200, '/images/accessories/sunglasses.png', '/models/accessories/sunglasses.glb', 'ACCESSORY', true, NOW(), NOW());
