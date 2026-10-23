-- Flyway DDL for the legacy contract tables that Hibernate `ddl-auto: update` used to create.
-- Reproduces the definitions found on the shared database, so the host can run
-- with `ddl-auto: validate` (root blueprint BRX-RS-DATA-035). IF NOT EXISTS keeps
-- databases that already have them unchanged.

CREATE TABLE IF NOT EXISTS contract_template (
    id bigserial NOT NULL,
    contract_type character varying(20) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(64),
    current_version integer NOT NULL,
    deleted boolean NOT NULL,
    description character varying(500),
    is_active boolean NOT NULL,
    template_code character varying(32) NOT NULL,
    template_name character varying(100) NOT NULL,
    tenant_id character varying(64) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT contract_template_pkey PRIMARY KEY (id),
    CONSTRAINT contract_template_contract_type_check CHECK (contract_type IN ('TREATMENT', 'AGENCY', 'CONSENT', 'SERVICE', 'NDA')),
    CONSTRAINT uk_template_tenant_code UNIQUE (tenant_id, template_code)
);
CREATE INDEX IF NOT EXISTS idx_template_type ON contract_template (contract_type);

CREATE TABLE IF NOT EXISTS template_version (
    id bigserial NOT NULL,
    change_log character varying(500),
    created_at timestamp(6) without time zone NOT NULL,
    file_type character varying(20),
    file_url character varying(500) NOT NULL,
    published_at timestamp(6) without time zone,
    published_by character varying(64),
    tenant_id character varying(64) NOT NULL,
    variables text,
    version_number integer NOT NULL,
    template_id bigint NOT NULL,
    CONSTRAINT template_version_pkey PRIMARY KEY (id),
    CONSTRAINT fk2kl2y9w01c0gdfh9wafcfqqy5 FOREIGN KEY (template_id) REFERENCES contract_template (id)
);
CREATE INDEX IF NOT EXISTS idx_version_number ON template_version (version_number);
CREATE INDEX IF NOT EXISTS idx_version_template ON template_version (template_id);

CREATE TABLE IF NOT EXISTS contract (
    id bigserial NOT NULL,
    cancel_reason character varying(500),
    case_id character varying(64),
    contract_no character varying(32) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(64),
    deleted boolean NOT NULL,
    expires_at date,
    rendered_url character varying(500),
    signed_at timestamp(6) without time zone,
    status character varying(20) NOT NULL,
    template_id bigint NOT NULL,
    tenant_id character varying(64) NOT NULL,
    updated_at timestamp(6) without time zone,
    variable_values text,
    version_id bigint NOT NULL,
    CONSTRAINT contract_pkey PRIMARY KEY (id),
    CONSTRAINT contract_status_check CHECK (status IN ('DRAFT', 'PENDING_SIGN', 'SIGNED', 'EXPIRED', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_contract_created_by ON contract (created_by);
CREATE INDEX IF NOT EXISTS idx_contract_expires ON contract (expires_at);

CREATE TABLE IF NOT EXISTS contract_party (
    id bigserial NOT NULL,
    display_order integer NOT NULL,
    email character varying(100),
    party_id character varying(64) NOT NULL,
    party_name character varying(100) NOT NULL,
    party_type character varying(20) NOT NULL,
    phone character varying(20),
    tenant_id character varying(64) NOT NULL,
    contract_id bigint NOT NULL,
    CONSTRAINT contract_party_pkey PRIMARY KEY (id),
    CONSTRAINT contract_party_party_type_check CHECK (party_type IN ('CUSTOMER', 'PARTNER', 'PLATFORM', 'WITNESS')),
    CONSTRAINT fk1k944k6gd19jqx4k2ypah9y2h FOREIGN KEY (contract_id) REFERENCES contract (id)
);
CREATE INDEX IF NOT EXISTS idx_party_contract ON contract_party (contract_id);
CREATE INDEX IF NOT EXISTS idx_party_id ON contract_party (party_id);

CREATE TABLE IF NOT EXISTS contract_sign_record (
    id bigserial NOT NULL,
    extra text,
    ip_address character varying(50),
    party_id character varying(64) NOT NULL,
    remark character varying(500),
    sign_method character varying(20) NOT NULL,
    signature_url character varying(500),
    signed_at timestamp(6) without time zone NOT NULL,
    tenant_id character varying(64) NOT NULL,
    user_agent character varying(500),
    contract_id bigint NOT NULL,
    CONSTRAINT contract_sign_record_pkey PRIMARY KEY (id),
    CONSTRAINT contract_sign_record_sign_method_check CHECK (sign_method IN ('MANUAL', 'ESIGN', 'BIOMETRIC', 'SMS_OTP')),
    CONSTRAINT fkfpcc8a97jet78v5r59rkp2s4t FOREIGN KEY (contract_id) REFERENCES contract (id)
);
CREATE INDEX IF NOT EXISTS idx_sign_contract ON contract_sign_record (contract_id);
CREATE INDEX IF NOT EXISTS idx_sign_party ON contract_sign_record (party_id);
CREATE INDEX IF NOT EXISTS idx_sign_time ON contract_sign_record (signed_at);
