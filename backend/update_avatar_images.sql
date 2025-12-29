-- Update image_url for avatars with matching PNG files in AvaterItemIllust folder
-- 데이터베이스의 name은 공백으로 구분됨 (예: 'Casual Male', 'Blue Soldier Female')

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/BaseCharacter.png'
WHERE name = 'Base Character';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/BlueSoldier_Female.png'
WHERE name = 'Blue Soldier Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Casual_Bald.png'
WHERE name = 'Casual Bald';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Casual_Male.png'
WHERE name = 'Casual Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Casual2_Female.png'
WHERE name = 'Casual2 Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Casual3_Female.png'
WHERE name = 'Casual3 Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Chef_Hat.png'
WHERE name = 'Chef Hat';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Cow.png'
WHERE name = 'Cow';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Cowboy_Female.png'
WHERE name = 'Cowboy Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Doctor_Female_Young.png'
WHERE name = 'Doctor Female (Young)';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Elf.png'
WHERE name = 'Elf';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Goblin_Female.png'
WHERE name = 'Goblin Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Goblin_Male.png'
WHERE name = 'Goblin Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Kimono_Female.png'
WHERE name = 'Kimono Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Knight_Golden_Male.png'
WHERE name = 'Knight Golden Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Knight_Male.png'
WHERE name = 'Knight Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Ninja_Male.png'
WHERE name = 'Ninja Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Ninja_Sand.png'
WHERE name = 'Ninja Sand';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/OldClassy_Male.png'
WHERE name = 'Old Classy Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Pirate_Male.png'
WHERE name = 'Pirate Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Pug.png'
WHERE name = 'Pug';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Soldier_Male.png'
WHERE name = 'Soldier Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Suit_Male.png'
WHERE name = 'Suit Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Viking_Male.png'
WHERE name = 'Viking Male';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/VikingHelmet.png'
WHERE name = 'Viking Helmet';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Wizard.png'
WHERE name = 'Wizard';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Worker_Female.png'
WHERE name = 'Worker Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Zombie_Female.png'
WHERE name = 'Zombie Female';

UPDATE shop_items
SET image_url = '/resources/AvaterItemIllust/Zombie_Male.png'
WHERE name = 'Zombie Male';
