import { fetchWrapper } from "helpers";
import moment from "moment";
import { cleanFlight } from "./index";

const baseUrl = `/api/flights`;
const ticketsUrl = "api/tickets";

export const flightsService = {
  getAll,
  create,
  update,
  delete: _delete,
  getById,
  setFlights,
};

async function setFlights() {
  let airlines = await getAll();
  let airlinesI = airlines.map((al) => al.name) || [];
  let airlinesN = [];
  let airlinesT = [];

  let filters = {
    start: moment().add("-24", "month"),
    end: moment(),
    type: "bookedOn",
  };
  let tickets = await fetchWrapper.post(ticketsUrl, filters);
  tickets.map((t) => {
    let flight = cleanFlight(t);
    if (!airlinesT.includes(flight)) {
      airlinesT.push(flight);
    }
  });

  airlinesT.map((at) => {
    if (at.trim() && !airlinesI.includes(at)) {
      airlinesN.push(at);
    }
  });
  console.log(airlinesI, airlinesT, airlinesN);

  airlinesN.map((an) => {
    if (an.trim() !== "") {
      let flightT = {
        name: an,
        desc: an,
        url: an,
        checkin: an,
        country: "-",
        checkinTime: "-",
      };
      //create(flightT);
    }
  });
  return airlinesN;
}

async function getAll() {
  return await fetchWrapper.get(baseUrl);
}

async function create(flight) {
  await fetchWrapper.post(`${baseUrl}/create`, flight);
}

async function update(id, params) {
  await fetchWrapper.put(`${baseUrl}/${id}`, params);
}

async function _delete(id) {
  await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}
