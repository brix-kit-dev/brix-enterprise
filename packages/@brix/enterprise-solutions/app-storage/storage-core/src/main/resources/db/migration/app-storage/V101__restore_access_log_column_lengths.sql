-- Restore the V100 column lengths that Hibernate 7 `ddl-auto: update` changed on
-- databases started with Spring Boot 4.1.1. The entity now declares the V100
-- lengths. Fresh installs already have them.

ALTER TABLE storage_access_log ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE storage_access_log ALTER COLUMN file_id TYPE VARCHAR(64);
ALTER TABLE storage_access_log ALTER COLUMN file_name TYPE VARCHAR(300);
ALTER TABLE storage_access_log ALTER COLUMN access_type TYPE VARCHAR(32);
