-- ============================================================================
-- trg_intervention_action_purchase_request.sql - Sync intervention on purchase requests
-- ============================================================================
-- Quand une liaison action ↔ demande d'achat est créée/mise à jour, synchronise
-- purchase_request.intervention_id avec l'intervention portée par l'action.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_purchase_request_intervention()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.intervention_action_id IS NULL OR NEW.purchase_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.purchase_request pr
  SET intervention_id = ia.intervention_id
  FROM public.intervention_action ia
  WHERE pr.id = NEW.purchase_request_id
    AND ia.id = NEW.intervention_action_id
    AND (pr.intervention_id IS DISTINCT FROM ia.intervention_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_iapr_sync_intervention
  AFTER INSERT OR UPDATE ON public.intervention_action_purchase_request
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_purchase_request_intervention();

COMMENT ON FUNCTION public.sync_purchase_request_intervention() IS 'Synchronise purchase_request.intervention_id depuis l''action liée lors de l''insertion ou mise à jour de la liaison M2M.';
