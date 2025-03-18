CREATE DATABASE IF NOT EXISTS events_engine;

USE events_engine;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    oauth_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apps (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    app_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
    key_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    expiry DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (app_id) REFERENCES apps(app_id) ON DELETE CASCADE
);

-- event, url, referrer, device, ipAddress, timestamp, metadata, userId

CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    referrer TEXT NOT NULL,
    device VARCHAR(255) NOT NULL,
    ip_address VARCHAR(40) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    metadata TEXT,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    app_id INT NOT NULL,
    FOREIGN KEY (app_id) REFERENCES apps(app_id) ON DELETE CASCADE
);

CREATE INDEX idx_app_id ON api_keys (app_id);
CREATE INDEX idx_api_key ON api_keys (api_key);
CREATE INDEX idx_user_id ON apps (user_id);
CREATE INDEX idx_oauth ON users (oauth_id);