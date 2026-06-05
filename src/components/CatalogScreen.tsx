import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { CourseCard } from "./CourseCard";
import { useTheme } from "../contexts/ThemeContext";
import { Course } from "../types";
interface CatalogScreenProps { courses: Course[]; loading: boolean; onOpenCourse: (course: Course) => void; onRefresh: () => void; }
export function CatalogScreen({ courses, loading, onOpenCourse, onRefresh }: CatalogScreenProps) {
  const { theme } = useTheme();
  return <View style={[styles.container, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l }]}><Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>Catálogo de cursos</Text><Text style={{ marginTop: theme.spacing.s, marginBottom: theme.spacing.l, fontSize: theme.typography.body, color: theme.colors.textMuted }}>Escolha um curso e veja todos os detalhes antes da inscrição.</Text><FlatList data={courses} keyExtractor={(item) => item.course_id} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />} renderItem={({ item }) => <CourseCard course={item} onPress={() => onOpenCourse(item)} />} contentContainerStyle={{ paddingBottom: theme.spacing.xxl }} ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontSize: theme.typography.body }}>Ainda não há cursos cadastrados.</Text>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1 } });

