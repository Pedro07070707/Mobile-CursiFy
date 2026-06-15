import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { pickCourseImage } from "../constants/images";
import { useTheme } from "../contexts/ThemeContext";
import { Course } from "../types";

type Lesson = {
  id: number;
  titulo: string;
  subtitulo?: string;
  conteudo?: string;
  link?: string;
  status?: string;
  tipo?: string;
  duracao?: number;
};

type Module = {
  id: number;
  titulo: string;
  aulas: Lesson[];
};

interface CourseDetailsScreenProps {
  course: Course & { matriculado?: boolean; modulos?: Module[] };
  canEnroll: boolean;
  loading: boolean;
  onBack: () => void;
  onEnroll: () => void;
  onOpenLesson: (lessonId: number) => void;
}

export function CourseDetailsScreen({ course, canEnroll, loading, onBack, onEnroll, onOpenLesson }: CourseDetailsScreenProps) {
  const { theme } = useTheme();
  const imageUri = course.thumbnail_base64 || pickCourseImage(course.category, course.title);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl }}
    >
      <Image
        source={{ uri: imageUri }}
        style={[styles.hero, { borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceHighlight, marginBottom: theme.spacing.m }]}
      />
      <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: theme.typography.small }}>{course.category}</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMain, fontSize: theme.typography.h2, fontWeight: "800" }}>{course.title}</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small }}>Professor: {course.teacher_name}</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small }}>{course.lessons_count} aulas • {course.estimated_hours}h</Text>

      {[{ title: "Descrição do curso", text: course.description }, { title: "Descrição pedagógica", text: course.pedagogy_description }].map((block) => (
        <View
          key={block.title}
          style={{ marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}
        >
          <Text style={{ fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>{block.title}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, lineHeight: 24 }}>{block.text}</Text>
        </View>
      ))}

      <View style={[styles.actions, { marginTop: theme.spacing.l, gap: theme.spacing.s }]}>
        <AppButton label="Voltar" variant="secondary" onPress={onBack} style={styles.half} testID="course-back" />
        {canEnroll && <AppButton label="Inscrever-se" onPress={onEnroll} loading={loading} style={styles.half} testID="course-enroll" />}
      </View>

      <View style={{ marginTop: theme.spacing.l, gap: theme.spacing.m }}>
        {(course.modulos || []).map((module) => (
          <View key={module.id} style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
            <Text style={{ fontWeight: "800", color: theme.colors.textMain }}>{module.titulo}</Text>
            {module.aulas.map((lesson) => (
              <Pressable
                key={lesson.id}
                onPress={() => onOpenLesson(lesson.id)}
                style={{ marginTop: theme.spacing.s, padding: theme.spacing.m, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
              >
                <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{lesson.titulo}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                  {lesson.subtitulo || lesson.status || "Aula"} {lesson.duracao ? `• ${lesson.duracao} min` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: "100%", height: 210 },
  actions: { flexDirection: "row" },
  half: { flex: 1 },
});
