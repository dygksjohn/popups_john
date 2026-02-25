-- =========================================================
-- Pupoo Database Seed Data (v1.1 - Cleaned & Patched)
-- 적용 사항: 
-- 1. MySQL 8.0 INT/TINYINT display width 경고 해결
-- 2. files 테이블 Soft Delete 및 user_id 데이터 보정
-- =========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------
INSERT INTO users (user_id, email, password, nickname, phone, status, role_name, show_age, show_gender, show_pet, email_verified, phone_verified) VALUES
(1, 'admin@pupoo.com', '$2a$10$abcdefghijklmnopqrstuv', '푸푸관리자', '010-0000-0001', 'ACTIVE', 'ADMIN', 0, 0, 0, 1, 1),
(2, 'kw.nam92@example.com', '$2a$10$abcdefghijklmnopqrstuv', '남광우', '010-1234-5678', 'ACTIVE', 'USER', 1, 1, 1, 1, 1),
(3, 'choco@example.com', '$2a$10$abcdefghijklmnopqrstuv', '초코맘', '010-1111-2222', 'ACTIVE', 'USER', 0, 1, 1, 1, 1),
(4, 'dangdang@example.com', '$2a$10$abcdefghijklmnopqrstuv', '댕댕파파', '010-3333-4444', 'ACTIVE', 'USER', 1, 0, 1, 1, 1),
(5, 'bori@example.com', '$2a$10$abcdefghijklmnopqrstuv', '보리언니', '010-5555-6666', 'ACTIVE', 'USER', 1, 1, 1, 1, 1);

-- 2. social_account
INSERT INTO social_account (social_id, user_id, provider, provider_uid) VALUES
(1, 1, 'KAKAO', 'kakao_admin_001'),
(2, 2, 'KAKAO', 'kakao_1234567890'),
(3, 3, 'NAVER', 'naver_abcdefg123'),
(4, 4, 'GOOGLE', 'google_zxcvbnm'),
(5, 5, 'APPLE', 'apple_qwertyuiop');

-- 3. pet
INSERT INTO pet (pet_id, user_id, pet_name, pet_breed, pet_age, pet_weight) VALUES
(1, 2, '마루', 'DOG', 4, 'M'),
(2, 3, '초코', 'DOG', 2, 'S'),
(3, 4, '치즈', 'CAT', 5, 'S'),
(4, 5, '보리', 'DOG', 3, 'M'),
(5, 5, '율무', 'DOG', 1, 'XS');

-- 4. event
INSERT INTO event (event_id, event_name, description, start_at, end_at, location, status, round_no) VALUES
(1, '2026 서울 펫페어 코엑스', '국내 최대 규모 반려동물 박람회', '2026-03-15 10:00:00', '2026-03-17 18:00:00', '코엑스 A홀', 'PLANNED', 1),
(2, '댕댕이 런 2026 (봄 시즌)', '반려견과 함께 달리는 이색 마라톤', '2026-04-10 09:00:00', '2026-04-10 14:00:00', '반포한강공원', 'PLANNED', 2),
(3, '제1회 푸푸 어질리티 챔피언십', '전국 최고의 날쌘돌이를 가리는 대회', '2026-02-20 10:00:00', '2026-02-21 17:00:00', '킨텍스 야외전시장', 'ENDED', 1),
(4, '푸푸 펫 아카데미 특강', '전문 훈련사와 함께하는 행동 교정', '2026-05-01 13:00:00', '2026-05-01 16:00:00', '푸푸 교육센터', 'PLANNED', 1),
(5, '여름맞이 펫캉스 페스티벌', '반려견 동반 수영장 오픈 파티', '2026-07-15 11:00:00', '2026-07-20 20:00:00', '가평 펫리조트', 'PLANNED', 1);

-- 5. event_apply
INSERT INTO event_apply (apply_id, user_id, event_id, status) VALUES
(1, 2, 1, 'APPROVED'),
(2, 3, 1, 'APPROVED'),
(3, 4, 2, 'APPLIED'),
(4, 5, 3, 'APPROVED'),
(5, 2, 4, 'APPLIED');

