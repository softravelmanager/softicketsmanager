import { fetchWrapper } from "helpers";
import { cleanFlight, formatDate } from "./index";

const baseUrl = `/api/tickets`;
const usersUrl = "/api/users";
const airlinesUrl = "/api/flights";
const backupUrl = "/api/backup";
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const ticketsService = {
  getAll,
  create,
  update,
  delete: _delete,
  upload,
  getById,
  getProfit,
  getRefundsForSupply,
  getTicketsForSupply,
  getTicketsByAgent,
  getFlights,
  getBookings,
  downloadBackup,
  uploadAirArabia,
  uploadWizzAir,
  uploadFlixbus,
  uploadTurkishAir,
  uploadEmirates,
  uploadTravelPort,
};

async function getTicketsForSupply(filters = {}) {
  const response = await fetchWrapper.post(baseUrl + "/supply", filters);
  return response;
}

async function getFlights() {
  const response = await fetchWrapper.post(baseUrl + "/flights", {});
  const airlinesI = await fetchWrapper.get(airlinesUrl);
  const airlinesN = airlinesI.map((a) => a.name);
  let flights = [];
  response.map((r) => {
    let url = "";
    let flight = cleanFlight(r);
    if (airlinesN.includes(flight)) {
      url = airlinesI.filter((a) => a.name === flight)[0].url;
    }
    let isFlight = !!url;
    flights.push({ ...r, url, isFlight });
  });
  let tickets = await getAll({}, flights);
  return tickets;
}

async function getTicketsByAgent(filters = {}) {
  const response = await fetchWrapper.post(baseUrl + "/agent", filters);
  let res = response.filter((t) => t.agentId === filters.agentId);
  return res;
}

async function getAll(filters, flights = []) {
  const response = flights.length
    ? flights
    : await fetchWrapper.post(baseUrl, filters);
  const users = await fetchWrapper.get(usersUrl);
  const tickets = response.map((t, i) => {
    let bkd = formatDate(t.bookedOn, "IT");
    let ra1d = t.receivingAmount1Date
      ? formatDate(t.receivingAmount1Date, "IT")
      : "";
    let ra2d = t.receivingAmount2Date
      ? formatDate(t.receivingAmount2Date, "IT")
      : "";
    let ra3d = t.receivingAmount3Date
      ? formatDate(t.receivingAmount3Date, "IT")
      : "";
    let tk2 = t.paidAmount.trim() ? parseFloat(t.paidAmount) : 0;
    let tra = t.receivingAmount1.trim()
      ? (parseFloat(t.receivingAmount1) || 0) +
        (parseFloat(t.receivingAmount2) || 0) +
        (parseFloat(t.receivingAmount3) || 0)
      : 0;
    let profit = parseFloat((tra - tk2).toFixed(2));
    let daSaldare = parseFloat((tk2 - tra).toFixed(2));
    let methods =
      t.paymentMethod +
      (t.receivingAmount2Method ? " - " + t.receivingAmount2Method : "") +
      (t.receivingAmount3Method ? " - " + t.receivingAmount3Method : "");
    let penality = t.refund
      ? parseFloat(t.paidAmount) - parseFloat(t.refund)
      : "";
    let amountsCompleted = profit >= 0;
    let agent = users.filter((u) => u.id === t.agentId);
    if (agent) {
      agent = agent.hasOwnProperty(0)
        ? agent[0].firstName + " " + agent[0].lastName
        : "Not Found";
      agent = agent.toLowerCase().includes("agency") ? "" : agent;
    }
    return {
      ...t,
      profit: "€ " + profit,
      bookedOn: bkd,
      receivingAmount1Date: ra1d,
      receivingAmount2Date: ra2d,
      receivingAmount3Date: ra3d,
      idP: i + 1,
      receivingAmountT: "€ " + tra.toFixed(2),
      paidAmount: "€ " + t.paidAmount,
      customerCost: t.customerCost !== undefined ? "€ " + parseFloat(t.customerCost || 0).toFixed(2) : "",
      agent,
      agentCost: t.agentCost && agent ? "€ " + t.agentCost : "",
      methods: methods,
      refund: t.refund ? "€ " + t.refund : t.refund,
      refundUsed: t.refundUsed ? "€ " + t.refundUsed : t.refundUsed,
      refundDate: t.refundDate ? formatDate(t.refundDate, "IT") : t.refundDate,
      returned: t.returned ? "€ " + t.returned : t.returned,
      returnedDate: t.returnedDate
        ? formatDate(t.returnedDate, "IT")
        : t.returnedDate,
      supplied: t.supplied ? "€ " + t.supplied : t.supplied,
      paidByAgent: t.paidByAgent ? "€ " + t.paidByAgent : t.paidByAgent,
      penality: penality !== "" ? "€ " + parseFloat(penality).toFixed(2) : "",
      amountsCompleted: amountsCompleted,
      daSaldare: "€ " + daSaldare.toFixed(2), // Format daSaldare here
    };
  });
  return tickets;
}

async function create(ticket) {
  return await fetchWrapper.post(`${baseUrl}/create`, ticket);
}

async function update(id, params) {
  await fetchWrapper.put(`${baseUrl}/${id}`, params);
}

async function findAndUpdate(ticket) {
  await fetchWrapper.put(baseUrl, ticket);
}

async function _delete(id) {
  await fetchWrapper.delete(`${baseUrl}/${id}`);
}

async function getById(id) {
  return await fetchWrapper.get(`${baseUrl}/${id}`);
}

async function getRefundsForSupply(filters = {}) {
  const result = await fetchWrapper.post(baseUrl + "/refund", filters);
  return result;
}

async function getBookings() {
  const tickets = await fetchWrapper.get(baseUrl + '/profit');
  return tickets;
}

async function downloadBackup() {
  return await fetchWrapper.getBinary(backupUrl);
}

