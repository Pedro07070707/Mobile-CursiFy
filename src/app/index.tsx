import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthScreen } from "../components/AuthScreen";
import { BottomTabBar } from "../components/BottomTabBar";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import authService from "../services/authService";
import { AppTab, User } from "../types";
import trackService from "../services/trackService";
import { TrackSummary } from "../types/tracks";
import { chatService, ChatConversation } from "../services/chatService";
import { progressService } from "../services/progressService";
import { api } from "../services/api";

const SESSION_KEY = "cursify_session";

type TrackStatus = "CONCLUIDO" | "EM_ANDAMENTO" | "LIBERADO" | "BLOQUEADO";

type TrackNode = {
  id: string;
  title: string;
  type: "LICAO" | "EXERCICIO" | "QUIZ" | "CHECKPOINT" | "PROJETO";
  xp: number;
  status: TrackStatus;
};

type NodeChoice = {
  id: number;
  texto: string;
};

type NodeQuestion = {
  id: number;
  enunciado: string;
  tipo: string;
  explicacao?: string | null;
  alternativas: NodeChoice[];
};

type Track = {
  id: string;
  title: string;
  subject: string;
  xpTotal: number;
  difficulty: "Iniciante" | "Intermediario" | "Avancado";
  progress: number;
  nodes: TrackNode[];
};

type LocalChatConversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

const mockTracks: Track[] = [
  {
    id: "math-basic",
    title: "Matematica Basica",
    subject: "Exatas",
    xpTotal: 320,
    difficulty: "Iniciante",
    progress: 62,
    nodes: [
      { id: "n1", title: "Operacoes", type: "LICAO", xp: 10, status: "CONCLUIDO" },
      { id: "n2", title: "Pratica 1", type: "EXERCICIO", xp: 20, status: "CONCLUIDO" },
      { id: "n3", title: "Frações", type: "QUIZ", xp: 30, status: "EM_ANDAMENTO" },
      { id: "n4", title: "Checkpoint", type: "CHECKPOINT", xp: 50, status: "LIBERADO" },
      { id: "n5", title: "Projeto final", type: "PROJETO", xp: 80, status: "BLOQUEADO" },
    ],
  },
  {
    id: "portuguese-writing",
    title: "Português - Escrita",
    subject: "Linguagens",
    xpTotal: 260,
    difficulty: "Intermediario",
    progress: 28,
    nodes: [
      { id: "p1", title: "Pontuacao", type: "LICAO", xp: 10, status: "CONCLUIDO" },
      { id: "p2", title: "Ortografia", type: "EXERCICIO", xp: 20, status: "EM_ANDAMENTO" },
      { id: "p3", title: "Texto curto", type: "QUIZ", xp: 30, status: "LIBERADO" },
      { id: "p4", title: "Checkpoint", type: "CHECKPOINT", xp: 50, status: "BLOQUEADO" },
    ],
  },
];

const mockConversations: LocalChatConversation[] = [
  { id: "1", name: "Prof. Ana", preview: "Ajustei a trilha da semana.", time: "09:41", unread: 2 },
  { id: "2", name: "Grupo Matematica", preview: "Nova atividade liberada.", time: "Ontem", unread: 0 },
];

