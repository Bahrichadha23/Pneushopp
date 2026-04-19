"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api-client";
import {
  MessageSquare,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Tag,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Comment {
  id: number;
  author: number;
  author_name: string;
  content: string;
  is_developer: boolean;
  created_at: string;
}

interface Message {
  id: number;
  title: string;
  content: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  author: number;
  author_name: string;
  is_done: boolean;
  done_at: string | null;
  done_by_name: string | null;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  comment_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  done: "Terminé",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  done: "bg-green-100 text-green-800 border-green-300",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Basse",
  medium: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommunicationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // List state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // New message form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  // Expanded message state
  const [expanded, setExpanded] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [sendingComment, setSendingComment] = useState<number | null>(null);

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPriority !== "all") params.priority = filterPriority;
      const { data } = await apiClient.get("/communication/messages/", {
        params,
      });
      setMessages(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      console.error("Erreur chargement messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPriority]);

  // ── Create message ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/communication/messages/", {
        title: newTitle,
        content: newContent,
        priority: newPriority,
      });
      setNewTitle("");
      setNewContent("");
      setNewPriority("medium");
      setShowForm(false);
      fetchMessages();
    } catch (err) {
      console.error("Erreur création message", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Mark as done / in-progress ─────────────────────────────────────────────
  const handleMarkDone = async (id: number) => {
    try {
      await apiClient.post(`/communication/messages/${id}/mark-done/`);
      fetchMessages();
    } catch (err) {
      console.error("Erreur mark-done", err);
    }
  };

  const handleMarkInProgress = async (id: number) => {
    try {
      await apiClient.post(`/communication/messages/${id}/in-progress/`);
      fetchMessages();
    } catch (err) {
      console.error("Erreur mark-in-progress", err);
    }
  };

  // ── Post comment ───────────────────────────────────────────────────────────
  const handleSendComment = async (messageId: number) => {
    const text = (commentDraft[messageId] || "").trim();
    if (!text) return;
    setSendingComment(messageId);
    try {
      await apiClient.post(`/communication/messages/${messageId}/comments/`, {
        content: text,
      });
      setCommentDraft((d) => ({ ...d, [messageId]: "" }));
      fetchMessages();
    } catch (err) {
      console.error("Erreur envoi commentaire", err);
    } finally {
      setSendingComment(null);
    }
  };

  // ── Delete message (admin only) ────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce message ?")) return;
    try {
      await apiClient.delete(`/communication/messages/${id}/`);
      fetchMessages();
    } catch (err) {
      console.error("Erreur suppression", err);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Communication</h1>
            <p className="text-sm text-gray-500">
              Demandes de modifications & suivi développeur
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </Button>
      </div>

      {/* New message form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4 text-gray-800">
            Nouvelle demande de modification
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Ajouter un filtre par marque sur la page produits"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                placeholder="Décrivez la modification souhaitée en détail..."
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Envoyer"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="done">Terminé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes priorités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="medium">Normale</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-gray-500">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-yellow-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune demande trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              isAdmin={isAdmin}
              expanded={expanded === msg.id}
              onToggle={() =>
                setExpanded(expanded === msg.id ? null : msg.id)
              }
              onMarkDone={handleMarkDone}
              onMarkInProgress={handleMarkInProgress}
              onDelete={handleDelete}
              commentDraft={commentDraft[msg.id] ?? ""}
              onCommentChange={(val) =>
                setCommentDraft((d) => ({ ...d, [msg.id]: val }))
              }
              onSendComment={handleSendComment}
              sendingComment={sendingComment === msg.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MessageCard ──────────────────────────────────────────────────────────────
interface CardProps {
  msg: Message;
  isAdmin: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkDone: (id: number) => void;
  onMarkInProgress: (id: number) => void;
  onDelete: (id: number) => void;
  commentDraft: string;
  onCommentChange: (val: string) => void;
  onSendComment: (id: number) => void;
  sendingComment: boolean;
}

function MessageCard({
  msg,
  isAdmin,
  expanded,
  onToggle,
  onMarkDone,
  onMarkInProgress,
  onDelete,
  commentDraft,
  onCommentChange,
  onSendComment,
  sendingComment,
}: CardProps) {
  return (
    <div
      className={`bg-white border rounded-xl shadow-sm transition-all ${
        msg.status === "done"
          ? "border-green-200 opacity-80"
          : msg.priority === "urgent"
          ? "border-red-300"
          : "border-gray-200"
      }`}
    >
      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 rounded-xl"
        onClick={onToggle}
      >
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {msg.status === "done" ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : msg.status === "in_progress" ? (
            <Clock className="w-5 h-5 text-blue-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {msg.title}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                STATUS_COLOR[msg.status]
              }`}
            >
              {STATUS_LABEL[msg.status]}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                PRIORITY_COLOR[msg.priority]
              }`}
            >
              {PRIORITY_LABEL[msg.priority]}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{msg.content}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {msg.author_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtDate(msg.created_at)}
            </span>
            {msg.comment_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {msg.comment_count} commentaire
                {msg.comment_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {msg.is_done && msg.done_by_name && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Résolu par {msg.done_by_name}
              {msg.done_at ? ` le ${fmtDate(msg.done_at)}` : ""}
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div className="shrink-0 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Full content */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {msg.content}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {msg.status !== "done" && (
                <Button
                  size="sm"
                  onClick={() => onMarkDone(msg.id)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Marquer terminé
                </Button>
              )}
              {msg.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkInProgress(msg.id)}
                  className="gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Clock className="w-3.5 h-3.5" />
                  En cours
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(msg.id)}
                className="gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50"
              >
                Supprimer
              </Button>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Commentaires
            </p>
            {msg.comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Aucun commentaire pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {msg.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg p-3 text-sm ${
                      c.is_developer
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs text-gray-700">
                        {c.author_name}
                      </span>
                      {c.is_developer && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500 text-white">
                          Développeur
                        </Badge>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {fmtDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-2 mt-2">
              <Textarea
                rows={2}
                placeholder="Écrire un commentaire..."
                value={commentDraft}
                onChange={(e) => onCommentChange(e.target.value)}
                className="text-sm resize-none"
              />
              <Button
                size="sm"
                disabled={sendingComment || !commentDraft.trim()}
                onClick={() => onSendComment(msg.id)}
                className="self-end bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {sendingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
