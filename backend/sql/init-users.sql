INSERT IGNORE INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
    'admin@vkdrive.local',
    '$2a$12$b28xwKoN0xV.cakuej5jJus64S5ZoAY8a3U8Tu5FjHRjj5PVFEBUe',
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
    '$2a$12$AuckOEbpd2RCXYGJ.Mf5huDOng0uVeJnFe229fpzYb1SOLlUgSxr2',
    'Test',
    'User',
    'user',
    TRUE,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test.user@vkdrive.local' LIMIT 1);
