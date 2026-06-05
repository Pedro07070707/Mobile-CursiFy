import { FlatList, StyleSheet, Text, View } from "react-native";
import { CourseCard } from "./CourseCard";
import { useTheme } from "../contexts/ThemeContext";
import { Enrollment } from "../types";
interface MyCoursesScreenProps { enrollments: Enrollment[]; onOpenCourse: (courseId: string) => void; }
export function MyCoursesScreen({ enrollments, onOpenCourse }: MyCoursesScreenProps) {
  const { theme } = useTheme();
  return <View style={[styles.container, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l }]}><Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>Meus cursos</Text><Text style={{ marginTop: theme.spacing.s, marginBottom: theme.spacing.l, fontSize: theme.typography.body, color: theme.colors.textMuted }}>Acesse rapidamente os cursos onde você já está inscrito.</Text><FlatList data={enrollments} keyExtractor={(item) => item.enrollment_id} renderItem={({ item }) => <CourseCard course={item.course} onPress={() => onOpenCourse(item.course.course_id)} />} contentContainerStyle={{ paddingBottom: theme.spacing.xxl }} ListEmptyComponent={<Text style={{ marginTop: theme.spacing.xl, color: theme.colors.textMuted, fontSize: theme.typography.body }}>Você ainda não possui inscrições ativas.</Text>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1 } });

