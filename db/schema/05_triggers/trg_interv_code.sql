-- ============================================================================
-- trg_interv_code.sql - Génération automatique code intervention
-- ============================================================================
-- Génère code unique intervention : MACHINE-TYPE-YYYYMMDD-INITIALES
-- Exemple : CONV01-PREV-20241228-JD
--
-- @see intervention.sql (01_core)
-- @see machine.sql (01_core)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_intervention_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  machine_code TEXT;
  today TEXT := to_char(current_date, 'YYYYMMDD');
BEGIN
  -- Récupère code machine
  SELECT code INTO machine_code 
  FROM machine 
  WHERE id = NEW.machine_id;
  
  -- Erreur si machine inconnue
  IF machine_code IS NULL THEN
    RAISE EXCEPTION 'Machine % inconnue', NEW.machine_id;
  END IF;
  
  -- Génère code : MACHINE-TYPE-DATE-INITIALES
  NEW.code := machine_code || '-' || NEW.type_inter || '-' || today || '-' || NEW.tech_initials;
  
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_interv_code
  BEFORE INSERT ON public.intervention
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_intervention_code();

-- Commentaires
COMMENT ON FUNCTION public.generate_intervention_code() IS 'Génère code intervention automatiquement';