async function getProfit(filters) {
  const users = await fetchWrapper.get(usersUrl);
  const result = await fetchWrapper.post(baseUrl + "/profit", filters);
  let ticketsP = {};
  let methods = {};
  let agents = {};
  let agentsP = {};
  let methodsP = {};
  let agentsA = {};
  let methodsA = {};
  let airlines = {};
  let airlinesC = {};
  let total = 0;
  let totalC = 0;
  result.map((ticket) => {
    let date = new Date(ticket.bookedOn);
    let key = months[date.getMonth()] + " " + date.getFullYear();
    let method1 =
      (ticket.paymentMethod && ticket.paymentMethod.trim().toUpperCase()) ||
      "None";
    let method2 =
      (ticket.receivingAmount2Method &&
        ticket.receivingAmount2Method.trim().toUpperCase()) ||
      "None";
    let method3 =
      (ticket.receivingAmount3Method &&
        ticket.receivingAmount3Method.trim().toUpperCase()) ||
      "None";
    let agent = users.filter((u) => ticket.agentId === u.id);
    if (agent) {
      agent = agent.hasOwnProperty(0)
        ? agent[0].firstName + " " + agent[0].lastName
        : "Not Found";
    }
    if (methods[method1] !== undefined) {
      methods[method1] += 1;
    } else {
      methods[method1] = 1;
    }
    if (agents[agent] !== undefined) {
      agents[agent] += 1;
    } else {
      agents[agent] = 1;
    }

    let totalReceivingAmount1 = parseFloat(ticket.receivingAmount1) || 0;
    let totalReceivingAmount2 = parseFloat(ticket.receivingAmount2) || 0;
    let totalReceivingAmount3 = parseFloat(ticket.receivingAmount3) || 0;
    let totalReceivingAmount =
      totalReceivingAmount1 + totalReceivingAmount2 + totalReceivingAmount3;

    let paidAmount = parseFloat(ticket.paidAmount);
    let customerCost = parseFloat(ticket.customerCost) || 0;
    let profit = totalReceivingAmount - paidAmount;
    let bookings = 1;

    if (ticketsP[key] !== undefined) {
      ticketsP[key].totalReceivingAmount += totalReceivingAmount;
      ticketsP[key].paidAmount += paidAmount;
      ticketsP[key].customerCost += customerCost;
      ticketsP[key].profit += profit;
      ticketsP[key].bookings += 1;
    } else {
      ticketsP[key] = { totalReceivingAmount, paidAmount, customerCost, profit, bookings };
    }

    if (
      [
        "receivingAmount1Date",
        "receivingAmount2Date",
        "receivingAmount3Date",
      ].includes(filters.type)
    ) {
      if (filters.type === "receivingAmount1Date") {
        if (methodsA[method1] !== undefined) {
          methodsA[method1] += totalReceivingAmount1;
        } else {
          methodsA[method1] = totalReceivingAmount1;
        }
      }
      if (filters.type === "receivingAmount2Date") {
        if (methodsA[method2] !== undefined) {
          methodsA[method2] += totalReceivingAmount2;
        } else {
          methodsA[method2] = totalReceivingAmount2;
        }
      }
      if (filters.type === "receivingAmount3Date") {
        if (methodsA[method3] !== undefined) {
          methodsA[method3] += totalReceivingAmount3;
        } else {
          methodsA[method3] = totalReceivingAmount3;
        }
      }
    } else {
      if (methodsP[method1] !== undefined) {
        methodsP[method1] += profit;
      } else {
        methodsP[method1] = profit;
      }

      if (agentsP[agent] !== undefined) {
        agentsP[agent] += profit;
      } else {
        agentsP[agent] = profit;
      }

      if (agentsA[agent] !== undefined) {
        agentsA[agent] += totalReceivingAmount;
      } else {
        agentsA[agent] = totalReceivingAmount;
      }

      if (methodsA[method1] !== undefined) {
        methodsA[method1] += totalReceivingAmount1;
      } else {
        methodsA[method1] = totalReceivingAmount1;
      }
      if (methodsA[method2] !== undefined) {
        methodsA[method2] += totalReceivingAmount2;
      } else {
        methodsA[method2] = totalReceivingAmount2;
      }
      if (methodsA[method3] !== undefined) {
        methodsA[method3] += totalReceivingAmount3;
      } else {
        methodsA[method3] = totalReceivingAmount3;
      }
    }

    let flight = cleanFlight(ticket);
    if (!Object.keys(airlines).includes(flight)) {
      airlines[flight] = 1;
    } else {
      airlines[flight] += 1;
    }
    total += 1;

    if (!Object.keys(airlinesC).includes(flight)) {
      airlinesC[flight] = paidAmount;
    } else {
      airlinesC[flight] += paidAmount;
    }
    totalC += paidAmount;
  });

  const airlines1 = Object.entries(airlines);
  function compareValues(a, b) {
    return b[1] - a[1];
  }
  const sortedAirlines1 = airlines1.sort(compareValues);
  const sortedAirlines2 = Object.fromEntries(sortedAirlines1);

  return {
    ticketsP,
    methods,
    methodsP,
    agents,
    agentsP,
    agentsA,
    methodsA,
    airlines,
    airlinesList: sortedAirlines2,
    total,
    airlinesC,
    totalC,
  };
}

function isNumeric(str) {
  const numericRegex = /^\d+$/;
  return numericRegex.test(str);
}

