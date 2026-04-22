--
-- PostgreSQL database dump
--

\restrict wdbiOSMBfjW9T5tMCv1OsvCARcmawPrmMQTpaQqNZjzuseUJaaRz4N9hjYQyZRx

-- Dumped from database version 16.12 (8dbf2dd)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

--
-- Name: booking_payment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.booking_payment_status AS ENUM (
    'unpaid',
    'cash',
    'credit_card',
    'paid'
);


ALTER TYPE public.booking_payment_status OWNER TO neondb_owner;

--
-- Name: document_category; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.document_category AS ENUM (
    'agb',
    'stundenzettel',
    'other'
);


ALTER TYPE public.document_category OWNER TO neondb_owner;

--
-- Name: equipment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.equipment_status AS ENUM (
    'active',
    'in_repair',
    'retired',
    'sold',
    'in_transfer',
    'missing'
);


ALTER TYPE public.equipment_status OWNER TO neondb_owner;

--
-- Name: equipment_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.equipment_type AS ENUM (
    'kite',
    'board',
    'foilboard',
    'foil',
    'wing',
    'bar_lines',
    'wetsuit',
    'harness',
    'helmet_safety'
);


ALTER TYPE public.equipment_type OWNER TO neondb_owner;

--
-- Name: expense_category; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.expense_category AS ENUM (
    'fuel_gas',
    'food_drinks',
    'material_supplies',
    'transport',
    'maintenance',
    'staff',
    'other'
);


ALTER TYPE public.expense_category OWNER TO neondb_owner;

--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.feedback_status AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


ALTER TYPE public.feedback_status OWNER TO neondb_owner;

--
-- Name: inventory_check_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.inventory_check_status AS ENUM (
    'in_progress',
    'completed'
);


ALTER TYPE public.inventory_check_status OWNER TO neondb_owner;

--
-- Name: product_source; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.product_source AS ENUM (
    'walkin',
    'bos'
);


ALTER TYPE public.product_source OWNER TO neondb_owner;

--
-- Name: repair_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.repair_status AS ENUM (
    'pending',
    'completed'
);


ALTER TYPE public.repair_status OWNER TO neondb_owner;

--
-- Name: school_product_category; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.school_product_category AS ENUM (
    'Course',
    'Lesson',
    'Package',
    'Rental',
    'Other'
);


ALTER TYPE public.school_product_category OWNER TO neondb_owner;

--
-- Name: transfer_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transfer_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled'
);


ALTER TYPE public.transfer_status OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'station_lead'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: accessory_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_categories (
    id integer NOT NULL,
    name text NOT NULL,
    has_sizes boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL
);


ALTER TABLE public.accessory_categories OWNER TO neondb_owner;

--
-- Name: accessory_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_categories_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_categories_id_seq OWNED BY public.accessory_categories.id;


--
-- Name: accessory_check_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_check_items (
    id integer NOT NULL,
    check_id integer NOT NULL,
    category_id integer NOT NULL,
    size text,
    target_quantity integer DEFAULT 0 NOT NULL,
    actual_quantity integer DEFAULT 0 NOT NULL,
    notes text
);


ALTER TABLE public.accessory_check_items OWNER TO neondb_owner;

--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_check_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_check_items_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_check_items_id_seq OWNED BY public.accessory_check_items.id;