function AppShell() {
  const { theme, isDark } = useTheme();
  const [loadingSession, setLoadingSession] = useState(true);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<AppTab>("catalog");
  const [feedback, setFeedback] = useState("");
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [trackFeedback, setTrackFeedback] = useState("");
  const [nodeResult, setNodeResult] = useState<null | {
    mensagem?: string;
    nota?: number;
    notaMinima?: number | null;
    acertos?: number;
    total?: number;
    xpGanho?: number;
    aprovado?: boolean;
    tipoNo?: string;
    tentativas?: number | null;
    status?: string;
    feedbackProfessor?: string | null;
    projetoId?: number | null;
    detalhes?: Array<{
      questaoId?: number | null;
      enunciado?: string | null;
      alternativaId?: number | null;
      alternativaCorretaId?: number | null;
      correta?: boolean | null;
      tentativaNumero?: number | null;
      feedback?: string | null;
    }>;
  }>(null);
  const [nodeQuestions, setNodeQuestions] = useState<NodeQuestion[]>([]);
  const [nodeAnswers, setNodeAnswers] = useState<Record<number, number>>({});
  const [projectDraft, setProjectDraft] = useState({ respostaTexto: "", arquivoUrl: "" });

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { token: string; user: User };
        setToken(parsed.token);
        setUser(parsed.user);
      })
      .finally(() => setLoadingSession(false));
  }, []);

  useEffect(() => {
    trackService.getAll(user?.user_id).then(setTracks).catch(() => setTracks(mockTracks as unknown as TrackSummary[]));
    chatService.getConversations().then(setConversations).catch(() => setConversations([]));
  }, [user?.user_id]);

  const tabs = useMemo(
    () => [
      { key: "catalog" as AppTab, label: "Trilhas", icon: "map-outline" as const },
      { key: "my-courses" as AppTab, label: "Progresso", icon: "trophy-outline" as const },
      { key: "chat" as AppTab, label: "Chat", icon: "chatbubbles-outline" as const },
      { key: "profile" as AppTab, label: "Perfil", icon: "person-outline" as const },
    ],
    [],
  );

  const persistSession = async (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    await persistSession(response.access_token, response.user);
    setActiveTab("catalog");
    setFeedback("Sessao iniciada.");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setToken("");
    setUser(null);
    setActiveTab("catalog");
    setFeedback("Sessao encerrada.");
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    await authService.create({
      username: name,
      email,
      password,
      role: "student",
      bio: "",
      profile_image_base64: "",
    });
    await handleLogin(email, password);
  };

  if (loadingSession) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AuthScreen
          mode={mode}
          setMode={setMode}
          loginEmail=""
          setLoginEmail={() => undefined}
          loginPassword=""
          setLoginPassword={() => undefined}
          onLogin={() => undefined}
          onLoginWithCredentials={(email, password) => handleLogin(email, password)}
          onRegisterWithCredentials={handleRegister}
          loading={false}
          feedback={feedback}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.flex}>
        <LinearGradient colors={["#0EA5E9", "#10B981"]} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>CursiFy</Text>
              <Text style={styles.subtitle}>Companion mobile de trilhas e chat</Text>
            </View>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{user.username.slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {activeTab === "catalog" && (
            <TracksScreen
              user={user}
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              selectedNodeId={selectedNodeId}
              onSelectTrack={setSelectedTrackId}
              onSelectNode={setSelectedNodeId}
              onTrackFeedback={setTrackFeedback}
              onNodeQuestions={setNodeQuestions}
              onNodeAnswers={setNodeAnswers}
              onNodeResult={setNodeResult}
              projectDraft={projectDraft}
              onProjectDraft={setProjectDraft}
              onBack={() => { setSelectedNodeId(null); setSelectedTrackId(null); }}
              feedback={trackFeedback}
              nodeResult={nodeResult}
              nodeQuestions={nodeQuestions}
              nodeAnswers={nodeAnswers}
            />
          )}
          {activeTab === "my-courses" && <ProgressScreen user={user} tracks={tracks} />}
          {activeTab === "chat" && <ChatScreen user={user} conversations={conversations} />}
          {activeTab === "profile" && <ProfileScreen user={user} onLogout={handleLogout} />}
        </View>

        {feedback ? <Text style={[styles.feedback, { color: theme.colors.primary }]}>{feedback}</Text> : null}
        <BottomTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

function TracksScreen({
  user,
  tracks,
  selectedTrackId,
  selectedNodeId,
  onSelectTrack,
  onSelectNode,
  onTrackFeedback,
  onNodeQuestions,
  onNodeAnswers,
  onNodeResult,
  projectDraft,
  onProjectDraft,
  feedback,
  nodeResult,
  nodeQuestions,
  nodeAnswers,
  onBack,
}: {
  user: User;
  tracks: TrackSummary[];
  selectedTrackId: number | null;
  selectedNodeId: number | null;
  onSelectTrack: (id: number | null) => void;
  onSelectNode: (id: number | null) => void;
  onTrackFeedback: (value: string) => void;
  onNodeQuestions: (value: NodeQuestion[]) => void;
  onNodeAnswers: (value: Record<number, number>) => void;
  onNodeResult: (value: any) => void;
  projectDraft: { respostaTexto: string; arquivoUrl: string };
  onProjectDraft: (value: { respostaTexto: string; arquivoUrl: string }) => void;
  feedback: string;
  nodeResult: any;
  nodeQuestions: NodeQuestion[];
  nodeAnswers: Record<number, number>;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) || null;
  const selectedNode = selectedTrack?.nos.find((node) => node.id === selectedNodeId) || null;

  useEffect(() => {
    if (!selectedNode) return;
    api.get(`/api/nos/${selectedNode.id}/questoes`)
      .then((response) => onNodeQuestions(Array.isArray(response.data) ? response.data : []))
      .catch(() => onNodeQuestions([]));
    onNodeAnswers({});
    onProjectDraft({ respostaTexto: "", arquivoUrl: "" });
  }, [selectedNode?.id, onNodeQuestions, onNodeAnswers]);

  if (selectedTrack && selectedNode) {
    return (
      <ScrollView contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}>
        <Pressable onPress={onBack}>
          <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>← Voltar ao mapa</Text>
        </Pressable>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textMuted }}>{selectedTrack.materia}</Text>
          <Text style={{ color: theme.colors.textMain, fontSize: 22, fontWeight: "800", marginTop: 6 }}>{selectedNode.titulo}</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{selectedNode.tipo} • {selectedNode.xp} XP</Text>
          <Text style={{ color: theme.colors.textMain, marginTop: 14, lineHeight: 22 }}>
            {selectedNode.tipo === "CHECKPOINT"
              ? "Checkpoint com nota minima exigida. Escolha suas respostas e conclua para destravar o próximo no."
              : selectedNode.tipo === "PROJETO"
                ? "Projeto com envio pendente e avaliacao posterior. Escreva sua resposta e, se quiser, adicione um link de apoio."
              : "Conteudo do no exibido aqui. O fluxo pode ser expandido para video, texto e PDF conforme o backend evoluir."}
          </Text>
          {selectedNode.tipo === "PROJETO" ? (
            <View style={{ marginTop: 16, gap: 12 }}>
              <View style={{ gap: 8 }}>
                <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>Resposta do projeto</Text>
                <TextInput
                  value={projectDraft.respostaTexto}
                  onChangeText={(value) => onProjectDraft({ ...projectDraft, respostaTexto: value })}
                  placeholder="Descreva sua solução"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[styles.input, { minHeight: 110, textAlignVertical: "top", color: theme.colors.textMain, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                />
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>Link do arquivo opcional</Text>
                <TextInput
                  value={projectDraft.arquivoUrl}
                  onChangeText={(value) => onProjectDraft({ ...projectDraft, arquivoUrl: value })}
                  placeholder="https://..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, { color: theme.colors.textMain, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                />
              </View>
            </View>
          ) : null}
          {nodeQuestions.length > 0 ? (
            <View style={{ marginTop: 16, gap: 12 }}>
              {nodeQuestions.map((question) => (
                <View key={question.id} style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{question.enunciado}</Text>
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {question.alternativas.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => onNodeAnswers({ ...nodeAnswers, [question.id]: option.id })}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: nodeAnswers[question.id] === option.id ? theme.colors.primary : theme.colors.border,
                          backgroundColor: nodeAnswers[question.id] === option.id ? `${theme.colors.primary}18` : theme.colors.surface,
                        }}
                      >
                        <Text style={{ color: theme.colors.textMain }}>{option.texto}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.nodeActions}>
          <Pressable onPress={() => onSelectNode(null)} style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const respostas = nodeQuestions.map((question) => ({
                questaoId: question.id,
                alternativaId: nodeAnswers[question.id] ?? null,
              }));
              const result = selectedNode.tipo === "CHECKPOINT" || selectedNode.tipo === "QUIZ"
                ? await progressService.responderNo(selectedNode.id, Number(user.user_id), respostas)
                  : selectedNode.tipo === "PROJETO"
                    ? await api.post(`/api/projetos/nos/${selectedNode.id}/enviar`, {
                        usuarioId: Number(user.user_id),
                        respostaTexto: projectDraft.respostaTexto,
                        arquivoUrl: projectDraft.arquivoUrl,
                      }).then((response) => response.data)
                : await progressService.concluirNo(selectedNode.id, Number(user.user_id));
              onNodeResult(result);
              onTrackFeedback(
                selectedNode.tipo === "PROJETO"
                  ? `Projeto ${result.status ?? "enviado"} para avaliacao.`
                  : `+${result.xpGanho} XP | Total: ${result.xpTotal} XP`
              );
              onBack();
            }}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Concluir no</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (selectedTrack) {
    return (
      <ScrollView contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}>
        <Pressable onPress={onBack}>
          <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>← Voltar</Text>
        </Pressable>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {nodeResult ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{nodeResult.mensagem ?? "Resultado do no"}</Text>
            {selectedNode.type === "PROJETO" ? (
              <>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                  Projeto #{nodeResult.projetoId ?? "-"} • Status {nodeResult.status ?? "PENDENTE"}
                </Text>
                {nodeResult.feedbackProfessor ? (
                  <Text style={{ color: theme.colors.textMuted, marginTop: 4, lineHeight: 20 }}>
                    {nodeResult.feedbackProfessor}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
              {nodeResult.acertos ?? 0}/{nodeResult.total ?? 0} acertos • Nota {nodeResult.nota?.toFixed?.(1) ?? nodeResult.nota}
              {nodeResult.notaMinima ? ` / ${nodeResult.notaMinima}` : ""} • {nodeResult.xpGanho ?? 0} XP
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
              {nodeResult.aprovado ? "Aprovado" : "Nao aprovado"}
              {nodeResult.tipoNo ? ` • ${nodeResult.tipoNo}` : ""}
              {nodeResult.tentativas ? ` • ${nodeResult.tentativas} tentativa(s)` : ""}
            </Text>
            {Array.isArray(nodeResult.detalhes) && nodeResult.detalhes.length > 0 ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {nodeResult.detalhes.map((item, index) => (
                  <View key={`${item.questaoId ?? "q"}-${index}`} style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{item.enunciado ?? `Questao ${item.questaoId ?? index + 1}`}</Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 4, lineHeight: 20 }}>
                      {item.feedback ?? "Resposta registrada."}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 6, fontSize: 12 }}>
                      Sua resposta: {item.alternativaId ?? "Nenhuma"} • Correta: {item.alternativaCorretaId ?? "N/D"}
                    </Text>
                    <Text style={{ color: item.correta ? "#16A34A" : theme.colors.primary, marginTop: 8, fontWeight: "700" }}>
                      {item.correta ? "Correta" : "Incorreta"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            </>
            )}
          </View>
        ) : null}
        <Text style={{ color: theme.colors.textMuted }}>{selectedTrack.materia}</Text>
          <Text style={{ color: theme.colors.textMain, fontSize: 24, fontWeight: "800", marginTop: 6 }}>{selectedTrack.titulo}</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{selectedTrack.professor} • {selectedTrack.dificuldade} • {selectedTrack.xpTotal} XP</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${selectedTrack.progresso}%`, backgroundColor: theme.colors.primary }]} />
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {selectedTrack.nos.map((node) => (
            <Pressable key={node.id} onPress={() => onSelectNode(node.id)} style={styles.nodeRow}>
              <Ionicons
                name={node.estado === "CONCLUIDO" ? "checkmark-circle" : node.estado === "EM_ANDAMENTO" ? "radio-button-on" : node.estado === "LIBERADO" ? "ellipse-outline" : "lock-closed"}
                size={20}
                color={node.estado === "CONCLUIDO" ? "#16A34A" : node.estado === "EM_ANDAMENTO" ? theme.colors.primary : node.estado === "LIBERADO" ? theme.colors.textMuted : "#94A3B8"}
              />
              <Text style={{ color: theme.colors.textMain, flex: 1 }}>{node.titulo}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{node.xp} XP</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}>
      {feedback ? <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>{feedback}</Text> : null}
      <Text style={[styles.screenTitle, { color: theme.colors.textMain }]}>Ola, {user.username}</Text>
      <Text style={{ color: theme.colors.textMuted }}>Continue estudando nas trilhas gamificadas.</Text>
      {tracks.map((track) => (
        <Pressable key={track.id} onPress={() => onSelectTrack(track.id)} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textMain, fontSize: 18, fontWeight: "700" }}>{track.titulo}</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{track.materia} • {track.dificuldade}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${track.progresso}%`, backgroundColor: theme.colors.primary }]} />
          </View>
          <Text style={{ color: theme.colors.textMuted }}>{track.progresso}% concluido • {track.xpTotal} XP total</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ProgressScreen({ user, tracks }: { user: User; tracks: TrackSummary[] }) {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}>
      <Text style={[styles.screenTitle, { color: theme.colors.textMain }]}>Progresso</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMuted }}>XP total</Text>
        <Text style={{ color: theme.colors.textMain, fontSize: 30, fontWeight: "800", marginTop: 6 }}>1.240 XP</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>Streak atual: 7 dias</Text>
      </View>
      {tracks.map((track) => (
        <View key={track.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{track.titulo}</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{track.progresso}% concluido</Text>
        </View>
      ))}
      <Text style={{ color: theme.colors.textMuted }}>Conta: {user.email}</Text>
    </ScrollView>
  );
}

