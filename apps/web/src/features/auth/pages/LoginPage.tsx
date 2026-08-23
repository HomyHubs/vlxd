import React from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ConstructionIcon from "@mui/icons-material/Construction";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoginForm } from "../components/LoginForm.js";

export function LoginPage() {
  const { t, i18n } = useTranslation(["auth", "common"]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Top Bar with Language Switcher */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ConstructionIcon color="primary" />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {t("common:app.platform_name")}
          </Typography>
        </Stack>
        <ButtonGroup variant="outlined" size="small" sx={{ bgcolor: "white", borderRadius: 1 }}>
          <Button
            variant={i18n.language === "vi" ? "contained" : "outlined"}
            onClick={() => changeLanguage("vi")}
          >
            {t("common:actions.lang_vi")}
          </Button>
          <Button
            variant={i18n.language === "en" ? "contained" : "outlined"}
            onClick={() => changeLanguage("en")}
          >
            {t("common:actions.lang_en")}
          </Button>
        </ButtonGroup>
      </Box>

      {/* Centered Login Card */}
      <Container maxWidth="sm" sx={{ flexGrow: 1, display: "flex", alignItems: "center", py: 4 }}>
        <Card
          elevation={3}
          sx={{
            width: "100%",
            borderRadius: 3,
            p: { xs: 2, sm: 3 },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 52, height: 52 }}>
                <LockOutlinedIcon fontSize="medium" />
              </Avatar>
              <Typography component="h1" variant="h5" fontWeight={700} textAlign="center">
                {t("auth:title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ mt: 0.5 }}
              >
                {t("auth:subtitle")}
              </Typography>
            </Box>

            <LoginForm />
          </CardContent>
        </Card>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="caption">
          {t("common:app.platform_name")} • {t("common:app.version")}: 0.1.0{" "}
          {t("common:app.baseline_badge")}
        </Typography>
      </Box>
    </Box>
  );
}
