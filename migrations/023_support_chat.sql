CREATE TABLE IF NOT EXISTS support_conversations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guest_token_hash CHAR(64) NOT NULL UNIQUE,
  user_id INT UNSIGNED NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  admin_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
  customer_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_conversations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  KEY idx_support_conversations_status_last (status, last_message_at, id),
  KEY idx_support_conversations_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_type ENUM('customer', 'admin') NOT NULL,
  sender_user_id INT UNSIGNED NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_support_messages_user
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  KEY idx_support_messages_conversation_id (conversation_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
