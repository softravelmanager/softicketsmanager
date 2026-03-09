import { Layout } from "components/users";
import React, { useState, useEffect } from "react";
import Router from "next/router";
import {
  formatDate,
  agentsOperationsService,
  ticketsService,
  userService,
} from "../../services";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import {
  Paper, Box, Typography, IconButton, Tooltip, Stack, Button, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, MenuItem, Select, FormControl, InputLabel, TextField
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
export default function AgentTransfersPage() {
  const [operations, setOperations] = useState(null);
  const [agents, setAgents] = useState([]);
  const [totals, setTotals] = useState({ supplied: 0, adjusted: 0, total: 0, balance: 0 });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteGroupKey, setDeleteGroupKey] = useState(null);
  const [dates, setDates] = useState({ start: "", end: "", type: "transferDate", agent: "all" });
  const [loading, setLoading] = useState(true);
  const [opPdf, setOpPdf] = useState([]);

  useEffect(() => {
    getAgents();
    getOperations();
  }, []);

  function getAgents() {
    userService.getAllAgents().then((res) => {
      let ags = res.filter((ag) => !(ag.firstName + " " + ag.lastName).toLowerCase().includes("agency"));
      setAgents(ags);
    });
  }

  function removeBonifico(key) {
    setDeleteGroupKey(key);
    setDeleteDialog(true);
  }

  function confirmDelete() {
    let transfer = operations[deleteGroupKey];
    transfer.map((op) => {
      if (op?.ticket && op.ticket[0]) {
        let suppliedTicket = parseFloat(op.suppliedTicketN);
        let paidByAgent = op.ticket[0].paidByAgent ? parseFloat(op.ticket[0].paidByAgent) : null;
        paidByAgent = paidByAgent ? paidByAgent - suppliedTicket : 0;
        let params = { paidByAgent: paidByAgent && Math.sign(paidByAgent) !== -1 ? paidByAgent : 0, };
        ticketsService.update(op.ticketId, params);
      }
      agentsOperationsService.delete(op.cid);
    });
    setOperations((prev) => { const newOps = { ...prev }; delete newOps[deleteGroupKey]; return newOps; });
    setDeleteDialog(false);
  }

  const getOperations = (datesX = null) => {
    setLoading(true);
    let start = new Date();
    start.setDate(1);
    start = formatDate(start);
    let end = formatDate(new Date());
    let type = "transferDate";
    let agent = "all";
    if (datesX) {
      start = datesX.start;
      end = datesX.end;
      type = datesX.type;
      agent = datesX.agent;
    }
    setDates({ start, end, type, agent });
    agentsOperationsService.getAll({ start, end, type, agent: agent === "all" ? null : agent }).then((res) => {
      let res2 = res.data;
      if (agent && agent !== "all") {
        res2 = res.data.filter((r) => r.agentId === agent);
      }
      const operationsI = res2.reduce((group, arr) => {
        const { transferName } = arr;
        group[transferName] = group[transferName] ?? [];
        group[transferName].push(arr);
        return group;
      }, {});
      let transferAmountTotalOperationI = 0;
      let balanceAmountTotalOperationI = 0;
      let adjustedAmountTotalOperationI = 0;
      Object.keys(operationsI).map((i) => {
        transferAmountTotalOperationI += parseFloat(operationsI[i][0].transferOperationN);
        balanceAmountTotalOperationI += parseFloat(operationsI[i][0].balanceOperationN);
        adjustedAmountTotalOperationI += parseFloat(operationsI[i][0].suppliedTotalN);
      });
      setOperations(operationsI);
      setOpPdf(res.tickets || []);
      setTotals({
        total: "€ " + parseFloat(transferAmountTotalOperationI + balanceAmountTotalOperationI).toFixed(2),
        supplied: "€ " + transferAmountTotalOperationI.toFixed(2),
        balance: "€ " + balanceAmountTotalOperationI.toFixed(2),
        adjusted: "€ " + adjustedAmountTotalOperationI.toFixed(2),
      });
      setLoading(false);
    });
  };

  const addNew = () => {
    Router.push("/buyer/transfer");
  };

  // restore download logic for CSV and PDF
  const download = (type) => {
    if (type === 1) {
      const headers = [
        "Name", "PNR", "Operation", "Agent Cost", "Total Paid By Agent", "Remained to pay", "Paid with Operation"
      ];
      let csvStringT = [];
      Object.keys(operations).forEach((o) => {
        let opExcel = operations[o];
        csvStringT.push([
          [
            opExcel[0].agentName,
            opExcel[0].method,
            opExcel[0].transferDate,
            opExcel[0].transferOperation.replace("€", "Eur"),
            opExcel[0].balanceOperation.replace("€", "Eur"),
            opExcel[0].suppliedTotal.replace("€", "Eur"),
          ],
          headers,
        ],
        opExcel.map(i => [
          i.name,
          i.bookingCode,
          i.operation,
          i.paidAmount.replace("€", "Eur"),
          i.supplied.replace("€", "Eur"),
          i.remainedSupplied.replace("€", "Eur"),
          i.suppliedTicket.replace("€", "Eur")]),
        [[]]);
      });
      const csvStringN = csvStringT.reduce((acc, arr) => acc.concat(arr), []);
      let csvString = csvStringN.map(e => e.join(";")).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + csvString;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "agentsoperations_" + Date.now() + ".csv");
      document.body.appendChild(link);
      link.click();
    } else {
      const headers = [
        [
          "Name",
          "Booking Date",
          "PNR",
          "Ticket N.",
          "Cost",
          "Paid",
          "Remained",
        ],
      ];
      let agentCost = 0;
      let paidByAgent = 0;
      let remainedT = 0;
      const data = opPdf.map((o) => {
        agentCost += parseFloat(o.agentCost);
        paidByAgent += parseFloat(o.paidByAgent);
        let remained = parseFloat(o.agentCost) - parseFloat(o.paidByAgent);
        remainedT += remained;
        return [
          o.name,
          formatDate(o.bookedOn, "it"),
          o.bookingCode,
          o.ticketNumber,
          "€ " + o.agentCost,
          "€ " + o.paidByAgent,
          "€ " + parseFloat(remained).toFixed(2),
        ];
      });

      //console.log(operations, opPdf);
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
        "Total Cost: € " +
          parseFloat(agentCost).toFixed(2) +
          " - Total Paid: € " +
          parseFloat(paidByAgent).toFixed(2) +
          " - Remained: € " +
          parseFloat(remainedT).toFixed(2),
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

      let content = {
        startY: row,
        head: headers,
        body: data,
      };
      doc.autoTable(content);

      row = 280;
      doc.setFontSize(8);
      doc.text("SOF Travel", 200, row, null, null, "right");
      row += 2;
      doc.line(10, row, 200, row);
      row += 3;
      doc.text("Piazza Guglielmo Marconi 3/D, 42121 Reggio Emilia, Italia", 200, row, null, null, "right");
      doc.save("agentsoperations_" + Date.now() + ".pdf");
    }
  };

  // summary bar definition
  const SummaryBar = (
    <Paper elevation={1} sx={{ my: 2, p: 2, background: "#f5f5f5", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {!loading && operations && <Typography variant="body1" sx={{ fontWeight: 'bold', border: '1px solid #bdbdbd', padding: '2px 10px', borderRadius: '16px', background: '#e0e0e0' }}>Transfers: {Object.keys(operations).length}</Typography>}
        <Typography variant="body2">Supplied: {totals.supplied}</Typography>
        <Typography variant="body2">Balance: {totals.balance}</Typography>
        <Typography variant="body2">Adjusted: {totals.adjusted}</Typography>
        <Typography variant="body2">Total: {totals.total}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Export Excel"><IconButton color="success" onClick={() => download(1)}><DownloadIcon /></IconButton></Tooltip>
        <Tooltip title="Export PDF"><IconButton color="error" onClick={() => download(2)}><PictureAsPdfIcon /></IconButton></Tooltip>
        <Tooltip title="Add Transfer"><IconButton color="primary" onClick={addNew}><AddIcon /></IconButton></Tooltip>
      </Box>
    </Paper>
  );

  // Filter bar
  const FilterBar = (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'end', width: '100%' }}>
        <Box sx={{ minWidth: 140 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="agent-label">Agent</InputLabel>
            <Select labelId="agent-label" id="agent" value={dates.agent || "all"} onChange={e => setDates(d => ({ ...d, agent: e.target.value }))} label="Agent">
              <MenuItem value="all">All Agents</MenuItem>
              {agents.map(agent => (
                <MenuItem key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
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
      {/* Group accordions for transfers */}
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
                  <Typography sx={{ fontWeight: 600, mr: 2 }}>{i+1}. {operations[key][0].method}</Typography>
                  <Typography sx={{ mr: 2 }}>Agent: {operations[key][0].agentName}</Typography>
                  <Typography sx={{ mr: 2 }}>Date: {operations[key][0].transferDate}</Typography>
                  <Typography sx={{ mr: 2 }}>Supplied: {operations[key][0].transferOperation}</Typography>
                  <Typography sx={{ mr: 2 }}>Balance: {operations[key][0].balanceOperation}</Typography>
                  <Typography sx={{ mr: 2 }}>Adjusted: {operations[key][0].suppliedTotal}</Typography>
                  <span
                    tabIndex={0}
                    style={{ cursor: 'pointer', marginLeft: 8, display: 'inline-flex' }}
                    onClick={e => {e.stopPropagation(); removeBonifico(key);}}
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
                      <TableCell>Name</TableCell>
                      <TableCell>PNR</TableCell>
                      <TableCell>Operation</TableCell>
                      <TableCell>Agent Cost</TableCell>
                      <TableCell>Total Paid By Agent</TableCell>
                      <TableCell>Remained to Pay</TableCell>
                      <TableCell>Paid with Operation</TableCell>
                    </TableRow>
                    {operations[key].map((op, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{op.name}</TableCell>
                        <TableCell>{op.bookingCode}</TableCell>
                        <TableCell>{op.operation}</TableCell>
                        <TableCell>{op.paidAmount}</TableCell>
                        <TableCell>{op.supplied}</TableCell>
                        <TableCell>{op.remainedSupplied}</TableCell>
                        <TableCell>{op.suppliedTicket}</TableCell>
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
