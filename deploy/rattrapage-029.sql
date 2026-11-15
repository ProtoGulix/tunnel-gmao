-- Rattrapage d'une base restaurée depuis une source 3.57.0 (révision alembic 029)
-- pour l'amener au schéma de référence (backend/db/schema.sql), voir BASC-01 et le
-- spike 0003. Appliqué par migrate-from-v4.sh à la base cible, juste après la
-- restauration, par tunnel_owner, en une transaction (ON_ERROR_STOP).
--
-- Ajoute seulement, sauf une exception : les 3 clés étrangères de l'arbre des
-- équipements sur machine, retirées en fin de fichier car la migration 0003 les
-- recrée (BASC-02). Aucun autre DROP de contrainte, d'index ni de données. Les définitions
-- sont reprises à l'identique de schema.sql et seed_reference.sql ; si ces fichiers
-- changent pour ces objets, ce fichier doit suivre (le contrôle de schéma du script
-- le détecte).

BEGIN;

-- Tables de référence et leurs données de départ ------------------------------
CREATE TABLE public.amelioration_category_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);
CREATE TABLE public.amelioration_sous_statut_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);
CREATE TABLE public.request_type_ref (
    code character varying(50) NOT NULL,
    label text NOT NULL,
    color character varying(7) NOT NULL,
    sort_order integer NOT NULL
);
ALTER TABLE ONLY public.amelioration_category_ref
    ADD CONSTRAINT amelioration_category_ref_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.amelioration_sous_statut_ref
    ADD CONSTRAINT amelioration_sous_statut_ref_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.request_type_ref
    ADD CONSTRAINT request_type_ref_pkey PRIMARY KEY (code);

INSERT INTO public.amelioration_category_ref VALUES ('securite', 'Sécurité', '#EF4444', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('productivite', 'Productivité / performance', '#3B82F6', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('ergonomie', 'Ergonomie / qualité de vie au travail', '#10B981', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('qualite', 'Qualité / fiabilité', '#F59E0B', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('a_confirmer', 'À confirmer', '#F59E0B', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('a_planifier', 'À planifier', '#8B5CF6', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('en_cours', 'En cours', '#3B82F6', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('realise', 'Réalisé', '#10B981', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.request_type_ref VALUES ('standard', 'Demande d''intervention', '#6B7280', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.request_type_ref VALUES ('amelioration', 'Idée d''amélioration', '#0EA5E9', 2) ON CONFLICT DO NOTHING;

-- Colonnes de intervention_request, puis clés étrangères et index ------------
ALTER TABLE public.intervention_request
    ADD COLUMN type character varying(50) DEFAULT 'standard'::character varying NOT NULL,
    ADD COLUMN categorie character varying(50),
    ADD COLUMN priorite character varying(20),
    ADD COLUMN sous_statut character varying(50),
    ADD COLUMN porteur_id uuid,
    ADD COLUMN deadline date;
ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_categorie_fkey FOREIGN KEY (categorie) REFERENCES public.amelioration_category_ref(code);
ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_porteur_id_fkey FOREIGN KEY (porteur_id) REFERENCES public.tunnel_user(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_sous_statut_fkey FOREIGN KEY (sous_statut) REFERENCES public.amelioration_sous_statut_ref(code);
ALTER TABLE ONLY public.intervention_request
    ADD CONSTRAINT intervention_request_type_fkey FOREIGN KEY (type) REFERENCES public.request_type_ref(code);
CREATE INDEX idx_intervention_request_categorie ON public.intervention_request USING btree (categorie);
CREATE INDEX idx_intervention_request_porteur_id ON public.intervention_request USING btree (porteur_id);
CREATE INDEX idx_intervention_request_sous_statut ON public.intervention_request USING btree (sous_statut);
CREATE INDEX idx_intervention_request_type ON public.intervention_request USING btree (type);

-- Fonctions et déclencheur (versions de schema.sql) ----------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$;

CREATE OR REPLACE FUNCTION public.fn_sync_status_log_to_intervention() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.fn_audit_log_decision(p_entity_type character varying, p_entity_id uuid, p_decision_type character varying, p_old_value jsonb, p_new_value jsonb, p_reason_code character varying, p_reason_text text DEFAULT NULL::text, p_changed_by uuid DEFAULT NULL::uuid, p_is_system boolean DEFAULT false) RETURNS uuid
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
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_preventive_suggestions() RETURNS trigger
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

-- Fonctions déjà présentes dans la source, identiques à la référence au blanc et à
-- l'indentation près (vérifié : corps égaux une fois les blancs normalisés, commentaires
-- compris) : remplacées par la version de schema.sql pour que le contrôle de schéma,
-- qui compare les définitions, n'ait pas d'écart.
CREATE OR REPLACE FUNCTION public.calculate_line_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  IF NEW.unit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN

    NEW.total_price = NEW.unit_price * NEW.quantity;

  END IF;

  

  RETURN NEW;

END;

$$;

CREATE OR REPLACE FUNCTION public.check_intervention_closable() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.dispatch_purchase_requests() RETURNS json
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

CREATE OR REPLACE FUNCTION public.fn_update_supplier_refs_count() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.generate_supplier_order_number() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.trg_init_status_log() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.trg_log_status_change() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$$;

-- Élargissement d'une colonne (30 vers 50 caractères) : aucune donnée perdue.
ALTER TABLE public.role_home_view ALTER COLUMN home_view TYPE character varying(50);

CREATE TRIGGER trg_tunnel_user_updated_at BEFORE UPDATE ON public.tunnel_user FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Renommage de la clé primaire de intervention_task et codes de statut ---------
ALTER TABLE public.intervention_task RENAME CONSTRAINT gamme_step_validation_pkey TO intervention_task_pkey;
UPDATE public.intervention_status_ref SET code = id WHERE code IS NULL OR code = '';

-- Clés de l'arbre des équipements (BASC-02, décision de l'utilisateur du 2026-11-15).
-- La source les a déjà, en NO ACTION, dont deux sous le nom exact que la migration 0003
-- crée : 0003 échouerait (« already exists »). Elles sont retirées ici et 0003 les
-- recrée aussitôt en ON DELETE RESTRICT, au moins aussi strict. L'api est arrêtée
-- pendant la bascule : aucune écriture entre le retrait et 0003.
ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_equipement_class_id_fkey;
ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_statut_id_fkey;
ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_equipement_mere_foreign;

COMMIT;
