import { Layout } from "components/tickets";
import { Budget } from "../../components/seller/Budget";
import { useEffect, useState } from "react";
import { ticketsService } from "../../services";

export default Add;

function Add() {
  const [supplier, setSupplier] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [totals, setTotals] = useState({});

  useEffect(() => {
    if (!supplier) {
      setRefunds([]);
      setTotals({});
      return;
    }

    setRefunds([]);
    setTotals({});
    getRefundsForSupply(supplier);
  }, [supplier]);

  function getRefundsForSupply(supplier) {
    ticketsService.getRefundsForSupply({ supplier }).then((x) => {
      let totalRefund = 0;
      let totalRefundUsed = 0;
      let totalRemained = 0;
      const refunds = x.map((e) => {
        let remained = e.refund - (e.refundUsed || 0);
        totalRefund += parseFloat(e.refund || 0);
        totalRefundUsed += parseFloat(e.refundUsed || 0);
        totalRemained += parseFloat(remained || 0);
        return {
          ...e,
          refundUsed: e.refundUsed || 0,
          remained: parseFloat(remained).toFixed(2),
        };
      });
      setRefunds(refunds);
      setTotals({ totalRefund, totalRefundUsed, totalRemained });
    });
  }

  return (
    <Layout>
      <Budget
        supplier={supplier}
        setSupplier={setSupplier}
        refunds={refunds}
        totals={totals}
      />
    </Layout>
  );
}