async function upload(files) {
  const users = await fetchWrapper.get(usersUrl);
  let fc = [];
  files.map((ct) => {
    let final = [];
    const dr = ct.split("\n").map(function (ln) {
      return ln.split(";");
    });

    dr.map((dC) => {
      let manipulated = [];
      dC.map((cl) => {
        cl = cl.trim();
        if (cl) {
          manipulated.push(cl);
        }
      });
      final.push(manipulated);
    });

    // console.log(final, final.length);
    let iac = { 38200562: "B2B", 38287561: "SOF" };
    let agl = {};
    let admin = "";
    let agency = "";
    users.map((userT) => {
      let nameT = userT.firstName + " " + userT.lastName;
      if (userT.level === "admin") {
        admin = userT.id;
      }
      if (nameT.toLowerCase().includes("agency")) {
        agency = userT.id;
      }
      agl[userT.code] = userT.id;
    });
    let ard = [];
    let t = [];
    let n = [];
    let ia = "";
    let ofi = "";
    if (
      final.hasOwnProperty(3) &&
      final[3].hasOwnProperty(3) &&
      isNumeric(final[3][3])
    ) {
      ofi = final[3][3];
    } else {
      ofi = "-";
    }
    if (
      final.hasOwnProperty(3) &&
      final[3].hasOwnProperty(6) &&
      isNumeric(final[3][6])
    ) {
      ia = final[3][6];
    } else if (
      final.hasOwnProperty(3) &&
      final[3].hasOwnProperty(9) &&
      isNumeric(final[3][9])
    ) {
      ia = final[3][9];
    } else {
      ia = "-";
    }
    let c2 = "-";
    let ag = "";
    let ac = "";
    let mt = "";
    let d = "-";
    let dor = "-";
    let tk = "";
    let tk2 = "";
    let tra = "";
    let tra1D = "";
    let tra2D = "";
    let tra3D = "";
    let pr = 0;
    let tn = "";
    let tc = "-";
    let cn = "-";
    let cni = "-";
    let p = "-";
    let vd = false;
    let f =
      final.hasOwnProperty(4) && final[4].hasOwnProperty(0) ? final[4][0] : "-";

    for (let r = 0; r < final.length; r++) {
      for (let c = 0; c < final[r].length; c++) {
        if (r === 1 && final[r].join("").includes("VOID")) {
          vd = true;
        }
        if (final[r][c].includes("I-00")) {
          n.push(final[r][c + 1].replace(/[^a-zA-Z/ ]/g, " ").trim());
        }
        if (final[r][c].includes("T-K")) {
          t.push(final[r][c].replace("T-K", "").trim());
        }
        if (final[r][c].includes("MUC1A")) {
          c2 = final[r][c].replace("MUC1A ", "").trim();
          c2 = c2.slice(0, -3);
        }
        if (final[r][c].includes("RM*A*")) {
          ag = final[r][c].replace("RM*A*", "");
        }
        if (final[r][c].includes("RM*AC*")) {
          ac = final[r][c].replace("RM*AC*", "");
          ac = ac.trim() ? parseFloat(ac) : 0;
        }
        if (final[r][c].includes("RM*P*")) {
          mt = final[r][c].replace("RM*P*", "");
        }
        if (final[r][c].includes("D-")) {
          let dates = final[r];
          let datesC = dates.length;
          d = dates[datesC - 1].replace("D-", "").trim();
          dor = d;
          if (d.length === 6) {
            let y = "20" + d[0] + d[1];
            let m = d[2] + d[3];
            let g = d[4] + d[5];
            d = `${y}-${m}-${g}`;
          } else {
            d = formatDate(new Date());
          }
        }
        if (final[r][c].includes("K-F")) {
          if (final[r][c].includes("K-FEUR")) {
            tk = final[r][c].replace("K-FEUR", "").trim();
            tk2 = final[r][c + 1].replace("EUR", "").trim();
          } else {
            tk = final[r][c + 1].replace("K-FEUR", "").trim();
            tk2 = final[r][c + 2].replace("EUR", "").trim();
          }
        }
        if (final[r][c].includes("RM*R*")) {
          tra = final[r][c].replace("RM*R*", "");
          tra1D = d;
        }
        if (final[r][c].includes("KN-I")) {
          tk = final[r][c].replace("KN-IEUR", "").trim();
          tk2 = final[r][c + 1].replace("EUR", "").trim();
        }
        if (final[r][c].includes("N-")) {
          if (final[r][c].includes("EUR")) {
            tn = final[r][c].replace("N-EUR", "").trim();
          }
          if (final[r][c].includes("NUC")) {
            tn = final[r][c].replace("N-NUC", "").trim();
          }
        }
        if (final[r][c].includes("T-L")) {
          tc = final[r][c].replace("T-L", "").trim();
        }
        if (final[r][c].includes("FPD")) {
          cn = final[r][c].replace("MFPDCCA", "").trim();
          cn = cn.split("/")[0];
        }
        //console.log(ia, final[r][c].includes("FPCC"));
        if (final[r][c].includes("FPCC") && ia === "38288331") {
          //cni = final[r][c].replace("FPCC", "").trim();
          let cniT = final[r][c].split("/")[0];
          //console.log(cniT);
          cni = cniT[4] + cniT[5] + cniT.slice(-4);
          //console.log(cniT);
        }
        if (final[r][c].includes("CTCM")) {
          let tph = final[r][c].split("/");
          p = tph.hasOwnProperty(1) && tph[1];
        }
        if (final[r][c].includes("H-")) {
          ard.push(final[r]);
        }
      }
    }

    let dstr = "";
    let t1s = "";
    let t2s = "";
    let mnts = months.map((m) => m.toLowerCase());
    let cm = new Date().getMonth() + 1;
    let cd = new Date().getDate();
    for (let i = 0; i < ard.length; i++) {
      let dd = ard[i][5];
      let dd2 = dd.split(" ");
      let d2l = dd2.length;
      let dfm = dd2[d2l - 1].slice(-3);
      if (mnts.includes(dfm.toLowerCase())) {
        let dfd = dd2[d2l - 1].slice(0, 2);
        dfm = mnts.indexOf(dfm.toLowerCase()) + 1;
        dfm = dfm < 10 ? "0" + dfm : dfm;
        let dfy = d.slice(0, 4);
        if (
          parseInt(dfm) < cm ||
          (parseInt(dfm) === cm && parseInt(dfd) < cd)
        ) {
          dfy = parseInt(dfy) + 1;
        }
        dstr += dfd + "/" + dfm + "/" + dfy + " - ";
      } else {
        dstr += dd2[d2l - 1] + " - ";
      }
      t1s += ard[i][2] + " - ";
      t2s += ard[i][4] + " - ";
    }

    dstr = dstr.replace(/-\s*$/, "").trim();
    t1s = t1s.replace(/-\s*$/, "").trim();
    t2s = t2s.replace(/-\s*$/, "").trim();
    tk = tk.trim() ? parseFloat(tk) : 0;
    tk2 = tk2.trim() ? parseFloat(tk2) : 0;
    tra = tra.trim() ? parseFloat(tra) : 0;
    tn = tn.trim() ? parseFloat(tn) : 0;
    pr = parseFloat((tra - tk2).toFixed(2));
    let ntl = n.length;
    n.map((ntp, i) => {
      let tkt = {
        name: ntp,
        payer: "",
        bookingCode: c2,
        agent: agl.hasOwnProperty(ag) ? agl[ag] : ag,
        agentId: agl.hasOwnProperty(ag)
          ? agl[ag]
          : agency || admin || "123456789012345678901234",
        iata: iac.hasOwnProperty(ia) ? iac[ia] : ia,
        office: iac.hasOwnProperty(ofi) ? iac[ofi] : ofi,
        agentCost: ac !== "" ? ac : 0,
        customerCost: 0,
        ticketNumber: t.length ? t[i] : tc,
        paymentMethod: mt,
        paidAmount: tk2,
        receivingAmount1: tra,
        receivingAmount1Date: tra1D,
        receivingAmount2Date: tra2D,
        receivingAmount2Method: "",
        receivingAmount3Date: tra3D,
        receivingAmount3Method: "",
        receivingAmount2: 0,
        receivingAmount3: 0,
        cardNumber: cni,
        isVoid: vd,
        bookedOn: d,
        travel1: t1s,
        travel2: t2s,
        dates: dstr,
        phone: p,
        flight: f,
        refund: "",
        refundDate: "",
        desc: "",
        supplied: 0,
        returned: 0,
        returnedDate: "",
        paidByAgent: 0,
      };
      fc.push(tkt);
    });
  });
  return fc;
}

