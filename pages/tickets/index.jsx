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
export default Index;

function Index() {
  const [tickets, setTickets] = useState([]);
  const [apiTickets, setApiTickets] = useState([]);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [deleteTicketDialog, setDeleteTicketDialog] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ start: "", end: "", type: "" });
  const [totals, setTotals] = useState([0, 0, 0, 0]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchFields, setSearchFields] = useState(["all"]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'bookedOn', direction: 'descending' });
  const [notPaidOnly, setNotPaidOnly] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

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
      let fields = searchFields.includes("all") ? ["name", "agent", "bookingCode", "ticketNumber", "iata", "phone", "methods"] : searchFields;
      filtered = filtered.filter(ticket =>
        fields.some(field => (ticket[field] || "").toString().toLowerCase().includes(globalSearch.toLowerCase()))
      );
    }

    // Sorting logic
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (['profit', 'paidAmount', 'receivingAmountT', 'agentCost'].includes(sortConfig.key)) {
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
    'name', 'bookingCode', 'ticketNumber', 'bookedOn', 'iata',
    'profit', 'paidAmount', 'receivingAmountT', 'methods', 'paymentMethod',
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

  const downloadTicket = (ticket) => {
    const imgData = "logo.PNG";
    const doc = new jsPDF();
    let row = 10;
    let width = 130;
    let length = 35;
    doc.addImage(imgData, "PNG", 10, 10, 80, 40);

    doc.setFontSize(20);
    row += 10;
    doc.text("Sof Travel", 200, row, null, null, "right");
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
    doc.setDrawColor(120, 120, 120);
    doc.line(10, row, 200, row);
    doc.setFontSize(14);
    row += 20;

    doc.text("Nome Passeggero", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.name, 65, row, { maxWidth: width }, null, "left");
    ticket.name.length > length ? (row += 10) : (row += 4);

    doc.line(10, row, 200, row);
    row += 7;
    doc.text("Data Acquisto", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.bookedOn, 65, row, { maxWidth: width }, null, "left");
    ticket.bookedOn.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Codice prenotazione", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.bookingCode, 65, row, { maxWidth: width }, null, "left");
    ticket.bookingCode.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Date Viaggio", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.dates, 65, row, { maxWidth: width }, null, "left");
    ticket.dates && ticket.dates.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Porto di partenza", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.travel1, 65, row, { maxWidth: width }, null, "left");
    ticket.travel1 && ticket.travel1.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Porto di arrivo", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.travel2, 65, row, { maxWidth: width }, null, "left");
    ticket.travel2 && ticket.travel2.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Numero del biglietto", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.ticketNumber, 65, row, { maxWidth: width }, null, "left");
    ticket.ticketNumber && ticket.ticketNumber.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Pagato", 10, row);
    doc.text(":", 60, row);
    let total =
      parseFloat(
        (parseFloat(ticket.receivingAmount1) || 0) +
          (parseFloat(ticket.receivingAmount2) || 0) +
          (parseFloat(ticket.receivingAmount3) || 0)
      ).toFixed(2) + " EUR";
    doc.text(total, 65, row, { maxWidth: width }, null, "left");
    total.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Metodo di pagamento", 10, row);
    doc.text(":", 60, row);
    let methods =
      ticket.paymentMethod +
      (ticket.receivingAmount2Method
        ? " - " + ticket.receivingAmount2Method
        : "") +
      (ticket.receivingAmount3Method
        ? " - " + ticket.receivingAmount3Method
        : "");
    doc.text(methods, 65, row, { maxWidth: width }, null, "left");
    methods.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Volo/Nave", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.flight, 65, row, { maxWidth: width }, null, "left");
    ticket.flight && ticket.flight.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    doc.text("Numero di telefono", 10, row);
    doc.text(":", 60, row);
    doc.text(ticket.phone, 65, row, { maxWidth: width }, null, "left");
    ticket.phone && ticket.phone.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row);
    row += 7;

    if (ticket.refund) {
      doc.text("Rimborso", 10, row);
      doc.text(":", 60, row);
      let refund =
        ticket.refund +
        " EUR" +
        (ticket.refundDate ? " - " + formatDate(ticket.refundDate, "IT") : "");
      doc.text(refund, 65, row, { maxWidth: width }, null, "left");
      refund.length > length ? (row += 10) : (row += 4);
      doc.line(10, row, 200, row);
      row += 7;
    }

    row = 280;
    doc.setFontSize(8);
    doc.text("SOF Travel", 200, row, null, null, "right");
    row += 2;
    doc.line(10, row, 200, row);
    row += 3;
    doc.text("Piazza Guglielmo Marconi 3/D, 42121 Reggio Emilia, Italia", 200, row, null, null, "right");
    doc.save(ticket.name.replace(/\W/g, "_") + "_" + ticket.id + ".pdf");
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
    for (let i = 0; i < data.length; i++) {
      let ttp = data[i].profit.replace("€ ", "");
      let ttc = data[i].paidAmount.replace("€ ", "");
      let ttr = data[i].receivingAmountT.replace("€ ", "");
      let tta = data[i].agentCost ? data[i].agentCost.replace("€ ", "") : 0;
      tp += parseFloat(ttp);
      tc += parseFloat(ttc);
      tr += parseFloat(ttr);
      ta += parseFloat(tta);
    }
    setTotals([
      "€ " + tp.toFixed(2),
      "€ " + tc.toFixed(2),
      "€ " + tr.toFixed(2),
      "€ " + ta.toFixed(2),
    ]);
  };

  // Export CSV using selected fields (if any) or all fields by default
  const exportCSV = () => {
    if (!tickets.length) return;
    const fields = selectedFields.length ? selectedFields : Array.from(new Set(tickets.flatMap(t => Object.keys(t || {}))));
    const csvRows = [
      fields.join(","),
      ...tickets.map(row =>
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
    if (!tickets || !tickets.length) return;

    // Compute totals
    let totalCost = 0;
    let totalPaid = 0;
    tickets.forEach(t => {
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
    const headers = [["Name", "Booking Date", "PNR", "Ticket N.", "Agent Cost", "Fully Paid"]];
    const body = tickets.map(t => {
      console.log(t);
      const costStr = t.receivingAmountT || '';
      const paidStr = t.agent !== '' ? t.agentCost : t.paidAmount;
      const costN = parseFloat(String(costStr).replace(/[^\d.-]/g, '')) || 0;
      const paidN = parseFloat(String(paidStr).replace(/[^\d.-]/g, '')) || 0;
      const remained = costN - paidN;
      return [
        t.name || '',
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
                {["all", "name", "agent", "bookingCode", "ticketNumber", "iata", "phone", "methods"].map(field => (
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
                      methods: "Payment Method"
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
          <Typography variant="body1" sx={{ fontWeight: 'bold', border: '1px solid #bdbdbd', padding: '2px 10px', borderRadius: '16px', background: '#e0e0e0' }}>Tickets: {tickets.length}</Typography>
          <Typography variant="body2">Profit: {totals[0]}</Typography>
          <Typography variant="body2">Cost: {totals[1]}</Typography>
          <Typography variant="body2">Received: {totals[2]}</Typography>
          <Typography variant="body2">Agent Cost: {totals[3]}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                <Tooltip title={ticket.name}><Chip label={ticket.name.length > 25 ? ticket.name.slice(0, 25) + '…' : ticket.name} color="primary" variant="outlined" sx={{ width: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Tooltip title={ticket.bookingCode}><Chip label={ticket.bookingCode.length > 25 ? ticket.bookingCode.slice(0, 25) + '…' : ticket.bookingCode} color="secondary" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography sx={{ fontWeight: 500, width: 150, minWidth: 150, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.ticketNumber}</Typography>
                <Tooltip title={ticket.iata}><Chip label={ticket.iata.length > 25 ? ticket.iata.slice(0, 25) + '…' : ticket.iata} color="tertiary" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography
                  sx={{width: 80, minWIdth: 80, maxWidth: 80, textAllign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  color={Number(ticket.profit.replace(/[^\d.-]/g, '')) < 0 ? 'error.main' : 'success.main'}>
                  {ticket.profit}
                </Typography>
                <Typography sx={{ width: 80, minWidth: 80, maxWidth: 80, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.paidAmount}</Typography>
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
              <TableRow><TableCell>Agent:</TableCell><TableCell>{ticket.agent}</TableCell></TableRow>
              <TableRow><TableCell>PNR:</TableCell><TableCell>{ticket.bookingCode}</TableCell></TableRow>
              <TableRow><TableCell>Ticket:</TableCell><TableCell>{ticket.ticketNumber}</TableCell></TableRow>
              <TableRow><TableCell>Cost:</TableCell><TableCell>{ticket.paidAmount}</TableCell></TableRow>
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
