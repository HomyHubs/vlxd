import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { LoginRequestSchema } from "@vlxd/shared";
import { useAuth } from "../context/auth-context.js";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation("auth");
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const parseResult = LoginRequestSchema.safeParse({
      email: email.trim(),
      password,
      tenantCode: tenantCode.trim() || undefined,
    });

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName === "email") {
          errors.email = email.trim() ? t("errors.email_invalid") : t("errors.email_required");
        } else if (fieldName === "password") {
          errors.password = password ? t("errors.password_min") : t("errors.password_required");
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
        tenantCode: tenantCode.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj.code;

      if (code && typeof code === "string") {
        const translationKey = `errors.${code}`;
        const translated = t(translationKey);
        if (translated && translated !== translationKey) {
          setErrorMessage(translated);
        } else {
          setErrorMessage(errorObj.message || t("errors.GENERIC"));
        }
      } else {
        setErrorMessage(errorObj.message || t("errors.GENERIC"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="login-email-input"
        label={t("email")}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        error={Boolean(fieldErrors.email)}
        helperText={fieldErrors.email}
        placeholder={t("email_placeholder")}
        disabled={isSubmitting}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t("password")}
        type="password"
        id="login-password-input"
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={Boolean(fieldErrors.password)}
        helperText={fieldErrors.password}
        placeholder={t("password_placeholder")}
        disabled={isSubmitting}
      />

      <TextField
        margin="normal"
        fullWidth
        name="tenantCode"
        label={t("tenant_code")}
        id="login-tenant-code-input"
        value={tenantCode}
        onChange={(e) => setTenantCode(e.target.value)}
        placeholder={t("tenant_code_placeholder")}
        helperText={t("tenant_code_helper")}
        disabled={isSubmitting}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
        sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 700 }}
      >
        {isSubmitting ? t("submitting_btn") : t("submit_btn")}
      </Button>
    </Box>
  );
}