async function uploadTravelPort(files) {
  const users = await fetchWrapper.get(usersUrl);
  let fc = [];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  let agl = {};
  let admin = "";
  let agency = "";

  users.forEach((userT) => {
    let nameT = userT.firstName + " " + userT.lastName;
    if (userT.level === "admin") admin = userT.id;
    if (nameT.toLowerCase().includes("agency")) agency = userT.id;
    agl[userT.code] = userT.id;
  });

  let iac = { 38200562: "B2B", 38287561: "SOF" };

  files.forEach((content) => {
    // 1. OFFICE ID & AGENCY CODE
    const officeMatch = content.match(/382\d{5}/);
    const rawOffice = officeMatch ? officeMatch[0] : "";
    const agencyCode = iac[rawOffice] || rawOffice;

    // 2. BOOKING CODE (PNR) - Ricerca dopo il codice ufficio
    let bookingCode = "";
    if (rawOffice) {
      // Cerchiamo la posizione del codice ufficio nel testo
      const officeIdx = content.indexOf(rawOffice);
      // Estraiamo i 50 caratteri successivi per trovare il PNR
      const searchArea = content.substring(officeIdx + rawOffice.length, officeIdx + rawOffice.length + 50);
      // Il PNR è la prima stringa alfanumerica di 6 caratteri dopo uno spazio o numeri di sequenza
      const pnrMatch = searchArea.match(/([A-Z0-9]{6})(?:\s|$)/);
      bookingCode = pnrMatch ? pnrMatch[1] : "";
    }

    // 3. BOOKED ON & AGENT ID (Dalla testata del file)
    const headerSnippet = content.substring(0, 200);
    
    // Booked On: prendiamo la data di emissione (es. 27FEB26)
    const bMatch = headerSnippet.match(/(\d{2})([A-Z]{3})(\d{2})/);
    let bookedOn = "";
    if (bMatch) {
      const mm = (months.indexOf(bMatch[2].toUpperCase()) + 1).toString().padStart(2, '0');
      bookedOn = `20${bMatch[3]}-${mm}-${bMatch[1]}`;
    }

    // Agent ID (es. AC02602 alla fine della testata)
    const agentIdMatch = headerSnippet.match(/([A-Z]{2}\d{5})(?:\s|A01|A02|$)/);
    const agentId = agentIdMatch ? agentIdMatch[1] : "";

    // 4. ANALISI PERCORSI (Città e Travel 1/2)
    const a04Lines = content.match(/A04\d{2}.*?(?=A\d{2}|\r|\n|$)/g) || [];
    a04Lines.sort();
    let segments = [];
    a04Lines.forEach((line) => {
      const match = line.match(/(\d{4})\s+(\d{4})\s+\w([A-Z0-9]{3})(.{13})([A-Z0-9]{3})(.{13})/);
      if (match) {
        const origin = match[4].trim().split('/')[0].trim();
        const dest = match[6].trim().split('/')[0].trim();
        segments.push({ from: origin, to: dest });
      }
    });

    let travel1 = "", travel2 = "";
    const buildPath = (segs) => {
      if (!segs.length) return "";
      let path = [segs[0].from];
      segs.forEach(s => {
        if (s.from !== path[path.length - 1]) path.push(s.from);
        path.push(s.to);
      });
      return path.join(" - ");
    };

    if (segments.length > 0) {
      const first = segments[0].from;
      const last = segments[segments.length - 1].to;
      
      if (first === last && segments.length > 1) {
        const mid = Math.ceil(segments.length / 2);
        travel1 = buildPath(segments.slice(0, mid));
        travel2 = buildPath(segments.slice(mid));
      } else {
        travel1 = buildPath(segments);
      }
    }

    // 5. FLIGHT NAME
    let flightName = "";
    const airlineMatch = headerSnippet.match(/[A-Z]{2}\d{3}([A-Z\s\-]+?)\d{2}[A-Z]{3}\d{2}/);
    if (airlineMatch) flightName = airlineMatch[1].trim();

    // 6. PASSENGERS & TICKET DATA
    const dateMatches = [...content.matchAll(/DDL:(\d{2}[A-Z]{3}\d{2})/g)];
    const uniqueDates = [...new Set(dateMatches.map(m => {
      const d = m[1];
      return `${d.slice(0, 2)}/${(months.indexOf(d.slice(2, 5).toUpperCase()) + 1).toString().padStart(2, '0')}/20${d.slice(5, 7)}`;
    }))];

    const passengerMatches = [...content.matchAll(/A02([A-Z/\s]+?)\s{2,}.*?(\d{13})/g)];
    passengerMatches.forEach((p) => {
      fc.push({
        name: p[1].trim(),
        bookingCode: bookingCode,
        agent: agl[agentId] || agentId,
        agentId: agl[agentId] || agency || admin || "123456789012345678901234",
        iata: agencyCode,
        office: agencyCode,
        agentCost: 0,
        ticketNumber: p[2],
        paymentMethod: "",//content.match(/A11([A-Z]{1,2})/)?.[1] || "",
        paidAmount: parseFloat(content.match(/A11[A-Z\s]+([\d.]+)/)?.[1] || content.match(/A0701[A-Z]{3}\s+[\d.]+[A-Z]{3}\s+([\d.]+)/)?.[1] || 0),
        receivingAmount1: 0,
        receivingAmount1Date: "", 
        receivingAmount2Date: "",
        receivingAmount2Method: "",
        receivingAmount3Date: "",
        receivingAmount3Method: "",
        receivingAmount2: 0,
        receivingAmount3: 0,
        cardNumber: content.match(/NVI(\d[\d\*]+)/)?.[1] || "",
        isVoid: content.includes("VOID"),
        bookedOn: bookedOn,
        travel1: travel1,
        travel2: travel2,
        dates: uniqueDates.join(" - "),
        phone: content.match(/A12ROMM\s*\*([\d\s]+)/)?.[1]?.trim() || "",
        flight: flightName,
        refund: "",
        refundDate: "",
        desc: "",
        supplied: 0,
        returned: 0,
        returnedDate: "",
        paidByAgent: 0,
      });
    });
  });

  return fc;
}

