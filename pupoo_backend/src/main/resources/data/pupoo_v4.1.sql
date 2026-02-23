-- =========================================================
-- Pupoo DB Schema (MySQL 8.x / InnoDB / utf8mb4)
-- version_pupoo_v4.0
-- 기준: 사용자 제공 "테이블 상세 명세" (최신 컬럼명 반영)
-- =========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =========================================================
-- 0) DROP ALL TABLES (CURRENT DATABASE)
-- =========================================================
SET FOREIGN_KEY_CHECKS = 0;

SET SESSION group_concat_max_len = 1024*1024;

SET @schema := DATABASE();
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') ORDER BY table_name SEPARATOR ', ')
  INTO @tables
  FROM information_schema.tables
 WHERE table_schema = @schema
   AND table_type = 'BASE TABLE';

SET @drop_stmt := IFNULL(CONCAT('DROP TABLE IF EXISTS ', @tables, ';'), 'SELECT 1;');

PREPARE stmt FROM @drop_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =========================================================
-- 1) CREATE TABLES
-- =========================================================

-- 1. users (revised)
CREATE TABLE users (
  user_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '사용자 ID',
  email             VARCHAR(255)  NOT NULL COMMENT '로그인 식별 이메일',
  password          VARCHAR(255)  NOT NULL COMMENT '암호화(해시) 비밀번호',
  nickname          VARCHAR(30)   NOT NULL COMMENT '커뮤니티 표시명 닉네임',
  phone             VARCHAR(30)   NOT NULL COMMENT '휴대전화번호',

  status            ENUM('ACTIVE','SUSPENDED','DELETED')
                    NOT NULL DEFAULT 'ACTIVE' COMMENT '계정 상태',

  role_name         ENUM('USER','ADMIN')
                    NOT NULL DEFAULT 'USER' COMMENT '권한명(USER/ADMIN)',

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

CREATE TABLE event_apply (
  apply_id    BIGINT   NOT NULL AUTO_INCREMENT COMMENT '신청 ID',
  user_id     BIGINT   NOT NULL COMMENT '사용자 ID',
  event_id    BIGINT   NOT NULL COMMENT '행사 ID',
  applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일시',
  status      ENUM('APPLIED','CANCELLED','APPROVED','REJECTED') NOT NULL COMMENT '신청 상태',

  -- ✅ user_id를 참조하지 않는 generated column (FK 가능)
  active_flag TINYINT
    GENERATED ALWAYS AS (CASE WHEN status = 'APPLIED' THEN 1 ELSE NULL END) STORED
    COMMENT 'APPLIED 상태면 1, 아니면 NULL (활성 중복 방지용)',

  PRIMARY KEY (apply_id),

  -- ✅ APPLIED 상태에서만 (event_id, user_id) 1개 강제
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



-- 6. event_program (place_name -> booth_id)
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


-- 7. event_program_apply (v2.8+: CANCELLED/REJECTED 재신청 가능 / 이력 보존)
CREATE TABLE event_program_apply (
  program_apply_id BIGINT   NOT NULL AUTO_INCREMENT COMMENT '프로그램 참가 ID',
  program_id       BIGINT   NOT NULL COMMENT '프로그램 ID',
  user_id          BIGINT   NOT NULL COMMENT '사용자 ID',

  status           ENUM('APPLIED','WAITING','APPROVED','REJECTED','CANCELLED','CHECKED_IN')
                   NOT NULL COMMENT '상태(접수, 대기, 승인, 반려, 취소, 참여확정)',

  -- 티켓(대기) 재활용 필드
  ticket_no        VARCHAR(30) NULL COMMENT '현장 티켓번호(표시용)',
  eta_min          INT NULL COMMENT '예상 대기시간(분)',
  notified_at      DATETIME NULL COMMENT '10분 전 알림 발송 시점(추후 SMS/PUSH 연동)',
  checked_in_at    DATETIME NULL COMMENT '참여 확정(체크인) 시점',

  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  cancelled_at     DATETIME NULL COMMENT '취소일시',

  -- ✅ 활성 상태 = APPLIED/WAITING/APPROVED (REJECTED/CANCELLED/CHECKED_IN는 비활성 → 재신청 가능)
  active_flag      TINYINT
                   GENERATED ALWAYS AS (
                     CASE
                       WHEN status IN ('APPLIED','WAITING','APPROVED') THEN 1
                       ELSE NULL
                     END
                   ) STORED COMMENT '활성 신청 플래그(부분 UNIQUE용)',

  PRIMARY KEY (program_apply_id),

  -- ✅ 활성 신청(active_flag=1)만 program_id+user_id 기준 1개 허용
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

  -- ✅ CANCELLED일 때만 cancelled_at 필수, 그 외는 NULL 강제
  CONSTRAINT ck_event_program_apply_cancelled_at
    CHECK (
      (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
      OR
      (status <> 'CANCELLED' AND cancelled_at IS NULL)
    )

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. event_history
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



-- [ADD] program_participation_stats
-- 목적: (user_id, program_id) 참여 횟수 집계(조회 최적화)
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

-- 9. contest_votes (revised: history preserve + re-vote)
CREATE TABLE contest_votes (
  vote_id           BIGINT   NOT NULL AUTO_INCREMENT COMMENT '콘테스트 투표 ID',
  program_id        BIGINT   NOT NULL COMMENT '프로그램 ID',
  program_apply_id  BIGINT   NOT NULL COMMENT '투표 대상 참가 ID',
  user_id           BIGINT   NOT NULL COMMENT '투표자 사용자 ID',

  voted_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '투표일시',

  -- ✅ 상태 기반 이력 보존(삭제 대신 CANCELLED로 전환)
  status            ENUM('ACTIVE','CANCELLED')
                    NOT NULL DEFAULT 'ACTIVE' COMMENT '투표 상태(ACTIVE/CANCELLED)',

  cancelled_at      DATETIME NULL COMMENT '취소일시(취소 시각)',

  -- ✅ ACTIVE 상태에서만 (program_id, user_id) 1개 강제 (부분 UNIQUE)
  active_flag       TINYINT
    GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE NULL END) STORED
    COMMENT 'ACTIVE면 1, 아니면 NULL (활성 중복 방지용)',

  PRIMARY KEY (vote_id),

  -- ✅ ACTIVE 상태에서만 1인 1표 강제
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

  -- ✅ 취소일시 정합성 (ACTIVE면 cancelled_at NULL, CANCELLED면 NOT NULL)
  CONSTRAINT ck_contest_votes_cancelled_at
    CHECK (
      (status = 'ACTIVE' AND cancelled_at IS NULL)
      OR
      (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
    )

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 10. speakers
CREATE TABLE speakers (
  speaker_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '연사 ID',
  program_id     BIGINT        NOT NULL COMMENT '프로그램 ID',
  speaker_name   VARCHAR(255)  NOT NULL COMMENT '연사 이름',
  speaker_bio    VARCHAR(1000) NOT NULL COMMENT '연사 소개 및 상세 정보',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  speaker_email  VARCHAR(255)  NOT NULL COMMENT '연사 email',
  speaker_phone  VARCHAR(30)   NOT NULL COMMENT '연사 전화번호',
  PRIMARY KEY (speaker_id),
  UNIQUE KEY uk_speakers_email (speaker_email),
  UNIQUE KEY uk_speakers_phone (speaker_phone),
  KEY ix_speakers_program_id (program_id),
  CONSTRAINT fk_speakers_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. booths (as Location master, keep table name)
CREATE TABLE booths (
  booth_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '장소 ID(booths)',
  event_id     BIGINT        NOT NULL COMMENT '행사 ID',

  place_name   VARCHAR(100)  NOT NULL COMMENT '장소명(부스/세션룸/무대 등)',

  type         ENUM(
                 'BOOTH_COMPANY',
                 'BOOTH_EXPERIENCE',
                 'BOOTH_SALE',
                 'BOOTH_FOOD',
                 'BOOTH_INFO',
                 'BOOTH_SPONSOR',
                 'SESSION_ROOM',
                 'CONTEST_ZONE',
                 'STAGE',
                 'ETC'
               ) NOT NULL COMMENT '장소 종류(부스/세션룸/콘테스트존/무대 등)',

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


-- 12. booth_waits
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

-- 13. experience_waits
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

-- 14. congestions  (명세 기준: program_id / zone / place_name)
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

-- 15. galleries
CREATE TABLE `galleries` (
  gallery_id          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '갤러리 ID',
  event_id            BIGINT        NOT NULL COMMENT '행사 ID',
  gallery_title       VARCHAR(255)  NOT NULL COMMENT '갤러리 제목',
  description         VARCHAR(1000) NULL COMMENT '사진 설명',
  view_count          INT           NULL COMMENT '조회수',
  thumbnail_image_id  BIGINT        NULL COMMENT '대표 이미지 ID (gallery_images.image_id)',
  gallery_status      ENUM('PUBLIC','PRIVATE','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC' COMMENT '갤러리 상태',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (gallery_id),
  KEY ix_galleries_event_id (event_id),
  KEY ix_galleries_thumbnail_image_id (thumbnail_image_id),
  CONSTRAINT fk_galleries_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- 16. gallery_images
CREATE TABLE gallery_images (
  image_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '이미지 ID',
  gallery_id    BIGINT        NOT NULL COMMENT '갤러리 ID',
  original_url  VARCHAR(500)  NOT NULL COMMENT '원본 이미지 경로(URL)',
  thumb_url     VARCHAR(500)  NULL COMMENT '썸네일 이미지 경로(URL)',
  image_order   INT           NULL COMMENT '이미지 정렬 순서(1..N)',
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg')   NULL COMMENT '파일 타입 (image/jpeg 등)',
  file_size     INT           NULL COMMENT '파일 크기(byte)',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  PRIMARY KEY (image_id),
  KEY ix_gallery_images_gallery_id (gallery_id),
  CONSTRAINT fk_gallery_images_gallery
    FOREIGN KEY (gallery_id) REFERENCES galleries(gallery_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- galleries.thumbnail_image_id -> gallery_images.image_id (순환 방지 위해 ALTER로 추가)
ALTER TABLE galleries
  ADD CONSTRAINT fk_galleries_thumbnail_image
    FOREIGN KEY (thumbnail_image_id) REFERENCES gallery_images(image_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 17. gallery_likes
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

-- 18. notices
CREATE TABLE notices (
  notice_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '공지 ID',
  scope               VARCHAR(20)   NOT NULL COMMENT '공지 범위',
  event_id            BIGINT        NULL COMMENT '행사 ID',
  notice_title        VARCHAR(255)  NOT NULL COMMENT '공지 제목',
  content             VARCHAR(1000) NOT NULL COMMENT '공지 내용',
  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N' COMMENT '첨부파일 존재 여부(Y, N)',
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

-- 19. boards
CREATE TABLE boards (
  board_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '게시판 ID',
  board_name    VARCHAR(50)  NOT NULL COMMENT '게시판명',
  board_type    ENUM('FREE','INFO','REVIEW','QNA') NOT NULL COMMENT '게시판 유형',
  is_active     TINYINT      NOT NULL DEFAULT 1 COMMENT '활성 여부(0,1)',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (board_id)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- posts
CREATE TABLE posts (
  post_id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '게시글 ID',
  board_id            BIGINT        NOT NULL COMMENT '게시판 ID',
  user_id             BIGINT        NOT NULL COMMENT '사용자 ID',

  post_title          VARCHAR(255)  NOT NULL COMMENT '게시글 제목',
  content             TEXT          NOT NULL COMMENT '게시글 내용',

  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N' COMMENT '첨부파일 존재 여부(Y, N)',

  status              ENUM('DRAFT','PUBLISHED','HIDDEN')
                      NOT NULL DEFAULT 'PUBLISHED' COMMENT '게시 상태',

  view_count          INT           NOT NULL DEFAULT 0 COMMENT '조회수',

  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

  is_deleted          TINYINT       NOT NULL DEFAULT 0 COMMENT '삭제 여부(0,1)',
  is_comment_enabled  TINYINT       NOT NULL DEFAULT 1 COMMENT '댓글 사용 여부(0,1)',

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


-- 21. files (게시글/공지 첨부 파일) - 1개 첨부 정책
--  - MySQL 8에서 FK 컬럼을 CHECK에 쓰면(특히 referential action) Error 3823이 날 수 있어
--    XOR 강제는 TRIGGER로 처리
CREATE TABLE files (
  file_id        BIGINT        NOT NULL AUTO_INCREMENT COMMENT '파일 고유 식별자',
  original_name  VARCHAR(255)  NOT NULL COMMENT '사용자가 업로드한 원본 파일명',
  stored_name    VARCHAR(255)  NOT NULL COMMENT '저장되는 유니크 파일명',
  post_id        BIGINT        NULL COMMENT '게시글 ID',
  notice_id      BIGINT        NULL COMMENT '공지 ID',
  PRIMARY KEY (file_id),
  UNIQUE KEY uk_files_stored_name (stored_name),
  KEY ix_files_post_id (post_id),
  KEY ix_files_notice_id (notice_id),
  -- ✅ 첨부 1개 정책이면 유지 (여러개 허용으로 바꿀 거면 아래 2개 UNIQUE 제거)
  UNIQUE KEY uk_files_post_id (post_id),
  UNIQUE KEY uk_files_notice_id (notice_id),
  CONSTRAINT fk_files_posts
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_files_notices
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21-1) files XOR + file_attached 자동 동기화 (TRIGGER)
DROP TRIGGER IF EXISTS trg_files_bi_owner_one;
DROP TRIGGER IF EXISTS trg_files_bu_owner_one;
DROP TRIGGER IF EXISTS trg_files_ai_set_attached;
DROP TRIGGER IF EXISTS trg_files_ad_unset_attached;

DELIMITER $$

CREATE TRIGGER trg_files_bi_owner_one
BEFORE INSERT ON files
FOR EACH ROW
BEGIN
  IF (NEW.post_id IS NULL AND NEW.notice_id IS NULL)
     OR (NEW.post_id IS NOT NULL AND NEW.notice_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'files: either post_id or notice_id must be set (only one).';
  END IF;
END$$

CREATE TRIGGER trg_files_bu_owner_one
BEFORE UPDATE ON files
FOR EACH ROW
BEGIN
  IF (NEW.post_id IS NULL AND NEW.notice_id IS NULL)
     OR (NEW.post_id IS NOT NULL AND NEW.notice_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'files: either post_id or notice_id must be set (only one).';
  END IF;
END$$

CREATE TRIGGER trg_files_ai_set_attached
AFTER INSERT ON files
FOR EACH ROW
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE posts SET file_attached = 'Y' WHERE post_id = NEW.post_id;
  ELSE
    UPDATE notices SET file_attached = 'Y' WHERE notice_id = NEW.notice_id;
  END IF;
END$$

CREATE TRIGGER trg_files_ad_unset_attached
AFTER DELETE ON files
FOR EACH ROW
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM files WHERE post_id = OLD.post_id) = 0 THEN
      UPDATE posts SET file_attached = 'N' WHERE post_id = OLD.post_id;
    END IF;
  ELSE
    IF (SELECT COUNT(*) FROM files WHERE notice_id = OLD.notice_id) = 0 THEN
      UPDATE notices SET file_attached = 'N' WHERE notice_id = OLD.notice_id;
    END IF;
  END IF;
END$$

DELIMITER ;

-- 22. post_comments
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

-- 23. board_banned_words
CREATE TABLE board_banned_words (
  banned_word_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '금칙어 ID',
  board_id        BIGINT       NOT NULL COMMENT '게시판 ID',

  banned_word     VARCHAR(100) NOT NULL COMMENT '금칙어',
  banned_word_norm VARCHAR(100)
    GENERATED ALWAYS AS (LOWER(TRIM(banned_word))) STORED COMMENT '정규화 금칙어(중복 방지)',

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',

  PRIMARY KEY (banned_word_id),

  UNIQUE KEY uk_board_banned_words_board_word (board_id, banned_word_norm),
  KEY ix_board_banned_words_board_id (board_id),

  CONSTRAINT fk_board_banned_words_boards
    FOREIGN KEY (board_id) REFERENCES boards(board_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 23-1. content_reports (신고)
CREATE TABLE content_reports (
  report_id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '신고 ID',
  reporter_user_id     BIGINT       NOT NULL COMMENT '신고자 사용자 ID',

  target_type          ENUM('POST','REVIEW','POST_COMMENT','REVIEW_COMMENT')  NOT NULL COMMENT '신고 대상 타입',
  target_id            BIGINT       NOT NULL COMMENT '신고 대상 ID',

  reason_code          ENUM('SPAM','ABUSE','HATE','SEXUAL','VIOLENCE','PRIVACY','FRAUD','COPYRIGHT','OTHER')  NOT NULL COMMENT '신고 사유 코드',
  reason_detail        VARCHAR(255) NULL COMMENT '신고 사유 상세(선택)',
  reason               VARCHAR(255) NOT NULL COMMENT '사유(legacy: 관리자 빠른 조회용)',

  status               ENUM('PENDING','ACCEPTED','REJECTED')  NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태(PENDING/ACCEPTED/REJECTED)',

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


-- 24. reviews (fix: review_status NOT NULL DEFAULT, null-safety, checks)
CREATE TABLE reviews (
  review_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '후기 ID',
  event_id      BIGINT   NOT NULL COMMENT '행사 ID',
  user_id       BIGINT   NOT NULL COMMENT '사용자 ID',

  rating        TINYINT  NOT NULL COMMENT '별점',
  content       TEXT     NULL COMMENT '후기 내용',

  view_count    INT      NOT NULL DEFAULT 0 COMMENT '조회수',

  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

  is_deleted    TINYINT  NOT NULL DEFAULT 0 COMMENT '삭제 여부',

  review_status ENUM('PUBLIC','REPORTED','BLINDED','DELETED')
               NOT NULL DEFAULT 'PUBLIC' COMMENT '후기 상태',

  PRIMARY KEY (review_id),

  -- 행사 1건당 사용자 1건 후기 정책
  UNIQUE KEY uk_reviews_event_user (event_id, user_id),

  KEY ix_reviews_event_id (event_id),
  KEY ix_reviews_user_id (user_id),
  KEY ix_reviews_status (review_status),

  -- 별점 범위 강제
  CONSTRAINT ck_reviews_rating
    CHECK (rating BETWEEN 1 AND 5),

  -- 삭제 상태 정합성 강제
  CONSTRAINT ck_reviews_delete_consistency
    CHECK (
      (is_deleted = 1 AND review_status = 'DELETED')
      OR
      (is_deleted = 0 AND review_status <> 'DELETED')
    ),

  CONSTRAINT fk_reviews_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_reviews_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- 25. review_comments
CREATE TABLE review_comments (
  comment_id  BIGINT        NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
  review_id   BIGINT        NOT NULL COMMENT '후기 ID',
  user_id     BIGINT        NOT NULL COMMENT '사용자 ID',
  content     VARCHAR(1000) NOT NULL COMMENT '후기 댓글 내용',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  is_deleted  TINYINT       NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  PRIMARY KEY (comment_id),
  KEY ix_review_comments_review_id (review_id),
  KEY ix_review_comments_user_id (user_id),
  CONSTRAINT fk_review_comments_review
    FOREIGN KEY (review_id) REFERENCES reviews(review_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_comments_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. inquiries (revised)
CREATE TABLE inquiries (
  inquiry_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '문의 ID',
  user_id        BIGINT        NOT NULL COMMENT '사용자 ID',
  category       ENUM('EVENT','PAYMENT','REFUND','ACCOUNT','OTHER')
                 NOT NULL COMMENT '분류',
  inquiry_title  VARCHAR(255)  NOT NULL COMMENT '제목',
  content        TEXT          NULL COMMENT '내용',

  status         ENUM('OPEN','IN_PROGRESS','CLOSED')
                 NOT NULL DEFAULT 'OPEN' COMMENT '상태',

  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

  PRIMARY KEY (inquiry_id),

  -- 조회 최적화: "내 문의 목록"은 보통 최신순 페이징
  KEY ix_inquiries_user_created (user_id, created_at),

  CONSTRAINT fk_inquiries_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 27. inquiry_answers
CREATE TABLE inquiry_answers (
  answer_id   BIGINT   NOT NULL AUTO_INCREMENT COMMENT '답변 ID',
  inquiry_id  BIGINT   NOT NULL COMMENT '문의 ID',
  admin_id    BIGINT   NOT NULL COMMENT '관리자 ID',
  content     TEXT     NOT NULL COMMENT '내용',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  PRIMARY KEY (answer_id),
  KEY ix_inquiry_answers_inquiry_id (inquiry_id),
  KEY ix_inquiry_answers_admin_id (admin_id),
  CONSTRAINT fk_inquiry_answers_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(inquiry_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inquiry_answers_admin_users
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. payments (revised)
CREATE TABLE payments (
  payment_id      BIGINT         NOT NULL AUTO_INCREMENT COMMENT '결제 ID',
  user_id         BIGINT         NOT NULL COMMENT '사용자 ID',
  event_id        BIGINT         NULL COMMENT '행사 ID (행사 결제면 NOT NULL 권장)',
  order_no        VARCHAR(50)    NOT NULL COMMENT '주문번호',
  amount          DECIMAL(10,2)  NOT NULL COMMENT '결제금액',
  payment_method  ENUM('KAKAOPAY','CARD','BANK','OTHER') NOT NULL COMMENT '결제수단',
  status          ENUM('REQUESTED','APPROVED','FAILED','CANCELLED','REFUNDED')
                 NOT NULL DEFAULT 'REQUESTED' COMMENT '결제상태',
  requested_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제요청일시',

  PRIMARY KEY (payment_id),
  UNIQUE KEY uk_payments_order_no (order_no),
  KEY ix_payments_user_id (user_id),
  KEY ix_payments_event_id (event_id),

  CONSTRAINT fk_payments_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT ck_payments_amount_positive
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE payments
  ADD COLUMN active_flag TINYINT
  GENERATED ALWAYS AS (
    CASE
      WHEN status IN ('REQUESTED','APPROVED') THEN 1
      ELSE NULL
    END
  ) STORED COMMENT '활성 결제 플래그(REQUESTED/APPROVED=1, else NULL)';

ALTER TABLE payments
  ADD UNIQUE KEY uk_payments_event_user_active (event_id, user_id, active_flag);


-- 29. refunds (1 payment : 1 refund) + CHECK (revised)
CREATE TABLE refunds (
  refund_id      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '환불 ID',
  payment_id     BIGINT        NOT NULL COMMENT '결제 ID',
  refund_amount  DECIMAL(10,2) NOT NULL COMMENT '환불금액',
  reason         VARCHAR(255)  NOT NULL COMMENT '환불사유',
  status         ENUM('REQUESTED','APPROVED','REJECTED','COMPLETED')
                 NOT NULL DEFAULT 'REQUESTED' COMMENT '환불상태',

  requested_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청일시',
  completed_at   DATETIME      NULL COMMENT '완료일시',

  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

  PRIMARY KEY (refund_id),

  -- 결제 1건당 환불 1건 강제
  UNIQUE KEY uk_refunds_payment_id (payment_id),

  -- 운영 조회용(권장)
  KEY ix_refunds_status (status),

  CONSTRAINT fk_refunds_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- 완료(COMPLETED)일 때만 completed_at 존재, 그 외에는 NULL
  CONSTRAINT ck_refunds_completed_at
    CHECK (
      (status = 'COMPLETED' AND completed_at IS NOT NULL)
      OR
      (status <> 'COMPLETED' AND completed_at IS NULL)
    ),

  -- 금액 정합성(0 초과)
  CONSTRAINT ck_refunds_refund_amount
    CHECK (refund_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 30. qr_codes
CREATE TABLE qr_codes (
  qr_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'QR ID',
  user_id       BIGINT       NOT NULL COMMENT '사용자 ID',
  event_id      BIGINT       NOT NULL COMMENT '행사 ID',
  original_url  VARCHAR(500) NOT NULL COMMENT '원본 이미지 경로(URL)',
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg')  NULL COMMENT '파일 타입 (image/jpeg 등)',
  issued_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급일시',
  expired_at    DATETIME     NOT NULL COMMENT '만료일시',

  PRIMARY KEY (qr_id),

  KEY ix_qr_codes_user_id (user_id),
  KEY ix_qr_codes_event_id (event_id),

  CONSTRAINT fk_qr_codes_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_qr_codes_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 31. qr_logs
CREATE TABLE qr_logs (
  log_id      BIGINT   NOT NULL AUTO_INCREMENT COMMENT '로그 ID',
  qr_id       BIGINT   NOT NULL COMMENT 'QR ID',
  booth_id    BIGINT   NOT NULL COMMENT '부스 ID',
  check_type  ENUM('CHECKIN','CHECKOUT') NOT NULL COMMENT '체크유형(CHECKIN/CHECKOUT)',
  checked_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '체크일시',

  PRIMARY KEY (log_id),

  KEY ix_qr_logs_qr_id (qr_id),
  KEY ix_qr_logs_booth_id (booth_id),
  KEY ix_qr_logs_checked_at (checked_at),

  CONSTRAINT fk_qr_logs_qr
    FOREIGN KEY (qr_id)
    REFERENCES qr_codes(qr_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_qr_logs_booth
    FOREIGN KEY (booth_id)
    REFERENCES booths(booth_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 32. notification
CREATE TABLE notification (
  notification_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '알림ID',
  type                ENUM('EVENT','NOTICE','PAYMENT','APPLY','SYSTEM') NOT NULL DEFAULT 'SYSTEM' COMMENT '알림 유형',
  notification_title  VARCHAR(255)  NOT NULL COMMENT '알림제목',
  content             VARCHAR(255)  NOT NULL COMMENT '알림 내용',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '알림 생성일시',
  PRIMARY KEY (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 33. notification_send
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
  CONSTRAINT fk_notification_send_notification
    FOREIGN KEY (notification_id) REFERENCES notification(notification_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_send_sender_users
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 34. notification_inbox
CREATE TABLE notification_inbox (
  inbox_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '인박스 알림 ID',
  user_id          BIGINT       NOT NULL COMMENT '사용자 ID',
  notification_id  BIGINT       NOT NULL COMMENT '알림 메시지 ID',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수신일시',
  target_type      ENUM('EVENT','NOTICE')  NULL COMMENT '이동대상 유형(EVENT / NOTICE)',
  target_id        BIGINT       NULL COMMENT '이동대상 ID',
  PRIMARY KEY (inbox_id),
  KEY ix_notification_inbox_user_id (user_id),
  KEY ix_notification_inbox_notification_id (notification_id),
  CONSTRAINT fk_notification_inbox_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_inbox_notification
    FOREIGN KEY (notification_id) REFERENCES notification(notification_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 35. notification_settings
CREATE TABLE notification_settings (
  user_id         BIGINT   NOT NULL COMMENT '사용자 ID',
  allow_marketing TINYINT  NOT NULL COMMENT '마케팅 수신 동의',
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '변경일시',
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notification_settings_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 36. interests
CREATE TABLE interests (
  interest_id    BIGINT NOT NULL AUTO_INCREMENT COMMENT '관심항목 ID',
  interest_name  ENUM('EVENT','SESSION','EXPERIENCE','BOOTH','CONTEST','NOTICE',
						'SNACK','BATH_SUPPLIES','GROOMING','TOY','CLOTHING','HEALTH',
                        'TRAINING','WALK','SUPPLEMENTS','ACCESSORIES','OTHERS') NOT NULL COMMENT '관심항목명',
  type           ENUM('SYSTEM','USER') NOT NULL COMMENT '관심항목 분류',
  is_active      TINYINT NOT NULL COMMENT '사용 여부',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (interest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 37. user_interest_subscriptions
CREATE TABLE user_interest_subscriptions (
  subscription_id  BIGINT NOT NULL AUTO_INCREMENT COMMENT '구독 ID',
  user_id          BIGINT NOT NULL COMMENT '사용자 ID',
  interest_id      BIGINT NOT NULL COMMENT '관심항목 ID',

  allow_inapp      TINYINT NOT NULL COMMENT '인앱 알림 허용',
  allow_email      TINYINT NOT NULL COMMENT '이메일 수신 허용',
  allow_sms        TINYINT NOT NULL COMMENT 'SMS 수신 허용',

  status           ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL COMMENT '구독 상태',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '구독 시작일시',

  PRIMARY KEY (subscription_id),

  UNIQUE KEY uq_user_interest_subscriptions_user_interest (user_id, interest_id),

  KEY ix_user_interest_subscriptions_user_id (user_id),
  KEY ix_user_interest_subscriptions_interest_id (interest_id),

  CONSTRAINT fk_user_interest_subscriptions_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_user_interest_subscriptions_interest
    FOREIGN KEY (interest_id) REFERENCES interests(interest_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 38. admin_logs
CREATE TABLE admin_logs (
  log_id      BIGINT       NOT NULL AUTO_INCREMENT COMMENT '관리자 로그 ID',
  admin_id    BIGINT       NOT NULL COMMENT '관리자 ID',
  action      VARCHAR(255) NOT NULL COMMENT '작업 내용',
  target_type ENUM('USER','EVENT','PROGRAM','BOOTH','NOTICE','PAYMENT','REFUND','REVIEW','POST','QNA','INQUIRY','GALLERY','QR','SYSTEM','OTHER') NULL COMMENT '작업 대상의 유형',
  target_id   BIGINT       NULL COMMENT '작업 대상의 ID',
  ip_address  VARCHAR(50)  NULL COMMENT '요청 IP',
  result       ENUM('SUCCESS','FAIL') NOT NULL DEFAULT 'SUCCESS' COMMENT 'SUCCESS / FAIL',
  error_code  VARCHAR(50)  NULL COMMENT '실패 시 에러코드',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작업 수행일시',
  PRIMARY KEY (log_id),
  KEY ix_admin_logs_admin_id (admin_id),
  CONSTRAINT fk_admin_logs_admin_users
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 39. refresh_token (multi-device)
CREATE TABLE refresh_token (
  refresh_token_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '리프레시 토큰 ID',
  user_id          BIGINT NOT NULL COMMENT '사용자 ID',
  token            VARCHAR(500) NOT NULL COMMENT '리프레시 토큰(원문 또는 해시)',
  expired_at       DATETIME NOT NULL COMMENT '만료일시',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',

  PRIMARY KEY (refresh_token_id),
  UNIQUE KEY uk_refresh_token_token (token),
  KEY ix_refresh_token_user_id (user_id),
  KEY ix_refresh_token_expired_at (expired_at),

  CONSTRAINT fk_refresh_token_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 40. payment_transactions (PG transaction metadata)
CREATE TABLE IF NOT EXISTS payment_transactions (
  tx_id           BIGINT        NOT NULL AUTO_INCREMENT COMMENT 'PG 트랜잭션 ID',
  payment_id      BIGINT        NOT NULL COMMENT '결제 ID (payments.payment_id)',
  pg_provider     ENUM('KAKAOPAY') NOT NULL COMMENT 'PG 제공자',
  pg_tid          VARCHAR(100)  NOT NULL COMMENT 'PG 거래ID(tid)',
  pg_token        VARCHAR(100)  NULL COMMENT '승인 토큰(pg_token) - 리다이렉트로 수신',

  status          ENUM('READY','APPROVED','CANCELLED','FAILED')
                  NOT NULL DEFAULT 'READY' COMMENT 'PG 트랜잭션 상태',

  idempotency_key VARCHAR(64)   NULL COMMENT '멱등키(선택)',

  raw_ready       JSON          NULL COMMENT 'ready 원문 응답(JSON)',
  raw_approve     JSON          NULL COMMENT 'approve 원문 응답(JSON)',
  raw_cancel      JSON          NULL COMMENT 'cancel 원문 응답(JSON)',

  requested_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'ready 요청일시',
  approved_at     DATETIME      NULL COMMENT '승인일시',
  cancelled_at    DATETIME      NULL COMMENT '취소/환불일시',
  failed_at       DATETIME      NULL COMMENT '실패일시',

  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

  PRIMARY KEY (tx_id),

  -- 결제 1건당 PG 트랜잭션 1건(정책)
  UNIQUE KEY uk_payment_transactions_payment_id (payment_id),

  -- tid는 PG에서 유일하다고 가정(동일 PG provider 내)
  UNIQUE KEY uk_payment_transactions_provider_tid (pg_provider, pg_tid),

  KEY ix_payment_transactions_status (status),
  KEY ix_payment_transactions_payment_id (payment_id),

  CONSTRAINT fk_payment_transactions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- status-일시 정합성
  CONSTRAINT ck_payment_transactions_status_datetime
    CHECK (
      (status = 'READY'     AND approved_at IS NULL AND cancelled_at IS NULL AND failed_at IS NULL)
      OR
      (status = 'APPROVED'  AND approved_at IS NOT NULL AND cancelled_at IS NULL AND failed_at IS NULL)
      OR
      (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND failed_at IS NULL)
      OR
      (status = 'FAILED'    AND failed_at IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 1) raw_ready JSON 타입 보정 (운영 패치)
SET @sql := NULL;

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    WHEN MAX(data_type) <> 'json' THEN
      'ALTER TABLE payment_transactions MODIFY COLUMN raw_ready JSON NULL COMMENT ''ready 원문 응답(JSON)'';'
    ELSE NULL
  END
INTO @sql
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'payment_transactions'
  AND column_name = 'raw_ready';

SELECT @sql AS alter_payment_raw_ready;

SET @stmt := IFNULL(@sql, 'SELECT ''SKIP: raw_ready already JSON'' AS msg;');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2) raw_approve JSON 타입 보정 (운영 패치)
SET @sql := NULL;

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    WHEN MAX(data_type) <> 'json' THEN
      'ALTER TABLE payment_transactions MODIFY COLUMN raw_approve JSON NULL COMMENT ''approve 원문 응답(JSON)'';'
    ELSE NULL
  END
INTO @sql
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'payment_transactions'
  AND column_name = 'raw_approve';

SELECT @sql AS alter_payment_raw_approve;

SET @stmt := IFNULL(@sql, 'SELECT ''SKIP: raw_approve already JSON'' AS msg;');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3) raw_cancel JSON 타입 보정 (운영 패치)
SET @sql := NULL;

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    WHEN MAX(data_type) <> 'json' THEN
      'ALTER TABLE payment_transactions MODIFY COLUMN raw_cancel JSON NULL COMMENT ''cancel 원문 응답(JSON)'';'
    ELSE NULL
  END
INTO @sql
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'payment_transactions'
  AND column_name = 'raw_cancel';

SELECT @sql AS alter_payment_raw_cancel;

SET @stmt := IFNULL(@sql, 'SELECT ''SKIP: raw_cancel already JSON'' AS msg;');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 41. event_interest_map
CREATE TABLE event_interest_map (
  event_interest_map_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '이벤트-관심항목 매핑 ID',
  event_id              BIGINT NOT NULL COMMENT '행사 ID (FK: event.event_id)',
  interest_id           BIGINT NOT NULL COMMENT '관심항목 ID (FK: interests.interest_id)',
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',

  PRIMARY KEY (event_interest_map_id),

  -- 같은 이벤트에 같은 관심항목 중복 매핑 방지
  UNIQUE KEY uk_event_interest (event_id, interest_id),

  -- 조회 최적화(interest 기준 / event 기준 모두 커버)
  KEY idx_interest_event (interest_id, event_id),

  CONSTRAINT fk_eim_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_eim_interest
    FOREIGN KEY (interest_id) REFERENCES interests(interest_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 42. email_verification_token
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
  CONSTRAINT fk_evt_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 43. phone_verification_token
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
  CONSTRAINT fk_pvt_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- signup_sessions (v4.0)
-- 목적: OTP 선검증 회원가입 세션(3-step signup)
-- 주의: JPA(EnumType.STRING) 정합성 위해 ENUM 대신 VARCHAR 사용
-- ------------------------------------------------------------
CREATE TABLE signup_sessions (
  signup_session_id      BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원가입 세션 PK',
  signup_key             VARCHAR(36) NOT NULL COMMENT '외부 노출용 UUID(클라이언트 보관)',

  signup_type            ENUM('EMAIL','SOCIAL') NOT NULL COMMENT '가입 타입(EMAIL/SOCIAL)',
  social_provider        VARCHAR(30) NULL COMMENT 'SOCIAL 제공자(KAKAO/GOOGLE/APPLE 등)',
  social_provider_uid    VARCHAR(255) NULL COMMENT 'SOCIAL 제공자 UID',

  email                  VARCHAR(255) NULL COMMENT 'EMAIL 가입 이메일(소셜도 보유 가능)',
  password_hash          VARCHAR(255) NULL COMMENT '가입 단계에서만 저장되는 비밀번호 해시(BCrypt)',
  nickname               VARCHAR(30)  NOT NULL COMMENT '닉네임',
  phone                  VARCHAR(30)  NOT NULL COMMENT '휴대폰 번호(숫자만 저장 권장)',

  otp_status             ENUM('PENDING','VERIFIED','EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'OTP 상태(PENDING/VERIFIED/EXPIRED)',
  otp_verified_at        DATETIME NULL COMMENT 'OTP 인증 완료 시각',
  otp_last_sent_at       DATETIME NULL COMMENT '마지막 OTP 발송 시각',
  otp_code_hash          VARCHAR(128) NULL COMMENT 'OTP 코드 해시(SHA-256 hex)',
  otp_expires_at         DATETIME NULL COMMENT 'OTP 만료 시각',
  otp_fail_count         INT NOT NULL DEFAULT 0 COMMENT 'OTP 검증 실패 횟수',
  otp_blocked_until      DATETIME NULL COMMENT 'OTP 검증 차단 종료 시각',

  email_status           ENUM('PENDING','VERIFIED','NOT_REQUIRED') NOT NULL DEFAULT 'PENDING' COMMENT '이메일 인증 상태(PENDING/VERIFIED/NOT_REQUIRED)',
  email_verified_at      DATETIME NULL COMMENT '이메일 인증 완료 시각',
  email_code_hash        VARCHAR(128) NULL COMMENT '이메일 인증코드 해시(SHA-256 hex)',
  email_expires_at       DATETIME NULL COMMENT '이메일 인증코드 만료 시각',
  email_last_sent_at     DATETIME NULL COMMENT '이메일 인증 메일 발송 시각',
  email_fail_count       INT NOT NULL DEFAULT 0 COMMENT '이메일 인증 실패 횟수',

  expires_at             DATETIME NOT NULL COMMENT '세션 만료(예: 생성 후 30분)',
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시각',

  PRIMARY KEY (signup_session_id),
  UNIQUE KEY uk_signup_sessions_signup_key (signup_key),
  KEY idx_signup_sessions_phone (phone),
  KEY idx_signup_sessions_email (email),
  KEY idx_signup_sessions_otp_last_sent_at (otp_last_sent_at),
  KEY idx_signup_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OTP 선검증 회원가입 세션';


SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- Pupoo Sample Data
-- - No FK/UK/ENUM bypass
-- - Insert order respects FK dependencies
-- =========================================================

START TRANSACTION;

-- users
INSERT INTO `users` (`user_id`, `email`, `password`, `nickname`, `phone`, `status`, `created_at`, `last_login_at`, `last_modified_at`, `role_name`, `show_age`, `show_gender`, `show_pet`) VALUES
  (1, 'user001@pupoo.io', '$2a$10$3TpSku4nDtguqdEphzLeX.kMQjrNvKM6lvEz3N1XXGWN1nmaHLP4S', '버니멍', '010-2824-1409', 'ACTIVE', '2025-10-02 00:00:00', '2026-02-01 01:00:00', '2026-01-16 00:00:00', 'ADMIN', 1, 0, 0),
  (2, 'user002@pupoo.io', '$2a$10$samplehash2', '포포', '010-3286-2679', 'ACTIVE', '2025-10-03 00:00:00', '2026-02-01 02:00:00', '2026-01-17 00:00:00', 'ADMIN', 0, 1, 0),
  (3, 'user003@pupoo.io', '$2a$10$samplehash3', '콩이', '010-1488-2535', 'ACTIVE', '2025-10-04 00:00:00', '2026-02-01 03:00:00', '2026-01-18 00:00:00', 'USER', 0, 0, 0),
  (4, 'user004@pupoo.io', '$2a$10$samplehash4', '초코', '010-4257-9928', 'ACTIVE', '2025-10-05 00:00:00', '2026-02-01 04:00:00', '2026-01-19 00:00:00', 'USER', 1, 0, 1),
  (5, 'user005@pupoo.io', '$2a$10$samplehash5', '보리', '010-5557-1106', 'ACTIVE', '2025-10-06 00:00:00', '2026-02-01 05:00:00', '2026-01-20 00:00:00', 'USER', 0, 1, 1),
  (6, 'user006@pupoo.io', '$2a$10$samplehash6', '하루', '010-5552-3547', 'ACTIVE', '2025-10-07 00:00:00', '2026-02-01 06:00:00', '2026-01-21 00:00:00', 'USER', 0, 1, 0),
  (7, 'user007@pupoo.io', '$2a$10$samplehash7', '루루', '010-2519-7224', 'ACTIVE', '2025-10-08 00:00:00', '2026-02-01 07:00:00', '2026-01-22 00:00:00', 'USER', 0, 1, 1),
  (8, 'user008@pupoo.io', '$2a$10$samplehash8', '탄이', '010-5333-1711', 'ACTIVE', '2025-10-09 00:00:00', '2026-02-01 08:00:00', '2026-01-23 00:00:00', 'USER', 1, 0, 1),
  (9, 'user009@pupoo.io', '$2a$10$samplehash9', '모찌', '010-2291-5803', 'ACTIVE', '2025-10-10 00:00:00', '2026-02-01 09:00:00', '2026-01-24 00:00:00', 'USER', 1, 0, 0),
  (10, 'user010@pupoo.io', '$2a$10$samplehash10', '뭉치', '010-1750-4733', 'ACTIVE', '2025-10-11 00:00:00', '2026-02-01 10:00:00', '2026-01-15 00:00:00', 'USER', 1, 0, 0),
  (11, 'user011@pupoo.io', '$2a$10$samplehash11', '두부', '010-2654-7227', 'ACTIVE', '2025-10-12 00:00:00', '2026-02-01 11:00:00', '2026-01-16 00:00:00', 'USER', 1, 1, 1),
  (12, 'user012@pupoo.io', '$2a$10$samplehash12', '코코', '010-3664-7065', 'ACTIVE', '2025-10-13 00:00:00', '2026-02-01 12:00:00', '2026-01-17 00:00:00', 'USER', 1, 0, 1),
  (13, 'user013@pupoo.io', '$2a$10$samplehash13', '몽실', '010-2169-3803', 'ACTIVE', '2025-10-14 00:00:00', '2026-02-01 13:00:00', '2026-01-18 00:00:00', 'USER', 0, 0, 1),
  (14, 'user014@pupoo.io', '$2a$10$samplehash14', '별이', '010-7216-5422', 'ACTIVE', '2025-10-15 00:00:00', '2026-02-01 14:00:00', '2026-01-19 00:00:00', 'USER', 0, 1, 0),
  (15, 'user015@pupoo.io', '$2a$10$samplehash15', '호두', '010-4752-1525', 'ACTIVE', '2025-10-16 00:00:00', '2026-02-01 15:00:00', '2026-01-20 00:00:00', 'USER', 1, 1, 1),
  (16, 'user016@pupoo.io', '$2a$10$samplehash16', '라떼', '010-2084-4456', 'ACTIVE', '2025-10-17 00:00:00', '2026-02-01 16:00:00', '2026-01-21 00:00:00', 'USER', 1, 0, 1),
  (17, 'user017@pupoo.io', '$2a$10$samplehash17', '감자', '010-7482-8517', 'ACTIVE', '2025-10-18 00:00:00', '2026-02-01 17:00:00', '2026-01-22 00:00:00', 'USER', 0, 1, 0),
  (18, 'user018@pupoo.io', '$2a$10$samplehash18', '솜이', '010-5040-9830', 'ACTIVE', '2025-10-19 00:00:00', '2026-02-01 18:00:00', '2026-01-23 00:00:00', 'USER', 1, 1, 1),
  (19, 'user019@pupoo.io', '$2a$10$samplehash19', '쿠키', '010-6930-4593', 'ACTIVE', '2025-10-20 00:00:00', '2026-02-01 19:00:00', '2026-01-24 00:00:00', 'USER', 0, 1, 0),
  (20, 'user020@pupoo.io', '$2a$10$samplehash20', '바다', '010-1771-2796', 'ACTIVE', '2025-10-21 00:00:00', '2026-02-01 20:00:00', '2026-01-15 00:00:00', 'USER', 0, 0, 1),
  (21, 'user021@pupoo.io', '$2a$10$samplehash21', '버니멍_21', '010-2040-7304', 'ACTIVE', '2025-10-22 00:00:00', '2026-02-01 21:00:00', '2026-01-16 00:00:00', 'USER', 1, 1, 1),
  (22, 'user022@pupoo.io', '$2a$10$samplehash22', '포포_22', '010-1188-2876', 'ACTIVE', '2025-10-23 00:00:00', '2026-02-01 22:00:00', '2026-01-17 00:00:00', 'USER', 1, 1, 0),
  (23, 'user023@pupoo.io', '$2a$10$samplehash23', '콩이_23', '010-5808-8123', 'ACTIVE', '2025-10-24 00:00:00', '2026-02-01 23:00:00', '2026-01-18 00:00:00', 'USER', 0, 1, 0),
  (24, 'user024@pupoo.io', '$2a$10$samplehash24', '초코_24', '010-5315-9201', 'ACTIVE', '2025-10-25 00:00:00', '2026-02-02 00:00:00', '2026-01-19 00:00:00', 'USER', 0, 0, 1),
  (25, 'user025@pupoo.io', '$2a$10$samplehash25', '보리_25', '010-9317-4258', 'ACTIVE', '2025-10-26 00:00:00', '2026-02-02 01:00:00', '2026-01-20 00:00:00', 'USER', 0, 1, 0),
  (26, 'user026@pupoo.io', '$2a$10$samplehash26', '하루_26', '010-9837-9689', 'ACTIVE', '2025-10-27 00:00:00', '2026-02-02 02:00:00', '2026-01-21 00:00:00', 'USER', 0, 1, 1),
  (27, 'user027@pupoo.io', '$2a$10$samplehash27', '루루_27', '010-1319-2832', 'ACTIVE', '2025-10-28 00:00:00', '2026-02-02 03:00:00', '2026-01-22 00:00:00', 'USER', 1, 1, 0),
  (28, 'user028@pupoo.io', '$2a$10$samplehash28', '탄이_28', '010-1949-4946', 'ACTIVE', '2025-10-29 00:00:00', '2026-02-02 04:00:00', '2026-01-23 00:00:00', 'USER', 0, 0, 1),
  (29, 'user029@pupoo.io', '$2a$10$samplehash29', '모찌_29', '010-2133-9727', 'ACTIVE', '2025-10-30 00:00:00', '2026-02-02 05:00:00', '2026-01-24 00:00:00', 'USER', 0, 0, 1),
  (30, 'user030@pupoo.io', '$2a$10$samplehash30', '뭉치_30', '010-3705-5342', 'ACTIVE', '2025-10-31 00:00:00', '2026-02-02 06:00:00', '2026-01-15 00:00:00', 'USER', 1, 0, 0);

-- 개발/테스트 편의를 위해 샘플 사용자들은 인증 완료로 세팅한다.
UPDATE users
SET email_verified = 1,
    phone_verified = 1;

-- event
INSERT INTO `event` (`event_id`, `event_name`, `description`, `start_at`, `end_at`, `location`, `status`, `round_no`) VALUES
  (1, '서울 펫페어 봄', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-03-01 10:00:00', '2026-03-03 18:00:00', 'ICC JEJU', 'CANCELLED', 1),
  (2, '부산 반려견 라이프쇼', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-03-15 10:00:00', '2026-03-17 18:00:00', '엑스코', 'PLANNED', 2),
  (3, '대전 펫 헬스 엑스포', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-03-29 10:00:00', '2026-03-31 18:00:00', 'COEX Hall B', 'CANCELLED', 3),
  (4, '광주 펫 & 플리마켓', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-04-12 10:00:00', '2026-04-14 18:00:00', '송도컨벤시아', 'PLANNED', 4),
  (5, '인천 도그 페스티벌', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-04-26 10:00:00', '2026-04-28 18:00:00', 'COEX Hall B', 'ENDED', 5),
  (6, '수원 펫스타', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-05-10 10:00:00', '2026-05-12 18:00:00', '수원메쎄', 'ONGOING', 6),
  (7, '대구 애견문화 박람회', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-05-24 10:00:00', '2026-05-26 18:00:00', '엑스코', 'PLANNED', 7),
  (8, '제주 펫 트래블 위크', '반려동물 문화·용품·체험을 한자리에서 즐기는 통합 행사입니다.', '2026-06-07 10:00:00', '2026-06-09 18:00:00', 'ICC JEJU', 'ONGOING', 8);



-- notification
INSERT INTO `notification` (`notification_id`, `type`, `notification_title`, `content`, `created_at`) VALUES
  (1, 'SYSTEM', '운영 공지', '부스 운영 시간이 변경되었습니다.', '2026-01-11 00:00:00'),
  (2, 'SYSTEM', '혜택 안내', '부스 운영 시간이 변경되었습니다.', '2026-01-12 00:00:00'),
  (3, 'EVENT', '혜택 안내', '쿠폰이 발급되었습니다. 마이페이지에서 확인하세요.', '2026-01-13 00:00:00'),
  (4, 'SYSTEM', '예약 알림', '쿠폰이 발급되었습니다. 마이페이지에서 확인하세요.', '2026-01-14 00:00:00'),
  (5, 'SYSTEM', '예약 알림', '프로그램 신청이 완료되었습니다.', '2026-01-15 00:00:00'),
  (6, 'NOTICE', '운영 공지', '프로그램 신청이 완료되었습니다.', '2026-01-16 00:00:00'),
  (7, 'SYSTEM', '운영 공지', '행사장 혼잡이 예상됩니다. 여유 있게 이동해 주세요.', '2026-01-17 00:00:00'),
  (8, 'SYSTEM', '예약 알림', '프로그램 신청이 완료되었습니다.', '2026-01-18 00:00:00'),
  (9, 'SYSTEM', '예약 알림', '쿠폰이 발급되었습니다. 마이페이지에서 확인하세요.', '2026-01-19 00:00:00'),
  (10, 'EVENT', '행사 안내', '쿠폰이 발급되었습니다. 마이페이지에서 확인하세요.', '2026-01-20 00:00:00'),
  (11, 'SYSTEM', '예약 알림', '쿠폰이 발급되었습니다. 마이페이지에서 확인하세요.', '2026-01-21 00:00:00'),
  (12, 'EVENT', '혜택 안내', '행사장 혼잡이 예상됩니다. 여유 있게 이동해 주세요.', '2026-01-22 00:00:00');

-- interests
INSERT INTO `interests` (`interest_id`, `interest_name`, `type`, `is_active`, `created_at`) VALUES
  (1, 'EVENT', 'SYSTEM', 1, '2025-09-02 00:00:00'),
  (2, 'SESSION', 'SYSTEM', 1, '2025-09-03 00:00:00'),
  (3, 'EXPERIENCE', 'SYSTEM', 1, '2025-09-04 00:00:00'),
  (4, 'BOOTH', 'SYSTEM', 1, '2025-09-05 00:00:00'),
  (5, 'CONTEST', 'SYSTEM', 1, '2025-09-06 00:00:00'),
  (6, 'NOTICE', 'SYSTEM', 1, '2025-09-07 00:00:00'),
  (7, 'OTHERS', 'USER', 1, '2025-09-08 00:00:00'),
  (8,  'SNACK',        'USER', 1, '2025-09-09 00:00:00'),
  (9,  'BATH_SUPPLIES','USER', 1, '2025-09-10 00:00:00'),
  (10, 'GROOMING',     'USER', 1, '2025-09-11 00:00:00'),
  (11, 'TOY',          'USER', 1, '2025-09-12 00:00:00'),
  (12, 'CLOTHING',     'USER', 1, '2025-09-13 00:00:00'),
  (13, 'HEALTH',       'USER', 1, '2025-09-14 00:00:00'),
  (14, 'TRAINING',     'USER', 1, '2025-09-15 00:00:00'),
  (15, 'WALK',         'USER', 1, '2025-09-16 00:00:00'),
  (16, 'SUPPLEMENTS',  'USER', 1, '2025-09-17 00:00:00'),
  (17, 'ACCESSORIES',  'USER', 1, '2025-09-18 00:00:00'),
  (18, 'SNACK',        'USER',   1, '2025-09-19 00:00:00'),
  (19, 'TOY',          'USER',   1, '2025-09-20 00:00:00'),
  (20, 'WALK',         'USER',   1, '2025-09-21 00:00:00'),
  (21, 'HEALTH',       'USER',   0, '2025-09-22 00:00:00'),
  (22, 'ACCESSORIES',  'USER',   1, '2025-09-23 00:00:00'),
  (23, 'CLOTHING',     'USER',   1, '2025-09-24 00:00:00'),
  (24, 'TRAINING',     'USER',   1, '2025-09-25 00:00:00'),
  (25, 'SUPPLEMENTS',  'USER',   0, '2025-09-26 00:00:00'),
  (26, 'GROOMING',     'USER',   1, '2025-09-27 00:00:00'),
  (27, 'BATH_SUPPLIES','USER',   1, '2025-09-28 00:00:00');

-- inquiries
INSERT INTO `inquiries` (`inquiry_id`, `user_id`, `category`, `inquiry_title`, `content`, `status`, `created_at`) VALUES
  (1, 7, 'ACCOUNT', '결제 취소 문의', '게시글에 사진을 여러 장 올릴 수 있나요?', 'OPEN', '2026-01-10 00:00:00'),
  (2, 28, 'REFUND', '결제 취소 문의', '비밀번호 재설정 메일이 오지 않습니다.', 'OPEN', '2026-01-19 00:00:00'),
  (3, 7, 'EVENT', '행사 일정 문의', '게시글에 사진을 여러 장 올릴 수 있나요?', 'CLOSED', '2026-01-28 00:00:00'),
  (4, 19, 'OTHER', '첨부파일 업로드 문의', '비밀번호 재설정 메일이 오지 않습니다.', 'CLOSED', '2026-01-20 00:00:00'),
  (5, 17, 'EVENT', '로그인 오류', '강연 프로그램은 몇 시부터 입장 가능한가요?', 'CLOSED', '2026-01-20 00:00:00'),
  (6, 23, 'PAYMENT', '행사 일정 문의', '게시글에 사진을 여러 장 올릴 수 있나요?', 'OPEN', '2026-01-27 00:00:00'),
  (7, 12, 'PAYMENT', '행사 일정 문의', '강연 프로그램은 몇 시부터 입장 가능한가요?', 'CLOSED', '2026-01-22 00:00:00'),
  (8, 5, 'PAYMENT', '로그인 오류', '비밀번호 재설정 메일이 오지 않습니다.', 'CLOSED', '2026-01-27 00:00:00'),
  (9, 7, 'PAYMENT', '결제 취소 문의', '게시글에 사진을 여러 장 올릴 수 있나요?', 'CLOSED', '2026-01-15 00:00:00'),
  (10, 20, 'OTHER', '첨부파일 업로드 문의', '결제가 완료됐는데 신청 내역에 표시가 안 돼요.', 'OPEN', '2026-01-18 00:00:00'),
  (11, 15, 'ACCOUNT', '첨부파일 업로드 문의', '게시글에 사진을 여러 장 올릴 수 있나요?', 'OPEN', '2026-01-16 00:00:00'),
  (12, 12, 'OTHER', '첨부파일 업로드 문의', '비밀번호 재설정 메일이 오지 않습니다.', 'CLOSED', '2026-01-12 00:00:00'),
  (13, 11, 'OTHER', '첨부파일 업로드 문의', '결제가 완료됐는데 신청 내역에 표시가 안 돼요.', 'CLOSED', '2026-01-15 00:00:00'),
  (14, 24, 'ACCOUNT', '로그인 오류', '게시글에 사진을 여러 장 올릴 수 있나요?', 'OPEN', '2026-01-24 00:00:00'),
  (15, 20, 'OTHER', '첨부파일 업로드 문의', '결제가 완료됐는데 신청 내역에 표시가 안 돼요.', 'OPEN', '2026-01-25 00:00:00');

-- admin_logs
INSERT INTO `admin_logs` (`log_id`, `admin_id`, `action`, `target_type`, `target_id`, `ip_address`, `result`, `error_code`, `created_at`) VALUES
  (1, 2, 'UPDATE', 'NOTICE', 30, '127.0.0.1', 'SUCCESS', NULL, '2026-01-04 00:00:00'),
  (2, 2, 'UPDATE', 'PAYMENT', 21, '127.0.0.1', 'SUCCESS', NULL, '2026-01-30 00:00:00'),
  (3, 2, 'PUBLISH', 'USER', 49, '127.0.0.1', 'SUCCESS', NULL, '2026-01-18 00:00:00'),
  (4, 2, 'PUBLISH', 'USER', 6, '127.0.0.1', 'SUCCESS', NULL, '2026-01-02 00:00:00'),
  (5, 1, 'CREATE', 'USER', 15, '127.0.0.1', 'SUCCESS', NULL, '2026-01-03 00:00:00'),
  (6, 1, 'CREATE', 'NOTICE', 13, '127.0.0.1', 'SUCCESS', NULL, '2026-02-09 00:00:00'),
  (7, 1, 'PUBLISH', 'NOTICE', 9, '127.0.0.1', 'SUCCESS', NULL, '2026-01-08 00:00:00'),
  (8, 1, 'DELETE', 'PAYMENT', 45, '127.0.0.1', 'SUCCESS', NULL, '2026-01-24 00:00:00'),
  (9, 1, 'CREATE', 'OTHER', 39, '127.0.0.1', 'SUCCESS', NULL, '2026-01-11 00:00:00'),
  (10, 2, 'CREATE', 'EVENT', 38, '127.0.0.1', 'SUCCESS', NULL, '2026-01-20 00:00:00'),
  (11, 2, 'UPDATE', 'PAYMENT', 46, '127.0.0.1', 'SUCCESS', NULL, '2026-01-05 00:00:00'),
  (12, 1, 'DELETE', 'EVENT', 45, '127.0.0.1', 'SUCCESS', NULL, '2026-02-08 00:00:00'),
  (13, 1, 'DELETE', 'OTHER', 3, '127.0.0.1', 'SUCCESS', NULL, '2026-02-04 00:00:00'),
  (14, 2, 'HIDE', 'USER', 5, '127.0.0.1', 'SUCCESS', NULL, '2026-01-22 00:00:00'),
  (15, 1, 'CREATE', 'PAYMENT', 32, '127.0.0.1', 'SUCCESS', NULL, '2026-01-28 00:00:00'),
  (16, 2, 'UPDATE', 'PAYMENT', 46, '127.0.0.1', 'SUCCESS', NULL, '2026-01-28 00:00:00'),
  (17, 1, 'DELETE', 'OTHER', 42, '127.0.0.1', 'FAIL', 'VALIDATION_FAILED', '2026-02-09 00:00:00'),
  (18, 2, 'HIDE', 'PAYMENT', 28, '127.0.0.1', 'SUCCESS', NULL, '2026-01-18 00:00:00'),
  (19, 2, 'DELETE', 'NOTICE', 6, '127.0.0.1', 'SUCCESS', NULL, '2026-01-29 00:00:00'),
  (20, 1, 'HIDE', 'PAYMENT', 37, '127.0.0.1', 'SUCCESS', NULL, '2026-01-25 00:00:00');

INSERT INTO `qr_codes`
(`qr_id`, `user_id`, `event_id`, `original_url`, `mime_type`, `issued_at`, `expired_at`) VALUES
(1, 11, 1, 'https://pupoo.io/qr/11/1', 'png', '2026-01-20 15:00:00', '2026-01-21 03:00:00'),
(2, 28, 2, 'https://pupoo.io/qr/28/2', 'png', '2026-01-30 05:00:00', '2026-01-30 17:00:00'),
(3, 16, 1, 'https://pupoo.io/qr/16/3', 'png', '2026-01-26 11:00:00', '2026-01-26 23:00:00'),
(4, 26, 3, 'https://pupoo.io/qr/26/4', 'png', '2026-01-28 10:00:00', '2026-01-28 22:00:00'),
(5, 9, 4, 'https://pupoo.io/qr/9/5', 'png', '2026-02-08 22:00:00', '2026-02-09 10:00:00'),
(6, 29, 2, 'https://pupoo.io/qr/29/6', 'png', '2026-01-28 17:00:00', '2026-01-29 05:00:00'),
(7, 1, 5, 'https://pupoo.io/qr/1/7', 'png', '2026-02-05 06:00:00', '2026-02-05 18:00:00'),
(8, 3, 3, 'https://pupoo.io/qr/3/8', 'png', '2026-01-27 23:00:00', '2026-01-28 11:00:00'),
(9, 14, 6, 'https://pupoo.io/qr/14/9', 'png', '2026-02-04 17:00:00', '2026-02-05 05:00:00'),
(10, 25, 7, 'https://pupoo.io/qr/25/10', 'png', '2026-01-27 22:00:00', '2026-01-28 10:00:00'),
(11, 16, 4, 'https://pupoo.io/qr/16/11', 'png', '2026-02-09 22:00:00', '2026-02-10 10:00:00'),
(12, 16, 8, 'https://pupoo.io/qr/16/12', 'png', '2026-02-03 00:00:00', '2026-02-03 12:00:00'),
(13, 3, 7, 'https://pupoo.io/qr/3/13', 'png', '2026-01-29 07:00:00', '2026-01-29 19:00:00'),
(14, 13, 2, 'https://pupoo.io/qr/13/14', 'png', '2026-01-27 09:00:00', '2026-01-27 21:00:00'),
(15, 22, 1, 'https://pupoo.io/qr/22/15', 'png', '2026-02-07 11:00:00', '2026-02-07 23:00:00'),
(16, 16, 6, 'https://pupoo.io/qr/16/16', 'png', '2026-02-06 16:00:00', '2026-02-07 04:00:00'),
(17, 12, 3, 'https://pupoo.io/qr/12/17', 'png', '2026-02-02 23:00:00', '2026-02-03 11:00:00'),
(18, 18, 4, 'https://pupoo.io/qr/18/18', 'png', '2026-01-30 11:00:00', '2026-01-30 23:00:00'),
(19, 23, 5, 'https://pupoo.io/qr/23/19', 'png', '2026-02-03 08:00:00', '2026-02-03 20:00:00'),
(20, 10, 1, 'https://pupoo.io/qr/10/20', 'png', '2026-01-28 07:00:00', '2026-01-28 19:00:00'),
(21, 4, 8, 'https://pupoo.io/qr/4/21', 'png', '2026-01-26 10:00:00', '2026-01-26 22:00:00'),
(22, 4, 7, 'https://pupoo.io/qr/4/22', 'png', '2026-02-06 22:00:00', '2026-02-07 10:00:00'),
(23, 6, 2, 'https://pupoo.io/qr/6/23', 'png', '2026-01-26 06:00:00', '2026-01-26 18:00:00'),
(24, 24, 6, 'https://pupoo.io/qr/24/24', 'png', '2026-02-04 08:00:00', '2026-02-04 20:00:00'),
(25, 24, 5, 'https://pupoo.io/qr/24/25', 'png', '2026-02-07 16:00:00', '2026-02-08 04:00:00');


-- pet
INSERT INTO `pet` (`pet_id`, `user_id`, `pet_name`, `pet_breed`, `pet_age`, `pet_weight`) VALUES
  (1, 2, '하루1', 'OTHER', 9, NULL),
  (2, 21, '두부2', 'CAT', 14, NULL),
  (3, 8, '호두3', 'DOG', 8, 'XL'),
  (4, 15, '호두4', 'DOG', 8, 'M'),
  (5, 4, '콩이5', 'CAT', 2, NULL),
  (6, 13, '콩이6', 'CAT', 9, NULL),
  (7, 18, '보리7', 'DOG', 13, 'XL'),
  (8, 20, '루루8', 'OTHER', 15, NULL),
  (9, 17, '하루9', 'OTHER', 11, NULL),
  (10, 22, '탄이0', 'CAT', 6, NULL),
  (11, 27, '하루1', 'DOG', 14, 'L'),
  (12, 11, '모찌2', 'OTHER', 10, NULL),
  (13, 16, '탄이3', 'OTHER', 12, NULL),
  (14, 15, '보리4', 'DOG', 13, 'S'),
  (15, 1, '탄이5', 'CAT', 14, NULL),
  (16, 21, '감자6', 'CAT', 9, NULL),
  (17, 12, '보리7', 'OTHER', 1, NULL),
  (18, 29, '호두8', 'DOG', 3, 'L'),
  (19, 4, '모찌9', 'CAT', 4, NULL),
  (20, 7, '두부0', 'DOG', 4, 'L'),
  (21, 27, '탄이1', 'DOG', 2, 'L'),
  (22, 2, '모찌2', 'OTHER', 2, NULL),
  (23, 25, '호두3', 'CAT', 11, NULL),
  (24, 19, '초코4', 'OTHER', 8, NULL),
  (25, 1, '콩이5', 'OTHER', 9, NULL),
  (26, 30, '모찌6', 'CAT', 8, NULL),
  (27, 30, '초코7', 'OTHER', 12, NULL),
  (28, 19, '초코8', 'DOG', 2, 'L'),
  (29, 22, '모찌9', 'OTHER', 15, NULL),
  (30, 11, '두부0', 'OTHER', 7, NULL),
  (31, 20, '하루1', 'OTHER', 5, NULL),
  (32, 13, '루루2', 'CAT', 8, NULL),
  (33, 26, '초코3', 'DOG', 7, 'XL'),
  (34, 23, '감자4', 'OTHER', 5, NULL),
  (35, 27, '감자5', 'OTHER', 14, NULL);

-- social_account
INSERT INTO `social_account` (`social_id`, `user_id`, `provider`, `provider_uid`) VALUES
  (1, 1, 'APPLE', '1_753425'),
  (2, 2, 'APPLE', '2_795612'),
  (3, 3, 'GOOGLE', '3_854717'),
  (4, 4, 'APPLE', '4_631756'),
  (5, 5, 'APPLE', '5_799287'),
  (6, 6, 'APPLE', '6_442027'),
  (7, 7, 'APPLE', '7_831076'),
  (8, 8, 'APPLE', '8_681343'),
  (9, 9, 'GOOGLE', '9_301158'),
  (10, 10, 'APPLE', '10_797229'),
  (11, 11, 'APPLE', '11_810219'),
  (12, 12, 'KAKAO', '12_282480'),
  (13, 13, 'KAKAO', '13_696750'),
  (14, 14, 'APPLE', '14_525800'),
  (15, 15, 'KAKAO', '15_974224');

-- boards (필수 선행)
INSERT INTO boards (board_id, board_type, board_name, is_active, created_at) VALUES
  (1, 'FREE',   '자유게시판', 1, '2025-09-01 00:00:00'),
  (2, 'INFO',   '정보게시판', 1, '2025-09-01 00:00:00'),
  (3, 'REVIEW', '후기게시판', 1, '2025-09-01 00:00:00'),
  (4, 'QNA',    'Q&A',       1, '2025-09-01 00:00:00');

-- board_banned_words
INSERT INTO `board_banned_words` (`banned_word_id`, `board_id`, `banned_word`, `created_at`) VALUES
  (1, 2, '욕설1', '2025-09-11 00:00:00'),
  (2, 3, '욕설2', '2025-09-12 00:00:00'),
  (3, 3, '도배', '2025-09-13 00:00:00'),
  (4, 3, '광고', '2025-09-14 00:00:00'),
  (5, 2, '불법', '2025-09-15 00:00:00'),
  (6, 1, '혐오', '2025-09-16 00:00:00'),
  (7, 3, '비방', '2025-09-17 00:00:00'),
  (8, 3, '사기', '2025-09-18 00:00:00'),
  (9, 1, '성인', '2025-09-19 00:00:00'),
  (10, 1, '도박', '2025-09-20 00:00:00'),
  (11, 3, '스팸', '2025-09-21 00:00:00'),
  (12, 1, '링크', '2025-09-22 00:00:00'),
  (13, 3, '홍보', '2025-09-23 00:00:00'),
  (14, 2, '정치', '2025-09-24 00:00:00'),
  (15, 2, '선동', '2025-09-25 00:00:00');

-- posts
INSERT INTO `posts` (`post_id`, `board_id`, `user_id`, `post_title`, `content`, `file_attached`, `status`, `view_count`, `created_at`, `updated_at`, `is_deleted`, `is_comment_enabled`) VALUES
  (1, 2, 22, '산책 코스 추천 부탁', '입장 줄이 길어서 오픈 시간보다 30분 일찍 가는 게 좋았어요.', 'N', 'DRAFT', 184, '2026-01-15 00:00:00', '2026-01-16 00:00:00', 0, 1),
  (2, 1, 12, '노즈워크 장난감 후기', '입장 줄이 길어서 오픈 시간보다 30분 일찍 가는 게 좋았어요.', 'N', 'DRAFT', 498, '2026-01-03 00:00:00', '2026-01-03 00:00:00', 0, 1),
  (3, 2, 20, '펫페어 꿀팁 공유', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'PUBLISHED', 293, '2026-01-01 00:00:00', '2026-01-03 00:00:00', 0, 1),
  (4, 2, 18, '행사장 주차 질문', '연어 베이스 간식 먹고 피부가 좋아진 느낌입니다. 다른 제품도 추천 부탁해요.', 'N', 'PUBLISHED', 129, '2026-01-04 00:00:00', '2026-01-07 00:00:00', 0, 1),
  (5, 1, 6, '행사장 주차 질문', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'PUBLISHED', 322, '2026-02-06 00:00:00', '2026-02-11 00:00:00', 0, 1),
  (6, 1, 4, '펫페어 꿀팁 공유', '퍼즐토이 난이도 조절이 좋아서 강아지가 오래 가지고 놀았어요.', 'N', 'DRAFT', 127, '2026-01-06 00:00:00', '2026-01-06 00:00:00', 0, 1),
  (7, 2, 20, '노즈워크 장난감 후기', '퍼즐토이 난이도 조절이 좋아서 강아지가 오래 가지고 놀았어요.', 'N', 'PUBLISHED', 194, '2026-02-03 00:00:00', '2026-02-06 00:00:00', 0, 1),
  (8, 2, 17, '노즈워크 장난감 후기', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'DRAFT', 317, '2026-02-06 00:00:00', '2026-02-06 00:00:00', 0, 1),
  (9, 3, 22, '산책 코스 추천 부탁', '입장 줄이 길어서 오픈 시간보다 30분 일찍 가는 게 좋았어요.', 'N', 'PUBLISHED', 338, '2026-01-17 00:00:00', '2026-01-17 00:00:00', 0, 1),
  (10, 1, 8, '펫페어 꿀팁 공유', '퍼즐토이 난이도 조절이 좋아서 강아지가 오래 가지고 놀았어요.', 'N', 'PUBLISHED', 1, '2026-01-11 00:00:00', '2026-01-14 00:00:00', 0, 1),
  (11, 3, 17, '노즈워크 장난감 후기', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'DRAFT', 118, '2026-01-03 00:00:00', '2026-01-05 00:00:00', 0, 1),
  (12, 2, 25, '행사장 주차 질문', '이번 주말에 갈 만한 산책 코스 있을까요? 주차 가능하면 좋겠어요.', 'N', 'PUBLISHED', 403, '2026-01-17 00:00:00', '2026-01-22 00:00:00', 0, 1),
  (13, 3, 21, '펫페어 꿀팁 공유', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'PUBLISHED', 115, '2026-02-04 00:00:00', '2026-02-09 00:00:00', 0, 1),
  (14, 2, 7, '펫페어 꿀팁 공유', '이번 주말에 갈 만한 산책 코스 있을까요? 주차 가능하면 좋겠어요.', 'N', 'PUBLISHED', 405, '2026-01-11 00:00:00', '2026-01-13 00:00:00', 0, 1),
  (15, 3, 22, '노즈워크 장난감 후기', '연어 베이스 간식 먹고 피부가 좋아진 느낌입니다. 다른 제품도 추천 부탁해요.', 'N', 'HIDDEN', 239, '2026-01-08 00:00:00', '2026-01-13 00:00:00', 0, 1),
  (16, 3, 12, '행사장 주차 질문', '연어 베이스 간식 먹고 피부가 좋아진 느낌입니다. 다른 제품도 추천 부탁해요.', 'N', 'HIDDEN', 41, '2026-01-29 00:00:00', '2026-02-02 00:00:00', 0, 1),
  (17, 2, 4, '알러지 간식 추천', '퍼즐토이 난이도 조절이 좋아서 강아지가 오래 가지고 놀았어요.', 'N', 'DRAFT', 46, '2026-01-02 00:00:00', '2026-01-03 00:00:00', 0, 1),
  (18, 3, 24, '노즈워크 장난감 후기', '이번 주말에 갈 만한 산책 코스 있을까요? 주차 가능하면 좋겠어요.', 'N', 'DRAFT', 20, '2026-02-06 00:00:00', '2026-02-07 00:00:00', 0, 1),
  (19, 3, 18, '행사장 주차 질문', '연어 베이스 간식 먹고 피부가 좋아진 느낌입니다. 다른 제품도 추천 부탁해요.', 'N', 'PUBLISHED', 223, '2026-02-07 00:00:00', '2026-02-12 00:00:00', 0, 1),
  (20, 2, 29, '산책 코스 추천 부탁', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'DRAFT', 170, '2026-01-27 00:00:00', '2026-01-29 00:00:00', 0, 1),
  (21, 1, 24, '펫페어 꿀팁 공유', '연어 베이스 간식 먹고 피부가 좋아진 느낌입니다. 다른 제품도 추천 부탁해요.', 'N', 'HIDDEN', 147, '2026-02-01 00:00:00', '2026-02-06 00:00:00', 0, 1),
  (22, 3, 15, '산책 코스 추천 부탁', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'PUBLISHED', 129, '2026-01-21 00:00:00', '2026-01-23 00:00:00', 0, 1),
  (23, 2, 6, '노즈워크 장난감 후기', '이번 주말에 갈 만한 산책 코스 있을까요? 주차 가능하면 좋겠어요.', 'N', 'HIDDEN', 27, '2026-01-27 00:00:00', '2026-01-28 00:00:00', 0, 1),
  (24, 2, 19, '노즈워크 장난감 후기', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'HIDDEN', 104, '2026-01-04 00:00:00', '2026-01-06 00:00:00', 0, 1),
  (25, 1, 20, '알러지 간식 추천', '행사장 주변 주차장이 만차라 셔틀 이용했어요.', 'N', 'HIDDEN', 14, '2026-01-08 00:00:00', '2026-01-13 00:00:00', 0, 1);


-- content_reports (신고) - 데모 데이터
INSERT INTO `content_reports`
  (`report_id`, `reporter_user_id`, `target_type`, `target_id`, `reason_code`, `reason_detail`, `reason`, `status`, `created_at`, `resolved_at`, `resolved_by_admin_id`)
VALUES
  (1, 22, 'POST',         3,  'SPAM',     NULL,                    '스팸/광고/도배',            'PENDING',  '2026-02-10 10:00:00', NULL,                   NULL),
  (2, 12, 'POST_COMMENT', 1,  'ABUSE',    NULL,                    '욕설/비방/괴롭힘',          'ACCEPTED', '2026-02-11 09:10:00', '2026-02-11 12:00:00', 1),
  (3, 20, 'REVIEW',       5,  'FRAUD',    '구매 유도 링크 포함',    '사기/사칭/허위정보 | 구매 유도 링크 포함', 'REJECTED', '2026-02-12 13:20:00', '2026-02-12 15:40:00', 1);


-- notification_settings
INSERT INTO `notification_settings` (`user_id`, `allow_marketing`, `updated_at`) VALUES
  (1, 0, '2026-01-11 00:00:00'),
  (2, 1, '2026-02-05 00:00:00'),
  (3, 0, '2026-02-05 00:00:00'),
  (4, 1, '2026-01-06 00:00:00'),
  (5, 0, '2026-01-08 00:00:00'),
  (6, 1, '2026-01-08 00:00:00'),
  (7, 0, '2026-02-01 00:00:00'),
  (8, 1, '2026-02-02 00:00:00'),
  (9, 1, '2026-01-27 00:00:00'),
  (10, 1, '2026-01-31 00:00:00'),
  (11, 0, '2026-01-30 00:00:00'),
  (12, 0, '2026-01-25 00:00:00'),
  (13, 0, '2026-02-08 00:00:00'),
  (14, 0, '2026-01-05 00:00:00'),
  (15, 1, '2026-01-27 00:00:00'),
  (16, 1, '2026-02-02 00:00:00'),
  (17, 1, '2026-01-01 00:00:00'),
  (18, 1, '2026-01-20 00:00:00'),
  (19, 1, '2026-01-10 00:00:00'),
  (20, 1, '2026-02-04 00:00:00'),
  (21, 1, '2026-01-23 00:00:00'),
  (22, 1, '2026-02-05 00:00:00'),
  (23, 1, '2026-01-30 00:00:00'),
  (24, 1, '2026-01-13 00:00:00'),
  (25, 0, '2026-02-06 00:00:00'),
  (26, 1, '2026-01-15 00:00:00'),
  (27, 1, '2026-01-03 00:00:00'),
  (28, 1, '2026-01-31 00:00:00'),
  (29, 1, '2026-01-25 00:00:00'),
  (30, 0, '2026-02-01 00:00:00');

-- galleries
INSERT INTO galleries
(`event_id`, `gallery_title`,`description`, `view_count`, `thumbnail_image_id`, `gallery_status`, `created_at`, `updated_at`) VALUES
(1, '현장 스케치', '행사 현장의 분위기를 담은 사진 모음입니다.', 1977, NULL, 'PUBLIC',  '2026-03-05 00:00:00', '2026-03-05 00:00:00'),
(6, '베스트 포토존', '행사 현장의 분위기를 담은 사진 모음입니다.', 1730, NULL, 'PUBLIC',  '2026-03-28 00:00:00', '2026-03-28 00:00:00'),
(8, '베스트 포토존', '행사 현장의 분위기를 담은 사진 모음입니다.', 1864, NULL, 'PRIVATE', '2026-03-06 00:00:00', '2026-03-06 00:00:00'),
(8, '베스트 포토존', '행사 현장의 분위기를 담은 사진 모음입니다.', 295,  NULL, 'BLINDED', '2026-03-19 00:00:00', '2026-03-19 00:00:00'),
(7, '현장 스케치', '행사 현장의 분위기를 담은 사진 모음입니다.', 961,  NULL, 'PUBLIC',  '2026-02-05 00:00:00', '2026-02-05 00:00:00'),
(5, '견생샷 모음', '행사 현장의 분위기를 담은 사진 모음입니다.', 1418, NULL, 'PUBLIC',  '2026-03-12 00:00:00', '2026-03-12 00:00:00'),
(7, '베스트 포토존', '행사 현장의 분위기를 담은 사진 모음입니다.', 672,  NULL, 'DELETED', '2026-03-27 00:00:00', '2026-03-27 00:00:00'),
(7, '견생샷 모음', '행사 현장의 분위기를 담은 사진 모음입니다.', 1471, NULL, 'PUBLIC',  '2026-03-13 00:00:00', '2026-03-13 00:00:00'),
(8, '베스트 포토존', '행사 현장의 분위기를 담은 사진 모음입니다.', 140,  NULL, 'PUBLIC',  '2026-03-12 00:00:00', '2026-03-12 00:00:00'),
(4, '견생샷 모음', '행사 현장의 분위기를 담은 사진 모음입니다.', 1529, NULL, 'PRIVATE', '2026-02-15 00:00:00', '2026-02-15 00:00:00');

-- payments (정합성 맞게 수정)
INSERT INTO payments (user_id, event_id, order_no, amount, payment_method, status, requested_at) VALUES
  (5, 7, 'ORD-20260201-00001', 15000.00, 'KAKAOPAY', 'REFUNDED', '2026-02-06 22:00:00'),
  (12, 1, 'ORD-20260201-00002', 15000.00, 'BANK', 'REQUESTED', '2026-02-10 11:00:00'),
  (14, 7, 'ORD-20260201-00003', 20000.00, 'CARD', 'FAILED', '2026-02-14 18:00:00'),
  (24, 3, 'ORD-20260201-00004', 20000.00, 'CARD', 'REQUESTED', '2026-02-20 12:00:00'),
  (22, 4, 'ORD-20260201-00005', 30000.00, 'CARD', 'APPROVED', '2026-02-15 20:00:00'),
  (11, 8, 'ORD-20260201-00006', 25000.00, 'KAKAOPAY', 'REFUNDED', '2026-03-01 09:00:00'),
  (24, 3, 'ORD-20260201-00007', 15000.00, 'OTHER', 'CANCELLED', '2026-02-19 09:00:00'),
  (23, 7, 'ORD-20260201-00008', 25000.00, 'OTHER', 'CANCELLED', '2026-02-07 12:00:00'),
  (30, 8, 'ORD-20260201-00009', 15000.00, 'CARD', 'REFUNDED', '2026-02-19 11:00:00'),
  (21, 5, 'ORD-20260201-00010', 25000.00, 'KAKAOPAY', 'REFUNDED', '2026-02-09 00:00:00'),
  (21, 1, 'ORD-20260201-00011', 50000.00, 'OTHER', 'CANCELLED', '2026-02-25 07:00:00'),
  (22, 6, 'ORD-20260201-00012', 20000.00, 'CARD', 'FAILED', '2026-02-09 21:00:00'),
  (27, 3, 'ORD-20260201-00013', 15000.00, 'KAKAOPAY', 'CANCELLED', '2026-02-26 14:00:00'),
  (4, 6, 'ORD-20260201-00014', 20000.00, 'KAKAOPAY', 'CANCELLED', '2026-02-11 23:00:00'),
  (16, 3, 'ORD-20260201-00015', 20000.00, 'CARD', 'FAILED', '2026-03-01 11:00:00'),
  (19, 5, 'ORD-20260201-00016', 20000.00, 'BANK', 'REFUNDED', '2026-03-03 09:00:00'),
  (26, 6, 'ORD-20260201-00017', 15000.00, 'OTHER', 'REQUESTED', '2026-02-05 07:00:00'),
  (30, 7, 'ORD-20260201-00018', 50000.00, 'BANK', 'REQUESTED', '2026-02-26 12:00:00'),
  (3, 5, 'ORD-20260201-00019', 50000.00, 'KAKAOPAY', 'REFUNDED', '2026-02-12 21:00:00'),
  (26, 5, 'ORD-20260201-00020', 50000.00, 'OTHER', 'CANCELLED', '2026-02-04 21:00:00')
ON DUPLICATE KEY UPDATE
  user_id      = VALUES(user_id),
  event_id     = VALUES(event_id),
  amount       = VALUES(amount),
  payment_method = VALUES(payment_method),
  status       = VALUES(status),
  requested_at = VALUES(requested_at);
  
  
-- payment_transactions (KAKAOPAY 건만 생성)
INSERT INTO payment_transactions
  (payment_id, pg_provider, pg_tid, status, raw_ready, requested_at, cancelled_at)
SELECT
  p.payment_id,
  x.pg_provider,
  x.pg_tid,
  x.status,
  x.raw_ready,
  x.requested_at,
  x.cancelled_at
FROM payments p
JOIN (
  SELECT 'ORD-20260201-00001' AS order_no, 'KAKAOPAY' AS pg_provider, 'TID-00001' AS pg_tid,
         'CANCELLED' AS status,
         JSON_OBJECT('tid','TID-00001') AS raw_ready,
         '2026-02-06 22:00:01' AS requested_at,
         '2026-02-06 22:05:00' AS cancelled_at
  UNION ALL
  SELECT 'ORD-20260201-00006', 'KAKAOPAY', 'TID-00006',
         'CANCELLED', JSON_OBJECT('tid','TID-00006'),
         '2026-03-01 09:00:01', '2026-03-01 09:03:00'
  UNION ALL
  SELECT 'ORD-20260201-00010', 'KAKAOPAY', 'TID-00010',
         'CANCELLED', JSON_OBJECT('tid','TID-00010'),
         '2026-02-09 00:00:01', '2026-02-09 00:02:00'
  UNION ALL
  SELECT 'ORD-20260201-00013', 'KAKAOPAY', 'TID-00013',
         'CANCELLED', JSON_OBJECT('tid','TID-00013'),
         '2026-02-26 14:00:01', '2026-02-26 14:04:00'
  UNION ALL
  SELECT 'ORD-20260201-00014', 'KAKAOPAY', 'TID-00014',
         'CANCELLED', JSON_OBJECT('tid','TID-00014'),
         '2026-02-11 23:00:01', '2026-02-11 23:02:00'
  UNION ALL
  SELECT 'ORD-20260201-00019', 'KAKAOPAY', 'TID-00019',
         'CANCELLED', JSON_OBJECT('tid','TID-00019'),
         '2026-02-12 21:00:01', '2026-02-12 21:06:00'
) x
  ON p.order_no = x.order_no
ON DUPLICATE KEY UPDATE
  pg_tid        = VALUES(pg_tid),
  status        = VALUES(status),
  raw_ready     = VALUES(raw_ready),
  requested_at  = VALUES(requested_at),
  cancelled_at  = VALUES(cancelled_at),
  approved_at   = NULL,
  failed_at     = NULL;

-- reviews
INSERT INTO `reviews` (`review_id`, `event_id`, `user_id`, `rating`, `content`, `view_count`, `created_at`, `updated_at`, `is_deleted`,`review_status`) VALUES
  (1, 1, 17, 3, '전반적으로 만족했어요. 체험이 다양했습니다.', 245, '2026-05-26 00:00:00', '2026-05-26 00:00:00', 0,'PUBLIC'),
  (2, 1, 30, 4, '주차가 조금 불편했지만 프로그램은 알찼어요.', 55, '2026-04-25 00:00:00', '2026-04-25 00:00:00', 0,'PUBLIC'),
  (3, 2, 18, 4, '전반적으로 만족했어요. 체험이 다양했습니다.', 41, '2026-06-04 00:00:00', '2026-06-04 00:00:00', 0,'PUBLIC'),
  (4, 2, 13, 3, '전반적으로 만족했어요. 체험이 다양했습니다.', 64, '2026-05-21 00:00:00', '2026-05-21 00:00:00', 0,'PUBLIC'),
  (5, 3, 11, 5, '주차가 조금 불편했지만 프로그램은 알찼어요.', 280, '2026-05-23 00:00:00', '2026-05-23 00:00:00', 0,'PUBLIC'),
  (6, 3, 25, 4, '주차가 조금 불편했지만 프로그램은 알찼어요.', 271, '2026-04-15 00:00:00', '2026-04-15 00:00:00', 0,'PUBLIC'),
  (7, 4, 12, 5, '주차가 조금 불편했지만 프로그램은 알찼어요.', 220, '2026-05-02 00:00:00', '2026-05-02 00:00:00', 0,'PUBLIC'),
  (8, 4, 6, 5, '전반적으로 만족했어요. 체험이 다양했습니다.', 282, '2026-06-14 00:00:00', '2026-06-14 00:00:00', 0,'PUBLIC'),
  (9, 5, 26, 3, '부스 구성이 좋고 상담이 친절했습니다.', 231, '2026-06-23 00:00:00', '2026-06-23 00:00:00', 0,'PUBLIC'),
  (10, 5, 10, 4, '부스 구성이 좋고 상담이 친절했습니다.', 204, '2026-04-26 00:00:00', '2026-04-26 00:00:00', 0,'PUBLIC'),
  (11, 6, 16, 3, '부스 구성이 좋고 상담이 친절했습니다.', 218, '2026-06-06 00:00:00', '2026-06-06 00:00:00', 0,'PUBLIC'),
  (12, 6, 13, 4, '부스 구성이 좋고 상담이 친절했습니다.', 78, '2026-05-29 00:00:00', '2026-05-29 00:00:00', 0,'PUBLIC'),
  (13, 7, 24, 4, '전반적으로 만족했어요. 체험이 다양했습니다.', 46, '2026-07-01 00:00:00', '2026-07-01 00:00:00', 0,'PUBLIC'),
  (14, 7, 29, 3, '부스 구성이 좋고 상담이 친절했습니다.', 49, '2026-03-15 00:00:00', '2026-03-15 00:00:00', 0,'PUBLIC'),
  (15, 8, 26, 4, '전반적으로 만족했어요. 체험이 다양했습니다.', 284, '2026-06-07 00:00:00', '2026-06-07 00:00:00', 0,'PUBLIC'),
  (16, 8, 4, 5, '주차가 조금 불편했지만 프로그램은 알찼어요.', 168, '2026-05-19 00:00:00', '2026-05-19 00:00:00', 0,'PUBLIC'),
  (17, 2, 29, 3, '부스 상담이 유익했습니다.', 184, '2026-03-27 00:00:00', '2026-03-27 00:00:00', 0,'PUBLIC'),
  (18, 2, 6, 3, '다음에도 또 방문하고 싶어요.', 70, '2026-06-21 00:00:00', '2026-06-21 00:00:00', 0,'PUBLIC');

-- booths (type enum migrated)
INSERT INTO `booths`
(`booth_id`, `event_id`, `place_name`, `type`, `description`, `company`, `zone`, `status`, `created_at`) VALUES
  (1, 2, 'B-01', 'SESSION_ROOM',  '문제행동/훈련 상담을 도와드립니다.', '살롱멍멍',     'ZONE_A', 'CLOSED', '2026-02-27 00:00:00'),
  (2, 5, 'B-02', 'CONTEST_ZONE',  '피팅존에서 사이즈 측정 후 추천해드립니다.', '포우케어', 'OTHER',  'OPEN',   '2026-03-15 00:00:00'),
  (3, 2, 'B-03', 'BOOTH_COMPANY', '즉석 촬영과 인화를 진행합니다.', '오리젠코리아', 'ZONE_C', 'PAUSED', '2026-02-03 00:00:00'),
  (4, 7, 'C-04', 'BOOTH_COMPANY', '시식 및 성분 상담을 제공합니다.', '펫웰니스랩',   'ZONE_C', 'OPEN',   '2026-01-31 00:00:00'),
  (5, 5, 'C-05', 'BOOTH_COMPANY', '즉석 촬영과 인화를 진행합니다.', '하울핏',       'ZONE_C', 'OPEN',   '2026-01-31 00:00:00'),
  (6, 3, 'C-06', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '오리젠코리아', 'ZONE_B', 'PAUSED', '2026-03-01 00:00:00'),
  (7, 1, 'A-07', 'BOOTH_COMPANY', '피팅존에서 사이즈 측정 후 추천해드립니다.', '스냅펫스튜디오', 'OTHER', 'CLOSED', '2026-02-10 00:00:00'),
  (8, 3, 'B-08', 'BOOTH_COMPANY', '즉석 촬영과 인화를 진행합니다.', '살롱멍멍',     'ZONE_A', 'OPEN',   '2026-01-29 00:00:00'),
  (9, 3, 'C-09', 'BOOTH_COMPANY', '시식 및 성분 상담을 제공합니다.', '하울핏',       'OTHER',  'PAUSED', '2026-02-16 00:00:00'),
  (10, 8, 'C-10', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '하울핏',     'ZONE_B', 'PAUSED', '2026-01-27 00:00:00'),
  (11, 6, 'B-11', 'BOOTH_COMPANY', '즉석 촬영과 인화를 진행합니다.', '댕댕수제키친', 'OTHER',  'PAUSED', '2026-03-03 00:00:00'),
  (12, 5, 'A-12', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '펫웰니스랩', 'ZONE_A', 'OPEN',   '2026-02-02 00:00:00'),
  (13, 5, 'A-13', 'BOOTH_COMPANY', '피팅존에서 사이즈 측정 후 추천해드립니다.', '살롱멍멍', 'ZONE_C', 'CLOSED', '2026-02-09 00:00:00'),
  (14, 2, 'A-14', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '포우케어',   'ZONE_B', 'CLOSED', '2026-02-23 00:00:00'),
  (15, 4, 'C-15', 'BOOTH_COMPANY', '즉석 촬영과 인화를 진행합니다.', '오리젠코리아', 'OTHER',  'PAUSED', '2026-01-22 00:00:00'),
  (16, 7, 'A-16', 'BOOTH_COMPANY', '시식 및 성분 상담을 제공합니다.', '살롱멍멍',     'ZONE_C', 'PAUSED', '2026-02-16 00:00:00'),
  (17, 7, 'C-17', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '하울핏',     'ZONE_A', 'CLOSED', '2026-01-21 00:00:00'),
  (18, 6, 'A-18', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '살롱멍멍',   'ZONE_C', 'OPEN',   '2026-02-16 00:00:00'),
  (19, 2, 'A-19', 'BOOTH_COMPANY', '문제행동/훈련 상담을 도와드립니다.', '펫웰니스랩', 'ZONE_A', 'CLOSED', '2026-03-16 00:00:00'),
  (20, 5, 'C-20', 'BOOTH_COMPANY', '피팅존에서 사이즈 측정 후 추천해드립니다.', '하울핏',   'ZONE_B', 'OPEN',   '2026-02-21 00:00:00'),
  (21, 2, 'C-21', 'BOOTH_COMPANY', '피팅존에서 사이즈 측정 후 추천해드립니다.', '살롱멍멍', 'ZONE_C', 'CLOSED', '2026-03-07 00:00:00'),
  (22, 3, 'A-22', 'BOOTH_COMPANY', '피팅존에서 사이즈 측정 후 추천해드립니다.', '하울핏',   'ZONE_B', 'OPEN',   '2026-02-27 00:00:00'),
  (23, 4, '세미나룸 1', 'SESSION_ROOM', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (24, 4, '세미나룸 2', 'SESSION_ROOM', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (25, 2, '체험존 T-01', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (26, 3, '체험존 T-02', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (27, 6, '메인무대', 'STAGE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (28, 7, '세미나룸 2', 'SESSION_ROOM', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (29, 6, '체험존 T-01', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (30, 4, '체험존 T-02', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (31, 8, '체험존 T-02', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (32, 1, '세미나룸 1', 'SESSION_ROOM', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00'),
  (33, 1, '체험존 T-02', 'BOOTH_EXPERIENCE', '프로그램 진행 장소', NULL, 'OTHER', 'OPEN', '2026-01-01 00:00:00');

-- event_program (booth_id 기반)
INSERT INTO `event_program`
(`program_id`, `event_id`, `category`, `program_title`, `description`, `start_at`, `end_at`, `booth_id`, `created_at`) VALUES
  -- event_id=4, 세미나룸2(24)
  (1, 4, 'SESSION', '수의사 Q&A 세션 #1', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-03-04 15:00:00', '2026-03-04 16:00:00', 1, '2026-02-13 00:00:00'),
  (2, 4, 'EXPERIENCE', '도그 피트니스 체험 #2', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-03-09 16:00:00', '2026-03-09 16:45:00', 2, '2026-02-04 00:00:00'),
  (15, 4, 'EXPERIENCE', '도그 피트니스 체험 #15', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-04-11 10:00:00', '2026-04-11 10:30:00', 3, '2026-01-16 00:00:00'),
  (8, 4, 'SESSION', '수의사 Q&A 세션 #8', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-03-13 16:00:00', '2026-03-13 16:45:00', 4, '2026-02-12 00:00:00'),
  (18, 4, 'EXPERIENCE', '도그 피트니스 체험 #18', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-03-06 16:00:00', '2026-03-06 17:00:00', 5, '2026-01-24 00:00:00'),
  (12, 4, 'EXPERIENCE', '도그 피트니스 체험 #12', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-03-28 11:00:00', '2026-03-28 11:45:00', 6, '2026-02-09 00:00:00'),
  (3, 7, 'CONTEST', '견스타 콘테스트 예선 #3', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-03-18 10:00:00', '2026-03-18 10:30:00', 7, '2026-01-30 00:00:00'),
  (4, 2, 'CONTEST', '견스타 콘테스트 예선 #4', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-03-31 15:00:00', '2026-03-31 15:30:00', 8, '2026-01-29 00:00:00'),
  (5, 6, 'EXPERIENCE', '도그 피트니스 체험 #5', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-06-04 16:00:00', '2026-06-04 17:00:00', 9, '2026-02-02 00:00:00'),
  (7, 6, 'CONTEST', '견스타 콘테스트 예선 #7', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-05-28 13:00:00', '2026-05-28 13:30:00', 10, '2026-01-29 00:00:00'),
  (6, 3, 'SESSION', '수의사 Q&A 세션 #6', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-05-23 10:00:00', '2026-05-23 10:45:00', 1, '2026-01-28 00:00:00'),
  (9, 6, 'CONTEST', '견스타 콘테스트 예선 #9', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-04-20 13:00:00', '2026-04-20 13:30:00', 2, '2026-02-14 00:00:00'),
  (10, 8, 'CONTEST', '견스타 콘테스트 예선 #10', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-05-24 11:00:00', '2026-05-24 12:00:00', 3, '2026-01-15 00:00:00'),
  (11, 1, 'SESSION', '수의사 Q&A 세션 #11', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-04-01 11:00:00', '2026-04-01 12:00:00', 4, '2026-01-17 00:00:00'),
  (13, 1, 'SESSION', '수의사 Q&A 세션 #13', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-06-18 11:00:00', '2026-06-18 11:30:00', 5, '2026-01-23 00:00:00'),
  (14, 3, 'CONTEST', '견스타 콘테스트 예선 #14', '참가견의 매력 포인트를 심사합니다. 현장 투표가 진행됩니다.', '2026-05-24 10:00:00', '2026-05-24 10:30:00', 6, '2026-01-26 00:00:00'),
  (16, 3, 'EXPERIENCE', '도그 피트니스 체험 #16', '간단한 운동/균형감각 훈련을 체험해보는 프로그램입니다.', '2026-04-23 15:00:00', '2026-04-23 15:30:00', 7, '2026-01-30 00:00:00'),
  (17, 8, 'SESSION', '수의사 Q&A 세션 #17', '수의사/훈련사에게 직접 질문할 수 있는 공개 상담 세션입니다.', '2026-05-05 15:00:00', '2026-05-05 15:30:00', 8, '2026-01-31 00:00:00');


-- event_apply
INSERT INTO `event_apply` (`apply_id`, `user_id`, `event_id`, `applied_at`, `status`) VALUES
  (1, 27, 3, '2026-01-19 00:00:00', 'CANCELLED'),
  (2, 17, 8, '2026-03-23 00:00:00', 'REJECTED'),
  (3, 30, 6, '2026-03-31 00:00:00', 'APPROVED'),
  (4, 17, 3, '2026-01-18 00:00:00', 'REJECTED'),
  (5, 23, 8, '2026-02-17 00:00:00', 'APPROVED'),
  (6, 14, 1, '2026-03-15 00:00:00', 'APPLIED'),
  (7, 17, 5, '2026-03-08 00:00:00', 'APPLIED'),
  (8, 5, 5, '2026-01-21 00:00:00', 'REJECTED'),
  (9, 21, 8, '2026-03-21 00:00:00', 'APPLIED'),
  (10, 28, 8, '2026-03-24 00:00:00', 'CANCELLED'),
  (11, 22, 6, '2026-03-11 00:00:00', 'CANCELLED'),
  (12, 17, 1, '2026-01-23 00:00:00', 'APPROVED'),
  (13, 19, 2, '2026-02-01 00:00:00', 'APPLIED'),
  (14, 25, 4, '2026-03-07 00:00:00', 'REJECTED'),
  (15, 14, 3, '2026-02-26 00:00:00', 'APPROVED'),
  (16, 16, 7, '2026-02-22 00:00:00', 'APPLIED'),
  (17, 5, 6, '2026-02-21 00:00:00', 'APPLIED'),
  (18, 12, 7, '2026-02-11 00:00:00', 'CANCELLED'),
  (19, 23, 5, '2026-03-01 00:00:00', 'CANCELLED'),
  (20, 12, 2, '2026-03-22 00:00:00', 'REJECTED'),
  (21, 29, 6, '2026-01-26 00:00:00', 'APPLIED'),
  (22, 19, 7, '2026-02-25 00:00:00', 'APPLIED'),
  (23, 12, 6, '2026-02-02 00:00:00', 'CANCELLED'),
  (24, 27, 6, '2026-03-13 00:00:00', 'CANCELLED'),
  (25, 7, 4, '2026-01-29 00:00:00', 'APPLIED'),
  (26, 30, 5, '2026-01-22 00:00:00', 'APPLIED'),
  (27, 22, 3, '2026-02-27 00:00:00', 'CANCELLED'),
  (28, 8, 3, '2026-03-30 00:00:00', 'CANCELLED'),
  (29, 4, 8, '2026-03-03 00:00:00', 'APPROVED'),
  (30, 17, 4, '2026-03-29 00:00:00', 'APPROVED');

-- notices
INSERT INTO `notices` (`notice_id`, `scope`, `event_id`, `notice_title`, `content`, `file_attached`, `is_pinned`, `status`, `created_by_admin_id`, `created_at`, `updated_at`) VALUES
  (1, 'EVENT', 4, '안전 수칙', '주차장이 혼잡할 수 있어 대중교통 이용을 권장합니다.', 'N', 1, 'DRAFT', 2, '2026-01-06 00:00:00', '2026-01-06 00:00:00'),
  (2, 'GLOBAL', NULL, '프로그램 변경', '부스 쿠폰 이벤트가 진행 중입니다. 스탬프를 모아 혜택을 받아가세요.', 'N', 1, 'HIDDEN', 2, '2026-01-07 00:00:00', '2026-01-07 00:00:00'),
  (3, 'EVENT', 5, '분실물 안내', '반려견 리드 착용 및 배변 매너를 준수해 주세요.', 'N', 0, 'HIDDEN', 2, '2026-01-08 00:00:00', '2026-01-08 00:00:00'),
  (4, 'GLOBAL', NULL, '주차 안내', '반려견 리드 착용 및 배변 매너를 준수해 주세요.', 'N', 0, 'PUBLISHED', 2, '2026-01-09 00:00:00', '2026-01-09 00:00:00'),
  (5, 'GLOBAL', NULL, '쿠폰/이벤트', '분실물은 운영본부에서 보관 중입니다.', 'Y', 0, 'DRAFT', 1, '2026-01-10 00:00:00', '2026-01-10 00:00:00'),
  (6, 'GLOBAL', NULL, '프로그램 변경', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'N', 0, 'PUBLISHED', 2, '2026-01-11 00:00:00', '2026-01-11 00:00:00'),
  (7, 'EVENT', 3, '분실물 안내', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'N', 0, 'PUBLISHED', 2, '2026-01-12 00:00:00', '2026-01-12 00:00:00'),
  (8, 'EVENT', 1, '분실물 안내', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'N', 0, 'DRAFT', 2, '2026-01-13 00:00:00', '2026-01-13 00:00:00'),
  (9, 'GLOBAL', NULL, '분실물 안내', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'N', 0, 'DRAFT', 1, '2026-01-14 00:00:00', '2026-01-14 00:00:00'),
  (10, 'GLOBAL', NULL, '프로그램 변경', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'Y', 0, 'HIDDEN', 2, '2026-01-15 00:00:00', '2026-01-15 00:00:00'),
  (11, 'GLOBAL', NULL, '주차 안내', '입장 QR은 마이페이지에서 확인 가능합니다. 현장 안내에 따라 이동해 주세요.', 'N', 0, 'DRAFT', 2, '2026-01-16 00:00:00', '2026-01-16 00:00:00'),
  (12, 'GLOBAL', NULL, '쿠폰/이벤트', '분실물은 운영본부에서 보관 중입니다.', 'N', 0, 'DRAFT', 1, '2026-01-17 00:00:00', '2026-01-17 00:00:00');

-- notification_send
INSERT INTO `notification_send` (`send_id`, `notification_id`, `sender_id`, `sender_type`, `channel`, `sent_at`) VALUES
  (1, 1, 1, 'ADMIN', 'APP', '2026-01-11 00:05:00'),
  (2, 2, 1, 'ADMIN', 'EMAIL', '2026-01-12 00:05:00'),
  (3, 3, 1, 'ADMIN', 'SMS', '2026-01-13 00:05:00'),
  (4, 4, 1, 'ADMIN', 'SMS', '2026-01-14 00:05:00'),
  (5, 5, 1, 'ADMIN', 'APP', '2026-01-15 00:05:00'),
  (6, 6, 1, 'ADMIN', 'PUSH', '2026-01-16 00:05:00'),
  (7, 7, 1, 'ADMIN', 'APP', '2026-01-17 00:05:00'),
  (8, 8, 1, 'ADMIN', 'EMAIL', '2026-01-18 00:05:00'),
  (9, 9, 1, 'ADMIN', 'SMS', '2026-01-19 00:05:00'),
  (10, 10, 1, 'ADMIN', 'SMS', '2026-01-20 00:05:00'),
  (11, 11, 1, 'ADMIN', 'PUSH', '2026-01-21 00:05:00'),
  (12, 12, 1, 'ADMIN', 'APP', '2026-01-22 00:05:00');

-- notification_inbox
INSERT INTO `notification_inbox` (`inbox_id`, `user_id`, `notification_id`, `created_at`, `target_type`, `target_id`) VALUES
  (1, 19, 6, '2026-02-12 00:00:00', NULL, NULL),
  (2, 20, 9, '2026-01-11 00:00:00', 'NOTICE', 9),
  (3, 15, 8, '2026-02-19 00:00:00', NULL, NULL),
  (4, 15, 6, '2026-02-01 00:00:00', 'EVENT', 1),
  (5, 28, 2, '2026-02-19 00:00:00', 'EVENT', 4),
  (6, 6, 10, '2026-01-18 00:00:00', 'NOTICE', 6),
  (7, 4, 6, '2026-01-21 00:00:00', 'NOTICE', 6),
  (8, 29, 11, '2026-02-19 00:00:00', 'EVENT', 8),
  (9, 8, 3, '2026-02-08 00:00:00', NULL, NULL),
  (10, 4, 5, '2026-01-12 00:00:00', NULL, NULL),
  (11, 28, 4, '2026-01-30 00:00:00', NULL, NULL),
  (12, 12, 9, '2026-01-26 00:00:00', 'EVENT', 8),
  (13, 4, 11, '2026-01-28 00:00:00', NULL, NULL),
  (14, 14, 1, '2026-01-27 00:00:00', 'NOTICE', 6),
  (15, 6, 6, '2026-02-07 00:00:00', 'EVENT', 7),
  (16, 15, 6, '2026-02-10 00:00:00', NULL, NULL),
  (17, 25, 8, '2026-01-15 00:00:00', 'EVENT', 5),
  (18, 26, 7, '2026-02-06 00:00:00', NULL, NULL),
  (19, 22, 3, '2026-01-30 00:00:00', 'NOTICE', 5),
  (20, 6, 2, '2026-01-29 00:00:00', 'EVENT', 5),
  (21, 17, 10, '2026-01-20 00:00:00', 'NOTICE', 7),
  (22, 25, 8, '2026-01-12 00:00:00', 'EVENT', 8),
  (23, 26, 6, '2026-01-27 00:00:00', 'NOTICE', 7),
  (24, 23, 1, '2026-02-19 00:00:00', NULL, NULL),
  (25, 15, 6, '2026-01-20 00:00:00', 'NOTICE', 12),
  (26, 3, 3, '2026-02-07 00:00:00', 'NOTICE', 11),
  (27, 4, 3, '2026-01-25 00:00:00', NULL, NULL),
  (28, 27, 11, '2026-02-03 00:00:00', 'EVENT', 6),
  (29, 21, 1, '2026-02-07 00:00:00', 'NOTICE', 3),
  (30, 14, 6, '2026-02-15 00:00:00', 'EVENT', 2),
  (31, 7, 9, '2026-01-30 00:00:00', 'EVENT', 7),
  (32, 23, 5, '2026-01-17 00:00:00', NULL, NULL),
  (33, 3, 12, '2026-02-10 00:00:00', NULL, NULL),
  (34, 19, 7, '2026-01-26 00:00:00', 'NOTICE', 2),
  (35, 27, 5, '2026-01-23 00:00:00', 'NOTICE', 8),
  (36, 22, 5, '2026-01-22 00:00:00', 'NOTICE', 8),
  (37, 6, 3, '2026-02-07 00:00:00', NULL, NULL),
  (38, 8, 12, '2026-01-30 00:00:00', 'EVENT', 2),
  (39, 24, 6, '2026-02-14 00:00:00', 'NOTICE', 2),
  (40, 20, 5, '2026-02-19 00:00:00', 'EVENT', 3);

-- user_interest_subscriptions
INSERT INTO `user_interest_subscriptions` (`subscription_id`, `user_id`, `interest_id`, `allow_inapp`, `allow_email`, `allow_sms`, `status`, `created_at`) VALUES
  (1, 13, 6, 0, 0, 0, 'PAUSED', '2026-01-27 00:00:00'),
  (2, 14, 6, 0, 0, 1, 'ACTIVE', '2026-02-06 00:00:00'),
  (3, 14, 5, 1, 1, 1, 'PAUSED', '2026-02-12 00:00:00'),
  (4, 3, 5, 0, 0, 1, 'ACTIVE', '2025-11-07 00:00:00'),
  (5, 24, 1, 0, 1, 0, 'PAUSED', '2026-01-27 00:00:00'),
  (6, 11, 2, 0, 1, 0, 'ACTIVE', '2025-12-16 00:00:00'),
  (7, 29, 4, 0, 0, 1, 'ACTIVE', '2026-01-05 00:00:00'),
  (8, 28, 7, 1, 0, 1, 'PAUSED', '2025-12-24 00:00:00'),
  (9, 28, 6, 1, 0, 0, 'PAUSED', '2025-11-26 00:00:00'),
  (10, 22, 7, 1, 0, 1, 'ACTIVE', '2026-02-08 00:00:00'),
  (11, 26, 2, 1, 1, 0, 'ACTIVE', '2025-11-24 00:00:00'),
  (12, 8, 6, 0, 1, 0, 'PAUSED', '2025-12-06 00:00:00'),
  (13, 20, 3, 0, 0, 1, 'ACTIVE', '2025-12-13 00:00:00'),
  (14, 17, 6, 0, 0, 0, 'PAUSED', '2026-01-16 00:00:00'),
  (15, 4, 7, 1, 1, 1, 'ACTIVE', '2026-02-09 00:00:00'),
  (16, 25, 3, 0, 0, 0, 'ACTIVE', '2025-12-24 00:00:00'),
  (17, 20, 5, 1, 0, 1, 'ACTIVE', '2026-02-22 00:00:00'),
  (18, 9, 6, 1, 1, 1, 'PAUSED', '2025-11-28 00:00:00'),
  (19, 27, 5, 1, 0, 0, 'PAUSED', '2025-12-28 00:00:00'),
  (20, 10, 6, 0, 0, 1, 'PAUSED', '2026-02-26 00:00:00'),
  (21, 28, 1, 1, 1, 1, 'ACTIVE', '2026-02-25 00:00:00'),
  (22, 19, 7, 1, 1, 1, 'ACTIVE', '2025-12-08 00:00:00'),
  (23, 23, 2, 1, 0, 0, 'ACTIVE', '2026-02-07 00:00:00'),
  (24, 3, 6, 0, 0, 0, 'PAUSED', '2026-02-15 00:00:00'),
  (25, 6, 2, 1, 0, 0, 'ACTIVE', '2025-12-29 00:00:00'),
  (26, 4, 1, 0, 0, 0, 'PAUSED', '2026-01-11 00:00:00'),
  (27, 5, 5, 0, 1, 1, 'PAUSED', '2025-12-28 00:00:00'),
  (28, 23, 4, 1, 1, 0, 'PAUSED', '2026-01-26 00:00:00'),
  (29, 6, 5, 0, 0, 0, 'ACTIVE', '2025-12-16 00:00:00'),
  (30, 19, 1, 1, 1, 0, 'PAUSED', '2026-02-06 00:00:00'),
  (31, 17, 4, 1, 0, 1, 'ACTIVE', '2026-01-08 00:00:00'),
  (32, 10, 2, 1, 1, 0, 'PAUSED', '2026-01-26 00:00:00'),
  (33, 26, 6, 1, 0, 0, 'ACTIVE', '2025-11-06 00:00:00'),
  (34, 22, 4, 0, 1, 0, 'PAUSED', '2025-11-28 00:00:00'),
  (35, 16, 6, 0, 0, 0, 'ACTIVE', '2026-01-18 00:00:00'),
  (36, 29, 3, 0, 0, 0, 'ACTIVE', '2026-02-17 00:00:00'),
  (37, 20, 1, 1, 0, 1, 'ACTIVE', '2025-11-26 00:00:00'),
  (38, 26, 5, 1, 1, 1, 'ACTIVE', '2026-01-25 00:00:00'),
  (39, 6, 3, 0, 0, 1, 'PAUSED', '2025-12-28 00:00:00'),
  (40, 13, 5, 1, 0, 1, 'PAUSED', '2025-12-25 00:00:00'),
  (41, 8, 1, 1, 0, 0, 'PAUSED', '2025-12-06 00:00:00'),
  (42, 7, 6, 1, 1, 1, 'PAUSED', '2025-12-16 00:00:00'),
  (43, 27, 3, 1, 0, 0, 'ACTIVE', '2026-02-16 00:00:00'),
  (44, 11, 7, 0, 0, 1, 'ACTIVE', '2026-02-02 00:00:00'),
  (45, 5, 1, 0, 1, 0, 'ACTIVE', '2026-01-10 00:00:00'),
  (46, 11, 5, 1, 0, 1, 'PAUSED', '2025-11-29 00:00:00'),
  (47, 26, 7, 1, 0, 1, 'ACTIVE', '2025-12-21 00:00:00'),
  (48, 10, 7, 0, 0, 1, 'ACTIVE', '2025-11-23 00:00:00'),
  (49, 21, 5, 0, 1, 1, 'ACTIVE', '2025-11-29 00:00:00'),
  (50, 27, 4, 0, 0, 1, 'PAUSED', '2025-11-30 00:00:00'),
  (51, 4, 6, 0, 1, 1, 'PAUSED', '2026-02-26 00:00:00'),
  (52, 17, 1, 0, 1, 0, 'PAUSED', '2026-02-15 00:00:00'),
  (53, 26, 3, 0, 1, 1, 'PAUSED', '2026-01-15 00:00:00'),
  (54, 23, 7, 0, 1, 1, 'ACTIVE', '2026-01-06 00:00:00'),
  (55, 15, 3, 1, 1, 1, 'ACTIVE', '2026-01-04 00:00:00'),
  (56, 7, 4, 0, 0, 0, 'PAUSED', '2025-11-28 00:00:00'),
  (57, 7, 2, 0, 1, 0, 'ACTIVE', '2025-12-24 00:00:00'),
  (58, 28, 3, 0, 1, 1, 'PAUSED', '2025-11-27 00:00:00'),
  (59, 21, 2, 1, 0, 0, 'ACTIVE', '2025-11-17 00:00:00'),
  (60, 8, 2, 0, 0, 0, 'ACTIVE', '2025-12-04 00:00:00');

-- inquiry_answers
INSERT INTO `inquiry_answers` (`answer_id`, `inquiry_id`, `admin_id`, `content`, `created_at`) VALUES
  (1, 3, 1, '확인 후 안내드렸습니다. 추가 문의가 있으면 남겨주세요.', '2026-01-28 06:00:00'),
  (2, 4, 2, '프로그램 일정은 공지사항에 업데이트되었습니다. 감사합니다.', '2026-01-20 06:00:00'),
  (3, 5, 2, '확인 후 안내드렸습니다. 추가 문의가 있으면 남겨주세요.', '2026-01-20 06:00:00'),
  (4, 7, 1, '프로그램 일정은 공지사항에 업데이트되었습니다. 감사합니다.', '2026-01-22 06:00:00'),
  (5, 8, 2, '확인 후 안내드렸습니다. 추가 문의가 있으면 남겨주세요.', '2026-01-27 06:00:00'),
  (6, 9, 2, '확인 후 안내드렸습니다. 추가 문의가 있으면 남겨주세요.', '2026-01-15 06:00:00'),
  (7, 12, 2, '확인 후 안내드렸습니다. 추가 문의가 있으면 남겨주세요.', '2026-01-12 06:00:00'),
  (8, 13, 2, '해당 건은 환불 정책에 따라 처리 가능합니다. 결제번호를 알려주세요.', '2026-01-15 06:00:00'),
  (9, 11, 1, '관련 부서에 전달했습니다. 추가 안내 드리겠습니다.', '2026-01-16 12:00:00'),
  (10, 15, 2, '정상적으로 반영되었습니다. 앱을 재실행해 주세요.', '2026-01-25 09:00:00'),
  (11, 15, 2, '관련 부서에 전달했습니다. 추가 안내 드리겠습니다.', '2026-01-25 06:00:00'),
  (12, 2, 2, '관련 부서에 전달했습니다. 추가 안내 드리겠습니다.', '2026-01-19 15:00:00');

-- qr_logs (event_id 제거 버전, qr_codes.event_id 기준 booth_id 정합 매핑)
INSERT INTO `qr_logs` (`log_id`, `qr_id`, `booth_id`, `check_type`, `checked_at`) VALUES
  (1, 19, 2, 'CHECKOUT', '2026-02-22 13:46:00'),
  (2, 1, 7, 'CHECKOUT', '2026-02-27 09:47:00'),
  (3, 7, 2, 'CHECKIN', '2026-02-14 14:44:00'),
  (4, 3, 7, 'CHECKIN', '2026-03-02 16:02:00'),
  (5, 10, 4, 'CHECKIN', '2026-02-25 11:49:00'),
  (6, 21, 10, 'CHECKOUT', '2026-03-01 15:28:00'),
  (7, 13, 4, 'CHECKIN', '2026-02-22 19:55:00'),
  (8, 18, 15, 'CHECKOUT', '2026-02-04 11:34:00'),
  (9, 13, 4, 'CHECKIN', '2026-02-27 09:48:00'),
  (10, 1, 7, 'CHECKOUT', '2026-02-22 17:27:00'),
  (11, 18, 15, 'CHECKIN', '2026-02-08 16:22:00'),
  (12, 5, 15, 'CHECKIN', '2026-03-02 10:02:00'),
  (13, 22, 4, 'CHECKIN', '2026-02-08 12:04:00'),
  (14, 4, 6, 'CHECKOUT', '2026-02-20 19:45:00'),
  (15, 2, 1, 'CHECKIN', '2026-02-13 16:14:00'),
  (16, 18, 15, 'CHECKIN', '2026-02-05 17:18:00'),
  (17, 8, 6, 'CHECKOUT', '2026-02-08 13:56:00'),
  (18, 5, 15, 'CHECKOUT', '2026-02-10 13:03:00'),
  (19, 18, 15, 'CHECKOUT', '2026-02-18 16:03:00'),
  (20, 12, 10, 'CHECKOUT', '2026-02-23 15:26:00'),
  (21, 5, 15, 'CHECKOUT', '2026-02-06 17:30:00'),
  (22, 8, 6, 'CHECKOUT', '2026-02-28 11:51:00'),
  (23, 15, 7, 'CHECKOUT', '2026-03-03 15:35:00'),
  (24, 17, 6, 'CHECKOUT', '2026-02-08 13:13:00'),
  (25, 11, 15, 'CHECKOUT', '2026-02-28 14:05:00'),
  (26, 18, 15, 'CHECKIN', '2026-02-09 15:43:00'),
  (27, 20, 7, 'CHECKIN', '2026-02-07 18:46:00'),
  (28, 22, 4, 'CHECKOUT', '2026-02-07 14:19:00'),
  (29, 1, 7, 'CHECKIN', '2026-03-03 10:47:00'),
  (30, 25, 2, 'CHECKIN', '2026-02-23 18:45:00'),
  (31, 7, 2, 'CHECKIN', '2026-02-18 14:49:00'),
  (32, 10, 4, 'CHECKOUT', '2026-02-18 19:22:00'),
  (33, 10, 4, 'CHECKOUT', '2026-02-17 16:29:00'),
  (34, 4, 6, 'CHECKOUT', '2026-03-02 12:23:00'),
  (35, 11, 15, 'CHECKIN', '2026-02-19 12:47:00'),
  (36, 5, 15, 'CHECKOUT', '2026-02-18 18:37:00'),
  (37, 24, 11, 'CHECKOUT', '2026-02-05 12:21:00'),
  (38, 8, 6, 'CHECKIN', '2026-02-16 17:41:00'),
  (39, 22, 4, 'CHECKOUT', '2026-02-25 16:46:00'),
  (40, 21, 10, 'CHECKOUT', '2026-02-06 14:10:00');


-- post_comments
INSERT INTO `post_comments` (`comment_id`, `post_id`, `user_id`, `content`, `created_at`, `updated_at`, `is_deleted`) VALUES
  (1, 5, 26, '사진 너무 귀엽네요 ㅋㅋ', '2026-02-04 00:00:00', '2026-02-04 00:00:00', 0),
  (2, 6, 20, '좋은 정보 감사합니다!', '2026-01-04 00:00:00', '2026-01-04 00:00:00', 0),
  (3, 3, 29, '좋은 정보 감사합니다!', '2026-01-04 00:00:00', '2026-01-04 00:00:00', 0),
  (4, 14, 7, '저도 같은 경험 있었어요.', '2026-02-10 00:00:00', '2026-02-10 00:00:00', 0),
  (5, 3, 25, '좋은 정보 감사합니다!', '2026-01-10 00:00:00', '2026-01-10 00:00:00', 0),
  (6, 7, 19, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-30 00:00:00', '2026-01-30 00:00:00', 0),
  (7, 2, 22, '사진 너무 귀엽네요 ㅋㅋ', '2026-02-10 00:00:00', '2026-02-10 00:00:00', 0),
  (8, 22, 18, '좋은 정보 감사합니다!', '2026-01-02 00:00:00', '2026-01-02 00:00:00', 0),
  (9, 18, 20, '좋은 정보 감사합니다!', '2026-01-27 00:00:00', '2026-01-27 00:00:00', 0),
  (10, 1, 19, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-18 00:00:00', '2026-01-18 00:00:00', 0),
  (11, 1, 19, '저도 같은 경험 있었어요.', '2026-01-28 00:00:00', '2026-01-28 00:00:00', 0),
  (12, 4, 6, '저도 같은 경험 있었어요.', '2026-02-03 00:00:00', '2026-02-03 00:00:00', 0),
  (13, 8, 9, '주차는 2번 게이트가 그나마 빨라요.', '2026-02-09 00:00:00', '2026-02-09 00:00:00', 0),
  (14, 12, 11, '좋은 정보 감사합니다!', '2026-01-26 00:00:00', '2026-01-26 00:00:00', 0),
  (15, 12, 15, '저도 같은 경험 있었어요.', '2026-01-30 00:00:00', '2026-01-30 00:00:00', 0),
  (16, 23, 10, '좋은 정보 감사합니다!', '2026-01-20 00:00:00', '2026-01-20 00:00:00', 0),
  (17, 21, 30, '좋은 정보 감사합니다!', '2026-01-03 00:00:00', '2026-01-03 00:00:00', 0),
  (18, 13, 15, '사진 너무 귀엽네요 ㅋㅋ', '2026-01-25 00:00:00', '2026-01-25 00:00:00', 0),
  (19, 2, 23, '저도 같은 경험 있었어요.', '2026-01-01 00:00:00', '2026-01-01 00:00:00', 0),
  (20, 3, 18, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-28 00:00:00', '2026-01-28 00:00:00', 0),
  (21, 19, 30, '좋은 정보 감사합니다!', '2026-01-07 00:00:00', '2026-01-07 00:00:00', 0),
  (22, 8, 9, '사진 너무 귀엽네요 ㅋㅋ', '2026-02-06 00:00:00', '2026-02-06 00:00:00', 0),
  (23, 9, 4, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-05 00:00:00', '2026-01-05 00:00:00', 0),
  (24, 18, 21, '저도 같은 경험 있었어요.', '2026-01-03 00:00:00', '2026-01-03 00:00:00', 0),
  (25, 11, 3, '저도 같은 경험 있었어요.', '2026-01-14 00:00:00', '2026-01-14 00:00:00', 0),
  (26, 25, 29, '좋은 정보 감사합니다!', '2026-01-26 00:00:00', '2026-01-26 00:00:00', 0),
  (27, 10, 8, '저도 같은 경험 있었어요.', '2026-02-06 00:00:00', '2026-02-06 00:00:00', 0),
  (28, 19, 29, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-25 00:00:00', '2026-01-25 00:00:00', 0),
  (29, 13, 27, '좋은 정보 감사합니다!', '2026-01-09 00:00:00', '2026-01-09 00:00:00', 0),
  (30, 17, 26, '좋은 정보 감사합니다!', '2026-01-23 00:00:00', '2026-01-23 00:00:00', 0),
  (31, 4, 16, '좋은 정보 감사합니다!', '2026-01-15 00:00:00', '2026-01-15 00:00:00', 0),
  (32, 11, 22, '사진 너무 귀엽네요 ㅋㅋ', '2026-02-09 00:00:00', '2026-02-09 00:00:00', 0),
  (33, 25, 13, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-02 00:00:00', '2026-01-02 00:00:00', 0),
  (34, 15, 18, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-15 00:00:00', '2026-01-15 00:00:00', 0),
  (35, 18, 15, '저도 같은 경험 있었어요.', '2026-01-28 00:00:00', '2026-01-28 00:00:00', 0),
  (36, 22, 21, '좋은 정보 감사합니다!', '2026-01-25 00:00:00', '2026-01-25 00:00:00', 0),
  (37, 25, 22, '저도 같은 경험 있었어요.', '2026-01-19 00:00:00', '2026-01-19 00:00:00', 0),
  (38, 23, 5, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-06 00:00:00', '2026-01-06 00:00:00', 0),
  (39, 5, 15, '저도 같은 경험 있었어요.', '2026-02-10 00:00:00', '2026-02-10 00:00:00', 0),
  (40, 24, 15, '주차는 2번 게이트가 그나마 빨라요.', '2026-01-21 00:00:00', '2026-01-21 00:00:00', 0);

-- gallery_images
INSERT INTO `gallery_images` (`image_id`, `gallery_id`, `original_url`, `thumb_url`, `image_order`, `mime_type`, `file_size`, `created_at`) VALUES
  (1, 1, 'https://cdn.pupoo.io/gallery/1/img1.jpg', 'https://cdn.pupoo.io/gallery/1/thumb1.jpg', 1, 'jpeg', 373453, '2026-03-05 00:01:00'),
  (2, 1, 'https://cdn.pupoo.io/gallery/1/img2.jpg', 'https://cdn.pupoo.io/gallery/1/thumb2.jpg', 2, 'jpeg', 341932, '2026-03-05 00:02:00'),
  (3, 2, 'https://cdn.pupoo.io/gallery/2/img1.jpg', 'https://cdn.pupoo.io/gallery/2/thumb1.jpg', 1, 'jpeg', 160895, '2026-03-28 00:01:00'),
  (4, 2, 'https://cdn.pupoo.io/gallery/2/img2.jpg', 'https://cdn.pupoo.io/gallery/2/thumb2.jpg', 2, 'jpeg', 796483, '2026-03-28 00:02:00'),
  (5, 3, 'https://cdn.pupoo.io/gallery/3/img1.jpg', 'https://cdn.pupoo.io/gallery/3/thumb1.jpg', 1, 'jpeg', 1082678, '2026-03-06 00:01:00'),
  (6, 3, 'https://cdn.pupoo.io/gallery/3/img2.jpg', 'https://cdn.pupoo.io/gallery/3/thumb2.jpg', 2, 'jpeg', 904801, '2026-03-06 00:02:00'),
  (7, 4, 'https://cdn.pupoo.io/gallery/4/img1.jpg', 'https://cdn.pupoo.io/gallery/4/thumb1.jpg', 1, 'jpeg', 715741, '2026-03-19 00:01:00'),
  (8, 4, 'https://cdn.pupoo.io/gallery/4/img2.jpg', 'https://cdn.pupoo.io/gallery/4/thumb2.jpg', 2, 'jpeg', 364394, '2026-03-19 00:02:00'),
  (9, 5, 'https://cdn.pupoo.io/gallery/5/img1.jpg', 'https://cdn.pupoo.io/gallery/5/thumb1.jpg', 1, 'jpeg', 427887, '2026-02-05 00:01:00'),
  (10, 5, 'https://cdn.pupoo.io/gallery/5/img2.jpg', 'https://cdn.pupoo.io/gallery/5/thumb2.jpg', 2, 'jpeg', 333075, '2026-02-05 00:02:00'),
  (11, 6, 'https://cdn.pupoo.io/gallery/6/img1.jpg', 'https://cdn.pupoo.io/gallery/6/thumb1.jpg', 1, 'jpeg', 542989, '2026-03-12 00:01:00'),
  (12, 6, 'https://cdn.pupoo.io/gallery/6/img2.jpg', 'https://cdn.pupoo.io/gallery/6/thumb2.jpg', 2, 'jpeg', 1053829, '2026-03-12 00:02:00'),
  (13, 7, 'https://cdn.pupoo.io/gallery/7/img1.jpg', 'https://cdn.pupoo.io/gallery/7/thumb1.jpg', 1, 'jpeg', 1091293, '2026-03-27 00:01:00'),
  (14, 7, 'https://cdn.pupoo.io/gallery/7/img2.jpg', 'https://cdn.pupoo.io/gallery/7/thumb2.jpg', 2, 'jpeg', 1005730, '2026-03-27 00:02:00'),
  (15, 8, 'https://cdn.pupoo.io/gallery/8/img1.jpg', 'https://cdn.pupoo.io/gallery/8/thumb1.jpg', 1, 'jpeg', 366620, '2026-03-13 00:01:00'),
  (16, 8, 'https://cdn.pupoo.io/gallery/8/img2.jpg', 'https://cdn.pupoo.io/gallery/8/thumb2.jpg', 2, 'jpeg', 205075, '2026-03-13 00:02:00'),
  (17, 9, 'https://cdn.pupoo.io/gallery/9/img1.jpg', 'https://cdn.pupoo.io/gallery/9/thumb1.jpg', 1, 'jpeg', 337944, '2026-03-12 00:01:00'),
  (18, 9, 'https://cdn.pupoo.io/gallery/9/img2.jpg', 'https://cdn.pupoo.io/gallery/9/thumb2.jpg', 2, 'jpeg', 892212, '2026-03-12 00:02:00'),
  (19, 10, 'https://cdn.pupoo.io/gallery/10/img1.jpg', 'https://cdn.pupoo.io/gallery/10/thumb1.jpg', 1, 'jpeg', 345169, '2026-02-15 00:01:00'),
  (20, 10, 'https://cdn.pupoo.io/gallery/10/img2.jpg', 'https://cdn.pupoo.io/gallery/10/thumb2.jpg', 2, 'jpeg', 830379, '2026-02-15 00:02:00'),
  (21, 5, 'https://cdn.pupoo.io/gallery/5/img3.jpg', 'https://cdn.pupoo.io/gallery/5/thumb3.jpg', 3, 'jpeg', 958904, '2026-02-05 00:03:00'),
  (22, 8, 'https://cdn.pupoo.io/gallery/8/img3.jpg', 'https://cdn.pupoo.io/gallery/8/thumb3.jpg', 3, 'jpeg', 1034452, '2026-03-13 00:03:00'),
  (23, 3, 'https://cdn.pupoo.io/gallery/3/img3.jpg', 'https://cdn.pupoo.io/gallery/3/thumb3.jpg', 3, 'jpeg', 387096, '2026-03-06 00:03:00'),
  (24, 3, 'https://cdn.pupoo.io/gallery/3/img4.jpg', 'https://cdn.pupoo.io/gallery/3/thumb4.jpg', 4, 'jpeg', 272990, '2026-03-06 00:04:00'),
  (25, 3, 'https://cdn.pupoo.io/gallery/3/img5.jpg', 'https://cdn.pupoo.io/gallery/3/thumb5.jpg', 5, 'jpeg', 367502, '2026-03-06 00:05:00');

-- gallery_likes
INSERT INTO `gallery_likes` (`like_id`, `gallery_id`, `user_id`, `created_at`) VALUES
  (1, 7, 3, '2026-02-19 00:00:00'),
  (2, 7, 15, '2026-03-22 00:00:00'),
  (3, 2, 26, '2026-03-30 00:00:00'),
  (4, 9, 10, '2026-03-09 00:00:00'),
  (5, 9, 8, '2026-03-16 00:00:00'),
  (6, 7, 8, '2026-02-09 00:00:00'),
  (7, 5, 12, '2026-02-18 00:00:00'),
  (8, 8, 7, '2026-02-05 00:00:00'),
  (9, 3, 16, '2026-02-18 00:00:00'),
  (10, 7, 12, '2026-03-03 00:00:00'),
  (11, 2, 14, '2026-02-17 00:00:00'),
  (12, 4, 26, '2026-03-13 00:00:00'),
  (13, 8, 22, '2026-03-12 00:00:00'),
  (14, 4, 17, '2026-02-07 00:00:00'),
  (15, 3, 12, '2026-02-01 00:00:00'),
  (16, 7, 13, '2026-03-26 00:00:00'),
  (17, 10, 15, '2026-03-24 00:00:00'),
  (18, 6, 17, '2026-02-22 00:00:00'),
  (19, 7, 29, '2026-03-25 00:00:00'),
  (20, 10, 7, '2026-02-20 00:00:00'),
  (21, 6, 22, '2026-04-02 00:00:00'),
  (22, 4, 18, '2026-02-21 00:00:00'),
  (23, 3, 15, '2026-02-21 00:00:00'),
  (24, 5, 26, '2026-03-17 00:00:00'),
  (25, 8, 21, '2026-03-23 00:00:00'),
  (26, 4, 13, '2026-02-25 00:00:00'),
  (27, 5, 29, '2026-03-23 00:00:00'),
  (28, 7, 14, '2026-02-08 00:00:00'),
  (29, 10, 9, '2026-03-10 00:00:00'),
  (30, 9, 3, '2026-04-02 00:00:00'),
  (31, 8, 25, '2026-02-14 00:00:00'),
  (32, 8, 28, '2026-02-19 00:00:00'),
  (33, 2, 29, '2026-03-27 00:00:00'),
  (34, 7, 24, '2026-03-04 00:00:00'),
  (35, 3, 23, '2026-02-20 00:00:00'),
  (36, 4, 11, '2026-03-15 00:00:00'),
  (37, 3, 25, '2026-02-28 00:00:00'),
  (38, 7, 5, '2026-03-01 00:00:00'),
  (39, 10, 18, '2026-03-10 00:00:00'),
  (40, 7, 20, '2026-03-05 00:00:00');

-- refunds (CHECK: COMPLETED만 completed_at 허용)
INSERT INTO `refunds`
(`refund_id`, `payment_id`, `refund_amount`, `reason`, `status`, `requested_at`, `completed_at`) VALUES
  (1,  1, 15000.00, '기타',      'REQUESTED', '2026-02-06 23:00:00', NULL),
  (2,  6, 25000.00, '중복 결제',  'REQUESTED', '2026-03-01 10:00:00', NULL),
  (3,  7, 15000.00, '고객 변심',  'APPROVED',  '2026-02-19 10:00:00', NULL),
  (4,  8, 25000.00, '중복 결제',  'APPROVED',  '2026-02-07 13:00:00', NULL),
  (5,  9, 15000.00, '고객 변심',  'COMPLETED', '2026-02-19 12:00:00', '2026-02-21 11:00:00'),
  (6, 10, 25000.00, '중복 결제',  'COMPLETED', '2026-02-09 01:00:00', '2026-02-11 00:00:00'),
  (7, 11, 50000.00, '고객 변심',  'REQUESTED', '2026-02-25 08:00:00', NULL),
  (8, 13, 15000.00, '고객 변심',  'REJECTED',  '2026-02-26 15:00:00', NULL);


-- congestions
INSERT INTO `congestions`
(`congestion_id`, `program_id`, `zone`, `place_name`, `congestion_level`, `measured_at`)
VALUES
  (1, 8, 'ZONE_B', '체험존 T-01', 3, '2026-04-20 16:50:00'),
  (2, 17, 'ZONE_B', '세미나룸 2', 2, '2026-05-01 10:20:00'),
  (3, 14, 'ZONE_A', '메인무대', 4, '2026-03-19 14:20:00'),
  (4, 11, 'OTHER', '세미나룸 1', 4, '2026-05-01 14:30:00'),
  (5, 4, 'OTHER', '체험존 T-01', 3, '2026-03-09 13:00:00'),
  (6, 4, 'ZONE_A', '세미나룸 2', 4, '2026-03-14 11:50:00'),
  (7, 8, 'ZONE_B', '체험존 T-02', 2, '2026-04-12 17:30:00'),
  (8, 15, 'ZONE_B', '체험존 T-01', 4, '2026-03-24 11:50:00'),
  (9, 14, 'OTHER', '메인무대', 4, '2026-05-18 12:30:00'),
  (10, 14, 'OTHER', '메인무대', 4, '2026-03-28 12:20:00'),
  (11, 3, 'ZONE_A', '체험존 T-02', 2, '2026-04-16 14:10:00'),
  (12, 15, 'ZONE_A', '세미나룸 2', 4, '2026-06-19 16:40:00'),
  (13, 11, 'OTHER', '체험존 T-02', 3, '2026-05-15 10:20:00'),
  (14, 12, 'OTHER', '체험존 T-02', 2, '2026-06-13 13:40:00'),
  (15, 3, 'ZONE_B', '세미나룸 2', 2, '2026-03-31 13:00:00'),
  (16, 6, 'ZONE_C', '세미나룸 1', 4, '2026-04-19 15:40:00'),
  (17, 5, 'OTHER', '체험존 T-01', 2, '2026-05-02 17:50:00'),
  (18, 6, 'ZONE_B', '체험존 T-01', 3, '2026-03-18 11:20:00'),
  (19, 15, 'ZONE_A', '세미나룸 2', 2, '2026-05-02 11:10:00'),
  (20, 13, 'OTHER', '체험존 T-01', 4, '2026-05-02 15:50:00'),
  (21, 15, 'OTHER', '세미나룸 1', 2, '2026-05-12 09:10:00'),
  (22, 10, 'ZONE_A', '세미나룸 2', 2, '2026-05-08 13:10:00'),
  (23, 15, 'OTHER', '체험존 T-02', 4, '2026-03-15 18:00:00'),
  (24, 9, 'ZONE_C', '체험존 T-02', 2, '2026-06-06 16:40:00'),
  (25, 7, 'OTHER', '메인무대', 4, '2026-06-15 12:20:00'),
  (26, 2, 'OTHER', '세미나룸 2', 3, '2026-06-19 10:30:00'),
  (27, 4, 'ZONE_B', '세미나룸 1', 4, '2026-05-15 14:50:00'),
  (28, 14, 'ZONE_B', '체험존 T-02', 2, '2026-06-09 12:10:00'),
  (29, 2, 'ZONE_C', '체험존 T-02', 3, '2026-05-16 17:10:00'),
  (30, 11, 'ZONE_C', '세미나룸 2', 4, '2026-04-04 17:50:00'),
  (31, 4, 'ZONE_B', '체험존 T-01', 2, '2026-04-05 11:50:00'),
  (32, 5, 'ZONE_B', '세미나룸 1', 4, '2026-04-11 12:50:00'),
  (33, 13, 'OTHER', '세미나룸 1', 4, '2026-05-20 13:50:00'),
  (34, 14, 'OTHER', '체험존 T-01', 2, '2026-05-21 10:30:00'),
  (35, 17, 'ZONE_C', '세미나룸 2', 3, '2026-05-02 14:40:00'),
  (36, 1, 'ZONE_A', '체험존 T-01', 4, '2026-05-25 14:00:00'),
  (37, 18, 'OTHER', '세미나룸 1', 3, '2026-06-14 12:30:00'),
  (38, 9, 'ZONE_C', '세미나룸 2', 3, '2026-05-10 18:10:00'),
  (39, 16, 'ZONE_C', '메인무대', 2, '2026-03-13 16:00:00'),
  (40, 4, 'ZONE_B', '체험존 T-01', 3, '2026-03-01 15:10:00'),
  (41, 5, 'ZONE_C', '세미나룸 1', 3, '2026-03-12 14:20:00'),
  (42, 3, 'ZONE_C', '세미나룸 1', 2, '2026-04-20 13:50:00'),
  (43, 8, 'OTHER', '메인무대', 4, '2026-03-13 09:10:00'),
  (44, 16, 'ZONE_A', '세미나룸 1', 4, '2026-03-29 17:50:00'),
  (45, 15, 'ZONE_A', '메인무대', 4, '2026-04-13 10:30:00'),
  (46, 5, 'OTHER', '메인무대', 2, '2026-04-19 10:50:00'),
  (47, 4, 'ZONE_A', '세미나룸 2', 3, '2026-06-21 13:10:00'),
  (48, 13, 'ZONE_B', '세미나룸 1', 2, '2026-05-07 18:00:00'),
  (49, 6, 'OTHER', '세미나룸 2', 4, '2026-03-28 11:30:00'),
  (50, 15, 'ZONE_B', '메인무대', 2, '2026-03-18 10:40:00'),
  (51, 13, 'ZONE_C', '체험존 T-01', 3, '2026-06-10 11:10:00'),
  (52, 9, 'ZONE_A', '세미나룸 1', 4, '2026-05-16 18:50:00'),
  (53, 10, 'ZONE_A', '세미나룸 2', 2, '2026-05-06 18:40:00'),
  (54, 7, 'OTHER', '세미나룸 2', 4, '2026-03-07 12:30:00'),
  (55, 13, 'ZONE_A', '세미나룸 1', 3, '2026-05-21 18:00:00'),
  (56, 17, 'ZONE_A', '세미나룸 2', 3, '2026-03-17 15:40:00'),
  (57, 14, 'ZONE_C', '체험존 T-02', 4, '2026-03-23 16:00:00'),
  (58, 1, 'ZONE_A', '메인무대', 3, '2026-03-28 09:00:00'),
  (59, 13, 'ZONE_C', '체험존 T-02', 3, '2026-04-24 15:00:00'),
  (60, 18, 'ZONE_B', '세미나룸 2', 2, '2026-04-09 10:40:00');


-- event_history
INSERT INTO `event_history` (`history_id`, `user_id`, `event_id`, `program_id`, `joined_at`) VALUES
  (1, 9, 3, 18, '2026-04-11 15:00:00'),
  (2, 21, 2, 10, '2026-05-29 15:00:00'),
  (3, 26, 4, 2, '2026-04-01 10:00:00'),
  (4, 16, 2, 15, '2026-05-18 18:00:00'),
  (5, 4, 5, 6, '2026-03-16 09:00:00'),
  (6, 25, 3, 1, '2026-03-21 16:00:00'),
  (7, 14, 5, 6, '2026-04-17 11:00:00'),
  (8, 26, 5, 4, '2026-06-07 09:00:00'),
  (9, 13, 7, 9, '2026-05-07 10:00:00'),
  (10, 11, 2, 16, '2026-04-28 17:00:00'),
  (11, 14, 1, 16, '2026-06-18 18:00:00'),
  (12, 8, 6, 6, '2026-04-02 10:00:00'),
  (13, 21, 2, 8, '2026-06-03 17:00:00'),
  (14, 3, 1, 1, '2026-04-01 09:00:00'),
  (15, 18, 6, 13, '2026-06-26 11:00:00'),
  (16, 8, 1, 18, '2026-06-11 15:00:00'),
  (17, 10, 6, 8, '2026-04-23 14:00:00'),
  (18, 11, 2, 12, '2026-03-16 17:00:00'),
  (19, 24, 1, 6, '2026-03-29 17:00:00'),
  (20, 4, 7, 3, '2026-06-21 16:00:00'),
  (21, 30, 5, 10, '2026-04-11 10:00:00'),
  (22, 20, 8, 1, '2026-04-17 12:00:00'),
  (23, 12, 5, 8, '2026-04-29 14:00:00'),
  (24, 21, 8, 7, '2026-06-02 17:00:00'),
  (25, 27, 4, 5, '2026-03-01 15:00:00'),
  (26, 3, 4, 18, '2026-04-14 09:00:00'),
  (27, 13, 1, 13, '2026-06-17 13:00:00'),
  (28, 6, 4, 17, '2026-03-31 15:00:00'),
  (29, 18, 1, 5, '2026-05-31 13:00:00'),
  (30, 5, 1, 8, '2026-06-23 17:00:00'),
  (31, 16, 6, 15, '2026-06-04 10:00:00'),
  (32, 21, 2, 17, '2026-03-18 15:00:00'),
  (33, 5, 1, 14, '2026-05-24 11:00:00'),
  (34, 10, 5, 9, '2026-06-17 14:00:00'),
  (35, 28, 7, 11, '2026-04-10 16:00:00'),
  (36, 11, 4, 3, '2026-06-29 12:00:00'),
  (37, 7, 2, 5, '2026-03-14 11:00:00'),
  (38, 17, 8, 11, '2026-04-22 10:00:00'),
  (39, 20, 6, 7, '2026-04-27 13:00:00'),
  (40, 17, 5, 4, '2026-03-12 11:00:00'),
  (41, 28, 5, 2, '2026-03-28 14:00:00'),
  (42, 7, 2, 8, '2026-04-15 15:00:00'),
  (43, 19, 1, 10, '2026-04-03 11:00:00'),
  (44, 3, 7, 15, '2026-05-11 17:00:00'),
  (45, 10, 2, 15, '2026-03-14 11:00:00'),
  (46, 6, 1, 2, '2026-06-15 12:00:00'),
  (47, 7, 4, 13, '2026-04-17 10:00:00'),
  (48, 21, 5, 3, '2026-03-03 10:00:00'),
  (49, 9, 8, 5, '2026-03-12 14:00:00'),
  (50, 6, 1, 15, '2026-03-07 11:00:00');

-- experience_waits
INSERT INTO experience_waits (program_id, wait_count, wait_min, updated_at)
VALUES
  (16, 52, 101, '2026-06-26 09:00:00'),
  (15, 34, 39,  '2026-03-23 16:00:00'),
  (5,  36, 108, '2026-06-11 15:00:00'),
  (12, 59, 107, '2026-06-17 11:00:00'),
  (2,  39, 79,  '2026-05-18 12:00:00'),
  (18, 18, 63,  '2026-04-22 17:00:00')
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min   = VALUES(wait_min),
  updated_at = VALUES(updated_at);

-- event_program_apply (v2.8: CANCELLED 재신청 가능 / cancelled_at 체크 반영)
INSERT INTO `event_program_apply`
(`program_apply_id`, `program_id`, `user_id`, `status`, `created_at`, `cancelled_at`)
VALUES
  (1, 11, 22, 'WAITING',   '2026-03-24 00:00:00', NULL),
  (2, 5, 13,  'WAITING',   '2026-03-31 00:00:00', NULL),
  (3, 11, 4,  'APPLIED',   '2026-02-10 00:00:00', NULL),
  (4, 5, 27,  'APPLIED',   '2026-03-27 00:00:00', NULL),
  (5, 17, 30, 'APPROVED',  '2026-02-05 00:00:00', NULL),
  (6, 12, 25, 'REJECTED',  '2026-03-10 00:00:00', NULL),
  (7, 4, 13,  'APPROVED',  '2026-02-21 00:00:00', NULL),
  (8, 5, 8,   'REJECTED',  '2026-03-23 00:00:00', NULL),
  (9, 16, 23, 'APPROVED',  '2026-02-12 00:00:00', NULL),

  (10, 18, 25,'CANCELLED', '2026-03-23 00:00:00', '2026-03-23 00:00:00'),
  (11, 12, 10,'CANCELLED', '2026-03-25 00:00:00', '2026-03-25 00:00:00'),

  (12, 6, 15, 'APPROVED',  '2026-03-19 00:00:00', NULL),
  (13, 10, 7, 'WAITING',   '2026-03-19 00:00:00', NULL),

  (14, 1, 25, 'CANCELLED', '2026-02-26 00:00:00', '2026-02-26 00:00:00'),
  (15, 2, 8,  'CANCELLED', '2026-02-21 00:00:00', '2026-02-21 00:00:00'),
  (16, 8, 23, 'CANCELLED', '2026-02-07 00:00:00', '2026-02-07 00:00:00'),

  (17, 16, 7, 'APPROVED',  '2026-03-20 00:00:00', NULL),
  (18, 3, 10, 'APPROVED',  '2026-02-21 00:00:00', NULL),
  (19, 6, 23, 'APPLIED',   '2026-03-25 00:00:00', NULL),
  (20, 11, 17,'APPLIED',   '2026-02-17 00:00:00', NULL),
  (21, 7, 10, 'APPLIED',   '2026-02-23 00:00:00', NULL),
  (22, 9, 28, 'APPLIED',   '2026-03-19 00:00:00', NULL),
  (23, 1, 4,  'REJECTED',  '2026-03-01 00:00:00', NULL),
  (24, 14, 8, 'REJECTED',  '2026-03-04 00:00:00', NULL),

  (25, 13, 14,'CANCELLED', '2026-02-25 00:00:00', '2026-02-25 00:00:00'),

  (26, 4, 29, 'REJECTED',  '2026-03-23 00:00:00', NULL),
  (27, 8, 8,  'REJECTED',  '2026-02-05 00:00:00', NULL),
  (28, 2, 12, 'APPLIED',   '2026-02-21 00:00:00', NULL),
  (29, 9, 6,  'APPLIED',   '2026-02-22 00:00:00', NULL),
  (30, 6, 26, 'APPLIED',   '2026-03-08 00:00:00', NULL),

  (31, 3, 13,'CANCELLED',  '2026-03-12 00:00:00', '2026-03-12 00:00:00'),

  (32, 16, 25,'APPLIED',   '2026-02-28 00:00:00', NULL),
  (33, 6, 22, 'REJECTED',  '2026-02-11 00:00:00', NULL),
  (34, 2, 6,  'APPROVED',  '2026-02-14 00:00:00', NULL),

  (35, 7, 16,'CANCELLED',  '2026-03-19 00:00:00', '2026-03-19 00:00:00'),

  (36, 18, 11,'APPROVED',  '2026-02-20 00:00:00', NULL),
  (37, 8, 6,  'APPLIED',   '2026-02-26 00:00:00', NULL),
  (38, 18, 29,'REJECTED',  '2026-02-10 00:00:00', NULL),
  (39, 2, 14, 'APPLIED',   '2026-02-28 00:00:00', NULL),

  (40, 3, 12,'CANCELLED',  '2026-03-03 00:00:00', '2026-03-03 00:00:00');


-- speakers
INSERT INTO `speakers` (`speaker_id`, `program_id`, `speaker_name`, `speaker_bio`, `created_at`, `speaker_email`, `speaker_phone`) VALUES
  (1, 6, '김수연', '반려동물 내과 수의사로 10년 이상 진료 경험을 보유.', '2026-01-21 00:00:00', 'speaker01@pupoo.io', '010-1421-4390'),
  (2, 6, '박지훈', '영양학 기반 식단 설계 전문가.', '2026-01-22 00:00:00', 'speaker02@pupoo.io', '010-5781-2342'),
  (3, 11, '이하늘', '반려동물 내과 수의사로 10년 이상 진료 경험을 보유.', '2026-01-23 00:00:00', 'speaker03@pupoo.io', '010-6052-7512'),
  (4, 11, '정민수', '반려견 행동교정/훈련 컨설턴트로 다수 강연 진행.', '2026-01-24 00:00:00', 'speaker04@pupoo.io', '010-5341-2493'),
  (5, 17, '한예린', '영양학 기반 식단 설계 전문가.', '2026-01-25 00:00:00', 'speaker05@pupoo.io', '010-7349-4029'),
  (6, 8, '최도윤', '반려견 행동교정/훈련 컨설턴트로 다수 강연 진행.', '2026-01-26 00:00:00', 'speaker06@pupoo.io', '010-7052-4056'),
  (7, 11, '오세진', '반려동물 내과 수의사로 10년 이상 진료 경험을 보유.', '2026-01-27 00:00:00', 'speaker07@pupoo.io', '010-5313-8204'),
  (8, 11, '장하나', '반려견 행동교정/훈련 컨설턴트로 다수 강연 진행.', '2026-01-28 00:00:00', 'speaker08@pupoo.io', '010-4706-5400'),
  (9, 13, '서민재', '반려동물 내과 수의사로 10년 이상 진료 경험을 보유.', '2026-01-29 00:00:00', 'speaker09@pupoo.io', '010-3476-2584'),
  (10, 1, '윤지호', '영양학 기반 식단 설계 전문가.', '2026-01-30 00:00:00', 'speaker10@pupoo.io', '010-6632-9871'),
  (11, 11, '홍채린', '영양학 기반 식단 설계 전문가.', '2026-01-31 00:00:00', 'speaker11@pupoo.io', '010-4727-1999'),
  (12, 11, '강민재', '영양학 기반 식단 설계 전문가.', '2026-02-01 00:00:00', 'speaker12@pupoo.io', '010-7858-9773');

-- review_comments
INSERT INTO `review_comments` (`comment_id`, `review_id`, `user_id`, `content`, `created_at`, `updated_at`, `is_deleted`) VALUES
  (1, 16, 21, '정보 감사합니다.', '2026-06-25 00:00:00', '2026-06-25 00:00:00', 0),
  (2, 16, 12, '주차 팁 공감합니다.', '2026-03-15 00:00:00', '2026-03-15 00:00:00', 0),
  (3, 2, 19, '정보 감사합니다.', '2026-05-17 00:00:00', '2026-05-17 00:00:00', 0),
  (4, 4, 27, '정보 감사합니다.', '2026-05-01 00:00:00', '2026-05-01 00:00:00', 0),
  (5, 6, 9, '정보 감사합니다.', '2026-06-16 00:00:00', '2026-06-16 00:00:00', 0),
  (6, 5, 4, '저도 가보고 싶네요!', '2026-04-28 00:00:00', '2026-04-28 00:00:00', 0),
  (7, 14, 9, '정보 감사합니다.', '2026-06-18 00:00:00', '2026-06-18 00:00:00', 0),
  (8, 9, 13, '저도 가보고 싶네요!', '2026-06-29 00:00:00', '2026-06-29 00:00:00', 0),
  (9, 3, 15, '주차 팁 공감합니다.', '2026-05-15 00:00:00', '2026-05-15 00:00:00', 0),
  (10, 11, 30, '주차 팁 공감합니다.', '2026-04-09 00:00:00', '2026-04-09 00:00:00', 0),
  (11, 1, 28, '주차 팁 공감합니다.', '2026-06-02 00:00:00', '2026-06-02 00:00:00', 0),
  (12, 4, 16, '정보 감사합니다.', '2026-03-24 00:00:00', '2026-03-24 00:00:00', 0),
  (13, 4, 6, '저도 가보고 싶네요!', '2026-05-16 00:00:00', '2026-05-16 00:00:00', 0),
  (14, 10, 30, '사진도 올려주시면 더 좋겠어요.', '2026-05-12 00:00:00', '2026-05-12 00:00:00', 0),
  (15, 14, 11, '주차 팁 공감합니다.', '2026-04-23 00:00:00', '2026-04-23 00:00:00', 0),
  (16, 16, 4, '사진도 올려주시면 더 좋겠어요.', '2026-03-27 00:00:00', '2026-03-27 00:00:00', 0),
  (17, 13, 7, '주차 팁 공감합니다.', '2026-05-23 00:00:00', '2026-05-23 00:00:00', 0),
  (18, 2, 15, '사진도 올려주시면 더 좋겠어요.', '2026-06-26 00:00:00', '2026-06-26 00:00:00', 0),
  (19, 8, 4, '주차 팁 공감합니다.', '2026-06-08 00:00:00', '2026-06-08 00:00:00', 0),
  (20, 9, 14, '사진도 올려주시면 더 좋겠어요.', '2026-03-07 00:00:00', '2026-03-07 00:00:00', 0);

-- booth_waits
INSERT INTO booth_waits (booth_id, wait_count, wait_min, updated_at) VALUES
  (10, 39, 35, '2026-06-16 16:00:00'),
  (22, 17, 3,  '2026-05-23 16:00:00'),
  (15, 41, 34, '2026-06-02 15:00:00'),
  (20, 57, 22, '2026-06-20 16:00:00'),
  (14, 62, 66, '2026-06-20 14:00:00'),
  (2,  20, 73, '2026-06-08 12:00:00'),
  (17, 50, 81, '2026-06-27 10:00:00'),
  (19, 70, 44, '2026-04-14 11:00:00'),
  (12, 25, 35, '2026-04-17 16:00:00'),
  (9,  41, 35, '2026-04-03 13:00:00'),
  (8,  28, 86, '2026-03-27 13:00:00'),
  (21, 35, 54, '2026-06-23 15:00:00'),
  (16, 16, 82, '2026-03-23 18:00:00'),
  (1,  28, 32, '2026-05-17 13:00:00'),
  (4,  0,  65, '2026-05-24 14:00:00'),
  (18, 76, 77, '2026-04-06 13:00:00'),
  (7,  19, 66, '2026-06-06 12:00:00')
ON DUPLICATE KEY UPDATE
  wait_count = VALUES(wait_count),
  wait_min   = VALUES(wait_min),
  updated_at = VALUES(updated_at);


-- files
INSERT INTO `files` (`file_id`, `original_name`, `stored_name`, `post_id`, `notice_id`) VALUES
  (1, 'photo_10.jpg', 'posts/10/photo_10_9759.jpg', 10, NULL),
  (2, 'photo_9.jpg', 'posts/9/photo_9_8794.jpg', 9, NULL),
  (3, 'photo_14.jpg', 'posts/14/photo_14_6873.jpg', 14, NULL),
  (4, 'photo_13.jpg', 'posts/13/photo_13_9311.jpg', 13, NULL),
  (5, 'photo_22.jpg', 'posts/22/photo_22_5918.jpg', 22, NULL),
  (6, 'photo_2.jpg', 'posts/2/photo_2_3785.jpg', 2, NULL),
  (7, 'photo_19.jpg', 'posts/19/photo_19_3967.jpg', 19, NULL),
  (8, 'photo_7.jpg', 'posts/7/photo_7_5813.jpg', 7, NULL),
  (9, 'photo_11.jpg', 'posts/11/photo_11_2599.jpg', 11, NULL),
  (10, 'photo_8.jpg', 'posts/8/photo_8_8713.jpg', 8, NULL),
  (11, 'notice_5.pdf', 'notices/5/notice_5_3096.pdf', NULL, 5),
  (12, 'notice_10.pdf', 'notices/10/notice_10_5237.pdf', NULL, 10),
  (13, 'photo_25.jpg', 'posts/25/photo_25_7816.jpg', 25, NULL),
  (14, 'photo_24.jpg', 'posts/24/photo_24_8908.jpg', 24, NULL),
  (15, 'photo_23.jpg', 'posts/23/photo_23_8178.jpg', 23, NULL),
  (16, 'photo_21.jpg', 'posts/21/photo_21_3969.jpg', 21, NULL),
  (17, 'photo_20.jpg', 'posts/20/photo_20_7221.jpg', 20, NULL),
  (18, 'photo_18.jpg', 'posts/18/photo_18_6875.jpg', 18, NULL),
  (19, 'photo_17.jpg', 'posts/17/photo_17_1472.jpg', 17, NULL),
  (20, 'photo_16.jpg', 'posts/16/photo_16_3140.jpg', 16, NULL);

-- contest_votes
INSERT INTO `contest_votes`
(`vote_id`, `program_id`, `program_apply_id`, `user_id`, `voted_at`, `status`, `cancelled_at`) VALUES
  -- ✅ 아래 1~3번은 '취소 이력' 예시 (CANCELLED + cancelled_at NOT NULL)
  (1, 14, 24, 28, '2026-05-27 14:00:00', 'CANCELLED', '2026-05-27 14:05:00'),
  (2, 14, 24, 5,  '2026-04-15 12:00:00', 'CANCELLED', '2026-04-15 12:02:00'),
  (3, 14, 24, 30, '2026-04-23 14:00:00', 'CANCELLED', '2026-04-23 14:10:00'),

  -- ✅ 나머지는 기본 ACTIVE 예시 (cancelled_at은 NULL)
  (4,  7, 35, 11, '2026-04-29 10:00:00', 'ACTIVE',   NULL),
  (5,  9, 22, 4,  '2026-04-30 12:00:00', 'ACTIVE',   NULL),
  (6,  10, 13, 6, '2026-05-07 13:00:00', 'ACTIVE',   NULL),
  (7,  4,  7,  7, '2026-04-13 15:00:00', 'ACTIVE',   NULL),
  (8,  10, 13, 17,'2026-04-10 11:00:00', 'ACTIVE',   NULL),
  (9,  3,  31, 18,'2026-05-20 11:00:00', 'ACTIVE',   NULL),
  (10, 7,  21, 23,'2026-03-01 16:00:00', 'ACTIVE',   NULL),
  (11, 7,  21, 9, '2026-05-13 11:00:00', 'ACTIVE',   NULL),
  (12, 9,  22, 28,'2026-03-17 18:00:00', 'ACTIVE',   NULL),
  (13, 9,  29, 23,'2026-04-21 15:00:00', 'ACTIVE',   NULL),
  (14, 9,  22, 15,'2026-03-05 17:00:00', 'ACTIVE',   NULL),
  (15, 4,  26, 26,'2026-03-02 14:00:00', 'ACTIVE',   NULL),
  (16, 10, 13, 9, '2026-05-26 09:00:00', 'ACTIVE',   NULL),
  (17, 14, 24, 26,'2026-03-29 14:00:00', 'ACTIVE',   NULL),
  (18, 7,  21, 7, '2026-04-19 17:00:00', 'ACTIVE',   NULL),
  (19, 10, 13, 12,'2026-03-09 09:00:00', 'ACTIVE',   NULL),
  (20, 7,  35, 12,'2026-06-02 17:00:00', 'ACTIVE',   NULL),
  (21, 10, 13, 19,'2026-04-25 11:00:00', 'ACTIVE',   NULL),
  (22, 7,  35, 18,'2026-06-05 12:00:00', 'ACTIVE',   NULL),
  (23, 4,  26, 28,'2026-03-03 12:00:00', 'ACTIVE',   NULL),
  (24, 4,  7,  9, '2026-05-15 17:00:00', 'ACTIVE',   NULL),
  (25, 4,  26, 6, '2026-05-31 09:00:00', 'ACTIVE',   NULL),
  (26, 7,  21, 27,'2026-05-16 09:00:00', 'ACTIVE',   NULL),
  (27, 14, 24, 6, '2026-03-07 10:00:00', 'ACTIVE',   NULL),
  (28, 9,  29, 17,'2026-03-16 17:00:00', 'ACTIVE',   NULL),
  (29, 14, 24, 7, '2026-05-28 09:00:00', 'ACTIVE',   NULL),
  (30, 7,  21, 16,'2026-05-24 17:00:00', 'ACTIVE',   NULL),
  (31, 7,  21, 22,'2026-04-23 10:00:00', 'ACTIVE',   NULL),
  (32, 10, 13, 26,'2026-04-06 10:00:00', 'ACTIVE',   NULL),
  (33, 4,  7,  22,'2026-06-08 13:00:00', 'ACTIVE',   NULL),
  (34, 7,  35, 25,'2026-04-07 11:00:00', 'ACTIVE',   NULL),
  (35, 3,  31, 20,'2026-06-25 12:00:00', 'ACTIVE',   NULL),
  (36, 14, 24, 18,'2026-03-31 09:00:00', 'ACTIVE',   NULL),
  (37, 3,  18, 24,'2026-06-25 10:00:00', 'ACTIVE',   NULL),
  (38, 10, 13, 24,'2026-03-20 10:00:00', 'ACTIVE',   NULL),
  (39, 10, 13, 5, '2026-06-24 13:00:00', 'ACTIVE',   NULL),
  (40, 14, 24, 10,'2026-04-07 13:00:00', 'ACTIVE',   NULL),

  -- ✅ 재투표(이력 누적) 예시: 같은 (program_id, user_id)로 CANCELLED 뒤 새 ACTIVE 추가
  -- (1) user 28, program 14 : vote_id 1이 CANCELLED → 41번으로 재투표 ACTIVE
  (41, 14, 24, 28, '2026-05-27 14:12:00', 'ACTIVE', NULL),

  -- (2) user 5, program 14 : vote_id 2가 CANCELLED → 42번으로 재투표 ACTIVE
  (42, 14, 24, 5,  '2026-04-15 12:10:00', 'ACTIVE', NULL),

  -- (3) user 30, program 14 : vote_id 3이 CANCELLED → 43번으로 재투표 ACTIVE
  (43, 14, 24, 30, '2026-04-23 14:20:00', 'ACTIVE', NULL);

INSERT INTO event_interest_map (event_id, interest_id) VALUES

-- event 1
(1, 1),
(1, 4),
(1, 7),
(1, 10),

-- event 2
(2, 2),
(2, 12),
(2, 15),

-- event 3
(3, 5),
(3, 11),
(3, 4),

-- event 4
(4, 3),
(4, 10),
(4, 16),

-- event 5
(5, 9),
(5, 8),
(5, 4);


COMMIT;

