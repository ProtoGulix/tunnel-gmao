-- ============================================================================
-- fn_dispatch_purchase_requests.sql - Dispatch automatique des demandes d'achat
-- ============================================================================
-- Fonction stockée qui dispatche les demandes d'achat vers les paniers
-- fournisseurs en créant des lignes (supplier_order_line) pour chaque
-- article avec TOUS les fournisseurs possibles.
--
-- RÈGLES MÉTIER (Consultation) :
-- 1. Une demande d'achat (status = 'open') est dispatchée dans TOUS les paniers
--    OPEN des fournisseurs associés à l'article
-- 2. Si la référence existe déjà dans un panier OPEN, la quantité est incrémentée
-- 3. Une même référence peut donc exister dans plusieurs paniers en parallèle
-- 4. Lors du dispatch, les champs consultation sont initialisés à défaut :
--    - quote_received = false (aucun devis reçu)
--    - is_selected = false (pas de sélection)
--    - quote_price, lead_time_days, manufacturer, manufacturer_ref = NULL
--
-- Logique :
-- 1. Fetch demandes ouvertes (status = 'open')
-- 2. Pour chaque, trouver TOUS les fournisseurs de l'article
-- 3. Pour chaque fournisseur, créer/utiliser panier (status = 'OPEN')
-- 4. Créer/incrémenter ligne dans le panier
-- 5. Mettre à jour demande à status = 'in_progress'
--
-- Retour : JSON { dispatched: [], toQualify: [], errors: [] }
-- ============================================================================

CREATE OR REPLACE FUNCTION public.dispatch_purchase_requests()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_dispatched TEXT[] := ARRAY[]::TEXT[];
  v_to_qualify TEXT[] := ARRAY[]::TEXT[];
  v_errors json[] := ARRAY[]::json[];
  
  v_req RECORD;
  v_supplier RECORD;
  v_supplier_order_id UUID;
  v_has_suppliers BOOLEAN;
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
    -- Flag pour tracker si cet article a des fournisseurs
    v_has_suppliers := FALSE;

    -- BOUCLE SUR TOUS LES FOURNISSEURS de cet article
    FOR v_supplier IN
      SELECT DISTINCT
        sis.supplier_id,
        sis.supplier_ref
      FROM public.stock_item_supplier sis
      WHERE sis.stock_item_id = v_req.stock_item_id
      ORDER BY sis.supplier_id
    LOOP
      v_has_suppliers := TRUE;

      BEGIN
        -- Chercher panier OPEN du fournisseur, sinon en créer un
        SELECT so.id
        INTO v_supplier_order_id
        FROM public.supplier_order so
        WHERE so.supplier_id = v_supplier.supplier_id
          AND so.status = 'OPEN'
        ORDER BY so.created_at DESC
        LIMIT 1;

        IF v_supplier_order_id IS NULL THEN
          -- Créer nouveau panier
          INSERT INTO public.supplier_order (supplier_id, status, total_amount)
          VALUES (v_supplier.supplier_id, 'OPEN', 0)
          RETURNING id INTO v_supplier_order_id;
        END IF;

        -- CONSULTATION : Créer ou mettre à jour la ligne dans le panier
        -- Les champs consultation sont initialisés à défaut (quote_received=false, is_selected=false)
        DECLARE
          v_line_id UUID;
          v_line_exists BOOLEAN;
        BEGIN
          -- Vérifier si la ligne existe déjà
          SELECT id INTO v_line_id
          FROM public.supplier_order_line
          WHERE supplier_order_id = v_supplier_order_id
            AND stock_item_id = v_req.stock_item_id;
          
          v_line_exists := FOUND;
          
          IF v_line_exists THEN
            -- Incrémenter la quantité de la ligne existante
            UPDATE public.supplier_order_line
            SET quantity = COALESCE(quantity, 0) + COALESCE(v_req.quantity, 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_line_id;
          ELSE
            -- Créer nouvelle ligne
            INSERT INTO public.supplier_order_line (
              supplier_order_id,
              stock_item_id,
              supplier_ref_snapshot,
              quantity,
              unit_price,
              total_price,
              quote_received,
              is_selected,
              quote_price,
              lead_time_days,
              manufacturer,
              manufacturer_ref
            )
            VALUES (
              v_supplier_order_id,
              v_req.stock_item_id,
              v_supplier.supplier_ref,
              COALESCE(v_req.quantity, 1),
              NULL,
              NULL,
              FALSE,       -- quote_received = false (aucun devis)
              FALSE,       -- is_selected = false (pas de sélection)
              NULL,        -- quote_price = NULL
              NULL,        -- lead_time_days = NULL
              NULL,        -- manufacturer = NULL
              NULL         -- manufacturer_ref = NULL
            )
            RETURNING id INTO v_line_id;
          END IF;
          
          -- Créer le lien M2M si la ligne existe et n'a pas déjà ce lien
          IF v_line_id IS NOT NULL THEN
            INSERT INTO public.supplier_order_line_purchase_request (
              supplier_order_line_id,
              purchase_request_id,
              quantity
            )
            VALUES (
              v_line_id,
              v_req.id,
              COALESCE(v_req.quantity, 1)
            )
            ON CONFLICT (supplier_order_line_id, purchase_request_id) DO NOTHING;
          END IF;
        END;

        v_dispatched := array_append(v_dispatched, v_req.id::TEXT);

      EXCEPTION WHEN OTHERS THEN
        -- Log erreur et continue
        v_errors := array_append(
          v_errors,
          json_build_object(
            'id', v_req.id::TEXT,
            'supplier_id', v_supplier.supplier_id::TEXT,
            'error', SQLERRM
          )
        );
      END;
    END LOOP;

    -- Si pas de fournisseur associé à cet article
    IF NOT v_has_suppliers THEN
      v_to_qualify := array_append(v_to_qualify, v_req.id::TEXT);
      CONTINUE;
    END IF;

    -- Mettre à jour statut demande à 'in_progress' (seulement si au moins un fournisseur)
    IF v_has_suppliers THEN
      UPDATE public.purchase_request
      SET status = 'in_progress'
      WHERE id = v_req.id;
    END IF;

  END LOOP;

  -- Retourner résultat au format JSON
  RETURN json_build_object(
    'dispatched', COALESCE(v_dispatched, ARRAY[]::TEXT[]),
    'toQualify', COALESCE(v_to_qualify, ARRAY[]::TEXT[]),
    'errors', COALESCE(v_errors, ARRAY[]::json[])
  );
END;
$$;

-- Commentaire
COMMENT ON FUNCTION public.dispatch_purchase_requests() 
IS 'Dispatche les demandes d''achat (status=open) vers les paniers OPEN de TOUS les fournisseurs possibles. 
Pour chaque référence/fournisseur, crée ou incrémente une ligne. Initialise les champs consultation (quote_received=false, is_selected=false).
Retourne {dispatched, toQualify, errors}.';
