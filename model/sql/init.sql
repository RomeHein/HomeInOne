CREATE SCHEMA if not exists ${schema~};
SET search_path TO ${schema~};

CREATE TABLE if not exists migration (
    migration_name TEXT NOT NULL PRIMARY KEY,
    migration_date DATE
);

CREATE TABLE if not exists "role" (
    role_id INTEGER NOT NULL PRIMARY KEY,
    role_label TEXT,
    role_is_admin BOOLEAN
);

CREATE TABLE if not exists system_preference (
    preference_id SERIAL PRIMARY KEY,
    system_version TEXT DEFAULT '1.0.0',
    system_devices_access_name TEXT,
    system_devices_access_password TEXT,
    system_theme TEXT
);

CREATE TABLE if not exists user_status (
    status_id INTEGER NOT NULL PRIMARY KEY,
    status_label TEXT
);

CREATE TABLE if not exists "user" (
    user_id TEXT NOT NULL PRIMARY KEY,
    user_role_id INTEGER REFERENCES "role" (role_id) ON DELETE SET NULL ON UPDATE CASCADE,
    user_telegram_id INTEGER UNIQUE,
    user_telegram_name TEXT,
    user_start_date TIMESTAMP,
    user_end_date TIMESTAMP,
    user_status_id INTEGER REFERENCES user_status (status_id) ON DELETE SET DEFAULT ON UPDATE CASCADE,
    user_deletion_date TIMESTAMP
);

CREATE TABLE if not exists device (
    device_id SERIAL PRIMARY KEY,
    device_label TEXT,
    device_type TEXT
);

CREATE TABLE if not exists actionnable (
    action_id TEXT NOT NULL PRIMARY KEY,
    action_device_id SERIAL REFERENCES device (device_id) ON DELETE CASCADE,
    action_state INTEGER,
    action_source TEXT, -- Can be 'onboard', 'pimodule', 'api', 'mqtt'
    action_mode INTEGER, -- 0 means it's an action. 1 is a listener. -1 means the scheduler will handle it
    action_type TEXT, -- 'relay', 'impulse', 'switch' or 'servo'
    action_conf JSONB, -- {pin, onValue, offValue} for gpio, {url, method, onPayload, offPayload, onValue, offValue} for api, {topic, onValue, offValue} for mqtt 
    action_title TEXT,
    action_off_icon TEXT,
    action_on_icon TEXT
);

CREATE TABLE if not exists actionnable_slave (
    action_id TEXT REFERENCES actionnable (action_id) ON DELETE CASCADE,
    action_slave_id TEXT REFERENCES actionnable (action_id) ON DELETE CASCADE,
    PRIMARY KEY(action_id, action_slave_id)
);

CREATE TABLE if not exists actionnable_access (
    action_id TEXT REFERENCES actionnable (action_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES role (role_id) ON DELETE CASCADE,
    PRIMARY KEY(action_id, role_id)
);

CREATE TABLE if not exists schedule (
    schedule_id SERIAL PRIMARY KEY,
    action_id TEXT REFERENCES actionnable (action_id) ON DELETE CASCADE,
    schedule_days INTEGER[],
    schedule_start_hour TEXT,
    schedule_end_hour TEXT
);

-- Insert default roles
INSERT INTO "role" (role_id, role_label, role_is_admin) VALUES (1, 'Admin', true) ON CONFLICT (role_id) DO NOTHING;
INSERT INTO "role" (role_id, role_label, role_is_admin) VALUES (2, 'Guest', false) ON CONFLICT (role_id) DO NOTHING;

-- Insert default status
INSERT INTO user_status (status_id, status_label) VALUES (1, 'Pending') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (2, 'Pending') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (3, 'Blocked') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (4, 'Deleted') ON CONFLICT (status_id) DO NOTHING;

-- Insert system default preference

INSERT INTO system_preference (system_devices_access_name, system_devices_access_password) VALUES ('hioDevices', 'hioDevicesP@ssword');