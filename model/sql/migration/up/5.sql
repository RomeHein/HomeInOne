SET search_path TO ${schema~};

-- Add column conf to actionnable table
ALTER TABLE actionnable ADD COLUMN action_source TEXT;
ALTER TABLE actionnable ADD COLUMN action_conf JSONB;

-- Remove column from actionnable
ALTER TABLE actionnable DROP COLUMN action_gpio_pin;
ALTER TABLE actionnable DROP COLUMN action_on_value;
ALTER TABLE actionnable DROP COLUMN action_off_value;

-- Remove previous actionnable
DELETE FROM actionnable;

-- Insert new actionnable
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('water', 0, 1, 'api', '{"writeUrl":"http://192.168.50.174/digital/32/", "readUrl":"http://192.168.50.174/digital/32", "method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Water heater', '1F506', '1F319');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('garagelight', 0, 1, 'api', '{"writeUrl": "http://192.168.50.174/digital/22/", "readUrl":"http://192.168.50.174/digital/22", "method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Garage light', '1F506', '1F319');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('roomheater', 0, 1, 'api', '{"writeUrl": "http://192.168.50.174/digital/33/", "readUrl":"http://192.168.50.174/digital/33", "method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Bathroom heater', '1F506', '1F319');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('roomplugs', 0, 1, 'api', '{"writeUrl": "http://192.168.50.174/digital/27/", "readUrl":"http://192.168.50.174/digital/27", "method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Bed room plugs', '1F506', '1F319');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('stairlights', 0, 1, 'api', '{"writeUrl": "http://192.168.50.174/digital/21/", "readUrl":"http://192.168.50.174/digital/21", "method": "GET", "onPayload":"0", "offPayload": "1", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'impulse', 'Stairs lights', '1F500', '1F500');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('livingroomplugs', 0, 1, 'api', '{"writeUrl": "http://192.168.50.174/digital/25/", "readUrl":"http://192.168.50.174/digital/25","method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Living room plugs', '1F506', '1F319');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('door', 0, 1, 'onboard', '{"pin": 4, "onValue":500, "offValue": 2500}', 'servo', 'Door', '2705', '26D4');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('security', 0, 1, 'onboard', '{"pin": 0, "onValue":1, "offValue": 0}', 'switch', 'Security status', '1F512', '1F513');
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('alarmtrigger', 0, 1, 'pimodule', '{"method": "relay","onValue": 1, "offValue": 0}', 'switch', 'Trigger Alarm', '1F4E2', '1F4A4');
