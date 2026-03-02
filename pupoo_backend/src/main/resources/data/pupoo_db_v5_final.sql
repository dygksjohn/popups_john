-- FINAL SSOT SCHEMA
-- Base: pupoo_db_v5.2.sql
-- Deprecated: pupoo_db_v5.1.sql, pupoo_db_v5.2.sql



SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS
  event_images, signup_sessions, phone_verification_token, email_verification_token, 
  event_interest_map, user_interest_subscriptions, interests, 
  notification_settings, notification_inbox, notification_send, notification, 
  qr_logs, qr_codes, refunds, payment_transactions, payments, 
  inquiry_answers, inquiries, content_reports, 
  review_comments, reviews, board_banned_words, post_comments, files, posts, boards, notices, 
  gallery_likes, gallery_images, galleries, 
  congestions, experience_waits, booth_waits, program_speakers, speakers, 
  contest_votes, program_participation_stats, event_history, event_program_apply, event_program, booths, 
  event_apply, event, pet, social_account, admin_logs, refresh_token, users;

CREATE TABLE users (
  user_id           BIGINT        NOT NULL AUTO_INCREMENT,
  email             VARCHAR(255)  NOT NULL,
  password          VARCHAR(255)  NOT NULL,
  nickname          VARCHAR(30)   NOT NULL,
  phone             VARCHAR(30)   NOT NULL,
  status            ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  role_name         ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  show_age          TINYINT(1)    NOT NULL DEFAULT 0,
  show_gender       TINYINT(1)    NOT NULL DEFAULT 0,
  show_pet          TINYINT(1)    NOT NULL DEFAULT 0,
  email_verified    TINYINT(1)    NOT NULL DEFAULT 0,
  phone_verified    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at     DATETIME      NULL,
  last_modified_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE social_account (
  social_id      BIGINT        NOT NULL AUTO_INCREMENT,
  user_id        BIGINT        NOT NULL,
  provider       VARCHAR(100)  NOT NULL,
  provider_uid   VARCHAR(255)  NOT NULL,
  PRIMARY KEY (social_id),
  UNIQUE KEY uk_social_provider_uid (provider, provider_uid),
  UNIQUE KEY uk_social_user_provider (user_id, provider),
  KEY ix_social_user_id (user_id),
  CONSTRAINT fk_social_account_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pet (
  pet_id      BIGINT        NOT NULL AUTO_INCREMENT,
  user_id     BIGINT        NOT NULL,
  pet_name    VARCHAR(100)  NULL,
  pet_breed   ENUM('DOG','CAT','OTHER') NOT NULL,
  pet_age     INT           NULL,
  pet_weight  ENUM('XS','S','M','L','XL') NULL,
  PRIMARY KEY (pet_id),
  KEY ix_pet_user_id (user_id),
  CONSTRAINT fk_pet_users
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event (
  event_id     BIGINT        NOT NULL AUTO_INCREMENT,
  event_name   VARCHAR(255)  NOT NULL,
  description  VARCHAR(1000) NOT NULL,
  start_at     DATETIME      NOT NULL,
  end_at       DATETIME      NOT NULL,
  location     VARCHAR(255)  NULL,
  status       ENUM('PLANNED','ONGOING','ENDED','CANCELLED') NOT NULL,
  round_no     INT           NULL,

  base_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,

  PRIMARY KEY (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_apply (
  apply_id    BIGINT   NOT NULL AUTO_INCREMENT,
  user_id     BIGINT   NOT NULL,
  event_id    BIGINT   NOT NULL,
  applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status      ENUM('APPLIED','CANCELLED','APPROVED','REJECTED') NOT NULL,
  active_flag TINYINT
    GENERATED ALWAYS AS (CASE WHEN status IN ('APPLIED','APPROVED') THEN 1 ELSE NULL END) STORED,
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

CREATE TABLE booths (
  booth_id     BIGINT        NOT NULL AUTO_INCREMENT,
  event_id     BIGINT        NOT NULL,
  place_name   VARCHAR(100)  NOT NULL,
  type         ENUM('BOOTH_COMPANY','BOOTH_EXPERIENCE','BOOTH_SALE','BOOTH_FOOD','BOOTH_INFO','BOOTH_SPONSOR','SESSION_ROOM','CONTEST_ZONE','STAGE','ETC') NOT NULL,
  description  VARCHAR(1000) NULL,
  company      VARCHAR(100)  NULL,
  zone         ENUM('ZONE_A','ZONE_B','ZONE_C','OTHER') NOT NULL,
  status       ENUM('OPEN','CLOSED','PAUSED') NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (booth_id),
  UNIQUE KEY uk_booths_event_place (event_id, place_name),
  KEY ix_booths_event_id (event_id),
  CONSTRAINT fk_booths_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_program (
  program_id     BIGINT        NOT NULL AUTO_INCREMENT,
  event_id       BIGINT        NOT NULL,
  category       ENUM('CONTEST','SESSION','EXPERIENCE') NOT NULL,
  program_title  VARCHAR(255)  NOT NULL,
  description    VARCHAR(1000) NOT NULL,
  start_at       DATETIME      NOT NULL,
  end_at         DATETIME      NOT NULL,
  booth_id       BIGINT        NULL,
  image_url      LONGTEXT      NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE event_program_apply (
  program_apply_id BIGINT   NOT NULL AUTO_INCREMENT,
  program_id       BIGINT   NOT NULL,
  user_id          BIGINT   NOT NULL,
  status           ENUM('APPLIED','WAITING','APPROVED','REJECTED','CANCELLED','CHECKED_IN') NOT NULL,
  ticket_no        VARCHAR(30) NULL,
  eta_min          INT NULL,
  notified_at      DATETIME NULL,
  checked_in_at    DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at     DATETIME NULL,
  active_flag      TINYINT
    GENERATED ALWAYS AS (CASE WHEN status IN ('APPLIED','WAITING','APPROVED') THEN 1 ELSE NULL END) STORED,
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

CREATE TABLE event_history (
  history_id  BIGINT   NOT NULL AUTO_INCREMENT,
  user_id     BIGINT   NOT NULL,
  event_id    BIGINT   NOT NULL,
  program_id  BIGINT   NOT NULL,
  joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE program_participation_stats (
  user_id              BIGINT NOT NULL,
  program_id           BIGINT NOT NULL,
  participate_count    BIGINT NOT NULL DEFAULT 0,
  last_participated_at DATETIME NULL,
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

CREATE TABLE contest_votes (
  vote_id           BIGINT   NOT NULL AUTO_INCREMENT,
  program_id        BIGINT   NOT NULL,
  program_apply_id  BIGINT   NOT NULL,
  user_id           BIGINT   NOT NULL,
  voted_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status            ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  cancelled_at      DATETIME NULL,
  active_flag       TINYINT
    GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE NULL END) STORED,
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

CREATE TABLE speakers (
  speaker_id     BIGINT        NOT NULL AUTO_INCREMENT,
  speaker_name   VARCHAR(255)  NOT NULL,
  speaker_bio    VARCHAR(1000) NOT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  speaker_email  VARCHAR(255)  NOT NULL,
  speaker_phone  VARCHAR(30)   NOT NULL,
  deleted_at     DATETIME      NULL,
  PRIMARY KEY (speaker_id),
  UNIQUE KEY uk_speakers_email (speaker_email),
  UNIQUE KEY uk_speakers_phone (speaker_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='?곗궗';

CREATE TABLE program_speakers (
  program_id   BIGINT   NOT NULL,
  speaker_id   BIGINT   NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (program_id, speaker_id),
  KEY ix_program_speakers_program_id (program_id),
  KEY ix_program_speakers_speaker_id (speaker_id),
  CONSTRAINT fk_program_speakers_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_program_speakers_speaker
    FOREIGN KEY (speaker_id) REFERENCES speakers(speaker_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='?꾨줈洹몃옩-?곗궗 留ㅽ븨';

CREATE TABLE booth_waits (
  wait_id     BIGINT   NOT NULL AUTO_INCREMENT,
  booth_id    BIGINT   NOT NULL,
  wait_count  INT      NULL,
  wait_min    INT      NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (wait_id),
  UNIQUE KEY uk_booth_waits_booth_id (booth_id),
  CONSTRAINT fk_booth_waits_booth
    FOREIGN KEY (booth_id) REFERENCES booths(booth_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE experience_waits (
  wait_id     BIGINT   NOT NULL AUTO_INCREMENT,
  program_id  BIGINT   NOT NULL,
  wait_count  INT      NULL,
  wait_min    INT      NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (wait_id),
  UNIQUE KEY uk_experience_waits_program_id (program_id),
  KEY ix_experience_waits_program_id (program_id),
  CONSTRAINT fk_experience_waits_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE congestions (
  congestion_id     BIGINT       NOT NULL AUTO_INCREMENT,
  program_id        BIGINT       NOT NULL,
  zone              ENUM('ZONE_A','ZONE_B','ZONE_C','OTHER') NOT NULL,
  place_name        VARCHAR(100) NOT NULL,
  congestion_level  TINYINT      NOT NULL,
  measured_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (congestion_id),
  KEY ix_congestions_program_id (program_id),
  CONSTRAINT fk_congestions_program
    FOREIGN KEY (program_id) REFERENCES event_program(program_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE galleries (
  gallery_id          BIGINT        NOT NULL AUTO_INCREMENT,
  event_id            BIGINT        NOT NULL,
  user_id             BIGINT        NOT NULL,
  gallery_title       VARCHAR(255)  NOT NULL,
  gallery_description VARCHAR(1000) NULL,
  view_count          INT           NULL,
  thumbnail_image_id  BIGINT        NULL,
  gallery_status      ENUM('PUBLIC','PRIVATE','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

CREATE TABLE gallery_images (
  image_id      BIGINT        NOT NULL AUTO_INCREMENT,
  gallery_id    BIGINT        NOT NULL,
  original_url  VARCHAR(500)  NOT NULL,
  thumb_url     VARCHAR(500)  NULL,
  image_order   INT           NULL,
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL,
  file_size     INT           NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (image_id),
  KEY ix_gallery_images_gallery_id (gallery_id),
  CONSTRAINT fk_gallery_images_gallery
    FOREIGN KEY (gallery_id) REFERENCES galleries(gallery_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE galleries
  ADD CONSTRAINT fk_galleries_thumbnail_image
    FOREIGN KEY (thumbnail_image_id) REFERENCES gallery_images(image_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE gallery_likes (
  like_id     BIGINT   NOT NULL AUTO_INCREMENT,
  gallery_id  BIGINT   NOT NULL,
  user_id     BIGINT   NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE notices (
  notice_id           BIGINT        NOT NULL AUTO_INCREMENT,
  scope               VARCHAR(20)   NOT NULL,
  event_id            BIGINT        NULL,
  notice_title        VARCHAR(255)  NOT NULL,
  content             VARCHAR(1000) NOT NULL,
  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N',
  is_pinned           TINYINT       NOT NULL,
  status              ENUM('PUBLISHED','DRAFT','HIDDEN') NOT NULL,
  created_by_admin_id BIGINT        NOT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

CREATE TABLE boards (
  board_id      BIGINT       NOT NULL AUTO_INCREMENT,
  board_name    VARCHAR(50)  NOT NULL,
  board_type    ENUM('FREE','INFO','REVIEW','QNA','FAQ') NOT NULL,
  is_active     TINYINT      NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (board_id)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE posts (
  post_id             BIGINT        NOT NULL AUTO_INCREMENT,
  board_id            BIGINT        NOT NULL,
  user_id             BIGINT        NOT NULL,
  post_title          VARCHAR(255)  NOT NULL,
  content             TEXT          NOT NULL,
  answer_content      TEXT          NULL,
  answered_at         DATETIME      NULL,
  file_attached       ENUM('Y','N') NOT NULL DEFAULT 'N',
  status              ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'PUBLISHED',
  view_count          INT           NOT NULL DEFAULT 0,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted          TINYINT       NOT NULL DEFAULT 0,
  is_comment_enabled  TINYINT       NOT NULL DEFAULT 1,
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

CREATE TABLE files (
  file_id            BIGINT        NOT NULL AUTO_INCREMENT,
  original_name      VARCHAR(255)  NOT NULL,
  stored_name        VARCHAR(255)  NOT NULL,

  user_id            BIGINT        NOT NULL,

  post_id            BIGINT        NULL,
  notice_id          BIGINT        NULL,

  deleted_at         DATETIME      NULL,
  deleted_by         BIGINT        NULL,
  delete_reason      VARCHAR(255)  NULL,
  object_deleted_at  DATETIME      NULL,

  PRIMARY KEY (file_id),

  UNIQUE KEY uk_files_stored_name (stored_name),

  KEY ix_files_post_id (post_id),
  KEY ix_files_notice_id (notice_id),

  UNIQUE KEY uk_files_post_id (post_id),
  UNIQUE KEY uk_files_notice_id (notice_id),

  KEY idx_files_post_id_deleted_at (post_id, deleted_at),
  KEY idx_files_notice_id_deleted_at (notice_id, deleted_at),
  KEY idx_files_deleted_at_object_deleted_at (deleted_at, object_deleted_at),

  CONSTRAINT fk_files_posts
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_files_notices
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE post_comments (
  comment_id  BIGINT        NOT NULL AUTO_INCREMENT,
  post_id     BIGINT        NOT NULL,
  user_id     BIGINT        NOT NULL,
  content     VARCHAR(1000) NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted  TINYINT       NOT NULL DEFAULT 0,
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

CREATE TABLE board_banned_words (
  banned_word_id   BIGINT       NOT NULL AUTO_INCREMENT,
  board_id         BIGINT       NOT NULL,
  banned_word      VARCHAR(100) NOT NULL,
  banned_word_norm VARCHAR(100) GENERATED ALWAYS AS (LOWER(TRIM(banned_word))) STORED,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (banned_word_id),
  UNIQUE KEY uk_board_banned_words_board_word (board_id, banned_word_norm),
  KEY ix_board_banned_words_board_id (board_id),
  CONSTRAINT fk_board_banned_words_boards
    FOREIGN KEY (board_id) REFERENCES boards(board_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE content_reports (
  report_id            BIGINT       NOT NULL AUTO_INCREMENT,
  reporter_user_id     BIGINT       NOT NULL,
  target_type          ENUM('POST','REVIEW','POST_COMMENT','REVIEW_COMMENT') NOT NULL,
  target_id            BIGINT       NOT NULL,
  reason_code          ENUM('SPAM','ABUSE','HATE','SEXUAL','VIOLENCE','PRIVACY','FRAUD','COPYRIGHT','OTHER') NOT NULL,
  reason_detail        VARCHAR(255) NULL,
  reason               VARCHAR(255) NOT NULL,
  status               ENUM('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at          DATETIME     NULL,
  resolved_by_admin_id BIGINT       NULL,
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

CREATE TABLE reviews (
  review_id     BIGINT   NOT NULL AUTO_INCREMENT,
  event_id      BIGINT   NOT NULL,
  user_id       BIGINT   NOT NULL,
  rating        TINYINT  NOT NULL,
  content       TEXT     NOT NULL,
  view_count    INT      NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT  NOT NULL DEFAULT 0,
  is_comment_enabled TINYINT NOT NULL DEFAULT 0,
  review_status ENUM('PUBLIC','REPORTED','BLINDED','DELETED') NOT NULL DEFAULT 'PUBLIC',
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

CREATE TABLE review_comments (
  comment_id  BIGINT        NOT NULL AUTO_INCREMENT,
  review_id   BIGINT        NOT NULL,
  user_id     BIGINT        NOT NULL,
  content     VARCHAR(1000) NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted  TINYINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (comment_id),
  KEY ix_review_comments_review_id (review_id),
  KEY ix_review_comments_user_id (user_id),
  CONSTRAINT fk_review_comments_review FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_comments_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inquiries (
  inquiry_id     BIGINT        NOT NULL AUTO_INCREMENT,
  user_id        BIGINT        NOT NULL,
  category       ENUM('EVENT','PAYMENT','REFUND','ACCOUNT','OTHER') NOT NULL,
  inquiry_title  VARCHAR(255)  NOT NULL,
  content        TEXT          NOT NULL,
  status         ENUM('OPEN','IN_PROGRESS','CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (inquiry_id),
  KEY ix_inquiries_user_created (user_id, created_at),
  CONSTRAINT fk_inquiries_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inquiry_answers (
  answer_id   BIGINT   NOT NULL AUTO_INCREMENT,
  inquiry_id  BIGINT   NOT NULL,
  admin_id    BIGINT   NOT NULL,
  content     TEXT     NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (answer_id),
  KEY ix_inquiry_answers_inquiry_id (inquiry_id),
  KEY ix_inquiry_answers_admin_id (admin_id),
  CONSTRAINT fk_inquiry_answers_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(inquiry_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inquiry_answers_admin_users FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
  payment_id      BIGINT         NOT NULL AUTO_INCREMENT,
  user_id         BIGINT         NOT NULL,
  event_id        BIGINT         NULL,
  event_apply_id  BIGINT         NOT NULL,

  order_no        VARCHAR(50)    NOT NULL,
  amount          DECIMAL(10,2)  NOT NULL,
  payment_method  ENUM('KAKAOPAY','CARD','BANK','OTHER') NOT NULL,
  status          ENUM('REQUESTED','APPROVED','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  requested_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  active_flag     TINYINT
    GENERATED ALWAYS AS (CASE WHEN status IN ('REQUESTED','APPROVED') THEN 1 ELSE NULL END) STORED,

  PRIMARY KEY (payment_id),

  UNIQUE KEY uk_payments_order_no (order_no),

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

CREATE TABLE payment_transactions (
  tx_id           BIGINT        NOT NULL AUTO_INCREMENT,
  payment_id      BIGINT        NOT NULL,
  pg_provider     ENUM('KAKAOPAY') NOT NULL,
  pg_tid          VARCHAR(100)  NOT NULL,
  pg_token        VARCHAR(100)  NULL,
  status          ENUM('READY','APPROVED','CANCELLED','FAILED') NOT NULL DEFAULT 'READY',
  idempotency_key VARCHAR(64)   NULL,
  raw_ready       JSON          NULL,
  raw_approve     JSON          NULL,
  raw_cancel      JSON          NULL,
  requested_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at     DATETIME      NULL,
  cancelled_at    DATETIME      NULL,
  failed_at       DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

CREATE TABLE refunds (
  refund_id      BIGINT        NOT NULL AUTO_INCREMENT,
  payment_id     BIGINT        NOT NULL,
  refund_amount  DECIMAL(10,2) NOT NULL,
  reason         VARCHAR(255)  NOT NULL,
  status         ENUM('REQUESTED','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  requested_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME      NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (refund_id),
  UNIQUE KEY uk_refunds_payment_id (payment_id),
  KEY ix_refunds_status (status),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_refunds_completed_at CHECK ((status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)),
  CONSTRAINT ck_refunds_refund_amount CHECK (refund_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE qr_codes (
  qr_id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  event_id      BIGINT       NOT NULL,
  original_url  VARCHAR(500) NOT NULL,
  mime_type     ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL,
  issued_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expired_at    DATETIME     NOT NULL,
  PRIMARY KEY (qr_id),
  KEY ix_qr_codes_user_id (user_id),
  KEY ix_qr_codes_event_id (event_id),
  CONSTRAINT fk_qr_codes_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE qr_logs (
  log_id      BIGINT   NOT NULL AUTO_INCREMENT,
  qr_id       BIGINT   NOT NULL,
  booth_id    BIGINT   NOT NULL,
  check_type  ENUM('CHECKIN','CHECKOUT') NOT NULL,
  checked_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY ix_qr_logs_qr_id (qr_id),
  KEY ix_qr_logs_booth_id (booth_id),
  KEY ix_qr_logs_checked_at (checked_at),
  CONSTRAINT fk_qr_logs_qr FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_logs_booth FOREIGN KEY (booth_id) REFERENCES booths(booth_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification (
  notification_id     BIGINT        NOT NULL AUTO_INCREMENT,
  type                ENUM('EVENT','NOTICE','PAYMENT','APPLY','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  notification_title  VARCHAR(255)  NOT NULL,
  content             VARCHAR(255)  NOT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_send (
  send_id          BIGINT NOT NULL AUTO_INCREMENT,
  notification_id  BIGINT NOT NULL,
  sender_id        BIGINT NOT NULL,
  sender_type      ENUM('USER','ADMIN','SYSTEM') NOT NULL,
  channel          ENUM('APP','EMAIL','SMS','PUSH') NOT NULL,
  sent_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (send_id),
  KEY ix_notification_send_notification_id (notification_id),
  KEY ix_notification_send_sender_id (sender_id),
  CONSTRAINT fk_notification_send_notification FOREIGN KEY (notification_id) REFERENCES notification(notification_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_send_sender_users FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_inbox (
  inbox_id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id          BIGINT       NOT NULL,
  notification_id  BIGINT       NOT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  target_type      ENUM('EVENT','NOTICE') NULL,
  target_id        BIGINT       NULL,
  PRIMARY KEY (inbox_id),
  KEY ix_notification_inbox_user_id (user_id),
  KEY ix_notification_inbox_notification_id (notification_id),
  CONSTRAINT fk_notification_inbox_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notification_inbox_notification FOREIGN KEY (notification_id) REFERENCES notification(notification_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_settings (
  user_id         BIGINT   NOT NULL,
  allow_marketing TINYINT  NOT NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notification_settings_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE interests (
  interest_id    BIGINT NOT NULL AUTO_INCREMENT,
  interest_name  ENUM('EVENT','SESSION','EXPERIENCE','BOOTH','CONTEST','NOTICE','SNACK','BATH_SUPPLIES','GROOMING','TOY','CLOTHING','HEALTH','TRAINING','WALK','SUPPLEMENTS','ACCESSORIES','OTHERS') NOT NULL,
  type           ENUM('SYSTEM','USER') NOT NULL,
  is_active      TINYINT NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (interest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_interest_subscriptions (
  subscription_id  BIGINT NOT NULL AUTO_INCREMENT,
  user_id          BIGINT NOT NULL,
  interest_id      BIGINT NOT NULL,
  allow_inapp      TINYINT NOT NULL,
  allow_email      TINYINT NOT NULL,
  allow_sms        TINYINT NOT NULL,
  status           ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id),
  UNIQUE KEY uq_user_interest_subscriptions_user_interest (user_id, interest_id),
  KEY ix_user_interest_subscriptions_user_id (user_id),
  KEY ix_user_interest_subscriptions_interest_id (interest_id),
  CONSTRAINT fk_user_interest_subscriptions_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_interest_subscriptions_interest FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_interest_map (
  event_interest_map_id BIGINT NOT NULL AUTO_INCREMENT,
  event_id              BIGINT NOT NULL,
  interest_id           BIGINT NOT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_interest_map_id),
  UNIQUE KEY uk_event_interest (event_id, interest_id),
  KEY idx_interest_event (interest_id, event_id),
  CONSTRAINT fk_eim_event FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eim_interest FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE signup_sessions (
  signup_session_id      BIGINT NOT NULL AUTO_INCREMENT,
  signup_key             VARCHAR(36) NOT NULL,
  signup_type            ENUM('EMAIL','SOCIAL') NOT NULL,
  social_provider        VARCHAR(30) NULL,
  social_provider_uid    VARCHAR(255) NULL,
  email                  VARCHAR(255) NULL,
  password_hash          VARCHAR(255) NULL,
  nickname               VARCHAR(30)  NOT NULL,
  phone                  VARCHAR(30)  NOT NULL,
  otp_status             ENUM('PENDING','VERIFIED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  otp_verified_at        DATETIME NULL,
  otp_last_sent_at       DATETIME NULL,
  otp_code_hash          VARCHAR(128) NULL,
  otp_expires_at         DATETIME NULL,
  otp_fail_count         INT NOT NULL DEFAULT 0,
  otp_blocked_until      DATETIME NULL,
  email_status           ENUM('PENDING','VERIFIED','NOT_REQUIRED') NOT NULL DEFAULT 'PENDING',
  email_verified_at      DATETIME NULL,
  email_code_hash        VARCHAR(128) NULL,
  email_expires_at       DATETIME NULL,
  email_last_sent_at     DATETIME NULL,
  email_fail_count       INT NOT NULL DEFAULT 0,
  expires_at             DATETIME NOT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (signup_session_id),
  UNIQUE KEY uk_signup_sessions_signup_key (signup_key),
  KEY idx_signup_sessions_phone (phone),
  KEY idx_signup_sessions_email (email),
  KEY idx_signup_sessions_otp_last_sent_at (otp_last_sent_at),
  KEY idx_signup_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_logs (
  log_id      BIGINT       NOT NULL AUTO_INCREMENT,
  admin_id    BIGINT       NOT NULL,
  action      VARCHAR(255) NOT NULL,
  target_type ENUM('USER','EVENT','PROGRAM','BOOTH','NOTICE','PAYMENT','REFUND','REVIEW','POST','QNA','INQUIRY','GALLERY','QR','SYSTEM','OTHER') NULL,
  target_id   BIGINT       NULL,
  ip_address  VARCHAR(50)  NULL,
  result      ENUM('SUCCESS','FAIL') NOT NULL DEFAULT 'SUCCESS',
  error_code  VARCHAR(50)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY ix_admin_logs_admin_id (admin_id),
  CONSTRAINT fk_admin_logs_admin_users FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_token (
  refresh_token_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id          BIGINT NOT NULL,
  token            VARCHAR(500) NOT NULL,
  expired_at       DATETIME NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (refresh_token_id),
  UNIQUE KEY uk_refresh_token_token (token),
  KEY ix_refresh_token_user_id (user_id),
  KEY ix_refresh_token_expired_at (expired_at),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_images (
  event_image_id      BIGINT       NOT NULL AUTO_INCREMENT,
  event_id            BIGINT       NOT NULL,
  original_url        VARCHAR(500) NOT NULL,
  thumb_url           VARCHAR(500) NULL,
  image_order         INT          NOT NULL DEFAULT 1,
  mime_type           ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL,
  file_size           BIGINT       NULL,
  created_by_admin_id BIGINT       NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_image_id),
  UNIQUE KEY uk_event_images_event_order (event_id, image_order),
  KEY ix_event_images_event_id (event_id),
  KEY ix_event_images_admin_id (created_by_admin_id),
  CONSTRAINT fk_event_images_event
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_images_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

