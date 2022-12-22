--
-- PostgreSQL database dump
--

-- Dumped from database version 12.12 (Ubuntu 12.12-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 13.5

-- Started on 2022-12-21 18:06:07

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
-- TOC entry 5084 (class 1262 OID 24084)
-- Name: cantieri; Type: DATABASE; Schema: -; Owner: user_cantieri
--

CREATE DATABASE cantieri WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C.UTF-8';


ALTER DATABASE cantieri OWNER TO user_cantieri;

\connect cantieri

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
-- TOC entry 5085 (class 0 OID 0)
-- Name: cantieri; Type: DATABASE PROPERTIES; Schema: -; Owner: user_cantieri
--

ALTER DATABASE cantieri SET search_path TO '$user', 'public', 'topology';


\connect cantieri

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
-- TOC entry 13 (class 2615 OID 25844)
-- Name: gis_data; Type: SCHEMA; Schema: -; Owner: user_cantieri
--

CREATE SCHEMA gis_data;


ALTER SCHEMA gis_data OWNER TO user_cantieri;

--
-- TOC entry 12 (class 2615 OID 25689)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 6 (class 3079 OID 16386)
-- Name: pgpool_recovery; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgpool_recovery WITH SCHEMA public;


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION pgpool_recovery; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgpool_recovery IS 'recovery functions for pgpool-II for V4.3';


--
-- TOC entry 5 (class 3079 OID 24092)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- TOC entry 4 (class 3079 OID 25671)
-- Name: postgis_sfcgal; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_sfcgal WITH SCHEMA public;


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis_sfcgal; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_sfcgal IS 'PostGIS SFCGAL functions';


--
-- TOC entry 2 (class 3079 OID 25690)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 3 (class 3079 OID 25840)
-- Name: postgres_fdw; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgres_fdw WITH SCHEMA public;


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgres_fdw; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgres_fdw IS 'foreign-data wrapper for remote PostgreSQL servers';


--
-- TOC entry 1648 (class 1255 OID 25845)
-- Name: get_geom_from_lat_lon(); Type: FUNCTION; Schema: public; Owner: user_cantieri
--

CREATE FUNCTION public.get_geom_from_lat_lon() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$

DECLARE
  geom geometry;
  srid int;
BEGIN
  -- retrieve srid
  SELECT Find_SRID(quote_ident(TG_TABLE_SCHEMA), quote_ident(TG_TABLE_NAME), 'geom') INTO srid;
  -- debug RAISE NOTICE 'srid: %',srid;

  -- on insert calculate geom
  IF (TG_OP = 'INSERT') THEN
     SELECT ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), srid) INTO geom;
     -- debug RAISE NOTICE 'insert geom: %',geom;
     NEW.geom = geom;
  ELSEIF (TG_OP = 'UPDATE') THEN
     -- on update check for calculate geom
     IF (NEW.lon <> OLD.lon OR NEW.lat <> OLD.lat)  THEN
	SELECT ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), srid) INTO geom;
	-- debug RAISE NOTICE 'update geom: %',geom;
	NEW.geom = geom;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.get_geom_from_lat_lon() OWNER TO user_cantieri;

--
-- TOC entry 1649 (class 1255 OID 25846)
-- Name: get_geom_from_xy(); Type: FUNCTION; Schema: public; Owner: user_cantieri
--

CREATE FUNCTION public.get_geom_from_xy() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$
DECLARE
  geom geometry;
  srid int;
  x double precision;
  y double precision;
BEGIN
  -- initialization
  x  = NULL;
  y  = NULL;

  -- retrieve srid
  SELECT Find_SRID(quote_ident(TG_TABLE_SCHEMA), quote_ident(TG_TABLE_NAME), 'geom') INTO srid;
  -- debug RAISE NOTICE 'srid: %',srid;

  -- on insert calculate geom
  IF (TG_OP = 'INSERT') THEN
     -- if coords are both valuated then we set geom
     IF (NEW.x IS NOT NULL) THEN
	SELECT ST_SetSRID(ST_MakePoint(NEW.x, NEW.y), srid) INTO geom;
	-- debug RAISE NOTICE 'insert geom: %',geom;
	NEW.geom = geom;
     END IF;
  ELSEIF (TG_OP = 'UPDATE') THEN
     
        IF (OLD.geom IS NULL) THEN
          -- if OLD geom is null and NEW coords are not null
          IF (NEW.x IS NOT NULL) THEN
	     x = NEW.x;
	     y = NEW.y;
          END IF;

        ELSE 
          -- if OLD geom is not null and NEW coords are not null
	  IF (NEW.x IS NOT NULL OR NEW.y IS NOT NULL) THEN
	     IF (NEW.x IS NULL) THEN
	        x = OLD.x;
	        y = NEW.y;
             ELSEIF (NEW.y IS NULL) THEN
	        x = NEW.x;
	        y = OLD.y;
	     ELSE
	        x = NEW.x;
	        y = NEW.y;
             END IF;
	  ELSE
	    -- we receive y and x both NULL -> update geom to NULL
	    NEW.geom = NULL;
	  END IF;

	END IF;  
  
     IF (y IS NOT NULL) THEN
        SELECT ST_SetSRID(ST_MakePoint(x, y), srid) INTO geom;
        NEW.geom = geom;
        NEW.y  = y;
        NEW.x  = x;
     END IF;
 
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.get_geom_from_xy() OWNER TO user_cantieri;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 231 (class 1259 OID 25847)
-- Name: bari; Type: TABLE; Schema: gis_data; Owner: user_cantieri
--

CREATE TABLE gis_data.bari (
    id integer NOT NULL,
    geom public.geometry(MultiPolygon,32633)
);


ALTER TABLE gis_data.bari OWNER TO user_cantieri;

--
-- TOC entry 232 (class 1259 OID 25853)
-- Name: no_background; Type: TABLE; Schema: gis_data; Owner: user_cantieri
--

CREATE TABLE gis_data.no_background (
    id integer NOT NULL,
    geom public.geometry(Polygon,4326)
);


ALTER TABLE gis_data.no_background OWNER TO user_cantieri;

--
-- TOC entry 233 (class 1259 OID 25859)
-- Name: puglia; Type: TABLE; Schema: gis_data; Owner: user_cantieri
--

CREATE TABLE gis_data.puglia (
    id integer NOT NULL,
    geom public.geometry(MultiPolygon,32633)
);


ALTER TABLE gis_data.puglia OWNER TO user_cantieri;

--
-- TOC entry 234 (class 1259 OID 25865)
-- Name: authority; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.authority (
    id smallint NOT NULL,
    name character varying(128),
    geom public.geometry(MultiPolygon,32633),
    vat character varying(11),
    enabled boolean,
    function_id smallint,
    address character varying(512),
    address_number character varying(16),
    municipality character varying(256),
    phone character varying(128),
    deleted boolean DEFAULT false,
    remove_date timestamp without time zone,
    email character varying(50),
    pec character varying(50)
);


ALTER TABLE public.authority OWNER TO user_cantieri;

--
-- TOC entry 235 (class 1259 OID 25872)
-- Name: authority_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.authority_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.authority_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 235
-- Name: authority_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.authority_id_seq OWNED BY public.authority.id;


--
-- TOC entry 236 (class 1259 OID 25874)
-- Name: authorization; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public."authorization" (
    id integer NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    auth_protocol character varying(128),
    auth_attach character varying(512),
    authority_id smallint
);


ALTER TABLE public."authorization" OWNER TO user_cantieri;

--
-- TOC entry 237 (class 1259 OID 25880)
-- Name: authorization_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.authorization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.authorization_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 237
-- Name: authorization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.authorization_id_seq OWNED BY public."authorization".id;


--
-- TOC entry 238 (class 1259 OID 25882)
-- Name: ctx_function; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.ctx_function (
    id smallint NOT NULL,
    name character varying(512)
);


ALTER TABLE public.ctx_function OWNER TO user_cantieri;

--
-- TOC entry 239 (class 1259 OID 25888)
-- Name: ctx_function_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.ctx_function_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ctx_function_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 239
-- Name: ctx_function_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.ctx_function_id_seq OWNED BY public.ctx_function.id;


--
-- TOC entry 240 (class 1259 OID 25890)
-- Name: ctx_title; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.ctx_title (
    id smallint NOT NULL,
    name character varying(512)
);


ALTER TABLE public.ctx_title OWNER TO user_cantieri;

--
-- TOC entry 241 (class 1259 OID 25896)
-- Name: ctx_title_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.ctx_title_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ctx_title_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 241
-- Name: ctx_title_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.ctx_title_id_seq OWNED BY public.ctx_title.id;


--
-- TOC entry 242 (class 1259 OID 25898)
-- Name: event; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.event (
    id integer NOT NULL,
    group_id integer,
    type_id smallint NOT NULL,
    status_id smallint DEFAULT 0 NOT NULL,
    source character varying(64),
    message character varying(128),
    date timestamp with time zone DEFAULT now(),
    detail json,
    lat double precision,
    lon double precision,
    show_timeline smallint
);


ALTER TABLE public.event OWNER TO user_cantieri;

--
-- TOC entry 243 (class 1259 OID 25906)
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 243
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.event_id_seq OWNED BY public.event.id;


--
-- TOC entry 244 (class 1259 OID 25908)
-- Name: event_type; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.event_type (
    id integer NOT NULL,
    name character varying,
    descr character varying
);


ALTER TABLE public.event_type OWNER TO user_cantieri;

--
-- TOC entry 245 (class 1259 OID 25914)
-- Name: event_type_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.event_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_type_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 245
-- Name: event_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.event_type_id_seq OWNED BY public.event_type.id;


--
-- TOC entry 246 (class 1259 OID 25916)
-- Name: event_type_permission; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.event_type_permission (
    event_type_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.event_type_permission OWNER TO user_cantieri;

--
-- TOC entry 247 (class 1259 OID 25919)
-- Name: gt_pk_metadata; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.gt_pk_metadata (
    table_schema character varying(32) NOT NULL,
    table_name character varying(32) NOT NULL,
    pk_column character varying(32) NOT NULL,
    pk_column_idx integer,
    pk_policy character varying(32),
    pk_sequence character varying(64),
    CONSTRAINT gt_pk_metadata_pk_policy_check CHECK (((pk_policy)::text = ANY (ARRAY[('sequence'::character varying)::text, ('assigned'::character varying)::text, ('autogenerated'::character varying)::text])))
);


ALTER TABLE public.gt_pk_metadata OWNER TO user_cantieri;

--
-- TOC entry 248 (class 1259 OID 25923)
-- Name: i18n; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.i18n (
    id integer NOT NULL,
    object_key character varying(64),
    parent_id integer,
    depth smallint
);


ALTER TABLE public.i18n OWNER TO user_cantieri;

--
-- TOC entry 249 (class 1259 OID 25926)
-- Name: i18n_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.i18n_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.i18n_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 249
-- Name: i18n_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.i18n_id_seq OWNED BY public.i18n.id;


--
-- TOC entry 250 (class 1259 OID 25928)
-- Name: i18n_string; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.i18n_string (
    id integer NOT NULL,
    object_id integer NOT NULL,
    label_key character varying(64),
    it character varying(256) DEFAULT ''::character varying,
    en character varying(256) DEFAULT ''::character varying
);


ALTER TABLE public.i18n_string OWNER TO user_cantieri;

--
-- TOC entry 251 (class 1259 OID 25936)
-- Name: i18n_string_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.i18n_string_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.i18n_string_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 251
-- Name: i18n_string_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.i18n_string_id_seq OWNED BY public.i18n_string.id;


--
-- TOC entry 252 (class 1259 OID 25938)
-- Name: menu; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.menu (
    id integer NOT NULL,
    label character varying(128),
    enabled boolean,
    "position" integer,
    icon character varying(256),
    key character varying,
    "group" integer
);


ALTER TABLE public.menu OWNER TO user_cantieri;

--
-- TOC entry 253 (class 1259 OID 25944)
-- Name: menu_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.menu_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 253
-- Name: menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.menu_id_seq OWNED BY public.menu.id;


--
-- TOC entry 254 (class 1259 OID 25946)
-- Name: menu_item; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.menu_item (
    id integer NOT NULL,
    id_group integer,
    label character varying(128),
    tooltip character varying(128),
    image character varying(128),
    app_name character varying(128),
    action character varying(128),
    params character varying(128),
    shortcut boolean,
    "position" integer
);


ALTER TABLE public.menu_item OWNER TO user_cantieri;

--
-- TOC entry 255 (class 1259 OID 25952)
-- Name: menu_item_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.menu_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.menu_item_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 255
-- Name: menu_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.menu_item_id_seq OWNED BY public.menu_item.id;


--
-- TOC entry 256 (class 1259 OID 25954)
-- Name: move_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.move_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.move_id_seq OWNER TO user_cantieri;

--
-- TOC entry 257 (class 1259 OID 25956)
-- Name: move; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.move (
    id integer DEFAULT nextval('public.move_id_seq'::regclass) NOT NULL,
    open_user_id integer,
    authority_id smallint,
    email character varying(256),
    request_date timestamp without time zone,
    request_year smallint,
    address character varying(512),
    x double precision,
    y double precision,
    note character varying(512),
    status_id smallint,
    geom public.geometry(Point,32633),
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    number_from character varying(8),
    number_to character varying(8),
    signage_date timestamp without time zone,
    signage_address character varying(256),
    signage_num_from character varying(8),
    signage_num_to character varying(8),
    vehicle_num integer,
    vehicle_plate character varying(256),
    place character varying(256),
    signage_place character varying(256),
    signage_base character varying(256),
    signage_position_id smallint,
    control_date timestamp without time zone,
    control_team character varying(256),
    manage_user_id integer,
    manage_date timestamp without time zone,
    approved_user_id integer,
    approved_date timestamp without time zone,
    signage_num_bags integer,
    signage_bag_other character varying(256),
    town character varying(256),
    authorization_id integer
);


ALTER TABLE public.move OWNER TO user_cantieri;

--
-- TOC entry 258 (class 1259 OID 25963)
-- Name: move_attach; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.move_attach (
    id integer NOT NULL,
    name character varying(128) NOT NULL,
    descr character varying(512),
    size integer,
    insert_date timestamp with time zone DEFAULT now(),
    entity_id integer NOT NULL
);


ALTER TABLE public.move_attach OWNER TO user_cantieri;

--
-- TOC entry 259 (class 1259 OID 25970)
-- Name: move_attach_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.move_attach_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.move_attach_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 259
-- Name: move_attach_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.move_attach_id_seq OWNED BY public.move_attach.id;


--
-- TOC entry 260 (class 1259 OID 25972)
-- Name: move_photo; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.move_photo (
    id integer NOT NULL,
    name character varying(128) NOT NULL,
    descr character varying(512),
    size integer,
    insert_date timestamp with time zone DEFAULT now(),
    entity_id integer NOT NULL
);


ALTER TABLE public.move_photo OWNER TO user_cantieri;

--
-- TOC entry 261 (class 1259 OID 25979)
-- Name: move_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.move_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.move_photo_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 261
-- Name: move_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.move_photo_id_seq OWNED BY public.move_photo.id;


--
-- TOC entry 262 (class 1259 OID 25981)
-- Name: move_signage_position; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.move_signage_position (
    id smallint NOT NULL,
    name character varying(512)
);


ALTER TABLE public.move_signage_position OWNER TO user_cantieri;

--
-- TOC entry 263 (class 1259 OID 25987)
-- Name: move_signage_position_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.move_signage_position_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.move_signage_position_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 263
-- Name: move_signage_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.move_signage_position_id_seq OWNED BY public.move_signage_position.id;


--
-- TOC entry 264 (class 1259 OID 25989)
-- Name: move_status; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.move_status (
    id smallint NOT NULL,
    name character varying(512)
);


ALTER TABLE public.move_status OWNER TO user_cantieri;

--
-- TOC entry 265 (class 1259 OID 25995)
-- Name: move_status_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.move_status_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.move_status_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 265
-- Name: move_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.move_status_id_seq OWNED BY public.move_status.id;


--
-- TOC entry 266 (class 1259 OID 25997)
-- Name: permission; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.permission (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    description character varying(128) NOT NULL,
    app_name character varying(32) NOT NULL,
    app_desc character varying(64) NOT NULL,
    menu_item_id integer
);


ALTER TABLE public.permission OWNER TO user_cantieri;

--
-- TOC entry 267 (class 1259 OID 26000)
-- Name: permission_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permission_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 267
-- Name: permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.permission_id_seq OWNED BY public.permission.id;


--
-- TOC entry 268 (class 1259 OID 26002)
-- Name: permission_role; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.permission_role (
    permission_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.permission_role OWNER TO user_cantieri;

--
-- TOC entry 269 (class 1259 OID 26005)
-- Name: registration; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.registration (
    id integer NOT NULL,
    authority_id integer,
    user_id integer
);


ALTER TABLE public.registration OWNER TO user_cantieri;

--
-- TOC entry 270 (class 1259 OID 26008)
-- Name: registration_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.registration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.registration_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 270
-- Name: registration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.registration_id_seq OWNED BY public.registration.id;


--
-- TOC entry 271 (class 1259 OID 26010)
-- Name: roadsite_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.roadsite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roadsite_id_seq OWNER TO user_cantieri;

--
-- TOC entry 272 (class 1259 OID 26012)
-- Name: roadsite; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.roadsite (
    id integer DEFAULT nextval('public.roadsite_id_seq'::regclass) NOT NULL,
    open_user_id integer,
    authority_id smallint,
    email character varying(256),
    request_date timestamp without time zone,
    request_year smallint,
    address character varying(512),
    note character varying(512),
    project_attach character varying(256),
    authorization_attach character varying(256),
    coord_communication_attach character varying(256),
    protocol_request_date timestamp without time zone,
    protocol_request_number character varying(128),
    status_id smallint,
    approved_user_id integer,
    approved_attach character varying(256),
    geom public.geometry(Geometry,32633),
    protocol_approved_number character varying(128),
    protocol_approved_date timestamp without time zone,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    protocol_company character varying(128),
    notepm character varying(256),
    town character varying(256),
    noteadmin character varying(512)
);


ALTER TABLE public.roadsite OWNER TO user_cantieri;

--
-- TOC entry 273 (class 1259 OID 26019)
-- Name: roadsite_prot_out_email; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.roadsite_prot_out_email (
    id integer NOT NULL,
    name character varying(128),
    town character varying
);


ALTER TABLE public.roadsite_prot_out_email OWNER TO user_cantieri;

--
-- TOC entry 274 (class 1259 OID 26022)
-- Name: roadsite_prot_out_email_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.roadsite_prot_out_email_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roadsite_prot_out_email_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 274
-- Name: roadsite_prot_out_email_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.roadsite_prot_out_email_id_seq OWNED BY public.roadsite_prot_out_email.id;


--
-- TOC entry 275 (class 1259 OID 26024)
-- Name: roadsite_status; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.roadsite_status (
    id smallint NOT NULL,
    name character varying(128)
);


ALTER TABLE public.roadsite_status OWNER TO user_cantieri;

--
-- TOC entry 276 (class 1259 OID 26027)
-- Name: roadsite_status_id_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.roadsite_status_id_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roadsite_status_id_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 276
-- Name: roadsite_status_id_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.roadsite_status_id_id_seq OWNED BY public.roadsite_status.id;


--
-- TOC entry 277 (class 1259 OID 26029)
-- Name: role; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.role (
    id integer NOT NULL,
    descr character varying(128),
    name character varying(32),
    deleted boolean DEFAULT false,
    creation_date timestamp with time zone DEFAULT now(),
    remove_date timestamp with time zone,
    readonly boolean DEFAULT false
);


ALTER TABLE public.role OWNER TO user_cantieri;

--
-- TOC entry 278 (class 1259 OID 26035)
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 278
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- TOC entry 279 (class 1259 OID 26037)
-- Name: role_sysuser; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.role_sysuser (
    role_id integer NOT NULL,
    sysuser_id integer NOT NULL
);


ALTER TABLE public.role_sysuser OWNER TO user_cantieri;

--
-- TOC entry 280 (class 1259 OID 26040)
-- Name: session; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.session (
    id integer NOT NULL,
    sysuser_id integer,
    token character varying(32),
    last_access_date timestamp with time zone,
    login_date timestamp with time zone,
    expiration_date timestamp with time zone
);


ALTER TABLE public.session OWNER TO user_cantieri;

--
-- TOC entry 281 (class 1259 OID 26043)
-- Name: session_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.session_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 281
-- Name: session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.session_id_seq OWNED BY public.session.id;


--
-- TOC entry 282 (class 1259 OID 26045)
-- Name: sysuser; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.sysuser (
    id integer NOT NULL,
    name character varying(50),
    surname character varying(50),
    phone character varying(50),
    signature character varying(32),
    email character varying(50),
    deleted boolean DEFAULT false,
    username character varying(16),
    creation_date timestamp with time zone DEFAULT now(),
    remove_date timestamp with time zone,
    enabled boolean DEFAULT true,
    authority_id integer,
    title_id smallint,
    cf character varying(16)
);


ALTER TABLE public.sysuser OWNER TO user_cantieri;

--
-- TOC entry 283 (class 1259 OID 26051)
-- Name: sysuser_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.sysuser_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sysuser_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 283
-- Name: sysuser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.sysuser_id_seq OWNED BY public.sysuser.id;


--
-- TOC entry 209 (class 1259 OID 24085)
-- Name: tb_test; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.tb_test (
    cln_test character varying
);


ALTER TABLE public.tb_test OWNER TO user_cantieri;

--
-- TOC entry 284 (class 1259 OID 26053)
-- Name: town_ids; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.town_ids (
    id integer NOT NULL,
    name character varying
);


ALTER TABLE public.town_ids OWNER TO user_cantieri;

--
-- TOC entry 285 (class 1259 OID 26059)
-- Name: view_cantieri; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_cantieri AS
 SELECT rs.id,
    rs.authority_id AS id_azienda,
    au.name AS azienda,
    rs.open_user_id AS id_utente_richiesta,
    (((sy.name)::text || ' '::text) || (sy.surname)::text) AS utente_richiesta,
    rs.email,
    rs.request_date AS data_richiesta,
    to_char(rs.request_date, 'DD/mm/YYYY'::text) AS data_richiesta_str,
    rs.request_year AS anno_richiesta,
    rs.address AS indirizzo,
    rs.note,
    rs.protocol_request_number AS protocollo_richiesta,
    rs.protocol_request_date AS data_protocollo_richiesta,
    to_char(rs.protocol_request_date, 'DD/mm/YYYY'::text) AS data_protocollo_richiesta_str,
    rs.status_id AS id_stato,
    rss.name AS stato,
    rs.approved_user_id AS id_utente_approvatore,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS utente_approvatore,
    rs.geom,
    rs.protocol_approved_number AS protocollo_approvazione,
    rs.protocol_approved_date AS data_protocollo_approvazione,
    to_char(rs.protocol_approved_date, 'DD/mm/YYYY'::text) AS data_protocollo_approvazione_str,
    rs.start_date AS data_inizio,
    rs.end_date AS data_fine,
    to_char(rs.start_date, 'DD/mm/YYYY'::text) AS data_inizio_str,
    to_char(rs.end_date, 'DD/mm/YYYY'::text) AS data_fine_str,
    ((('rew/roadsite/'::text || rs.id) || '/download/'::text) || (rs.project_attach)::text) AS progetto,
    ((('rew/roadsite/'::text || rs.id) || '/download/'::text) || (rs.authorization_attach)::text) AS autorizzazione,
    ((('rew/roadsite/'::text || rs.id) || '/download/'::text) || (rs.coord_communication_attach)::text) AS comunicazione_coordinamento,
    ((('rew/roadsite/'::text || rs.id) || '/download/'::text) || (rs.approved_attach)::text) AS approvazione,
    rs.town
   FROM ((((public.roadsite rs
     LEFT JOIN public.authority au ON ((au.id = rs.authority_id)))
     LEFT JOIN public.roadsite_status rss ON ((rss.id = rs.status_id)))
     LEFT JOIN public.sysuser s ON ((s.id = rs.approved_user_id)))
     LEFT JOIN public.sysuser sy ON ((sy.id = rs.open_user_id)));


ALTER TABLE public.view_cantieri OWNER TO user_cantieri;

--
-- TOC entry 286 (class 1259 OID 26064)
-- Name: view_event; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_event AS
 SELECT e.id,
    e.group_id,
    e.type_id,
    e.status_id,
    e.source,
    e.message,
    e.date,
    e.detail,
    e.lat,
    e.lon,
    e.show_timeline,
    et.name AS type,
    et.descr AS type_descr
   FROM (public.event e
     LEFT JOIN public.event_type et ON ((e.type_id = et.id)));


ALTER TABLE public.view_event OWNER TO user_cantieri;

--
-- TOC entry 287 (class 1259 OID 26068)
-- Name: view_move; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_move AS
 SELECT mo.id,
    mo.authority_id,
    au.name AS authority,
    mo.open_user_id,
    (((sy.name)::text || ' '::text) || (sy.surname)::text) AS open_user,
    mo.email,
    mo.request_date,
    to_char(mo.request_date, 'DD/mm/YYYY'::text) AS request_date_str,
    mo.request_year,
    mo.status_id,
    ms.name AS status,
    mo.start_date,
    to_char(mo.start_date, 'DD/mm/YYYY'::text) AS start_date_str,
    mo.end_date,
    to_char(mo.end_date, 'DD/mm/YYYY'::text) AS end_date_str,
    mo.address,
    mo.number_from,
    mo.number_to,
    mo.x,
    mo.y,
    mo.geom,
    mo.place,
    mo.signage_date,
    mo.signage_address,
    mo.signage_num_from,
    mo.signage_num_to,
    mo.signage_place,
    sp.name AS signage_position,
    mo.signage_position_id,
    mo.signage_base,
    mo.vehicle_num,
    mo.vehicle_plate,
    mo.manage_user_id,
    mo.manage_date,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS manage_user,
    mo.control_date,
    to_char(mo.control_date, 'DD/mm/YYYY'::text) AS control_date_str,
    mo.control_team,
    mo.note,
    mo.approved_user_id,
    mo.approved_date,
    to_char(mo.approved_date, 'DD/mm/YYYY'::text) AS approved_date_str,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS approved_user,
    mo.town
   FROM (((((public.move mo
     LEFT JOIN public.authority au ON ((au.id = mo.authority_id)))
     LEFT JOIN public.move_status ms ON ((ms.id = mo.status_id)))
     LEFT JOIN public.sysuser s ON ((s.id = mo.approved_user_id)))
     LEFT JOIN public.sysuser sy ON ((sy.id = mo.open_user_id)))
     LEFT JOIN public.move_signage_position sp ON ((sp.id = mo.signage_position_id)));


ALTER TABLE public.view_move OWNER TO user_cantieri;

--
-- TOC entry 288 (class 1259 OID 26073)
-- Name: view_public_cantieri; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_public_cantieri AS
 SELECT r.id,
    r.start_date AS inizio_cantiere,
    r.end_date AS fine_cantiere,
    r.address AS indirizzo,
    r.geom,
    r.town
   FROM ((public.roadsite r
     LEFT JOIN public.authority a ON ((a.id = r.authority_id)))
     LEFT JOIN public.roadsite_status rs ON ((rs.id = r.status_id)))
  WHERE ((r.status_id = 3) AND (r.end_date > now()));


ALTER TABLE public.view_public_cantieri OWNER TO user_cantieri;

--
-- TOC entry 289 (class 1259 OID 26078)
-- Name: view_public_traslochi; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_public_traslochi AS
 SELECT m.id,
    m.address AS indirizzo,
    m.number_from AS civico_iniziale,
    m.number_to AS civico_finale,
    m.start_date AS inizio_trasloco,
    m.end_date AS fine_trasloco,
    m.geom,
    m.town
   FROM ((public.move m
     LEFT JOIN public.authority a ON ((a.id = m.authority_id)))
     LEFT JOIN public.move_status rs ON ((rs.id = m.status_id)))
  WHERE ((m.status_id = 3) AND (m.end_date > now()));


ALTER TABLE public.view_public_traslochi OWNER TO user_cantieri;

--
-- TOC entry 290 (class 1259 OID 26083)
-- Name: view_registration; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_registration AS
 SELECT r.id,
    a.name AS authority_name,
    string_agg((((s.name)::text || ' '::text) || (s.surname)::text), ', '::text) AS fullname_user
   FROM ((public.registration r
     LEFT JOIN public.authority a ON ((r.authority_id = a.id)))
     LEFT JOIN public.sysuser s ON ((r.user_id = s.id)))
  GROUP BY r.id, a.name;


ALTER TABLE public.view_registration OWNER TO user_cantieri;

--
-- TOC entry 291 (class 1259 OID 26088)
-- Name: view_roadsite; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_roadsite AS
 SELECT rs.id,
    rs.authority_id,
    au.name AS authority,
    rs.open_user_id,
    (((sy.name)::text || ' '::text) || (sy.surname)::text) AS open_user,
    rs.email,
    rs.request_date,
    to_char(rs.request_date, 'DD/mm/YYYY'::text) AS request_date_str,
    rs.request_year,
    rs.address,
    rs.note,
    rs.protocol_request_number,
    rs.protocol_request_date,
    to_char(rs.protocol_request_date, 'DD/mm/YYYY'::text) AS protocol_request_date_str,
    rs.status_id,
    rss.name AS status,
    rs.approved_user_id,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS approved_user,
    rs.geom,
    rs.protocol_approved_number,
    rs.protocol_approved_date,
    to_char(rs.protocol_approved_date, 'DD/mm/YYYY'::text) AS protocol_approved_date_str,
    rs.start_date,
    rs.end_date,
    to_char(rs.start_date, 'DD/mm/YYYY'::text) AS start_date_str,
    to_char(rs.end_date, 'DD/mm/YYYY'::text) AS end_date_str,
    rs.project_attach,
    rs.authorization_attach,
    rs.coord_communication_attach,
    rs.approved_attach,
    rs.notepm,
    rs.town
   FROM ((((public.roadsite rs
     LEFT JOIN public.authority au ON ((au.id = rs.authority_id)))
     LEFT JOIN public.roadsite_status rss ON ((rss.id = rs.status_id)))
     LEFT JOIN public.sysuser s ON ((s.id = rs.approved_user_id)))
     LEFT JOIN public.sysuser sy ON ((sy.id = rs.open_user_id)));


ALTER TABLE public.view_roadsite OWNER TO user_cantieri;

--
-- TOC entry 292 (class 1259 OID 26093)
-- Name: view_sysuser; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_sysuser AS
 SELECT su.id,
    su.name,
    su.surname,
    su.username,
    su.phone,
    su.email,
    su.signature AS password,
    su.creation_date,
    su.enabled,
    su.authority_id,
    su.cf,
    su.title_id
   FROM public.sysuser su
  WHERE (su.deleted = false);


ALTER TABLE public.view_sysuser OWNER TO user_cantieri;

--
-- TOC entry 293 (class 1259 OID 26097)
-- Name: view_traslochi; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_traslochi AS
 SELECT mo.id,
    mo.authority_id AS id_azienda,
    au.name AS azienda,
    mo.open_user_id AS id_utente_richiesta,
    (((sy.name)::text || ' '::text) || (sy.surname)::text) AS utente_richiesta,
    mo.email,
    mo.request_date AS data_richiesta,
    to_char(mo.request_date, 'DD/mm/YYYY'::text) AS data_richiesta_str,
    mo.request_year AS anno_richiesta,
    mo.status_id AS id_stato,
    ms.name AS stato,
    mo.start_date AS data_inizio,
    to_char(mo.start_date, 'DD/mm/YYYY'::text) AS data_inizio_str,
    mo.end_date AS data_fine,
    to_char(mo.end_date, 'DD/mm/YYYY'::text) AS data_fine_str,
    mo.address AS indirizzo,
    mo.number_from AS civico_iniziale,
    mo.number_to AS civico_finale,
    mo.x,
    mo.y,
    mo.geom,
    mo.place AS tratto,
    mo.signage_date AS data_apposizione_segnaletica,
    mo.signage_address AS indirizzo_segnaletica,
    mo.signage_num_from AS civico_inizio_segnaletica,
    mo.signage_num_to AS civico_fine_segnaletica,
    mo.signage_place AS tratto_segnaletica,
    sp.name AS posizione_segnaletica,
    mo.signage_base AS base_segnaletica,
    mo.vehicle_num AS numero_veicoli,
    mo.vehicle_plate AS targhe_veicoli,
    mo.manage_user_id AS id_utente_presaincarico,
    mo.manage_date AS data_presaincarico,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS utente_presaincarico,
    mo.control_date AS data_controllo_segnaletica,
    to_char(mo.control_date, 'DD/mm/YYYY'::text) AS data_controllo_segnaletica_str,
    mo.control_team AS pattuglia,
    mo.note,
    mo.approved_user_id AS id_utente_approvatore,
    mo.approved_date AS data_approvazione,
    to_char(mo.approved_date, 'DD/mm/YYYY'::text) AS data_approvazione_str,
    (((s.name)::text || ' '::text) || (s.surname)::text) AS utente_approvatore,
    mo.town
   FROM (((((public.move mo
     LEFT JOIN public.authority au ON ((au.id = mo.authority_id)))
     LEFT JOIN public.move_status ms ON ((ms.id = mo.status_id)))
     LEFT JOIN public.sysuser s ON ((s.id = mo.approved_user_id)))
     LEFT JOIN public.sysuser sy ON ((sy.id = mo.open_user_id)))
     LEFT JOIN public.move_signage_position sp ON ((sp.id = mo.signage_position_id)));


ALTER TABLE public.view_traslochi OWNER TO user_cantieri;

--
-- TOC entry 294 (class 1259 OID 26102)
-- Name: wg_category; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_category (
    id integer NOT NULL,
    label character varying(64) NOT NULL,
    _position smallint,
    manageable boolean DEFAULT true,
    permission character varying(64)
);


ALTER TABLE public.wg_category OWNER TO user_cantieri;

--
-- TOC entry 295 (class 1259 OID 26106)
-- Name: view_wg_category; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_wg_category AS
 SELECT c.id,
    c.label,
    c._position,
    c.manageable,
    c.permission,
    p.description AS permission_descr
   FROM (public.wg_category c
     LEFT JOIN public.permission p ON (((c.permission)::text = (p.name)::text)));


ALTER TABLE public.view_wg_category OWNER TO user_cantieri;

--
-- TOC entry 296 (class 1259 OID 26110)
-- Name: wg_layer; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_layer (
    id integer NOT NULL,
    id_category integer NOT NULL,
    id_parent integer,
    depth smallint NOT NULL,
    label character varying(64) NOT NULL,
    type character varying(32) NOT NULL,
    visible boolean NOT NULL,
    opacity double precision,
    tiled boolean,
    source json,
    layer_name character varying(64),
    selectable json,
    hover character varying(1024),
    filter json,
    upgradable character varying[],
    dynamic_filter boolean,
    min_scale integer,
    max_scale integer,
    extent double precision[],
    style json,
    searchable json,
    queryable json,
    _position smallint,
    permission character varying(64),
    image_id smallint NOT NULL,
    cluster_style json,
    editable boolean
);


ALTER TABLE public.wg_layer OWNER TO user_cantieri;

--
-- TOC entry 297 (class 1259 OID 26116)
-- Name: wg_layer_image; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_layer_image (
    id smallint NOT NULL,
    name character varying(32),
    image character varying
);


ALTER TABLE public.wg_layer_image OWNER TO user_cantieri;

--
-- TOC entry 298 (class 1259 OID 26122)
-- Name: view_wg_layer; Type: VIEW; Schema: public; Owner: user_cantieri
--

CREATE VIEW public.view_wg_layer AS
 SELECT l.id,
    l.id_category,
    l.id_parent,
    l.depth,
    l.label,
    l.type,
    l.visible,
    l.opacity,
    l.tiled,
    l.source,
    l.layer_name,
    l.selectable,
    l.hover,
    l.filter,
    l.upgradable,
    l.dynamic_filter,
    l.min_scale,
    l.max_scale,
    l.extent,
    l.style,
    l.cluster_style,
    l.searchable,
    l.queryable,
    l._position,
    l.permission,
    p.description AS permission_descr,
    l.image_id,
    li.name AS image_name,
    li.image,
    l.editable,
        CASE
            WHEN (l.image_id = ANY (ARRAY[2, 6])) THEN 'Point'::text
            WHEN (l.image_id = 3) THEN 'LineString'::text
            WHEN (l.image_id = 4) THEN 'Polygon'::text
            WHEN (l.image_id = 7) THEN 'Geometry'::text
            ELSE NULL::text
        END AS geometry_type
   FROM ((public.wg_layer l
     LEFT JOIN public.permission p ON (((l.permission)::text = (p.name)::text)))
     LEFT JOIN public.wg_layer_image li ON ((l.image_id = li.id)));


ALTER TABLE public.view_wg_layer OWNER TO user_cantieri;

--
-- TOC entry 299 (class 1259 OID 26127)
-- Name: webgis_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.webgis_seq
    START WITH 2
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.webgis_seq OWNER TO user_cantieri;

--
-- TOC entry 300 (class 1259 OID 26129)
-- Name: wg_base_map; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_base_map (
    id integer NOT NULL,
    label character varying(256) NOT NULL,
    image character varying NOT NULL,
    type character varying(32) NOT NULL,
    tiled boolean NOT NULL,
    opacity double precision NOT NULL,
    _default boolean,
    _position smallint NOT NULL,
    permission character varying(64),
    source json NOT NULL,
    print_not_reproject boolean
);


ALTER TABLE public.wg_base_map OWNER TO user_cantieri;

--
-- TOC entry 301 (class 1259 OID 26135)
-- Name: wg_layer_attach; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_layer_attach (
    id integer NOT NULL,
    name character varying(128) NOT NULL,
    descr character varying(64),
    size integer,
    insert_date timestamp with time zone DEFAULT now(),
    entity_id integer NOT NULL
);


ALTER TABLE public.wg_layer_attach OWNER TO user_cantieri;

--
-- TOC entry 302 (class 1259 OID 26139)
-- Name: wg_layer_attach_id_seq; Type: SEQUENCE; Schema: public; Owner: user_cantieri
--

CREATE SEQUENCE public.wg_layer_attach_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wg_layer_attach_id_seq OWNER TO user_cantieri;

--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 302
-- Name: wg_layer_attach_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_cantieri
--

ALTER SEQUENCE public.wg_layer_attach_id_seq OWNED BY public.wg_layer_attach.id;


--
-- TOC entry 303 (class 1259 OID 26141)
-- Name: wg_legend; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_legend (
    id integer NOT NULL,
    id_layer integer NOT NULL,
    label character varying(64),
    image character varying,
    extern boolean DEFAULT false
);


ALTER TABLE public.wg_legend OWNER TO user_cantieri;

--
-- TOC entry 304 (class 1259 OID 26148)
-- Name: wg_legend_class; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_legend_class (
    id integer NOT NULL,
    id_legend integer NOT NULL,
    name character varying(64) NOT NULL,
    image character varying,
    _position smallint
);


ALTER TABLE public.wg_legend_class OWNER TO user_cantieri;

--
-- TOC entry 305 (class 1259 OID 26154)
-- Name: wg_map; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_map (
    id smallint NOT NULL,
    map_name character varying(128),
    default_bbox double precision[],
    scales integer[],
    watermark character varying(255),
    point_zoom_level smallint,
    info_format character varying[],
    image_format json,
    vector_format json,
    mapserver json
);


ALTER TABLE public.wg_map OWNER TO user_cantieri;

--
-- TOC entry 306 (class 1259 OID 26160)
-- Name: wg_map_rs; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_map_rs (
    id smallint NOT NULL,
    name character varying(128),
    x_label character varying(32),
    y_label character varying(32),
    units character varying(32),
    prefix character varying(32),
    x_prefix character varying(32),
    y_prefix character varying(32),
    definition character varying(512),
    _default boolean DEFAULT false,
    code integer
);


ALTER TABLE public.wg_map_rs OWNER TO user_cantieri;

--
-- TOC entry 307 (class 1259 OID 26167)
-- Name: wg_map_tools; Type: TABLE; Schema: public; Owner: user_cantieri
--

CREATE TABLE public.wg_map_tools (
    id character varying(24) NOT NULL,
    tip character varying(32),
    class character varying(32),
    _position smallint,
    params json,
    permission character varying(64)
);


ALTER TABLE public.wg_map_tools OWNER TO user_cantieri;

--
-- TOC entry 4692 (class 2604 OID 26173)
-- Name: authority id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.authority ALTER COLUMN id SET DEFAULT nextval('public.authority_id_seq'::regclass);


--
-- TOC entry 4694 (class 2604 OID 26174)
-- Name: authorization id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public."authorization" ALTER COLUMN id SET DEFAULT nextval('public.authorization_id_seq'::regclass);


--
-- TOC entry 4695 (class 2604 OID 26175)
-- Name: ctx_function id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.ctx_function ALTER COLUMN id SET DEFAULT nextval('public.ctx_function_id_seq'::regclass);


--
-- TOC entry 4696 (class 2604 OID 26176)
-- Name: ctx_title id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.ctx_title ALTER COLUMN id SET DEFAULT nextval('public.ctx_title_id_seq'::regclass);


--
-- TOC entry 4697 (class 2604 OID 26177)
-- Name: event id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event ALTER COLUMN id SET DEFAULT nextval('public.event_id_seq'::regclass);


--
-- TOC entry 4700 (class 2604 OID 26178)
-- Name: event_type id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type ALTER COLUMN id SET DEFAULT nextval('public.event_type_id_seq'::regclass);


--
-- TOC entry 4702 (class 2604 OID 26179)
-- Name: i18n id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n ALTER COLUMN id SET DEFAULT nextval('public.i18n_id_seq'::regclass);


--
-- TOC entry 4703 (class 2604 OID 26180)
-- Name: i18n_string id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n_string ALTER COLUMN id SET DEFAULT nextval('public.i18n_string_id_seq'::regclass);


--
-- TOC entry 4706 (class 2604 OID 26181)
-- Name: menu id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.menu ALTER COLUMN id SET DEFAULT nextval('public.menu_id_seq'::regclass);


--
-- TOC entry 4707 (class 2604 OID 26182)
-- Name: menu_item id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.menu_item ALTER COLUMN id SET DEFAULT nextval('public.menu_item_id_seq'::regclass);


--
-- TOC entry 4709 (class 2604 OID 26183)
-- Name: move_attach id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_attach ALTER COLUMN id SET DEFAULT nextval('public.move_attach_id_seq'::regclass);


--
-- TOC entry 4711 (class 2604 OID 26184)
-- Name: move_photo id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_photo ALTER COLUMN id SET DEFAULT nextval('public.move_photo_id_seq'::regclass);


--
-- TOC entry 4713 (class 2604 OID 26185)
-- Name: move_signage_position id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_signage_position ALTER COLUMN id SET DEFAULT nextval('public.move_signage_position_id_seq'::regclass);


--
-- TOC entry 4714 (class 2604 OID 26186)
-- Name: move_status id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_status ALTER COLUMN id SET DEFAULT nextval('public.move_status_id_seq'::regclass);


--
-- TOC entry 4715 (class 2604 OID 26187)
-- Name: permission id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission ALTER COLUMN id SET DEFAULT nextval('public.permission_id_seq'::regclass);


--
-- TOC entry 4716 (class 2604 OID 26188)
-- Name: registration id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.registration ALTER COLUMN id SET DEFAULT nextval('public.registration_id_seq'::regclass);


--
-- TOC entry 4718 (class 2604 OID 26189)
-- Name: roadsite_prot_out_email id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite_prot_out_email ALTER COLUMN id SET DEFAULT nextval('public.roadsite_prot_out_email_id_seq'::regclass);


--
-- TOC entry 4719 (class 2604 OID 26190)
-- Name: roadsite_status id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite_status ALTER COLUMN id SET DEFAULT nextval('public.roadsite_status_id_id_seq'::regclass);


--
-- TOC entry 4720 (class 2604 OID 26191)
-- Name: role id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- TOC entry 4724 (class 2604 OID 26192)
-- Name: session id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.session ALTER COLUMN id SET DEFAULT nextval('public.session_id_seq'::regclass);


--
-- TOC entry 4725 (class 2604 OID 26193)
-- Name: sysuser id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.sysuser ALTER COLUMN id SET DEFAULT nextval('public.sysuser_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 26194)
-- Name: wg_layer_attach id; Type: DEFAULT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer_attach ALTER COLUMN id SET DEFAULT nextval('public.wg_layer_attach_id_seq'::regclass);


--
-- TOC entry 5013 (class 0 OID 25847)
-- Dependencies: 231
-- Data for Name: bari; Type: TABLE DATA; Schema: gis_data; Owner: user_cantieri
--

INSERT INTO gis_data.bari VALUES (0, '0106000020797F000001000000010300000001000000B70D00002914BBCB32B223415BA34D6E30645141F60DC51441B2234157E0E34F2E645141E78EFBCD32B223411BD304C02D645141A185B47C37B22341A7A11E672B645141D7ADECE55FB22341CCD6306D2B6451417EA67BF470B223415774DEE828645141B60ACB24B0B2234156B708BD27645141E48D9ADCCBB22341C3DDDC0D2A6451415ECBAA55F1B223418D4F3EF92B645141E6A5BCF120B32341DC93CAB029645141858FCE2035B32341B2E206032B645141033A673373B323412F4665BA28645141CCC05DFA6CB32341480B449A2564514186274F2481B323415CC926FD256451418CA04DCB9CB32341B2231DB1236451413B99F1DA91B32341FCEAFB10186451415BE1FE2CD3B3234112BAFE7114645141D8A5707FFBB323415688F36813645141E93C4A3A0FB42341E4E8E6E61C645141395D48FA54B423412DA736AB1D645141FB8AAD1B77B423414281050F1E645141A930D53B91B42341B3FE803320645141614F4DB1CAB42341B19D8963206451412612949CE4B42341AF6FB82822645141C152253A10B523415E97D476236451413A769AD333B5234141E8FBE722645141C5A5278D52B523418FD4447323645141D1F2192FACB523418980954C226451410676246BF6B5234131496BAA1D645141A15944BC18B623414B3A2D7E1D645141251428E41BB623411824CC951F645141EF99015C2EB623413A42B09C1F645141704558C932B623412AA713B41D64514146D8DE0196B623411C1158A71D6451415438EFB995B62341A4FD76591B645141B832952FBEB62341D92CF48F1A645141B12EE762E3B62341AA642C7F17645141F6B81D9B19B7234177464957166451418B69EE2F19B723411302E0C913645141439F314735B723418DBD99FA14645141F7FADF384CB72341DE854C49126451410087809F3EB7234154B376590F645141A2CB584B6BB7234158A552F60E64514155640C937CB7234147DEBE3D1264514145425262B2B72341728A2BDA0B645141883FEE45D6B72341B0CBECEA0A645141B8982FADFFB723415A41CBEE0A645141632BED540CB82341F8E63F110D645141920BF7C83AB82341253F50CD07645141448F19E173B8234131592B6F0664514199C27DF781B8234129AF2F430164514112BC550E96B82341E33B7EB7FF6351412E4B994397B82341A2A94F66FD6351415F4CD032D5B8234194D727DEFA6351414EB8D3D1D6B823416627924BF9635141F6BA1AA0FAB82341ED8C061CF9635141266B5A30FCB82341B1A34C07FB6351415948BE8D0EB923418BC28ADEFA635141607D44BC44B923419108DD23FE635141966CFE405FB92341D46E971700645141869277E277B92341FC1D907000645141B7DAE9DB7DB92341187330D9016451412A3FBF1081B92341C173BA9A026451410019C27F93B92341E2A3BC9102645141FE9BD76A9BB923416944DA0D066451415C9D238EB8B9234174C29A3B08645141E1C670D3E5B923412EFD020708645141B8CE72BBF5B923414588055604645141E75E0BE80FBA23418E1AEBAA056451417DE794FE17BA23413DC78C2A03645141B28469E74DBA234137C4B77301645141F42BB8325ABA2341B241E88AFD635141311BA07474BA234101241B20FE635141FA022CBCA1BA2341A01B3D3DFB63514162534D7AA4BA2341FF5C4296FC63514104F00F9FB8BA23417B23CC09FC635141AA85AFBFC6BA2341736483BCF86351412A749439FEBA2341377EDE73F4635141E80991D81EBB2341A090A2EBF363514156DB0C3E3CBB2341F7BB042CF1635141F697DF965FBB2341818B5F90EC635141C1AE07D968BB23411C66072CEC63514121F669936DBB23418593A480ED6351411F6945E579BB23411DDBFD55EC6351413911C35489BB2341DB624364EB6351412730708897BB234121908E05EA635141587CB6DEAEBB2341C3BE8223E7635141A7AA5253BEBB2341E50E2121E76351419C03A013E2BB2341F2E25AF2E56351417D9BCF8708BC23419A68E83DE4635141D4551FE72DBC2341572E8D7CE1635141FAA182C224BC2341621B30E5DA63514146C364CD49BC23411FF889A5D6635141857CA102FBBC2341E215CE05DF6351411C45190189BD23410D9E75A9DF635141E38935BA87BD234137E5DEDAE1635141B5DFB745A7BD2341A2AD8914E2635141D4773EC4A5BD2341937E6AABDC635141FF78DAD783BD234121B6E7A6DC635141668D288183BD23415169E2D6DD635141469000D35CBD234128C9AF3CDE6351412D19808D56BD23413F3926ECDB635141E6AB890F4CBD234116F583E3DB635141B25B9A3A52BD2341AB696704DE6351410FB31071F5BC2341E3AF7613DD635141E3A0E6B304BD234199296E86D563514115E1EF35FABC234132DDCB7DD5635141C47DCAA3EABC23418C0BE27BDC6351414E4137C5AFBC2341FDC8A4C0D9635141684E44AAC3BC2341022E4DAAD0635141313D4EB2BABC2341F3EE3EAED0635141BED0F0F7A4BC2341E91B1029D96351410E51007671BC2341EA5AFF1CD7635141C11924567DBC2341A125C9A6D063514156F73DAA73BC2341879E884CD0635141C72E2C226ABC234198B8B47DD66351419E8E3F0B3DBC23413EF16F53D46351415C612ADA49BC234128A0FB0CCB6351412707B2C549BC2341AAF0984FC76351412030168840BC2341CB0E6557C2635141B86142816BBC2341B93D886E9F635141357F8B7B8ABC23412D8FA53D99635141FA0BC471A6BC234133D69180976351418A296CBFB5BC234161091F1E98635141D9B70D46D0BC234186F08C2CA2635141C1D1E80CA2BC2341E0230842A4635141370E35B6A1BC2341CBEB0272A56351417AC73B83D3BC234176F77784A36351411E317597E2BC2341DA49441FA96351419AD6BDE6AFBC23411B71A93EAB63514134E9DBA4B2BC2341CA75AE97AC635141B0EFEB1D33BD2341670203BDA7635141AB212E8131BD2341F14152A1A66351419ED03C71EDBC23417FA144E7A8635141FCF862C5DCBC234196252020A3635141C6FAA27F1ABD2341D73BAF38A0635141A08E15DA18BD2341966D1C0D9F635141C070D51FDBBC2341F14F8DF4A16351410756D5B6C3BC234168C20B1F98635141B443F6D5DABC23418394FA8B976351416288770BEABC23412FEE9B4B9563514184302648EBBC23415069813B91635141D81D9C01EDBC234102A092D88F635141AC8967F50EBD23418768291E8E63514160C003101FBD2341FAE7BF7A8D635141C5FA6C7B43BD2341DF654B9A8C63514196B4263551BD2341E9E7092C8C635141137D6DC179BD2341C551A6718C635141337E9CA3B6BD2341A43890698D6351414E82BED2DABD2341A177BCE88D63514183489E38FEBD234179D968C98E63514199F674030FBE2341A110A8638F6351419D9CCD1C34BE2341CD93216F926351411E46536449BE2341346DCFEE9363514146EAD55454BE23419D66ECC594635141B398092960BE23415C512F6B956351413876CB8368BE23413E11281896635141ED88AF6E76BE23413628A9E8966351418E2E2FEC81BE2341FA98E6BD986351416AB4499151BE2341077286469D6351413780A418D4BD23419320D98C9E635141A665E5A8B8BD234188CFE5899E635141033FE268BABD2341D2A51EE59F635141BEEF953A51BE2341050481769E635141FD9B61B48ABE23415E49014A9963514106946FFF8FBE2341363948BD9A63514115F69C3C93BE2341B40133159C635141B52408EF9CBE234147E79A2D9F63514190BD1D3D95BE2341E99F377DA1635141389D3AEF99BE23413A5ED50DA9635141F523E85576BE2341DF1EAC9CA9635141CCE5F3E41FBE23412B25D6EAAC63514158D7529F24BE23415E07733FAE635141817B714F8FBE2341FBA27994AA635141AC060D0192BE234188C412BDAC635141E5E053A493BE2341EAA6EA96B063514134E87AE9B4BD2341A195423CC06351419DF8095DAFBD234196D14339BF635141677E72C68FBD2341231EFC9DC1635141242AE980ADBD23414E008EA8C6635141DC1B60808DBE2341D4B21180B7635141049D01EFB2BE2341A917C18CB7635141300D9FFDDABE2341137B45A2B9635141CAA1B130F5BE2341912F52B5BD635141C4ABF1691DBF2341E9C8714BBE635141E6973DFB2CBF2341284471CABB635141F4949A5B80BF234147D9A8BFBD6351411452C427C6BF2341262165B4BD635141F17528B5C7BF2341B2950C02BC63514180DB61352FC0234156DA80B2B1635141E3637D5151C023414BF5F726B1635141A702305162C023412ADE8220B2635141316B759D8AC02341B20535A5B4635141B9A130B390C023410402CA85B763514190A5630DB9C023418346B609BB635141709797E2BEC023414D2C80DDB9635141BFCDEEB6DAC023413B0DB3AFB9635141406A2CA6DFC023413F9E9B63BB635141B525273700C123413B5426DCB96351415C8272080EC12341CFF1EDFFB563514181BBC33235C12341C37B6AFBB16351416F5D2D544AC12341E5C9F29DAF63514196A4787469C123411084374AAD63514143DE9DA88FC123413908DDD4AD63514125F5366FB9C12341D46AA4B8AC6351418E9338B5E6C123410A84FB06A8635141D2DB36C603C223415A2C16C9A3635141D74DC58016C223412C14812EA563514140B1D77146C22341EF8B4AE79F6351410C410CFC44C223412E57AC2B9E635141EDDC068C7FC22341E3B0E4DA9B6351411FFC616584C223411CAF9E0298635141D0736FF896C22341E34F17BC93635141AEA9E20EBCC22341A103F3299363514110CAB36FC5C22341B499AB619863514132E5DE481AC32341145E2BE7946351418C228C550FC3234135E1727290635141016BB74317C323414B4737C38C6351411757EEE435C3234180D096708A635141EB5D88167AC32341A95D609B8663514123A02AD5BCC3234159E427A884635141BAB09198CDC32341188E52018763514153D85D54E6C32341F3BEF18987635141B05109136AC423415AC816178463514109F3F7D68BC42341B2ADBAEC82635141251D4E0AD3C42341005EFD517D6351416438B81DEAC42341FE716F11796351419DD32C5409C52341E7C7F280716351418CF285A942C523412B73327D5F635141FA4D4F7453C523416D61711760635141068009EC62C52341FE3CBCE9586351416F1F36076CC523417AC952255963514191D0319078C523416590B6AB55635141F3F9CA3C8BC5234118BAE711566351412597DEC9B1C52341015351BE526351412A973F72C4C5234104231AB84D635141FBE79471CDC523418B513DF54B635141BF5BAEB9C2C52341B8F4F69D4A635141FA190140C9C523415BC9583246635141D85AA660BEC52341971D222F3F635141A3852A48CFC523416502C44A3D6351410EEA795CE9C523416388C0C13B6351411653F015EBC52341421ED35E3A635141159920E8FBC52341B2D2263A396351413FE4D12B54C623414DCDCB3539635141F63D6AB055C623410E92927337635141A708D6376BC623415E902AB4366351419C27FADFB5C623411D9D406E36635141B90F63E7B5C62341735455AF34635141D7B38457FBC62341ADCBB6E43463514122424BCDFCC623415E2754A0366351414C696E6512C723416723C07D3A63514160828E3125C723419DE7EE023C6351419CC3714456C72341D711EE443D635141D8A5A3D762C7234150CA01AA3B635141B21C56D26AC723416790342B3763514181049E2F7DC723417714740237635141F0701C978FC72341D5AB62B83863514176BC075DD5C72341353BDA3A3C6351416D6F7AB811C82341254FC9F23E635141A00FE71B49C823417CE1EEE63F6351411F23CE1A51C823416BF088D44063514102ED47D772C823414712196941635141724B0AA37FC823411340034E3F635141961198A8D4C82341438CCD6E4263514174007C11D6C823413655E9C24F63514169784113DCC823413758FA3155635141BA08FDBFE8C82341293CC34358635141013C110500C92341779CD48D5B6351417F9233DA1EC923412ADE90175E635141CDB64ED762C92341FA8FED2E60635141F073D249A2C92341892EA36160635141A5724EE49EC923414FBFDADA5D63514192FEB29D51C92341FD0FC0E65D635141BC60C3D529C9234129B14C505C635141DC637214FBC823413F88200B586351410C08E586E8C8234117DC107852635141DCCF0989EBC8234158FD9EE945635141ACC476390CC92341018F2981456351411DB71E6910C92341F35F632943635141D2A9B51894C9234190B9623443635141556F87E0BFC92341B2F61B03436351415CD964EDC8C92341515C63084D635141A0195E64D2C923417D0158034D635141F2269CE1CEC92341AD5B50AF4663514170175917E6C92341829B5B2B476351410668CB18F8C923414BC73C4347635141EA9981FE05CA234106D36524476351418636FD550DCA234178843AE44663514184BAE4851BCA2341B6DEFD6446635141B133056726CA2341CC1D146E44635141789235EE2FCA2341DE1500BA42635141A0816DB537CA234100FDB4AA3F6351418129E87046CA2341B40FCB5A3E6351416EC046704DCA23419C3ECC7B3D6351417E1F7C1B5ECA2341B5DB0DF73C6351413A7437E965CA2341A2ACE6A53C635141BA729DD972CA23412DA725993C6351412E6AD00581CA234145615EF93C63514120925FB293CA234152688F5F3D6351415E8E338EBBCA23419D1385673C6351410287EFF4D8CA2341DBFCB9763B63514164BD9412EECA2341DDC7BAF839635141A67C15BF02CB2341ADB50E7B39635141DD31AB1006CB23411B9B54903E63514169AC91B633CB2341046E750A3F6351419B7BB42859CB2341F4CDB0373E6351417A2C08E57ECB2341178F86043D635141C1701DE58ECB2341927278313C6351412BD7AB0294CB23411E6C87863B635141D73A8CC09ECB2341DD381650396351411464765EA8CB23416A831DAB38635141FAB633FEB2CB234118B37B2437635141CD6A28A4B5CB2341B14D979F356351413BB81250CFCB23416CA4C926356351417C4CDA09EBCB2341D70958C934635141880E6F18F6CB2341B8B5A4F034635141D5BF913AFECB23411E2FC61D36635141B694658E03CC2341B21FEDA037635141363D199107CC2341FCA6CB7639635141CE0F062C1ACC234168B938BD3963514171B2148D28CC23410907BD7C3A635141407DAAE42BCC234181C64B043C63514188552E9056CC2341CE4A08853C63514170A0805D5ACC2341E05CC1AF37635141DED7E2FA66CC2341910284F3376351419A1CDE4988CC234151B1F1A838635141E5ABB8EB9BCC23419CC30CFD38635141FE94E54AABCC2341591A5DBA396351416F1893B8B5CC2341F11208723B63514137C5045DD1CC2341179E47D43B635141F983757EE2CC23413F6E8D3E3B635141F702F5AEDACC2341702DCF89446351414C92134E13CD23413E77EDEA456351416CBE1BE519CD234176B1231C466351419819F6CD18CD2341B6E17DBD47635141F8AC374626CD23414ABF84BF476351414F60C88732CD234106FCE843486351416A56C69542CD234174D5137048635141FAD44A005CCD2341AF818D6748635141572559CDA5CD2341B2425E6348635141DDE8B6A4C4CD2341F964D83E4863514196B2769C0CCE2341BDB5239F47635141306F9F530ECE2341434F78EA48635141AE15803F61CE2341C0546A424863514156C57C9F60CE234157CDBB55456351417EFCD25977CE234197BA6BF3446351415393C8A8AACE23415844EEF143635141550A0DBFCFCE2341075FCB5F43635141A59E71F8E6CE2341035C61FC42635141B116415AE7CE2341D92A0A2E3F635141F6EF4620E7CE2341C6CB67DF3D635141B5AF6EB0FCCE23417B1AE22F3D635141B20F6FD82FCF2341880352CE3C6351419884A51063CF2341AF22BABD3A635141838BBBFA79CF2341BFED5ECB39635141875C7857D5CF23417E2D8C9334635141ABA1638225D023418F8BE5F42E6351416E8D9B8733D02341D6250BF52F6351419C34B00C6BD02341E6EFEB592F635141CA7C81DD89D023418C4044772C6351415219D1F79FD02341B59C4628296351417EB2E98A9CD02341A07C696028635141F7CD9225B7D023418F3664172563514128347387B5D023414554EA2C2263514116F42073C3D0234180BF5E801E635141A2A6687007D123418CF0D8CE1563514196640DBE57D12341862EE5230A635141B26A2B6A78D12341C7EF0E4F04635141C8ED899998D1234146F912CDFB625141849CBAB3D6D1234142118A48F36251414FEA7B89FBD1234106E8A4A9EE625141C6A4898A2BD22341A5C372B3E76251418902555744D22341A0660010E2625141B66C21EC7BD223413F31067AD9625141D9A31FBEA2D22341B0F8B9D6D462514188DE70EBCAD22341B66B63BFD162514118F46FF4E6D223412510E4F0D1625141D3B3FD3601D32341738B0D09CE625141C625FB2301D32341A1DA7E1ACC625141C6EAA02715D32341E70445A0C8625141947F9A0A31D323412373A8F4C4625141A8F9797340D32341CB97D044C162514177349C7D54D323414D21B888C062514124F986EA79D323415A729FC6BE62514108D983168ED3234154CE437BBC6251410D39778292D3234115EEE2C3B8625141526F25BCC0D32341C6186631B2625141BE56A520E9D3234131AD1CCBAC6251413EB6B0EB20D423416A2A3B63A66251414A7FA8344FD4234152D6C19EA2625141385B473068D423419E2150E8A0625141D589E0D675D42341ED44828B9E62514147E9974AB2D4234164BA775899625141D82E2D1DD4D4234102F74EB0946251415C6D2C490AD523418052FFDA8F6251413FD87E994CD52341ABF9D9BC876251417CDA568D73D5234136824D8A81625141BE96AD13AED52341A2F0DADD78625141DE5036EFC9D5234193B628F176625141630AF49FFBD5234104AF3705736251414937C62A19D62341198BEED66D6251417A0043962ED62341554A19196B625141AC8AD67463D62341EA2D0EB7656251419BFE0E5E77D623412DCD300D62625141FBBBA3C79FD623411E3B40965D6251418FE04990E9D623412DECB82558625141B3FB696C22D723412F4135AA536251411B29A20E59D72341C85CECC34E6251413A8FEA758FD72341F38D0A0C4D6251410FC5B609C7D72341305920F348625141CBA9959EC8D72341EB59E481456251417E767509E3D7234185AAEEC84262514165D3F07DF5D723414A1070E638625141C2994572FBD72341E07E678D32625141B1C2A694EAD72341527B9A0430625141822C20A3DCD723413889282A26625141367DFBB6E2D723419E741BF020625141978C6877F5D72341319AD3C71E6251418A475CF826D823417BE1EF6B1B62514147B2D7AE3FD823410C1A3B051B625141CBF4B62766D823411B9429401A625141FCC6D5A48BD82341D92B0ECF1662514129F506968ED82341A9AEBF6C10625141513961A9A5D8234102D13D2C0C6251412BF3F3F9B9D82341120636EF0B62514167BE9CA0D5D82341D4723AA309625141649715CFE3D823410B8136550762514173FDA0CBDED82341DE94FAE301625141C363F63DF9D8234153241E6CFD615141408407F839D92341F3D471F0F6615141C83003D85AD92341EA5AF6F7F561514121F8305B79D9234175A5FEA0FA615141D237E00183D92341CCDDE90BFA6151414EFCCB0267D9234128F6416DF561514128DAF1BC71D92341E5414916F4615141F8BBB3C86ED92341F657338FF061514122F31D3D7ED92341E74BD48CF06151412399F2E985D923418CBCE94DED6151415B79D62DC2D9234159C1F0AAE8615141BBCF501CDED92341531CCEACE8615141C6A79030F2D923417C2063CFE9615141724FFA1241DA2341DD866593E4615141E2018C7775DA23416E0ACF21E06151414C763BF7A0DA23417DF6B5A2DD615141B96DE2BCABDA2341000832F9DF6151413CFB81E4B4DA2341A44F3765DF6151415B4DF4A7B0DA2341E39CBA40DC615141CCFA214FBBDA2341182F35FBD8615141A8E85AECDBDA2341B5B937A4D6615141C64A48F3ECDA2341601EDBDED561514173E19D90F7DA234173347A06D76151415A6DF8B108DB23414622C370D661514186074B131EDB2341C48445D4D16151413D408FED43DB2341EE1654F1CF615141BE0CF9A852DB234115886EA1CE615141811818D899DB2341B48C3DE6C9615141013EE8F499DB2341C646A667C76151416857F016F2DB2341D13D9275C4615141C65DC4C904DC2341AB7BE399C7615141B549CED30ADC2341F1E5FCCCC661514164778AD501DC2341E283CE12C4615141FE86C0A531DC2341B98CB929C261514142C4F3DF4EDC23418E67BC9DBA61514102A5E71C88DC23414AE8F2D0B6615141B0859F36FFDC2341F123545CB0615141E01238041BDD234143596E70AD6151415A0C8D1437DD23419DC10AE3AB6151417F419BAE44DD23411D1BD255AA615141A9047A1E43DD23413747936AA8615141AA323A2765DD2341EAB685F0A5615141027B634F6DDD2341C155F68FA36151413F111D9C85DD234115E8AC6AA26151415B2DCCEF9CDD2341328BEC36A26151418CB1E501ECDD2341FAB1E86A9C615141587CB089F0DD234163C1FAB19A615141410BDD8339DE23418B90A6B394615141733BBC5935DF234114E64B01806151411D6CECDFF9DF23410C34219572615141D87BABDF6DE02341127C28086B6151416D0D739A9DE02341627BC5DE696151412EB1EDB7C2E0234193C3C38D676151417A93F8B5C7E023414AC4DAC36561514174E51DCFEFE023419F06063B6561514159938506F6E023410430518C66615141C62B3E9005E12341135A43CA65615141B1A0029EFDE02341D62A190D64615141627FD05616E12341E62C2BF860615141E4005075A1E12341078C29D858615141D087F0E8ADE1234190B1491E56615141233D4493F3E123410EA2522553615141DDFF61EC57E223411BC1FFD84E6151412DF4AE6F9FE22341336D1A9C4B61514194D89057F7E223412BDA6C5B476151419B4AD5761FE32341CE19EB4443615141CE317B0F59E32341C1B885373F615141DCA524F68EE32341A7B4FDB13B6151419B2F68FCB0E3234176842DE63B6151410248D6B4BEE32341C073F2F43F615141727EE3FBC9E32341DE80189C3F61514170FC88C0B5E32341BAC5A5CD38615141918A66DDC1E32341A554BC433761514187A96AE7D5E32341EB06A8873661514143A291C8EAE3234138BB4B6936615141A2A3E810F8E32341B7085FFB36615141885E71122EE4234163250F3D40615141D0FDED5B45E423415C73A62A3E615141F28770661AE423410FF27EBE3761514123C6A61E1AE42341C933A970356151419A18E96426E42341F6D79998306151412DCEDB0A39E423418219B1402E615141F4F53EDC4EE423419AC4EA202D615141649B43A770E42341520DB4372A615141518D458DABE4234172110CB726615141E24F5944C7E423418AAEDA0729615141528991E6CBE42341138B937E276151413FDD660FB3E42341557184F7246151413B8F2A86C2E42341F85DEC4622615141EA4F3EF2F8E423410C6A677E21615141C359F32AFFE42341726D799E2461514165FFAA9BFAE4234166614B1628615141CE70A9C6EAE42341C57CBEB52D6151416CFD561F02E5234123B953712E615141F5FD49E41DE52341717758C1316151418B2D1A0829E523414F81F7283161514127160D8B47E523415CD1FBD13561514157173FCE58E523419E2F06AD33615141CC628F6E52E52341B7EFDF2C31615141F36F8D8E3BE52341912215B22D615141C874AAA03EE523418ED3903D2A615141595AB4D44DE523412FEA772E26615141AE1553F061E5234129632792256151415532A57A60E5234131838FD6236151414405B11281E5234158454290206151412E4C7D2C92E52341FF5472B921615141DBEEB1F5A2E52341053DEB8420615141DFF3CCAFA1E52341BC9549391E6151415C26F182FCE52341773CCE6F1D615141B9B432C802E6234154074FC01F615141BC9D3F950DE623412D91E35720615141CC3D083F1AE62341A4F016CC1F61514134B6D9D024E62341375A45461D615141092FE16367E62341A56B80D21C6151415C2224C78FE62341827548E91B615141D3BB9DA5D6E623411708321C1B61514198EBB9A252E723417BBADAF918615141122A0D2D5DE72341038EEE32186151412C534F4287E7234159BAB3A517615141672642D999E72341770096CB1861514140E9CC1BC8E72341B2E6D694186151419E416580E2E72341A76E946919615141D58AA016FEE723416311A2CC186151412F56FAD124E82341C0B5156619615141301BED9240E823411A78C549176151415D6435A85CE823418149B9AB166151411B7C651758E82341A0F1FC0812615141F6B10F5D89E82341839684DB116151412C7EB8369CE823419939E75F1461514194A357AFC2E82341256DDA9A13615141211F30BEF8E82341CD323044116151413006650939E92341D6C870660F615141576A74B077E92341D759EA2B0E615141717C45F483E923412BA216020C615141A7A58B7ACCE923415D7955B2096151411F3BA042D1E9234163E922060C615141AD5BDEC9E0E923414CDE4EF20D615141E7CFA87618EA2341AA0017860E6151416849C86448EA2341F89F3AED0B61514176AD193E83EA2341DD9E253C09615141E0F8908FB1EA234101CB9D87056151414A6EF465B1EA23412DA7FC8902615141798FAE56D7EA2341415128B6016151417A4F8BEAE2EA23416DDC769A04615141D4CF655A05EB2341FBD93B8D05615141FD8F4BC328EB2341A72E798E0561514118BEF28E41EB234163C1186804615141D9C5429D52EB23416049DAE301615141406C9E406BEB2341C5109F8EFF60514111B1083C90EB2341613DE0CCFE605141ED7464C194EB234142382DC2FF605141E56B9E66B8EB23412BBFD063FE6051412B2A9FF6B3EB2341B31CD5AEFC605141FEE29DEC16EC2341FFCC7B95F860514184049F7C12EC2341DD3980E0F660514150EAB6E44CEC23419E81BB2FF5605141A0017E376FEC234155964F55F2605141567CB9C884EC2341215B9674F360514165136BE79BEC2341CC2F8DE1F2605141B9F8E37EA3EC2341C8865862F0605141426155DE26ED2341A3F78461EB605141CE3F989D2BED23412EE36FA5ED6051419521504744ED2341CAB24E0EEE6051411A09F40D4FED2341107FC9E7EB6051418C438683BBED2341A5C549D9E7605141E6643E9132EE23419A3A1403E4605141FA38201C50EE234182149F20E560514113A77EE176EE23412609BA98E7605141BF4EE5569AEE2341927F67CAE66051415DDFB8E898EE2341358FED4FE360514120546B0C0BEF2341D8C72AB5DE6051412476CF0F4FEF234120D3A90DDF605141EF15DE2552EF2341D2367905E1605141C867BC748EEF2341575BFC0FE06051414810C09B96EF2341EA626E2CE26051412CF9622FACEF23410AD37D9DE0605141E26CB8B9AAEF2341ADD0E7E1DE6051419568B8511EF02341C761F633DA60514192AB728624F023417A56B5E7D760514164313E8195F0234186DE83CED46051411348DC4294F02341847D01C4D0605141974EB4A6A9F02341E9621AC5CF605141C0FD75A3ACF023415A9F4810CD605141BE972229D0F023413FF2F492CA6051419B93722206F12341540DFCFBC8605141BB21BC364FF12341282B1E79C9605141F21903C053F123414968B9DACF6051413C64720465F123415BE88B84CF60514109357E2782F12341ACF28795E46051410144F7A2BBF123411354BB06E360514194AB0EFD97F123419CD61536CB60514120F15749C6F12341B6503E92C66051417BC18D962CF223419D3E7200C46051414EB0DF1B29F2234176586239C2605141B0FE1ACEB2F22341F5034688C0605141A0D1C78A61F32341C88B65E3C060514150281E7CCFF323411153964EC16051412467C38127F42341C0DDE5A9C260514126FE177C79F42341B0F95403C36051411E4787DAC0F42341878DEB03C46051412F79E8CF0CF52341F4789119C6605141F1F2C1571FF52341367F37BDCA605141AD50599A3FF52341E1BE65C1D0605141C05986756FF523414034C385D2605141B7371E5974F52341794B398CD060514157A67ED899F523412A97B4B8D0605141974247EDD8F523413EA08B40E26051416233AF02FBF52341E789718EEB605141FCF211AE2AF62341DC29D7E2ED6051416D14FADA58F62341EB3AC66BEE60514173A401C4C3F62341A6175BDEED605141325B9C34C5F6234174049DAAEE605141BD9A54BAE2F62341FCAAD3D8EE6051410F58F93EE4F62341CDE3A316ED60514150BB798F2BF72341D3630418ED6051418778BD4552F7234150DDE00DF36051414C346B9067F7234187CE18AEF3605141F0E682397FF72341745F5FC7F6605141FE045FF47EF7234167E51517F860514124664A0393F72341BBDF554AF86051415A6F12CD94F72341DEB26F38F560514196AB9A3BA7F72341E49C762FF560514169479585B9F7234149273318F360514109974458E8F72341A58B61B4EC6051412D0D0399B2F82341D206C852EC605141E8F2EA63D6F82341BFD07AD1EE605141588CBBCBDFF82341071E354AF26051412244F112E1F8234134AC9564F6605141BE18AD5ED9F8234174D25662FB6051418E2D8DE5C3F82341AA54EB20FD605141B6318E4BC2F82341E870C8A2FF60514104F276C3ACF82341DDD920DF04615141A04E410DA8F823418516D6F608615141A3E591F4BEF8234159B9B7B20A615141DC8ED811DEF823418652450D0B615141BD773E8EF0F82341AA4980030C61514108319C13FDF82341AFF025B50F6151413E56319812F92341E2F4F9A311615141FE6D940633F9234185A4D1AB11615141370B1E0541F923410A2EDFED0F61514123C1F57258F9234167F7C4E90F615141C45818AE5CF92341AF34743F116151410ED9760371F923414410C1F1116151410702E72285F92341CEC6BBC116615141713CF51993F92341151BABC21661514117AB1AC69DF92341C85B836C146151412477F55E19FA234155E3AF49146151416E53DEBD14FA23415738FC5511615141E083547332FA2341C1A729F410615141387A7CDF8BFA2341A007CC8817615141DC76C2EB0AFB2341351FA2372161514143FC341599FB2341B9A651C8256151418EA2CBCAE7FB2341D344BB882661514131D5A3DC39FC2341D80E457423615141FC9019F569FC2341A75C115C1F615141CDC29B37C2FC23410AB8148F146151413FEDD85EF8FC2341FE3D974D0A61514144B8A4DA1EFD23413AF5615D02615141E8AE589B3AFD234162E615410061514197AA9B1A60FD2341F0FB8F6D006151414F798C7C72FD2341EF9D25340161514130BF724EE0FD2341E465CB170D6151411229CDD72CFF23414718B56835615141929321A0DA0024417AAA12386B615141566F07A7FC0024418DA54BEF66615141185295BAF1002441D4C7C2386561514159938E4B01012441F06AD6B762615141F2B7D105F2002441F1F06A5B606151410E828B7ADF0024410789F2E2626151413A9CBF83A7002441E5FFDB635C61514148EA9BF9BB00244136BA29B85961514122FB3439B1002441B7C1085158615141AA5994E69C002441DB6C413C5B61514119C8A8336B0024417B83E23E5561514191506AA67C0024411ADCE98952615141F132E71A68002441F76E92A94F6151419B04838C5200244157A1D32752615141BA634C8BEFFF23410A2856FC45615141313D7C41FCFF234120B2FBA0446151419C915BBAECFF2341E7E0D4B442615141405A85CBE1FF23413D3F7EAC43615141B24C311BAAFF23412F2C73AC3D61514101DC9264B3FF23411B0A3F893B615141C244728FA5FF2341C02614F939615141920D1B5C97FF2341FA2FBC573B615141689DA42AC2FE2341136B65B321615141162AD4409CFD23413F223A49FE6051411BBB30C2A8FD2341C011968EFC6051416C507DA397FD2341D3061776FA6051412A9679D686FD2341165A533EF6605141CB6A4C1C82FD23416C86BEE9F460514105A1D921E5FD234174AC6B21EF6051412000458ADBFD2341B3A1BB38EC60514129296D06C9FD234184056201ED60514132BC12F6C2FD2341A5BC3010EB6051415E79B12027FE234128BBC0A5E4605141E31D23991FFE2341218C81DED860514168998E9511FE234179CA20ADD96051416C8C49281BFE234108D036F2E1605141208E245F16FE234142E3631BE4605141C1D035F0CBFD234182020E5EE8605141F71FE1ED8FFD23412A1E83ADD9605141AEE6E51BE5FD234152BE3803D560514182E01224E0FD2341029A783FD3605141DFF5FB8CBCFD2341B358069DD5605141738410CA9DFD2341AE245DE7CC60514120E9461FE3FD2341DAC22F70C86051411572EE0EDDFD2341D06DFE7EC660514198C24A1A52FD234151E5BCCDCF605141091D14472BFD23417CA9B90AC6605141A00C07C689FD2341DDCB5A7EBD605141398EE65EC7FD2341218CA4E0AC6051412738DCC74EFD2341BDC83EF2A46051417666AF4244FD23410E157BA8A660514168AA6A807DFD2341F3103EF6AA605141141FDA1855FD2341BAE89187B760514193A2E6E721FD234156D02956BC6051416D3570020EFD2341AF48CCD4B86051410C565AD7EEFC2341D8290A7BB7605141F4043E6FD4FC2341A4A6BE85B7605141B672CF05C2FC2341AD90097EB8605141CFB62716C8FC2341A6273B6FBA605141C581F363D6FC2341B56E3840B9605141B67314A4DCFC2341AA8E61A1BA605141F73F2A0C9DFC2341B97F425AC1605141C86674CC66FC2341E9EB7326BC60514180576EA09BFC234121489A31BB60514184C5B2D299FC23415C5F36D7B860514163EFB44840FC2341694E173EB9605141D8BFAC7D3BFC2341DB3456B5A66051411CC77F46B1FC2341900FC0F9AE6051418A56694BB7FC23416A848A3DAD6051417AA4E37935FC2341D37995F4A3605141B8BE685A35FC2341AE599ED5A26051412196F7B45AFC23418E7D17A89A60514117DCD7BBE5FC2341DAD2485CA4605141D2AB9C5AFBFC23416802092FA0605141588740BB3AFD234106AE12C59B605141BCE764CDA8FD23412D76267281605141A41F8CEEA3FD2341824090C377605141042E51C859FD23413297588B7360514142AE13874BFD2341C0F1CBEA7360514170173AF11BFD234162E5B8D670605141E937BBC329FD2341F1F75FC96E605141C4BB260055FD23418B70D7EB6A60514186A60A3024FE23414989056D85605141F630666782FE2341076292DE80605141CBF7CACBB80024416E3257B5656051414B4194DA80022441914A679D506051413895197479022441EC779A0F4E60514152DE0B786B0224415D89581F4D60514148B5C1898C012441E3A172F85660514164E93F16800124416C6E48B259605141570CEFD670012441FA2DEF135A605141E411A588530124417DE5CE96576051412675F33C36012441F94E32B7586051413B664C53010124414AE8948847605141BDE61FC9EE0024410727269345605141027A4430E7002441D334DDF73F6051418A2D7088D7002441319BFC1D3B6051410457D423CB002441FBBF5B0E346051416DE59DB6AA002441244FD73D29605141562367747400244148ECCD201A605141B9A3E282BD00244199737FCB06605141C0B45B93E2002441C832184A056051419DDA5DE9EB0024417426575702605141A821CC61040124417F287D8101605141B9C45D414C0124410D2FCBD2FF5F5141428756758A0124412D57D8C9FD5F514140490D86D2012441795795A5036051414287482EB601244187776B99FC5F5141DCF9849ECD012441B9DE21E7F95F51417C090D924A022441397C9404F55F514138418AB9D8022441F338DA7AF15F5141FCF1579C440324415E90B5CAF15F514147FDE414DC042441B85CFE7DF55F514112CCAAA5D20524418AA68697F85F51411B2CEF5B0C0624418586CF710060514149E0A9731A062441C50E77600360514139513C48F6052441E457C67E06605141D31368F8F4052441F0823CA008605141C8178C483E052441AE142136096051412A699F743C05244184E35F690A6051410D30B0E123062441A4393F9709605141063F45DA2306244152FDD0A111605141A181B04836062441A257D998116051418AF9FFF4340624411BC30C4E0E60514179590C215C062441A9B034E70D6051411CA8F60C5C062441BC18A27510605141F225ED19460624419E5C9D241360514125E8F97B23062441E4A2A19014605141F56F42A2D8052441D8A0EE4516605141DD9439F58A0524410111ED6117605141392A258C390524418EE123271760514192ABEDCCEE042441B1F9C8571F60514157D60E7ED804244120D6644722605141D5D07546C10424410EB48779246051410754DBC49B0424418AC73BFB266051418181753C6B04244144C2C1962760514116A463315D04244132373F242A6051410D2CFD865D042441CC0F40712D6051418AA1FB4E620424414D3207C52F60514164438B6873042441E67D34EE3060514107D2E9567904244176AE9F6E346051415BD521B61804244187DD51223960514106C77A3A09042441E8A68EE33A605141AEE7502165032441DAE30AEB426051415773E5CE690324416E7F2D0F456051412E9731E1E1032441772AF2773F605141E51BAB4A0905244147D1827031605141D2435D3501052441495ED8732F6051415FADD84EC40424416E8A860932605141CA14C5A2B1042441E96653A33160514124F334D190042441AD01F99A3360514163A99B3489042441CC0322DF2E6051414E0A628AA004244123E533FD2B60514164299FD21E052441F1DC7FE8256051418A4D43EC770524410191FE0422605141A905A737A5052441DC4C9711206051414FF90913B305244119DCD45F24605141B9B70E83B305244118F079DC27605141A00F1B58C10524416B27A56C2960514180F441EBC50524419F8F22612B605141D306AB9DD8052441F6EF67852E6051416B9E40EAE6052441EEB158D33160514194AAB6C71406244133FA0D193860514117F167A61D06244111B0EDFF3F6051413CB647D9260624414F295A1943605141FE6EED642B06244108D4B6CC466051417E405A2B46062441D012E51E4A6051416BAA53975206244113FFEF2349605141298804E763062441891D277B4C605141440D5D6262062441C8E7533D4E605141470EF5BDA9062441E424CD37586051415477FC12CC0624419EF1EBFA58605141BB7F782AEA062441B09E8D165B6051415826E59FF9062441B31FF1E25C605141D86C0414090724413FD193E05C60514132F80CA52E0724419DA936C46960514162DB19243B072441B53E770371605141352B6BED45072441AA832BC678605141DC50A5E02C0724414BAFCC5C7A605141807FEC3128072441D72C9CB57C605141565AB8454407244131DC839480605141DA5C4C5B5D072441D130C40D7F605141CA7BB5EA5B072441B4A183417E6051415537A9FB7F072441D5348EF37A605141CBA0103B22072441D8B4E52D55605141ACF8440794062441F3CEFD601C605141E3C861EB8D062441A96E062B0A605141D8818491B1062441B71C719B0A6051419B616A45B6062441A306A57D0F60514115DD762CD1062441F944D8710F605141D05980C6D2062441BB21FFEF0C605141309DF84D14072441432F024E0D605141CD9BFD6E12072441D030F3B61D6051418CA1BF86F3062441C802ADBB1D60514190D1AAE7F106244185F9344E1F60514143B6631F2A0724419FF356111F605141660FB2DC2907244158EBDAB21D6051414C233D031F07244152CAD5EA1D6051417408F24422072441A0C9F24E0D6051417254EFB3870724416EAC1BAD0D605141F21D309084072441740AD00111605141E25057A56B072441619D350911605141A43C6A546207244143EE45EB146051416E122B1CC3072441737C5EE31560514104B4DDAFC4072441EFE473A3106051412CCECBA1AB0724410B43536B10605141CA25E58EAB072441EE87CF7C0E605141D2B4CB8E01082441A22CA6CC0F6051416A21323BED072441DB072DCC236051414A6EC080250824410576818E24605141CB5474D67C092441E32E4A4E2B6051418C511510260A24416FC887FF4B605141D80FB307310A24411B05C2174B605141363C1F81970924410D8C12A22C605141EA1A16649D0924417CBD19752C605141D4EE6C198E09244146EA5D2929605141A0CD64E9BC0924413AFBCA732560514145D37AA8580A24412AAE7D8542605141F57CF607670A24416CEEEFC147605141114D199B710A2441065798564D6051418A42031B6D0A244161E54E9C53605141402A6BB5600A244129AC545557605141972EBB7D490A2441DC20C73B53605141E2410A76300A2441EC5AB8C15560514114395424300A2441220CFAE057605141232172FEF70924412DA14C895E605141BC9B2E2A0E0A2441A173DBA561605141E446162486092441A8782D0972605141A5AE2FF8AC092441F6AD344F7760514178C13CDCFC082441BC42DAD88B6051415413A0973609244136346EA294605141EB4EC6642D0A2441EAC39EB078605141FE444629490A2441315A97007C60514174385191D70A24410023336F6B6051414BB8E950490B2441DDDC0BB77B605141E74388ABD20B24410F34F1188E60514171075A3E9A0B2441B421D60A9F60514128B60C5A220B24414E0DEA0BAD605141DFDA56E6310A2441A41DC8BFC860514183C60E91CA092441302AC33DD4605141763975A4AE0924419FA8A40AD66051410ABC6C608F092441AEE40050D6605141A3BE5D47300824414D12C70BD8605141F9C102ECD5062441F007B13CDA605141B86E1E7CCF0624413C5A916BD96051410EEE5818BE062441BFB3C8A2D8605141818E479AA8062441E87B0972D96051410E66D69B92062441B02EA373D8605141ECA0AD138306244198C86E04DB605141927B7D2F810624414A80ABE6DD605141996736F490062441EB61FC41E060514173AAE986B3062441D53E4474E160514198484CCC6E0724411CCC9B24E06051415CB4D2A2580824412F3F222DDF605141CACD8AA07308244124576730E06051417CBAFCEEA9082441C4DE6FE6E1605141376762BBFF0824410833B6A5E46051417E4A1BFEFF082441BA073204E6605141346132CB23092441120EB0D4E5605141752F52BD23092441B7817DD5E4605141C01D0C3D73092441DF502A03E7605141E2A873688F092441EBCF9B2B3A6151413049F8B1B90924415CE3A9FD396151419F7E60A3B6092441E6310147366151412AEDE38EA5092441CF57270D36615141140B2AF39509244138015B6C0C615141FE2034F78D092441E6399470F1605141B60AA35AFB092441985BA6DDF06051417681E089C70A2441C24030E7D96051414146AF47B80B2441D4E2EED2BD6051418B0E5A0C030D244110AE9F33BD605141F56921C2070D24414B81EC7BD06051414383C2BB120D244132A998F101615141AC3524AA1D0D2441FF11E4B92F6151419822EADCE00B2441E8048D51546151415DE28A69390A24417122CE9D85615141C0072B9A280A244115CB401484615141E4225CF8130A24419A5F897086615141E6BEA1671D0A2441E7015E2A886151415417E162C1092441DBC9C896886151419DB2EF05BB092441C7B92A5472615141FA811D8CAE092441998FEE4F726151419983402EB30924411F98AF2688615141050A6C7F950924413B0595468B615141FFA1BFD58A0924413CBE89EE8A6151416309E1FE0809244182F6FE7E8B615141A42A212DF8082441588DA1A38C6151416F8D52C6950824419BFC1F3E8D615141980A4F28940824415139B7538A615141ADCE0573760824417E348BB58A615141506EA8BE740824414ECEBF078D6151419F2509E353082441FA5CC7208D615141E48202A40F0824419FEEE5278E61514156475F4CCC072441197CBC1D8E6151414CCFF95D0F062441C5B6D699906151413012B373A5052441AF3F1625916151411DC2C428A2052441B23802CE8E6151410BA4246E6B05244128F49A078F61514149CCA0EE6905244169B319B991615141F9758B64D203244167A106329461514148C8C4D8CD0324417E4BA97E90615141D6DAD7BE6E0224416BBB883A92615141F26B017DC101244188816A67B0615141A495339A15012441AF6FCE40CF6151414847D167FC002441DB152046D3615141676F9579CF002441642BB2C7D661514172C00B30A0FE23413C9FA88DF761514106BF466EFFFD234103ECCD1C016251410FCDDBABF7FD2341F934A1CFFE615141221F3344E8FD2341B10A7202FE615141B2699D7DD5FD2341E80A9D6CFD61514122E56E98B7FD234145F27A5EFE61514177E6795AA8FD2341AD33E78E00625141DFF6DECBACFD23413EFEA11204625141F6F17DD3D0FD234106D1707D0B6251411D7DDCAF55FF2341CD9D57ECF3615141AB621DEB3D00244194237010E7615141EEA6112E4F002441619B7EEBE4615141BE572258170124419EB7E695D9615141FB75B60E65012441A0BB10C1CD61514158292A9F8A012441DE5D94C1C76151411C1917F69B0124413452340EC3615141ACC0C4AD3C022441BD4A138CA661514178A6BE916B02244181800748A0615141244CBF8CB10224419E16D22F9B61514150D57F82EE02244188450F689B6151413ED0918381032441A05FC6519A615141BB3321BCDB03244118C8BA5999615141A6A8F53F46042441CBDC05FD98615141B1837A3E2B0524413CF4B26097615141E7A63EE3310524416DC11B91986151414336D2CA55052441EEF83B9198615141E314437B65052441396E462F9761514132666C578F0524417A0E302297615141347AB383CF052441908A3BF495615141D44D62429A062441766B77919561514136E39169300724411121FBC394615141D4516997D50724412B8CFC149461514145640BCA0D0824415CCBC4E8926151411676999ABC08244118BC238492615141ACDE0D49BB09244156E1595E916151418453D20C220A24411EA84D8A90615141BC1F4288620A24418C5A47EB8F6151419393AAFE7B0A2441A71736138F615141023B9AF49E0A24412626FC458E615141D3C6B609AD0A24411FBF1F978D615141547AA1D9BC0A2441967120548D61514109BDC232EA0A24415A7AE55F8C61514170A1C11B1F0B244116945BAB8A615141DF1032482A0B2441CD93DD228A615141A9A305986B0B2441D2980C8486615141D83460DD820B2441E3D71951856151419D1E2C18B40B2441C629FC44836151416725EEC2E10B2441A3E17F31806151419EDF8AF00D0C2441295851217D6151416A062A88470C244126F9F8137961514122AF35307D0C24412153511F75615141A085A55DAD0C24416FC9754770615141618155B8C40C24410F3FD7546E615141A8BC2727F50C24419376B70C696151411D576CD35B0D2441397E3C925A615141BEC21B4F7C0D24414845964D556151416F6680ADA80D2441840973304D61514198FBFE77C00D2441B666C96E48615141A89EC4D2CD0D24410526AEA344615141C2905A5CE60D244196BAE6A13D615141DDC61135EE0D2441B8A975B23A6151411EF5EEA3060E24413A1D5C352D6151411FEB2E600B0E24414016129025615141BD9CEF1D0C0E2441FF9F3481216151416388FC07140E2441A003D9651861514173360C5C140E24417E7169981361514185B443E4110E24418DFFCD720C615141024AAD57160E2441719FA6FC06615141D826F0B3110E244150137A6B00615141E8F660C3120E2441AEB75B3DFA605141BAC09E1A140E24413D04095DF6605141B2025EF5100E24412B754E97F16051410CABD4C5110E2441EC01462BE96051417426A5CA110E244186E6E8CEE3605141776FEF7E0F0E2441AA0FB5F8DC605141463395D0090E2441D9B04939D7605141FEBE400A0A0E2441ADAA353CD26051416413CDCE0F0E244171625973CC605141E460FA950F0E2441D9BCD1A7C66051413048D9A60E0E2441FE65492CC360514185D792020B0E24416AADA867BE605141CEC5887C050E244116D813D7B9605141C53E8C70FE0D24415400EB39B56051413A2EEA46F80D24419B652A9CAE60514149327EEFF40D244164C7A514AD60514106E8C5FFEE0D24418CBD7EC5A7605141DEFB5A90EB0D2441E5072760A360514116938BCCE90D2441D1D5BA989C6051416B4AA41DE50D2441D233DBA598605141468A5DD3E00D24415C303D8294605141C90C9055DC0D2441509F15CE91605141BA7EF6F2CA0D24419F195F888C605141D0251210BD0D24416CC903F9896051416457234AED0D2441F441A05184605141DE8B7F52010E24411C2AD0C6816051414C77C3BE1A0E244185FB20107F6051411FB19158280E24417E39F1827D6051414F29C8A1180E2441D6C9D3267C60514129DCF6F0FD0D24416180AA607E6051410C346960DC0D244117686D98826051418E576777CC0D2441C6F2857A84605141F695D209AD0D2441BE064BC28160514164767208AF0D24413A22B50F7F60514107C9B6ECAE0D2441520951117D605141306282D6B10D2441B9EB046E786051414CACB0EBB10D24413E44AB6271605141EF29CC50AF0D2441FEA989FD6960514141EE6871AF0D24418DA1909F6660514100653884AD0D244110DD3B266360514152CEF1D6B10D2441CE3F60C25A60514106C0FED4AE0D244192932B3C566051415FF838FA9F0D244190086621506051413DD0B503970D2441832367A84B6051414626D9BA8A0D2441C4F833974660514104DB8802830D24414C69FDDC3F605141DA1F3DB8800D2441DCE888D53A6051413677E0597E0D244108F37F5C386051414D0845FF7B0D244164F70704356051418571596B7E0D2441864D95303260514113EF5AFE820D24417B6D63D92D605141B7F08EEA8D0D2441877E3D4429605141D1600AFF980D2441A32EEEDD25605141F66E99C3A60D244184F066D1226051413F4ADC78BE0D24411A926CCF1E6051415BFCB4BDCE0D244108E0B4AC1C605141030D0CBCE00D244181E71A2719605141D8A94632000E24417A3B8BA315605141D953F6AF440E24417736B48E10605141FC2C2E7A740E244180A35EB60D605141D20DFBDA950E2441E714A50E0A60514131220AAFB00E24411BDA55140860514190624F8CD60E2441459E045205605141E9E1CD8CFC0E2441EB7B39CF02605141DB97BF0C2E0F24414C1F7173FF5F5141D08826E93F0F24415F0C117DFD5F5141A2AB3082540F24410DADEB10FB5F514162FA7912670F24410BE0BA78F95F51418003E216870F2441254C03C2F85F51413E71DAADA60F24410A89282CF85F514109200815C60F2441C2145526F85F51410CB2A2ADF20F2441200280A3F75F514114EC297D35102441CC2DEC9EF75F514171CA079D401024413E8AFDE5F75F51410F225F1AF81024416026ECDDF75F51412F007A6A0C1124418CD1E8A0F75F5141ADE68C482911244114AD64A1F65F51417EB92439751124415BC0CB4AF35F5141826D6E04C81124417209F806ED5F5141E0E18530001224417DE3BB1CE95F5141F6A3EC0E2A1224412C0F7F61E65F514157431A39461224415619CC03E55F514134DEEA655C122441CC3F6DA3E35F51418CE78AA17E122441CD1DFCB9DF5F51417C8DAC0BA1122441CB6DC571D95F5141BEB4BF12B5122441D5763918D55F514168CC1E5CBE122441C9F00AF5D25F5141B85AB79FCC12244177FD6BE7CF5F514158F7A379DA122441D7523B1BCC5F514154B9CB20E1122441356A769DCA5F51419CA9222CDF122441259400E3C85F5141DC4F7BB8DA1224416C337A0DC85F5141AE7386FCD412244159128A9AC75F5141F9B74B24CE122441719797D9C75F5141184A8E33C6122441864134EBC75F51411A5A3884BE1224419FC48C8CC75F5141A3886BF1AD122441CC0A14EFCA5F514143050ECCBA1224417F7B02A2CB5F51412DE6D7967B122441A940E823DB5F51418C0A45A1B9112441EE27F8A9E85F51415B4575C786112441D9A59248EC5F514191B7BE9F8B1124410CD45AEDEC5F5141554206386B11244144388FA3EF5F51410C934535581124414D4A4C6DF05F5141489CE3303811244153B10324F15F5141D1C38EC312112441C9B84917F15F5141CB978ADBCE102441E88F6CEEF05F5141723D3D568C1024416A7D9D92F05F5141AD6795338B102441A165B660EB5F5141023E20439410244189E5C314EB5F5141CE5C20BD9410244198E25924EA5F5141CF218C794210244176204A2BEA5F5141F87350784010244105136140E95F5141DD65D8210F102441B415124EE95F5141FFD30B031010244186CA67CAEB5F5141916A50A6FD0F24411C5522F3EB5F5141E693D5ADFD0F244197C94434EA5F51411F1831B1F20F24412E59B92CEA5F514125536E33F20F2441B03292FCEB5F51418C5DA9E4970F24416EB67AE5EB5F5141DF86D3A3980F2441697E5DA5E95F5141C58438B4330F2441D39D1A46E95F51414F9D42CF320F2441008833A9E75F51413F72F76C190F244137FCD4F2E55F514136AC0BEB090F2441FDD1FFF5E45F5141E002FF00A40E2441DD98D46DDD5F5141F0E59D8E9F0E244199270D67DE5F51419BED87FF690E2441C300E370DA5F51419AD498004D0E24417BB80537D25F5141C1290A16470E2441A01F2FD7CD5F5141642E2EF7430E24418C85D783C55F514184A808EF630E24412BFDAD9CC55F51410BC184AC5F0E2441D60C8C51CC5F5141320F3893880E2441E72B9256CC5F514156EF6BE9870E244125BA03D7CD5F5141BA5F2F49C20E2441E89B27E5CD5F51416A104B36C20E2441A956A5F6CB5F51411CB85700990E2441AFA8B162CB5F5141F7C3F6B7970E2441FB529B79C55F514146BB18F8DB0E244144F34841C65F514178059E93FA0E24416D58CD96CF5F514121663595090F2441243BFDC5CE5F5141BC015C9DE30E244154E44FC1C45F5141647A5EDAA00E2441EDDB54F6C35F5141C96E6E659C0E244177CD0E52C15F5141AE6EC145A80E2441A558C227C15F5141242E7707A70E24414AD64C1DBD5F514167163B62DF0E24417EC1F61FBD5F5141F28FC542DF0E24419ADF0101BC5F5141E4095CAFA80E244146BCA79ABB5F51411FED374DA80E244149E5371DB95F5141B2EB07BCC30E2441A1953320B95F5141F52F2B91C50E24419BAD0870B35F5141581A37A5A80E24415B495A70B35F5141FFCB8EB0A60E2441FBACE3B5B15F51412937C3605F0E2441390E7CB4B15F5141FA79ABFE5C0E2441F331E21AB05F51418983F670650E2441FB9EFD59AD5F51414B244D05CB0E244179A7D4FDA45F5141DC33912BD00E2441857BCB62A45F5141C40F3692EC0E2441D1BC30F1A75F514129BDBB21E70E2441A5B99CECA85F51415E496B23F20E244180D378E3A95F5141BD646554F60E2441E2B9845AA95F51417EA0CF9C140F24413237DEB4AC5F514140124BA80C0F2441DE9FE9A5AD5F51419A87DF53140F2441933400E4AE5F5141352DA0C31E0F2441BADD73EDAD5F51419E72615E400F24413D8D01E0B15F5141F2166082390F24411CE67DFEB25F5141D6DFDD8C440F2441816C3B05B45F5141A94E008E4A0F244156A97828B35F51415CF300B1560F24413A1CA75CB45F5141C224FB00520F2441BDFFB4E6B45F5141624C37FD510F244164D123C6B55F5141C814FF195A0F24411CBBEE03B65F51416E8FC340660F24418F58AE58B65F5141C49821A0720F24417028482DB65F5141F9DB1542830F2441D1E0B098B55F5141855ABE3BEE0F2441204E6CC2C15F5141ED625B0FE10F2441FAE4BD2EC35F5141EC24E281DF0F2441C54F07E1C45F5141673677C8F80F2441DF7F0299C45F51417C447A84FC0F2441A2B6C8EFC55F514154BD9D05D30F24417BE8F68AC75F5141E2FBB762D30F24411C2D1619C95F51419E8484EEAA0F2441809183E2C95F5141DCDC3E36AB0F2441DDA74E30CC5F51417F896C99B50F24417C864F09CC5F5141AC830E78B60F2441292727E8CA5F5141B403F305E40F244115D33D53CA5F514172ECA3F3EA0F2441A25D30A0CF5F5141C6F803ABB90F24412BA212ADD05F5141E63A68FDBA0F2441A0D51C29D25F51419A313D33E80F2441876264F5D05F5141DB63A7AFEE0F24413C93F6F6D05F5141C2357FC2F00F244132ABA201D25F5141122F1B09E5102441C495C896CB5F514122ABD8DBE2102441FC1D785CCA5F5141A458822956102441D46DFED2CD5F5141DE3E609348102441166E1235C85F5141621F422350102441CD50C574C75F5141895798D05C102441C48C8D09C65F5141BCB8C3316C1024411718AF18C45F51410C76ED7471102441C8C51CFFC05F51418EC5AD9F711024410C50C57FBF5F514172A35F3FD31024410AF7A798BC5F51416BE9EB1AD11024410DF9386EBB5F5141FB1D9F646D10244150F2182ABE5F514180DC99EC65102441DA9F8C7CBB5F5141DA834F365F1024413530612CBA5F5141E9C3C13C57102441904E1C2EBA5F5141BB73C0C256102441A751861EBB5F5141FF62AB5D4D10244143CC5143BB5F51418AB5402041102441CF067FDFB95F5141F8E3A6A73810244176EE53E2B95F51419A7FC6122F10244125AA2697BA5F5141A586D608291024416AE00764BB5F5141FA1EE69B0E10244101EE697FBA5F5141E6ABD9DC0510244169DA3203BA5F5141B58EDE29F60F244147C9A5C7B75F5141FF51FD4E14102441CEFDCC96B45F514106BE825C0310244196C0B7CDB25F51410180D69AE10F2441990FBFC6B55F5141662A1A98CA0F244168AF7B0CB25F5141FB9BDA5FB60F24412ECFA4DBAE5F5141FA8ABD28A80F2441232C0BCEAA5F51412993D7FC9F0F2441785E4FC2A75F5141CE2220D29B0F2441DFC6A6BDA45F514156BFCE8E9A0F24419766E1C39F5F5141F7593FB89C0F2441BED6F4919B5F5141D62ABD3EA10F244183AA510A985F5141BB061257AA0F2441D6FB6AA8945F514160164E35BF0F2441CB9C93EC905F5141D6C78D68CF0F24414B5A1AAA8E5F5141E9EAC3B7F00F2441101FA0E28A5F5141B24E6878461024410E65E4A8835F5141BA3BA78B9110244110AE8AF67C5F5141593BF906CE10244144B392D3775F5141DC9DAF2DFB1024413597EBD1735F514154474B1D1C1124410D8A802A715F51411EB7CA3A3E112441D1D4DAF06D5F5141E0A4666B54112441925D0EB16B5F5141EC4F8A70CA112441EE5C9C81615F51418B47632ADB1124411C68D7CA635F51413AFEC3ACF11124418EBC75B7655F5141E11F10F70C12244172DF02D2665F51413524CC003C12244184A7E490675F514136C05A52461224410BFF224A675F514143A901B95E1224416F9E8854665F514106CC77C9771224417C637DDE635F5141A866C74A84122441A90EDF23625F5141DF5D4AE2871224415B99606C615F5141DE79186D911224419F69EED85E5F5141E2214B0899122441214F567A5B5F5141224C45239C1224412AABC415585F5141BEA56DB19B12244119B4DB08555F514131D50ED2BD1224417A0E3E2E535F514175DFF718E4122441C979822A515F5141F0F23E580E132441B6D0F81D4F5F5141EB3E87CE19142441EB5A43F4415F51410CB49748AB1424417AC9E0853A5F514169C031F837152441D1F2E771335F5141D03957D7EB152441B520AD172B5F5141266A64F6FD15244108CBC97F2A5F51411DD4FAC6081624418CB2EE372A5F514181D8BF93151624415B90ACEB295F51417BF4A54F1D162441C7A8C77A295F5141772D4B9A2616244176645826295F514133F3F6DA2B1624419F4AF4BA285F5141DDD46AE33B16244126A7D3F7275F51412A07A90E431624414B9B4568275F51418DB85B304F1624413AF8B5CD265F514127B623F8591624419170F975265F514166E5C5FC6B16244166CA71AE255F514103DE483481162441E4322A60245F51418A211DFA8E162441FB016522235F514117B848B0991624415C97E5AA225F5141BE649F67A81624417E90793A225F51412DB990A2B016244194F27AC8215F5141BFBB7613BF162441384D03D9205F51416A3D9635D416244138FB664A205F51418EAC5090E9162441CC4AA53B1F5F51415C5BAA42F6162441DFDFBEBF1E5F51417EB5F3ECFD1624419022172F1E5F5141CE25684D101724410E06F0261D5F51415B3593031B172441EDA670AF1C5F51412B0D651E2517244123B91D791C5F5141A7506C2B2D17244186EC6E271C5F514164A06A3D381724419D00506F1B5F51415ABD59203E1724410A0458421B5F5141EB4B0B424A172441FB7CC8A71A5F5141C824C201501724419EB44A3B1A5F5141D6482CD1561724415D4F5CEC195F51417A151D0C5F17244132BF5D7A195F514166F84EB865172441F38EE9EB185F5141D44685ED7017244109765073185F51411FDF2C337817244154DE6613185F5141B588809284172441A78101E8175F51419F1EAB488F172441B22C8270175F5141B82E75C09E172441CF98B88E165F5141DCA6F292A81724411F211149165F514190838E59AF172441604E41EA155F51414F553001BD1724418901465C155F514192214D95CB172441684E54AC145F5141E04FD7F3DE17244171D3F9A1135F5141F486F33CF417244190727573125F51412E4B9A7A0F1824415806BC37115F514145BA3DC5181824419BE54CE3105F51415CEF2D00211824418D644E71105F5141B1FB8B5027182441BDCC7923105F5141A8C012C1451824417B9700610E5F514154CA0C234C182441E6E4EE320E5F514130315FF451182441D51034E60D5F514162497054591824415DDCEEB50D5F514156DD61E7631824417CD5E9FE0C5F5141D074F9B26C182441037C94AB0C5F5141B2DA8E2B901824410FB4DCFD0A5F514194B46D56A7182441CF214D9B095F51412894DB9FAE182441B6B2F55B085F514129588128C31824418916CF9E075F51415CD4A598D61824410AAD37B4065F514190926146EC1824410A70F554055F51412102E4DF051924413BA771BC045F5141F704C91C26192441A1669885035F5141D0CE84FC2D1924416814983B045F5141B0FA6F303A192441993A2AA8045F5141C896753D421924410B8F7B56045F5141743AF8674D192441DD1EB83D045F514188FFA53157192441A7512FE8035F514188E6F9335F192441CB2556F6035F51416B9F90FF67192441ABDA00A3035F514115D1E559721924411E2D216C035F514128DA198F7D192441AF4088F3025F5141FF77B05A8619244136F732A0025F51411004113491192441728A3968025F5141487B22EC9A19244124E2EDF2015F51416B878FA9CC192441180E5806FF5E5141E86FAEDCFB192441F5635551F95E5141A92A021D2C1A2441DB50681CF05E5141C21B5023601A244117988368F05E5141AD34B2DD8C1A244140207C56EE5E51418F834428CE1A24412B0473C8E95E51411324CCA7EE1A2441C76613F0E95E514188C164183D1B2441A4E75383E75E5141EE8C67B0791B24413081822DE65E51410E968A6FB21B2441CEB5CEB3DF5E51419CF1F9C7D61B244106E8ADB3DE5E51413F1DCF2D0D1C24419DC7E7FBDC5E5141E509A2044C1C2441FDA22800DD5E514162482CCA631C2441D005E19ADD5E51417B27D11E881C2441DDDA2D7ADD5E51410D6225EAB31C244121774738DE5E514197E4E749E01C2441EC969C35DE5E51417CBF5171021D2441FF629ADADC5E514198899A25251D24411ECDAE7DDC5E5141E0105B0C421D24416D4F108EDB5E51418395907A881D24413BBF2A13D95E5141274E2BA3AC1D2441389210A3D85E514117D536F3D71D2441AC6BD682D85E5141D81F25F42E1E24411F8F11F1D85E5141B0136A8B6C1E24416469C967D95E5141614E9A0BA31E244142E7A7DFD75E5141344CBA5FC21E2441ACAD58EBD55E51411720F8F7F21E24413844E0A0D35E51410F82BDFB0B1F24411D6965FAD15E514140B3DA924F1F2441747CA0C5CF5E514156CB5425531F2441F477D41ECE5E514165F083FD721F2441606FBA18CD5E5141AE9A08827C1F2441F69641C7C75E51419A06374CA41F24419DA1A632C25E51410AEB76DBDC1F2441488AFC48BC5E5141EE5FF3222E202441A74F1F96B95E5141AD3ED16281202441807848BEB75E5141E4F0F2CFEB202441B5565B21B85E514134EDB9703B212441DB01DCBFB85E5141513FF811902124414A2DF831BB5E5141DFA70DB2E02124411CAF009DBD5E51412C1296F60F2224411CFB6553BE5E514196608D6D3B22244193994493BD5E51419CAC4FB158222441D1FAC231BE5E5141F522B34F74222441DAA8BAA4BD5E514182B9EB19DD222441BF001E2EBA5E5141BA740AAA1F232441146BACEBB75E5141FC60135A3923244112D53A62B85E5141B2DBA0C3542324414A5FEA75B75E514134A998145C23244174A3BA77B45E514119B150B36B232441B7200BF6B25E514142423C4C97232441C645B4A6B05E5141EC34217DB423244135C3B456AF5E5141C6B89D05F9232441668949EFAD5E5141F1ABDB3B21242441A8FDB7B6AC5E5141512C401149242441957677CFAA5E5141983CB23A90242441255AE9F3A65E51416287EA4CA824244125CA1780A45E51411ACBF2EEDE2424417390C268A15E5141971738AF13252441D37A78859E5E5141D9D5371A8325244130AF13D3965E5141727099AFBB25244104B676A7935E5141EEFBC890E8252441D48B8BF5905E51412FDDDF561626244175A783E08F5E514159A2860B2726244184B96C3A915E51415A9DD96E55262441258382748F5E5141EE232BFA5F262441E236587C905E5141F265D5E57C2624414134097C905E514164999CD79F2624411C1D488E905E5141547AF4C3BB2624419EF971C18E5E5141E852680226272441B6C00DEC845E514148F3F93C662724411C547D40805E51410AA681ED99272441D259A53F7D5E514188AEFE9FCA272441AF5DD4247B5E51416EA164E7412824417E863BEF755E514132CA7DBD79282441401CB703755E5141657104E49E28244103FD6A91745E5141B6714C46C32824417F19E86F755E51410810B65BEB2824414BD94695775E5141F2465CC422292441C6CE9ECA765E5141FD96AA2554292441C4C2AE1E745E5141760714167B2924413B5B8D9A705E514178977547F12924414CE85E89685E514170E9C1F6222A2441D75AA19D645E51416406C524372A2441E4FD3BA45F5E514136980A2C582A2441FE0B0B8F595E5141143232366B2A244163287A06575E5141F45EE839822A24410D64D543565E514195E1CFFE962A24410DAD2027545E5141F69A30F5DC2A244194AA82EE4F5E514128763993EB2A24413B4A2E1D515E5141FBFA5285022B2441B2F6C63A505E51410D2F587F0F2B2441C83D0DC14B5E51415EA42329642B2441EBB671F7475E514179E370CD9C2B24414F94C099475E5141154B3CA3F12B244164EF8B1F445E5141432E2D88592C244134AF140C3F5E5141812DBD48932C2441AE2968FC3D5E5141AD5B890CB52C24410BE0E0A03E5E51419219FBD5AD2C24418841B1CE415E514158359E6FA62C2441B22A878C455E5141BA055FD2B82C2441F06AD621485E514168AA0C1FE32C2441FE508414475E5141AF7858EAE22C24416E46A469405E51415AC8E2F7EE2C2441598CE1113C5E5141C33877C8322D2441830CB82B3B5E51413C5C8F50402D2441BFA8CD7E395E5141AD72B39E772D2441002F8384385E5141CD59658EB02D244111092A95395E5141A0908F2EDE2D2441AF2CC4EE3A5E5141ABDEE649D32D2441AB5C00C53D5E514176CF810A1C2E244160AC6661405E51415DC1AA774C2E2441BCB146963F5E51413024E2DA542E244189E584073A5E514184F65697702E2441FF5EB6CA385E514154CE30267F2E2441CD2D11773D5E5141A5221F95D82E2441E44559AF3E5E51410E68FDB62A2F2441326DCABA3B5E514149BFE379422F2441E9BF10B8385E5141E4AEDC12402F244138282F2F365E514162F7A75A512F244157779BF9345E51415C9193BD722F24415ACB65EF345E51414A3E66AC772F2441D8403CA3365E514193099B82922F24410ED76946385E51417EA9A3BAA02F24418509B0223E5E51419A50E25EAF2F24413405610F425E5141365D91B4F72F2441B7457E1E425E51414750B067233024413DB6CFFE3F5E51411D74BD13673024413647680A3D5E5141E573E1F666302441DFFB523D395E51411D5C93878D302441EF613FD9365E5141D2CF2259AF3024419905E67C385E51410112BE1FC53024417F4B29CA3B5E5141025FA10215312441915421C73D5E514142EC95EB59312441583D680E3D5E5141D4A78A16A231244117844251385E5141EC9F8276D13124418D9F6FBA345E51418B8AAF44E73124414F59DB48365E51415A5002AEEF312441BDC7B5C3395E514104D3BB711132244144F92D683A5E514182D7733522322441EE6D6744385E5141F0EEEBA759322441B0985A58395E514166A7D5F187322441E8278831395E51413EF5BDA493322441860C1FE9365E51417923817FA9322441C95F00A8375E5141B87409C6A5322441DF49AFEE395E5141ECC352DAE932244194CEB3353C5E51417EEBD477F5322441FDB6F3AC3A5E5141B05E264D173324419C522E713B5E514142429C211A33244145A332D93D5E5141CE5AE31A4A332441482B7EBC405E51411279748E743324415934460F3F5E5141DC9CA33FC5332441A34E7B4E3B5E514151522B2CB333244128661948395E51419496B70AB83324415CF1505F365E51410C11169ABA332441AA646FCB335E5141FD1B32F4D933244115932A95345E5141D4F00D6AF9332441030BAE11315E51414B1B5BF0F0332441C0DEC9452F5E5141ABF7B391FA33244103D970C12D5E5141812E131E0934244153DB58D02E5E514162912FA629342441763048BC285E5141E8081E6E2E3424413BC470C4245E5141C55EDF7B56342441B121115D225E514119E14FAC683424419E86F3E4215E5141A2593B0F77342441DEF751F61F5E5141637AD3BCAE342441BF43FEDB1D5E514186578CACBF342441C7BF9E071C5E51413BCDEA90BF342441B91743091A5E5141B30C5A759734244198A874711B5E5141D30C3428A5342441BB033A45185E5141C1465736C3342441CA766205145E5141E4EEB3F0E33424416B51BDFE105E51410E6922B7EE34244118E24AD80E5E51410A20B18DEE3424419377C1DA0B5E5141C295F8C4183524410DF78641055E51419FD4932532352441FB812A29055E51417EA7050554352441000B6C80015E514183494AC257352441859F525AFE5D5141B07E018B68352441F2AFD925FD5D514115FD12587E3524416F0FFB99F65D51417756C87278352441A1898229F35D51415D3E01B573352441B8D45FB4F25D5141B5C13032883524413F6BEC49EE5D5141D0D86CEEA93524413D67A961EA5D51410578FBA5AE35244119F7C718E85D51412C696BE2D23524410D0E511AE55D5141E671D41ED33524415927C2BAE35D51410E9502E4EE3524419498D68DE25D5141B8537B76F2352441FBD30EE7E05D514114264310203624415AF2A482DF5D5141E6F3DC0725362441328F5B46E15D5141C7A591A76D36244114E019F5E05D51415E53C1F0AF3624416E62A733DE5D51419A8877F1AE362441E54A2367DC5D5141A30FF4EAD8362441AE9253AADB5D51418F8C161CEA362441E084B265D95D51418E6FC198E83624411BD3FBAAD65D514140670D71FE36244101AF6ECCD35D51413038561A1E3724415DD91525D55D514166C25BA51B372441DE0D9AE8D75D51419353687A54372441CFA89DC9D85D5141886DFF2C663724411CBC5121DA5D5141A6A5ED3CC9372441903643D5D95D514130EA24A4C9372441FC8163F6D65D5141198BFB66BD3724415AD19492D55D5141FAFE9755DF37244196E22B6CCE5D51410A0452CBED3724417F37056CCE5D5141E13ED7D8F937244100064814CA5D514197DDC9F1EE3724411848124DC95D5141F67D0AF1063824411EBCCDEAC45D514166C0BFF240382441EC42E26AC35D51411A625C313C3824413B149A89BD5D514176FFB1AB453824417B3628A5BC5D5141CB94987744382441EA045D79BA5D5141EEAE076D543824410345C7C7B75D51415CBB04E75638244128AA8FF3B55D5141C9206A5D66382441ECA71343B35D514102EB37279F382441DF75C876B05D5141D667EAEAAF3824412C450453AE5D51415B0ED5F3C0382441A3E292DFAA5D51411CF8EF11E93824411AAA41C9A65D5141C8B4953118392441D3516D71A55D5141D8C4B8261F392441EED3E3B3A25D5141611E90223C392441D970A204A15D51418927AE113B392441A8615C189F5D5141AC50754B76392441D7584299985D5141EBB4C9E0913924410AB35CFC975D5141CC624E89B2392441B7AA87219B5D51413E07CF2FD83924415A10DC7C9C5D51416C54587F033A24415163A65C9C5D514158E229EC153A2441ECAFFB849A5D5141494D8928183A2441E5E69B41985D514114569DF53A3A244135B1A145965D51415504BAD9603A2441999A1E10985D5141C3107FE7843A2441E6956570975D5141A13ACB57D43A24412D586153925D5141D7DD6003E93A24418B95C4D5915D51415A68B3E9093B2441230F891E8F5D5141AFC7FAAA273B2441883838ED8D5D51413A051B5D363B244114C9838D8C5D514169227842403B24412D16C9EA875D5141FF1544B36C3B2441DA35E507885D5141B495E923683B2441F5CD957F8B5D5141F5274556993B2441C1C369328B5D5141240E7E96993B2441761471F3885D5141C337A76DCD3B244193C7BD52855D5141B1FA2281CE3B24414C35E290845D51412D2F122EAE3B2441C5FEA4B8845D5141610DD1E4B73B2441BBA1A574825D514156014894EA3B2441C6B92C24825D51419816AA51EA3B2441366CB8C5805D5141586309443B3C24413452B4947C5D51419BB0F87C643C2441223542497C5D5141F005A389A43C24417CE232CB7B5D51414485B0DCC43C2441813170A37B5D5141347A3D8BDE3C24417190494B7A5D5141B14DA862D93C24416650E248775D5141B265D707E13C2441451BF2C8755D5141BA008F27DD3C2441B599F663725D51419E86A583083D2441343C3874715D5141AEA2B970193D2441B026FC4D725D514173E907F41A3D2441640EB108755D51414537A87B303D2441D2A61218765D5141D9B34886753D244174BD2DD0735D5141B60677EF943D2441F749401C715D51418757E897AA3D2441A76ABACD6E5D514122B03802AC3D2441E2E0F4DB6C5D514106A2EE4B983D24413FB37C476D5D514192299327963D24413FF1121D6C5D514177B28926C53D244107CD9AD7675D5141F30992BAC23D2441D462715F645D51414CE31E59F43D2441C4F1B322625D51418BFB19ACF63D2441892A63EE605D5141564D836B113E2441A5088282615D51418FAE83460C3E2441233E3DEC635D5141319AC7E86C3E2441C00AE0A4645D5141909E0C18D03E24419DB9382C5F5D514120F9E85CCB3E24411102F6085C5D51412AA9F502EC3E2441B60FB4905B5D5141D8ADC5FCEB3E244152AAB2D2585D514172D310DFDF3E24418AA4D38D585D5141CEAD3881E43E2441EDAD9C04575D51412F7D1BAA253F2441892C94D4555D514167E04763223F2441B55B239E525D5141D7BF318F463F244168BBA44E515D5141C3DC42513F3F2441721DB7EF4F5D5141619A4DE0713F244116CA0E66465D5141DCB2D826A13F24413058576E445D5141D028B821A73F2441691599D3405D51417CCF39279B3F244139B83ECE405D514104EF9DE49A3F244192F6CA6F3F5D5141776A062FA83F244131B1BC533D5D51411ED94C15C93F24419984839C3A5D5141DFC86BE5EA3F2441D19D74713A5D514104CAD8E8F03F24415AE422323D5D5141D2789395054024412DA33C833E5D5141BC0996520B4024415369E1C4405D51418442419F3C40244185495AA7405D51416405EAC85A4024410179E3653E5D514193C2D71D7A402441B2D654403E5D514174BEACE08F402441689B73213C5D51414A134E5CA84024412A563A6C3A5D5141F46D967BCC4024419D3245EC395D51418A1F3997DF4024411F827E83375D514142CE5852F94024414219D05B355D51414436A469FA402441ECD68ABA335D5141B3B0CC652F412441675FC2772F5D5141877545F13741244107ADDC172B5D51412CDEA57534412441217E2582275D51414A7CE94A45412441E268267E255D51410223538F864124416335784C265D51418AADC47DA2412441EC29151D285D5141359CEA36DD412441CF96F11B265D5141826EDE54E9412441A6D94615205D5141BF5E05031C42244112911AF61D5D51412A4496B325422441CFB11CF4185D5141BC5539085A422441AEA828CF195D5141D6B8BE57614224414A47D84D1B5D51415088E63661422441AEF9BDAB1E5D5141FC2C2880754224415BE749FC215D514156973FB39F4224417BDC0F8E225D514124CA6958C54224413446AF1A225D5141B47C9187D7422441F6E2DED31F5D5141B016299FF442244111DB6FD7195D5141CBA35199174324410CD493F9195D5141C752F9762E43244140AE8DA51B5D51412E68B9B53043244157469AFF1C5D5141527666833F4324419912409E1D5D5141710712575643244108B2A36B1D5D51416D287A0B67432441266E8AC51E5D5141BB11183A8543244109BF5F731D5D514148D695A0A4432441D3C7936D1D5D51418FFE4816B1432441697A3E511E5D51413931D77EFA4324410D8F879E1D5D514103F8E4AA29442441271F2E771B5D5141820850313D4424412228AB9B1B5D514126E6926166442441D623D1F4145D51415C13D82777442441F2E3F122105D5141C00A8A217D4424413BD080B90A5D51413C6CBB20954424419FBC4357065D51419A95C18AC044244145C92B1B005D5141DE4CF04DBD442441C7B552C3FE5C5141AE8FF334DB44244166A76A23FB5C5141D2BD17D50045244157C4BFC0F95C51412E8C09B729452441BAD538A5FA5C51416263189751452441D2E74E6BFC5C5141DE3C8C6579452441039EA211FE5C51415DEAF31C8D4524418D6DD074FF5C5141BC3957D19D45244182FFB6CE005D51417F43E20CC145244159809980005D5141D20755E9D7452441FB85DE5D005D514100AE0BD7E945244121BC5087FE5C51414638E4A0F84524410B296005005D5141EA4FF649FC452441E29FA86DFF5C51417A7A9C6AF14524418EFF9FE7FC5C51410CBF750D134624415E9D779EFA5C5141E5199D8426462441CE769B40FE5C514129BCEC25304624417A6F46BCFC5C5141197409F117462441005300A5F85C514140C2FB0A484624411EE2DFDEF15C51416AF7561D474624415C0B2132F05C5141D7FA400B64462441A7C7B783ED5C51414BD8E3F4814624412884B235E75C5141197CFABB7A462441CB7C10C6E65C5141AC9ADA2294462441110B2F20E35C5141D1B380A6914624418AECFA56E15C51419D753038C746244113D12922DE5C514165105E53E04624410F3E7B59DF5C51416483A29B2C4724415EDD8870DE5C5141D1BB82BB3E472441E32A60A7DF5C5141831F53C08F47244156D7DB64DD5C5141B2D16B6AC84724416B1AAB79D95C5141BAC36A460D482441FE82FE44D35C51418284D72A0D4824410A0BA746D15C51413BEF5D582548244161E339D1D05C51410CBBB92D304824412CE3AC78D15C51412C80C3076348244142EAE8A8CF5C51410E5E38998D482441E90DF44BCD5C51412057BB659A48244106E8B5FFCC5C5141441C08D2B248244130A424C8CE5C5141E9C65715B4482441A7684676CD5C51415FBD01988F48244156127099CA5C51419F9F72778F4824417729CEABC75C51415B8D768383482441A584EC18C45C514134BF0389774824410AB29113C45C51417308BD3C64482441990420F2BE5C5141A60B0D5C4E482441C9193F75BB5C51416250F92735482441C3A37891B55C5141212319972B4824412F48DB66B55C5141559DFC1F1848244151BFB7C4B15C51419DF3F91D1D4824410F70E4FAAF5C51414D0AF92DD2472441552B906CA05C51416DBAFDE4964724418737FBB7955C51418475B4B6C3472441D1934138905C5141645089B2F2472441960875EC945C5141CA1BDC7FFC472441986186B7935C51419A8D0A640D48244113716981945C514164171431FB472441790CA1A7975C5141C23DCA0E534824413D664E409D5C5141E689B6ED5C4824419502222B9C5C5141600F2D4F94482441880A0CEE9E5C514137E3D7459E482441A266A0B6A05C5141A905502EC1482441388503B9A05C514135964596C94824413A7F2265A25C51411F0BCC79EA4824416F010B5CA25C5141E209A890F1482441E97ADC5AA45C5141588298502949244141CB0A2FA45C5141A2C5C96235492441E4512612A75C5141ADDDCA5369492441D566A4ECA95C51416B76F7377A492441432B87B6AA5C51419793B03D93492441C1C27FADAC5C51416CA9BD759F4924410C850222AD5C514180993082D449244121EB4E30A75C514106F8244A0D4A244101A5DEE0A85C514197794A472F4A2441B1BFEAD3AA5C514125C2B751414A24415DFF68CAAC5C51412F47A61E3A4A2441CF414964B55C51414EA9FDC7444A24416D9F56BCB55C5141D83A8E8A3C4A244144206EDCB85C51417E3DD1454C4A2441090ED227BB5C5141C16A25F8614A2441675EE5B7BA5C5141BBE6FCEB734A244131DF569FBB5C5141CF8626DF7D4A2441CAF1CFFBB75C51418E378239914A244169F3E7D0B75C514198E63C09924A24414DECE7E1B35C51411CEAF784B54A2441217DD654B15C51414E158BDCCE4A24410BFC9B2CB15C514122D18D95DA4A2441EB4838A2B15C5141450DA900F34A24411E47F39BB15C514159C8FBB2084B24418DB0062CB15C514192651E0C0B4B2441848BB5B5B25C5141AE6727C3194B2441B1CB4E45B25C5141A8B53B901A4B244153AA6B04B15C5141B89F8B773B4B244126B8EA1BB05C5141DA4A1684824B24412BC4A48DB05C5141E94A5257AE4B2441CC28A35BB15C5141CEE4A58AC14B2441F4E99FD0B15C51418FBD4D85014C24411047D332B15C51416D8C77E3144C2441E83A8228B05C51419E511A652F4C2441FAF4794DB05C5141B190BBDF4E4C244133F254B9AD5C5141B1B53841524C2441EBD5E1D3AA5C51411533E1DD894C2441116E8B68AA5C514189B8B3B3B74C244109FB9DA4A75C51411074B2D0E44C2441F58C3993A35C5141006FABCBE64C2441E7DC1FC0A15C5141840BD400FD4C24413DCEB06FA05C51416A94ADDE2B4D2441F69024889F5C5141FEE8841B2D4D2441370FCCC3A15C51418A054C1D4A4D244147C98DD2A25C514188B4B4316D4D2441A6265624A35C5141B284820D784D2441B5F1433EA05C514108794F548C4D244188A866F19F5C51411EE2683C974D24415A9F4E87A25C51419E50727B9E4D24414F83EDB4A55C514182FBA8AFAA4D24419501D908A75C5141ADD6E2E9BC4D2441BA03536FA85C5141B0B18AE7FD4D2441F1559DBEA85C5141FAC94DAF114E2441EF9ED972A85C5141392967761D4E2441AA331F9CA35C5141AB52E88E2F4E244102194646A05C51412B74EE1F6D4E2441A63FBCCD9F5C5141F3ADC9137D4E244140E5FC98A15C5141F98887857A4E2441A97789FBA55C51416AC3DAC4994E2441E526A395A65C51410BA35AE1CC4E244187715224A65C514186BFB5C7F44E24419F2BE35CA45C514121ECC745274F2441C8FCBECDA25C5141A2142F5F324F24411CDED456A05C514110926CD35E4F2441B20F8B949F5C5141307E7E835D4F24417E0FF0B5A15C51417B1097E56A4F244193A6A477A25C51412190A1B4914F2441AB307851A25C51418879EB7DB94F244175378108A35C5141B4CAFCA2E34F244138F51C9BA25C5141E4FA0B62045024410B57CE83A05C514128F501080950244158B7311B9E5C514126D88CFB13502441C1CADE129E5C5141F65B55E7355024417B27A79A995C51416785CD8A4550244109474B08995C5141C0413B5849502441C94ECB7E9A5C51416C48B3FB58502441A56D6FEC995C51418C5F4B5555502441C1010BD6975C5141D7BD985C795024414D075A78945C5141E8FFFE4F8A5024416D7899C4915C5141FC6D8679A6502441935BF766905C5141221DF1CDC0502441C56FD76D8E5C51412CBDBA4CE1502441CFC67C958E5C51417E7959E5E45024414749B6AC8F5C5141AD972BC1DC502441355FBC2D915C5141E847BB41F1502441FF636F2F925C5141A8AC78C31651244197C38C7C915C5141C8E4E8D31651244197909CCD8F5C51413D3540B02D512441077CE2AA8F5C51415A10EC0847512441D98A5A51915C5141182E7BDD63512441863A0442905C5141577CA15D6651244165BCCD2B915C514170D8901F7D512441896E70D9905C5141E2AF29797951244166410CC38E5C514111E8ADBF865124417A476B868D5C5141ED8005C89D512441FE8D16B38D5C5141B32231BDA2512441C0FB63D98B5C5141A2D89FD0CC5124416BFA3D4C8B5C51416A2341D7D7512441C34BE0E6865C51418FC72041F0512441F558E911855C5141125B7E9904522441DD72CEE4845C51417F9EB70B0D522441FA020024825C5141C81B3A261A52244145D9F997805C51414124CA722B52244153A4B651805C5141E575DFF85C5224411C79C282815C5141F388667265522441B7E5A14E835C5141B57CCF736C5224417AC7170D865C51413D034D45775224413BC4F293875C514188977A3C9E522441ED6F949C885C5141E610B6C7B3522441159B8CCC885C5141BC178725C252244143B2A9EE855C514106E2AD7BF7522441D77D1AE8855C5141FB6298CF17532441137D0C8F875C51417AA3E2A31C5324418BE33913895C5141D99575A937532441A09161268A5C5141B9E59F274E5324410788E1A6865C5141F6D4509C61532441810B9DAB865C51410ACAA09766532441BA33E68F875C5141153914F379532441516DB033895C5141848C92DDA253244142540A288A5C51415A31C5C4C353244119618A3F895C514176685F05D85324412E12B234865C5141AAC6EEB6E75324417C280356805C5141AAE316D40554244198569C98785C51414EBDB6DAFF532441947986B6775C51411F009BA1275424416B222CD0745C5141D63E5B2D355424416347E243725C5141C3C146F657542441EE055927715C514174C535F567542441712FDD9F765C5141CFD8F0CD855424411E384F4C785C514134F60E1EB5542441BCA83133785C5141B8E25B9FC854244150016668775C51411EE0C03FD7542441E575F4E8755C5141E1D744B0F85424417ECD7092705C5141DC13DACFED542441242FBA3D6C5C514196EE65F70A5524417BBCE5DD6A5C5141208FDE7A24552441A60911056B5C514181BB113134552441724D29616C5C5141A9F8820639552441EBF107B46F5C5141920CC2B2375524414BDAD3B4725C514150016AC727552441AD4DF244775C5141821B96FB3355244123DBDC98785C5141AA3B33772455244113BCA195805C5141CFBFA4A73D55244141A94B0D815C51419C16EFAB485524416D7B8C0A795C5141CA1EB4A060552441A46D4215795C5141D04CCAD273552441346B8DBB775C5141502749A98D55244101BA3992775C51414EF9805A9D552441219708FF775C514164FB6082BD5524418BFF9456795C5141B50F6234BB552441C7CF2B7A7B5C5141F102E1C6E155244190EA89B37C5C5141F8779B5DE455244124505EAC7E5C51412F6D4FA8F25524415A50852B805C5141A0F196E70F562441416D6DA9815C5141DB0EFECE375624416E20B1B0815C51416EE27D1D57562441ACDE29CD7E5C5141A651E3FF5B56244199CD04057B5C5141EC2E63BA65562441F77EA4E1775C51410ACDE0867056244100AD3579785C5141E85809E26D562441104BB3CC7B5C5141FCE0F9A382562441BCE0245E7C5C5141417EEC4C8A562441AB31D1FE795C5141F8613A7E9E562441EE579A717A5C51411A1AC998985624415567A94C7D5C514192A0EBE5C2562441EA09130E7E5C5141EEA35377C25624412E793D607C5C514144A4FFACF156244105A17C177C5C5141A337AD50F456244118F64DF5765C514101AB0EF10257244121B8DC75755C5141AABB13D40F5724418C71AA38765C51417B6956D80E572441AB1D40D8795C5141B8EAEA572A572441B8A504FB795C51416AB3DECE2B5724414876BD39775C514147755EC83C572441BC25F943775C51413089695847572441C236143B795C51419BBF0102665724417E0E3CC7785C5141BF2CB863705724412BA98FD1765C51418216A21F6D572441A1CA0DED705C514151AC3BDA725724417AFD4A916F5C51417964DDCC82572441B5F2D88D6F5C5141F421AB3086572441BB88CB45705C5141895FAC1DA2572441C076B447705C51417B0FA002AE5724418169B50C715C5141307517CCA6572441582A763A745C5141C4625826BA572441F6A08E0F745C5141DD77A01AC4572441D700BE3A725C5141C74778D3D3572441C0BABCE8705C514184AC4B7AF657244145AF605B715C514168DBE6A412582441E8C470CC715C514122253AEB25582441253465E46D5C5141E3DDE883365824412CA7F53F6D5C51416B38754A39582441C0B7C6A86E5C5141642900026158244187750D406F5C5141D5D5BE886E582441A7B47BC46B5C51415C33B5218458244193DB9DF36C5C5141F44C3241805824416AD526DA6F5C5141E739EA0A8F5824416CD53358715C514170B6DFF2AC582441544D05876F5C5141D062BD44AD58244189AAD5676D5C51411988B30EA05824416DCA86F56C5C5141E4E8A08DA4582441A742D02C6B5C51418C209B6BB3582441EE7A861C6A5C514190853A68AF58244126B11078665C5141A0324519C5582441452A7439645C5141B6339643DC582441C1B7F2D6625C5141BE900593E358244166199F55645C51418032BD4CEE582441704ABDFE625C5141AC86A266E25824418B8B0B6B605C514124508B64E9582441F20D6DBD5D5C5141BD642744155924410B31E4BB5D5C51411CCD972815592441855290BD5B5C5141F45EB459EE58244189F7BBE35B5C5141CC207306E75824419E7B77445B5C5141532CD43BEE5824418D640648565C5141A2C14406FE582441797CC715555C5141C706A28607592441608153EF565C51410E18DDB71D59244112604E7E565C514183B394014459244106C4429B535C5141BE0D12AE5859244124475AEC545C5141AC3EDC6F62592441ED7AA555565C5141E5167DEB8159244128743590555C5141103FC0D38159244186D279B2525C51412EFC2AFF9A5924413601DB3A525C5141E24B09FAA0592441752527A04E5C51416EEFBECF98592441882332634D5C51415C433D899C592441405A8D1C4B5C5141F05BEE1BA759244142888F654A5C51419952CF7CB4592441A3EA9258495C5141513EE63BCF592441AC34B2EC495C5141907BC4F5D3592441808E3B414B5C51410361C9E5F059244143693A304C5C5141E440B84FF4592441FE4F26A64F5C51410648A4DF025A2441A856A4D54F5C51415A186580005A2441A66BFE8D4B5C5141F6389F18035A2441C5EB080A495C514184BC20EDFC5924411E08951A455C5141F9EE930C0A5A24415130D97D445C5141B0C140E0065A244108681477415C5141306960CDFB592441EA277B60405C514139DDBEA7F05924411C3C6F5B3D5C51412E527644E759244195E86D03395C514182CBF786FA5924412A5CCBFA355C5141647A4804035A244157B341E7365C51415CBF4C33155A2441303478A0345C514106D6356A1D5A24411070E60D355C51418ACFD7B2305A2441B55C3DC3345C5141694DEA56345A2441E6863E3C335C5141213F36533F5A244182FDCC43335C5141014359FF415A244184C1FA7C345C514112615F094F5A2441C9C4E49F345C514100CCAC7F5C5A2441AA9742D3325C51415A9053F65A5A2441BDC99C5A2D5C5141832E5EC4635A2441905E33592A5C514170226CF6765A2441EE977FFF285C5141E8D019E88D5A2441969D201D285C5141B150556EA15A244185B59E41285C514184CB2CB6B55A2441AEFC72C3295C51411C14C08FCC5A244163EAD14E2C5C51414B000F84C55A24412CF845FD2D5C51419DADF812CE5A244151447E092F5C514164D8B4A3FA5A24416FB43A14325C5141BD92460B305B2441A5D16E2D325C5141AAD60EF1485B24417884F150395C5141EDD1E836605B24413128C4EC395C5141E55E3D34605B24418E32DC9A3C5C5141C2B87640715B2441678A8A933E5C5141D901CBC7865B2441D79DEAA23F5C51413D6EDC21A05B2441CC1299CC3C5C51413F0CE87EAD5B2441005F049F3C5C5141DEFAF80EB65B24418DD0EC793F5C5141AE863AF6DF5B24419A2F639D3E5C514116E55DA1DC5B2441CCCB4AB3405C5141EC994135E55B2441E889CBAE425C5141394BB2D9E95B2441093BFAC2445C51414862F725E55B24412E136A2C465C5141AB1AA2E7E35B244121378E6D485C5141CA3C086BFD5B24411E8DB994485C51417CBC9FD90C5C24412FAE18A3475C514184D538000E5C244155B83984425C51416D9E81F4355C24414C4E7F703B5C514140750410475C244178148FEB395C514186FE0CA6465C244161467B783F5C51415EDB8820555C244125E89E67405C5141E2F51710645C244169BC17773F5C5141C63A25935B5C2441EB8D293F385C5141B300E0F9635C24413A0E951C385C51419702B8CC635C2441F6E57FFE355C51415F456F1C4F5C24416639D08C355C5141F0AF8FD44B5C244139FBB887305C5141F2831F26495C2441D31C2BB12B5C5141C07591EC5E5C24413B4DEAB2285C5141F350A9BD965C2441DF72DCA6285C5141B8B52B26A55C2441DA15B6C12F5C51416415E63EAB5C244114CAB6C2315C51416515F9CDCB5C24417C966E3B305C514155742B78CF5C24414BCA6872315C5141ED5D179DB85C24410441D263335C5141BF86CC07BB5C24414148400D355C5141DA2B402FC95C24416A83E24C365C5141EFA7C532E55C2441F570D65D375C514176076D45F85C2441055837E5345C5141DE39FECCF35C24412BD66D20335C514100D9B3FFFA5C2441C29216D2305C51416ADED480035D24415C1525DF305C514182C8544F095D24419B488540335C514179D4A8C7115D24418FCAB23D335C5141030B2FD4245D2441293D1B072E5C5141655C909A2D5D244161AE81C42C5C5141A70E710D2B5D24418D57B7F5325C51415F39080C365D2441C4C8A59A365C514146DAF256495D24412FB85CED395C5141F6B6B8D6695D24412874B2E33B5C5141DF5FE6E9865D2441CEF834123D5C51410F8BE9C5965D244133B3B8FF3B5C514171AF72CE915D2441FEEF083C3A5C51415D24D6BE9D5D24410526D362385C5141D43D917DA65D2441B08C08DF385C51411E2F05A4AE5D2441438664FB3A5C51412C5AFDD6BA5D2441E7209E803A5C51416889BCC8AE5D2441D72821BE365C5141AAB49DAAB95D244143950C96365C5141FB3EDCE6D15D244176B37AEE385C5141A8912C40EA5D24414D6774C8385C5141F6B6D4CAF35D2441CD4D1935365C5141689E1A38EB5D2441E7D94808365C51410E05D6B2EE5D24417B54CE83315C5141243CA748E65D24419528533A2C5C5141C4C05B5AF15D244143203C822B5C5141305CABE0005E2441A5DB556E2D5C51414FF8A4DA0B5E2441249584D8295C51410EDE8899FE5D244117FCF4B8255C51410E07929EEC5D24419486DC44205C51414ACCA1CACB5D2441683B55D01C5C5141AE3E72C6CA5D2441A12090141A5C5141921A853CC25D2441F48FA0F7195C51419F734F33C35D24414D1CC568155C5141E890CEA8D15D24414B5FA068155C51418851ADC6D05D24419459AF1D115C5141EF778E30035E2441D5196ED10B5C5141F69802550E5E24419D08C9070D5C51410C2CF46A275E24415D76D04F0D5C5141ABA153EE405E24415A4DFC760D5C514114F5F94F4D5E2441E0E5839D0A5C514123FAB40E655E24413FF1447A085C5141027967A66D5E2441F9E85D96095C514166531DED7F5E2441BCCE4F2D0A5C51413A6800AA855E2441ACB9ED6E0C5C514193C789F4975E2441653878260C5C5141BBA7FE66A55E244162633E390B5C51411A8B724BA55E244133B8EB3A095C5141F82283C4AE5E24414810CF87065C5141B33F228FF25E2441013CF766FE5B51413C18A4F8055F2441654373BEFA5B514128E0FD47015F24417A43552EF35B5141030BF359205F24416B025BAAF15B5141A834E70A465F244166E9EEB2F65B51415BD743D4515F2441F62D9D79F55B51414EB8A082485F24417C1F6041F15B514184A808F5575F2441C3C95870EF5B514143F79ED47F5F2441ECF26C36F15B5141238B2791845F244102CADEDCEF5B5141C998913FA55F244172018374EF5B5141B808460AD65F244188C8BBBAEB5B5141F8F36F4508602441D1272ECDE85B51417B00CF993C602441B288C65CE35B5141FF2C4A0F4B602441E20BA25CE35B5141D88499545860244130595451E05B5141577E5A996B602441002F13E6E05B51413952FC058B6024417684CC52DD5B5141AF7156309E6024411173E8B7DD5B5141F4FFF7E4AC602441ECF924AAD95B5141D0ECED83B6602441F87E7688D45B5141CA6A1E51C2602441DFF0BD6FD25B51413442F0AECE60244115BFAD75D05B514109B4E4D2CF60244127FDE704CE5B5141F85F3FD8EC6024418F254234CE5B5141F1B719A70F6124412A88B3D5CF5B51418127A74B1D6124418765D6F5D15B5141B8C9A5E7206124417AE11B79D85B5141D450CD192E6124418C20D2CAD95B5141105857092E6124419869BF79DB5B5141682978E74361244193FE3959DB5B5141B758385047612441E2107400DD5B5141B4E5E3068A612441725DECECDB5B51413286CF90BC612441DD91BCD9DF5B5141DE69A450D3612441EAAA9A4FEA5B5141A53679D9CA61244159101C21EC5B51412A944195CE612441029DD777ED5B514101EB8E15E761244160CAEEB1EC5B514116BFE644DD612441387ACC7AE85B51411A2C7EAB3162244115F89621E55B5141E26C229A36622441880565D5E65B5141EAF09735416224416A24492EE65B514153D2478136622441FF0CFD28E25B514130F69EC22B62244142139590E25B5141ADA0335B2F62244100BECCA7E35B5141A6931E89D96124413EEE1024E75B514106E1575CCC612441427F2E76E05B51414736F246E86124412089BADADC5B5141AA4FBBCA0E622441F2B9CCFAD45B5141E0B70BC432622441C147FB9DD05B51413E92EFF83D622441CBC76825D05B51417AD0ED227A62244177523ABFD05B5141BA371076CB622441D16CAB0BCF5B5141A54AA5C2E5622441E6C35ED1CE5B51410999C3DF43632441E2F83EE5DD5B514169ECE6CDB06224419064369DF25B51410E58B070806224413E4D2136F65B5141B4BDD03529622441E9B75E27F75B51411E413ABA7C6124419B55ADCD035C514192E469D7786124411804D516035C51414D68CAC17161244167AAB7E6025C51411C5470A065612441D9933F81035C51413801DD676361244170742EE5045C51414E3A62DF6C612441B60FD8AE065C5141D7E11E342F6224415075BBF8F85B514111E1B216AD62244175C73681F85B5141638E8B26276324414702573EE75B514165F524183E632441F737F95BE65B5141BAF6577492632441CEA1A76FE75B5141DBF882539D632441AB1AA9F5E95B5141AEA45962AE63244174734040E95B5141F5DAFDB2CD6324419B431CFAE95B51410708223AE76324412052E141E95B5141B11329DDE66324411B01D0B3E75B5141D533FB2DD663244114593449E75B5141B8678C3EEE6324411EC7C906E35B5141E1E38B4D15642441B5C9B0A1E05B5141F8995FB32F642441F11C58C8DE5B5141F2FF10AB996424410EB6125DDE5B5141745434BFE36424413124EC7BD95B514133B23DFA086524419F61054AD85B5141713854561B65244157325221D85B514154BDB85439652441C11A315FD75B51413771585E45652441B695F1E6D35B51418491B71D446524414183B68AD25B5141E5B406875D652441B9CACD36CC5B51418014854B72652441266D2A1ACA5B5141603627B67665244181D9C9DFCA5B5141D0022EE8876524419244E569CA5B51411AAAD82AA06524412D6ED634C95B514177C3541DB2652441541D984DC85B51419B9745FFD4652441BA130792C55B514158CFC7B7EE652441654907CDBF5B514163179BDEF66524417F17F09DBB5B5141C4CE67050E66244161FC66CFB45B51411420C5211A662441FC189845B35B514160F1A12C3E662441A8B68A08AF5B5141C968227D616624417BF2CCFAAD5B51412039C313666624419DFED00FAF5B514193220C6B7F6624415BC398E7AE5B51415DE851489666244199AA8E93B05B514188E77923A7662441F2298F4DB15B5141EBD1AF87D0662441729C8851B15B5141BAAC9B96DD662441CC76BA63B25B51410ABEC66CE16624418C2218EAB35B51419F2234E7FC662441F199961DB35B5141DE89B3CC00672441D3E75926B15B51416104B2EEF56624417D44076FB05B514100A6BE67FF662441F743EDBBAD5B5141E0C79FF1236724411FBCC67DA95B51412246645C3E67244118A9B693A85B51416EFBFEF94C67244153955DC2A95B5141E5C1634C55672441115B1C2EAC5B5141CCDB18B96E67244114723F46AB5B5141A600A6308367244193751038AC5B514160D4C8FA8D6724413D3B4532A95B514181F0116584672441FA496018A85B51412D6E79529A6724415A21417AA45B514104C92D4F9667244109F5D0D5A05B51417CE0A60CB0672441260E1A009C5B5141CF418661B3672441434A35EA995B514140CF1A52C4672441992A91E4995B51415C845FD5DD6724410ABFBD0B9A5B51413427300AEB67244182DB5EAF985B5141BE785DCEE2672441C673A952975B5141601340C9E8672441C080FBB7935B5141D60BAFBCF3672441AE87A9AF935B5141503A11972C6824414FBE3703915B51419794583D32682441CE4ACA35925B5141E9284A733F682441C75619A8925B514129F48C22596824413291AA1E935B5141A6D07CC6866824414EE38C67955B51410EC33B67AC68244116E798D3955B51416C1A5EDBB3682441ECE90415935B51412252F5FDE26824416481D8DD905B514114125C5202692441E06F4EB8905B51413EDA898427692441363788768F5B51419A13B127306924413B136DF48D5B51416A5943B56269244167D5D401915B51410960C10B7B692441EC02E489935B51419E4E124294692441569383BF965B5141B30A9BBBB26924416F3BB0DB965B51418BCC4323C169244104E163DC955B5141212A2B1DC1692441BC126F1E935B5141FCD9449ADC6924419331DAA38F5B5141B7C4E5B6056A244187421F5A8D5B51418365936A196A24414F3A4151895B514147616CCD216A244161AD130E8A5B51411DA596F9356A2441442D9691895B5141FACDE40D366A2441943B4403875B51419AC46D2B4D6A2441AD594C70865B5141DEB5F4CE6E6A244175EFDDF5855B514174010856886A24418357A43D855B51415199917EA16A2441C7991B74875B5141F33765EBA76A2441EDE248F38A5B51415F59FFE1BA6A24415AC1CCC78C5B5141551D200FBB6A244170A7DEE58E5B5141D6A03841C86A24412ACB9337905B514149E6E4ABCA6A24417C6DFFE0915B5141973FD8BAD56A2441B981FDD6935B51416E35EFB3C96A24412A1C27A1945B514160621FB3CA6A2441234FA16D965B5141F3A2D612BC6A2441E0640EED975B514188D8D971B76A244176F0EA449B5B51414B2FDDA6C96A244174CD1ABC9B5B514125F99066C96A2441C11708FB9D5B51418CF5F20CD86A24419F7A8F399F5B5141C021F1E6E86A2441A453E2249E5B5141AED621A7E66A244198E02DFC9A5B514196CC95EBF46A244135FE5DBD995B51413D29B840FB6A2441FFDCD45E9A5B514116B66DA41A6B24410ECCB1BB965B5141422572A9326B2441D3B77D17955B51411FC328502B6B2441AB9F45BA915B51418CA8F80B3A6B2441F0A02839925B51416A40ED5B3B6B24416114CA17905B5141DA06AD47536B2441EBA7A012905B5141281AED6A5E6B244193FB4C7A8F5B514122B5EC31526B244188AC1D378D5B5141639936CE666B24417E5DB1EB895B514192D0E10E806B24410B9570B4885B51410B1176E4726B2441742CEFA3855B5141751FFD9C7D6B2441F389637E825B5141AA10ADA9886B2441911407D7805B51418BC82EC2946B2441DB6C9F2C805B51411859ED03A36B24411623E39B815B5141967323D8A76B244161EA0C20835B51413F4F0A37B46B24413A6FACF4825B5141B993DE75BD6B2441AE31753E855B5141A68C64BDCA6B244179E185D0855B5141440C8D67CE6B2441F34F7E07875B51412E0B3F46C26B2441D81705A2875B5141A2B2686EC26B2441BCB8CFD0885B51413CC4D9EDE66B2441D3388BFF885B51418A97F2500C6C24410FDB70FC885B51413C5F788B0D6C244101D3B69A875B5141E8A55C4D366C244122B34660875B51411D9D2A523C6C2441146228A4855B5141953B287C596C24418D1C4696815B5141114B4FF8796C2441D25D93207E5B51419425D43F876C2441E308A4B27E5B5141A6371AC1A16C244196819DD77E5B5141FBE9825EB66C244114BFDE5A7D5B5141D15D8C66B56C24412CDB051B805B51416DC279EEBE6C2441F073C235805B514180E49D91C76C24410BE6A7B37E5B51419E6EC6D8C86C2441EBD268827C5B5141BBB89A44F06C2441D12263AB7B5B5141DEAA360E0A6D2441EEE496517C5B5141D0094AE5086D2441708D12D37D5B5141A28D5043186D2441C3835F907E5B5141636D6849186D2441BB59534E815B5141429E9EF11C6D244120731883825B51410C2EA552476D2441644932B6805B514143F98C4C696D244165924C57855B51411AA47B2A696D2441F7E575E6865B5141F0B0E1CF716D24419725B501895B51419787EF80816D244129FD836E895B514169E992C4836D2441E296D1B78B5B51415EE37076926D2441A1BC26588A5B51414AB08F378B6D24414321922A875B5141B432716E9E6D2441CECB28C0865B5141F4F23EAAA66D24414D61DD1C885B514146B2C397B66D2441DF96252A875B5141C34D08B1B66D2441696D1B8B855B514168CB58EFAC6D244165B6D221845B5141725D2E7ABB6D2441B55A0A62835B5141437E7A6FC76D244139451F78825B514142DAA7F4F76D24413AAC040E805B5141E0A5795B076E24411A6A32DB805B5141D499556B0D6E24417ECF4ECC825B5141F11ED0300C6E24419C8D082E845B5141635D94CA256E2441D2A13D64855B5141B1601598306E244195C87ACA875B51413BDB431A466E2441B10B93EA875B5141168CA8B75A6E2441246BD46D865B5141DBD3D73F8C6E24414C73CDF0845B514165C137E2936E2441CED8F81E865B51412347D479A96E244152FC6C7F855B5141AC07FB7DAA6E2441DC352D3B885B514158C4D264CB6E2441A240B252875B5141F769A40DCA6E2441260970E7845B5141ECD75927046F244114268DC8815B51411325AF961D6F244163CA9E327E5B5141CB8DDCBE356F24417E07EFCD7C5B514118FB4A0C496F2441CE408E727D5B51418C14B3556F6F2441F4D58B8F7A5B5141225CF6BD6A6F2441CF49DCAB775B5141026116B7766F244118998BE2755B51415FA48309956F24416EAD9A9E765B514194A8C17AA26F2441C19EB6E2735B51410C787DDCB56F24418F6805F9715B514108DFE051C46F2441D350E1F8715B5141BAE8E27DDC6F244190FDCBB46F5B51410832FB00ED6F2441EF5303D06F5B51410CB705310A70244154BF15806E5B51419AA9D1EB1F702441E1A00D206E5B514111814A6C3970244132544CF5705B51418531C79341702441E2E650E0745B51413F22B7A1537024412DE862F7755B5141B9466D8E577024416B6CC78C785B514191205D49747024419A84801C795B51419C373D67C57024414377B009775B514101B58F9BD2702441C23EBDF87B5B5141F6A64BD5C770244182C11F1F7E5B5141410B95FACD70244159A097507F5B5141E5C46291EF702441A92CAEA57F5B5141C8EE7D19167124414A5A7E007F5B514192A311EB3B7124417AC034AB805B514164AC5A3B61712441DC6EACB97E5B5141D83BCA24617124419F38A4AA7D5B51416BC6A6F8597124415BBA7E6B7C5B5141C8106FCE46712441B32063067C5B514162B03DCE29712441B6684FC67C5B51418ADDEDA8187124419354AE6C7C5B51411D3D8B95237124412065538C715B5141DBB4264C5D712441D4E26F216A5B5141CD2CCADF767124413122B299685B514193C036357E71244113AA4DD66C5B51417068011789712441F40C3AAE6C5B5141C0ECC0E8887124414F977DC1685B514112AEA1D6BA7124419C6C67E2685B5141EF7ECB87D17124417A63F73E6A5B51419B8A0C11EB712441546E16246D5B514175D89A2F0F722441898828A46C5B5141F7CA5A421A722441DC9DBFBA6D5B5141C1E7F3DC30722441775B47086E5B5141FCBE546A38722441F5C3ACAA695B514129C2457049722441B0F264E5685B5141EDD01A8067722441C5800743685B514163C8FFE887722441F5A7522A695B51412E6D26ABAF722441DA43D36E6D5B514195C2CF49BE72244175C3246C705B514106165691BE722441196FD7B9725B5141D9C607EA9E722441792FDF2F735B514116D9DF9A91722441D0F4995C745B514178BDB0299A722441ADFFCF68755B5141F92B02A1A772244196FFDE6A755B5141B6C1267AC472244110F7D44A755B51412C9EAC75E27224410E01C736775B51411AB9A4580E732441AE67DB55765B5141A2B1EEAF2E7324419397641D775B5141B5A91D0E43732441EDCB3DAE795B5141CF8403684F732441CF149793785B5141181F45C73A73244190A251A4745B5141DB90F4E80D7324417F155FD9725B51418AFE8B0E0D732441C9C5ACCF6C5B5141639DDED31C7324416AE12BAE6A5B51412098A3372B732441C412468E6A5B5141F32912AF3473244193ADEC576C5B51412980E71148732441DDE8E73C6C5B5141342A14CB527324416D4E7331715B51418D58A3155F732441686D6294735B5141DF43B1E469732441C35CE17D715B5141F8F807185E732441A3EC2C4B6D5B514121572A856873244196D756B7685B5141512ED16A8973244187DE3000665B51416E750916BD73244129B7E2DE635B51411B9783B4D173244137C3D030645B51413715251CF673244197C0D881615B5141A3A483C81174244122D8AEC2635B514102E0D19A15742441BDD26F28665B5141281F87073674244185695530665B51417E4DAE16317424411F4F33DF605B5141D4C82FFB18742441FAAC5D74615B51412385202008742441F3F05DBA605B514152EBB5590E742441B926865D5F5B5141E96890B61D7424411509274C5E5B51415777FFDB4074244173BBB2BD5E5B5141F2AB44672C7424419DB8D11D5B5B51411F6E6C3F6674244120B0306F585B51410A8430BB62742441ABCFABC9545B51411E35BEAA787424419F04E9C8545B51413CFAD8597C742441F18B26EF565B51416A1B64488E742441967F4FE7565B514145239CE4A2742441D1A1E69B535B51412F2F47669A742441F1E9C6E0505B5141CB4B0AF1C0742441AA22878D4D5B514176120ED1D17424411B12CD364F5B51416F15A616E97424416C8A9FD24F5B51412EF8E195047524412AF865F54F5B5141F081DC62097524418459F1EC4C5B51419DF88C1F137524412CF9F2664D5B5141AE1CEB981B7524414D72CC324F5B5141E84F0F1F3675244173200C47505B51411A2A2148547524416739A6054E5B5141256DB35D66752441404FED5D4D5B51412E9EE5326F75244100CF29E94E5B51416126A43F60752441AAB612B9505B5141AD2FF0EE73752441843806DB535B5141EE3F1B2193752441F69EA444555B5141898F6121C2752441E79CA39C545B514197D40BE8BE752441C405D3B0585B5141619C82B4D0752441F9E023385A5B514196C1369FED752441C4C1DB375A5B51417EB42C7C367624419FF313D9555B5141B0B4B712537624413D6A9E5A545B5141E4349C215E762441C9399A50565B51413232F81D847624411E12097C565B51419BE9B696DF762441CD370B01565B51412A561302FB76244109BFB966525B51414E11FA72FC7624417A128BE74C5B51413668518D14772441ACFAB5834A5B5141A4FE14DBFD7624410A977B58475B51411E3A2125EE7624411A0067FC455B51418EFFB0D2FF7624410A2B6919405B5141249BD47B2077244130E3C9C13E5B5141ACBCEADB33772441CD81D554415B51411CCA0DC13E7724416010C398465B5141423D719A72772441752E3064485B514129C526238677244180EE9EDA455B51419EB5032D93772441B85189FD455B5141583F4E2B977724410E88ADB2485B514100192268B7772441BB4D944A495B5141A3CDB429EF7724411B48B870465B5141A497A2060478244167AA29264C5B5141E2875A550C782441358D964B4C5B5141D2BEC29E0D78244150C4AFB74D5B5141BAD5BE2219782441060106CE4D5B51410A78EF4420782441E3099F2E4D5B5141CA2302C22C782441BF4F7C534C5B514102F0E27536782441C1ED9CBD4C5B51418E912CC03F7824412BC133694C5B5141548C02F143782441E80F47E04B5B51415373066E47782441890D2FF94A5B5141448CA3FC4A78244158ADD8314A5B51411E12E048537824417FA9A2DF495B5141D3E82966587824417633C134495B5141037EC0755B7824412068846E485B5141A93C8B7D6278244139077B9F475B514117CB250A69782441174026F2455B51417626A4F26D782441BFEAFFE7445B51415E03A2C36C7824415B3389AB435B5141B5B0F5076778244130FB9B38435B514156FBAFE06378244179922621415B51413212B45D67782441A3970E3A405B5141914944EE697824413063EB743F5B51414694EE7A6E78244101E661AB3E5B514162E09807737824419569D8E13D5B51418E65149A75782441A5BA02AD3C5B5141D06FD92380782441593627E63B5B51416F4BE15187782441BF6599B53C5B5141D09FD5028D782441A54A58883D5B5141A8B6DF2B95782441AA129FF63C5B5141E3069A3AA578244179621EB33C5B5141A65D00685F782441B05A7791225B51412349166A247824416F65A5620F5B51419A101F08E47724414EB88810115B5141888D5CCDBE772441A4E76A42125B514184D624D39C772441E54CBAEC135B51412E7A0B3988772441CD0301700C5B51414D34C04C677724414F33234F045B51413F1141DA5F7724417CAAF790025B514103778E705877244158F1ACE2005B51418AF6986A54772441E1B652ECFF5A514196F3299FE6762441DD8302EFEB5A51412A240A8B667624417D5068BDD35A51417D5F5E8EF0752441A9CC85F6B95A5141C75CF49DA4752441FF37F92FA35A5141CC8F209D427524414A5B8662815A5141A6B4B375FF74244182614476835A5141841C01C9D2742441C902919E7C5A51419E2B44B7267424410A471D045D5A514117D08BD420742441904211315D5A5141C0D67476E5732441C7F817D35F5A514158A35124446F24410CC8CAA7935A5141D35A3223E76E2441D71F95AB975A5141CB52226F696C24417E9BB188B35A5141FEBDC7086B652441A6DC5BDB015B51416A11D32E656524414A593118025B51414A2FF1F959652441EEC4C290025B51419BF0F5C03C652441B92ACFD0035B5141170E593C47642441336AFD3A0E5B51415DA3C45EAB63244111D3A0E0145B5141E031C332A8622441037AC4D81F5B5141A536A7D58F622441ABFF2EDE205B5141B46085AD36622441FFDCA2A1245B5141B8D2BB3766612441F4A28D8A2D5B5141A6BAF792336124413C5C8BB92F5B5141A5D3BE6A26612441545E6446305B514186DB854219612441BD613DD3305B5141FFB3343CF4602441D3A86764325B514196404514AF60244131BEFA5B355B51410A82BD2FC65D244122ABFADC545B5141767CE37D355D244157D732FA5A5B51417A0DC79C7A5B24410D882FA56D5B5141169D12C0C65A2441054FB442755B514118161E96BD5A244162029AA3755B5141730DECBA5D592441B05B8336855B5141A6C3AF658E5824410975CD5C8E5B51414134384E92572441656B2585995B5141AE09471987572441560AB8FD995B5141452D4D5B6C572441EFAC47389B5B5141EF987C3BB95424415A8BAEB2B95B51412403532A90512441FD987030DC5B51411522D253745124413B89913DDD5B51415A82FBC70E4C2441D18374B1195C514124C3ECBD024C2441C87104C40E5C51411AA3EC4377492441F69C11082B5C514150D560EF5E49244180EA611D2C5C5141B845D813414924415DBB091F2D5C51416B1BD2711C492441A5C27D7F2E5C5141BAC5B9640A492441018B1B372F5C514194994B9901492441C9116D8A2F5C5141B72D5D04EF482441C65A4333305C5141E499C575424824413A926A6E365C51417ED8174540472441991C9164415C51413AC39A99984624411EF9C9F14B5C5141C029FFC10E46244165DB2E3C575C514184C5F81FB5452441C745CFBE5D5C5141C5EDFB00694524412B8F41A5615C5141B8794F163D452441A2E7F7AD575C5141224F737A5E452441E635F526535C5141FEBAEF8D7A452441CC62BE6E4A5C514160832306794524417EFF3979405C5141E3D2C9587A45244176CAB4A93B5C5141520E738C7A4524410B31473A3A5C5141B53A22AA85442441482F73E93B5C51410F21D05D3A43244177EC45383E5C5141E4CB2F3E314324410727620D3D5C514169ABD78406432441460CFDEF375C5141784AEABCC4422441B4E8EAE72F5C5141DCAAC75D8642244169C21787295C5141469687765A4224413549E9FB245C5141EF5839CBCE4124417A6DAB7C165C5141EDA9DD9F6A41244192AA182F115C51419FBC94C8C64024412DDE8BBF215C5141B4ED1A946E402441A1E188BC2B5C5141D9308D91444024415833FAB4325C514156FFDA3BAB3F244121E324233C5C51418FCAB4F42C3F2441BB255DB4465C514128439060DA3E24415F669B743A5C514103CDAB8F803E24411629A0A42E5C51414B220595483E2441C0619A67255C5141461A9997FA3D24416912DF3C1A5C5141AC5FB0C0583D244118DD9FEC0E5C51417980967FA63C2441B7A414E2015C5141103AD608F93B2441D567217DF45B51415B6EBC22B93B2441F022CEA6FA5B5141A91538697C3B24418DD7EA25EF5B51410EB53AB8363B24410D82F2A8E35B5141852E127CEC3A24410DA2B078D45B51413311554F963A2441B445A921C75B514188F66FCA603A2441B8BD5F3BC35B514152F0159C0A3A2441DCD02E61BA5B514112AD5A13CD392441A99893E9BA5B51410BA16D4A8A392441A590F62BA75B5141A04487BB32392441C6524DBC935B51412C2AA26BDC382441D778BC25865B514172740BB2EA382441CBDC0E6A805B5141083F596C5039244168A44E6E775B5141B0FBB684CA392441723E34E9685B51415A999D5D74392441303CE535565B514170867EBF24392441C867A0B4425B5141306C949E10392441C7440A2D325B51415B5C64B1E238244198B9CC611D5B514147FD6648C6382441CA1F4867145B5141A6841D133B3824413E5BC63C145B5141EF20E3AFC837244187A0B478175B51414214B9D64C3724415599176E145B51413CE4298A36372441509A06FB1A5B51415F9068830E37244105B012EF215B5141F3A88C5AD2362441ED30A5F2245B5141922CF37DCD362441A1A9D8782B5B5141171CA199C63624410E32B3A1345B5141A22F2DE8BE362441DF4E730B3F5B5141C8CABDE48C362441BDE2E378415B514158EF406477362441E12937F6445B514180849BEF66362441AD63E2A8475B5141FA158FBF0E3624412E1E542F445B5141AF1791B0E035244130736373475B51414430D9A9BE3524412364FDBB4B5B51415E405CAB90352441DE1D18514D5B5141CB79E82B63352441E75319E54E5B51411A9BBFCA3D35244121ED0D3A4C5B5141D4F72397F434244125AF6C00475B5141F96E3963A2342441C6B6D4BA415B51410453FB936634244167E95AE0405B5141F2B475799C3324412CC79EE33D5B514194327764A33324415DC9668E385B5141EAE0EB09A6332441C930F4F3355B514154A47BC5A8332441BE527AAF335B514114FE375EBC332441DE252CA82D5B5141487E03C9BA332441694D68B3225B51413A12B160BC332441B269E379145B5141B7C36BD45A332441481EFA34115B51414672F0CCF6322441F34690F50D5B5141386FFCFBF6312441A99B7FB9FD5A5141B9741582F431244191CDD827F15A5141DC3387BF4A3224416D4B206AEE5A5141BF7C618E5A3224411F9B96F2DD5A5141936C888FF0322441464FFAE5DC5A514111DF279EEC322441C2725BFBCA5A5141783BE56D70312441DB1D27A9C95A5141EBE0BD7D5E3124410B191962B15A5141D688836EFC30244103D7AFFDAE5A5141A6E73853D23024417F736DE3755A5141348688AAA4312441979F66F1735A5141E9F44C7C943124413309F2A2605A5141A1D134C1323124417BD5BDBC5F5A51418F90A79092302441A3F7DA805F5A5141E324AAEBD42F24412A9EBA675D5A514185D422D6622F24415618D5635F5A5141CE2832BE4E2F244114653D6C655A51419F10A2CAB62D24417C4B667E5A5A5141D9ADF28FC62D244125923C28485A5141BBC91096DA2D244146CBC2E5395A5141E0BB417ABC2D24413C917DC02E5A5141447E708C782D2441B5BC0A25325A5141DE440FCC242D24414D62AF7A385A51413BA6D43C0D2B244105DB546D265A5141C4357CBAE22A2441A42EE4662D5A51413A872F1B8C2A2441FF5980C1355A514124806F1C3C2A24411A6EF12B405A514117313641F5292441EDF2DFE14A5A51418F3185DAB2292441C9FB0E3C585A51412379FBE234292441E2B5A0F9665A5141F643C4F562282441178EB0F8545A51415E1648FF96282441E66E244B4C5A514117078A65982924413A7DBA2C225A5141185E66A16029244157C8ABB70C5A5141A5085464712824413E370602035A5141AFA5D2AEDC27244150FA7981295A5141CB5A82104B2724419ED69AAC1E5A51413B20EF9046272441D975B140105A5141CFA8319CD6262441A51C08FB0D5A514188EFF82AB426244170DB1636F95951416ADA729A83262441E3D89BC1F9595141737326576D26244147B8D912FA5951417482A4E7042624418788E779FB595141FE65FD20EF252441CC43EEF7E75951411FDE21416A2624412EF96BE6E7595141779B5F65642624415CBB36EBC5595141976775E432262441F7B11C78C75951417074B93C142624413ED5C8EEAC595141D022F24CBE2524411F14AA6CAE5951410041F13CA82524412B860EE9CB595141786F1D80F1242441A02133FCCF595141D82AF222D524244124E45263C4595141C41E6879C822244168255E37BB595141F234270DCD23244112361A3A9C595141F60B239F68242441305C746BA35951416435873F712424410856CC62945951412C12A18CFC232441CA4D9E3E715951413ADAAB642223244168FB35E46F5951411FFDE97720232441BC7F8E014C59514121DC78587E232441F84919724A595141104EFC875E232441CDD8436A31595141E9F3985E612224415396357B335951414F2EAA3C8E212441CE4143B42D5951411227C88288212441DEE815AA20595141B1CEC62CB821244182F53BE41A595141E3FBD826B621244194D6ADEF10595141DA1358A1762124417DCB667C115951415E6880195E212441F4B9DFCF15595141CCA7B9FF542124413AB4FD62175951413EC5A0F51C2124413F63D5BD195951414C7B2F96F420244187C1C0F817595141B292E56CEE2024419AD4A9A617595141EE1FFD45F2202441789293640E595141A20F7BE30D212441739F88EE03595141116BB162122124410325CA2502595141B017E5721E2124411DEBCF36F1585141AE52C5781D2124410AE33D3FE8585141BD220E421C212441AE123DA7E05851412E7C0CF9DA202441B50636B8E05851418C6D01109F2024410932C17CE15851413FD5C8BB6A202441A8635470E2585141B4DA49E95A1F2441B537D66CE1585141C8B21216271F2441D3AA6CE2DD5851413CA91D46E31E24416062D17CD85851410BE5B9EBA61E24412D5B4B27D25851411443CB07591E24417D749377CD585141F421EEDAFC1D244151521CE6CA58514166F9E417791D244175F3122EC6585141BA290019D91C2441A854E2B3C25851410FC2C1F9201C2441B6BC44AEC0585141C16740156D1B24411DD553FEBF5851418E6863D2081B2441637ED1BBC158514175E330C7601A2441B672336FC4585141D72196DED819244143AE2DBCC5585141D319DDD050192441F6A5292CC35851416AE48B3DB918244132C3B37EC0585141ED289005171824411C537868BE585141A0C3DD65F7172441D46359EEBE5851410917B6F2A217244181ABE668C0585141F67464C31817244193EC0835CA58514152CA3D3175162441CC9A007CD0585141FF57414A40162441019070B3CD5851418C8850E0361624410C01E6E8CC5851414DD1698736162441C89E5A7BCA585141F9A250E03516244105159F4DC9585141721451E0341624413B2958B2C5585141F29F6C3034162441532CBB74C4585141649CCCCF1616244154A22AEBA5585141FAD7256DFF1424415B34A576A7585141E24630051115244103D31B4C7E5851412632193A261524413DA5053F4D5851416DF8F88E8A14244162375E7B495851418AFD9660841424410F6459545058514109676038651424410537E0B56C585141E1A78B35FD132441970701FC6D585141BD46CB0CD913244186E0026C6E5851411F0222E5A6132441AF5D48B478585141EB75D439351324413DDEF6F176585141A85C37E2BC12244122AD14BE755851410E97E3E14B1224417AB6104A74585141DD117DCA6F122441B69347E46558514184B8DFD9FE1124412F818AF2605851412CB05FDEE4112441CF4DF3276758514146377F29D3112441FCE47D67725851411B74340B95112441D75B91B073585141CF7D7C3107112441BB9E492B745851416C5A5ECE9810244110E5F33C7958514173E5A5B4901024411DEFF65076585141ECEE8611471024418D76BE655D585141C3DC30515B102441DD5860BD5658514106E3890A79102441E210D5614D5851418FCD17097E1024419ED7947D43585141BB72F28E3E1024410375FD6B415851417B5C642112102441EDED576F4058514105F2AA2B08102441CF7072754058514128CAFC02D10F244176D8F4003F58514160AD94EDC60F2441E86990E42B5851411B6954E4F80F244186C6F77728585141C8D926BA021024418919C5691D585141F45A4CC82C102441A9BE803510585141D9A5D9C9D210244193A129BC1C5851411A38E46808112441AD611BE916585141E6F30399F4102441370B4DD910585141A7CA0642D41024415EEA9FAB015851413208934FC7102441E0BEB331F4575141E6B5ECCAEA1024415D2BC7ECE55751410E2921C8FC102441BA5DC4C9DE5751411ED92DFF011124413011C57FDC57514154456352041124412DA1704BDB575141054D8480071124411E8263D5D95751419029C61B35112441A8C1493CC8575141ABC01606F2102441C7E998C1C757514119D990F3C81024411366096DC75751419BC9795AD60F2441DFE718F8C6575141C9F8D6D9C80F2441C19121E6C6575141F20B63E2D20F2441FD7322B4C05751410DE98CF8FC0F24416E6103C1B157514182DF5D2943102441438003EEA4575141F41FD8E27A102441981040638C575141822AE51997102441806391327857514139E111298F102441F1F69E40665751418FD698998C102441777D21BA60575141F1B50D588F102441C16C52DE5157514139284B5C901024416CF6C77F4C57514199E5D9CB7C10244108E715793857514196B877146B102441FF54782E24575141E72CAF12571024418B54102811575141C9DC3C8A4910244162276CD1005751417292A924CD0F2441FEE2EC65005751411CCCEAC22A0F24413AF2626C03575141BC32A226590E2441DAB78480FF5651411DF0603EE50D244184AE870100575141AEEB99334F0D244139E259B2FA56514124CC3511910C24419D3D92BAF7565141F52B87768F0B2441ACBBE4FBEF565141BE5A80E29E0A2441AF8FEF77E7565141B46D727F5A0A2441FBB37C70E6565141F069F2D13A0A2441212026F7E5565141E0B17844110A24417162A9C0D25651415A1A0A08110A24411824AA1CC25651418D09335A100A2441E206F678B25651417A7DD8A3000A244160720C30955651414CDDABA7180A24419D38DF3272565141A4C95DC9060A2441FA75F39E5456514186F799ED050A2441AA51ED1153565141AE7E8872050A24419AF5973352565141CC5D9B1E050A24414F0B5AB550565141F29DE51BED09244114A3A4BE33565141FEC58878DA092441C666EE951F565141433F1C6BD4092441A112CE27195651418DD4ED1CA9092441E472A1F80056514117F008BC8109244157D6B42DED555141A71CB94770092441E409AC2AE4555141541A09B534092441A6F1B803C655514131E9C1E512092441D950D7F9B55551411EB3BADFE70824419AE331E7A15551415BA4B47CB80824417E2EEA2484555141B75353EE9B0824417924A8AF735551418E5B634495082441643F29C16F555141EAE33B4554082441ADC0529F5B55514142D92AB3360824413AE25C575255514152D0851D3D0824417A64F6AE3255514122C0303D1B082441E7E0FAB20E5551416547041F260824416D94DBE9F85451419247E1914C082441372FC87DEB54514110FA39E173082441AD8C7A6DE1545141B8656F283A0824411FC11EEE83545141526E42FDFB052441660E406E7B545141F5811E9680042441822512AB315451413D9ED4DC8503244164E9DC7435545141A41E0361680324412A79058421545141569E1590B2032441E64BC8801F5451417F099DF1A7032441E3BAB3030F5451411E42479B78032441A25B532D0E545141ED4A215172032441C58ED566FD5351414C1BF675880224416725C36DFD535141E824DA0CBA0224412F156FB1E3535141FA91162EC0012441C4B48981DB5351416A30D8B912022441E74C70F6C953514104182216470124414FD77634BB5351417CBA5A97220124414E90D771C05351411E55077DFC002441E27F4E62C6535141211C544DD800244128CB9D2ECC5351414B802EE4970024416B6ABB73DA535141B2EAE2DB840024418CBD4037E45351417B1026FD79002441549F0D69ED535141B15A6E446F002441733F6215FE53514144026D7522002441828F1541FC535141F127BE4914002441C7C8C9E0FB535141B38C26237FFF2341CC5B4D2EF8535141C5AAC548C4FE23417919DAEFF35351410E2D0A0CECFE234126FF713AC153514180123DF1E3FE23417F66EBB0BA5351414A62F809E8FE2341AA2DA6ACB353514150C2B535E2FE2341522F58BEAC535141989D29A5C8FE234108336D7DA3535141760B1B2CB8FE2341155155269D5351416736F1DFA4FE2341A22BEB359653514153A8012C9EFE23415091049A8E53514106E0A53637FE2341F590F317985351416E6D8D0C5AFE2341300669469E535141EA1F6F2F2DFE2341829E39B6A353514136DEEA3F72FE2341B2024A30B6535141757E004B14FD2341194D3AE9CC5351416C9CFB9128FD2341968AA385D6535141C09A94814FFD23411E5D8836E35351415D1821F768FD23416FA00E79EA535141679B02CA78FD2341326B2971F15351419CA552ED6FFC23419B047AA20054514148F105C99FFC2341FCE6950406545141B1A809C978FC234145CB9A7212545141D9D33FEA34FC23417CA60A2814545141A6EC02C8FCFB2341AE00F5A4135451414AD45979B0FB23415B01116D15545141BBE21D06E7FB2341CFB73DD130545141116E300F67FC2341D7ACE6436154514191B530C59CFC2341C6A82D6966545141C6E0F809BEFC234136F21BF870545141A470971671FC2341959FBFFE765451415F2AF19790FC2341BDA6EC1181545141D62B50F79EFC2341A7C1F5EB895451415B1882D9A6FC2341CBBAA3F5905451419AEBCAB6A6FC23415EC3136E9C545141561A90849DFC23415D25D13DA35451413CB20AD34CFC2341C8849C6AAC5451415CFEFAD902FC23416120AB6AB2545141305F8738D2FB23417484D473B6545141C0998F89C6FB2341B2178EABB9545141495471A9B6FB23419990376CBD545141A61E9C38C3FB23412B390E9AC65451417D10402CDEFB2341097C09A8CF545141096F3B3EF4FB2341BDE09232D6545141C0B78B2161FB234144A5E732DF545141C583FDB176FB23412D287D3BEA5451417AD8EFEF7CFB2341ADF760E8F1545141E953AB4937FB234144D38501F4545141A9CA97A6DCFA234146C3C46BF25451410C9B338191FA2341A0035CB2F25451415C341C6108FA234146C16BF10B5551415E71824A12FA2341C1A4155C22555141EC3F852D15FA2341C512E06029555141BBE1B9FA12FA2341CAD0E83A39555141332551D50EFA2341D7F6F9F74A55514188BBC039FFF92341C015A06C5F5551417EC7C54D01FA23418E310CFE6D5551414FD02CF0F8F923413B3877E8795551412C2ECBB0F6F923413132D6A8805551414E35660DF7F92341D30331208C555141CD87271BA1F92341ED9166B89555514115FB43966EF92341843E5541A055514117DBCBB35EF92341FD39F57EA85551415E17E6D45AF92341828315BBBA55514146B5D4F862F92341567EBA3DCB5551417B4B5C9166F92341E8947327E0555141D3DF1BD862F92341EDBF2626EE555141E000E09254F9234174186E3703565141F39859374BF92341DC8D0D240F565141278EE8095BF923410AF8A0361E56514182195AD37EF923412A672BB932565141511EC23878F92341BC90D13947565141A85AABB789F923410CC34EEA5356514197811FF98CF92341AFFC853156565141D619FDD28EF92341E2355CBC57565141F0423AD098F92341835B15FB6756514192F0FEFEAAF923419EEA32E975565141EF08151FB1F92341DF311D2F8856514166C2D3D2D0F92341D3AEFD389F565141C45D7587D2F92341982D7BEAAE5651419DD82CF3CCF9234138C60EAAC15651416A3A2A48EDF92341FB0D603ACD565141296C25E706FA234112167D7AD756514108F45A5A22FA2341B5575C87E0565141CF6BF9051DFA234144242739EF565141F38C0BFB1AFA2341F2BF4873FE565141E710A89128FA2341BD8FCEAE075751413FAC53FBD7FA2341E79AB9AA055751413BA1775EBFFA23414EBEE4751657514162C4A42A9BFA2341871F2D3C255751415B2E558F9AFA23414BD7CE7333575141121262A0B0FA2341D1800A4A4057514193063D8AE0FA234157F64BAB46575141007EB3FA1CFB2341294748414C57514179029B19A9FB2341828379A651575141ACE3E790F6FB2341E0A42D7756575141F7C6C8920EFC2341C266DBCC5D5751412C6514D4F0FB2341C9A5243966575141E661ADFEA2FB2341CB3D042666575141686F3A2463FB2341841C713465575141484F9491F6FA2341214594A66357514184365A19BFFA2341299B1EA361575141C853A79555FA23419B7A3A805D5751415FE46CE08AFA2341E297D363665751418E57FAFE98FA23414CF620AE6F575141282FB3F0A6FA2341EA3844DA76575141A8354F25BEFA2341345FDF707F575141CA880921E6FA2341D9FDFA4F8B575141B6D2E678F0FA234134848EB09757514175FDC47708FB2341A18A6EB4A157514128DA802E46FB2341C186C664AB575141A90290EC7EFB23419E540F9DB95751419AA2FADA92FB2341550DD100D1575141334B18D892FB23413E00B3B2E5575141D32838F79AFB23414F8E4177F3575141C35B28E2AEFB23416CD7FB9F0358514176BDB9CABAFB23416DE888BA135851415EB6D4E4AEFB23412B97682A2358514162847A0075FB23411EC0A4E32D585141D891D7D13AFB2341C19244FD385851416B608B3723FB2341B9B7D0E648585141B0B3374419FB23412DAFA87356585141A1008BAE0CFB2341597EE9A56458514106BA32FC7AFA23417A43E4E56958514116A5C5CFF9F9234177202BC46A585141B2B1B4AE72F92341A5DEA2AF6B585141B677201FD9F823417D5B03A46C585141F2BF7344B5F82341A4B4B7B963585141EC7411DB2EF823417804EF23645851410A242D263BF82341239CDFDDA25851419E4665EC54F82341340906B3BC585141BE88E5C164F82341C6A41E63CF5851416F94631A77F8234176895169E8585141B0E690D886F8234154FD913BF8585141DC37F8F078F823417014CAF104595141F865764271F82341E32E597C0E5951414EBC101B2BF82341A6C9262E1D5951418E449FB10AF823410B6086151E5951418638C716BFF723414AEBFB3B2059514148D9D53243F72341415B09F01E59514147257D8D0CF72341510EC4691E59514170847508A5F62341E141D3AE1F595141E849B43769F623412EAFBEEE2659514182A70B161FF623418C0D59F129595141BE7553CEE6F52341F844D0AB2D59514122452821B3F52341C43C66B6395951415AEC8CCB78F52341139BFD6F45595141D9EEC04459F52341E82640714C595141A50972822AF52341A3CCADF4525951411845D26BF6F42341B8E7332656595141288F1051DCF423417EFC40ED42595141F66185D3F2F423415023F8A43459514151D0341505F5234158F464632A595141FDA5698400F5234151A1EAF123595141BB088232C0F4234147AB9942215951419FD869D98AF42341C6FB4C7A1F59514168EDB6D328F4234195366B771A5951418DC81F8D02F42341D330572F1659514166A345AC7EF32341E285CBAD1F595141AD6592D410F32341094BA4BD25595141B2D86451CCF223411578C4B12B595141A4F36EDC3CF32341E99EBED55D595141F593692C6EF32341B416D48A71595141BE9F86243CF32341206C7CA676595141FBD9E98B1AF3234111DACF3FBF595141DC8B4747E5F22341CD739403C35951411CBC043387F223416AE011A0C9595141BB9FA0D387F1234188912C8BDB59514152CCE83962F12341C7E8F02EDB59514180CE76132CF12341229495A7DA59514170083E6406F1234156A9070BDB595141A779EF85CDF023415EE5C3E8DB595141A013D97FA9F0234134085298DC59514167631DA239F023414008F5CDE0595141C982383221F02341FEB4A1B3E1595141B88314B0DDEF2341BA8860F7E4595141D6D4C30F7CEF23417FB50BADE9595141C615F30029EF234150240161F0595141DCF1FB48E4EE2341EC2EDFF5F5595141691CE72B48EE2341133297EAFE595141B419B81980ED2341F4FF7B23045A5141224B2AEFE7EC2341DBDCD66B125A514162B6596BB8EC23410F236DAC1F5A51411954287D3CEC2341008DE8B62C5A5141BF8E2A20CAEB2341FEB607EC395A51410661F67F88EB2341985ACB304D5A5141D0F135167EEB234155F5FF34695A5141C4B1E92C50EB234108DDBBF3735A5141ADE0BE42D6EA234122F4F33A7F5A51417594B62C16EA2341582E6FA9795A51419F24C51F6EE923414062E6AA675A5141F29FB543C4E82341520D78E95F5A5141E2DC9CF877E82341679BDFEC685A51414EBE93821CE9234100E5FD2E815A5141875FE98498E9234181836031905A51416BC304FFFEE92341BB954E249E5A5141D930D3811AEA2341186EA8E4A15A5141F8978E1748EA2341CB673DF7AD5A51412D0DE01C54EA23415EF6D92AC85A51419EFB4A1A5CEA2341B9180AE5E55A51419E5710456EEA234195DDA82FF95A514112625B4698EA234186B50B660B5B51414DC673D6C9EA23417190D5F2125B514174FEDB2E4CEB23417E9F6630145B5141EE4F5913DEEB2341309D0564205B51418A67E8434AEC234195124D26345B51412EC79E5D9EEC2341D8B2D93B4B5B5141C012AD6D0EED23414FD7F6AE685B51411468D67D46ED234112B226C47D5B514137477C9749ED234122CF85DC7E5B5141F3C6F75461ED2341F152EE81875B5141529475346AED23410A98E8EB8A5B51419DE1D87AF0EC234124AFDD3C875B5141ECDE3A72E4EC2341F6B44A38865B5141C288341540EC23418758FA2E785B5141601AE38AB2EB234192940C706E5B5141E410611738EB2341A7AFB5A4675B51419AAA39F409EA2341998F68A95F5B5141A84F394526E92341C944ABA65A5B51419EEA32D92BE82341A68C61B4585B5141C558E19936E723418A5ED97E4A5B51416210485092E62341FCC3CB32405B514154B65662CCE52341BD90F12F385B5141C266DA3B22E5234176CE7DE9385B51418A1635F50DE42341978B43E9415B514110B3B2851CE32341F0E0ECFC485B5141EA0048FE5DE22341634905BD535B5141E0500E543BE223410DA053C7575B5141A504DBCA34E22341F6DC4E95585B5141CECF910015E223414EA25E695C5B5141823FB82A2EE22341BB9188BA665B51415B4BEF5D84E22341F61EA432735B51413F70453220E323414EFCD8ED825B51415CA4D8714AE323414DEB1F2D875B5141E49166C46CE3234166388D9E8A5B514162AC470D9EE3234197D085DD8F5B51418998F42EB2E323415E355CFF915B5141F8FFCEE673E4234194152502A85B5141A489BB1EF2E423417111F47FB65B514138A971E427E52341AE5FE5BEC45B5141538DDD6FEAE42341286AB3BCD45B514159B1F6D5A7E42341F4555224E75B51414C36AAED53E42341B9BA6E03F85B51417D6D978E4EE42341DBFB9F1EF95B5141E6A32B697EE423416474DF2E015C5141A38FEE5B2AE523416E493B670F5C5141716F15E851E523413E3EB3461C5C51412CAABAA80CE52341F1426BE7295C514168AA42461EE523410B5031653A5C514102BE46431AE5234103046F414D5C5141FCE800D018E52341DA3564234F5C5141E7BB457E10E52341E8919DEC5C5C5141C1D0A642ECE4234164CB04EF715C5141B04E035FD6E4234197E0C23A795C514106FB2F8ACEE42341FAEA5565835C514179FB82689CE42341E268FE6B905C514131A9D9474AE4234116B51B81925C5141C0E81E41FAE32341A48ECC2D9A5C514139CA2CE0F5E323415704CB469B5C514189E5A546F3E32341A65118FC9B5C51417F212853EFE32341C69A39F49C5C51416C9789B4E8E3234105A4E4819E5C5141F800C190C8E32341CDED2634A65C51412863DF4F88E32341D4EA5571C05C51417680361A50E32341BE583B66CC5C5141DEC6B5579CE2234158F00AFCC25C5141F52C45F5EBE1234130894729BB5C51410BDC9D66BEE12341B2257B24CA5C5141FAB09C77ACE123411D41E246D25C5141C2A02589AAE123410F227F4AD35C51410E30D54F96E123410F1B24B1DC5C5141BEF84AA17EE123417E0B524DE95C51410275BBB279E12341B6F6B4A6EB5C51412B63D9AF59E1234138AC6E13135D51417ED24DC858E12341252ABA24145D51414A985CF257E12341C340C955155D5141686D944254E1234109A4337B195D5141C90941AD2DE123416178BE6C3C5D51418EB4F6EC29E12341C0B5E75F3F5D514148E92E2FEFE0234120398AC33D5D5141FAED2AFEDEE02341C9E4CE573D5D5141402E346684E0234173B6C2F23A5D514140E17A5CC0DF234170C85428385D51414220EB00B2DF2341B2B27ABE465D51418E327660B4DF23414570DA1E6E5D51411DBF098B70DF23413A0A3AB3715D514133B630431EDF2341D4654B68745D51413865D0AC1EDF2341FB25E126755D5141949686981EDF2341427458B5775D5141B39926B21EDF23411459937C845D51417C621B3725DF23417609D4D98A5D51416AA4780827DF23412F33CC548C5D5141CEB095DD33DF23419EA002B0985D5141607A06702EDF2341BE509463A55D5141BEEA8E6694DE2341E0461032B15D51419FAD082A1FDE2341553EAD9DBE5D5141E5DBF2AD7ADE2341271A5578CD5D5141141CD7FAAFDE23418165EA5BD65D5141CD1C9A1767DE2341FA49CC83E55D5141527684BEBBDE2341DF625F62ED5D51419641F35375DE2341B7C3FC32FF5D514192208C5E9ADE23416104483F015E5141CFC1D6ABB5DE234147038BD1025E514143A66F41DEDE23412DEEE5F5045E51416619D1A5FCDE2341AC1BC44E0A5E5141D019E24906DF2341D9CCEE670C5E5141AEBB58509BDE23416392C5BC315E5141471E40D198DE23416B37B9A1325E51419EB8955082DE2341CD4A689E3A5E51416C4D9826EFDD234141209B08365E5141F9079A74DFDD2341DA81C79B355E5141BB4FB8C9C8DC2341EA091DCD2C5E5141ACD0BEA2EDDC2341B97548341F5E5141832D24EBF0DC23418F54D6ED1D5E5141803AE02818DD23415C0869400F5E51419078B4676CDD23415A4762E3115E5141648C1A486EDD2341C430612EFB5D5141AB0265662CDD23415CAAB062F85D514130A42AB3F0DC2341CBC36BD8F65D5141284EC8191ADC23410E643A29F15D5141CA30B7F516DB2341D926D3CAEE5D5141AAAD607504DB2341853B02B4EE5D5141C8646E52ECDA234145C74B3D015E5141C084EEA8EADA23412861FD3C075E514164D24F9CEADA234191FF8E0C085E5141AB2261B1E8DA2341B732877C0E5E51419AB53B43E4DA2341099DB4FC1C5E51413029638448DA2341481C16B71C5E5141C58F873DB4D923412A6F141F1F5E5141E523D946A4D92341E0E660682E5E51412C7CCC68AAD923412D6862774B5E5141DF09B031B1D923417101F201555E5141497D0FDCB2D92341A427D71C575E5141023D8ED2B3D923414DEB8AD9585E514118D5DA29C2D92341FF179F6C6C5E5141E630FC2BC2D92341EFD9FF55765E51412C71803AC2D923411A9D9DBB855E51412690E146C2D923411F99DA378B5E51413CD888587AD92341E4CD7E9B855E5141F4EB0669F6D823416859E968795E51419892652EF1D823413E0E6E927C5E5141D1414788EED823419F8F4E177E5E51418ADA4C5FD2D82341F99F34AA8F5E514160A0FD6CCCD823417AB9FB54935E5141DE3FEB1CC5D82341381F0B22985E5141422AC87CB6D82341AA052ABCA15E51414A9EC55DB1D82341B9C21DE4A65E5141E2284290A4D823410D3CFFC7B35E514133018A8862D82341355C076BB35E514197C21D0092D723410617E67BB15E5141128602B042D723412A67D68CB05E5141164A3FFBF2D623413BF485CEAF5E514165E00661CDD6234110DE5A72AF5E51411BE4409B78D62341D7F3658FAE5E51414991A28E6CD62341EDE3476AAE5E514146796BAB32D623417C80358CAC5E514154FB7D341DD62341BC438C9CAB5E5141AE96400714D623411A7DAF66BC5E5141B67339A10ED623416AF03E47C65E51416CD96550F2D52341B72960A6DD5E51416AEDA186E6D523417F553561E75E51410949A3B5DDD52341716197C3EB5E5141F9C56835D8D523419948B22BEB5E5141C0C5494DC6D523418321A574E95E5141761C5567FAD42341ECF49A64D95E5141632E137CF1D42341031EF698D85E5141831F330634D423417E7DA2CAC55E5141E4D382382ED423410DACEA37C55E5141D491B926A4D323413CEB51F4B65E514176F34BF92DD323419FC35E63AA5E514137ACEF03F5D223417F4B4BE6A35E514136578B35A4D22341D2A1E9DF9A5E514178EF279A82D22341342B3DED965E514113B7DABF46D22341A39E12B78F5E5141AEBBF53C04D2234125A7EA2F885E5141292E2201DFD12341B367DEE4845E51410E985C77D3D12341E5F831DF835E51416F0F0693CBD1234146043B21835E5141D8A3A971BED12341820336EF815E5141D3A7E68660D123418E3923A6785E5141DB18102702D12341CF01D63C715E5141C2CCDE457ED02341753B0B246E5E5141F22A814112D023417DAC1AB56C5E51411A3E62349ECF23419920E079685E5141F02E85ED37CF23419D0AD900635E5141640F8233A8CE2341607C9807585E51415E9CC9DA9ECE2341BF2AD05C575E51414642925678CE234196905A74545E5141CABA222788CD2341FB9352B5435E514146701946FACC2341338F1F78385E51412F38B58980CC2341E7F581AE2C5E5141DBC07BE831CC234126AA6FE2245E51415FC95F3BF8CB23416C1297E61E5E5141622AD625CACB23411F8AA4EF1A5E5141FED3CA3050CB2341CA2E2DA60F5E5141546F53DF6FCA2341895A57A3FF5D51411A962F2BB2C9234184A488B1F25D5141C2E50C70DCC823419B81E2AFED5D5141AF6FD980F2C72341E6CC78B8EC5D514119BE625F26C7234184492D3DEE5D514112B85FA24CC62341F87A4B80EF5D5141BEEE56EB8FC52341EA0BF923EF5D5141FDE3D00A40C52341FD23DE30F65D5141FC45BFE613C52341D92F8AEEFC5D514122BBA06E7AC423412D776B790C5E5141CCAEFE54B8C32341A47E4D7E1C5E51414CD0C03E3CC32341C87C1F292A5E5141C994A245C2C22341F4627971345E5141322E058440C22341D53471AE395E51415D380CFC6DC123414987B3403C5E514158534EEFAFC023411BB97162435E5141CBDCBF49DEBF2341B6950DF4435E51414F78662E24BF234182802B34405E51416425F17388BE23415B89AFAC425E5141FA09DB8F15BE2341A667800A455E51419FA4594F3EBE2341BB7F912C4A5E51411CD2105382BE234155D3C9685D5E5141E37D966A9EBE2341B48F21006D5E5141F1C19C53BEBE2341ED42992E7D5E5141A88B4727F0BE23410B24BFB1925E5141BC7BEF0908BF2341F07D83B1A35E51410BC39429F2BE2341893AAEB5B65E51412C031E93D7BE2341E330E439C15E514134A51830CEBE2341C24C4BFCC45E51418BC05125B4BE23414FD5D3AFCE5E51413AA6E9EEC5BE234187DA76AEDD5E5141E45B930FC8BE2341ED2E66B8DF5E514144EC7652A0BE2341F24B1E67EE5E5141561632CD6DBE2341704A956DFD5E5141547033128ABE2341E76D24230F5F5141C7074CF293BE2341D50C58C0225F514190F67D1BA6BE2341F5E0C3EA365F51412EEAD5704ABE234162FD20313F5F5141280326CBABBD23419B2177323E5F5141848A9D6E48BD23419C9DAA303C5F51415E8AF64F2ABD23413BD8ADA23D5F5141F2CB965119BD2341A787E9773E5F5141F1464366C2BC23418F285DB6425F51410C7806EC17BC2341AEE32FAA4D5F51414A6F25758ABB23417AC8B5F85F5F51416C4C8A496ABB2341957FF1B56F5F5141392EB81470BB234112DEEFF6725F5141059F358282BB234142DFF1B67D5F51419DC16A8A6EBB2341F2B35DF98C5F514166A4A1210CBB234161B475AE955F5141C22CB304CABA234123DFC877A45F514120D28C79C2BA2341B1517427A65F51411DFF8A316ABA2341F778EBA2B35F514114CFBF45DEB92341C00A68EDC65F51415633A11A82B92341356AFDB1D35F5141A8D259161EB923413D7E1C66E35F5141D1E0C72B8EB823411B7D44FBF35F5141BC24495546B82341E11D63A3FF5F514105997D2638B8234188FB6AF101605141D232050B21B82341B53FE2F00760514187142A5AF8B7234163F1A934126051410E1BD35FD4B723410A47A26018605141BFDCD24692B72341CDABBBB21960514198977B5E86B723414558DCE7216051413AF0E73E82B72341101865282F605141686D6F817CB72341F07D52CA3F60514121C7A87D7CB72341C250C9A94060514135835ED361B723413F1B8FBC4D6051411CD9986E34B72341A43FFC1D53605141840F9F1DE0B623412790407357605141DA2DF26C88B62341455B83365C605141813DF740F8B52341685B18F06660514174CDFC36FCB5234100EA77E16F6051418E3193101CB623418C161F737B6051410214A56048B62341A4AE7BE887605141F2F227410CB7234127D4B5F3BA605141DEEC1D70D8B62341484587A4BE6051414D7F0D407CB62341A29BEA2DC460514144E7904E10B623419D1F717CC6605141EB8F5080A6B5234188C8A126C860514148A323675AB5234193F817ECCD6051415B6A973B26B52341429844F8D9605141BAA89620FCB42341C264F52DE6605141E256BE2EBEB42341901339B0F16051415C6A827580B4234121C652B2FC60514174666E3243B42341ABA5885701615141D230B15A1EB423418E48A227046151411632F9F8EDB3234180CC0EF2056151418460AECD89B32341EB1C61AE09615141495AD2EC25B32341EFA81FA219615141F4509A4792B223416EC04BFB30615141714BE9BE36B22341EE8067FE3D6151415777B15E10B22341C551367043615141861EEEEFBDB12341E1A31BE04E615141A9A73C2F84B12341C9506CD95961514195AB07E761B123417AFF6C6160615141E219A7EC2DB12341B02266AC6D6151419168D32A27B12341D76394FA6E6151410B14394E08B12341FBDCA47B7461514118CA8E3F90B023410B2B10A07E61514150DD026942B02341D877F6A786615141E4AFE92AE6AF2341D3D828328B615141B20B710DA9AF234171DCA3688D61514196129DDA6DAF2341933CF37A8F615141506D0A35DEAE234125A49874986151419448DE1DB2AE2341F988BCAEA461514112E68CD3A1AE2341B8F01C2EAC615141B4851C7D4EAE234197186F63B2615141686C341300AE2341CD080BAFB66151410A806019B2AD234133976C77BE61514118748DD06FAD2341F17D8CA5C6615141D3187A2134AD2341B8A788A2D2615141F30BD80DB8AC234154F84EEBE3615141E21AA15F2EAC234133136975F061514170D76DBEEEAB234167456339FF615141924ABC2DECAB2341E16B98FEFF61514126C00094FDAB23419A25172E0F62514179CABA2322AC23418F02FB702162514103D9BB6932AC2341335708E62B625141804EA4B22FAC2341A38309E339625141896C2F4034AC23418B5149B14562514167AF14FF2BAC23416D11FFFC4F6251410520F14A28AC23412A07187F596251419402C2D3E7AB23410A723D2863625141BD1D489357AB23415D9993246A625141BE72171118AB23410224B56F6D625141E0730281CEAA2341D04DF92E7462514172155B645CAA2341EF869BA87A62514156091921C2A923415438AE7A82625141B4ADC6F259A9234104AE2D61846251410D2ECD7BA6A8234125F2C6EC896251418BB9C89EF4A72341914F6EF68C6251413899D6FE0BA82341E64925BC96625141A81D10F75FA82341399136EFB26251413E8342830EA923415BB11568B7625141A7383B9CC2AC2341701FACF1DE6251419BCCBAFFF1AC2341DD5B613EEE6251411329B33529AE23419038F408F0625141A9BB950108B02341FF7924BEF262514164FD195A66B023411D8853344963514186846B8966B02341B5234D6D53635141960A5A1766B02341C1A1BDEA5863514177E8557C74B023412D72BFDF696351417833D14E7BB02341DF5C6E2E6D63514172C2A936EAB02341BE9D9574A3635141ED1CBAFEA8B02341A16D2345A66351413226B2D9F3B02341DBAEE2A2C6635141C5A51DB104B1234185368CBAD063514130A4DB3511B12341BBD57A07D36351417307F2F518B12341AB24B843D9635141E89358D209B1234178BD25BBD963514182FB49E1B9B023416B526D2BDC6351416103FB7D9AB02341BEFAA320DD6351419E6A092863B02341ECC97257DE635141D861D8037DB02341AE9F9E64E9635141BD1AE2908FB02341304BE1ABF36351414D74D850A4B02341CCB4BA1FFC6351418144F265B9B023417F59042D056451419AD1C42BCCB02341571492DA0F64514140FC2E21EBB02341B9689F3B1C645141B02588C0FAB023418B90AA2024645141E2BB4A5F0BB123416E4508D22D6451417D0B6BB316B1234105BB5C0032645141E7D2734523B12341A99585D9316451411DFC60F53AB12341BCC91C653164514163559F8A42B1234160281F9431645141566AEBD559B123414EB9765031645141A2D69EF052B123415AC228392F645141712357BB5FB12341B35D31752E645141FFE1937066B12341A77696F62D645141B1C009C871B1234191B4AAEE2B645141944C5A2783B1234128821CC82B64514119A6FE098EB12341F844FE9F2B6451412A5FC587ABB123414FA14CBE2B64514100A65804BFB123417ECE27812E6451410E2480CCD4B1234114F08DCE31645141128C79D8FCB123413A3B7146306451413F224A1306B22341D2B507A1316451412914BBCB32B223415BA34D6E30645141');


--
-- TOC entry 5014 (class 0 OID 25853)
-- Dependencies: 232
-- Data for Name: no_background; Type: TABLE DATA; Schema: gis_data; Owner: user_cantieri
--

INSERT INTO gis_data.no_background VALUES (0, '0103000020E61000000100000005000000FDFF060CC9C7BD3F805BFEE2DFEB4940B02A555750813F40009FC641D1EF4940A062A87D74863F4010444EF6BD683F4002609FAFF775C13F00BDBD38DB603F40FDFF060CC9C7BD3F805BFEE2DFEB4940');


--
-- TOC entry 5015 (class 0 OID 25859)
-- Dependencies: 233
-- Data for Name: puglia; Type: TABLE DATA; Schema: gis_data; Owner: user_cantieri
--



--
-- TOC entry 5016 (class 0 OID 25865)
-- Dependencies: 234
-- Data for Name: authority; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5018 (class 0 OID 25874)
-- Dependencies: 236
-- Data for Name: authorization; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5020 (class 0 OID 25882)
-- Dependencies: 238
-- Data for Name: ctx_function; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.ctx_function VALUES (1, 'Manutenzione strade');
INSERT INTO public.ctx_function VALUES (2, 'Traslochi');


--
-- TOC entry 5022 (class 0 OID 25890)
-- Dependencies: 240
-- Data for Name: ctx_title; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.ctx_title VALUES (1, 'Legale rappresentante');
INSERT INTO public.ctx_title VALUES (2, 'Amministratore delegato');
INSERT INTO public.ctx_title VALUES (3, 'Dipendente');


--
-- TOC entry 5024 (class 0 OID 25898)
-- Dependencies: 242
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.event VALUES (1, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-09-01 16:46:33.179+02', '{"id":28,"sio_id":"A6kM3ylidx4JaspgAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (2, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-09-01 16:46:39.08+02', '{"id":27,"sio_id":"A6kM3ylidx4JaspgAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (3, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-09-01 16:46:43.782+02', '{"id":26,"sio_id":"A6kM3ylidx4JaspgAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (4, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-09-01 16:46:47.575+02', '{"id":22,"sio_id":"A6kM3ylidx4JaspgAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (5, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-09-01 16:46:51.881+02', '{"id":21,"sio_id":"A6kM3ylidx4JaspgAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (6, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-09-19 18:20:11.67+02', '{"id":1,"sio_id":"rvUwYQ4hcABmjQ86AAAd","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (7, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-09-19 18:20:15.669+02', '{"id":1,"sio_id":"rvUwYQ4hcABmjQ86AAAd","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (8, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-09-19 18:36:51.1+02', '{"id":1,"sio_id":"520vrAfs3vYBeRtXAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (9, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-09-19 18:40:41.277+02', '{"id":1,"sio_id":"520vrAfs3vYBeRtXAAAB","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (10, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-07 09:46:02.408+02', '{"id":2,"sio_id":"f-qCfiNuXYmbUfvCAAAT","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (11, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-07 09:49:16.552+02', '{"id":2,"sio_id":"GZMuwA8dco6-FnOdAAAV","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (12, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-07 09:51:24.665+02', '{"id":2,"sio_id":"GZMuwA8dco6-FnOdAAAV","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (13, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-07 09:52:26.926+02', '{"id":2,"sio_id":"GZMuwA8dco6-FnOdAAAV","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (14, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-07 09:52:40.294+02', '{"id":2,"sio_id":"GZMuwA8dco6-FnOdAAAV","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (15, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-13 17:25:34.178+02', '{"id":3,"sio_id":"de7wzO5KIV3dRK87AAAC","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (16, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-13 17:25:41.568+02', '{"id":3,"sio_id":"de7wzO5KIV3dRK87AAAC","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (17, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-13 17:26:56.834+02', '{"id":3,"sio_id":"de7wzO5KIV3dRK87AAAC","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (18, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-13 17:27:10.014+02', '{"id":3,"sio_id":"de7wzO5KIV3dRK87AAAC","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (19, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 09:58:46.597+02', '{"id":4,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (20, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 09:59:27.523+02', '{"id":4,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (21, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:02:37.884+02', '{"id":4,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (22, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:03:04.415+02', '{"id":4,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (23, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:03:28.292+02', '{"id":4,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (24, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 10:07:51.092+02', '{"id":5,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (25, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:11:39.333+02', '{"id":5,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (26, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:12:43.41+02', '{"id":5,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (27, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:13:48.313+02', '{"id":5,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (28, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:16:08.148+02', '{"id":5,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (29, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 10:23:28.842+02', '{"id":6,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (30, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:24:08.491+02', '{"id":6,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (31, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:40:27.503+02', '{"id":6,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (32, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 10:42:57.512+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (33, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:43:02.136+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (34, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:43:24.155+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (35, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:43:50.567+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (36, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:44:31.882+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (37, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:44:45.226+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (38, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 10:44:52.053+02', '{"id":7,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (39, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 11:05:29.468+02', '{"id":8,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (40, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 11:05:33.336+02', '{"id":8,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (41, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-10-14 11:12:07.022+02', '{"id":8,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (42, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-14 11:14:37.606+02', '{"id":9,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (43, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-14 11:14:41.294+02', '{"id":9,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (44, NULL, 1, 0, 'EntityManager', 'Cancellazione trasloco', '2022-10-14 11:14:50.517+02', '{"id":9,"sio_id":"eEs5ed28h2Rk-h1mAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (45, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-25 17:36:04.579+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (46, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:37:49.903+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (47, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:41:19.912+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (48, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:43:19.718+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (49, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:44:14.531+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (50, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:44:38.219+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (51, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:47:57.766+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (52, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:49:43.541+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (53, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:49:54.339+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (54, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:49:59.627+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (55, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:51:08.11+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (56, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:51:16.454+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (57, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:51:33.475+02', '{"id":30,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (58, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-25 17:53:24.468+02', '{"id":31,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (59, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:57:36.096+02', '{"id":31,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (60, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:58:40.406+02', '{"id":31,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (61, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:59:12.116+02', '{"id":31,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (62, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-25 17:59:19.491+02', '{"id":31,"sio_id":"dnEPmMa57xb0MBj6AAAa","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (63, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-26 12:11:01.772+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (64, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:12:01.779+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (65, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:23:13.951+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (66, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:24:23.115+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (67, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:24:36.164+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (68, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:28:15.933+02', '{"id":32,"sio_id":"rDMBdYFoA6-LQgaLAAAs","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (69, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:31:16.409+02', '{"id":32,"sio_id":"wl6VJMsy5nO5vAU9AAAv","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (70, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:36:34.963+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (71, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:36:52.538+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (72, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:37:28.566+02', '{"id":32,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (73, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-26 12:48:17.009+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (74, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:48:36.315+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (75, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:48:54.277+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (76, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:49:06.975+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (77, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:49:58.634+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (78, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:50:03.741+02', '{"id":33,"sio_id":"IeCzQrGfdt6AemtmAAAu","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (79, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-26 12:58:58.51+02', '{"id":34,"sio_id":"tb2jO00qn1oWPofmAAAz","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (80, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:59:18.392+02', '{"id":34,"sio_id":"tb2jO00qn1oWPofmAAAz","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (81, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 12:59:41.763+02', '{"id":34,"sio_id":"tb2jO00qn1oWPofmAAAz","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (82, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-26 14:06:20.183+02', '{"id":35,"sio_id":"ToGrLPxDMoh2jJi4AAA6","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (83, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:06:38.431+02', '{"id":35,"sio_id":"ToGrLPxDMoh2jJi4AAA6","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (84, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:07:32.484+02', '{"id":35,"sio_id":"ToGrLPxDMoh2jJi4AAA6","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (85, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:11:32.714+02', '{"id":35,"sio_id":"mW7CAulekx7Y3drfAAA7","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (86, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-26 14:15:31.277+02', '{"id":36,"sio_id":"Hjl7OaEEUahQnAZ5AAA-","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (87, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:16:18.604+02', '{"id":36,"sio_id":"Hjl7OaEEUahQnAZ5AAA-","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (88, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:16:49.245+02', '{"id":36,"sio_id":"Hjl7OaEEUahQnAZ5AAA-","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (89, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:18:15.296+02', '{"id":36,"sio_id":"v2pEbVWZEw_s1U_1AAA_","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (90, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-26 14:18:22.195+02', '{"id":36,"sio_id":"v2pEbVWZEw_s1U_1AAA_","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (91, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-27 09:58:03.346+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (92, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 09:58:22.834+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (93, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 09:59:52.844+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (94, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 10:07:28.352+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (95, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 10:08:31.095+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (96, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 10:08:35.892+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (97, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-10-27 10:08:47.864+02', '{"id":37,"sio_id":"VLAWfNMWUws6BsEBAABD","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (98, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-10-27 10:39:08.34+02', '{"id":38,"sio_id":"K5hEhNAVjYcPDTjPAABJ","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (99, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-11-09 11:17:26.006+01', '{"id":39,"sio_id":"8KFK0B5CsfYmopRfAABh","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (100, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-11-09 11:18:06.003+01', '{"id":39,"sio_id":"8KFK0B5CsfYmopRfAABh","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (101, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-12-01 12:23:23.208+01', '{"id":40,"sio_id":"r5epeURJ3qgig47kAABJ","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (102, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 12:24:55.484+01', '{"id":40,"sio_id":"r5epeURJ3qgig47kAABJ","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (103, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-12-01 14:27:49.984+01', '{"id":41,"sio_id":"q7ClgpNH__Dd9X72AAAF","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (104, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 14:28:16.542+01', '{"id":41,"sio_id":"q7ClgpNH__Dd9X72AAAF","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (105, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 14:30:41.326+01', '{"id":41,"sio_id":"q7ClgpNH__Dd9X72AAAF","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (106, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 14:31:14.687+01', '{"id":41,"sio_id":"q7ClgpNH__Dd9X72AAAF","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (107, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 14:31:21.101+01', '{"id":41,"sio_id":"q7ClgpNH__Dd9X72AAAF","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (108, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-12-01 14:50:02.983+01', '{"id":42,"sio_id":"H3L3gmkenLsfJt0QAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (109, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 14:50:26.848+01', '{"id":42,"sio_id":"H3L3gmkenLsfJt0QAAAH","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (110, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 15:08:08.056+01', '{"id":42,"sio_id":"pTDrNW1a1nwJpr8tAAAP","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (111, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 15:11:14.443+01', '{"id":42,"sio_id":"pTDrNW1a1nwJpr8tAAAP","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (112, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 15:11:18.674+01', '{"id":42,"sio_id":"pTDrNW1a1nwJpr8tAAAP","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (113, NULL, 1, 0, 'EntityManager', 'Inserimento trasloco', '2022-12-01 15:14:13.588+01', '{"id":43,"sio_id":"pTDrNW1a1nwJpr8tAAAP","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);
INSERT INTO public.event VALUES (114, NULL, 1, 0, 'EntityManager', 'Aggiornamento trasloco', '2022-12-01 15:14:31.9+01', '{"id":43,"sio_id":"pTDrNW1a1nwJpr8tAAAP","layerName":["view_traslochi_aperti"]}', NULL, NULL, NULL);


--
-- TOC entry 5026 (class 0 OID 25908)
-- Dependencies: 244
-- Data for Name: event_type; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.event_type VALUES (1, 'refreshMap', NULL);


--
-- TOC entry 5028 (class 0 OID 25916)
-- Dependencies: 246
-- Data for Name: event_type_permission; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5029 (class 0 OID 25919)
-- Dependencies: 247
-- Data for Name: gt_pk_metadata; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.gt_pk_metadata VALUES ('public', 'view_cantieri', 'id', NULL, 'sequence', 'roadsite_id_seq');
INSERT INTO public.gt_pk_metadata VALUES ('public', 'view_public_cantieri', 'id', NULL, 'sequence', 'roadsite_id_seq');


--
-- TOC entry 5030 (class 0 OID 25923)
-- Dependencies: 248
-- Data for Name: i18n; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.i18n VALUES (1, 'WORDS', NULL, 1);
INSERT INTO public.i18n VALUES (2, 'OPERATOR', NULL, 1);
INSERT INTO public.i18n VALUES (3, 'CORE_TLP', NULL, 1);
INSERT INTO public.i18n VALUES (4, 'CORE_LBL', NULL, 1);
INSERT INTO public.i18n VALUES (5, 'CORE_MSG', NULL, 1);
INSERT INTO public.i18n VALUES (6, 'MENU', NULL, 1);
INSERT INTO public.i18n VALUES (7, 'WEBGIS', NULL, 1);
INSERT INTO public.i18n VALUES (8, 'TLP', 7, 2);
INSERT INTO public.i18n VALUES (9, 'MEASURES', 7, 2);
INSERT INTO public.i18n VALUES (10, 'SEARCH', 7, 2);
INSERT INTO public.i18n VALUES (11, 'GEOSERVICE', 7, 2);
INSERT INTO public.i18n VALUES (12, 'LEGEND', 7, 2);
INSERT INTO public.i18n VALUES (13, 'LAYER', 7, 2);
INSERT INTO public.i18n VALUES (14, 'STYLE', 7, 2);
INSERT INTO public.i18n VALUES (15, 'USER_ROLE', NULL, 1);
INSERT INTO public.i18n VALUES (17, 'ROADSITE', NULL, 1);
INSERT INTO public.i18n VALUES (18, 'MOVE', NULL, 1);
INSERT INTO public.i18n VALUES (19, 'REGISTRATION', NULL, 1);


--
-- TOC entry 5032 (class 0 OID 25928)
-- Dependencies: 250
-- Data for Name: i18n_string; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.i18n_string VALUES (545, 17, 'PROJECT_ATTACH', 'Progetto', 'Project');
INSERT INTO public.i18n_string VALUES (546, 17, 'AUTHORIZATION_ATTACH', 'Autorizzazione', 'Authorization');
INSERT INTO public.i18n_string VALUES (548, 17, 'APPROVED_USER', 'Utente approvatore', 'Approved user');
INSERT INTO public.i18n_string VALUES (547, 17, 'COORD_COMMUNICATION_ATTACH', 'Comunicazione coordinamento', 'Coord communication');
INSERT INTO public.i18n_string VALUES (551, 17, 'REQUEST_STATUS', 'Stato della richiesta', 'Request status');
INSERT INTO public.i18n_string VALUES (554, 17, 'APPROVE', 'Approva', 'Approve');
INSERT INTO public.i18n_string VALUES (555, 17, 'REJECT', 'Nega', 'Reject');
INSERT INTO public.i18n_string VALUES (561, 6, 'MENU_AUTH_2', 'Modifica', 'Modify');
INSERT INTO public.i18n_string VALUES (564, 4, 'NO_CHANGES_MSG', 'Nessuna modifica da salvare', 'No changes to save');
INSERT INTO public.i18n_string VALUES (567, 13, 'CAT_11', 'Traslochi', 'Traslochi');
INSERT INTO public.i18n_string VALUES (585, 12, 'LEGEND_41', 'Autorizzati', 'Authorized');
INSERT INTO public.i18n_string VALUES (587, 12, 'LEGEND_43', 'In redazione', 'In redazione');
INSERT INTO public.i18n_string VALUES (590, 13, 'LAY_48', 'Aperti', 'Open');
INSERT INTO public.i18n_string VALUES (596, 13, 'LAY_56', '2022', '2022');
INSERT INTO public.i18n_string VALUES (593, 13, 'LAY_52', 'Autorizzato', 'Authorized');
INSERT INTO public.i18n_string VALUES (599, 12, 'LEGEND_59', 'Autorizzato', 'Authorized');
INSERT INTO public.i18n_string VALUES (570, 13, 'LAY_14', 'Autorizzato', 'Authorized');
INSERT INTO public.i18n_string VALUES (577, 13, 'LAY_21', 'Preso in carico', 'Managed');
INSERT INTO public.i18n_string VALUES (602, 12, 'LEGEND_62', 'In corso', 'In corso');
INSERT INTO public.i18n_string VALUES (625, 1, 'DATE_TIME', 'Data e ora', 'Date and time');
INSERT INTO public.i18n_string VALUES (500, 6, 'MENU_ROADSITE_1', 'Elenco', 'List');
INSERT INTO public.i18n_string VALUES (582, 13, 'LAY_36', 'Cantieri in corso', 'Cantieri in corso');
INSERT INTO public.i18n_string VALUES (632, 18, 'START_DATE_GREATER_END_DATE', 'La data di inizio è maggiore della data di fine', 'Start date is greater than end date');
INSERT INTO public.i18n_string VALUES (637, 1, 'ZOOM_TO', 'Vai in mappa', 'Zoom to');
INSERT INTO public.i18n_string VALUES (550, 17, 'PROTOCOL_APPROVED_DATE', 'Data protocollo provvedimento', 'Approved protocol date');
INSERT INTO public.i18n_string VALUES (549, 17, 'APPROVED_ATTACH', 'Provvedimento', 'Approved');
INSERT INTO public.i18n_string VALUES (643, 17, 'START_DATE_NOT_VALID', 'Data di inizio/fine attività di manutenzione strade non valida. E'' antecedente alla data di richiesta', 'Invalid start/end date. It is earlier to the request date');
INSERT INTO public.i18n_string VALUES (562, 6, 'MENU_AUTH_1', 'Registrazione', 'Registration');
INSERT INTO public.i18n_string VALUES (506, 13, 'LAY_4', 'Cantieri aperti', 'Open');
INSERT INTO public.i18n_string VALUES (648, 17, 'NO_DELETE_ROADSITE', 'Non è possibile cancellare il cantiere selezionato in quanto la richiesta è sta già processata.', 'It is not possible to delete the selected site because the request is processed');
INSERT INTO public.i18n_string VALUES (507, 7, 'EDITING_LBL', 'Editabile', 'Editable');
INSERT INTO public.i18n_string VALUES (508, 7, 'GOTO_FT_PANEL', 'Ritorna alla scheda', 'Return to the sheet');
INSERT INTO public.i18n_string VALUES (509, 7, 'GOTO_FEATURE_MSG', 'Modifica la feature e al termine premi il tasto per ritornare alla scheda relativa', 'Edit the feature and at the end press the key to return to the related panel');
INSERT INTO public.i18n_string VALUES (511, 7, 'DRAW_HOLE_FEATURE_MSG', 'Disegna un area all''interno di un poligono', 'Draw hole into a polygon');
INSERT INTO public.i18n_string VALUES (512, 7, 'HOLE_FEATURE', 'Buco in feature', 'Draw hole into feature');
INSERT INTO public.i18n_string VALUES (513, 7, 'SHP_GEOM_ERR', 'Lo shapefile contiene più geometrie', 'Loaded shapefile contains more than 1 geometry');
INSERT INTO public.i18n_string VALUES (514, 7, 'NO_SHP_ERR', 'Il file caricato non è uno shapefile', 'Loaded file isn''t shapefile');
INSERT INTO public.i18n_string VALUES (515, 7, 'SHP_NAME_ERR', 'I file che compongono lo shape non hanno lo stesso nome', 'The shapefile''s files (.shp, .shx, .dbf, .prj) have not the same name');
INSERT INTO public.i18n_string VALUES (516, 7, 'SELECT_GEOM_TYPE_TO_EDIT', 'Seleziona il tipo di geometria da editare', 'Select geom type to edit');
INSERT INTO public.i18n_string VALUES (517, 7, 'POINT', 'Punto', 'Point');
INSERT INTO public.i18n_string VALUES (518, 7, 'LINE', 'Linea', 'Line');
INSERT INTO public.i18n_string VALUES (519, 7, 'POLYGON', 'Poligono', 'Polygon');
INSERT INTO public.i18n_string VALUES (525, 1, 'GEOMETRY', 'Geometria', 'Geometry');
INSERT INTO public.i18n_string VALUES (526, 17, 'SUBTITLE_ROADSITE_NO_GEOM', 'Aggiungere la geometria di un cantiere disegnandola o inserendo uno shapefile con geometria di tipo puntuale, lineare o poligonale (selezionare un file zip contenente i file costituenti lo shapefile)', 'Add a geometry roadsite, drawing it or inserting a point, linear or polygonal geometry shapefile (select a zip file containing shapefile files components)');
INSERT INTO public.i18n_string VALUES (527, 17, 'SUBTITLE_ROADSITE_GEOM', 'E'' possibile modificare la geometria del cantiere selezionato', 'It is possible to modify the selected roadsite geometry');
INSERT INTO public.i18n_string VALUES (528, 17, 'ADD_DRAW_ROADSITE', 'Disegna la geometria del cantiere', 'Draw roadsite geometry');
INSERT INTO public.i18n_string VALUES (529, 17, 'ADD_SHP_ROADSITE', 'Inserisci shapefile del cantiere', 'Add roadsite shapefile');
INSERT INTO public.i18n_string VALUES (530, 4, 'NOT_VALID', 'Alcuni valori inseriti non sono validi!', 'Some inserted values are not valid!');
INSERT INTO public.i18n_string VALUES (531, 17, 'SEND_REQUEST', 'Invia richiesta', 'Send request');
INSERT INTO public.i18n_string VALUES (534, 4, 'FEATURE_OUT_OF_BOUNDARY', 'La feature disegnata è al di fuori dei limiti territoriali di competenza', 'The feature drawn is outside the territorial limits of competence');
INSERT INTO public.i18n_string VALUES (535, 5, 'ERR_EDIT_FEATURES', 'Si è verificato un errore nell''editing della feature', 'An error occurred while editing the feature');
INSERT INTO public.i18n_string VALUES (536, 5, 'SHP_GEOM_TYPE_ERR', 'Lo shapefile contiene delle geometrie di tipo differente dal livello informativo ', 'The shapefile contains geometries of a different type from the selected layer');
INSERT INTO public.i18n_string VALUES (537, 5, 'SHP_PARSE_ERR', 'Si è verificato un errore durante la lettura dei dati dello shapefile', 'An error occurred while reading the shapefile data');
INSERT INTO public.i18n_string VALUES (538, 5, 'SHP_LOAD_OK', 'Lo shapefile è stato caricato correttamente', 'Shapefile loaded successfully');
INSERT INTO public.i18n_string VALUES (504, 17, 'PROTOCOL_REQUEST_NUMBER', 'N. protocollo richiesta', 'Protocol request number');
INSERT INTO public.i18n_string VALUES (557, 6, 'MENU_MOVE', 'Traslochi', 'Move');
INSERT INTO public.i18n_string VALUES (552, 6, 'MENU_AUTH', 'Azienda', 'Company');
INSERT INTO public.i18n_string VALUES (583, 12, 'LEGEND_39', 'In corso', 'In corso');
INSERT INTO public.i18n_string VALUES (588, 12, 'LEGEND_44', '2022', '2022');
INSERT INTO public.i18n_string VALUES (597, 12, 'LEGEND_57', 'Inviati', 'Send');
INSERT INTO public.i18n_string VALUES (594, 13, 'LAY_54', 'Negato', 'Unauthorized');
INSERT INTO public.i18n_string VALUES (600, 12, 'LEGEND_60', 'Negato', 'Negato');
INSERT INTO public.i18n_string VALUES (591, 13, 'LAY_50', 'Inviato', 'Send');
INSERT INTO public.i18n_string VALUES (626, 18, 'APPROVAL', 'Approvazione', 'Approval');
INSERT INTO public.i18n_string VALUES (627, 1, 'OUTCOME', 'Esito', 'Outcome');
INSERT INTO public.i18n_string VALUES (628, 18, 'MANAGE_REQUEST', 'Prendi in carico', 'Manage request');
INSERT INTO public.i18n_string VALUES (556, 6, 'MENU_MOVE_1', 'Elenco', 'List');
INSERT INTO public.i18n_string VALUES (638, 1, 'COMPANY', 'Azienda', 'Company');
INSERT INTO public.i18n_string VALUES (575, 13, 'LAY_16', 'Cantieri chiusi', 'Chiusi');
INSERT INTO public.i18n_string VALUES (1, 1, 'LEVEL', 'Livello', 'Level');
INSERT INTO public.i18n_string VALUES (2, 1, 'LAST_SEGMENT', 'Ultimo segmento', 'Last segment');
INSERT INTO public.i18n_string VALUES (3, 1, 'SURFACES', 'Superfici', 'Surfaces');
INSERT INTO public.i18n_string VALUES (4, 1, 'PERIMETER', 'Perimetro', 'Perimeter');
INSERT INTO public.i18n_string VALUES (5, 1, 'REFERENCE_SYSTEM', 'Sistema di riferimento', 'Reference system');
INSERT INTO public.i18n_string VALUES (6, 1, 'COORDS_CONVERT', 'Conversione coordinate', 'Coordinates conversion');
INSERT INTO public.i18n_string VALUES (7, 1, 'NEW_REFERENCE_SYSTEM', 'Nuovo sistema di riferimento', 'New reference system');
INSERT INTO public.i18n_string VALUES (649, 18, 'NO_DELETE_MOVE', 'Non è possibile cancellare il trasloco selezionato in quanto la richiesta è stata già processata.', 'It is not possible to delete the selected site because the request is processed');
INSERT INTO public.i18n_string VALUES (8, 1, 'RESULT', 'Risultati', 'Result');
INSERT INTO public.i18n_string VALUES (9, 1, 'PROVINCE', 'Provincia', 'Province');
INSERT INTO public.i18n_string VALUES (10, 1, 'CONVERT', 'Converti', 'Convert');
INSERT INTO public.i18n_string VALUES (11, 1, 'UNTIL_TO', 'Fino a', 'Until to');
INSERT INTO public.i18n_string VALUES (12, 1, 'CLASS', 'Classe', 'Class');
INSERT INTO public.i18n_string VALUES (13, 1, 'CONCESSION', 'Concessione', 'Concession');
INSERT INTO public.i18n_string VALUES (14, 1, 'REGISTRY', 'Anagrafe', 'Registry');
INSERT INTO public.i18n_string VALUES (15, 1, 'NUMBER', 'Numero', 'Number');
INSERT INTO public.i18n_string VALUES (16, 1, 'TOPONYM', 'Toponimo', 'Toponym');
INSERT INTO public.i18n_string VALUES (17, 1, 'ATTACHMENT', 'Allegato', 'Attachment');
INSERT INTO public.i18n_string VALUES (18, 1, 'ATTACHMENTS', 'Allegati', 'Attachments');
INSERT INTO public.i18n_string VALUES (19, 1, 'LAND', 'Terreno', 'Land');
INSERT INTO public.i18n_string VALUES (20, 1, 'LANDS', 'Terreni', 'Lands');
INSERT INTO public.i18n_string VALUES (21, 1, 'RESULTS_NUMBER', 'Numero Risultati', 'Results Number');
INSERT INTO public.i18n_string VALUES (22, 1, 'SCALE', 'Scala', 'Scale');
INSERT INTO public.i18n_string VALUES (23, 1, 'ACCEPT', 'Accetta', 'Accept');
INSERT INTO public.i18n_string VALUES (24, 1, 'DECLINE', 'Declina', 'Decline');
INSERT INTO public.i18n_string VALUES (25, 1, 'PROTOCOL', 'Protocollo', 'Protocol');
INSERT INTO public.i18n_string VALUES (26, 1, 'CERTIFICATE', 'Certificato', 'Certificate');
INSERT INTO public.i18n_string VALUES (27, 1, 'INFO', 'Informazioni', 'Information');
INSERT INTO public.i18n_string VALUES (28, 1, 'LEGISLATIONS', 'Normativa', 'Legislations');
INSERT INTO public.i18n_string VALUES (29, 1, 'ZONE', 'Zona', 'Area');
INSERT INTO public.i18n_string VALUES (30, 1, 'PERCENTAGE', 'Percentuale', 'Percentage');
INSERT INTO public.i18n_string VALUES (31, 1, 'ARTICLE', 'Articolo', 'Article');
INSERT INTO public.i18n_string VALUES (32, 1, 'LEGAL_PERSON', 'Persona giuridica', 'Legal person');
INSERT INTO public.i18n_string VALUES (33, 1, 'NATURAL_PERSON', 'Persona fisica', 'Natural person');
INSERT INTO public.i18n_string VALUES (34, 1, 'VAT', 'Partita iva', 'VAT registration number ');
INSERT INTO public.i18n_string VALUES (35, 1, 'POSTAL_CODE', 'CAP', 'Postal code');
INSERT INTO public.i18n_string VALUES (36, 1, 'BIRTH_PLACE', 'Comune di nascita', 'Birth place');
INSERT INTO public.i18n_string VALUES (37, 1, 'ADVANCED_SEARCH', 'Ricerca avanzata', 'Advanced search');
INSERT INTO public.i18n_string VALUES (38, 1, 'PREVIEW', 'Anteprima', 'Preview');
INSERT INTO public.i18n_string VALUES (39, 1, 'BUSINESS_NAME', 'Ragione sociale', 'Business name');
INSERT INTO public.i18n_string VALUES (40, 1, 'ADDRESS', 'Indirizzo', 'Address');
INSERT INTO public.i18n_string VALUES (41, 1, 'APARTMENT_NUMBER', 'Interno', 'Apartment number');
INSERT INTO public.i18n_string VALUES (42, 1, 'SURFACE', 'Superficie', 'Surface');
INSERT INTO public.i18n_string VALUES (43, 1, 'SUBALTERN', 'Subalterno', 'Subaltern');
INSERT INTO public.i18n_string VALUES (44, 1, 'DENOMINATOR', 'Denominatore', 'Denominator');
INSERT INTO public.i18n_string VALUES (45, 1, 'NUMERATOR', 'Numeratore', 'Numerator');
INSERT INTO public.i18n_string VALUES (46, 1, 'QUERY', 'Interrogazione', 'Query');
INSERT INTO public.i18n_string VALUES (47, 1, 'OWNERS', 'Proprietari', 'Owners');
INSERT INTO public.i18n_string VALUES (48, 1, 'HIGH', 'Alta', 'High');
INSERT INTO public.i18n_string VALUES (49, 1, 'MEDIUM', 'Media', 'Medium');
INSERT INTO public.i18n_string VALUES (50, 1, 'LOW', 'Bassa', 'Low');
INSERT INTO public.i18n_string VALUES (51, 1, 'ATTRIBUTE', 'Attributo', 'Attribute');
INSERT INTO public.i18n_string VALUES (52, 1, 'SEX', 'Sesso', 'Sex');
INSERT INTO public.i18n_string VALUES (53, 1, 'TAX_CODE', 'Codice fiscale', 'Tax code');
INSERT INTO public.i18n_string VALUES (54, 1, 'CLASSES', 'Classi', 'Classes');
INSERT INTO public.i18n_string VALUES (55, 1, 'EXTERNAL', 'Esterna', 'External');
INSERT INTO public.i18n_string VALUES (56, 1, 'ADVANCED', 'Avanzate', 'Advanced');
INSERT INTO public.i18n_string VALUES (57, 1, 'ICON', 'Icona', 'Icon');
INSERT INTO public.i18n_string VALUES (58, 1, 'OPACITY', 'Opacità', 'Opacity');
INSERT INTO public.i18n_string VALUES (59, 1, 'VERSION', 'Versione', 'Version');
INSERT INTO public.i18n_string VALUES (60, 1, 'FORMAT', 'Formato', 'Format');
INSERT INTO public.i18n_string VALUES (61, 1, 'PROJECTION', 'Proiezione', 'Projection');
INSERT INTO public.i18n_string VALUES (62, 1, 'DISTANCE', 'Distanze', 'Distance');
INSERT INTO public.i18n_string VALUES (63, 1, 'SERVICE', 'Servizio', 'Service');
INSERT INTO public.i18n_string VALUES (64, 1, 'PROPERTY', 'Immobile', 'Immobile');
INSERT INTO public.i18n_string VALUES (65, 1, 'REALTY', 'Immobili', 'Realty');
INSERT INTO public.i18n_string VALUES (66, 1, 'PARCELS', 'Particelle', 'Parcels');
INSERT INTO public.i18n_string VALUES (67, 1, 'CADASTRAL_CODE', 'Codice Catastale', 'Cadastral Code');
INSERT INTO public.i18n_string VALUES (68, 1, 'NOMINATIVE', 'Nominativo', 'Nominative');
INSERT INTO public.i18n_string VALUES (69, 1, 'X_COORD', 'Coordinata x', 'x coordinates');
INSERT INTO public.i18n_string VALUES (70, 1, 'PARCEL', 'Particella', 'Parcel');
INSERT INTO public.i18n_string VALUES (71, 1, 'Y_COORD', 'Coordinata y', 'y coordinates');
INSERT INTO public.i18n_string VALUES (72, 1, 'Z_COORD', 'Coordinata z', 'z coordinates');
INSERT INTO public.i18n_string VALUES (73, 1, 'LONGITUDE', 'Longitudine', 'Longitude');
INSERT INTO public.i18n_string VALUES (74, 1, 'ALTITUDE', 'Altitudine', 'Altitude');
INSERT INTO public.i18n_string VALUES (75, 1, 'GENERAL', 'Generale', 'General');
INSERT INTO public.i18n_string VALUES (76, 1, 'CATEGORY', 'Categoria', 'Category');
INSERT INTO public.i18n_string VALUES (77, 1, 'ROLE', 'Ruolo', 'Role');
INSERT INTO public.i18n_string VALUES (78, 1, 'ENABLED', 'Abilitato', 'Enabled');
INSERT INTO public.i18n_string VALUES (79, 1, 'APPLICATION', 'Applicazione', 'Application');
INSERT INTO public.i18n_string VALUES (80, 1, 'PERMISSION', 'Permesso', 'Permission');
INSERT INTO public.i18n_string VALUES (81, 1, 'CREDITS', 'Crediti', 'Credits');
INSERT INTO public.i18n_string VALUES (82, 1, 'STATUS', 'Stato', 'Status');
INSERT INTO public.i18n_string VALUES (83, 1, 'EDITING', 'Editing', 'Editing');
INSERT INTO public.i18n_string VALUES (84, 1, 'USER', 'Utente', 'User');
INSERT INTO public.i18n_string VALUES (85, 1, 'SYSTEM', 'Sistema', 'System');
INSERT INTO public.i18n_string VALUES (86, 1, 'TRAINING', 'Esercitazione', 'Training');
INSERT INTO public.i18n_string VALUES (87, 1, 'CHARTS', 'Grafici', 'Charts');
INSERT INTO public.i18n_string VALUES (88, 1, 'MONOGRAPHS', 'Monografie', 'Monographs');
INSERT INTO public.i18n_string VALUES (89, 1, 'YEAR', 'Anno', 'Year');
INSERT INTO public.i18n_string VALUES (90, 1, 'NOTE', 'Note', 'Note');
INSERT INTO public.i18n_string VALUES (91, 1, 'AVAILABLE', 'Disponibile', 'Available');
INSERT INTO public.i18n_string VALUES (92, 1, 'UNIT', 'Unità', 'Unit');
INSERT INTO public.i18n_string VALUES (93, 1, 'SECTION', 'Sezione', 'Section');
INSERT INTO public.i18n_string VALUES (94, 1, 'FOLDER', 'Cartella', 'Folder');
INSERT INTO public.i18n_string VALUES (95, 1, 'DOCUMENTS', 'Documenti', 'Documents');
INSERT INTO public.i18n_string VALUES (96, 1, 'INSERT', 'Inserisci', 'Insert');
INSERT INTO public.i18n_string VALUES (97, 1, 'BIRTH_DATE', 'Data di nascita', 'Date of birth');
INSERT INTO public.i18n_string VALUES (98, 1, 'AUTHOR', 'Autore', 'Author');
INSERT INTO public.i18n_string VALUES (99, 1, 'NEW_FOLDER', 'Nuova Cartella', 'New Folder');
INSERT INTO public.i18n_string VALUES (100, 1, 'NEW_FILE', 'Nuovo File', 'New File');
INSERT INTO public.i18n_string VALUES (101, 1, 'BROWSE', 'Sfoglia', 'Browse');
INSERT INTO public.i18n_string VALUES (102, 1, 'DOWNLOAD', 'Download', 'Download');
INSERT INTO public.i18n_string VALUES (103, 1, 'RECIPIENT', 'Destinatario', 'Recipient');
INSERT INTO public.i18n_string VALUES (104, 1, 'SUBJECT', 'Oggetto', 'Subject');
INSERT INTO public.i18n_string VALUES (105, 1, 'TEXT', 'Testo', 'Text');
INSERT INTO public.i18n_string VALUES (106, 1, 'SENDER', 'Mittente', 'Sender');
INSERT INTO public.i18n_string VALUES (107, 1, 'PAPER', 'Foglio', 'Paper');
INSERT INTO public.i18n_string VALUES (108, 1, 'SUPERVISOR', 'Supervisore', 'Supervisor');
INSERT INTO public.i18n_string VALUES (109, 1, 'NEW', 'Nuovo', 'New');
INSERT INTO public.i18n_string VALUES (110, 1, 'NAME_SURNAME', 'Nome e Cognome', 'Name and Surname');
INSERT INTO public.i18n_string VALUES (111, 1, 'LENGTH', 'Lunghezza', 'Length');
INSERT INTO public.i18n_string VALUES (112, 1, 'FROM', 'Da', 'From');
INSERT INTO public.i18n_string VALUES (113, 1, 'TO', 'A', 'To');
INSERT INTO public.i18n_string VALUES (114, 1, 'REPORT', 'Report', 'Report');
INSERT INTO public.i18n_string VALUES (115, 1, 'EVALUATED', 'Valutato', 'Evaluated');
INSERT INTO public.i18n_string VALUES (116, 1, 'TABLE', 'Tabella', 'Table');
INSERT INTO public.i18n_string VALUES (117, 1, 'NOT_AVAILABLE', 'Non disponibile', 'Not available');
INSERT INTO public.i18n_string VALUES (118, 1, 'FREE', 'Libero', 'Free');
INSERT INTO public.i18n_string VALUES (119, 1, 'AREA', 'Area', 'Area');
INSERT INTO public.i18n_string VALUES (120, 1, 'TEAMS', 'Squadre', 'Teams');
INSERT INTO public.i18n_string VALUES (121, 1, 'WEATHER', 'Meteo', 'Weather');
INSERT INTO public.i18n_string VALUES (122, 1, 'USERS', 'Utenti', 'Users');
INSERT INTO public.i18n_string VALUES (123, 1, 'DETAIL', 'Dettaglio', 'Detail');
INSERT INTO public.i18n_string VALUES (124, 1, 'ANALYSIS', 'Analisi', 'Analysis');
INSERT INTO public.i18n_string VALUES (125, 1, 'AMBULANCES', 'Ambulanze', 'Ambulances');
INSERT INTO public.i18n_string VALUES (126, 1, 'MEN', 'Uomini', 'Men');
INSERT INTO public.i18n_string VALUES (127, 1, 'START', 'Inizio', 'Start');
INSERT INTO public.i18n_string VALUES (128, 1, 'END', 'Fine', 'End');
INSERT INTO public.i18n_string VALUES (129, 1, 'DATA', 'Dati', 'Data');
INSERT INTO public.i18n_string VALUES (130, 1, 'PRINT', 'Stampa', 'Print');
INSERT INTO public.i18n_string VALUES (131, 1, 'OCCURRENCE', 'Occorrenze', 'Occurence');
INSERT INTO public.i18n_string VALUES (132, 1, 'VALID', 'Valido', 'Valid');
INSERT INTO public.i18n_string VALUES (133, 1, 'BUSY', 'Occupato', 'Busy');
INSERT INTO public.i18n_string VALUES (134, 1, 'INTENSITY', 'Intensità', 'Intensity');
INSERT INTO public.i18n_string VALUES (135, 1, 'COVERED', 'Rivestito', 'Covered');
INSERT INTO public.i18n_string VALUES (136, 1, 'NATURAL', 'Naturale', 'Natural');
INSERT INTO public.i18n_string VALUES (137, 1, 'NOT_VALID', 'Non Valido', 'Invalid');
INSERT INTO public.i18n_string VALUES (138, 1, 'BUILD_IN', 'Incassato', 'Build-in');
INSERT INTO public.i18n_string VALUES (139, 1, 'OTHER', 'Altro', 'Other');
INSERT INTO public.i18n_string VALUES (140, 1, 'SPECIFY', 'Specificare', 'Specify');
INSERT INTO public.i18n_string VALUES (141, 1, 'MIXED', 'Misto', 'Mixed');
INSERT INTO public.i18n_string VALUES (142, 1, 'ACTIVITY', 'Attività', 'Activity');
INSERT INTO public.i18n_string VALUES (143, 1, 'EVALUATION', 'Valutazione', 'Evaluation');
INSERT INTO public.i18n_string VALUES (144, 1, 'CODE', 'Codice', 'Code');
INSERT INTO public.i18n_string VALUES (145, 1, 'SHEET', 'Scheda', 'Sheet');
INSERT INTO public.i18n_string VALUES (146, 1, 'APPEARANCE', 'Aspetto', 'Appearance');
INSERT INTO public.i18n_string VALUES (147, 1, 'PRESENCE', 'Presenza', 'Presence');
INSERT INTO public.i18n_string VALUES (148, 1, 'PLACE', 'Località', 'Place');
INSERT INTO public.i18n_string VALUES (149, 1, 'TODAY', 'Oggi', 'Today');
INSERT INTO public.i18n_string VALUES (150, 1, 'PHONE', 'Numero di telefono', 'Telephone number');
INSERT INTO public.i18n_string VALUES (151, 1, 'NOW', 'Adesso', 'Now');
INSERT INTO public.i18n_string VALUES (152, 1, 'TIME', 'Orario', 'Time');
INSERT INTO public.i18n_string VALUES (153, 1, 'MODULE', 'Modulo', 'Module');
INSERT INTO public.i18n_string VALUES (154, 1, 'LOGIN', 'Login', 'Login');
INSERT INTO public.i18n_string VALUES (155, 1, 'TOOLSMAP', 'Strumenti cartografici', 'Map tools');
INSERT INTO public.i18n_string VALUES (156, 1, 'SURNAME', 'Cognome', 'Surname');
INSERT INTO public.i18n_string VALUES (157, 1, 'EVENT', 'Evento', 'Event');
INSERT INTO public.i18n_string VALUES (158, 1, 'COORDINATE', 'Coordinate', 'Coordinates');
INSERT INTO public.i18n_string VALUES (159, 1, 'LATITUDE', 'Latitudine', 'Latitude');
INSERT INTO public.i18n_string VALUES (160, 1, 'DEVICE', 'Dispositivo', 'Device');
INSERT INTO public.i18n_string VALUES (161, 1, 'ADD', 'Aggiungi', 'Add');
INSERT INTO public.i18n_string VALUES (162, 1, 'BASIN', 'Bacino', 'Basin');
INSERT INTO public.i18n_string VALUES (163, 1, 'WARNING', 'Attenzione', 'Warning');
INSERT INTO public.i18n_string VALUES (164, 1, 'CONSULT', 'Consulta', 'Consult');
INSERT INTO public.i18n_string VALUES (165, 1, 'PHOTO', 'Foto', 'Photo');
INSERT INTO public.i18n_string VALUES (166, 1, 'UPDATE', 'Aggiorna', 'Update');
INSERT INTO public.i18n_string VALUES (167, 1, 'SOURCE', 'Sorgente', 'Source');
INSERT INTO public.i18n_string VALUES (168, 1, 'SEND', 'Invia', 'Send');
INSERT INTO public.i18n_string VALUES (169, 1, 'CLOSE', 'Chiudi', 'Close');
INSERT INTO public.i18n_string VALUES (170, 1, 'SURVEILLANCE', 'Sorveglianza', 'Surveillance');
INSERT INTO public.i18n_string VALUES (171, 1, 'MONITORING', 'Monitoraggio', 'Monitoring');
INSERT INTO public.i18n_string VALUES (172, 1, 'OF', 'di', 'of');
INSERT INTO public.i18n_string VALUES (173, 1, 'YES', 'Si', 'Yes');
INSERT INTO public.i18n_string VALUES (174, 1, 'SEARCH', 'Ricerca', 'Search');
INSERT INTO public.i18n_string VALUES (175, 1, 'USERNAME', 'Nome utente', 'Username');
INSERT INTO public.i18n_string VALUES (176, 1, 'PASSWORD', 'Password', 'Password');
INSERT INTO public.i18n_string VALUES (177, 1, 'GUIDEBOOK', 'Guida', 'Guidebook');
INSERT INTO public.i18n_string VALUES (178, 1, 'MEASURES', 'Misure', 'Measures');
INSERT INTO public.i18n_string VALUES (179, 1, 'TRANSPARENCY', 'Trasparenza', 'Trasparency');
INSERT INTO public.i18n_string VALUES (180, 1, 'MODIFY', 'Modifica', 'Modify');
INSERT INTO public.i18n_string VALUES (181, 1, 'CANCEL', 'Annulla', 'Cancel');
INSERT INTO public.i18n_string VALUES (182, 1, 'SAVE', 'Salva', 'Save');
INSERT INTO public.i18n_string VALUES (183, 1, 'NAME', 'Nome', 'Name');
INSERT INTO public.i18n_string VALUES (184, 1, 'EMAIL', 'Email', 'Email');
INSERT INTO public.i18n_string VALUES (185, 1, 'DESCRIPTION', 'Descrizione', 'Description');
INSERT INTO public.i18n_string VALUES (186, 1, 'AUTHORITY', 'Ente', 'Authority');
INSERT INTO public.i18n_string VALUES (187, 1, 'CONFIRM', 'Conferma', 'Confirm');
INSERT INTO public.i18n_string VALUES (188, 1, 'DATE', 'Data', 'Date');
INSERT INTO public.i18n_string VALUES (189, 1, 'DELETE', 'Elimina', 'Delete');
INSERT INTO public.i18n_string VALUES (190, 1, 'EXPORT', 'Esporta', 'Export');
INSERT INTO public.i18n_string VALUES (191, 1, 'SENSOR', 'Sensori', 'Sensor');
INSERT INTO public.i18n_string VALUES (192, 1, 'TYPE', 'Tipologia', 'Type');
INSERT INTO public.i18n_string VALUES (193, 1, 'MUNICIPALITY', 'Comune', 'Municipality');
INSERT INTO public.i18n_string VALUES (194, 1, 'SELECTED_POINT', 'Coordinate interrogate', 'Consulted coordinates');
INSERT INTO public.i18n_string VALUES (195, 1, 'IMAGE', 'Immagine', 'Image');
INSERT INTO public.i18n_string VALUES (196, 1, 'RADIUS', 'Raggio', 'Radius');
INSERT INTO public.i18n_string VALUES (197, 1, 'CONDITION', 'Condizione', 'Condition');
INSERT INTO public.i18n_string VALUES (198, 1, 'VALUES', 'Valori', 'Values');
INSERT INTO public.i18n_string VALUES (199, 1, 'VALUE', 'Valore', 'Value');
INSERT INTO public.i18n_string VALUES (200, 1, 'OPERATOR_LBL', 'Operatore', 'Operator');
INSERT INTO public.i18n_string VALUES (201, 1, 'FILTER', 'Filtro', 'Filter');
INSERT INTO public.i18n_string VALUES (202, 1, 'SELECTED', 'Selezionato', 'Selected');
INSERT INTO public.i18n_string VALUES (203, 1, 'HOVER', 'Hover', 'Hover');
INSERT INTO public.i18n_string VALUES (204, 1, 'PRIVATE', 'Privato', 'Private');
INSERT INTO public.i18n_string VALUES (205, 1, 'TRANSLATIONS', 'Traduzioni', 'Translations');
INSERT INTO public.i18n_string VALUES (206, 1, 'ENGLISH', 'Inglese', 'English');
INSERT INTO public.i18n_string VALUES (207, 1, 'ITALIAN', 'Italiano', 'Italian');
INSERT INTO public.i18n_string VALUES (208, 1, 'CONFIGURATION', 'Configurazione', 'Configuration');
INSERT INTO public.i18n_string VALUES (209, 2, 'NEQ', 'diverso da', 'different from');
INSERT INTO public.i18n_string VALUES (210, 2, 'ILIKE', 'contiene', 'contain');
INSERT INTO public.i18n_string VALUES (211, 2, 'LT', 'minore di', 'less than');
INSERT INTO public.i18n_string VALUES (212, 2, 'AND', 'AND', 'AND');
INSERT INTO public.i18n_string VALUES (213, 2, 'OR', 'OR', 'OR');
INSERT INTO public.i18n_string VALUES (214, 2, 'GT', 'maggiore di', 'greater than');
INSERT INTO public.i18n_string VALUES (215, 2, 'LE', 'minore uguale di', 'less than or equal');
INSERT INTO public.i18n_string VALUES (216, 2, 'EQ', 'uguale a', 'equal to');
INSERT INTO public.i18n_string VALUES (217, 2, 'GE', 'maggiore uguale di', 'greater than or equal');
INSERT INTO public.i18n_string VALUES (218, 2, 'NOT_IN', 'non in', 'not in');
INSERT INTO public.i18n_string VALUES (219, 2, 'BETWEEN', 'compreso tra', 'between');
INSERT INTO public.i18n_string VALUES (220, 3, 'REWIND', 'Riavvolgi', 'Rewind');
INSERT INTO public.i18n_string VALUES (221, 3, 'LAST_PAGE', 'Ultima pagina', 'Last page');
INSERT INTO public.i18n_string VALUES (222, 3, 'PREV_PAGE', 'Pagina precedente', 'Previous page');
INSERT INTO public.i18n_string VALUES (223, 3, 'NEXT_PAGE', 'Pagina successiva', 'Next page');
INSERT INTO public.i18n_string VALUES (224, 3, 'SEARCH_RESET_ALL', 'Rimuovi tutte le condizioni', 'Remove all conditions');
INSERT INTO public.i18n_string VALUES (225, 3, 'LAST_FRAME', 'Vai alla fine', 'Last frame');
INSERT INTO public.i18n_string VALUES (226, 3, 'PLAY', 'Riproduci', 'Play');
INSERT INTO public.i18n_string VALUES (227, 3, 'PAUSE', 'Pausa', 'Pause');
INSERT INTO public.i18n_string VALUES (228, 3, 'STOP', 'Stop', 'Stop');
INSERT INTO public.i18n_string VALUES (229, 3, 'FORWARD', 'Avanza rapidamente', 'Forward');
INSERT INTO public.i18n_string VALUES (230, 3, 'PREV_FRAME', 'Precedente', 'Previous frame');
INSERT INTO public.i18n_string VALUES (231, 3, 'FIRST_PAGE', 'Prima pagina', 'First page');
INSERT INTO public.i18n_string VALUES (232, 3, 'FIRST_FRAME', 'Vai all''inizio', 'First frame');
INSERT INTO public.i18n_string VALUES (233, 3, 'NEXT_FRAME', 'Successivo', 'Next frame');
INSERT INTO public.i18n_string VALUES (234, 3, 'SEARCH_ADD_COND', 'Aggiungi una condizione', 'Add condition');
INSERT INTO public.i18n_string VALUES (235, 3, 'SEARCH_DEL_COND', 'Rimuovi condizione', 'Remove condition');
INSERT INTO public.i18n_string VALUES (236, 3, 'SEARCH_DEL_LAST_COND', 'Rimuovi ultima condizione', 'Remove last condition');
INSERT INTO public.i18n_string VALUES (237, 4, 'DELETE_ERR', 'La cancellazione non è andata a buon fine!', 'Delete error');
INSERT INTO public.i18n_string VALUES (238, 4, 'DELETE_OK', 'Cancellazione avvenuta con successo', 'Successfully delete');
INSERT INTO public.i18n_string VALUES (239, 4, 'CHART_AREA', 'Grafico ad area', 'Area chart');
INSERT INTO public.i18n_string VALUES (240, 4, 'RESERVED_AREA', 'Area riservata', 'Reserved area');
INSERT INTO public.i18n_string VALUES (241, 4, 'CHART_LINE', 'Grafico lineare', 'Line chart');
INSERT INTO public.i18n_string VALUES (242, 4, 'USER_INFO', 'Informazioni utente', 'User info');
INSERT INTO public.i18n_string VALUES (243, 4, 'UPDATE_OK', 'Aggiornamento effettuato con successo', 'Successfully update');
INSERT INTO public.i18n_string VALUES (244, 4, 'DETAIL_ERR', 'Errore nella richiesta dati al Server', 'Error on Server data request');
INSERT INTO public.i18n_string VALUES (245, 4, 'END_DATE', 'Data di fine', 'End date');
INSERT INTO public.i18n_string VALUES (246, 4, 'INSERT_OK', 'Inserimento effettuato con successo', 'Successfully insert');
INSERT INTO public.i18n_string VALUES (247, 4, 'ROLE_LBL', 'Ruoli', 'Roles');
INSERT INTO public.i18n_string VALUES (248, 4, 'INSERT_ERR', 'Inserimento fallito', 'Insert error');
INSERT INTO public.i18n_string VALUES (249, 4, 'UPDATE_ERR', 'Aggiornamento fallito', 'Update error');
INSERT INTO public.i18n_string VALUES (250, 4, 'REQUEST_DATE', 'Data richiesta', 'Request date');
INSERT INTO public.i18n_string VALUES (251, 4, 'WIND_ROSE', 'Rosa dei venti', 'Wind Rose');
INSERT INTO public.i18n_string VALUES (252, 4, 'NEW_EMAIL_LBL', 'Scrivi email', 'New Email');
INSERT INTO public.i18n_string VALUES (253, 4, 'NEW_ATTACH_LBL', 'Nuovo allegato', 'New attach');
INSERT INTO public.i18n_string VALUES (254, 4, 'CREATION_DATE', 'Data di creazione', 'Creation date');
INSERT INTO public.i18n_string VALUES (255, 4, 'RETYPE_NEW_PASSWORD', 'Reinserisci password', 'Retype password');
INSERT INTO public.i18n_string VALUES (256, 4, 'NEW_PASSWORD', 'Nuova password', 'New password');
INSERT INTO public.i18n_string VALUES (257, 4, 'CHANGE_PASSWORD', 'Cambia password', 'Chenge password');
INSERT INTO public.i18n_string VALUES (258, 4, 'CHART_BAR', 'Grafico a barre', 'Bar chart');
INSERT INTO public.i18n_string VALUES (259, 4, 'START_DATE', 'Data di inizio', 'Start date');
INSERT INTO public.i18n_string VALUES (260, 5, 'DELETE_FILE_MSG', 'Cancellare il file?', 'Delete the file?');
INSERT INTO public.i18n_string VALUES (261, 5, 'SERVER_RESPONSE_ERROR', 'Errori nella risposta ricevuta dal Server!', 'Server''s response errors!');
INSERT INTO public.i18n_string VALUES (262, 5, 'LOGIN_SUCCES_MSG', 'Accesso in corso...', 'Loading...');
INSERT INTO public.i18n_string VALUES (263, 5, 'LOGIN_ERROR_MSG', 'Credenziali non corrette', 'Login failed');
INSERT INTO public.i18n_string VALUES (264, 5, 'RECOVERY_PASSWORD', 'Password dimenticata ?', 'Forgot your password ?');
INSERT INTO public.i18n_string VALUES (265, 5, 'INVALID_ERROR', 'Valore non valido', 'Invalid value');
INSERT INTO public.i18n_string VALUES (266, 5, 'MANDATORY_ERROR', 'Campo obbligatorio', 'Mandatory field');
INSERT INTO public.i18n_string VALUES (267, 5, 'PERMISSIONS_ERR_MESSAGE', 'Impossibile caricare i permessi dal server !', 'Cannot load permissions from server !');
INSERT INTO public.i18n_string VALUES (268, 5, 'SEARCH_CONDITIONS_EMPTY', 'Definisci le condizioni!', 'Define search''s conditions!');
INSERT INTO public.i18n_string VALUES (269, 5, 'MAP_POINT_SELECT', 'Seleziona punto in mappa', 'Select point in map');
INSERT INTO public.i18n_string VALUES (270, 5, 'SEARCH_OP_ERROR', 'Definisci l''operatore del gruppo!', 'You must define a group''s Operator!');
INSERT INTO public.i18n_string VALUES (271, 5, 'SERVER_CONNECTION_ERROR', 'Problemi di comunicazione con il server!', 'Communication problems with Server!');
INSERT INTO public.i18n_string VALUES (272, 5, 'INVALID_EMAIL_ADDRESS', 'Indirizzo email non valido!', 'Invalid email address!');
INSERT INTO public.i18n_string VALUES (273, 5, 'FIELD_SHORT', 'Campo troppo corto', 'Field too short');
INSERT INTO public.i18n_string VALUES (274, 5, 'FOLDER_EXISTS_ERROR', 'Cartella già esistente!', 'Folder alredy exists!');
INSERT INTO public.i18n_string VALUES (275, 5, 'DELETE_MSG', 'Cancellare gli elementi selezionati ?', 'Delete selected items ?');
INSERT INTO public.i18n_string VALUES (276, 5, 'USER_INFO_ERR_MESSAGE', 'Impossibile reperire le informazioni utente !', 'Cannot load user info from server !');
INSERT INTO public.i18n_string VALUES (277, 5, 'FILE_EXISTS_ERROR', 'File già presente nella cartella!', 'File alredy exists in the folder');
INSERT INTO public.i18n_string VALUES (278, 5, 'INVALID_FORMAT', 'Formato errato', 'Wrong format');
INSERT INTO public.i18n_string VALUES (279, 5, 'DELETE_ITEM_MSG', 'Cancellare l''elemento selezionato?', 'Delete the selected item?');
INSERT INTO public.i18n_string VALUES (280, 5, 'EXPIRED_SESSION', 'Sessione scaduta !', 'Expired session !');
INSERT INTO public.i18n_string VALUES (281, 5, 'MENU_ERR_MESSAGE', 'Impossibile caricare il menù dal server !', 'Cannot load menu from server !');
INSERT INTO public.i18n_string VALUES (282, 5, 'NO_RESULT_FOUND', 'Nessun risultato trovato', 'No result found');
INSERT INTO public.i18n_string VALUES (283, 5, 'PASSWORD_MISMATCH', 'Le password non coincidono!', 'Password mismatch!');
INSERT INTO public.i18n_string VALUES (284, 5, 'DUPLICATE_ATTACH', 'Impossibile allegare! gia presente un allegato con lo stesso nome del file che si sta tentando di aggiungere.', 'Could not attach, the attachment is duplicated!');
INSERT INTO public.i18n_string VALUES (285, 7, 'SELECTED_ATTRIBUTES', 'Attributi selezionati', 'Selected attributes');
INSERT INTO public.i18n_string VALUES (286, 7, 'DYNAMIC_FILTER_LBL', 'Dynamic filter', 'Dynamic filter');
INSERT INTO public.i18n_string VALUES (287, 7, 'LOAD_DESCRIBEFT_ERR', 'Il servizio non consente di ottenere la lista degli attributi del layer!', 'The service does not allow you to obtain the list of the layer attributes!');
INSERT INTO public.i18n_string VALUES (288, 7, 'RASTER_QUERY_LBL', 'Specifica il nome della banda e l''alias da mostrare durante l''interrogazione in mappa del raster:', 'Specifies the name of the band and the alias to be displayed while retrieving the raster layer:');
INSERT INTO public.i18n_string VALUES (289, 7, 'SR_MGRS', 'Military Grid Reference System', 'Military Grid Reference System');
INSERT INTO public.i18n_string VALUES (290, 7, 'BASIC_CONFIG', 'Configurazione di base', 'Basic configuration');
INSERT INTO public.i18n_string VALUES (291, 7, 'ADVANCED_CONFIG', 'Configurazione avanzata', 'Advanced configuration');
INSERT INTO public.i18n_string VALUES (292, 7, 'CLUSTER_STYLE', 'Stile del cluster', 'Cluster style');
INSERT INTO public.i18n_string VALUES (293, 7, 'FEATURE_ID', 'Attributo che rappresenta l''id della feature', 'Feature''s id attribute');
INSERT INTO public.i18n_string VALUES (294, 7, 'HOVER_POPUP_INFO', 'Inserisci le informazioni da mostrare nel tooltip della feature', 'Write the information to be displayed in the feature''s tooltip');
INSERT INTO public.i18n_string VALUES (295, 7, 'SELECT_ATTRIBUTES_SUB', '(solo gli attributi selezionati potranno essere mostrati nel tooltip di una feature e nell''interrogazione in mappa)', '(Only selected attributes will be shown in the feature''s tooltip  and into the map''s query)');
INSERT INTO public.i18n_string VALUES (296, 7, 'PRINT_QUALITY', 'Qualità di Stampa', 'Print Quality');
INSERT INTO public.i18n_string VALUES (297, 7, 'SR_3004_NAME', 'Gauss Boaga fuso Est (EPSG:3004)', 'Gauss Boaga East zone (EPSG:3004)');
INSERT INTO public.i18n_string VALUES (298, 7, 'CLOSE_MSG', 'Vuoi chiudere senza salvare?', 'Close without saving?');
INSERT INTO public.i18n_string VALUES (299, 7, 'SR_3004_PREFIX', 'Monte Mario - Italia zona 2', 'Monte Mario - Italy zone 2');
INSERT INTO public.i18n_string VALUES (300, 7, 'SR_32633_PREFIX', 'WGS 84 - UTM 33N', 'WGS 84 - UTM 33N');
INSERT INTO public.i18n_string VALUES (301, 7, 'QUERY_LBL', 'Seleziona gli attributi da mostrare durante l''interrogazione in mappa:', 'Select attributes to dispaly when quering in map:');
INSERT INTO public.i18n_string VALUES (302, 7, 'SR_32633_NAME', 'UTM 33N - WGS84 (EPSG:32633)', 'UTM 33N - WGS84 (EPSG:32633)');
INSERT INTO public.i18n_string VALUES (303, 7, 'SR_4326_NAME_DMS', 'Geografico - WGS84 (EPSG:4326) - gradi sessagesimali', 'Geographic - WGS84 (EPSG:4326) - sexagesimal degrees');
INSERT INTO public.i18n_string VALUES (304, 11, 'SERVICE_NAME', 'Nome', 'Name');
INSERT INTO public.i18n_string VALUES (305, 7, 'SR_4326_NAME_DD', 'Geografico - WGS84 (EPSG:4326) - gradi decimali', 'Geographic - WGS84 (EPSG:4326) - decimal degrees');
INSERT INTO public.i18n_string VALUES (306, 7, 'SR_MGRS_PREFIX', 'MGRS', 'MGRS');
INSERT INTO public.i18n_string VALUES (307, 7, 'INITIAL_SELECTION', 'Selezione iniziale', 'Initial Selection');
INSERT INTO public.i18n_string VALUES (308, 7, 'NEW_LAYER', 'Nuovo layer', 'New layer');
INSERT INTO public.i18n_string VALUES (309, 7, 'STYLE_LBL', 'Stile', 'Style');
INSERT INTO public.i18n_string VALUES (310, 7, 'ICON_CHARGE_ERR', 'Errore durante il caricamento dell''icona!', 'Icon charge error!');
INSERT INTO public.i18n_string VALUES (311, 7, 'UPDATE_DEFAULT_LAYER_ERR', 'Aggiornamento layer di base di default non andato a buon fine!', 'Error on default base layer setting!');
INSERT INTO public.i18n_string VALUES (312, 7, 'PRINT_BAD_EPSG', 'La mappa di base selezionata può essere stampata solo nela proiezione Trasversa di Mercatore (EPSG:3857)', 'Current base map could only be printed in the Transvers Mercator Projection (EPSG:3857)');
INSERT INTO public.i18n_string VALUES (313, 7, 'IMAGE_EMPTY_ERR', 'Inserire un immagine!', 'Insert an image,please!');
INSERT INTO public.i18n_string VALUES (314, 14, 'STYLE_TYPE', 'Tipologia dello stile', 'Style type');
INSERT INTO public.i18n_string VALUES (315, 7, 'HOVER_POPUP_INFO_DESCR', 'Per mostrare il valore di un attributo della feature, seleziona l''attributo dalla combo a destra per aggiungerlo al testo del tooltip.', 'To show the feature''s attribute value, select the attribute from the combo on the right to add it to the tooltip''s text.');
INSERT INTO public.i18n_string VALUES (316, 7, 'LAYERS_CFG_PANEL', 'Configurazione livelli informativi', 'Layers configuration');
INSERT INTO public.i18n_string VALUES (317, 7, 'WMS', 'Web Map Service (WMS)', 'Web Map Service (WMS)');
INSERT INTO public.i18n_string VALUES (318, 7, 'WFS', 'Web Feature Service (WFS)', 'Web Feature Service (WFS)');
INSERT INTO public.i18n_string VALUES (319, 7, 'OSM', 'Open Street Map (OSM)', 'Open Street Map (OSM)');
INSERT INTO public.i18n_string VALUES (320, 7, 'XYZ', 'XYZ', 'XYZ');
INSERT INTO public.i18n_string VALUES (321, 7, 'BASE_MAPS', 'Mappe di base', 'Base maps');
INSERT INTO public.i18n_string VALUES (322, 7, 'PRINT_FORMAT', 'Formato di stampa', 'Print format');
INSERT INTO public.i18n_string VALUES (323, 7, 'LAYERS', 'Layers', 'Layers');
INSERT INTO public.i18n_string VALUES (324, 7, 'PRINT_LANDSCAPE', 'Orizzontale', 'Landscape');
INSERT INTO public.i18n_string VALUES (325, 7, 'PRINT_OVERVIEW', 'Overview', 'Overview');
INSERT INTO public.i18n_string VALUES (326, 7, 'PRINT_LEGEND', 'Legenda', 'Legend');
INSERT INTO public.i18n_string VALUES (327, 7, 'PRINT_DESCRIPTION', 'Descrizione', 'Decription');
INSERT INTO public.i18n_string VALUES (328, 7, 'PRINT_TITLE', 'Titolo', 'Title');
INSERT INTO public.i18n_string VALUES (329, 7, 'PRINT_DPI', 'DPI', 'DPI');
INSERT INTO public.i18n_string VALUES (330, 7, 'PRINT_SCALE', 'Scala', 'Scale');
INSERT INTO public.i18n_string VALUES (331, 7, 'PRINT_ORIENTATION', 'Orientamento', 'Orientation');
INSERT INTO public.i18n_string VALUES (332, 7, 'PRINT_VERTICAL', 'Verticale', 'Portrait');
INSERT INTO public.i18n_string VALUES (333, 7, 'TRANSPARENT_BACKGROUND', 'Sfondo trasparente', 'Transparent background');
INSERT INTO public.i18n_string VALUES (334, 7, 'INITIAL_VISIBILITY', 'Visibilità iniziale', 'Initial visibility');
INSERT INTO public.i18n_string VALUES (335, 7, 'WFS_LOADING_STRATEGY', 'Strategia caricamento dati', 'Strategies for loading data');
INSERT INTO public.i18n_string VALUES (336, 7, 'MODIFY_ATTRIBUTES', 'Gestione attributi', 'Attributes management');
INSERT INTO public.i18n_string VALUES (337, 7, 'SEARCHABLE', 'Valore ricercabile', 'Searchable');
INSERT INTO public.i18n_string VALUES (338, 7, 'SELECT_ATTRIBUTES', 'Attributi selezionati', 'Selected attributes');
INSERT INTO public.i18n_string VALUES (339, 7, 'RETURNED', 'Valore ritornato', 'Returned');
INSERT INTO public.i18n_string VALUES (340, 7, 'MAP_WATERMARK', 'Mappa non utilizzabile per fini legali o amministrativi', 'Map unusable for legal or administrative purposes');
INSERT INTO public.i18n_string VALUES (341, 7, 'CLUSTER_RADIUS', 'Distanza minima tra cluster (px)', 'Minimal distance between clusters (px)');
INSERT INTO public.i18n_string VALUES (342, 7, 'GO_TO_COORDS', 'Vai in mappa', 'Go to map');
INSERT INTO public.i18n_string VALUES (343, 7, 'PRINT_ERROR', 'Si è verificato un errore durante il processo di stampa', 'It was an error during printing process');
INSERT INTO public.i18n_string VALUES (344, 7, 'SR_4326_NAME', 'Geografico - WGS84 (EPSG:4326)', 'Geographic - WGS84 (EPSG:4326)');
INSERT INTO public.i18n_string VALUES (345, 7, 'SR_4326_PREFIX', 'WGS 84 - WGS84', 'WGS 84 - WGS84');
INSERT INTO public.i18n_string VALUES (346, 7, 'COORDS_ACQUIRE', 'Acquisizione coordinate', 'Coordinate acquisition');
INSERT INTO public.i18n_string VALUES (347, 7, 'ADD_LEGEND_CLASS', 'Aggiungi classe', 'Add class');
INSERT INTO public.i18n_string VALUES (350, 7, 'SR_3857_PREFIX', 'WGS 84 - Pseudo-Mercator', 'WGS 84 - Pseudo-Mercator');
INSERT INTO public.i18n_string VALUES (351, 7, 'SR_3857_NAME', 'WGS84 - Mercatore Trasverso (EPSG:3857)', 'WGS84 - Pseudo Mercator (EPSG:3857)');
INSERT INTO public.i18n_string VALUES (352, 7, 'NO_LAYERS_TO_QUERY', 'Non sono visibili layer da interrogare', 'There are no visible layers to query');
INSERT INTO public.i18n_string VALUES (353, 7, 'FILTER_INFO_MSG', '(Specificare i valori separati da virgola)', '(Specify comma-separated values)');
INSERT INTO public.i18n_string VALUES (354, 7, 'CLUSTER_ATTRIBUTE', 'Attributo da mostrare nel popup del cluster', 'Attribute to display into cluster pop-up');
INSERT INTO public.i18n_string VALUES (355, 7, 'USE_INFO_TOOL', 'Seleziona un punto in mappa per ottenere le informazioni', 'Select a point to get informations');
INSERT INTO public.i18n_string VALUES (356, 7, 'COORD_LON_LABEL', 'Longitudine', 'Longitude');
INSERT INTO public.i18n_string VALUES (357, 7, 'COORD_LAT_LABEL', 'Latitudine', 'Latitude');
INSERT INTO public.i18n_string VALUES (358, 8, 'LAYER_DOWN', 'Sposta in basso', 'Move down');
INSERT INTO public.i18n_string VALUES (359, 8, 'CTRL_OVERVIEW', 'Overview', 'Overview');
INSERT INTO public.i18n_string VALUES (360, 8, 'CTRL_INFO', 'Interrogazione', 'Query');
INSERT INTO public.i18n_string VALUES (361, 8, 'LAYER_UP', 'Sposta in alto', 'Move up');
INSERT INTO public.i18n_string VALUES (362, 8, 'LAYER_ZOOM', 'Zoom', 'Zoom to');
INSERT INTO public.i18n_string VALUES (363, 8, 'CTRL_LAYERS', 'Gestione livelli informativi', 'Layers management');
INSERT INTO public.i18n_string VALUES (364, 8, 'CTRL_MAP_SERVICES', 'Servizi di mappa', 'Map services');
INSERT INTO public.i18n_string VALUES (365, 8, 'CTRL_LEGEND', 'Legenda', 'Legend');
INSERT INTO public.i18n_string VALUES (366, 8, 'CTRL_SEARCH', 'Ricerca', 'Search');
INSERT INTO public.i18n_string VALUES (367, 8, 'CTRL_PRINT', 'Stampa', 'Print');
INSERT INTO public.i18n_string VALUES (368, 8, 'CTRL_COORDS', 'Gestione coordinate', 'Coordinate management');
INSERT INTO public.i18n_string VALUES (369, 8, 'CTRL_MEASURE', 'Strumenti di misura', 'Measure tools');
INSERT INTO public.i18n_string VALUES (370, 8, 'CTRL_EDIT', 'Editing', 'Editing');
INSERT INTO public.i18n_string VALUES (371, 9, 'YARD', 'Iarda', 'Yard');
INSERT INTO public.i18n_string VALUES (372, 9, 'INCH', 'Pollici', 'Inch');
INSERT INTO public.i18n_string VALUES (373, 9, 'MILES_MARINE', 'Miglia nautiche', 'Miles marine');
INSERT INTO public.i18n_string VALUES (374, 9, 'MILES', 'Miglia', 'Miles');
INSERT INTO public.i18n_string VALUES (375, 9, 'INCH_SQUARE', 'Pollici quadrati', 'Inch square');
INSERT INTO public.i18n_string VALUES (376, 9, 'KILOMETERS', 'Chilometri', 'Kilometers');
INSERT INTO public.i18n_string VALUES (377, 9, 'METERS', 'Metri', 'Meters');
INSERT INTO public.i18n_string VALUES (378, 9, 'MILES_SQUARE', 'Miglia quadrate', 'Miles square');
INSERT INTO public.i18n_string VALUES (379, 9, 'METERS_SQUARE', 'Metri quadrati', 'Meters square');
INSERT INTO public.i18n_string VALUES (380, 9, 'KILOMETERS_SQUARE', 'Chilometri quadrati', 'Kilometers square');
INSERT INTO public.i18n_string VALUES (381, 9, 'HECTARE', 'Ettari', 'Hecaters');
INSERT INTO public.i18n_string VALUES (382, 9, 'ACRE', 'Acro', 'Acre');
INSERT INTO public.i18n_string VALUES (383, 10, 'LAYER_SELECT', 'Seleziona layer', 'Layer select');
INSERT INTO public.i18n_string VALUES (384, 10, 'SEARCH_CLEAR', 'Reset ricerca', 'Search clear');
INSERT INTO public.i18n_string VALUES (385, 10, 'SIMPLE_SEARCH', 'Ricerca semplice', 'Simple search');
INSERT INTO public.i18n_string VALUES (386, 10, 'ADVANCED_SEARCH', 'Ricerca avanzata', 'Advanced search');
INSERT INTO public.i18n_string VALUES (387, 11, 'REMOVE_ALL_LAYERS', 'Rimuovi tutti i layer', 'Remove all layers');
INSERT INTO public.i18n_string VALUES (388, 11, 'ADD_SERVICES', 'Aggiungi servizi', 'Add services');
INSERT INTO public.i18n_string VALUES (389, 11, 'TILE_DIMENSION', 'Dimensione tile', 'Tile dimension');
INSERT INTO public.i18n_string VALUES (390, 11, 'SCALE_MIN', 'Scala Min', 'Scale min');
INSERT INTO public.i18n_string VALUES (391, 11, 'REMOVE_LAYER', 'Rimuovi layer', 'Remove layer');
INSERT INTO public.i18n_string VALUES (392, 11, 'ADD_ALL_LAYERS', 'Aggiungi tutti i layer', 'Add all layers');
INSERT INTO public.i18n_string VALUES (393, 11, 'DUPLICATE_GEOSERVICE_NAME', 'Nome del servizio già presente', 'Service name already present');
INSERT INTO public.i18n_string VALUES (394, 11, 'SERVICE_TYPE', 'Tipologia del servizio', 'Service type');
INSERT INTO public.i18n_string VALUES (395, 11, 'SERVICE_URL', 'Url del servizio', 'Url service');
INSERT INTO public.i18n_string VALUES (396, 11, 'DUPLICATE_GEOSERVICE_URL', 'Servizio già richiesto', 'Service url already request');
INSERT INTO public.i18n_string VALUES (397, 11, 'SCALE_MAX', 'Scala Max', 'Scale max');
INSERT INTO public.i18n_string VALUES (398, 11, 'ADD_LAYER', 'Aggiungi layer', 'Add layer');
INSERT INTO public.i18n_string VALUES (399, 11, 'REMOVE_SERVICES', 'Rimuovi servizio', 'Remove services');
INSERT INTO public.i18n_string VALUES (400, 13, 'CAT_WMS_ADDED', 'Servizi WMS', 'WMS services');
INSERT INTO public.i18n_string VALUES (401, 13, 'OSM', 'Open Street Map', 'Open Street Map');
INSERT INTO public.i18n_string VALUES (402, 14, 'STROKE_COLOR', 'Colore linea', 'Fill color');
INSERT INTO public.i18n_string VALUES (403, 14, 'STROKE_WIDTH', 'Spessore linea', 'Stroke width');
INSERT INTO public.i18n_string VALUES (404, 14, 'FEATURE_ATTRIBUTES', 'Attributi della feature', 'Feature Attributes');
INSERT INTO public.i18n_string VALUES (405, 14, 'HOVER_STYLE', 'Stile di hover', 'Hover style');
INSERT INTO public.i18n_string VALUES (406, 14, 'CLASSIFIED', 'Categorizzato', 'Classified');
INSERT INTO public.i18n_string VALUES (407, 14, 'CLUSTER_SIZE', 'N° di elementi del cluster', 'Number of cluster''s elements');
INSERT INTO public.i18n_string VALUES (408, 14, 'UNCLASSIFIED', 'Semplice', 'Simple');
INSERT INTO public.i18n_string VALUES (409, 14, 'DEFAULT_STYLE', 'Stile', 'Style');
INSERT INTO public.i18n_string VALUES (410, 14, 'POLY_WITH_PATTERN', 'Poligono con pattern', 'Poly with pattern');
INSERT INTO public.i18n_string VALUES (411, 14, 'SHAPE', 'Forma', 'Shape');
INSERT INTO public.i18n_string VALUES (412, 14, 'IMAGE', 'Immagine', 'Image');
INSERT INTO public.i18n_string VALUES (413, 14, 'TEXT', 'Testo', 'Text');
INSERT INTO public.i18n_string VALUES (414, 14, 'POLYGON', 'Poligono', 'Polygon');
INSERT INTO public.i18n_string VALUES (415, 14, 'LINE', 'Linea', 'Line');
INSERT INTO public.i18n_string VALUES (416, 14, 'CIRCLE', 'Cerchio', 'Circle');
INSERT INTO public.i18n_string VALUES (417, 14, 'APPLY_STYLE_TO', 'Applica lo stile al', 'Apply style to');
INSERT INTO public.i18n_string VALUES (418, 14, 'VERTEX', 'Vertice', 'Vertex');
INSERT INTO public.i18n_string VALUES (419, 14, 'CENTER', 'Centro', 'Center');
INSERT INTO public.i18n_string VALUES (420, 14, 'OFFSET_Y', 'Offset verticale', 'Vertical offset');
INSERT INTO public.i18n_string VALUES (421, 14, 'OFFSET_X', 'Offset orizzontale', 'Horizontal offset');
INSERT INTO public.i18n_string VALUES (422, 14, 'FILL_COLOR', 'Colore riempimento', 'Fill color');
INSERT INTO public.i18n_string VALUES (423, 5, 'RECOVERY_PASSWORD_PANEL', 'Recupera password', 'Recovery password');
INSERT INTO public.i18n_string VALUES (424, 13, 'ORTO_2016', 'Ortofoto 2016', 'Ortophoto 2016');
INSERT INTO public.i18n_string VALUES (425, 5, 'INVALID_URL', 'Indirizzo non valido', 'Invalid address');
INSERT INTO public.i18n_string VALUES (426, 1, 'SEARCH_CLEAR', 'Azzera ricerca', 'Reset search');
INSERT INTO public.i18n_string VALUES (427, 14, 'POINT', 'Punto', 'Point');
INSERT INTO public.i18n_string VALUES (428, 14, 'PLACEMENT', 'Posizione testo', 'Text placement');
INSERT INTO public.i18n_string VALUES (429, 14, 'OVERFLOW', 'Overflow testo', 'Text overflow');
INSERT INTO public.i18n_string VALUES (430, 1, 'NO', 'No', 'No');
INSERT INTO public.i18n_string VALUES (431, 14, 'TEXT_ALIGN', 'Allineamento testo', 'Text alignment');
INSERT INTO public.i18n_string VALUES (432, 14, 'LEFT', 'Sinistra', 'Left');
INSERT INTO public.i18n_string VALUES (433, 14, 'RIGHT', 'Destra', 'Right');
INSERT INTO public.i18n_string VALUES (434, 14, 'END', 'Fine', 'End');
INSERT INTO public.i18n_string VALUES (435, 14, 'START', 'Inizio', 'Start');
INSERT INTO public.i18n_string VALUES (436, 14, 'BOTTOM', 'Basso', 'Bottom');
INSERT INTO public.i18n_string VALUES (437, 14, 'TOP', 'Alto', 'Top');
INSERT INTO public.i18n_string VALUES (438, 14, 'MIDDLE', 'Mezzo', 'Middle');
INSERT INTO public.i18n_string VALUES (439, 14, 'TEXT_BASELINE', 'Linea di base del testo', 'Text baseline');
INSERT INTO public.i18n_string VALUES (440, 14, 'ALPHABETIC', 'Alfabetico', 'Alphabetic');
INSERT INTO public.i18n_string VALUES (441, 14, 'HANGING', 'Hanging', 'Hanging');
INSERT INTO public.i18n_string VALUES (442, 14, 'IDEOGRAPHIC', 'Ideografica', 'Ideographic');
INSERT INTO public.i18n_string VALUES (443, 14, 'ANGLE_REGULAR_POLYGON', 'Angolo', 'Angle');
INSERT INTO public.i18n_string VALUES (444, 14, 'RADIUS_REGULAR_POLYGON', 'Raggio', 'Radius');
INSERT INTO public.i18n_string VALUES (445, 4, 'OPEN_FILE_ERR', 'Errore di lettura dello shapefile', 'Error on opening shapefile');
INSERT INTO public.i18n_string VALUES (446, 4, 'MORE_FEAT_ERR', 'Lo shapefile contiene più geometrie', 'Loaded shapefile contains more than 1 geometry');
INSERT INTO public.i18n_string VALUES (447, 4, 'GEOM_TYPE_ERR', 'Il tipo di geometria dei dati è errato', 'Wrong geometry type on shapefile data');
INSERT INTO public.i18n_string VALUES (448, 4, 'GEO_JSON_ERR', 'Errore nella lettura dei dati', 'Error on reading shapefile data');
INSERT INTO public.i18n_string VALUES (449, 4, 'PARSE_FILE_ERR', 'Errore generico di lettura dello shapefile', 'Generic error on reading shapefile');
INSERT INTO public.i18n_string VALUES (450, 13, 'CAT_10', 'Generale', 'Overall');
INSERT INTO public.i18n_string VALUES (451, 7, 'GEOJSON', 'GeoJSON', 'GeoJSON');
INSERT INTO public.i18n_string VALUES (452, 6, 'MENU_MAN', 'Amministrazione', 'Management');
INSERT INTO public.i18n_string VALUES (453, 7, 'STATIC_IMAGE', 'Immagine Statica', 'Static Image');
INSERT INTO public.i18n_string VALUES (455, 6, 'MENU_MAN_1', 'Gestione utenti', 'Users config');
INSERT INTO public.i18n_string VALUES (456, 6, 'MENU_MAN_2', 'Gestione ruoli', 'Roles config');
INSERT INTO public.i18n_string VALUES (457, 6, 'MENU_MAN_3', 'Gestione layers', 'Layers config');
INSERT INTO public.i18n_string VALUES (458, 15, 'TITLE_ROLE', 'Gestione ruoli', 'Roles management');
INSERT INTO public.i18n_string VALUES (459, 15, 'TITLE_USER', 'Gestione utenti', 'Users management');
INSERT INTO public.i18n_string VALUES (461, 12, 'LEGEND_20', 'Province', 'Provinces');
INSERT INTO public.i18n_string VALUES (463, 12, 'LEGEND_22', 'Comuni', 'Municipalities');
INSERT INTO public.i18n_string VALUES (465, 12, 'LEGEND_18', 'Regioni', 'Region');
INSERT INTO public.i18n_string VALUES (468, 12, 'LEGEND_25', 'Limiti Amministrativi', 'Administrative Boundaries');
INSERT INTO public.i18n_string VALUES (469, 1, 'MONTH', 'Mese', 'Month');
INSERT INTO public.i18n_string VALUES (470, 1, 'DURATION', 'Durata', 'Duration');
INSERT INTO public.i18n_string VALUES (471, 1, 'PROCESS', 'Elabora', 'Process');
INSERT INTO public.i18n_string VALUES (473, 13, 'BASELAY_2', 'No Background', 'No Background');
INSERT INTO public.i18n_string VALUES (475, 12, 'LEGEND_4', 'Area di Studio', 'Study area');
INSERT INTO public.i18n_string VALUES (539, 5, 'SHP_FEATURE_ERR', 'Lo shapefile non contiene dati', 'No data in shapefile');
INSERT INTO public.i18n_string VALUES (540, 5, 'SHP_LOAD_ERR', 'Si è verificato un errore durante il caricamento dello shapefile', 'An error occurred while loading the shapefile');
INSERT INTO public.i18n_string VALUES (541, 5, 'SHP_MORE_GEOM_ERR', 'Lo shapefile deve contenere una sola geometria', 'The shapefile must contain only one geometry');
INSERT INTO public.i18n_string VALUES (542, 5, 'SHP_OPEN_ERR', 'Si è verificato un errore durante l''apertura dello shapefile', 'An error occurred while opening the shapefile');
INSERT INTO public.i18n_string VALUES (543, 5, 'SHP_NO_FILE_ERR', 'Non è presente alcun file da caricare', 'There is no file to load');
INSERT INTO public.i18n_string VALUES (544, 5, 'INTERSECTION_ERROR', 'Si è verificato un errore durante la verifica territoriale della geometria', 'An erorr occured during territorial verification of the geometry');
INSERT INTO public.i18n_string VALUES (495, 13, 'BASELAY_30', 'Ortofoto Puglia 2019', 'Ortofoto Puglia 2019');
INSERT INTO public.i18n_string VALUES (623, 18, 'CONTROL_PL', 'Controllo segnaletica', 'Control signage');
INSERT INTO public.i18n_string VALUES (503, 17, 'PROTOCOL_REQUEST_DATE', 'Data richiesta protocollo', 'Protocol request date');
INSERT INTO public.i18n_string VALUES (558, 18, 'MOVE_DATE', 'Data trasloco', 'Move date');
INSERT INTO public.i18n_string VALUES (563, 6, 'MENU_MAN_4', 'Gestione aziende', 'Manage authorities');
INSERT INTO public.i18n_string VALUES (568, 1, 'HEAD_OFFICE', 'Sede legale', 'Head office');
INSERT INTO public.i18n_string VALUES (569, 1, 'STREET_NUMBER', 'Civico', 'Street number');
INSERT INTO public.i18n_string VALUES (571, 19, 'AUTHORIZATION', 'Concessione', 'Authorization');
INSERT INTO public.i18n_string VALUES (572, 19, 'FUNCTION', 'Attività per', 'Function for');
INSERT INTO public.i18n_string VALUES (576, 13, 'LAY_19', '2022', '2022');
INSERT INTO public.i18n_string VALUES (584, 12, 'LEGEND_40', 'Cantieri aperti', 'Cantieri aperti');
INSERT INTO public.i18n_string VALUES (586, 12, 'LEGEND_42', 'Presi in carico', 'Presi in carico');
INSERT INTO public.i18n_string VALUES (589, 13, 'LAY_47', 'In corso', 'In corso');
INSERT INTO public.i18n_string VALUES (595, 13, 'LAY_55', 'Chiusi', 'Closed');
INSERT INTO public.i18n_string VALUES (592, 13, 'LAY_51', 'Preso in carico', 'Taken');
INSERT INTO public.i18n_string VALUES (598, 12, 'LEGEND_58', 'Preso in carico', 'Taken');
INSERT INTO public.i18n_string VALUES (601, 12, 'LEGEND_61', '2022', '2022');
INSERT INTO public.i18n_string VALUES (603, 13, 'BASELAY_63', 'ESRI world map', 'ESRI world map');
INSERT INTO public.i18n_string VALUES (605, 1, 'LOCALIZATION', 'Localizzazione', 'Localization');
INSERT INTO public.i18n_string VALUES (606, 18, 'AUTH_PROTOCOL', 'Protocollo concessione', 'Auth protocol');
INSERT INTO public.i18n_string VALUES (607, 18, 'AUTH_START_DATE', 'Data inizio concessione', 'Auth. start date');
INSERT INTO public.i18n_string VALUES (608, 18, 'AUTH_END_DATE', 'Data fine concessione', 'Auth. end date');
INSERT INTO public.i18n_string VALUES (609, 18, 'NUMBER_FROM', 'Dal civico', 'Number from');
INSERT INTO public.i18n_string VALUES (610, 18, 'NUMBER_TO', 'Al civico', 'Number to');
INSERT INTO public.i18n_string VALUES (611, 18, 'PLACE', 'Tratto', 'Place');
INSERT INTO public.i18n_string VALUES (612, 18, 'SIGNAGE_MOBILE', 'Segnaletica mobile', 'Signage mobile');
INSERT INTO public.i18n_string VALUES (613, 18, 'SIGNAGE_DATE', 'Data posizionamento', 'Signage date');
INSERT INTO public.i18n_string VALUES (614, 18, 'SIGNAGE_BASE', 'Base palo segnaletica', 'Signage base');
INSERT INTO public.i18n_string VALUES (615, 18, 'SIGNAGE_NUM_BAGS', 'Numero sacchetti ancoraggio', 'Signage number bags');
INSERT INTO public.i18n_string VALUES (616, 18, 'SIGNAGE_BAG_OTHER', 'Altro tipo ancoraggio', 'Signage bag other');
INSERT INTO public.i18n_string VALUES (617, 18, 'SIGNAGE_POSITION', 'Posizionamento palo segnaletica', 'Signage position');
INSERT INTO public.i18n_string VALUES (618, 18, 'VEHICLE_NUM', 'Numero veicoli presenti', 'Vehicle number');
INSERT INTO public.i18n_string VALUES (619, 18, 'VEHICLE_PLATE', 'Targhe veicoli', 'Vehicle plate');
INSERT INTO public.i18n_string VALUES (620, 18, 'MANAGE_DATE', 'Data presa in carico', 'Manage date');
INSERT INTO public.i18n_string VALUES (622, 18, 'CONTROL_TEAM', 'Pattuglia', 'Control team');
INSERT INTO public.i18n_string VALUES (578, 13, 'LAY_22', 'In corso', 'In corso');
INSERT INTO public.i18n_string VALUES (624, 18, 'MISSING_AUTHORIZATION', 'Non è possibile inserire la richeista di trasloco in quanto mancante di concessione. Procedere all''aggiornamento della stessa nella sezione dedicata', 'It is not possible to add the move request as you do not have a concession. Proceed to update it in the dedicated section');
INSERT INTO public.i18n_string VALUES (505, 13, 'CAT_2', 'Manutenzione strade', 'Roadsite');
INSERT INTO public.i18n_string VALUES (472, 6, 'MENU_ROADSITE', 'Manutenzione strade', 'Roadsite');
INSERT INTO public.i18n_string VALUES (631, 18, 'AUTHORIZATION_EXPIRED', 'Non è possibile inserire e/o modificare la richesta di trasloco in quanto la concessione è scaduta', 'It is not possible to enter or to modify the move request as th authorization is expired');
INSERT INTO public.i18n_string VALUES (633, 18, 'SEND_REQUEST_CONFIRM', 'Confermi di voler inoltrare la richiesta di trasloco?', 'Do you confirm that you want to forward the move request?');
INSERT INTO public.i18n_string VALUES (634, 18, 'MANAGE_REQUEST_CONFIRM', 'Confermi di voler prendere in carico la richiesta di trasloco?', 'Do you confirm that you want to take over the move request?');
INSERT INTO public.i18n_string VALUES (635, 18, 'APPROVE_REQUEST_CONFIRM', 'Confermi di voler approvare la richiesta di trasloco?', 'Do you confirm that you want to approve the move request?');
INSERT INTO public.i18n_string VALUES (636, 18, 'REJECT_REQUEST_CONFIRM', 'Confermi di voler negare la richiesta di trasloco?', 'Do you confirm that you want to reject the move request?');
INSERT INTO public.i18n_string VALUES (641, 17, 'SELECT_ADDRESS', 'Seleziona indirizzo', 'Select address');
INSERT INTO public.i18n_string VALUES (644, 19, 'COMPANY_DATA', 'Dati azienda', 'Company data');
INSERT INTO public.i18n_string VALUES (640, 17, 'PROTOCOL_COMPANY', 'Protocollo uscita azienda', 'Output protocol company');
INSERT INTO public.i18n_string VALUES (642, 17, 'SEND_REQUEST_CONFIRM', 'Confermi di voler inoltrare la richiesta di manutenzione strade?', 'Do you confirm that you want to forward the roadsite request?');
INSERT INTO public.i18n_string VALUES (553, 17, 'PROTOCOL_APPROVED_NUMBER', 'N. protocollo provvedimento', 'Protocol approved number');
INSERT INTO public.i18n_string VALUES (629, 17, 'PROTOCOL_ERROR', 'Errore nella ricezione del protocollo, il servizio di protocollo comunale potrebbe essere momentaneamente non disponibile. Riprovare più tardi.', 'Error on receiving protocol. Try later');
INSERT INTO public.i18n_string VALUES (645, 19, 'USER_DATA', 'Dati utente', 'User data');
INSERT INTO public.i18n_string VALUES (660, 18, 'CONTROL_DATE_GREATER_APPROVE_DATE', 'La data di controllo segnaletica è maggiore della data di approvazione', 'Control date is greater than approve date');
INSERT INTO public.i18n_string VALUES (663, 18, 'APPROVED_USER', 'Utente approvazione', 'Approved user');
INSERT INTO public.i18n_string VALUES (664, 13, 'LAY_65', 'Limiti amministrativi', 'Boundaries');
INSERT INTO public.i18n_string VALUES (665, 13, 'LAY_66', 'Municipi', 'Municipi');
INSERT INTO public.i18n_string VALUES (666, 13, 'LAY_67', 'Quartieri', 'Quartieri');
INSERT INTO public.i18n_string VALUES (667, 13, 'LAY_68', 'Località', 'Località');
INSERT INTO public.i18n_string VALUES (668, 13, 'LAY_69', 'Circoscrizioni', 'Circoscrizioni');
INSERT INTO public.i18n_string VALUES (669, 13, 'LAY_70', 'Toponomastica', 'Toponomastica');
INSERT INTO public.i18n_string VALUES (670, 12, 'LEGEND_72', 'Cantieri chiusi', 'Cantieri chiusi');
INSERT INTO public.i18n_string VALUES (671, 4, 'USER_DISABLED', 'Utente non abilitato', 'User disabled');
INSERT INTO public.i18n_string VALUES (672, 19, 'EXISTING_USERNAME', 'La username scelta esiste già', 'The username already exists');
INSERT INTO public.i18n_string VALUES (673, 19, 'EXISTING_USER', 'L''utente è gia registrato', 'The user is already registered');
INSERT INTO public.i18n_string VALUES (674, 19, 'INSERT_ERROR', 'Impossibile proseguire con la registrazione. Contattare l''amministratore di sistema', 'Cannot proceed with registration. Contact the system administrator');
INSERT INTO public.i18n_string VALUES (675, 2, 'ANY', 'contiene', 'any');
INSERT INTO public.i18n_string VALUES (349, 7, 'COORD_X_LABEL', 'Coord. X', 'X Coord.');
INSERT INTO public.i18n_string VALUES (348, 7, 'COORD_Y_LABEL', 'Coord. Y', 'Y Coord.');
INSERT INTO public.i18n_string VALUES (676, 1, 'TOWN', 'Municipio', 'Town');
INSERT INTO public.i18n_string VALUES (661, 18, 'END_DATE_NOT_VALID', 'Data di fine trasloco non valida. E'' successiva alla data di fine concessione', 'Invalid end date. It is after to the authorization end date');
INSERT INTO public.i18n_string VALUES (677, 19, 'NEW_AUTHORIZATION', 'Nuova concessione', 'New authorization');
INSERT INTO public.i18n_string VALUES (678, 17, 'AUTH_NOT_ENABLED', 'Verificare che l''azienda sia abilitata all''inserimento', 'Verify that the authority is enabled to insert the request');
INSERT INTO public.i18n_string VALUES (679, 18, 'AUTH_NOT_ENABLED', 'Verificare che l''azienda sia abilitata all''inserimento', 'Verify that the authority is enabled to insert the request');
INSERT INTO public.i18n_string VALUES (680, 18, 'CONTROL_DATE_LESS_REQUEST_DATE', 'La data di controllo segnaletica è minore della data di richiesta', 'Control date is less than request date');
INSERT INTO public.i18n_string VALUES (662, 18, 'MANAGE_USER', 'Utente presa in carico', 'Manage user');
INSERT INTO public.i18n_string VALUES (681, 17, 'APPROVE_REQUEST_CONFIRM', 'Confermi di voler approvare la richiesta di manutenzione strade?', 'Do you confirm that you want to approve the roadsite request?');
INSERT INTO public.i18n_string VALUES (682, 17, 'REJECT_REQUEST_CONFIRM', 'Confermi di voler negare la richiesta di manutenzione strade?', 'Do you confirm that you want to reject the roadsite request?');
INSERT INTO public.i18n_string VALUES (684, 12, 'LEGEND_74', 'Municipi', 'Municipi');
INSERT INTO public.i18n_string VALUES (685, 12, 'LEGEND_75', 'Quartieri', 'Quartieri');
INSERT INTO public.i18n_string VALUES (686, 12, 'LEGEND_76', 'Località', 'Località');
INSERT INTO public.i18n_string VALUES (687, 12, 'LEGEND_77', 'Circoscrizioni', 'Circoscrizioni');
INSERT INTO public.i18n_string VALUES (688, 12, 'LEGEND_78', 'Toponomastica', 'Toponomastica');
INSERT INTO public.i18n_string VALUES (689, 5, 'NEW_PWD_EMAIL_ERROR', 'Si è verificato un errore durante l''invio per email della nuova password', 'An error occurred while sending the new password by email');
INSERT INTO public.i18n_string VALUES (690, 5, 'NEW_PWD_GENERIC_ERROR', 'Si è verificato un errore generico durante la procedura', 'Generic error occurred during the procedure');
INSERT INTO public.i18n_string VALUES (691, 5, 'NEW_PWD_OK_MSG', 'La nuova password è stata inviata al tuo indirizzo email', 'The new password is sent to yours email address');
INSERT INTO public.i18n_string VALUES (692, 5, 'NEW_PWD_RECOVERY_DATA_ERROR', 'Si è verificato un errore durante il recupero delle informazioni', 'There was an error while retrieving information');
INSERT INTO public.i18n_string VALUES (693, 5, 'NEW_PWD_SAVE_PWD_ERROR', 'Si è verificato un errore durante la memorizzazione della nuova password', 'There was an error while storing the new password');
INSERT INTO public.i18n_string VALUES (694, 5, 'NEW_PWD_SUCCESS_MSG', 'La nuova password è stata inviata all''indirizzo email indicato', 'The new password has been sent to the given email address');
INSERT INTO public.i18n_string VALUES (695, 5, 'NEW_PWD_WRONG_DATA', 'I dati inseriti non sono corretti', 'You entered incorrect data. Please verify.');
INSERT INTO public.i18n_string VALUES (659, 18, 'SIGNAGE_DATE_NOT_VALID', 'Non è possibile inserire la richiesta di trasloco in quanto la data di posizionamento segnaletica deve essere antecedente di almeno 48 ore alla data di inizio del trasloco', 'It is not possible to insert the move request as the date of positioning of the signage must be at least 48 hours before the move start date');
INSERT INTO public.i18n_string VALUES (630, 18, 'START_DATE_NOT_VALID', 'Non è possibile inserire la richiesta di trasloco in quanto la data della richiesta deve essere antecedente di almeno 48 ore alla data di inizio trasloco', 'It is not possible to enter the move request as the date of the request must be at least 48 hours before the move start date');
INSERT INTO public.i18n_string VALUES (683, 18, 'PHOTO_MANDATORY', 'Per poter proseguire con l''invio della richiesta è necessario inserire almeno una foto/allegato', 'To proceed with sending the request it is necessary to insert at least one photo/attachment');
INSERT INTO public.i18n_string VALUES (696, 14, 'VISIBLE_UNTIL_TO', 'Visibile fino a 1:', 'Visible until to 1:');
INSERT INTO public.i18n_string VALUES (697, 14, 'VISIBLE_FROM', 'Visibile da 1:', 'Visible from 1:');
INSERT INTO public.i18n_string VALUES (698, 19, 'INSERT_OK', 'Inserimento effettuato con successo. La sua richiesta di registrazione verrà presa in carico da un amministratore.', 'Insert successful. Your registration request will be handled by an administrator.');
INSERT INTO public.i18n_string VALUES (700, 17, 'GEOM_MANDATORY', 'Per poter proseguire è necessario inserire la geometria del cantiere.', 'To proceed it is necessary to insert the roadsite geometry.');
INSERT INTO public.i18n_string VALUES (699, 17, 'UPDATE_OK_ERROR_PEC', 'Registrazione al protocollo effettuata con successo. Errore nell''invio  della PEC all''azienda. ', 'Update successful. Error in sending PEC to the company, then proceed with manual sending.');


--
-- TOC entry 5034 (class 0 OID 25938)
-- Dependencies: 252
-- Data for Name: menu; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.menu VALUES (4, 'MENU.MENU_ROADSITE', true, 1, '', NULL, NULL);
INSERT INTO public.menu VALUES (5, 'MENU.MENU_MOVE', true, 2, '', NULL, NULL);
INSERT INTO public.menu VALUES (1, 'MENU.MENU_MAN', true, 4, '', NULL, NULL);
INSERT INTO public.menu VALUES (6, 'MENU.MENU_AUTH', true, 3, '', NULL, NULL);


--
-- TOC entry 5036 (class 0 OID 25946)
-- Dependencies: 254
-- Data for Name: menu_item; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.menu_item VALUES (9, 1, 'MENU.MENU_MAN_1', NULL, NULL, 'Amministrazione', 'manageUsers', NULL, NULL, 1);
INSERT INTO public.menu_item VALUES (10, 1, 'MENU.MENU_MAN_2', NULL, NULL, 'Amministrazione', 'manageRoles', NULL, NULL, 2);
INSERT INTO public.menu_item VALUES (11, 1, 'MENU.MENU_MAN_3', NULL, NULL, 'Amministrazione', 'manageLayers', NULL, NULL, 3);
INSERT INTO public.menu_item VALUES (13, 4, 'MENU.MENU_ROADSITE_1', NULL, NULL, 'Cantieri', 'roadsiteList', NULL, NULL, 1);
INSERT INTO public.menu_item VALUES (15, 5, 'MENU.MENU_MOVE_1', NULL, NULL, 'Traslochi', 'moveList', NULL, NULL, 1);
INSERT INTO public.menu_item VALUES (14, 6, 'MENU.MENU_AUTH_1', NULL, NULL, 'Azienda', 'registerCompany', NULL, NULL, 1);
INSERT INTO public.menu_item VALUES (17, 1, 'MENU.MENU_MAN_4', NULL, NULL, 'Amministrazione', 'manageAuthority', NULL, NULL, 4);


--
-- TOC entry 5039 (class 0 OID 25956)
-- Dependencies: 257
-- Data for Name: move; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5040 (class 0 OID 25963)
-- Dependencies: 258
-- Data for Name: move_attach; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5042 (class 0 OID 25972)
-- Dependencies: 260
-- Data for Name: move_photo; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5044 (class 0 OID 25981)
-- Dependencies: 262
-- Data for Name: move_signage_position; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.move_signage_position VALUES (1, 'Carreggiata');
INSERT INTO public.move_signage_position VALUES (2, 'Marciapiede');


--
-- TOC entry 5046 (class 0 OID 25989)
-- Dependencies: 264
-- Data for Name: move_status; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.move_status VALUES (5, 'In redazione');
INSERT INTO public.move_status VALUES (1, 'Inviato');
INSERT INTO public.move_status VALUES (2, 'Preso in carico');
INSERT INTO public.move_status VALUES (3, 'Autorizzato');
INSERT INTO public.move_status VALUES (4, 'Negato');


--
-- TOC entry 5048 (class 0 OID 25997)
-- Dependencies: 266
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.permission VALUES (9, 'MANAGE_USER', 'Gestione utenti', 'userole', 'Amministrazione', 9);
INSERT INTO public.permission VALUES (10, 'MANAGE_ROLE', 'Gestione ruoli', 'userole', 'Amministrazione', 10);
INSERT INTO public.permission VALUES (11, 'MANAGE_LAYER', 'Gestione layers', 'management', 'Amministrazione', 11);
INSERT INTO public.permission VALUES (23, 'MANAGE_PRINT', 'Gestione della stampa della mappa', 'gisTools', 'Strumenti gis', NULL);
INSERT INTO public.permission VALUES (24, 'MANAGE_MEASURES', 'Gestione degli strumenti di misura', 'gisTools', 'Strumenti gis', NULL);
INSERT INTO public.permission VALUES (26, 'MANAGE_SEARCH', 'Gestione della ricerca in mappa', 'gisTools', 'Strumenti gis', NULL);
INSERT INTO public.permission VALUES (41, 'MANAGE_QUERY', 'Interrogazione della mappa', 'gisTools', 'Strumenti gis', NULL);
INSERT INTO public.permission VALUES (43, 'MANAGE_ROADSITE', 'Gestione cantieri', 'roadsite', 'Cantieri', 13);
INSERT INTO public.permission VALUES (46, 'ROADSITE_APPROVE', 'Gestione approvazione cantiere', 'roadsite', 'Cantieri', NULL);
INSERT INTO public.permission VALUES (47, 'ROADSITE_SEND_REQUEST', 'Gestione invio richiesta per cantiere', 'roadsite', 'Cantieri', NULL);
INSERT INTO public.permission VALUES (44, 'ROADSITE_CRUD', 'Inserisci/Modifica cantieri', 'roadsite', 'Cantieri', NULL);
INSERT INTO public.permission VALUES (48, 'MANAGE_MOVE', 'Gestione traslochi', 'move', 'Traslochi', 15);
INSERT INTO public.permission VALUES (49, 'MOVE_CRUD', 'Inserisci/Modifica traslochi', 'move', 'Traslochi', NULL);
INSERT INTO public.permission VALUES (45, 'REGISTER_COMPANY', 'Gestione registrazione azienda', 'company', 'Azienda', 14);
INSERT INTO public.permission VALUES (52, 'MANAGE_AUTHORITY', 'Gestione aziende', 'management', 'Amministrazione', 17);
INSERT INTO public.permission VALUES (58, 'VIEW_LYR_48', 'Visualizza il layer ''Traslochi Aperti''', 'webgis', 'Layer gis', NULL);
INSERT INTO public.permission VALUES (59, 'VIEW_LYR_55', 'Visualizza il layer ''Traslochi chiusi''', 'webgis', 'Layer gis', NULL);
INSERT INTO public.permission VALUES (57, 'VIEW_LYR_4', 'Visualizza il layer ''Cantieri aperti''', 'webgis', 'Layer gis', NULL);
INSERT INTO public.permission VALUES (55, 'VIEW_LYR_16', 'Visualizza il layer ''Cantieri chiusi''', 'webgis', 'Layer gis', NULL);
INSERT INTO public.permission VALUES (60, 'MOVE_APPROVE', 'Gestione approvazione traslochi', 'move', 'Traslochi', NULL);
INSERT INTO public.permission VALUES (61, 'MOVE_SEND_REQUEST', 'Gestione invio richiesta per trasloco', 'move', 'Traslochi', NULL);
INSERT INTO public.permission VALUES (62, 'MOVE_MANAGE_REQUEST', 'Gestione presa in carico richiesta traslochi', 'move', 'Traslochi', NULL);
INSERT INTO public.permission VALUES (63, 'ROADSITE_NOTE_PM', 'Inserimento note PM', 'roadsite', 'Cantieri', NULL);


--
-- TOC entry 5050 (class 0 OID 26002)
-- Dependencies: 268
-- Data for Name: permission_role; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.permission_role VALUES (9, 1);
INSERT INTO public.permission_role VALUES (10, 1);
INSERT INTO public.permission_role VALUES (11, 1);
INSERT INTO public.permission_role VALUES (23, 1);
INSERT INTO public.permission_role VALUES (24, 1);
INSERT INTO public.permission_role VALUES (26, 1);
INSERT INTO public.permission_role VALUES (41, 1);
INSERT INTO public.permission_role VALUES (43, 1);
INSERT INTO public.permission_role VALUES (23, 37);
INSERT INTO public.permission_role VALUES (24, 37);
INSERT INTO public.permission_role VALUES (26, 37);
INSERT INTO public.permission_role VALUES (41, 37);
INSERT INTO public.permission_role VALUES (43, 37);
INSERT INTO public.permission_role VALUES (44, 37);
INSERT INTO public.permission_role VALUES (47, 37);
INSERT INTO public.permission_role VALUES (46, 1);
INSERT INTO public.permission_role VALUES (48, 1);
INSERT INTO public.permission_role VALUES (49, 38);
INSERT INTO public.permission_role VALUES (44, 1);
INSERT INTO public.permission_role VALUES (47, 1);
INSERT INTO public.permission_role VALUES (49, 1);
INSERT INTO public.permission_role VALUES (52, 1);
INSERT INTO public.permission_role VALUES (55, 1);
INSERT INTO public.permission_role VALUES (57, 1);
INSERT INTO public.permission_role VALUES (58, 1);
INSERT INTO public.permission_role VALUES (59, 1);
INSERT INTO public.permission_role VALUES (60, 1);
INSERT INTO public.permission_role VALUES (61, 1);
INSERT INTO public.permission_role VALUES (62, 1);
INSERT INTO public.permission_role VALUES (57, 37);
INSERT INTO public.permission_role VALUES (45, 38);
INSERT INTO public.permission_role VALUES (58, 38);
INSERT INTO public.permission_role VALUES (61, 38);
INSERT INTO public.permission_role VALUES (48, 38);
INSERT INTO public.permission_role VALUES (23, 40);
INSERT INTO public.permission_role VALUES (24, 40);
INSERT INTO public.permission_role VALUES (26, 40);
INSERT INTO public.permission_role VALUES (48, 40);
INSERT INTO public.permission_role VALUES (49, 40);
INSERT INTO public.permission_role VALUES (58, 40);
INSERT INTO public.permission_role VALUES (59, 40);
INSERT INTO public.permission_role VALUES (60, 40);
INSERT INTO public.permission_role VALUES (61, 40);
INSERT INTO public.permission_role VALUES (62, 40);
INSERT INTO public.permission_role VALUES (23, 41);
INSERT INTO public.permission_role VALUES (24, 41);
INSERT INTO public.permission_role VALUES (26, 41);
INSERT INTO public.permission_role VALUES (43, 41);
INSERT INTO public.permission_role VALUES (44, 41);
INSERT INTO public.permission_role VALUES (46, 41);
INSERT INTO public.permission_role VALUES (47, 41);
INSERT INTO public.permission_role VALUES (55, 41);
INSERT INTO public.permission_role VALUES (57, 41);
INSERT INTO public.permission_role VALUES (45, 37);
INSERT INTO public.permission_role VALUES (45, 36);
INSERT INTO public.permission_role VALUES (43, 40);
INSERT INTO public.permission_role VALUES (63, 40);
INSERT INTO public.permission_role VALUES (9, 41);
INSERT INTO public.permission_role VALUES (52, 41);
INSERT INTO public.permission_role VALUES (9, 40);
INSERT INTO public.permission_role VALUES (52, 40);


--
-- TOC entry 5051 (class 0 OID 26005)
-- Dependencies: 269
-- Data for Name: registration; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.registration VALUES (26, 85, 129);
INSERT INTO public.registration VALUES (27, 86, 130);
INSERT INTO public.registration VALUES (28, 87, 131);


--
-- TOC entry 5054 (class 0 OID 26012)
-- Dependencies: 272
-- Data for Name: roadsite; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5055 (class 0 OID 26019)
-- Dependencies: 273
-- Data for Name: roadsite_prot_out_email; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.roadsite_prot_out_email VALUES (6, 'rip.patrimonio@comune.bari.it', NULL);
INSERT INTO public.roadsite_prot_out_email VALUES (7, 'rip.tributi@comune.bari.it', NULL);
INSERT INTO public.roadsite_prot_out_email VALUES (8, 'rip.poliziamunicipale@comune.bari.it', NULL);
INSERT INTO public.roadsite_prot_out_email VALUES (1, 'municipio1@comune.bari.it', 'MUNICIPIO N.1');
INSERT INTO public.roadsite_prot_out_email VALUES (2, 'municipio2@comune.bari.it', 'MUNICIPIO N.2');
INSERT INTO public.roadsite_prot_out_email VALUES (3, 'municipio3@comune.bari.it', 'MUNICIPIO N.3');
INSERT INTO public.roadsite_prot_out_email VALUES (4, 'municipio4@comune.bari.it', 'MUNICIPIO N.4');
INSERT INTO public.roadsite_prot_out_email VALUES (5, 'municipio5@comune.bari.it', 'MUNICIPIO N.5');
INSERT INTO public.roadsite_prot_out_email VALUES (9, 'sportello.bari@sogetspa.it', NULL);


--
-- TOC entry 5057 (class 0 OID 26024)
-- Dependencies: 275
-- Data for Name: roadsite_status; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.roadsite_status VALUES (1, 'In redazione');
INSERT INTO public.roadsite_status VALUES (2, 'In corso');
INSERT INTO public.roadsite_status VALUES (3, 'Autorizzato');
INSERT INTO public.roadsite_status VALUES (4, 'Negato');


--
-- TOC entry 5059 (class 0 OID 26029)
-- Dependencies: 277
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.role VALUES (1, 'Amministratore Sistema', 'Amministratore', false, '2018-10-08 00:00:00+02', NULL, true);
INSERT INTO public.role VALUES (36, 'Accesso pubblico', 'Pubblico', false, NULL, NULL, true);
INSERT INTO public.role VALUES (38, 'Azienda traslochi', 'Azienda traslochi', false, '2022-06-15 18:19:37.215045+02', NULL, false);
INSERT INTO public.role VALUES (37, 'Azienda cantiere', 'Azienda cantiere', false, '2022-05-20 16:02:38.116262+02', NULL, false);
INSERT INTO public.role VALUES (40, 'Operatore di sala operativa per la gestione dei traslochi', 'Sala operativa', false, '2022-08-25 10:03:17.75991+02', NULL, false);
INSERT INTO public.role VALUES (41, 'Ufficio manutenzione strade', 'Ufficio manutenzione strade', false, '2022-08-26 15:50:53.117779+02', NULL, false);


--
-- TOC entry 5061 (class 0 OID 26037)
-- Dependencies: 279
-- Data for Name: role_sysuser; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.role_sysuser VALUES (1, 1);
INSERT INTO public.role_sysuser VALUES (40, 72);
INSERT INTO public.role_sysuser VALUES (41, 73);
INSERT INTO public.role_sysuser VALUES (1, 132);


--
-- TOC entry 5062 (class 0 OID 26040)
-- Dependencies: 280
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.session VALUES (18661, 73, 'Elk7X0EzUVynJ4VKcAfPjzZ5aQSZxXHS', '2022-12-16 12:42:47.131+01', '2022-12-16 12:42:24.53+01', '2022-12-16 22:42:47.131+01');
INSERT INTO public.session VALUES (18655, 73, '4DuBNKRtqqB705DQcqlYzAqVcsF3f172', '2022-12-14 10:56:42.041+01', '2022-12-14 10:56:31.95+01', '2022-12-14 20:56:42.041+01');
INSERT INTO public.session VALUES (18649, 72, 'USkejw4arUn0gGIm1uFJD2btves82Pf7', '2022-12-13 10:25:26.644+01', '2022-12-13 10:25:14.972+01', '2022-12-13 20:25:26.644+01');
INSERT INTO public.session VALUES (18651, 72, 'UJq6a8eGVr4Tg9PzdNs1udn7WHYLBPr1', '2022-12-14 08:47:13.363+01', '2022-12-14 08:47:13.254+01', '2022-12-14 18:47:13.363+01');
INSERT INTO public.session VALUES (18657, 132, 'PR4Ot6csmMU8Bn9lXOMpQHHe5vu4y9QW', '2022-12-14 11:20:25.837+01', '2022-12-14 11:19:02.77+01', '2022-12-14 21:20:25.837+01');
INSERT INTO public.session VALUES (18653, 72, 'uhJ05lmb8ccfaYLijR23FupktW0VbGpb', '2022-12-14 08:50:33.147+01', '2022-12-14 08:50:33.008+01', '2022-12-14 18:50:33.147+01');
INSERT INTO public.session VALUES (18642, 1, '4IbHTfdAfE0QEAVmoBT6vexrybb4GuZC', '2022-12-06 16:28:07.737+01', '2022-12-06 16:26:46.923+01', '2022-12-07 02:28:07.737+01');
INSERT INTO public.session VALUES (18640, 73, 'WIDulBTUbGrrRSxKA0ffcac5PTzrnayY', '2022-12-06 16:26:00.878+01', '2022-12-06 16:25:59.904+01', '2022-12-07 02:26:00.878+01');
INSERT INTO public.session VALUES (18659, 132, 'aPbuBDCVrCZSt1JosFj9Cwu9mzQf94Bh', '2022-12-14 11:29:35.577+01', '2022-12-14 11:29:35.439+01', '2022-12-14 21:29:35.577+01');
INSERT INTO public.session VALUES (18644, 73, 'iglRbSjr8xf6GmCn20af9serBKcfGCMl', '2022-12-13 09:38:11.119+01', '2022-12-13 09:37:50.084+01', '2022-12-13 19:38:11.119+01');
INSERT INTO public.session VALUES (18648, 73, 'yUfJvvddUr3EJZFW811LNeo2GH0PdVkq', '2022-12-13 10:14:53.555+01', '2022-12-13 10:13:43.398+01', '2022-12-13 20:14:53.555+01');
INSERT INTO public.session VALUES (18646, 73, 'Mvy9A9pPGhZWt7IiuFSctO6hRVzO9ggK', '2022-12-13 09:42:16.859+01', '2022-12-13 09:42:14.583+01', '2022-12-13 19:42:16.859+01');
INSERT INTO public.session VALUES (18643, 1, '1u3WYu0P13GtPVk2ZBLgb97Uy4uYyuvT', '2022-12-13 09:37:19.877+01', '2022-12-13 09:37:13.801+01', '2022-12-13 19:37:19.877+01');
INSERT INTO public.session VALUES (18639, 1, 'kWD4ARCbcGRm3PvWbdJEhUFEolpiSI3z', '2022-12-06 16:25:50.062+01', '2022-12-06 16:25:49.777+01', '2022-12-07 02:25:50.062+01');
INSERT INTO public.session VALUES (18662, 72, 'D90cFTHD3Hhs0L0L6VqLgw3PNc8vkzrf', '2022-12-16 12:43:11.236+01', '2022-12-16 12:42:58.008+01', '2022-12-16 22:43:11.236+01');
INSERT INTO public.session VALUES (18656, 1, 'bxCzTLdXToBn7eKPPHU1K4dFHDmWQASO', '2022-12-14 11:18:38.13+01', '2022-12-14 11:17:34.944+01', '2022-12-14 21:18:38.13+01');
INSERT INTO public.session VALUES (18650, 73, '7YkpMdQ9IgyNvvWRXTxBXNnwj8GJQ4J0', '2022-12-14 08:47:01.386+01', '2022-12-14 08:46:21.021+01', '2022-12-14 18:47:01.386+01');
INSERT INTO public.session VALUES (18652, 73, '099DgGlVU33zA1YKFauXAVw1HvVrc1AP', '2022-12-14 08:50:18.527+01', '2022-12-14 08:50:13.306+01', '2022-12-14 18:50:18.527+01');
INSERT INTO public.session VALUES (18641, 72, 'Nf8uXVGucaOciiHuIiqlvTkZvBuP2jAS', '2022-12-06 16:26:34.009+01', '2022-12-06 16:26:18.847+01', '2022-12-07 02:26:34.009+01');
INSERT INTO public.session VALUES (18658, 132, 'oaGmEFf5zvbteL6YpEXJSQlvT5e485Ou', '2022-12-14 11:21:37.298+01', '2022-12-14 11:20:34.039+01', '2022-12-14 21:21:37.298+01');
INSERT INTO public.session VALUES (18654, 1, 'ijiDfCKABL9eCJsMM4IfjvtqzUnEUneF', '2022-12-14 10:10:42.586+01', '2022-12-14 10:10:38.806+01', '2022-12-14 20:10:42.586+01');
INSERT INTO public.session VALUES (18660, 73, 'ZrbDrJIBCmmvwWzlhFHbD9Y2lM8Ms5jb', '2022-12-14 11:52:58.195+01', '2022-12-14 11:52:52.703+01', '2022-12-14 21:52:58.195+01');


--
-- TOC entry 4687 (class 0 OID 24401)
-- Dependencies: 211
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5064 (class 0 OID 26045)
-- Dependencies: 282
-- Data for Name: sysuser; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.sysuser VALUES (1, 'Amministratore', 'Sistema', '', 'a0b6d6bef0b155b1d9b6429eeae98576', 'sonia.netti@sit-puglia.it', false, 'admin', '2018-10-08 11:00:00+02', NULL, true, NULL, NULL, NULL);
INSERT INTO public.sysuser VALUES (73, 'Vito Francesco', 'Arborea', NULL, '36b571491732395a95916476d088c873', 'v.arborea@comune.bari.it', false, 'varborea', '2022-09-01 16:41:45.611222+02', NULL, true, NULL, NULL, NULL);
INSERT INTO public.sysuser VALUES (72, 'Giambattista', 'Quaranta', NULL, 'bbd67541314b91858200fee1131b7b0f', 'g.quaranta@comune.bari.it', false, 'gquaranta', '2022-08-09 14:20:43.646199+02', NULL, true, NULL, NULL, NULL);
INSERT INTO public.sysuser VALUES (132, 'Davide', 'Diomede', NULL, 'c66bea34450166eb7943aeba2f5e3356', 'd.diomede@comune.bari.it', false, 'administrator', '2022-12-14 11:18:34.255644+01', NULL, true, NULL, NULL, 'x');


--
-- TOC entry 5012 (class 0 OID 24085)
-- Dependencies: 209
-- Data for Name: tb_test; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5066 (class 0 OID 26053)
-- Dependencies: 284
-- Data for Name: town_ids; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.town_ids VALUES (27080, 'MUNICIPIO N.1');
INSERT INTO public.town_ids VALUES (35011, 'MUNICIPIO N.2');
INSERT INTO public.town_ids VALUES (35015, 'MUNICIPIO N.3');
INSERT INTO public.town_ids VALUES (35019, 'MUNICIPIO N.4');
INSERT INTO public.town_ids VALUES (35023, 'MUNICIPIO N.5');


--
-- TOC entry 5071 (class 0 OID 26129)
-- Dependencies: 300
-- Data for Name: wg_base_map; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_base_map VALUES (1, 'WEBGIS.LAYER.OSM', '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', 'IMAGE', true, 1, true, 1, NULL, '{"type":"OSM","url":"https://a.tile.openstreetmap.org/{z}/{x}/{y}.png","projection":"EPSG:3857","attributes":["geom"]}', true);
INSERT INTO public.wg_base_map VALUES (3, 'WEBGIS.LAYER.BASELAY_30', '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', 'IMAGE', true, 1, false, 3, NULL, '{"type":"WMS","url":"http://webapps.sit.puglia.it/arcgis/services/BaseMaps/Ortofoto2019/ImageServer/WMSServer","layer_name":"0","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', false);
INSERT INTO public.wg_base_map VALUES (63, 'WEBGIS.LAYER.BASELAY_63', 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABICAIAAACGBWc0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAB+1SURBVHhe7Xvnk9t2tiX/9/20+2Xr1dabHakTc845xw7sZiZIIjCARM6RZEvyftgLyjMjt8uWRp55VW9GrmsWDZBo4ODcc8/5gXa1cOtH/U79AOgr9QOgr9QPgL5SrsZSfbPpR31Zruz98s2mH/VlucLZ2ptNP+rLcgXiuToiNVGtSbzd96OgXN5QItUc5R5WtSnfQo03u3+U687r94bjvmg2UX4qD8jmD4x+Wa5sOpRLByORgDcYiRZalSl32WF/+aF/53KthpnVIP3UTaaTIW8glLlfNXGjhR3ffO7ftlwMVmKwwm6Ze2jFvR53stpv4HobO7353L9tuWi8ROOF/SrXqUe83tts/aWJgQz9YNDPBQAVaayIDNKJmCcQChWfty3MBAY1cfPNR/89ywHosCp0G1Gf7y5VbtUWCmxtOxr0AyCnXDRWWiP5Ui7oDQSLfbyJ/cDlF+UiprnxcyoV9/mC4dKIerP7R7la1XAhGwj47zw+X3FweLP7R7mCQa8f/g1FQql8ecK82f2jXKF0JV7pppovxSeisfqxNvS2XLk+Xp2xtQXfRAGdPxTEwEA5Ue5fS+Zd5fGhRVgtAq7KcELGrz7xrYVZhT6R6SIV6NN/IYxcufa8sZLbmNlF7Q72/Rm1uTL8sazbH46Ve5Ux/S+DkSsYy2d6s9qcb2PgD9/u/vZqLLSrm9v379/fevyxUq/686rAf/tyub0+byiebQ9bqPZNqxyYWR5ThSe8MmGbqP55S30hF593nlDs/fsrt/vmzhtMtydOpnM612r/pS7u/GdmNb+oDm63P5OXMP8WcYCDcASn4A18zP551x+g+XeUK50K3FxfpfLF5lL8RUbFrAaqNTEdvHVtJtYQ8QKHXZsLoUzVG06Gs/Xc/ao2F0sDMl55CCQK7lDs+uY2Ffe4PZ5Esd5b8Y+EfI9L9zi8KlC9S91jUPLn9z0c3sgPzhath6k9QmljSguVm3DY503uflF4wkov2/KQriJiY6lfaP5fC1C7FnHf3WQqLZjxHafFQKeN+lIpT5nsA1oa7qpTNlkfxCuP+UesPhcT9ZfrO4/X5wHq+SKZaKkbTBYAEb/vBvrrzuPp1UPxmD+Vjo+m/RU+gloS4wU+WeDTy6vzZolPUGy0gsJh16WwyWw1HSOTp9Gg2n1MlTtAa28o5o8kA/FcMFWOFdq53qoy4ZznVP+FAufq1qNutxtUozSk6zOxvhArUzrTnUVLHW8kEyu0UvVn6EGPL+CPZuLlhztfKBjy9xqxcinh9YcvYPmK2cB9KxYJ3iVi/uUgXSmGwiH3Qze9IzoUWuXwIoMVIPTReIEm8jRRhGLxPOP8Z2mPF3dIHp1kRo+JTj1azvnDwbvbmyvg9e3NtfN6e+313Hi9bl84Ecm1cr1FeXRorHTg+JuL+WeUq9+L+/0eXyQZzTcTtX6qOYqWet5wCoTk6ura7Qt4w4lgNFbIBSMh350vcHNz3azFyUVuNS0Uy/lQIldtlFej7A4tDDrJx158M6+NBu10KplMxkaDe2LR26NlgIZxYHIKkGIw2FLcL4rraR4ZZB7asUohlIz5vJ5bOP7V1ft3794BH+Htzc0VbMykQlDRsNvndfsjAFM9e78sj8jmUgURaBE2OJX2P2f5wYWOM9ViGJoiHA76w1FvKOENRoOhIJyic5ZXVx5/qNYoLYdwGc6ybCYVwZAedxjQuxcEeXx4flgirT1aIdc1muiTuxeewiSBH43GoVAgnYr1uvXRc36DFKhVkcEBmuIBLWyRHFBmeJ9slsKFTDAcdN/dXl9fXwEozh999859dx0K3kZCd6HAXcDnjkYC6WSwmA1nU6FYxANAwh0N5yvZDlIZUZeHw/+spnPt0Tw6yvbvMw/dQrGYTqWixWKi20pGwh5/wBsMefKF7GzaOhD35PoZXQwJdCZwJC+QPLdTJYY9LEnigdkNZJ5QRFpgNwyFixy5JhbtTjMej0WjUbj50MhIP7Oe5YlZbj5I3zejlVwoEfV6PDcXylx9vh/wHmJzMnpXLMZavdbDfbHXStRLgWTMC9tDIX82FS7lI/lMOBn1+XxeaLpovuW40zHTWCr/DJhclLPeWqH2c5bCtwTSf6jMB3DDS8+P5afH9mjYwdEJR6MUidIHTJEoQ2M0dSNJK5pCP76eTF1VZcE0ZEViBRY9rB82i9oGqW/RDo6NHx/a5XIpFo2Egu5cyteshOulUDYZCAXcoCx/owy4J9D8SCqaLZfbzZd+7Wk67q24Z3QzWQ4X88b0Jd2sRhJRGAUAU6CQjZZykUI2Eg17fX4vCHkk38x25wBTEyadA9OXSP0h1JwVRRJt2rZmGsaH82lNzNjDVOHXHLMWeFISD7JIKSIpchjPzjV5YWpLU0M0BRH5ra7wirD/9PHDx08fRYEiiTaFFViiSmMFCiuRWGON9hazh+enXiGfhRb2eu5gYgIuAMxnyoAt8ARjgUQ+UbkvPBGVMdVcss8o1cMUcD1twujh6pDYLbAXdNkc9/O5St0fjns87oDfW8zHKsVYsRAFmGCqesPxcLaZv8eqE7q50v5mCIg/FDBd9DB9IAavr+bxZB+PGs+R9tHQNckwGMMgVXUniUtJnFr64mSjJ2txMhFTm/PsytQEcj2k1o8yv7NMxbZ1evcIcDNY1ZlZaIEhinuQm0V1v30cPdfzuRS004Uv766ur0HvfdGMY6YuUwnsFfisX61ngm88AiPAQw3x7Rxb9FYCOKNEueMJhLxeTyIeLhVjtVIilw6Egx4AzhdNh3MNgMkxBHDAP9x0LmVYkPApR6IsiTH7GcNsDUMlN0+6ttSUuWmsDB05WsuztTpbS0DH1ueSMNM0XhZIatvhyA6779P7uWXqh02fIWCWgxLnnWcBnwsrbpb5ejkYi/hvb29u3c60DqVK4B6Kz9sy2PGV9lu+BijQ/Nlb2zDUgU1go5uEBeEx150kCm1vCKTIk07GSvlotRQDsQN7ATiBI4mCb3pEy1O2BYbgV0f+9nIZSPm8fXxpJqcPOXTa2O1Qnlru0aJlLGQRPR85Q1tfAFoezfnRmGvSVBK2wDHmgBrKyJCGmtTfb55fT8c9/gCsoXDwOIW/AkThuZduHIwMOKlQIhsvtAr3q9LoUJ9LDl+cLPLbN/ny/PISR8wmpI01wHR0vuIMdR38fbaHxPINXygWDgXT6TA0Xb2czCT8AJMvEAjEQKt64MhbDpXggPZ3WAGXPM8bWLUYvb5vhOv54HLcQacVGq8p4lJTeV1lTX1rGXNAxzamhjITmIUBWxmaPSwsdWqpY0MecvTi/Hraox2ABtTHcYCf0cEKGyRfyftAhiPZRvF5XR4ealOh7qzMgUDApX5FIBwdwY5N59VoEqdLEIPrtIBHDpVQozJhQJ5juWogHAmHA5l0rJyLlPORbDocDoPBCwCCdejfn4/2i4N/S7kM/olFyv/xP/9HNvqnTsHfyHiWg8Jh21VlRlEYkZ3q2uJojCxzZukzkZsamnC0rf1uJXITW52Z6lAVJqpCyyq7RxvgBi9PIh0e7VdFMDv9bioWvru9u03WX6oTLv+IpxojSC2Npfb5pP9oEVZ9pYMbynbH0RxIeDQWDaUT4AZihWzM671LJCO9GdrFtEsS/tXXv1YuW5sKzLP75j/6jdBmWAzf/W963nh5KvDsnqZmAIGhz2x9YupTWRhLwhqEHAAid3OJH9nqVBEGIkfomsAcpvS6Co6ZwooUUQB7NX3O1ssxsL8QHHyhSKTQipcg0xY9wSgkWxDmN6fyXQUR/wi0AmpAliyP6HRrnCw0QpFwJBKIx8J+n7tVT23Wo9maeMKZNvZ3ryk7AJna+LB/sKTxfcXfrwYn7WQp5enWMsrhwdLnljYBjHRpyrMLXRVFHhX4jQZvOMyUhzw9NwyF5zCFG3C7KmjQJXMViXm+Vk75fV5IU9fXziz3hOKQ6QKROPTCrccPhCoND6XhvjQkKyCl358/TWctBTByhNysI0oVmq49iOWrwKZ4PDIfFIRDX2Imu/0SIdA+znYvf8tp24vAwevvaJMDEEivro+PBrKYlfl1N+z7z2TgXSl2Y6/r3Lo9esruNh3oNU0VRGGrCqA4A4mndUXgmJEi0apMCdzIVEbctu6MMLxME4XVpNpq1m7v7q4AoVvwLdFgDGiT7XZL7VYeCOUJJUKZajAFNrkYK/dqiPjmzL6xHFwcHoEkOR3kFMC0lIGhue6s9jCYI48k0ZOZF5mZyPvebr+aErtHgu+gYCDgCI7kvznml+UA5JDImJyALAaiKjNI6oHb/7PuZ5VZuRq/jnj/9FiNbNA+ZAuJR47ai6lM9ruBBgBxO0MVeHqsy2NTGUqHLr9rivuWeGgQ6AOBr5KZjDcUC8az1V53PL1f421m11kvyvly4dYTuPMFfcGwLxy784cy3fnvjbPvKBSaTmut5HtUHmEbnHjZrx+kfUthJhIzw7azEbaHv9jETkCfxm9j5LK0maWBD3R4BCSyLMRWkOmkIBLdWSsevvmPVupm1ojNHivYrGmriKWPbG0miyNotI8fTiK31gAddWKpExj50HS2Ora0EU3PgHHD8cPj6GU4H9L8HP4EKLohT9hNeTKq5Qu5YjHebubq3QY0oD+W+wep0l+KOP5lBfLUwMwHXJ3hcxYvcpuWzoyg48hd/4UAjI4dgOn3ANKd8WQbMxjkJ3Nh2fMPBmrooDjoUzu3fMpjnRA9LtVT7sVT1lCmpj63dRhtE45FzyeDZcaWPvkMsW3AEZCTvQTDzXMQSsTd9lmFaAJW05jCt0x9ZKhjAOiAltFpDZ1lyXkZXdbT1d6tNxAr9eoL+c35fXc1CZAkp+ANIFXFj484v8XuQSJhhnCHFcuj5G48wvcdDFyS82ONzybgzaRzgbsBdKCcazMhT6zgVWJnhiHTJCbQI43sPtUjicCfaqk7dvfIkw9HYyILQ1UC6dkp0sg2JvB1Cw4CEEMWgbKXAocYqrRZPx2dgwOmMAqBQeCkhuymxqDgtksHsJRo9YCV7ocjfzQNKg5xzFnf+eUp/gMKZhxhdDDrmdhh+DNB9Ef4bkmDmyOo/XiIbzrOT6I+ZzdHzr78LrQYXB74QLjzCydMWKiizkSedAK6KsrSmmcnzUqk384kAn+edlLz5zxPNMh139AVhhpfqOew7/NB4AhO2QuBm0OgI/AniCaWObWMKfSyCaWOAKCLjSxQjp90Rt5q2c01+qBE0WIHQtmX5/d7hZmgMg1nzezrcRScN8g5CPkjJjzhfBvXOrg138s8h1LkYISvodHAkV5+9/OLL7pkEdHV6fFy2y/0WQkCbh8tgcMkkVBlVhIoej+dDpvVTCAbfj99zFZjV/ed0mG70pUpgHLpTeSSY536jJEIAKkCjj063AF+6U4PmjAN1DHnAPS3LAJ1wMpP40UoU/eEE4VH/FvUGkCpTtnc/RKqOuPf7H1TTeepCWAEOAJB7BYKTDGALx3cWO4ZkR4TxFPPsUiw3em1L7/rUlVWFCCXLkBcACaFxxSVs05HSUAlcSJyKw1cssyw9P6hU2qWYt1iOB9577v9z04pTBIPR91pTId6F3T+ipHIzjSFxzFg0M8AmeCnLp6L3b4FCApFH5u9Z18wlG4Mfn6a9LsF6MTL975ICnoTMPoKphg4gEvudfTI6qBWnQD3BKJj9nCNWM+WxBSs9mXqO+boy3K9Qh7lDqpyEASEZ6eSxEPC0GTWMTjKQRQQjpmqEC+OtiBQ0HqdanrSTST875OhP9dKIXrfh4s/XnCxzYuQwSjUEOhtQxNxvA8AOfRxoJk4DNIm7K4GMgkxjXH6y2kxBivv8TIyKScTwWTlwRnPvzzLX9Ux/4g6RsF96/W7k5X7NqpdYtqbj329mvipj3IPuPBbXtFlGSrH4qpKCwLJMjv7ZHPcShEQRYTIrsgSKYkbXRd4jrQs/fV84tntfFhedbP52HU66sln/IN+RpVG0GiWOYFXiPuyuGBp3LZ1HB8AOjZAAyZAGYMh0KUJT92zZIfe1Cm8dMB+XqimsDK+yOSzoXipe1k8fXuiX1YbP0InXt+6/X5fJh2OJrO1GXeR2Lef/FoBs07gmJy+e7vr53IZuqyJM0lYSBKpKPzxaLH0wjIWhjpXJEyWKMsyBJbcb5emqYgCYxoqT401pDKsRwKeP8cCV1f/93/tt31wADCnVHkq8itVYUX+oGrymhgZykQThzIPOQ5RJdxUSVM7GCopCxi9HWxWTXJZolYF5Dn90EnGYoFIofPVYQ+CWpuwnnDS6w+US4VAIJh7RH/nIn+roOOgyy6Pj36zQ12WKevS0tYXijzlmNXRBmtMaspGVxBdngrcXtPlLT5VRFZTeXI3Ox0Nnlnp6+aRvK+l3U/NVL0SBwTh4hVxKom4IjOaylL7KccfqAOuybAdl4StwO8ViTufj5rK6RrDUFtkOh70O7NhffiUSce9kLxv7u4ixW9wQ4TVXKnRYu/W7U2l04FAIF0fNP5+f3AR74s8/WrXX8sFl61IB1lwVNZSF5qyksStKvOqvGfZlaFJ+/2CYze2qauQSbmJKOwk4SCSz9ayJaHVxVPFMqTXj2fTuWxWVXlRwCRhrKszhtlomqpKtCJRigTorFkaPdkWdRiL3Gg87Eai0XgiViqXY/GQx+cLJHIQzbLd2Vc1yLkkzMw/YnfeoD/gDwaDsVyt/r1p7vfLJQlrwEjiSV3GdXkObkgWZ3A9mibohqJDEj2sTFME6TFMlecQcjszwSMzhDZpvDL3Cj44WiYMPkPeHk8myBZEWUsbg2+kDoSmSdBKEHRFdqRJQ3r3AkALzFAWBs1u69bte391decNwHWGM5Xswyr3gBYeUednEd9gbcAxQdC9vXP74J9gqDKE3PA9Ov375TJUQGSpyHtZZBQZ2AGxYCnwc1kCuVHggg1DBdbAVIKrBXGBBjyfTyDY0rL5uqqJg7JpmwKFOOojYNBEHI1poDvyhKE3l7aCaOYkNUsd09tnywF3SO6e47nKzZ333fv3nmDcHytE8s1o+SGSbweTxUi+VUOkv54iTH2HU79aD2mu9FRzdHPncbvdt3d3+fv5H1gz+c1yHaUhZFRVWkBPqRrPMYSurEVhrWvCgVwYuvT6ehad6yRNVTqBPxIPusraJ4tdP5vtqI1ULG4rc1Ndn6viiDrMoRN5FtEUAt6AY1DEsa1NdWks8UN2PzvaOsdOMLTnDcaAPu/evfeGEv5I1lkwCkS9weid13N9e1cckJepZDZQvfiyzd2vKjPurZRiZnm494aTNze3Nzc3qXKrsfrK+PuOch03jSPzfDbmmjKVJRxUWddFZ/ZTKEOvDF0QOfJ8NCE3KMJGVTlyu2Qo7ONPn2SRNif3NlHV7zMyPzCd6T4+HBan41GTOUPjdV2GrwvcRHV2rUSeEIW9ZWvUYbZd30djkavrG7j/TpSPpEKJbLJQKTcayVTy6vo6e7/orE5NTMs9YoFUGVBI1F++pNXnqiFiONeALoN/ool09dtjyjeX64SUbKxuk52TPDK05XYzO54sVWYOm5GqcKpMMoeRoYP0HsjtELySrkqSQJ9sE+KIeVhYaNV+yci7R0tei+KOOmzANxxtQ2CcJ7En24C2hSEAYF30G5ck7rBbMNSg0y7FEqlcqdrqPT8OZsM5Mlsii9U8m80Cs7JPq9bKyj1hvkgaRMrjC3hCCXDMzjOiL84eQkYw7awcRqKRYDhccmTob3v/IeWyVrVXtGotqsdtx9g/CfxOkVnmAHl1p8oceGtZnAj82rY00BRJZD68voJ+s1tE0xWBHOlI8wP1pCL3ssTalk4fVgy1AK902M3gUJ8+fjQMUVVoywQhI1l6AgCJPDjy9W6LzJAZhmOHwx5sqOoEY3E0Gnp9vvfvr0pDErgD6ADFyvVSp1sDHQ8kS2Xn/wX4W6OVBqQ7EE1kc6Vywef3Z7uI84u0f6hUuwxuaG/a9rp9WlasVcskJ+xmyPNrkGSWJhR5rYOpE+nz6aTIPM/hskyDfm/XL5apKyItrR7P26aFNNjdRFEA0I3AEq9nWxQoXqA+fDgL3FrihgK7tm1NkSmIfrJMgkEX+S3LbAXuIEu8AQ3Js7vtJhaPv7++gaZLNQaOuNy5a83Snhrw9LBUybl9wVipexnnP0NQ6K9vPb5cIffw2HWeg5Xum5A5sfPvGL+/t1y6Cigs1d2Tjd3bWNeel8V5XWfXhirJIqVp4A9pWdxBi3EsSR/GMPXPxyMtbIEUpmXS6KPRj1hYQ8S6igKRzdRkAdyTZeub9RRQdqBRx5Bdz0fJNMBPLFlqxNFzgcUAE54B+WcAx+ViWi4XQGtvvcFQpgqD/8btyZeK4MUUCYGYsphVkpn4rTeQaY3rCDhJgMAEogGa8Xh4OHqKxaKhZK6+lByACOP7otmvyyVJlHq5n6Z4UJYtFW1Ys+KH3cjezQ0eU2X8QD5vt080vYJsBZYPJrdlmAy34fk9hI/9eqhO6qd1W522FYk9nnWO2W7x0fF4UkRS1xRFpAwIYtrM1JeqPFOEkSoT4K4AF00VNFWmmQXkm9Gwf+v84OPGE05A10Bn5SuF3X4Deq8pDEePIMFNRjV/0O8OxRO1/mc9riNSNNfweO4Gg342kwTTWHhe1zDdCRC/utTvKxdMdCC4YYBRZgV6Iq5f9GXrFe+a44KGVVXyUaCne2ohiPvz0QLW0PsFfcAFccdx5McPJ4bdGRRuL6rmpLRfPUgyBbyj9ivLtoBNhsYaCm5CXnWy/vJsYyKH2JYiy7ws4iy1AtnakRPbNlB04fF4oKduPP47r79YqW5IDEYn6CAchwWiiSuBHjbqyZvbWzBQl0V+C0JJstSBkDIcPDcbOZ/XHcnWsk9ofS7X8a8uCXxTuegDBHcKpozMExy7Agj43fCENSy0ac8K2rKp40OF2ygiBiwDW3Qg53DXX19PoB2nky2ItEgO5GHmRDT5WU2RhPOHoyqzoEQQVjfYA9DnsiA7tY2VbVCSuLcsmPSYpSKygEBMEUUWDssyVL1WjMbCgWCw0WoDZ17PrzZ4dIUTxQOYL0VhaWaKz0sQ2d69e5eo9Ju4DhoUjKZSqSSOLaGjy0Xn12reaCbVnJQnJNjLy0Oht9f8d5ULjA8MY7A8IrdSwEyD7orjozqVV+0z/nQkGtYoq2BNiWyy+zngIvKMbavHoyHwNMdTgKsqzJXF/YkA0lUUbnc66SDV5BrMgbzGXsBA2/rcNsBbjwWOAHQMQwEEIdaY6oLniA+vnygShIbdb1eDwf1w+CJJ4qefPoIwAWU/vJ4YZsXTiCTRLLffY7VQ8O79+/fpFkQ2KVbsQRJrN8u6oTrrc6tBs1EMhYK+SCJRahWfd5cU+pcfYX9XuT5+OsPk5lmC4zYQynhmZqtzUZzI0lZhCXlZNRflE1rXlhV5+aDLgipRDD2HAQcpRJS4Dx9eNZXRDgttWjzNK7tZ1VRECHESf3B+IiMJojDUtZkkTCUeASJ8eD0DQGCUOHZ2tFYsixwte7MeC05MYSSRtWzz06dPp6MNh5V4HNyDpnG2TvAM+nq2dmg7GXcCSra3hCwGDjOdDi/GbYAS+pqjkA02fuyWctmUz++LF3vVFWj26Y8MNZdhSLZpQM48QdeIB5EdGvKYZeaaJh4OE5F64BbN4/rpiDfUl7Sw7IskInEYc1gDmyBY2abGiweK6IvT0kfqRZxUNIE5nmye2YGu/7+ffuL4pQbZhd9x7BqCqq6JYIXA9QjcxjYWqoLoKs+wMPJnMPLBo5qm/unjq6Gp4FF1ZbEmBqBQPDOWhBXgxjN4JhW8vrkt9DeVCeP2BRqVKEPOwb4Lwl6RaYHfMrvJbNRLJsKBcKIw3LbRc5P4fj1yceziQK7Or6ePHz+CtYFAIDjoMHBJAvvI0iNZYcT1VFlW7HnNXLas9ZNCrXh2rQKB4NLojeNiGEzZjM7bh+OqxdMzWeQocs3QyE8fP+mGCKcO94CmMCAR/C1gkCTzlq6qEnJ0nn8QMMUkYS+DhxQ5VRHAiEKXCdzWUpf7zQO0Ks+hkoADZwWOikZCHp+/MqTKg92dx3ffzoDjlwVI2synT6/wdcOQt8Sg2yp7ff5MZ9ZETy3i+zOaSxYmDLWCG2uZ/NEyIJpCM79+sCG+i/Sz7GQL/kAOBGqiIl0B6dh4VZ7WqE1fFmjrZIE5OsNEVzidw7RB+rTpCngbOHI+nhVpD74AZtB2OxcEuLc7XcHBg4O0A4Ogy3hmJQkT0P5Pn36CeS+KtCCwusbTFArKDYRSBFCfEQRAIDjAd9gRODqIRMJujzdZH2TaY7fX//zYBI3f4X1qO1QlMOW0pqsCt3t5qgYCvmSpXV8Aff4Ag0B04A+A91ekKfT5hw+nTyBLr2eQRo5GQZWYw4Tev4CsAgU4YqGBS0Lb/LJnKaJ5MmHEcCzleGIWUV6Kx3VDeylcEslZlvfkbgL3k2VBSi5bgCPcRhIYUWQARBBmhiY0RTydjkAY0/mVyGG/X4oi+QoTzDJ0TdAUGob9CRTgdIasQ5OTYiHv8Xru/CFfJOUNhBAE5PJAb9vMukbjPUmkZYUFcq4W/UQ8HEnGKxP6W1aXfqtcEr+TJEZkJ6Y6YKkp3FhF5uCMYU6dbAsujGeXsrAFsdzvRsAaBWl+3HSU55zGQdzfwglx7A4MD4AibCfGKHuc5BmkC3fRNERJ3BimfDrb0AUwK1l6uyH6BxIFWYHIez6foE/BphvGwTSkj68fGGbPMBv4o7YpGKrzk+PzydBkUhKw88kCrC2TWiDjTqucTMWDoVAyk6MZWpVobv8iHvoyMxXYlaHywCM44VolGwz5i32shX6vSOPW/weLIZNorBwU4wAAAABJRU5ErkJggg==', 'IMAGE', true, 1, false, 4, NULL, '{"type":"XYZ","url":"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}","projection":"EPSG:3857"}', true);
INSERT INTO public.wg_base_map VALUES (2, 'WEBGIS.LAYER.BASELAY_2', 'iVBORw0KGgoAAAANSUhEUgAAAFQAAABICAYAAABof9IhAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAC2SURBVHhe7dChAQAgDMCwwf8/A4ITIhtT33WeCbN/gzQUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZSMxe5ngSMRCoiGwAAAABJRU5ErkJggg==', 'IMAGE', false, 1, false, 2, NULL, '{
  "type": "WMS",
  "url": "/geoserver/cantieriBari/wms",
  "layer_name": "no_background",
  "projection": "EPSG:4326",
  "transparent": true,
  "format": "image/png",
  "version": "1.3.0"
}', false);


--
-- TOC entry 5067 (class 0 OID 26102)
-- Dependencies: 294
-- Data for Name: wg_category; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_category VALUES (1, 'Generale', 1, true, NULL);
INSERT INTO public.wg_category VALUES (2, 'WEBGIS.LAYER.CAT_2', 2, true, NULL);
INSERT INTO public.wg_category VALUES (11, 'WEBGIS.LAYER.CAT_11', 4, true, NULL);


--
-- TOC entry 5068 (class 0 OID 26110)
-- Dependencies: 296
-- Data for Name: wg_layer; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_layer VALUES (65, 1, NULL, 1, 'WEBGIS.LAYER.LAY_65', 'IMAGE', true, 1, false, '{"type":"WMS","url":"/geoserver/stretor/wms","layer_name":"confine","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{644071.744,4542188.987,671082.984,4559040.039}', NULL, NULL, NULL, 1, NULL, 4, NULL, NULL);
INSERT INTO public.wg_layer VALUES (69, 1, NULL, 1, 'WEBGIS.LAYER.LAY_69', 'IMAGE', false, 1, false, '{"type":"WMS","url":"/geoserver/stretor/wms","layer_name":"view_circoscrizioni","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{644095.1996,4542006.1789,670807.2919,4559042.7287}', NULL, NULL, NULL, 5, NULL, 4, NULL, NULL);
INSERT INTO public.wg_layer VALUES (70, 1, NULL, 1, 'WEBGIS.LAYER.LAY_70', 'VECTOR', true, 1, false, '{"type":"VECTOR","url":"/geoserver/stretor/wfs","layer_name":"arco","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","nome_via"]}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 50000, NULL, '{"styles":{"default":[{"fillColor":"rgba(34,34,34,1)","font":"9px sans-serif","strokeColor":"rgba(34,34,34,1)","text":"[[nome_via]]","placement":"line","type":"text","offsetY":-6,"maxScale":5000},{"strokeColor":"rgba(34,34,34,1)","strokeWidth":"1","type":"line"}],"hover":[],"default_key":"_arco_1663603446782_default[[nome_via]]"}}', NULL, NULL, 6, NULL, 3, NULL, NULL);
INSERT INTO public.wg_layer VALUES (66, 1, NULL, 1, 'WEBGIS.LAYER.LAY_66', 'IMAGE', true, 0.4, false, '{"type":"WMS","url":"/geoserver/stretor/wms","layer_name":"view_municipi","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{644071.968,4542189.125,671066.375,4559040.0428}', NULL, NULL, NULL, 2, NULL, 4, NULL, NULL);
INSERT INTO public.wg_layer VALUES (19, 2, 16, 2, 'WEBGIS.LAYER.LAY_19', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"anno_richiesta","operator":"EQ","property_val":"2022"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"strokeColor":"rgba(226,14,234,1)","strokeWidth":"5","type":"line"},{"fillColor":"rgba(226,14,234,0.5)","radius":6,"strokeColor":"rgba(226,14,234,1)","strokeWidth":"2","type":"circle"}],"hover":[],"default_key":"in_alloc_view_cantieri_chiusi_EQ_2022_default"}}', NULL, NULL, 1, NULL, 1, NULL, NULL);
INSERT INTO public.wg_layer VALUES (22, 2, 4, 2, 'WEBGIS.LAYER.LAY_22', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"In corso"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"strokeColor":"rgba(131,131,131,1)","strokeWidth":"5","type":"line"},{"fillColor":"rgba(27,0,255,0.5)","radius":4,"strokeColor":"rgba(27,0,255,1)","strokeWidth":"2","type":"circle"}],"hover":[],"default_key":"in_alloc_view_cantieri_aperti_EQ_In corso_default"}}', NULL, NULL, 3, NULL, 1, NULL, true);
INSERT INTO public.wg_layer VALUES (56, 11, 55, 2, 'WEBGIS.LAYER.LAY_56', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"anno_richiesta","operator":"EQ","property_val":"2022"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/56/getFile/cono_nero.png","type":"image"}],"hover":[],"default_key":"in_alloc_view_traslochi_chiusi_EQ_2022_default"}}', NULL, NULL, 1, NULL, 1, NULL, NULL);
INSERT INTO public.wg_layer VALUES (14, 2, 4, 2, 'WEBGIS.LAYER.LAY_14', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"Autorizzato"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"strokeColor":"rgba(208,0,0,1)","strokeWidth":"5","type":"line"},{"fillColor":"rgba(208,0,0,1)","radius":4,"strokeColor":"rgba(208,0,0,1)","strokeWidth":"2","type":"circle"}],"hover":[],"default_key":"in_alloc_view_cantieri_aperti_EQ_Autorizzato_default"}}', NULL, NULL, 1, NULL, 1, NULL, true);
INSERT INTO public.wg_layer VALUES (67, 1, NULL, 1, 'WEBGIS.LAYER.LAY_67', 'IMAGE', false, 1, false, '{"type":"WMS","url":"/geoserver/stretor/wms","layer_name":"view_quartieri","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{644071.7188,4542189.0781,671066.3594,4559040.0156}', NULL, NULL, NULL, 3, NULL, 4, NULL, NULL);
INSERT INTO public.wg_layer VALUES (54, 11, 48, 2, 'WEBGIS.LAYER.LAY_54', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"Negato"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/54/getFile/cono_nero.png","type":"image","geometry":"center"}],"hover":[],"default_key":"in_alloc_view_traslochi_aperti_EQ_4_default"}}', NULL, NULL, 4, NULL, 1, NULL, NULL);
INSERT INTO public.wg_layer VALUES (21, 2, 4, 2, 'WEBGIS.LAYER.LAY_21', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"Preso in carico"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"strokeColor":"rgba(0,111,255,1)","strokeWidth":"5","type":"line"},{"fillColor":"rgba(27,0,255,0.5)","radius":6,"strokeColor":"rgba(27,0,255,1)","strokeWidth":"3","type":"circle"}],"hover":[],"default_key":"in_alloc_view_cantieri_aperti_EQ_Preso in carico_default"}}', NULL, NULL, 2, NULL, 1, NULL, true);
INSERT INTO public.wg_layer VALUES (51, 11, 48, 2, 'WEBGIS.LAYER.LAY_51', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"Preso in carico"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/51/getFile/cono_giallo.png","type":"image","geometry":"center"}],"hover":[],"default_key":"in_alloc_view_traslochi_aperti_EQ_Preso in carico_default"}}', NULL, NULL, 2, NULL, 1, NULL, NULL);
INSERT INTO public.wg_layer VALUES (52, 11, 48, 2, 'WEBGIS.LAYER.LAY_52', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"EQ","property_val":"Autorizzato"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/52/getFile/cono_rosso.png","type":"image","geometry":"center"}],"hover":[],"default_key":"in_alloc_view_traslochi_aperti_EQ_Autorizzato_default"}}', NULL, NULL, 3, NULL, 1, NULL, NULL);
INSERT INTO public.wg_layer VALUES (68, 1, NULL, 1, 'WEBGIS.LAYER.LAY_68', 'IMAGE', false, 1, false, '{"type":"WMS","url":"/geoserver/stretor/wms","layer_name":"view_localita","projection":"EPSG:32633","transparent":true,"format":"image/png","version":"1.3.0"}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{644071.7188,4542189.0781,671066.3594,4559040.0156}', NULL, NULL, NULL, 4, NULL, 4, NULL, NULL);
INSERT INTO public.wg_layer VALUES (36, 2, NULL, 1, 'WEBGIS.LAYER.LAY_36', 'VECTOR', true, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_cantieri_oggi","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","id","indirizzo","data_inizio_str","data_fine_str"]}', NULL, '{"feature_id":"id","complex_data":[{"key":"id","label":"id"},{"key":"indirizzo","label":"Indirizzo","type":"TEXT"},{"key":"data_inizio_str","label":"Data inizio","type":"TEXT"},{"key":"data_fine_str","label":"Data fine","type":"TEXT"}]}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"strokeColor":"rgba(208,0,0,1)","strokeWidth":"5","type":"line"},{"fillColor":"rgba(208,0,0,0.5)","radius":6,"strokeColor":"rgba(208,0,0,1)","strokeWidth":"2","type":"circle"}],"hover":[]}}', NULL, NULL, 1, NULL, 7, NULL, NULL);
INSERT INTO public.wg_layer VALUES (4, 2, NULL, 1, 'WEBGIS.LAYER.LAY_4', 'VECTOR', false, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_cantieri_aperti","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","azienda","indirizzo","stato","protocollo_approvazione","data_protocollo_approvazione_str","data_inizio_str","data_fine_str"]}', NULL, '{"feature_id":null,"complex_data":[{"key":"azienda","label":"azienda","type":"TEXT"},{"key":"indirizzo","label":"indirizzo","type":"TEXT"},{"key":"stato","label":"stato","type":"TEXT"},{"key":"protocollo_approvazione","label":"Protocollo approvazione","type":"TEXT"},{"key":"data_protocollo_approvazione_str","label":"Data protocollo approvazione","type":"TEXT"},{"key":"data_inizio_str","label":"Data inizio","type":"TEXT"},{"key":"data_fine_str","label":"Data fine","type":"TEXT"}]}', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 'VIEW_LYR_4', 7, NULL, true);
INSERT INTO public.wg_layer VALUES (16, 2, NULL, 1, 'WEBGIS.LAYER.LAY_16', 'VECTOR', false, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_cantieri_chiusi","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","anno_richiesta","id"]}', NULL, '{"feature_id":"id","complex_data":[{"key":"anno_richiesta","label":"anno_richiesta","type":"TEXT"}]}', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"params":[{"id":"azienda","name":"azienda","type":"string"}],"result":[{"id":"azienda","name":"azienda","type":"string"},{"id":"data_inizio","name":"Data inizio","type":"date-time"},{"id":"data_fine_str","name":"Data fine","type":"string"}]}', NULL, 3, 'VIEW_LYR_16', 7, NULL, NULL);
INSERT INTO public.wg_layer VALUES (47, 11, NULL, 1, 'WEBGIS.LAYER.LAY_47', 'VECTOR', true, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_traslochi_oggi","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","data_inizio_str","data_fine_str","indirizzo","civico_iniziale","civico_finale"]}', NULL, '{"feature_id":"id","complex_data":[{"key":"data_inizio_str","label":"Data inizio","type":"TEXT"},{"key":"data_fine_str","label":"Data fine","type":"TEXT"},{"key":"indirizzo","label":"Indirizzo","type":"TEXT"},{"key":"civico_iniziale","label":"Civico iniziale","type":"TEXT"},{"key":"civico_finale","label":"Civico finale","type":"TEXT"}]}', '', NULL, NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/47/getFile/cono_rosso.png","type":"image","geometry":"center"}],"hover":[]}}', NULL, NULL, 1, NULL, 2, NULL, NULL);
INSERT INTO public.wg_layer VALUES (48, 11, NULL, 1, 'WEBGIS.LAYER.LAY_48', 'VECTOR', false, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_traslochi_aperti","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom","stato","data_inizio_str","data_fine_str","azienda","data_richiesta_str","indirizzo","civico_iniziale","civico_finale"]}', NULL, '{"complex_data":[{"key":"azienda","label":"Azienda","type":"TEXT"},{"key":"data_richiesta_str","label":"Data richiesta","type":"TEXT"},{"key":"stato","label":"Stato","type":"TEXT"},{"key":"data_inizio_str","label":"Data inizio","type":"TEXT"},{"key":"data_fine_str","label":"Data fine","type":"TEXT"},{"key":"indirizzo","label":"Indirizzo","type":"TEXT"},{"key":"civico_iniziale","label":"Civico iniziale","type":"TEXT"},{"key":"civico_finale","label":"Civico finale","type":"TEXT"}]}', '<p><br></p><table class="table table-bordered"><tbody><tr><td>Stato</td><td>[[stato]]<br></td></tr><tr><td>Data inizio</td><td>[[data_inizio_str]]<br></td></tr><tr><td>Data fine</td><td>[[data_fine_str]]<br></td></tr></tbody></table>', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, 2, 'VIEW_LYR_48', 2, NULL, NULL);
INSERT INTO public.wg_layer VALUES (55, 11, NULL, 1, 'WEBGIS.LAYER.LAY_55', 'VECTOR', false, 1, false, '{"type":"VECTOR","url":"/geoserver/cantieriBari/wfs","layer_name":"view_traslochi_chiusi","projection":"EPSG:32633","format":"application/json","version":"2.0.0","strategy":"BBOX","attributes":["geom"]}', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"params":[{"id":"azienda","name":"azienda","type":"string"}],"result":[{"id":"azienda","name":"azienda","type":"string"}]}', NULL, 3, 'VIEW_LYR_55', 2, NULL, NULL);
INSERT INTO public.wg_layer VALUES (50, 11, 48, 2, 'WEBGIS.LAYER.LAY_50', 'VECTOR', false, 1, false, '{}', NULL, NULL, NULL, '{"property_name":"stato","operator":"ILIKE","property_val":"Inviato"}', NULL, NULL, NULL, NULL, NULL, '{"styles":{"default":[{"src":"/wgLayer/50/getFile/cono_celeste.png","type":"image","geometry":"center"}],"hover":[],"default_key":"in_alloc_view_traslochi_aperti_EQ_Inviato_default"}}', NULL, NULL, 1, NULL, 1, NULL, NULL);


--
-- TOC entry 5072 (class 0 OID 26135)
-- Dependencies: 301
-- Data for Name: wg_layer_attach; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_layer_attach VALUES (2, 'barr_rossa.png', '', 1463, '2022-08-02 12:08:38.83+02', 4);
INSERT INTO public.wg_layer_attach VALUES (4, 'barr_celeste.png', '', 1454, '2022-08-02 12:11:29.872+02', 4);
INSERT INTO public.wg_layer_attach VALUES (5, 'barr_gialla.png', '', 1447, '2022-08-02 12:12:07.006+02', 4);
INSERT INTO public.wg_layer_attach VALUES (6, 'barr_nera.png', '', 1307, '2022-08-02 12:12:21.617+02', 16);
INSERT INTO public.wg_layer_attach VALUES (12, 'barr_gialla.png', '', 1447, '2022-08-02 15:14:32.158+02', 21);
INSERT INTO public.wg_layer_attach VALUES (22, 'cono_nero.png', '', 1159, '2022-08-03 09:40:49.093+02', 56);
INSERT INTO public.wg_layer_attach VALUES (10, 'barr_rossa.png', '', 1463, '2022-08-02 15:13:56.649+02', 14);
INSERT INTO public.wg_layer_attach VALUES (23, 'cono_rosso.png', '', 1240, '2022-12-01 14:39:07.514+01', 47);
INSERT INTO public.wg_layer_attach VALUES (24, 'cono_celeste.png', '', 1238, '2022-12-01 14:40:44.455+01', 50);
INSERT INTO public.wg_layer_attach VALUES (25, 'cono_giallo.png', '', 1222, '2022-12-01 14:41:03.576+01', 51);
INSERT INTO public.wg_layer_attach VALUES (26, 'cono_rosso.png', '', 1240, '2022-12-01 14:41:28.184+01', 52);
INSERT INTO public.wg_layer_attach VALUES (27, 'cono_nero.png', '', 1159, '2022-12-01 14:41:48.204+01', 54);


--
-- TOC entry 5069 (class 0 OID 26116)
-- Dependencies: 297
-- Data for Name: wg_layer_image; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_layer_image VALUES (1, 'Gruppo', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AYcCBQAb6IqSAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAALUlEQVQoz2NgoDdgxCZYXFz8H5+m3t5eRpI04ZQjRRMjsc4bdSqtnIrViXQDAH8wLCWGFZoLAAAAAElFTkSuQmCC');
INSERT INTO public.wg_layer_image VALUES (2, 'Puntuale', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AYcCBA4I8xX0gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABYklEQVQoz32Sv0vDQBTHv+/aRtNqqS0O6iQ4OIhOQvwDHHVyUShUxL+gDuJQSUEo2NXVlCKCUNy6uskFQQRxcekmuBSk+Cu1zXMwF64h+CDk8u597l7e9wtmRlwwc/j8G6eXd4btyAwzJ5iZ9APiggJo8vX+qqeS9Xqdgj0molhQ2I5MfXpDT0/Wmm7+v+6YGeJ4d+1npmCO6Rt7m8vv+vfZ9UOmdfOcVb9AREgCwP7Gykft7SvRH8JYmMv507n0QLVpO3K+c3vR6QCQbUDBgplBRP5h0fIBeDvri30AfgCZALr67dWGawJIUQBCvaNhO3K299R60QYnAIgRrZiZbEea5+3HCWYWWi5/0pSFoNZgZjFyRblcDkXLLm2NV0qWFycfAAjNAOlIUbbacA01xZAkYiLiEDzYXv2OylUpWQMNABGx0pHCxd+AqNpwp5IJ0FHR6qrWFBDrBM3YImruOL/+Aib4uErArh1kAAAAAElFTkSuQmCC');
INSERT INTO public.wg_layer_image VALUES (3, 'Lineare', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AYcCCgC8l8ymwAAAQBJREFUKM+tkTFKA0EYhb9/ZkVCQEFQUYmiEoUF1zp6ACvbFVLoBQQxU3gECxnB43gC+7RiIxbqIpKgiJjd3yK4bkIEF33lzHtvmO8BoKqUlVVV4jgGIEmScukwDH/lm5yaZW5pvVy5iKF5dMb0/DIAwbDBGIuiaJYVQkKrdaxwz/vbqwCY4eDe4Sm7ByeISH5WRNd9fuyXATjnSmH13ovhL7K2/1XnnH69HjV2GK9Uc8/a5jaL9eibBYCxAfvuYqCsfXVJbXUDgJmFFdLeB7fX7fw+AEjTHpmm+HMvI4agUp3gpfM0SL84Q5EkgBgBFBuM8XB388PAZjSnerTFv+oTfQFBVbT4RfoAAAAASUVORK5CYII=');
INSERT INTO public.wg_layer_image VALUES (4, 'Poligonale', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AYcCBMPsFyhHgAAAPVJREFUKM+VUstxgzAU3PUwOboSF2D6cAGhBr1zGDjr1QAF0AcUQCUcc9kcgjSKDclkb0/vt7t6xA5JIAlJOELKkfyOASCEcFx9AndnVQbdMAMA2qYGAHTDjLapMwszywsuR9RCCErv3TCjHxeYmdyduTFxTts+3u9wd5LMm7d10vX2yIwk4ZImbOukbZ1kZio1p6ZnoypJMDOkZKFJSTvgCCG8DMiaumHOlI/0Sso/cCmLSjcTYoxMbvbjglNX26bGtk5vaTJJuDtL3ZJQPV/GPvWzbWr+dgQ/qPbj8kI36b7eHtzWKW/l7uq/Ti7GSJ4d9V/4AgfUoekPtJzxAAAAAElFTkSuQmCC');
INSERT INTO public.wg_layer_image VALUES (5, 'Raster', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4QIPEQYVFQyrmwAAAEpJREFUKM9jYCATMDIwMDCkZJX+Z2BgYPDy8mJgYGBg2LZtGwM+fpCPIyMTuTaykGITjM/AwMBAmY3E2gTjz5nWzTDqx0HlR7IBAFQtOpyd8ZdIAAAAAElFTkSuQmCC');
INSERT INTO public.wg_layer_image VALUES (6, 'Testuale', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4AgfBy8TcXfSHAAAANdJREFUKM/ljz1KxHAcRN/82KgQRMgFbLYTzyEKWguCkFKLFImVtY0I/yaN+LHgBSwET+IN0lpoY6EhGZsgYuMBdpppHo8ZWNI0TeP/GE3gle1S0irwCBzbvpO0b7sEPiXdA7ntMqX0rN+Wqqq2six7AWT7wLYlXUrSOI7nEfFq+yGlNBdAXde7kk5tb0vaBOi6biXP8yiK4h2Ivu/X27b9+jv1DTgZx3EjIq4BbO8BM+Bi6jPbH5IWKaX5bBI82b6JiNsfo3QI7AzDcBQRBhYRsTZ9Xop8A5paWU4SQhULAAAAAElFTkSuQmCC');
INSERT INTO public.wg_layer_image VALUES (7, 'Geometria', NULL);


--
-- TOC entry 5074 (class 0 OID 26141)
-- Dependencies: 303
-- Data for Name: wg_legend; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_legend VALUES (40, 4, 'WEBGIS.LEGEND.LEGEND_40', NULL, false);
INSERT INTO public.wg_legend VALUES (59, 52, 'WEBGIS.LEGEND.LEGEND_59', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAARtSURBVFhHrZddTFxFFIBn5t5d9+/K7hroLlgkgcawoLUxQEuIhhYIsSHRplprI740Pvti6IOaFHwo6ovPpg+tQXmoPwmCVUttUoqtfUBS07DZmkBSCpYAiwjs353xzDC76cJd7qzlS+5m5szcnXPPOXPmDEaK3Dx16knz4cNXGDNbEWMvMIaqQOzfHEVxeGYwwRMYa79qZWUjBwcG/tkc2hlbBca7umpYYr2HZsy3MGMeKd4RhvE61rSvidtzrnlo6J4UW1JQgfHjx91mPH4WmZn3YGGHFBcFKJLGuvY5KQl81Hzp0oYU52GpwFhnZzVLJb/DlD4nRY8HIXeI13fMyhrbFLh59Oj+9Praz/DVZVK0O2C8gNyejpaRkT+kRJCnwNir8OUrifFiFmfw2AZSFlCC+IzmRy2Re1f4fGnxlqrZn+7upqVt7aK9MHoF3b9wgYiODYyQP7XgU43ZmMi9xANOdXGIblbZ/Q727N1L+FP5djcmHg83hi2wRj1dWe6VXaTxH7HVkokvwRyib4dRX8+Iy4Vi/f1s/ochphsGSi0uouT8vJI3GGMN79bVDZ6PxZaEBfg+L2arucJhGu09SxJzD3Bibg7ztisUpnLYFr6WmUz0iDbPcOkHs3MgVEoyHPB/xhEIkj2dneKL//7pMksvLdH7Fy/qYoICPFk5yivCeKyj4wRKJQelXImGb76lzmAwL+hSy8v092OvEeUdAWCH8yRBNHNY9pVw7gmJxVejUTr1cR+d6uujq9Ep6gwEwA0hZTcIqHkYjx1pvYVM2ihFtgRfepmmV+JodXKSIE3bjHzTxMbz+0GxAFu8dk0pkAWE3CbyVFNG93rpWiyGw6+/QV8c+Irxh7fX7sWwBttTTlOlCl9vbU1iRp1SYMuzvX2m/8ABovt8ee7OrK2x+MQEjX74gbIFICmliXoeBRwOFmhq2rY4ByyDA42NhM+RIiV4JPNiQglvdTXTnM6CKvMxX02NsgLwR3GCMZqWfVuMSJ1sFUZlziNMgwtw3vG4E0akVrYKY9Taz8mCYW2CiH5V9m0xaiOyVRgjYj8nB9GuEr209EeeFqWoIHqJn7rLy22PXDgniO732yYkviYvXkVA3Wg/8gVLZ06LkQI4Q2EW6upSCjA4IXEKDinZtUbXz7dcGT0tJvHj2Px39a7VieiufIZ69+2TveKA5IQ2Zma2WY0Xq7rHW3doeDiW0/J6W9snOJN+X3YFmt/PGgYHkfaEa+evKYCZTLLbb57gxU7++w79s5ZfRsVauQGrksxVUUEj5/pl7/9x90wPSszO5qywtSTL00wWpb+BK0qlaHexKErz/NPy/eW/HB5vO/hoQYp2D1mWb70bbAuQg8PDk7jEdQhMdUeKHhtudv7lW+8EHMt9zS0BfmrCTsenPGKluGjEuxBwwucF7oi20c23KN1YP8NM8+TWupEnBas/4EmGX05h9/TzrSbFltgqkCV7PadQRvHrObxYBQqI6zm049Ce5ucKgfSqfj1H6D8f0cHfxtm/hgAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (43, 22, 'WEBGIS.LEGEND.LEGEND_43', 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpUWrDlYQcchQnSxIFXGUKhbBQmkrtOpgcukXNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9TaBHjwXE/3t173L0DhHqZqWbXJKBqlpGMRcVMdlX0vcKPXvRjCBGJmXo8tZiG6/i6h4evd2Ge5X7uz9Gn5EwGeETiOaYbFvEG8cympXPeJw6yoqQQnxNPGHRB4keuyw6/cS40WeCZQSOdnCcOEouFDpY7mBUNlXiaOKSoGuULGYcVzluc1XKVte7JXxjIaSsprtMcRQxLiCMBETKqKKEMC2FaNVJMJGk/6uIfafoT5JLJVQIjxwIqUCE1/eB/8LtbMz8VcZICUaD7xbY/xgDfLtCo2fb3sW03TgDvM3Cltf2VOjD7SXqtrYWOgIFt4OK6rcl7wOUOMPykS4bUlLw0hXweeD+jb8oCg7dAz5rTW2sfpw9AmrpavgEODoHxAmWvu7zb39nbv2da/f0AkupytBttTL0AAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmCAsOHBwTULLnAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAACZJREFUSMdjYBgFo2AUMEZHR/+npQVMtPbBqAUjwIJRMApGAR0AAMOUAh6fA6wKAAAAAElFTkSuQmCC', false);
INSERT INTO public.wg_legend VALUES (42, 21, 'WEBGIS.LEGEND.LEGEND_42', 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpUWrDlYQcchQnSxIFXGUKhbBQmkrtOpgcukXNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9TaBHjwXE/3t173L0DhHqZqWbXJKBqlpGMRcVMdlX0vcKPXvRjCBGJmXo8tZiG6/i6h4evd2Ge5X7uz9Gn5EwGeETiOaYbFvEG8cympXPeJw6yoqQQnxNPGHRB4keuyw6/cS40WeCZQSOdnCcOEouFDpY7mBUNlXiaOKSoGuULGYcVzluc1XKVte7JXxjIaSsprtMcRQxLiCMBETKqKKEMC2FaNVJMJGk/6uIfafoT5JLJVQIjxwIqUCE1/eB/8LtbMz8VcZICUaD7xbY/xgDfLtCo2fb3sW03TgDvM3Cltf2VOjD7SXqtrYWOgIFt4OK6rcl7wOUOMPykS4bUlLw0hXweeD+jb8oCg7dAz5rTW2sfpw9AmrpavgEODoHxAmWvu7zb39nbv2da/f0AkupytBttTL0AAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmCAsOGy0NzyQaAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAF1JREFUSMft0zEKhEAMAMBZ7/Ta+43V/cbH2tv7Ah9wCLo2a2NjtVYZCCQQCAmEEELqhmnEFx+0eKFBOntKfbUjlzxjK7HijwXzG33FBX5N7QvVHiAG3NnjUUN4wAFbxgxfL+8nQgAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (39, 36, 'WEBGIS.LEGEND.LEGEND_39', 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpUWrDlYQcchQnSxIFXGUKhbBQmkrtOpgcukXNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9TaBHjwXE/3t173L0DhHqZqWbXJKBqlpGMRcVMdlX0vcKPXvRjCBGJmXo8tZiG6/i6h4evd2Ge5X7uz9Gn5EwGeETiOaYbFvEG8cympXPeJw6yoqQQnxNPGHRB4keuyw6/cS40WeCZQSOdnCcOEouFDpY7mBUNlXiaOKSoGuULGYcVzluc1XKVte7JXxjIaSsprtMcRQxLiCMBETKqKKEMC2FaNVJMJGk/6uIfafoT5JLJVQIjxwIqUCE1/eB/8LtbMz8VcZICUaD7xbY/xgDfLtCo2fb3sW03TgDvM3Cltf2VOjD7SXqtrYWOgIFt4OK6rcl7wOUOMPykS4bUlLw0hXweeD+jb8oCg7dAz5rTW2sfpw9AmrpavgEODoHxAmWvu7zb39nbv2da/f0AkupytBttTL0AAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmCAsOHwu7rmTjAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAACZJREFUSMdjYBgFo2AUMG7kZ/xPSwuYaO2DUQtGgAWjYBSMAjoAAN/GAc788TifAAAAAElFTkSuQmCC', false);
INSERT INTO public.wg_legend VALUES (57, 50, 'WEBGIS.LEGEND.LEGEND_57', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAARrSURBVFhHtZdNbBtFFIDf7Hq967/YxiYpThriNBAElFIBJXEDaiLxe4MDB7hWQgLx14iGniIhoSj8VPwdOIC49QIVcKkQCOfQNkSCg9solJTS2CBqpw3EqRP/Zb3Dm92xhRM7O07DJ6383tvxzOx7M/PmERBk8swFH9UdT1DDGDYI2U8p7QGgAestyRJCkthZQqbGVMgZOnV46Oac9W5rbCdw/HSqt6iXxgxKn0PVY1ltoJCXCJxQiTQ5OnzbJW5tSNMJfD61oGWIPl6pGEewlZObW4PCukTI+6qmjY/GugvcWkfDCXw4k4zmCuWv0M37uOmGwEFmvU7y1CtDt//OTTU2TeC96Ut7C8XK9yh2WJadAQe6qjjhsaND/QluMpH4rwn78v9jcAYFaC+X6HcfnEnt4SaTmgdYzK/Q0gwFIuT2we4gvbvDZ8q/XM2Rs6llU7aDhUPTXA9W10TNAxlaHhcdXMElfqg3TNq9mvk8HA2DU94UzYagJ/aWi/k3uWp54Pjp+d58GS6gJrTau/0aHOgK0pk/lwl2CAO7g/Tnv7IklW240DeDu0OR5bvGDvX9ZnqgpJOjooMzAppCv5xLk6W1MvyNMz+Jsl91sLmIQUAxaGXMFD+eWvRmaTaDstghgxzE+HucDrIv4jf18+kVWC3p9Owfy2JxQLBh3usmt0ir8srjqAsPzrivK0Ae2B3EuEvmc39XEFAXHpyB7nIXytKTkmHQEW4TwueUwacqkMkV4Zu5NHyNT/p6EdAjgGHgrcQwdH2EvBWfn8bZDHKbLf1hDy3pBiSzBVL9ZBb8W/0u6lJk+HVptYUwkJ/YIsSsJo6KLr+SK5IDXQF4YSAKLw5GcUcEIL1aIqJbsQoF2sM8kMcvcHGbLU/fuYtGQx6iOWRusSjpFVj4Z42enMu04oFy3VFsB54/0Bf2bhqcoaKNvZNrgRGDTSBrifa0e1RQMATNcEgSdHjFMzeGYIX1lrRUezrbNC41p7NNOJosBEnm1br0uBUiE4gItKlCwEhIkoPEuW5LxG//dZ2YJ0SRiCMueW/yf4vymmVqjuaQIOS2j2/Q5QS3Yr+20fN5l8s4ZS7ZiamLn1Qofd5804Q2POX287PfjgTmhpWizrXG4JHx2bHh/sPmBLZKx2G309jlU7nWGou5ElzLN9jqmI69mI5fxXRc27QT8fmJCsAbXDXRZIm+dLCXJZxau1ZYrxj0o+nLUNCNuv/LQN89NnLH60yuvWh0JcPkYjxzT2Rbg1f5YjZNs8X1mhews7orWV3n7FJ6PV/6EcUdv5SaUHrNJcmx/xYrdfF5eaBnwaXJj6C4aFl2EBzco5JHN1ZKmxbIaKxv1q1ADGu9c9x0wzC3+1Rp8LUNNQGj4YY98lD/5QgoA7hVJlEtW9ZtwEozibzDYt6oKmLYLrC3f7i4RyfGmAHkWVQFi1OKxSk5oWpYnMa2WZxu5FMsz5ewPMcqeQTvD/ey8pzw8hzDlUU9hXf0hOyQ4yE5IFieA/wL452CBY08cQkAAAAASUVORK5CYII=', false);
INSERT INTO public.wg_legend VALUES (58, 51, 'WEBGIS.LEGEND.LEGEND_58', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAARbSURBVFhHtZdta1xFFMfnnHvv3n3MJrbN5jkxEUFtbRU0GFIxD9Roq7SlolhBrJ9AUCm+0BYVaUX8AqIvtIWCUEHTBnUToaWoL0xrgmK0kk1MGqN1s8luNnv37hzn3k5Ctsnmztb4g1lm/nNnz+HMmSdgivx88clIxLb6qJDvBqJdQmphxCrdTmBz4jcBAMPE9CHTrD+/rfPDBbfPA08HEvH9bRpLv0pUOAyMQlL2ADKM4WmuBU82dX3+mxTXpaQDNPS8f4pPH2NkvyRaPimXBRHkAbX3eaDyWFPHp1kpF7GuAzMX9rbaS0tnGRTuldJ/BEcMf8WBWOdnV6WwwhoHJuN7dzJa/FKEu1pKmwIx+MunBfbEus5dlpJLkQPOfCOlLm228WUcJ0gLd6zOixUHJi4dCuDiP98xxndIaUNCzc/yUE2vW8/MxFkmcQrdhic4yoO3PbicEyuDtKX546rGGfop2noEjPDt6JRo2wvAMECy1wO+Xcum3pSNGxH4c+iJOyw7/RMAGa7qga9yJw81HGTpiTNuO9z0NMtMnWVW8rJaFMTqYKZ/e8PD58fcAZadPapq3EEP1PHk6BtoZybAKU5d99dy2e2NsEWWddSt/v3t4YpsevqaSLyg26lAuOU5G40qDNX1iQgCy1wbIG4leXr8Y11+ogBkg5Vba3EpO/t4OcYdwg37MdJ0EFEPAuoBiDQewLAoslsRCqTnU/uQFXi3VJRAs5pr5ha05sf49dG3RXmL50Rd81Uh+mvUp0GAxLvgj3j394z4A1LzxNy2m5OdJis5rIm1IzO/AIZITOEELc1+I3Q1iLQfkEicamWg6WFupX7BUOMhHuv4hGIdpyjU+BTPL/wqtn3VpShB3gyTX3dbwLjyCqjacbxgVt2PmhEu2kUL+TTlksM8OfK6egTEYYPiVx3Qyb+lfY1xB0dz+hgYZUVBDHAvE0oY4TZCzVxjfBnUfGBE2tQdAJhDADYum574onfLWml8FffImgIcEmIKoOh43AhfhYID0btkzRtANoxMw0HZ9sRQ+HOVKC3DQRtCf6D6nMjGRamVBPQoGcE6z91OD9QgGpUKGxJkwxXRL9yEmoz3fgBkv+jqJUAzRqH6fUoJlpnqB56bKZmsDsC0j+p740fcjzY6jvVQCzcid8pWeeQXxpidGV8btVXH8YqXU4O9J4nbr8imixP2ms4zYnmVXnobwQs5mrn4jLhYzxWNBzDeq+/56mW37iqC9a5k6K+lrbveKW97vYnrV15jhez0qigUX8mKPEvE+8SlNPe/Xkp94lIaW3UpLZqf5p6BqwyCe8SHs1LaNBzjoJuPrjbusCZBGnv6rxhm8CEG2o9S2gRwxLmONzwyMCyFFdZd1zW7+3+vb21oFwfLCTFLlpTL5sbTzPeumPP2Um9Ez+y+lcepMLzIEE8TBk/c8uP0ZtzneS73GDG7SzzP7xNSsyju85yIUuJpPi7WlzhX9EH15zlj/wJ5maYyHoeitQAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (44, 19, 'WEBGIS.LEGEND.LEGEND_44', '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bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjZkMjgwMGNiLWJkMzEtNDllNi04ZjZhLWQ0OGEwNDJiNmFkNCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3OGEwZWQ3NS00N2FjLTQxMTAtOGZjMy01MThhNTU3M2MwNzYiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozYzljOWI2Yi0xYjM3LTQ3NDQtYWU5Ni04MjJjOTdlMzliMTMiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTY2MzY4OTMyODI5ODY3NiIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjI4IgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCI+CiAgIDx4bXBNTTpIaXN0b3J5PgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjllZjY2ZDkwLWRhYzUtNDViZS04ZjFlLTVhMzBlZGQ1MTAyYiIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChXaW5kb3dzKSIKICAgICAgc3RFdnQ6d2hlbj0iMjAyMi0wOS0yMFQxNzo1NToyOCIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4Xw4zYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5gkUDzccUfhLwAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAmSURBVEjHY2AYBaNgFDD+Zfjyn5YWMNHaB6MWjAALRsEoGAV0AAAQNwL+5NpXLgAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (60, 54, 'WEBGIS.LEGEND.LEGEND_60', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAAQcSURBVFhHtZdLSFtBFIbnXuOrqFFQUPERH/VBs1AokVZc6EIl6qKgi7oS3Oiqixbahe2iVWgptNCVSxdKoQgVNb4WdidooRWsIG1Ag6LQFJ/QoNFM/zMZQ9SYO1ftB5N75sydnDNnzjyuxhRpbGxMwcPJOa9DqYBsQ0mlNrCL4tE07TueX9LT011DQ0P7osUAQweamppuHx8fP4XRh6jeCmoN8cGZjxaL5bXL5foldRG51IHW1tbEg4ODlzD8CNXYoNY0fjjyITk5+fnw8LBP6s4Q0YGWlpbio6OjzzBul6prASd+xMXFPRgbG3NLVYgLDjidzgqEfAZiRlBzY/zRdb1+amqK8iTEGQdo5IeHh3MQDY2npKTw4uJiIbvdbra/v2+YT+BPbGzs/fC8CHWSc76gEnYkFxsYGOAZGRmiv9fr5R0dHRoiJ9oNWMZ0OMbHx/9SRRcqIBNOac4LCwuF8Y2NDb6+vi7koqIiLpuNuANHX0k5GAFaan6/fxmiUrbX19dzhJzNz8+L/g6Hg6emprLp6WmVaSCOY2Ji7kxOTv4UEYBHz/BQXmrozMl4VVUVp7KwsKAhwVQjQFgCgQDZZFpbW5t1b29vC3IiKVTo6ekJFBQUaDk5OWLENBWrq6u8t7c3NKUK+KxWa5aOUDpRUTZO2V9TU6OTceQMo0Iy6fCHZqJASd+s4w/qpEKJsrIyhnxhMzMzvKurSxTMPScdtZkBtmu1hoaGrxDuSp0hzc3Ngbm5OW17e1tLTAwGzufzsbS0NF5dXc2xvMxMwzeKAJ1qypycnDAkHOvs7OSDg4OikIzEFG1mwBZtowj44YRF6qKCDqy/vz+AOddpMwqHNiHaE7q7u0VuKHJiJlwsNzeX22y2C8YJ0tHKyMvLM5OIjKaALhNKqCSZmURERHd1/KzJuiE37QAG76EILMq6IeXl5VK6HJV3TsHgv1MEZmU9KgkJCTw/P99wr6d3sDyV8gCraVanCyTkiNelcEpKSugMkLXLoSVK7yrgS0pKcsUsLS0d4mJRCEVlUB8Zu93OMjMz2c7OjmHxeDwMZ0PUaCHyg6Ojo5/ES9GOY7xIxdTSOgX5ddme4Ec07XQch7zEhvQWLz+RVUFpaSnv6+tjuNUazn0kcNhwnJxsZWXlTH9M0zvcDR8LWWgAjLzASH/IqgB7+5WNE9SX/uMcy9i0nks5+qU0KyuLZ2dnk3hltra22Obm5qkdb3x8/P3w6/mF0f3Ha7kXoW84fy2/cBZMTEws6rf0exCXgprrQ1NLIz9vnIi4sN0r7p3KysoBrIw4JKYDKuMNIDL0afYeudA+MjLyW+rOYJhglBdw5Ckuke2oqn6c/oVh+jh9c+WP0/OEfZ7XotCmRRcZK7WBPZQ1GF1Eoa19AuFW+Dxn7B/TSs7ow0YWiAAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (61, 56, 'WEBGIS.LEGEND.LEGEND_61', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAAQcSURBVFhHtZdLSFtBFIbnXuOrqFFQUPERH/VBs1AokVZc6EIl6qKgi7oS3Oiqixbahe2iVWgptNCVSxdKoQgVNb4WdidooRWsIG1Ag6LQFJ/QoNFM/zMZQ9SYO1ftB5N75sydnDNnzjyuxhRpbGxMwcPJOa9DqYBsQ0mlNrCL4tE07TueX9LT011DQ0P7osUAQweamppuHx8fP4XRh6jeCmoN8cGZjxaL5bXL5foldRG51IHW1tbEg4ODlzD8CNXYoNY0fjjyITk5+fnw8LBP6s4Q0YGWlpbio6OjzzBul6prASd+xMXFPRgbG3NLVYgLDjidzgqEfAZiRlBzY/zRdb1+amqK8iTEGQdo5IeHh3MQDY2npKTw4uJiIbvdbra/v2+YT+BPbGzs/fC8CHWSc76gEnYkFxsYGOAZGRmiv9fr5R0dHRoiJ9oNWMZ0OMbHx/9SRRcqIBNOac4LCwuF8Y2NDb6+vi7koqIiLpuNuANHX0k5GAFaan6/fxmiUrbX19dzhJzNz8+L/g6Hg6emprLp6WmVaSCOY2Ji7kxOTv4UEYBHz/BQXmrozMl4VVUVp7KwsKAhwVQjQFgCgQDZZFpbW5t1b29vC3IiKVTo6ekJFBQUaDk5OWLENBWrq6u8t7c3NKUK+KxWa5aOUDpRUTZO2V9TU6OTceQMo0Iy6fCHZqJASd+s4w/qpEKJsrIyhnxhMzMzvKurSxTMPScdtZkBtmu1hoaGrxDuSp0hzc3Ngbm5OW17e1tLTAwGzufzsbS0NF5dXc2xvMxMwzeKAJ1qypycnDAkHOvs7OSDg4OikIzEFG1mwBZtowj44YRF6qKCDqy/vz+AOddpMwqHNiHaE7q7u0VuKHJiJlwsNzeX22y2C8YJ0tHKyMvLM5OIjKaALhNKqCSZmURERHd1/KzJuiE37QAG76EILMq6IeXl5VK6HJV3TsHgv1MEZmU9KgkJCTw/P99wr6d3sDyV8gCraVanCyTkiNelcEpKSugMkLXLoSVK7yrgS0pKcsUsLS0d4mJRCEVlUB8Zu93OMjMz2c7OjmHxeDwMZ0PUaCHyg6Ojo5/ES9GOY7xIxdTSOgX5ddme4Ec07XQch7zEhvQWLz+RVUFpaSnv6+tjuNUazn0kcNhwnJxsZWXlTH9M0zvcDR8LWWgAjLzASH/IqgB7+5WNE9SX/uMcy9i0nks5+qU0KyuLZ2dnk3hltra22Obm5qkdb3x8/P3w6/mF0f3Ha7kXoW84fy2/cBZMTEws6rf0exCXgprrQ1NLIz9vnIi4sN0r7p3KysoBrIw4JKYDKuMNIDL0afYeudA+MjLyW+rOYJhglBdw5Ckuke2oqn6c/oVh+jh9c+WP0/OEfZ7XotCmRRcZK7WBPZQ1GF1Eoa19AuFW+Dxn7B/TSs7ow0YWiAAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (62, 47, 'WEBGIS.LEGEND.LEGEND_62', 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiMAAC4jAXilP3YAAARtSURBVFhHrZddTFxFFIBn5t5d9+/K7hroLlgkgcawoLUxQEuIhhYIsSHRplprI740Pvti6IOaFHwo6ovPpg+tQXmoPwmCVUttUoqtfUBS07DZmkBSCpYAiwjs353xzDC76cJd7qzlS+5m5szcnXPPOXPmDEaK3Dx16knz4cNXGDNbEWMvMIaqQOzfHEVxeGYwwRMYa79qZWUjBwcG/tkc2hlbBca7umpYYr2HZsy3MGMeKd4RhvE61rSvidtzrnlo6J4UW1JQgfHjx91mPH4WmZn3YGGHFBcFKJLGuvY5KQl81Hzp0oYU52GpwFhnZzVLJb/DlD4nRY8HIXeI13fMyhrbFLh59Oj+9Praz/DVZVK0O2C8gNyejpaRkT+kRJCnwNir8OUrifFiFmfw2AZSFlCC+IzmRy2Re1f4fGnxlqrZn+7upqVt7aK9MHoF3b9wgYiODYyQP7XgU43ZmMi9xANOdXGIblbZ/Q727N1L+FP5djcmHg83hi2wRj1dWe6VXaTxH7HVkokvwRyib4dRX8+Iy4Vi/f1s/ochphsGSi0uouT8vJI3GGMN79bVDZ6PxZaEBfg+L2arucJhGu09SxJzD3Bibg7ztisUpnLYFr6WmUz0iDbPcOkHs3MgVEoyHPB/xhEIkj2dneKL//7pMksvLdH7Fy/qYoICPFk5yivCeKyj4wRKJQelXImGb76lzmAwL+hSy8v092OvEeUdAWCH8yRBNHNY9pVw7gmJxVejUTr1cR+d6uujq9Ep6gwEwA0hZTcIqHkYjx1pvYVM2ihFtgRfepmmV+JodXKSIE3bjHzTxMbz+0GxAFu8dk0pkAWE3CbyVFNG93rpWiyGw6+/QV8c+Irxh7fX7sWwBttTTlOlCl9vbU1iRp1SYMuzvX2m/8ABovt8ee7OrK2x+MQEjX74gbIFICmliXoeBRwOFmhq2rY4ByyDA42NhM+RIiV4JPNiQglvdTXTnM6CKvMxX02NsgLwR3GCMZqWfVuMSJ1sFUZlziNMgwtw3vG4E0akVrYKY9Taz8mCYW2CiH5V9m0xaiOyVRgjYj8nB9GuEr209EeeFqWoIHqJn7rLy22PXDgniO732yYkviYvXkVA3Wg/8gVLZ06LkQI4Q2EW6upSCjA4IXEKDinZtUbXz7dcGT0tJvHj2Px39a7VieiufIZ69+2TveKA5IQ2Zma2WY0Xq7rHW3doeDiW0/J6W9snOJN+X3YFmt/PGgYHkfaEa+evKYCZTLLbb57gxU7++w79s5ZfRsVauQGrksxVUUEj5/pl7/9x90wPSszO5qywtSTL00wWpb+BK0qlaHexKErz/NPy/eW/HB5vO/hoQYp2D1mWb70bbAuQg8PDk7jEdQhMdUeKHhtudv7lW+8EHMt9zS0BfmrCTsenPGKluGjEuxBwwucF7oi20c23KN1YP8NM8+TWupEnBas/4EmGX05h9/TzrSbFltgqkCV7PadQRvHrObxYBQqI6zm049Ce5ucKgfSqfj1H6D8f0cHfxtm/hgAAAABJRU5ErkJggg==', false);
INSERT INTO public.wg_legend VALUES (41, 14, 'WEBGIS.LEGEND.LEGEND_41', 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpUWrDlYQcchQnSxIFXGUKhbBQmkrtOpgcukXNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9TaBHjwXE/3t173L0DhHqZqWbXJKBqlpGMRcVMdlX0vcKPXvRjCBGJmXo8tZiG6/i6h4evd2Ge5X7uz9Gn5EwGeETiOaYbFvEG8cympXPeJw6yoqQQnxNPGHRB4keuyw6/cS40WeCZQSOdnCcOEouFDpY7mBUNlXiaOKSoGuULGYcVzluc1XKVte7JXxjIaSsprtMcRQxLiCMBETKqKKEMC2FaNVJMJGk/6uIfafoT5JLJVQIjxwIqUCE1/eB/8LtbMz8VcZICUaD7xbY/xgDfLtCo2fb3sW03TgDvM3Cltf2VOjD7SXqtrYWOgIFt4OK6rcl7wOUOMPykS4bUlLw0hXweeD+jb8oCg7dAz5rTW2sfpw9AmrpavgEODoHxAmWvu7zb39nbv2da/f0AkupytBttTL0AAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmCAsOHwu7rmTjAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAACZJREFUSMdjYBgFo2AUMG7kZ/xPSwuYaO2DUQtGgAWjYBSMAjoAAN/GAc788TifAAAAAElFTkSuQmCC', false);
INSERT INTO public.wg_legend VALUES (72, 16, 'WEBGIS.LEGEND.LEGEND_72', NULL, false);
INSERT INTO public.wg_legend VALUES (73, 65, NULL, NULL, true);
INSERT INTO public.wg_legend VALUES (74, 66, 'WEBGIS.LEGEND.LEGEND_74', NULL, true);
INSERT INTO public.wg_legend VALUES (75, 67, 'WEBGIS.LEGEND.LEGEND_75', NULL, true);
INSERT INTO public.wg_legend VALUES (76, 68, 'WEBGIS.LEGEND.LEGEND_76', NULL, true);
INSERT INTO public.wg_legend VALUES (77, 69, 'WEBGIS.LEGEND.LEGEND_77', NULL, true);
INSERT INTO public.wg_legend VALUES (78, 70, 'WEBGIS.LEGEND.LEGEND_78', 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TpVoqDnaQ4pChOlmQKuIoVSyChdJWaNXB5KV/0MSQpLg4Cq4FB38Wqw4uzro6uAqC4A+Io5OToouUeF9SaBHjhcf7OO+ew3v3AUKzxlSzZwJQNcvIJBNivrAiBl4RRAT98CEuMVNPZRdy8Kyve+qjuovxLO++P2tAKZoM8InEs0w3LOJ14ulNS+e8TxxmFUkhPiceN+iCxI9cl11+41x2WOCZYSOXmSMOE4vlLpa7mFUMlXiKOKqoGuULeZcVzluc1Vqdte/JXxgqastZrtMaQRKLSCENETLqqKIGCzHaNVJMZOg84eGPOP40uWRyVcHIMY8NqJAcP/gf/J6tWZqMu0mhBND7Ytsfo0BgF2g1bPv72LZbJ4D/GbjSOv6NJjDzSXqjo0WPgMFt4OK6o8l7wOUOMPykS4bkSH5aQqkEvJ/RNxWAoVsguOrOrX2O0wcgR7NaugEODoGxMmWveby7r3tu//a05/cDfzByrN9DMXgAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmChoJAwUtS2GmAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAHJJREFUSMft0kEKAyEMheE/Tumix6j3v1dvoJFJXzdSZGbRTWeXDwKJSBJQSCldzoAnsAG3WZcZ650jLfl7hoAdCMCBDrjVWl+ttYe733vv2xijRIRJ+jaWdN7MTnO1nMnMQtJuh23+rlz9BiW/YUrptw9+cCcPm4DAxwAAAABJRU5ErkJggg==', false);


--
-- TOC entry 5075 (class 0 OID 26148)
-- Dependencies: 304
-- Data for Name: wg_legend_class; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--



--
-- TOC entry 5076 (class 0 OID 26154)
-- Dependencies: 305
-- Data for Name: wg_map; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_map VALUES (1, 'Main Map', '{638000,4541000,674000,4558000}', '{2000000,1000000,500000,200000,100000,50000,20000,10000,5000,2000,1000,500,200,100}', 'WEBGIS.MAP_WATERMARK', 8, '{application/json}', '{"png":"image/png","jpeg":"image/jpeg"}', '{"json":"application/json"}', '{
  "url": "/geoserver/cantieriBari"
}');


--
-- TOC entry 5077 (class 0 OID 26160)
-- Dependencies: 306
-- Data for Name: wg_map_rs; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_map_rs VALUES (1, 'Gauss Boaga fuso Est (EPSG:3004)', 'Coordinata X', 'Coordinata Y', 'm', 'Monte Mario - Italia zona 2', 'E', 'N', '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs', false, 3004);
INSERT INTO public.wg_map_rs VALUES (5, 'Geografico - WGS84 (EPSG:4326) - DMS', 'Longitudine', 'Latitudine', 'degrees', 'WGS 84 - WGS84 (DMS)', 'Lon', 'Lat', NULL, false, 4326);
INSERT INTO public.wg_map_rs VALUES (4, 'UTM 33N - WGS84 (EPSG:32633)', 'Coordinata X', 'Coordinata Y', 'm', 'WGS 84 - UTM 33N', 'E', 'N', '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs', true, 32633);
INSERT INTO public.wg_map_rs VALUES (3, 'Geografico - WGS84 (EPSG:4326) - DD', 'Longitudine', 'Latitudine', 'degrees', 'WGS 84 - WGS84 (DD)', 'Lon', 'Lat', NULL, false, 4326);
INSERT INTO public.wg_map_rs VALUES (2, 'WGS84 - Mercatore Trasverso (EPSG:3857)', 'Coordinata X', 'Coordinata Y', 'm', 'WGS 84 - Pseudo-Mercator', 'E', 'N', NULL, false, 3857);


--
-- TOC entry 5078 (class 0 OID 26167)
-- Dependencies: 307
-- Data for Name: wg_map_tools; Type: TABLE DATA; Schema: public; Owner: user_cantieri
--

INSERT INTO public.wg_map_tools VALUES ('coords', 'WEBGIS.TLP.CTRL_COORDS', 'tool-coords', 5, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('info', 'WEBGIS.TLP.CTRL_INFO', 'tool-info', 8, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('layers', 'WEBGIS.TLP.CTRL_LAYERS', 'tool-layers', 1, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('legend', 'WEBGIS.TLP.CTRL_LEGEND', 'tool-legend', 2, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('manageMaps', 'WEBGIS.TLP.CTRL_MAP_SERVICES', 'tool-services', 10, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('measures', 'WEBGIS.TLP.CTRL_MEASURE', 'tool-measures', 4, '{"length":{"um":"meter"}, "area":{"um":"kilometerSquare"}}', NULL);
INSERT INTO public.wg_map_tools VALUES ('search', 'WEBGIS.TLP.CTRL_SEARCH', 'tool-search', 7, NULL, NULL);
INSERT INTO public.wg_map_tools VALUES ('overview', 'WEBGIS.TLP.CTRL_OVERVIEW', 'tool-overview', 3, '{
  "layer": {
    "id": "id_Overview",
    "type": "IMAGE",
    "tiled": false,
    "source": {
      "type": "WMS",
      "url": "/geoserver/cantieri/wms",
      "version": "1.1.1",
      "transparent": true,
      "format": "image/png",
      "projection": "EPSG:32633",
      "layer_name": "qu_cantieri"
    },
    "opacity": 1
  }
}', NULL);
INSERT INTO public.wg_map_tools VALUES ('print', 'WEBGIS.TLP.CTRL_PRINT', 'tool-print', 6, '{
  "printURL": "10.10.104.37/gestionaleAutorizzazioni",
  "printAppName": "print_CANTIERI",
  "mapserverUrl": "http://10.10.104.15:8080",
  "imgContext": "",
  "dpi": [
    {
      "id": 72,
      "name": "WORDS.LOW"
    },
    {
      "id": 96,
      "name": "WORDS.MEDIUM"
    },
    {
      "id": 150,
      "name": "WORDS.HIGH"
    }
  ],
  "default_format": "A4",
  "default_dpi": 96,
  "authority": "Comune di Bari"
}', NULL);


--
-- TOC entry 4685 (class 0 OID 25693)
-- Dependencies: 226
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--



--
-- TOC entry 4686 (class 0 OID 25706)
-- Dependencies: 227
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--



--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 235
-- Name: authority_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.authority_id_seq', 87, true);


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 237
-- Name: authorization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.authorization_id_seq', 38, true);


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 239
-- Name: ctx_function_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.ctx_function_id_seq', 3, true);


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 241
-- Name: ctx_title_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.ctx_title_id_seq', 3, true);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 243
-- Name: event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.event_id_seq', 114, true);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 245
-- Name: event_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.event_type_id_seq', 1, true);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 249
-- Name: i18n_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.i18n_id_seq', 20, true);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 251
-- Name: i18n_string_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.i18n_string_id_seq', 700, true);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 253
-- Name: menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.menu_id_seq', 7, true);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 255
-- Name: menu_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.menu_item_id_seq', 20, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 259
-- Name: move_attach_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.move_attach_id_seq', 1, false);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 256
-- Name: move_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.move_id_seq', 43, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 261
-- Name: move_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.move_photo_id_seq', 16, true);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 263
-- Name: move_signage_position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.move_signage_position_id_seq', 2, true);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 265
-- Name: move_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.move_status_id_seq', 5, true);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 267
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.permission_id_seq', 67, true);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 270
-- Name: registration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.registration_id_seq', 28, true);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 271
-- Name: roadsite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.roadsite_id_seq', 121, true);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 274
-- Name: roadsite_prot_out_email_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.roadsite_prot_out_email_id_seq', 9, true);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 276
-- Name: roadsite_status_id_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.roadsite_status_id_id_seq', 4, true);


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 278
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.role_id_seq', 39, true);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 281
-- Name: session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.session_id_seq', 18662, true);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 283
-- Name: sysuser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.sysuser_id_seq', 132, true);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 299
-- Name: webgis_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.webgis_seq', 79, true);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 302
-- Name: wg_layer_attach_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_cantieri
--

SELECT pg_catalog.setval('public.wg_layer_attach_id_seq', 27, true);


--
-- TOC entry 4745 (class 2606 OID 26253)
-- Name: bari pk_bari; Type: CONSTRAINT; Schema: gis_data; Owner: user_cantieri
--

ALTER TABLE ONLY gis_data.bari
    ADD CONSTRAINT pk_bari PRIMARY KEY (id);


--
-- TOC entry 4747 (class 2606 OID 26255)
-- Name: no_background pk_no_background; Type: CONSTRAINT; Schema: gis_data; Owner: user_cantieri
--

ALTER TABLE ONLY gis_data.no_background
    ADD CONSTRAINT pk_no_background PRIMARY KEY (id);


--
-- TOC entry 4749 (class 2606 OID 26257)
-- Name: puglia pk_puglia; Type: CONSTRAINT; Schema: gis_data; Owner: user_cantieri
--

ALTER TABLE ONLY gis_data.puglia
    ADD CONSTRAINT pk_puglia PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 26259)
-- Name: gt_pk_metadata gt_pk_metadata_table_schema_table_name_pk_column_key; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.gt_pk_metadata
    ADD CONSTRAINT gt_pk_metadata_table_schema_table_name_pk_column_key UNIQUE (table_schema, table_name, pk_column);


--
-- TOC entry 4751 (class 2606 OID 26261)
-- Name: authority pk_authority; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.authority
    ADD CONSTRAINT pk_authority PRIMARY KEY (id);


--
-- TOC entry 4755 (class 2606 OID 26263)
-- Name: authorization pk_authorization; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public."authorization"
    ADD CONSTRAINT pk_authorization PRIMARY KEY (id);


--
-- TOC entry 4757 (class 2606 OID 26265)
-- Name: ctx_function pk_ctx_function; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.ctx_function
    ADD CONSTRAINT pk_ctx_function PRIMARY KEY (id);


--
-- TOC entry 4759 (class 2606 OID 26267)
-- Name: ctx_title pk_ctx_title; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.ctx_title
    ADD CONSTRAINT pk_ctx_title PRIMARY KEY (id);


--
-- TOC entry 4761 (class 2606 OID 26269)
-- Name: event pk_event; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT pk_event PRIMARY KEY (id);


--
-- TOC entry 4763 (class 2606 OID 26271)
-- Name: event_type pk_event_type; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type
    ADD CONSTRAINT pk_event_type PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 26273)
-- Name: event_type_permission pk_event_type_permission; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type_permission
    ADD CONSTRAINT pk_event_type_permission PRIMARY KEY (event_type_id, permission_id);


--
-- TOC entry 4772 (class 2606 OID 26275)
-- Name: i18n pk_i18n; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n
    ADD CONSTRAINT pk_i18n PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 26277)
-- Name: i18n_string pk_i18n_string; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n_string
    ADD CONSTRAINT pk_i18n_string PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 26279)
-- Name: menu pk_menu; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.menu
    ADD CONSTRAINT pk_menu PRIMARY KEY (id);


--
-- TOC entry 4780 (class 2606 OID 26281)
-- Name: menu_item pk_menu_item; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.menu_item
    ADD CONSTRAINT pk_menu_item PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 26283)
-- Name: move pk_move; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move
    ADD CONSTRAINT pk_move PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 26285)
-- Name: move_attach pk_move_attach; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_attach
    ADD CONSTRAINT pk_move_attach PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 26287)
-- Name: move_photo pk_move_photo; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_photo
    ADD CONSTRAINT pk_move_photo PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 26289)
-- Name: move_signage_position pk_move_signage_position; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_signage_position
    ADD CONSTRAINT pk_move_signage_position PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 26291)
-- Name: move_status pk_move_status; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_status
    ADD CONSTRAINT pk_move_status PRIMARY KEY (id);


--
-- TOC entry 4792 (class 2606 OID 26293)
-- Name: permission pk_permission; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT pk_permission PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 26295)
-- Name: permission_role pk_permission_role; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT pk_permission_role PRIMARY KEY (permission_id, role_id);


--
-- TOC entry 4798 (class 2606 OID 26297)
-- Name: registration pk_registration; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.registration
    ADD CONSTRAINT pk_registration PRIMARY KEY (id);


--
-- TOC entry 4800 (class 2606 OID 26299)
-- Name: roadsite pk_roadsite; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite
    ADD CONSTRAINT pk_roadsite PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 26301)
-- Name: roadsite_prot_out_email pk_roadsite_prot_out_email; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite_prot_out_email
    ADD CONSTRAINT pk_roadsite_prot_out_email PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 26303)
-- Name: roadsite_status pk_roadsite_status; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite_status
    ADD CONSTRAINT pk_roadsite_status PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 26305)
-- Name: role pk_role; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT pk_role PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 26307)
-- Name: role_sysuser pk_role_sysuser; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.role_sysuser
    ADD CONSTRAINT pk_role_sysuser PRIMARY KEY (role_id, sysuser_id);


--
-- TOC entry 4810 (class 2606 OID 26309)
-- Name: session pk_session; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT pk_session PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 26311)
-- Name: sysuser pk_sysuser; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.sysuser
    ADD CONSTRAINT pk_sysuser PRIMARY KEY (id);


--
-- TOC entry 4818 (class 2606 OID 26313)
-- Name: town_ids pk_town_ids; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.town_ids
    ADD CONSTRAINT pk_town_ids PRIMARY KEY (id);


--
-- TOC entry 4826 (class 2606 OID 26315)
-- Name: wg_base_map pk_wg_base_map; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_base_map
    ADD CONSTRAINT pk_wg_base_map PRIMARY KEY (id);


--
-- TOC entry 4820 (class 2606 OID 26317)
-- Name: wg_category pk_wg_category; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_category
    ADD CONSTRAINT pk_wg_category PRIMARY KEY (id);


--
-- TOC entry 4822 (class 2606 OID 26319)
-- Name: wg_layer pk_wg_layer; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer
    ADD CONSTRAINT pk_wg_layer PRIMARY KEY (id);


--
-- TOC entry 4828 (class 2606 OID 26321)
-- Name: wg_layer_attach pk_wg_layer_attach; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer_attach
    ADD CONSTRAINT pk_wg_layer_attach PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 26323)
-- Name: wg_layer_image pk_wg_layer_image; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer_image
    ADD CONSTRAINT pk_wg_layer_image PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 26325)
-- Name: wg_legend pk_wg_legend; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_legend
    ADD CONSTRAINT pk_wg_legend PRIMARY KEY (id);


--
-- TOC entry 4832 (class 2606 OID 26327)
-- Name: wg_legend_class pk_wg_legend_class; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_legend_class
    ADD CONSTRAINT pk_wg_legend_class PRIMARY KEY (id);


--
-- TOC entry 4834 (class 2606 OID 26329)
-- Name: wg_map pk_wg_map; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_map
    ADD CONSTRAINT pk_wg_map PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 26331)
-- Name: wg_map_rs pk_wg_map_rs; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_map_rs
    ADD CONSTRAINT pk_wg_map_rs PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 26333)
-- Name: wg_map_tools pk_wg_map_tool; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_map_tools
    ADD CONSTRAINT pk_wg_map_tool PRIMARY KEY (id);


--
-- TOC entry 4753 (class 2606 OID 26335)
-- Name: authority un_authority_vat; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.authority
    ADD CONSTRAINT un_authority_vat UNIQUE (vat);


--
-- TOC entry 4765 (class 2606 OID 26337)
-- Name: event_type un_event_type_name; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type
    ADD CONSTRAINT un_event_type_name UNIQUE (name);


--
-- TOC entry 4776 (class 2606 OID 26339)
-- Name: i18n_string un_i18n_string_object_id_label_key; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n_string
    ADD CONSTRAINT un_i18n_string_object_id_label_key UNIQUE (object_id, label_key);


--
-- TOC entry 4794 (class 2606 OID 26341)
-- Name: permission un_permission_name; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT un_permission_name UNIQUE (name);


--
-- TOC entry 4814 (class 2606 OID 26343)
-- Name: sysuser un_sysuser_cf; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.sysuser
    ADD CONSTRAINT un_sysuser_cf UNIQUE (cf);


--
-- TOC entry 4816 (class 2606 OID 26345)
-- Name: sysuser un_sysuser_username; Type: CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.sysuser
    ADD CONSTRAINT un_sysuser_username UNIQUE (username);


--
-- TOC entry 4768 (class 1259 OID 26346)
-- Name: gt_pk_metadata_table_idx01; Type: INDEX; Schema: public; Owner: user_cantieri
--

CREATE UNIQUE INDEX gt_pk_metadata_table_idx01 ON public.gt_pk_metadata USING btree (table_schema, table_name, pk_column);


--
-- TOC entry 4867 (class 2620 OID 26347)
-- Name: move geom_from_xy; Type: TRIGGER; Schema: public; Owner: user_cantieri
--

CREATE TRIGGER geom_from_xy BEFORE INSERT OR UPDATE ON public.move FOR EACH ROW EXECUTE FUNCTION public.get_geom_from_xy();


--
-- TOC entry 4839 (class 2606 OID 26348)
-- Name: authority fk_authority_function; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.authority
    ADD CONSTRAINT fk_authority_function FOREIGN KEY (function_id) REFERENCES public.ctx_function(id);


--
-- TOC entry 4840 (class 2606 OID 26353)
-- Name: event fk_event_type_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT fk_event_type_id FOREIGN KEY (type_id) REFERENCES public.event_type(id);


--
-- TOC entry 4841 (class 2606 OID 26358)
-- Name: event_type_permission fk_event_type_permission_event_type_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type_permission
    ADD CONSTRAINT fk_event_type_permission_event_type_id FOREIGN KEY (event_type_id) REFERENCES public.event_type(id);


--
-- TOC entry 4842 (class 2606 OID 26363)
-- Name: event_type_permission fk_event_type_permission_permission_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.event_type_permission
    ADD CONSTRAINT fk_event_type_permission_permission_id FOREIGN KEY (permission_id) REFERENCES public.permission(id);


--
-- TOC entry 4843 (class 2606 OID 26368)
-- Name: i18n_string fk_i18n_string_object_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.i18n_string
    ADD CONSTRAINT fk_i18n_string_object_id FOREIGN KEY (object_id) REFERENCES public.i18n(id);


--
-- TOC entry 4844 (class 2606 OID 26373)
-- Name: menu_item fk_menu_item_id_group; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.menu_item
    ADD CONSTRAINT fk_menu_item_id_group FOREIGN KEY (id_group) REFERENCES public.menu(id);


--
-- TOC entry 4849 (class 2606 OID 26378)
-- Name: move_attach fk_move_attach_entity_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_attach
    ADD CONSTRAINT fk_move_attach_entity_id FOREIGN KEY (entity_id) REFERENCES public.move(id) ON DELETE CASCADE;


--
-- TOC entry 4845 (class 2606 OID 26383)
-- Name: move fk_move_authority; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move
    ADD CONSTRAINT fk_move_authority FOREIGN KEY (authority_id) REFERENCES public.authority(id);


--
-- TOC entry 4850 (class 2606 OID 26388)
-- Name: move_photo fk_move_photo_entity_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move_photo
    ADD CONSTRAINT fk_move_photo_entity_id FOREIGN KEY (entity_id) REFERENCES public.move(id) ON DELETE CASCADE;


--
-- TOC entry 4846 (class 2606 OID 26393)
-- Name: move fk_move_signage_position; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move
    ADD CONSTRAINT fk_move_signage_position FOREIGN KEY (signage_position_id) REFERENCES public.move_signage_position(id);


--
-- TOC entry 4847 (class 2606 OID 26398)
-- Name: move fk_move_status; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move
    ADD CONSTRAINT fk_move_status FOREIGN KEY (status_id) REFERENCES public.move_status(id);


--
-- TOC entry 4848 (class 2606 OID 26403)
-- Name: move fk_move_sysuser; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.move
    ADD CONSTRAINT fk_move_sysuser FOREIGN KEY (open_user_id) REFERENCES public.sysuser(id);


--
-- TOC entry 4851 (class 2606 OID 26408)
-- Name: permission fk_permission_menu_item_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT fk_permission_menu_item_id FOREIGN KEY (menu_item_id) REFERENCES public.menu_item(id);


--
-- TOC entry 4852 (class 2606 OID 26413)
-- Name: permission_role fk_permission_role_permission_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT fk_permission_role_permission_id FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON DELETE CASCADE;


--
-- TOC entry 4853 (class 2606 OID 26418)
-- Name: permission_role fk_permission_role_role_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT fk_permission_role_role_id FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- TOC entry 4854 (class 2606 OID 26423)
-- Name: roadsite fk_roadsite_authority; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite
    ADD CONSTRAINT fk_roadsite_authority FOREIGN KEY (authority_id) REFERENCES public.authority(id);


--
-- TOC entry 4855 (class 2606 OID 26428)
-- Name: roadsite fk_roadsite_status; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite
    ADD CONSTRAINT fk_roadsite_status FOREIGN KEY (status_id) REFERENCES public.roadsite_status(id);


--
-- TOC entry 4856 (class 2606 OID 26433)
-- Name: roadsite fk_roadsite_sysuser; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.roadsite
    ADD CONSTRAINT fk_roadsite_sysuser FOREIGN KEY (open_user_id) REFERENCES public.sysuser(id);


--
-- TOC entry 4857 (class 2606 OID 26438)
-- Name: role_sysuser fk_role_sysuser_role_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.role_sysuser
    ADD CONSTRAINT fk_role_sysuser_role_id FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- TOC entry 4858 (class 2606 OID 26443)
-- Name: role_sysuser fk_role_sysuser_sysuser_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.role_sysuser
    ADD CONSTRAINT fk_role_sysuser_sysuser_id FOREIGN KEY (sysuser_id) REFERENCES public.sysuser(id);


--
-- TOC entry 4859 (class 2606 OID 26448)
-- Name: session fk_session_sysuser_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT fk_session_sysuser_id FOREIGN KEY (sysuser_id) REFERENCES public.sysuser(id) ON DELETE CASCADE;


--
-- TOC entry 4860 (class 2606 OID 26453)
-- Name: sysuser fk_sysuser_title; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.sysuser
    ADD CONSTRAINT fk_sysuser_title FOREIGN KEY (title_id) REFERENCES public.ctx_title(id);


--
-- TOC entry 4864 (class 2606 OID 26458)
-- Name: wg_layer_attach fk_wg_layer_attach_entity_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer_attach
    ADD CONSTRAINT fk_wg_layer_attach_entity_id FOREIGN KEY (entity_id) REFERENCES public.wg_layer(id);


--
-- TOC entry 4861 (class 2606 OID 26463)
-- Name: wg_layer fk_wg_layer_id_category; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer
    ADD CONSTRAINT fk_wg_layer_id_category FOREIGN KEY (id_category) REFERENCES public.wg_category(id);


--
-- TOC entry 4862 (class 2606 OID 26468)
-- Name: wg_layer fk_wg_layer_id_parent; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer
    ADD CONSTRAINT fk_wg_layer_id_parent FOREIGN KEY (id_parent) REFERENCES public.wg_layer(id);


--
-- TOC entry 4863 (class 2606 OID 26473)
-- Name: wg_layer fk_wg_layer_image_id; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_layer
    ADD CONSTRAINT fk_wg_layer_image_id FOREIGN KEY (image_id) REFERENCES public.wg_layer_image(id);


--
-- TOC entry 4866 (class 2606 OID 26478)
-- Name: wg_legend_class fk_wg_legend_class_id_legend; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_legend_class
    ADD CONSTRAINT fk_wg_legend_class_id_legend FOREIGN KEY (id_legend) REFERENCES public.wg_legend(id);


--
-- TOC entry 4865 (class 2606 OID 26483)
-- Name: wg_legend fk_wg_legend_id_layer; Type: FK CONSTRAINT; Schema: public; Owner: user_cantieri
--

ALTER TABLE ONLY public.wg_legend
    ADD CONSTRAINT fk_wg_legend_id_layer FOREIGN KEY (id_layer) REFERENCES public.wg_layer(id);


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 14
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: user_cantieri
--

REVOKE ALL ON SCHEMA public FROM postgres;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO user_cantieri;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2022-12-21 18:06:43

--
-- PostgreSQL database dump complete
--
