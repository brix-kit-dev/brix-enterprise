-- Flyway DDL for the legacy msg_message table and msg_template columns that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS msg_message (
    message_id character varying(36) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    read_at timestamp(6) without time zone,
    receiver_id character varying(36) NOT NULL,
    receiver_name character varying(100),
    reference_id character varying(36),
    reference_type character varying(50),
    sender_id character varying(36) NOT NULL,
    sender_name character varying(100),
    status character varying(20) NOT NULL,
    tenant_id character varying(36) NOT NULL,
    title character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT msg_message_pkey PRIMARY KEY (message_id),
    CONSTRAINT msg_message_status_check CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED', 'DELETED')),
    CONSTRAINT msg_message_type_check CHECK (type IN ('SYSTEM', 'PRIVATE', 'BROADCAST', 'NOTIFICATION'))
);
CREATE INDEX IF NOT EXISTS idx_message_inbox ON msg_message (tenant_id, receiver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_outbox ON msg_message (tenant_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reference ON msg_message (reference_type, reference_id);

ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS template_id character varying(36) NOT NULL;
ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS channels character varying(200);
ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS description character varying(500);
ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL;
ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS message_type character varying(20) NOT NULL CONSTRAINT msg_template_message_type_check CHECK (message_type IN ('SYSTEM', 'PRIVATE', 'BROADCAST', 'NOTIFICATION'));
ALTER TABLE msg_template ADD COLUMN IF NOT EXISTS name character varying(100) NOT NULL;
