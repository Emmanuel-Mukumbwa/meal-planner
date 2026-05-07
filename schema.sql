
-- SQL Script for PantryPilot Database Setup
-- Execute these commands in your Aiven MySQL Console

CREATE DATABASE IF NOT EXISTS pantry_pilot;
USE pantry_pilot;

-- 1. Inventory Table (Stores current stock)
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  expiryDate DATETIME,
  lowStockThreshold DECIMAL(10,2) DEFAULT 1.0,
  price DECIMAL(10,2) DEFAULT 0.0, -- Added price column
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recipe Ingredients Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id VARCHAR(36) PRIMARY KEY,
  recipe_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 4. Recipe Steps Table
CREATE TABLE IF NOT EXISTS recipe_steps (
  id VARCHAR(36) PRIMARY KEY,
  recipe_id VARCHAR(36),
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 5. Shopping List Table
CREATE TABLE IF NOT EXISTS shopping_list (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  category VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Leftovers Table (Freezer Tracking)
CREATE TABLE IF NOT EXISTS leftovers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('Meat', 'Vegetables', 'Soup', 'Grain', 'Dairy', 'Other') NOT NULL,
  storedAt DATETIME NOT NULL,
  expiresAt DATETIME NOT NULL,
  status ENUM('frozen', 'consumed', 'discarded') DEFAULT 'frozen',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
