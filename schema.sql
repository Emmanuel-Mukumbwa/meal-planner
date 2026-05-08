
-- PantryPilot Database Schema for Aiven MySQL
-- Execute these commands in your Aiven Console

CREATE DATABASE IF NOT EXISTS pantry_pilot;
USE pantry_pilot;

-- 1. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    category VARCHAR(100),
    expiryDate DATETIME,
    lowStockThreshold DECIMAL(10,2) DEFAULT 1.0,
    price DECIMAL(10,2) DEFAULT 0.00, -- Tracks price in MWK
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recipe Ingredients (Join Table)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id VARCHAR(36) PRIMARY KEY,
    recipe_id VARCHAR(36),
    name VARCHAR(255),
    quantity DECIMAL(10,2),
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
    type VARCHAR(50), -- Meat, Veg, etc.
    storedAt DATETIME NOT NULL,
    expiresAt DATETIME NOT NULL,
    status ENUM('frozen', 'consumed', 'discarded') DEFAULT 'frozen',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shopping List Table
CREATE TABLE IF NOT EXISTS shopping_list (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50),
    completed TINYINT(1) DEFAULT 0,
    category VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('leftover_reminder', 'leftover_overdue', 'system') NOT NULL DEFAULT 'leftover_reminder',
    relatedType VARCHAR(50),
    relatedId VARCHAR(36),
    notifyAt DATETIME NOT NULL,
    isRead TINYINT(1) DEFAULT 0,
    readAt DATETIME NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifyAt (notifyAt),
    INDEX idx_isRead (isRead),
    INDEX idx_relatedId (relatedId)
);