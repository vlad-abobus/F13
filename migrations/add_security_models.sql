-- Миграция для добавления таблиц безопасности
-- Создана для реализации безопасности от DDoS, ботов, спама, и защиты аккаунтов

-- Таблица для управления сессиями
CREATE TABLE IF NOT EXISTS user_session (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_expires ON user_session(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_session_token_hash ON user_session(session_token_hash);

-- Таблица для двухфакторной аутентификации
CREATE TABLE IF NOT EXISTS two_factor_code (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    method VARCHAR(50) DEFAULT 'email',
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON two_factor_code(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_expires ON two_factor_code(expires_at);

-- Таблица для доверенных устройств
CREATE TABLE IF NOT EXISTS trusted_device (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    device_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_trusted_device_user_id ON trusted_device(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_device_ip ON trusted_device(ip_address);

-- Таблица для логирования событий безопасности
CREATE TABLE IF NOT EXISTS security_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    event_type VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_security_log_user_id ON security_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_log_event_type ON security_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_log_created_at ON security_log(created_at);

-- Таблица для fallback rate limiting (если Redis недоступен)
CREATE TABLE IF NOT EXISTS rate_limit_counter (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    reset_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key ON rate_limit_counter(key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON rate_limit_counter(reset_at);

-- Таблица для заблокированных IP адресов (если они есть)
CREATE TABLE IF NOT EXISTS ip_ban (
    id VARCHAR(36) PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason VARCHAR(255),
    ban_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_ban_address ON ip_ban(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_ban_active ON ip_ban(is_active);