async function uploadAirArabia(files) {
  const users = await fetchWrapper.get(usersUrl);
  let agl = {};
  let admin = "";
  let agency = "";
  users.forEach((userT) => {
    let nameT = `${userT.firstName} ${userT.lastName}`;
    if (userT.level === "admin") admin = userT.id;
    if (nameT.toLowerCase().includes("agency")) agency = userT.id;
    agl[userT.code] = userT.id;
  });

  const allTickets = [];

  for (const fileContent of files) {
    // --- Extract Common Information ---
    
    // Extract booking date (e.g., "11 Jul 2026")
    const bookingDateMatch = fileContent.match(/Booking Date\s+(\d{1,2}\s+\w{3}\s+\d{4})/);
    const bookedOn = bookingDateMatch ? formatDate(new Date(bookingDateMatch[1])) : formatDate(new Date());

    // Extract passenger name from greeting (e.g., "Hello Bahya El Sayed Ahmed,")
    const passengerNameMatch = fileContent.match(/Hello\s+([\w\s]+?),/);
    let passengerFullName = passengerNameMatch ? passengerNameMatch[1].trim() : '';
    // Format as "LastName/FirstName"
    let passengerName = '';
    if (passengerFullName) {
      const nameParts = passengerFullName.split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.slice(0, -1).join(' ');
      passengerName = `${lastName}/${firstName}`;
    }

    // Extract Reservation Number (e.g., "7R90HJ")
    const reservationMatch = fileContent.match(/Reservation Number\s+([\w]+)/);
    const bookingCode = reservationMatch ? reservationMatch[1] : '';

    // Extract PIN
    const pinMatch = fileContent.match(/PIN\s+(\d+)/);
    const pin = pinMatch ? pinMatch[1] : '';

    // Extract Travel Route (e.g., "Milan - Bergamo  to  Alexandria")
    const routeMatch = fileContent.match(/Travel Itinerary\s+([\w\s-]+?)\s+to\s+([\w\s-]+?)\s+(?:Value|Ultimate)\s+Fare/);
    let travel1 = '', travel2 = '';
    if (routeMatch) {
      const fromRoute = routeMatch[1].trim();
      const toRoute = routeMatch[2].trim();
      // Extract just the last city from the "from" route (e.g., "Milan - Bergamo" -> "Bergamo")
      const fromCities = fromRoute.split('-').map(c => c.trim());
      const fromCity = fromCities[fromCities.length - 1];
      travel1 = `${fromCity} - ${toRoute}`;
    }

    // Extract flight dates and convert to DD/MM/YYYY format
    // Pattern: "BGY ... HBE Milan - Bergamo 19 Jul 2026   19:50"
    const flightMatch = fileContent.match(/(\w{3})\s+.*?(\w{3})\s+[\w\s-]+\s+(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{1,2}:\d{2})/);
    let dates = '';
    if (flightMatch) {
      const day = flightMatch[3].padStart(2, '0');
      const monthStr = flightMatch[4].toLowerCase();
      const monthMap = { 'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12' };
      const month = monthMap[monthStr] || '01';
      const year = flightMatch[5];
      dates = `${day}/${month}/${year}`;
    }

    // Extract phone number
    let phone = '';
    const phoneMatch = fileContent.match(/Contact Mobile\s+(\d+-\d+-\d+)/);
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/-/g, '');
    }

    // Extract agent code from "Agent Name" line (e.g., "MAC22 (MAC)")
    const agentDetailsMatch = fileContent.match(/Agent Name\s+([\w\s]+?)\s+(\w+)\s+\((\w+)\)/);
    let agentCode = '';
    if (agentDetailsMatch) {
      agentCode = agentDetailsMatch[3]; // Extract the code from parentheses like (MAC)
    }

    // Extract payment details from "Summary of Charges" section
    // Fare amount (e.g., "Fare MAD 2145.64")
    const fareMatch = fileContent.match(/Fare\s+MAD\s+([\d.]+)/);
    const fareAmount = fareMatch ? parseFloat(fareMatch[1]) : 0;

    // Total Payment amount (e.g., "Total Payment MAD 3530.48")
    const totalPaymentMatch = fileContent.match(/Total Payment\s+MAD\s+([\d.]+)/);
    const paidAmount = totalPaymentMatch ? parseFloat(totalPaymentMatch[1]) : fareAmount;

    // Extract payment method (e.g., "Credit Card- master" or "Credit Card- mastercard")
    const paymentMethodMatch = fileContent.match(/Payment Method\s+([\w\s-]+)/);
    let paymentMethod = '';
    if (paymentMethodMatch) {
      const methodStr = paymentMethodMatch[1].toLowerCase();
      if (methodStr.includes('master')) {
        paymentMethod = 'MASTER';
      } else if (methodStr.includes('visa')) {
        paymentMethod = 'VISA';
      } else {
        paymentMethod = paymentMethodMatch[1].trim();
      }
    }

    if (passengerName && bookingCode) {
      const tkt = {
        name: passengerName,
        payer: "",
        bookingCode: bookingCode,
        agent: agl.hasOwnProperty(agentCode) ? agl[agentCode] : '',
        agentId: agl.hasOwnProperty(agentCode)
          ? agl[agentCode]
          : agency || admin || "123456789012345678901234",
        iata: 'AIR ARABIA MAROC',
        office: '',
        agentCost: 0,
        customerCost: 0,
        ticketNumber: `${bookingCode}-${pin}`,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        receivingAmount1: 0,
        receivingAmount1Date: '',
        receivingAmount2Date: '',
        receivingAmount2Method: "",
        receivingAmount3Date: '',
        receivingAmount3Method: "",
        receivingAmount2: 0,
        receivingAmount3: 0,
        cardNumber: '',
        isVoid: false,
        bookedOn: bookedOn,
        travel1: travel1,
        travel2: travel2,
        dates: dates,
        phone: phone,
        flight: 'AIR ARABIA MAROC',
        refund: "",
        refundDate: "",
        desc: "",
        supplied: 0,
        returned: 0,
        returnedDate: "",
        paidByAgent: 0,
      };
      allTickets.push(tkt);
    }
  }

  return allTickets;
}

