import { Layout } from "components/users";
import React, { useState, useEffect, useRef } from "react";
import Router from "next/router";
import { formatDate, ticketsService } from "../../services";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Grid, Paper, Typography, Box, Stack, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableRow, TableCell,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, FormControlLabel, Collapse
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from '@mui/icons-material/Download';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import moment from "moment";
export default Index;

function Index() {
  const [tickets, setTickets] = useState([]);
  const [apiTickets, setApiTickets] = useState([]);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [deleteTicketDialog, setDeleteTicketDialog] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ start: "", end: "", type: "" });
  const [totals, setTotals] = useState([0, 0, 0, 0, 0]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchFields, setSearchFields] = useState(["all"]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'bookedOn', direction: 'descending' });
  const [notPaidOnly, setNotPaidOnly] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    getTickets();
  }, []);

  // Apply all filters and live-search on filter value/state change
  useEffect(() => {
    let filtered = [...apiTickets];
    // Not fully paid filter
    if (notPaidOnly) {
      filtered = filtered.filter(t => !t.amountsCompleted);
    }
    // Multi-field search
    if (globalSearch) {
      let fields = searchFields.includes("all") ? ["name", "payer", "agent", "bookingCode", "ticketNumber", "iata", "phone", "methods", "desc", "cardNumber"] : searchFields;
      filtered = filtered.filter(ticket =>
        fields.some(field => (ticket[field] || "").toString().toLowerCase().includes(globalSearch.toLowerCase()))
      );
    }

    // Sorting logic
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (['profit', 'paidAmount', 'customerCost', 'receivingAmountT', 'agentCost'].includes(sortConfig.key)) {
            aValue = parseFloat(String(aValue || '0').replace(/[^\d.-]/g, ''));
            bValue = parseFloat(String(bValue || '0').replace(/[^\d.-]/g, ''));
        } else if (sortConfig.key === 'bookedOn') {
            const dateA = aValue.split('/').reverse().join('-');
            const dateB = bValue.split('/').reverse().join('-');
            aValue = new Date(dateA);
            bValue = new Date(dateB);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setTickets(filtered);
    setPage(0);
    calculate(filtered);
  }, [notPaidOnly, globalSearch, searchFields, apiTickets, sortConfig]);

  const PRIORITY_FIELDS = [
    'name', 'payer', 'bookingCode', 'ticketNumber', 'bookedOn', 'iata',
    'profit', 'paidAmount', 'customerCost', 'receivingAmountT', 'methods', 'paymentMethod',
    'phone', 'agent', 'agentCost',
    'receivingAmount1', 'receivingAmount1Date',
    'receivingAmount2', 'receivingAmount2Date',
    'receivingAmount3', 'receivingAmount3Date',
    'travel1', 'travel2', 'flight', 'dates',
    'refund', 'refundDate', 'penality', 'returned', 'returnedDate', 'refundUsed',
    'cardNumber', 'desc', 'id'
  ];

  // Collect all field names across all tickets and order by importance
  useEffect(() => {
    if (!apiTickets || !apiTickets.length) {
      setAvailableFields([]);
      setSelectedFields([]);
      return;
    }
    const keys = Array.from(new Set(apiTickets.flatMap(t => Object.keys(t || {}))));
    const idx = (k) => {
      const i = PRIORITY_FIELDS.indexOf(k);
      return i === -1 ? 999 : i;
    };
    keys.sort((a, b) => {
      const ia = idx(a);
      const ib = idx(b);
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });
    setAvailableFields(keys);
    // keep only still-available keys selected
    setSelectedFields(prev => prev.filter(f => keys.includes(f)));
  }, [apiTickets]);

  const getTickets = (dates = null) => {
    setLoading(true);
    let start = new Date();
    start.setDate(1);
    start = formatDate(start);
    let end = formatDate(new Date());
    let type = "bookedOn";
    if (dates) {
      start = dates.start;
      end = dates.end;
      type = dates.type;
    } else {
      setDates({ start, end, type });
    }
    ticketsService.getAll({ start, end, type }).then((tickets) => {
      setTickets(tickets);
      setApiTickets(tickets);
      calculate(tickets);
      setLoading(false);
    });
  };

  const search = () => {
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;
    let type = document.getElementById("type").value;
    getTickets({ start, end, type });
  };

  const addNew = () => {
    Router.push("/tickets/add");
  };

  const infoTicket = (ticket) => {
    setTicket(ticket);
    setTicketDialog(true);
  };

  const editTicket = (ticket) => {
    window.open("/tickets/edit/" + ticket.id, "_blank");
  };

  const confirmDeleteTicket = (ticket) => {
    setTicket(ticket);
    setDeleteTicketDialog(true);
  };

  const toggleSelectTicket = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const drawTicketReceipt = (doc, tickets) => {
    const ticketList = Array.isArray(tickets) ? tickets : [tickets];
    const firstTicket = ticketList[0];
    const imgData = "logo.png";
    const imgData1 = "iata2.jpg";

    // 1. Logo (Centered as per image)
    doc.addImage(imgData, "PNG", 10, 10, 80, 40);
    doc.addImage(imgData1, "PNG", 110, 20, 40, 10);

    // 2. Bolla Header (Left)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const lastValidPaymentDate = firstTicket.receivingAmount3Date?.trim() || firstTicket.receivingAmount2Date?.trim() || firstTicket.receivingAmount1Date?.trim();
    const headerPaymentDate = lastValidPaymentDate || moment().format('DD/MM/YYYY');
    doc.text(`Ricevuta di pagamento del ${headerPaymentDate}`, 15, 60);
    doc.setFont("helvetica", "normal");
    
    doc.setFontSize(9);
    doc.text(`Operatore: SOF Travel`, 15, 67);
    doc.text(`Nr. Biglietti: ${ticketList.length}`, 15, 72);
    doc.text(`Data stampa: ${moment().format('DD/MM/YYYY')}`, 15, 77);

    // 3. Passenger Spett.le Box (Right)
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.roundedRect(110, 50, 85, 30, 3, 3);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Spett.le", 115, 56);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(firstTicket.payer?.trim() || firstTicket.name, 115, 63, { maxWidth: 75 });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Contatto: " + (firstTicket.phone || 'N/A'), 115, 72);

    // 4. Header Labels Bar
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, 90, 180, 15, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Prenotato il", 18, 96);
    doc.text("Numero", 40, 96);
    doc.text("PNR", 75, 96);
    doc.text("Compagnia", 105, 96);
    doc.text("Passeggero", 135, 96);

    // 5. Main Content Row Container
    doc.roundedRect(15, 110, 180, 100, 3, 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    // List Passengers
    let currentY = 118;
    ticketList.slice(0, 5).forEach((t) => {
      doc.text(t.bookedOn, 18, currentY);
      doc.text(t.ticketNumber || 'N/A', 40, currentY, { maxWidth: 33 });
      doc.text(t.bookingCode || 'N/A', 75, currentY, { maxWidth: 28 });
      doc.text(t.flight || 'N/A', 105, currentY, { maxWidth: 28 });
      doc.text(t.name, 135, currentY, { maxWidth: 58 });
      currentY += 6;
    });

    // Dettagli Viaggio
    currentY = 150;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Dettagli Viaggio:", 18, currentY);    
    doc.setFont("helvetica", "normal");
    currentY += 5;
    
    ticketList.forEach(t => {
      if (currentY > 180) return;
      doc.text(`${t.name.split(' ')[0]}: ${t.travel1 || 'N/A'} ${t.travel2 ? ' || ' + t.travel2 : ''}`, 18, currentY, { maxWidth: 170 });
      currentY += 7;
    });

    // Payment Details Section
    currentY = 182;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Dettagli Pagamento:", 18, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");

    let totalPaymentsNumeric = 0;
    let totalCostNumeric = 0;

    ticketList.forEach(t => {
      const p1 = parseFloat(t.receivingAmount1 || '0') || 0;
      const p2 = parseFloat(t.receivingAmount2 || '0') || 0;
      const p3 = parseFloat(t.receivingAmount3 || '0') || 0;
      
      let payments = [];
      if (p1 > 0) payments.push(`€ ${p1.toFixed(2)} (${t.receivingAmount1Date}) - ${t.paymentMethod}`);
      if (p2 > 0) payments.push(`€ ${p2.toFixed(2)} (${t.receivingAmount2Date}) - ${t.receivingAmount2Method}`);
      if (p3 > 0) payments.push(`€ ${p3.toFixed(2)} (${t.receivingAmount3Date}) - ${t.receivingAmount3Method}`);

      if (payments.length > 0 && currentY < 210) {
        const paymentStr = `${t.name.split(' ')[0]}: ${payments.join(' || ')}`;
        doc.text(paymentStr, 18, currentY, { maxWidth: 170 });
        const lines = doc.splitTextToSize(paymentStr, 170);
        currentY += (lines.length * 4);
      }
      totalPaymentsNumeric += (p1 + p2 + p3);
      
      if (t.customerCost && t.customerCost.trim()) {
        totalCostNumeric += parseFloat(String(t.customerCost || '0').replace(/[^\d.-]/g, '')) || 0;
      }
    });

    if (totalCostNumeric === 0) {
      totalCostNumeric = totalPaymentsNumeric;
    }

    const daSaldareNumeric = totalCostNumeric - totalPaymentsNumeric;

    // 6. Totals Grid & Signature
    const startTotalsY = 215;
    doc.roundedRect(15, startTotalsY, 180, 50, 3, 3);
    
    // Vertical separators for totals
    doc.line(55, startTotalsY, 55, startTotalsY + 15);
    doc.line(95, startTotalsY, 95, startTotalsY + 15);
    doc.line(135, startTotalsY, 135, startTotalsY + 15);
    doc.line(165, startTotalsY, 165, startTotalsY + 15);

    // Labels for totals
    doc.setFontSize(8);
    doc.text("Tot. Importo", 18, startTotalsY + 5);
    doc.text("", 58, startTotalsY + 5);
    doc.text("", 138, startTotalsY + 5);
    doc.text("Da Saldare", 168, startTotalsY + 5);

    // Values for totals
    doc.setFontSize(10);
    doc.text(`€ ${totalCostNumeric.toFixed(2)}`, 40, startTotalsY + 12, null, null, "right");
    doc.text('', 80, startTotalsY + 12, null, null, "right");
    doc.text(``, 160, startTotalsY + 12, null, null, "right"); // Tot. Pagato
    doc.text(`€ ${daSaldareNumeric.toFixed(2)}`, 190, startTotalsY + 12, null, null, "right"); // Da Saldare

    // Net amount prominent line
    doc.line(15, startTotalsY + 15, 195, startTotalsY + 15);
    doc.setFont("helvetica", "bold");
    doc.text("Tot. Saldato", 145, startTotalsY + 22);
    doc.text(`€ ${totalPaymentsNumeric.toFixed(2)}`, 190, startTotalsY + 22, null, null, "right");
    doc.setFont("helvetica", "normal");

    // Signature area
    doc.line(140, startTotalsY + 15, 140, startTotalsY + 50);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Firma", 165, startTotalsY + 47, null, null, "center");

    // 7. Company Footer
    doc.setFontSize(8);
    //doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    
    const footerLine1 = "Piazza Guglielmo Marconi 3/D, 42121 Reggio Emilia, Italia";
    const footerLine2 = "Tel/fax: +39 0522 434392 - Cell.: +39 334 3532384, +39 351 1220012";
    const footerLine3 = "P. IVA 02241890223 - softravel.it - softravel786@gmail.com";

    doc.text(footerLine1, 105, 280, null, null, "center");
    doc.text(footerLine2, 105, 285, null, null, "center");
    doc.text(footerLine3, 105, 290, null, null, "center");
    // Disclaimer: not valid for fiscal/tax purposes
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("* Questa ricevuta non è valida ai fini fiscali.", 205, 295, null, null, "right");
  };

  const downloadTicket = (ticket) => {
    const doc = new jsPDF();
    drawTicketReceipt(doc, [ticket]);
    doc.save(`${ticket.name.replace(/\W/g, "_")}_Ticket_${ticket.id}.pdf`);
  };

  const downloadSelectedTickets = () => {
    const selectedData = apiTickets.filter(t => selectedIds.includes(t.id));
    if (selectedData.length === 0) return;

    const doc = new jsPDF();
    drawTicketReceipt(doc, selectedData);
    doc.save(`Tickets_Summary_${moment().format('YYYYMMDD_HHmm')}.pdf`);
  };

  const downloadBackup = async () => {
    try {
      const blob = await ticketsService.downloadBackup();
      const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error.message || 'Unable to download backup.');
    }
  };

  const hideDeleteTicketDialog = () => {
    setDeleteTicketDialog(false);
  };

  const deleteTicket = () => {
    ticketsService.delete(ticket.id).then(() => {
      setTickets((tickets) => tickets.filter((x) => x.id !== ticket.id));
      setApiTickets((tickets) => tickets.filter((x) => x.id !== ticket.id));
      hideDeleteTicketDialog();
    });
  };

  const calculate = (data) => {
    let tp = 0;
    let tc = 0;
    let tr = 0;
    let ta = 0;
    let tcc = 0;
    for (let i = 0; i < data.length; i++) {
      let ttp = data[i].profit.replace("€ ", "");
      let ttc = data[i].paidAmount.replace("€ ", "");
      let ttr = data[i].receivingAmountT.replace("€ ", "");
      let tta = data[i].agentCost ? data[i].agentCost.replace("€ ", "") : 0;
      let tcccc = data[i].customerCost ? data[i].customerCost.replace("€ ", "") : 0;
      tp += parseFloat(ttp);
      tc += parseFloat(ttc);
      tr += parseFloat(ttr);
      ta += parseFloat(tta);
      tcc += parseFloat(tcccc);
    }
    setTotals([
      "€ " + tp.toFixed(2),
      "€ " + tc.toFixed(2),
      "€ " + tr.toFixed(2),
      "€ " + ta.toFixed(2),
      "€ " + tcc.toFixed(2),
    ]);
  };

  // Export CSV using selected fields (if any) or all fields by default
  const exportCSV = () => {
    const dataToExport = selectedIds.length > 0
      ? apiTickets.filter(t => selectedIds.includes(t.id))
      : tickets;

    if (!dataToExport.length) return;
    const fields = selectedFields.length ? selectedFields : Array.from(new Set(dataToExport.flatMap(t => Object.keys(t || {}))));
    const csvRows = [
      fields.join(","),
      ...dataToExport.map(row =>
        fields.map(field => JSON.stringify(row[field] ?? "")).join(",")
      ),
    ];
    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export PDF with buyer page styling (Name, Booking Date, Ticket N., Cost, Paid, Remained)
  const exportTicketsPDF = () => {
    const dataToExport = selectedIds.length > 0
      ? apiTickets.filter(t => selectedIds.includes(t.id))
      : tickets;

    if (!dataToExport || !dataToExport.length) return;

    // Compute totals
    let totalCost = 0;
    let totalPaid = 0;
    dataToExport.forEach(t => {
      const costN = parseFloat(String(t.agentCost || '0').replace(/[^\d.-]/g, '')) || 0;
      const paidN = parseFloat(String(t.receivingAmountT || '0').replace(/[^\d.-]/g, '')) || 0;
      totalCost += costN;
      totalPaid += paidN;
    });
    const totalRemained = totalCost - totalPaid;

    // Prepare doc header
    const imgData = "logo.PNG";
    const doc = new jsPDF();
    let row = 10;
    doc.addImage(imgData, "PNG", 10, 10, 80, 40);
    doc.setFontSize(20);
    row += 10;
    doc.text("SOF Travel", 200, row, null, null, "right");
    doc.setFontSize(10);
    row += 10;
    doc.text("Piazza Guglielmo Marconi 3/D", 200, row, null, null, "right");
    row += 5;
    doc.text("42121 - Reggio Emilia", 200, row, null, null, "right");
    row += 5;
    doc.text("Tel/fax: +39 0522 434392", 200, row, null, null, "right");
    row += 5;
    doc.text("Cell.: +39 334 3532384, +39 351 1220012", 200, row, null, null, "right");
    row += 10;
    doc.text(
      "Total Cost: € " + totalCost.toFixed(2),
      10,
      row,
      null,
      null,
      "left"
    );
    row += 2;
    doc.setDrawColor(120, 120, 120);
    doc.line(10, row, 200, row);
    doc.setFontSize(10);
    row += 2;

    // Table
    const headers = [["Name", "Payer", "Booking Date", "PNR", "Ticket N.", "Agent Cost", "Fully Paid"]];
    const body = dataToExport.map(t => {
      const costStr = t.receivingAmountT || '';
      const paidStr = t.agentCost || '';
      const costN = parseFloat(String(costStr).replace(/[^\d.-]/g, '')) || 0;
      const paidN = parseFloat(String(paidStr).replace(/[^\d.-]/g, '')) || 0;
      const remained = costN - paidN;
      return [
        t.name || '',
        t.payer || '',
        t.bookedOn || '',
        t.bookingCode || '',
        t.ticketNumber || '',
        paidStr,
        remained >= 0 ? 'Yes' : '€ ' + remained.toString().replace('-', '') + ' to pay'
      ];
    });
    doc.autoTable({ startY: row, head: headers, body });

    // Footer
    row = 280;
    doc.setFontSize(8);
    doc.text("SOF Travel", 200, row, null, null, "right");
    row += 2;
    doc.line(10, row, 200, row);
    row += 3;
      doc.text("Piazza Guglielmo Marconi 3/D, 42121 Reggio Emilia, Italia", 200, row, null, null, "right");
    doc.save("tickets_" + Date.now() + ".pdf");
  };

  // PAGINATION
  const pageTickets = tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(tickets.length / rowsPerPage);

  return (
    <Layout>
      {/* Filter/Search bar with Material UI and working date filtering */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', width: '100%' }}>
          <Box sx={{ minWidth: 140 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>Type:</Typography>
            <select
              id="type"
              className="form-select"
              value={dates.type || "bookedOn"}
              onChange={e => setDates(d => ({ ...d, type: e.target.value }))}
              style={{ width: '100%', minWidth: '120px' }}
            >
              <option value="bookedOn">Issue Date</option>
              <option value="receivingAllDates">All Amounts Dates</option>
              <option value="receivingAmount1Date">Amount 1 Date</option>
              <option value="receivingAmount2Date">Amount 2 Date</option>
              <option value="receivingAmount3Date">Amount 3 Date</option>
            </select>
          </Box>
          <Box sx={{ minWidth: 140, flex: 1 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>From Date:</Typography>
            <input
              type="date"
              className="form-control"
              id="start"
              value={dates.start || ''}
              onChange={e => setDates(d => ({ ...d, start: e.target.value }))}
              placeholder="From"
              style={{ width: '100%' }}
            />
          </Box>
          <Box sx={{ minWidth: 140, flex: 1 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>To Date:</Typography>
            <input
              type="date"
              className="form-control"
              id="end"
              value={dates.end || ''}
              onChange={e => setDates(d => ({ ...d, end: e.target.value }))}
              placeholder="To"
              style={{ width: '100%' }}
            />
          </Box>
          {/* Search Box */}
          <Box sx={{ minWidth: 180, flex: 2 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>Search</Typography>
            <input
              type="text"
              className="form-control"
              id="searchText"
              placeholder="Enter search keyword"
              style={{ width: '100%' }}
              onChange={e => setGlobalSearch(e.target.value)}
            />
          </Box>
          {/* Search Field */}
          <Box sx={{ minWidth: 180 }}>
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel id="fields-multi-label">Fields</InputLabel>
              <Select
                labelId="fields-multi-label"
                id="searchFields"
                multiple
                value={searchFields}
                onChange={e => {
                  const value = e.target.value;
                  setSearchFields(typeof value === 'string' ? value.split(',') : value.length ? value : ["all"]);
                }}
                input={<OutlinedInput label="Fields" />}
                renderValue={selected => selected.includes("all") ? "All" : selected.join(", ")}
              >
                {["all", "name", "agent", "bookingCode", "ticketNumber", "iata", "phone", "methods", 'cardNumber'].map(field => (
                  <MenuItem key={field} value={field}>
                    <Checkbox checked={searchFields.indexOf(field) > -1} />
                    <ListItemText primary={{
                      all: "All",
                      name: "Name",
                      agent: "Agent",
                      bookingCode: "PNR",
                      ticketNumber: "Ticket",
                      iata: "Issued By",
                      phone: "Phone",
                      methods: "Payment Method",
                      cardNumber: "Card Number",
                    }[field] || field} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/* Not Fully Paid Checkbox */}
          <Box sx={{ minWidth: 150, display: 'flex', alignItems: 'center', height: 48 }}>
            <input type="checkbox" id="notPaidChk" checked={notPaidOnly} onChange={e => setNotPaidOnly(e.target.checked)} style={{ marginRight: 4 }} />
            <label htmlFor="notPaidChk" style={{ fontWeight: 500, userSelect: 'none', cursor: 'pointer' }}>Not Fully Paid</label>
          </Box>
          <Box sx={{ minWidth: 120, alignSelf: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={search}
              sx={{ height: 50 }}
              startIcon={<InfoIcon />}
            >
              Search
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Export fields selection (collapsible) */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Export Fields</Typography>
          <IconButton onClick={() => setExportOpen(o => !o)} aria-label="toggle export fields">
            {exportOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={exportOpen} timeout="auto" unmountOnExit>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1, mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={availableFields.length > 0 && selectedFields.length === availableFields.length}
                  indeterminate={selectedFields.length > 0 && selectedFields.length < availableFields.length}
                  onChange={() => {
                    if (selectedFields.length === availableFields.length) {
                      setSelectedFields([]);
                    } else {
                      setSelectedFields(availableFields);
                    }
                  }}
                />
              }
              label="Select all"
            />
            <Typography variant="body2">Selected: {selectedFields.length}/{availableFields.length}</Typography>
          </Box>
          <Grid container spacing={1}>
            {availableFields.map(field => (
              <Grid key={field} item xs={12} sm={6} md={4} lg={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedFields.includes(field)}
                      onChange={() =>
                        setSelectedFields(prev =>
                          prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
                        )
                      }
                    />
                  }
                  label={field}
                />
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </Paper>

      {/* Totals Summary */}
      <Paper elevation={1} style={{ margin: "10px 0 20px 0", padding: "16px", backgroundColor: "#f5f5f5", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', border: '1px solid #bdbdbd', padding: '2px 10px', borderRadius: '16px', background: '#e0e0e0', userSelect: 'none' }}
            onDoubleClick={downloadBackup}
          >
            Tickets: {tickets.length}
          </Typography>
          <Typography variant="body2">Profit: {totals[0]}</Typography>
          <Typography variant="body2">Cost: {totals[1]}</Typography>
          <Typography variant="body2">Cust. Cost: {totals[4]}</Typography>
          <Typography variant="body2">Received: {totals[2]}</Typography>
          <Typography variant="body2">Agent Cost: {totals[3]}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {selectedIds.length > 0 && (
            <Tooltip title="Download Selected Individual Receipts">
              <Button variant="contained" color="error" size="small" onClick={downloadSelectedTickets} startIcon={<PictureAsPdfIcon />}>
                Export ({selectedIds.length})
              </Button>
            </Tooltip>
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortConfig.key}
              label="Sort By"
              onChange={e => setSortConfig({ ...sortConfig, key: e.target.value })}
            >
              <MenuItem value="bookedOn">Issue Date</MenuItem>
              <MenuItem value="profit">Profit</MenuItem>
              <MenuItem value="paidAmount">Cost</MenuItem>
              <MenuItem value="receivingAmountT">Received</MenuItem>
              <MenuItem value="agentCost">Agent Cost</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={`Sort ${sortConfig.direction === 'ascending' ? 'Descending' : 'Ascending'}`}>
            <IconButton onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}>
              {sortConfig.direction === 'ascending' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Excel">
            <IconButton color="success" onClick={exportCSV}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton color="error" onClick={exportTicketsPDF}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Ticket">
            <IconButton color="primary" onClick={addNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Ticket Cards List */}
      <Box sx={{ width: '100%', minHeight: 200, position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <span>
              <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#1976d2" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="62.8"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" from="0 24 24" to="360 24 24" dur="1s"/></circle></svg>
            </span>
            <Typography variant="body1" color="primary" sx={{ mt: 1 }}>Loading tickets...</Typography>
          </Box>
        )}
        {!loading && pageTickets.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <InfoIcon sx={{ color: 'info.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No tickets found, try changing filters</Typography>
          </Box>
        )}
        {!loading && pageTickets.map((ticket, idx) => (
          <Paper
            key={ticket.id}
            elevation={2}
            onDoubleClick={() => editTicket(ticket)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              p: 1,
              mb: 1,
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: idx % 2 === 0 ? '#e3e4e5' : '#f3f4f5',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', overflow: 'hidden' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Checkbox size="small" checked={selectedIds.includes(ticket.id)} onChange={() => toggleSelectTicket(ticket.id)} />
                <Tooltip title={ticket.name}><Chip label={ticket.name.length > 25 ? ticket.name.slice(0, 25) + '…' : ticket.name} color="primary" variant="outlined" sx={{ width: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Tooltip title={ticket.bookingCode}><Chip label={ticket.bookingCode.length > 25 ? ticket.bookingCode.slice(0, 25) + '…' : ticket.bookingCode} color="secondary" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography sx={{ fontWeight: 500, width: 150, minWidth: 150, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.ticketNumber}</Typography>
                <Tooltip title={ticket.iata}><Chip label={(ticket?.iata || []).length > 25 ? ticket.iata.slice(0, 25) + '…' : ticket.iata} color="tertiary" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography
                  sx={{width: 80, minWIdth: 80, maxWidth: 80, textAllign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  color={Number(ticket.profit.replace(/[^\d.-]/g, '')) < 0 ? 'error.main' : 'success.main'}>
                  {ticket.profit}
                </Typography>
                <Typography sx={{ width: 80, minWidth: 80, maxWidth: 80, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.paidAmount}</Typography>
                <Typography sx={{ width: 80, minWidth: 80, maxWidth: 80, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.customerCost}</Typography>
                <Typography sx={{ width: 80, minWidth: 80, maxWidth: 80, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.receivingAmountT}</Typography>
                <Typography sx={{ width: 100, minWidth: 100, maxWidth: 100, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.bookedOn}</Typography>
                <Typography variant='body2' sx={{ width: 80, minWidth: 80, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.methods}</Typography>
                {ticket.agent && ticket.agent.trim() !== "" && (
                  <Tooltip title={ticket.agent}><Chip label={ticket.agent.length > 25 ? ticket.agent.slice(0, 25) + '…' : ticket.agent} color="info" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                )}
                {ticket.agent && ticket.agent.trim() !== "" && (
                  <Typography>{ticket.agentCost}</Typography>
                )}
              </Stack>
              <Stack direction="row">
                <Tooltip title="Info"><IconButton onClick={() => infoTicket(ticket)}><InfoIcon /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton onClick={() => confirmDeleteTicket(ticket)}><DeleteIcon color="secondary" /></IconButton></Tooltip>
                <Tooltip title="Export PDF"><IconButton onClick={() => downloadTicket(ticket)}><PictureAsPdfIcon color="error" /></IconButton></Tooltip>
              </Stack>
            </Box>
          </Paper>
        ))}
      </Box>
      {/* Pagination */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3, gap: 3 }}>
        <Typography sx={{ mr: 1 }}>Rows per page:</Typography>
        <select
          value={rowsPerPage}
          onChange={e => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          style={{ height: 28, marginRight: 16 }}
        >
          {[25, 50, 100, 200, 500].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <Button variant="outlined" size="small" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
        <Typography variant="body2" sx={{ lineHeight: 2.5 }}>
          Page {page + 1} of {totalPages}
        </Typography>
        <Button variant="outlined" size="small" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
      </Box>
      {/* Dialog for Details, preserving ALL fields */}
      <Dialog open={ticketDialog} onClose={() => setTicketDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Details</DialogTitle>
        <DialogContent>
          {ticket && (
            <Table><TableBody>
              <TableRow><TableCell>Passenger:</TableCell><TableCell>{ticket.name}</TableCell></TableRow>
              <TableRow><TableCell>Payer:</TableCell><TableCell>{ticket.payer}</TableCell></TableRow>
              <TableRow><TableCell>Agent:</TableCell><TableCell>{ticket.agent}</TableCell></TableRow>
              <TableRow><TableCell>PNR:</TableCell><TableCell>{ticket.bookingCode}</TableCell></TableRow>
              <TableRow><TableCell>Ticket:</TableCell><TableCell>{ticket.ticketNumber}</TableCell></TableRow>
              <TableRow><TableCell>Cost:</TableCell><TableCell>{ticket.paidAmount}</TableCell></TableRow>
              <TableRow><TableCell>Customer Cost:</TableCell><TableCell>{ticket.customerCost}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Amount 1:</TableCell><TableCell>{ticket.receivingAmount1}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Date 1:</TableCell><TableCell>{ticket.receivingAmount1Date}</TableCell></TableRow>
              <TableRow><TableCell>Payment Method:</TableCell><TableCell>{ticket.paymentMethod}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Amount 2:</TableCell><TableCell>{ticket.receivingAmount2}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Date 2:</TableCell><TableCell>{ticket.receivingAmount2Date}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Method 2:</TableCell><TableCell>{ticket.receivingAmount2Method}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Amount 3:</TableCell><TableCell>{ticket.receivingAmount3}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Date 3:</TableCell><TableCell>{ticket.receivingAmount3Date}</TableCell></TableRow>
              <TableRow><TableCell>Receiving Method 3:</TableCell><TableCell>{ticket.receivingAmount3Method}</TableCell></TableRow>
              <TableRow><TableCell>Profit:</TableCell><TableCell>{ticket.profit}</TableCell></TableRow>
              <TableRow><TableCell>Issue Date:</TableCell><TableCell>{ticket.bookedOn}</TableCell></TableRow>
              <TableRow><TableCell>Travel1:</TableCell><TableCell>{ticket.travel1}</TableCell></TableRow>
              <TableRow><TableCell>Travel2:</TableCell><TableCell>{ticket.travel2}</TableCell></TableRow>
              <TableRow><TableCell>Flight/Vessel:</TableCell><TableCell>{ticket.flight}</TableCell></TableRow>
              <TableRow><TableCell>Dates:</TableCell><TableCell>{ticket.dates}</TableCell></TableRow>
              <TableRow><TableCell>Phone:</TableCell><TableCell>{ticket.phone}</TableCell></TableRow>
              {ticket.refund && <TableRow><TableCell>Refund:</TableCell><TableCell>{ticket.refund}</TableCell></TableRow>}
              {ticket.refundDate && <TableRow><TableCell>Refund Date:</TableCell><TableCell>{ticket.refundDate}</TableCell></TableRow>}
              {ticket.penality && <TableRow><TableCell>Penalty:</TableCell><TableCell>{ticket.penality}</TableCell></TableRow>}
              {ticket.returned && <TableRow><TableCell>Returned:</TableCell><TableCell>{ticket.returned}</TableCell></TableRow>}
              {ticket.returnedDate && <TableRow><TableCell>Returned Date:</TableCell><TableCell>{ticket.returnedDate}</TableCell></TableRow>}
              {ticket.refundUsed && <TableRow><TableCell>Refund Used:</TableCell><TableCell>{ticket.refundUsed}</TableCell></TableRow>}
              {ticket.agentCost && <TableRow><TableCell>Agent Cost:</TableCell><TableCell>{ticket.agentCost}</TableCell></TableRow>}
              {ticket.methods && <TableRow><TableCell>Payment Methods:</TableCell><TableCell>{ticket.methods}</TableCell></TableRow>}
              {ticket.cardNumber && <TableRow><TableCell>Card Number:</TableCell><TableCell>{ticket.cardNumber}</TableCell></TableRow>}
              {ticket.desc && <TableRow><TableCell>Extra Notes:</TableCell><TableCell>{ticket.desc}</TableCell></TableRow>}
            </TableBody></Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog for Confirm Delete */}
      <Dialog open={deleteTicketDialog} onClose={hideDeleteTicketDialog}>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          {ticket && <Typography>Are you sure you want to delete <b>{ticket.name}</b> ticket?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={hideDeleteTicketDialog}>No</Button>
          <Button color="error" onClick={deleteTicket}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
