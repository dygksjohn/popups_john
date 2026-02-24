SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 0) DROP ALL TABLES (역순 삭제)
-- =========================================================
DROP TABLE IF EXISTS 
  signup_sessions, phone_verification_token, email_verification_token, 
  event_interest_map, user_interest_subscriptions, interests, 
  notification_settings, notification_inbox, notification_send, notification, 
  qr_logs, qr_codes, refunds, payment_transactions, payments, 
  inquiry_answers, inquiries, content_reports, 
  review_comments, reviews, board_banned_words, post_comments, files, posts, boards, notices, 
  gallery_likes, gallery_images, galleries, 
  congestions, experience_waits, booth_waits, program_speakers, speakers, 
  contest_votes, program_participation_stats, event_history, event_program_apply, event_program, booths, 
  event_apply, event, pet, social_account, admin_logs, refresh_token, users;

-- =========================================================
-- 1) CREATE TABLES (의존성 순서에 맞게 재배치)
-- =========================================================

-- 1. users
CREATE TABLE users (
  user_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '사용자 ID',
  email             VARCHAR(255)  NOT NULL COMMENT '로그인 식별 이메일',
  password          VARCHAR(255)  NOT NULL COMMENT '암호화(해시) 비밀번호',
  nickname          VARCHAR(30)   NOT NULL COMMENT '커뮤니티 표시명 닉네임',
  phone             VARCHAR(30)   NOT NULL COMMENT '휴대전화번호',
  status            ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE' COMMENT '계정 상태',
  role_name         ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '권한명(USER/ADMIN)',
  show_age          TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '나이 공개 여부',
  show_gender       TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '성별 공개 여부',
  show_pet          TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '반려동물 공개 여부',
  email_verified    TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '이메일 인증 여부',
  phone_verified    TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '휴대전화 인증 여부',
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입(계정 생성) 일시',
  last_login_at     DATETIME      NULL COMMENT '최근 로그인 일시',
  last_modified_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '비밀번호 마지막 수정일',
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. social_account
CREATE TABLE social_account (
  social_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '소셜 연동 ID',
  user_id        BIGINT        NOT NULL COMMENT '사용자 ID',
  provider       VARCHAR(100)  NOT NULL COMMENT '소셜 제공자',
  provider_uid   VARCHAR(255)  NOT NULL COMMENT '소셜 UID',
  PRIMARY KEY (social_id),
  UNIQUE KEY uk_social_provider_uid (provider, provider_uid),
  UNIQUE KEY uk_social_user_provider (user_id, provider),
  KEY ix_social_user_id (user_id),
  CONSTRAINT fk_social_account_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. pet
CREATE TABLE pet (
  pet_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '반려동물 ID',
  user_id     BIGINT        NOT NULL COMMENT '보호자 ID',
  pet_name    VARCHAR(100)  NULL COMMENT '이름',
  pet_breed   ENUM('DOG','CAT','OTHER') NOT NULL COMMENT '반려동물 종류',
  pet_age     INT           NULL COMMENT '나이',
  pet_weight  ENUM('XS','S','M','L','XL') NULL COMMENT '강아지 상세 분류(체중)',
  PRIMARY KEY (pet_id),
  KEY ix_pet_user_id (user_id),
  CONSTRAINT fk_pet_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. event
CREATE TABLE event (
  event_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '행사 ID',
  event_name   VARCHAR(255)  NOT NULL COMMENT '행사명',
  description  VARCHAR(1000) NOT NULL COMMENT '행사 설명',
  start_at     DATETIME      NOT NULL COMMENT '시작일시',
  end_at       DATETIME      NOT NULL COMMENT '종료일시',
  location     VARCHAR(255)  NULL COMMENT '주소 / 장소',
  status       ENUM('PLANNED','ONGOING','ENDED','CANCELLED') NOT NULL COMMENT '행사 상태',
  round_no     INT           NULL COMMENT '회차',
  PRIMARY KEY (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. event_apply
CREATE TABLE event_apply (
  apply_id    BIGINT   NOT NULL AUTO_INCREMENT COMMENT '신청 ID',
  user_id     BIGINT   NOT NULL COMMENT '사용자 ID',
  event_id    BIGINT   NOT NULL COMMENT '행사 ID',
  applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일시',
  status      ENUM('APPLIED','CANCELLED','APPROVED','REJECTED') NOT NULL COMMENT '신청 상태',
  active_flag TINYINT
    GENERATED ALWAYS AS (CASE WHEN status = 'APPLIED' THEN 1 ELSE NULL END) STORED
    COMMENT 'APPLIED 상태면 1, 아니면 NULL (활성 중복 방지용)',
  PRIMARY KEY (apply_id),
  UNIQUE KEY uk_event_apply_active (event_id, user_id, active_flag),
  KEY ix_event_apply_user_id (user_id),
  KEY ix_event_apply_event_id (event_id),
  CONSTRAINT fk_event_apply_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_apply_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. booths (event_program 생성 전 배치)
CREATE TABLE booths (
  booth_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '장소 ID(booths)',
  event_id     BIGINT        NOT NULL COMMENT '행사 ID',
  place_name   VARCHAR(100)  NOT NULL COMMENT '장소명(부스/세션룸/무대 등)',
  type         ENUM('BOOTH_COMPANY','BOOTH_EXPERIENCE','BOOTH_SALE','BOOTH_FOOD','BOOTH_INFO','BOOTH_SPONSOR','SESSION_ROOM','CONTEST_ZONE','STAGE','ETC') NOT NULL COMMENT '장소 종류',
  description  VARCHAR(1000) NULL COMMENT '설명(옵션)',
  company      VARCHAR(100)  NULL COMMENT '업체명(부스 타입일 때만 사용 가능)',
  zone         ENUM('ZONE_A','ZONE_B','ZONE_C','OTHER') NOT NULL COMMENT '존(구역)',
  status       ENUM('OPEN','CLOSED','PAUSED') NOT NULL COMMENT '운영 상태',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  PRIMARY KEY (booth_id),
  UNIQUE KEY uk_booths_event_place (event_id, place_name),
  KEY ix_booths_event_id (event_id),
  CONSTRAINT fk_booths_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. event_program
CREATE TABLE event_program (
  program_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '프로그램 ID',
  event_id       BIGINT        NOT NULL COMMENT '행사 ID',
  category       ENUM('CONTEST','SESSION','EXPERIENCE') NOT NULL COMMENT '프로그램 카테고리',
  program_title  VARCHAR(255)  NOT NULL COMMENT '프로그램 제목',
  description    VARCHAR(1000) NOT NULL COMMENT '프로그램 설명',
  start_at       DATETIME      NOT NULL COMMENT '시작일시',
  end_at         DATETIME      NOT NULL COMMENT '종료일시',
  booth_id       BIGINT        NULL COMMENT '프로그램 위치(booths.booth_id)',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (program_id),
  KEY ix_event_program_event_id (event_id),
  KEY ix_event_program_booth_id (booth_id),
  CONSTRAINT fk_event_program_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_program_booth
    FOREIGN KEY (booth_id) REFERENCES booths(booth_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. event_program_apply
CREATE TABLE event_program_apply (
  program_apply_id BIGINT   NOT NULL AUTO_INCREMENT COMMENT '프로그램 참가 ID',
  program_id       BIGINT   NOT NULL COMMENT '프로그램 ID',
  user_id          BIGINT   NOT NULL COMMENT '사용자 ID',
  status           ENUM('APPLIED','WAITING','APPROVED','REJECTED','CANCELLED','CHECKED_IN') NOT NULL COMMENT '상태',
  ticket_no        VARCHAR(30) NULL COMMENT '현장 티켓번호(표시용)',
  eta_min          INT NULL COMMENT '예상 대기시간(분)',
  notified_at      DATETIME NULL COMMENT '10분 전 알림 발송 시점',
  checked_in_at    DATETIME NULL COMMENT '참여 확정(체크인) 시점',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  cancelled_at     DATETIME NULL COMMENT '취소일시',
  active_flag      TINYINT
    GENERATED ALWAYS AS (CASE WHEN status IN ('APPLIED','WAITING','APPROVED') THEN 1 ELSE NULL END) STORED COMMENT '활성 신청 플래그',
  PRIMARY KEY (program_apply_id),
  UNIQUE KEY uk_event_program_apply_program_user_active (program_id, user_id, active_flag),
  KEY ix_event_program_apply_program_id (program_id),
  KEY ix_event_program_apply_user_id (user_id),
  KEY ix_event_program_apply_checked_in_at (checked_in_at),
  CONSTRAINT fk_event_program_apply_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_program_apply_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_event_program_apply_cancelled_at
    CHECK ((status = 'CANCELLED' AND cancelled_at IS NOT NULL) OR (status <> 'CANCELLED' AND cancelled_at IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. event_history
CREATE TABLE event_history (
  history_id  BIGINT   NOT NULL AUTO_INCREMENT COMMENT '참여 이력 ID',
  user_id     BIGINT   NOT NULL COMMENT '사용자 ID',
  event_id    BIGINT   NOT NULL COMMENT '행사 ID',
  program_id  BIGINT   NOT NULL COMMENT '프로그램 ID',
  joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '참여일시',
  PRIMARY KEY (history_id),
  KEY ix_event_history_user_id (user_id),
  KEY ix_event_history_event_id (event_id),
  KEY ix_event_history_program_id (program_id),
  CONSTRAINT fk_event_history_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_history_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_history_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. program_participation_stats
CREATE TABLE program_participation_stats (
  user_id              BIGINT NOT NULL COMMENT '사용자 ID',
  program_id           BIGINT NOT NULL COMMENT '프로그램 ID',
  participate_count    BIGINT NOT NULL DEFAULT 0 COMMENT '참여 횟수',
  last_participated_at DATETIME NULL COMMENT '마지막 참여 시각',
  PRIMARY KEY (user_id, program_id),
  KEY ix_pps_user_id (user_id),
  KEY ix_pps_program_id (program_id),
  CONSTRAINT fk_pps_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pps_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. contest_votes
CREATE TABLE contest_votes (
  vote_id           BIGINT   NOT NULL AUTO_INCREMENT COMMENT '콘테스트 투표 ID',
  program_id        BIGINT   NOT NULL COMMENT '프로그램 ID',
  program_apply_id  BIGINT   NOT NULL COMMENT '투표 대상 참가 ID',
  user_id           BIGINT   NOT NULL COMMENT '투표자 사용자 ID',
  voted_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '투표일시',
  status            ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE' COMMENT '투표 상태',
  cancelled_at      DATETIME NULL COMMENT '취소일시',
  active_flag       TINYINT
    GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE NULL END) STORED COMMENT '활성 플래그',
  PRIMARY KEY (vote_id),
  UNIQUE KEY uk_contest_votes_active (program_id, user_id, active_flag),
  KEY ix_contest_votes_program_id (program_id),
  KEY ix_contest_votes_program_apply_id (program_apply_id),
  KEY ix_contest_votes_user_id (user_id),
  KEY ix_contest_votes_program_status (program_id, status),
  KEY ix_contest_votes_user_status (user_id, status),
  CONSTRAINT fk_contest_votes_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contest_votes_program_apply
    FOREIGN KEY (program_apply_id) REFERENCES event_program_apply(program_apply_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contest_votes_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_contest_votes_cancelled_at
    CHECK ((status = 'ACTIVE' AND cancelled_at IS NULL) OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. speakers
CREATE TABLE speakers (
  speaker_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '연사 ID',
  speaker_name   VARCHAR(255)  NOT NULL COMMENT '연사 이름',
  speaker_bio    VARCHAR(1000) NOT NULL COMMENT '연사 소개 및 상세 정보',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  speaker_email  VARCHAR(255)  NOT NULL COMMENT '연사 email',
  speaker_phone  VARCHAR(30)   NOT NULL COMMENT '연사 전화번호',
  deleted_at     DATETIME      NULL COMMENT '삭제일시(소프트삭제)',
  PRIMARY KEY (speaker_id),
  UNIQUE KEY uk_speakers_email (speaker_email),
  UNIQUE KEY uk_speakers_phone (speaker_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='연사';

-- 13. program_speakers
CREATE TABLE program_speakers (
  program_id   BIGINT   NOT NULL COMMENT '프로그램 ID',
  speaker_id   BIGINT   NOT NULL COMMENT '연사 ID',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '매핑 생성일시',
  PRIMARY KEY (program_id, speaker_id),
  KEY ix_program_speakers_program_id (program_id),
  KEY ix_program_speakers_speaker_id (speaker_id),
  CONSTRAINT fk_program_speakers_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_program_speakers_speaker
    FOREIGN KEY (speaker_id) REFERENCES speakers(speaker_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로그램-연사 매핑';

-- 14. booth_waits
CREATE TABLE booth_waits (
  wait_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '현재 대기 PK(옵션)',
  booth_id    BIGINT   NOT NULL COMMENT '부스 ID',
  wait_count  INT      NULL COMMENT '현재 대기 인원',
  wait_min    INT      NULL COMMENT '예상 대기 시간(분)',
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '갱신일시',
  PRIMARY KEY (wait_id),
  UNIQUE KEY uk_booth_waits_booth_id (booth_id),
  CONSTRAINT fk_booth_waits_booth
    FOREIGN KEY (booth_id) REFERENCES booths(booth_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. experience_waits
CREATE TABLE experience_waits (
  wait_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '체험 대기 ID',
  program_id  BIGINT   NOT NULL COMMENT '프로그램 ID',
  wait_count  INT      NULL COMMENT '대기 인원',
  wait_min    INT      NULL COMMENT '예상 대기시간(분)',
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '갱신일시',
  PRIMARY KEY (wait_id),
  UNIQUE KEY uk_experience_waits_program_id (program_id),
  KEY ix_experience_waits_program_id (program_id),
  CONSTRAINT fk_experience_waits_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. congestions
CREATE TABLE congestions (
  congestion_id     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '혼잡 ID',
  program_id        BIGINT       NOT NULL COMMENT '프로그램 ID',
  zone              ENUM('ZONE_A','ZONE_B','ZONE_C','OTHER') NOT NULL COMMENT '구역명',
  place_name        VARCHAR(100) NOT NULL COMMENT '부스 장소명',
  congestion_level  TINYINT      NOT NULL COMMENT '혼잡단계(1~5)',
  measured_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '측정일시',
  PRIMARY KEY (congestion_id),
  KEY ix_congestions_program_id (program_id),
  CONSTRAINT fk_congestions_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. galleries
CREATE TABLE galleries (
  gallery_id          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '갤러리 ID',
  event_id            BIGINT        NOT NULL COMMENT '행사 ID',
  gallery_title       VARCHAR(255)  NOT NULL COMMENT '갤러리 제목',
  description         VARCHAR(1000) NULL COMMENT '사진 설명',
  view_count          INT           NULL COMMENT '조회수',
  thumbnail_image_id  BIGINT        NULL COMMENT '대표 이미지 ID',
  gallery_status      ENUM('PUBLIC','PRIVATE','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC' COMMENT '갤러리 상태',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (gallery_id),
  KEY ix_galleries_event_id (event_id),
  KEY ix_galleries_thumbnail_image_id (thumbnail_image_id),
  CONSTRAINT fk_galleries_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. gallery_images
CREATE TABLE gallery_images (
  image_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '이미지 ID',
  gallery_id    BIGINT        NOT NULL COMMENT '갤러리 ID',
  original_url  VARCHAR(500)  NOT NULL COMMENT '원본 이미지 경로',
  thumb_url     VARCHAR(500)  NULL COMMENT '썸네일 이미지 경로',
  image_order   INT           NULL COMMENT '이미지 정렬 순서',
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL COMMENT '파일 타입',
  file_size     INT           NULL COMMENT '파일 크기',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  PRIMARY KEY (image_id),
  KEY ix_gallery_images_gallery_id (gallery_id),
  CONSTRAINT fk_gallery_images_gallery
    FOREIGN KEY (gallery_id) REFERENCES galleries(gallery_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- galleries 테이블에 FK 추가
ALTER TABLE galleries
  ADD CONSTRAINT fk_galleries_thumbnail_image
    FOREIGN KEY (thumbnail_image_id) REFERENCES gallery_images(image_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 19. gallery_likes
CREATE TABLE gallery_likes (
  like_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '좋아요 ID',
  gallery_id  BIGINT   NOT NULL COMMENT '갤러리 ID',
  user_id     BIGINT   NOT NULL COMMENT '사용자 ID',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (like_id),
  UNIQUE KEY uk_gallery_likes_gallery_user (gallery_id, user_id),
  KEY ix_gallery_likes_gallery_id (gallery_id),
  KEY ix_gallery_likes_user_id (user_id),
  CONSTRAINT fk_gallery_likes_gallery
    FOREIGN KEY (gallery_id) REFERENCES galleries(gallery_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_gallery_likes_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. notices
CREATE TABLE notices (
  notice_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '공지 ID',
  scope               VARCHAR(20)   NOT NULL COMMENT '공지 범위',
  event_id            BIGINT        NULL COMMENT '행사 ID',
  notice_title        VARCHAR(255)  NOT NULL COMMENT '공지 제목',
  content             VARCHAR(1000) NOT NULL COMMENT '공지 내용',
  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N' COMMENT '첨부파일 여부',
  is_pinned           TINYINT       NOT NULL COMMENT '상단 고정 여부',
  status              ENUM('PUBLISHED','DRAFT','HIDDEN') NOT NULL COMMENT '게시 상태',
  created_by_admin_id BIGINT        NOT NULL COMMENT '생성 관리자 ID',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (notice_id),
  KEY ix_notices_event_id (event_id),
  KEY ix_notices_created_by_admin_id (created_by_admin_id),
  CONSTRAINT fk_notices_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_notices_admin_users
    FOREIGN KEY (created_by_admin_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. boards
CREATE TABLE boards (
  board_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '게시판 ID',
  board_name    VARCHAR(50)  NOT NULL COMMENT '게시판명',
  board_type    ENUM('FREE','INFO','REVIEW','QNA') NOT NULL COMMENT '게시판 유형',
  is_active     TINYINT      NOT NULL DEFAULT 1 COMMENT '활성 여부',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (board_id)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. posts
CREATE TABLE posts (
  post_id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '게시글 ID',
  board_id            BIGINT        NOT NULL COMMENT '게시판 ID',
  user_id             BIGINT        NOT NULL COMMENT '사용자 ID',
  post_title          VARCHAR(255)  NOT NULL COMMENT '제목',
  content             TEXT          NOT NULL COMMENT '내용',
  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N' COMMENT '첨부파일 여부',
  status              ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'PUBLISHED' COMMENT '상태',
  view_count          INT           NOT NULL DEFAULT 0 COMMENT '조회수',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  is_deleted          TINYINT       NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  is_comment_enabled  TINYINT       NOT NULL DEFAULT 1 COMMENT '댓글 사용 여부',
  PRIMARY KEY (post_id),
  KEY ix_posts_board_id (board_id),
  KEY ix_posts_user_id (user_id),
  KEY ix_posts_status_created_at (status, created_at),
  CONSTRAINT fk_posts_boards
    FOREIGN KEY (board_id) REFERENCES boards(board_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_posts_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. files
CREATE TABLE files (
  file_id        BIGINT        NOT NULL AUTO_INCREMENT COMMENT '파일 ID',
  original_name  VARCHAR(255)  NOT NULL COMMENT '원본 파일명',
  stored_name    VARCHAR(255)  NOT NULL COMMENT '유니크 파일명',
  post_id        BIGINT        NULL COMMENT '게시글 ID',
  notice_id      BIGINT        NULL COMMENT '공지 ID',
  PRIMARY KEY (file_id),
  UNIQUE KEY uk_files_stored_name (stored_name),
  KEY ix_files_post_id (post_id),
  KEY ix_files_notice_id (notice_id),
  UNIQUE KEY uk_files_post_id (post_id),
  UNIQUE KEY uk_files_notice_id (notice_id),
  CONSTRAINT fk_files_posts
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_files_notices
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23-1. files TRIGGER (동기화)
DELIMITER $$
CREATE TRIGGER trg_files_bi_owner_one BEFORE INSERT ON files FOR EACH ROW
BEGIN
  IF (NEW.post_id IS NULL AND NEW.notice_id IS NULL) OR (NEW.post_id IS NOT NULL AND NEW.notice_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'files: either post_id or notice_id must be set (only one).';
  END IF;
END$$
CREATE TRIGGER trg_files_bu_owner_one BEFORE UPDATE ON files FOR EACH ROW
BEGIN
  IF (NEW.post_id IS NULL AND NEW.notice_id IS NULL) OR (NEW.post_id IS NOT NULL AND NEW.notice_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'files: either post_id or notice_id must be set (only one).';
  END IF;
END$$
CREATE TRIGGER trg_files_ai_set_attached AFTER INSERT ON files FOR EACH ROW
BEGIN
  IF NEW.post_id IS NOT NULL THEN UPDATE posts SET file_attached = 'Y' WHERE post_id = NEW.post_id;
  ELSE UPDATE notices SET file_attached = 'Y' WHERE notice_id = NEW.notice_id; END IF;
END$$
CREATE TRIGGER trg_files_ad_unset_attached AFTER DELETE ON files FOR EACH ROW
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM files WHERE post_id = OLD.post_id) = 0 THEN UPDATE posts SET file_attached = 'N' WHERE post_id = OLD.post_id; END IF;
  ELSE
    IF (SELECT COUNT(*) FROM files WHERE notice_id = OLD.notice_id) = 0 THEN UPDATE notices SET file_attached = 'N' WHERE notice_id = OLD.notice_id; END IF;
  END IF;
END$$
DELIMITER ;

-- 24. post_comments
CREATE TABLE post_comments (
  comment_id  BIGINT        NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  post_id     BIGINT        NOT NULL COMMENT '게시글 ID',
  user_id     BIGINT        NOT NULL COMMENT '사용자 ID',
  content     VARCHAR(1000) NOT NULL COMMENT '댓글 내용',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  is_deleted  TINYINT       NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  PRIMARY KEY (comment_id),
  KEY ix_post_comments_post_id (post_id),
  KEY ix_post_comments_user_id (user_id),
  CONSTRAINT fk_post_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_post_comments_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. board_banned_words
CREATE TABLE board_banned_words (
  banned_word_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '금칙어 ID',
  board_id         BIGINT       NOT NULL COMMENT '게시판 ID',
  banned_word      VARCHAR(100) NOT NULL COMMENT '금칙어',
  banned_word_norm VARCHAR(100) GENERATED ALWAYS AS (LOWER(TRIM(banned_word))) STORED COMMENT '정규화',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  PRIMARY KEY (banned_word_id),
  UNIQUE KEY uk_board_banned_words_board_word (board_id, banned_word_norm),
  KEY ix_board_banned_words_board_id (board_id),
  CONSTRAINT fk_board_banned_words_boards
    FOREIGN KEY (board_id) REFERENCES boards(board_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. content_reports
CREATE TABLE content_reports (
  report_id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '신고 ID',
  reporter_user_id     BIGINT       NOT NULL COMMENT '신고자 ID',
  target_type          ENUM('POST','REVIEW','POST_COMMENT','REVIEW_COMMENT') NOT NULL COMMENT '대상 타입',
  target_id            BIGINT       NOT NULL COMMENT '대상 ID',
  reason_code          ENUM('SPAM','ABUSE','HATE','SEXUAL','VIOLENCE','PRIVACY','FRAUD','COPYRIGHT','OTHER') NOT NULL COMMENT '사유 코드',
  reason_detail        VARCHAR(255) NULL COMMENT '사유 상세',
  reason               VARCHAR(255) NOT NULL COMMENT '사유 텍스트',
  status               ENUM('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',
  resolved_at          DATETIME     NULL COMMENT '처리 일시',
  resolved_by_admin_id BIGINT       NULL COMMENT '처리 관리자 ID',
  PRIMARY KEY (report_id),
  UNIQUE KEY uk_report_unique (reporter_user_id, target_type, target_id),
  KEY ix_reports_target (target_type, target_id, status),
  KEY ix_reports_status_created_at (status, created_at),
  KEY ix_reports_reporter (reporter_user_id),
  KEY ix_reports_resolved_by (resolved_by_admin_id),
  CONSTRAINT fk_content_reports_reporter_user
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_content_reports_resolved_admin
    FOREIGN KEY (resolved_by_admin_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. reviews
CREATE TABLE reviews (
  review_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '후기 ID',
  event_id      BIGINT   NOT NULL COMMENT '행사 ID',
  user_id       BIGINT   NOT NULL COMMENT '사용자 ID',
  rating        TINYINT  NOT NULL COMMENT '별점',
  content       TEXT     NOT NULL COMMENT '내용',
  view_count    INT      NOT NULL DEFAULT 0 COMMENT '조회수',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  is_deleted    TINYINT  NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  review_status ENUM('PUBLIC','REPORTED','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC' COMMENT '상태',
  PRIMARY KEY (review_id),
  UNIQUE KEY uk_reviews_event_user (event_id, user_id),
  KEY ix_reviews_event_id (event_id),
  KEY ix_reviews_user_id (user_id),
  KEY ix_reviews_status (review_status),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_reviews_delete_consistency CHECK ((is_deleted = 1 AND review_status = 'DELETED') OR (is_deleted = 0 AND review_status <> 'DELETED')),
  CONSTRAINT fk_reviews_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. review_comments
CREATE TABLE review_comments (
  comment_id  BIGINT        NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  review_id   BIGINT        NOT NULL COMMENT '후기 ID',
  user_id     BIGINT        NOT NULL COMMENT '사용자 ID',
  content     VARCHAR(1000) NOT NULL COMMENT '댓글 내용',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  is_deleted  TINYINT       NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  PRIMARY KEY (comment_id),
  KEY ix_review_comments_review_id (review_id),
  KEY ix_review_comments_user_id (user_id),
  CONSTRAINT fk_review_comments_review FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_comments_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. inquiries
CREATE TABLE inquiries (
  inquiry_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '문의 ID',
  user_id        BIGINT        NOT NULL COMMENT '사용자 ID',
  category       ENUM('EVENT','PAYMENT','REFUND','ACCOUNT','OTHER') NOT NULL COMMENT '분류',
  inquiry_title  VARCHAR(255)  NOT NULL COMMENT '제목',
  content        TEXT          NOT NULL COMMENT '내용',
  status         ENUM('OPEN','IN_PROGRESS','CLOSED') NOT NULL DEFAULT 'OPEN' COMMENT '상태',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (inquiry_id),
  KEY ix_inquiries_user_created (user_id, created_at),
  CONSTRAINT fk_inquiries_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. inquiry_answers
CREATE TABLE inquiry_answers (
  answer_id   BIGINT   NOT NULL AUTO_INCREMENT COMMENT '답변 ID',
  inquiry_id  BIGINT   NOT NULL COMMENT '문의 ID',
  admin_id    BIGINT   NOT NULL COMMENT '관리자 ID',
  content     TEXT     NOT NULL COMMENT '내용',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  PRIMARY KEY (answer_id),
  KEY ix_inquiry_answers_inquiry_id (inquiry_id),
  KEY ix_inquiry_answers_admin_id (admin_id),
  CONSTRAINT fk_inquiry_answers_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(inquiry_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inquiry_answers_admin_users FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31. payments (ALTER 구문 하나로 합침)
CREATE TABLE payments (
  payment_id      BIGINT         NOT NULL AUTO_INCREMENT COMMENT '결제 ID',
  user_id         BIGINT         NOT NULL COMMENT '사용자 ID',
  event_id        BIGINT         NULL COMMENT '행사 ID',
  order_no        VARCHAR(50)    NOT NULL COMMENT '주문번호',
  amount          DECIMAL(10,2)  NOT NULL COMMENT '결제금액',
  payment_method  ENUM('KAKAOPAY','CARD','BANK','OTHER') NOT NULL COMMENT '결제수단',
  status          ENUM('REQUESTED','APPROVED','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'REQUESTED' COMMENT '결제상태',
  requested_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제요청일시',
  active_flag     TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('REQUESTED','APPROVED') THEN 1 ELSE NULL END) STORED COMMENT '활성 결제 플래그',
  PRIMARY KEY (payment_id),
  UNIQUE KEY uk_payments_order_no (order_no),
  UNIQUE KEY uk_payments_event_user_active (event_id, user_id, active_flag),
  KEY ix_payments_user_id (user_id),
  KEY ix_payments_event_id (event_id),
  CONSTRAINT fk_payments_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_payments_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 32. payment_transactions (동적 SQL 제거, 컬럼에 JSON 바로 선언)
CREATE TABLE payment_transactions (
  tx_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT 'PG 트랜잭션 ID',
  payment_id      BIGINT        NOT NULL COMMENT '결제 ID',
  pg_provider     ENUM('KAKAOPAY') NOT NULL COMMENT 'PG 제공자',
  pg_tid          VARCHAR(100)  NOT NULL COMMENT 'PG 거래ID',
  pg_token        VARCHAR(100)  NULL COMMENT '승인 토큰',
  status          ENUM('READY','APPROVED','CANCELLED','FAILED') NOT NULL DEFAULT 'READY' COMMENT '트랜잭션 상태',
  idempotency_key VARCHAR(64)   NULL COMMENT '멱등키',
  raw_ready       JSON          NULL COMMENT 'ready 원문 응답(JSON)',
  raw_approve     JSON          NULL COMMENT 'approve 원문 응답(JSON)',
  raw_cancel      JSON          NULL COMMENT 'cancel 원문 응답(JSON)',
  requested_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청일시',
  approved_at     DATETIME      NULL COMMENT '승인일시',
  cancelled_at    DATETIME      NULL COMMENT '취소일시',
  failed_at       DATETIME      NULL COMMENT '실패일시',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (tx_id),
  UNIQUE KEY uk_payment_transactions_payment_id (payment_id),
  UNIQUE KEY uk_payment_transactions_provider_tid (pg_provider, pg_tid),
  KEY ix_payment_transactions_status (status),
  KEY ix_payment_transactions_payment_id (payment_id),
  CONSTRAINT fk_payment_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_payment_transactions_status_datetime CHECK (
    (status = 'READY'     AND approved_at IS NULL AND cancelled_at IS NULL AND failed_at IS NULL) OR
    (status = 'APPROVED'  AND approved_at IS NOT NULL AND cancelled_at IS NULL AND failed_at IS NULL) OR
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND failed_at IS NULL) OR
    (status = 'FAILED'    AND failed_at IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 33. refunds
CREATE TABLE refunds (
  refund_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '환불 ID',
  payment_id     BIGINT        NOT NULL COMMENT '결제 ID',
  refund_amount  DECIMAL(10,2) NOT NULL COMMENT '환불금액',
  reason         VARCHAR(255)  NOT NULL COMMENT '환불사유',
  status         ENUM('REQUESTED','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'REQUESTED' COMMENT '상태',
  requested_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청일시',
  completed_at   DATETIME      NULL COMMENT '완료일시',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (refund_id),
  UNIQUE KEY uk_refunds_payment_id (payment_id),
  KEY ix_refunds_status (status),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_refunds_completed_at CHECK ((status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)),
  CONSTRAINT ck_refunds_refund_amount CHECK (refund_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 34. qr_codes
CREATE TABLE qr_codes (
  qr_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'QR ID',
  user_id       BIGINT       NOT NULL COMMENT '사용자 ID',
  event_id      BIGINT       NOT NULL COMMENT '행사 ID',
  original_url  VARCHAR(500) NOT NULL COMMENT '원본 이미지 경로',
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL COMMENT '파일 타입',
  issued_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급일시',
  expired_at    DATETIME     NOT NULL COMMENT '만료일시',
  PRIMARY KEY (qr_id),
  KEY ix_qr_codes_user_id (user_id),
  KEY ix_qr_codes_event_id (event_id),
  CONSTRAINT fk_qr_codes_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 35. qr_logs
CREATE TABLE qr_logs (
  log_id      BIGINT   NOT NULL AUTO_INCREMENT COMMENT '로그 ID',
  qr_id       BIGINT   NOT NULL COMMENT 'QR ID',
  booth_id    BIGINT   NOT NULL COMMENT '부스 ID',
  check_type  ENUM('CHECKIN','CHECKOUT') NOT NULL COMMENT '체크유형',
  checked_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '체크일시',
  PRIMARY KEY (log_id),
  KEY ix_qr_logs_qr_id (qr_id),
  KEY ix_qr_logs_booth_id (booth_id),
  KEY ix_qr_logs_checked_at (checked_at),
  CONSTRAINT fk_qr_logs_qr FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_logs_booth FOREIGN KEY (booth_id) REFERENCES booths(booth_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 36. notification
CREATE TABLE notification (
  notification_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '알림ID',
  type                ENUM('EVENT','NOTICE','PAYMENT','APPLY','SYSTEM') NOT NULL DEFAULT 'SYSTEM' COMMENT '알림 유형',
  notification_title  VARCHAR(255)  NOT NULL COMMENT '제목',
  content             VARCHAR(255)  NOT NULL COMMENT '내용',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 37. notification_send
CREATE TABLE notification_send (
  send_id          BIGINT NOT NULL AUTO_INCREMENT COMMENT '발신ID',
  notification_id  BIGINT NOT NULL COMMENT '알림ID',
  sender_id        BIGINT NOT NULL COMMENT '발신자ID',
  sender_type      ENUM('USER','ADMIN','SYSTEM') NOT NULL COMMENT '발신유형',
  channel          ENUM('APP','EMAIL','SMS','PUSH') NOT NULL COMMENT '발신채널',
  sent_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발신일시',
  PRIMARY KEY (send_id),
  KEY ix_notification_send_notification_id (notification_id),
  KEY ix_notification_send_sender_id (sender_id),
  CONSTRAINT fk_notification_send_notification FOREIGN KEY (notification_id) REFERENCES notification(notification_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_send_sender_users FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 38. notification_inbox
CREATE TABLE notification_inbox (
  inbox_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '인박스 알림 ID',
  user_id          BIGINT       NOT NULL COMMENT '사용자 ID',
  notification_id  BIGINT       NOT NULL COMMENT '알림 메시지 ID',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수신일시',
  target_type      ENUM('EVENT','NOTICE') NULL COMMENT '이동대상 유형',
  target_id        BIGINT       NULL COMMENT '이동대상 ID',
  PRIMARY KEY (inbox_id),
  KEY ix_notification_inbox_user_id (user_id),
  KEY ix_notification_inbox_notification_id (notification_id),
  CONSTRAINT fk_notification_inbox_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_inbox_notification FOREIGN KEY (notification_id) REFERENCES notification(notification_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 39. notification_settings
CREATE TABLE notification_settings (
  user_id         BIGINT   NOT NULL COMMENT '사용자 ID',
  allow_marketing TINYINT  NOT NULL COMMENT '마케팅 수신 동의',
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '변경일시',
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notification_settings_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 40. interests
CREATE TABLE interests (
  interest_id    BIGINT NOT NULL AUTO_INCREMENT COMMENT '관심항목 ID',
  interest_name  ENUM('EVENT','SESSION','EXPERIENCE','BOOTH','CONTEST','NOTICE','SNACK','BATH_SUPPLIES','GROOMING','TOY','CLOTHING','HEALTH','TRAINING','WALK','SUPPLEMENTS','ACCESSORIES','OTHERS') NOT NULL COMMENT '관심항목명',
  type           ENUM('SYSTEM','USER') NOT NULL COMMENT '분류',
  is_active      TINYINT NOT NULL COMMENT '사용 여부',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (interest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 41. user_interest_subscriptions
CREATE TABLE user_interest_subscriptions (
  subscription_id  BIGINT NOT NULL AUTO_INCREMENT COMMENT '구독 ID',
  user_id          BIGINT NOT NULL COMMENT '사용자 ID',
  interest_id      BIGINT NOT NULL COMMENT '관심항목 ID',
  allow_inapp      TINYINT NOT NULL COMMENT '인앱 알림',
  allow_email      TINYINT NOT NULL COMMENT '이메일 수신',
  allow_sms        TINYINT NOT NULL COMMENT 'SMS 수신',
  status           ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL COMMENT '구독 상태',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '구독 시작일시',
  PRIMARY KEY (subscription_id),
  UNIQUE KEY uq_user_interest_subscriptions_user_interest (user_id, interest_id),
  KEY ix_user_interest_subscriptions_user_id (user_id),
  KEY ix_user_interest_subscriptions_interest_id (interest_id),
  CONSTRAINT fk_user_interest_subscriptions_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_interest_subscriptions_interest FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 42. event_interest_map
CREATE TABLE event_interest_map (
  event_interest_map_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '이벤트-관심 매핑 ID',
  event_id              BIGINT NOT NULL COMMENT '행사 ID',
  interest_id           BIGINT NOT NULL COMMENT '관심항목 ID',
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (event_interest_map_id),
  UNIQUE KEY uk_event_interest (event_id, interest_id),
  KEY idx_interest_event (interest_id, event_id),
  CONSTRAINT fk_eim_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eim_interest FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 43. email_verification_token
CREATE TABLE email_verification_token (
  email_verification_token_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email_verification_token_id),
  UNIQUE KEY uk_evt_token_hash (token_hash),
  KEY ix_evt_user_id_created_at (user_id, created_at),
  CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 44. phone_verification_token
CREATE TABLE phone_verification_token (
  phone_verification_token_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phone_verification_token_id),
  UNIQUE KEY uk_pvt_code_hash (code_hash),
  KEY ix_pvt_user_phone_created_at (user_id, phone, created_at),
  CONSTRAINT fk_pvt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 45. signup_sessions
CREATE TABLE signup_sessions (
  signup_session_id      BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원가입 세션 PK',
  signup_key             VARCHAR(36) NOT NULL COMMENT '외부 노출용 UUID',
  signup_type            ENUM('EMAIL','SOCIAL') NOT NULL COMMENT '가입 타입',
  social_provider        VARCHAR(30) NULL COMMENT 'SOCIAL 제공자',
  social_provider_uid    VARCHAR(255) NULL COMMENT 'SOCIAL 제공자 UID',
  email                  VARCHAR(255) NULL COMMENT 'EMAIL 가입 이메일',
  password_hash          VARCHAR(255) NULL COMMENT '비밀번호 해시',
  nickname               VARCHAR(30)  NOT NULL COMMENT '닉네임',
  phone                  VARCHAR(30)  NOT NULL COMMENT '휴대폰 번호',
  otp_status             ENUM('PENDING','VERIFIED','EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'OTP 상태',
  otp_verified_at        DATETIME NULL COMMENT '인증 완료 시각',
  otp_last_sent_at       DATETIME NULL COMMENT '마지막 발송 시각',
  otp_code_hash          VARCHAR(128) NULL COMMENT '코드 해시',
  otp_expires_at         DATETIME NULL COMMENT '만료 시각',
  otp_fail_count         INT NOT NULL DEFAULT 0 COMMENT '실패 횟수',
  otp_blocked_until      DATETIME NULL COMMENT '차단 종료 시각',
  email_status           ENUM('PENDING','VERIFIED','NOT_REQUIRED') NOT NULL DEFAULT 'PENDING' COMMENT '이메일 인증 상태',
  email_verified_at      DATETIME NULL COMMENT '이메일 인증 완료 시각',
  email_code_hash        VARCHAR(128) NULL COMMENT '이메일 인증코드 해시',
  email_expires_at       DATETIME NULL COMMENT '이메일 인증코드 만료 시각',
  email_last_sent_at     DATETIME NULL COMMENT '발송 시각',
  email_fail_count       INT NOT NULL DEFAULT 0 COMMENT '실패 횟수',
  expires_at             DATETIME NOT NULL COMMENT '세션 만료',
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시각',
  PRIMARY KEY (signup_session_id),
  UNIQUE KEY uk_signup_sessions_signup_key (signup_key),
  KEY idx_signup_sessions_phone (phone),
  KEY idx_signup_sessions_email (email),
  KEY idx_signup_sessions_otp_last_sent_at (otp_last_sent_at),
  KEY idx_signup_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 46. admin_logs
CREATE TABLE admin_logs (
  log_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '관리자 로그 ID',
  admin_id    BIGINT       NOT NULL COMMENT '관리자 ID',
  action      VARCHAR(255) NOT NULL COMMENT '작업 내용',
  target_type ENUM('USER','EVENT','PROGRAM','BOOTH','NOTICE','PAYMENT','REFUND','REVIEW','POST','QNA','INQUIRY','GALLERY','QR','SYSTEM','OTHER') NULL COMMENT '작업 대상의 유형',
  target_id   BIGINT       NULL COMMENT '작업 대상의 ID',
  ip_address  VARCHAR(50)  NULL COMMENT '요청 IP',
  result      ENUM('SUCCESS','FAIL') NOT NULL DEFAULT 'SUCCESS' COMMENT '성공 여부',
  error_code  VARCHAR(50)  NULL COMMENT '에러코드',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수행일시',
  PRIMARY KEY (log_id),
  KEY ix_admin_logs_admin_id (admin_id),
  CONSTRAINT fk_admin_logs_admin_users FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 47. refresh_token
CREATE TABLE refresh_token (
  refresh_token_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '리프레시 토큰 ID',
  user_id          BIGINT NOT NULL COMMENT '사용자 ID',
  token            VARCHAR(500) NOT NULL COMMENT '리프레시 토큰',
  expired_at       DATETIME NOT NULL COMMENT '만료일시',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (refresh_token_id),
  UNIQUE KEY uk_refresh_token_token (token),
  KEY ix_refresh_token_user_id (user_id),
  KEY ix_refresh_token_expired_at (expired_at),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;