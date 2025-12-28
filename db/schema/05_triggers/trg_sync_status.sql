-- ============================================================================
-- trg_sync_status.sql - Synchronisation statut depuis log
-- ============================================================================
-- Synchronise intervention.status_actual depuis dernier log
-- Utile si statut modifié directement dans intervention_status_log
--
-- @see intervention.sql (01_core)
-- @see intervention_status_log.sql (01_core)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_sync_status_from_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    last_status VARCHAR(255);
    current_status VARCHAR(255);
BEGIN
    -- Récupère dernier statut depuis log
    SELECT status_to
    INTO last_status
    FROM public.intervention_status_log
    WHERE intervention_id = NEW.intervention_id
    ORDER BY date DESC
    LIMIT 1;

    -- Récupère statut actuel intervention
    SELECT status_actual
    INTO current_status
    FROM public.intervention
    WHERE id = NEW.intervention_id;

    -- Mise à jour uniquement si différent (évite boucle)
    IF last_status IS DISTINCT FROM current_status THEN
        UPDATE public.intervention
        SET status_actual = last_status
        WHERE id = NEW.intervention_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_status_from_log
  AFTER INSERT OR UPDATE ON public.intervention_status_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_status_from_log();

-- Commentaires
COMMENT ON FUNCTION public.trg_sync_status_from_log() IS 'Synchronise status_actual depuis dernier log';
