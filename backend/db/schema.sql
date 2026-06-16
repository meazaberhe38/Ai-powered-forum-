-- ============================================================================
-- Evangadi AI-Powered Forum - Complete Database Schema
-- ============================================================================
-- 
-- QUICK START FOR NEW DEVELOPERS:
--   1. Create database:
--      mysql -u root -p
--      CREATE DATABASE ai_tutor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--      EXIT;
--
--   2. Run this schema:
--      mysql -u root -p ai_tutor_db < db/schema.sql
--
--   3. Verify installation:
--      mysql -u root -p ai_tutor_db -e "SHOW TABLES;"
--
-- FEATURES:
--   - User management with authentication
--   - Q&A system with full-text search
--   - AI semantic search using Gemini embeddings
--   - Community voting system
--   - RAG (Retrieval-Augmented Generation) for PDFs
--
-- VERSION: 1.0.0 | PLATFORM: MySQL 8.0+
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- NOTE: This schema includes sample data so developers can start immediately
-- To skip sample data, comment out the "-- SAMPLE DATA" section below

-- ============================================================================
-- TABLE: users
-- ============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(320) NOT NULL UNIQUE COMMENT 'Unique email for login',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    `avatar_url` VARCHAR(1024) NULL,
    `bio` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CHECK (`email` = LOWER(`email`)),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts and profiles';

-- ============================================================================
-- TABLE: questions
-- ============================================================================
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
    `question_id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_hash` CHAR(16) NOT NULL UNIQUE COMMENT '16-char hash for URL routing',
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CHECK (CHAR_LENGTH(`title`) >= 5),
    CHECK (CHAR_LENGTH(`content`) >= 10),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    
    INDEX `idx_questions_user_id` (`user_id`),
    INDEX `idx_questions_created_at` (`created_at`),
    INDEX `idx_questions_hash` (`question_hash`),
    FULLTEXT KEY `ft_questions_search` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Questions with full-text and semantic search';

