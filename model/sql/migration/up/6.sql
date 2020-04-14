SET search_path TO ${schema~};

CREATE TABLE if not exists system_preference (
    preference_id SERIAL PRIMARY KEY,
    system_version TEXT DEFAULT '1.0.0',
    system_devices_access_name TEXT,
    system_devices_access_password TEXT,
    system_theme TEXT
);

-- Insert system preference
INSERT INTO system_preference (system_devices_access_name, system_devices_access_password) VALUES ('hioDevices', 'hioDevicesP@ssword');


CREATE TABLE if not exists device (
    device_id SERIAL PRIMARY KEY,
    device_label TEXT,
    device_type TEXT
);

ALTER TABLE actionnable ADD COLUMN action_device_id INTEGER REFERENCES device (device_id) ON DELETE CASCADE;