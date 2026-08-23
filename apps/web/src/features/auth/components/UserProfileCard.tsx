import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../context/auth-context.js";

export function UserProfileCard() {
  const { t } = useTranslation("auth");
  const { user, tenant, isOwner, titles, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user || !tenant) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Ignore or log error, state reset handled by auth provider
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Card elevation={2} sx={{ maxWidth: 600, mx: "auto", mt: 4, borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <AccountCircleIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h2" fontWeight={700}>
              {user.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          {isOwner && (
            <Chip
              icon={<VerifiedUserIcon />}
              label={t("role_owner")}
              color="primary"
              variant="filled"
              size="small"
            />
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {t("tenant_label")}:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {tenant.name} ({tenant.code})
            </Typography>
          </Box>

          {titles.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {titles.map((title) => (
                <Chip
                  key={title.id}
                  label={title.name}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ))}
            </Box>
          )}
        </Stack>

        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={handleLogout}
          disabled={isLoggingOut}
          startIcon={isLoggingOut ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />}
          sx={{ mt: 2, py: 1 }}
        >
          {isLoggingOut ? t("logging_out") : t("logout_btn")}
        </Button>
      </CardContent>
    </Card>
  );
}
