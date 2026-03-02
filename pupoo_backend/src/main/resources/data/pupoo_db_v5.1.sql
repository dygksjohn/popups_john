-- =========================================================
-- 0) pupoo_v5.1
--    v5.0 → v5.1 변경사항:
--    - event_program 테이블에 image_url (LONGTEXT) 컬럼 추가
-- =========================================================


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

-- 4. event (UPDATED: base_fee 추가)
CREATE TABLE event (
  event_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '행사 ID',
  event_name   VARCHAR(255)  NOT NULL COMMENT '행사명',
  description  VARCHAR(1000) NOT NULL COMMENT '행사 설명',
  start_at     DATETIME      NOT NULL COMMENT '시작일시',
  end_at       DATETIME      NOT NULL COMMENT '종료일시',
  location     VARCHAR(255)  NULL COMMENT '주소 / 장소',
  status       ENUM('PLANNED','ONGOING','ENDED','CANCELLED') NOT NULL COMMENT '행사 상태',
  round_no     INT           NULL COMMENT '회차',

  base_fee     DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '행사 기본 참가비(입장권/참가비)',

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
    GENERATED ALWAYS AS (CASE WHEN status IN ('APPLIED','APPROVED') THEN 1 ELSE NULL END) STORED
    COMMENT 'APPLIED/APPROVED 상태면 1, 아니면 NULL (활성 중복 방지용)',
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

-- 7. event_program (v5.1: image_url 컬럼 추가)
CREATE TABLE event_program (
  program_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '프로그램 ID',
  event_id       BIGINT        NOT NULL COMMENT '행사 ID',
  category       ENUM('CONTEST','SESSION','EXPERIENCE') NOT NULL COMMENT '프로그램 카테고리',
  program_title  VARCHAR(255)  NOT NULL COMMENT '프로그램 제목',
  description    VARCHAR(1000) NOT NULL COMMENT '프로그램 설명',
  start_at       DATETIME      NOT NULL COMMENT '시작일시',
  end_at         DATETIME      NOT NULL COMMENT '종료일시',
  booth_id       BIGINT        NULL COMMENT '프로그램 위치(booths.booth_id)',
  image_url      LONGTEXT      NULL COMMENT '세션 이미지(base64/URL)',
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
  user_id             BIGINT        NOT NULL COMMENT '작성자 사용자 ID',
  gallery_title       VARCHAR(255)  NOT NULL COMMENT '갤러리 제목',
  gallery_description VARCHAR(1000) NULL COMMENT '갤러리 본문',
  view_count          INT           NULL COMMENT '조회수',
  thumbnail_image_id  BIGINT        NULL COMMENT '대표 이미지 ID',
  gallery_status      ENUM('PUBLIC','PRIVATE','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC' COMMENT '갤러리 상태',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (gallery_id),
  KEY ix_galleries_event_id (event_id),
  KEY ix_galleries_user_id (user_id),
  KEY ix_galleries_thumbnail_image_id (thumbnail_image_id),
  CONSTRAINT fk_galleries_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_galleries_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
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
  board_type    ENUM('FREE','INFO','REVIEW','QNA','FAQ') NOT NULL COMMENT '게시판 유형',
  is_active     TINYINT      NOT NULL DEFAULT 1 COMMENT '활성 여부',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (board_id)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. posts (★ answer_content, answered_at 2개 컬럼 추가)
CREATE TABLE posts (
  post_id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '게시글 ID',
  board_id            BIGINT        NOT NULL COMMENT '게시판 ID',
  user_id             BIGINT        NOT NULL COMMENT '사용자 ID',
  post_title          VARCHAR(255)  NOT NULL COMMENT '제목',
  content             TEXT          NOT NULL COMMENT '내용',
  answer_content      TEXT          NULL COMMENT '운영자 답변 내용(QnA용)',
  answered_at         DATETIME      NULL COMMENT '답변 작성/수정 일시',
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

-- 23. files (UPDATED)
CREATE TABLE files (
  file_id            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '파일 ID',
  original_name      VARCHAR(255)  NOT NULL COMMENT '원본 파일명',
  stored_name        VARCHAR(255)  NOT NULL COMMENT '유니크 파일명',

  -- ✅ 추가: 업로더
  user_id            BIGINT        NOT NULL COMMENT '업로더 사용자 ID',

  post_id            BIGINT        NULL COMMENT '게시글 ID',
  notice_id          BIGINT        NULL COMMENT '공지 ID',

  -- ✅ 추가: soft-delete / 삭제 메타
  deleted_at         DATETIME      NULL COMMENT '삭제일시(soft delete)',
  deleted_by         BIGINT        NULL COMMENT '삭제한 사용자 ID',
  delete_reason      VARCHAR(255)  NULL COMMENT '삭제 사유',
  object_deleted_at  DATETIME      NULL COMMENT '원본 객체 삭제일시(게시글/공지 삭제 시점 기록)',

  PRIMARY KEY (file_id),

  UNIQUE KEY uk_files_stored_name (stored_name),

  KEY ix_files_post_id (post_id),
  KEY ix_files_notice_id (notice_id),

  -- 기존 정책: 게시글/공지 각각 1개 첨부 허용
  UNIQUE KEY uk_files_post_id (post_id),
  UNIQUE KEY uk_files_notice_id (notice_id),

  -- ✅ 추가: 조회 성능용 인덱스
  KEY idx_files_post_id_deleted_at (post_id, deleted_at),
  KEY idx_files_notice_id_deleted_at (notice_id, deleted_at),
  KEY idx_files_deleted_at_object_deleted_at (deleted_at, object_deleted_at),

  CONSTRAINT fk_files_posts
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_files_notices
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id)
    ON DELETE CASCADE ON UPDATE CASCADE

  -- 참고: user_id / deleted_by FK는 운영정책(더미 0 사용 여부) 확정 후 추가 권장
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
  is_comment_enabled TINYINT NOT NULL DEFAULT 0 COMMENT '댓글 허용 여부',
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

-- 31. payments 
CREATE TABLE payments (
  payment_id      BIGINT         NOT NULL AUTO_INCREMENT COMMENT '결제 ID',
  user_id         BIGINT         NOT NULL COMMENT '사용자 ID',
  event_id        BIGINT         NULL COMMENT '행사 ID(조회 편의용)',
  event_apply_id  BIGINT         NOT NULL COMMENT '행사 신청 ID(event_apply.apply_id)',

  order_no        VARCHAR(50)    NOT NULL COMMENT '주문번호',
  amount          DECIMAL(10,2)  NOT NULL COMMENT '결제금액',
  payment_method  ENUM('KAKAOPAY','CARD','BANK','OTHER') NOT NULL COMMENT '결제수단',
  status          ENUM('REQUESTED','APPROVED','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'REQUESTED' COMMENT '결제상태',
  requested_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제요청일시',

  active_flag     TINYINT
    GENERATED ALWAYS AS (CASE WHEN status IN ('REQUESTED','APPROVED') THEN 1 ELSE NULL END) STORED
    COMMENT '활성 결제 플래그',

  PRIMARY KEY (payment_id),

  UNIQUE KEY uk_payments_order_no (order_no),

  -- ✅ 신청 1건당 활성 결제(REQUESTED/APPROVED) 1건만 허용
  UNIQUE KEY uk_payments_event_apply_active (event_apply_id, active_flag),

  KEY ix_payments_user_id (user_id),
  KEY ix_payments_event_id (event_id),
  KEY ix_payments_event_apply_id (event_apply_id),

  CONSTRAINT fk_payments_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_payments_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_payments_event_apply
    FOREIGN KEY (event_apply_id) REFERENCES event_apply(apply_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

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


-- =========================================================
-- Pupoo Database Seed Data (Full Version: 47 Tables x 5 Rows)
-- =========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------
INSERT INTO users (user_id, email, password, nickname, phone, status, role_name, show_age, show_gender, show_pet, email_verified, phone_verified) VALUES
(1, 'admin@pupoo.com', '$2a$10$9SFUWtS0qjzjRdZXSQbGPeEaAHjmxHbdTuSb/TxPLu.sNqJfuix6K', '푸푸관리자', '010-0000-0001', 'ACTIVE', 'ADMIN', 0, 0, 0, 1, 1),
(2, 'kw.nam92@example.com', '$2a$10$abcdefghijklmnopqrstuv', '남광우', '010-1234-5678', 'ACTIVE', 'USER', 1, 1, 1, 1, 1),
(3, 'choco@example.com', '$2a$10$abcdefghijklmnopqrstuv', '초코맘', '010-1111-2222', 'ACTIVE', 'USER', 0, 1, 1, 1, 1),
(4, 'dangdang@example.com', '$2a$10$abcdefghijklmnopqrstuv', '댕댕파파', '010-3333-4444', 'ACTIVE', 'USER', 1, 0, 1, 1, 1),
(5, 'bori@example.com', '$2a$10$abcdefghijklmnopqrstuv', '보리언니', '010-5555-6666', 'ACTIVE', 'USER', 1, 1, 1, 1, 1);

-- ---------------------------------------------------------
-- 2. social_account
-- ---------------------------------------------------------
INSERT INTO social_account (social_id, user_id, provider, provider_uid) VALUES
(1, 1, 'KAKAO', 'kakao_admin_001'),
(2, 2, 'KAKAO', 'kakao_1234567890'),
(3, 3, 'NAVER', 'naver_abcdefg123'),
(4, 4, 'GOOGLE', 'google_zxcvbnm'),
(5, 5, 'APPLE', 'apple_qwertyuiop');

-- ---------------------------------------------------------
-- 3. pet
-- ---------------------------------------------------------
INSERT INTO pet (pet_id, user_id, pet_name, pet_breed, pet_age, pet_weight) VALUES
(1, 2, '마루', 'DOG', 4, 'M'),
(2, 3, '초코', 'DOG', 2, 'S'),
(3, 4, '치즈', 'CAT', 5, 'S'),
(4, 5, '보리', 'DOG', 3, 'M'),
(5, 5, '율무', 'DOG', 1, 'XS');

-- ---------------------------------------------------------
-- 4. event
-- ---------------------------------------------------------
INSERT INTO event
  (event_id, event_name, description, start_at, end_at, location, status, round_no, base_fee)
VALUES
(1, '2026 서울 펫페어 코엑스', '국내 최대 규모 반려동물 박람회', '2026-03-15 10:00:00', '2026-03-17 18:00:00', '코엑스 A홀', 'PLANNED', 1, 15000.00),
(2, '댕댕이 런 2026 (봄 시즌)', '반려견과 함께 달리는 이색 마라톤', '2026-04-10 09:00:00', '2026-04-10 14:00:00', '반포한강공원', 'PLANNED', 2, 35000.00),
(3, '제1회 푸푸 어질리티 챔피언십', '전국 최고의 날쌘돌이를 가리는 대회', '2026-02-20 10:00:00', '2026-02-21 17:00:00', '킨텍스 야외전시장', 'ENDED',   1, 35000.00),
(4, '푸푸 펫 아카데미 특강', '전문 훈련사와 함께하는 행동 교정', '2026-05-01 13:00:00', '2026-05-01 16:00:00', '푸푸 교육센터', 'PLANNED', 1, 50000.00),
(5, '여름맞이 펫캉스 페스티벌', '반려견 동반 수영장 오픈 파티', '2026-07-15 11:00:00', '2026-07-20 20:00:00', '가평 펫리조트', 'PLANNED', 1, 0.00);

-- ---------------------------------------------------------
-- 5. event_apply
-- ---------------------------------------------------------
INSERT INTO event_apply (apply_id, user_id, event_id, status) VALUES
(1, 2, 1, 'APPROVED'),
(2, 3, 1, 'APPROVED'),
(3, 4, 2, 'APPLIED'),
(4, 5, 3, 'APPROVED'),
(5, 2, 4, 'APPLIED');

-- ---------------------------------------------------------
-- 6. booths
-- ---------------------------------------------------------
INSERT INTO booths (booth_id, event_id, place_name, type, description, company, zone, status) VALUES
(1, 1, 'A-01', 'BOOTH_COMPANY', '프리미엄 사료 전시', '푸푸푸드', 'ZONE_A', 'OPEN'),
(2, 1, 'A-02', 'BOOTH_SALE', '강아지 의류 할인', '댕댕어패럴', 'ZONE_A', 'OPEN'),
(3, 1, 'B-01', 'BOOTH_EXPERIENCE', '행동교정 상담소', '개과천선 훈련소', 'ZONE_B', 'OPEN'),
(4, 1, 'C-01', 'STAGE', '메인 이벤트 스테이지', '푸푸 운영본부', 'ZONE_C', 'OPEN'),
(5, 2, '야외-01', 'BOOTH_FOOD', '반려견 전용 멍푸치노', '멍다방', 'OTHER', 'OPEN');

-- ---------------------------------------------------------
-- 7. event_program
-- ---------------------------------------------------------
INSERT INTO event_program (program_id, event_id, category, program_title, description, start_at, end_at, booth_id) VALUES
(1, 1, 'SESSION', '건강한 식습관 만들기', '수의사 맞춤 영양 관리 세미나', '2026-03-15 14:00:00', '2026-03-15 15:30:00', 4),
(2, 1, 'CONTEST', '댕댕이 장기자랑 대회', '가장 똑똑한 강아지를 찾습니다.', '2026-03-16 13:00:00', '2026-03-16 15:00:00', 4),
(3, 1, 'EXPERIENCE', '터그놀이 올바르게 하는 법', '1:1 터그놀이 체험', '2026-03-17 11:00:00', '2026-03-17 12:00:00', 3),
(4, 2, 'EXPERIENCE', '미니 어질리티 체험존', '가볍게 몸을 푸는 장애물 코스', '2026-04-10 09:30:00', '2026-04-10 11:00:00', 5),
(5, 3, 'CONTEST', '어질리티 챔피언 결승전', '대망의 결승전 경기', '2026-02-21 15:00:00', '2026-02-21 17:00:00', NULL);

-- ---------------------------------------------------------
-- 8. event_program_apply
-- ---------------------------------------------------------
INSERT INTO event_program_apply (program_apply_id, program_id, user_id, status, ticket_no, eta_min, cancelled_at) VALUES
(1, 1, 2, 'APPROVED', 'T-001', 10, NULL),
(2, 2, 3, 'WAITING', 'T-002', 0, NULL),
(3, 3, 4, 'APPLIED', 'T-003', 5, NULL),
(4, 1, 5, 'CHECKED_IN', 'T-004', 0, NULL),
(5, 4, 2, 'CANCELLED', 'T-005', 0, '2026-02-24 10:00:00');

-- ---------------------------------------------------------
-- 9. event_history
-- ---------------------------------------------------------
INSERT INTO event_history (history_id, user_id, event_id, program_id, joined_at) VALUES
(1, 2, 3, 5, '2026-02-21 14:00:00'),
(2, 3, 3, 5, '2026-02-21 14:00:00'),
(3, 4, 3, 5, '2026-02-21 14:00:00'),
(4, 5, 3, 5, '2026-02-21 14:00:00'),
(5, 2, 1, 1, '2026-03-15 13:50:00');

-- ---------------------------------------------------------
-- 10. program_participation_stats
-- ---------------------------------------------------------
INSERT INTO program_participation_stats (user_id, program_id, participate_count, last_participated_at) VALUES
(2, 1, 1, '2026-03-15 14:00:00'),
(3, 1, 2, '2026-03-15 14:00:00'),
(4, 2, 1, '2026-03-16 13:00:00'),
(5, 3, 3, '2026-03-17 11:00:00'),
(2, 5, 1, '2026-02-21 15:00:00');

-- ---------------------------------------------------------
-- 11. contest_votes
-- ---------------------------------------------------------
INSERT INTO contest_votes (vote_id, program_id, program_apply_id, user_id, status, cancelled_at) VALUES
(1, 2, 2, 2, 'ACTIVE', NULL),
(2, 2, 2, 4, 'ACTIVE', NULL),
(3, 2, 2, 5, 'ACTIVE', NULL),
(4, 5, 4, 3, 'ACTIVE', NULL),
(5, 5, 4, 2, 'CANCELLED', '2026-02-21 16:00:00');

-- ---------------------------------------------------------
-- 12. speakers
-- ---------------------------------------------------------
INSERT INTO speakers (speaker_id, speaker_name, speaker_bio, speaker_email, speaker_phone) VALUES
(1, '강형욱', '반려견 행동 교정 전문가', 'kang@example.com', '010-1111-0001'),
(2, '설채현', '행동학 전문 수의사', 'seol@example.com', '010-1111-0002'),
(3, '이찬종', '이삭애견훈련소 소장', 'lee@example.com', '010-1111-0003'),
(4, '김명철', '고양이 전문 수의사', 'kim@example.com', '010-1111-0004'),
(5, '박정훈', '어질리티 국가대표', 'park@example.com', '010-1111-0005');

-- ---------------------------------------------------------
-- 13. program_speakers
-- ---------------------------------------------------------
INSERT INTO program_speakers (program_id, speaker_id) VALUES
(1, 2),
(3, 1),
(4, 5),
(5, 5),
(2, 3);

-- ---------------------------------------------------------
-- 14. booth_waits
-- ---------------------------------------------------------
INSERT INTO booth_waits (wait_id, booth_id, wait_count, wait_min) VALUES
(1, 1, 15, 30),
(2, 2, 5, 10),
(3, 3, 20, 45),
(4, 4, 0, 0),
(5, 5, 8, 15);

-- ---------------------------------------------------------
-- 15. experience_waits
-- ---------------------------------------------------------
INSERT INTO experience_waits (wait_id, program_id, wait_count, wait_min) VALUES
(1, 1, 0, 0),
(2, 2, 10, 20),
(3, 3, 8, 25),
(4, 4, 15, 30),
(5, 5, 0, 0);

-- ---------------------------------------------------------
-- 16. congestions
-- ---------------------------------------------------------
INSERT INTO congestions (congestion_id, program_id, zone, place_name, congestion_level) VALUES
(1, 1, 'ZONE_A', '세미나실 입구', 4),
(2, 2, 'ZONE_C', '메인 스테이지 앞', 3),
(3, 3, 'ZONE_B', '훈련소 체험존', 5),
(4, 4, 'OTHER', '야외 잔디밭', 2),
(5, 5, 'OTHER', '결승전 관람석', 5);

-- ---------------------------------------------------------
-- 17. galleries
-- ---------------------------------------------------------
INSERT INTO galleries (gallery_id, event_id, user_id, gallery_title, gallery_description, view_count, thumbnail_image_id, gallery_status) VALUES
(1, 3, 5, '2026 푸푸 어질리티 현장', '뜨거웠던 대회의 열기!', 1205, 1, 'PUBLIC'),
(2, 1, 4, '펫페어 준비 스케치', '부스 세팅 현장입니다.', 340, 2, 'PUBLIC'),
(3, 2, 1, '댕댕이 런 코스 안내', '미리보는 마라톤 코스', 890, 3, 'PUBLIC'),
(4, 4, 2, '아카데미 수강생 모집', '특강 프리뷰', 150, 4, 'PUBLIC'),
(5, 5, 3, '작년 펫캉스 하이라이트', '올해도 기대해주세요', 2200, 5, 'PUBLIC');

-- ---------------------------------------------------------
-- 18. gallery_images
-- ---------------------------------------------------------
INSERT INTO gallery_images (image_id, gallery_id, original_url, thumb_url, image_order, mime_type, file_size) VALUES
(1, 1, 'https://cdn.pupoo.com/img/gal_01.jpg', 'https://cdn.pupoo.com/img/th_01.jpg', 1, 'jpg', 2048000),
(2, 2, 'https://cdn.pupoo.com/img/gal_02.jpg', 'https://cdn.pupoo.com/img/th_02.jpg', 1, 'jpg', 3015000),
(3, 3, 'https://cdn.pupoo.com/img/gal_03.jpg', 'https://cdn.pupoo.com/img/th_03.jpg', 1, 'png', 1500000),
(4, 4, 'https://cdn.pupoo.com/img/gal_04.jpg', 'https://cdn.pupoo.com/img/th_04.jpg', 1, 'jpg', 2100000),
(5, 5, 'https://cdn.pupoo.com/img/gal_05.jpg', 'https://cdn.pupoo.com/img/th_05.jpg', 1, 'jpg', 4200000);

-- ---------------------------------------------------------
-- 19. gallery_likes
-- ---------------------------------------------------------
INSERT INTO gallery_likes (like_id, gallery_id, user_id) VALUES
(1, 1, 2),
(2, 1, 3),
(3, 2, 4),
(4, 3, 5),
(5, 5, 2);

-- ---------------------------------------------------------
-- 20. notices
-- ---------------------------------------------------------
INSERT INTO notices (notice_id, scope, event_id, notice_title, content, file_attached, is_pinned, status, created_by_admin_id) VALUES
(1, 'ALL', NULL, '푸푸 서비스 점검 안내', '새벽 2시~4시 점검 진행', 'N', 1, 'PUBLISHED', 1),
(2, 'EVENT', 1, '[필독] 예방접종 증명서 지참', '광견병 증명서 필수', 'N', 1, 'PUBLISHED', 1),
(3, 'ALL', NULL, '신규 가입 이벤트', '지금 가입하면 5천 포인트', 'Y', 0, 'PUBLISHED', 1),
(4, 'EVENT', 2, '우천 시 행사 안내', '우천 시에도 정상 진행됩니다.', 'N', 0, 'PUBLISHED', 1),
(5, 'ALL', NULL, '개인정보 처리방침 변경', '2026년 3월 1일자 적용', 'Y', 0, 'PUBLISHED', 1);

-- ---------------------------------------------------------
-- 21. boards
-- ---------------------------------------------------------
INSERT INTO boards (board_id, board_name, board_type, is_active) VALUES
(1, '자유게시판', 'FREE', 1),
(2, '행사 꿀팁/정보', 'INFO', 1),
(3, '방문 후기', 'REVIEW', 1),
(4, '질문과 답변', 'QNA', 1),
(5, '건의사항', 'FREE', 1);

-- ---------------------------------------------------------
-- 22. posts
-- ---------------------------------------------------------
INSERT INTO posts (post_id, board_id, user_id, post_title, content, file_attached, status, view_count) VALUES
(1, 1, 2, '마루 옷 샀어요!', '너무 귀엽지 않나요?', 'Y', 'PUBLISHED', 42),
(2, 2, 3, '주차 꿀팁 안내', '공영주차장 이용 추천', 'N', 'PUBLISHED', 156),
(3, 3, 4, '어질리티 후기', '멋진 강아지들 많네요.', 'Y', 'PUBLISHED', 89),
(4, 4, 5, '동반입장 질문', '마리수 제한 있나요?', 'N', 'PUBLISHED', 12),
(5, 5, 2, '앱 속도 개선 건의', '조금 느린 것 같습니다.', 'Y', 'PUBLISHED', 5);

-- ---------------------------------------------------------
-- 23. files
-- ---------------------------------------------------------
INSERT INTO files (file_id, original_name, stored_name, user_id, post_id, notice_id) VALUES
(1, 'maru.jpg',         'uuid_maru.jpg',     1, 1, NULL),
(2, 'agility.jpg',      'uuid_agility.jpg',  1, 3, NULL),
(3, 'error.png',        'uuid_error.png',    1, 5, NULL),
(4, 'event_banner.png', 'uuid_banner.png',   1, NULL, 3),
(5, 'privacy_v2.pdf',   'uuid_privacy.pdf',  1, NULL, 5);

-- ---------------------------------------------------------
-- 24. post_comments
-- ---------------------------------------------------------
INSERT INTO post_comments (comment_id, post_id, user_id, content) VALUES
(1, 1, 3, '찰떡이네요!'),
(2, 1, 4, '어디서 사셨나요?'),
(3, 2, 5, '좋은 정보 감사합니다.'),
(4, 4, 2, '보통 1인당 2마리입니다.'),
(5, 5, 1, '의견 감사합니다. 반영하겠습니다.');

-- ---------------------------------------------------------
-- 25. board_banned_words
-- ---------------------------------------------------------
INSERT INTO board_banned_words (banned_word_id, board_id, banned_word) VALUES
(1, 1, '바보'),
(2, 1, '광고문의'),
(3, 2, '도박'),
(4, 3, '사기'),
(5, 4, '욕설');

-- ---------------------------------------------------------
-- 26. content_reports
-- ---------------------------------------------------------
INSERT INTO content_reports (report_id, reporter_user_id, target_type, target_id, reason_code, reason, status) VALUES
(1, 4, 'POST', 1, 'SPAM', '상업적 광고', 'PENDING'),
(2, 2, 'POST_COMMENT', 2, 'ABUSE', '비매너 댓글', 'ACCEPTED'),
(3, 3, 'REVIEW', 3, 'HATE', '혐오 발언', 'REJECTED'),
(4, 5, 'POST', 4, 'FRAUD', '거짓 정보', 'PENDING'),
(5, 1, 'POST', 5, 'OTHER', '도배글', 'PENDING');

-- ---------------------------------------------------------
-- 27. reviews
-- ---------------------------------------------------------
INSERT INTO reviews (review_id, event_id, user_id, rating, content, review_status) VALUES
(1, 3, 2, 5, '최고의 어질리티 대회!', 'PUBLIC'),
(2, 3, 4, 4, '주차가 조금 아쉬워요.', 'PUBLIC'),
(3, 1, 3, 5, '살게 너무 많아서 통장 텅텅', 'PUBLIC'),
(4, 1, 5, 3, '사람이 너무 많아서 힘들었어요', 'PUBLIC'),
(5, 2, 2, 5, '우리 마루랑 뛰어서 행복했어요', 'PUBLIC');

-- ---------------------------------------------------------
-- 28. review_comments
-- ---------------------------------------------------------
INSERT INTO review_comments (comment_id, review_id, user_id, content) VALUES
(1, 1, 3, '맞아요 정말 재밌었어요!'),
(2, 2, 1, '다음 행사엔 주차공간 확충하겠습니다.'),
(3, 3, 2, '저도 지갑 털렸네요 ㅎㅎ'),
(4, 4, 4, '평일에 가면 좀 낫더라고요.'),
(5, 5, 5, '사진 너무 이쁘게 나왔을듯요!');

-- ---------------------------------------------------------
-- 29. inquiries
-- ---------------------------------------------------------
INSERT INTO inquiries (inquiry_id, user_id, category, inquiry_title, content, status) VALUES
(1, 2, 'EVENT', '동반 입장 강아지 마리수?', '한 사람이 두 마리 되나요?', 'CLOSED'),
(2, 4, 'REFUND', '결제 취소 방법', '환불 규정 알려주세요.', 'OPEN'),
(3, 3, 'ACCOUNT', '닉네임 변경', '닉네임 어떻게 바꾸나요?', 'CLOSED'),
(4, 5, 'PAYMENT', '카드 결제 오류', '결제가 튕깁니다.', 'IN_PROGRESS'),
(5, 2, 'OTHER', '봉사활동 지원', '스태프 지원하고 싶어요.', 'OPEN');

-- ---------------------------------------------------------
-- 30. inquiry_answers
-- ---------------------------------------------------------
INSERT INTO inquiry_answers (answer_id, inquiry_id, admin_id, content) VALUES
(1, 1, 1, '1인당 최대 2마리입니다.'),
(2, 3, 1, '마이페이지 > 프로필 수정에서 가능합니다.'),
(3, 4, 1, '현재 PG사 확인 중입니다. 잠시만 기다려주세요.'),
(4, 2, 1, '환불 규정은 고객센터 공지사항을 확인바랍니다.'),
(5, 5, 1, '다음 달 공지사항을 통해 스태프 모집 예정입니다.');

-- ---------------------------------------------------------
-- 31. payments
-- ---------------------------------------------------------
INSERT INTO payments
  (payment_id, user_id, event_id, event_apply_id, order_no, amount, payment_method, status)
VALUES
  (1, 2, 1, 1, 'ORD-001', 15000.00, 'KAKAOPAY', 'APPROVED'),
  (2, 3, 1, 2, 'ORD-002', 15000.00, 'CARD',      'APPROVED'),
  (3, 4, 2, 3, 'ORD-003', 35000.00, 'BANK',     'REQUESTED'),
  (4, 5, 3, 4, 'ORD-004', 35000.00, 'KAKAOPAY', 'REFUNDED'),
  (5, 2, 4, 5, 'ORD-005', 50000.00, 'CARD',     'APPROVED');

-- ---------------------------------------------------------
-- 32. payment_transactions
-- ---------------------------------------------------------
INSERT INTO payment_transactions
  (tx_id, payment_id, pg_provider, pg_tid, status, raw_ready, raw_approve, approved_at, cancelled_at, failed_at)
VALUES
  (1, 1, 'KAKAOPAY', 'TID_001', 'APPROVED',  '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL, NULL),
  (2, 2, 'KAKAOPAY', 'TID_002', 'APPROVED',  '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL, NULL),
  (3, 3, 'KAKAOPAY', 'TID_003', 'READY',     '{"status":"ready"}', NULL,                   NULL,  NULL, NULL),
  (4, 4, 'KAKAOPAY', 'TID_004', 'CANCELLED', '{"status":"ready"}', '{"status":"approved"}', NOW(), NOW(), NULL),
  (5, 5, 'KAKAOPAY', 'TID_005', 'APPROVED',  '{"status":"ready"}', '{"status":"approved"}', NOW(), NULL, NULL);

-- ---------------------------------------------------------
-- 33. refunds
-- ---------------------------------------------------------
INSERT INTO refunds (refund_id, payment_id, refund_amount, reason, status, completed_at) VALUES
(1, 1, 15000.00, '단순 변심', 'REQUESTED', NULL),
(2, 2, 15000.00, '일정 변경', 'REQUESTED', NULL),
(3, 3, 35000.00, '결제 수단 변경', 'REJECTED', NULL),
(4, 4, 35000.00, '코로나 확진', 'COMPLETED', '2026-02-23 10:00:00'),
(5, 5, 50000.00, '중복 결제', 'REQUESTED', NULL);

-- ---------------------------------------------------------
-- 34. qr_codes
-- ---------------------------------------------------------
INSERT INTO qr_codes (qr_id, user_id, event_id, original_url, mime_type, issued_at, expired_at) VALUES
(1, 2, 1, 'https://pupoo.com/qr/1', 'png', NOW(), '2026-12-31 00:00:00'),
(2, 3, 1, 'https://pupoo.com/qr/2', 'png', NOW(), '2026-12-31 00:00:00'),
(3, 4, 2, 'https://pupoo.com/qr/3', 'png', NOW(), '2026-12-31 00:00:00'),
(4, 5, 3, 'https://pupoo.com/qr/4', 'png', NOW(), '2026-12-31 00:00:00'),
(5, 2, 4, 'https://pupoo.com/qr/5', 'png', NOW(), '2026-12-31 00:00:00');

-- ---------------------------------------------------------
-- 35. qr_logs
-- ---------------------------------------------------------
INSERT INTO qr_logs (log_id, qr_id, booth_id, check_type) VALUES
(1, 1, 4, 'CHECKIN'),
(2, 1, 1, 'CHECKIN'),
(3, 2, 2, 'CHECKIN'),
(4, 1, 4, 'CHECKOUT'),
(5, 4, 5, 'CHECKIN');

-- ---------------------------------------------------------
-- 36. notification
-- ---------------------------------------------------------
INSERT INTO notification (notification_id, type, notification_title, content) VALUES
(1, 'SYSTEM', '푸푸 가입 환영!', '반려동물과의 행복한 시간'),
(2, 'EVENT', '입장권 발급 완료', 'QR코드를 확인해주세요.'),
(3, 'NOTICE', '서버 점검 안내', '원활한 서비스를 위해 점검합니다.'),
(4, 'PAYMENT', '결제 완료', '정상적으로 결제되었습니다.'),
(5, 'APPLY', '예약 확정 안내', '세미나 예약이 확정되었습니다.');

-- ---------------------------------------------------------
-- 37. notification_send
-- ---------------------------------------------------------
INSERT INTO notification_send (send_id, notification_id, sender_id, sender_type, channel) VALUES
(1, 1, 1, 'SYSTEM', 'APP'),
(2, 2, 1, 'SYSTEM', 'APP'),
(3, 3, 1, 'ADMIN', 'PUSH'),
(4, 4, 1, 'SYSTEM', 'SMS'),
(5, 5, 1, 'SYSTEM', 'EMAIL');

-- ---------------------------------------------------------
-- 38. notification_inbox
-- ---------------------------------------------------------
INSERT INTO notification_inbox (inbox_id, user_id, notification_id, target_type, target_id) VALUES
(1, 2, 1, NULL, NULL),
(2, 2, 2, 'EVENT', 1),
(3, 3, 1, NULL, NULL),
(4, 4, 4, NULL, NULL),
(5, 5, 5, 'EVENT', 3);

-- ---------------------------------------------------------
-- 39. notification_settings
-- ---------------------------------------------------------
INSERT INTO notification_settings (user_id, allow_marketing) VALUES
(1, 1),
(2, 1),
(3, 0),
(4, 1),
(5, 0);

-- ---------------------------------------------------------
-- 40. interests
-- ---------------------------------------------------------
INSERT INTO interests (interest_id, interest_name, type, is_active) VALUES
(1, 'SNACK', 'SYSTEM', 1),
(2, 'TRAINING', 'SYSTEM', 1),
(3, 'CLOTHING', 'SYSTEM', 1),
(4, 'TOY', 'SYSTEM', 1),
(5, 'GROOMING', 'SYSTEM', 1);

-- ---------------------------------------------------------
-- 41. user_interest_subscriptions
-- ---------------------------------------------------------
INSERT INTO user_interest_subscriptions (subscription_id, user_id, interest_id, allow_inapp, allow_email, allow_sms, status) VALUES
(1, 2, 1, 1, 1, 0, 'ACTIVE'),
(2, 2, 2, 1, 0, 0, 'ACTIVE'),
(3, 3, 3, 1, 1, 1, 'ACTIVE'),
(4, 4, 4, 1, 0, 1, 'ACTIVE'),
(5, 5, 5, 0, 0, 0, 'PAUSED');

-- ---------------------------------------------------------
-- 42. event_interest_map
-- ---------------------------------------------------------
INSERT INTO event_interest_map (event_interest_map_id, event_id, interest_id) VALUES
(1, 1, 1),
(2, 1, 3),
(3, 3, 2),
(4, 4, 2),
(5, 1, 4);

-- ---------------------------------------------------------
-- 43. email_verification_token
-- ---------------------------------------------------------
INSERT INTO email_verification_token (email_verification_token_id, user_id, token_hash, expires_at) VALUES
(1, 2, 'hash_email_001', '2026-12-31 00:00:00'),
(2, 3, 'hash_email_002', '2026-12-31 00:00:00'),
(3, 4, 'hash_email_003', '2026-12-31 00:00:00'),
(4, 5, 'hash_email_004', '2026-12-31 00:00:00'),
(5, 2, 'hash_email_005', '2026-12-31 00:00:00');

-- ---------------------------------------------------------
-- 44. phone_verification_token
-- ---------------------------------------------------------
INSERT INTO phone_verification_token (phone_verification_token_id, user_id, phone, code_hash, expires_at) VALUES
(1, 2, '010-1234-5678', 'hash_phone_001', '2026-12-31 00:00:00'),
(2, 3, '010-1111-2222', 'hash_phone_002', '2026-12-31 00:00:00'),
(3, 4, '010-3333-4444', 'hash_phone_003', '2026-12-31 00:00:00'),
(4, 5, '010-5555-6666', 'hash_phone_004', '2026-12-31 00:00:00'),
(5, 2, '010-1234-5678', 'hash_phone_005', '2026-12-31 00:00:00');

-- ---------------------------------------------------------
-- 45. signup_sessions
-- ---------------------------------------------------------
INSERT INTO signup_sessions (signup_session_id, signup_key, signup_type, nickname, phone, otp_status, email_status, expires_at) VALUES
(1, 'uuid-session-001', 'EMAIL', '예비회원1', '010-9999-0001', 'VERIFIED', 'VERIFIED', '2026-12-31 00:00:00'),
(2, 'uuid-session-002', 'SOCIAL', '예비회원2', '010-9999-0002', 'PENDING', 'PENDING', '2026-12-31 00:00:00'),
(3, 'uuid-session-003', 'EMAIL', '예비회원3', '010-9999-0003', 'VERIFIED', 'PENDING', '2026-12-31 00:00:00'),
(4, 'uuid-session-004', 'SOCIAL', '예비회원4', '010-9999-0004', 'EXPIRED', 'NOT_REQUIRED', '2025-12-31 00:00:00'),
(5, 'uuid-session-005', 'EMAIL', '예비회원5', '010-9999-0005', 'PENDING', 'VERIFIED', '2026-12-31 00:00:00');

-- ---------------------------------------------------------
-- 46. admin_logs
-- ---------------------------------------------------------
INSERT INTO admin_logs (log_id, admin_id, action, target_type, target_id, result) VALUES
(1, 1, 'NOTICE_CREATE', 'NOTICE', 1, 'SUCCESS'),
(2, 1, 'INQUIRY_ANSWER', 'INQUIRY', 1, 'SUCCESS'),
(3, 1, 'EVENT_CREATE', 'EVENT', 1, 'SUCCESS'),
(4, 1, 'USER_SUSPEND', 'USER', 5, 'FAIL'),
(5, 1, 'REFUND_APPROVE', 'REFUND', 4, 'SUCCESS');

-- ---------------------------------------------------------
-- 47. refresh_token
-- ---------------------------------------------------------
INSERT INTO refresh_token (refresh_token_id, user_id, token, expired_at) VALUES
(1, 1, 'mock_token_admin', '2026-12-31 00:00:00'),
(2, 2, 'mock_token_user2', '2026-12-31 00:00:00'),
(3, 3, 'mock_token_user3', '2026-12-31 00:00:00'),
(4, 4, 'mock_token_user4', '2026-12-31 00:00:00'),
(5, 5, 'mock_token_user5', '2026-12-31 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;
