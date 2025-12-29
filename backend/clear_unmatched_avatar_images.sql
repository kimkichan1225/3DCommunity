-- PNG 파일과 매칭되지 않은 아이템들의 image_url을 NULL로 설정
-- 매칭된 29개 아이템만 image_url을 유지

UPDATE shop_items
SET image_url = NULL
WHERE name NOT IN (
    'Base Character',
    'Blue Soldier Female',
    'Casual Bald',
    'Casual Male',
    'Casual2 Female',
    'Casual3 Female',
    'Chef Hat',
    'Cow',
    'Cowboy Female',
    'Doctor Female (Young)',
    'Elf',
    'Goblin Female',
    'Goblin Male',
    'Kimono Female',
    'Knight Golden Male',
    'Knight Male',
    'Ninja Male',
    'Ninja Sand',
    'Old Classy Male',
    'Pirate Male',
    'Pug',
    'Soldier Male',
    'Suit Male',
    'Viking Male',
    'Viking Helmet',
    'Wizard',
    'Worker Female',
    'Zombie Female',
    'Zombie Male'
);
