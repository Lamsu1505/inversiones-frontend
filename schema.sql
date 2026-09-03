-- =============================================================================
-- InvManager — Esquema de base de datos
-- Basado en el export de DrawSQL, corregido y completado a mano.
--
-- Requiere estar conectado a la base correcta antes de correrlo:
--   psql inversiones_db -f schema.sql
--
-- Cambios respecto al export original de DrawSQL:
--   - "order" renombrado a "display_order" (era palabra reservada de SQL)
--   - FK con ON DELETE RESTRICT explícito (antes implícito vía NO ACTION)
--   - Se agregan los CHECK, triggers y datos semilla que el editor visual
--     de DrawSQL no puede generar
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. TABLAS
-- =============================================================================

CREATE TABLE investment_type (
    id             smallserial NOT NULL,
    code           TEXT NOT NULL,
    name           TEXT NOT NULL,
    display_order  SMALLINT NOT NULL
);

ALTER TABLE investment_type
    ADD PRIMARY KEY (id);

ALTER TABLE investment_type
    ADD CONSTRAINT investment_type_code_unique UNIQUE (code);


CREATE TABLE investment (
    id                        bigserial NOT NULL,
    name                      TEXT NOT NULL,
    entity                    TEXT NULL,
    investment_type_id        SMALLINT NOT NULL,
    currency                  CHAR(3) NOT NULL DEFAULT 'COP',
    tracks_unit_value         BOOLEAN NOT NULL DEFAULT FALSE,
    tracks_available_balance  BOOLEAN NOT NULL DEFAULT FALSE,
    active                    BOOLEAN NOT NULL DEFAULT TRUE,
    opening_date              DATE NOT NULL,
    created_at                TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE investment
    ADD PRIMARY KEY (id);


CREATE TABLE daily_record (
    id                 bigserial NOT NULL,
    investment_id      BIGINT NOT NULL,
    record_date        DATE NOT NULL,
    unit_value         DECIMAL(18, 6) NULL,
    available_balance  DECIMAL(19, 4) NULL,
    total_balance      DECIMAL(19, 4) NOT NULL,
    units_quantity     DECIMAL(20, 10) NULL,
    note               TEXT NULL,
    created_at         TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_record
    ADD PRIMARY KEY (id);

-- La restricción más importante de todo el esquema: un registro por
-- inversión por día. Es justo lo que el Excel no puede garantizar.
ALTER TABLE daily_record
    ADD CONSTRAINT daily_record_investment_id_record_date_unique
    UNIQUE (investment_id, record_date);


CREATE TABLE movement (
    id             bigserial NOT NULL,
    investment_id  BIGINT NOT NULL,
    movement_date  DATE NOT NULL,
    movement_type  VARCHAR(255) NOT NULL
                   CHECK (movement_type IN ('deposit', 'withdrawal')),
    amount         DECIMAL(19, 4) NOT NULL,
    note           TEXT NULL,
    created_at     TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE movement
    ADD PRIMARY KEY (id);


-- =============================================================================
-- 2. LLAVES FORÁNEAS
-- ON DELETE RESTRICT a propósito: borrar una inversión con años de
-- historial diario es irreversible. La base se niega y obliga al backend
-- a ser explícito (dar de baja primero, o borrar los hijos a mano).
-- =============================================================================

ALTER TABLE investment
    ADD CONSTRAINT investment_investment_type_id_foreign
    FOREIGN KEY (investment_type_id) REFERENCES investment_type (id)
    ON DELETE RESTRICT;

ALTER TABLE daily_record
    ADD CONSTRAINT daily_record_investment_id_foreign
    FOREIGN KEY (investment_id) REFERENCES investment (id)
    ON DELETE RESTRICT;

ALTER TABLE movement
    ADD CONSTRAINT movement_investment_id_foreign
    FOREIGN KEY (investment_id) REFERENCES investment (id)
    ON DELETE RESTRICT;


-- =============================================================================
-- 3. RESTRICCIONES CHECK
-- No tienen soporte visual en DrawSQL, se agregan a mano.
-- =============================================================================

ALTER TABLE daily_record
    ADD CONSTRAINT chk_daily_record_total_balance_non_negative
        CHECK (total_balance >= 0),
    ADD CONSTRAINT chk_daily_record_available_le_total
        CHECK (available_balance IS NULL OR available_balance <= total_balance),
    ADD CONSTRAINT chk_daily_record_unit_value_positive
        CHECK (unit_value IS NULL OR unit_value > 0),
    ADD CONSTRAINT chk_daily_record_date_not_future
        CHECK (record_date <= CURRENT_DATE);

ALTER TABLE movement
    ADD CONSTRAINT chk_movement_amount_positive
        CHECK (amount > 0),
    ADD CONSTRAINT chk_movement_date_not_future
        CHECK (movement_date <= CURRENT_DATE);


-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- 4.1 — updated_at automático.
-- investment_type NO lleva este trigger: es un catálogo pequeño, sin
-- columnas created_at/updated_at por diseño.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_investment_updated_at
    BEFORE UPDATE ON investment
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_record_updated_at
    BEFORE UPDATE ON daily_record
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_movement_updated_at
    BEFORE UPDATE ON movement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 4.2 — Coherencia entre investment.tracks_* y daily_record.
-- No se puede expresar como CHECK porque cruza dos tablas.
--
-- Solo se bloquea la dirección peligrosa: llenar un campo que la
-- inversión dice que NO reporta (ej. meter unit_value a un CDT). No se
-- exige lo contrario (que si tracks_unit_value=true, el campo nunca
-- pueda faltar un día puntual) — eso sería más rígido de lo necesario.
CREATE OR REPLACE FUNCTION check_daily_record_flags()
RETURNS TRIGGER AS $$
DECLARE
    v_tracks_unit_value        BOOLEAN;
    v_tracks_available_balance BOOLEAN;
BEGIN
    SELECT tracks_unit_value, tracks_available_balance
      INTO v_tracks_unit_value, v_tracks_available_balance
      FROM investment
     WHERE id = NEW.investment_id;

    IF NOT v_tracks_unit_value AND NEW.unit_value IS NOT NULL THEN
        RAISE EXCEPTION
            'La inversión % no registra valor de unidad, pero unit_value viene lleno',
            NEW.investment_id;
    END IF;

    IF NOT v_tracks_available_balance AND NEW.available_balance IS NOT NULL THEN
        RAISE EXCEPTION
            'La inversión % no registra saldo disponible, pero available_balance viene lleno',
            NEW.investment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_daily_record_check_flags
    BEFORE INSERT OR UPDATE ON daily_record
    FOR EACH ROW EXECUTE FUNCTION check_daily_record_flags();


-- =============================================================================
-- 5. DATOS SEMILLA
-- Contenido, no esquema — por eso nunca vivió en el diagrama de DrawSQL.
--
-- Códigos en español, coincidiendo con el union type InvestmentTipo que
-- ya existe en el frontend Angular ('cdt' | 'fondo-inversion' | ...).
-- Si se prefiere inglés, cambiar aquí Y actualizar InvestmentTipo/
-- INVESTMENT_TIPO_LABELS en Angular para que sigan coincidiendo.
-- =============================================================================

INSERT INTO investment_type (code, name, display_order) VALUES
    ('fondo-inversion', 'Fondo de Inversión', 1),
    ('cdt', 'CDT', 2);

COMMIT;