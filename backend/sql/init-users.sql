INSERT IGNORE INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
    'admin@vkdrive.local',
    '$2a$12$T/Nto9IzdLrg./VBKGH8e.eO.XPHh5F9SR2VNtjnag9BZ0.3p0Pzi',
    'System',
    'Administrator',
    'admin',
    TRUE,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@vkdrive.local' LIMIT 1);

INSERT IGNORE INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
    'test.user@vkdrive.local',
    '$2a$12$5QsSYwP8Qvg14n.LCrYnxOJJLUc7RVc7Dow6ozuzxrYEOl0Oct0KG',
    'Test',
    'User',
    'user',
    TRUE,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test.user@vkdrive.local' LIMIT 1);
