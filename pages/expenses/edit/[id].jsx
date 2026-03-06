import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Layout, AddEdit } from "components/expenses";
import { Spinner } from "components";
import { alertService, expensesService } from "services";

export default Edit;

function Edit() {
  const router = useRouter();
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    const { id } = router.query;
    if (!id) return;

    // fetch user and set default form values if in edit mode
    expensesService
      .getById(id)
      .then((x) => setExpense(x))
      .catch(alertService.error);
  }, [router]);

  return (
    <Layout>{expense ? <AddEdit expense={expense} /> : <Spinner />}</Layout>
  );
}
