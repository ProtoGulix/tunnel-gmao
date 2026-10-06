-- Schéma initial de Tunnel (révision alembic 0001_schema_initial).
-- Généré par pg_dump --schema-only de la base de dev (voir docs/spikes/0001-installation-a-vide/extract.sh),
-- sans tables Directus ni alembic_version*. Extensions : unaccent, uuid-ossp.
--
-- PostgreSQL database dump
--


-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

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
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: calculate_line_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_line_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  IF NEW.unit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN

    NEW.total_price = NEW.unit_price * NEW.quantity;

  END IF;

  

  RETURN NEW;

END;

$$;


--
-- Name: check_intervention_closable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_intervention_closable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
        blocking_count INTEGER;
    BEGIN
        IF NEW.status_actual != 'ferme' OR OLD.status_actual = 'ferme' THEN
            RETURN NEW;
        END IF;

        IF NEW.plan_id IS NULL THEN
            RETURN NEW;
        END IF;

        SELECT COUNT(*) INTO blocking_count
        FROM public.intervention_task
        WHERE intervention_id = NEW.id
          AND status IN ('todo', 'in_progress')
          AND optional = FALSE;

        IF blocking_count > 0 THEN
            RAISE EXCEPTION 'GAMME_INCOMPLETE: % tache(s) obligatoire(s) en attente', blocking_count;
        END IF;

        RETURN NEW;
    END;
    $$;


--
-- Name: detect_preventive_suggestions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detect_preventive_suggestions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_rule RECORD;

  v_machine_id UUID;

  v_description_lower TEXT;

  v_action_subcategory_code TEXT;

  v_count_inserted INT := 0;

BEGIN

  -- ─────────────────────────────────────────────────────────────────

  -- 1. Sécurité minimale

  -- ─────────────────────────────────────────────────────────────────

  

  -- Pas de description = pas d'analyse

  IF new.description IS NULL OR length(trim(new.description)) < 10 THEN

    RETURN new;

  END IF;

  

  -- Minuscule une seule fois pour la boucle

  v_description_lower := lower(new.description);

  

  -- ─────────────────────────────────────────────────────────────────

  -- 2. Filtre métier : uniquement dépannage (DEP_*)

  -- ─────────────────────────────────────────────────────────────────

  

  -- Récupérer le code de la sous-catégorie d'action

  SELECT sc.code

  INTO v_action_subcategory_code

  FROM action_subcategory sc

  WHERE sc.id = new.action_subcategory;

  

  -- Si pas de sous-catégorie ou n'est pas un dépannage, arrêt

  IF v_action_subcategory_code IS NULL OR NOT v_action_subcategory_code LIKE 'DEP_%' THEN

    RETURN new;

  END IF;

  

  -- ─────────────────────────────────────────────────────────────────

  -- 3. Récupérer machine_id de l'intervention

  -- ─────────────────────────────────────────────────────────────────

  

  SELECT i.machine_id

  INTO v_machine_id

  FROM intervention i

  WHERE i.id = new.intervention_id;

  

  -- Si pas d'intervention ou pas de machine, arrêt

  IF v_machine_id IS NULL THEN

    RETURN new;

  END IF;

  

  -- ─────────────────────────────────────────────────────────────────

  -- 4. Boucle de détection : mots-clés → précos

  -- ─────────────────────────────────────────────────────────────────

  

  FOR v_rule IN

    SELECT 

      pr.id,

      pr.keyword,

      pr.preventive_code,

      pr.preventive_label,

      pr.weight

    FROM preventive_rule pr

    WHERE pr.active = TRUE

    ORDER BY pr.weight DESC

  LOOP

    -- Vérifier si le mot-clé est dans la description

    -- Recherche sensible au contexte : ' mot ' ou début/fin

    IF (

      v_description_lower LIKE '%' || v_rule.keyword || '%'

    ) THEN

      -- Insérer la préconisation (CONFLICT sur UNIQUE constraint)

      INSERT INTO preventive_suggestion (

        intervention_action_id,

        machine_id,

        preventive_code,

        preventive_label,

        score

      )

      VALUES (

        new.id,

        v_machine_id,

        v_rule.preventive_code,

        v_rule.preventive_label,

        v_rule.weight

      )

      ON CONFLICT (machine_id, preventive_code) DO NOTHING;

      

      v_count_inserted := v_count_inserted + 1;

    END IF;

  END LOOP;

  

  -- ─────────────────────────────────────────────────────────────────

  -- 5. Logging (optionnel, à adapter selon ta config)

  -- ─────────────────────────────────────────────────────────────────

  

  -- Décommenter pour debug :

  -- RAISE NOTICE 'detect_preventive_suggestions: action_id=%, machine_id=%, inserted=%',

  --   new.id, v_machine_id, v_count_inserted;

  

  RETURN new;

END;

$$;


