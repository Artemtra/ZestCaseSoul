ALTER TABLE orders
  MODIFY status ENUM('new', 'paid', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new';