-- 6. booths
INSERT INTO booths (booth_id, event_id, place_name, type, description, company, zone, status) VALUES
(1, 1, 'A-01', 'BOOTH_COMPANY', '프리미엄 사료 전시', '푸푸푸드', 'ZONE_A', 'OPEN'),
(2, 1, 'A-02', 'BOOTH_SALE', '강아지 의류 할인', '댕댕어패럴', 'ZONE_A', 'OPEN'),
(3, 1, 'B-01', 'BOOTH_EXPERIENCE', '행동교정 상담소', '개과천선 훈련소', 'ZONE_B', 'OPEN'),
(4, 1, 'C-01', 'STAGE', '메인 이벤트 스테이지', '푸푸 운영본부', 'ZONE_C', 'OPEN'),
(5, 2, '야외-01', 'BOOTH_FOOD', '반려견 전용 멍푸치노', '멍다방', 'OTHER', 'OPEN');

-- 7. event_program
INSERT INTO event_program (program_id, event_id, category, program_title, description, start_at, end_at, booth_id) VALUES
(1, 1, 'SESSION', '건강한 식습관 만들기', '수의사 맞춤 영양 관리 세미나', '2026-03-15 14:00:00', '2026-03-15 15:30:00', 4),
(2, 1, 'CONTEST', '댕댕이 장기자랑 대회', '가장 똑똑한 강아지를 찾습니다.', '2026-03-16 13:00:00', '2026-03-16 15:00:00', 4),
(3, 1, 'EXPERIENCE', '터그놀이 올바르게 하는 법', '1:1 터그놀이 체험', '2026-03-17 11:00:00', '2026-03-17 12:00:00', 3),
(4, 2, 'EXPERIENCE', '미니 어질리티 체험존', '가볍게 몸을 푸는 장애물 코스', '2026-04-10 09:30:00', '2026-04-10 11:00:00', 5),
(5, 3, 'CONTEST', '어질리티 챔피언 결승전', '대망의 결승전 경기', '2026-02-21 15:00:00', '2026-02-21 17:00:00', NULL);

-- 8. event_program_apply
INSERT INTO event_program_apply (program_apply_id, program_id, user_id, status, ticket_no, eta_min, cancelled_at) VALUES
(1, 1, 2, 'APPROVED', 'T-001', 10, NULL),
(2, 2, 3, 'WAITING', 'T-002', 0, NULL),
(3, 3, 4, 'APPLIED', 'T-003', 5, NULL),
(4, 1, 5, 'CHECKED_IN', 'T-004', 0, NULL),
(5, 4, 2, 'CANCELLED', 'T-005', 0, '2026-02-24 10:00:00');

-- 9. event_history
INSERT INTO event_history (history_id, user_id, event_id, program_id, joined_at) VALUES
(1, 2, 3, 5, '2026-02-21 14:00:00'),
(2, 3, 3, 5, '2026-02-21 14:00:00'),
(3, 4, 3, 5, '2026-02-21 14:00:00'),
(4, 5, 3, 5, '2026-02-21 14:00:00'),
(5, 2, 1, 1, '2026-03-15 13:50:00');

-- 10. program_participation_stats
INSERT INTO program_participation_stats (user_id, program_id, participate_count, last_participated_at) VALUES
(2, 1, 1, '2026-03-15 14:00:00'),
(3, 1, 2, '2026-03-15 14:00:00'),
(4, 2, 1, '2026-03-16 13:00:00'),
(5, 3, 3, '2026-03-17 11:00:00'),
(2, 5, 1, '2026-02-21 15:00:00');

-- 11. contest_votes
INSERT INTO contest_votes (vote_id, program_id, program_apply_id, user_id, status, cancelled_at) VALUES
(1, 2, 2, 2, 'ACTIVE', NULL),
(2, 2, 2, 4, 'ACTIVE', NULL),
(3, 2, 2, 5, 'ACTIVE', NULL),
(4, 5, 4, 3, 'ACTIVE', NULL),
(5, 5, 4, 2, 'CANCELLED', '2026-02-21 16:00:00');

