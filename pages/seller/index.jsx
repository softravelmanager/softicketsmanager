import { Layout } from "components/users";
import React, { useState, useEffect } from "react";
import Router from "next/router";
import { formatDate, operationsService, ticketsService } from "../../services";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import {
  Paper, Box, Typography, IconButton, Tooltip, Stack, Button, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, MenuItem, Select, FormControl, InputLabel, TextField
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
export default function SuppliersTransfersPage() {
  const [operations, setOperations] = useState(null);
  const [totals, setTotals] = useState({ supplied: 0, refund: 0, total: 0 });
  const [opExcel, setOpExcel] = useState([]);
  const [dates, setDates] = useState({ start: "", end: "", type: "transferDate" });
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteGroupKey, setDeleteGroupKey] = useState(null);

  useEffect(() => {
    getOperations();
  }, []);

  function removeBonifico(key) {
    setDeleteGroupKey(key);
    setDeleteDialog(true);
  }

  function confirmDelete() {
    let transfer = operations[deleteGroupKey];
    transfer.map((op) => {
      let isRefund = op.operation.includes("Used");
      let isB2B = op.operation.includes("B2B");
      let ticketRefundUsed = isRefund ? parseFloat(op.ticketRefundUsedN) : null;
      let suppliedTicket = isB2B ? parseFloat(op.suppliedTicketN) : null;
      let supplied = op.ticket[0].supplied ? parseFloat(op.ticket[0].supplied) : null;
      let refundUsed = op.ticket[0].refundUsed ? parseFloat(op.ticket[0].refundUsed) : null;
      supplied = supplied ? supplied - suppliedTicket : null;
      refundUsed = refundUsed ? refundUsed - ticketRefundUsed : null;
      let params = isRefund
        ? { refundUsed: refundUsed && Math.sign(refundUsed) !== -1 ? refundUsed : 0 }
        : { supplied: supplied && Math.sign(supplied) !== -1 ? supplied : 0 };
      ticketsService.update(op.ticketId, params);
      operationsService.delete(op.cid);
    });
    setOperations((prev) => { const newOps = { ...prev }; delete newOps[deleteGroupKey]; return newOps; });
    setDeleteDialog(false);
  }

  const getOperations = (datesObj = null) => {
    setLoading(true);
    let start = new Date();
    start.setDate(1);
    start = formatDate(start);
    let end = formatDate(new Date());
    let type = "transferDate";
    if (datesObj) {
      start = datesObj.start;
      end = datesObj.end;
      type = datesObj.type;
    } else {
      setDates({ start, end, type });
    }
    operationsService.getAll({ start, end, type }).then((res) => {
      const operationsI = res.reduce((group, arr) => {
        const { transferName } = arr;
        group[transferName] = group[transferName] ?? [];
        group[transferName].push(arr);
        return group;
      }, {});
      setOpExcel(res);
      setOperations(operationsI);
      let transferAmountTotalOperationI = 0;
      let refundAmountTotalOperationI = 0;
      Object.keys(operationsI).map((i) => {
        transferAmountTotalOperationI += parseFloat(operationsI[i][0].transferAmountTotalOperationN);
        refundAmountTotalOperationI += parseFloat(operationsI[i][0].refundAmountTotalOperationN);
      });
      setTotals({
        total: "€ " + parseFloat(transferAmountTotalOperationI + refundAmountTotalOperationI).toFixed(2),
        supplied: "€ " + transferAmountTotalOperationI.toFixed(2),
        refund: "€ " + refundAmountTotalOperationI.toFixed(2),
      });
      setLoading(false);
    });
  };

  const addNew = () => {
    Router.push("/seller/transfer");
  };

  const download = (type) => {
    const headers = [
      "Date", "Name", "PNR", "Operation", "Cost", "Total Paid to Supplier",
      "Remained to pay Supplier", "Transferred with Operation", "Total Refund",
      "Refund Used", "Remained refund", "Refund Used with Operation"
    ];
    const csvString = [
      headers,
      ...opExcel.map((i) => [
        i.transferDate, i.name, i.bookingCode, i.operation,
        i.paidAmount.replace("€", "Eur"), i.supplied.replace("€", "Eur"),
        i.remainedSupplied.replace("€", "Eur"), i.suppliedTicket.replace("€", "Eur"),
        i.refund.replace("€", "Eur"), i.refundUsed.replace("€", "Eur"),
        i.remainedRefund.replace("€", "Eur"), i.ticketRefundUsed.replace("€", "Eur"),
      ]),
    ].map((e) => e.join(";")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvString;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "operations_" + Date.now() + ".csv");
    document.body.appendChild(link);
    link.click();
  };

  // Summary Bar
  const SummaryBar = (
    <Paper elevation={1} sx={{ my: 2, p: 2, background: "#f5f5f5", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {!loading && operations && <Typography variant="body1" sx={{ fontWeight: 'bold', border: '1px solid #bdbdbd', padding: '2px 10px', borderRadius: '16px', background: '#e0e0e0' }}>Transfers: {Object.keys(operations).length}</Typography>}
        <Typography variant="body2">Supplied: {totals.supplied}</Typography>
        <Typography variant="body2">Refund: {totals.refund}</Typography>
        <Typography variant="body2">Total: {totals.total}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Export Excel"><IconButton color="success" onClick={download}><DownloadIcon /></IconButton></Tooltip>
        {/* You can add PDF export here as needed */}
        <Tooltip title="Add Transfer"><IconButton color="primary" onClick={addNew}><AddIcon /></IconButton></Tooltip>
      </Box>
    </Paper>
  );

  // Filter Bar
  const FilterBar = (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'end', width: '100%' }}>
        <Box sx={{ minWidth: 120 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="type-label">Type</InputLabel>
            <Select labelId="type-label" id="type" value={dates.type || "transferDate"} onChange={e => setDates(d => ({ ...d, type: e.target.value }))} label="Type">
              <MenuItem value="transferDate">Transfer Date</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ minWidth: 140, flex: 1 }}>
          <TextField size="small" type="date" label="From" fullWidth id="start" value={dates.start} onChange={e => setDates(d => ({ ...d, start: e.target.value }))} sx={{ mb: 0 }}/>
        </Box>
        <Box sx={{ minWidth: 140, flex: 1 }}>
          <TextField size="small" type="date" label="To" fullWidth id="end" value={dates.end} onChange={e => setDates(d => ({ ...d, end: e.target.value }))} sx={{ mb: 0 }}/> 
        </Box>
        <Box sx={{ minWidth: 120, alignSelf: 'flex-end' }}>
          <Button variant="contained" color="primary" fullWidth onClick={() => getOperations(dates)} sx={{ height: 40 }} startIcon={<InfoIcon />}>Search</Button>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Layout>
      {FilterBar}
      {SummaryBar}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <CircularProgress color="primary" />
          <Typography variant="body1" color="primary" sx={{ mt: 1 }}>Loading transfers...</Typography>
        </Box>
      )}
      {!loading && (!operations || !Object.keys(operations).length) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <InfoIcon sx={{ color: 'info.main', fontSize: 48, mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No transfers found.</Typography>
        </Box>
      )}
      {!loading && operations && Object.keys(operations).length > 0 && (
        <Box sx={{ width: '100%', mb: 2 }}>
          {Object.keys(operations).map((key, i) => (
            <Accordion 
            key={key} 
            sx={{ 
              mb: 2,
              borderRadius: 1,
              backgroundColor: i % 2 === 0 ? '#e3e4e5' : '#f3f4f5',
              boxShadow: 2 
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>                 
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ fontWeight: 600, mr: 2 }}>{i+1} - Bonifico</Typography>
                  <Typography sx={{ mr: 2 }}>Date: {operations[key][0].transferDate}</Typography>
                  <Typography sx={{ mr: 2 }}>Total: {operations[key][0].totalOperation}</Typography>
                  <Typography sx={{ mr: 2 }}>Supplied: {operations[key][0].transferAmountTotalOperation}</Typography>
                  <Typography sx={{ mr: 2 }}>Refund: {operations[key][0].refundAmountTotalOperation}</Typography>
                  <span
                    tabIndex={0}
                    style={{ cursor: 'pointer', marginLeft: 8, display: 'inline-flex' }}
                    onClick={e => {e.stopPropagation(); removeBonifico(key, operations[key]);}}
                  >
                    <Tooltip title="Delete">
                      <DeleteIcon color="error" />
                    </Tooltip>
                  </span>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 900, bgcolor: 'white' }}>
                    <TableBody>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>PNR</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Total Paid to Supplier</TableCell>
                        <TableCell>Remained to pay Supplier</TableCell>
                        <TableCell>Transferred with Operation</TableCell>
                        <TableCell>Total Refund</TableCell>
                        <TableCell>Refund Used</TableCell>
                        <TableCell>Remained refund</TableCell>
                        <TableCell>Refund Used with Operation</TableCell>
                      </TableRow>
                      {operations[key].map((op, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{op.transferDate}</TableCell>
                          <TableCell>{op.name}</TableCell>
                          <TableCell>{op.bookingCode}</TableCell>
                          <TableCell>{op.operation}</TableCell>
                          <TableCell>{op.paidAmount}</TableCell>
                          <TableCell>{op.supplied}</TableCell>
                          <TableCell>{op.remainedSupplied}</TableCell>
                          <TableCell>{op.suppliedTicket}</TableCell>
                          <TableCell>{op.refund}</TableCell>
                          <TableCell>{op.refundUsed}</TableCell>
                          <TableCell>{op.remainedRefund}</TableCell>
                          <TableCell>{op.ticketRefundUsed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this transfer group and all its operations?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>No</Button>
          <Button color="error" onClick={confirmDelete}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