async function uploadWizzAir(files) {
  const users = await fetchWrapper.get(usersUrl);
  let agl = {};
  let admin = "";
  let agency = "";
  users.forEach((userT) => {
    let nameT = `${userT.firstName} ${userT.lastName}`;
    if (userT.level === "admin") admin = userT.id;
    if (nameT.toLowerCase().includes("agency")) agency = userT.id;
    agl[userT.code] = userT.id;
  });

  const allTickets = [];

  for (const fileContent of files) {
    // --- Extract Common Information ---
    const bookingCodeMatch = fileContent.match(/(?:Codice di conferma volo|Flight confirmation code|Confirmation code):\s*(\w+)/);
    const bookingCode = bookingCodeMatch ? bookingCodeMatch[1] : '';

    const bookingDateMatch = fileContent.match(/(?:Data di prenotazione|Booking date):\s*(\d{2}\/\d{2}\/\d{4})/);
    const bookedOn = bookingDateMatch ? formatDate(bookingDateMatch[1]) : formatDate(new Date());

    const travelMatch = fileContent.match(/(?:Partenza da|Departs from):\s*(?:Arrivo a|Arrives to):\s*\r?\n\s*([\w\s()-]+?)\s+([\w\s()-]+)/);
    const travel1 = travelMatch ? travelMatch[1].trim() : '';
    const travel2 = travelMatch ? travelMatch[2].trim() : '';

    const dateMatch = fileContent.match(/(\d{2}\/\d{2}\/\d{2,4})\s+\d{2}:\d{2}\s+(\d{2}\/\d{2}\/\d{2,4})\s+\d{2}:\d{2}/);
    const dates = dateMatch ? `${dateMatch[1]} - ${dateMatch[2]}` : '';

    const agentNameMatch = fileContent.match(/(?:Nome di contatto del cliente|Customer contact name):\s*([\s\S]*?)(?:Società del cliente|Customer company):/);
    const agentName = agentNameMatch ? agentNameMatch[1].replace(/MR|MRS|MS/g, '').trim() : '';
    const agent = Object.keys(agl).find(key => agl[key] === agentName) || agentName;

    // --- Extract Passenger and Payment Details ---
    const passengerSectionMatch = fileContent.match(/(?:Dati del passeggero|Passenger info)([\s\S]*?)(?:Dettagli volo|Flight details)/);
    const paymentSectionMatch = fileContent.match(/(?:Riepilogo del pagamento|Payment summary)([\s\S]*?)(?:Informazioni sulla prenotazione|Reservation information)/);

    if (passengerSectionMatch) {
      // Extract all individual fare prices
      const grandTotalMatch = paymentSectionMatch ? paymentSectionMatch[1].match(/(?:Totale complessivo|Grand total)[\s\S]*?([\d.]+)\s+EUR/) : null;
      const paidAmount = grandTotalMatch ? parseFloat(grandTotalMatch[1]) : 0;

      const passengerRows = passengerSectionMatch[1].matchAll(/^(?:(MS|MR|MRS|CHD)\s+)?([A-Z\s]+)\t([A-Z\s]+?)\s+[A-Z]{3}-[A-Z]{3}/gm);

      let passengerIndex = 0;
      for (const passengerMatch of passengerRows) {
        const firstName = passengerMatch[2].trim();
        const lastName = passengerMatch[3].trim();
        // Format as "surname/name"
        const passengerName = `${lastName}/${firstName}`;

        const tkt = {
          name: passengerName,
          payer: "",
          bookingCode: bookingCode,
          agent: '',
          agentId: agl.hasOwnProperty(agent) ? agl[agent] : agency || admin || "123456789012345678901234",
          iata: 'WIZZAIR',
          office: '',
          agentCost: 0,
          customerCost: 0,
          ticketNumber: `${bookingCode}-${passengerIndex + 1}`, // Make ticket number unique per passenger
          paymentMethod: '',
          paidAmount: paidAmount,
          receivingAmount1: 0,
          receivingAmount1Date: '',
          receivingAmount2Date: '',
          receivingAmount2Method: "",
          receivingAmount3Date: '',
          receivingAmount3Method: "",
          receivingAmount2: 0,
          receivingAmount3: 0,
          cardNumber: '',
          isVoid: false,
          bookedOn: bookedOn,
          travel1: travel1,
          travel2: travel2,
          dates: dates,
          phone: '',
          flight: 'WIZZAIR',
          refund: "",
          refundDate: "",
          desc: "",
          supplied: 0,
          returned: 0,
          returnedDate: "",
          paidByAgent: 0,
        };
        allTickets.push(tkt);
        passengerIndex++;
      }
    }
  }
  return allTickets;
}

async function uploadFlixbus(files) {
    const users = await fetchWrapper.get(usersUrl);
    let agl = {};
    let admin = "";
    let agency = "";
    users.forEach((userT) => {
      let nameT = `${userT.firstName} ${userT.lastName}`;
      if (userT.level === "admin") admin = userT.id;
      if (nameT.toLowerCase().includes("agency")) agency = userT.id;
      agl[userT.code] = userT.id;
    });

    const allTickets = [];
    const monthMap = {
        'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'mag': '05', 'giu': '06',
        'lug': '07', 'ago': '08', 'set': '09', 'ott': '10', 'nov': '11', 'dic': '12'
    };

    for (const fileContent of files) {
        const bookingCodeMatch = fileContent.match(/Prenotazione n\.\s*([\d\s]+)/);
        const bookingCode = bookingCodeMatch ? bookingCodeMatch[1].replace(/\s/g, '') : '';

        const departureMatch = fileContent.match(/Partenza\s+Stazione\s+([\w\s()-]+)\s+Orario/);
        const travel1 = departureMatch ? departureMatch[1].trim() : '';

        const arrivalMatch = fileContent.match(/Arrivo\s+Stazione\s+([\w\s()-]+)\s+Orario/);
        const travel2 = arrivalMatch ? arrivalMatch[1].trim() : '';

        const bookedOn = formatDate(new Date());
        const dateMatch = fileContent.match(/\w{3}\s(\d{2})\s(\w{3})→/);
        let dates = '';
        if (dateMatch) {
            const day = dateMatch[1];
            const month = monthMap[dateMatch[2].toLowerCase()];
            const year = new Date().getFullYear();
            if (day && month && year) {
                dates = `${day}/${month}/${year}`;
            }
        }

        const passengerBlockMatch = fileContent.match(/Passeggeri\/e ed extra\s*Icon\s*Adulto\/a\s*([\s\S]*?)Icon/);
        if (!passengerBlockMatch) continue;

        const passengerNames = passengerBlockMatch[1]
            .trim()
            .split(/\r?\n/)
            .filter(name => name.trim() !== '')
            .map(name => name.trim());

        // In this format, the price is not available. Defaulting to 0.
        const paidAmount = 0;

        if (passengerNames.length > 0) {
            const firstPassengerName = passengerNames[0];
            const nameParts = firstPassengerName.trim().split(' ').filter(part => part);
            const surname = nameParts.pop() || ''; // Last element is the surname
            const firstName = nameParts.join(' '); // The rest is the first name
            const formattedName = `${surname}/${firstName}`;

            const tkt = {
                name: formattedName,
                payer: "",
                bookingCode: bookingCode,
                agent: '',
                agentId: agency || admin || "123456789012345678901234", // Default to agency or admin
                iata: 'FLIXBUS',
                office: '',
                agentCost: 0,
                customerCost: 0,
                ticketNumber: `${bookingCode}-${allTickets.length + 1}`, // Unique ticket number
                paymentMethod: '',
                paidAmount: paidAmount,
                receivingAmount1: 0,
                receivingAmount1Date: '',
                receivingAmount2Date: '',
                receivingAmount2Method: "",
                receivingAmount3Date: '',
                receivingAmount3Method: "",
                receivingAmount2: 0,
                receivingAmount3: 0,
                cardNumber: '',
                isVoid: false,
                bookedOn: bookedOn,
                travel1: travel1,
                travel2: travel2,
                dates: dates,
                phone: '',
                flight: 'FLIXBUS',
                refund: "",
                refundDate: "",
                desc: "",
                supplied: 0,
                returned: 0,
                returnedDate: "",
                paidByAgent: 0,
            };
            allTickets.push(tkt);
        } // End of check for passenger names
    }

    return allTickets;
}

