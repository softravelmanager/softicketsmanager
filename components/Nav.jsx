import { useState, useEffect } from "react";
import getConfig from "next/config";
import Link from "next/link";
import { flightsService, userService } from "services";
import { useRouter } from "next/router";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefundIcon from '@mui/icons-material/RequestQuote';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
const drawerWidth = 240;

export function Nav() {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titles = {
    users: "Agents List",
    tickets: "Tickets List",
    upload: "Upload Files",
    "tickets/add": "Add Ticket",
    "tickets/edit": "Edit Ticket",
    refund: "Refunds",
    seller: "Suppliers Transfers",
    buyer: "Agents Transfers",
    "buyer/transfer": "Transfer Amount to Agents",
    "seller/transfer": "Transfer Amount to Supplier",
    expenses: "Expenses",
    "expenses/categories": "Expenses Categories",
    "expenses/add": "Add Expense",
    "expenses/edit": "Edit Expense",
    flights: "Next Flights/Events",
  };
  
   const config = getConfig();
    let icon = <FlightTakeoffIcon sx={{ color: '#e26a36' }} />;
    if (config?.publicRuntimeConfig?.isLocal) {
      icon = <FlightTakeoffIcon onClick={() =>{flightsService.setFlights(); }} sx={{ color: '#02d17b' }} />;
    }

  const navMap = [
    { label: "Dashboard", href: "/", icon: <DashboardIcon sx={{ color: '#e26a36' }} /> },
    { label: "Next Flights/Events", href: "/flights", icon: icon },
    { label: "Tickets", href: "/tickets", icon: <ReceiptIcon sx={{ color: '#e26a36' }} /> },
    { label: "Refunds", href: "/refund", icon: <RefundIcon sx={{ color: '#e26a36' }} /> },
    { label: "Suppliers Transfers", href: "/seller", icon: <SupervisorAccountIcon sx={{ color: '#e26a36' }} /> },
    { label: "Agents Transfers", href: "/buyer", icon: <AccountBalanceWalletIcon sx={{ color: '#e26a36' }} /> },
    { label: "Expenses", href: "/expenses", icon: <MonetizationOnIcon sx={{ color: '#e26a36' }} /> },
    { label: "Uploads", href: "/upload", icon: <CloudUploadIcon sx={{ color: '#e26a36' }} /> },
    { label: "Agents", href: "/users", icon: <PeopleIcon sx={{ color: '#e26a36' }} /> },
  ];

  const router = useRouter();
  useEffect(() => {
    const subscription = userService.user.subscribe((x) => setUser(x));
    return () => subscription.unsubscribe();
  }, []);

  function getPage() {
    let page = router.pathname || "";
    let parts = page.split("/");
    page = parts.length > 3 ? "/" + parts[1] + "/" + parts[2] : page;
    page = page.replace("/", "");
    return titles[page] || "Dashboard - " + userService.userValue?.firstName;
  }

  function isActive(href) {
    return router.asPath === href;
  }

  if (!user) return null;

  const drawerContent = (
    <Box sx={{ width: drawerWidth }}>
      <List>
        <ListItem sx={{ justifyContent: 'center' }}>
          <Typography variant="h6" color="primary">
            <i className={icon}></i>&nbsp;Ticket Manager
          </Typography>
        </ListItem>
        <Divider />
        {navMap.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isActive(item.href)}
            onClick={() => setDrawerOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <Divider />
        <ListItemButton onClick={userService.logout}>
          <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
      <Typography variant="caption" sx={{ position: 'absolute', bottom: 8, right: 8, color: 'text.secondary' }}>
        v{config?.publicRuntimeConfig?.version || '1.0.0' }
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="nav" aria-label="navigation sidebar">
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: 'block' }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          ml: 0,
          transition: 'margin 0.3s, width 0.3s',
        }}
      >
        <AppBar position="fixed" elevation={3} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#e26a36' }}>
          <Toolbar sx={{ minHeight: 56 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ mr: 2, display: 'block' }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {icon}&nbsp;&nbsp;Ticket Manager
            </Typography>
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
              {getPage()}
            </Typography>
            <Button
              color="error"
              onClick={userService.logout}
              startIcon={<LogoutIcon />}
            >
            </Button>
          </Toolbar>
        </AppBar>
        <Toolbar />
      </Box>
    </Box>
  );
}
