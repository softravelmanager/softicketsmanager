export * from "./alert.service";
export * from "./user.service";
export * from "./tickets.service";
export * from "./operations.service";
export * from "./agentsoperations.service";
export * from "./expenses.service";
export * from "./flights.service";

export function cleanFlight(ticket) {
  let flight = (ticket?.flight || "")
    .trim()
    .replace("A-", "")
    .trim()
    .replace("-", "")
    .trim();
  let flight2 = flight.slice(0, 2);
  let flight3 = flight2 === "A " ? flight.slice(2).trim() : flight;
  return flight3;
}

export function formatDate(date, format = "DB") {
  let d;
  // If the date is already a Date object, use it directly.
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string' && date.includes('/')) {
    // Handle "DD/MM/YYYY" format
    const parts = date.split('/');
    if (parts.length === 3) {
      // new Date(year, monthIndex, day)
      d = new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  // Fallback for other string formats or if the above failed
  d = d && !isNaN(d) ? d : new Date(date);

  let
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return format === "DB"
    ? [year, month, day].join("-")
    : [day, month, year].join("/");
}