--
-- Name: accessory_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_checks (
    id integer NOT NULL,
    station_id integer NOT NULL,
    checked_by integer NOT NULL,
    checked_at timestamp without time zone DEFAULT now(),
    total_categories integer DEFAULT 0 NOT NULL,
    total_differences integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.accessory_checks OWNER TO neondb_owner;

--
-- Name: accessory_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_checks_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_checks_id_seq OWNED BY public.accessory_checks.id;


--
-- Name: accessory_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_inventory (
    id integer NOT NULL,
    category_id integer NOT NULL,
    station_id integer NOT NULL,
    size text DEFAULT 'Einheitsgröße'::text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.accessory_inventory OWNER TO neondb_owner;

--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_inventory_id_seq OWNED BY public.accessory_inventory.id;


--
-- Name: accessory_loss_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_loss_reports (
    id integer NOT NULL,
    category_id integer NOT NULL,
    station_id integer NOT NULL,
    size text DEFAULT 'Einheitsgröße'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    reason text NOT NULL,
    reported_by integer NOT NULL,
    reported_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'pending'::text NOT NULL,
    resolved_by integer,
    resolved_at timestamp without time zone,
    admin_note text
);


ALTER TABLE public.accessory_loss_reports OWNER TO neondb_owner;

--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_loss_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_loss_reports_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_loss_reports_id_seq OWNED BY public.accessory_loss_reports.id;


--
-- Name: accessory_transfers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accessory_transfers (
    id integer NOT NULL,
    category_id integer NOT NULL,
    size text DEFAULT 'Einheitsgröße'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    from_station_id integer NOT NULL,
    to_station_id integer NOT NULL,
    transferred_by integer,
    transferred_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.accessory_transfers OWNER TO neondb_owner;

--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accessory_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accessory_transfers_id_seq OWNER TO neondb_owner;

--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accessory_transfers_id_seq OWNED BY public.accessory_transfers.id;


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    equipment_id integer,
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_log OWNER TO neondb_owner;

--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_log_id_seq OWNER TO neondb_owner;

--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: cash_register_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cash_register_entries (
    id integer NOT NULL,
    school_config_id integer NOT NULL,
    date text NOT NULL,
    opening_balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cash_register_entries OWNER TO neondb_owner;

--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cash_register_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cash_register_entries_id_seq OWNER TO neondb_owner;

--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cash_register_entries_id_seq OWNED BY public.cash_register_entries.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    company_name text DEFAULT 'KiteWorldWide GmbH'::text NOT NULL,
    address text DEFAULT 'Steindamm 97, D-20099 Hamburg'::text NOT NULL,
    registry text DEFAULT 'Amtsgericht Hamburg, HRB 105108'::text NOT NULL,
    tax_id text DEFAULT '46/736/04728'::text NOT NULL,
    vat_id text DEFAULT 'DE259606444'::text NOT NULL,
    managing_director text DEFAULT 'York Neumann'::text NOT NULL,
    phone text DEFAULT '+49 40 2093 45090'::text NOT NULL,
    website text DEFAULT 'www.kiteworldwide.com'::text NOT NULL,
    bank_name text DEFAULT 'Commerzbank'::text NOT NULL,
    iban text DEFAULT 'DE69 2004 0000 0898 2100 00'::text NOT NULL,
    bic text DEFAULT 'COBADEFFXXX'::text NOT NULL,
    account_holder text DEFAULT 'KiteWorldWide GmbH'::text NOT NULL,
    logo_url text,
    paypal_email text,
    invoice_prefix text DEFAULT 'Inv-KWS'::text NOT NULL,
    invoice_next_number integer DEFAULT 1001 NOT NULL,
    invoice_year integer DEFAULT 2026 NOT NULL
);


ALTER TABLE public.company_settings OWNER TO neondb_owner;

--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_settings_id_seq OWNER TO neondb_owner;

--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: condition_ratings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.condition_ratings (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    rating integer NOT NULL,
    rated_by integer NOT NULL,
    rated_at timestamp without time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.condition_ratings OWNER TO neondb_owner;

--
-- Name: condition_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.condition_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.condition_ratings_id_seq OWNER TO neondb_owner;

--
-- Name: condition_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.condition_ratings_id_seq OWNED BY public.condition_ratings.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    company_name text,
    address text NOT NULL,
    email text NOT NULL,
    tax_id text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: damage_report_photos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.damage_report_photos (
    id integer NOT NULL,
    damage_report_id integer NOT NULL,
    url text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.damage_report_photos OWNER TO neondb_owner;

--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.damage_report_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.damage_report_photos_id_seq OWNER TO neondb_owner;

--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.damage_report_photos_id_seq OWNED BY public.damage_report_photos.id;


--
-- Name: damage_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.damage_reports (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    reported_by integer NOT NULL,
    reported_at timestamp without time zone DEFAULT now(),
    how_it_happened text NOT NULL,
    customer_name text,
    booking_reference text,
    usage_type text DEFAULT 'rental'::text NOT NULL,
    customer_insured boolean DEFAULT false NOT NULL,
    repairable boolean DEFAULT true NOT NULL,
    total_loss boolean DEFAULT false NOT NULL,
    can_repair_on_site boolean DEFAULT false NOT NULL,
    needs_spare_parts boolean DEFAULT false NOT NULL,
    spare_parts_needed text,
    station_id integer,
    status text DEFAULT 'open'::text NOT NULL,
    admin_notified boolean DEFAULT false NOT NULL,
    repair_id integer,
    estimated_repair_cost numeric(10,2),
    estimated_value_loss numeric(10,2)
);


ALTER TABLE public.damage_reports OWNER TO neondb_owner;

--
-- Name: damage_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.damage_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.damage_reports_id_seq OWNER TO neondb_owner;

--
-- Name: damage_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.damage_reports_id_seq OWNED BY public.damage_reports.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.equipment (
    id integer NOT NULL,
    serial_number text NOT NULL,
    type public.equipment_type NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year_of_purchase integer,
    current_station_id integer,
    status public.equipment_status DEFAULT 'active'::public.equipment_status NOT NULL,
    condition_rating integer DEFAULT 5 NOT NULL,
    last_inspection_date timestamp without time zone,
    notes text,
    purchase_price numeric(10,2),
    current_value numeric(10,2),
    sale_price numeric(10,2),
    type_specific_fields jsonb,
    created_at timestamp without time zone DEFAULT now(),
    sku text,
    invoice_id integer,
    invoice_reference text,
    purchase_date timestamp without time zone,
    price_list_id integer
);


ALTER TABLE public.equipment OWNER TO neondb_owner;

--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equipment_id_seq OWNER TO neondb_owner;

--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    user_id integer NOT NULL,
    page_url text NOT NULL,
    message text,
    audio_url text,
    screenshot_url text,
    status public.feedback_status DEFAULT 'open'::public.feedback_status NOT NULL,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    ticket_number text
);


ALTER TABLE public.feedback OWNER TO neondb_owner;

--
-- Name: feedback_attachments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback_attachments (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    url text NOT NULL,
    type text DEFAULT 'image'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feedback_attachments OWNER TO neondb_owner;

--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_attachments_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_attachments_id_seq OWNED BY public.feedback_attachments.id;


--
-- Name: feedback_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback_comments (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feedback_comments OWNER TO neondb_owner;

--
-- Name: feedback_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_comments_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_comments_id_seq OWNED BY public.feedback_comments.id;


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: inventory_check_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_check_items (
    id integer NOT NULL,
    check_id integer NOT NULL,
    equipment_id integer NOT NULL,
    checked integer DEFAULT 0 NOT NULL,
    condition_rating integer,
    needs_repair integer DEFAULT 0 NOT NULL,
    missing integer DEFAULT 0 NOT NULL,
    notes text,
    checked_at timestamp without time zone,
    checked_by integer,
    photos text[]
);


ALTER TABLE public.inventory_check_items OWNER TO neondb_owner;

--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_check_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_check_items_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_check_items_id_seq OWNED BY public.inventory_check_items.id;


--
-- Name: inventory_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_checks (
    id integer NOT NULL,
    station_id integer NOT NULL,
    started_by integer NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    status public.inventory_check_status DEFAULT 'in_progress'::public.inventory_check_status NOT NULL,
    total_items integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.inventory_checks OWNER TO neondb_owner;

--
-- Name: inventory_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_checks_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_checks_id_seq OWNED BY public.inventory_checks.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    invoice_number text NOT NULL,
    invoice_date text,
    delivery_date text,
    order_number text,
    total_net numeric(10,2),
    total_gross numeric(10,2),
    imported_at timestamp without time zone DEFAULT now(),
    imported_by integer,
    item_count integer
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: photos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    url text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    caption text
);


ALTER TABLE public.photos OWNER TO neondb_owner;

--
-- Name: photos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.photos_id_seq OWNER TO neondb_owner;

--
-- Name: photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.photos_id_seq OWNED BY public.photos.id;


--
-- Name: price_list_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.price_list_items (
    id integer NOT NULL,
    price_list_id integer NOT NULL,
    sku text NOT NULL,
    product_name text NOT NULL,
    retail_price numeric(10,2) NOT NULL,
    dealer_price numeric(10,2),
    product_type text
);


ALTER TABLE public.price_list_items OWNER TO neondb_owner;

--
-- Name: price_list_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.price_list_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_list_items_id_seq OWNER TO neondb_owner;

--
-- Name: price_list_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.price_list_items_id_seq OWNED BY public.price_list_items.id;


--
-- Name: price_lists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.price_lists (
    id integer NOT NULL,
    supplier text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    item_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    uploaded_by integer,
    valid_from timestamp without time zone,
    valid_to timestamp without time zone,
    name text
);


ALTER TABLE public.price_lists OWNER TO neondb_owner;

--
-- Name: price_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.price_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_lists_id_seq OWNER TO neondb_owner;

--
-- Name: price_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.price_lists_id_seq OWNED BY public.price_lists.id;


--
-- Name: repairs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.repairs (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    description text NOT NULL,
    cost numeric(10,2),
    status public.repair_status DEFAULT 'pending'::public.repair_status NOT NULL,
    logged_by integer NOT NULL,
    date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.repairs OWNER TO neondb_owner;

--
-- Name: repairs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.repairs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.repairs_id_seq OWNER TO neondb_owner;

--
-- Name: repairs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.repairs_id_seq OWNED BY public.repairs.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    equipment_id integer,
    "position" integer DEFAULT 1 NOT NULL,
    description text NOT NULL,
    serial_number text,
    sku text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL
);


ALTER TABLE public.sale_items OWNER TO neondb_owner;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO neondb_owner;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    invoice_date text NOT NULL,
    delivery_date text,
    customer_id integer NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text NOT NULL,
    payment_terms text DEFAULT '14 Tage ohne Abzug'::text NOT NULL,
    vat_type text DEFAULT 'standard_19'::text NOT NULL,
    vat_rate numeric(5,2) DEFAULT 19.00 NOT NULL,
    vat_note text,
    notes text,
    total_net numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_vat numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_gross numeric(10,2) DEFAULT 0.00 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    damage_report_id integer,
    pdf_url text,
    customer_type text
);


ALTER TABLE public.sales_invoices OWNER TO neondb_owner;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: school_booking_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_booking_items (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    product_id integer,
    product_name text NOT NULL,
    category text DEFAULT 'Other'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    line_total numeric(10,2) NOT NULL
);


ALTER TABLE public.school_booking_items OWNER TO neondb_owner;

--
-- Name: school_booking_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_booking_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_booking_items_id_seq OWNER TO neondb_owner;

--
-- Name: school_booking_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_booking_items_id_seq OWNED BY public.school_booking_items.id;


--
-- Name: school_bookings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_bookings (
    id integer NOT NULL,
    school_config_id integer NOT NULL,
    booking_number text NOT NULL,
    customer_id integer,
    customer_name text NOT NULL,
    customer_email text,
    payment_status public.booking_payment_status DEFAULT 'unpaid'::public.booking_payment_status NOT NULL,
    total_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    currency character varying(3) DEFAULT 'MAD'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    booking_date text DEFAULT ''::text NOT NULL,
    email_sent_at timestamp without time zone,
    pdf_url text,
    booking_version_bos text
);


ALTER TABLE public.school_bookings OWNER TO neondb_owner;

--
-- Name: school_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_bookings_id_seq OWNER TO neondb_owner;

--
-- Name: school_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_bookings_id_seq OWNED BY public.school_bookings.id;


--
-- Name: school_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_configs (
    id integer NOT NULL,
    station_id integer NOT NULL,
    school_name text NOT NULL,
    currency character varying(3) DEFAULT 'MAD'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    contact_email text,
    created_at timestamp without time zone DEFAULT now(),
    destination_code_bos text
);


ALTER TABLE public.school_configs OWNER TO neondb_owner;

--
-- Name: school_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_configs_id_seq OWNER TO neondb_owner;

--
-- Name: school_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_configs_id_seq OWNED BY public.school_configs.id;


--
-- Name: school_customer_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_customer_documents (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    category public.document_category NOT NULL,
    object_key text NOT NULL,
    file_name text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.school_customer_documents OWNER TO neondb_owner;

--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_customer_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_customer_documents_id_seq OWNER TO neondb_owner;

--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_customer_documents_id_seq OWNED BY public.school_customer_documents.id;


--
-- Name: school_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_customers (
    id integer NOT NULL,
    school_config_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    nationality text NOT NULL,
    date_of_birth text NOT NULL,
    kite_level text NOT NULL,
    weight_kg integer,
    emergency_contact text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    arrival_date text NOT NULL,
    departure_date text NOT NULL,
    created_by integer,
    guest_type text DEFAULT 'Walk-in'::text NOT NULL,
    bos_customer_number text
);


ALTER TABLE public.school_customers OWNER TO neondb_owner;

--
-- Name: school_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_customers_id_seq OWNER TO neondb_owner;

--
-- Name: school_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_customers_id_seq OWNED BY public.school_customers.id;


--
-- Name: school_expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_expenses (
    id integer NOT NULL,
    school_config_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'MAD'::character varying NOT NULL,
    category public.expense_category DEFAULT 'other'::public.expense_category NOT NULL,
    description text,
    expense_date text NOT NULL,
    receipt_url text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.school_expenses OWNER TO neondb_owner;

--
-- Name: school_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_expenses_id_seq OWNER TO neondb_owner;

--
-- Name: school_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_expenses_id_seq OWNED BY public.school_expenses.id;


--
-- Name: school_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_products (
    id integer NOT NULL,
    school_config_id integer NOT NULL,
    name text NOT NULL,
    description text,
    category public.school_product_category NOT NULL,
    default_price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    source public.product_source DEFAULT 'walkin'::public.product_source NOT NULL,
    bos_code text
);


ALTER TABLE public.school_products OWNER TO neondb_owner;

--
-- Name: school_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.school_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_products_id_seq OWNER TO neondb_owner;

--
-- Name: school_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.school_products_id_seq OWNED BY public.school_products.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: stations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stations (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    country text,
    is_virtual boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 99 NOT NULL
);


ALTER TABLE public.stations OWNER TO neondb_owner;

--
-- Name: stations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stations_id_seq OWNER TO neondb_owner;

--
-- Name: stations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stations_id_seq OWNED BY public.stations.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    from_station_id integer NOT NULL,
    to_station_id integer NOT NULL,
    initiated_by integer NOT NULL,
    confirmed_by integer,
    initiated_at timestamp without time zone DEFAULT now(),
    confirmed_at timestamp without time zone,
    status public.transfer_status DEFAULT 'pending'::public.transfer_status NOT NULL,
    arrived_condition integer,
    missing boolean DEFAULT false NOT NULL
);


ALTER TABLE public.transfers OWNER TO neondb_owner;

--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transfers_id_seq OWNER TO neondb_owner;

--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public.user_role DEFAULT 'manager'::public.user_role NOT NULL,
    assigned_station_id integer,
    is_super_admin boolean DEFAULT false NOT NULL,
    can_edit_equipment boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: accessory_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_categories ALTER COLUMN id SET DEFAULT nextval('public.accessory_categories_id_seq'::regclass);


--
-- Name: accessory_check_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_check_items ALTER COLUMN id SET DEFAULT nextval('public.accessory_check_items_id_seq'::regclass);


--
-- Name: accessory_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_checks ALTER COLUMN id SET DEFAULT nextval('public.accessory_checks_id_seq'::regclass);


--
-- Name: accessory_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_inventory ALTER COLUMN id SET DEFAULT nextval('public.accessory_inventory_id_seq'::regclass);


--
-- Name: accessory_loss_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports ALTER COLUMN id SET DEFAULT nextval('public.accessory_loss_reports_id_seq'::regclass);


--
-- Name: accessory_transfers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers ALTER COLUMN id SET DEFAULT nextval('public.accessory_transfers_id_seq'::regclass);


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: cash_register_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cash_register_entries ALTER COLUMN id SET DEFAULT nextval('public.cash_register_entries_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: condition_ratings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.condition_ratings ALTER COLUMN id SET DEFAULT nextval('public.condition_ratings_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: damage_report_photos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_report_photos ALTER COLUMN id SET DEFAULT nextval('public.damage_report_photos_id_seq'::regclass);


--
-- Name: damage_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports ALTER COLUMN id SET DEFAULT nextval('public.damage_reports_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: feedback_attachments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_attachments ALTER COLUMN id SET DEFAULT nextval('public.feedback_attachments_id_seq'::regclass);


--
-- Name: feedback_comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments ALTER COLUMN id SET DEFAULT nextval('public.feedback_comments_id_seq'::regclass);


--
-- Name: inventory_check_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_check_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_check_items_id_seq'::regclass);


--
-- Name: inventory_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_checks ALTER COLUMN id SET DEFAULT nextval('public.inventory_checks_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: photos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.photos ALTER COLUMN id SET DEFAULT nextval('public.photos_id_seq'::regclass);


--
-- Name: price_list_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_list_items ALTER COLUMN id SET DEFAULT nextval('public.price_list_items_id_seq'::regclass);


--
-- Name: price_lists id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_lists ALTER COLUMN id SET DEFAULT nextval('public.price_lists_id_seq'::regclass);


--
-- Name: repairs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.repairs ALTER COLUMN id SET DEFAULT nextval('public.repairs_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: school_booking_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_booking_items ALTER COLUMN id SET DEFAULT nextval('public.school_booking_items_id_seq'::regclass);


--
-- Name: school_bookings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings ALTER COLUMN id SET DEFAULT nextval('public.school_bookings_id_seq'::regclass);


--
-- Name: school_configs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_configs ALTER COLUMN id SET DEFAULT nextval('public.school_configs_id_seq'::regclass);


--
-- Name: school_customer_documents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customer_documents ALTER COLUMN id SET DEFAULT nextval('public.school_customer_documents_id_seq'::regclass);


--
-- Name: school_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customers ALTER COLUMN id SET DEFAULT nextval('public.school_customers_id_seq'::regclass);


--
-- Name: school_expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_expenses ALTER COLUMN id SET DEFAULT nextval('public.school_expenses_id_seq'::regclass);


--
-- Name: school_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_products ALTER COLUMN id SET DEFAULT nextval('public.school_products_id_seq'::regclass);


--
-- Name: stations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stations ALTER COLUMN id SET DEFAULT nextval('public.stations_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	45067a96-c496-4517-9086-a3414c4e71e0	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-02-27 16:59:04.948498+00
2	eb2612cb-2962-4b6e-b5a2-6da76011a353	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	2	2026-03-03 16:37:16.628997+00
3	ca9382ad-dd66-4210-ab19-1086d0eda737	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	3	2026-03-04 09:01:31.388484+00
4	90e9711c-5af8-4f46-bc14-361db4c720b7	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	4	2026-03-10 16:53:21.649464+00
5	716a3695-31c2-4520-a63b-7b3f5bb206ea	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	1	2026-03-10 17:55:07.051049+00
6	9a488771-9f15-473d-9ffa-1450c4a082ef	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	1	2026-03-11 08:32:02.147377+00
7	f0b4beb5-07ed-4291-a949-16c1c430c6f1	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	8	2026-03-13 08:04:10.680075+00
8	beb6d4b5-8131-4acb-9c5b-32ee963ad3f2	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	3	2026-03-13 09:23:29.520387+00
9	60dfe3f6-5a12-4932-aa1c-f008cd2c4e27	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	1	2026-03-13 10:28:15.976397+00
10	3fa3ca4f-13aa-4424-96c7-91de7de26c87	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	4	2026-03-13 23:15:06.490871+00
11	892568b9-54a9-422b-aeea-d59fcc927b2c	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-03-17 09:12:30.643933+00
12	d27a5274-990f-4544-b428-4c1796d3b7e6	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-03-17 10:43:06.946251+00
13	3e194b78-7df7-406e-9187-441af625213f	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	3	2026-03-17 12:17:51.015433+00
14	08c7f677-8ba7-4753-a8a8-ede577296ba8	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	92	2026-03-17 21:44:52.029438+00
15	b9caaeff-05df-4a9d-9359-6c86b1d4dc2d	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	14	2026-03-18 07:48:46.289363+00
16	f0a79127-db09-4726-93d8-a1af4bfd2847	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-03-19 07:48:31.850595+00
17	400ed6a0-fd85-4f2e-9096-2b6e6e4f54a8	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-03-19 10:00:29.76394+00
18	d2691a11-f041-424d-91aa-a75aa74c9c86	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	5	2026-03-19 18:09:06.343572+00
19	f72eb5d1-b93f-45b9-bf1f-f870a6ce43f3	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	7	2026-03-25 11:34:13.548793+00
20	cc2db3b6-03ea-4beb-82b6-308755b3b4bc	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	21	2026-03-25 21:58:56.345093+00
21	56384b49-5efa-4e5f-9ebc-18beec602a28	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	7	2026-03-29 09:38:54.085868+00
22	682ea9b6-4f9f-4c82-9051-8fa3fc119cb1	3ec02ba0-ec57-41c9-8a3d-aefa82f4fb3b	9	2026-03-30 12:17:29.028171+00
\.


--
-- Data for Name: accessory_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_categories (id, name, has_sizes, is_default, sort_order) FROM stdin;
1	Impact Vest	t	t	10
2	Helmet	t	t	20
3	Wetsuit	t	t	30
4	Waist Harness	t	t	40
5	Seat Harness	t	t	41
6	Pump	f	t	50
7	Wetsuit Shorty	t	f	100
\.


--
-- Data for Name: accessory_check_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_check_items (id, check_id, category_id, size, target_quantity, actual_quantity, notes) FROM stdin;
\.


--
-- Data for Name: accessory_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_checks (id, station_id, checked_by, checked_at, total_categories, total_differences) FROM stdin;
\.


--
-- Data for Name: accessory_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_inventory (id, category_id, station_id, size, quantity, updated_at) FROM stdin;
88	4	1	XS	1	2026-03-19 12:04:23.100795
142	1	2	XS	5	2026-04-02 12:44:21.27274
89	4	1	S	3	2026-03-19 12:04:26.128595
92	4	1	M	2	2026-03-19 12:04:34.041764
1	5	4	XS	3	2026-03-17 09:03:44.567841
9	5	4	S	1	2026-03-17 09:04:06.806648
10	5	4	M	1	2026-03-17 09:04:09.786812
11	5	4	XL	1	2026-03-17 09:04:15.804947
132	1	2	S	8	2026-04-02 12:43:56.217146
12	5	4	XXL	4	2026-03-17 09:14:05.474177
16	2	4	XS	1	2026-03-17 10:40:55.798745
94	4	1	L	3	2026-03-19 12:04:38.678015
17	2	4	S	4	2026-03-17 10:40:57.395458
149	1	2	M	8	2026-04-02 12:44:43.332263
21	2	4	M	3	2026-03-17 10:41:04.117536
97	4	1	XL	3	2026-03-19 12:04:45.199104
100	4	1	XXL	1	2026-03-19 12:04:51.189536
237	2	2	XL	3	2026-04-02 12:56:31.941856
101	5	1	XS	3	2026-03-19 12:05:19.188488
30	1	4	XS	3	2026-03-17 10:41:31.430187
33	1	4	S	2	2026-03-17 10:41:36.90334
104	5	1	S	2	2026-03-19 12:05:28.89623
35	1	4	M	3	2026-03-17 10:41:40.455451
38	1	4	L	2	2026-03-17 10:41:45.345238
159	1	2	L	5	2026-04-02 12:45:02.599233
106	5	1	M	3	2026-03-19 12:05:34.090049
40	1	4	XL	6	2026-03-17 10:41:50.888626
166	1	2	XL	3	2026-04-02 12:45:12.748678
109	5	1	L	3	2026-03-19 12:05:39.691931
46	1	4	XXL	4	2026-03-17 10:42:00.160935
50	4	4	M	1	2026-03-17 10:42:19.131393
51	4	4	XL	2	2026-03-17 10:42:22.825416
24	6	4	Einheitsgröße	6	2026-03-17 10:41:14.797814
55	3	1	XS	1	2026-03-19 11:59:06.758566
112	5	1	XL	3	2026-03-19 12:05:45.724079
115	5	1	XXL	1	2026-03-19 12:05:52.100843
68	3	1	XL	4	2026-03-19 12:00:22.351282
63	3	1	M	2	2026-03-19 11:59:23.860459
65	3	1	L	2	2026-03-19 12:00:17.723632
70	3	1	XXL	1	2026-03-19 12:00:26.75719
71	7	1	S	1	2026-03-19 12:00:48.248346
72	7	1	M	1	2026-03-19 12:00:51.946703
73	7	1	L	1	2026-03-19 12:00:53.689159
74	7	1	XL	1	2026-03-19 12:00:55.772926
75	2	1	XS	2	2026-03-19 12:03:29.90877
77	2	1	S	3	2026-03-19 12:03:35.022018
56	3	1	S	3	2026-03-19 11:59:10.581056
81	2	1	M	4	2026-03-19 12:03:45.481439
85	2	1	L	1	2026-03-19 12:03:52.808386
54	6	1	Einheitsgröße	3	2026-03-17 10:42:46.445291
123	6	4	One Size	4	2026-03-27 09:17:05.247579
131	6	1	One Size	2	2026-03-27 09:17:29.764092
178	5	2	XS	10	2026-04-02 12:52:05.328315
198	5	2	S	3	2026-04-02 12:52:57.003541
194	5	2	M	6	2026-04-02 12:52:33.594901
203	5	2	L	4	2026-04-02 12:53:24.039447
207	4	2	XS	2	2026-04-02 12:53:49.608396
209	4	2	S	3	2026-04-02 12:54:00.870043
212	4	2	M	4	2026-04-02 12:54:13.448952
218	4	2	XL	3	2026-04-02 12:54:26.961082
216	4	2	L	5	2026-04-02 12:54:22.516348
225	2	2	XS	3	2026-04-02 12:56:09.874936
228	2	2	S	3	2026-04-02 12:56:15.640241
231	2	2	M	3	2026-04-02 12:56:21.173002
234	2	2	L	3	2026-04-02 12:56:26.610437
\.


--
-- Data for Name: accessory_loss_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_loss_reports (id, category_id, station_id, size, quantity, reason, reported_by, reported_at, status, resolved_by, resolved_at, admin_note) FROM stdin;
\.


--
-- Data for Name: accessory_transfers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accessory_transfers (id, category_id, size, quantity, from_station_id, to_station_id, transferred_by, transferred_at) FROM stdin;
1	6	Einheitsgröße	1	4	1	5	2026-03-17 10:42:46.445291
2	6	One Size	2	4	1	5	2026-03-27 09:17:29.764092
\.


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_log (id, user_id, action, equipment_id, details, "timestamp") FROM stdin;
1	1	user_login	\N	Admin logged in	2026-02-27 16:38:59.421133
2	1	user_login	\N	Admin logged in	2026-02-27 16:48:26.306094
3	1	user_login	\N	York logged in	2026-02-27 17:00:07.549992
4	1	user_login	\N	York logged in	2026-02-27 17:00:25.793212
5	1	user_login	\N	York logged in	2026-02-27 17:03:46.233157
6	1	user_login	\N	York logged in	2026-02-28 07:43:32.964637
7	1	user_created	\N	Created user: philipp@kiteworldwide.com	2026-03-03 16:11:14.368539
8	4	user_login	\N	Philipp Sensen logged in	2026-03-03 16:16:49.01038
9	1	user_login	\N	York logged in	2026-03-03 16:41:11.492163
10	1	user_login	\N	York logged in	2026-03-03 16:42:44.481317
12	1	user_login	\N	York logged in	2026-03-03 22:00:39.570412
13	1	user_login	\N	York logged in	2026-03-04 07:20:10.472954
14	1	user_login	\N	York logged in	2026-03-04 07:31:43.401468
15	1	user_created	\N	Created user: timo@kiteworldwide.com	2026-03-04 07:36:35.551507
16	1	user_created	\N	Created user: kiki@kiteworldwide.com	2026-03-04 07:38:27.351145
17	5	user_login	\N	Timo Erdmann logged in	2026-03-04 07:40:50.071298
18	1	user_login	\N	York logged in	2026-03-04 07:43:05.702492
19	4	user_login	\N	Philipp Sensen logged in	2026-03-04 08:01:47.887919
20	5	sale_created	\N	Created sale invoice Inv-KWS-2026-1001	2026-03-04 08:55:40.885006
21	5	sale_confirmed	\N	Confirmed sale invoice Inv-KWS-2026-1001	2026-03-04 08:56:17.229574
22	5	user_login	\N	Timo Erdmann logged in	2026-03-04 09:46:46.537952
25	5	user_login	\N	Timo Erdmann logged in	2026-03-05 10:38:34.128818
30	5	user_login	\N	Timo Erdmann logged in	2026-03-06 08:42:01.234246
32	1	equipment_bulk_deleted	\N	Bulk deleted 28 equipment items (IDs: 18, 5, 29, 27, 26, 25, 24, 23, 22, 21, 20, 19, 17, 4, 10, 9, 8, 6, 2, 1, 16, 12, 14, 15, 13, 11, 7, 3)	2026-03-10 17:20:47.733227
33	1	equipment_bulk_deleted	\N	Bulk deleted 2 equipment items (IDs: 7, 3)	2026-03-10 17:21:01.522701
34	1	invoice_import	\N	Imported invoice 137742 from Eleveight (8 items)	2026-03-11 07:54:59.847323
35	1	invoice_import	\N	Imported invoice 135193 from Eleveight (38 items)	2026-03-11 07:55:47.631285
36	1	invoice_import	\N	Imported invoice 134725 from Eleveight (47 items)	2026-03-11 07:56:18.182612
37	5	user_created	\N	Created user: marketing@kiteworldwide.com	2026-03-11 10:56:14.9718
38	7	user_login	\N	TEST Kitecenter Manager logged in	2026-03-11 10:57:32.406003
39	5	user_login	\N	Timo Erdmann logged in	2026-03-11 11:01:03.517678
40	1	feedback_submitted	\N	Feedback submitted from /	2026-03-11 11:15:44.002843
41	5	transfer_initiated	134	Transfer initiated from station null to 4	2026-03-12 08:34:24.37821
42	5	transfer_confirmed	134	Transfer received · condition 4/5	2026-03-12 08:36:55.111783
43	5	equipment_created	462	Added Core XR6 (KXR606BBA9126597)	2026-03-12 08:47:52.458369
44	5	condition_rated	462	Rated condition: 3/5	2026-03-12 08:48:55.025936
45	5	equipment_created	463	Added Core XR6 (KXR605BBA9122397)	2026-03-12 08:58:40.496485
46	5	transfer_initiated	414	Transfer initiated from station null to 4	2026-03-12 10:55:57.433991
47	5	transfer_initiated	437	Transfer initiated from station null to 4	2026-03-12 10:56:26.671847
48	5	transfer_initiated	415	Transfer initiated from station null to 4	2026-03-12 10:56:38.089859
49	5	transfer_initiated	235	Transfer initiated from station null to 4	2026-03-12 10:57:05.448883
50	5	transfer_initiated	418	Transfer initiated from station null to 4	2026-03-12 10:57:29.391343
51	5	transfer_initiated	438	Transfer initiated from station null to 4	2026-03-12 10:57:41.978181
52	5	transfer_initiated	421	Transfer initiated from station null to 4	2026-03-12 10:57:53.272162
53	5	transfer_initiated	416	Transfer initiated from station null to 4	2026-03-12 10:58:13.737741
54	5	transfer_initiated	439	Transfer initiated from station null to 4	2026-03-12 10:58:26.05928
55	5	transfer_initiated	422	Transfer initiated from station null to 4	2026-03-12 10:58:36.683758
56	5	transfer_initiated	419	Transfer initiated from station null to 4	2026-03-12 10:58:48.350914
57	5	equipment_created	464	Added Fanatic Skywing (SNYFA2211ST63001474)	2026-03-12 11:06:15.578345
58	5	feedback_submitted	\N	Feedback submitted from /equipment/464	2026-03-12 11:08:45.164817
59	5	equipment_created	465	Added Kold Polar II (11373000054)	2026-03-12 11:11:05.762208
60	5	equipment_created	466	Added Kola Horizont (61383000007)	2026-03-12 11:11:54.740021
61	5	condition_rated	425	Rated condition: 4/5	2026-03-12 11:13:29.808194
62	5	transfer_initiated	425	Transfer initiated from station null to 4	2026-03-12 11:13:39.431265
63	5	condition_rated	401	Rated condition: 3/5	2026-03-12 11:21:46.712515
64	5	transfer_initiated	401	Transfer initiated from station null to 4	2026-03-12 11:21:51.575117
65	5	condition_rated	397	Rated condition: 3/5	2026-03-12 11:22:46.598969
66	5	transfer_initiated	397	Transfer initiated from station null to 4	2026-03-12 11:22:51.227953
67	5	condition_rated	272	Rated condition: 3/5	2026-03-12 11:23:42.247773
68	5	transfer_initiated	272	Transfer initiated from station null to 4	2026-03-12 11:23:47.955988
69	5	condition_rated	321	Rated condition: 3/5	2026-03-12 11:24:47.855471
70	5	transfer_initiated	321	Transfer initiated from station null to 4	2026-03-12 11:24:55.968218
71	5	feedback_submitted	\N	Feedback submitted from /users	2026-03-12 11:26:54.806306
72	5	transfer_confirmed	321	Transfer received · condition 3/5	2026-03-12 11:28:09.441852
73	5	transfer_confirmed	272	Transfer received · condition 3/5	2026-03-12 11:28:20.518889
74	5	transfer_confirmed	397	Transfer received · condition 3/5	2026-03-12 11:28:26.423788
75	5	transfer_confirmed	401	Transfer received · condition 3/5	2026-03-12 11:28:30.223324
76	5	condition_rated	353	Rated condition: 4/5	2026-03-12 11:35:26.206127
77	5	transfer_initiated	353	Transfer initiated from station null to 4	2026-03-12 11:35:32.279292
78	5	transfer_confirmed	353	Transfer received · condition 4/5	2026-03-12 11:35:46.708735
79	5	transfer_confirmed	425	Transfer received · condition 5/5	2026-03-12 11:36:28.985309
80	5	transfer_confirmed	419	Transfer received · condition 5/5	2026-03-12 11:36:32.283188
81	5	transfer_confirmed	422	Transfer received · condition 5/5	2026-03-12 11:36:35.759661
82	5	transfer_confirmed	439	Transfer received · condition 5/5	2026-03-12 11:36:40.594887
83	5	transfer_confirmed	416	Transfer received · condition 5/5	2026-03-12 11:36:43.881852
84	5	transfer_confirmed	421	Transfer received · condition 5/5	2026-03-12 11:36:48.267099
85	5	transfer_confirmed	438	Transfer received · condition 5/5	2026-03-12 11:36:51.933615
86	5	transfer_confirmed	418	Transfer received · condition 5/5	2026-03-12 11:36:55.448219
87	5	transfer_confirmed	235	Transfer received · condition 5/5	2026-03-12 11:36:58.534041
88	5	transfer_confirmed	415	Transfer received · condition 5/5	2026-03-12 11:37:01.650366
90	5	transfer_confirmed	414	Transfer received · condition 5/5	2026-03-12 11:37:09.120862
89	5	transfer_confirmed	437	Transfer received · condition 5/5	2026-03-12 11:37:06.216644
91	5	condition_rated	140	Rated condition: 4/5	2026-03-12 11:45:42.476927
92	5	transfer_initiated	140	Transfer initiated from station null to 4	2026-03-12 11:45:49.133268
93	5	transfer_confirmed	140	Transfer received · condition 4/5	2026-03-12 11:45:54.47048
94	5	condition_rated	243	Rated condition: 3/5	2026-03-12 11:47:48.524359
95	5	transfer_initiated	243	Transfer initiated from station null to 4	2026-03-12 11:48:33.092039
96	5	transfer_confirmed	243	Transfer received · condition 3/5	2026-03-12 11:48:38.000766
97	5	condition_rated	425	Rated condition: 4/5	2026-03-12 11:49:27.163055
98	5	condition_rated	395	Rated condition: 4/5	2026-03-12 11:50:45.118216
99	5	transfer_initiated	395	Transfer initiated from station null to 4	2026-03-12 11:50:51.362504
100	5	transfer_confirmed	395	Transfer received · condition 4/5	2026-03-12 11:50:55.570918
101	5	condition_rated	375	Rated condition: 3/5	2026-03-12 11:54:04.925585
102	5	transfer_initiated	375	Transfer initiated from station null to 4	2026-03-12 11:54:10.456479
103	5	transfer_confirmed	375	Transfer received · condition 3/5	2026-03-12 11:54:16.174828
104	5	condition_rated	372	Rated condition: 4/5	2026-03-12 13:12:54.690706
105	5	transfer_initiated	372	Transfer initiated from station null to 4	2026-03-12 13:13:13.175761
106	5	transfer_confirmed	372	Transfer received · condition 4/5	2026-03-12 13:13:17.639848
107	5	condition_rated	72	Rated condition: 3/5	2026-03-12 13:17:48.464519
108	5	transfer_initiated	72	Transfer initiated from station null to 4	2026-03-12 13:17:52.785507
109	5	transfer_confirmed	72	Transfer received · condition 3/5	2026-03-12 13:17:59.055895
110	5	condition_rated	360	Rated condition: 4/5	2026-03-12 13:20:58.537128
111	5	equipment_created	467	Added Core Nexus 2 (KNX215WBA1104748)	2026-03-12 13:29:57.003148
112	5	condition_rated	71	Rated condition: 4/5	2026-03-12 13:38:30.844306
113	5	transfer_initiated	71	Transfer initiated from station null to 4	2026-03-12 13:38:35.757003
114	5	transfer_confirmed	71	Transfer received · condition 4/5	2026-03-12 13:39:55.1631
115	5	equipment_created	468	Added Flysurfer Viron (FKVI30S08-4618-58598)	2026-03-12 13:46:34.550084
116	5	equipment_created	469	Added Flysurfer Viron (FKVI30S04-4618-58556)	2026-03-12 13:47:18.48084
117	5	equipment_created	470	Added Flysurfer Viron (FKVI30S04-4618-58557)	2026-03-12 13:48:15.78168
118	5	equipment_created	471	Added Flysurfer Viron (FKVI30S06-4618-58588)	2026-03-12 13:50:30.420372
119	5	equipment_created	472	Added Flysurfer Viron (FKVI30S06-4618-58583)	2026-03-12 13:51:27.500076
120	5	condition_rated	428	Rated condition: 4/5	2026-03-12 13:53:30.754826
121	5	transfer_initiated	428	Transfer initiated from station null to 4	2026-03-12 13:53:38.29682
122	5	transfer_confirmed	428	Transfer received · condition 4/5	2026-03-12 13:53:44.090343
123	5	condition_rated	420	Rated condition: 4/5	2026-03-12 13:54:37.54191
124	5	transfer_initiated	420	Transfer initiated from station null to 4	2026-03-12 13:54:42.188995
125	5	transfer_confirmed	420	Transfer received · condition 4/5	2026-03-12 13:54:47.201889
126	5	condition_rated	240	Rated condition: 3/5	2026-03-12 13:55:17.178449
127	5	transfer_initiated	240	Transfer initiated from station null to 4	2026-03-12 13:55:23.688674
128	5	transfer_confirmed	240	Transfer received · condition 3/5	2026-03-12 13:55:33.986566
129	5	condition_rated	241	Rated condition: 3/5	2026-03-12 13:57:13.65632
130	5	transfer_initiated	241	Transfer initiated from station null to 4	2026-03-12 13:57:19.21888
131	5	transfer_confirmed	241	Transfer received · condition 3/5	2026-03-12 13:57:27.480404
132	5	equipment_created	473	Added Kold Polar II (21403000035)	2026-03-12 13:58:17.162982
133	5	condition_rated	449	Rated condition: 4/5	2026-03-12 13:59:31.008406
134	5	transfer_initiated	449	Transfer initiated from station null to 4	2026-03-12 13:59:35.443364
135	5	equipment_created	474	Added Core Deluxe (1491706023)	2026-03-12 14:01:39.473249
136	5	equipment_created	475	Added Crazyfly Allround (78602992)	2026-03-12 14:05:47.684524
137	5	equipment_created	476	Added Crazyfly Allround (78604992)	2026-03-12 14:06:17.893643
138	5	equipment_created	477	Added Flysurfer  Viron (FKVI30S06-4618-58577)	2026-03-12 14:22:16.149582
139	5	equipment_created	478	Added Fanatic Skyair Wingboard Komplett mit Foilset (SNFA23SAP610-WH-H20143)	2026-03-12 14:57:36.244513
140	6	user_login	\N	Kiki Chouman logged in	2026-03-12 15:05:05.860354
141	5	feedback_submitted	\N	Feedback submitted from /invoice-import	2026-03-12 15:05:27.219134
142	5	feedback_submitted	\N	Feedback submitted from /invoice-import	2026-03-12 15:07:23.604418
143	5	invoice_import	\N	Imported invoice RE/2026/01118 from Core (8 items)	2026-03-12 15:08:11.112809
144	5	transfer_confirmed	449	Transfer received · condition 4/5	2026-03-12 15:10:53.466221
145	5	transfer_initiated	479	Transfer initiated from station null to 1	2026-03-12 15:13:56.766291
146	5	feedback_submitted	\N	Feedback submitted from /equipment	2026-03-12 15:15:28.785772
147	5	transfer_initiated	480	Transfer initiated from station null to 1	2026-03-12 15:15:37.365037
148	5	transfer_initiated	481	Transfer initiated from station null to 1	2026-03-12 15:15:46.468298
149	5	transfer_initiated	482	Transfer initiated from station null to 1	2026-03-12 15:15:54.884547
150	5	transfer_initiated	483	Transfer initiated from station null to 1	2026-03-12 15:16:06.892647
151	5	transfer_initiated	484	Transfer initiated from station null to 1	2026-03-12 15:16:16.290769
152	5	transfer_initiated	485	Transfer initiated from station null to 1	2026-03-12 15:16:25.713686
153	5	transfer_initiated	486	Transfer initiated from station null to 1	2026-03-12 15:16:36.807642
154	5	condition_rated	152	Rated condition: 2/5	2026-03-12 15:23:34.891813
155	5	transfer_initiated	152	Transfer initiated from station null to 1	2026-03-12 15:23:40.341593
156	5	user_updated	\N	Updated user: marketing@kiteworldwide.com	2026-03-12 15:27:10.178927
157	7	user_login	\N	TEST Kitecenter Manager logged in	2026-03-12 15:27:25.201219
158	5	user_updated	\N	Updated user: marketing@kiteworldwide.com	2026-03-12 15:27:48.255445
159	5	transfer_initiated	360	Transfer initiated from station null to 4	2026-03-12 15:49:55.274244
160	5	transfer_confirmed	360	Transfer received · condition 4/5	2026-03-12 15:50:10.891668
161	5	feedback_submitted	\N	Feedback submitted from /equipment	2026-03-12 15:50:46.268473
162	5	feedback_submitted	\N	Feedback submitted from /equipment/new	2026-03-12 15:53:07.426973
163	5	feedback_submitted	\N	Feedback submitted from /equipment/new	2026-03-12 15:55:13.109499
164	5	feedback_submitted	\N	Feedback submitted from /settings	2026-03-13 07:30:05.022031
165	1	user_deleted	\N	Deleted user: manager1@kitetracker.com	2026-03-13 08:33:50.117225
166	1	feedback_updated	\N	Feedback #7 status → in_progress	2026-03-13 09:03:53.960976
167	1	user_updated	\N	Updated user: timo@kiteworldwide.com	2026-03-13 09:25:19.011669
168	1	feedback_updated	\N	Feedback #3 status → in_progress	2026-03-13 09:25:55.009229
169	1	feedback_updated	\N	Feedback #6 status → resolved	2026-03-13 09:28:52.369032
170	1	feedback_updated	\N	Feedback #4 status → resolved	2026-03-13 09:31:28.918705
171	5	equipment_updated	466	Updated Kold Horizont	2026-03-13 10:00:35.431558
172	1	feedback_updated	\N	Feedback #3 status → resolved	2026-03-13 10:09:54.822581
173	1	feedback_updated	\N	Feedback #1 status → resolved	2026-03-13 10:10:06.114588
174	5	feedback_submitted	\N	Feedback submitted from /feedback	2026-03-13 10:17:37.342488
175	5	transfer_initiated	37	Bulk transfer initiated to station 1	2026-03-13 10:21:13.917681
176	5	transfer_initiated	36	Bulk transfer initiated to station 1	2026-03-13 10:21:14.082506
177	5	transfer_initiated	35	Bulk transfer initiated to station 1	2026-03-13 10:21:14.246753
178	5	equipment_updated	363	Updated Core GTS6	2026-03-13 10:48:28.064766
179	5	equipment_updated	362	Updated Core GTS6	2026-03-13 10:48:54.824684
180	5	equipment_updated	100	Updated Core GTS6	2026-03-13 10:49:38.41109
181	5	equipment_updated	99	Updated Core GTS6	2026-03-13 10:49:59.08502
182	5	equipment_updated	361	Updated Core GTS6	2026-03-13 10:50:16.951294
183	5	equipment_updated	360	Updated Core GTS6	2026-03-13 10:50:34.518478
184	5	equipment_updated	359	Updated Core GTS6	2026-03-13 10:50:46.593577
185	5	equipment_updated	358	Updated Core GTS6	2026-03-13 10:50:58.874855
186	5	equipment_updated	357	Updated Core GTS6	2026-03-13 10:51:11.584295
187	5	equipment_updated	356	Updated Core GTS6	2026-03-13 10:51:23.808453
188	5	equipment_updated	355	Updated Core GTS6	2026-03-13 10:51:34.720869
189	5	equipment_updated	354	Updated Core GTS6	2026-03-13 10:51:46.290959
190	5	equipment_updated	353	Updated Core GTS6	2026-03-13 10:51:58.033415
191	5	equipment_updated	352	Updated Core GTS6	2026-03-13 10:52:12.200557
192	5	equipment_updated	351	Updated Core GTS6	2026-03-13 10:52:24.30274
193	5	equipment_updated	350	Updated Core GTS6	2026-03-13 10:52:37.186628
194	5	equipment_updated	349	Updated Core GTS6	2026-03-13 10:52:49.301489
195	5	equipment_updated	348	Updated Core GTS6	2026-03-13 10:53:01.151882
196	5	equipment_updated	347	Updated Core GTS6	2026-03-13 10:53:16.530348
197	5	equipment_updated	346	Updated Core GTS6	2026-03-13 10:53:29.563659
198	5	equipment_updated	345	Updated Core GTS6	2026-03-13 10:53:40.999386
199	5	equipment_updated	344	Updated Core GTS6	2026-03-13 10:53:53.708879
200	5	equipment_updated	343	Updated Core GTS6	2026-03-13 10:54:04.756094
201	5	equipment_updated	342	Updated Core GTS6	2026-03-13 10:54:16.126768
202	5	equipment_updated	341	Updated Core GTS6	2026-03-13 10:54:29.061297
203	5	equipment_updated	340	Updated Core GTS6	2026-03-13 10:54:40.769608
204	5	equipment_updated	339	Updated Core GTS6	2026-03-13 10:54:51.273676
205	5	equipment_updated	338	Updated Core GTS6	2026-03-13 10:55:07.803084
206	5	equipment_updated	337	Updated Core GTS6	2026-03-13 10:55:18.229621
207	5	equipment_updated	336	Updated Core GTS6	2026-03-13 10:55:28.722276
208	5	equipment_updated	335	Updated Core GTS6	2026-03-13 10:55:39.230283
209	5	equipment_updated	334	Updated Core GTS6	2026-03-13 10:55:50.053774
210	5	equipment_updated	333	Updated Core GTS6	2026-03-13 10:56:05.183956
211	5	equipment_updated	332	Updated Core GTS6	2026-03-13 10:56:16.196368
212	1	feedback_updated	\N	Feedback #9 status → resolved	2026-03-17 08:51:08.135817
213	1	feedback_updated	\N	Feedback #8 status → resolved	2026-03-17 08:51:15.964356
214	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 09:03:44.709834
215	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 09:03:48.058382
216	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 09:03:52.77219
217	5	accessory_quantity_changed	\N	Seat Harness (S) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 09:04:06.950751
218	5	accessory_quantity_changed	\N	Seat Harness (M) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 09:04:09.924545
219	5	accessory_quantity_changed	\N	Seat Harness (XL) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 09:04:15.935996
220	5	accessory_quantity_changed	\N	Seat Harness (XXL) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 09:14:05.614266
221	5	accessory_quantity_changed	\N	Seat Harness (XXL) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 09:14:07.688553
222	5	accessory_quantity_changed	\N	Seat Harness (XXL) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 09:14:09.846934
223	5	accessory_quantity_changed	\N	Seat Harness (XXL) @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-17 09:14:11.354639
224	5	accessory_quantity_changed	\N	Helmet (XS) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:40:55.943095
225	5	accessory_quantity_changed	\N	Helmet (S) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:40:57.527677
226	5	accessory_quantity_changed	\N	Helmet (S) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:40:59.49121
227	5	accessory_quantity_changed	\N	Helmet (S) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:00.973558
228	5	accessory_quantity_changed	\N	Helmet (S) @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-17 10:41:02.432607
229	5	accessory_quantity_changed	\N	Helmet (M) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:04.257643
230	5	accessory_quantity_changed	\N	Helmet (M) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:05.606523
231	5	accessory_quantity_changed	\N	Helmet (M) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:07.142332
232	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:14.929806
233	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:17.111911
234	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:18.415926
235	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-17 10:41:19.80502
236	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 4 → 5 (+1)	2026-03-17 10:41:21.354593
237	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 5 → 6 (+1)	2026-03-17 10:41:22.875757
238	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:31.56287
239	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:33.052334
240	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:34.311958
241	5	accessory_quantity_changed	\N	Impact Vest (S) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:37.036166
242	5	accessory_quantity_changed	\N	Impact Vest (S) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:38.435813
243	5	accessory_quantity_changed	\N	Impact Vest (M) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:40.587193
244	5	accessory_quantity_changed	\N	Impact Vest (M) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:42.047749
245	5	accessory_quantity_changed	\N	Impact Vest (M) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:43.546949
246	5	accessory_quantity_changed	\N	Impact Vest (L) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:45.477308
247	5	accessory_quantity_changed	\N	Impact Vest (L) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:46.988064
248	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:41:51.020074
249	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:41:52.426554
250	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:41:54.178006
251	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-17 10:41:55.667097
252	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 4 → 5 (+1)	2026-03-17 10:41:57.226777
253	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Office Hamburg Warehouse: 5 → 6 (+1)	2026-03-17 10:41:58.672793
254	5	accessory_quantity_changed	\N	Impact Vest (XXL) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:42:00.292297
255	5	accessory_quantity_changed	\N	Impact Vest (XXL) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:42:01.832002
256	5	accessory_quantity_changed	\N	Impact Vest (XXL) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-17 10:42:03.290928
257	5	accessory_quantity_changed	\N	Impact Vest (XXL) @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-17 10:42:04.634401
258	5	accessory_quantity_changed	\N	Waist Harness (M) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:42:19.271172
259	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-17 10:42:22.959707
260	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-17 10:42:24.44123
261	5	accessory_quantity_changed	\N	Pump @ Office Hamburg Warehouse: 6 → 7 (+1)	2026-03-17 10:42:36.533026
262	5	accessory_transferred	\N	Pump ×1: Office Hamburg Warehouse → Dakhla	2026-03-17 10:42:46.84513
263	5	user_login	\N	Timo Erdmann logged in	2026-03-17 10:51:27.53641
264	5	equipment_csv_import	\N	CSV import: 7 imported, 44 skipped, 0 errors	2026-03-17 12:42:13.407206
265	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-17 13:12:12.751046
273	5	transfer_cancelled	\N	Cancelled transfer #71	2026-03-17 13:15:49.38935
274	5	transfer_cancelled	\N	Cancelled transfer #71	2026-03-17 13:15:50.09268
275	5	transfer_cancelled	\N	Cancelled transfer #70	2026-03-17 13:15:54.690754
276	5	transfer_cancelled	\N	Cancelled transfer #69	2026-03-17 13:15:58.637846
277	5	transfer_cancelled	\N	Cancelled transfer #68	2026-03-17 13:16:05.164496
278	5	transfer_cancelled	\N	Cancelled transfer #67	2026-03-17 13:16:09.177456
279	5	transfer_cancelled	\N	Cancelled transfer #66	2026-03-17 13:16:11.885843
280	5	transfer_cancelled	\N	Cancelled transfer #65	2026-03-17 13:16:14.559536
281	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-18 07:21:42.305344
282	1	inventory_check_started	\N	Started inventory check at Dakhla (7 items)	2026-03-18 07:54:53.504505
283	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-18 07:58:51.471741
284	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-18 07:59:39.26349
285	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-18 08:01:38.815959
286	5	equipment_csv_import	\N	CSV import: 0 imported, 51 skipped, 0 errors	2026-03-18 08:04:21.520311
301	5	condition_rated	38	Rated condition: 2/5	2026-03-18 08:27:09.180591
302	5	transfer_initiated	38	Transfer initiated from station null to 1	2026-03-18 08:27:15.791065
304	5	condition_rated	366	Rated condition: 2/5	2026-03-18 08:28:42.029503
305	5	transfer_initiated	366	Transfer initiated from station null to 1	2026-03-18 08:28:46.094148
306	5	condition_rated	367	Rated condition: 2/5	2026-03-18 08:29:07.095513
307	5	transfer_initiated	367	Transfer initiated from station null to 1	2026-03-18 08:29:17.422249
308	5	condition_rated	114	Rated condition: 2/5	2026-03-18 08:29:31.509686
309	5	transfer_initiated	114	Transfer initiated from station null to 1	2026-03-18 08:29:35.518119
310	5	condition_rated	42	Rated condition: 2/5	2026-03-18 08:29:48.671819
311	5	transfer_initiated	42	Transfer initiated from station null to 1	2026-03-18 08:29:54.888286
312	5	condition_rated	337	Rated condition: 1/5	2026-03-18 08:30:20.995831
313	5	transfer_initiated	337	Transfer initiated from station null to 1	2026-03-18 08:30:29.755006
314	5	condition_rated	341	Rated condition: 2/5	2026-03-18 08:31:34.376113
315	5	transfer_initiated	341	Transfer initiated from station null to 1	2026-03-18 08:31:41.821936
316	5	condition_rated	53	Rated condition: 3/5	2026-03-18 08:32:11.47877
317	5	transfer_initiated	53	Transfer initiated from station null to 1	2026-03-18 08:32:16.699579
318	5	condition_rated	344	Rated condition: 1/5	2026-03-18 08:32:37.923242
319	5	transfer_initiated	344	Transfer initiated from station null to 1	2026-03-18 08:32:42.088499
322	5	condition_rated	120	Rated condition: 2/5	2026-03-18 08:33:48.280265
323	5	transfer_initiated	120	Transfer initiated from station null to 1	2026-03-18 08:33:52.296844
324	5	condition_rated	81	Rated condition: 2/5	2026-03-18 08:34:19.21696
325	5	transfer_initiated	81	Transfer initiated from station null to 1	2026-03-18 08:34:24.982406
326	5	condition_rated	379	Rated condition: 4/5	2026-03-18 08:34:39.735776
327	5	transfer_initiated	379	Transfer initiated from station null to 1	2026-03-18 08:34:43.502854
328	5	condition_rated	390	Rated condition: 4/5	2026-03-18 08:34:55.050099
329	5	transfer_initiated	390	Transfer initiated from station null to 1	2026-03-18 08:34:58.709099
330	5	condition_rated	377	Rated condition: 4/5	2026-03-18 08:35:10.021954
331	5	transfer_initiated	377	Transfer initiated from station null to 1	2026-03-18 08:35:13.581637
332	5	condition_rated	348	Rated condition: 3/5	2026-03-18 08:35:31.994637
333	5	transfer_initiated	348	Transfer initiated from station null to 1	2026-03-18 08:35:36.625898
334	5	condition_rated	350	Rated condition: 3/5	2026-03-18 08:35:47.082752
335	5	condition_rated	350	Rated condition: 3/5	2026-03-18 08:36:02.672565
336	5	transfer_initiated	350	Transfer initiated from station null to 1	2026-03-18 08:36:09.645739
337	5	condition_rated	351	Rated condition: 3/5	2026-03-18 08:36:27.585985
338	5	condition_rated	373	Rated condition: 4/5	2026-03-18 08:36:46.345614
339	5	condition_rated	89	Rated condition: 1/5	2026-03-18 08:37:23.677712
340	5	condition_rated	89	Rated condition: 1/5	2026-03-18 08:37:42.464754
341	5	transfer_initiated	89	Transfer initiated from station null to 1	2026-03-18 08:37:47.714624
342	5	condition_rated	87	Rated condition: 4/5	2026-03-18 08:38:05.261204
343	5	transfer_initiated	87	Transfer initiated from station null to 1	2026-03-18 08:38:08.921099
344	5	condition_rated	41	Rated condition: 4/5	2026-03-18 08:38:22.902821
345	5	transfer_initiated	41	Transfer initiated from station null to 1	2026-03-18 08:38:26.507121
346	5	condition_rated	77	Rated condition: 4/5	2026-03-18 08:39:50.095815
347	5	transfer_initiated	77	Transfer initiated from station null to 1	2026-03-18 08:39:55.537375
348	5	condition_rated	76	Rated condition: 3/5	2026-03-18 08:40:47.275125
349	5	condition_rated	76	Rated condition: 3/5	2026-03-18 08:40:55.138343
350	5	transfer_initiated	76	Transfer initiated from station null to 1	2026-03-18 08:41:03.382326
351	5	condition_rated	128	Rated condition: 4/5	2026-03-18 08:41:27.407546
352	5	transfer_initiated	128	Transfer initiated from station null to 1	2026-03-18 08:41:31.154273
353	5	condition_rated	356	Rated condition: 3/5	2026-03-18 08:41:44.173165
354	5	transfer_initiated	356	Transfer initiated from station null to 1	2026-03-18 08:41:50.207587
355	5	condition_rated	359	Rated condition: 1/5	2026-03-18 08:54:28.188136
356	5	transfer_initiated	359	Transfer initiated from station null to 1	2026-03-18 08:54:33.323539
357	5	condition_rated	355	Rated condition: 2/5	2026-03-18 08:54:53.720238
358	5	transfer_initiated	355	Transfer initiated from station null to 1	2026-03-18 08:54:57.441859
359	5	condition_rated	357	Rated condition: 3/5	2026-03-18 08:55:15.229817
360	5	transfer_initiated	357	Transfer initiated from station null to 1	2026-03-18 08:55:19.129853
361	5	condition_rated	97	Rated condition: 4/5	2026-03-18 08:55:32.352608
362	5	transfer_initiated	97	Transfer initiated from station null to 1	2026-03-18 08:55:36.061537
363	5	condition_rated	374	Rated condition: 4/5	2026-03-18 08:55:47.090514
364	5	transfer_initiated	374	Transfer initiated from station null to 1	2026-03-18 08:55:51.674316
365	5	condition_rated	371	Rated condition: 4/5	2026-03-18 08:56:02.402212
366	5	transfer_initiated	371	Transfer initiated from station null to 1	2026-03-18 08:56:06.307976
367	5	condition_rated	369	Rated condition: 4/5	2026-03-18 08:56:17.969515
368	5	transfer_initiated	369	Transfer initiated from station null to 1	2026-03-18 08:56:21.075941
369	5	condition_rated	40	Rated condition: 4/5	2026-03-18 08:56:35.523007
370	5	transfer_initiated	40	Transfer initiated from station null to 1	2026-03-18 08:56:39.416382
371	5	condition_rated	141	Rated condition: 3/5	2026-03-18 08:57:00.82301
372	5	transfer_initiated	141	Transfer initiated from station null to 1	2026-03-18 08:57:04.829896
375	5	condition_rated	147	Rated condition: 4/5	2026-03-18 08:57:49.099481
376	5	transfer_initiated	147	Transfer initiated from station null to 1	2026-03-18 08:57:53.60194
381	5	condition_rated	382	Rated condition: 4/5	2026-03-18 09:06:30.620169
382	5	transfer_initiated	382	Transfer initiated from station null to 1	2026-03-18 09:06:34.424474
383	5	condition_rated	392	Rated condition: 4/5	2026-03-18 09:06:58.921096
384	5	transfer_initiated	392	Transfer initiated from station null to 1	2026-03-18 09:07:02.170144
385	5	condition_rated	393	Rated condition: 4/5	2026-03-18 09:07:16.536104
386	5	transfer_initiated	393	Transfer initiated from station null to 1	2026-03-18 09:07:19.945971
387	5	condition_rated	49	Rated condition: 3/5	2026-03-18 09:07:36.663478
388	5	transfer_initiated	49	Transfer initiated from station null to 1	2026-03-18 09:07:40.818113
389	5	condition_rated	51	Rated condition: 4/5	2026-03-18 09:07:53.753469
390	5	transfer_initiated	51	Transfer initiated from station null to 1	2026-03-18 09:07:57.822164
391	5	condition_rated	48	Rated condition: 4/5	2026-03-18 09:08:10.72282
392	5	transfer_initiated	48	Transfer initiated from station null to 1	2026-03-18 09:08:14.173652
393	5	condition_rated	52	Rated condition: 3/5	2026-03-18 09:08:26.571987
394	5	transfer_initiated	52	Transfer initiated from station null to 1	2026-03-18 09:08:30.619635
395	5	condition_rated	50	Rated condition: 4/5	2026-03-18 09:08:43.680857
396	5	transfer_initiated	50	Transfer initiated from station null to 1	2026-03-18 09:08:47.293833
400	5	condition_rated	30	Rated condition: 4/5	2026-03-18 09:09:39.007646
401	5	transfer_initiated	30	Transfer initiated from station null to 1	2026-03-18 09:09:43.654752
402	5	user_login	\N	Timo Erdmann logged in	2026-03-18 09:10:02.167904
403	5	condition_rated	265	Rated condition: 2/5	2026-03-18 09:32:14.990062
404	5	transfer_initiated	265	Transfer initiated from station null to 1	2026-03-18 09:32:19.168142
405	5	condition_rated	277	Rated condition: 2/5	2026-03-18 09:32:32.370926
406	5	transfer_initiated	277	Transfer initiated from station null to 1	2026-03-18 09:32:36.889853
407	5	condition_rated	279	Rated condition: 2/5	2026-03-18 09:32:50.616008
408	5	transfer_initiated	279	Transfer initiated from station null to 1	2026-03-18 09:32:54.7351
409	5	condition_rated	281	Rated condition: 2/5	2026-03-18 09:33:10.035063
410	5	transfer_initiated	281	Transfer initiated from station null to 1	2026-03-18 09:33:34.487502
411	5	condition_rated	329	Rated condition: 3/5	2026-03-18 09:33:47.885847
412	5	transfer_initiated	329	Transfer initiated from station null to 1	2026-03-18 09:33:51.806511
413	5	condition_rated	306	Rated condition: 2/5	2026-03-18 09:34:31.187514
414	5	transfer_initiated	306	Transfer initiated from station null to 1	2026-03-18 09:34:36.54079
415	5	condition_rated	324	Rated condition: 2/5	2026-03-18 09:34:49.895407
416	5	transfer_initiated	324	Transfer initiated from station null to 1	2026-03-18 09:34:53.781354
417	5	condition_rated	264	Rated condition: 1/5	2026-03-18 09:35:09.240094
418	5	transfer_initiated	264	Transfer initiated from station null to 1	2026-03-18 09:35:13.926737
419	5	condition_rated	323	Rated condition: 1/5	2026-03-18 09:35:23.852492
420	5	transfer_initiated	323	Transfer initiated from station null to 1	2026-03-18 09:35:27.530189
421	5	condition_rated	312	Rated condition: 4/5	2026-03-18 09:35:45.523574
422	5	transfer_initiated	312	Transfer initiated from station null to 1	2026-03-18 09:35:48.922281
423	5	condition_rated	283	Rated condition: 5/5	2026-03-18 09:36:19.723966
424	5	transfer_initiated	283	Transfer initiated from station null to 1	2026-03-18 09:36:23.411637
425	5	condition_rated	317	Rated condition: 5/5	2026-03-18 09:36:45.27428
426	5	transfer_initiated	317	Transfer initiated from station null to 1	2026-03-18 09:36:49.154124
427	5	condition_rated	296	Rated condition: 5/5	2026-03-18 09:37:01.585123
428	5	transfer_initiated	296	Transfer initiated from station null to 1	2026-03-18 09:37:04.692044
429	5	condition_rated	310	Rated condition: 4/5	2026-03-18 09:37:17.43304
430	5	transfer_initiated	310	Transfer initiated from station null to 1	2026-03-18 09:37:20.46931
431	5	condition_rated	413	Rated condition: 4/5	2026-03-18 09:37:41.820816
432	5	transfer_initiated	413	Transfer initiated from station null to 1	2026-03-18 09:37:45.300851
433	5	condition_rated	404	Rated condition: 3/5	2026-03-18 09:37:58.871581
434	5	transfer_initiated	404	Transfer initiated from station null to 1	2026-03-18 09:38:02.718534
435	5	condition_rated	412	Rated condition: 4/5	2026-03-18 09:38:20.296786
436	5	transfer_initiated	412	Transfer initiated from station null to 1	2026-03-18 09:38:23.179568
437	5	condition_rated	394	Rated condition: 4/5	2026-03-18 09:38:37.133765
438	5	transfer_initiated	394	Transfer initiated from station null to 1	2026-03-18 09:38:40.473382
439	5	condition_rated	396	Rated condition: 4/5	2026-03-18 09:38:54.257681
440	5	transfer_initiated	396	Transfer initiated from station null to 1	2026-03-18 09:38:57.788713
441	5	condition_rated	409	Rated condition: 4/5	2026-03-18 09:39:13.589777
442	5	transfer_initiated	409	Transfer initiated from station null to 1	2026-03-18 09:39:17.543634
443	5	condition_rated	410	Rated condition: 4/5	2026-03-18 09:39:37.162176
444	5	condition_rated	67	Rated condition: 4/5	2026-03-19 07:48:49.115343
445	5	transfer_initiated	67	Transfer initiated from station null to 1	2026-03-19 07:48:52.802693
446	5	condition_rated	39	Rated condition: 4/5	2026-03-19 07:49:11.104947
447	5	transfer_initiated	39	Transfer initiated from station null to 1	2026-03-19 07:49:14.441315
448	5	user_login	\N	Timo Erdmann logged in	2026-03-19 07:55:02.159762
449	1	equipment_deleted	\N	Deleted equipment #493	2026-03-19 07:55:21.452058
450	1	equipment_deleted	\N	Deleted equipment #492	2026-03-19 07:55:33.283485
451	1	equipment_deleted	\N	Deleted equipment #491	2026-03-19 07:55:44.899165
452	1	equipment_deleted	\N	Deleted equipment #490	2026-03-19 07:55:55.375484
453	1	equipment_deleted	\N	Deleted equipment #489	2026-03-19 07:56:05.643955
454	1	equipment_deleted	\N	Deleted equipment #488	2026-03-19 07:56:18.051589
455	1	equipment_deleted	\N	Deleted equipment #487	2026-03-19 07:56:28.957998
456	5	invoice_import	\N	Imported invoice RE/2024/01569 from Core (1 items)	2026-03-19 07:57:38.030845
457	5	invoice_import	\N	Imported invoice N/A from Core (10 items)	2026-03-19 07:58:24.509067
458	5	condition_rated	498	Rated condition: 4/5	2026-03-19 08:07:15.097721
459	5	transfer_initiated	498	Transfer initiated from station null to 1	2026-03-19 08:07:19.629273
460	5	condition_rated	494	Rated condition: 4/5	2026-03-19 08:10:19.210062
461	5	transfer_initiated	494	Transfer initiated from station null to 1	2026-03-19 08:10:25.456811
462	5	equipment_created	505	Added North Cross (H22CR52100-21K00210)	2026-03-19 09:00:54.423292
463	5	equipment_created	506	Added North Atmos (M22AH33681-21F00011)	2026-03-19 10:03:03.446014
464	5	equipment_created	507	Added North Atmos (M22AH38681-21H00087)	2026-03-19 11:07:38.756992
465	5	equipment_created	508	Added North Atmos (M22AH38681-21H00088)	2026-03-19 11:08:46.855947
466	5	equipment_created	509	Added North Atmos (M22AH41681-21H00017)	2026-03-19 11:09:21.595845
467	5	equipment_created	510	Added North Prime (M21PM41214-21F00019)	2026-03-19 11:10:44.219752
468	5	equipment_created	511	Added North Atmos (M22AH41681-21H00028)	2026-03-19 11:11:26.831629
469	5	equipment_created	512	Added North Prime (M21PM44214-21F00009)	2026-03-19 11:12:07.695008
470	5	equipment_created	513	Added North Prime (M21PM44214-21F00003)	2026-03-19 11:12:45.462247
471	5	equipment_created	514	Added North Prime (M21PM48214-21C00003)	2026-03-19 11:13:34.070421
472	5	equipment_created	515	Added North Prime (M21PM48214-21C00004)	2026-03-19 11:14:02.237415
473	5	equipment_created	517	Added North Prime (M22PM41306-21J00481)	2026-03-19 11:14:41.991162
474	5	equipment_created	518	Added North Atmos (M22AH38681-21H00066)	2026-03-19 11:15:18.626929
475	5	equipment_created	519	Added North Atmos (M22H3868121H00087)	2026-03-19 11:16:17.860086
476	5	equipment_created	520	Added North Prime (M21PM44214-21F00006)	2026-03-19 11:17:08.155315
477	5	transfer_initiated	427	Transfer initiated from station null to 1	2026-03-19 11:17:45.185087
478	5	transfer_initiated	505	Transfer initiated from station 4 to 1	2026-03-19 11:18:08.402235
479	5	transfer_initiated	252	Transfer initiated from station null to 1	2026-03-19 11:18:26.33784
480	5	transfer_initiated	520	Transfer initiated from station 4 to 1	2026-03-19 11:20:31.825434
481	5	condition_rated	248	Rated condition: 4/5	2026-03-19 11:20:49.373476
482	5	transfer_initiated	248	Transfer initiated from station null to 1	2026-03-19 11:20:53.128456
483	5	transfer_initiated	519	Transfer initiated from station 4 to 1	2026-03-19 11:21:18.842694
484	5	transfer_initiated	518	Bulk transfer initiated to station 1	2026-03-19 11:22:04.236239
485	5	transfer_initiated	517	Bulk transfer initiated to station 1	2026-03-19 11:22:04.407485
486	5	transfer_initiated	515	Bulk transfer initiated to station 1	2026-03-19 11:22:04.579189
487	5	transfer_initiated	514	Bulk transfer initiated to station 1	2026-03-19 11:22:04.750286
488	5	transfer_initiated	513	Bulk transfer initiated to station 1	2026-03-19 11:22:04.921802
489	5	transfer_initiated	512	Bulk transfer initiated to station 1	2026-03-19 11:22:05.092568
490	5	transfer_initiated	511	Bulk transfer initiated to station 1	2026-03-19 11:22:05.263341
491	5	transfer_initiated	510	Bulk transfer initiated to station 1	2026-03-19 11:22:05.434362
492	5	transfer_initiated	509	Bulk transfer initiated to station 1	2026-03-19 11:22:05.605056
493	5	transfer_initiated	508	Bulk transfer initiated to station 1	2026-03-19 11:22:05.776024
494	5	transfer_initiated	507	Bulk transfer initiated to station 1	2026-03-19 11:22:05.946888
495	5	transfer_initiated	506	Bulk transfer initiated to station 1	2026-03-19 11:22:06.117237
496	5	condition_rated	231	Rated condition: 4/5	2026-03-19 11:46:06.158412
497	5	transfer_initiated	231	Transfer initiated from station null to 1	2026-03-19 11:46:09.580713
498	5	condition_rated	238	Rated condition: 4/5	2026-03-19 11:46:35.911073
499	5	transfer_initiated	238	Transfer initiated from station null to 1	2026-03-19 11:46:41.185812
500	5	invoice_import	\N	Imported invoice RE/2026/01118 from Core (6 items)	2026-03-19 11:48:28.754953
501	5	transfer_initiated	521	Bulk transfer initiated to station 1	2026-03-19 11:49:19.044263
502	5	transfer_initiated	522	Bulk transfer initiated to station 1	2026-03-19 11:49:19.213446
503	5	transfer_initiated	523	Bulk transfer initiated to station 1	2026-03-19 11:49:19.381973
504	5	transfer_initiated	524	Bulk transfer initiated to station 1	2026-03-19 11:49:19.55013
505	5	transfer_initiated	525	Bulk transfer initiated to station 1	2026-03-19 11:49:19.717761
506	5	transfer_initiated	526	Bulk transfer initiated to station 1	2026-03-19 11:49:19.886
507	5	user_login	\N	Timo Erdmann logged in	2026-03-19 11:49:48.925588
508	5	user_created	\N	Created user: dakla@kiteworldwide.com	2026-03-19 11:52:00.86676
509	5	user_updated	\N	Updated user: dakhla@kiteworldwide.com	2026-03-19 11:52:15.475403
510	8	user_login	\N	Björn Nerling logged in	2026-03-19 11:53:45.054567
511	8	user_login	\N	Björn Nerling logged in	2026-03-19 11:55:37.652536
512	5	user_login	\N	Timo Erdmann logged in	2026-03-19 11:56:41.930603
513	8	user_login	\N	Björn Nerling logged in	2026-03-19 11:57:44.784326
514	5	user_login	\N	Timo Erdmann logged in	2026-03-19 11:58:22.981512
515	5	accessory_quantity_changed	\N	Wetsuit (XS) @ Dakhla: 0 → 1 (+1)	2026-03-19 11:59:06.891714
516	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 0 → 1 (+1)	2026-03-19 11:59:10.707701
517	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 1 → 2 (+1)	2026-03-19 11:59:12.079421
518	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 2 → 3 (+1)	2026-03-19 11:59:13.15554
519	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 3 → 4 (+1)	2026-03-19 11:59:14.697845
520	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 4 → 5 (+1)	2026-03-19 11:59:16.022482
521	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 5 → 6 (+1)	2026-03-19 11:59:17.350511
522	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 6 → 7 (+1)	2026-03-19 11:59:18.871941
523	5	accessory_quantity_changed	\N	Wetsuit (M) @ Dakhla: 0 → 1 (+1)	2026-03-19 11:59:23.986884
524	5	accessory_quantity_changed	\N	Wetsuit (M) @ Dakhla: 1 → 2 (+1)	2026-03-19 11:59:25.309768
525	5	accessory_quantity_changed	\N	Wetsuit (L) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:17.859354
526	5	accessory_quantity_changed	\N	Wetsuit (L) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:00:19.440886
527	5	accessory_quantity_changed	\N	Wetsuit (L) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:00:20.968294
528	5	accessory_quantity_changed	\N	Wetsuit (XL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:22.484088
529	5	accessory_quantity_changed	\N	Wetsuit (XL) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:00:23.87651
530	5	accessory_quantity_changed	\N	Wetsuit (XXL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:26.883954
531	5	accessory_quantity_changed	\N	Wetsuit Shorty (S) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:48.370363
532	5	accessory_quantity_changed	\N	Wetsuit Shorty (M) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:52.068221
533	5	accessory_quantity_changed	\N	Wetsuit Shorty (L) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:53.812005
534	5	accessory_quantity_changed	\N	Wetsuit Shorty (XL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:00:55.892564
535	5	accessory_quantity_changed	\N	Helmet (XS) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:03:30.033608
536	5	accessory_quantity_changed	\N	Helmet (XS) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:03:31.450472
537	5	accessory_quantity_changed	\N	Helmet (S) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:03:35.143273
538	5	accessory_quantity_changed	\N	Helmet (S) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:03:38.241808
539	5	accessory_quantity_changed	\N	Helmet (S) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:03:42.157908
540	5	accessory_quantity_changed	\N	Helmet (M) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:03:45.601376
541	5	accessory_quantity_changed	\N	Helmet (M) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:03:47.055714
542	5	accessory_quantity_changed	\N	Helmet (M) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:03:48.471044
543	5	accessory_quantity_changed	\N	Helmet (M) @ Dakhla: 3 → 4 (+1)	2026-03-19 12:03:49.940204
544	5	accessory_quantity_changed	\N	Helmet (L) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:03:52.92931
545	5	accessory_quantity_changed	\N	Pump @ Dakhla: 1 → 2 (+1)	2026-03-19 12:03:57.410691
546	5	accessory_quantity_changed	\N	Pump @ Dakhla: 2 → 3 (+1)	2026-03-19 12:03:59.006665
547	5	accessory_quantity_changed	\N	Waist Harness (XS) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:23.219657
548	5	accessory_quantity_changed	\N	Waist Harness (S) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:26.24758
549	5	accessory_quantity_changed	\N	Waist Harness (S) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:04:28.197754
550	5	accessory_quantity_changed	\N	Waist Harness (S) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:04:29.771659
551	5	accessory_quantity_changed	\N	Waist Harness (M) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:34.160217
552	5	accessory_quantity_changed	\N	Waist Harness (M) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:04:36.114858
553	5	accessory_quantity_changed	\N	Waist Harness (L) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:38.796912
554	5	accessory_quantity_changed	\N	Waist Harness (L) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:04:40.383457
555	5	accessory_quantity_changed	\N	Waist Harness (L) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:04:41.876889
556	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:45.316988
557	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:04:46.995404
558	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:04:48.415376
559	5	accessory_quantity_changed	\N	Waist Harness (XXL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:04:51.307614
560	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:19.309325
561	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:05:22.982089
562	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:05:24.843971
563	5	accessory_quantity_changed	\N	Seat Harness (S) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:29.015876
564	5	accessory_quantity_changed	\N	Seat Harness (S) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:05:31.053905
565	5	accessory_quantity_changed	\N	Seat Harness (M) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:34.20954
566	5	accessory_quantity_changed	\N	Seat Harness (M) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:05:36.030993
567	5	accessory_quantity_changed	\N	Seat Harness (M) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:05:37.459109
568	5	accessory_quantity_changed	\N	Seat Harness (L) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:39.813095
569	5	accessory_quantity_changed	\N	Seat Harness (L) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:05:41.398106
570	5	accessory_quantity_changed	\N	Seat Harness (L) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:05:42.811498
571	5	accessory_quantity_changed	\N	Seat Harness (XL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:45.844184
572	5	accessory_quantity_changed	\N	Seat Harness (XL) @ Dakhla: 1 → 2 (+1)	2026-03-19 12:05:47.63111
573	5	accessory_quantity_changed	\N	Seat Harness (XL) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:05:49.142482
574	5	accessory_quantity_changed	\N	Seat Harness (XXL) @ Dakhla: 0 → 1 (+1)	2026-03-19 12:05:52.221167
575	5	accessory_quantity_changed	\N	Wetsuit (XL) @ Dakhla: 2 → 3 (+1)	2026-03-19 12:06:23.812487
576	5	accessory_quantity_changed	\N	Wetsuit (XL) @ Dakhla: 3 → 4 (+1)	2026-03-19 12:06:25.419171
577	5	accessory_quantity_changed	\N	Wetsuit (L) @ Dakhla: 3 → 2 (-1)	2026-03-19 12:06:27.715439
578	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 7 → 6 (-1)	2026-03-19 12:06:59.885043
579	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 6 → 5 (-1)	2026-03-19 12:07:01.538217
580	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 5 → 4 (-1)	2026-03-19 12:07:03.262032
581	5	accessory_quantity_changed	\N	Wetsuit (S) @ Dakhla: 4 → 3 (-1)	2026-03-19 12:07:05.610756
582	5	equipment_updated	505	Updated North Cross	2026-03-19 13:47:14.291137
583	5	equipment_updated	462	Updated Core XR6	2026-03-19 13:51:03.570672
584	5	equipment_updated	463	Updated Core XR6	2026-03-19 13:51:24.261355
585	5	equipment_updated	478	Updated Fanatic Skyair Wingboard Komplett mit Foilset	2026-03-19 13:52:03.969807
586	5	equipment_updated	477	Updated Flysurfer  Viron	2026-03-19 13:52:24.894821
587	5	equipment_updated	476	Updated Crazyfly Allround	2026-03-19 13:52:45.572766
588	5	equipment_updated	475	Updated Crazyfly Allround	2026-03-19 13:52:57.215326
589	5	equipment_updated	473	Updated Kold Polar II	2026-03-19 13:54:08.290853
590	5	equipment_updated	466	Updated Kold Horizont	2026-03-19 13:54:18.31354
591	5	equipment_updated	465	Updated Kold Polar II	2026-03-19 13:54:25.789575
592	5	equipment_updated	468	Updated Flysurfer Viron	2026-03-19 13:55:10.303691
593	5	equipment_updated	469	Updated Flysurfer Viron	2026-03-19 13:55:19.468427
594	5	equipment_updated	470	Updated Flysurfer Viron	2026-03-19 13:55:27.799463
595	5	equipment_updated	471	Updated Flysurfer Viron	2026-03-19 13:55:37.241094
596	5	equipment_updated	472	Updated Flysurfer Viron	2026-03-19 13:55:46.409032
597	5	equipment_updated	464	Updated Fanatic Skywing	2026-03-19 13:56:02.675847
598	5	equipment_updated	474	Updated Core Deluxe	2026-03-19 13:56:28.726627
599	5	equipment_updated	467	Updated Core Nexus 2	2026-03-19 13:56:40.314191
600	5	user_login	\N	Timo Erdmann logged in	2026-03-19 18:36:02.173071
601	8	user_login	\N	Björn Nerling logged in	2026-03-20 10:29:56.193942
602	8	user_login	\N	Björn Nerling logged in	2026-03-20 10:55:40.416128
603	8	transfer_confirmed	480	Transfer received · condition 5/5	2026-03-20 10:56:42.168894
604	8	user_login	\N	Björn Nerling logged in	2026-03-20 10:59:08.82021
605	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:03:12.643671
606	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:09:05.74656
607	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:10:09.899671
608	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:17:34.260405
609	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:21:03.674308
610	8	transfer_confirmed	41	Transfer received · condition 3/5	2026-03-20 11:23:27.317285
611	5	user_login	\N	Timo Erdmann logged in	2026-03-20 11:24:44.534738
612	5	user_login	\N	Timo Erdmann logged in	2026-03-20 11:25:37.205935
613	8	user_login	\N	Björn Nerling logged in	2026-03-20 11:25:52.309108
614	5	condition_rated	41	Rated condition: 4/5	2026-03-20 11:27:55.802532
615	8	transfer_confirmed	481	Transfer received · condition 5/5	2026-03-21 09:29:37.057447
616	8	transfer_confirmed	482	Transfer received · condition 5/5	2026-03-21 09:30:03.582904
617	8	transfer_confirmed	479	Transfer received · condition 5/5	2026-03-21 09:30:46.555091
618	8	transfer_confirmed	50	Transfer received · condition 4/5	2026-03-21 09:42:36.821773
619	8	transfer_confirmed	42	Transfer received · condition 4/5	2026-03-21 09:43:41.282662
620	8	transfer_confirmed	87	Transfer received · condition 3/5	2026-03-21 09:48:19.164454
621	8	transfer_confirmed	49	Transfer received · condition 3/5	2026-03-21 09:49:07.078792
622	8	transfer_confirmed	483	Transfer received · condition 5/5	2026-03-21 09:50:49.244477
623	8	transfer_confirmed	128	Transfer received · condition 3/5	2026-03-21 16:19:46.514676
624	8	transfer_confirmed	67	Transfer received · condition 3/5	2026-03-21 16:24:16.937343
625	8	transfer_confirmed	97	Transfer received · condition 3/5	2026-03-21 16:26:51.076619
626	8	transfer_confirmed	37	Transfer received · condition 4/5	2026-03-21 16:32:21.20704
627	8	transfer_confirmed	36	Transfer received · condition 4/5	2026-03-21 16:38:52.856281
628	8	transfer_confirmed	35	Transfer received · condition 4/5	2026-03-21 16:40:41.353579
629	8	transfer_confirmed	147	Transfer received · condition 3/5	2026-03-21 16:43:21.349557
630	8	transfer_confirmed	341	Transfer received · condition 2/5	2026-03-21 16:45:54.32958
631	8	transfer_confirmed	498	Transfer received · condition 4/5	2026-03-21 16:48:32.091482
632	8	user_login	\N	Björn Nerling logged in	2026-03-21 18:56:12.568429
633	5	equipment_created	527	Added Flysurfer Viron (FKVI30S06-4618-58579)	2026-03-23 07:55:02.503752
634	5	condition_rated	332	Rated condition: 3/5	2026-03-23 09:26:47.632731
635	5	transfer_initiated	332	Transfer initiated from station null to 1	2026-03-23 09:26:52.380685
636	8	transfer_confirmed	332	Transfer received · condition 3/5	2026-03-23 10:36:40.967234
637	8	transfer_confirmed	39	Transfer received · condition 4/5	2026-03-23 10:41:15.921084
638	8	transfer_confirmed	48	Transfer received · condition 3/5	2026-03-23 10:45:35.745971
639	8	transfer_confirmed	494	Transfer received · condition 3/5	2026-03-23 10:47:19.439161
640	8	transfer_confirmed	348	Transfer received · condition 3/5	2026-03-23 10:49:06.917847
641	8	transfer_confirmed	30	Transfer received · condition 4/5	2026-03-23 10:53:25.603893
642	8	transfer_confirmed	350	Transfer received · condition 3/5	2026-03-23 10:55:56.388946
643	8	transfer_confirmed	76	Transfer received · condition 4/5	2026-03-23 11:16:44.9775
644	8	transfer_confirmed	356	Transfer received · condition 3/5	2026-03-23 11:21:03.213376
645	5	transfer_initiated	351	Transfer initiated from station null to 1	2026-03-23 11:22:22.81044
646	5	equipment_created	528	Added Core Nexus 2 (KNX215WBA1107548)	2026-03-23 11:24:09.279862
647	5	transfer_initiated	528	Transfer initiated from station 4 to 1	2026-03-23 11:24:20.117462
648	5	condition_rated	362	Rated condition: 4/5	2026-03-23 11:24:55.058062
649	5	transfer_initiated	362	Transfer initiated from station null to 1	2026-03-23 11:24:59.595006
650	8	transfer_confirmed	141	Transfer received · condition 3/5	2026-03-23 11:26:13.13399
651	8	inventory_check_completed	\N	Completed inventory check at Dakhla	2026-03-23 11:50:49.78832
652	8	transfer_confirmed	359	Transfer received · condition 3/5	2026-03-23 11:53:18.281638
653	8	transfer_confirmed	357	Transfer received · condition 3/5	2026-03-23 11:55:27.454326
654	8	transfer_confirmed	52	Transfer received · condition 3/5	2026-03-23 11:58:33.864125
655	8	transfer_confirmed	40	Transfer received · condition 4/5	2026-03-23 12:02:04.80993
656	8	transfer_confirmed	51	Transfer received · condition 4/5	2026-03-23 12:04:09.357942
657	8	transfer_confirmed	362	Transfer received · condition 3/5	2026-03-23 12:06:11.589824
658	8	transfer_confirmed	528	Transfer received · condition 3/5	2026-03-23 12:08:48.135934
659	8	transfer_confirmed	351	Transfer received · condition 3/5	2026-03-23 12:10:57.910074
660	8	transfer_confirmed	38	Transfer received · condition 3/5	2026-03-23 12:12:27.410382
661	8	transfer_confirmed	369	Transfer received · condition 4/5	2026-03-23 12:14:14.227451
662	8	transfer_confirmed	377	Transfer received · condition 4/5	2026-03-23 12:27:20.465726
663	8	transfer_confirmed	393	Transfer received · condition 4/5	2026-03-23 12:29:39.419864
664	8	transfer_confirmed	374	Transfer received · condition 4/5	2026-03-23 12:33:53.94223
665	8	transfer_confirmed	392	Transfer received · condition 5/5	2026-03-23 12:38:39.754749
666	8	transfer_confirmed	382	Transfer received · condition 5/5	2026-03-23 12:40:29.827454
667	8	transfer_confirmed	379	Transfer received · condition 4/5	2026-03-23 12:42:16.33147
668	8	transfer_confirmed	390	Transfer received · condition 4/5	2026-03-23 12:43:36.479545
669	8	transfer_confirmed	371	Transfer received · condition 5/5	2026-03-23 12:45:19.583526
670	5	transfer_initiated	373	Transfer initiated from station null to 1	2026-03-23 12:50:46.748364
671	8	transfer_confirmed	231	Transfer received · condition 4/5	2026-03-23 13:09:39.816998
672	8	transfer_confirmed	506	Transfer received · condition 3/5	2026-03-23 13:10:14.83776
673	8	transfer_confirmed	507	Transfer received · condition 4/5	2026-03-23 13:10:31.719956
674	8	transfer_confirmed	508	Transfer received · condition 4/5	2026-03-23 13:10:43.616855
675	8	transfer_confirmed	509	Transfer received · condition 4/5	2026-03-23 13:10:58.024908
676	8	transfer_confirmed	510	Transfer received · condition 4/5	2026-03-23 13:11:10.588514
677	8	transfer_confirmed	511	Transfer received · condition 3/5	2026-03-23 13:11:31.067626
678	8	transfer_confirmed	512	Transfer received · condition 3/5	2026-03-23 13:13:36.267057
679	8	transfer_confirmed	513	Transfer received · condition 3/5	2026-03-23 13:13:53.335284
680	8	transfer_confirmed	514	Transfer received · condition 3/5	2026-03-23 13:14:11.102782
681	8	transfer_confirmed	515	Transfer received · condition 3/5	2026-03-23 13:14:29.02292
682	8	transfer_confirmed	517	Transfer received · condition 3/5	2026-03-23 13:14:42.876282
683	8	transfer_confirmed	518	Transfer received · condition 4/5	2026-03-23 13:15:06.158043
684	8	transfer_confirmed	519	Transfer received · condition 4/5	2026-03-23 13:15:22.020503
685	8	transfer_confirmed	248	Transfer received · condition 4/5	2026-03-23 13:15:31.685088
686	8	transfer_confirmed	520	Transfer received · condition 3/5	2026-03-23 13:15:55.40977
687	8	transfer_confirmed	252	Transfer received · condition 4/5	2026-03-23 13:15:59.96944
688	8	transfer_confirmed	505	Transfer received · condition 4/5	2026-03-23 13:16:08.87524
689	8	transfer_confirmed	427	Transfer received · condition 4/5	2026-03-23 13:16:16.609514
690	8	transfer_confirmed	486	Transfer received · condition 5/5	2026-03-23 13:17:33.058409
691	8	transfer_confirmed	238	Transfer received · condition 4/5	2026-03-23 13:36:44.385019
692	8	transfer_confirmed	373	Transfer received · condition 4/5	2026-03-24 09:54:45.221295
693	8	transfer_confirmed	521	Transfer received · condition 5/5	2026-03-24 09:55:18.400323
694	8	transfer_confirmed	526	Transfer received · condition 5/5	2026-03-24 09:55:42.997769
695	8	transfer_confirmed	525	Transfer received · condition 5/5	2026-03-24 09:58:02.262392
696	8	transfer_confirmed	317	Transfer received · condition 4/5	2026-03-24 09:58:33.16233
697	8	transfer_confirmed	283	Transfer received · condition 3/5	2026-03-24 10:00:54.001662
698	8	transfer_confirmed	523	Transfer received · condition 5/5	2026-03-24 10:17:56.457494
699	8	transfer_confirmed	522	Transfer received · condition 5/5	2026-03-24 10:18:26.66311
700	8	transfer_confirmed	524	Transfer received · condition 5/5	2026-03-24 10:18:57.510009
701	8	transfer_confirmed	324	Transfer received · condition 3/5	2026-03-24 10:42:14.356145
702	8	transfer_confirmed	296	Transfer received · condition 3/5	2026-03-24 10:42:53.192389
703	5	condition_rated	322	Rated condition: 3/5	2026-03-24 11:20:06.890674
852	5	condition_rated	110	Rated condition: 4/5	2026-04-02 07:18:23.059004
704	5	transfer_initiated	322	Transfer initiated from station null to 1	2026-03-24 11:20:10.68832
705	5	condition_rated	268	Rated condition: 3/5	2026-03-24 11:20:26.823611
706	5	transfer_initiated	268	Transfer initiated from station null to 1	2026-03-24 11:20:31.073235
707	5	invoice_import	\N	Imported invoice RE/2025/09245 from Core (4 items)	2026-03-24 11:22:54.721894
708	5	invoice_import	\N	Imported invoice IN720276 from Core (12 items)	2026-03-24 11:23:38.423134
709	5	condition_rated	542	Rated condition: 3/5	2026-03-24 11:23:54.123201
710	5	transfer_initiated	542	Transfer initiated from station null to 1	2026-03-24 11:23:59.063553
711	5	equipment_updated	485	Updated Core DELUXE Freeride 2 - board only	2026-03-24 11:46:49.524483
712	8	transfer_confirmed	81	Transfer received · condition 3/5	2026-03-24 12:27:03.914021
713	8	transfer_confirmed	485	Transfer received · condition 5/5	2026-03-24 13:21:58.218595
714	8	repair_logged	283	Repair created from damage report for Core CORE Sensor 3 Control Bar	2026-03-24 14:17:05.754574
715	8	damage_reported	283	Damage reported for Core CORE Sensor 3 Control Bar: Safety Leine core Bar 3s gerissen	2026-03-24 14:17:05.803829
716	8	spare_parts_needed	283	⚙️ Spare parts needed for Core CORE Sensor 3 Control Bar: Neue Safety Leine Core 3S (reported by Björn Nerling)	2026-03-24 14:17:05.84778
717	4	user_login	\N	Philipp Sensen logged in	2026-03-25 11:38:42.242509
718	4	user_login	\N	Philipp Sensen logged in	2026-03-25 11:39:57.073264
719	1	user_login	\N	York logged in	2026-03-26 09:25:24.715992
720	5	transfer_confirmed	404	Transfer received · condition 4/5	2026-03-27 09:02:10.477259
721	5	transfer_confirmed	409	Transfer received · condition 4/5	2026-03-27 09:02:23.468856
722	5	transfer_confirmed	394	Transfer received · condition 4/5	2026-03-27 09:02:34.577652
723	5	transfer_confirmed	412	Transfer received · condition 4/5	2026-03-27 09:02:46.027606
724	5	transfer_confirmed	396	Transfer received · condition 4/5	2026-03-27 09:02:55.464039
725	5	transfer_confirmed	413	Transfer received · condition 4/5	2026-03-27 09:03:23.337573
726	5	transfer_initiated	410	Transfer initiated from station null to 1	2026-03-27 09:04:03.109797
727	5	transfer_confirmed	410	Transfer received · condition 4/5	2026-03-27 09:04:08.232894
728	5	transfer_confirmed	264	Transfer received · condition 1/5	2026-03-27 09:07:41.449029
729	5	condition_rated	318	Rated condition: 3/5	2026-03-27 09:08:25.378694
730	5	transfer_initiated	318	Transfer initiated from station null to 1	2026-03-27 09:08:29.261607
731	5	transfer_confirmed	318	Transfer received · condition 3/5	2026-03-27 09:08:34.593835
732	5	transfer_confirmed	323	Transfer received · condition 3/5	2026-03-27 09:09:05.626401
733	5	condition_rated	262	Rated condition: 2/5	2026-03-27 09:09:28.28857
734	5	transfer_initiated	262	Transfer initiated from station null to 1	2026-03-27 09:09:32.356874
735	5	transfer_confirmed	262	Transfer received · condition 2/5	2026-03-27 09:09:43.629304
736	5	condition_rated	325	Rated condition: 3/5	2026-03-27 09:10:03.958519
737	5	transfer_initiated	325	Transfer initiated from station null to 1	2026-03-27 09:10:07.788988
738	5	transfer_confirmed	325	Transfer received · condition 3/5	2026-03-27 09:10:13.626961
739	5	condition_rated	290	Rated condition: 2/5	2026-03-27 09:10:32.465689
740	5	transfer_initiated	290	Transfer initiated from station null to 1	2026-03-27 09:10:35.801604
741	5	transfer_confirmed	290	Transfer received · condition 2/5	2026-03-27 09:10:41.599701
742	5	transfer_confirmed	312	Transfer received · condition 3/5	2026-03-27 09:10:55.089049
743	5	condition_rated	298	Rated condition: 3/5	2026-03-27 09:11:27.646331
744	5	transfer_initiated	298	Transfer initiated from station null to 1	2026-03-27 09:11:31.221221
745	5	transfer_confirmed	298	Transfer received · condition 3/5	2026-03-27 09:11:37.394303
746	5	transfer_confirmed	542	Transfer received · condition 3/5	2026-03-27 09:12:01.012909
747	5	transfer_confirmed	268	Transfer received · condition 3/5	2026-03-27 09:12:17.840728
748	5	condition_rated	327	Rated condition: 2/5	2026-03-27 09:12:35.98151
749	5	transfer_initiated	327	Transfer initiated from station null to 1	2026-03-27 09:12:40.421575
750	5	transfer_confirmed	327	Transfer received · condition 2/5	2026-03-27 09:12:46.076941
751	5	transfer_confirmed	322	Transfer received · condition 3/5	2026-03-27 09:14:30.882265
752	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 0 → 1 (+1)	2026-03-27 09:17:05.393322
753	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 1 → 2 (+1)	2026-03-27 09:17:07.445623
754	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 2 → 3 (+1)	2026-03-27 09:17:09.796892
755	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 3 → 4 (+1)	2026-03-27 09:17:12.652785
756	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 4 → 5 (+1)	2026-03-27 09:17:14.371243
757	5	accessory_quantity_changed	\N	Pump (One Size) @ Office Hamburg Warehouse: 5 → 6 (+1)	2026-03-27 09:17:16.214889
758	5	accessory_transferred	\N	Pump (One Size) ×2: Office Hamburg Warehouse → Dakhla	2026-03-27 09:17:30.17162
759	5	transfer_cancelled	\N	Cancelled transfer #141	2026-03-27 09:26:54.016748
760	5	transfer_cancelled	\N	Cancelled transfer #133	2026-03-27 09:26:58.489364
761	5	transfer_cancelled	\N	Cancelled transfer #132	2026-03-27 09:27:00.14844
762	5	transfer_cancelled	\N	Cancelled transfer #131	2026-03-27 09:27:01.389015
763	5	transfer_cancelled	\N	Cancelled transfer #130	2026-03-27 09:27:02.475531
764	5	transfer_cancelled	\N	Cancelled transfer #129	2026-03-27 09:27:05.842429
765	5	transfer_cancelled	\N	Cancelled transfer #128	2026-03-27 09:27:10.761155
766	8	transfer_confirmed	89	Transfer received · condition 3/5	2026-03-27 09:31:06.357143
767	8	transfer_confirmed	114	Transfer received · condition 3/5	2026-03-27 09:34:19.771116
768	8	user_login	\N	Björn Nerling logged in	2026-03-27 09:34:38.755021
769	8	user_login	\N	Björn Nerling logged in	2026-03-27 09:34:47.008406
770	8	transfer_confirmed	484	Transfer received · condition 5/5	2026-03-27 09:39:45.004054
771	8	transfer_confirmed	366	Transfer received · condition 3/5	2026-03-27 09:47:27.391098
772	8	inventory_check_started	\N	Started inventory check at Dakhla (105 items)	2026-03-27 10:04:45.149339
773	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:09.186239
774	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:10.404849
775	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:26.0878
776	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:32.618287
854	5	condition_rated	113	Rated condition: 4/5	2026-04-02 07:18:39.852936
777	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:33.747077
778	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:34.868706
779	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:41.09376
780	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:43.028496
781	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:44.310724
782	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:47.114904
783	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:49.53547
784	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:52.121538
785	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:54.883349
786	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:56.635007
787	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:58.199412
788	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:05:59.54069
789	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:06:02.582299
790	8	inventory_item_checked	89	Inventory check: Core CORE XR7 10.0 black/black marked as pending	2026-03-27 10:06:21.382852
791	8	user_login	\N	Björn Nerling logged in	2026-03-27 10:09:32.232141
792	5	user_login	\N	Timo Erdmann logged in	2026-03-27 11:00:27.840752
793	8	user_login	\N	Björn Nerling logged in	2026-03-27 11:00:57.973316
794	5	user_login	\N	Timo Erdmann logged in	2026-03-30 08:06:53.466565
795	1	user_created	\N	Created user: andre@kiteworldwide.com	2026-03-30 09:07:00.803578
796	9	user_login	\N	André Peschka logged in	2026-03-30 09:09:27.563735
797	1	user_login	\N	York logged in	2026-03-30 10:00:33.766066
798	9	user_updated	\N	Updated user: andre@kiteworldwide.com	2026-03-31 07:10:54.009479
799	5	condition_rated	342	Rated condition: 3/5	2026-04-02 06:46:43.058107
800	5	transfer_initiated	342	Transfer initiated from station null to 1	2026-04-02 06:46:47.03952
801	5	transfer_cancelled	\N	Cancelled transfer #193	2026-04-02 06:47:00.553266
802	5	condition_rated	364	Rated condition: 1/5	2026-04-02 06:55:46.381337
803	5	condition_rated	364	Rated condition: 5/5	2026-04-02 06:56:19.048352
804	5	transfer_initiated	364	Transfer initiated from station null to 2	2026-04-02 06:56:25.03
805	5	condition_rated	365	Rated condition: 4/5	2026-04-02 06:56:37.467992
806	5	transfer_initiated	365	Transfer initiated from station null to 2	2026-04-02 06:56:43.242936
807	5	condition_rated	151	Rated condition: 4/5	2026-04-02 06:57:04.161703
808	5	condition_rated	151	Rated condition: 3/5	2026-04-02 06:57:11.172312
809	5	transfer_initiated	151	Transfer initiated from station null to 2	2026-04-02 06:57:19.350718
810	5	condition_rated	82	Rated condition: 3/5	2026-04-02 07:02:51.960298
811	5	transfer_initiated	82	Transfer initiated from station null to 2	2026-04-02 07:02:58.784067
812	5	condition_rated	93	Rated condition: 4/5	2026-04-02 07:03:22.497559
813	5	transfer_initiated	93	Transfer initiated from station null to 2	2026-04-02 07:03:26.308967
814	5	condition_rated	94	Rated condition: 4/5	2026-04-02 07:03:41.543301
815	5	transfer_initiated	94	Transfer initiated from station null to 2	2026-04-02 07:03:45.16868
816	5	condition_rated	95	Rated condition: 2/5	2026-04-02 07:04:11.014408
817	5	transfer_initiated	95	Transfer initiated from station null to 2	2026-04-02 07:04:15.837547
818	5	condition_rated	96	Rated condition: 4/5	2026-04-02 07:04:32.714674
819	5	transfer_initiated	96	Transfer initiated from station null to 2	2026-04-02 07:04:36.88962
820	5	condition_rated	78	Rated condition: 4/5	2026-04-02 07:04:51.975625
821	5	transfer_initiated	78	Transfer initiated from station null to 2	2026-04-02 07:04:57.928556
822	5	condition_rated	80	Rated condition: 4/5	2026-04-02 07:05:16.801113
823	5	transfer_initiated	80	Transfer initiated from station null to 2	2026-04-02 07:05:21.264918
824	5	condition_rated	84	Rated condition: 2/5	2026-04-02 07:05:40.545693
825	5	transfer_initiated	84	Transfer initiated from station null to 2	2026-04-02 07:05:44.847748
826	5	condition_rated	529	Rated condition: 5/5	2026-04-02 07:07:09.871233
827	5	transfer_initiated	529	Transfer initiated from station null to 2	2026-04-02 07:07:14.304558
828	5	condition_rated	532	Rated condition: 3/5	2026-04-02 07:08:26.788429
829	5	transfer_initiated	532	Transfer initiated from station null to 2	2026-04-02 07:08:32.007717
830	5	transfer_cancelled	\N	Cancelled transfer #206	2026-04-02 07:12:01.180411
831	5	invoice_import	\N	Imported invoice RE/2025/08327 from Core (3 items)	2026-04-02 07:12:09.762425
832	5	condition_rated	545	Rated condition: 3/5	2026-04-02 07:12:44.674468
833	5	transfer_initiated	545	Transfer initiated from station null to 2	2026-04-02 07:12:48.303116
834	5	condition_rated	546	Rated condition: 3/5	2026-04-02 07:13:00.999767
835	5	transfer_initiated	546	Transfer initiated from station null to 2	2026-04-02 07:13:04.191343
836	5	condition_rated	547	Rated condition: 3/5	2026-04-02 07:13:14.574025
837	5	transfer_initiated	547	Transfer initiated from station null to 2	2026-04-02 07:13:18.398772
838	5	condition_rated	99	Rated condition: 3/5	2026-04-02 07:14:03.014287
839	5	transfer_initiated	99	Transfer initiated from station null to 2	2026-04-02 07:14:06.72472
840	5	condition_rated	335	Rated condition: 2/5	2026-04-02 07:14:20.582403
841	5	transfer_initiated	335	Transfer initiated from station null to 2	2026-04-02 07:14:24.833826
842	5	condition_rated	334	Rated condition: 2/5	2026-04-02 07:14:39.620536
843	5	transfer_initiated	334	Transfer initiated from station null to 2	2026-04-02 07:14:43.17068
844	5	condition_rated	339	Rated condition: 3/5	2026-04-02 07:14:57.01007
845	5	transfer_initiated	339	Transfer initiated from station null to 2	2026-04-02 07:15:01.82271
846	5	condition_rated	107	Rated condition: 4/5	2026-04-02 07:16:42.044567
847	5	transfer_initiated	107	Transfer initiated from station null to 2	2026-04-02 07:16:47.346044
848	5	condition_rated	109	Rated condition: 4/5	2026-04-02 07:16:58.831959
849	5	transfer_initiated	109	Transfer initiated from station null to 2	2026-04-02 07:17:02.641476
850	5	condition_rated	111	Rated condition: 4/5	2026-04-02 07:17:20.665151
851	5	transfer_initiated	111	Transfer initiated from station null to 2	2026-04-02 07:17:24.65941
853	5	transfer_initiated	110	Transfer initiated from station null to 2	2026-04-02 07:18:26.931238
855	5	transfer_initiated	113	Transfer initiated from station null to 2	2026-04-02 07:18:43.607989
856	5	condition_rated	118	Rated condition: 3/5	2026-04-02 07:19:14.449061
857	5	transfer_initiated	118	Transfer initiated from station null to 2	2026-04-02 07:19:18.472618
858	5	condition_rated	122	Rated condition: 3/5	2026-04-02 07:19:36.139838
859	5	transfer_initiated	122	Transfer initiated from station null to 2	2026-04-02 07:19:39.823267
860	5	user_created	\N	Created user: tatajuba@kiteworldwide.com	2026-04-02 07:58:36.428802
861	10	user_login	\N	Osvaldo Mateus logged in	2026-04-02 07:59:29.822203
862	8	transfer_confirmed	355	Transfer received · condition 3/5	2026-04-02 11:06:13.40709
863	8	user_login	\N	Björn Nerling logged in	2026-04-02 11:08:18.356028
864	8	transfer_confirmed	344	Transfer received · condition 3/5	2026-04-02 11:08:30.23723
865	8	transfer_confirmed	53	Transfer received · condition 3/5	2026-04-02 11:10:02.686082
866	5	condition_rated	336	Rated condition: 3/5	2026-04-02 11:49:10.824122
867	5	transfer_initiated	336	Transfer initiated from station null to 1	2026-04-02 11:49:15.716926
868	5	transfer_confirmed	336	Transfer received · condition 3/5	2026-04-02 11:49:24.308718
869	5	condition_rated	338	Rated condition: 3/5	2026-04-02 11:49:44.981821
870	5	transfer_initiated	338	Transfer initiated from station null to 1	2026-04-02 11:49:49.285152
871	5	transfer_confirmed	338	Transfer received · condition 3/5	2026-04-02 11:49:54.301974
872	5	transfer_cancelled	\N	Cancelled transfer #85	2026-04-02 11:51:43.858198
873	5	condition_rated	349	Rated condition: 3/5	2026-04-02 11:55:02.76113
874	5	transfer_initiated	349	Transfer initiated from station null to 2	2026-04-02 11:55:06.960039
875	5	equipment_created	548	Added Core GTS5 (KGS512BBA9029463)	2026-04-02 11:55:50.19362
876	5	condition_rated	548	Rated condition: 3/5	2026-04-02 11:55:57.160385
877	5	transfer_initiated	548	Transfer initiated from station 4 to 2	2026-04-02 11:56:00.644527
878	5	equipment_created	549	Added Core  Nexus1 (KNX106BBA8060753)	2026-04-02 11:58:21.1506
879	5	transfer_confirmed	548	Transfer received · condition 2/5	2026-04-02 11:58:31.564798
880	5	equipment_created	550	Added Core Nexus1 (KNX107BBA8102924)	2026-04-02 11:59:20.953917
881	5	equipment_created	551	Added Core Nexus1 (KNX108BBA8082283)	2026-04-02 12:00:18.314902
882	5	equipment_created	552	Added Core Nexus1 (KNX108BBA8092393)	2026-04-02 12:00:45.134372
883	5	equipment_created	553	Added Core Nexus1 (KNX110BBA9020205)	2026-04-02 12:01:25.775415
884	5	equipment_created	554	Added Core Nexus1 (KNX111BBA80K1704)	2026-04-02 12:01:56.364288
885	5	equipment_created	555	Added Core Nexus1 (KNX111BBA8099604)	2026-04-02 12:02:22.373616
886	5	equipment_created	556	Added Core XR8 (KXR809BBA4015138)	2026-04-02 12:03:20.981278
887	5	equipment_created	557	Added Flysurfer Viron (271657090)	2026-04-02 12:04:15.588718
888	5	equipment_created	558	Added Flysurfer Viron (271647102)	2026-04-02 12:04:51.944619
889	5	equipment_created	559	Added Flysurfer Viron (221750658)	2026-04-02 12:05:15.805828
890	5	equipment_created	560	Added Duotone Evo (9010583142821)	2026-04-02 12:06:18.295057
891	5	equipment_created	561	Added Duotone Evo (9010583135625)	2026-04-02 12:06:47.639464
892	5	equipment_created	562	Added Duotone Evo (9010583135632)	2026-04-02 12:07:14.889481
893	5	equipment_created	563	Added Duotone Rebel SLS (9010583136479)	2026-04-02 12:07:45.729135
894	5	equipment_created	564	Added Duotone Evo (9010583135588)	2026-04-02 12:08:13.355526
895	5	equipment_created	565	Added Duotone Evo (SNADK22EV087568)	2026-04-02 12:08:38.360887
896	5	equipment_created	566	Added Duotone Evo (9010583135595)	2026-04-02 12:09:21.091483
897	5	equipment_updated	566	Updated Duotone Evo	2026-04-02 12:09:37.981596
898	5	equipment_created	567	Added Duotone Evo (9010583067902)	2026-04-02 12:10:02.858153
899	5	equipment_created	568	Added Duotone Evo (9010583067964)	2026-04-02 12:10:31.217606
900	5	equipment_created	569	Added Duotone Evo (SNGDK22EV060111)	2026-04-02 12:10:51.987316
901	5	equipment_created	570	Added Duotone Rebel SLS (9010583136370)	2026-04-02 12:11:14.61426
902	5	equipment_created	571	Added Duotone Rebel SLS (9010583136387)	2026-04-02 12:11:37.107092
903	5	equipment_created	572	Added Duotone Rebel SLS (9010583136486)	2026-04-02 12:12:00.712479
904	5	equipment_created	573	Added Duotone Rebel SLS (9010583136448)	2026-04-02 12:12:23.129911
905	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:43:56.355416
906	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:43:58.738439
907	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:44:00.044057
908	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:44:02.295209
909	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:44:03.88339
910	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:44:05.432062
911	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 6 → 7 (+1)	2026-04-02 12:44:07.158096
912	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 7 → 8 (+1)	2026-04-02 12:44:08.624243
913	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 8 → 9 (+1)	2026-04-02 12:44:10.124469
914	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:44:21.39851
915	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:44:23.516205
916	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:44:24.865332
917	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:44:26.138053
918	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:44:27.460611
919	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:44:29.044347
920	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:44:43.452574
921	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:44:45.137023
922	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:44:46.818396
923	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:44:48.219015
924	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:44:51.193462
925	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:44:52.136254
926	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 6 → 7 (+1)	2026-04-02 12:44:54.338272
927	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:45:02.731229
928	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:45:04.126523
929	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:45:05.238379
930	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:45:06.429778
931	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:45:07.645413
932	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:45:09.219302
933	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 6 → 7 (+1)	2026-04-02 12:45:10.734161
934	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:45:12.883875
935	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:45:15.169467
936	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:45:19.011821
937	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:45:20.597214
938	5	accessory_quantity_changed	\N	Impact Vest (XS) @ Tatajuba: 6 → 5 (-1)	2026-04-02 12:48:16.648582
939	5	accessory_quantity_changed	\N	Impact Vest (S) @ Tatajuba: 9 → 8 (-1)	2026-04-02 12:48:30.233576
940	5	accessory_quantity_changed	\N	Impact Vest (M) @ Tatajuba: 7 → 8 (+1)	2026-04-02 12:48:41.029927
941	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 7 → 6 (-1)	2026-04-02 12:48:53.603678
942	5	accessory_quantity_changed	\N	Impact Vest (L) @ Tatajuba: 6 → 5 (-1)	2026-04-02 12:48:56.164255
943	5	accessory_quantity_changed	\N	Impact Vest (XL) @ Tatajuba: 4 → 3 (-1)	2026-04-02 12:49:03.947401
944	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:52:05.467159
945	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:52:06.445237
946	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:52:08.377904
947	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:52:10.922944
948	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:52:13.085424
949	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:52:15.599889
950	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 6 → 7 (+1)	2026-04-02 12:52:17.443203
951	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 7 → 8 (+1)	2026-04-02 12:52:20.118405
952	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 8 → 9 (+1)	2026-04-02 12:52:21.709629
953	5	accessory_quantity_changed	\N	Seat Harness (XS) @ Tatajuba: 9 → 10 (+1)	2026-04-02 12:52:23.472014
954	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:52:33.718776
955	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:52:35.022441
956	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:52:36.198939
957	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:52:37.446006
958	5	accessory_quantity_changed	\N	Seat Harness (S) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:52:57.125832
959	5	accessory_quantity_changed	\N	Seat Harness (S) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:52:58.658584
960	5	accessory_quantity_changed	\N	Seat Harness (S) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:53:00.050641
961	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:53:12.505902
962	5	accessory_quantity_changed	\N	Seat Harness (M) @ Tatajuba: 5 → 6 (+1)	2026-04-02 12:53:13.913749
963	5	accessory_quantity_changed	\N	Seat Harness (L) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:53:24.168293
964	5	accessory_quantity_changed	\N	Seat Harness (L) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:53:25.611587
965	5	accessory_quantity_changed	\N	Seat Harness (L) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:53:26.710069
966	5	accessory_quantity_changed	\N	Seat Harness (L) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:53:28.184274
967	5	accessory_quantity_changed	\N	Waist Harness (XS) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:53:49.730858
968	5	accessory_quantity_changed	\N	Waist Harness (XS) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:53:51.350578
969	5	accessory_quantity_changed	\N	Waist Harness (S) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:54:00.991732
970	5	accessory_quantity_changed	\N	Waist Harness (S) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:54:02.563673
971	5	accessory_quantity_changed	\N	Waist Harness (S) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:54:04.137448
972	5	accessory_quantity_changed	\N	Waist Harness (M) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:54:13.578459
973	5	accessory_quantity_changed	\N	Waist Harness (M) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:54:15.188384
974	5	accessory_quantity_changed	\N	Waist Harness (M) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:54:16.801423
975	5	accessory_quantity_changed	\N	Waist Harness (M) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:54:18.313645
976	5	accessory_quantity_changed	\N	Waist Harness (L) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:54:22.645858
977	5	accessory_quantity_changed	\N	Waist Harness (L) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:54:24.233923
978	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:54:27.09071
979	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:54:28.876233
980	5	accessory_quantity_changed	\N	Waist Harness (XL) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:54:30.817644
981	5	accessory_quantity_changed	\N	Waist Harness (L) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:55:45.267436
982	5	accessory_quantity_changed	\N	Waist Harness (L) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:55:48.653555
983	5	accessory_quantity_changed	\N	Waist Harness (L) @ Tatajuba: 4 → 5 (+1)	2026-04-02 12:55:50.579776
984	5	accessory_quantity_changed	\N	Helmet (XS) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:56:10.000551
985	5	accessory_quantity_changed	\N	Helmet (XS) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:56:11.661043
986	5	accessory_quantity_changed	\N	Helmet (XS) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:56:13.246733
987	5	accessory_quantity_changed	\N	Helmet (S) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:56:15.764946
988	5	accessory_quantity_changed	\N	Helmet (S) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:56:17.323623
989	5	accessory_quantity_changed	\N	Helmet (S) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:56:18.87164
990	5	accessory_quantity_changed	\N	Helmet (M) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:56:21.306507
991	5	accessory_quantity_changed	\N	Helmet (M) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:56:22.810837
992	5	accessory_quantity_changed	\N	Helmet (M) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:56:24.467353
993	5	accessory_quantity_changed	\N	Helmet (L) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:56:26.734794
994	5	accessory_quantity_changed	\N	Helmet (L) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:56:28.362153
995	5	accessory_quantity_changed	\N	Helmet (L) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:56:29.898899
996	5	accessory_quantity_changed	\N	Helmet (XL) @ Tatajuba: 0 → 1 (+1)	2026-04-02 12:56:32.066363
997	5	accessory_quantity_changed	\N	Helmet (XL) @ Tatajuba: 1 → 2 (+1)	2026-04-02 12:56:33.708135
998	5	accessory_quantity_changed	\N	Helmet (XL) @ Tatajuba: 2 → 3 (+1)	2026-04-02 12:56:34.892272
999	5	accessory_quantity_changed	\N	Helmet (XL) @ Tatajuba: 3 → 4 (+1)	2026-04-02 12:56:36.767697
1000	5	accessory_quantity_changed	\N	Helmet (XL) @ Tatajuba: 4 → 3 (-1)	2026-04-02 12:56:39.701398
1001	5	transfer_confirmed	152	Transfer received · condition 3/5	2026-04-02 13:05:01.903758
1002	5	transfer_cancelled	\N	Cancelled transfer #82	2026-04-02 13:05:10.103979
1003	5	transfer_cancelled	\N	Cancelled transfer #90	2026-04-02 13:05:12.445337
1004	5	transfer_cancelled	\N	Cancelled transfer #100	2026-04-02 13:05:16.187874
1005	5	equipment_updated	37	Updated Core CORE XC 3.0	2026-04-02 13:06:37.804092
1006	10	user_login	\N	Osvaldo Mateus logged in	2026-04-02 13:08:59.962103
1007	5	equipment_updated	36	Updated Core CORE XC 5.0	2026-04-02 13:09:36.082042
1008	5	equipment_updated	35	Updated Core CORE XC 7.0	2026-04-02 13:10:09.316967
1009	5	equipment_updated	35	Updated Core CORE XC 7.0	2026-04-02 13:10:14.61962
1010	10	user_login	\N	Osvaldo Mateus logged in	2026-04-02 15:22:45.336849
1011	10	inventory_check_started	\N	Started inventory check at Tatajuba (26 items)	2026-04-10 10:54:46.129902
1012	1	user_login	\N	York logged in	2026-04-14 14:05:38.730428
1013	10	transfer_confirmed	547	Transfer received · condition 4/5	2026-04-18 00:32:24.091891
1014	10	user_login	\N	Osvaldo Mateus logged in	2026-04-18 00:32:34.53458
1015	10	condition_rated	547	Rated condition: 5/5	2026-04-18 00:34:46.691949
\.


--
-- Data for Name: cash_register_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cash_register_entries (id, school_config_id, date, opening_balance, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_settings (id, company_name, address, registry, tax_id, vat_id, managing_director, phone, website, bank_name, iban, bic, account_holder, logo_url, paypal_email, invoice_prefix, invoice_next_number, invoice_year) FROM stdin;
1	KiteWorldWide GmbH	Steindamm 97, D-20099 Hamburg	Amtsgericht Hamburg, HRB 105108	46/736/04728	DE259606444	York Neumann	+49 40 2093 45090	www.kiteworldwide.com	Commerzbank	DE69 2004 0000 0898 2100 00	COBADEFFXXX	KiteWorldWide GmbH	\N	\N	Inv-KWS	1002	2026
\.


--
-- Data for Name: condition_ratings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.condition_ratings (id, equipment_id, rating, rated_by, rated_at, notes) FROM stdin;
126	93	4	5	2026-04-02 07:03:22.409043	\N
127	94	4	5	2026-04-02 07:03:41.453491	\N
5	462	3	5	2026-03-12 08:48:54.926243	\N
6	425	4	5	2026-03-12 11:13:29.710951	\N
7	401	3	5	2026-03-12 11:21:46.616204	Needs new rubber bands
8	397	3	5	2026-03-12 11:22:46.50265	Needs new rubber bands
9	272	3	5	2026-03-12 11:23:42.152752	\N
10	321	3	5	2026-03-12 11:24:47.758844	\N
11	353	4	5	2026-03-12 11:35:26.108168	\N
12	140	4	5	2026-03-12 11:45:42.381476	\N
13	243	3	5	2026-03-12 11:47:48.431184	\N
14	425	4	5	2026-03-12 11:49:27.055782	\N
15	395	4	5	2026-03-12 11:50:45.024545	Needs new rubber bands
16	375	3	5	2026-03-12 11:54:04.827353	\N
17	372	4	5	2026-03-12 13:12:54.594245	\N
18	72	3	5	2026-03-12 13:17:48.357513	\N
19	360	4	5	2026-03-12 13:20:58.44395	\N
20	71	4	5	2026-03-12 13:38:30.748462	\N
21	428	4	5	2026-03-12 13:53:30.66047	\N
22	420	4	5	2026-03-12 13:54:37.44944	\N
23	240	3	5	2026-03-12 13:55:17.083711	\N
24	241	3	5	2026-03-12 13:57:13.563733	\N
25	449	4	5	2026-03-12 13:59:30.913576	\N
26	152	2	5	2026-03-12 15:23:34.788178	\N
27	38	2	5	2026-03-18 08:27:09.080175	\N
28	366	2	5	2026-03-18 08:28:41.935797	\N
29	367	2	5	2026-03-18 08:29:07.001232	\N
30	114	2	5	2026-03-18 08:29:31.411127	\N
31	42	2	5	2026-03-18 08:29:48.575948	\N
32	337	1	5	2026-03-18 08:30:20.902273	Fabric Ripped completly (left side of the Center Strut)
33	341	2	5	2026-03-18 08:31:34.283207	ripped whole fabrica and fixed big patches lines can be replaced
34	53	3	5	2026-03-18 08:32:11.383482	New leeding edge bladder needed
35	344	1	5	2026-03-18 08:32:37.831312	Fabric Ripped completly (left side of the Center Strut)
37	120	2	5	2026-03-18 08:33:48.184817	big patches front tube 2.3 micro patches
38	81	2	5	2026-03-18 08:34:19.123954	BEEN REPAIRED MANY TIMES  PULL TO THE RIGHT SIDE
39	379	4	5	2026-03-18 08:34:39.636929	\N
40	390	4	5	2026-03-18 08:34:54.955201	\N
41	377	4	5	2026-03-18 08:35:09.929485	\N
42	348	3	5	2026-03-18 08:35:31.900865	\N
43	350	3	5	2026-03-18 08:35:46.992138	\N
44	350	3	5	2026-03-18 08:36:02.580793	small patche on front tube and small patche on kite lines can be replaced
45	351	3	5	2026-03-18 08:36:27.488341	\N
46	373	4	5	2026-03-18 08:36:46.249261	\N
47	89	1	5	2026-03-18 08:37:23.583446	\N
48	89	1	5	2026-03-18 08:37:42.371624	BROKES BY LENNARD FRITZ
49	87	4	5	2026-03-18 08:38:05.166434	\N
50	41	4	5	2026-03-18 08:38:22.712225	\N
51	77	4	5	2026-03-18 08:39:50.003195	\N
52	76	3	5	2026-03-18 08:40:47.178416	\N
53	76	3	5	2026-03-18 08:40:55.05203	\N
54	128	4	5	2026-03-18 08:41:27.308773	\N
55	356	3	5	2026-03-18 08:41:44.080714	\N
56	359	1	5	2026-03-18 08:54:28.091129	Fabric Ripped completly (left side of the Center Strut)
57	355	2	5	2026-03-18 08:54:53.627494	Strut 2 RH damaged, Cut Front Tube
58	357	3	5	2026-03-18 08:55:15.135486	\N
59	97	4	5	2026-03-18 08:55:32.260206	\N
60	374	4	5	2026-03-18 08:55:46.998782	\N
61	371	4	5	2026-03-18 08:56:02.309405	\N
62	369	4	5	2026-03-18 08:56:17.877325	\N
63	40	4	5	2026-03-18 08:56:35.429742	\N
64	141	3	5	2026-03-18 08:57:00.727542	\N
66	147	4	5	2026-03-18 08:57:49.00539	\N
69	382	4	5	2026-03-18 09:06:30.525172	\N
70	392	4	5	2026-03-18 09:06:58.822282	\N
71	393	4	5	2026-03-18 09:07:16.439098	\N
72	49	3	5	2026-03-18 09:07:36.57164	\N
73	51	4	5	2026-03-18 09:07:53.657093	\N
74	48	4	5	2026-03-18 09:08:10.628675	\N
75	52	3	5	2026-03-18 09:08:26.475191	\N
76	50	4	5	2026-03-18 09:08:43.586169	\N
78	30	4	5	2026-03-18 09:09:38.911474	\N
79	265	2	5	2026-03-18 09:32:14.863415	\N
80	277	2	5	2026-03-18 09:32:32.278389	\N
81	279	2	5	2026-03-18 09:32:50.51978	\N
82	281	2	5	2026-03-18 09:33:09.941973	\N
83	329	3	5	2026-03-18 09:33:47.784367	\N
84	306	2	5	2026-03-18 09:34:31.091139	\N
85	324	2	5	2026-03-18 09:34:49.803182	\N
86	264	1	5	2026-03-18 09:35:09.144353	\N
87	323	1	5	2026-03-18 09:35:23.76197	\N
88	312	4	5	2026-03-18 09:35:45.428783	\N
89	283	5	5	2026-03-18 09:36:19.625937	\N
90	317	5	5	2026-03-18 09:36:45.176676	\N
91	296	5	5	2026-03-18 09:37:01.488812	\N
92	310	4	5	2026-03-18 09:37:17.337443	\N
93	413	4	5	2026-03-18 09:37:41.698865	\N
94	404	3	5	2026-03-18 09:37:58.782844	\N
95	412	4	5	2026-03-18 09:38:20.195564	\N
96	394	4	5	2026-03-18 09:38:37.038747	\N
97	396	4	5	2026-03-18 09:38:54.165489	\N
98	409	4	5	2026-03-18 09:39:13.495728	\N
99	410	4	5	2026-03-18 09:39:37.063938	\N
100	67	4	5	2026-03-19 07:48:49.022621	\N
101	39	4	5	2026-03-19 07:49:11.015514	\N
102	498	4	5	2026-03-19 08:07:15.003616	\N
103	494	4	5	2026-03-19 08:10:19.121934	\N
104	248	4	5	2026-03-19 11:20:49.285676	\N
105	231	4	5	2026-03-19 11:46:06.058999	\N
106	238	4	5	2026-03-19 11:46:35.820089	\N
107	41	4	5	2026-03-20 11:27:55.707223	\N
108	332	3	5	2026-03-23 09:26:47.533094	\N
109	362	4	5	2026-03-23 11:24:54.960854	\N
110	322	3	5	2026-03-24 11:20:06.784531	\N
111	268	3	5	2026-03-24 11:20:26.726541	\N
112	542	3	5	2026-03-24 11:23:54.029497	\N
113	318	3	5	2026-03-27 09:08:25.282999	\N
114	262	2	5	2026-03-27 09:09:28.19414	\N
115	325	3	5	2026-03-27 09:10:03.864728	\N
116	290	2	5	2026-03-27 09:10:32.37131	\N
117	298	3	5	2026-03-27 09:11:27.553253	\N
118	327	2	5	2026-03-27 09:12:35.885725	\N
119	342	3	5	2026-04-02 06:46:42.958774	\N
120	364	1	5	2026-04-02 06:55:46.282207	\N
121	364	5	5	2026-04-02 06:56:18.956763	\N
122	365	4	5	2026-04-02 06:56:37.380104	\N
123	151	4	5	2026-04-02 06:57:04.071498	\N
124	151	3	5	2026-04-02 06:57:11.079911	\N
125	82	3	5	2026-04-02 07:02:51.870261	\N
128	95	2	5	2026-04-02 07:04:10.924671	\N
129	96	4	5	2026-04-02 07:04:32.626213	\N
130	78	4	5	2026-04-02 07:04:51.885843	\N
131	80	4	5	2026-04-02 07:05:16.71213	\N
132	84	2	5	2026-04-02 07:05:40.450706	\N
133	529	5	5	2026-04-02 07:07:09.779504	\N
134	532	3	5	2026-04-02 07:08:26.698145	\N
135	545	3	5	2026-04-02 07:12:44.583816	\N
136	546	3	5	2026-04-02 07:13:00.911222	\N
137	547	3	5	2026-04-02 07:13:14.484254	\N
138	99	3	5	2026-04-02 07:14:02.922747	\N
139	335	2	5	2026-04-02 07:14:20.495836	\N
140	334	2	5	2026-04-02 07:14:39.533765	\N
141	339	3	5	2026-04-02 07:14:56.924034	\N
142	107	4	5	2026-04-02 07:16:41.956989	\N
143	109	4	5	2026-04-02 07:16:58.743416	\N
144	111	4	5	2026-04-02 07:17:20.579462	\N
145	110	4	5	2026-04-02 07:18:22.969099	\N
146	113	4	5	2026-04-02 07:18:39.768094	\N
147	118	3	5	2026-04-02 07:19:14.348563	\N
148	122	3	5	2026-04-02 07:19:36.050027	\N
149	336	3	5	2026-04-02 11:49:10.728589	\N
150	338	3	5	2026-04-02 11:49:44.889769	\N
151	349	3	5	2026-04-02 11:55:02.667418	\N
152	548	3	5	2026-04-02 11:55:57.068724	\N
153	547	5	10	2026-04-18 00:34:46.60818	\N
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, company_name, address, email, tax_id, created_at) FROM stdin;
1	Timo Erdmann	KiteWorldWide GmbH	Steindamm\n97	timo.e@kiteworldwide.com	\N	2026-03-04 08:55:30.330136
\.


--
-- Data for Name: damage_report_photos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.damage_report_photos (id, damage_report_id, url, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: damage_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.damage_reports (id, equipment_id, reported_by, reported_at, how_it_happened, customer_name, booking_reference, usage_type, customer_insured, repairable, total_loss, can_repair_on_site, needs_spare_parts, spare_parts_needed, station_id, status, admin_notified, repair_id, estimated_repair_cost, estimated_value_loss) FROM stdin;
1	283	8	2026-03-24 14:17:05.515096	Safety Leine core Bar 3s gerissen	Carmen Rütimann	141964	lesson	f	t	f	t	t	Neue Safety Leine Core 3S	1	open	t	4	\N	\N
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.equipment (id, serial_number, type, brand, model, year_of_purchase, current_station_id, status, condition_rating, last_inspection_date, notes, purchase_price, current_value, sale_price, type_specific_fields, created_at, sku, invoice_id, invoice_reference, purchase_date, price_list_id) FROM stdin;
155	AUTO-KITE-1773166563303	board	Core	DELUXE Freeride 2 157x46	2022	\N	active	5	\N	\N	219.45	219.45	\N	{"size": "157", "color": ""}	2026-03-10 18:16:03.321722	SBOBDFR215746N	22	IN722118	2022-03-02 00:00:00	2
368	15803	kite	Eleveight	Eleveight OS V4 10 m	2023	\N	active	5	\N	\N	525.06	525.06	\N	{"size": "10", "color": ""}	2026-03-11 07:54:59.473812	9894076	26	137742	2022-08-17 00:00:00	\N
370	15837	kite	Eleveight	Eleveight OS V4 12 m	2023	\N	active	5	\N	\N	566.42	566.42	\N	{"size": "12", "color": ""}	2026-03-11 07:54:59.570536	9894077	26	137742	2022-08-17 00:00:00	\N
134	KNX312BBA1127212	kite	Core	CORE Nexus 3 12.0 black/black	2022	4	active	4	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.164055	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
372	15930	kite	Eleveight	Eleveight OS V4 14 m	2023	4	active	4	2026-03-12 13:12:54.627	\N	607.49	607.49	\N	{"size": "14", "color": ""}	2026-03-11 07:54:59.662532	9894078	26	137742	2022-08-17 00:00:00	\N
34	KNX406BBA3117521	kite	Core	CORE Nexus 4 6.0 black/black	2024	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "6.0", "color": ""}	2026-03-10 18:08:02.756371	KNX406BBN	4	IN748777	2024-07-18 00:00:00	2
397	02842	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	4	active	3	2026-03-12 11:22:46.534	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.836991	9891420	27	135193	2022-04-11 00:00:00	\N
414	2111033	board	Eleveight	Eleveight Process V6 132 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "132", "color": ""}	2026-03-11 07:56:15.659404	9893976	28	134725	2022-03-17 00:00:00	\N
375	15894	kite	Eleveight	Eleveight OS V4 14 m	2023	4	active	3	2026-03-12 11:54:04.859	\N	564.10	564.10	\N	{"size": "14", "color": ""}	2026-03-11 07:54:59.801066	9894078	26	137742	2022-08-17 00:00:00	\N
72	KXR715BBA2046114	kite	Core	CORE XR7 15.0 black/black	2022	4	active	3	2026-03-12 13:17:48.396	\N	873.95	873.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:12:54.832597	KXR715BBN	14	IN725520	2022-06-22 00:00:00	2
31	RSS3PB82278M50	bar_lines	Core	CORE Sensor 3S Pro	2024	\N	active	5	\N	\N	345.95	345.95	\N	{"size": "", "color": ""}	2026-03-10 18:07:48.180237	RSS3PRN	3	IN749010	2024-07-25 00:00:00	2
32	KXR811WBA3125367	kite	Core	CORE XR8 11.0 white/black	2024	\N	active	5	\N	\N	884.95	884.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:07:48.229638	KXR811WBN	3	IN749010	2024-07-25 00:00:00	2
33	KXR807WBA4017438	kite	Core	CORE XR8 7.0 white/black	2024	\N	active	5	\N	\N	763.95	763.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:07:48.278385	KXR807WBN	3	IN749010	2024-07-25 00:00:00	2
43	RSS3SB80598M16	bar_lines	Core	CORE Sensor 3S	2024	\N	active	5	\N	\N	307.45	307.45	\N	{"size": "", "color": ""}	2026-03-10 18:09:22.356486	RSS3SRN	6	IN746231	2024-05-03 00:00:00	2
44	RSS3SB79478M01	bar_lines	Core	CORE Sensor 3S	2024	\N	active	5	\N	\N	307.45	307.45	\N	{"size": "", "color": ""}	2026-03-10 18:09:22.403805	RSS3SRN	6	IN746231	2024-05-03 00:00:00	2
486	1571708467	board	Core	DELUXE Freeride 2 - board only	2026	1	active	5	\N	\N	252.45	252.45	\N	{"size": "157", "color": ""}	2026-03-12 15:08:11.066336	BOBDFR215746N	29	RE/2026/01118	2026-03-02 00:00:00	2
462	KXR606BBA9126597	kite	Core	XR6	2021	4	active	3	2026-03-12 08:48:54.957	\N	\N	\N	\N	{"size": "6", "color": "Black"}	2026-03-12 08:47:52.390013	\N	\N	\N	\N	\N
41	KNX411WBA3116681	kite	Core	CORE Nexus 4 11.0 white/black	2024	1	active	4	2026-03-20 11:27:55.741	\N	868.45	868.45	\N	{"size": "11.0", "color": ""}	2026-03-10 18:08:20.973553	KNX411WBN	5	IN747170	2024-06-04 00:00:00	2
371	15875	kite	Eleveight	Eleveight OS V4 12 m	2023	1	active	5	2026-03-18 08:56:02.337	\N	566.42	566.42	\N	{"size": "12", "color": ""}	2026-03-11 07:54:59.616237	9894077	26	137742	2022-08-17 00:00:00	\N
374	15838	kite	Eleveight	Eleveight OS V4 12 m	2023	1	active	4	2026-03-18 08:55:47.026	\N	525.96	525.96	\N	{"size": "12", "color": ""}	2026-03-11 07:54:59.755673	9894077	26	137742	2022-08-17 00:00:00	\N
362	KGS6135BBA1042052	kite	Core	GTS6	2022	1	active	3	2026-03-23 11:24:54.995	\N	685.92	685.92	\N	{"size": "13.5", "color": "Black"}	2026-03-10 18:17:18.97466	KGS6135BBN	\N	\N	2022-02-15 00:00:00	2
40	KNX4135WBA3111391	kite	Core	CORE Nexus 4 13.5 white/black	2024	1	active	4	2026-03-18 08:56:35.459	\N	928.95	928.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:08:20.92935	KNX4135WBN	5	IN747170	2024-06-04 00:00:00	2
30	KNX415BBA4058192	kite	Core	CORE Nexus 4 15.0 black/black	2024	1	active	4	2026-03-18 09:09:38.944	\N	994.95	994.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:07:16.005612	KNX415BBN	2	IN750162	2024-08-23 00:00:00	2
463	KXR605BBA9122397	kite	Core	XR6	2021	4	active	4	\N	\N	\N	\N	\N	{"size": "5", "color": "Black"}	2026-03-12 08:58:40.435603	\N	\N	\N	\N	\N
469	FKVI30S04-4618-58556	kite	Flysurfer	Viron	2020	4	active	4	\N	\N	\N	\N	\N	{"size": "4"}	2026-03-12 13:47:18.433694	\N	\N	\N	\N	\N
474	1491706023	board	Core	Deluxe	2020	4	active	3	\N	\N	\N	\N	\N	{"size": "149", "boardType": "TwinTip"}	2026-03-12 14:01:39.423894	\N	\N	\N	\N	\N
480	KPC107BBA5077162	kite	Core	Pace	2026	1	active	5	\N	\N	780.45	780.45	\N	{"size": "7.0", "color": "Black/Black"}	2026-03-12 15:08:10.775654	KPC107BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
481	KPC108BBB5095663	kite	Core	Pace	2026	1	active	5	\N	\N	796.95	796.95	\N	{"size": "8.0", "color": "Black/Black"}	2026-03-12 15:08:10.823165	KPC108BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
482	KPC108BBB5095463	kite	Core	Pace	2026	1	active	5	\N	\N	796.95	796.95	\N	{"size": "8.0", "color": "Black/Black"}	2026-03-12 15:08:10.873533	KPC108BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
479	KPC107BBA5075262	kite	Core	Pace	2026	1	active	5	\N	\N	780.45	780.45	\N	{"size": "7.0", "color": "Black/Black"}	2026-03-12 15:08:10.72709	KPC107BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
483	KPC109BBA5072782	kite	Core	Pace	2026	1	active	5	\N	\N	818.95	818.95	\N	{"size": "9.0", "color": "Black/Black"}	2026-03-12 15:08:10.921263	KPC109BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
36	WXC150BBA2067731	wing	Core	CORE XC 5.0	2024	1	active	4	\N	\N	433.95	433.95	\N	{}	2026-03-10 18:08:20.750384	WXC150BBN	5	IN747170	2024-06-04 00:00:00	2
35	WXC170BBA2094183	wing	Core	CORE XC 7.0	2024	1	active	4	\N	\N	477.95	477.95	\N	{"size": "7.0"}	2026-03-10 18:08:20.704814	WXC170BBN	5	IN747170	2024-06-04 00:00:00	2
39	KNX415WBA3115491	kite	Core	CORE Nexus 4 15.0 white/black	2024	1	active	4	2026-03-19 07:49:11.043	\N	994.95	994.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:08:20.88499	KNX415WBN	5	IN747170	2024-06-04 00:00:00	2
369	15824	kite	Eleveight	Eleveight OS V4 12 m	2023	1	active	4	2026-03-18 08:56:17.905	\N	566.42	566.42	\N	{"size": "12", "color": ""}	2026-03-11 07:54:59.524377	9894077	26	137742	2022-08-17 00:00:00	\N
373	15763	kite	Eleveight	Eleveight OS V4 10 m	2023	1	active	4	2026-03-18 08:36:46.281	\N	487.56	487.56	\N	{"size": "10", "color": ""}	2026-03-11 07:54:59.709651	9894076	26	137742	2022-08-17 00:00:00	\N
485	1571706241	board	Core	DELUXE Freeride 2 - board only	2026	1	active	5	\N	\N	252.45	252.45	\N	{"size": "157", "color": ""}	2026-03-12 15:08:11.017593	BOBDFR215746N	29	RE/2026/01118	2026-03-02 00:00:00	2
484	KPC110BBB5094804	kite	Core	Pace	2026	1	active	5	\N	\N	857.45	857.45	\N	{"size": "10.0", "color": "Black/Black"}	2026-03-12 15:08:10.968382	KPC110BBN	29	RE/2026/01118	2026-03-02 00:00:00	2
37	WXC130BBA2091902	wing	Core	CORE XC 3.0	2024	1	active	4	\N	\N	378.95	378.95	\N	{}	2026-03-10 18:08:20.79528	WXC130BBN	5	IN747170	2024-06-04 00:00:00	2
45	RSS3SB80170M09	bar_lines	Core	CORE Sensor 3S	2024	\N	active	5	\N	\N	307.45	307.45	\N	{"size": "", "color": ""}	2026-03-10 18:09:22.450876	RSS3SRN	6	IN746231	2024-05-03 00:00:00	2
46	RSS3SB80244M12	bar_lines	Core	CORE Sensor 3S	2024	\N	active	5	\N	\N	307.45	307.45	\N	{"size": "", "color": ""}	2026-03-10 18:09:22.497988	RSS3SRN	6	IN746231	2024-05-03 00:00:00	2
47	RSS3SB79965M08	bar_lines	Core	CORE Sensor 3S	2024	\N	active	5	\N	\N	307.45	307.45	\N	{"size": "", "color": ""}	2026-03-10 18:09:22.545021	RSS3SRN	6	IN746231	2024-05-03 00:00:00	2
376	12017	kite	Eleveight	Eleveight RS V6 9 m	2023	\N	active	5	\N	\N	545.88	545.88	\N	{"size": "9", "color": "blue"}	2026-03-11 07:55:45.819134	9894030	27	135193	2022-04-11 00:00:00	\N
54	WXC145BBA2069501	kite	Core	CORE XC 4.5	2023	\N	active	5	\N	\N	400.95	400.95	\N	{"size": "4.5", "color": ""}	2026-03-10 18:11:15.589715	WXC145BBN	8	IN735057	2023-06-12 00:00:00	2
55	RSS3PA76455L32	bar_lines	Core	CORE Sensor 3S Pro	2023	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-10 18:11:15.635916	RSS3PRN	8	IN735057	2023-06-12 00:00:00	2
56	BOWBRMR190112195	kite	Core	CORE Wingboard ROAMER 90 l	2023	\N	active	5	\N	\N	741.95	741.95	\N	{"size": "90", "color": ""}	2026-03-10 18:11:15.681962	BOWBROAMER190N	8	IN735057	2023-06-12 00:00:00	2
57	WXC155BBA2099153	kite	Core	CORE XC 5.5	2023	\N	active	5	\N	\N	428.45	428.45	\N	{"size": "5.5", "color": ""}	2026-03-10 18:11:15.728346	WXC155BBN	8	IN735057	2023-06-12 00:00:00	2
58	WXC140BBA2095032	kite	Core	CORE XC 4.0	2023	\N	active	5	\N	\N	389.95	389.95	\N	{"size": "4.0", "color": ""}	2026-03-10 18:11:15.775092	WXC140BBN	8	IN735057	2023-06-12 00:00:00	2
59	WXC135BBA2092043	kite	Core	CORE XC 3.5	2023	\N	active	5	\N	\N	373.45	373.45	\N	{"size": "3.5", "color": ""}	2026-03-10 18:11:15.82102	WXC135BBN	8	IN735057	2023-06-12 00:00:00	2
60	WXC145BBA2096832	kite	Core	CORE XC 4.5	2023	\N	active	5	\N	\N	400.95	400.95	\N	{"size": "4.5", "color": ""}	2026-03-10 18:11:38.089771	WXC145BBN	9	IN734363	2023-05-17 00:00:00	2
61	WXC160BBA2063761	kite	Core	CORE XC 6.0	2023	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "6.0", "color": ""}	2026-03-10 18:11:59.512297	WXC160BBN	10	IN733830	2023-05-02 00:00:00	2
62	WXC170BBA2065691	kite	Core	CORE XC 7.0	2023	\N	active	5	\N	\N	455.95	455.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:11:59.559019	WXC170BBN	10	IN733830	2023-05-02 00:00:00	2
63	KXR712WBA2080636	kite	Core	CORE XR7 12.0 white/black	2023	\N	active	5	\N	\N	851.95	851.95	\N	{"size": "12.0", "color": ""}	2026-03-10 18:12:12.389143	KXR712WBN	11	IN732519	2023-02-20 00:00:00	2
378	12073	kite	Eleveight	Eleveight RS V6 9 m	2023	\N	active	5	\N	\N	545.88	545.88	\N	{"size": "9", "color": "red"}	2026-03-11 07:55:45.9142	9894031	27	135193	2022-04-11 00:00:00	\N
65	KXR707BBA2089496	kite	Core	CORE XR7 7.0 black/black	2022	\N	active	5	\N	\N	779.40	779.40	\N	{"size": "7.0", "color": ""}	2026-03-10 18:12:41.942386	KXR707BBN	13	IN731701	2022-12-20 00:00:00	2
66	RSS3PA74526L29	bar_lines	Core	CORE Sensor 3S Pro	2022	\N	active	5	\N	\N	359.40	359.40	\N	{"size": "", "color": ""}	2026-03-10 18:12:41.987461	RSS3PRN	13	IN731701	2022-12-20 00:00:00	2
68	KXR7135BBA2045604	kite	Core	CORE XR7 13.5 black/black	2022	\N	active	5	\N	\N	813.45	813.45	\N	{"size": "13.5", "color": ""}	2026-03-10 18:12:54.648182	KXR7135BBN	14	IN725520	2022-06-22 00:00:00	2
69	KXR7135BBA2041593	kite	Core	CORE XR7 13.5 black/black	2022	\N	active	5	\N	\N	813.45	813.45	\N	{"size": "13.5", "color": ""}	2026-03-10 18:12:54.694087	KXR7135BBN	14	IN725520	2022-06-22 00:00:00	2
70	KXR7135BBA2042404	kite	Core	CORE XR7 13.5 black/black	2022	\N	active	5	\N	\N	813.45	813.45	\N	{"size": "13.5", "color": ""}	2026-03-10 18:12:54.739232	KXR7135BBN	14	IN725520	2022-06-22 00:00:00	2
73	KXR715BBA2049704	kite	Core	CORE XR7 15.0 black/black	2022	\N	active	5	\N	\N	873.95	873.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:12:54.87832	KXR715BBN	14	IN725520	2022-06-22 00:00:00	2
74	KXR715BBA2048024	kite	Core	CORE XR7 15.0 black/black	2022	\N	active	5	\N	\N	873.95	873.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:12:54.924202	KXR715BBN	14	IN725520	2022-06-22 00:00:00	2
79	KXR709BBA2038900	kite	Core	CORE XR7 9.0 black/black	2022	\N	active	5	\N	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:13:42.942488	KXR709BBN	16	IN724301	2022-05-24 00:00:00	2
380	12179	kite	Eleveight	Eleveight RS V6 9 m	2023	\N	active	5	\N	\N	545.88	545.88	\N	{"size": "9", "color": "dark green"}	2026-03-11 07:55:46.00935	9894032	27	135193	2022-04-11 00:00:00	\N
83	KXR707BBA2031211	kite	Core	CORE XR7 7.0 black/black	2022	\N	active	5	\N	\N	615.45	615.45	\N	{"size": "7.0", "color": ""}	2026-03-10 18:13:55.741271	KXR707BBN	17	IN724093	2022-05-19 00:00:00	2
52	KXR812BBA3015833	kite	Core	CORE XR8 12.0 black/black	2023	1	active	3	2026-03-18 09:08:26.508	\N	862.95	862.95	\N	{"size": "12.0", "color": ""}	2026-03-10 18:09:41.570845	KXR812BBN	7	IN742622	2023-12-05 00:00:00	2
77	KXR711BBA2038342	kite	Core	CORE XR7 11.0 black/black	2022	4	active	4	2026-03-18 08:39:50.033	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:13:28.494438	KXR711BBN	15	IN724450	2022-05-30 00:00:00	2
81	KXR709BBA2039000	kite	Core	CORE XR7 9.0 black/black	2022	1	active	3	2026-03-18 08:34:19.154	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:13:43.034286	KXR709BBN	16	IN724301	2022-05-24 00:00:00	2
379	12913	kite	Eleveight	Eleveight RS V6 9 m	2023	1	active	4	2026-03-18 08:34:39.666	\N	545.88	545.88	\N	{"size": "9", "color": "red"}	2026-03-11 07:55:45.960936	9894031	27	135193	2022-04-11 00:00:00	\N
49	KXR810BBA4016788	kite	Core	CORE XR8 10.0 black/black	2024	1	active	3	2026-03-18 09:07:36.6	\N	835.45	835.45	\N	{"size": "10.0", "color": ""}	2026-03-10 18:09:22.653919	KXR810BBN	6	IN746231	2024-05-03 00:00:00	2
67	KXR7135BBA2044204	kite	Core	CORE XR7 13.5 black/black	2022	1	active	3	2026-03-19 07:48:49.05	\N	813.45	813.45	\N	{"size": "13.5", "color": ""}	2026-03-10 18:12:54.602344	KXR7135BBN	14	IN725520	2022-06-22 00:00:00	2
76	KXR711BBA2030142	kite	Core	CORE XR7 11.0 black/black	2022	1	active	4	2026-03-18 08:40:55.078	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:13:28.448078	KXR711BBN	15	IN724450	2022-05-30 00:00:00	2
377	12723	kite	Eleveight	Eleveight RS V6 9 m	2023	1	active	4	2026-03-18 08:35:09.959	\N	545.88	545.88	\N	{"size": "9", "color": "blue"}	2026-03-11 07:55:45.867724	9894030	27	135193	2022-04-11 00:00:00	\N
48	KXR811BBA3093626	kite	Core	CORE XR8 11.0 black/black	2024	1	active	3	2026-03-18 09:08:10.658	\N	884.95	884.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:09:22.606658	KXR811BBN	6	IN746231	2024-05-03 00:00:00	2
82	KXR707BBA2034231	kite	Core	CORE XR7 7.0 black/black	2022	\N	in_transfer	3	2026-04-02 07:02:51.901	\N	615.45	615.45	\N	{"size": "7.0", "color": ""}	2026-03-10 18:13:55.694933	KXR707BBN	17	IN724093	2022-05-19 00:00:00	2
80	KXR709BBA2036020	kite	Core	CORE XR7 9.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:05:16.743	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:13:42.988721	KXR709BBN	16	IN724301	2022-05-24 00:00:00	2
84	KXR707BBA2034031	kite	Core	CORE XR7 7.0 black/black	2022	\N	in_transfer	2	2026-04-02 07:05:40.486	\N	615.45	615.45	\N	{"size": "7.0", "color": ""}	2026-03-10 18:13:55.786625	KXR707BBN	17	IN724093	2022-05-19 00:00:00	2
85	KXR707BBA2038211	kite	Core	CORE XR7 7.0 black/black	2022	\N	active	5	\N	\N	615.45	615.45	\N	{"size": "7.0", "color": ""}	2026-03-10 18:13:55.83233	KXR707BBN	17	IN724093	2022-05-19 00:00:00	2
86	KXR710BBA2038961	kite	Core	CORE XR7 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:13:55.87795	KXR710BBN	17	IN724093	2022-05-19 00:00:00	2
88	KXR710BBA2039161	kite	Core	CORE XR7 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:13:55.969606	KXR710BBN	17	IN724093	2022-05-19 00:00:00	2
381	13428	kite	Eleveight	Eleveight RS V6 12 m	2023	\N	active	5	\N	\N	615.71	615.71	\N	{"size": "12", "color": "red"}	2026-03-11 07:55:46.067056	9894037	27	135193	2022-04-11 00:00:00	\N
383	10839	kite	Eleveight	Eleveight RS V6 14 m	2023	\N	active	5	\N	\N	656.78	656.78	\N	{"size": "14", "color": "dark green"}	2026-03-11 07:55:46.160055	9894041	27	135193	2022-04-11 00:00:00	\N
98	KXR712BBA2036130	kite	Core	CORE XR7 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:14:09.854829	KXR712BBN	18	IN723678	2022-05-05 00:00:00	2
101	RSE3WE60497K23	bar_lines	Core	CORE Sensor 3 Pro Wake Control Bar	2022	\N	active	5	\N	\N	334.95	334.95	\N	{"size": "3", "color": ""}	2026-03-10 18:14:29.545402	RSE3WN	19	IN723226	2022-04-26 00:00:00	2
102	RSE3WE60463K23	bar_lines	Core	CORE Sensor 3 Pro Wake Control Bar	2022	\N	active	5	\N	\N	334.95	334.95	\N	{"size": "3", "color": ""}	2026-03-10 18:14:29.59125	RSE3WN	19	IN723226	2022-04-26 00:00:00	2
104	RSE3PE69620L01	bar_lines	Core	CORE Sensor 3 Pro Control Bar	2022	\N	active	5	\N	\N	312.95	312.95	\N	{"size": "3", "color": ""}	2026-03-10 18:14:40.575554	RSE3PN	20	IN722896	2022-04-11 00:00:00	2
384	10724	kite	Eleveight	Eleveight RS V6 14 m	2023	\N	active	5	\N	\N	656.78	656.78	\N	{"size": "14", "color": "blue"}	2026-03-11 07:55:46.206681	9894039	27	135193	2022-04-11 00:00:00	\N
385	10726	kite	Eleveight	Eleveight RS V6 14 m	2023	\N	active	5	\N	\N	656.78	656.78	\N	{"size": "14", "color": "blue"}	2026-03-11 07:55:46.253652	9894039	27	135193	2022-04-11 00:00:00	\N
386	10766	kite	Eleveight	Eleveight RS V6 14 m	2023	\N	active	5	\N	\N	656.78	656.78	\N	{"size": "14", "color": "red"}	2026-03-11 07:55:46.301562	9894040	27	135193	2022-04-11 00:00:00	\N
387	12541	kite	Eleveight	Eleveight RS V6 17 m	2023	\N	active	5	\N	\N	710.18	710.18	\N	{"size": "17", "color": "dark green"}	2026-03-11 07:55:46.348918	9894044	27	135193	2022-04-11 00:00:00	\N
388	12555	kite	Eleveight	Eleveight RS V6 17 m	2023	\N	active	5	\N	\N	710.18	710.18	\N	{"size": "17", "color": "dark green"}	2026-03-11 07:55:46.402564	9894044	27	135193	2022-04-11 00:00:00	\N
389	12505	kite	Eleveight	Eleveight RS V6 17 m	2023	\N	active	5	\N	\N	710.18	710.18	\N	{"size": "17", "color": "blue"}	2026-03-11 07:55:46.449547	9894042	27	135193	2022-04-11 00:00:00	\N
391	13416	kite	Eleveight	Eleveight RS V6 12 m	2023	\N	active	5	\N	\N	571.73	571.73	\N	{"size": "12", "color": "red"}	2026-03-11 07:55:46.543356	9894037	27	135193	2022-04-11 00:00:00	\N
103	X51332106006	board	Core	CORE Fusion 5 133x39	2022	\N	active	5	\N	\N	461.45	461.45	\N	{"size": "133", "color": ""}	2026-03-10 18:14:29.637467	BOBOF513339N	19	IN723226	2022-04-26 00:00:00	2
398	02856	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.885475	9891420	27	135193	2022-04-11 00:00:00	\N
395	02737	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	4	active	4	2026-03-12 11:50:45.055	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.74316	9891420	27	135193	2022-04-11 00:00:00	\N
100	KGS608WBA1043452	kite	Core	GTS6	2022	\N	active	5	\N	\N	659.45	659.45	\N	{"size": "8.0", "color": "Black / White"}	2026-03-10 18:14:29.499268	KGS608WBN	19	IN723226	2022-04-26 00:00:00	2
399	05624	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.932056	9891420	27	135193	2022-04-11 00:00:00	\N
400	05628	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.978619	9891420	27	135193	2022-04-11 00:00:00	\N
402	04120	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.071192	9891418	27	135193	2022-04-11 00:00:00	\N
403	04121	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.117753	9891418	27	135193	2022-04-11 00:00:00	\N
87	KXR710BBA2031531	kite	Core	CORE XR7 10.0 black/black	2022	1	active	3	2026-03-18 08:38:05.197	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:13:55.923522	KXR710BBN	17	IN724093	2022-05-19 00:00:00	2
97	KXR712BBA2036940	kite	Core	CORE XR7 12.0 black/black	2022	1	active	3	2026-03-18 08:55:32.29	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:14:09.809396	KXR712BBN	18	IN723678	2022-05-05 00:00:00	2
393	12516	kite	Eleveight	Eleveight RS V6 17 m	2023	1	active	4	2026-03-18 09:07:16.472	\N	659.45	659.45	\N	{"size": "17", "color": "red"}	2026-03-11 07:55:46.649632	9894043	27	135193	2022-04-11 00:00:00	\N
359	KGS612BBA1043142	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:54:28.123	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.839945	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
404	04122	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	1	active	4	2026-03-18 09:37:58.809	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.163732	9891418	27	135193	2022-04-11 00:00:00	\N
382	10826	kite	Eleveight	Eleveight RS V6 14 m	2023	1	active	5	2026-03-18 09:06:30.558	\N	656.78	656.78	\N	{"size": "14", "color": "dark green"}	2026-03-11 07:55:46.113484	9894041	27	135193	2022-04-11 00:00:00	\N
392	10854	kite	Eleveight	Eleveight RS V6 14 m	2023	1	active	5	2026-03-18 09:06:58.855	\N	609.87	609.87	\N	{"size": "14", "color": "dark green"}	2026-03-11 07:55:46.595297	9894041	27	135193	2022-04-11 00:00:00	\N
396	02840	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	1	active	4	2026-03-18 09:38:54.194	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.789465	9891420	27	135193	2022-04-11 00:00:00	\N
89	KXR710BBA2034751	kite	Core	CORE XR7 10.0 black/black	2022	1	active	3	2026-03-18 08:37:42.401	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:13:56.015665	KXR710BBN	17	IN724093	2022-05-19 00:00:00	2
93	KXR708BBA2032579	kite	Core	CORE XR7 8.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:03:22.438	\N	631.95	631.95	\N	{"size": "8.0", "color": ""}	2026-03-10 18:14:09.615498	KXR708BBN	18	IN723678	2022-05-05 00:00:00	2
94	KXR708BBA2032989	kite	Core	CORE XR7 8.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:03:41.485	\N	631.95	631.95	\N	{"size": "8.0", "color": ""}	2026-03-10 18:14:09.661914	KXR708BBN	18	IN723678	2022-05-05 00:00:00	2
95	KXR708BBA2037789	kite	Core	CORE XR7 8.0 black/black	2022	\N	in_transfer	2	2026-04-02 07:04:10.955	\N	631.95	631.95	\N	{"size": "8.0", "color": ""}	2026-03-10 18:14:09.713976	KXR708BBN	18	IN723678	2022-05-05 00:00:00	2
96	KXR709BBA2033810	kite	Core	CORE XR7 9.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:04:32.656	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:14:09.762726	KXR709BBN	18	IN723678	2022-05-05 00:00:00	2
99	KGS605WBA0064951	kite	Core	GTS6	2022	\N	in_transfer	3	2026-04-02 07:14:02.954	\N	549.45	549.45	\N	{"size": "5.0", "color": "Black / White"}	2026-03-10 18:14:29.453163	KGS605WBN	19	IN723226	2022-04-26 00:00:00	2
405	04129	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.209766	9891418	27	135193	2022-04-11 00:00:00	\N
406	04970	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.256251	9891418	27	135193	2022-04-11 00:00:00	\N
407	04973	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.302645	9891418	27	135193	2022-04-11 00:00:00	\N
408	04975	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.348857	9891418	27	135193	2022-04-11 00:00:00	\N
411	04965	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	\N	active	5	\N	\N	237.82	237.82	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.49201	9891418	27	135193	2022-04-11 00:00:00	\N
401	05665	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	4	active	3	2026-03-12 11:21:46.648	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.025379	9891420	27	135193	2022-04-11 00:00:00	\N
437	2111027	board	Eleveight	Eleveight Process V6 132 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	268.01	268.01	\N	{"size": "132", "color": ""}	2026-03-11 07:56:16.739684	9893976	28	134725	2022-03-17 00:00:00	\N
243	X51412111034	board	Core	CORE Fusion 5 141x42	2022	4	active	3	2026-03-12 11:47:48.462	\N	439.45	439.45	\N	{"size": "141", "color": ""}	2026-03-10 18:16:26.790794	BOBOF514142N	23	IN722079	2022-03-01 00:00:00	2
153	KXR706BBA1109187	kite	Core	CORE XR7 6.0 black/black	2022	\N	active	5	\N	\N	576.95	576.95	\N	{"size": "6.0", "color": ""}	2026-03-10 18:16:03.22787	KXR706BBN	22	IN722118	2022-03-02 00:00:00	2
154	KXR717BBA1104608	kite	Core	CORE XR7 17.0 black/black	2022	\N	active	5	\N	\N	912.45	912.45	\N	{"size": "17.0", "color": ""}	2026-03-10 18:16:03.274605	KXR717BBN	22	IN722118	2022-03-02 00:00:00	2
156	RSE3SE67928K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.373924	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
157	RSE3SE68129K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.421055	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
158	RSE3SE67994K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.46781	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
159	RSE3SE68167K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.518161	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
160	RSE3SE68014K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.564712	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
161	RSE3SE67008K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.611085	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
162	RSE3SE68252K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.657707	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
163	RSE3SE68104K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.704003	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
164	RSE3SE68158K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.751084	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
165	RSE3SE66906K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.797472	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
166	RSE3SE67014K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.844587	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
167	RSE3SE68197K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.890896	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
168	RSE3SE68270K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.937664	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
169	RSE3SE68246K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:03.98452	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
170	RSE3SE68373K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.034252	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
171	RSE3SE68247K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.082086	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
172	RSE3SE68093K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.129312	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
173	RSE3SE68264K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.175814	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
174	RSE3SE68328K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.222567	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
175	RSE3SE67023K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.269502	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
176	RSE3SE68290K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.31602	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
177	RSE3SE67738K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.362982	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
410	04963	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	1	active	4	2026-03-18 09:39:37.097	\N	237.82	237.82	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.445404	9891418	27	135193	2022-04-11 00:00:00	\N
151	KXR705BBA1104087	kite	Core	CORE XR7 5.0 black/black	2022	\N	in_transfer	3	2026-04-02 06:57:11.112	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:16:03.133692	KXR705BBN	22	IN722118	2022-03-02 00:00:00	2
475	78602992	board	Crazyfly	Allround	2020	4	active	5	\N	\N	\N	\N	\N	{"size": "135", "boardType": "TwinTip"}	2026-03-12 14:05:47.635889	\N	\N	\N	\N	\N
470	FKVI30S04-4618-58557	kite	Flysurfer	Viron	2020	4	active	4	\N	\N	\N	\N	\N	{"size": "4"}	2026-03-12 13:48:15.732788	\N	\N	\N	\N	\N
467	KNX215WBA1104748	kite	Core	Nexus 2	2021	4	active	3	\N	\N	\N	\N	\N	{"size": "15"}	2026-03-12 13:29:56.928844	\N	\N	\N	\N	\N
409	05091	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (SMALL)	2022	1	active	4	2026-03-18 09:39:13.528	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.39941	9891418	27	135193	2022-04-11 00:00:00	\N
152	KXR705BBA1105977	kite	Core	CORE XR7 5.0 black/black	2022	1	active	3	2026-03-12 15:23:34.83	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:16:03.181179	KXR705BBN	22	IN722118	2022-03-02 00:00:00	2
178	RSE3SE68234K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.409388	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
179	RSE3SE67922K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.456531	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
180	RSE3SE68181K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.503333	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
181	RSE3SE68135K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.549888	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
182	RSE3SE66925K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.597216	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
183	RSE3SE68277K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.644213	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
184	RSE3SE68268K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.691023	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
185	RSE3SE67943K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.737848	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
186	RSE3SE68179K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.785137	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
187	RSE3SE68021K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.832005	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
188	RSE3SE68060K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.878851	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
189	RSE3SE68195K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.925258	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
190	RSE3SE66916K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:04.972454	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
191	RSE3SE68141K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.018895	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
192	RSE3SE67982K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.065951	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
193	RSE3SE68346K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.112355	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
194	RSE3SE67921K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.158814	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
195	RSE3SE68251K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.206745	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
196	RSE3SE68253K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.254073	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
197	RSE3SE67710K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.300592	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
198	RSE3SE67679K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.347191	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
199	RSE3SE66891K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.39445	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
200	RSE3SE68272K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.441264	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
201	RSE3SE68009K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.487926	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
202	RSE3SE68187K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.534451	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
203	RSE3SE68256K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.581224	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
204	RSE3SE68248K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.628051	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
205	RSE3SE67702K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.674638	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
206	RSE3SE68276K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.721334	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
207	RSE3SE67721K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.767768	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
208	RSE3SE68185K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.814452	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
209	RSE3SE68292K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.860848	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
210	RSE3SE68231K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.9078	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
211	RSE3SE68163K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:05.954211	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
212	RSE3SE68071K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.004082	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
213	RSE3SE68029K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.050457	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
214	RSE3SE68242K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.098526	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
215	RSE3SE66921K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.147633	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
216	RSE3SE68262K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.196012	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
217	RSE3SE68295K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.24279	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
218	RSE3SE68094K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.289907	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
219	RSE3SE68267K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.336238	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
220	RSE3SE68275K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.382845	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
221	RSE3SE68017K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.430823	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
222	RSE3SE68228K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.480581	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
223	RSE3SE68340K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.530491	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
224	RSE3SE68074K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.578118	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
225	RSE3SE68190K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.626434	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
226	RSE3SE68239K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.673435	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
227	RSE3SE67713K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.719726	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
228	RSE3SE68081K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.766559	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
229	RSE3SE68189K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.81314	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
230	RSE3SE68229K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:06.865352	RSE3SN	22	IN722118	2022-03-02 00:00:00	2
415	2111034	board	Eleveight	Eleveight Process V6 132 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "132", "color": ""}	2026-03-11 07:56:15.707005	9893976	28	134725	2022-03-17 00:00:00	\N
425	2111252	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	4	active	4	2026-03-12 11:49:27.097	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.174239	9893978	28	134725	2022-03-17 00:00:00	\N
418	2111143	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.845842	9893977	28	134725	2022-03-17 00:00:00	\N
255	AUTO-KITE-1773166587352	board	Core	DELUXE Freeride 2 142x42	2022	\N	active	5	\N	\N	219.45	219.45	\N	{"size": "142", "color": ""}	2026-03-10 18:16:27.370616	SBOBDFR214242N	23	IN722079	2022-03-01 00:00:00	2
256	AUTO-KITE-1773166587399	board	Core	DELUXE Freeride 2 149x44	2022	\N	active	5	\N	\N	219.45	219.45	\N	{"size": "149", "color": ""}	2026-03-10 18:16:27.417828	SBOBDFR214944N	23	IN722079	2022-03-01 00:00:00	2
417	2111142	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.799497	9893977	28	134725	2022-03-17 00:00:00	\N
423	2111240	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.080871	9893978	28	134725	2022-03-17 00:00:00	\N
424	2111241	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.127841	9893978	28	134725	2022-03-17 00:00:00	\N
426	2111254	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.220232	9893978	28	134725	2022-03-17 00:00:00	\N
429	2111246	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.365258	9893978	28	134725	2022-03-17 00:00:00	\N
430	2111256	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.411389	9893978	28	134725	2022-03-17 00:00:00	\N
431	2111259	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.458595	9893978	28	134725	2022-03-17 00:00:00	\N
421	2111159	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.98711	9893977	28	134725	2022-03-17 00:00:00	\N
257	RSE3SE67807K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.038005	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
258	RSE3SE67805K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.0827	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
259	RSE3SE67437K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.128862	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
260	RSE3SE67798K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.173155	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
261	RSE3SE67594K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.218718	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
263	RSE3SE67431K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.308094	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
266	RSE3SE67787K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.442267	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
264	RSE3SE67813K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	1	2026-03-18 09:35:09.177	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.352746	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
262	RSE3SE67401K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	2	2026-03-27 09:09:28.223	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.263416	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
471	FKVI30S06-4618-58588	kite	Flysurfer	Viron	2020	4	active	5	\N	\N	\N	\N	\N	{"size": "6"}	2026-03-12 13:50:30.375816	\N	\N	\N	\N	\N
464	SNYFA2211ST63001474	foilboard	Fanatic	Skywing	2023	4	active	5	\N	\N	\N	\N	\N	{"size": "188", "volume": "140"}	2026-03-12 11:06:15.525678	\N	\N	\N	\N	\N
427	2111258	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	1	active	4	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.26679	9893978	28	134725	2022-03-17 00:00:00	\N
267	RSE3SE67620K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.486893	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
269	RSE3SE67824K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.575767	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
270	RSE3SE67814K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.620286	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
271	RSE3SE67613K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.665227	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
416	2111126	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.752914	9893977	28	134725	2022-03-17 00:00:00	\N
422	2111161	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:16.034127	9893977	28	134725	2022-03-17 00:00:00	\N
272	RSE3SE67827K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	3	2026-03-12 11:23:42.184	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.709878	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
419	2111146	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.892623	9893977	28	134725	2022-03-17 00:00:00	\N
428	2111242	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	4	active	4	2026-03-12 13:53:30.691	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.31847	9893978	28	134725	2022-03-17 00:00:00	\N
420	2111150	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	4	2026-03-12 13:54:37.479	\N	285.88	285.88	\N	{"size": "135", "color": ""}	2026-03-11 07:56:15.940419	9893977	28	134725	2022-03-17 00:00:00	\N
273	RSE3SE67080K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.754286	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
274	RSE3SE67627K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.798574	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
275	RSE3SE67581K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.842922	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
276	RSE3SE67541K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.88715	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
278	RSE3SE67159K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.978651	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
280	RSE3SE67611K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.06886	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
282	RSE3SE67093K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.158889	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
284	RSE3SE67862K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.252728	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
285	RSE3SE67859K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.297102	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
286	RSE3SE67785K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.343734	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
287	RSE3SE67849K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.389025	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
288	RSE3SE67818K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.433451	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
289	RSE3SE67612K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.478934	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
291	RSE3SE67815K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.567949	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
292	RSE3SE67439K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.612075	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
293	RSE3SE67856K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.65699	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
294	RSE3SE66955K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.70144	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
295	RSE3SE67465K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.746716	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
297	RSE3SE67451K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.83553	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
299	RSE3SE67796K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.924617	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
300	RSE3SE67841K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.969432	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
290	RSE3SE67597K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	2	2026-03-27 09:10:32.403	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.523253	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
279	RSE3SE67863K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	2	2026-03-18 09:32:50.553	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.02452	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
296	RSE3SE67839K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-18 09:37:01.522	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.790833	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
283	RSE3SE67828K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	in_repair	3	2026-03-18 09:36:19.659	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.208359	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
281	RSE3SE67782K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	2	2026-03-18 09:33:09.974	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.113222	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
298	RSE3SE66847K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-27 09:11:27.584	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:59.87983	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
268	RSE3SE67797K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-24 11:20:26.76	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.531209	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
301	RSE3SE67873K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.014075	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
302	RSE3SE67801K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.060047	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
303	RSE3SE67600K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.104569	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
304	RSE3SE67788K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.149259	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
305	RSE3SE67795K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.193836	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
307	RSE3SE67474K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.284449	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
308	RSE3SE67591K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.329635	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
309	RSE3SE67614K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.374202	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
311	RSE3SE67143K44	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.465154	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
313	RSE3SE67457K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.55544	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
314	RSE3SE67617K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.600829	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
315	RSE3SE67850K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.646636	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
316	RSE3SE67151K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.691121	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
319	RSE3SE67826K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.830589	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
320	RSE3SE67459K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.875793	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
326	RSE3SE67462K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.146936	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
328	RSE3SE67792K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.237307	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
330	RSE3SE67865K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.330297	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
331	RSE3SE67466K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	\N	active	5	\N	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.374582	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
432	2111262	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.504271	9893978	28	134725	2022-03-17 00:00:00	\N
433	2111084	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "144", "color": ""}	2026-03-11 07:56:16.551092	9893979	28	134725	2022-03-17 00:00:00	\N
434	2111085	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "144", "color": ""}	2026-03-11 07:56:16.59778	9893979	28	134725	2022-03-17 00:00:00	\N
435	2111095	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "144", "color": ""}	2026-03-11 07:56:16.64474	9893979	28	134725	2022-03-17 00:00:00	\N
436	2111099	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	285.88	285.88	\N	{"size": "144", "color": ""}	2026-03-11 07:56:16.691526	9893979	28	134725	2022-03-17 00:00:00	\N
440	2111243	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	268.02	268.02	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.879507	9893978	28	134725	2022-03-17 00:00:00	\N
441	2111245	board	Eleveight	Eleveight Process V6 139 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	268.02	268.02	\N	{"size": "139", "color": ""}	2026-03-11 07:56:16.926006	9893978	28	134725	2022-03-17 00:00:00	\N
442	2111094	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	268.02	268.02	\N	{"size": "144", "color": ""}	2026-03-11 07:56:16.973079	9893979	28	134725	2022-03-17 00:00:00	\N
443	2111109	board	Eleveight	Eleveight Process V6 144 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	268.02	268.02	\N	{"size": "144", "color": ""}	2026-03-11 07:56:17.019476	9893979	28	134725	2022-03-17 00:00:00	\N
324	RSE3SE67618K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-18 09:34:49.833	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.054846	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
318	RSE3SE67616K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-27 09:08:25.314	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.784648	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
325	RSE3SE67843K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-27 09:10:03.895	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.100756	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
327	RSE3SE67623K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	2	2026-03-27 09:12:35.917	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.192625	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
306	RSE3SE67816K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	2	2026-03-18 09:34:31.124	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.239003	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
310	RSE3SE67868K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	4	2026-03-18 09:37:17.369	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.419873	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
323	RSE3SE67586K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-18 09:35:23.788	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.010452	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
312	RSE3SE67583K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-18 09:35:45.46	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.50986	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
322	RSE3SE67823K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	3	2026-03-24 11:20:06.825	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.966013	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
444	2111022	board	Eleveight	Eleveight Master S V2 132 x 40 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	309.35	309.35	\N	{"size": "132", "color": ""}	2026-03-11 07:56:17.065827	9893972	28	134725	2022-03-17 00:00:00	\N
445	2111049	board	Eleveight	Eleveight Master V5 136 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	309.35	309.35	\N	{"size": "136", "color": ""}	2026-03-11 07:56:17.112114	9893973	28	134725	2022-03-17 00:00:00	\N
446	2111014	board	Eleveight	Eleveight Master V5 139 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	309.35	309.35	\N	{"size": "139", "color": ""}	2026-03-11 07:56:17.159127	9893974	28	134725	2022-03-17 00:00:00	\N
447	2111045	board	Eleveight	Eleveight Master V5 142 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	309.35	309.35	\N	{"size": "142", "color": ""}	2026-03-11 07:56:17.205589	9893975	28	134725	2022-03-17 00:00:00	\N
448	2111021	board	Eleveight	Eleveight Master S V2 132 x 40 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	290.02	290.02	\N	{"size": "132", "color": ""}	2026-03-11 07:56:17.252217	9893972	28	134725	2022-03-17 00:00:00	\N
450	2111091	board	Eleveight	Eleveight Master V5 139 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	290.02	290.02	\N	{"size": "139", "color": ""}	2026-03-11 07:56:17.344887	9893974	28	134725	2022-03-17 00:00:00	\N
438	2111127	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	268.02	268.02	\N	{"size": "135", "color": ""}	2026-03-11 07:56:16.78577	9893977	28	134725	2022-03-17 00:00:00	\N
321	RSE3SE67852K47	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	3	2026-03-12 11:24:47.791	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.92105	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
439	2111128	board	Eleveight	Eleveight Process V6 135 cm (incl. 45 mm fins + pads)	2022	4	active	5	\N	\N	268.02	268.02	\N	{"size": "135", "color": ""}	2026-03-11 07:56:16.831914	9893977	28	134725	2022-03-17 00:00:00	\N
451	2111060	board	Eleveight	Eleveight Master V5 142 cm (incl. 45 mm fins)	2022	\N	active	5	\N	\N	290.02	290.02	\N	{"size": "142", "color": ""}	2026-03-11 07:56:17.392213	9893975	28	134725	2022-03-17 00:00:00	\N
452	2111017	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.438906	9893987	28	134725	2022-03-17 00:00:00	\N
453	2111043	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.485307	9893987	28	134725	2022-03-17 00:00:00	\N
454	2111046	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.53246	9893987	28	134725	2022-03-17 00:00:00	\N
455	2111055	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.579092	9893987	28	134725	2022-03-17 00:00:00	\N
358	KGS612BBA1048642	kite	Core	GTS6	2022	\N	active	5	\N	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.794304	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
352	KGS611BBA1041732	kite	Core	GTS6	2022	\N	active	5	\N	\N	633.12	633.12	\N	{"size": "11", "color": "Black"}	2026-03-10 18:17:18.527582	KGS611BBN	\N	\N	2022-02-15 00:00:00	2
354	KGS612BBA1046342	kite	Core	GTS6	2022	\N	active	5	\N	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.61694	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
353	KGS611BBA1042732	kite	Core	GTS6	2022	4	active	4	2026-03-12 11:35:26.14	\N	633.12	633.12	\N	{"size": "11", "color": "Black"}	2026-03-10 18:17:18.57186	KGS611BBN	\N	\N	2022-02-15 00:00:00	2
71	KXR715BBA2040514	kite	Core	CORE XR7 15.0 black/black	2022	4	active	4	2026-03-12 13:38:30.781	\N	873.95	873.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:12:54.787371	KXR715BBN	14	IN725520	2022-06-22 00:00:00	2
347	KGS609BBA1040422	kite	Core	GTS6	2022	\N	active	5	\N	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.303562	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
346	KGS609BBA1044812	kite	Core	GTS6	2022	\N	active	5	\N	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.259311	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
345	KGS609BBA1046422	kite	Core	GTS6	2022	\N	active	5	\N	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.214834	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
343	KGS609BBA1040522	kite	Core	GTS6	2022	\N	active	5	\N	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.124144	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
340	KGS608BBA1049012	kite	Core	GTS6	2022	\N	active	5	\N	\N	551.52	551.52	\N	{"size": "8", "color": "Black"}	2026-03-10 18:17:17.990211	KGS608BBN	\N	\N	2022-02-15 00:00:00	2
356	KGS612BBA1043842	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:41:44.11	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.705524	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
348	KGS610BBA1043132	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:35:31.931	\N	594.72	594.72	\N	{"size": "10", "color": "Black"}	2026-03-10 18:17:18.348421	KGS610BBN	\N	\N	2022-02-15 00:00:00	2
336	KGS607BBA1040302	kite	Core	GTS6	2022	1	active	3	2026-04-02 11:49:10.763	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.811446	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
350	KGS610BBA0121791	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:36:02.61	\N	594.72	594.72	\N	{"size": "10", "color": "Black"}	2026-03-10 18:17:18.437796	KGS610BBN	\N	\N	2022-02-15 00:00:00	2
351	KGS610BBA1045432	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:36:27.521	\N	594.72	594.72	\N	{"size": "10", "color": "Black"}	2026-03-10 18:17:18.481904	KGS610BBN	\N	\N	2022-02-15 00:00:00	2
476	78604992	board	Crazyfly	Allround	2020	4	active	5	\N	\N	\N	\N	\N	{"size": "135", "boardType": "TwinTip"}	2026-03-12 14:06:17.845851	\N	\N	\N	\N	\N
342	KGS609BBA0127881	kite	Core	GTS6	2022	4	active	3	2026-04-02 06:46:42.997	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.0792	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
344	KGS609BBA1040912	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:32:37.86	\N	570.72	570.72	\N	{"size": "9", "color": "Black"}	2026-03-10 18:17:18.16873	KGS609BBN	\N	\N	2022-02-15 00:00:00	2
473	21403000035	board	Kold	Polar II	2021	4	active	4	\N	\N	\N	\N	\N	{"size": "140", "boardType": "TwinTip"}	2026-03-12 13:58:17.118029	\N	\N	\N	\N	\N
465	11373000054	board	Kold	Polar II	2021	4	active	3	\N	no invoice uploaded	\N	\N	\N	{"size": "137", "boardType": "TwinTip"}	2026-03-12 11:11:05.7134	\N	\N	\N	\N	\N
472	FKVI30S06-4618-58583	kite	Flysurfer	Viron	2020	4	active	5	\N	\N	\N	\N	\N	{"size": "6"}	2026-03-12 13:51:27.453425	\N	\N	\N	\N	\N
341	KGS608BBA1046312	kite	Core	GTS6	2022	1	active	2	2026-03-18 08:31:34.313	\N	551.52	551.52	\N	{"size": "8", "color": "Black"}	2026-03-10 18:17:18.034989	KGS608BBN	\N	\N	2022-02-15 00:00:00	2
355	KGS612BBA1042832	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:54:53.655	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.661224	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
339	KGS608BBA1043012	kite	Core	GTS6	2022	\N	in_transfer	3	2026-04-02 07:14:56.95	\N	551.52	551.52	\N	{"size": "8", "color": "Black"}	2026-03-10 18:17:17.94481	KGS608BBN	\N	\N	2022-02-15 00:00:00	2
338	KGS608BBA1042802	kite	Core	GTS6	2022	1	active	3	2026-04-02 11:49:44.92	\N	551.52	551.52	\N	{"size": "8", "color": "Black"}	2026-03-10 18:17:17.899976	KGS608BBN	\N	\N	2022-02-15 00:00:00	2
349	KGS610BBA0125591	kite	Core	GTS6	2022	\N	in_transfer	3	2026-04-02 11:55:02.7	\N	594.72	594.72	\N	{"size": "10", "color": "Black"}	2026-03-10 18:17:18.392495	KGS610BBN	\N	\N	2022-02-15 00:00:00	2
333	KGS607BBA1045202	kite	Core	GTS6	2022	\N	active	5	\N	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.676919	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
64	KNX315BBA2067844	kite	Core	CORE Nexus 3 15.0 black/black	2023	\N	active	5	\N	\N	912.45	912.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:12:27.044135	KNX315BBN	12	IN731871	2023-01-11 00:00:00	2
75	KNX304BBA2031333	kite	Core	CORE Nexus 3 4.0 black/black	2022	\N	active	5	\N	\N	527.45	527.45	\N	{"size": "4.0", "color": ""}	2026-03-10 18:13:28.402308	KNX304BBN	15	IN724450	2022-05-30 00:00:00	2
90	KNX315BBA1124603	kite	Core	CORE Nexus 3 15.0 black/black	2022	\N	active	5	\N	\N	857.45	857.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:14:09.476004	KNX315BBN	18	IN723678	2022-05-05 00:00:00	2
91	KNX315BBA1125403	kite	Core	CORE Nexus 3 15.0 black/black	2022	\N	active	5	\N	\N	857.45	857.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:14:09.521946	KNX315BBN	18	IN723678	2022-05-05 00:00:00	2
92	KNX315BBA1127113	kite	Core	CORE Nexus 3 15.0 black/black	2022	\N	active	5	\N	\N	857.45	857.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:14:09.569969	KNX315BBN	18	IN723678	2022-05-05 00:00:00	2
105	KNX305BBA1120462	kite	Core	CORE Nexus 3 5.0 black/black	2022	\N	active	5	\N	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:14:59.86521	KNX305BBN	21	IN722597	2022-03-30 00:00:00	2
106	KNX306BBA1121572	kite	Core	CORE Nexus 3 6.0 black/black	2022	\N	active	5	\N	\N	582.45	582.45	\N	{"size": "6.0", "color": ""}	2026-03-10 18:14:59.910542	KNX306BBN	21	IN722597	2022-03-30 00:00:00	2
108	KNX306BBA1128962	kite	Core	CORE Nexus 3 6.0 black/black	2022	\N	active	5	\N	\N	582.45	582.45	\N	{"size": "6.0", "color": ""}	2026-03-10 18:14:59.99915	KNX306BBN	21	IN722597	2022-03-30 00:00:00	2
112	KNX307BBA1122221	kite	Core	CORE Nexus 3 7.0 black/black	2022	\N	active	5	\N	\N	609.95	609.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:15:00.178949	KNX307BBN	21	IN722597	2022-03-30 00:00:00	2
115	KNX308BBA1120441	kite	Core	CORE Nexus 3 8.0 black/black	2022	\N	active	5	\N	\N	659.45	659.45	\N	{"size": "8.0", "color": ""}	2026-03-10 18:15:00.312975	KNX308BBN	21	IN722597	2022-03-30 00:00:00	2
116	KNX308BBA1123341	kite	Core	CORE Nexus 3 8.0 black/black	2022	\N	active	5	\N	\N	659.45	659.45	\N	{"size": "8.0", "color": ""}	2026-03-10 18:15:00.357421	KNX308BBN	21	IN722597	2022-03-30 00:00:00	2
117	KNX308BBA1129061	kite	Core	CORE Nexus 3 8.0 black/black	2022	\N	active	5	\N	\N	659.45	659.45	\N	{"size": "8.0", "color": ""}	2026-03-10 18:15:00.402583	KNX308BBN	21	IN722597	2022-03-30 00:00:00	2
119	KNX309BBA1129091	kite	Core	CORE Nexus 3 9.0 black/black	2022	\N	active	5	\N	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.491878	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
121	KNX309BBA1129391	kite	Core	CORE Nexus 3 9.0 black/black	2022	\N	active	5	\N	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.581228	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
123	KNX309BBA1123402	kite	Core	CORE Nexus 3 9.0 black/black	2022	\N	active	5	\N	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.672107	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
124	KNX310BBA1120040	kite	Core	CORE Nexus 3 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:15:00.717287	KNX310BBN	21	IN722597	2022-03-30 00:00:00	2
125	KNX310BBA1127440	kite	Core	CORE Nexus 3 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:15:00.762684	KNX310BBN	21	IN722597	2022-03-30 00:00:00	2
126	KNX310BBA1126230	kite	Core	CORE Nexus 3 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:15:00.807021	KNX310BBN	21	IN722597	2022-03-30 00:00:00	2
127	KNX310BBA1128030	kite	Core	CORE Nexus 3 10.0 black/black	2022	\N	active	5	\N	\N	708.95	708.95	\N	{"size": "10.0", "color": ""}	2026-03-10 18:15:00.85144	KNX310BBN	21	IN722597	2022-03-30 00:00:00	2
50	KNX412BBA3117671	kite	Core	CORE Nexus 4 12.0 black/black	2024	1	active	4	2026-03-18 09:08:43.615	\N	890.45	890.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:09:22.700568	KNX412BBN	6	IN746231	2024-05-03 00:00:00	2
364	KXR705BBA1105087	kite	Core	CORE XR7 5.0 black/black	2022	\N	in_transfer	5	2026-04-02 06:56:18.988	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:17:19.063735	KXR705BBN	\N	\N	2022-02-15 00:00:00	2
114	KNX307BBA1125321	kite	Core	CORE Nexus 3 7.0 black/black	2022	1	active	3	2026-03-18 08:29:31.443	\N	609.95	609.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:15:00.268424	KNX307BBN	21	IN722597	2022-03-30 00:00:00	2
332	KGS607BBA1045602	kite	Core	GTS6	2022	1	active	3	2026-03-23 09:26:47.57	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.632582	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
51	KNX411BBA3114231	kite	Core	CORE Nexus 4 11.0 black/black	2024	1	active	4	2026-03-18 09:07:53.69	\N	868.45	868.45	\N	{"size": "11.0", "color": ""}	2026-03-10 18:09:22.747918	KNX411BBN	6	IN746231	2024-05-03 00:00:00	2
367	KXR706WBA1106118	kite	Core	CORE XR7 6.0 white/black	2022	4	active	2	2026-03-18 08:29:07.032	\N	576.95	576.95	\N	{"size": "6.0", "color": ""}	2026-03-10 18:17:19.198135	KXR706WBN	\N	\N	2022-02-15 00:00:00	2
365	KXR705BBA1109977	kite	Core	CORE XR7 5.0 black/black	2022	\N	in_transfer	4	2026-04-02 06:56:37.41	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:17:19.108466	KXR705BBN	\N	\N	2022-02-15 00:00:00	2
335	KGS607BBA1043502	kite	Core	GTS6	2022	\N	in_transfer	2	2026-04-02 07:14:20.522	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.766445	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
334	KGS607BBA1041602	kite	Core	GTS6	2022	\N	in_transfer	2	2026-04-02 07:14:39.563	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.721709	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
107	KNX306BBA1120572	kite	Core	CORE Nexus 3 6.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:16:41.987	\N	582.45	582.45	\N	{"size": "6.0", "color": ""}	2026-03-10 18:14:59.955157	KNX306BBN	21	IN722597	2022-03-30 00:00:00	2
109	KNX306BBA1129962	kite	Core	CORE Nexus 3 6.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:16:58.773	\N	582.45	582.45	\N	{"size": "6.0", "color": ""}	2026-03-10 18:15:00.043095	KNX306BBN	21	IN722597	2022-03-30 00:00:00	2
111	KNX307BBA1129431	kite	Core	CORE Nexus 3 7.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:17:20.607	\N	609.95	609.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:15:00.134214	KNX307BBN	21	IN722597	2022-03-30 00:00:00	2
110	KNX307BBA1122131	kite	Core	CORE Nexus 3 7.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:18:22.999	\N	609.95	609.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:15:00.089069	KNX307BBN	21	IN722597	2022-03-30 00:00:00	2
113	KNX307BBA1123721	kite	Core	CORE Nexus 3 7.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:18:39.793	\N	609.95	609.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:15:00.224143	KNX307BBN	21	IN722597	2022-03-30 00:00:00	2
118	KNX309BBA1121981	kite	Core	CORE Nexus 3 9.0 black/black	2022	\N	in_transfer	3	2026-04-02 07:19:14.374	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.447155	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
122	KNX309BBA1129002	kite	Core	CORE Nexus 3 9.0 black/black	2022	\N	in_transfer	3	2026-04-02 07:19:36.08	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.626052	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
361	KGS6135BBA1043152	kite	Core	GTS6	2022	\N	active	5	\N	\N	685.92	685.92	\N	{"size": "13.5", "color": "Black"}	2026-03-10 18:17:18.929674	KGS6135BBN	\N	\N	2022-02-15 00:00:00	2
129	KNX311BBA1122582	kite	Core	CORE Nexus 3 11.0 black/black	2022	\N	active	5	\N	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:15:00.940545	KNX311BBN	21	IN722597	2022-03-30 00:00:00	2
130	KNX311BBA1122972	kite	Core	CORE Nexus 3 11.0 black/black	2022	\N	active	5	\N	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:15:00.984585	KNX311BBN	21	IN722597	2022-03-30 00:00:00	2
131	KNX311BBA1122872	kite	Core	CORE Nexus 3 11.0 black/black	2022	\N	active	5	\N	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:15:01.029702	KNX311BBN	21	IN722597	2022-03-30 00:00:00	2
132	KNX311BBA1120092	kite	Core	CORE Nexus 3 11.0 black/black	2022	\N	active	5	\N	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:15:01.073537	KNX311BBN	21	IN722597	2022-03-30 00:00:00	2
133	KNX312BBA1128412	kite	Core	CORE Nexus 3 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.11945	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
135	KNX312BBA1124112	kite	Core	CORE Nexus 3 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.208316	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
136	KNX312BBA1128822	kite	Core	CORE Nexus 3 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.252776	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
137	KNX312BBA1120212	kite	Core	CORE Nexus 3 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.297125	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
138	KNX312BBA1121212	kite	Core	CORE Nexus 3 12.0 black/black	2022	\N	active	5	\N	\N	769.45	769.45	\N	{"size": "12.0", "color": ""}	2026-03-10 18:15:01.34498	KNX312BBN	21	IN722597	2022-03-30 00:00:00	2
139	KNX3135BBA1124003	kite	Core	CORE Nexus 3 13.5 black/black	2022	\N	active	5	\N	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.390176	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
142	KNX3135BBA1124303	kite	Core	CORE Nexus 3 13.5 black/black	2022	\N	active	5	\N	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.523383	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
143	KNX3135BBA1126292	kite	Core	CORE Nexus 3 13.5 black/black	2022	\N	active	5	\N	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.567727	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
144	KNX3135BBA1125492	kite	Core	CORE Nexus 3 13.5 black/black	2022	\N	active	5	\N	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.613454	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
145	KNX3135BBA1125303	kite	Core	CORE Nexus 3 13.5 black/black	2022	\N	active	5	\N	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.657417	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
146	KNX315BBA1123503	kite	Core	CORE Nexus 3 15.0 black/black	2022	\N	active	5	\N	\N	857.45	857.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:15:01.701309	KNX315BBN	21	IN722597	2022-03-30 00:00:00	2
148	KNX317BBA1120732	kite	Core	CORE Nexus 3 17.0 black/black	2022	\N	active	5	\N	\N	901.45	901.45	\N	{"size": "17.0", "color": ""}	2026-03-10 18:15:01.789179	KNX317BBN	21	IN722597	2022-03-30 00:00:00	2
149	KNX317BBA1122632	kite	Core	CORE Nexus 3 17.0 black/black	2022	\N	active	5	\N	\N	901.45	901.45	\N	{"size": "17.0", "color": ""}	2026-03-10 18:15:01.833591	KNX317BBN	21	IN722597	2022-03-30 00:00:00	2
150	KNX317BBA1122732	kite	Core	CORE Nexus 3 17.0 black/black	2022	\N	active	5	\N	\N	901.45	901.45	\N	{"size": "17.0", "color": ""}	2026-03-10 18:15:01.878488	KNX317BBN	21	IN722597	2022-03-30 00:00:00	2
232	X51352110097	board	Core	CORE Fusion 5 135x40	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.271979	BOBOF513540N	23	IN722079	2022-03-01 00:00:00	2
233	X51352110094	board	Core	CORE Fusion 5 135x40	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.318683	BOBOF513540N	23	IN722079	2022-03-01 00:00:00	2
234	X51352110093	board	Core	CORE Fusion 5 135x40	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.365556	BOBOF513540N	23	IN722079	2022-03-01 00:00:00	2
236	X51372111087	board	Core	CORE Fusion 5 137x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:26.463241	BOBOF513741N	23	IN722079	2022-03-01 00:00:00	2
237	X51372111083	board	Core	CORE Fusion 5 137x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:26.509724	BOBOF513741N	23	IN722079	2022-03-01 00:00:00	2
239	X51392107059	board	Core	CORE Fusion 5 139x41.5	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:26.602789	BOBOF5139415N	23	IN722079	2022-03-01 00:00:00	2
242	X51392111033	board	Core	CORE Fusion 5 139x41.5	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:26.743813	BOBOF5139415N	23	IN722079	2022-03-01 00:00:00	2
244	1352011024	board	Core	CORE Choice 4 Freestyle 135x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.838417	BOBOC413541N	23	IN722079	2022-03-01 00:00:00	2
245	1352011022	board	Core	CORE Choice 4 Freestyle 135x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.88599	BOBOC413541N	23	IN722079	2022-03-01 00:00:00	2
246	1352011049	board	Core	CORE Choice 4 Freestyle 135x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.936897	BOBOC413541N	23	IN722079	2022-03-01 00:00:00	2
140	KNX3135BBA1124992	kite	Core	CORE Nexus 3 13.5 black/black	2022	4	active	4	2026-03-12 11:45:42.413	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.434561	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
235	X51372111080	board	Core	CORE Fusion 5 137x41	2022	4	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:26.414154	BOBOF513741N	23	IN722079	2022-03-01 00:00:00	2
240	X51392111085	board	Core	CORE Fusion 5 139x41.5	2022	4	active	3	2026-03-12 13:55:17.115	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:26.650561	BOBOF5139415N	23	IN722079	2022-03-01 00:00:00	2
241	X51392107054	board	Core	CORE Fusion 5 139x41.5	2022	4	active	3	2026-03-12 13:57:13.594	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:26.696956	BOBOF5139415N	23	IN722079	2022-03-01 00:00:00	2
147	KNX315BBA1121603	kite	Core	CORE Nexus 3 15.0 black/black	2022	1	active	3	2026-03-18 08:57:49.036	\N	857.45	857.45	\N	{"size": "15.0", "color": ""}	2026-03-10 18:15:01.745213	KNX315BBN	21	IN722597	2022-03-30 00:00:00	2
231	X51352110071	board	Core	CORE Fusion 5 135x40	2022	1	active	4	2026-03-19 11:46:06.097	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.22539	BOBOF513540N	23	IN722079	2022-03-01 00:00:00	2
238	X51372111082	board	Core	CORE Fusion 5 137x41	2022	1	active	4	2026-03-19 11:46:35.85	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:26.556412	BOBOF513741N	23	IN722079	2022-03-01 00:00:00	2
247	1352011005	board	Core	CORE Choice 4 Freestyle 135x41	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "135", "color": ""}	2026-03-10 18:16:26.984352	BOBOC413541N	23	IN722079	2022-03-01 00:00:00	2
249	1372011077	board	Core	CORE Choice 4 Freestyle 137x41,5	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:27.079749	BOBOC4137415N	23	IN722079	2022-03-01 00:00:00	2
250	C41372107014	board	Core	CORE Choice 4 Freestyle 137x41,5	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:27.129426	BOBOC4137415N	23	IN722079	2022-03-01 00:00:00	2
251	C41372107002	board	Core	CORE Choice 4 Freestyle 137x41,5	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:27.17884	BOBOC4137415N	23	IN722079	2022-03-01 00:00:00	2
253	1392011082	board	Core	CORE Choice 4 Freestyle 139x42	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:27.274453	BOBOC413942N	23	IN722079	2022-03-01 00:00:00	2
254	1392011063	board	Core	CORE Choice 4 Freestyle 139x42	2022	\N	active	5	\N	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:27.321959	BOBOC413942N	23	IN722079	2022-03-01 00:00:00	2
457	2111066	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.946314	9893987	28	134725	2022-03-17 00:00:00	\N
458	2111069	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	269.30	269.30	\N	{"size": "150", "color": ""}	2026-03-11 07:56:17.992632	9893987	28	134725	2022-03-17 00:00:00	\N
459	2111016	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	252.47	252.47	\N	{"size": "150", "color": ""}	2026-03-11 07:56:18.039123	9893987	28	134725	2022-03-17 00:00:00	\N
460	2111019	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	252.47	252.47	\N	{"size": "150", "color": ""}	2026-03-11 07:56:18.085937	9893987	28	134725	2022-03-17 00:00:00	\N
461	2111020	board	Eleveight	Eleveight IGNITION V3 150 cm (incl. 45 mm fins + pads)	2022	\N	active	5	\N	\N	252.47	252.47	\N	{"size": "150", "color": ""}	2026-03-11 07:56:18.136939	9893987	28	134725	2022-03-17 00:00:00	\N
449	2111048	board	Eleveight	Eleveight Master V5 136 cm (incl. 45 mm fins)	2022	4	active	4	2026-03-12 13:59:30.945	\N	290.02	290.02	\N	{"size": "136", "color": ""}	2026-03-11 07:56:17.298669	9893973	28	134725	2022-03-17 00:00:00	\N
363	KGS6135BBA1043942	kite	Core	GTS6	2022	\N	active	5	\N	\N	685.92	685.92	\N	{"size": "13.5", "color": "Black / Black"}	2026-03-10 18:17:19.018793	KGS6135BBN	\N	\N	2022-02-15 00:00:00	2
360	KGS6135BBA1047252	kite	Core	GTS6	2022	4	active	4	2026-03-12 13:20:58.474	\N	685.92	685.92	\N	{"size": "13.5", "color": "Black"}	2026-03-10 18:17:18.885386	KGS6135BBN	\N	\N	2022-02-15 00:00:00	2
478	SNFA23SAP610-WH-H20143	foilboard	Fanatic	Skyair Wingboard Komplett mit Foilset	2023	4	active	5	\N	\N	\N	\N	\N	{"size": "208", "volume": "200"}	2026-03-12 14:57:36.184898	\N	\N	\N	\N	\N
477	FKVI30S06-4618-58577	kite	Flysurfer 	Viron	2020	4	active	5	\N	\N	\N	\N	\N	{"size": "6"}	2026-03-12 14:22:16.10017	\N	\N	\N	\N	\N
466	61383000007	board	Kold	Horizont	2021	4	active	3	\N	no invoice uploaded	\N	\N	\N	{"size": "138"}	2026-03-12 11:11:54.695739	\N	\N	\N	\N	\N
468	FKVI30S08-4618-58598	kite	Flysurfer	Viron	2020	4	active	3	\N	\N	\N	\N	\N	{"size": "8"}	2026-03-12 13:46:34.502369	\N	\N	\N	\N	\N
248	1372011103	board	Core	CORE Choice 4 Freestyle 137x41,5	2022	1	active	4	2026-03-19 11:20:49.316	\N	439.45	439.45	\N	{"size": "137", "color": ""}	2026-03-10 18:16:27.032347	BOBOC4137415N	23	IN722079	2022-03-01 00:00:00	2
252	1392011092	board	Core	CORE Choice 4 Freestyle 139x42	2022	1	active	4	\N	\N	439.45	439.45	\N	{"size": "139", "color": ""}	2026-03-10 18:16:27.22789	BOBOC413942N	23	IN722079	2022-03-01 00:00:00	2
265	RSE3SE67822K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	2	2026-03-18 09:32:14.897	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.397612	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
366	KXR706WBA1102018	kite	Core	CORE XR7 6.0 white/black	2022	1	active	3	2026-03-18 08:28:41.965	\N	576.95	576.95	\N	{"size": "6.0", "color": ""}	2026-03-10 18:17:19.153288	KXR706WBN	\N	\N	2022-02-15 00:00:00	2
357	KGS612BBA1049742	kite	Core	GTS6	2022	1	active	3	2026-03-18 08:55:15.166	\N	647.52	647.52	\N	{"size": "12", "color": "Black"}	2026-03-10 18:17:18.74989	KGS612BBN	\N	\N	2022-02-15 00:00:00	2
38	KXR805WBA3066755	kite	Core	CORE XR8 5.0 white/black	2024	1	active	3	2026-03-18 08:27:09.114	\N	692.45	692.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:08:20.840277	KXR805WBN	5	IN747170	2024-06-04 00:00:00	2
53	KXR808BBA3099566	kite	Core	CORE XR8 8.0 black/black	2023	1	active	3	2026-03-18 08:32:11.415	\N	736.45	736.45	\N	{"size": "8.0", "color": ""}	2026-03-10 18:09:41.618137	KXR808BBN	7	IN742622	2023-12-05 00:00:00	2
337	KGS607BBA1047302	kite	Core	GTS6	2022	4	active	1	2026-03-18 08:30:20.93	\N	513.12	513.12	\N	{"size": "7", "color": "Black"}	2026-03-10 18:17:17.855657	KGS607BBN	\N	\N	2022-02-15 00:00:00	2
120	KNX309BBA1120681	kite	Core	CORE Nexus 3 9.0 black/black	2022	4	active	2	2026-03-18 08:33:48.216	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:15:00.535938	KNX309BBN	21	IN722597	2022-03-30 00:00:00	2
495	KXR811WBA4094520	kite	Core	XR8	2024	\N	active	5	\N	\N	884.95	884.95	\N	{"size": "11.0", "color": "White/Black"}	2026-03-19 07:58:24.079329	KXR811WBN	31	\N	2024-12-04 00:00:00	2
496	KXR812BBA4026619	kite	Core	XR8	2024	\N	active	5	\N	\N	906.95	906.95	\N	{"size": "12.0", "color": "Black/Black"}	2026-03-19 07:58:24.122695	KXR812BBN	31	\N	2024-12-04 00:00:00	2
497	KXR8135WBA3121767	kite	Core	XR8	2024	\N	active	5	\N	\N	945.45	945.45	\N	{"size": "13.5", "color": "White/Black"}	2026-03-19 07:58:24.165096	KXR8135WBN	31	\N	2024-12-04 00:00:00	2
499	RSE4SRNB94308N41	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.25072	RSE4SRN	31	\N	2024-12-04 00:00:00	2
500	RSE4SRNB93472N40	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.29435	RSE4SRN	31	\N	2024-12-04 00:00:00	2
501	RSE4SRNA91478N17	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.336571	RSE4SRN	31	\N	2024-12-04 00:00:00	2
502	RSE4SRNB94325N41	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.378942	RSE4SRN	31	\N	2024-12-04 00:00:00	2
503	RSE4SRNB93122N40	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.421481	RSE4SRN	31	\N	2024-12-04 00:00:00	2
390	12051	kite	Eleveight	Eleveight RS V6 9 m	2023	1	active	4	2026-03-18 08:34:54.985	\N	506.89	506.89	\N	{"size": "9", "color": "blue"}	2026-03-11 07:55:46.495601	9894030	27	135193	2022-04-11 00:00:00	\N
317	RSE3SE67148K45	bar_lines	Core	CORE Sensor 3 Control Bar	2022	1	active	4	2026-03-18 09:36:45.21	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:00.735802	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
394	02726	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	1	active	4	2026-03-18 09:38:37.068	\N	248.01	248.01	\N	{"size": "", "color": ""}	2026-03-11 07:55:46.695929	9891420	27	135193	2022-04-11 00:00:00	\N
412	05627	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	1	active	4	2026-03-18 09:38:20.23	\N	237.82	237.82	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.538043	9891420	27	135193	2022-04-11 00:00:00	\N
42	KXR807WBA3094136	kite	Core	CORE XR8 7.0 white/black	2024	1	active	4	2026-03-18 08:29:48.608	\N	763.95	763.95	\N	{"size": "7.0", "color": ""}	2026-03-10 18:08:21.018551	KXR807WBN	5	IN747170	2024-06-04 00:00:00	2
128	KNX311BBA1129082	kite	Core	CORE Nexus 3 11.0 black/black	2022	1	active	3	2026-03-18 08:41:27.341	\N	741.95	741.95	\N	{"size": "11.0", "color": ""}	2026-03-10 18:15:00.89557	KNX311BBN	21	IN722597	2022-03-30 00:00:00	2
498	KXR815BBA4099310	kite	Core	XR8	2024	1	active	4	2026-03-19 08:07:15.035	\N	1011.45	1011.45	\N	{"size": "15.0", "color": "Black/Black"}	2026-03-19 07:58:24.207961	KXR815BBN	31	\N	2024-12-04 00:00:00	2
494	KXR8135BBA4091600	kite	Core	XR8	2024	1	active	3	2026-03-19 08:10:19.152	\N	945.45	945.45	\N	{"size": "13.5", "color": "Black/Black"}	2026-03-19 07:57:37.98625	KXR8135BBN	30	RE/2024/01569	2024-12-04 00:00:00	2
141	KNX3135BBA1121003	kite	Core	CORE Nexus 3 13.5 black/black	2022	1	active	3	2026-03-18 08:57:00.759	\N	807.95	807.95	\N	{"size": "13.5", "color": ""}	2026-03-10 18:15:01.47875	KNX3135BBN	21	IN722597	2022-03-30 00:00:00	2
413	05633	bar_lines	Eleveight	Eleveight CS VARY BAR V4 PLUS (LARGE)	2022	1	active	4	2026-03-18 09:37:41.73	\N	237.82	237.82	\N	{"size": "", "color": ""}	2026-03-11 07:55:47.584872	9891420	27	135193	2022-04-11 00:00:00	\N
329	RSE3SE67615K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	3	2026-03-18 09:33:47.817	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:17:01.283716	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
277	RSE3SE67778K46	bar_lines	Core	CORE Sensor 3 Control Bar	2022	4	active	2	2026-03-18 09:32:32.307	\N	252.45	252.45	\N	{"size": "3", "color": ""}	2026-03-10 18:16:58.933446	RSE3SN	24	IN721725	2022-02-16 00:00:00	2
504	RSE4SRNB94306N41	bar_lines	Core	Sensor 4	2024	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 07:58:24.464807	RSE4SRN	31	\N	2024-12-04 00:00:00	2
523	RSE4SRNB93556N40	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.582937	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
522	RSE4SRNB92925N30	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.539879	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
524	RSE4SRNB93520N40	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.626189	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
530	RSE4SRND98721O25	bar_lines	Core	Sensor 4	2025	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-24 11:22:54.584182	RSE4SRN	33	RE/2025/09245	2025-12-02 00:00:00	2
531	RSE4SRND98526O25	bar_lines	Core	Sensor 4	2025	\N	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-24 11:22:54.62966	RSE4SRN	33	RE/2025/09245	2025-12-02 00:00:00	2
533	KGS612WBA0060151	kite	Core	CORE GTS6 12.0 white/black	2021	\N	active	5	\N	\N	809.40	809.40	\N	{"size": "12.0", "color": ""}	2026-03-24 11:23:37.879489	KGS612WBN	34	IN720276	2021-12-17 00:00:00	2
534	KGS612WBA0065351	kite	Core	CORE GTS6 12.0 white/black	2021	\N	active	5	\N	\N	809.40	809.40	\N	{"size": "12.0", "color": ""}	2026-03-24 11:23:37.924926	KGS612WBN	34	IN720276	2021-12-17 00:00:00	2
535	KGS6135WBA0063751	kite	Core	CORE GTS6 13.5 white/black	2021	\N	active	5	\N	\N	857.40	857.40	\N	{"size": "13.5", "color": ""}	2026-03-24 11:23:37.970268	KGS6135WBN	34	IN720276	2021-12-17 00:00:00	2
536	KGS6135WBA0063851	kite	Core	CORE GTS6 13.5 white/black	2021	\N	active	5	\N	\N	857.40	857.40	\N	{"size": "13.5", "color": ""}	2026-03-24 11:23:38.016521	KGS6135WBN	34	IN720276	2021-12-17 00:00:00	2
537	KGS6135WBA0060551	kite	Core	CORE GTS6 13.5 white/black	2021	\N	active	5	\N	\N	857.40	857.40	\N	{"size": "13.5", "color": ""}	2026-03-24 11:23:38.061712	KGS6135WBN	34	IN720276	2021-12-17 00:00:00	2
538	KGS6135WBA0067751	kite	Core	CORE GTS6 13.5 white/black	2021	\N	active	5	\N	\N	857.40	857.40	\N	{"size": "13.5", "color": ""}	2026-03-24 11:23:38.107623	KGS6135WBN	34	IN720276	2021-12-17 00:00:00	2
539	KGS617WBA0076971	kite	Core	CORE GTS6 17.0 white/black	2021	\N	active	5	\N	\N	953.40	953.40	\N	{"size": "17.0", "color": ""}	2026-03-24 11:23:38.152808	KGS617WBN	34	IN720276	2021-12-17 00:00:00	2
540	RSE3VE63732K35	bar_lines	Core	CORE Sensor 3+ Control Bar	2021	\N	active	5	\N	\N	299.40	299.40	\N	{"size": "", "color": ""}	2026-03-24 11:23:38.198173	RSE3VN	34	IN720276	2021-12-17 00:00:00	2
541	RSE3VE63706K35	bar_lines	Core	CORE Sensor 3+ Control Bar	2021	\N	active	5	\N	\N	299.40	299.40	\N	{"size": "", "color": ""}	2026-03-24 11:23:38.243186	RSE3VN	34	IN720276	2021-12-17 00:00:00	2
542	RSE3VE63742K35	bar_lines	Core	CORE Sensor 3+ Control Bar	2021	1	active	3	2026-03-24 11:23:54.061	\N	299.40	299.40	\N	{"size": "", "color": ""}	2026-03-24 11:23:38.28894	RSE3VN	34	IN720276	2021-12-17 00:00:00	2
78	KXR709BBA2039310	kite	Core	CORE XR7 9.0 black/black	2022	\N	in_transfer	4	2026-04-02 07:04:51.915	\N	675.95	675.95	\N	{"size": "9.0", "color": ""}	2026-03-10 18:13:42.896422	KXR709BBN	16	IN724301	2022-05-24 00:00:00	2
543	RSE3VE63966K36	bar_lines	Core	CORE Sensor 3+ Control Bar	2021	\N	active	5	\N	\N	299.40	299.40	\N	{"size": "", "color": ""}	2026-03-24 11:23:38.33371	RSE3VN	34	IN720276	2021-12-17 00:00:00	2
544	RSE3VE64003K36	bar_lines	Core	CORE Sensor 3+ Control Bar	2021	\N	active	5	\N	\N	299.40	299.40	\N	{"size": "", "color": ""}	2026-03-24 11:23:38.378604	RSE3VN	34	IN720276	2021-12-17 00:00:00	2
527	FKVI30S06-4618-58579	kite	Flysurfer	Viron	2020	1	active	4	\N	\N	\N	\N	\N	{"size": "6", "color": "Orange"}	2026-03-23 07:55:02.43907	\N	\N	\N	\N	\N
532	KPC109WBA5073733	kite	Core	Pace	2025	4	active	3	2026-04-02 07:08:26.729	\N	818.95	818.95	\N	{"size": "9.0", "color": "White/Black"}	2026-03-24 11:22:54.675947	KPC109WBN	33	RE/2025/09245	2025-12-02 00:00:00	2
528	KNX215WBA1107548	kite	Core	Nexus 2	2021	1	active	3	\N	\N	\N	\N	\N	{"size": "15"}	2026-03-23 11:24:09.22696	\N	\N	\N	\N	\N
506	M22AH33681-21F00011	board	North	Atmos	2022	1	active	3	\N	\N	365.00	\N	\N	{"size": "133", "boardType": "TwinTip"}	2026-03-19 10:03:03.394641	\N	\N	\N	\N	\N
507	M22AH38681-21H00087	board	North	Atmos	2022	1	active	4	\N	\N	365.00	\N	\N	{"size": "138", "boardType": "TwinTip"}	2026-03-19 11:07:38.705144	\N	\N	\N	\N	\N
508	M22AH38681-21H00088	board	North	Atmos	2022	1	active	4	\N	\N	365.00	\N	\N	{"size": "138", "boardType": "TwinTip"}	2026-03-19 11:08:46.81277	\N	\N	\N	\N	\N
509	M22AH41681-21H00017	board	North	Atmos	2022	1	active	4	\N	\N	365.00	\N	\N	{"size": "141", "boardType": "TwinTip"}	2026-03-19 11:09:21.55428	\N	\N	\N	\N	\N
510	M21PM41214-21F00019	board	North	Prime	2022	1	active	4	\N	\N	285.00	\N	\N	{"size": "141", "boardType": "TwinTip"}	2026-03-19 11:10:44.175476	\N	\N	\N	\N	\N
511	M22AH41681-21H00028	board	North	Atmos	2022	1	active	3	\N	\N	365.00	\N	\N	{"size": "141", "boardType": "TwinTip"}	2026-03-19 11:11:26.787642	\N	\N	\N	\N	\N
512	M21PM44214-21F00009	board	North	Prime	2022	1	active	3	\N	\N	285.00	\N	\N	{"size": "144", "boardType": "TwinTip"}	2026-03-19 11:12:07.651201	\N	\N	\N	\N	\N
513	M21PM44214-21F00003	board	North	Prime	2022	1	active	3	\N	\N	285.00	\N	\N	{"size": "144", "boardType": "TwinTip"}	2026-03-19 11:12:45.420682	\N	\N	\N	\N	\N
514	M21PM48214-21C00003	board	North	Prime	2022	1	active	3	\N	\N	285.05	\N	\N	{"size": "148", "boardType": "TwinTip"}	2026-03-19 11:13:34.027839	\N	\N	\N	\N	\N
515	M21PM48214-21C00004	board	North	Prime	2022	1	active	3	\N	\N	285.00	\N	\N	{"size": "148", "boardType": "TwinTip"}	2026-03-19 11:14:02.19346	\N	\N	\N	\N	\N
517	M22PM41306-21J00481	board	North	Prime	2022	1	active	3	\N	\N	285.00	\N	\N	{"size": "141", "boardType": "TwinTip"}	2026-03-19 11:14:41.94824	\N	\N	\N	\N	\N
518	M22AH38681-21H00066	board	North	Atmos	2022	1	active	4	\N	\N	365.00	\N	\N	{"size": "138", "boardType": "TwinTip"}	2026-03-19 11:15:18.582129	\N	\N	\N	\N	\N
519	M22H3868121H00087	board	North	Atmos	2022	1	active	4	\N	\N	365.00	\N	\N	{"size": "138", "boardType": "TwinTip"}	2026-03-19 11:16:17.81632	\N	\N	\N	\N	\N
520	M21PM44214-21F00006	board	North	Prime	2022	1	active	3	\N	\N	285.00	\N	\N	{"size": "144", "boardType": "TwinTip"}	2026-03-19 11:17:08.111323	\N	\N	\N	\N	\N
505	H22CR52100-21K00210	board	North	Cross	2022	1	active	4	\N	\N	768.00	\N	\N	{"size": "158", "boardType": "Directional"}	2026-03-19 09:00:54.363604	\N	\N	\N	\N	\N
521	RSE4SRNB92879N30	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.494332	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
526	RSE4SRNB93148N40	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.712424	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
525	RSE4SRNB93274N40	bar_lines	Core	Sensor 4	2026	1	active	5	\N	\N	329.45	329.45	\N	{"size": "", "color": ""}	2026-03-19 11:48:28.670062	RSE4SRN	32	RE/2026/01118	2026-03-02 00:00:00	2
529	KPC106BBA5071062	kite	Core	Pace	2025	\N	in_transfer	5	2026-04-02 07:07:09.811	\N	741.95	741.95	\N	{"size": "6.0", "color": "Black/Black"}	2026-03-24 11:22:54.534718	KPC106BBN	33	RE/2025/09245	2025-12-02 00:00:00	2
546	KPC108WBA5074633	kite	Core	Pace	2025	\N	in_transfer	3	2026-04-02 07:13:00.94	\N	796.95	796.95	\N	{"size": "8.0", "color": "White/Black"}	2026-04-02 07:12:09.673884	KPC108WBN	35	RE/2025/08327	2025-10-27 00:00:00	2
545	KPC108WBA5076233	kite	Core	Pace	2025	\N	in_transfer	3	2026-04-02 07:12:44.615	\N	796.95	796.95	\N	{"size": "8.0", "color": "White/Black"}	2026-04-02 07:12:09.626058	KPC108WBN	35	RE/2025/08327	2025-10-27 00:00:00	2
549	KNX106BBA8060753	kite	Core 	Nexus1	2019	2	active	2	\N	\N	\N	\N	\N	{"size": "6", "color": "Black"}	2026-04-02 11:58:21.105094	\N	\N	\N	\N	\N
548	KGS512BBA9029463	kite	Core	GTS5	2018	2	active	2	2026-04-02 11:55:57.101	\N	\N	\N	\N	{"size": "12", "color": "Black"}	2026-04-02 11:55:50.113828	\N	\N	\N	\N	\N
550	KNX107BBA8102924	kite	Core	Nexus1	2020	2	active	2	\N	\N	\N	\N	\N	{"size": "7", "color": "Black"}	2026-04-02 11:59:20.909778	\N	\N	\N	\N	\N
551	KNX108BBA8082283	kite	Core	Nexus1	2019	2	active	2	\N	\N	\N	\N	\N	{"size": "8", "color": "Black"}	2026-04-02 12:00:18.270246	\N	\N	\N	\N	\N
552	KNX108BBA8092393	kite	Core	Nexus1	2020	2	active	4	\N	\N	\N	\N	\N	{"size": "8", "color": "Black"}	2026-04-02 12:00:45.092197	\N	\N	\N	\N	\N
553	KNX110BBA9020205	kite	Core	Nexus1	2019	2	active	2	\N	\N	\N	\N	\N	{"size": "10", "color": "Black"}	2026-04-02 12:01:25.733664	\N	\N	\N	\N	\N
554	KNX111BBA80K1704	kite	Core	Nexus1	2020	2	active	3	\N	\N	\N	\N	\N	{"size": "11", "color": "Black"}	2026-04-02 12:01:56.320557	\N	\N	\N	\N	\N
555	KNX111BBA8099604	kite	Core	Nexus1	2020	2	active	2	\N	\N	\N	\N	\N	{"size": "11", "color": "Black"}	2026-04-02 12:02:22.329128	\N	\N	\N	\N	\N
556	KXR809BBA4015138	kite	Core	XR8	2024	2	active	2	\N	\N	\N	\N	\N	{"size": "9", "color": "Black"}	2026-04-02 12:03:20.900238	\N	\N	\N	\N	\N
557	271657090	kite	Flysurfer	Viron	2016	2	active	5	\N	\N	\N	\N	\N	{"size": "4", "color": "Orange"}	2026-04-02 12:04:15.544839	\N	\N	\N	\N	\N
558	271647102	kite	Flysurfer	Viron	2018	2	active	2	\N	\N	\N	\N	\N	{"size": "6", "color": "Orange"}	2026-04-02 12:04:51.899977	\N	\N	\N	\N	\N
559	221750658	kite	Flysurfer	Viron	2018	2	active	2	\N	\N	\N	\N	\N	{"size": "8", "color": "Orange"}	2026-04-02 12:05:15.762415	\N	\N	\N	\N	\N
560	9010583142821	kite	Duotone	Evo	2023	2	active	1	\N	\N	\N	\N	\N	{"size": "5"}	2026-04-02 12:06:18.252159	\N	\N	\N	\N	\N
561	9010583135625	kite	Duotone	Evo	2022	2	active	3	\N	\N	\N	\N	\N	{"size": "5"}	2026-04-02 12:06:47.594399	\N	\N	\N	\N	\N
562	9010583135632	kite	Duotone	Evo	2022	2	active	3	\N	\N	\N	\N	\N	{"size": "6"}	2026-04-02 12:07:14.846494	\N	\N	\N	\N	\N
563	9010583136479	kite	Duotone	Rebel SLS	2022	2	active	1	\N	\N	\N	\N	\N	{"size": "5"}	2026-04-02 12:07:45.683639	\N	\N	\N	\N	\N
564	9010583135588	kite	Duotone	Evo	2022	2	active	2	\N	\N	\N	\N	\N	{"size": "7"}	2026-04-02 12:08:13.313396	\N	\N	\N	\N	\N
565	SNADK22EV087568	kite	Duotone	Evo	2022	2	active	1	\N	\N	\N	\N	\N	{"size": "8"}	2026-04-02 12:08:38.316732	\N	\N	\N	\N	\N
566	9010583135595	kite	Duotone	Evo	2023	2	active	3	\N	\N	\N	\N	\N	{"size": "9"}	2026-04-02 12:09:21.04513	\N	\N	\N	\N	\N
567	9010583067902	kite	Duotone	Evo	2023	2	active	3	\N	\N	\N	\N	\N	{"size": "10"}	2026-04-02 12:10:02.813713	\N	\N	\N	\N	\N
568	9010583067964	kite	Duotone	Evo	2023	2	active	3	\N	\N	\N	\N	\N	{"size": "13"}	2026-04-02 12:10:31.173621	\N	\N	\N	\N	\N
569	SNGDK22EV060111	kite	Duotone	Evo	2022	2	active	1	\N	\N	\N	\N	\N	{"size": "3"}	2026-04-02 12:10:51.945309	\N	\N	\N	\N	\N
570	9010583136370	kite	Duotone	Rebel SLS	2023	2	active	1	\N	\N	\N	\N	\N	{"size": "5"}	2026-04-02 12:11:14.571561	\N	\N	\N	\N	\N
571	9010583136387	kite	Duotone	Rebel SLS	2023	2	active	1	\N	\N	\N	\N	\N	{"size": "9"}	2026-04-02 12:11:37.063522	\N	\N	\N	\N	\N
572	9010583136486	kite	Duotone	Rebel SLS	2023	2	active	1	\N	\N	\N	\N	\N	{"size": "9"}	2026-04-02 12:12:00.666587	\N	\N	\N	\N	\N
573	9010583136448	kite	Duotone	Rebel SLS	2023	2	active	3	\N	\N	\N	\N	\N	{"size": "11"}	2026-04-02 12:12:23.086742	\N	\N	\N	\N	\N
547	KPC108WBA5016071	kite	Core	Pace	2025	2	active	5	2026-04-18 00:34:46.635	\N	796.95	796.95	\N	{"size": "8.0", "color": "White/Black"}	2026-04-02 07:12:09.717956	KPC108WBN	35	RE/2025/08327	2025-10-27 00:00:00	2
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feedback (id, user_id, page_url, message, audio_url, screenshot_url, status, admin_notes, created_at, ticket_number) FROM stdin;
2	5	/equipment/464	rechnung nicht hochgeladen	\N	/objects/uploads/3a8f7f46-96d0-4b58-984e-4574dc07fb73	open	\N	2026-03-12 11:08:45.111625	FB-0002
5	5	/invoice-import	Der Rechnungsbetrag stimmt hier überein, gut wäre es wenn das System den einmal mit allen importierten Items abgleicht und eine Fehlermeldung gibt falls der Betrag nicht übereinstimmt.	\N	/objects/uploads/6116c63a-165f-4333-90f2-ffaf5b10d23e	open	\N	2026-03-12 15:07:23.55527	FB-0005
10	5	/settings	Das wäre auch super, um eine größere Anzahl an Items gleichzeitig hochzuladen. Nur leider nimmt er meine CSV-Datei nicht an.	\N	/objects/uploads/29909eab-05dd-4aeb-9825-bef74bc06480	open	\N	2026-03-13 07:30:04.941225	FB-0010
7	5	/equipment	Bei allen GTS steht als Model "einmaliger Sonderpreis"	\N	/objects/uploads/079703ae-bd76-4e93-8395-3bf2c213dcaf	in_progress	\N	2026-03-12 15:50:46.213658	FB-0007
6	5	/equipment	Gut wäre es, wenn man auf der linken Seite mehrere Items gleichzeitig auswählen könnte, um dann mehrere in eine Destination zu verschieben.	\N	/objects/uploads/b4b29ca2-cea9-4e5a-8266-96501a4a8e32	resolved	\N	2026-03-12 15:15:28.736662	FB-0006
4	5	/invoice-import	beim importieren der rechnung nimmt er nur eine bar, anstatt 6 Bars	\N	/objects/uploads/b84c70a3-a6e5-41d2-a929-08d0ab1aa248	resolved	\N	2026-03-12 15:05:27.164403	FB-0004
3	5	/users	Gerne allen Admins Rechte zum Bearbeiten des Equipments geben, falls Fehler beim Anlegen passiert sind (z.B. Kaufdatum oder generelle Rechtschreibfehler o.Ä.)	\N	/objects/uploads/219316f4-7f8e-4dc6-bafb-0e68af19d0ad	resolved	\N	2026-03-12 11:26:54.757102	FB-0003
1	1	/	\N	/objects/uploads/9092889e-6a9c-4cb0-bca1-177e48d7ed80	\N	resolved	\N	2026-03-11 11:15:43.952084	FB-0001
11	5	/feedback	Es werden alle Bars erfasst, jedoch werden die Bruttopreise addiert und als Kontrollsumme wird die Nettosumme genommen.	\N	\N	open	\N	2026-03-13 10:17:37.222461	FB-0011
9	5	/equipment/new	Besonders bei Zubehör wäre es super wenn wir gleich mehrere Items in einer Größe gleichzeitig erfassen könnten (z.B. 3 x Sitztrapez in S)	\N	/objects/uploads/97b12471-3d1c-4a38-85e9-8116b4affe23	resolved	\N	2026-03-12 15:55:13.058506	FB-0009
8	5	/equipment/new	Hier bräuchten wir bitte noch die Kategorie "Westen" und "Pumpen" um alles zu erfassen	\N	\N	resolved	\N	2026-03-12 15:53:07.375892	FB-0008
\.


--
-- Data for Name: feedback_attachments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feedback_attachments (id, feedback_id, url, type, created_at) FROM stdin;
1	11	/objects/uploads/e94f8fb6-1bf3-47cb-9d74-fca5406fb547	image	2026-03-13 10:17:37.297021
\.


--
-- Data for Name: feedback_comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feedback_comments (id, feedback_id, user_id, message, created_at) FROM stdin;
1	7	1	War das schon so, oder ist das in Folge einer Rechnung aufgetreten, die ihr importiert habt habt gestern	2026-03-13 09:03:45.572694
2	3	1	Ich habe dir jetzt das Recht gegeben. Kannst du mal ausprobieren, ob das funktioniert?	2026-03-13 09:25:46.473178
3	6	1	Das ist jetzt gefixt. Bitte einmal testen.	2026-03-13 09:28:48.080342
4	4	1	Das ist jetzt gefixt und ich habe ein Control Feature eingebaut. Bitte einmal testen.	2026-03-13 09:31:21.922897
5	7	5	ne das war schon vorher so	2026-03-13 09:59:14.089071
6	3	5	funktioniert, danke	2026-03-13 10:00:51.313542
7	4	5	Jetzt werden alle Bars erfasst	2026-03-13 10:16:08.356227
8	6	5	funktioniert, danke	2026-03-13 10:22:03.525704
9	11	1	Bekommst du jetzt eine Mail?	2026-03-13 10:30:13.71999
10	11	5	nein, nix bisher	2026-03-13 10:33:03.308162
11	11	1	bekommst du denn JETZT eine mail? 11:52	2026-03-13 10:52:14.123131
12	7	5	Erledigt, ist umbenannt	2026-03-13 10:57:14.328368
\.


--
-- Data for Name: inventory_check_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_check_items (id, check_id, equipment_id, checked, condition_rating, needs_repair, missing, notes, checked_at, checked_by, photos) FROM stdin;
8	2	542	0	\N	0	0	\N	\N	\N	\N
9	2	528	0	\N	0	0	\N	\N	\N	\N
10	2	527	0	\N	0	0	\N	\N	\N	\N
11	2	526	0	\N	0	0	\N	\N	\N	\N
12	2	525	0	\N	0	0	\N	\N	\N	\N
13	2	524	0	\N	0	0	\N	\N	\N	\N
14	2	523	0	\N	0	0	\N	\N	\N	\N
15	2	522	0	\N	0	0	\N	\N	\N	\N
16	2	521	0	\N	0	0	\N	\N	\N	\N
17	2	520	0	\N	0	0	\N	\N	\N	\N
18	2	519	0	\N	0	0	\N	\N	\N	\N
19	2	518	0	\N	0	0	\N	\N	\N	\N
20	2	517	0	\N	0	0	\N	\N	\N	\N
21	2	515	0	\N	0	0	\N	\N	\N	\N
22	2	514	0	\N	0	0	\N	\N	\N	\N
23	2	513	0	\N	0	0	\N	\N	\N	\N
24	2	512	0	\N	0	0	\N	\N	\N	\N
25	2	511	0	\N	0	0	\N	\N	\N	\N
26	2	510	0	\N	0	0	\N	\N	\N	\N
27	2	509	0	\N	0	0	\N	\N	\N	\N
28	2	508	0	\N	0	0	\N	\N	\N	\N
29	2	507	0	\N	0	0	\N	\N	\N	\N
30	2	506	0	\N	0	0	\N	\N	\N	\N
31	2	505	0	\N	0	0	\N	\N	\N	\N
32	2	498	0	\N	0	0	\N	\N	\N	\N
33	2	494	0	\N	0	0	\N	\N	\N	\N
34	2	486	0	\N	0	0	\N	\N	\N	\N
35	2	485	0	\N	0	0	\N	\N	\N	\N
36	2	484	0	\N	0	0	\N	\N	\N	\N
37	2	483	0	\N	0	0	\N	\N	\N	\N
38	2	482	0	\N	0	0	\N	\N	\N	\N
39	2	481	0	\N	0	0	\N	\N	\N	\N
40	2	480	0	\N	0	0	\N	\N	\N	\N
41	2	479	0	\N	0	0	\N	\N	\N	\N
42	2	427	0	\N	0	0	\N	\N	\N	\N
43	2	413	0	\N	0	0	\N	\N	\N	\N
44	2	412	0	\N	0	0	\N	\N	\N	\N
45	2	410	0	\N	0	0	\N	\N	\N	\N
46	2	409	0	\N	0	0	\N	\N	\N	\N
47	2	404	0	\N	0	0	\N	\N	\N	\N
48	2	396	0	\N	0	0	\N	\N	\N	\N
49	2	394	0	\N	0	0	\N	\N	\N	\N
50	2	393	0	\N	0	0	\N	\N	\N	\N
51	2	392	0	\N	0	0	\N	\N	\N	\N
52	2	390	0	\N	0	0	\N	\N	\N	\N
53	2	382	0	\N	0	0	\N	\N	\N	\N
54	2	379	0	\N	0	0	\N	\N	\N	\N
55	2	377	0	\N	0	0	\N	\N	\N	\N
56	2	374	0	\N	0	0	\N	\N	\N	\N
57	2	373	0	\N	0	0	\N	\N	\N	\N
58	2	371	0	\N	0	0	\N	\N	\N	\N
59	2	369	0	\N	0	0	\N	\N	\N	\N
60	2	366	0	\N	0	0	\N	\N	\N	\N
61	2	362	0	\N	0	0	\N	\N	\N	\N
62	2	359	0	\N	0	0	\N	\N	\N	\N
63	2	357	0	\N	0	0	\N	\N	\N	\N
64	2	356	0	\N	0	0	\N	\N	\N	\N
65	2	351	0	\N	0	0	\N	\N	\N	\N
66	2	350	0	\N	0	0	\N	\N	\N	\N
67	2	348	0	\N	0	0	\N	\N	\N	\N
68	2	341	0	\N	0	0	\N	\N	\N	\N
69	2	332	0	\N	0	0	\N	\N	\N	\N
70	2	327	0	\N	0	0	\N	\N	\N	\N
71	2	325	0	\N	0	0	\N	\N	\N	\N
72	2	324	0	\N	0	0	\N	\N	\N	\N
73	2	323	0	\N	0	0	\N	\N	\N	\N
74	2	322	0	\N	0	0	\N	\N	\N	\N
75	2	318	0	\N	0	0	\N	\N	\N	\N
76	2	317	0	\N	0	0	\N	\N	\N	\N
77	2	312	0	\N	0	0	\N	\N	\N	\N
78	2	298	0	\N	0	0	\N	\N	\N	\N
79	2	296	0	\N	0	0	\N	\N	\N	\N
80	2	290	0	\N	0	0	\N	\N	\N	\N
81	2	283	0	\N	0	0	\N	\N	\N	\N
82	2	268	0	\N	0	0	\N	\N	\N	\N
83	2	264	0	\N	0	0	\N	\N	\N	\N
84	2	262	0	\N	0	0	\N	\N	\N	\N
85	2	252	0	\N	0	0	\N	\N	\N	\N
86	2	248	0	\N	0	0	\N	\N	\N	\N
87	2	238	0	\N	0	0	\N	\N	\N	\N
88	2	231	0	\N	0	0	\N	\N	\N	\N
89	2	147	0	\N	0	0	\N	\N	\N	\N
90	2	141	0	\N	0	0	\N	\N	\N	\N
91	2	128	0	\N	0	0	\N	\N	\N	\N
92	2	114	0	\N	0	0	\N	\N	\N	\N
93	2	97	0	\N	0	0	\N	\N	\N	\N
95	2	87	0	\N	0	0	\N	\N	\N	\N
96	2	81	0	\N	0	0	\N	\N	\N	\N
97	2	76	0	\N	0	0	\N	\N	\N	\N
98	2	67	0	\N	0	0	\N	\N	\N	\N
99	2	52	0	\N	0	0	\N	\N	\N	\N
100	2	51	0	\N	0	0	\N	\N	\N	\N
101	2	50	0	\N	0	0	\N	\N	\N	\N
102	2	49	0	\N	0	0	\N	\N	\N	\N
103	2	48	0	\N	0	0	\N	\N	\N	\N
104	2	42	0	\N	0	0	\N	\N	\N	\N
105	2	41	0	\N	0	0	\N	\N	\N	\N
106	2	40	0	\N	0	0	\N	\N	\N	\N
107	2	39	0	\N	0	0	\N	\N	\N	\N
108	2	38	0	\N	0	0	\N	\N	\N	\N
109	2	37	0	\N	0	0	\N	\N	\N	\N
110	2	36	0	\N	0	0	\N	\N	\N	\N
111	2	35	0	\N	0	0	\N	\N	\N	\N
112	2	30	0	\N	0	0	\N	\N	\N	\N
115	3	571	0	\N	0	0	\N	\N	\N	\N
116	3	570	0	\N	0	0	\N	\N	\N	\N
117	3	569	0	\N	0	0	\N	\N	\N	\N
118	3	568	0	\N	0	0	\N	\N	\N	\N
119	3	567	0	\N	0	0	\N	\N	\N	\N
120	3	566	0	\N	0	0	\N	\N	\N	\N
121	3	565	0	\N	0	0	\N	\N	\N	\N
122	3	564	0	\N	0	0	\N	\N	\N	\N
123	3	563	0	\N	0	0	\N	\N	\N	\N
94	2	89	0	\N	1	0	Tuch gerissen kann repariert werden	\N	\N	{/objects/uploads/b11ba31d-92bc-4ce9-af80-cc13a44ab5e1}
113	3	573	0	\N	0	0	\N	\N	\N	\N
114	3	572	0	\N	0	0	\N	\N	\N	\N
124	3	562	0	\N	0	0	\N	\N	\N	\N
125	3	561	0	\N	0	0	\N	\N	\N	\N
126	3	560	0	\N	0	0	\N	\N	\N	\N
127	3	559	0	\N	0	0	\N	\N	\N	\N
128	3	558	0	\N	0	0	\N	\N	\N	\N
129	3	557	0	\N	0	0	\N	\N	\N	\N
130	3	556	0	\N	0	0	\N	\N	\N	\N
131	3	555	0	\N	0	0	\N	\N	\N	\N
132	3	554	0	\N	0	0	\N	\N	\N	\N
133	3	553	0	\N	0	0	\N	\N	\N	\N
134	3	552	0	\N	0	0	\N	\N	\N	\N
135	3	551	0	\N	0	0	\N	\N	\N	\N
136	3	550	0	\N	0	0	\N	\N	\N	\N
137	3	549	0	\N	0	0	\N	\N	\N	\N
138	3	548	0	\N	0	0	\N	\N	\N	\N
\.


--
-- Data for Name: inventory_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_checks (id, station_id, started_by, started_at, completed_at, status, total_items) FROM stdin;
1	1	1	2026-03-18 07:54:52.795929	2026-03-23 11:50:49.677	completed	7
2	1	8	2026-03-27 10:04:35.477151	\N	in_progress	105
3	2	10	2026-04-10 10:54:43.702981	\N	in_progress	26
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, supplier_id, invoice_number, invoice_date, delivery_date, order_number, total_net, total_gross, imported_at, imported_by, item_count) FROM stdin;
1	1	IN722118	02.03.2022	\N	\N	28085.55	34090.24	2026-03-04 08:51:08.213804	5	9
2	1	IN750162	23.08.2024	\N	505656	\N	1236.84	2026-03-10 18:07:15.835909	1	1
3	1	IN749010	25.07.2024	\N	\N	\N	2384.87	2026-03-10 18:07:48.035966	1	3
4	1	IN748777	18.07.2024	\N	\N	\N	869.59	2026-03-10 18:08:02.618842	1	1
5	1	IN747170	04.06.2024	\N	\N	\N	6626.52	2026-03-10 18:08:20.570163	1	8
6	1	IN746231	03.05.2024	\N	\N	\N	6172.22	2026-03-10 18:09:22.216858	1	9
7	1	IN742622	05.12.2023	\N	\N	\N	1917.57	2026-03-10 18:09:41.433738	1	2
8	1	IN735057	12.06.2023	\N	\N	\N	4608.02	2026-03-10 18:11:15.448328	1	6
9	1	IN734363	17.05.2023	\N	\N	\N	503.91	2026-03-10 18:11:37.953742	1	1
10	1	IN733830	02.05.2023	\N	\N	\N	1117.18	2026-03-10 18:11:59.374295	1	2
11	1	IN732519	20.02.2023	\N	\N	851.95	1035.27	2026-03-10 18:12:12.255077	1	1
12	1	IN731871	11.01.2023	\N	\N	912.45	1108.57	2026-03-10 18:12:26.909339	1	1
13	1	IN731701	20.12.2022	\N	\N	1138.80	1394.19	2026-03-10 18:12:41.809097	1	2
14	1	IN725520	22.06.2022	\N	\N	6749.60	8192.66	2026-03-10 18:12:54.469436	1	8
15	1	IN724450	30.05.2022	\N	\N	2011.35	2441.38	2026-03-10 18:13:28.262424	1	3
16	1	IN724301	24.05.2022	\N	\N	2703.80	3281.88	2026-03-10 18:13:42.757785	1	4
17	1	IN724093	19.05.2022	\N	\N	5297.60	6430.22	2026-03-10 18:13:55.561437	1	8
18	1	IN723678	05.05.2022	\N	\N	6683.05	8111.89	2026-03-10 18:14:09.341543	1	9
19	1	IN723226	26.04.2022	\N	\N	2340.25	2866.79	2026-03-10 18:14:29.313606	1	5
20	1	IN722896	11.04.2022	\N	\N	312.95	387.00	2026-03-10 18:14:40.440327	1	1
21	1	IN722597	30.03.2022	\N	\N	33200.20	40298.39	2026-03-10 18:14:59.730824	1	46
22	1	IN722118	02.03.2022	\N	\N	28085.55	34090.24	2026-03-10 18:16:02.992572	1	80
23	1	IN722079	01.03.2022	\N	\N	11424.60	14188.47	2026-03-10 18:16:26.087534	1	26
24	1	IN721725	16.02.2022	\N	\N	18933.75	22981.79	2026-03-10 18:16:57.901704	1	75
26	4	137742	17.08.2022	17.08.2022	QU-11484	4457.43	5304.34	2026-03-11 07:54:59.37649	1	8
27	4	135193	11.04.2022	11.04.2022	QU-11483	16191.93	19268.40	2026-03-11 07:55:45.717741	1	38
28	4	134725	17.03.2022	17.03.2022	QU-11482	14437.59	17180.73	2026-03-11 07:56:15.562571	1	48
29	1	RE/2026/01118	02.03.2026	02.03.2026	14247	7600.58	9044.69	2026-03-12 15:08:10.62659	5	8
30	1	RE/2024/01569	12.12.2024	04.12.2024	\N	945.45	1125.09	2026-03-19 07:57:37.89801	5	1
31	1	N/A	05.12.2024	04.12.2024	\N	5886.40	7004.82	2026-03-19 07:58:23.991918	5	10
32	1	RE/2026/01118	02.03.2026	02.03.2026	14247	7600.58	9044.69	2026-03-19 11:48:28.404241	5	6
33	1	RE/2025/09245	02.12.2025	02.12.2025	11867	2523.96	3003.50	2026-03-24 11:22:54.439338	5	4
34	1	IN720276	17.12.2021	\N	\N	9297.60	11306.25	2026-03-24 11:23:37.786796	5	12
35	1	RE/2025/08327	27.10.2025	27.10.2025	10917	2401.80	2858.14	2026-04-02 07:12:09.530104	5	3
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, title, message, link, read, created_at) FROM stdin;
14	5	feedback_status	FB-0008: Feedback updated	FB-0008: Status → "Resolved"	/feedback	t	2026-03-17 08:51:16.009374
10	1	feedback_new	Neues Feedback von Timo Erdmann	Es werden alle Bars erfasst, jedoch werden die Bruttopreise addiert und als Kont…	/feedback	t	2026-03-13 10:17:37.428771
1	5	feedback_comment	Neue Antwort auf dein Feedback	War das schon so, oder ist das in Folge einer Rechnung aufgetreten, die ihr impo…	/feedback	t	2026-03-13 09:03:45.667749
2	5	feedback_status	Feedback aktualisiert	Dein Feedback wurde auf „In Bearbeitung" gesetzt.	/feedback	t	2026-03-13 09:03:54.007759
3	5	feedback_comment	Neue Antwort auf dein Feedback	Ich habe dir jetzt das Recht gegeben. Kannst du mal ausprobieren, ob das funktio…	/feedback	t	2026-03-13 09:25:46.60847
4	5	feedback_status	Feedback aktualisiert	Dein Feedback wurde auf „In Bearbeitung" gesetzt.	/feedback	t	2026-03-13 09:25:55.05372
5	5	feedback_comment	Neue Antwort auf dein Feedback	Das ist jetzt gefixt. Bitte einmal testen.	/feedback	t	2026-03-13 09:28:48.206248
6	5	feedback_status	Feedback aktualisiert	Dein Feedback wurde auf „Erledigt" gesetzt.	/feedback	t	2026-03-13 09:28:52.410051
7	5	feedback_comment	Neue Antwort auf dein Feedback	Das ist jetzt gefixt und ich habe ein Control Feature eingebaut. Bitte einmal te…	/feedback	t	2026-03-13 09:31:22.054214
8	5	feedback_status	Feedback aktualisiert	Dein Feedback wurde auf „Erledigt" gesetzt.	/feedback	t	2026-03-13 09:31:28.962268
9	5	feedback_status	Feedback aktualisiert	Dein Feedback wurde auf „Erledigt" gesetzt.	/feedback	t	2026-03-13 10:09:54.865933
11	5	feedback_comment	FB-0011: Neue Antwort auf dein Feedback	Bekommst du jetzt eine Mail?	/feedback	t	2026-03-13 10:30:13.88889
12	5	feedback_comment	FB-0011: Neue Antwort auf dein Feedback	bekommst du denn JETZT eine mail? 11:52	/feedback	t	2026-03-13 10:52:14.249757
13	5	feedback_status	FB-0009: Feedback updated	FB-0009: Status → "Resolved"	/feedback	t	2026-03-17 08:51:08.189233
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at) FROM stdin;
1	4	7c03b4ad-329a-4894-ae22-796a48cf11a0	2026-03-25 12:37:49.742	2026-03-25 11:38:26.382
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.photos (id, equipment_id, url, uploaded_by, uploaded_at, caption) FROM stdin;
\.


--
-- Data for Name: price_list_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.price_list_items (id, price_list_id, sku, product_name, retail_price, dealer_price, product_type) FROM stdin;
178	2	684811533645	XR Pro 2 6.0	2849.00	2139.00	kite
179	2	684811533652	XR Pro 2 7.0	2949.00	2209.00	kite
180	2	684811533669	XR Pro 2 8.0	3049.00	2289.00	kite
181	2	684811533676	XR Pro 2 9.0	3149.00	2359.00	kite
182	2	684811533683	XR Pro 2 10.0	3249.00	2439.00	kite
183	2	684811533690	XR Pro 2 12.0	3449.00	2589.00	kite
184	2	684811523783	Pace Pro 5.0	2649.00	2009.00	kite
185	2	684811523127	Pace Pro 6.0	2749.00	2069.00	kite
186	2	684811523202	Pace Pro 7.0	2849.00	2149.00	kite
187	2	684811523288	Pace Pro 8.0	2949.00	2219.00	kite
188	2	684811523363	Pace Pro 9.0	3049.00	2309.00	kite
189	2	684811523448	Pace Pro 10.0	3149.00	2379.00	kite
190	2	684811523523	Pace Pro 12.0	3349.00	2539.00	kite
191	2	684811532389	Air Pro 15.0	3499.00	2639.00	kite
192	2	684811532396	Air Pro 17.0	3699.00	2789.00	kite
193	2	684811517362	XR8 5.0	1749.00	1319.00	kite
194	2	684811517423	XR8 6.0	1829.00	1389.00	kite
195	2	684811517485	XR8 7.0	1899.00	1459.00	kite
196	2	684811517546	XR8 8.0	1979.00	1489.00	kite
197	2	684811517607	XR8 9.0	2049.00	1529.00	kite
198	2	684811517669	XR8 10.0	2129.00	1599.00	kite
199	2	684811517720	XR8 11.0	2229.00	1689.00	kite
200	2	684811517782	XR8 12.0	2299.00	1739.00	kite
201	2	684811517843	XR8 13.5	2399.00	1809.00	kite
202	2	684811517904	XR8 LW 15.0	2499.00	1879.00	kite
203	2	684811517966	XR8 LW 17.0	2599.00	1949.00	kite
204	2	684811528528	Pace 5.0	1699.00	1279.00	kite
205	2	684811528580	Pace 6.0	1779.00	1349.00	kite
206	2	684811528641	Pace 7.0	1849.00	1419.00	kite
207	2	684811528702	Pace 8.0	1929.00	1449.00	kite
208	2	684811528764	Pace 9.0	1999.00	1489.00	kite
209	2	684811528825	Pace 10.0	2079.00	1559.00	kite
210	2	684811528887	Pace 11.0	2179.00	1649.00	kite
211	2	684811528948	Pace 12.0	2249.00	1699.00	kite
212	2	684811529006	Pace 13.5	2349.00	1769.00	kite
213	2	684811522892	Nexus 4 5.0	1699.00	1279.00	kite
214	2	684811522915	Nexus 4 6.0	1779.00	1349.00	kite
215	2	684811522939	Nexus 4 7.0	1849.00	1419.00	kite
216	2	684811522953	Nexus 4 8.0	1929.00	1449.00	kite
217	2	684811522977	Nexus 4 9.0	1999.00	1489.00	kite
218	2	684811522991	Nexus 4 10.0	2079.00	1559.00	kite
219	2	684811523011	Nexus 4 11.0	2179.00	1649.00	kite
220	2	684811523035	Nexus 4 12.0	2249.00	1699.00	kite
221	2	684811523059	Nexus 4 13.5	2349.00	1769.00	kite
222	2	684811523073	Nexus 4 LW 15.0	2499.00	1889.00	kite
223	2	684811523097	Nexus 4 LW 17.0	2599.00	1959.00	kite
224	2	684811532402	Air 15.0	2499.00	1889.00	kite
225	2	684811532419	Air 17.0	2599.00	1979.00	kite
226	2	684811527545	Section 5 5.0	1699.00	1279.00	kite
227	2	684811527552	Section 5 6.0	1779.00	1349.00	kite
228	2	684811527569	Section 5 7.0	1849.00	1419.00	kite
229	2	684811527576	Section 5 8.0	1929.00	1449.00	kite
230	2	684811527583	Section 5 9.0	1999.00	1489.00	kite
231	2	684811527590	Section 5 10.0	2079.00	1559.00	kite
232	2	684811527606	Section 5 12.0	2249.00	1699.00	kite
233	2	745742609219	Impact 2 7.0	1599.00	1209.00	kite
234	2	745742609240	Impact 2 8.0	1649.00	1249.00	kite
235	2	745742609271	Impact 2 9.0	1729.00	1309.00	kite
236	2	745742609301	Impact 2 11.0	1899.00	1449.00	kite
237	2	745742609332	Impact 2 13.0	2049.00	1549.00	kite
238	2	745742609363	Impact 2 15.0	2199.00	1649.00	kite
239	2	684811523578	Sensor 4 Bar	749.00	599.00	bar_lines
240	2	684811523561	Sensor 4 Pro Bar	849.00	669.00	bar_lines
241	2	684811523752	Sensor 4 Pro Compact Bar	849.00	669.00	bar_lines
242	2	684811524926	Imperator Pro 134x41	1999.00	1499.00	board
243	2	684811524933	Imperator Pro 136x41.5	1999.00	1499.00	board
244	2	684811524940	Imperator Pro 138x42	1999.00	1499.00	board
245	2	684811524957	Imperator Pro 140x42.5	1999.00	1499.00	board
246	2	684811508315	Imperator 7 130x39	1599.00	1199.00	board
247	2	684811508322	Imperator 7 133x40	1599.00	1199.00	board
248	2	684811508339	Imperator 7 135x41	1599.00	1199.00	board
249	2	684811508346	Imperator 7 137x42	1599.00	1199.00	board
250	2	684811508353	Imperator 7 139x42.5	1599.00	1199.00	board
251	2	684811508360	Imperator 7 141x43	1599.00	1199.00	board
252	2	684811508377	Imperator 7 LW 146x45	1599.00	1199.00	board
253	2	684811508384	Imperator 7 LW 152x48	1599.00	1199.00	board
254	2	684811526104	Imperator 7 Limited Edition Ultra Violet	1799.00	1349.00	board
255	2	684811526111	Imperator 7 Limited Edition Ambient Green	1799.00	1349.00	board
256	2	684811508599	Custom Imperator 7 base price	1599.00	1199.00	board
257	2	684811532303	Fusion 7 133x39.5	1149.00	869.00	board
258	2	684811532310	Fusion 7 135x40.5	1149.00	869.00	board
259	2	684811532327	Fusion 7 137x41.5	1149.00	869.00	board
260	2	684811532334	Fusion 7 139x42	1149.00	869.00	board
261	2	684811532341	Fusion 7 141x42.5	1149.00	869.00	board
262	2	684811532358	Fusion 7 144x43.5	1149.00	869.00	board
263	2	684811525558	Choice 6 134x40.5	1149.00	869.00	board
264	2	684811525565	Choice 6 136x41	1149.00	869.00	board
265	2	684811525572	Choice 6 138x41.5	1149.00	869.00	board
266	2	684811525589	Choice 6 140x42	1149.00	869.00	board
267	2	684811525596	Choice 6 142x42.5	1149.00	869.00	board
268	2	684811522724	Era 134x40	779.00	609.00	board
269	2	684811522731	Era 136x40.5	779.00	609.00	board
270	2	684811521765	Era 138x41	779.00	609.00	board
271	2	684811522748	Era 142x42	779.00	609.00	board
272	2	684811521772	Era 146x44	779.00	609.00	board
273	2	684811532259	Era 154x46	779.00	609.00	board
274	2	684811532242	Era 159x47	779.00	609.00	board
275	2	684811508131	Ultra 2 Set Pads & Straps, Size L	379.00	269.00	\N
276	2	684811508148	Ultra 2 Set Pads & Straps Size S	379.00	269.00	\N
277	2	684811518314	Union Pro 5 Set Pads & Straps Unisize	279.00	219.00	\N
278	2	684811518321	Union Pro 5 Set Pads & Straps Size XL	279.00	219.00	\N
279	2	684811533713	Badger Pro 5'2'' Waveboard (157,50cm)	1699.00	1349.00	board
280	2	684811533737	Badger 2 4'11'' Waveboard (149,50cm)	1349.00	1059.00	board
281	2	684811533744	Badger 2 5'2'' Waveboard (157,50cm)	1349.00	1059.00	board
282	2	684811533751	Badger 2 5'5" Waveboard (165,10cm)	1349.00	1059.00	board
283	2	684811526159	Ripper 5.1 5'4'' Waveboard (162,5cm)	1299.00	1029.00	board
284	2	684811526166	Ripper 5.1 5'8'' Waveboard (172,5cm)	1299.00	1029.00	board
285	2	684811526173	Ripper 5.1 5'11'' Waveboard (180,5cm)	1299.00	1029.00	board
286	2	684811522519	Green Room 3 5'6'' Waveboard (167,5cm)	1299.00	1029.00	board
287	2	684811522526	Green Room 3 5'8'' Waveboard (172,50cm)	1299.00	1029.00	board
288	2	684811521307	Green Room 3 5'10'' Waveboard (177,50cm)	1299.00	1029.00	board
289	2	684811521291	Green Room 3 6'0'' Waveboard (183,5cm)	1299.00	1029.00	board
290	2	684811518468	720 III 4'11'' Waveboard (149,5cm)	1299.00	1029.00	board
291	2	684811518499	720 III 5'1'' Waveboard (154,5cm)	1299.00	1029.00	board
292	2	684811518529	720 III 5'3'' Waveboard (160,5cm)	1299.00	1029.00	board
293	2	684811520850	Halo Pro 3.0	1949.00	1529.00	wing
294	2	684811520867	Halo Pro 4.0	2049.00	1619.00	wing
295	2	684811520874	Halo Pro 5.0	2179.00	1699.00	wing
296	2	684811520881	Halo Pro 6.0	2279.00	1779.00	wing
297	2	684811526074	Halo Pro 8.0	2649.00	2039.00	wing
298	2	684811533577	Halo 2.4	1229.00	959.00	wing
299	2	684811533584	Halo 3.0	1279.00	999.00	wing
300	2	684811533591	Halo 3.5	1349.00	1049.00	wing
301	2	684811533607	Halo 4.0	1399.00	1089.00	wing
302	2	684811533614	Halo 4.5	1449.00	1129.00	wing
303	2	684811533621	Halo 5.0	1499.00	1169.00	wing
304	2	684811533638	Halo 6.0	1599.00	1249.00	wing
305	2	684811513531	XC 2.5	929.00	669.00	wing
306	2	684811513555	XC 3.0	949.00	689.00	wing
307	2	684811513579	XC 3.5	979.00	709.00	wing
308	2	684811513593	XC 4.0	1029.00	739.00	wing
309	2	684811513616	XC 4.5	1049.00	769.00	wing
310	2	684811513630	XC 5.0	1099.00	789.00	wing
311	2	684811513654	XC 5.5	1129.00	819.00	wing
312	2	684811513678	XC 6.0	1179.00	839.00	wing
313	2	684811513692	XC 7.0	1199.00	869.00	wing
314	2	684811521147	Roamer S Wingfoilboard 38 l	2099.00	1629.00	foilboard
315	2	684811521178	Roamer S Wingfoilboard 45 l	2099.00	1629.00	foilboard
316	2	684811522823	Roamer S Wingfoilboard 63 l	2199.00	1729.00	foilboard
317	2	684811522854	Roamer S Wingfoilboard 78 l	2199.00	1729.00	foilboard
318	2	684811533539	Roamer S Wingfoilboard 90 l	2299.00	1799.00	foilboard
319	2	684811512886	Roamer Wingfoilboard 55 l	1799.00	1349.00	foilboard
320	2	684811512893	Roamer Wingfoilboard 70 l	1799.00	1349.00	foilboard
321	2	684811512909	Roamer Wingfoilboard 90 l	1799.00	1349.00	foilboard
322	2	684811533867	Roamer E Wingfoilboard 110 l	1499.00	1129.00	foilboard
323	2	684811533874	Roamer E Wingfoilboard 130 l	1499.00	1129.00	foilboard
324	2	684811533829	Chase Wingfoilboard 110 l	2299.00	1799.00	foilboard
325	2	684811534550	CFS Frontwing Spectrum 850 cm²	579.00	449.00	foil
326	2	684811534147	CFS Frontwing Spectrum 1250 cm²	579.00	449.00	foil
327	2	684811534154	CFS Frontwing Spectrum 1550 cm²	579.00	449.00	foil
328	2	684811534161	CFS Frontwing Spectrum 1850 cm²	579.00	449.00	foil
329	2	684811534178	CFS Frontwing Spectrum 2150 cm²	579.00	449.00	foil
330	2	684811534093	CFS Frontwing VERT 700 cm²	729.00	539.00	foil
331	2	684811534109	CFS Frontwing VERT 850 cm²	729.00	539.00	foil
332	2	684811534116	CFS Frontwing VERT 1050 cm²	729.00	539.00	foil
333	2	684811533881	CFS Frontwing Pulse 1990 cm²	799.00	599.00	foil
334	2	684811533898	CFS Stabilizer 190 cm²	299.00	239.00	foil
335	2	684811534086	CFS Stabilizer 220 cm²	299.00	239.00	foil
336	2	684811534123	CFS Stabilizer 300 cm²	259.00	209.00	foil
337	2	684811533973	CFS Carbon Mast 74 cm	1429.00	1069.00	foil
338	2	684811533980	CFS Carbon Mast 82 cm	1429.00	1069.00	foil
339	2	684811533997	CFS Carbon Mast 90 cm	1429.00	1069.00	foil
340	2	684811534048	CFS Aluminium Mastbase	249.00	199.00	foil
341	2	684811534055	CFS Fuselage 60 cm	329.00	259.00	foil
342	2	684811534185	CFS Fuselage 64 cm	329.00	259.00	foil
343	2	684811534062	CFS Fuselage 70 cm	329.00	259.00	foil
344	2	684811504102	SLC Mastbase	239.00	189.00	foil
345	2	684811504133	SLC Stabilizer (Rear Wing)	259.00	209.00	foil
346	2	684811503990	SLC Frontwing 1000	549.00	439.00	foil
347	2	684811504003	SLC Frontwing 1250	549.00	439.00	foil
348	2	684811504072	SLC Fuselage	309.00	249.00	foil
349	2	684811534239	Beachflag black/white/yellow	209.00	119.00	\N
350	2	684811516082	Link Kite Waist Harness XS	299.00	209.00	harness
351	2	684811516020	Link Kite Waist Harness S	299.00	209.00	harness
352	2	684811515993	Link Kite Waist Harness M	299.00	209.00	harness
353	2	684811515962	Link Kite Waist Harness L	299.00	209.00	harness
354	2	684811516051	Link Kite Waist Harness XL	299.00	209.00	harness
\.


--
-- Data for Name: price_lists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.price_lists (id, supplier, uploaded_at, item_count, is_active, uploaded_by, valid_from, valid_to, name) FROM stdin;
2	Core	2026-03-10 17:57:39.465269	177	t	1	2025-12-04 00:00:00	\N	#65
\.


--
-- Data for Name: repairs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.repairs (id, equipment_id, description, cost, status, logged_by, date) FROM stdin;
4	283	Damage report: Safety Leine core Bar 3s gerissen	\N	pending	8	2026-03-24 14:17:05.616704
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_items (id, sale_id, equipment_id, "position", description, serial_number, sku, quantity, unit_price, total) FROM stdin;
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_invoices (id, invoice_number, invoice_date, delivery_date, customer_id, payment_method, payment_terms, vat_type, vat_rate, vat_note, notes, total_net, total_vat, total_gross, status, created_at, created_by, damage_report_id, pdf_url, customer_type) FROM stdin;
1	Inv-KWS-2026-1001	2026-03-04	\N	1	bank_transfer	14 Tage ohne Abzug	standard_19	19.00	\N	\N	576.95	109.62	686.57	confirmed	2026-03-04 08:55:40.789252	5	\N	\N	\N
\.


--
-- Data for Name: school_booking_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_booking_items (id, booking_id, product_id, product_name, category, quantity, unit_price, line_total) FROM stdin;
\.


--
-- Data for Name: school_bookings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_bookings (id, school_config_id, booking_number, customer_id, customer_name, customer_email, payment_status, total_amount, currency, notes, created_at, created_by, booking_date, email_sent_at, pdf_url, booking_version_bos) FROM stdin;
\.


--
-- Data for Name: school_configs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_configs (id, station_id, school_name, currency, is_active, contact_email, created_at, destination_code_bos) FROM stdin;
1	1	KiteWorldWide Dakhla School	MAD	t	\N	2026-03-17 10:43:32.553981	\N
\.


--
-- Data for Name: school_customer_documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_customer_documents (id, customer_id, category, object_key, file_name, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: school_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_customers (id, school_config_id, first_name, last_name, email, phone, nationality, date_of_birth, kite_level, weight_kg, emergency_contact, notes, created_at, arrival_date, departure_date, created_by, guest_type, bos_customer_number) FROM stdin;
1	1	Sophie	Müller	sophie.mueller@gmail.com	+49 170 1234567	Germany	1992-05-15	Beginner	62	Hans Müller +49 170 9876543	First kite trip, very excited	2026-03-17 21:45:24.169773	2026-03-14	2026-03-21	\N	KiteWorldWide	\N
2	1	Jean-Pierre	Dubois	jp.dubois@outlook.fr	+33 6 12345678	France	1988-11-20	Intermediate	78	Marie Dubois +33 6 87654321	\N	2026-03-17 21:45:24.169773	2026-03-15	2026-03-22	\N	KiteWorldWide	\N
3	1	Carlos	Rodriguez	carlos.r@yahoo.es	+34 612 345 678	Spain	1995-03-08	Advanced	82	Ana Rodriguez +34 612 876 543	Wants to try foiling	2026-03-17 21:45:24.169773	2026-03-16	2026-03-18	\N	Walk-in	\N
4	1	Emma	Thompson	emma.t@icloud.com	+44 7700 123456	United Kingdom	1990-08-25	Pro	65	James Thompson +44 7700 654321	Competition rider, bringing own gear	2026-03-17 21:45:24.169773	2026-03-10	2026-03-24	\N	Walk-in	\N
\.


--
-- Data for Name: school_expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_expenses (id, school_config_id, amount, currency, category, description, expense_date, receipt_url, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: school_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_products (id, school_config_id, name, description, category, default_price, is_active, sort_order, created_at, source, bos_code) FROM stdin;
1	1	5-Day Beginner Course	\N	Course	6500.00	t	1	2026-03-17 10:43:32.602798	walkin	\N
2	1	3-Day Refresher Course	\N	Course	4200.00	t	2	2026-03-17 10:43:32.602798	walkin	\N
3	1	Private Lesson 1h	\N	Lesson	800.00	t	3	2026-03-17 10:43:32.602798	walkin	\N
4	1	Private Lesson 2h	\N	Lesson	1400.00	t	4	2026-03-17 10:43:32.602798	walkin	\N
5	1	3h Lesson Package	\N	Package	2100.00	t	5	2026-03-17 10:43:32.602798	walkin	\N
6	1	Kite Rental per Day	\N	Rental	500.00	t	6	2026-03-17 10:43:32.602798	walkin	\N
7	1	Harness Rental per Day	\N	Rental	200.00	t	7	2026-03-17 10:43:32.602798	walkin	\N
8	1	Foil Lesson 1h	\N	Lesson	1000.00	t	8	2026-03-17 10:43:32.602798	walkin	\N
9	1	Wing Lesson 1h	\N	Lesson	900.00	t	9	2026-03-17 10:43:32.602798	walkin	\N
10	1	Downwinder Tour	\N	Other	1200.00	t	10	2026-03-17 10:43:32.602798	walkin	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
kMvLL9u5YBCnY14-fHqaCQ2H3aAaJhM5	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-03T08:01:47.921Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2026-05-01 23:42:04
yHOx8IL9S5ugcQ5OP71aERnFgm2uAA8n	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-19T11:09:05.776Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":8}}	2026-05-02 14:20:37
edLoPvIdYP7z0n6QfEOCdP_lD8UsO_vr	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:00:33.801Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-05-15 09:29:46
Ak1Et6yvrQZOLbnu00D9Zuw94nG8wGWY	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-05-02T11:08:18.400Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":8}}	2026-05-16 14:18:52
4Hpbf08woqbHBEpPXQKEb1Pd1zltxUSK	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:38:42.279Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2026-05-15 14:28:11
GtaYD9c2jxgETLBAm-vdbOGF8xAF6DbZ	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T09:09:27.589Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":9}}	2026-04-30 10:26:21
A_yvKH03sRNU1Jz4-N8CnOJupKH6fZ-a	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:39:57.101Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}	2026-04-24 11:43:04
e6VtsLHwskmvzXb6zocXnyt5Yts8KxmF	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-18T18:36:02.207Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":5}}	2026-05-17 13:54:00
ZSu5QXXAY54lDi6iJ8aP4HNQJKrK4Ieo	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-05-14T14:05:38.788Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-05-19 11:33:19
11Mh3LglU_kFgddrv31ptsJv2wLRXsoh	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-05-18T00:32:34.559Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":10}}	2026-05-19 13:32:12
Psp33KrTlGbsXTDEaeHQVZAojHS2g5iV	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-05-02T15:22:45.376Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":10}}	2026-05-20 01:53:49
vCjRH8u4UagettinEvz3HFXmBy7AgJdk	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-25T09:25:24.759Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-05-01 14:35:17
BKzptjpqJFZaq2Tu3V9eaQQIueyA9g9x	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-20T18:56:12.605Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":8}}	2026-04-24 16:55:53
QUCDjFpsOqQRIiJy3QQtSrd4Wvz_w_ul	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-03T07:43:05.736Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-04-21 16:30:31
2dnMpUB6au6rs8Vwko6P0ELBpudXwqMj	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-05-02T07:59:29.849Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":10}}	2026-05-17 15:26:03
HXJ74ZGv5Q8k2BG4PR_yug7YYRU0Fgw0	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T08:06:53.503Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":5}}	2026-05-17 08:19:33
\.


--
-- Data for Name: stations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stations (id, name, location, country, is_virtual, sort_order) FROM stdin;
1	Dakhla	Dakhla	Morocco	f	1
2	Tatajuba	Tatajuba	Brazil	f	2
4	Office Hamburg Warehouse	Hamburg	Germany	f	3
5	Service Center Heidenau	Heidenau	Germany	f	4
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, color, created_at) FROM stdin;
1	Core	#f97316	2026-03-03 16:26:18.530286
2	Duotone	#8b5cf6	2026-03-11 07:52:26.62693
3	North	#0ea5e9	2026-03-11 07:52:26.679182
4	Eleveight	#10b981	2026-03-11 07:52:26.724568
5	Cabrinha	#ef4444	2026-03-11 07:52:26.769543
6	ION	#64748b	2026-03-11 07:52:26.814334
7	Mystic	#f59e0b	2026-03-11 07:52:26.85926
8	Manera	#ec4899	2026-03-11 07:52:26.904023
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transfers (id, equipment_id, from_station_id, to_station_id, initiated_by, confirmed_by, initiated_at, confirmed_at, status, arrived_condition, missing) FROM stdin;
53	480	4	1	5	8	2026-03-12 15:15:37.271737	2026-03-20 10:56:42.052	confirmed	5	f
99	41	4	1	5	8	2026-03-18 08:38:26.416143	2026-03-20 11:23:27.202	confirmed	3	f
54	481	4	1	5	8	2026-03-12 15:15:46.375224	2026-03-21 09:29:36.942	confirmed	5	f
55	482	4	1	5	8	2026-03-12 15:15:54.791347	2026-03-21 09:30:03.477	confirmed	5	f
52	479	4	1	5	8	2026-03-12 15:13:56.671081	2026-03-21 09:30:46.447	confirmed	5	f
84	42	4	1	5	8	2026-03-18 08:29:54.794639	2026-03-21 09:43:41.174	confirmed	4	f
22	134	4	4	5	5	2026-03-12 08:34:24.270066	2026-03-12 08:36:54.999	confirmed	4	f
38	321	4	4	5	5	2026-03-12 11:24:55.8712	2026-03-12 11:28:09.329	confirmed	3	f
37	272	4	4	5	5	2026-03-12 11:23:47.863119	2026-03-12 11:28:20.407	confirmed	3	f
36	397	4	4	5	5	2026-03-12 11:22:51.136618	2026-03-12 11:28:26.31	confirmed	3	f
35	401	4	4	5	5	2026-03-12 11:21:51.480593	2026-03-12 11:28:30.114	confirmed	3	f
39	353	4	4	5	5	2026-03-12 11:35:32.185665	2026-03-12 11:35:46.59	confirmed	4	f
34	425	4	4	5	5	2026-03-12 11:13:39.33939	2026-03-12 11:36:28.871	confirmed	5	f
33	419	4	4	5	5	2026-03-12 10:58:48.252036	2026-03-12 11:36:32.174	confirmed	5	f
32	422	4	4	5	5	2026-03-12 10:58:36.593363	2026-03-12 11:36:35.652	confirmed	5	f
31	439	4	4	5	5	2026-03-12 10:58:25.946196	2026-03-12 11:36:40.48	confirmed	5	f
30	416	4	4	5	5	2026-03-12 10:58:13.645815	2026-03-12 11:36:43.773	confirmed	5	f
29	421	4	4	5	5	2026-03-12 10:57:53.183609	2026-03-12 11:36:48.154	confirmed	5	f
28	438	4	4	5	5	2026-03-12 10:57:41.880929	2026-03-12 11:36:51.827	confirmed	5	f
27	418	4	4	5	5	2026-03-12 10:57:29.296977	2026-03-12 11:36:55.335	confirmed	5	f
26	235	4	4	5	5	2026-03-12 10:57:05.345049	2026-03-12 11:36:58.425	confirmed	5	f
25	415	4	4	5	5	2026-03-12 10:56:37.999771	2026-03-12 11:37:01.541	confirmed	5	f
24	437	4	4	5	5	2026-03-12 10:56:26.57714	2026-03-12 11:37:06.101	confirmed	5	f
23	414	4	4	5	5	2026-03-12 10:55:57.330667	2026-03-12 11:37:09.012	confirmed	5	f
40	140	4	4	5	5	2026-03-12 11:45:49.041056	2026-03-12 11:45:54.359	confirmed	4	f
41	243	4	4	5	5	2026-03-12 11:48:32.990364	2026-03-12 11:48:37.891	confirmed	3	f
42	395	4	4	5	5	2026-03-12 11:50:51.270272	2026-03-12 11:50:55.463	confirmed	4	f
43	375	4	4	5	5	2026-03-12 11:54:10.364787	2026-03-12 11:54:16.068	confirmed	3	f
44	372	4	4	5	5	2026-03-12 13:13:13.079435	2026-03-12 13:13:17.526	confirmed	4	f
45	72	4	4	5	5	2026-03-12 13:17:52.689001	2026-03-12 13:17:58.947	confirmed	3	f
46	71	4	4	5	5	2026-03-12 13:38:35.6634	2026-03-12 13:39:55.055	confirmed	4	f
47	428	4	4	5	5	2026-03-12 13:53:38.205427	2026-03-12 13:53:43.981	confirmed	4	f
48	420	4	4	5	5	2026-03-12 13:54:42.094549	2026-03-12 13:54:47.095	confirmed	4	f
49	240	4	4	5	5	2026-03-12 13:55:23.593365	2026-03-12 13:55:33.882	confirmed	3	f
50	241	4	4	5	5	2026-03-12 13:57:19.128672	2026-03-12 13:57:27.372	confirmed	3	f
51	449	4	4	5	5	2026-03-12 13:59:35.349241	2026-03-12 15:10:53.357	confirmed	4	f
61	360	4	4	5	5	2026-03-12 15:49:55.17135	2026-03-12 15:50:10.771	confirmed	4	f
98	87	4	1	5	8	2026-03-18 08:38:08.828028	2026-03-21 09:48:19.041	confirmed	3	f
120	49	4	1	5	8	2026-03-18 09:07:40.726397	2026-03-21 09:49:06.971	confirmed	3	f
56	483	4	1	5	8	2026-03-12 15:16:06.79578	2026-03-21 09:50:49.132	confirmed	5	f
102	128	4	1	5	8	2026-03-18 08:41:31.060393	2026-03-21 16:19:46.406	confirmed	3	f
107	97	4	1	5	8	2026-03-18 08:55:35.965618	2026-03-21 16:26:50.956	confirmed	3	f
62	37	4	1	5	8	2026-03-13 10:21:13.819948	2026-03-21 16:32:21.092	confirmed	4	f
63	36	4	1	5	8	2026-03-13 10:21:14.000179	2026-03-21 16:38:52.744	confirmed	4	f
64	35	4	1	5	8	2026-03-13 10:21:14.164355	2026-03-21 16:40:41.244	confirmed	4	f
114	147	4	1	5	8	2026-03-18 08:57:53.508875	2026-03-21 16:43:21.231	confirmed	3	f
86	341	4	1	5	8	2026-03-18 08:31:41.729488	2026-03-21 16:45:54.208	confirmed	2	f
95	348	4	1	5	8	2026-03-18 08:35:36.532432	2026-03-23 10:49:06.812	confirmed	3	f
96	350	4	1	5	8	2026-03-18 08:36:09.55391	2026-03-23 10:55:56.27	confirmed	3	f
101	76	4	1	5	8	2026-03-18 08:41:03.291281	2026-03-23 11:16:44.86	confirmed	4	f
103	356	4	1	5	8	2026-03-18 08:41:50.117619	2026-03-23 11:21:03.096	confirmed	3	f
112	141	4	1	5	8	2026-03-18 08:57:04.739573	2026-03-23 11:26:13.026	confirmed	3	f
104	359	4	1	5	8	2026-03-18 08:54:33.227594	2026-03-23 11:53:18.173	confirmed	3	f
106	357	4	1	5	8	2026-03-18 08:55:19.035729	2026-03-23 11:55:27.343	confirmed	3	f
111	40	4	1	5	8	2026-03-18 08:56:39.324128	2026-03-23 12:02:04.694	confirmed	4	f
121	51	4	1	5	8	2026-03-18 09:07:57.729223	2026-03-23 12:04:09.241	confirmed	4	f
79	38	4	1	5	8	2026-03-18 08:27:15.693247	2026-03-23 12:12:27.303	confirmed	3	f
110	369	4	1	5	8	2026-03-18 08:56:20.9832	2026-03-23 12:14:14.066	confirmed	4	f
94	377	4	1	5	8	2026-03-18 08:35:13.488236	2026-03-23 12:27:20.345	confirmed	4	f
119	393	4	1	5	8	2026-03-18 09:07:19.851586	2026-03-23 12:29:39.304	confirmed	4	f
108	374	4	1	5	8	2026-03-18 08:55:51.581797	2026-03-23 12:33:53.824	confirmed	4	f
118	392	4	1	5	8	2026-03-18 09:07:02.073058	2026-03-23 12:38:39.628	confirmed	5	f
117	382	4	1	5	8	2026-03-18 09:06:34.328503	2026-03-23 12:40:29.704	confirmed	5	f
92	379	4	1	5	8	2026-03-18 08:34:43.410145	2026-03-23 12:42:16.175	confirmed	4	f
93	390	4	1	5	8	2026-03-18 08:34:58.617346	2026-03-23 12:43:36.378	confirmed	4	f
109	371	4	1	5	8	2026-03-18 08:56:06.214875	2026-03-23 12:45:19.477	confirmed	5	f
59	486	4	1	5	8	2026-03-12 15:16:36.717441	2026-03-23 13:17:32.948	confirmed	5	f
91	81	4	1	5	8	2026-03-18 08:34:24.885318	2026-03-24 12:27:03.804	confirmed	3	f
58	485	4	1	5	8	2026-03-12 15:16:25.620759	2026-03-24 13:21:58.107	confirmed	5	f
97	89	4	1	5	8	2026-03-18 08:37:47.62113	2026-03-27 09:31:06.222	confirmed	3	f
83	114	4	1	5	8	2026-03-18 08:29:35.423474	2026-03-27 09:34:19.665	confirmed	3	f
57	484	4	1	5	8	2026-03-12 15:16:16.198454	2026-03-27 09:39:44.889	confirmed	5	f
81	366	4	1	5	8	2026-03-18 08:28:46.001465	2026-03-27 09:47:27.283	confirmed	3	f
105	355	4	1	5	8	2026-03-18 08:54:57.347553	2026-04-02 11:06:13.291	confirmed	3	f
88	344	4	1	5	8	2026-03-18 08:32:41.99697	2026-04-02 11:08:30.131	confirmed	3	f
87	53	4	1	5	8	2026-03-18 08:32:16.608818	2026-04-02 11:10:02.584	confirmed	3	f
85	337	4	1	5	\N	2026-03-18 08:30:29.662218	\N	cancelled	\N	f
60	152	4	1	5	5	2026-03-12 15:23:40.247407	2026-04-02 13:05:01.797	confirmed	3	f
82	367	4	1	5	\N	2026-03-18 08:29:17.326259	\N	cancelled	\N	f
90	120	4	1	5	\N	2026-03-18 08:33:52.203534	\N	cancelled	\N	f
100	77	4	1	5	\N	2026-03-18 08:39:55.447341	\N	cancelled	\N	f
124	50	4	1	5	8	2026-03-18 09:08:47.197556	2026-03-21 09:42:36.706	confirmed	4	f
148	67	4	1	5	8	2026-03-19 07:48:52.71605	2026-03-21 16:24:16.808	confirmed	3	f
150	498	4	1	5	8	2026-03-19 08:07:19.545125	2026-03-21 16:48:31.983	confirmed	4	f
178	332	4	1	5	8	2026-03-23 09:26:52.28601	2026-03-23 10:36:40.849	confirmed	3	f
149	39	4	1	5	8	2026-03-19 07:49:14.352708	2026-03-23 10:41:15.811	confirmed	4	f
122	48	4	1	5	8	2026-03-18 09:08:14.079366	2026-03-23 10:45:35.619	confirmed	3	f
151	494	4	1	5	8	2026-03-19 08:10:25.372428	2026-03-23 10:47:19.329	confirmed	3	f
127	30	4	1	5	8	2026-03-18 09:09:43.563437	2026-03-23 10:53:25.487	confirmed	4	f
123	52	4	1	5	8	2026-03-18 09:08:30.527212	2026-03-23 11:58:33.737	confirmed	3	f
181	362	4	1	5	8	2026-03-23 11:24:59.505089	2026-03-23 12:06:11.458	confirmed	3	f
180	528	4	1	5	8	2026-03-23 11:24:20.026035	2026-03-23 12:08:48.025	confirmed	3	f
179	351	4	1	5	8	2026-03-23 11:22:22.717011	2026-03-23 12:10:57.798	confirmed	3	f
170	231	4	1	5	8	2026-03-19 11:46:09.489028	2026-03-23 13:09:39.694	confirmed	4	f
169	506	4	1	5	8	2026-03-19 11:22:06.031429	2026-03-23 13:10:14.719	confirmed	3	f
168	507	4	1	5	8	2026-03-19 11:22:05.861201	2026-03-23 13:10:31.612	confirmed	4	f
167	508	4	1	5	8	2026-03-19 11:22:05.690398	2026-03-23 13:10:43.506	confirmed	4	f
166	509	4	1	5	8	2026-03-19 11:22:05.5193	2026-03-23 13:10:57.918	confirmed	4	f
165	510	4	1	5	8	2026-03-19 11:22:05.349033	2026-03-23 13:11:10.479	confirmed	4	f
164	511	4	1	5	8	2026-03-19 11:22:05.178029	2026-03-23 13:11:30.96	confirmed	3	f
163	512	4	1	5	8	2026-03-19 11:22:05.007182	2026-03-23 13:13:36.144	confirmed	3	f
162	513	4	1	5	8	2026-03-19 11:22:04.83605	2026-03-23 13:13:53.228	confirmed	3	f
161	514	4	1	5	8	2026-03-19 11:22:04.664055	2026-03-23 13:14:10.998	confirmed	3	f
160	515	4	1	5	8	2026-03-19 11:22:04.493478	2026-03-23 13:14:28.914	confirmed	3	f
159	517	4	1	5	8	2026-03-19 11:22:04.32167	2026-03-23 13:14:42.768	confirmed	3	f
158	518	4	1	5	8	2026-03-19 11:22:04.149468	2026-03-23 13:15:06.054	confirmed	4	f
157	519	4	1	5	8	2026-03-19 11:21:18.754264	2026-03-23 13:15:21.916	confirmed	4	f
156	248	4	1	5	8	2026-03-19 11:20:53.047945	2026-03-23 13:15:31.581	confirmed	4	f
155	520	4	1	5	8	2026-03-19 11:20:31.741419	2026-03-23 13:15:55.303	confirmed	3	f
154	252	4	1	5	8	2026-03-19 11:18:26.254398	2026-03-23 13:15:59.863	confirmed	4	f
153	505	4	1	5	8	2026-03-19 11:18:08.321551	2026-03-23 13:16:08.766	confirmed	4	f
152	427	4	1	5	8	2026-03-19 11:17:45.087974	2026-03-23 13:16:16.503	confirmed	4	f
171	238	4	1	5	8	2026-03-19 11:46:41.10117	2026-03-23 13:36:44.26	confirmed	4	f
182	373	4	1	5	8	2026-03-23 12:50:46.64511	2026-03-24 09:54:45.109	confirmed	4	f
172	521	4	1	5	8	2026-03-19 11:49:18.958924	2026-03-24 09:55:18.287	confirmed	5	f
177	526	4	1	5	8	2026-03-19 11:49:19.802133	2026-03-24 09:55:42.881	confirmed	5	f
176	525	4	1	5	8	2026-03-19 11:49:19.633896	2026-03-24 09:58:02.158	confirmed	5	f
139	317	4	1	5	8	2026-03-18 09:36:49.058813	2026-03-24 09:58:33.058	confirmed	4	f
138	283	4	1	5	8	2026-03-18 09:36:23.320453	2026-03-24 10:00:53.894	confirmed	3	f
174	523	4	1	5	8	2026-03-19 11:49:19.298377	2026-03-24 10:17:56.348	confirmed	5	f
173	522	4	1	5	8	2026-03-19 11:49:19.12914	2026-03-24 10:18:26.553	confirmed	5	f
175	524	4	1	5	8	2026-03-19 11:49:19.46565	2026-03-24 10:18:57.399	confirmed	5	f
134	324	4	1	5	8	2026-03-18 09:34:53.686606	2026-03-24 10:42:14.245	confirmed	3	f
140	296	4	1	5	8	2026-03-18 09:37:04.599032	2026-03-24 10:42:53.086	confirmed	3	f
143	404	4	1	5	5	2026-03-18 09:38:02.626678	2026-03-27 09:02:10.362	confirmed	4	f
147	409	4	1	5	5	2026-03-18 09:39:17.454134	2026-03-27 09:02:23.36	confirmed	4	f
145	394	4	1	5	5	2026-03-18 09:38:40.381187	2026-03-27 09:02:34.467	confirmed	4	f
144	412	4	1	5	5	2026-03-18 09:38:23.084512	2026-03-27 09:02:45.917	confirmed	4	f
146	396	4	1	5	5	2026-03-18 09:38:57.693379	2026-03-27 09:02:55.355	confirmed	4	f
142	413	4	1	5	5	2026-03-18 09:37:45.208962	2026-03-27 09:03:23.224	confirmed	4	f
186	410	4	1	5	5	2026-03-27 09:04:03.015027	2026-03-27 09:04:08.11	confirmed	4	f
135	264	4	1	5	5	2026-03-18 09:35:13.835787	2026-03-27 09:07:41.337	confirmed	1	f
187	318	4	1	5	5	2026-03-27 09:08:29.17129	2026-03-27 09:08:34.485	confirmed	3	f
136	323	4	1	5	5	2026-03-18 09:35:27.440375	2026-03-27 09:09:05.513	confirmed	3	f
188	262	4	1	5	5	2026-03-27 09:09:32.26517	2026-03-27 09:09:43.517	confirmed	2	f
189	325	4	1	5	5	2026-03-27 09:10:07.696256	2026-03-27 09:10:13.513	confirmed	3	f
190	290	4	1	5	5	2026-03-27 09:10:35.714544	2026-03-27 09:10:41.49	confirmed	2	f
137	312	4	1	5	5	2026-03-18 09:35:48.830522	2026-03-27 09:10:54.98	confirmed	3	f
191	298	4	1	5	5	2026-03-27 09:11:31.125123	2026-03-27 09:11:37.276	confirmed	3	f
185	542	4	1	5	5	2026-03-24 11:23:58.973619	2026-03-27 09:12:00.902	confirmed	3	f
184	268	4	1	5	5	2026-03-24 11:20:30.98111	2026-03-27 09:12:17.727	confirmed	3	f
192	327	4	1	5	5	2026-03-27 09:12:40.333311	2026-03-27 09:12:45.97	confirmed	2	f
183	322	4	1	5	5	2026-03-24 11:20:10.59507	2026-03-27 09:14:30.773	confirmed	3	f
141	310	4	1	5	\N	2026-03-18 09:37:20.377713	\N	cancelled	\N	f
133	306	4	1	5	\N	2026-03-18 09:34:36.444914	\N	cancelled	\N	f
132	329	4	1	5	\N	2026-03-18 09:33:51.713964	\N	cancelled	\N	f
131	281	4	1	5	\N	2026-03-18 09:33:34.393767	\N	cancelled	\N	f
130	279	4	1	5	\N	2026-03-18 09:32:54.645857	\N	cancelled	\N	f
129	277	4	1	5	\N	2026-03-18 09:32:36.797683	\N	cancelled	\N	f
128	265	4	1	5	\N	2026-03-18 09:32:19.080192	\N	cancelled	\N	f
193	342	4	1	5	\N	2026-04-02 06:46:46.947882	\N	cancelled	\N	f
194	364	4	2	5	\N	2026-04-02 06:56:24.938657	\N	pending	\N	f
195	365	4	2	5	\N	2026-04-02 06:56:43.159232	\N	pending	\N	f
196	151	4	2	5	\N	2026-04-02 06:57:19.264991	\N	pending	\N	f
197	82	4	2	5	\N	2026-04-02 07:02:58.699425	\N	pending	\N	f
198	93	4	2	5	\N	2026-04-02 07:03:26.220912	\N	pending	\N	f
199	94	4	2	5	\N	2026-04-02 07:03:45.082989	\N	pending	\N	f
200	95	4	2	5	\N	2026-04-02 07:04:15.752187	\N	pending	\N	f
201	96	4	2	5	\N	2026-04-02 07:04:36.80559	\N	pending	\N	f
202	78	4	2	5	\N	2026-04-02 07:04:57.847353	\N	pending	\N	f
203	80	4	2	5	\N	2026-04-02 07:05:21.183762	\N	pending	\N	f
204	84	4	2	5	\N	2026-04-02 07:05:44.764028	\N	pending	\N	f
205	529	4	2	5	\N	2026-04-02 07:07:14.219358	\N	pending	\N	f
206	532	4	2	5	\N	2026-04-02 07:08:31.920601	\N	cancelled	\N	f
207	545	4	2	5	\N	2026-04-02 07:12:48.215869	\N	pending	\N	f
208	546	4	2	5	\N	2026-04-02 07:13:04.10769	\N	pending	\N	f
210	99	4	2	5	\N	2026-04-02 07:14:06.638085	\N	pending	\N	f
211	335	4	2	5	\N	2026-04-02 07:14:24.747425	\N	pending	\N	f
212	334	4	2	5	\N	2026-04-02 07:14:43.08815	\N	pending	\N	f
213	339	4	2	5	\N	2026-04-02 07:15:01.73824	\N	pending	\N	f
214	107	4	2	5	\N	2026-04-02 07:16:47.263384	\N	pending	\N	f
215	109	4	2	5	\N	2026-04-02 07:17:02.560311	\N	pending	\N	f
216	111	4	2	5	\N	2026-04-02 07:17:24.571893	\N	pending	\N	f
217	110	4	2	5	\N	2026-04-02 07:18:26.84217	\N	pending	\N	f
218	113	4	2	5	\N	2026-04-02 07:18:43.522259	\N	pending	\N	f
219	118	4	2	5	\N	2026-04-02 07:19:18.386912	\N	pending	\N	f
220	122	4	2	5	\N	2026-04-02 07:19:39.738518	\N	pending	\N	f
221	336	4	1	5	5	2026-04-02 11:49:15.629054	2026-04-02 11:49:24.207	confirmed	3	f
222	338	4	1	5	5	2026-04-02 11:49:49.196407	2026-04-02 11:49:54.197	confirmed	3	f
223	349	4	2	5	\N	2026-04-02 11:55:06.872484	\N	pending	\N	f
224	548	4	2	5	5	2026-04-02 11:56:00.5599	2026-04-02 11:58:31.45	confirmed	2	f
209	547	4	2	5	10	2026-04-02 07:13:18.313314	2026-04-18 00:32:23.979	confirmed	4	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, name, email, password, role, assigned_station_id, is_super_admin, can_edit_equipment) FROM stdin;
6	Kiki Chouman	kiki@kiteworldwide.com	bc5065b53130390e22223bf8251e179ed087f4b1dfbba4eee05a676aede0308bcf3dc81b367470496b4c5bc62e7119f9f1d95566a0ac4413c604f1555a1fff24.fc90df0b79fc885947f2683a398d51e6	admin	\N	f	f
7	TEST Kitecenter Manager	marketing@kiteworldwide.com	338d092075c6488d859ada1bd9250a32225e9e6802a28f4665da4f8ec1051ee5ad8890205a9177b45b0806fdffa5fae1b8252603d62a54526394c69b562c6f8b.246ed5b9ce3b1eed252b82f7338a9449	station_lead	1	f	f
1	York	york@kiteworldwide.com	22ec13109ba1999858a25ef7002f9b09f64d1a98c3a564b6d5d1ed8ba97a1a3f0e350bfb0df32a052299ef42eafd6621ad5ddfe1632f86353d490197d85a5179.47d32e09940287141bacd562af17f07c	admin	\N	t	f
5	Timo Erdmann	timo@kiteworldwide.com	b03cbc786d5a5909c90283c0f7d027dad467fe817dde6c415fbca9f8faaf9d897bba84ed46782a12df7d41b9251e3cf2af7b5ac6dc5c056612b4b592ba8ebee9.3d4b885c7ac146044f453c8ef2ebce1f	admin	\N	f	t
8	Björn Nerling	dakhla@kiteworldwide.com	a98ecba8b78b5cdc83c6760d250028bb1d7906bc3ba29e22c12886c404ede76bb3f0c8c8451831326a350be6bada7e60c87c9224ccdb76b322e612f01d1a33f0.2b882050b6f6b10b4f4996bf6bc09414	station_lead	1	f	f
4	Philipp Sensen	philipp@kiteworldwide.com	dd20ea1f76898b145d39e2ec0dd8ad0060c020dfe7846fad76eddbc684aef1cb2da72e32bb9eb57eb0a84e7bfd113e4d248886b954ec46c2792e969629f77e93.6328e8ad4084b447676a3f629615e78f	admin	\N	f	f
9	André Peschka	andre@kiteworldwide.com	01489c613d0db27e5e4927f163f93e8cac2754dc0162f984f1a124500774878f2f843ee3cb374a5558ee9bf48fb04660c50e5ffc9592b7ab2f090913ecac627c.8249042c6993c9ff6cbe6da61fe0db98	admin	\N	t	t
10	Osvaldo Mateus	tatajuba@kiteworldwide.com	7c4321373d4ce21c039f394d3a33f00bae9e06148dab811624a0bca2c2a9e3a1139ae33ad4bca0f389fae6e8a34bb75e034785e741be9fb80dcb8b0fa67302f3.8721521f2bcd4c1f4fcffc6b5caa0817	station_lead	2	f	f
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 22, true);


--
-- Name: accessory_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_categories_id_seq', 7, true);


--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_check_items_id_seq', 1, false);


--
-- Name: accessory_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_checks_id_seq', 1, false);


--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_inventory_id_seq', 241, true);


--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_loss_reports_id_seq', 1, false);


--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accessory_transfers_id_seq', 2, true);


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 1015, true);


--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cash_register_entries_id_seq', 1, false);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, false);


--
-- Name: condition_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.condition_ratings_id_seq', 153, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.damage_report_photos_id_seq', 1, false);


--
-- Name: damage_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.damage_reports_id_seq', 1, true);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.equipment_id_seq', 573, true);


--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feedback_attachments_id_seq', 1, true);


--
-- Name: feedback_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feedback_comments_id_seq', 12, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feedback_id_seq', 11, true);


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_check_items_id_seq', 138, true);


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_checks_id_seq', 3, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 35, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 14, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, true);


