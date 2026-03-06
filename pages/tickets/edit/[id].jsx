import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Layout, AddEdit } from "components/tickets";
import { Spinner } from "components";
import { ticketsService, alertService, userService } from "services";

export default Edit;

function Edit() {
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState(null);

  useEffect(() => {
    const { id } = router.query;
    if (!id) return;

    userService.getAll().then((x) => setAgents(x));

    // fetch user and set default form values if in edit mode
    ticketsService
      .getById(id)
      .then((x) => setTicket(x))
      .catch(alertService.error);
  }, [router]);

  return (
    <Layout>
      {ticket && agents ? (
        <AddEdit agents={agents} ticket={ticket} />
      ) : (
        <Spinner />
      )}
    </Layout>
  );
}