function normalizeTurkishPassengerName(value) {
  if (!value) return "";

  const cleanedValue = value.replace(/\s+/g, " ").trim().toUpperCase();
  const titlePattern = /\b(MR|MRS|MS|MISS|CHD|CHILD)\b/i;
  const titleMatch = cleanedValue.match(titlePattern);

  if (titleMatch) {
    const parts = cleanedValue.split(titleMatch[0]);
    const firstName = parts[0].trim();
    const surname = parts[1] ? parts[1].trim() : "";
    if (firstName && surname) {
      return `${surname}/${firstName}`;
    }
  }

  const nameParts = cleanedValue.split(" ").filter(Boolean);
  if (nameParts.length > 1) {
    const surname = nameParts.pop();
    const firstName = nameParts.join(" ");
    return `${surname}/${firstName}`;
  }

  return cleanedValue;
}

function formatTurkishAirDate(value) {
  if (!value) return "";

  const trimmedValue = String(value).trim();
  if (/^\d{8}$/.test(trimmedValue)) {
    return `${trimmedValue.slice(6, 8)}/${trimmedValue.slice(4, 6)}/${trimmedValue.slice(0, 4)}`;
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmedValue)) {
    const [day, month, year] = trimmedValue.split('.');
    return `${day}/${month}/${year}`;
  }

  return trimmedValue;
}

async function uploadTurkishAir(files) {
  const users = await fetchWrapper.get(usersUrl);
  let agl = {};
  let admin = "";
  let agency = "";
  users.forEach((userT) => {
    let nameT = `${userT.firstName} ${userT.lastName}`;
    if (userT.level === "admin") admin = userT.id;
    if (nameT.toLowerCase().includes("agency")) agency = userT.id;
    agl[userT.code] = userT.id;
  });

  const allTickets = [];

  for (const fileContent of files) {
    const ticketBlocks = [];
    const ticketNumberMatches = [...fileContent.matchAll(/^TICKET NO\s+(\S+)/gm)];

    if (ticketNumberMatches.length > 0) {
      ticketNumberMatches.forEach((match, index) => {
        const start = match.index;
        const end = ticketNumberMatches[index + 1]?.index ?? fileContent.length;
        const block = fileContent.slice(start, end).trim();
        if (block) {
          ticketBlocks.push({ ticketNumber: match[1], content: block });
        }
      });
    } else {
      ticketBlocks.push({ ticketNumber: "", content: fileContent });
    }

    ticketBlocks.forEach((ticketBlock) => {
      const block = ticketBlock.content;
      const ticketNumber = ticketBlock.ticketNumber;
      const issueDateMatch = block.match(/ISSUE DATE\s+(\d{2}\.\d{2}\.\d{4})/i);
      const bookedOn = issueDateMatch
        ? formatDate(new Date(issueDateMatch[1].split('.').reverse().join('-')))
        : formatDate(new Date());

      const bookingCodeMatch = block.match(/PNR\s+([A-Z0-9]+)/i);
      const bookingCode = bookingCodeMatch ? bookingCodeMatch[1] : "";

      const endorsementMatch = block.match(/Endorsment\s+(.+)/i);
      const validatorCodeMatch = block.match(/VALIDATOR CODE\s+(\d+)/i);
      const tourCodeMatch = block.match(/TOUR CODE\s+([A-Z0-9]+)/i);
      const totalFareMatch = block.match(/TOTAL FARE\s+([\d.,]+)\s+EUR/i);
      const paymentTypeMatch = block.match(/PAYMENT TYPE\s+([A-Z]+)/i);
      const cardNumberMatch = block.match(/CARD NUMBER\s+([A-Z0-9]+)/i);
      const orderIdMatch = block.match(/ORDER ID\s+([A-Z0-9]+)/i);
      const passengerNameMatch = block.match(/PASSENGER NAME\s*\/\s*SURNAME\s+(.+)/i);
      const passengerName = normalizeTurkishPassengerName(passengerNameMatch ? passengerNameMatch[1] : "");

      const segmentMatches = [...block.matchAll(/^\s*(?:\d+)\s+([A-Z]{3})\s*\/\s*([A-Z]{3})\s+([A-Z]{2})\s+(\d{3,4})\s+([A-Z0-9])\s+(\d{8})\s+(\d{4})\s+([A-Z]{2})/gm)];
      const segments = segmentMatches.map((match) => ({
        origin: match[1],
        destination: match[2],
        carrier: match[3],
        flightNumber: match[4],
        travelClass: match[5],
        flightDate: match[6],
        flightTime: match[7],
        status: match[8],
      }));

      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const travel1 = firstSegment ? `${firstSegment.origin} - ${firstSegment.destination}` : "";
      const travel2 = lastSegment && segments.length > 1 ? `${lastSegment.origin} - ${lastSegment.destination}` : "";
      const dates = segments.length > 0
        ? `${formatTurkishAirDate(firstSegment.flightDate)}${segments.length > 1 ? ` - ${formatTurkishAirDate(lastSegment.flightDate)}` : ""}`
        : "";

      const descParts = [];
      if (endorsementMatch) descParts.push(`Endorsement: ${endorsementMatch[1].trim()}`);
      if (tourCodeMatch) descParts.push(`Tour Code: ${tourCodeMatch[1].trim()}`);
      if (validatorCodeMatch) descParts.push(`Validator: ${validatorCodeMatch[1].trim()}`);
      if (orderIdMatch) descParts.push(`Order ID: ${orderIdMatch[1].trim()}`);

      const tkt = {
        name: passengerName,
        payer: "",
        bookingCode: bookingCode,
        agent: "",
        agentId: agency || admin || "123456789012345678901234",
        iata: "TURKISH AIRLINES",
        office: validatorCodeMatch ? validatorCodeMatch[1] : "",
        agentCost: 0,
        customerCost: 0,
        ticketNumber: ticketNumber || ticketBlock.ticketNumber,
        paymentMethod: paymentTypeMatch ? paymentTypeMatch[1] : "",
        paidAmount: totalFareMatch ? parseFloat(totalFareMatch[1].replace(/,/g, ".")) : 0,
        receivingAmount1: 0,
        receivingAmount1Date: "",
        receivingAmount2Date: "",
        receivingAmount2Method: "",
        receivingAmount3Date: "",
        receivingAmount3Method: "",
        receivingAmount2: 0,
        receivingAmount3: 0,
        cardNumber: cardNumberMatch ? cardNumberMatch[1] : "",
        isVoid: false,
        bookedOn: bookedOn,
        travel1: travel1,
        travel2: travel2,
        dates: dates,
        phone: "",
        flight: firstSegment ? `${firstSegment.carrier} ${firstSegment.flightNumber}` : "TURKISH AIRLINES",
        refund: "",
        refundDate: "",
        desc: descParts.join(" | "),
        supplied: 0,
        returned: 0,
        returnedDate: "",
        paidByAgent: 0,
      };

      allTickets.push(tkt);
    });
  }

  return allTickets;
}