--
-- Name: dispatch_purchase_requests(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dispatch_purchase_requests() RETURNS json
    LANGUAGE plpgsql
    AS $$

DECLARE

  v_dispatched TEXT[] := ARRAY[]::TEXT[];

  v_to_qualify TEXT[] := ARRAY[]::TEXT[];

  v_errors json[] := ARRAY[]::json[];

  

  v_req RECORD;

  v_pref_supplier_id UUID;

  v_pref_supplier_ref VARCHAR;

  v_supplier_order_id UUID;

BEGIN

  -- Loop sur toutes les demandes ouvertes avec article lié

  FOR v_req IN

    SELECT 

      pr.id,

      pr.stock_item_id,

      pr.quantity,

      pr.status

    FROM public.purchase_request pr

    WHERE pr.status = 'open' 

      AND pr.stock_item_id IS NOT NULL

  LOOP

    -- Trouver le fournisseur préféré pour cet article

    SELECT 

      sis.supplier_id,

      sis.supplier_ref

    INTO v_pref_supplier_id, v_pref_supplier_ref

    FROM public.stock_item_supplier sis

    WHERE sis.stock_item_id = v_req.stock_item_id

      AND sis.is_preferred = TRUE

    LIMIT 1;



    -- Si pas de fournisseur préféré

    IF v_pref_supplier_id IS NULL THEN

      v_to_qualify := array_append(v_to_qualify, v_req.id::TEXT);

      CONTINUE;

    END IF;



    BEGIN

      -- Chercher panier OPEN du fournisseur, sinon en créer un

      SELECT so.id

      INTO v_supplier_order_id

      FROM public.supplier_order so

      WHERE so.supplier_id = v_pref_supplier_id

        AND so.status = 'OPEN'

      ORDER BY so.created_at DESC

      LIMIT 1;



      IF v_supplier_order_id IS NULL THEN

        -- Créer nouveau panier

        INSERT INTO public.supplier_order (supplier_id, status, total_amount)

        VALUES (v_pref_supplier_id, 'OPEN', 0)

        RETURNING id INTO v_supplier_order_id;

      END IF;



      -- Créer ou mettre à jour la ligne dans le panier (évite l'unicité supplier_order_id + stock_item_id)

      INSERT INTO public.supplier_order_line (

        supplier_order_id,

        stock_item_id,

        supplier_ref_snapshot,

        quantity,

        unit_price,

        total_price

      )

      VALUES (

        v_supplier_order_id,

        v_req.stock_item_id,

        v_pref_supplier_ref,

        COALESCE(v_req.quantity, 1),

        NULL,

        NULL

      )

      ON CONFLICT (supplier_order_id, stock_item_id)

      DO UPDATE SET quantity = COALESCE(public.supplier_order_line.quantity, 0) + COALESCE(EXCLUDED.quantity, 1);



      -- Mettre à jour statut demande à 'in_progress'

      UPDATE public.purchase_request

      SET status = 'in_progress'

      WHERE id = v_req.id;



      v_dispatched := array_append(v_dispatched, v_req.id::TEXT);



    EXCEPTION WHEN OTHERS THEN

      -- Log erreur et continue

      v_errors := array_append(

        v_errors,

        json_build_object(

          'id', v_req.id::TEXT,

          'error', SQLERRM

        )

      );

    END;

  END LOOP;



  -- Retourner résultat au format JSON

  RETURN json_build_object(

    'dispatched', COALESCE(v_dispatched, ARRAY[]::TEXT[]),

    'toQualify', COALESCE(v_to_qualify, ARRAY[]::TEXT[]),

    'errors', COALESCE(v_errors, ARRAY[]::json[])

  );

END;

$$;


--
-- Name: fn_apply_request_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_apply_request_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.intervention_request
    SET statut = NEW.status_to
    WHERE id = NEW.request_id;
    RETURN NEW;
END;
$$;


--
-- Name: fn_audit_log_decision(character varying, uuid, character varying, jsonb, jsonb, character varying, text, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_log_decision(p_entity_type character varying, p_entity_id uuid, p_decision_type character varying, p_old_value jsonb, p_new_value jsonb, p_reason_code character varying, p_reason_text text DEFAULT NULL::text, p_changed_by uuid DEFAULT NULL::uuid, p_is_system boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reason_id       INT;
    v_reason_category VARCHAR;
    v_log_id          UUID;
BEGIN
    SELECT id, category
      INTO v_reason_id, v_reason_category
      FROM audit_reason_code
     WHERE code = p_reason_code AND is_active = TRUE;

    IF v_reason_id IS NULL THEN
        RAISE EXCEPTION 'Raison % inconnue ou inactive', p_reason_code;
    END IF;

    IF p_reason_code = 'OTHER' AND (p_reason_text IS NULL OR trim(p_reason_text) = '') THEN
        RAISE EXCEPTION 'reason_text obligatoire quand reason_code = OTHER';
    END IF;

    IF p_is_system = FALSE AND p_changed_by IS NULL THEN
        RAISE EXCEPTION 'changed_by obligatoire pour une mutation manuelle';
    END IF;

    IF p_is_system = TRUE AND v_reason_category != 'system' THEN
        RAISE EXCEPTION 'La raison % n''est pas une raison système', p_reason_code;
    END IF;

    INSERT INTO public.audit_log (
        entity_type, entity_id, decision_type,
        old_value, new_value,
        reason_code_id, reason_text,
        changed_by, is_system, logged_at
    ) VALUES (
        p_entity_type, p_entity_id, p_decision_type,
        p_old_value, p_new_value,
        v_reason_id, p_reason_text,
        p_changed_by, p_is_system,
        now()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_audit_log_decision: %', SQLERRM;
    RETURN NULL;
END;
$$;


--
-- Name: fn_compute_action_time(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_compute_action_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            has_bounds BOOLEAN := (NEW.action_start IS NOT NULL AND NEW.action_end IS NOT NULL);
            has_time   BOOLEAN := (NEW.time_spent IS NOT NULL);
        BEGIN
            IF has_bounds AND has_time THEN
                RAISE EXCEPTION 'Ambiguïté : fournir soit les bornes horaires soit time_spent, pas les deux';
            END IF;
            IF NOT has_bounds AND NOT has_time THEN
                RAISE EXCEPTION 'time_spent ou les bornes action_start/action_end sont requis';
            END IF;
            IF has_bounds THEN
                IF EXTRACT(MINUTE FROM NEW.action_start) NOT IN (0, 15, 30, 45) THEN
                    RAISE EXCEPTION 'action_start doit être un multiple de 15 minutes';
                END IF;
                IF EXTRACT(MINUTE FROM NEW.action_end) NOT IN (0, 15, 30, 45) THEN
                    RAISE EXCEPTION 'action_end doit être un multiple de 15 minutes';
                END IF;
                IF NEW.action_end <= NEW.action_start THEN
                    RAISE EXCEPTION 'action_end doit être postérieur à action_start';
                END IF;
                NEW.time_spent := EXTRACT(EPOCH FROM (NEW.action_end - NEW.action_start)) / 3600.0;
            END IF;
            IF has_time THEN
                IF (NEW.time_spent * 4) <> FLOOR(NEW.time_spent * 4) THEN
                    RAISE EXCEPTION 'time_spent doit être un multiple de 0.25';
                END IF;
                IF NEW.time_spent < 0.25 THEN
                    RAISE EXCEPTION 'time_spent minimum est 0.25h';
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$;


--
-- Name: fn_generate_purchase_request_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_generate_purchase_request_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            v_year TEXT := to_char(now(), 'YYYY');
            v_seq  INT;
        BEGIN
            IF NEW.code IS NOT NULL AND NEW.code != '' THEN
                RETURN NEW;
            END IF;

            SELECT COALESCE(MAX((regexp_match(code, 'DA-' || v_year || '-(\d+)'))[1]::int), 0) + 1
            INTO v_seq
            FROM public.purchase_request
            WHERE code LIKE 'DA-' || v_year || '-%';

            NEW.code := 'DA-' || v_year || '-' || lpad(v_seq::TEXT, 4, '0');
            RETURN NEW;
        END;
        $$;


--
-- Name: fn_generate_request_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_generate_request_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_year TEXT := to_char(now(), 'YYYY');
        v_seq  INT;
    BEGIN
        SELECT COALESCE(MAX((regexp_match(code, 'DI-' || v_year || '-(\d+)'))[1]::int), 0) + 1
        INTO v_seq
        FROM public.intervention_request
        WHERE code LIKE 'DI-' || v_year || '-%';

        NEW.code := 'DI-' || v_year || '-' || lpad(v_seq::TEXT, 4, '0');
        RETURN NEW;
    END;
    $$;


--
-- Name: fn_init_request_status_log(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_init_request_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('app.skip_request_status_log', 'true', true);

    INSERT INTO public.request_status_log (request_id, status_from, status_to, notes)
    VALUES (NEW.id, NULL, 'nouvelle', 'Création demande');

    PERFORM set_config('app.skip_request_status_log', 'false', true);
    RETURN NEW;
END;
$$;


--
-- Name: fn_log_request_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_log_request_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF current_setting('app.skip_request_status_log', true) = 'true' THEN
        RETURN NEW;
    END IF;

    IF NEW.statut IS DISTINCT FROM OLD.statut THEN
        -- Vérifie que le statut actuel correspond à la dernière entrée du log
        IF OLD.statut IS DISTINCT FROM (
            SELECT status_to FROM public.request_status_log
            WHERE request_id = NEW.id
            ORDER BY date DESC
            LIMIT 1
        ) THEN
            RAISE EXCEPTION
                'Incohérence statut : statut actuel "%" ne correspond pas à la dernière entrée du log',
                OLD.statut;
        END IF;

        INSERT INTO public.request_status_log (request_id, status_from, status_to)
        VALUES (NEW.id, OLD.statut, NEW.statut);
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: fn_machine_hours_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_machine_hours_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            v_machine_id UUID;
            v_delta      NUMERIC(10,2);
        BEGIN
            SELECT i.machine_id INTO v_machine_id
            FROM public.intervention i
            WHERE i.id = NEW.intervention_id;

            IF v_machine_id IS NULL THEN RETURN NEW; END IF;

            IF TG_OP = 'INSERT' THEN
                v_delta := COALESCE(NEW.time_spent, 0);
            ELSE
                v_delta := COALESCE(NEW.time_spent, 0) - COALESCE(OLD.time_spent, 0);
            END IF;

            INSERT INTO public.machine_hours (machine_id, hours_total, updated_at)
            VALUES (v_machine_id, GREATEST(0, v_delta), NOW())
            ON CONFLICT (machine_id) DO UPDATE
                SET hours_total = GREATEST(0, public.machine_hours.hours_total + v_delta),
                    updated_at  = NOW();

            RETURN NEW;
        END;
        $$;


--
-- Name: fn_notify_di_a_traiter(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_notify_di_a_traiter() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            v_machine_code TEXT;
            v_machine_name TEXT;
            v_demandeur TEXT;
            v_description TEXT;
            v_message TEXT;
            v_data JSONB;
        BEGIN
            IF NEW.origine = 'directe' THEN
                RETURN NEW;
            END IF;

            SELECT m.code, m.name INTO v_machine_code, v_machine_name
            FROM public.machine m
            WHERE m.id = NEW.machine_id;

            v_demandeur := NULLIF(TRIM(NEW.demandeur_nom), '');
            v_description := NULLIF(TRIM(NEW.description), '');
            IF v_description IS NOT NULL AND length(v_description) > 120 THEN
                v_description := left(v_description, 120) || '…';
            END IF;

            v_message := COALESCE(v_demandeur, 'Une demande') ||
                         ' demande une intervention' ||
                         COALESCE(' sur ' || v_machine_code, '') ||
                         COALESCE(' pour : ' || v_description, '');

            v_data := jsonb_build_object(
                'demandeur_nom', v_demandeur,
                'machine_code', v_machine_code,
                'machine_name', v_machine_name,
                'description', v_description,
                'di_code', NEW.code
            );

            INSERT INTO public.notification (user_id, type, entity_type, entity_id, message, data)
            SELECT tu.id, 'di_a_traiter', 'intervention_request', NEW.id, v_message, v_data
            FROM public.tunnel_user tu
            JOIN public.tunnel_role tr ON tr.id = tu.role_id
            WHERE tu.is_active = true
              AND tr.code = 'TECH'
              AND tu.id IS DISTINCT FROM NEW.created_by;

            RETURN NEW;
        END;
        $$;


--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$;


--
-- Name: fn_sync_status_log_to_intervention(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_status_log_to_intervention() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            v_status_code TEXT;
            v_occurrence_id UUID;
            v_request_id UUID;
            v_request_statut TEXT;
        BEGIN
            -- 1. Mettre à jour intervention.status_actual avec le nouveau statut
            UPDATE public.intervention
            SET status_actual = NEW.status_to
            WHERE id = NEW.intervention_id;

            -- 2. Résoudre le code du statut cible
            SELECT code INTO v_status_code
            FROM public.intervention_status_ref
            WHERE id = NEW.status_to;

            -- 3. Si fermeture : propager sur l'occurrence préventive + la demande
            IF v_status_code = 'ferme' THEN

                -- Chercher l'occurrence liée à cette intervention
                SELECT id INTO v_occurrence_id
                FROM public.preventive_occurrence
                WHERE intervention_id = NEW.intervention_id
                LIMIT 1;

                IF v_occurrence_id IS NOT NULL THEN
                    UPDATE public.preventive_occurrence
                    SET status = 'completed'
                    WHERE id = v_occurrence_id;
                END IF;

                -- Clôturer la demande liée si elle est encore 'acceptee'
                SELECT id, statut INTO v_request_id, v_request_statut
                FROM public.intervention_request
                WHERE intervention_id = NEW.intervention_id
                  AND statut = 'acceptee'
                LIMIT 1;

                IF v_request_id IS NOT NULL THEN
                    UPDATE public.intervention_request
                    SET statut = 'cloturee'
                    WHERE id = v_request_id;

                    INSERT INTO public.request_status_log
                        (request_id, status_from, status_to, changed_by, notes)
                    VALUES (
                        v_request_id,
                        v_request_statut,
                        'cloturee',
                        NULL,
                        'Clôture automatique suite à la fermeture de l''intervention (via log de statut)'
                    );
                END IF;

            END IF;

            RETURN NEW;
        END;
        $$;


--
-- Name: fn_update_supplier_refs_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_update_supplier_refs_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Cas INSERT : incrémenter le compte de l'article

    IF (TG_OP = 'INSERT') THEN

        UPDATE public.stock_item

        SET supplier_refs_count = supplier_refs_count + 1

        WHERE id = NEW.stock_item_id;

        RETURN NEW;

    END IF;



    -- Cas DELETE : décrémenter le compte de l'article

    IF (TG_OP = 'DELETE') THEN

        UPDATE public.stock_item

        SET supplier_refs_count = GREATEST(0, supplier_refs_count - 1)

        WHERE id = OLD.stock_item_id;

        RETURN OLD;

    END IF;



    -- Cas UPDATE : si stock_item_id change, ajuster les deux articles

    IF (TG_OP = 'UPDATE') THEN

        IF (OLD.stock_item_id != NEW.stock_item_id) THEN

            -- Décrémenter l'ancien article

            UPDATE public.stock_item

            SET supplier_refs_count = GREATEST(0, supplier_refs_count - 1)

            WHERE id = OLD.stock_item_id;

            

            -- Incrémenter le nouvel article

            UPDATE public.stock_item

            SET supplier_refs_count = supplier_refs_count + 1

            WHERE id = NEW.stock_item_id;

        END IF;

        RETURN NEW;

    END IF;



    RETURN NULL;

END;

$$;


--
-- Name: fn_updated_at_preventive_plan(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_updated_at_preventive_plan() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
        END;
        $$;


--
-- Name: generate_intervention_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_intervention_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  machine_code TEXT;
  today TEXT := to_char(current_date, 'YYYYMMDD');
BEGIN
  SELECT code INTO machine_code
  FROM machine
  WHERE id = NEW.machine_id;

  IF machine_code IS NULL THEN
    RAISE EXCEPTION 'Machine % inconnue', NEW.machine_id;
  END IF;

  IF NEW.type_inter IS NULL THEN
    RAISE EXCEPTION 'type_inter est requis pour générer le code intervention';
  END IF;

  IF NEW.tech_initials IS NULL THEN
    RAISE EXCEPTION 'tech_initials est requis pour générer le code intervention';
  END IF;

  NEW.code := machine_code || '-' || NEW.type_inter || '-' || today || '-' || NEW.tech_initials;

  RETURN NEW;
END;
$$;


--
-- Name: generate_stock_item_ref(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_stock_item_ref() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Génère référence : FAM-SFAM-SPEC-DIM (sans tirets inutiles)
  -- Ne concatène le séparateur que si la valeur existe
  NEW.ref := NEW.family_code;
  
  IF NEW.sub_family_code IS NOT NULL AND NEW.sub_family_code != '' THEN
    NEW.ref := NEW.ref || '-' || NEW.sub_family_code;
  END IF;
  
  IF NEW.spec IS NOT NULL AND NEW.spec != '' THEN
    NEW.ref := NEW.ref || '-' || NEW.spec;
  END IF;
  
  IF NEW.dimension IS NOT NULL AND NEW.dimension != '' THEN
    NEW.ref := NEW.ref || '-' || NEW.dimension;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: generate_supplier_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_supplier_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN

    NEW.order_number := 'CMD-' || 

                        to_char(current_date, 'YYYYMMDD') || '-' || 

                        LPAD(nextval('supplier_order_seq')::TEXT, 4, '0');

  END IF;

  

  RETURN NEW;

END;

$$;


--
-- Name: recalculate_supplier_order_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalculate_supplier_order_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
          affected_order_id uuid;
        BEGIN
          affected_order_id := COALESCE(NEW.supplier_order_id, OLD.supplier_order_id);

          UPDATE supplier_order
          SET total_amount = COALESCE(
            (SELECT SUM(total_price) FROM supplier_order_line WHERE supplier_order_id = affected_order_id),
            0
          )
          WHERE id = affected_order_id;

          RETURN NULL;
        END;
        $$;


--
-- Name: trg_init_status_log(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_init_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    new_log_id UUID := uuid_generate_v4();

BEGIN

    -- Initialise statut à "ouvert"

    UPDATE public.intervention

    SET status_actual = 'ouvert'

    WHERE id = NEW.id;



    -- Crée log initial

    INSERT INTO public.intervention_status_log (

        id,

        intervention_id,

        status_from,

        status_to,

        date,

        technician_id,

        notes

    )

    VALUES (

        new_log_id,

        NEW.id,

        NULL, -- Pas de statut précédent

        'ouvert',

        NOW(),

        NULL,

        'Création intervention'

    );



    RETURN NEW;

END;

$$;


--
-- Name: trg_log_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_log_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    new_log_id UUID := uuid_generate_v4();

BEGIN

    -- ⚠️ Ignore les créations (OLD.status_actual IS NULL)

    IF OLD.status_actual IS NOT NULL AND NEW.status_actual IS DISTINCT FROM OLD.status_actual THEN

        INSERT INTO public.intervention_status_log (

            id,

            intervention_id,

            status_from,

            status_to,

            date,

            technician_id,

            notes

        )

        VALUES (

            new_log_id,

            NEW.id,

            OLD.status_actual,

            NEW.status_actual,

            NOW(),

            NEW.updated_by,

            'Changement statut automatique'

        );

    END IF;



    RETURN NEW;

END;

$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$$;


--
-- Name: action_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_category (
    id integer DEFAULT nextval('public.action_category_id_seq'::regclass) NOT NULL,
    name text NOT NULL,
    code character varying(255) DEFAULT NULL::character varying,
    color character varying
);


--
-- Name: action_category_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_category_meta (
    category_code character varying(255) NOT NULL,
    is_simple boolean DEFAULT false,
    is_low_value boolean DEFAULT false,
    typical_duration_min numeric(4,2),
    typical_duration_max numeric(4,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: action_classification_probe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_classification_probe_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_classification_probe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_classification_probe (
    id integer DEFAULT nextval('public.action_classification_probe_id_seq'::regclass) NOT NULL,
    keyword character varying(255) NOT NULL,
    detection_type character varying(50) DEFAULT 'keyword'::character varying,
    suggested_category character varying(255),
    severity character varying(20) DEFAULT 'warning'::character varying,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: action_subcategory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_subcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_subcategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_subcategory (
    id integer DEFAULT nextval('public.action_subcategory_id_seq'::regclass) NOT NULL,
    category_id integer,
    name text NOT NULL,
    code character varying(255) DEFAULT NULL::character varying
);


--
-- Name: amelioration_category_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amelioration_category_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: amelioration_sous_statut_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amelioration_sous_statut_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: anomaly_threshold_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anomaly_threshold_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anomaly_threshold; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anomaly_threshold (
    id integer DEFAULT nextval('public.anomaly_threshold_id_seq'::regclass) NOT NULL,
    anomaly_type character varying(50) NOT NULL,
    threshold_value numeric,
    threshold_unit character varying(50),
    high_severity_value numeric,
    config_json jsonb,
    description text,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: api_key; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_key (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    key_prefix character varying(12) NOT NULL,
    key_hash character varying(64) NOT NULL,
    role_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    decision_type character varying(100) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    reason_code_id integer,
    reason_text text,
    changed_by uuid,
    is_system boolean DEFAULT false NOT NULL,
    logged_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_reason_code_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_reason_code_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_reason_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_reason_code (
    id integer DEFAULT nextval('public.audit_reason_code_id_seq'::regclass) NOT NULL,
    code character varying(100) NOT NULL,
    label character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    entity_types text[],
    decision_types text[],
    color character varying(7),
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_rule (
    id bigint NOT NULL,
    entity_type text NOT NULL,
    field text,
    is_routine boolean DEFAULT false NOT NULL,
    default_reason_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_rule_routine_needs_default CHECK (((is_routine = false) OR (default_reason_code IS NOT NULL)))
);


--
-- Name: audit_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_rule_id_seq OWNED BY public.audit_rule.id;


--
-- Name: auth_attempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_attempt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    ip_address character varying(45) NOT NULL,
    success boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: complexity_factor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.complexity_factor (
    code character varying(255) NOT NULL,
    label text,
    category character varying(255)
);


--
-- Name: email_domain_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_domain_rule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain character varying(255) NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: equipement_class; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipement_class (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(255) NOT NULL,
    label text NOT NULL,
    description text
);


--
-- Name: equipement_statuts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipement_statuts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipement_statuts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipement_statuts (
    id integer DEFAULT nextval('public.equipement_statuts_id_seq'::regclass) NOT NULL,
    code character varying(30) NOT NULL,
    libelle character varying(100) NOT NULL,
    interventions boolean DEFAULT true NOT NULL,
    est_actif boolean DEFAULT true NOT NULL,
    ordre_affichage integer DEFAULT 0 NOT NULL,
    couleur character varying(7),
    description text
);


--
-- Name: home_view_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_view_ref (
    code character varying(30) NOT NULL,
    label character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE home_view_ref; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.home_view_ref IS 'Référentiel des vues d''accueil disponibles — code doit correspondre à une clé de VIEWS dans src/pages/HomeRouter.jsx (frontend).';


--
-- Name: intervention; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(64),
    title character varying(200) NOT NULL,
    machine_id uuid,
    type_inter character varying(10) NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying,
    reported_by character varying(200),
    tech_initials character varying(255),
    status_actual character varying(255),
    updated_by uuid,
    printed_fiche boolean DEFAULT false,
    reported_date date,
    plan_id uuid,
    tech_id uuid
);


--
-- Name: intervention_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_action (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    intervention_id uuid,
    description text,
    time_spent numeric(6,2) DEFAULT 0,
    updated_at timestamp with time zone,
    action_subcategory integer,
    created_at timestamp with time zone,
    tech uuid,
    complexity_score integer,
    complexity_anotation json,
    complexity_factor character varying(255),
    action_start time without time zone,
    action_end time without time zone
);


--
-- Name: intervention_action_purchase_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intervention_action_purchase_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intervention_action_purchase_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_action_purchase_request (
    id integer DEFAULT nextval('public.intervention_action_purchase_request_id_seq'::regclass) NOT NULL,
    intervention_action_id uuid,
    purchase_request_id uuid
);


--
-- Name: intervention_action_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_action_task (
    action_id uuid NOT NULL,
    task_id uuid NOT NULL
);


--
-- Name: intervention_part; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_part (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    intervention_id uuid,
    quantity integer NOT NULL,
    note text,
    unit_price numeric(12,2) DEFAULT NULL::numeric
);


--
-- Name: intervention_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    machine_id uuid NOT NULL,
    demandeur_nom text NOT NULL,
    demandeur_service_legacy text,
    description text NOT NULL,
    statut character varying(50) NOT NULL,
    intervention_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_id uuid,
    is_system boolean DEFAULT false NOT NULL,
    suggested_type_inter character varying(255),
    type character varying(50) DEFAULT 'standard'::character varying NOT NULL,
    categorie character varying(50),
    priorite character varying(20),
    sous_statut character varying(50),
    porteur_id uuid,
    deadline date,
    origine character varying(20) DEFAULT 'signalee'::character varying NOT NULL,
    created_by uuid,
    CONSTRAINT chk_intervention_request_origine CHECK (((origine)::text = ANY ((ARRAY['directe'::character varying, 'signalee'::character varying])::text[])))
);


--
-- Name: COLUMN intervention_request.origine; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intervention_request.origine IS 'directe = DI créée en silence par le flux "créer intervention directement" (aucune notification) ; signalee = DI réellement signalée par un usager ou générée par le système préventif (is_system=true inclus) — déclenche la notification di_a_traiter vers les techniciens actifs.';


--
-- Name: COLUMN intervention_request.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intervention_request.created_by IS 'Utilisateur authentifié à l''origine de la création de la DI (request.state.user_id) — distinct de demandeur_nom (texte libre, peut désigner un tiers). NULL pour les DI système (is_system=true). Exclu du fan-out de notification di_a_traiter par fn_notify_di_a_traiter (voir migration 024).';


--
-- Name: intervention_status_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_status_log (
    id uuid NOT NULL,
    status_from character varying(255),
    status_to character varying(255),
    technician_id uuid,
    intervention_id uuid,
    date timestamp without time zone,
    notes character varying(255)
);


--
-- Name: intervention_status_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_status_ref (
    id character varying(255) NOT NULL,
    value character varying(255),
    code character varying DEFAULT ''::character varying NOT NULL,
    label text,
    color character varying
);


--
-- Name: intervention_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_task (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    gamme_step_id uuid,
    intervention_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    skip_reason text,
    updated_at timestamp with time zone DEFAULT now(),
    closed_by uuid,
    occurrence_id uuid,
    label text,
    origin character varying(10) DEFAULT 'plan'::character varying NOT NULL,
    optional boolean DEFAULT false NOT NULL,
    assigned_to uuid,
    due_date date,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: intervention_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intervention_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intervention_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_type (
    id integer DEFAULT nextval('public.intervention_type_id_seq'::regclass) NOT NULL,
    code character varying(10) NOT NULL,
    label text NOT NULL,
    color character varying(30),
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: ip_blocklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ip_blocklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address character varying(45) NOT NULL,
    reason character varying(255),
    blocked_until timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location (
    id uuid NOT NULL,
    code character varying(255),
    nom character varying(255),
    name text,
    description text
);


--
-- Name: machine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) DEFAULT NULL::character varying NOT NULL,
    name character varying(200) NOT NULL,
    no_machine integer,
    affectation character varying(255),
    marque character varying(255),
    model character varying(255),
    no_serie character varying(255),
    equipement_mere uuid,
    is_mere boolean DEFAULT false,
    fabricant character varying,
    numero_serie character varying,
    date_mise_service date,
    notes text,
    equipement_class_id uuid,
    statut_id integer DEFAULT 3 NOT NULL
);


--
-- Name: machine_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine_hours (
    machine_id uuid NOT NULL,
    hours_total numeric(10,2) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: manufacturer_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manufacturer_item (
    id uuid NOT NULL,
    manufacturer_name text NOT NULL,
    manufacturer_ref text NOT NULL,
    designation text
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    message text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb,
    CONSTRAINT chk_notification_type CHECK (((type)::text = ANY ((ARRAY['di_a_traiter'::character varying, 'intervention_a_cloturer'::character varying, 'pointage_demande'::character varying, 'preventif_echeance'::character varying])::text[])))
);


--
-- Name: COLUMN notification.entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification.entity_type IS 'Type de l''entité liée (ex: intervention_request, intervention). Volontairement non contraint par CHECK — voir migration 023 pour la justification.';


--
-- Name: COLUMN notification.entity_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification.entity_id IS 'UUID de l''entité liée (intervention_request.id, intervention.id, ...), sans FK physique car la cible varie selon entity_type.';


--
-- Name: COLUMN notification.read_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification.read_at IS 'NULL tant que la notification n''a pas été lue par son destinataire ; horodatage de lecture sinon.';


--
-- Name: COLUMN notification.data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification.data IS 'Champs structurés utilisés pour composer message (voir migration 027) — permet au front de styliser (gras, badge...) sans parser message. Forme dépendante de `type` ; NULL pour les notifications créées avant ce lot ou par un chemin qui ne le peuple pas encore (voir NotificationRepository.create).';


--
-- Name: part_internal_ref_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.part_internal_ref_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 999999
    CACHE 1;


--
-- Name: part; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    internal_ref text DEFAULT ('P'::text || lpad((nextval('public.part_internal_ref_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    family_code character varying(20) NOT NULL,
    sub_family_code character varying(20) NOT NULL,
    unit character varying(50),
    location text,
    qty_in_stock integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: part_manufacturer_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_manufacturer_ref (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    part_id uuid NOT NULL,
    manufacturer_name text NOT NULL,
    manufacturer_ref text NOT NULL,
    label text,
    is_preferred boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: part_supplier_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_supplier_ref (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    part_manufacturer_ref_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    supplier_ref text NOT NULL,
    unit_price numeric(10,2),
    min_order_quantity integer DEFAULT 1 NOT NULL,
    delivery_time_days integer,
    is_preferred boolean DEFAULT false NOT NULL,
    product_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: part_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_template (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    label character varying(100) NOT NULL,
    pattern text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: part_template_field; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_template_field (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    field_key character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    field_type character varying(30) NOT NULL,
    unit character varying(20),
    required boolean DEFAULT false,
    sortable boolean DEFAULT true,
    sort_order integer NOT NULL
);


--
-- Name: part_template_field_enum; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_template_field_enum (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    value character varying(50) NOT NULL,
    label character varying(100)
);


--
-- Name: permission_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    changed_by uuid NOT NULL,
    role_id uuid NOT NULL,
    endpoint_id uuid NOT NULL,
    old_allowed boolean,
    new_allowed boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: preventive_occurrence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preventive_occurrence (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plan_id uuid NOT NULL,
    machine_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    triggered_at timestamp with time zone,
    hours_at_trigger numeric(10,2),
    di_id uuid,
    intervention_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    skip_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: preventive_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preventive_plan (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    label text NOT NULL,
    equipement_class_id uuid,
    trigger_type character varying(20) NOT NULL,
    periodicity_days integer,
    hours_threshold integer,
    auto_accept boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: preventive_plan_gamme_step; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preventive_plan_gamme_step (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plan_id uuid NOT NULL,
    label text NOT NULL,
    sort_order integer NOT NULL,
    optional boolean DEFAULT false NOT NULL
);


--
-- Name: preventive_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preventive_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preventive_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preventive_rule (
    id integer DEFAULT nextval('public.preventive_rule_id_seq'::regclass) NOT NULL,
    keyword text NOT NULL,
    preventive_code text NOT NULL,
    preventive_label text NOT NULL,
    weight integer DEFAULT 1,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: preventive_suggestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preventive_suggestion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intervention_action_id uuid NOT NULL,
    machine_id uuid NOT NULL,
    preventive_code text NOT NULL,
    preventive_label text NOT NULL,
    score integer NOT NULL,
    status text DEFAULT 'NEW'::text NOT NULL,
    detected_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    handled_at timestamp without time zone,
    handled_by uuid
);


--
-- Name: preventive_suggestion_by_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.preventive_suggestion_by_status AS
 SELECT ps.id,
    ps.intervention_action_id,
    ps.machine_id,
    ps.preventive_code,
    ps.preventive_label,
    ps.score,
    ps.status,
    ps.detected_at,
    ps.handled_at,
    ps.handled_by,
    m.code AS machine_code,
    m.name AS machine_name
   FROM (public.preventive_suggestion ps
     LEFT JOIN public.machine m ON ((ps.machine_id = m.id)))
  ORDER BY ps.detected_at DESC;


--
-- Name: purchase_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_request (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    stock_item_id uuid,
    item_label text NOT NULL,
    quantity integer NOT NULL,
    unit character varying(50),
    requested_by text,
    urgency character varying(20) DEFAULT 'normal'::character varying,
    reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    workshop character varying(255),
    quantity_approved integer,
    approver_name character varying,
    approved_at timestamp with time zone,
    part_id uuid,
    code text NOT NULL,
    requested_by_id uuid,
    approver_id uuid
);


--
-- Name: stock_item_supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_item_supplier (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    stock_item_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    supplier_ref text NOT NULL,
    unit_price numeric(10,2),
    min_order_quantity integer DEFAULT 1,
    delivery_time_days integer,
    is_preferred boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    manufacturer_item_id uuid,
    product_url text
);


--
-- Name: supplier_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_order (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number text NOT NULL,
    supplier_id uuid NOT NULL,
    status character varying(50) DEFAULT 'OPEN'::character varying NOT NULL,
    total_amount numeric(12,2) DEFAULT 0,
    ordered_at timestamp with time zone,
    expected_delivery_date date,
    received_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    currency real
);


--
-- Name: supplier_order_line; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_order_line (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_order_id uuid NOT NULL,
    stock_item_id uuid,
    supplier_ref_snapshot text,
    quantity integer NOT NULL,
    unit_price numeric(10,2),
    total_price numeric(12,2),
    quantity_received integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    quote_received boolean,
    is_selected boolean,
    quote_price real,
    manufacturer text,
    manufacturer_ref text,
    quote_received_at timestamp without time zone,
    rejected_reason text,
    lead_time_days integer,
    urgency text,
    part_id uuid
);


--
-- Name: supplier_order_line_purchase_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_order_line_purchase_request (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_order_line_id uuid NOT NULL,
    purchase_request_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: purchase_request_derived_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.purchase_request_derived_status AS
 SELECT pr.id,
    pr.code,
    pr.stock_item_id,
    pr.item_label,
    pr.quantity,
    pr.unit,
    pr.urgency,
    pr.requested_by,
    pr.created_at,
    pr.updated_at,
    sol_agg.supplier_refs_count,
    sol_agg.quotes_count,
    sol_agg.selected_count,
    sol_agg.total_allocated,
    sol_agg.total_received,
    sol_agg.has_locked_order,
    sol_agg.all_terminal,
    sol_agg.has_closed_selected,
    sol_agg.has_order_lines,
        CASE
            WHEN ((pr.stock_item_id IS NULL) AND (pr.part_id IS NULL)) THEN 'TO_QUALIFY'::text
            WHEN (COALESCE(sol_agg.supplier_refs_count, (0)::bigint) = 0) THEN 'NO_SUPPLIER_REF'::text
            WHEN (NOT COALESCE(sol_agg.has_order_lines, false)) THEN 'PENDING_DISPATCH'::text
            WHEN (COALESCE(sol_agg.all_terminal, false) AND (COALESCE(sol_agg.selected_count, (0)::bigint) = 0)) THEN 'REJECTED'::text
            WHEN COALESCE(sol_agg.has_closed_selected, false) THEN 'RECEIVED'::text
            WHEN ((COALESCE(sol_agg.total_received, (0)::bigint) >= COALESCE(sol_agg.total_allocated, (1)::bigint)) AND (COALESCE(sol_agg.total_allocated, (0)::bigint) > 0)) THEN 'RECEIVED'::text
            WHEN (COALESCE(sol_agg.has_locked_order, false) AND (COALESCE(sol_agg.selected_count, (0)::bigint) = 0) AND (COALESCE(sol_agg.quotes_count, (0)::bigint) = 0)) THEN 'CONSULTATION'::text
            WHEN (COALESCE(sol_agg.total_received, (0)::bigint) > 0) THEN 'PARTIAL'::text
            WHEN (COALESCE(sol_agg.selected_count, (0)::bigint) > 0) THEN 'ORDERED'::text
            WHEN (COALESCE(sol_agg.quotes_count, (0)::bigint) > 0) THEN 'QUOTED'::text
            ELSE 'OPEN'::text
        END AS derived_status
   FROM (public.purchase_request pr
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN (pr.part_id IS NOT NULL) THEN ( SELECT count(*) AS count
                       FROM (public.part_supplier_ref psr
                         JOIN public.part_manufacturer_ref pmr ON ((pmr.id = psr.part_manufacturer_ref_id)))
                      WHERE (pmr.part_id = pr.part_id))
                    ELSE ( SELECT count(*) AS count
                       FROM public.stock_item_supplier
                      WHERE (stock_item_supplier.stock_item_id = pr.stock_item_id))
                END AS supplier_refs_count,
            count(DISTINCT
                CASE
                    WHEN sol.quote_received THEN sol.id
                    ELSE NULL::uuid
                END) AS quotes_count,
            count(DISTINCT
                CASE
                    WHEN sol.is_selected THEN sol.id
                    ELSE NULL::uuid
                END) AS selected_count,
            COALESCE(sum(solpr.quantity), (0)::bigint) AS total_allocated,
            COALESCE(sum(sol.quantity_received), (0)::bigint) AS total_received,
            bool_or(((so.status)::text = ANY ((ARRAY['SENT'::character varying, 'ACK'::character varying])::text[]))) AS has_locked_order,
            bool_and(((so.status)::text = ANY ((ARRAY['CANCELLED'::character varying, 'CLOSED'::character varying])::text[]))) AS all_terminal,
            bool_or((((so.status)::text = 'CLOSED'::text) AND sol.is_selected)) AS has_closed_selected,
            (count(sol.id) > 0) AS has_order_lines
           FROM ((public.supplier_order_line_purchase_request solpr
             JOIN public.supplier_order_line sol ON ((solpr.supplier_order_line_id = sol.id)))
             JOIN public.supplier_order so ON ((sol.supplier_order_id = so.id)))
          WHERE (solpr.purchase_request_id = pr.id)) sol_agg ON (true));


--
-- Name: VIEW purchase_request_derived_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.purchase_request_derived_status IS 'Source de vérité unique du statut dérivé des demandes d''achat. Expose pr.code (référence DA-YYYY-NNNN) depuis la migration 019. Ne pas dupliquer la logique CASE WHEN en Python ou dans d''autres requêtes SQL.';


--
-- Name: purchase_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_status (
    id character varying(255) NOT NULL,
    value text,
    color character varying(255),
    code character varying,
    label text,
    order_index integer
);


--
-- Name: refresh_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_token (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: request_status_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_status_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    status_from character varying(50),
    status_to character varying(50) NOT NULL,
    changed_by uuid,
    notes text,
    date timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: request_status_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_status_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: request_type_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_type_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: role_home_view; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_home_view (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    home_view character varying(50) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: TABLE role_home_view; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.role_home_view IS 'Vue d''accueil explicitement configurée pour un rôle. Un rôle absent de cette table est sur la vue par défaut (''technicien'').';


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(100) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    direction character varying(10) NOT NULL,
    success boolean DEFAULT true,
    error_message text,
    id integer DEFAULT nextval('public.schema_migrations_id_seq'::regclass) NOT NULL
);


--
-- Name: security_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(50) NOT NULL,
    user_id uuid,
    ip_address character varying(45),
    detail jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    label text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: stock_family; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_family (
    code character varying(20) NOT NULL,
    label text NOT NULL,
    name text
);


--
-- Name: stock_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_item (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    family_code character varying(20) NOT NULL,
    sub_family_code character varying(20) NOT NULL,
    spec character varying(50),
    dimension text NOT NULL,
    ref text,
    quantity integer DEFAULT 0,
    unit character varying(50),
    location text,
    standars_spec uuid,
    supplier_refs_count integer DEFAULT 0 NOT NULL,
    manufacturer_item_id uuid,
    template_id uuid,
    template_version integer
);


--
-- Name: stock_item_characteristic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_item_characteristic (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    stock_item_id uuid NOT NULL,
    field_id uuid NOT NULL,
    value_text text,
    value_number numeric,
    value_enum character varying(50)
);


--
-- Name: stock_item_standard_spec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_item_standard_spec (
    id uuid NOT NULL,
    stock_item_id uuid,
    title text,
    spec_text text,
    is_default boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


--
-- Name: stock_sub_family; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_sub_family (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    family_code character varying(20) NOT NULL,
    code character varying(20) NOT NULL,
    label text NOT NULL,
    name text,
    template_id uuid
);


--
-- Name: subtask; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subtask (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    intervention_id uuid,
    title character varying(200) NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    address text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    code text
);


--
-- Name: supplier_order_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_order_seq
    START WITH 67
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tunnel_endpoint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tunnel_endpoint (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    method character varying(10) NOT NULL,
    path character varying(200) NOT NULL,
    description character varying(255),
    module character varying(50),
    is_sensitive boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tunnel_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tunnel_permission (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    endpoint_id uuid NOT NULL,
    allowed boolean DEFAULT true NOT NULL
);


--
-- Name: tunnel_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tunnel_role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    label character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tunnel_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tunnel_user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    initial character varying(5) NOT NULL,
    role_id uuid NOT NULL,
    auth_provider character varying(20) DEFAULT 'local'::character varying NOT NULL,
    external_id character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    provisioning character varying(20) DEFAULT 'manual'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_changelog_version character varying(20)
);


--
-- Name: audit_rule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_rule ALTER COLUMN id SET DEFAULT nextval('public.audit_rule_id_seq'::regclass);


--
-- Name: action_category_meta action_category_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_category_meta
    ADD CONSTRAINT action_category_meta_pkey PRIMARY KEY (category_code);


--
-- Name: action_category action_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_category
    ADD CONSTRAINT action_category_pkey PRIMARY KEY (id);


--
-- Name: action_classification_probe action_classification_probe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_classification_probe
    ADD CONSTRAINT action_classification_probe_pkey PRIMARY KEY (id);


--
-- Name: action_subcategory action_subcategory_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_subcategory
    ADD CONSTRAINT action_subcategory_code_unique UNIQUE (code);


--
-- Name: action_subcategory action_subcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_subcategory
    ADD CONSTRAINT action_subcategory_pkey PRIMARY KEY (id);


--
-- Name: amelioration_category_ref amelioration_category_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amelioration_category_ref
    ADD CONSTRAINT amelioration_category_ref_pkey PRIMARY KEY (code);


--
-- Name: amelioration_sous_statut_ref amelioration_sous_statut_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amelioration_sous_statut_ref
    ADD CONSTRAINT amelioration_sous_statut_ref_pkey PRIMARY KEY (code);


--
-- Name: anomaly_threshold anomaly_threshold_anomaly_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomaly_threshold
    ADD CONSTRAINT anomaly_threshold_anomaly_type_key UNIQUE (anomaly_type);


--
-- Name: anomaly_threshold anomaly_threshold_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomaly_threshold
    ADD CONSTRAINT anomaly_threshold_pkey PRIMARY KEY (id);


--
-- Name: api_key api_key_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_key_hash_key UNIQUE (key_hash);


--
-- Name: api_key api_key_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: audit_reason_code audit_reason_code_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_reason_code
    ADD CONSTRAINT audit_reason_code_code_key UNIQUE (code);


--
-- Name: audit_reason_code audit_reason_code_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_reason_code
    ADD CONSTRAINT audit_reason_code_pkey PRIMARY KEY (id);


--
-- Name: audit_rule audit_rule_entity_field_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_rule
    ADD CONSTRAINT audit_rule_entity_field_uniq UNIQUE (entity_type, field);


--
-- Name: audit_rule audit_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_rule
    ADD CONSTRAINT audit_rule_pkey PRIMARY KEY (id);


--
-- Name: auth_attempt auth_attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_attempt
    ADD CONSTRAINT auth_attempt_pkey PRIMARY KEY (id);


--
-- Name: complexity_factor complexity_factor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complexity_factor
    ADD CONSTRAINT complexity_factor_pkey PRIMARY KEY (code);


--
-- Name: email_domain_rule email_domain_rule_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_domain_rule
    ADD CONSTRAINT email_domain_rule_domain_key UNIQUE (domain);


--
-- Name: email_domain_rule email_domain_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_domain_rule
    ADD CONSTRAINT email_domain_rule_pkey PRIMARY KEY (id);


--
-- Name: equipement_class equipement_class_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipement_class
    ADD CONSTRAINT equipement_class_code_key UNIQUE (code);


--
-- Name: equipement_class equipement_class_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipement_class
    ADD CONSTRAINT equipement_class_pkey PRIMARY KEY (id);


--
-- Name: equipement_statuts equipement_statuts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipement_statuts
    ADD CONSTRAINT equipement_statuts_code_key UNIQUE (code);


--
-- Name: equipement_statuts equipement_statuts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipement_statuts
    ADD CONSTRAINT equipement_statuts_pkey PRIMARY KEY (id);


--
-- Name: home_view_ref home_view_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_view_ref
    ADD CONSTRAINT home_view_ref_pkey PRIMARY KEY (code);


--
-- Name: intervention_action intervention_action_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_action
    ADD CONSTRAINT intervention_action_pkey PRIMARY KEY (id);


--
-- Name: intervention_action_purchase_request intervention_action_purchase_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_action_purchase_request
    ADD CONSTRAINT intervention_action_purchase_request_pkey PRIMARY KEY (id);


--
-- Name: intervention_action_task intervention_action_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_action_task
    ADD CONSTRAINT intervention_action_task_pkey PRIMARY KEY (action_id, task_id);


--
-- Name: intervention intervention_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_code_key UNIQUE (code);


--
-- Name: intervention_part intervention_part_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_part
    ADD CONSTRAINT intervention_part_pkey PRIMARY KEY (id);


--
-- Name: intervention intervention_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_pkey PRIMARY KEY (id);


--
-- Name: intervention_request intervention_request_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_code_key UNIQUE (code);


--
-- Name: intervention_request intervention_request_intervention_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_intervention_id_key UNIQUE (intervention_id);


--
-- Name: intervention_request intervention_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_pkey PRIMARY KEY (id);


--
-- Name: intervention_status_log intervention_status_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_status_log
    ADD CONSTRAINT intervention_status_log_pkey PRIMARY KEY (id);


--
-- Name: intervention_status_ref intervention_status_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_status_ref
    ADD CONSTRAINT intervention_status_ref_pkey PRIMARY KEY (id);


--
-- Name: intervention_task intervention_task_gamme_step_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_task
    ADD CONSTRAINT intervention_task_gamme_step_unique UNIQUE (gamme_step_id, occurrence_id);


--
-- Name: intervention_task intervention_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_task
    ADD CONSTRAINT intervention_task_pkey PRIMARY KEY (id);


--
-- Name: intervention_type intervention_type_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_type
    ADD CONSTRAINT intervention_type_code_key UNIQUE (code);


--
-- Name: intervention_type intervention_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_type
    ADD CONSTRAINT intervention_type_pkey PRIMARY KEY (id);


--
-- Name: ip_blocklist ip_blocklist_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_blocklist
    ADD CONSTRAINT ip_blocklist_ip_address_key UNIQUE (ip_address);


--
-- Name: ip_blocklist ip_blocklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_blocklist
    ADD CONSTRAINT ip_blocklist_pkey PRIMARY KEY (id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: machine machine_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine
    ADD CONSTRAINT machine_code_key UNIQUE (code);


--
-- Name: machine_hours machine_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_hours
    ADD CONSTRAINT machine_hours_pkey PRIMARY KEY (machine_id);


--
-- Name: machine machine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine
    ADD CONSTRAINT machine_pkey PRIMARY KEY (id);


--
-- Name: manufacturer_item manufacturer_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturer_item
    ADD CONSTRAINT manufacturer_item_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: part part_internal_ref_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part
    ADD CONSTRAINT part_internal_ref_unique UNIQUE (internal_ref);


--
-- Name: part_manufacturer_ref part_manufacturer_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_manufacturer_ref
    ADD CONSTRAINT part_manufacturer_ref_pkey PRIMARY KEY (id);


--
-- Name: part_manufacturer_ref part_manufacturer_ref_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_manufacturer_ref
    ADD CONSTRAINT part_manufacturer_ref_unique UNIQUE (part_id, manufacturer_name, manufacturer_ref);


--
-- Name: part part_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part
    ADD CONSTRAINT part_pkey PRIMARY KEY (id);


--
-- Name: part_supplier_ref part_supplier_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_supplier_ref
    ADD CONSTRAINT part_supplier_ref_pkey PRIMARY KEY (id);


--
-- Name: part_supplier_ref part_supplier_ref_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_supplier_ref
    ADD CONSTRAINT part_supplier_ref_unique UNIQUE (part_manufacturer_ref_id, supplier_id, supplier_ref);


--
-- Name: part_template part_template_code_version_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template
    ADD CONSTRAINT part_template_code_version_unique UNIQUE (code, version);


--
-- Name: part_template_field_enum part_template_field_enum_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template_field_enum
    ADD CONSTRAINT part_template_field_enum_pkey PRIMARY KEY (id);


--
-- Name: part_template_field_enum part_template_field_enum_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template_field_enum
    ADD CONSTRAINT part_template_field_enum_unique UNIQUE (field_id, value);


--
-- Name: part_template_field part_template_field_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template_field
    ADD CONSTRAINT part_template_field_pkey PRIMARY KEY (id);


--
-- Name: part_template_field part_template_field_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template_field
    ADD CONSTRAINT part_template_field_unique UNIQUE (template_id, field_key);


--
-- Name: part_template part_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_template
    ADD CONSTRAINT part_template_pkey PRIMARY KEY (id);


--
-- Name: permission_audit_log permission_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_audit_log
    ADD CONSTRAINT permission_audit_log_pkey PRIMARY KEY (id);


--
-- Name: preventive_occurrence preventive_occurrence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_occurrence
    ADD CONSTRAINT preventive_occurrence_pkey PRIMARY KEY (id);


--
-- Name: preventive_occurrence preventive_occurrence_plan_machine_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_occurrence
    ADD CONSTRAINT preventive_occurrence_plan_machine_date_key UNIQUE (plan_id, machine_id, scheduled_date);


--
-- Name: preventive_plan preventive_plan_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_plan
    ADD CONSTRAINT preventive_plan_code_key UNIQUE (code);


--
-- Name: preventive_plan_gamme_step preventive_plan_gamme_step_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_plan_gamme_step
    ADD CONSTRAINT preventive_plan_gamme_step_pkey PRIMARY KEY (id);


--
-- Name: preventive_plan_gamme_step preventive_plan_gamme_step_plan_sort_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_plan_gamme_step
    ADD CONSTRAINT preventive_plan_gamme_step_plan_sort_key UNIQUE (plan_id, sort_order);


--
-- Name: preventive_plan preventive_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_plan
    ADD CONSTRAINT preventive_plan_pkey PRIMARY KEY (id);


--
-- Name: preventive_rule preventive_rule_keyword_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_rule
    ADD CONSTRAINT preventive_rule_keyword_key UNIQUE (keyword);


--
-- Name: preventive_rule preventive_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_rule
    ADD CONSTRAINT preventive_rule_pkey PRIMARY KEY (id);


--
-- Name: preventive_suggestion preventive_suggestion_intervention_action_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_suggestion
    ADD CONSTRAINT preventive_suggestion_intervention_action_id_key UNIQUE (intervention_action_id);


--
-- Name: preventive_suggestion preventive_suggestion_machine_id_preventive_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_suggestion
    ADD CONSTRAINT preventive_suggestion_machine_id_preventive_code_key UNIQUE (machine_id, preventive_code);


--
-- Name: preventive_suggestion preventive_suggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preventive_suggestion
    ADD CONSTRAINT preventive_suggestion_pkey PRIMARY KEY (id);


--
-- Name: purchase_request purchase_request_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request
    ADD CONSTRAINT purchase_request_code_key UNIQUE (code);


--
-- Name: purchase_request purchase_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request
    ADD CONSTRAINT purchase_request_pkey PRIMARY KEY (id);


--
-- Name: purchase_status purchase_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_status
    ADD CONSTRAINT purchase_status_pkey PRIMARY KEY (id);


--
-- Name: refresh_token refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (id);


--
-- Name: refresh_token refresh_token_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_token_hash_key UNIQUE (token_hash);


--
-- Name: request_status_log request_status_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_log
    ADD CONSTRAINT request_status_log_pkey PRIMARY KEY (id);


--
-- Name: request_status_ref request_status_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_ref
    ADD CONSTRAINT request_status_ref_pkey PRIMARY KEY (code);


--
-- Name: request_type_ref request_type_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_type_ref
    ADD CONSTRAINT request_type_ref_pkey PRIMARY KEY (code);


--
-- Name: role_home_view role_home_view_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_home_view
    ADD CONSTRAINT role_home_view_pkey PRIMARY KEY (id);


--
-- Name: role_home_view role_home_view_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_home_view
    ADD CONSTRAINT role_home_view_role_id_key UNIQUE (role_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: security_log security_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_log
    ADD CONSTRAINT security_log_pkey PRIMARY KEY (id);


--
-- Name: service service_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_code_key UNIQUE (code);


--
-- Name: service service_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_pkey PRIMARY KEY (id);


--
-- Name: stock_family stock_family_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_family
    ADD CONSTRAINT stock_family_pkey PRIMARY KEY (code);


--
-- Name: stock_item_characteristic stock_item_characteristic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_characteristic
    ADD CONSTRAINT stock_item_characteristic_pkey PRIMARY KEY (id);


--
-- Name: stock_item_characteristic stock_item_characteristic_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_characteristic
    ADD CONSTRAINT stock_item_characteristic_unique UNIQUE (stock_item_id, field_id);


--
-- Name: stock_item stock_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item
    ADD CONSTRAINT stock_item_pkey PRIMARY KEY (id);


--
-- Name: stock_item stock_item_ref_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item
    ADD CONSTRAINT stock_item_ref_key UNIQUE (ref);


--
-- Name: stock_item_standard_spec stock_item_standard_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_standard_spec
    ADD CONSTRAINT stock_item_standard_spec_pkey PRIMARY KEY (id);


--
-- Name: stock_item_supplier stock_item_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_supplier
    ADD CONSTRAINT stock_item_supplier_pkey PRIMARY KEY (id);


--
-- Name: stock_sub_family stock_sub_family_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_sub_family
    ADD CONSTRAINT stock_sub_family_pkey PRIMARY KEY (id);


--
-- Name: subtask subtask_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subtask
    ADD CONSTRAINT subtask_pkey PRIMARY KEY (id);


--
-- Name: supplier_order_line supplier_order_line_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_line
    ADD CONSTRAINT supplier_order_line_pkey PRIMARY KEY (id);


--
-- Name: supplier_order_line_purchase_request supplier_order_line_purchase_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_line_purchase_request
    ADD CONSTRAINT supplier_order_line_purchase_request_pkey PRIMARY KEY (id);


--
-- Name: supplier_order supplier_order_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order
    ADD CONSTRAINT supplier_order_order_number_key UNIQUE (order_number);


--
-- Name: supplier_order supplier_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order
    ADD CONSTRAINT supplier_order_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: tunnel_endpoint tunnel_endpoint_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_endpoint
    ADD CONSTRAINT tunnel_endpoint_code_key UNIQUE (code);


--
-- Name: tunnel_endpoint tunnel_endpoint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_endpoint
    ADD CONSTRAINT tunnel_endpoint_pkey PRIMARY KEY (id);


--
-- Name: tunnel_permission tunnel_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_permission
    ADD CONSTRAINT tunnel_permission_pkey PRIMARY KEY (id);


--
-- Name: tunnel_permission tunnel_permission_role_id_endpoint_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_permission
    ADD CONSTRAINT tunnel_permission_role_id_endpoint_id_key UNIQUE (role_id, endpoint_id);


--
-- Name: tunnel_role tunnel_role_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_role
    ADD CONSTRAINT tunnel_role_code_key UNIQUE (code);


--
-- Name: tunnel_role tunnel_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_role
    ADD CONSTRAINT tunnel_role_pkey PRIMARY KEY (id);


--
-- Name: tunnel_user tunnel_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tunnel_user
    ADD CONSTRAINT tunnel_user_pkey PRIMARY KEY (id);


--
-- Name: supplier_order_line_purchase_request uq_line_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_line_purchase_request
    ADD CONSTRAINT uq_line_request UNIQUE (supplier_order_line_id, purchase_request_id);


--
-- Name: stock_item_supplier uq_stock_item_supplier; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_supplier
    ADD CONSTRAINT uq_stock_item_supplier UNIQUE (stock_item_id, supplier_id);


--
-- Name: stock_sub_family uq_stock_sub_family; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_sub_family
    ADD CONSTRAINT uq_stock_sub_family UNIQUE (family_code, code);


--
-- Name: idx_audit_rule_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_rule_entity_type ON public.audit_rule USING btree (entity_type);


--
-- Name: idx_intervention_request_categorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intervention_request_categorie ON public.intervention_request USING btree (categorie);


--
-- Name: idx_intervention_request_porteur_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intervention_request_porteur_id ON public.intervention_request USING btree (porteur_id);


--
-- Name: idx_intervention_request_sous_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intervention_request_sous_statut ON public.intervention_request USING btree (sous_statut);


--
-- Name: idx_intervention_request_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intervention_request_type ON public.intervention_request USING btree (type);


--
-- Name: idx_notification_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_user_unread ON public.notification USING btree (user_id, read_at);


--
-- Name: idx_part_family_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_family_code ON public.part USING btree (family_code);


--
-- Name: idx_part_internal_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_internal_ref ON public.part USING btree (internal_ref);


--
-- Name: idx_part_mfr_ref_part_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_mfr_ref_part_id ON public.part_manufacturer_ref USING btree (part_id);


--
-- Name: idx_part_mfr_ref_preferred; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_mfr_ref_preferred ON public.part_manufacturer_ref USING btree (part_id, is_preferred) WHERE (is_preferred = true);


--
-- Name: idx_part_sub_family_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_sub_family_code ON public.part USING btree (family_code, sub_family_code);


--
-- Name: idx_part_supplier_ref_mfr_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_supplier_ref_mfr_id ON public.part_supplier_ref USING btree (part_manufacturer_ref_id);


--
-- Name: idx_part_supplier_ref_preferred; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_supplier_ref_preferred ON public.part_supplier_ref USING btree (part_manufacturer_ref_id, is_preferred) WHERE (is_preferred = true);


--
-- Name: idx_part_supplier_ref_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_supplier_ref_supplier_id ON public.part_supplier_ref USING btree (supplier_id);


--
-- Name: idx_purchase_request_approver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_request_approver_id ON public.purchase_request USING btree (approver_id);


--
-- Name: idx_purchase_request_part_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_request_part_id ON public.purchase_request USING btree (part_id);


--
-- Name: idx_purchase_request_requested_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_request_requested_by_id ON public.purchase_request USING btree (requested_by_id);


--
-- Name: idx_supplier_order_line_part_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_order_line_part_id ON public.supplier_order_line USING btree (part_id);


--
-- Name: uq_sol_part; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_sol_part ON public.supplier_order_line USING btree (supplier_order_id, part_id) WHERE (part_id IS NOT NULL);


--
-- Name: uq_sol_stock_item; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_sol_stock_item ON public.supplier_order_line USING btree (supplier_order_id, stock_item_id) WHERE (stock_item_id IS NOT NULL);


--
-- Name: request_status_log trg_apply_request_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_apply_request_status AFTER INSERT ON public.request_status_log FOR EACH ROW EXECUTE FUNCTION public.fn_apply_request_status();


--
-- Name: supplier_order_line trg_calculate_line_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calculate_line_total BEFORE INSERT OR UPDATE OF unit_price, quantity ON public.supplier_order_line FOR EACH ROW EXECUTE FUNCTION public.calculate_line_total();


--
-- Name: intervention trg_check_intervention_closable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_intervention_closable BEFORE UPDATE ON public.intervention FOR EACH ROW EXECUTE FUNCTION public.check_intervention_closable();


--
-- Name: intervention_action trg_compute_action_time_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_compute_action_time_insert BEFORE INSERT ON public.intervention_action FOR EACH ROW EXECUTE FUNCTION public.fn_compute_action_time();


--
-- Name: intervention_action trg_compute_action_time_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_compute_action_time_update BEFORE UPDATE OF time_spent, action_start, action_end ON public.intervention_action FOR EACH ROW EXECUTE FUNCTION public.fn_compute_action_time();


--
-- Name: intervention_action trg_detect_preventive; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_detect_preventive AFTER INSERT ON public.intervention_action FOR EACH ROW EXECUTE FUNCTION public.detect_preventive_suggestions();


--
-- Name: stock_item trg_generate_stock_item_ref; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_generate_stock_item_ref BEFORE INSERT OR UPDATE OF family_code, sub_family_code, spec, dimension ON public.stock_item FOR EACH ROW EXECUTE FUNCTION public.generate_stock_item_ref();


--
-- Name: supplier_order trg_generate_supplier_order_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_generate_supplier_order_number BEFORE INSERT ON public.supplier_order FOR EACH ROW EXECUTE FUNCTION public.generate_supplier_order_number();


--
-- Name: intervention_request trg_init_request_status_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_init_request_status_log AFTER INSERT ON public.intervention_request FOR EACH ROW EXECUTE FUNCTION public.fn_init_request_status_log();


--
-- Name: intervention trg_init_status_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_init_status_log AFTER INSERT ON public.intervention FOR EACH ROW EXECUTE FUNCTION public.trg_init_status_log();


--
-- Name: intervention trg_interv_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_interv_code BEFORE INSERT ON public.intervention FOR EACH ROW EXECUTE FUNCTION public.generate_intervention_code();


--
-- Name: intervention_request trg_log_request_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_request_status_change AFTER UPDATE OF statut ON public.intervention_request FOR EACH ROW EXECUTE FUNCTION public.fn_log_request_status_change();


--
-- Name: intervention trg_log_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_status_change AFTER UPDATE ON public.intervention FOR EACH ROW WHEN (((old.status_actual)::text IS DISTINCT FROM (new.status_actual)::text)) EXECUTE FUNCTION public.trg_log_status_change();


--
-- Name: intervention_action trg_machine_hours_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_machine_hours_update AFTER INSERT OR UPDATE OF time_spent ON public.intervention_action FOR EACH ROW EXECUTE FUNCTION public.fn_machine_hours_update();


--
-- Name: intervention_request trg_notify_di_a_traiter; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_di_a_traiter AFTER INSERT ON public.intervention_request FOR EACH ROW EXECUTE FUNCTION public.fn_notify_di_a_traiter();


--
-- Name: part_manufacturer_ref trg_part_mfr_ref_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_part_mfr_ref_updated_at BEFORE UPDATE ON public.part_manufacturer_ref FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: part_supplier_ref trg_part_supplier_ref_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_part_supplier_ref_updated_at BEFORE UPDATE ON public.part_supplier_ref FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: part trg_part_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_part_updated_at BEFORE UPDATE ON public.part FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchase_request trg_purchase_request_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_purchase_request_code BEFORE INSERT ON public.purchase_request FOR EACH ROW EXECUTE FUNCTION public.fn_generate_purchase_request_code();


--
-- Name: purchase_request trg_purchase_request_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_purchase_request_updated_at BEFORE UPDATE ON public.purchase_request FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: supplier_order_line trg_recalculate_supplier_order_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalculate_supplier_order_total AFTER INSERT OR DELETE OR UPDATE OF unit_price, quantity, total_price ON public.supplier_order_line FOR EACH ROW EXECUTE FUNCTION public.recalculate_supplier_order_total();


--
-- Name: intervention_request trg_request_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_request_code BEFORE INSERT ON public.intervention_request FOR EACH ROW EXECUTE FUNCTION public.fn_generate_request_code();


--
-- Name: intervention_request trg_request_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_request_updated_at BEFORE UPDATE ON public.intervention_request FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stock_item_supplier trg_stock_item_supplier_refs_count_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stock_item_supplier_refs_count_delete AFTER DELETE ON public.stock_item_supplier FOR EACH ROW EXECUTE FUNCTION public.fn_update_supplier_refs_count();


--
-- Name: stock_item_supplier trg_stock_item_supplier_refs_count_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stock_item_supplier_refs_count_insert AFTER INSERT ON public.stock_item_supplier FOR EACH ROW EXECUTE FUNCTION public.fn_update_supplier_refs_count();


--
-- Name: stock_item_supplier trg_stock_item_supplier_refs_count_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stock_item_supplier_refs_count_update AFTER UPDATE ON public.stock_item_supplier FOR EACH ROW WHEN ((old.stock_item_id IS DISTINCT FROM new.stock_item_id)) EXECUTE FUNCTION public.fn_update_supplier_refs_count();


--
-- Name: stock_item_supplier trg_stock_item_supplier_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stock_item_supplier_updated_at BEFORE UPDATE ON public.stock_item_supplier FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: supplier_order_line trg_supplier_order_line_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_supplier_order_line_updated_at BEFORE UPDATE ON public.supplier_order_line FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: supplier_order trg_supplier_order_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_supplier_order_updated_at BEFORE UPDATE ON public.supplier_order FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: supplier trg_supplier_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_supplier_updated_at BEFORE UPDATE ON public.supplier FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: intervention_status_log trg_sync_status_log_to_intervention; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_status_log_to_intervention AFTER INSERT ON public.intervention_status_log FOR EACH ROW EXECUTE FUNCTION public.fn_sync_status_log_to_intervention();


--
-- Name: tunnel_user trg_tunnel_user_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tunnel_user_updated_at BEFORE UPDATE ON public.tunnel_user FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: preventive_plan trg_updated_at_preventive_plan; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at_preventive_plan BEFORE UPDATE ON public.preventive_plan FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at_preventive_plan();


--
-- Name: action_category_meta update_action_category_meta_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_action_category_meta_updated_at BEFORE UPDATE ON public.action_category_meta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: action_classification_probe update_action_classification_probe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_action_classification_probe_updated_at BEFORE UPDATE ON public.action_classification_probe FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: anomaly_threshold update_anomaly_threshold_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_anomaly_threshold_updated_at BEFORE UPDATE ON public.anomaly_threshold FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_rule audit_rule_default_reason_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_rule
    ADD CONSTRAINT audit_rule_default_reason_code_fkey FOREIGN KEY (default_reason_code) REFERENCES public.audit_reason_code(code);


--
-- Name: intervention_request intervention_request_categorie_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_categorie_fkey FOREIGN KEY (categorie) REFERENCES public.amelioration_category_ref(code);


--
-- Name: intervention_request intervention_request_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;


--
-- Name: intervention_request intervention_request_porteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_porteur_id_fkey FOREIGN KEY (porteur_id) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;


--
-- Name: intervention_request intervention_request_sous_statut_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_sous_statut_fkey FOREIGN KEY (sous_statut) REFERENCES public.amelioration_sous_statut_ref(code);


--
-- Name: intervention_request intervention_request_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_type_fkey FOREIGN KEY (type) REFERENCES public.request_type_ref(code);


--
-- Name: notification notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tunnel_user(id) ON DELETE CASCADE;


--
-- Name: part part_family_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part
    ADD CONSTRAINT part_family_code_fkey FOREIGN KEY (family_code) REFERENCES public.stock_family(code);


--
-- Name: part_manufacturer_ref part_manufacturer_ref_part_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_manufacturer_ref
    ADD CONSTRAINT part_manufacturer_ref_part_fk FOREIGN KEY (part_id) REFERENCES public.part(id) ON DELETE CASCADE;


--
-- Name: part part_sub_family_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part
    ADD CONSTRAINT part_sub_family_code_fkey FOREIGN KEY (sub_family_code, family_code) REFERENCES public.stock_sub_family(code, family_code);


--
-- Name: part_supplier_ref part_supplier_ref_mfr_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_supplier_ref
    ADD CONSTRAINT part_supplier_ref_mfr_fk FOREIGN KEY (part_manufacturer_ref_id) REFERENCES public.part_manufacturer_ref(id) ON DELETE CASCADE;


--
-- Name: part_supplier_ref part_supplier_ref_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_supplier_ref
    ADD CONSTRAINT part_supplier_ref_supplier_fk FOREIGN KEY (supplier_id) REFERENCES public.supplier(id);


--
-- Name: purchase_request purchase_request_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request
    ADD CONSTRAINT purchase_request_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;


--
-- Name: purchase_request purchase_request_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request
    ADD CONSTRAINT purchase_request_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.part(id) ON DELETE SET NULL;


--
-- Name: purchase_request purchase_request_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request
    ADD CONSTRAINT purchase_request_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;


--
-- Name: role_home_view role_home_view_home_view_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_home_view
    ADD CONSTRAINT role_home_view_home_view_fkey FOREIGN KEY (home_view) REFERENCES public.home_view_ref(code);


--
-- Name: role_home_view role_home_view_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_home_view
    ADD CONSTRAINT role_home_view_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tunnel_role(id) ON DELETE CASCADE;


--
-- Name: role_home_view role_home_view_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_home_view
    ADD CONSTRAINT role_home_view_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;


--
-- Name: supplier_order_line supplier_order_line_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_line
    ADD CONSTRAINT supplier_order_line_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.part(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