--
-- Name: photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.photos_id_seq', 1, false);


--
-- Name: price_list_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.price_list_items_id_seq', 354, true);


--
-- Name: price_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.price_lists_id_seq', 2, true);


--
-- Name: repairs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.repairs_id_seq', 4, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, true);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 1, true);


--
-- Name: school_booking_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_booking_items_id_seq', 1, false);


--
-- Name: school_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_bookings_id_seq', 1, false);


--
-- Name: school_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_configs_id_seq', 1, true);


--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_customer_documents_id_seq', 1, true);


--
-- Name: school_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_customers_id_seq', 4, true);


--
-- Name: school_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_expenses_id_seq', 1, false);


--
-- Name: school_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.school_products_id_seq', 10, true);


--
-- Name: stations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stations_id_seq', 6, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 8, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transfers_id_seq', 224, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: accessory_categories accessory_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_categories
    ADD CONSTRAINT accessory_categories_name_unique UNIQUE (name);


--
-- Name: accessory_categories accessory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_categories
    ADD CONSTRAINT accessory_categories_pkey PRIMARY KEY (id);


--
-- Name: accessory_check_items accessory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_pkey PRIMARY KEY (id);


--
-- Name: accessory_checks accessory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_pkey PRIMARY KEY (id);


--
-- Name: accessory_inventory accessory_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_pkey PRIMARY KEY (id);


