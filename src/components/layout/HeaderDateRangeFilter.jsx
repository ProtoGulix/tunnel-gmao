import DateRangeFilter from "@/components/common/DateRangeFilter";
import PropTypes from "prop-types";

export default function HeaderDateRangeFilter(props) {
  return <DateRangeFilter mode="compact" {...props} />;
}

HeaderDateRangeFilter.propTypes = {
  onFilterChange: PropTypes.func,
};
