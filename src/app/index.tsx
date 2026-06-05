/**
 * index.tsx — Ponto de entrada do app CursiFy.
 *
 * Integração com o backend via services (Axios):
 *   - authService    → login, registro, perfil
 *   - courseService  → catálogo, criação, exclusão
 *   - enrollmentService → inscrições do usuário
 *   - adminService   → painel administrativo
 *
 * Sessão persistida no AsyncStorage (chave: cursify_session).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBar } from "../components/BottomTabBar";
import { pickCourseImage } from "../constants/images";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { AdminScreen } from "../components/AdminScreen";
import { AuthScreen } from "../components/AuthScreen";
import { CatalogScreen } from "../components/CatalogScreen";
import { CourseDetailsScreen } from "../components/CourseDetailsScreen";
import { MyCoursesScreen } from "../components/MyCoursesScreen";
import { ProfileScreen } from "../components/ProfileScreen";
import { TeacherScreen } from "../components/TeacherScreen";
import TeacherChatScreen from "../components/TeacherChatScreen";
import StudentTeacherChatScreen from "../components/StudentTeacherChatScreen";
import { ApiError, setAuthToken } from "../services/api";
import adminService from "../services/adminService";
import authService from "../services/authService";
import { chatService } from "../services/chatService";
import courseService from "../services/courseService";
import enrollmentService from "../services/enrollmentService";
import {
  AdminOverview,
  AppTab,
  Course,
  CourseLevel,
  CreateCoursePayload,
  Enrollment,
  UpdateProfilePayload,
  User,
} from "../types";

type AuthMode = "login" | "register";

const SESSION_KEY = "cursify_session";

export default function Index() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("catalog");
  const [chatUnread, setChatUnread] = useState(0);

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState("Desenvolvimento");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCoursePedagogy, setNewCoursePedagogy] = useState("");
  const [newCourseLessons, setNewCourseLessons] = useState("8");
  const [newCourseHours, setNewCourseHours] = useState("4");
  const [newCourseLevel, setNewCourseLevel] = useState<CourseLevel>("beginner");

  const [busy, setBusy] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  // ——— Restaura sessão salva ao abrir o app ——————————————————————————————
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) { setScreenLoading(false); return; }
      try {
        const { token: savedToken, user: savedUser } = JSON.parse(raw) as { token: string; user: User };
        setToken(savedToken);
        setUser(savedUser);
        setAuthToken(savedToken);
        loadInitialData(savedUser).finally(() => setScreenLoading(false));
      } catch {
        setScreenLoading(false);
      }
    });
  }, []);

  // ——— Animação de transição entre abas ——————————————————————————————
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: useNative }).start(() =>
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: useNative }).start()
    );
  }, [activeTab, selectedCourse, fadeAnim]);

  // ——— Polling de não lidas no chat ——————————————————————————————
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const users: User[] = await authService.getAll();
      const others = users.filter((u: User) => u.user_id !== user.user_id);
      const counts = await Promise.all(others.map((u: User) => chatService.getUnreadCount(user.user_id, u.user_id)));
      setChatUnread(counts.reduce((a, b) => a + b, 0));
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (activeTab === "chat") setChatUnread(0);
  }, [activeTab]);

  // ——— Abas dinâmicas por role ——————————————————————————————
  const tabs = useMemo(() => {
    if (!user) return [];
    const base: { key: AppTab; label: string; icon: "home-outline" | "book-outline" | "school-outline" | "shield-checkmark-outline" | "person-outline" | "chatbubbles-outline"; badge?: number }[] = [
      { key: "catalog", label: "Catálogo", icon: "home-outline" },
      { key: "my-courses", label: "Cursos", icon: "book-outline" },
    ];
    if (user.role === "teacher" || user.role === "admin")
      base.push({ key: "teacher", label: "Professor", icon: "school-outline" });
    if (user.role === "admin")
      base.push({ key: "admin", label: "Admin", icon: "shield-checkmark-outline" });
    base.push({ key: "chat", label: "Chat", icon: "chatbubbles-outline", badge: chatUnread || undefined });
    base.push({ key: "profile", label: "Perfil", icon: "person-outline" });
    return base;
  }, [user]);

  // ——— Carrega dados iniciais após login/restauração ————————————————————
  const loadInitialData = async (nextUser: User) => {
    setScreenLoading(true);
    try {
      const [catalog, enrollments, teacher, admin] = await Promise.all([
        courseService.getAll(),
        enrollmentService.getAll(nextUser.user_id),
        nextUser.role === "teacher" || nextUser.role === "admin"
          ? courseService.getProfessorCourses()
          : Promise.resolve([] as Course[]),
        nextUser.role === "admin"
          ? adminService.getAll()
          : Promise.resolve(null as AdminOverview | null),
      ]);
      setCourses(catalog);
      setMyEnrollments(enrollments);
      setTeacherCourses(teacher);
      setAdminOverview(admin);
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  // ——— Tratamento global de erros ——————————————————————————————
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleError = (error: unknown) => {
    if (error instanceof ApiError || error instanceof Error) {
      showFeedback(error.message);
    } else {
      showFeedback("Não foi possível concluir a ação. Tente novamente.");
    }
  };

  // ——— Auth ——————————————————————————————
  const handleLogin = async (email?: string, password?: string) => {
    const emailToUse = email ?? loginEmail.trim();
    const passwordToUse = password ?? loginPassword;
    setBusy(true);
    setFeedback("");
    try {
      const response = await authService.login({ email: emailToUse, password: passwordToUse });
      setToken(response.access_token);
      setUser(response.user);
      setAuthToken(response.access_token);
      setActiveTab("catalog");
      const sessionUser = {
        user_id: response.user.user_id,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        bio: response.user.bio,
        profile_image_base64: response.user.profile_image_base64,
        created_at: response.user.created_at,
        active: response.user.active,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: response.access_token, user: sessionUser }));
      await loadInitialData(response.user);
      showFeedback(`Bem-vindo, ${response.user.username}!`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ——— Cursos ——————————————————————————————
  const handleRefreshCatalog = async () => {
    setScreenLoading(true);
    try {
      setCourses(await courseService.getAll());
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleOpenCourseById = async (courseId: string) => {
    try {
      setSelectedCourse(await courseService.getById(courseId));
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCourse = (course: Course) => handleOpenCourseById(course.course_id);

  const handleCreateCourse = async () => {
    if (!user) return;
    const payload: CreateCoursePayload = {
      title: newCourseTitle.trim(),
      category: newCourseCategory.trim(),
      description: newCourseDescription.trim(),
      pedagogy_description: newCoursePedagogy.trim(),
      lessons_count: Number(newCourseLessons),
      estimated_hours: Number(newCourseHours),
      level: newCourseLevel,
      thumbnail_base64: pickCourseImage(newCourseCategory, newCourseTitle),
    };
    setBusy(true);
    setFeedback("");
    try {
      await courseService.create(payload);
      showFeedback("Curso publicado com sucesso.");
      setNewCourseTitle(""); setNewCourseCategory("Desenvolvimento");
      setNewCourseDescription(""); setNewCoursePedagogy("");
      setNewCourseLessons("8"); setNewCourseHours("4");
      setNewCourseLevel("beginner");
      await loadInitialData(user);
      setActiveTab("catalog");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;
    setBusy(true);
    setFeedback("");
    try {
      await courseService.remove(courseId);
      showFeedback("Curso excluído com sucesso.");
      await loadInitialData(user);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ——— Inscrição ——————————————————————————————
  const handleEnroll = async () => {
    if (!selectedCourse || !user) return;
    setBusy(true);
    setFeedback("");
    try {
      await enrollmentService.create(user.user_id, selectedCourse.course_id);
      await loadInitialData(user);
      setSelectedCourse(await courseService.getById(selectedCourse.course_id));
      setActiveTab("my-courses");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ——— Perfil ——————————————————————————————
  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    if (!token) return;
    setBusy(true);
    setFeedback("");
    try {
      const updated = await authService.update(payload);
      setUser(updated);
      const updatedUser = {
        user_id: updated.user_id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        bio: updated.bio,
        profile_image_base64: updated.profile_image_base64,
        created_at: updated.created_at,
        active: updated.active,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: updatedUser }));
      setAuthToken(token);
      showFeedback("Perfil atualizado com sucesso.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setToken(""); setUser(null); setCourses([]); setSelectedCourse(null);
    setMyEnrollments([]); setTeacherCourses([]); setAdminOverview(null);
    showFeedback("Sessão encerrada com segurança.");
    setAuthMode("login");
  };

  // ——— Render ——————————————————————————————
  const renderMainArea = () => {
    if (!user) return null;

    if (selectedCourse)
      return (
        <CourseDetailsScreen
          course={selectedCourse}
          canEnroll={user.role === "student" || user.role === "admin"}
          loading={busy}
          onBack={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      );

    if (activeTab === "catalog")
      return (
        <CatalogScreen
          courses={courses}
          loading={screenLoading}
          onOpenCourse={handleOpenCourse}
          onRefresh={handleRefreshCatalog}
        />
      );

    if (activeTab === "my-courses")
      return <MyCoursesScreen enrollments={myEnrollments} onOpenCourse={handleOpenCourseById} />;

    if (activeTab === "teacher")
      return (
        <TeacherScreen
          canManage={user.role === "teacher" || user.role === "admin"}
          title={newCourseTitle} setTitle={setNewCourseTitle}
          category={newCourseCategory} setCategory={setNewCourseCategory}
          description={newCourseDescription} setDescription={setNewCourseDescription}
          pedagogyDescription={newCoursePedagogy} setPedagogyDescription={setNewCoursePedagogy}
          lessonsCount={newCourseLessons} setLessonsCount={setNewCourseLessons}
          estimatedHours={newCourseHours} setEstimatedHours={setNewCourseHours}
          level={newCourseLevel} setLevel={setNewCourseLevel}
          loading={busy}
          onCreateCourse={handleCreateCourse}
          courses={teacherCourses}
          onOpenCourse={handleOpenCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      );

    if (activeTab === "admin")
      return <AdminScreen isAdmin={user.role === "admin"} data={adminOverview} />;

    if (activeTab === "chat")
      return user.role === "teacher" || user.role === "admin"
        ? <TeacherChatScreen userName={user.username} />
        : <StudentTeacherChatScreen userName={user.username} />;

    return (
      <ProfileScreen
        user={user}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        loading={busy}
        feedback={feedback}
      />
    );
  };

  // Tela de loading inicial (restauração de sessão)
  if (screenLoading && !user)
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!token || !user ? (
        <AuthScreen
          mode={authMode} setMode={setAuthMode}
          loginEmail={loginEmail} setLoginEmail={setLoginEmail}
          loginPassword={loginPassword} setLoginPassword={setLoginPassword}
          onLogin={handleLogin}
          onLoginWithCredentials={(email, password) => handleLogin(email, password)}
          loading={busy} feedback={feedback}
        />
      ) : (
        <View style={styles.flex}>
          <LinearGradient
            colors={["#0EA5E9", "#10B981", "#22C55E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomWidth: 1, borderBottomColor: "#0EA5E9", paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.m }]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerSide} />
              <View style={styles.headerCenter}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Text style={[styles.appName, { color: "#ffffff" }]}>CursiFy</Text>
                  <Image source={require("../../assets/images/logopreta.jpg")} style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: "#0EA5E9", backgroundColor: "#0EA5E9" }} />
                </View>
              </View>
              <View style={styles.headerSide} />
            </View>
          </LinearGradient>

          {screenLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted, fontSize: theme.typography.body }]}>Sincronizando dados...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
              {renderMainArea()}
            </Animated.View>
          )}

          {feedback ? <Text style={[styles.feedback, { color: theme.colors.primary, fontSize: theme.typography.small, backgroundColor: theme.colors.feedbackBg }]}>{feedback}</Text> : null}

          {!selectedCourse && (
            <BottomTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerSide: { width: 38, alignItems: "flex-end" },
  appName: { fontSize: 28, fontWeight: "800" },
  userHint: { textAlign: "center" },
  themeToggle: { padding: 8 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: {},
  feedback: { paddingHorizontal: 24, paddingVertical: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