-- 12. speakers
INSERT INTO speakers (speaker_id, speaker_name, speaker_bio, speaker_email, speaker_phone) VALUES
(1, '강형욱', '반려견 행동 교정 전문가', 'kang@example.com', '010-1111-0001'),
(2, '설채현', '행동학 전문 수의사', 'seol@example.com', '010-1111-0002'),
(3, '이찬종', '이삭애견훈련소 소장', 'lee@example.com', '010-1111-0003'),
(4, '김명철', '고양이 전문 수의사', 'kim@example.com', '010-1111-0004'),
(5, '박정훈', '어질리티 국가대표', 'park@example.com', '010-1111-0005');

-- 13. program_speakers
INSERT INTO program_speakers (program_id, speaker_id) VALUES
(1, 2), (3, 1), (4, 5), (5, 5), (2, 3);

-- 14. booth_waits
INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min) VALUES
(1, 1, 15, 30), (2, 2, 5, 10), (3, 3, 20, 45), (4, 4, 0, 0), (5, 5, 8, 15);

-- 15. experience_waits
INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min) VALUES
(1, 1, 0, 0), (2, 2, 10, 20), (3, 3, 8, 25), (4, 4, 15, 30), (5, 5, 0, 0);

-- 16. congestions
INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level) VALUES
(1, 1, 'ZONE_A', '세미나실 입구', 4),
(2, 2, 'ZONE_C', '메인 스테이지 앞', 3),
(3, 3, 'ZONE_B', '훈련소 체험존', 5),
(4, 4, 'OTHER', '야외 잔디밭', 2),
(5, 5, 'OTHER', '결승전 관람석', 5);

-- 17. galleries
INSERT INTO galleries (gallery_id, event_id, gallery_title, description, view_count, thumbnail_image_id, gallery_status) VALUES
(1, 3, '2026 푸푸 어질리티 현장', '뜨거웠던 대회의 열기!', 1205, 1, 'PUBLIC'),
(2, 1, '펫페어 준비 스케치', '부스 세팅 현장입니다.', 340, 2, 'PUBLIC'),
(3, 2, '댕댕이 런 코스 안내', '미리보는 마라톤 코스', 890, 3, 'PUBLIC'),
(4, 4, '아카데미 수강생 모집', '특강 프리뷰', 150, 4, 'PUBLIC'),
(5, 5, '작년 펫캉스 하이라이트', '올해도 기대해주세요', 2200, 5, 'PUBLIC');

-- 18. gallery_images
INSERT INTO gallery_images (image_id, gallery_id, original_url, thumb_url, image_order, mime_type, file_size) VALUES
(1, 1, 'https://cdn.pupoo.com/img/gal_01.jpg', 'https://cdn.pupoo.com/img/th_01.jpg', 1, 'jpg', 2048000),
(2, 2, 'https://cdn.pupoo.com/img/gal_02.jpg', 'https://cdn.pupoo.com/img/th_02.jpg', 1, 'jpg', 3015000),
(3, 3, 'https://cdn.pupoo.com/img/gal_03.jpg', 'https://cdn.pupoo.com/img/th_03.jpg', 1, 'png', 1500000),
(4, 4, 'https://cdn.pupoo.com/img/gal_04.jpg', 'https://cdn.pupoo.com/img/th_04.jpg', 1, 'jpg', 2100000),
(5, 5, 'https://cdn.pupoo.com/img/gal_05.jpg', 'https://cdn.pupoo.com/img/th_05.jpg', 1, 'jpg', 4200000);

-- 19. gallery_likes
INSERT INTO gallery_likes (like_id, gallery_id, user_id) VALUES
(1, 1, 2), (2, 1, 3), (3, 2, 4), (4, 3, 5), (5, 5, 2);

