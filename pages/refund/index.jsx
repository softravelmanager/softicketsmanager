import { Layout } from "components/users";
import React, { useState, useEffect } from "react";
import Router from "next/router";
import { formatDate, ticketsService } from "../../services";
import { jsPDF } from "jspdf";
import {
  Paper, Typography, Box, Stack, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableRow, TableCell
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from '@mui/icons-material/Download';

export default function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [apiRefunds, setApiRefunds] = useState([]);
  const [refundDialog, setRefundDialog] = useState(false);
  const [deleteRefundDialog, setDeleteRefundDialog] = useState(false);
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ start: "", end: "", type: "", refund: true });
  const [totals, setTotals] = useState([0, 0, 0, 0]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchField, setSearchField] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [notPaidOnly, setNotPaidOnly] = useState(false);

  useEffect(() => {
    getRefunds();
  }, []);

  useEffect(() => {
    let filtered = [...apiRefunds];
    if (notPaidOnly) {
      filtered = filtered.filter(ref => !ref.amountsCompleted);
    }
    if (globalSearch && searchField !== "all") {
      filtered = filtered.filter(ref => (ref[searchField] || "").toString().toLowerCase().includes(globalSearch.toLowerCase()));
    } else if (globalSearch && searchField === "all") {
      filtered = filtered.filter(ref => ["name", "supplied", "refund", "refundDate", "refundUsed", "penality", "returned", "returnedDate", "bookingCode", "ticketNumber", "bookedOn"]
        .some(field => (ref[field] || "").toString().toLowerCase().includes(globalSearch.toLowerCase())));
    }
    setRefunds(filtered);
    setPage(0);
    calculate(filtered);
  }, [notPaidOnly, globalSearch, searchField, apiRefunds]);

  const getRefunds = (customDates = null) => {
    setLoading(true);
    let start = new Date();
    start.setDate(1);
    start = formatDate(start);
    let end = formatDate(new Date());
    let type = "bookedOn";
    let refundFlag = true;
    if (customDates) {
      start = customDates.start;
      end = customDates.end;
      type = customDates.type;
    } else {
      setDates({ start, end, type, refund: true });
    }
    ticketsService.getAll({ start, end, type, refund: refundFlag }).then(records => {
      setRefunds(records);
      setApiRefunds(records);
      calculate(records);
      setLoading(false);
    });
  };

  const search = () => {
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;
    let type = document.getElementById("type").value;
    getRefunds({ start, end, type });
  };

  const addNew = () => {
    Router.push("/tickets/add");
  };

  const infoRefund = (refund) => {
    setRefund(refund);
    setRefundDialog(true);
  };

  const editRefund = (refund) => {
    Router.push("/tickets/edit/" + refund.id);
  };

  const confirmDeleteRefund = (refund) => {
    setRefund(refund);
    setDeleteRefundDialog(true);
  };

  const deleteRefund = () => {
    ticketsService.delete(refund.id).then(() => {
      setRefunds((refunds) => refunds.filter((x) => x.id !== refund.id));
      setApiRefunds((refunds) => refunds.filter((x) => x.id !== refund.id));
      setDeleteRefundDialog(false);
    });
  };

  const downloadRefund = (refund) => {
    // Use the same jsPDF logic as the tickets page (adapt for refund fields)
    const imgData = "logo.PNG";
    const doc = new jsPDF();
    let row = 10;
    let width = 130;
    let length = 35;
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
    doc.setDrawColor(120, 120, 120);
    doc.line(10, row, 200, row);
    doc.setFontSize(14);
    row += 20;
    doc.text("Nome Passeggero", 10, row); doc.text(":", 60, row); doc.text(refund.name, 65, row, { maxWidth: width }, null, "left");
    refund.name && refund.name.length > length ? (row += 10) : (row += 4);
    doc.line(10, row, 200, row); row += 10;
    doc.text("PNR", 10, row); doc.text(":", 60, row); doc.text(refund.bookingCode, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row); row += 10;
    doc.text("Ticket", 10, row); doc.text(":", 60, row); doc.text(refund.ticketNumber, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row); row += 10;
    doc.text("Refund", 10, row); doc.text(":", 60, row); doc.text(refund.refund, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row); row += 10;
    doc.text("Refund Date", 10, row); doc.text(":", 60, row); doc.text(refund.refundDate, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row); row += 10;
    doc.text("Refund Used", 10, row); doc.text(":", 60, row); doc.text(refund.refundUsed, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row); row += 10;
    doc.text("Penalty", 10, row); doc.text(":", 60, row); doc.text(refund.penality, 65, row, { maxWidth: width }, null, "left");
    doc.line(10, row, 200, row);
     // Footer
    row = 280;
    doc.setFontSize(8);
    doc.text("SOF Travel", 200, row, null, null, "right");
    row += 2;
    doc.line(10, row, 200, row);
    row += 3;
      doc.text("Piazza Guglielmo Marconi 3/D, 42121 Reggio Emilia, Italia", 200, row, null, null, "right");
    doc.save("tickets_" + Date.now() + ".pdf");
    doc.save(`refund_${refund.ticketNumber}.pdf`);
  };

  const calculate = (data) => {
    let sumRefund = 0, sumPenalty = 0;
    for (let i = 0; i < data.length; i++) {
      sumRefund += parseFloat((data[i].refund || "0").replace("€ ", "") || 0);
      sumPenalty += parseFloat((data[i].penality || "0").replace("€ ", "") || 0);
    }
    setTotals([
      "€ " + sumRefund.toFixed(2),
      "€ " + sumPenalty.toFixed(2)
    ]);
  };

  const exportCSV = () => {
    if (!refunds.length) return;
    const fields = ["name","supplied","refund","refundDate","refundUsed","penality","returned","returnedDate","bookingCode","ticketNumber","bookedOn"];
    const csvRows = [
      fields.join(","),
      ...refunds.map(row =>
        fields.map(field => JSON.stringify(row[field] ?? "")).join(",")
      ),
    ];
    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refunds_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const pageRefunds = refunds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(refunds.length / rowsPerPage);

  return (
    <Layout>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', width: '100%' }}>
          <Box sx={{ minWidth: 140 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>Type:</Typography>
            <select id="type" className="form-select" value={dates.type || "bookedOn"} onChange={e => setDates(d => ({ ...d, type: e.target.value }))} style={{ width: '100%', minWidth: '120px' }} >
              <option value="bookedOn">Issue Date</option>
              <option value="receivingAllDates">All Amounts Dates</option>
              <option value="receivingAmount1Date">Amount 1 Date</option>
              <option value="receivingAmount2Date">Amount 2 Date</option>
              <option value="receivingAmount3Date">Amount 3 Date</option>
            </select>
          </Box>
          <Box sx={{ minWidth: 140, flex: 1 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>From Date:</Typography>
            <input type="date" className="form-control" id="start" value={dates.start || ''} onChange={e => setDates(d => ({ ...d, start: e.target.value }))} placeholder="From" style={{ width: '100%' }} />
          </Box>
          <Box sx={{ minWidth: 140, flex: 1 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>To Date:</Typography>
            <input type="date" className="form-control" id="end" value={dates.end || ''} onChange={e => setDates(d => ({ ...d, end: e.target.value }))} placeholder="To" style={{ width: '100%' }} />
          </Box>
          {/* Search box */}
          <Box sx={{ minWidth: 180, flex: 2 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>Search</Typography>
            <input type="text" className="form-control" placeholder="Enter search keyword" style={{ width: '100%' }} onChange={e => setGlobalSearch(e.target.value)} />
          </Box>
          {/* Search Field */}
          <Box sx={{ minWidth: 120 }}>
            <Typography fontWeight={500} sx={{ mb: 1 }}>Field</Typography>
            <select className="form-select" value={searchField} onChange={e => setSearchField(e.target.value)} style={{ width: '100%' }} >
              <option value="all">All</option>
              <option value="name">Name</option>
              <option value="supplied">Supplied</option>
              <option value="refund">Refund</option>
              <option value="refundDate">Refund Date</option>
              <option value="refundUsed">Refund Used</option>
              <option value="penality">Penalty</option>
              <option value="returned">Returned</option>
              <option value="returnedDate">Returned Date</option>
              <option value="bookingCode">PNR</option>
              <option value="ticketNumber">Ticket</option>
              <option value="bookedOn">Issue Date</option>
            </select>
          </Box>
          {/* Not Fully Paid Checkbox (not typically used for refunds, omitted) */}
          <Box sx={{ minWidth: 120, alignSelf: 'flex-end' }}>
            <Button variant="contained" color="primary" fullWidth onClick={search} sx={{ height: 50 }} startIcon={<InfoIcon />}>Search</Button>
          </Box>
        </Box>
      </Paper>
      <Paper elevation={1} style={{ margin: "10px 0 20px 0", padding: "16px", backgroundColor: "#f5f5f5", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', border: '1px solid #bdbdbd', padding: '2px 10px', borderRadius: '16px', background: '#e0e0e0' }}>Refunds: {refunds.length}</Typography>
          <Typography variant="body2">Refund: {totals[0]}</Typography>
          <Typography variant="body2">Penalty: {totals[1]}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export Excel">
            <IconButton color="success" onClick={exportCSV}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Refund">
            <IconButton color="primary" onClick={addNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      <Box sx={{ width: '100%', minHeight: 200, position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <span>
              <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#1976d2" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="62.8"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" from="0 24 24" to="360 24 24" dur="1s"/></circle></svg>
            </span>
            <Typography variant="body1" color="primary" sx={{ mt: 1 }}>Loading refunds...</Typography>
          </Box> )}
        {!loading && pageRefunds.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <InfoIcon sx={{ color: 'info.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No refunds found</Typography>
          </Box> )}
        {!loading && pageRefunds.map((refund, idx) => (
          <Paper 
            key={refund.id}
            elevation={2}
            sx={{
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              boxSizing: 'border-box', 
              p: 1, 
              mb: 1, 
              borderRadius: 1,
              backgroundColor: idx % 2 === 0 ? '#e3e4e5' : '#f3f4f5',
            }}
            >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', overflow: 'hidden' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Tooltip title={refund.name}><Chip label={refund.name && refund.name.length > 25 ? refund.name.slice(0, 25) + '…' : refund.name} color="primary" variant="outlined" sx={{ width: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Tooltip title={refund.bookingCode}><Chip label={refund.bookingCode && refund.bookingCode.length > 25 ? refund.bookingCode.slice(0,25) + '…' : refund.bookingCode} color="secondary" variant="outlined" sx={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography sx={{ fontWeight: 500 }}>{refund.ticketNumber}</Typography>
                <Typography color={Number((refund.refund||'0').replace(/[^\d.-]/g, '')) < 0 ? 'error.main' : 'success.main'}>{refund.refund}</Typography>
                <Typography>{refund.refundDate}</Typography>
                <Typography>{refund.supplied}</Typography>
                <Typography>{refund.refundUsed}</Typography>
                <Typography>{refund.penality}</Typography>
                <Typography>{refund.returned}</Typography>
                <Typography>{refund.returnedDate}</Typography>
                <Typography>{refund.bookedOn}</Typography>
              </Stack>
              <Stack direction="row">
                <Tooltip title="Info"><IconButton onClick={() => infoRefund(refund)}><InfoIcon /></IconButton></Tooltip>
                <Tooltip title="Edit"><IconButton onClick={() => editRefund(refund)}><EditIcon color="primary" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton onClick={() => confirmDeleteRefund(refund)}><DeleteIcon color="secondary" /></IconButton></Tooltip>
                <Tooltip title="Export PDF"><IconButton onClick={() => downloadRefund(refund)}><PictureAsPdfIcon color="error" /></IconButton></Tooltip>
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
      {/* Details Dialog */}
      <Dialog open={refundDialog} onClose={() => setRefundDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Details</DialogTitle>
        <DialogContent>
          {refund && (
            <Table><TableBody>
              <TableRow><TableCell>Passenger:</TableCell><TableCell>{refund.name}</TableCell></TableRow>
              <TableRow><TableCell>Supplied To:</TableCell><TableCell>{refund.supplied}</TableCell></TableRow>
              <TableRow><TableCell>Refund:</TableCell><TableCell>{refund.refund}</TableCell></TableRow>
              <TableRow><TableCell>Refund Date:</TableCell><TableCell>{refund.refundDate}</TableCell></TableRow>
              <TableRow><TableCell>Refund Used:</TableCell><TableCell>{refund.refundUsed}</TableCell></TableRow>
              <TableRow><TableCell>Penalty:</TableCell><TableCell>{refund.penality}</TableCell></TableRow>
              <TableRow><TableCell>Returned:</TableCell><TableCell>{refund.returned}</TableCell></TableRow>
              <TableRow><TableCell>Returned Date:</TableCell><TableCell>{refund.returnedDate}</TableCell></TableRow>
              <TableRow><TableCell>PNR:</TableCell><TableCell>{refund.bookingCode}</TableCell></TableRow>
              <TableRow><TableCell>Ticket:</TableCell><TableCell>{refund.ticketNumber}</TableCell></TableRow>
              <TableRow><TableCell>Issue Date:</TableCell><TableCell>{refund.bookedOn}</TableCell></TableRow>
            </TableBody></Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog for Confirm Delete */}
      <Dialog open={deleteRefundDialog} onClose={() => setDeleteRefundDialog(false)}>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          {refund && <Typography>Are you sure you want to delete <b>{refund.name}</b> ticket?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRefundDialog(false)}>No</Button>
          <Button color="error" onClick={deleteRefund}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
