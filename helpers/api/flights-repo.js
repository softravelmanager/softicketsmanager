import { db } from "helpers/api";

const airlines = db.Airlines;

export const flightsRepo = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll() {
  return await airlines.find();
}

async function getById(id) {
  return await airlines.findById(id);
}

async function create(params) {
  const flight = new airlines(params);
  await flight.save();
}

async function update(id, params) {
  await airlines.findByIdAndUpdate(id, params);
}

async function _delete(id) {
  await airlines.findByIdAndRemove(id);
}
