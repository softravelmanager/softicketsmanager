import { Layout, AddEdit } from "components/tickets";
import { useState, useEffect } from "react";
import { userService } from "../../services";
import { Spinner } from "../../components";

export default Add;

function Add() {
  const [agents, setAgents] = useState(null);
  useEffect(() => {
    userService.getAllAgents().then((x) => setAgents(x));
  }, []);
  return <Layout>{agents ? <AddEdit agents={agents} /> : <Spinner />}</Layout>;
}
