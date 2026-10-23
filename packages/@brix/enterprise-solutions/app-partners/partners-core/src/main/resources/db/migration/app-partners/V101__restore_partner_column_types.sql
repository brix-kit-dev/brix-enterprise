-- Restore the V100 column types that Hibernate 7 `ddl-auto: update` changed on
-- databases started with Spring Boot 4.1.1. The entity now declares the V100
-- types. Fresh installs already have them.

ALTER TABLE biz_partner ALTER COLUMN address TYPE TEXT;
ALTER TABLE biz_partner ALTER COLUMN partner_type TYPE VARCHAR(50);
