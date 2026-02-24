-- =========================================================
-- Pupoo Database Seed Data
-- =========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. users (회원 데이터)
-- ---------------------------------------------------------
INSERT INTO users (user_id, email, password, nickname, phone, status, role_name, show_age, show_gender, show_pet, email_verified, phone_verified, created_at) VALUES
(1, 'admin@pupoo.com', '$2a$10$abcdefghijklmnopqrstuv', '최고관리자', '010-0000-0000', 'ACTIVE', 'ADMIN', 0, 0, 0, 1, 1, NOW()),
(2, 'kw.nam92@example.com', '$2a$10$abcdefghijklmnopqrstuv', '남광우', '010-1234-5678', 'ACTIVE', 'USER', 1, 1, 1, 1, 1, NOW()),
(3, 'chocobori@example.com', '$2a$10$abcdefghijklmnopqrstuv', '초코보리맘', '010-2222-3333', 'ACTIVE', 'USER', 0, 1, 1, 1, 1, NOW()),
(4, 'dangdang@example.com', '$2a$10$abcdefghijklmnopqrstuv', '댕댕이파파', '010-4444-5555', 'ACTIVE', 'USER', 1, 0, 1, 1, 1, NOW()),
(5, 'suspended@example.com', '$2a$10$abcdefghijklmnopqrstuv', '불량유저', '010-9999-9999', 'SUSPENDED', 'USER', 0, 0, 0, 0, 0, NOW());

-- ---------------------------------------------------------
-- 3. pet (반려동물 데이터)
-- ---------------------------------------------------------
INSERT INTO pet (pet_id, user_id, pet_name, pet_breed, pet_age, pet_weight) VALUES
(1, 2, '마루', 'DOG', 4, 'M'),
(2, 3, '초코', 'DOG', 2, 'S'),
(3, 3, '보리', 'DOG', 3, 'M'),
(4, 4, '치즈', 'CAT', 5, 'S');

-- ---------------------------------------------------------
-- 4. event (행사 데이터)
-- ---------------------------------------------------------
INSERT INTO event (event_id, event_name, description, start_at, end_at, location, status, round_no) VALUES
(1, '2026 서울 펫페어 코엑스', '국내 최대 규모의 반려동물 산업 박람회입니다. 다양한 사료, 간식, 용품을 만나보세요.', '2026-03-15 10:00:00', '2026-03-17 18:00:00', '서울 코엑스 A, B홀', 'PLANNED', 1),
(2, '댕댕이 런 2026 (봄 시즌)', '반려견과 함께 달리는 이색 마라톤! 한강 공원에서 열립니다.', '2026-04-10 09:00:00', '2026-04-10 14:00:00', '서울 반포한강공원', 'PLANNED', 2),
(3, '제1회 퍼푸 어질리티 챔피언십', '전국 최고의 날쌘돌이를 가리는 어질리티 대회입니다.', '2026-02-20 10:00:00', '2026-02-21 17:00:00', '일산 킨텍스 야외전시장', 'ENDED', 1);

-- ---------------------------------------------------------
-- 5. event_apply (행사 참여 신청 내역)
-- ---------------------------------------------------------
INSERT INTO event_apply (apply_id, user_id, event_id, status) VALUES
(1, 2, 1, 'APPROVED'),
(2, 3, 1, 'APPROVED'),
(3, 4, 1, 'APPLIED'),
(4, 2, 2, 'APPLIED'),
(5, 3, 3, 'APPROVED');

-- ---------------------------------------------------------
-- 6. booths (행사장 부스 데이터)
-- ---------------------------------------------------------
INSERT INTO booths (booth_id, event_id, place_name, type, description, company, zone, status) VALUES
(1, 1, 'A-01', 'BOOTH_COMPANY', '프리미엄 유기농 사료 전시 및 샘플 증정', '퍼푸푸드', 'ZONE_A', 'OPEN'),
(2, 1, 'A-02', 'BOOTH_SALE', '봄맞이 강아지 의류 최대 50% 할인', '댕댕스타일', 'ZONE_A', 'OPEN'),
(3, 1, 'B-01', 'BOOTH_EXPERIENCE', '반려견 행동교정 무료 상담소', '개과천선 훈련소', 'ZONE_B', 'OPEN'),
(4, 1, 'C-01', 'STAGE', '메인 이벤트 스테이지', '퍼푸 운영본부', 'ZONE_C', 'OPEN'),
(5, 2, '야외-01', 'BOOTH_FOOD', '보호자를 위한 푸드트럭 및 반려견 전용 멍푸치노', '멍다방', 'OTHER', 'OPEN');

