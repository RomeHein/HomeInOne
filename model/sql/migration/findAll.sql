SET search_path TO ${schema~};
SELECT 
    m.migration_name,
    m.migration_date
FROM migration m;
