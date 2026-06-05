import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import adminService from "../services/adminService";
import courseService from "../services/courseService";
import { AdminOverview, Course, User } from "../types";

type AdminView = "dashboard" | "courses" | "users";

interface AdminScreenProps {
  isAdmin: boolean;
  data: AdminOverview | null;
}

function Dashboard({ data, onNavigate }: { data: AdminOverview | null; onNavigate: (v: AdminView) => void }) {
  const { theme } = useTheme();
  const stats = data ? [
    { label: "Usuários", value: data.users_total },
    { label: "Alunos", value: data.students_total },
    { label: "Professores", value: data.teachers_total },
    { label: "Admins", value: data.admins_total },
    { label: "Cursos", value: data.courses_total },
    { label: "Inscrições", value: data.enrollments_total },
  ] : [];
  const navButtons: { view: AdminView; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
    { view: "courses", icon: "book-outline", label: "Gerenciar Cursos", desc: "Visualize e exclua cursos da plataforma" },
    { view: "users", icon: "people-outline", label: "Gerenciar Usuários", desc: "Ative ou inative contas de usuários" },
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl }}>
      <Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>Painel administrativo</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.body }}>Visão geral da plataforma</Text>
      {data && <View style={{ marginTop: theme.spacing.l, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.s }}>{stats.map((s) => <View key={s.label} style={{ width: "48%", borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: theme.spacing.m, minHeight: 88, justifyContent: "center" }}><Text style={{ fontSize: 26, fontWeight: "800", color: theme.colors.primary }}>{s.value}</Text><Text style={{ marginTop: 4, color: theme.colors.textMuted, fontSize: theme.typography.small }}>{s.label}</Text></View>)}</View>}
      <Text style={{ marginTop: theme.spacing.l, marginBottom: theme.spacing.m, fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain }}>Ações rápidas</Text>
      {navButtons.map((btn) => (
        <Pressable key={btn.view} onPress={() => onNavigate(btn.view)} style={({ pressed }) => [styles.navCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg, marginBottom: theme.spacing.m }, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.activeTabBg }]}><Ionicons name={btn.icon} size={24} color={theme.colors.primary} /></View>
          <View style={{ flex: 1 }}><Text style={{ fontWeight: "700", fontSize: theme.typography.body, color: theme.colors.textMain }}>{btn.label}</Text><Text style={{ marginTop: 2, fontSize: theme.typography.small, color: theme.colors.textMuted }}>{btn.desc}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CoursesPanel({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => { courseService.getAll().then(setCourses).finally(() => setLoading(false)); }, []);
  const handleDelete = (course: Course) => Alert.alert("Excluir curso", `Deseja excluir "${course.title}"?`, [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: async () => { setDeletingId(course.course_id); try { await courseService.remove(course.course_id); setCourses((prev) => prev.filter((c) => c.course_id !== course.course_id)); } finally { setDeletingId(null); } } }]);
  return <View style={[styles.subScreen, { backgroundColor: theme.colors.background }]}><SubHeader title="Cursos" count={courses.length} onBack={onBack} />{loading ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} /> : <FlatList data={courses} keyExtractor={(item) => item.course_id} contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingBottom: theme.spacing.xxl }} ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontSize: theme.typography.body }}>Nenhum curso encontrado.</Text>} renderItem={({ item }) => <View style={[styles.row, { borderBottomColor: theme.colors.border }]}><View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceHighlight }]}><Ionicons name="book-outline" size={18} color={theme.colors.primary} /></View><View style={{ flex: 1, marginRight: theme.spacing.m }}><Text style={{ fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.body }} numberOfLines={1}>{item.title}</Text><Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 2 }}>{item.category} • {item.teacher_name}</Text></View><TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error }]} onPress={() => handleDelete(item)} disabled={deletingId === item.course_id}>{deletingId === item.course_id ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="trash-outline" size={16} color="#fff" />}</TouchableOpacity></View>} />}</View>;
}

function UsersPanel({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  useEffect(() => { adminService.getUsers().then(setUsers).finally(() => setLoading(false)); }, []);
  const handleToggle = async (user: User) => { setTogglingId(user.user_id); try { const updated = await adminService.setUserStatus(user.user_id, !user.active); setUsers((prev) => prev.map((u) => u.user_id === updated.user_id ? updated : u)); } finally { setTogglingId(null); } };
  const roleIcon: Record<string, keyof typeof Ionicons.glyphMap> = { student: "person-outline", teacher: "school-outline", admin: "shield-checkmark-outline" };
  return <View style={[styles.subScreen, { backgroundColor: theme.colors.background }]}><SubHeader title="Usuários" count={users.length} onBack={onBack} />{loading ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} /> : <FlatList data={users} keyExtractor={(item) => item.user_id} contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingBottom: theme.spacing.xxl }} ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontSize: theme.typography.body }}>Nenhum usuário encontrado.</Text>} renderItem={({ item }) => <View style={[styles.row, { borderBottomColor: theme.colors.border }]}><View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceHighlight }]}><Ionicons name={roleIcon[item.role] ?? "person-outline"} size={18} color={theme.colors.primary} /></View><View style={{ flex: 1, marginRight: theme.spacing.m }}><Text style={{ fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.body }}>{item.username}</Text><Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 2 }}>{item.email} • {item.role}</Text></View><TouchableOpacity style={[styles.actionBtn, { backgroundColor: item.active ? theme.colors.error : theme.colors.success }]} onPress={() => handleToggle(item)} disabled={togglingId === item.user_id}>{togglingId === item.user_id ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name={item.active ? "close-outline" : "checkmark-outline"} size={16} color="#fff" />}</TouchableOpacity></View>} />}</View>;
}

function SubHeader({ title, count, onBack }: { title: string; count: number; onBack: () => void }) {
  const { theme } = useTheme();
  return <View style={[styles.subHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l }]}><Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Voltar"><Ionicons name="arrow-back" size={22} color={theme.colors.primary} /></Pressable><Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>{title}</Text><View style={[styles.badge, { backgroundColor: theme.colors.activeTabBg }]}><Text style={{ fontSize: theme.typography.small, fontWeight: "700", color: theme.colors.primary }}>{count}</Text></View></View>;
}

export function AdminScreen({ isAdmin, data }: AdminScreenProps) {
  const { theme } = useTheme();
  const [view, setView] = useState<AdminView>("dashboard");
  if (!isAdmin) return <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l }}><Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>Área administrativa</Text><Text style={{ marginTop: theme.spacing.s, fontSize: theme.typography.body, color: theme.colors.textMuted }}>Somente usuários admin podem visualizar esta área.</Text></View>;
  if (view === "courses") return <CoursesPanel onBack={() => setView("dashboard")} />;
  if (view === "users") return <UsersPanel onBack={() => setView("dashboard")} />;
  return <Dashboard data={data} onNavigate={setView} />;
}

const styles = StyleSheet.create({
  subScreen: { flex: 1 },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  navCard: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});

