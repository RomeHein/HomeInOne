SET search_path TO ${schema~};
ALTER TABLE "user" ADD UNIQUE (user_telegram_id);