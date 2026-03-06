import React, { useState, useEffect } from "react";
import {
  Paper, Typography, Box, Stack, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableRow, TableCell
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Layout } from "components/tickets";
import { ticketsService } from "services";

export default function NextFlightsPage() {
  const [tickets, setTickets] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    ticketsService.getFlights().then((x) => setTickets(x));
  }, []);

  const checkin = (ticket) => {
    window.open(ticket.url, "_blank");
  };

  const infoTicket = (ticket) => {
    setTicket(ticket);
    setTicketDialog(true);
  };

  return (
    <Layout>
      <Box sx={{ width: '100%', minHeight: 200, position: 'relative' }}>
        {!tickets && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <span>
              <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#1976d2" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="62.8"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" from="0 24 24" to="360 24 24" dur="1s"/></circle></svg>
            </span>
            <Typography variant="body1" color="primary" sx={{ mt: 1 }}>Loading flights...</Typography>
          </Box>
        )}
        {tickets && !tickets.length && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <InfoIcon sx={{ color: 'info.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No flights in next 2 days</Typography>
          </Box>
        )}
        {tickets && tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((ticket, idx) => (
          <Paper 
            key={ticket.id} 
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
              }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                spacing={2} alignItems="flex-start" flexWrap="wrap" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Tooltip title={ticket.name}><Chip label={ticket.name.length > 20 ? ticket.name.slice(0, 20) + '…' : ticket.name} color="primary" variant="outlined" sx={{ width: 170, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Tooltip title={ticket.bookingCode}><Chip label={ticket.bookingCode.length > 14 ? ticket.bookingCode.slice(0, 13) + '…' : ticket.bookingCode} color="secondary" variant="outlined" sx={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Tooltip title={ticket.flight}><Chip label={ticket.flight.length > 18 ? ticket.flight.slice(0, 17) + '…' : ticket.flight} color="tertiary" variant="outlined" sx={{ width: 130, overflow: 'hidden', textOverflow: 'ellipsis' }} /></Tooltip>
                <Typography sx={{ textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ticket.dates}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Info"><IconButton onClick={() => infoTicket(ticket)}><InfoIcon /></IconButton></Tooltip>
                {ticket.isFlight && (
                  <Tooltip title="Check In"><IconButton onClick={() => checkin(ticket)} color="primary"><FlightTakeoffIcon /></IconButton></Tooltip>
                )}
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
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: 'center' }}>{tickets ? tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length : 0} flights</Typography>
        <Button variant="outlined" size="small" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
        <Typography variant="body2" sx={{ lineHeight: 2.5 }}>
          Page {tickets ? page + 1 : 1} of {tickets ? Math.ceil(tickets.length / rowsPerPage) : 1}
        </Typography>
        <Button variant="outlined" size="small" disabled={!tickets || page + 1 >= Math.ceil(tickets.length / rowsPerPage)} onClick={() => setPage(page + 1)}>Next</Button>
      </Box>
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
              {ticket.refund && (
                <>
                  <TableRow><TableCell>Refund/Date/Penality/Used:</TableCell><TableCell>{ticket.refund + " - " + (ticket.refundDate||'') + " - " + (ticket.penality||'') + " - " + (ticket.refundUsed||'')}</TableCell></TableRow>
                  <TableRow><TableCell>Return/Date:</TableCell><TableCell>{(ticket.returned || '') + " - " + (ticket.returnedDate||'')}</TableCell></TableRow>
                </>
              )}
              <TableRow><TableCell>Extra Notes:</TableCell><TableCell>{ticket.desc}</TableCell></TableRow>
            </TableBody></Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