-- ============================================================================
-- TABLE: question_vectors
-- ============================================================================
DROP TABLE IF EXISTS `question_vectors`;
CREATE TABLE `question_vectors` (
    `vector_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `source_text` TEXT NOT NULL COMMENT 'Text used for embedding',
    `embedding` JSON NOT NULL COMMENT 'Gemini embedding vector (3072 dims)',
    `status` ENUM('ready', 'pending', 'failed') DEFAULT 'ready',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_question_vectors_question_id` (`question_id`),
    INDEX `idx_question_vectors_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Vector embeddings for semantic search';

-- ============================================================================
-- TABLE: answers
-- ============================================================================
DROP TABLE IF EXISTS `answers`;
CREATE TABLE `answers` (
    `answer_id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    
    INDEX `idx_answers_question_id` (`question_id`),
    INDEX `idx_answers_user_id` (`user_id`),
    INDEX `idx_answers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Answers to questions';

-- ============================================================================
-- TABLE: votes
-- ============================================================================
DROP TABLE IF EXISTS `votes`;
CREATE TABLE `votes` (
    `vote_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `target_type` ENUM('question', 'answer') NOT NULL,
    `target_id` INT NOT NULL COMMENT 'ID of question or answer',
    `vote` TINYINT NOT NULL COMMENT '1=upvote, -1=downvote',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (`vote` IN (1, -1)),
    UNIQUE KEY `uniq_user_target` (`user_id`, `target_type`, `target_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    
    INDEX `idx_votes_target` (`target_type`, `target_id`),
    INDEX `idx_votes_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Voting system for questions and answers';

-- ============================================================================
-- TABLE: documents (RAG System)
-- ============================================================================
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
    `document_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT 'Document owner',
    `title` VARCHAR(512) NOT NULL,
    `mime_type` VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
    `storage_path` VARCHAR(1024) NOT NULL,
    `byte_size` BIGINT NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'processing', 'ready', 'failed') DEFAULT 'pending',
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    INDEX `idx_documents_user_created` (`user_id`, `created_at`),
    INDEX `idx_documents_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User-uploaded PDFs for RAG system';

-- ============================================================================
-- TABLE: document_chunks
-- ============================================================================
DROP TABLE IF EXISTS `document_chunks`;
CREATE TABLE `document_chunks` (
    `chunk_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `document_id` INT NOT NULL,
    `chunk_index` INT NOT NULL COMMENT 'Sequential chunk number',
    `content` TEXT NOT NULL,
    `page_start` INT NULL,
    `page_end` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`document_id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_document_chunks_doc_index` (`document_id`, `chunk_index`),
    INDEX `idx_document_chunks_document_id` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Text chunks extracted from documents';

-- ============================================================================
-- TABLE: document_chunk_vectors
-- ============================================================================
DROP TABLE IF EXISTS `document_chunk_vectors`;
CREATE TABLE `document_chunk_vectors` (
    `chunk_vector_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `chunk_id` BIGINT NOT NULL,
    `source_text` TEXT NOT NULL,
    `embedding` JSON NOT NULL COMMENT 'Gemini embedding vector',
    `status` ENUM('ready', 'pending', 'failed') DEFAULT 'ready',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`chunk_id`) REFERENCES `document_chunks`(`chunk_id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_chunk_vectors_chunk_id` (`chunk_id`),
    INDEX `idx_chunk_vectors_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Vector embeddings for document chunks';

-- ============================================================================
-- ENABLE CONSTRAINTS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- USEFUL VIEWS FOR DEVELOPERS
-- ============================================================================

DROP VIEW IF EXISTS `vw_question_stats`;
CREATE VIEW `vw_question_stats` AS
SELECT 
    q.question_id,
    q.question_hash,
    q.title,
    CONCAT(u.first_name, ' ', u.last_name) as author,
    COUNT(DISTINCT a.answer_id) as answers_count,
    COALESCE(SUM(CASE WHEN v.target_type='question' THEN v.vote ELSE 0 END), 0) as vote_score,
    qv.status as embedding_status,
    q.created_at
FROM questions q
JOIN users u ON q.user_id = u.user_id
LEFT JOIN answers a ON q.question_id = a.question_id
LEFT JOIN votes v ON q.question_id = v.target_id AND v.target_type='question'
LEFT JOIN question_vectors qv ON q.question_id = qv.question_id
GROUP BY q.question_id;

-- ============================================================================
-- SAMPLE QUERIES FOR DEVELOPERS
-- ============================================================================
-- 
-- 1. Check table count:
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema='ai_tutor_db';
--
-- 2. View all users:
-- SELECT user_id, CONCAT(first_name, ' ', last_name) as name, email, created_at FROM users;
--
-- 3. Find questions with no embeddings:
-- SELECT q.question_id, q.title FROM questions q LEFT JOIN question_vectors qv ON q.question_id = qv.question_id WHERE qv.vector_id IS NULL;
--
-- 4. Vector status summary:
-- SELECT status, COUNT(*) as count FROM question_vectors GROUP BY status;
--
-- 5. Top voted questions:
-- SELECT q.question_id, q.title, SUM(v.vote) as score FROM questions q LEFT JOIN votes v ON q.question_id = v.target_id AND v.target_type='question' GROUP BY q.question_id ORDER BY score DESC LIMIT 10;
--
-- 6. Full-text search example:
-- SELECT question_id, title, MATCH(title, content) AGAINST('javascript') as relevance FROM questions WHERE MATCH(title, content) AGAINST('javascript' IN BOOLEAN MODE) LIMIT 10;
--
-- 7. RAG document status:
-- SELECT d.document_id, d.title, d.status, COUNT(dc.chunk_id) as chunks FROM documents d LEFT JOIN document_chunks dc ON d.document_id = dc.document_id GROUP BY d.document_id;
--
-- 8. User activity:
-- SELECT user_id, CONCAT(first_name, ' ', last_name) as name, (SELECT COUNT(*) FROM questions WHERE user_id = u.user_id) as questions, (SELECT COUNT(*) FROM answers WHERE user_id = u.user_id) as answers FROM users u;
--
-- ============================================================================
-- MAINTENANCE COMMANDS
-- ============================================================================
--
-- Optimize tables (run periodically):
-- OPTIMIZE TABLE users, questions, answers, votes, question_vectors;
--
-- Analyze tables (helps query optimizer):
-- ANALYZE TABLE questions, question_vectors, document_chunks;
--
-- Check table status:
-- SHOW TABLE STATUS FROM ai_tutor_db WHERE Name='questions';
--
-- ============================================================================
-- BACKUP & RESTORE
-- ============================================================================
--
-- Backup entire database:
-- mysqldump -u root -p ai_tutor_db > backup_$(date +%Y%m%d).sql
--
-- Restore from backup:
-- mysql -u root -p ai_tutor_db < backup_20260616.sql
--
-- Backup schema only (no data):
-- mysqldump -u root -p --no-data ai_tutor_db > schema_backup.sql
--
-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- 1. Check database exists:
-- SHOW DATABASES;
--
-- 2. Check all tables created:
-- SHOW TABLES;
--
-- 3. Verify table structure:
-- DESC users;
-- DESC questions;
--
-- 4. Check foreign key constraints:
-- SELECT CONSTRAINT_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA = 'ai_tutor_db' AND REFERENCED_TABLE_NAME IS NOT NULL;
--
-- 5. Check indexes:
-- SHOW INDEX FROM questions;
--
-- 6. Check for errors:
-- SHOW ENGINE INNODB STATUS;
--
-- ============================================================================


-- ============================================================================
-- SAMPLE DATA (For Development & Testing)
-- ============================================================================
-- This section populates the database with realistic sample data
-- so developers can start testing immediately
-- 
-- To SKIP sample data: Comment out all INSERT statements below
-- To USE sample data: Run schema as normal
-- ============================================================================

-- Sample Users
INSERT INTO users (first_name, last_name, email, password_hash, bio) VALUES
('John', 'Developer', 'john@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye4QoWEVxUbIc8q4KlLDpZM0MXZvIx0oW', 'Full-stack developer passionate about web technologies'),
('Sarah', 'Engineer', 'sarah@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye4QoWEVxUbIc8q4KlLDpZM0MXZvIx0oW', 'Senior software engineer with 5+ years experience'),
('Mike', 'Designer', 'mike@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye4QoWEVxUbIc8q4KlLDpZM0MXZvIx0oW', 'UI/UX designer focusing on user experience'),
('Emily', 'DataScientist', 'emily@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye4QoWEVxUbIc8q4KlLDpZM0MXZvIx0oW', 'Data scientist working with machine learning');

-- Sample Questions
INSERT INTO questions (question_hash, user_id, title, content) VALUES
('abc123def456g', 1, 'How do I set up Node.js with Express?', 'I am trying to create a new Express server but I am not sure about the best practices. Can someone help me with the setup process? I want to use MySQL as my database and implement proper error handling.'),
('xyz789uvw012h', 2, 'What is the best way to handle authentication in REST APIs?', 'I need to implement user authentication in my REST API. Should I use JWT tokens or session-based authentication? What are the pros and cons of each approach?'),
('qwe456rty789i', 3, 'How to optimize database queries for performance?', 'My application is slow when querying large datasets. I have millions of records in my database. What techniques can I use to optimize my queries? Should I use indexes, caching, or query optimization?'),
('asd234fgh567j', 1, 'Understanding async/await in JavaScript', 'Can someone explain how async/await works in JavaScript? I understand promises but async/await seems more elegant. How do I handle errors with try-catch blocks?'),
('zxc111qwe222k', 4, 'Machine Learning algorithms for beginners', 'I want to learn about machine learning algorithms. Where should I start? What is the difference between supervised and unsupervised learning?');

-- Sample Answers
INSERT INTO answers (question_id, user_id, content) VALUES
(1, 2, 'Here is a basic Express setup:\n\nconst express = require("express");\nconst app = express();\n\napp.use(express.json());\n\napp.get("/", (req, res) => {\n  res.json({ message: "Hello World" });\n});\n\napp.listen(3000, () => {\n  console.log("Server running on port 3000");\n});\n\nMake sure to install Express first: npm install express'),
(1, 3, 'For production, I recommend using environment variables and a proper error handling middleware:\n\nconst errorHandler = (err, req, res, next) => {\n  console.error(err.stack);\n  res.status(500).json({ error: "Something went wrong!" });\n};\n\napp.use(errorHandler);'),
(2, 1, 'JWT (JSON Web Tokens) is modern and stateless. Here is a comparison:\n\nJWT:\n+ Stateless\n+ Scalable\n- Larger payload\n\nSession:\n+ Smaller payload\n+ Can invalidate immediately\n- Requires server storage\n\nFor APIs, JWT is usually better.'),
(3, 4, 'Database optimization tips:\n\n1. Use proper indexes on frequently queried columns\n2. Implement query caching with Redis\n3. Use pagination to limit results\n4. Denormalize data when necessary\n5. Use database connection pooling\n\nHere is an example index:\nCREATE INDEX idx_user_email ON users(email);');

-- Sample Votes
INSERT INTO votes (user_id, target_type, target_id, vote) VALUES
(2, 'question', 1, 1),
(3, 'question', 1, 1),
(4, 'question', 2, 1),
(1, 'question', 3, 1),
(2, 'answer', 1, 1),
(3, 'answer', 1, 1),
(1, 'answer', 2, 1),
(4, 'answer', 3, 1),
(1, 'answer', 4, 1);

-- Sample Question Vectors (Placeholder - will be generated by the app)
-- Note: Real embeddings are generated by the application when questions are created
-- These are just placeholders showing the structure
INSERT INTO question_vectors (question_id, source_text, embedding, status) VALUES
(1, 'How do I set up Node.js with Express? I am trying to create a new Express server but I am not sure about the best practices. Can someone help me with the setup process? I want to use MySQL as my database and implement proper error handling.', '{"embedding": "placeholder - will be generated by Gemini API"}', 'ready'),
(2, 'What is the best way to handle authentication in REST APIs? I need to implement user authentication in my REST API. Should I use JWT tokens or session-based authentication? What are the pros and cons of each approach?', '{"embedding": "placeholder - will be generated by Gemini API"}', 'ready'),
(3, 'How to optimize database queries for performance? My application is slow when querying large datasets. I have millions of records in my database. What techniques can I use to optimize my queries? Should I use indexes, caching, or query optimization?', '{"embedding": "placeholder - will be generated by Gemini API"}', 'ready'),
(4, 'Understanding async/await in JavaScript Can someone explain how async/await works in JavaScript? I understand promises but async/await seems more elegant. How do I handle errors with try-catch blocks?', '{"embedding": "placeholder - will be generated by Gemini API"}', 'ready'),
(5, 'Machine Learning algorithms for beginners I want to learn about machine learning algorithms. Where should I start? What is the difference between supervised and unsupervised learning?', '{"embedding": "placeholder - will be generated by Gemini API"}', 'ready');

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================
-- Run these queries to verify the database was set up correctly:
-- 
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema='ai_tutor_db';
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as question_count FROM questions;
-- SELECT COUNT(*) as answer_count FROM answers;
-- SELECT COUNT(*) as vote_count FROM votes;
-- ============================================================================
