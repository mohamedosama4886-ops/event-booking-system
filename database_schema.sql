-- Badya University Event Booking System - Database Schema
-- MySQL Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS badyaunievents
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE badyaunievents;

-- =========================
-- USERS TABLE (Regular Users)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)    NOT NULL,
  email        VARCHAR(255)    NOT NULL,
  username     VARCHAR(100)    NULL,
  password     VARCHAR(255)    NOT NULL,
  role         VARCHAR(20)     NULL DEFAULT 'USER',
  created_at   DATETIME        NULL,
  updated_at   DATETIME        NULL,
  phone        VARCHAR(20)     NULL,
  faculty      VARCHAR(100)    NULL,
  profile_qr_path VARCHAR(255) NULL,
  attendance_qr_path VARCHAR(255) NULL,
  attendance_token VARCHAR(255) NULL,
  token_expiry DATETIME NULL,
  qr_token     VARCHAR(64)     NULL,
  qr_image_base64 LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_qr_token (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If bookings table exists without payment_method, run:
-- ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(20) NULL AFTER booking_date;

-- If users table already exists without QR columns, run:
-- ALTER TABLE users ADD COLUMN qr_token VARCHAR(64) NULL AFTER updated_at;
-- ALTER TABLE users ADD COLUMN qr_image_base64 LONGTEXT NULL AFTER qr_token;
-- CREATE UNIQUE INDEX uq_users_qr_token ON users (qr_token);

-- =========================
-- ADMINS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS admins (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)    NOT NULL,
  email        VARCHAR(255)    NOT NULL,
  password     VARCHAR(255)    NOT NULL,
  created_at   DATETIME        NULL,
  updated_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- EVENTS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title          VARCHAR(200)    NOT NULL,
  description    VARCHAR(1000)   NOT NULL,
  category       VARCHAR(255)    NOT NULL,
  date           DATE            NOT NULL,
  time           TIME            NOT NULL,
  venue          VARCHAR(255)    NOT NULL,
  capacity       INT             NOT NULL,
  price          DECIMAL(10,2)   NOT NULL,
  image          VARCHAR(500)    NULL,
  organizer      VARCHAR(255)    NOT NULL,
  contact_email  VARCHAR(255)    NOT NULL,
  target_faculties TEXT          NULL,
  created_by_admin_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_events_date (date),
  KEY idx_events_category (category),
  KEY idx_events_created_by_admin (created_by_admin_id),
  CONSTRAINT fk_events_created_by_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- BOOKINGS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS bookings (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id       BIGINT UNSIGNED NOT NULL,
  student_name   VARCHAR(100)    NOT NULL,
  student_id     VARCHAR(50)     NOT NULL,
  student_email  VARCHAR(255)    NOT NULL,
  tickets        INT             NOT NULL,
  total_amount   DECIMAL(10,2)   NOT NULL,
  booking_date   DATETIME        NOT NULL,
  payment_method VARCHAR(20)     NULL COMMENT 'VISA or CASH for paid events; NULL if free',
  PRIMARY KEY (id),
  KEY idx_bookings_event_id (event_id),
  KEY idx_bookings_student_email (student_email),
  CONSTRAINT fk_bookings_event
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- EVENT ATTENDANCE (QR check-in)
-- =========================
CREATE TABLE IF NOT EXISTS event_attendance (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id       BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  checked_in_at  DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_attendance_event_user (event_id, user_id),
  KEY idx_event_attendance_event (event_id),
  CONSTRAINT fk_attendance_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- ATTENDANCE TOKENS (temporary secure tokens for QR scanning)
-- =========================
CREATE TABLE IF NOT EXISTS attendance_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  created_at  DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_tokens_hash (token_hash),
  KEY idx_attendance_tokens_user (user_id),
  KEY idx_attendance_tokens_expires (expires_at),
  CONSTRAINT fk_attendance_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- NOTIFICATIONS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS notifications (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       BIGINT UNSIGNED NOT NULL,
  event_id         BIGINT UNSIGNED NOT NULL,
  phone            VARCHAR(20)     NOT NULL,
  message          TEXT            NOT NULL,
  status           VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'SENT, FAILED, PENDING',
  failure_reason   TEXT            NULL,
  created_at       DATETIME        NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- SAMPLE DATA
-- =========================

-- Default Admin Account
INSERT INTO admins (name, email, password, created_at, updated_at)
VALUES ('Admin', 'admin@gmail.com', '0000', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Sample Events (Optional - can be added via admin panel)
INSERT INTO events (title, description, category, date, time, venue, capacity, price, image, organizer, contact_email)
VALUES 
  ('AI & Machine Learning Workshop', 
   'Learn the fundamentals of AI and machine learning with hands-on projects.', 
   'workshop', 
   '2024-12-15', 
   '10:00:00', 
   'Computer Lab 101', 
   50, 
   25.00, 
   'https://images.unsplash.com/photo-1555949963-aa79dcee981c', 
   'Computer Science Department', 
   'cs@badyauni.edu'),
  ('Basketball Championship Finals', 
   'Watch the exciting finals between Engineering vs Business teams.', 
   'sports', 
   '2024-12-20', 
   '15:00:00', 
   'University Sports Complex', 
   200, 
   10.00, 
   'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4', 
   'Sports Department', 
   'sports@badyauni.edu'),
  ('Cultural Diversity Festival', 
   'Celebrate cultures from around the world with food, music, and performances.', 
   'cultural', 
   '2024-12-25', 
   '18:00:00', 
   'Main Auditorium', 
   300, 
   15.00, 
   'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3', 
   'Student Affairs', 
   'culture@badyauni.edu')
ON DUPLICATE KEY UPDATE title=title;

-- =========================
-- VERIFICATION QUERIES
-- =========================
-- Run these to verify tables were created:
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM admins;
-- SELECT COUNT(*) FROM events;
-- SELECT COUNT(*) FROM bookings;



