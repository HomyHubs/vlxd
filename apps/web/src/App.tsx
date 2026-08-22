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
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ConstructionIcon from "@mui/icons-material/Construction";

export function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <ConstructionIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            VLXD Platform
          </Typography>
          <ButtonGroup variant="outlined" sx={{ bgcolor: "white", borderRadius: 1 }} size="small">
            <Button
              variant={i18n.language === "vi" ? "contained" : "outlined"}
              onClick={() => changeLanguage("vi")}
            >
              Tiếng Việt
            </Button>
            <Button
              variant={i18n.language === "en" ? "contained" : "outlined"}
              onClick={() => changeLanguage("en")}
            >
              English
            </Button>
          </ButtonGroup>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary.main">
            {t("app.title")}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t("app.tagline")}
          </Typography>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
            <Chip
              icon={<CheckCircleOutlineIcon />}
              label={`${t("app.status")} (M0 Baseline)`}
              color="success"
              variant="outlined"
            />
            <Chip label={`${t("app.version")}: 0.1.0`} variant="outlined" />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