function ChatScreen({ user, conversations }: { user: User; conversations: ChatConversation[] }) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<{ message_id: string; sender_id: string; sender_name: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!activeConversationId) return;
    chatService.getMessages(activeConversationId).then(setMessages).catch(() => setMessages([]));
  }, [activeConversationId]);

  const send = async () => {
    if (!draft.trim() || !activeConversationId) return;
    await chatService.sendMessage(activeConversationId, Number(user.user_id), draft.trim());
    setDraft("");
    setMessages(await chatService.getMessages(activeConversationId));
  };
  return (
    <View style={styles.flex}>
      <FlatList
        data={conversations.length > 0 ? conversations : (mockConversations as unknown as ChatConversation[])}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setActiveConversationId(Number(item.id))} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between" }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{(item as any).nome ?? (item as any).name}</Text>
              <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{"tipo" in item ? item.tipo : "Conversa local"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>aberta</Text>
            </View>
          </Pressable>
        )}
      />
      <View style={[styles.card, { marginHorizontal: theme.spacing.l, marginBottom: theme.spacing.s, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>
          {activeConversationId ? `Conversa ${activeConversationId}` : "Selecione uma conversa"}
        </Text>
        <ScrollView style={{ maxHeight: 220, marginTop: 10 }}>
          {messages.map((message) => (
            <View key={message.message_id} style={{ marginBottom: 10, alignSelf: message.sender_id === user.user_id ? "flex-end" : "flex-start" }}>
              <View style={[styles.card, { backgroundColor: message.sender_id === user.user_id ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border, paddingVertical: 10 }]}>
                <Text style={{ color: message.sender_id === user.user_id ? "#fff" : theme.colors.textMain }}>{message.content}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.composer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escreva uma mensagem"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textMain, backgroundColor: theme.colors.surface }]}
        />
        <Pressable onPress={send} style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.l, gap: theme.spacing.m }}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, alignItems: "center" }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{user.username.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={{ color: theme.colors.textMain, fontSize: 22, fontWeight: "800" }}>{user.username}</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{user.email}</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>Mobile focado em trilhas e chat.</Text>
      </View>
      <Pressable onPress={onLogout} style={[styles.logoutButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

function Root() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default Root;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#fff", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#E0F2FE", marginTop: 4 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  headerAvatarText: { color: "#fff", fontWeight: "800" },
  content: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: "800" },
  card: { borderWidth: 1, borderRadius: 20, padding: 16 },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "#E2E8F0", overflow: "hidden", marginTop: 14, marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 999 },
  nodeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  unread: { marginTop: 8, minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: "#EF4444", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: "700" },
  composer: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  sendButton: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatar: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  logoutButton: { borderWidth: 1, borderRadius: 18, alignItems: "center", paddingVertical: 16 },
  feedback: { paddingHorizontal: 18, paddingVertical: 8, textAlign: "center" },
  nodeActions: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
});
