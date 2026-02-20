import { Button } from "@radix-ui/themes";
import { Package } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import { useError } from "@/contexts/ErrorContext";
import { supplierOrdersTablePropTypes } from "./supplierOrdersTablePropTypes";
import { useSupplierOrdersTable } from "./useSupplierOrdersTable";

export default function SupplierOrdersTable(props) {
  const { showError } = useError();
  const { headerProps, columns, sortedOrders, rowRenderer, loading } = useSupplierOrdersTable({
    ...props,
    showError,
  });

  return (
    <DataTable
      headerProps={headerProps}
      columns={columns}
      data={sortedOrders}
      rowRenderer={rowRenderer}
      loading={loading}
      emptyState={{
        icon: Package,
        title: "Aucun panier fournisseur",
        description: "Créez un panier pour commencer.",
        action:
          props.onRefresh ? (
            <Button onClick={props.onRefresh} size="2" variant="soft" color="blue">
              Rafraîchir
            </Button>
          ) : null,
      }}
    />
  );
}

SupplierOrdersTable.propTypes = supplierOrdersTablePropTypes;
