import { useState } from "react";
import { KeyboardAvoidingView, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { useTheme } from "../contexts/ThemeContext";
import authService from "../services/authService";
import { UserRole } from "../types";

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
  loading: boolean;
  feedback: string;
}

function validatePassword(password: string): boolean { return /[a-zA-Z]/.test(password) && /\d/.test(password) && password.length >= 8 && password.length <= 20; }

export function AuthScreen(props: AuthScreenProps) {
  const { theme } = useTheme();
  const { mode, setMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, onLoginWithCredentials, loading, feedback } = props;
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerBio, setRegisterBio] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [loginEmailValue, setLoginEmailValue] = useState(loginEmail);
  const [loginPasswordValue, setLoginPasswordValue] = useState(loginPassword);
  const roleOptions: UserRole[] = ["student"];
  const handleRegister = async () => {
    setRegisterError("");
    if (!validatePassword(registerPassword)) return setRegisterError("A senha deve ter entre 8 e 20 caracteres, incluindo letras e números.");
    if (registerRole !== "student" && registerBio.trim().length < 3) return setRegisterError("Professores e admins precisam preencher a bio.");
    const emailToLogin = registerEmail.trim();
    const passwordToLogin = registerPassword;
    setRegisterLoading(true);
    try {
      await authService.create({ username: registerName.trim(), email: emailToLogin, password: passwordToLogin, role: registerRole, bio: registerBio.trim(), profile_image_base64: "" });
      setRegisterName(""); setRegisterEmail(""); setRegisterPassword(""); setRegisterBio(""); setRegisterRole("student");
      onLoginWithCredentials(emailToLogin, passwordToLogin);
    } catch (error: unknown) { setRegisterError(error instanceof Error ? error.message : "Erro ao cadastrar."); } finally { setRegisterLoading(false); }
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.l }]} keyboardShouldPersistTaps="handled"><View style={[styles.headerBlock, { marginBottom: theme.spacing.l, alignItems: "center", gap: theme.spacing.s }]}><Image source={cursifyLogo} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: theme.spacing.s, borderWidth: 2, borderColor: "#326791" }} /><Text style={{ fontSize: theme.typography.h1, fontWeight: "800", color: theme.colors.textMain }}>CursiFy Mobile</Text><Text style={{ fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: 24 }}>Aprenda, ensine e administre em um só app.</Text></View><View style={[styles.modeSwitch, { gap: theme.spacing.s, marginBottom: theme.spacing.l }]}><AppButton label="Entrar" variant={mode === "login" ? "primary" : "secondary"} onPress={() => setMode("login")} style={styles.halfButton} testID="auth-mode-login" /><AppButton label="Criar conta" variant={mode === "register" ? "primary" : "secondary"} onPress={() => setMode("register")} style={styles.halfButton} testID="auth-mode-register" /></View>{mode === "login" ? <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}><AppInput label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={loginEmailValue} onChangeText={(v) => { setLoginEmailValue(v); setLoginEmail(v); }} testID="login-email" /><AppInput label="Senha" placeholder="******" secureTextEntry value={loginPasswordValue} onChangeText={(v) => { setLoginPasswordValue(v); setLoginPassword(v); }} testID="login-password" /><AppButton label="Acessar" onPress={() => onLoginWithCredentials(loginEmailValue, loginPasswordValue)} loading={loading} testID="login-submit" /></View> : <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}><AppInput label="Nome" placeholder="Seu nome no app" value={registerName} onChangeText={setRegisterName} testID="register-name" /><AppInput label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={registerEmail} onChangeText={setRegisterEmail} testID="register-email" /><AppInput label="Senha" placeholder="8 a 20 caracteres, letras e números" secureTextEntry value={registerPassword} onChangeText={setRegisterPassword} testID="register-password" /><Text style={{ marginBottom: theme.spacing.s, fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.small }}>Perfil</Text><View style={[styles.rolesRow, { gap: theme.spacing.s, marginBottom: theme.spacing.m }]}>{roleOptions.map((role) => <AppButton key={role} label={role === "student" ? "Aluno" : role === "teacher" ? "Professor" : "Admin"} onPress={() => setRegisterRole(role)} variant={registerRole === role ? "primary" : "outline"} style={styles.roleButton} testID={`register-role-${role}`} />)}</View><AppInput label="Bio (obrigatória para professor/admin)" placeholder="Fale um pouco sobre você" value={registerBio} onChangeText={setRegisterBio} testID="register-bio" />{registerError ? <Text style={{ color: theme.colors.error, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>{registerError}</Text> : null}<AppButton label="Cadastrar" onPress={handleRegister} loading={registerLoading} testID="register-submit" /></View>}{feedback ? <Text style={{ marginTop: theme.spacing.m, color: theme.colors.primary, fontSize: theme.typography.small }}>{feedback}</Text> : null}</ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { flexGrow: 1 }, headerBlock: {}, modeSwitch: { flexDirection: "row" }, halfButton: { flex: 1 }, rolesRow: { flexDirection: "row", flexWrap: "wrap" }, roleButton: { minWidth: 90 } });