-- ---------------------------------------------------------
-- 7. event_program (행사 내 세부 프로그램)
-- ---------------------------------------------------------
INSERT INTO event_program (program_id, event_id, category, program_title, description, start_at, end_at, booth_id) VALUES
(1, 1, 'SESSION', '우리 아이 건강한 식습관 만들기 세미나', '수의사가 직접 알려주는 연령별 맞춤 영양 관리법', '2026-03-15 14:00:00', '2026-03-15 15:30:00', 4),
(2, 1, 'CONTEST', '댕댕이 장기자랑 대회', '앉아, 엎드려, 코! 가장 똑똑한 강아지를 찾습니다.', '2026-03-16 13:00:00', '2026-03-16 15:00:00', 4),
(3, 1, 'EXPERIENCE', '터그놀이 올바르게 하는 법', '전문 훈련사와 함께하는 1:1 터그놀이 체험', '2026-03-17 11:00:00', '2026-03-17 12:00:00', 3),
(4, 2, 'EXPERIENCE', '미니 어질리티 체험존', '마라톤 시작 전 가볍게 몸을 푸는 미니 장애물 코스', '2026-04-10 09:30:00', '2026-04-10 11:00:00', NULL);

-- ---------------------------------------------------------
-- 8. event_program_apply (프로그램 참가 신청)
-- ---------------------------------------------------------
INSERT INTO event_program_apply (program_apply_id, program_id, user_id, status, ticket_no, eta_min) VALUES
(1, 1, 2, 'APPROVED', 'T-2026-001', 10),
(2, 2, 3, 'WAITING', 'T-2026-002', 0),
(3, 3, 2, 'APPLIED', 'T-2026-003', 5),
(4, 1, 4, 'CHECKED_IN', 'T-2026-004', 0);

-- ---------------------------------------------------------
-- 21. boards (게시판 카테고리)
-- ---------------------------------------------------------
INSERT INTO boards (board_id, board_name, board_type, is_active) VALUES
(1, '자유게시판', 'FREE', 1),
(2, '행사 꿀팁/정보', 'INFO', 1),
(3, '방문 후기', 'REVIEW', 1),
(4, '질문과 답변', 'QNA', 1);

-- ---------------------------------------------------------
-- 22. posts (게시글)
-- ---------------------------------------------------------
INSERT INTO posts (post_id, board_id, user_id, post_title, content, file_attached, status, view_count) VALUES
(1, 1, 2, '우리 마루 오늘 펫페어 가려고 옷 샀어요!', '너무 귀엽지 않나요? 빨리 행사날이 왔으면 좋겠네요.', 'N', 'PUBLISHED', 42),
(2, 2, 1, '2026 서울 펫페어 주차 꿀팁 안내', '코엑스 주차장이 혼잡할 수 있으니 인근 공영주차장 이용을 권장합니다.', 'N', 'PUBLISHED', 156),
(3, 3, 3, '어질리티 챔피언십 관람 후기', '정말 멋진 강아지들이 많더라고요. 내년에는 우리 보리도 출전시켜보고 싶어요.', 'N', 'PUBLISHED', 89);

-- ---------------------------------------------------------
-- 23. post_comments (게시글 댓글)
-- ---------------------------------------------------------
INSERT INTO post_comments (comment_id, post_id, user_id, content) VALUES
(1, 1, 3, '우와 마루 옷 어디서 사셨어요? 너무 찰떡이네요!'),
(2, 1, 2, '댕댕스타일에서 이번에 신상으로 나온거 샀어요 ㅎㅎ'),
(3, 2, 4, '좋은 정보 감사합니다! 대중교통 이용해야겠네요.');

-- ---------------------------------------------------------
-- 31. payments (결제 내역 - 티켓 구매 등)
-- ---------------------------------------------------------
INSERT INTO payments (payment_id, user_id, event_id, order_no, amount, payment_method, status) VALUES
(1, 2, 1, 'ORD-20260224-001', 15000.00, 'KAKAOPAY', 'APPROVED'),
(2, 3, 1, 'ORD-20260224-002', 15000.00, 'CARD', 'APPROVED'),
(3, 4, 2, 'ORD-20260224-003', 35000.00, 'BANK', 'REQUESTED');

-- ---------------------------------------------------------
-- 34. qr_codes (행사 입장용 QR) & 35. qr_logs (QR 체크인 로그)
-- ---------------------------------------------------------
INSERT INTO qr_codes (qr_id, user_id, event_id, original_url, mime_type, issued_at, expired_at) VALUES
(1, 2, 1, 'https://pupoo.com/qr/user/2/event/1', 'png', NOW(), '2026-03-18 00:00:00'),
(2, 3, 1, 'https://pupoo.com/qr/user/3/event/1', 'png', NOW(), '2026-03-18 00:00:00');

INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type, checked_at) VALUES
(1, 1, 4, 'CHECKIN', '2026-03-15 10:05:22'),
(2, 1, 1, 'CHECKIN', '2026-03-15 10:30:00');

SET FOREIGN_KEY_CHECKS = 1;