--
-- Name: accessory_loss_reports accessory_loss_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_pkey PRIMARY KEY (id);


--
-- Name: accessory_transfers accessory_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: cash_register_entries cash_register_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: condition_ratings condition_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: damage_report_photos damage_report_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_pkey PRIMARY KEY (id);


--
-- Name: damage_reports damage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_serial_number_unique UNIQUE (serial_number);


--
-- Name: feedback_attachments feedback_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_attachments
    ADD CONSTRAINT feedback_attachments_pkey PRIMARY KEY (id);


--
-- Name: feedback_comments feedback_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: inventory_check_items inventory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_checks inventory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: price_list_items price_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_pkey PRIMARY KEY (id);


--
-- Name: price_lists price_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_pkey PRIMARY KEY (id);


--
-- Name: repairs repairs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: school_booking_items school_booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_pkey PRIMARY KEY (id);


--
-- Name: school_bookings school_bookings_booking_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_booking_number_key UNIQUE (booking_number);


--
-- Name: school_bookings school_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_pkey PRIMARY KEY (id);


--
-- Name: school_configs school_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_pkey PRIMARY KEY (id);


--
-- Name: school_configs school_configs_station_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_station_id_unique UNIQUE (station_id);


--
-- Name: school_customer_documents school_customer_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_pkey PRIMARY KEY (id);


