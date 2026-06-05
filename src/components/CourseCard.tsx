import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { pickCourseImage } from "../constants/images";
import { useTheme } from "../contexts/ThemeContext";
import { Course } from "../types";

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const { theme } = useTheme();
  const imageUri = course.thumbnail_base64 || pickCourseImage(course.category, course.title);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir curso ${course.title}`}
      testID={`course-card-${course.course_id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          borderRadius: theme.radius.lg,
          marginBottom: theme.spacing.m,
        },
        pressed && styles.pressed,
      ]}
    >
      <Image source={{ uri: imageUri }} style={[styles.banner, { backgroundColor: theme.colors.surfaceHighlight }]} />
      <View style={[styles.content, { gap: theme.spacing.s, padding: theme.spacing.m }]}>
        <Text style={[styles.category, { color: theme.colors.primary, fontSize: theme.typography.small }]}>
          {course.category}
        </Text>
        <Text style={[styles.title, { color: theme.colors.textMain }]}>{course.title}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: theme.typography.small }]}>
          {course.teacher_name}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: theme.typography.small }]}>
          {course.lessons_count} aulas â€¢ {course.estimated_hours}h â€¢ {course.enrolled_count} inscritos
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderWidth: 1 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  banner: { width: "100%", height: 130 },
  content: {},
  category: { fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700" },
  meta: {},
});