-- 20. notices
INSERT INTO notices (notice_id, scope, event_id, notice_title, content, file_attached, is_pinned, status, created_by_admin_id) VALUES
(1, 'ALL', NULL, '푸푸 서비스 점검 안내', '새벽 2시~4시 점검 진행', 'N', 1, 'PUBLISHED', 1),
(2, 'EVENT', 1, '[필독] 예방접종 증명서 지참', '광견병 증명서 필수', 'N', 1, 'PUBLISHED', 1),
(3, 'ALL', NULL, '신규 가입 이벤트', '지금 가입하면 5천 포인트', 'Y', 0, 'PUBLISHED', 1),
(4, 'EVENT', 2, '우천 시 행사 안내', '우천 시에도 정상 진행됩니다.', 'N', 0, 'PUBLISHED', 1),
(5, 'ALL', NULL, '개인정보 처리방침 변경', '2026년 3월 1일자 적용', 'Y', 0, 'PUBLISHED', 1);

-- 21. boards
INSERT INTO boards (board_id, board_name, board_type, is_active) VALUES
(1, '자유게시판', 'FREE', 1), (2, '행사 꿀팁/정보', 'INFO', 1), (3, '방문 후기', 'REVIEW', 1), (4, '질문과 답변', 'QNA', 1), (5, '건의사항', 'FREE', 1);

-- 22. posts
INSERT INTO posts (post_id, board_id, user_id, post_title, content, file_attached, status, view_count) VALUES
(1, 1, 2, '마루 옷 샀어요!', '너무 귀엽지 않나요?', 'Y', 'PUBLISHED', 42),
(2, 2, 3, '주차 꿀팁 안내', '공영주차장 이용 추천', 'N', 'PUBLISHED', 156),
(3, 3, 4, '어질리티 후기', '멋진 강아지들 많네요.', 'Y', 'PUBLISHED', 89),
(4, 4, 5, '동반입장 질문', '마리수 제한 있나요?', 'N', 'PUBLISHED', 12),
(5, 5, 2, '앱 속도 개선 건의', '조금 느린 것 같습니다.', 'Y', 'PUBLISHED', 5);

-- ---------------------------------------------------------
-- 23. files (PATCH 통합 버전)
-- ---------------------------------------------------------
INSERT INTO files (file_id, original_name, stored_name, user_id, post_id, notice_id) VALUES
(1, 'maru.jpg', 'uuid_maru.jpg', 2, 1, NULL),
(2, 'agility.jpg', 'uuid_agility.jpg', 4, 3, NULL),
(3, 'error.png', 'uuid_error.png', 2, 5, NULL),
(4, 'event_banner.png', 'uuid_banner.png', 1, NULL, 3),
(5, 'privacy_v2.pdf', 'uuid_privacy.pdf', 1, NULL, 5);

-- 24. post_comments
INSERT INTO post_comments (comment_id, post_id, user_id, content) VALUES
(1, 1, 3, '찰떡이네요!'), (2, 1, 4, '어디서 사셨나요?'), (3, 2, 5, '좋은 정보 감사합니다.'), (4, 4, 2, '보통 1인당 2마리입니다.'), (5, 5, 1, '의견 감사합니다. 반영하겠습니다.');

-- 25. board_banned_words
INSERT INTO board_banned_words (banned_word_id, board_id, banned_word) VALUES
(1, 1, '바보'), (2, 1, '광고문의'), (3, 2, '도박'), (4, 3, '사기'), (5, 4, '욕설');

-- 26. content_reports
INSERT INTO content_reports (report_id, reporter_user_id, target_type, target_id, reason_code, reason, status) VALUES
(1, 4, 'POST', 1, 'SPAM', '상업적 광고', 'PENDING'),
(2, 2, 'POST_COMMENT', 2, 'ABUSE', '비매너 댓글', 'ACCEPTED'),
(3, 3, 'REVIEW', 3, 'HATE', '혐오 발언', 'REJECTED'),
(4, 5, 'POST', 4, 'FRAUD', '거짓 정보', 'PENDING'),
(5, 1, 'POST', 5, 'OTHER', '도배글', 'PENDING');