--
-- Name: school_customers school_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_pkey PRIMARY KEY (id);


--
-- Name: school_expenses school_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_pkey PRIMARY KEY (id);


--
-- Name: school_products school_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_products
    ADD CONSTRAINT school_products_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: stations stations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_name_unique UNIQUE (name);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: accessory_inventory_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX accessory_inventory_unique ON public.accessory_inventory USING btree (category_id, station_id, size);


--
-- Name: cash_register_entries_school_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX cash_register_entries_school_date_idx ON public.cash_register_entries USING btree (school_config_id, date);


--
-- Name: idx_feedback_comments_feedback_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_comments_feedback_id ON public.feedback_comments USING btree (feedback_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, read);


--
-- Name: accessory_check_items accessory_check_items_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_check_items accessory_check_items_check_id_accessory_checks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_check_id_accessory_checks_id_fk FOREIGN KEY (check_id) REFERENCES public.accessory_checks(id);


--
-- Name: accessory_checks accessory_checks_checked_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_checked_by_users_id_fk FOREIGN KEY (checked_by) REFERENCES public.users(id);


--
-- Name: accessory_checks accessory_checks_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_inventory accessory_inventory_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_inventory accessory_inventory_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_reported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_reported_by_users_id_fk FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_resolved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_transfers accessory_transfers_from_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_from_station_id_stations_id_fk FOREIGN KEY (from_station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_to_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_to_station_id_stations_id_fk FOREIGN KEY (to_station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_transferred_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_transferred_by_users_id_fk FOREIGN KEY (transferred_by) REFERENCES public.users(id);


--
-- Name: activity_log activity_log_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: activity_log activity_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cash_register_entries cash_register_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cash_register_entries cash_register_entries_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: condition_ratings condition_ratings_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: condition_ratings condition_ratings_rated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_rated_by_users_id_fk FOREIGN KEY (rated_by) REFERENCES public.users(id);


--
-- Name: damage_report_photos damage_report_photos_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id) ON DELETE CASCADE;


--
-- Name: damage_report_photos damage_report_photos_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: damage_reports damage_reports_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: damage_reports damage_reports_repair_id_repairs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_repair_id_repairs_id_fk FOREIGN KEY (repair_id) REFERENCES public.repairs(id);


--
-- Name: damage_reports damage_reports_reported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_reported_by_users_id_fk FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: damage_reports damage_reports_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: equipment equipment_current_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_current_station_id_stations_id_fk FOREIGN KEY (current_station_id) REFERENCES public.stations(id);


--
-- Name: equipment equipment_price_list_id_price_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_price_list_id_price_lists_id_fk FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id);


