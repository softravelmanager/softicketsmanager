export * from "./api-handler";
export * from "./db";
export * from "./error-handler";
export * from "./jwt-middleware";
export * from "./users-repo";
export * from "./tickets-repo";
export * from "./operations-repo";
export * from "./agentsoperations-repo";
export * from "./expenses-repo";
export * from "./flights-repo";

export function formatDate(date, format = "DB") {
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return format === "DB"
    ? [year, month, day].join("-")
    : [day, month, year].join("/");
}
