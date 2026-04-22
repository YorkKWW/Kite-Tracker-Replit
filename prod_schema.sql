--
-- PostgreSQL database dump
--

\restrict 6mLGa5EnvE1jZnAOgxUTbbAWAg8rZ2Idz6uGxHeREnTkh0ixgjFjyFFDL5z07ih

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
-- Name: _system; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _system;


--
-- Name: booking_payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_payment_status AS ENUM (
    'unpaid',
    'cash',
    'credit_card',
    'paid'
);


--
-- Name: document_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_category AS ENUM (
    'agb',
    'stundenzettel',
    'other'
);


--
-- Name: equipment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipment_status AS ENUM (
    'active',
    'in_repair',
    'retired',
    'sold',
    'in_transfer',
    'missing'
);


--
-- Name: equipment_type; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: expense_category; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_status AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


--
-- Name: inventory_check_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_check_status AS ENUM (
    'in_progress',
    'completed'
);


--
-- Name: product_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_source AS ENUM (
    'walkin',
    'bos'
);


--
-- Name: repair_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repair_status AS ENUM (
    'pending',
    'completed'
);


--
-- Name: school_product_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.school_product_category AS ENUM (
    'Course',
    'Lesson',
    'Package',
    'Rental',
    'Other'
);


--
-- Name: transfer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'station_lead'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: -
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: -
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: -
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: accessory_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessory_categories (
    id integer NOT NULL,
    name text NOT NULL,
    has_sizes boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL
);


--
-- Name: accessory_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_categories_id_seq OWNED BY public.accessory_categories.id;


--
-- Name: accessory_check_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_check_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_check_items_id_seq OWNED BY public.accessory_check_items.id;


--
-- Name: accessory_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessory_checks (
    id integer NOT NULL,
    station_id integer NOT NULL,
    checked_by integer NOT NULL,
    checked_at timestamp without time zone DEFAULT now(),
    total_categories integer DEFAULT 0 NOT NULL,
    total_differences integer DEFAULT 0 NOT NULL
);


--
-- Name: accessory_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_checks_id_seq OWNED BY public.accessory_checks.id;


