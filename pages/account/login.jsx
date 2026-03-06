import React, { useState } from "react";
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Alert, Link, Checkbox, FormControlLabel } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { userService } from "services";
import { useRouter } from "next/router";
import NextLink from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await userService.login(email, password);
      router.push("/");
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <Box // Root container with background and flex layout
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundImage: 'url(/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Left Side - Image area (spacer) */}
      <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

      {/* Right Side - Full-height Login Form Panel */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        autoComplete="off"
        sx={{
          width: { xs: '100%', md: 500 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Content wrapper to constrain width and center */}
        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Ticket Manager
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
            Please enter your details to sign in.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, bgcolor: 'transparent', color: 'error.light' }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2, '& .MuiInputBase-root': { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.8)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            value={password}
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2, '& .MuiInputBase-root': { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.8)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass((show) => !show)} size="small" edge="end" sx={{ color: 'white' }}>
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} sx={{ color: 'rgba(255, 255, 255, 0.8)', '&.Mui-checked': { color: 'primary.main' } }} />}
              label={<Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Remember me</Typography>}
            />
          </Box>
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem', mt: 2 }}>
            {loading ? "Logging in..." : "Sign In"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
