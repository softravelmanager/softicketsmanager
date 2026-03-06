import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Stack, IconButton, Tooltip, Chip, Button, CircularProgress
} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Layout } from "components/users";
import { userService } from "services";

export default function UserPage() {
  const [users, setUsers] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    userService.getAll().then((x) => setUsers(x));
  }, []);

  function deleteUser(id) {
    setUsers(
      users.map((x) => {
        if (x.id === id) {
          x.isDeleting = true;
        }
        return x;
      })
    );
    userService.delete(id).then(() => {
      setUsers((users) => users.filter((x) => x.id !== id));
    });
  }

  // Paging
  const pageUsers = users ? users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];
  const totalPages = users ? Math.ceil(users.length / rowsPerPage) : 1;

  return (
    <Layout>
      <Box sx={{ width: '100%', minHeight: 200, position: 'relative' }}>
        {!users && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <CircularProgress color="primary" />
            <Typography variant="body1" color="primary" sx={{ mt: 1 }}>Loading users...</Typography>
          </Box>
        )}
        {users && !users.length && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' }}>
            <InfoIcon sx={{ color: 'info.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No Users To Display</Typography>
          </Box>
        )}
        {users && pageUsers.map((user, idx) => (
        <Paper 
          key={user.id}
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
            <Stack 
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="flex-start"
              flexWrap="wrap"
              sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
            >
              <Tooltip title={user.firstName + ' ' + user.lastName}><Chip label={user.firstName + ' ' + user.lastName} color="primary" variant="outlined" sx={{ width: 150 }}/></Tooltip>
              <Tooltip title={user.email} color="secondary" variant="outlined"><Chip label={user.email} sx={{ width: 170 }}/></Tooltip>
              <Typography sx={{ width: 80 }}>€ {user.balance}</Typography>
              <Typography sx={{ width: 70 }}>{user.level}</Typography>
              <Typography sx={{ width: 70 }}>{user.code}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit Agent">
                <IconButton component={Link} href={`/users/edit/${user.id}`}> <EditIcon color="primary" /> </IconButton>
              </Tooltip>
              <Tooltip title="Delete Agent">
                <span>
                  <IconButton 
                    onClick={() => deleteUser(user.id)}
                    color="secondary"
                    disabled={user.isDeleting}
                  >
                    {user.isDeleting ? <CircularProgress color="secondary" size={20} /> : <DeleteIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
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
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: 'center' }}>{users ? pageUsers.length : 0} users</Typography>
        <Button variant="outlined" size="small" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
        <Typography variant="body2" sx={{ lineHeight: 2.5 }}>
          Page {page + 1} of {totalPages}
        </Typography>
        <Button variant="outlined" size="small" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
      </Box>
    </Layout>
  );
}
