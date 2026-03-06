import { db, formatDate } from "helpers/api";

const AgentsOperations = db.AgentsOperations;

export const agentsOperationsRepo = {
  getAll,
  create,
  delete: _delete,
};

async function getAll(filters) {
  let query = [
    {
      $match: {
        $and: [
          {
            [filters.type]: {
              $gte: filters.start,
              $lte: filters.end,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "tickets",
        localField: "ticketId",
        foreignField: "_id",
        as: "ticket",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "agentId",
        foreignField: "_id",
        as: "agent",
        pipeline: [{ $project: { firstName: 1, lastName: 1, id: 1, _id: 1 } }],
      },
    },
  ];

  return await AgentsOperations.aggregate(query).sort({
    operation: 1,
  });
}

async function create(params) {
  const operation = new AgentsOperations(params);
  await operation.save();
}

async function _delete(id) {
  await AgentsOperations.findByIdAndRemove(id);
}