async function uploadEmirates(files) {
  const users = await fetchWrapper.get(usersUrl);
  let agl = {};
  let admin = "";
  let agency = "";
  users.forEach((userT) => {
    let nameT = `${userT.firstName} ${userT.lastName}`;
    if (userT.level === "admin") admin = userT.id;
    if (nameT.toLowerCase().includes("agency")) agency = userT.id;
    agl[userT.code] = userT.id;
  });

  const allTickets = [];

  for (const fileContent of files) {
    try {
      // Parse XML - Extract root attributes
      const recordLocatorMatch = fileContent.match(/RecordLocator="([^"]+)"/);
      const ticketNumberMatch = fileContent.match(/TicketNumber="([^"]+)"/);
      const bookingCode = recordLocatorMatch ? recordLocatorMatch[1] : '';
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[1] : '';

      // Extract creation date
      const creationDateMatch = fileContent.match(/<CreationDate[^>]*>(\d{4}-\d{2}-\d{2})<\/CreationDate>/);
      const bookedOn = creationDateMatch ? formatDate(new Date(creationDateMatch[1])) : formatDate(new Date());

      // Extract phone number
      const phoneMatch = fileContent.match(/<TelephoneNumber>([^<]+)<\/TelephoneNumber>/);
      const phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '').slice(-10) : '';

      // Extract traveler name (first occurrence in Traveler element)
      const travelerMatch = fileContent.match(/<Traveler[^>]*>[\s\S]*?<TravelerName>[\s\S]*?<Surname>([^<]+)<\/Surname>[\s\S]*?<GivenName>([^<]+)<\/GivenName>/);
      const surname = travelerMatch ? travelerMatch[1].trim() : '';
      const givenName = travelerMatch ? travelerMatch[2].trim() : '';
      const passengerName = `${surname} ${givenName}`.trim();

      // Extract flight information from Itinerary
      const flightMatches = fileContent.match(/<Flight[^>]*>[\s\S]*?<\/Flight>/g) || [];
      const flights = [];

      for (const flightMatch of flightMatches) {
        const airlineMatch = flightMatch.match(/<AirlineCode>([^<]+)<\/AirlineCode>/);
        const flightNumMatch = flightMatch.match(/<FlightNumber>([^<]+)<\/FlightNumber>/);
        const departureBlock = flightMatch.match(/<Departure>([\s\S]*?)<\/Departure>/);
        const arrivalBlock = flightMatch.match(/<Arrival>([\s\S]*?)<\/Arrival>/);

        if (airlineMatch && flightNumMatch && departureBlock && arrivalBlock) {
          const depAirport = departureBlock[1].match(/<AirportName>([^<]+)<\/AirportName>/);
          const depDate = departureBlock[1].match(/<Date>(\d{4}-\d{2}-\d{2})<\/Date>/);
          const arrAirport = arrivalBlock[1].match(/<AirportName>([^<]+)<\/AirportName>/);
          const arrDate = arrivalBlock[1].match(/<Date>(\d{4}-\d{2}-\d{2})<\/Date>/);

          if (depAirport && depDate && arrAirport && arrDate) {
            flights.push({
              airline: airlineMatch[1],
              number: flightNumMatch[1],
              depAirport: depAirport[1],
              depDate: depDate[1],
              arrAirport: arrAirport[1],
              arrDate: arrDate[1]
            });
          }
        }
      }

      // Format flight information
      let travel1 = '';
      let travel2 = '';
      let dates = '';

      if (flights.length > 0) {
        travel1 = `${flights[0].depAirport}/${flights[0].arrAirport}`;
        const depDateFormatted = new Date(flights[0].depDate);
        dates = `${depDateFormatted.getDate().toString().padStart(2, '0')}/${(depDateFormatted.getMonth() + 1).toString().padStart(2, '0')}/${depDateFormatted.getFullYear()}`;

        if (flights.length > 1) {
          travel2 = `${flights[1].depAirport}/${flights[1].arrAirport}`;
        }
      }

      // Extract total price from FareGroup (not nested Price, to get total for all travelers)
      const fareGroupMatch = fileContent.match(/<FareGroup[^>]*TotalPrice="([^"]+)"/);
      const totalPrice = fareGroupMatch ? parseFloat(fareGroupMatch[1]) / 100 : 0; // Assuming price is in cents

      // Extract airline code from first flight, fallback to EK
      const airlineCode = flights.length > 0 ? flights[0].airline : 'EK';
      
      // Extract airline name from XML if available
      const airlineNameMatch = fileContent.match(/<AirlineName>([^<]+)<\/AirlineName>/);
      const airlineName = airlineNameMatch ? airlineNameMatch[1].trim() : airlineCode;
      let iac = { 38200562: "B2B", 38287561: "SOF" };

      // Build ticket object
      const tkt = {
        name: passengerName,
        payer: "",
        bookingCode: bookingCode,
        agent: '',
        agentId: agency || admin || "123456789012345678901234",
        iata: iac[38288331],
        office: '',
        agentCost: 0,
        customerCost: 0,
        ticketNumber: ticketNumber,
        paymentMethod: '',
        paidAmount: totalPrice,
        receivingAmount1: 0,
        receivingAmount1Date: '',
        receivingAmount2Date: '',
        receivingAmount2Method: "",
        receivingAmount3Date: '',
        receivingAmount3Method: "",
        receivingAmount2: 0,
        receivingAmount3: 0,
        cardNumber: '',
        isVoid: false,
        bookedOn: bookedOn,
        travel1: travel1,
        travel2: travel2,
        dates: dates,
        phone: phone,
        flight: airlineName,
        refund: "",
        refundDate: "",
        desc: "",
        supplied: 0,
        returned: 0,
        returnedDate: "",
        paidByAgent: 0,
      };

      if (passengerName) {
        allTickets.push(tkt);
      }
    } catch (error) {
      console.error('Error processing Emirates XML file:', error);
    }
  }

  return allTickets;
}
