-- Football Academy Database Schema
-- Run this script to create the database structure

-- Create database (run this separately)
-- CREATE DATABASE football_academy;

-- Connect to the database and run the following:

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    booked_sessions INTEGER DEFAULT 12,
    used_sessions INTEGER DEFAULT 0,
    complimentary_sessions INTEGER DEFAULT 0,
    max_complimentary INTEGER DEFAULT 3,
    training_completed INTEGER DEFAULT 0,
    join_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL CHECK (time_slot IN ('morning', 'evening')),
    age_group VARCHAR(10) NOT NULL,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    group_photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, time_slot, age_group)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(25) NOT NULL CHECK (status IN ('present_regular', 'present_complimentary', 'absent')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, player_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_age_group ON players(age_group);
CREATE INDEX IF NOT EXISTS idx_sessions_date_age_group ON sessions(date, age_group);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player_id ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_coaches_username ON coaches(username);

-- Insert sample coaches
INSERT INTO coaches (username, password_hash, name, email, age_group) VALUES
('coach_u12', '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'John Smith', 'john.smith@academy.com', 'U12'),
('coach_u14', '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'Sarah Johnson', 'sarah.johnson@academy.com', 'U14'),
('coach_u16', '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'Mike Wilson', 'mike.wilson@academy.com', 'U16')
ON CONFLICT (username) DO NOTHING;

-- Insert sample players
INSERT INTO players (name, age_group, booked_sessions, used_sessions, complimentary_sessions, training_completed, join_date, notes) VALUES
('Olivia Garcia', 'U16', 12, 10, 1, 8, '2024-01-15', 'Excellent progress in defensive skills'),
('William Rodriguez', 'U16', 12, 11, 0, 11, '2024-01-20', 'Outstanding leadership qualities'),
('Ava Martinez', 'U16', 12, 7, 3, 5, '2024-02-01', 'Needs improvement in attendance and focus'),
('James Anderson', 'U16', 12, 9, 1, 8, '2024-02-10', 'Good technical skills, working on stamina'),
('Isabella Taylor', 'U16', 12, 12, 0, 12, '2024-01-25', 'Perfect attendance, excellent all-around player'),
('Alex Thompson', 'U12', 12, 8, 1, 7, '2024-01-15', 'Enthusiastic player, needs work on ball control'),
('Emma Davis', 'U12', 12, 10, 0, 9, '2024-01-20', 'Great team player with good passing skills'),
('James Wilson', 'U14', 16, 12, 2, 10, '2024-02-01', 'Strong midfielder, working on shooting accuracy'),
('Sofia Garcia', 'U14', 16, 14, 1, 13, '2024-02-10', 'Excellent goalkeeper with quick reflexes')
ON CONFLICT DO NOTHING;