--
-- Name: accessory_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessory_inventory (
    id integer NOT NULL,
    category_id integer NOT NULL,
    station_id integer NOT NULL,
    size text DEFAULT 'Einheitsgröße'::text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_inventory_id_seq OWNED BY public.accessory_inventory.id;


--
-- Name: accessory_loss_reports; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_loss_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_loss_reports_id_seq OWNED BY public.accessory_loss_reports.id;


--
-- Name: accessory_transfers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessory_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessory_transfers_id_seq OWNED BY public.accessory_transfers.id;


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    equipment_id integer,
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: cash_register_entries; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cash_register_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cash_register_entries_id_seq OWNED BY public.cash_register_entries.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: condition_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.condition_ratings (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    rating integer NOT NULL,
    rated_by integer NOT NULL,
    rated_at timestamp without time zone DEFAULT now(),
    notes text
);


--
-- Name: condition_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.condition_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: condition_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.condition_ratings_id_seq OWNED BY public.condition_ratings.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: damage_report_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damage_report_photos (
    id integer NOT NULL,
    damage_report_id integer NOT NULL,
    url text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.damage_report_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.damage_report_photos_id_seq OWNED BY public.damage_report_photos.id;


--
-- Name: damage_reports; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: damage_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.damage_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: damage_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.damage_reports_id_seq OWNED BY public.damage_reports.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: feedback_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_attachments (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    url text NOT NULL,
    type text DEFAULT 'image'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_attachments_id_seq OWNED BY public.feedback_attachments.id;


--
-- Name: feedback_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_comments (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: feedback_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_comments_id_seq OWNED BY public.feedback_comments.id;


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: inventory_check_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_check_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_check_items_id_seq OWNED BY public.inventory_check_items.id;


--
-- Name: inventory_checks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_checks_id_seq OWNED BY public.inventory_checks.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    url text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    caption text
);


--
-- Name: photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photos_id_seq OWNED BY public.photos.id;


--
-- Name: price_list_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: price_list_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_list_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_list_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_list_items_id_seq OWNED BY public.price_list_items.id;


--
-- Name: price_lists; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: price_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_lists_id_seq OWNED BY public.price_lists.id;


--
-- Name: repairs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: repairs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repairs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: repairs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.repairs_id_seq OWNED BY public.repairs.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: school_booking_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_booking_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_booking_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_booking_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_booking_items_id_seq OWNED BY public.school_booking_items.id;


--
-- Name: school_bookings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_bookings_id_seq OWNED BY public.school_bookings.id;


--
-- Name: school_configs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_configs_id_seq OWNED BY public.school_configs.id;


--
-- Name: school_customer_documents; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_customer_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_customer_documents_id_seq OWNED BY public.school_customer_documents.id;


--
-- Name: school_customers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_customers_id_seq OWNED BY public.school_customers.id;


--
-- Name: school_expenses; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_expenses_id_seq OWNED BY public.school_expenses.id;


--
-- Name: school_products; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: school_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_products_id_seq OWNED BY public.school_products.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: stations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stations (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    country text,
    is_virtual boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 99 NOT NULL
);


--
-- Name: stations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stations_id_seq OWNED BY public.stations.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: accessory_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_categories ALTER COLUMN id SET DEFAULT nextval('public.accessory_categories_id_seq'::regclass);


--
-- Name: accessory_check_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_check_items ALTER COLUMN id SET DEFAULT nextval('public.accessory_check_items_id_seq'::regclass);


--
-- Name: accessory_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_checks ALTER COLUMN id SET DEFAULT nextval('public.accessory_checks_id_seq'::regclass);


--
-- Name: accessory_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_inventory ALTER COLUMN id SET DEFAULT nextval('public.accessory_inventory_id_seq'::regclass);


--
-- Name: accessory_loss_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports ALTER COLUMN id SET DEFAULT nextval('public.accessory_loss_reports_id_seq'::regclass);


--
-- Name: accessory_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers ALTER COLUMN id SET DEFAULT nextval('public.accessory_transfers_id_seq'::regclass);


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: cash_register_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_entries ALTER COLUMN id SET DEFAULT nextval('public.cash_register_entries_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: condition_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condition_ratings ALTER COLUMN id SET DEFAULT nextval('public.condition_ratings_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: damage_report_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_report_photos ALTER COLUMN id SET DEFAULT nextval('public.damage_report_photos_id_seq'::regclass);


--
-- Name: damage_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports ALTER COLUMN id SET DEFAULT nextval('public.damage_reports_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: feedback_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_attachments ALTER COLUMN id SET DEFAULT nextval('public.feedback_attachments_id_seq'::regclass);


--
-- Name: feedback_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments ALTER COLUMN id SET DEFAULT nextval('public.feedback_comments_id_seq'::regclass);


--
-- Name: inventory_check_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_check_items_id_seq'::regclass);


--
-- Name: inventory_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks ALTER COLUMN id SET DEFAULT nextval('public.inventory_checks_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos ALTER COLUMN id SET DEFAULT nextval('public.photos_id_seq'::regclass);


--
-- Name: price_list_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items ALTER COLUMN id SET DEFAULT nextval('public.price_list_items_id_seq'::regclass);


--
-- Name: price_lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists ALTER COLUMN id SET DEFAULT nextval('public.price_lists_id_seq'::regclass);


--
-- Name: repairs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs ALTER COLUMN id SET DEFAULT nextval('public.repairs_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: school_booking_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items ALTER COLUMN id SET DEFAULT nextval('public.school_booking_items_id_seq'::regclass);


--
-- Name: school_bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings ALTER COLUMN id SET DEFAULT nextval('public.school_bookings_id_seq'::regclass);


--
-- Name: school_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_configs ALTER COLUMN id SET DEFAULT nextval('public.school_configs_id_seq'::regclass);


--
-- Name: school_customer_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents ALTER COLUMN id SET DEFAULT nextval('public.school_customer_documents_id_seq'::regclass);


--
-- Name: school_customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers ALTER COLUMN id SET DEFAULT nextval('public.school_customers_id_seq'::regclass);


--
-- Name: school_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses ALTER COLUMN id SET DEFAULT nextval('public.school_expenses_id_seq'::regclass);


--
-- Name: school_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_products ALTER COLUMN id SET DEFAULT nextval('public.school_products_id_seq'::regclass);


--
-- Name: stations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stations ALTER COLUMN id SET DEFAULT nextval('public.stations_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: accessory_categories accessory_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_categories
    ADD CONSTRAINT accessory_categories_name_unique UNIQUE (name);


--
-- Name: accessory_categories accessory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_categories
    ADD CONSTRAINT accessory_categories_pkey PRIMARY KEY (id);


--
-- Name: accessory_check_items accessory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_pkey PRIMARY KEY (id);


--
-- Name: accessory_checks accessory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_pkey PRIMARY KEY (id);


--
-- Name: accessory_inventory accessory_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_pkey PRIMARY KEY (id);


--
-- Name: accessory_loss_reports accessory_loss_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_pkey PRIMARY KEY (id);


--
-- Name: accessory_transfers accessory_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: cash_register_entries cash_register_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: condition_ratings condition_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: damage_report_photos damage_report_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_pkey PRIMARY KEY (id);


--
-- Name: damage_reports damage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_serial_number_unique UNIQUE (serial_number);


--
-- Name: feedback_attachments feedback_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_attachments
    ADD CONSTRAINT feedback_attachments_pkey PRIMARY KEY (id);


--
-- Name: feedback_comments feedback_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: inventory_check_items inventory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_checks inventory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: price_list_items price_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_pkey PRIMARY KEY (id);


--
-- Name: price_lists price_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_pkey PRIMARY KEY (id);


--
-- Name: repairs repairs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: school_booking_items school_booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_pkey PRIMARY KEY (id);


--
-- Name: school_bookings school_bookings_booking_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_booking_number_key UNIQUE (booking_number);


--
-- Name: school_bookings school_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_pkey PRIMARY KEY (id);


--
-- Name: school_configs school_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_pkey PRIMARY KEY (id);


--
-- Name: school_configs school_configs_station_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_station_id_unique UNIQUE (station_id);


--
-- Name: school_customer_documents school_customer_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_pkey PRIMARY KEY (id);


--
-- Name: school_customers school_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_pkey PRIMARY KEY (id);


--
-- Name: school_expenses school_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_pkey PRIMARY KEY (id);


--
-- Name: school_products school_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_products
    ADD CONSTRAINT school_products_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: stations stations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_name_unique UNIQUE (name);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: -
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: accessory_inventory_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX accessory_inventory_unique ON public.accessory_inventory USING btree (category_id, station_id, size);


--
-- Name: cash_register_entries_school_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cash_register_entries_school_date_idx ON public.cash_register_entries USING btree (school_config_id, date);


--
-- Name: idx_feedback_comments_feedback_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_comments_feedback_id ON public.feedback_comments USING btree (feedback_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, read);


--
-- Name: accessory_check_items accessory_check_items_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_check_items accessory_check_items_check_id_accessory_checks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_check_items
    ADD CONSTRAINT accessory_check_items_check_id_accessory_checks_id_fk FOREIGN KEY (check_id) REFERENCES public.accessory_checks(id);


--
-- Name: accessory_checks accessory_checks_checked_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_checked_by_users_id_fk FOREIGN KEY (checked_by) REFERENCES public.users(id);


--
-- Name: accessory_checks accessory_checks_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_checks
    ADD CONSTRAINT accessory_checks_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_inventory accessory_inventory_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_inventory accessory_inventory_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_inventory
    ADD CONSTRAINT accessory_inventory_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_reported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_reported_by_users_id_fk FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_resolved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: accessory_loss_reports accessory_loss_reports_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_loss_reports
    ADD CONSTRAINT accessory_loss_reports_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_category_id_accessory_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_category_id_accessory_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.accessory_categories(id);


--
-- Name: accessory_transfers accessory_transfers_from_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_from_station_id_stations_id_fk FOREIGN KEY (from_station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_to_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_to_station_id_stations_id_fk FOREIGN KEY (to_station_id) REFERENCES public.stations(id);


--
-- Name: accessory_transfers accessory_transfers_transferred_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_transfers
    ADD CONSTRAINT accessory_transfers_transferred_by_users_id_fk FOREIGN KEY (transferred_by) REFERENCES public.users(id);


--
-- Name: activity_log activity_log_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: activity_log activity_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cash_register_entries cash_register_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cash_register_entries cash_register_entries_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_entries
    ADD CONSTRAINT cash_register_entries_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: condition_ratings condition_ratings_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: condition_ratings condition_ratings_rated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condition_ratings
    ADD CONSTRAINT condition_ratings_rated_by_users_id_fk FOREIGN KEY (rated_by) REFERENCES public.users(id);


--
-- Name: damage_report_photos damage_report_photos_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id) ON DELETE CASCADE;


--
-- Name: damage_report_photos damage_report_photos_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_report_photos
    ADD CONSTRAINT damage_report_photos_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: damage_reports damage_reports_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: damage_reports damage_reports_repair_id_repairs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_repair_id_repairs_id_fk FOREIGN KEY (repair_id) REFERENCES public.repairs(id);


--
-- Name: damage_reports damage_reports_reported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_reported_by_users_id_fk FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: damage_reports damage_reports_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: equipment equipment_current_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_current_station_id_stations_id_fk FOREIGN KEY (current_station_id) REFERENCES public.stations(id);


--
-- Name: equipment equipment_price_list_id_price_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_price_list_id_price_lists_id_fk FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id);


--
-- Name: feedback_attachments feedback_attachments_feedback_id_feedback_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_attachments
    ADD CONSTRAINT feedback_attachments_feedback_id_feedback_id_fk FOREIGN KEY (feedback_id) REFERENCES public.feedback(id);


--
-- Name: feedback_comments feedback_comments_feedback_id_feedback_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_feedback_id_feedback_id_fk FOREIGN KEY (feedback_id) REFERENCES public.feedback(id);


--
-- Name: feedback_comments feedback_comments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inventory_check_items inventory_check_items_check_id_inventory_checks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_check_id_inventory_checks_id_fk FOREIGN KEY (check_id) REFERENCES public.inventory_checks(id);


--
-- Name: inventory_check_items inventory_check_items_checked_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_checked_by_users_id_fk FOREIGN KEY (checked_by) REFERENCES public.users(id);


--
-- Name: inventory_check_items inventory_check_items_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: inventory_checks inventory_checks_started_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_started_by_users_id_fk FOREIGN KEY (started_by) REFERENCES public.users(id);


--
-- Name: inventory_checks inventory_checks_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: invoices invoices_imported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_imported_by_users_id_fk FOREIGN KEY (imported_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: photos photos_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: photos photos_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: price_list_items price_list_items_price_list_id_price_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_price_list_id_price_lists_id_fk FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE;


--
-- Name: price_lists price_lists_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: repairs repairs_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: repairs repairs_logged_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_logged_by_users_id_fk FOREIGN KEY (logged_by) REFERENCES public.users(id);


--
-- Name: sale_items sale_items_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: sale_items sale_items_sale_id_sales_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_invoices_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales_invoices(id);


--
-- Name: sales_invoices sales_invoices_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sales_invoices sales_invoices_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_invoices sales_invoices_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id);


--
-- Name: school_booking_items school_booking_items_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.school_bookings(id);


--
-- Name: school_booking_items school_booking_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.school_products(id);


--
-- Name: school_bookings school_bookings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_bookings school_bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id);


--
-- Name: school_bookings school_bookings_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_configs school_configs_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: school_customer_documents school_customer_documents_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id) ON DELETE CASCADE;


--
-- Name: school_customer_documents school_customer_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_expenses school_expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_expenses school_expenses_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_products school_products_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_products
    ADD CONSTRAINT school_products_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: transfers transfers_confirmed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: transfers transfers_from_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_from_station_id_stations_id_fk FOREIGN KEY (from_station_id) REFERENCES public.stations(id);


--
-- Name: transfers transfers_initiated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_initiated_by_users_id_fk FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_to_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_station_id_stations_id_fk FOREIGN KEY (to_station_id) REFERENCES public.stations(id);


--
-- Name: users users_assigned_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_assigned_station_id_stations_id_fk FOREIGN KEY (assigned_station_id) REFERENCES public.stations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6mLGa5EnvE1jZnAOgxUTbbAWAg8rZ2Idz6uGxHeREnTkh0ixgjFjyFFDL5z07ih

