import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { useTheme } from "../contexts/ThemeContext";

const cursifyLogo = require("../../assets/images/logopreta.jpg");

interface AuthScreenProps {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onLogin: () => void;
  onLoginWithCredentials: (email: string, password: string) => void;
  onRegisterWithCredentials: (name: string, email: string, password: string) => void;
  loading: boolean;
  feedback: string;
}

export function AuthScreen(props: AuthScreenProps) {
  const { theme } = useTheme();
  const {
    mode,
    setMode,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    onLoginWithCredentials,
    onRegisterWithCredentials,
    loading,
    feedback,
  } = props;

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleRegister = async () => {
    setRegisterError("");
    if (registerName.trim().length < 3) return setRegisterError("Informe um nome valido.");
    if (!registerEmail.includes("@")) return setRegisterError("Informe um e-mail valido.");
    if (registerPassword.length < 8) return setRegisterError("A senha deve ter ao menos 8 caracteres.");
    setRegisterLoading(true);
    try {
      await onRegisterWithCredentials(registerName.trim(), registerEmail.trim(), registerPassword);
    } catch (error: unknown) {
      setRegisterError(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.l }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerBlock, { marginBottom: theme.spacing.l, alignItems: "center", gap: theme.spacing.s }]}>
          <Image source={cursifyLogo} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: theme.spacing.s, borderWidth: 2, borderColor: "#326791" }} />
          <Text style={{ fontSize: theme.typography.h1, fontWeight: "800", color: theme.colors.textMain }}>CursiFy Mobile</Text>
          <Text style={{ fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: 24 }}>Trilhas gamificadas e chat entre usuarios.</Text>
        </View>

        <View style={[styles.modeSwitch, { gap: theme.spacing.s, marginBottom: theme.spacing.l }]}>
          <AppButton label="Entrar" variant={mode === "login" ? "primary" : "secondary"} onPress={() => setMode("login")} style={styles.halfButton} testID="auth-mode-login" />
          <AppButton label="Criar conta" variant={mode === "register" ? "primary" : "secondary"} onPress={() => setMode("register")} style={styles.halfButton} testID="auth-mode-register" />
        </View>

        {mode === "login" ? (
          <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}>
            <AppInput
              label="E-mail"
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginEmail}
              onChangeText={setLoginEmail}
              testID="login-email"
            />
            <AppInput
              label="Senha"
              placeholder="******"
              secureTextEntry
              value={loginPassword}
              onChangeText={setLoginPassword}
              testID="login-password"
            />
            <AppButton label="Acessar" onPress={() => onLoginWithCredentials(loginEmail, loginPassword)} loading={loading} testID="login-submit" />
          </View>
        ) : (
          <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}>
            <AppInput label="Nome" placeholder="Seu nome no app" value={registerName} onChangeText={setRegisterName} testID="register-name" />
            <AppInput label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={registerEmail} onChangeText={setRegisterEmail} testID="register-email" />
            <AppInput label="Senha" placeholder="8 caracteres ou mais" secureTextEntry value={registerPassword} onChangeText={setRegisterPassword} testID="register-password" />
            <Text style={{ marginBottom: theme.spacing.s, fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.small }}>Perfil do mobile: USUARIO</Text>
            {registerError ? <Text style={{ color: theme.colors.error, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>{registerError}</Text> : null}
            <AppButton label="Cadastrar" onPress={handleRegister} loading={registerLoading} testID="register-submit" />
          </View>
        )}

        {feedback ? <Text style={{ marginTop: theme.spacing.m, color: theme.colors.primary, fontSize: theme.typography.small }}>{feedback}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  headerBlock: {},
  modeSwitch: { flexDirection: "row" },
  halfButton: { flex: 1 },
});
