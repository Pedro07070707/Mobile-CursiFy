import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { CourseCard } from "./CourseCard";
import { useTheme } from "../contexts/ThemeContext";
import { Course, CourseLevel } from "../types";

interface TeacherScreenProps {
  canManage: boolean;
  title: string; setTitle: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  pedagogyDescription: string; setPedagogyDescription: (v: string) => void;
  lessonsCount: string; setLessonsCount: (v: string) => void;
  estimatedHours: string; setEstimatedHours: (v: string) => void;
  level: CourseLevel; setLevel: (v: CourseLevel) => void;
  loading: boolean;
  onCreateCourse: () => void;
  courses: Course[];
  onOpenCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

const levels: CourseLevel[] = ["beginner", "intermediate", "advanced"];

export function TeacherScreen(props: TeacherScreenProps) {
  const { theme } = useTheme();
  if (!props.canManage) return <View style={[styles.container, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, gap: theme.spacing.s }]}><Text style={{ fontSize: theme.typography.h2, color: theme.colors.textMain, fontWeight: "700" }}>Área de professor</Text><Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body }}>Este perfil não tem permissão para criar cursos.</Text></View>;
  return <FlatList style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl }} data={props.courses} keyExtractor={(item) => item.course_id} ListHeaderComponent={<View style={{ borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: theme.spacing.m, marginBottom: theme.spacing.l }}><Text style={{ color: theme.colors.textMain, fontSize: theme.typography.h2, fontWeight: "700" }}>Criar novo curso</Text><Text style={{ marginTop: theme.spacing.s, marginBottom: theme.spacing.m, color: theme.colors.textMuted, fontSize: theme.typography.body }}>Preencha os dados pedagógicos para publicar no catálogo.</Text><AppInput label="Título" value={props.title} onChangeText={props.setTitle} testID="teacher-title" /><AppInput label="Categoria" value={props.category} onChangeText={props.setCategory} testID="teacher-category" /><AppInput label="Descrição" value={props.description} onChangeText={props.setDescription} testID="teacher-description" /><AppInput label="Descrição pedagógica" value={props.pedagogyDescription} onChangeText={props.setPedagogyDescription} testID="teacher-pedagogy" /><View style={{ gap: theme.spacing.s }}><AppInput label="Aulas" keyboardType="numeric" value={props.lessonsCount} onChangeText={props.setLessonsCount} testID="teacher-lessons" /><AppInput label="Horas" keyboardType="numeric" value={props.estimatedHours} onChangeText={props.setEstimatedHours} testID="teacher-hours" /></View><Text style={{ marginBottom: theme.spacing.s, color: theme.colors.textMain, fontWeight: "600", fontSize: theme.typography.small }}>Nível</Text><View style={{ flexDirection: "row", gap: theme.spacing.s, marginBottom: theme.spacing.m, flexWrap: "wrap" }}>{levels.map((item) => <AppButton key={item} label={item === "beginner" ? "Iniciante" : item === "intermediate" ? "Intermediário" : "Avançado"} variant={props.level === item ? "primary" : "outline"} onPress={() => props.setLevel(item)} style={{ minWidth: 100 }} testID={`teacher-level-${item}`} />)}</View><AppButton label="Publicar curso" onPress={props.onCreateCourse} loading={props.loading} testID="teacher-submit" /></View>} renderItem={({ item }) => <View style={{ gap: theme.spacing.s }}><CourseCard course={item} onPress={() => props.onOpenCourse(item)} /><AppButton label="Excluir" variant="outline" style={{ marginHorizontal: theme.spacing.s, marginBottom: theme.spacing.s, borderColor: theme.colors.error }} onPress={() => Alert.alert("Excluir curso", `Deseja excluir "${item.title}"?`, [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => props.onDeleteCourse(item.course_id) }])} testID={`delete-course-${item.course_id}`} /></View>} ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, marginTop: theme.spacing.l }}>Você ainda não criou cursos.</Text>} />;
}

const styles = StyleSheet.create({ container: { flex: 1 } });