-- 27. reviews
INSERT INTO reviews (review_id, event_id, user_id, rating, content, review_status) VALUES
(1, 3, 2, 5, '최고의 어질리티 대회!', 'PUBLIC'),
(2, 3, 4, 4, '주차가 조금 아쉬워요.', 'PUBLIC'),
(3, 1, 3, 5, '살게 너무 많아서 통장 텅텅', 'PUBLIC'),
(4, 1, 5, 3, '사람이 너무 많아서 힘들었어요', 'PUBLIC'),
(5, 2, 2, 5, '우리 마루랑 뛰어서 행복했어요', 'PUBLIC');

-- 28. review_comments
INSERT INTO review_comments (comment_id, review_id, user_id, content) VALUES
(1, 1, 3, '맞아요 정말 재밌었어요!'), (2, 2, 1, '다음 행사엔 주차공간 확충하겠습니다.'), (3, 3, 2, '저도 지갑 털렸네요 ㅎㅎ'), (4, 4, 4, '평일에 가면 좀 낫더라고요.'), (5, 5, 5, '사진 너무 이쁘게 나왔을듯요!');

-- 29. inquiries
INSERT INTO inquiries (inquiry_id, user_id, category, inquiry_title, content, status) VALUES
(1, 2, 'EVENT', '동반 입장 강아지 마리수?', '한 사람이 두 마리 되나요?', 'CLOSED'),
(2, 4, 'REFUND', '결제 취소 방법', '환불 규정 알려주세요.', 'OPEN'),
(3, 3, 'ACCOUNT', '닉네임 변경', '닉네임 어떻게 바꾸나요?', 'CLOSED'),
(4, 5, 'PAYMENT', '카드 결제 오류', '결제가 튕깁니다.', 'IN_PROGRESS'),
(5, 2, 'OTHER', '봉사활동 지원', '스태프 지원하고 싶어요.', 'OPEN');

-- 30. inquiry_answers
INSERT INTO inquiry_answers (answer_id, inquiry_id, admin_id, content) VALUES
(1, 1, 1, '1인당 최대 2마리입니다.'), (2, 3, 1, '마이페이지 > 프로필 수정에서 가능합니다.'), (3, 4, 1, '현재 PG사 확인 중입니다. 잠시만 기다려주세요.'), (4, 2, 1, '환불 규정은 고객센터 공지사항을 확인바랍니다.'), (5, 5, 1, '다음 달 공지사항을 통해 스태프 모집 예정입니다.');

-- 31. payments
INSERT INTO payments (payment_id, user_id, event_id, order_no, amount, payment_method, status) VALUES
(1, 2, 1, 'ORD-001', 15000.00, 'KAKAOPAY', 'APPROVED'),
(2, 3, 1, 'ORD-002', 15000.00, 'CARD', 'APPROVED'),
(3, 4, 2, 'ORD-003', 35000.00, 'BANK', 'REQUESTED'),
(4, 5, 2, 'ORD-004', 35000.00, 'KAKAOPAY', 'REFUNDED'),
(5, 2, 4, 'ORD-005', 50000.00, 'CARD', 'APPROVED');

