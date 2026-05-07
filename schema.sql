
-- PantryPilot Database Schema
-- Run these commands in your Aiven MySQL console

CREATE DATABASE IF NOT EXISTS pantry_pilot;
USE pantry_pilot;

-- 1. Inventory Table (Updated with Price)
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    category VARCHAR(100),
    expiryDate DATETIME,
    lowStockThreshold DECIMAL(10, 2) DEFAULT 1.0,
    price DECIMAL(10, 2) DEFAULT 0.0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recipe Ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id VARCHAR(36) PRIMARY KEY,
    recipe_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 4. Recipe Steps
CREATE TABLE IF NOT EXISTS recipe_steps (
    id VARCHAR(36) PRIMARY KEY,
    recipe_id VARCHAR(36),
    step_number INT,
    instruction TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- 5. Leftovers Table
CREATE TABLE IF NOT EXISTS leftovers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Meat', 'Vegetables', 'Soup', 'Grain', 'Dairy', 'Other') NOT NULL,
    storedAt DATETIME NOT NULL,
    expiresAt DATETIME NOT NULL,
    status ENUM('frozen', 'consumed', 'discarded') DEFAULT 'frozen',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shopping List Table
CREATE TABLE IF NOT EXISTS shopping_list (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50),
    completed TINYINT(1) DEFAULT 0,
    category VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OPTIONAL: If your inventory table already exists, run this to add the price column:
-- ALTER TABLE inventory ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.0;