--
-- Name: feedback_attachments feedback_attachments_feedback_id_feedback_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_attachments
    ADD CONSTRAINT feedback_attachments_feedback_id_feedback_id_fk FOREIGN KEY (feedback_id) REFERENCES public.feedback(id);


--
-- Name: feedback_comments feedback_comments_feedback_id_feedback_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_feedback_id_feedback_id_fk FOREIGN KEY (feedback_id) REFERENCES public.feedback(id);


--
-- Name: feedback_comments feedback_comments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inventory_check_items inventory_check_items_check_id_inventory_checks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_check_id_inventory_checks_id_fk FOREIGN KEY (check_id) REFERENCES public.inventory_checks(id);


--
-- Name: inventory_check_items inventory_check_items_checked_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_checked_by_users_id_fk FOREIGN KEY (checked_by) REFERENCES public.users(id);


--
-- Name: inventory_check_items inventory_check_items_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: inventory_checks inventory_checks_started_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_started_by_users_id_fk FOREIGN KEY (started_by) REFERENCES public.users(id);


--
-- Name: inventory_checks inventory_checks_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: invoices invoices_imported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_imported_by_users_id_fk FOREIGN KEY (imported_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: photos photos_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: photos photos_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: price_list_items price_list_items_price_list_id_price_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_price_list_id_price_lists_id_fk FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE;


--
-- Name: price_lists price_lists_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: repairs repairs_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: repairs repairs_logged_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_logged_by_users_id_fk FOREIGN KEY (logged_by) REFERENCES public.users(id);


--
-- Name: sale_items sale_items_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: sale_items sale_items_sale_id_sales_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_invoices_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales_invoices(id);


--
-- Name: sales_invoices sales_invoices_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sales_invoices sales_invoices_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_invoices sales_invoices_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id);


--
-- Name: school_booking_items school_booking_items_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.school_bookings(id);


--
-- Name: school_booking_items school_booking_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.school_products(id);


--
-- Name: school_bookings school_bookings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_bookings school_bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id);


--
-- Name: school_bookings school_bookings_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_configs school_configs_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: school_customer_documents school_customer_documents_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id) ON DELETE CASCADE;


--
-- Name: school_customer_documents school_customer_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_expenses school_expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_expenses school_expenses_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_products school_products_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_products
    ADD CONSTRAINT school_products_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: transfers transfers_confirmed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: transfers transfers_from_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_from_station_id_stations_id_fk FOREIGN KEY (from_station_id) REFERENCES public.stations(id);


--
-- Name: transfers transfers_initiated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_initiated_by_users_id_fk FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_to_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_station_id_stations_id_fk FOREIGN KEY (to_station_id) REFERENCES public.stations(id);


--
-- Name: users users_assigned_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_assigned_station_id_stations_id_fk FOREIGN KEY (assigned_station_id) REFERENCES public.stations(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict wdbiOSMBfjW9T5tMCv1OsvCARcmawPrmMQTpaQqNZjzuseUJaaRz4N9hjYQyZRx

