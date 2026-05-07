
-- Create Database
CREATE DATABASE IF NOT EXISTS pantry_pilot;
USE pantry_pilot;

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  expiryDate DATETIME,
  lowStockThreshold DECIMAL(10, 2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id VARCHAR(36) PRIMARY KEY,
  recipe_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Recipe Steps
CREATE TABLE IF NOT EXISTS recipe_steps (
  id VARCHAR(36) PRIMARY KEY,
  recipe_id VARCHAR(36),
  step_number INT,
  instruction TEXT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Shopping List Table
CREATE TABLE IF NOT EXISTS shopping_list (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  category VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leftovers Table
CREATE TABLE IF NOT EXISTS leftovers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('Meat', 'Vegetables', 'Soup', 'Grain', 'Dairy', 'Other') NOT NULL,
  storedAt DATETIME NOT NULL,
  expiresAt DATETIME NOT NULL,
  status ENUM('frozen', 'consumed', 'discarded') DEFAULT 'frozen',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
