import { Layout } from "components/tickets";
import { Budget } from "../../components/seller/Budget";
import { useEffect, useState } from "react";
import { ticketsService } from "../../services";
import { Spinner } from "../../components";

export default Add;

function Add() {
  useEffect(() => {
    getRefundsForSupply();
  }, []);

  function getRefundsForSupply() {
    ticketsService.getRefundsForSupply({}).then((x) => {
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

  const [refunds, setRefunds] = useState(null);
  const [totals, setTotals] = useState({});
  return (
    <Layout>
      {refunds ? <Budget refunds={refunds} totals={totals} /> : <Spinner />}
    </Layout>
  );
}
