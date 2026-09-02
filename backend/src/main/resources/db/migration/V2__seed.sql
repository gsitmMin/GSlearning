-- V2: 초기 데이터 — 조직, 관리자 계정, 데모 학습자
-- 비밀번호는 첫 로그인 후 변경 (관리자: must_change_password = true)

INSERT INTO organization (code, name, parent_id, sort_order) VALUES
  ('HQ',      'GSITM',       NULL, 0),
  ('DEV',     '개발본부',     1,    1),
  ('DEV-BE',  '백엔드팀',     2,    1),
  ('DEV-FE',  '프론트엔드팀', 2,    2),
  ('DEV-INF', '인프라팀',     2,    3),
  ('DEV-QA',  'QA팀',        2,    4);

-- 관리자 (admin1234! — 첫 로그인 시 변경 강제)
INSERT INTO employee (employee_no, name, email, organization_id, position, source)
VALUES ('00000001', '교육관리자', 'admin@gsitm.com', 2, '교육운영', 'MANUAL');

INSERT INTO user_account (employee_id, password_hash, must_change_password)
VALUES (1, '$2b$10$zIUw28AMzOTjxqYPfvrgHOPPpWplmry6JP7m9UYB69YbvYm7A7FEi', true);

INSERT INTO user_role (user_account_id, role) VALUES (1, 'ADMIN'), (1, 'LEARNER');

-- 데모 학습자 김지원 (learner1234!) — 프로토타입 시나리오와 동일 인물
INSERT INTO employee (employee_no, name, email, organization_id, position, source)
VALUES ('20240117', '김지원', 'jiwon.kim@gsitm.com', 3, 'Java Backend Developer', 'MANUAL');

INSERT INTO user_account (employee_id, password_hash, must_change_password)
VALUES (2, '$2b$10$WeDz2b2YMzmmcqF9ctqAoeg/py7pLq1U3PQVV8mXA24zkr4nhql0a', false);

INSERT INTO user_role (user_account_id, role) VALUES (2, 'LEARNER');
