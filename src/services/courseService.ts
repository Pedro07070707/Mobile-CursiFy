import { api } from "./api";
import { Course, CreateCoursePayload } from "../types";

interface BackendCourse {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  cargaHoraria: number;
  dataCriacao: string;
  statusCurso: string | boolean;
}

interface BackendCourseDetail {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  cargaHoraria: number;
  statusCurso: string;
  matriculado: boolean;
  modulos: Array<{
    id: number;
    titulo: string;
    aulas: Array<{
      id: number;
      titulo: string;
      subtitulo?: string;
      conteudo?: string;
      link?: string;
      status?: string;
      tipo?: string;
      duracao?: number;
    }>;
  }>;
}

function isCourseActive(status: BackendCourse["statusCurso"]) {
  return status === true || status === "Ativo";
}

function normalizeLevel(category: string): Course["level"] {
  if (category?.includes("MEDIO")) return "intermediate";
  return "beginner";
}

function mapCourse(course: BackendCourse): Course {
  return {
    course_id: String(course.id),
    teacher_id: "",
    teacher_name: "Professor CursiFy",
    title: course.nome,
    category: course.categoria,
    description: course.descricao,
    pedagogy_description: course.descricao,
    level: normalizeLevel(course.categoria),
    lessons_count: 0,
    estimated_hours: Number(course.cargaHoraria) || 0,
    thumbnail_base64: "",
    enrolled_count: 0,
    created_at: course.dataCriacao ?? new Date().toISOString(),
  };
}

const courseService = {
  getAll: (category?: string) =>
    api
      .get<BackendCourse[]>("/curso")
      .then((response: { data: BackendCourse[] }) => response.data
        .filter((course: BackendCourse) => isCourseActive(course.statusCurso))
        .map(mapCourse)
        .filter((course: Course) => !category || course.category === category)),

  getById: (courseId: string) =>
    api.get<BackendCourseDetail>(`/curso/${courseId}/detalhe`).then((response: { data: BackendCourseDetail }) => ({
      course_id: String(response.data.id),
      teacher_id: "",
      teacher_name: "Professor CursiFy",
      title: response.data.nome,
      category: response.data.categoria,
      description: response.data.descricao,
      pedagogy_description: response.data.descricao,
      level: normalizeLevel(response.data.categoria),
      lessons_count: response.data.modulos.reduce((acc, modulo) => acc + modulo.aulas.length, 0),
      estimated_hours: Number(response.data.cargaHoraria) || 0,
      thumbnail_base64: "",
      enrolled_count: response.data.matriculado ? 1 : 0,
      created_at: new Date().toISOString(),
    })),

  getDetail: (courseId: string, userId?: number) =>
    api.get<BackendCourseDetail>(`/curso/${courseId}/detalhe`, { params: userId ? { usuarioId: userId } : undefined })
      .then((response: { data: BackendCourseDetail }) => response.data),

  create: (payload: CreateCoursePayload) =>
    api
      .post<BackendCourse>("/curso", {
        nome: payload.title,
        descricao: payload.description,
        categoria: payload.category,
        cargaHoraria: payload.estimated_hours,
        dataCriacao: new Date().toISOString(),
        statusCurso: "Ativo",
      })
      .then((response: { data: BackendCourse }) => mapCourse(response.data)),

  update: (_courseId: string, _payload: Partial<CreateCoursePayload>): Promise<Course> =>
    Promise.reject(new Error("Endpoint nao implementado.")),

  remove: (courseId: string) =>
    api.delete<void>(`/curso/${courseId}`).then(() => undefined),

  getProfessorCourses: () => courseService.getAll(),

  enroll: (courseId: string, userId: number) =>
    api.post(`/curso/${courseId}/matricular`, { usuarioId: userId }),

  finishLesson: (lessonId: number, userId: number, courseId: number) =>
    api.post(`/aulas/${lessonId}/concluir`, { usuarioId: userId, cursoId: courseId }),
};

export default courseService;
