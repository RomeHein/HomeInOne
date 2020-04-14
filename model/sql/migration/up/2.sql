SET search_path TO ${schema~};
CREATE TABLE if not exists user_status (
    status_id INTEGER NOT NULL PRIMARY KEY,
    status_label TEXT
);

-- Insert default status
INSERT INTO user_status (status_id, status_label) VALUES (1, 'Active') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (2, 'Pending') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (3, 'Blocked') ON CONFLICT (status_id) DO NOTHING;
INSERT INTO user_status (status_id, status_label) VALUES (4, 'Deleted') ON CONFLICT (status_id) DO NOTHING;

-- Remove previous default roles
DELETE FROM "role" WHERE "role".role_id = 3; 
DELETE FROM "role" WHERE "role".role_id = 4; 
DELETE FROM "role" WHERE "role".role_id = 5; 

-- Add status in user table
ALTER TABLE "user" ADD COLUMN user_status_id integer NOT NULL DEFAULT 1;
ALTER TABLE "user" ADD CONSTRAINT user_user_status_id_fk FOREIGN KEY (user_status_id) REFERENCES user_status (status_id);