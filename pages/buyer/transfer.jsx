import { Layout } from "components/tickets";
import { Budget } from "../../components/buyer/Budget";
import { useEffect, useState } from "react";
import { ticketsService, userService } from "../../services";
import { Spinner } from "../../components";

export default Add;

function Add() {
  const [agents, setAgents] = useState(null);
  useEffect(() => {
    getAgents();
  }, []);

  function getAgents() {
    userService.getAllAgents().then((res) => {
      let ags = res.filter(
        (ag) =>
          !(ag.firstName + " " + ag.lastName).toLowerCase().includes("agency")
      );
      setAgents(ags);
    });
  }
  return <Layout>{agents ? <Budget agents={agents} /> : <Spinner />}</Layout>;
}
