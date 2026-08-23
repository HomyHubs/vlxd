import React from "react";
import { useTranslation } from "react-i18next";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ConstructionIcon from "@mui/icons-material/Construction";
import { LoginPage, UserProfileCard, useAuth } from "./features/auth/index.js";

export function AppContent() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <ConstructionIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {t("app.platform_name")}
          </Typography>
          <ButtonGroup variant="outlined" sx={{ bgcolor: "white", borderRadius: 1 }} size="small">
            <Button
              variant={i18n.language === "vi" ? "contained" : "outlined"}
              onClick={() => changeLanguage("vi")}
            >
              {t("actions.lang_vi")}
            </Button>
            <Button
              variant={i18n.language === "en" ? "contained" : "outlined"}
              onClick={() => changeLanguage("en")}
            >
              {t("actions.lang_en")}
            </Button>
          </ButtonGroup>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary.main">
            {t("app.title")}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t("app.tagline")}
          </Typography>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label={`${t("app.status")} ${t("app.baseline_badge")}`}
              color="success"
              variant="outlined"
            />
            <Chip label={`${t("app.version")}: 0.1.0`} variant="outlined" />
          </Box>
        </Paper>

        <UserProfileCard />
      </Container>
    </Box>
  );
}

export function App() {
  return <AppContent />;
}

export default App;
