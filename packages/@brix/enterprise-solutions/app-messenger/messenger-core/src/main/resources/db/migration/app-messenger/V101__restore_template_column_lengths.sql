-- Restore the V100 column lengths that Hibernate 7 `ddl-auto: update` changed on
-- databases started with Spring Boot 4.1.1. The entity now declares the V100
-- lengths. Fresh installs already have them.

ALTER TABLE msg_template ALTER COLUMN tenant_id TYPE VARCHAR(64);
ALTER TABLE msg_template ALTER COLUMN template_code TYPE VARCHAR(64);
ALTER TABLE msg_template ALTER COLUMN title_template TYPE VARCHAR(500);
