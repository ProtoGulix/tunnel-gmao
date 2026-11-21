import PropTypes from 'prop-types';
import { useInterventionTypeRefs } from '@/hooks/shared/useInterventionTypeRefs';

/** Libellé d'un type d'intervention depuis la base ; le code brut tant que la liste n'est pas chargée */
export default function InterventionTypeLabel({ code }) {
  const { labelOf } = useInterventionTypeRefs();
  return <>{labelOf(code) ?? code}</>;
}

InterventionTypeLabel.propTypes = { code: PropTypes.string };