-- 32. payment_transactions (CHECK 제약 조건 보정)
INSERT INTO payment_transactions (tx_id, payment_id, pg_provider, pg_tid, status, raw_ready, raw_approve, approved_at, cancelled_at) VALUES
(1, 1, 'KAKAOPAY', 'TID_001', 'APPROVED', '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL),
(2, 2, 'KAKAOPAY', 'TID_002', 'APPROVED', '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL),
(3, 3, 'KAKAOPAY', 'TID_003', 'READY', '{"status":"ready"}', NULL, NULL, NULL),
(4, 4, 'KAKAOPAY', 'TID_004', 'CANCELLED', '{"status":"ready"}', '{"status":"approved"}', NOW(), NOW()),
(5, 5, 'KAKAOPAY', 'TID_005', 'APPROVED', '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL);

-- 33. refunds
INSERT INTO refunds (refund_id, payment_id, refund_amount, reason, status, completed_at) VALUES
(1, 1, 15000.00, '단순 변심', 'REQUESTED', NULL),
(2, 2, 15000.00, '일정 변경', 'REQUESTED', NULL),
(3, 3, 35000.00, '결제 수단 변경', 'REJECTED', NULL),
(4, 4, 35000.00, '코로나 확진', 'COMPLETED', '2026-02-23 10:00:00'),
(5, 5, 50000.00, '중복 결제', 'REQUESTED', NULL);

-- 34. qr_codes
INSERT INTO qr_codes (qr_id, user_id, event_id, original_url, mime_type, issued_at, expired_at) VALUES
(1, 2, 1, 'https://pupoo.com/qr/1', 'png', NOW(), '2026-12-31 00:00:00'),
(2, 3, 1, 'https://pupoo.com/qr/2', 'png', NOW(), '2026-12-31 00:00:00'),
(3, 4, 2, 'https://pupoo.com/qr/3', 'png', NOW(), '2026-12-31 00:00:00'),
(4, 5, 3, 'https://pupoo.com/qr/4', 'png', NOW(), '2026-12-31 00:00:00'),
(5, 2, 4, 'https://pupoo.com/qr/5', 'png', NOW(), '2026-12-31 00:00:00');

-- 35. qr_logs
INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type) VALUES
(1, 1, 4, 'CHECKIN'), (2, 1, 1, 'CHECKIN'), (3, 2, 2, 'CHECKIN'), (4, 1, 4, 'CHECKOUT'), (5, 4, 5, 'CHECKIN');

-- 36. notification
INSERT INTO notification (notification_id, type, notification_title, content) VALUES
(1, 'SYSTEM', '푸푸 가입 환영!', '반려동물과의 행복한 시간'), (2, 'EVENT', '입장권 발급 완료', 'QR코드를 확인해주세요.'), (3, 'NOTICE', '서버 점검 안내', '원활한 서비스를 위해 점검합니다.'), (4, 'PAYMENT', '결제 완료', '정상적으로 결제되었습니다.'), (5, 'APPLY', '예약 확정 안내', '세미나 예약이 확정되었습니다.');

-- 37. notification_send
INSERT INTO notification_send (send_id, notification_id, sender_id, sender_type, channel) VALUES
(1, 1, 1, 'SYSTEM', 'APP'), (2, 2, 1, 'SYSTEM', 'APP'), (3, 3, 1, 'ADMIN', 'PUSH'), (4, 4, 1, 'SYSTEM', 'SMS'), (5, 5, 1, 'SYSTEM', 'EMAIL');

-- 38. notification_inbox
INSERT INTO notification_inbox (inbox_id, user_id, notification_id, target_type, target_id) VALUES
(1, 2, 1, NULL, NULL), (2, 2, 2, 'EVENT', 1), (3, 3, 1, NULL, NULL), (4, 4, 4, NULL, NULL), (5, 5, 5, 'EVENT', 3);

-- 39. notification_settings
INSERT INTO notification_settings (user_id, allow_marketing) VALUES
(1, 1), (2, 1), (3, 0), (4, 1), (5, 0);

-- 40. interests
INSERT INTO interests (interest_id, interest_name, type, is_active) VALUES
(1, 'SNACK', 'SYSTEM', 1), (2, 'TRAINING', 'SYSTEM', 1), (3, 'CLOTHING', 'SYSTEM', 1), (4, 'TOY', 'SYSTEM', 1), (5, 'GROOMING', 'SYSTEM', 1);

-- 41. user_interest_subscriptions
INSERT INTO user_interest_subscriptions (subscription_id, user_id, interest_id, allow_inapp, allow_email, allow_sms, status) VALUES
(1, 2, 1, 1, 1, 0, 'ACTIVE'), (2, 2, 2, 1, 0, 0, 'ACTIVE'), (3, 3, 3, 1, 1, 1, 'ACTIVE'), (4, 4, 4, 1, 0, 1, 'ACTIVE'), (5, 5, 5, 0, 0, 0, 'PAUSED');

-- 42. event_interest_map
INSERT INTO event_interest_map (event_interest_map_id, event_id, interest_id) VALUES
(1, 1, 1), (2, 1, 3), (3, 3, 2), (4, 4, 2), (5, 1, 4);

-- 43. email_verification_token
INSERT INTO email_verification_token (email_verification_token_id, user_id, token_hash, expires_at) VALUES
(1, 2, 'hash_email_001', '2026-12-31 00:00:00'), (2, 3, 'hash_email_002', '2026-12-31 00:00:00'), (3, 4, 'hash_email_003', '2026-12-31 00:00:00'), (4, 5, 'hash_email_004', '2026-12-31 00:00:00'), (5, 2, 'hash_email_005', '2026-12-31 00:00:00');

-- 44. phone_verification_token
INSERT INTO phone_verification_token (phone_verification_token_id, user_id, phone, code_hash, expires_at) VALUES
(1, 2, '010-1234-5678', 'hash_phone_001', '2026-12-31 00:00:00'), (2, 3, '010-1111-2222', 'hash_phone_002', '2026-12-31 00:00:00'), (3, 4, '010-3333-4444', 'hash_phone_003', '2026-12-31 00:00:00'), (4, 5, '010-5555-6666', 'hash_phone_004', '2026-12-31 00:00:00'), (5, 2, '010-1234-5678', 'hash_phone_005', '2026-12-31 00:00:00');

-- 45. signup_sessions
INSERT INTO signup_sessions (signup_session_id, signup_key, signup_type, nickname, phone, otp_status, email_status, expires_at) VALUES
(1, 'uuid-session-001', 'EMAIL', '예비회원1', '010-9999-0001', 'VERIFIED', 'VERIFIED', '2026-12-31 00:00:00'),
(2, 'uuid-session-002', 'SOCIAL', '예비회원2', '010-9999-0002', 'PENDING', 'PENDING', '2026-12-31 00:00:00'),
(3, 'uuid-session-003', 'EMAIL', '예비회원3', '010-9999-0003', 'VERIFIED', 'PENDING', '2026-12-31 00:00:00'),
(4, 'uuid-session-004', 'SOCIAL', '예비회원4', '010-9999-0004', 'EXPIRED', 'NOT_REQUIRED', '2025-12-31 00:00:00'),
(5, 'uuid-session-005', 'EMAIL', '예비회원5', '010-9999-0005', 'PENDING', 'VERIFIED', '2026-12-31 00:00:00');

-- 46. admin_logs
INSERT INTO admin_logs (log_id, admin_id, action, target_type, target_id, result) VALUES
(1, 1, 'NOTICE_CREATE', 'NOTICE', 1, 'SUCCESS'), (2, 1, 'INQUIRY_ANSWER', 'INQUIRY', 1, 'SUCCESS'), (3, 1, 'EVENT_CREATE', 'EVENT', 1, 'SUCCESS'), (4, 1, 'USER_SUSPEND', 'USER', 5, 'FAIL'), (5, 1, 'REFUND_APPROVE', 'REFUND', 4, 'SUCCESS');

-- 47. refresh_token
INSERT INTO refresh_token (refresh_token_id, user_id, token, expired_at) VALUES
(1, 1, 'mock_token_admin', '2026-12-31 00:00:00'), (2, 2, 'mock_token_user2', '2026-12-31 00:00:00'), (3, 3, 'mock_token_user3', '2026-12-31 00:00:00'), (4, 4, 'mock_token_user4', '2026-12-31 00:00:00'), (5, 5, 'mock_token_user5', '2026-12-31 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;