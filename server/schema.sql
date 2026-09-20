-- Run this script in your MySQL database to set up the tables

CREATE DATABASE IF NOT EXISTS leetcode_tracker;
USE leetcode_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Completed questions
CREATE TABLE IF NOT EXISTS completed_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    completed_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_completion (user_id, question_id)
);

-- Tracked time
CREATE TABLE IF NOT EXISTS tracked_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    track_date DATE NOT NULL,
    seconds INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_time (user_id, track_date)
);
