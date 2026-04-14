import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const fetchNotes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setNotes(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [user]);

  const createNote = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    setNewTitle(""); setNewContent(""); setCreating(false);
    fetchNotes();
    toast({ title: "Đã tạo ghi chú" });
  };

  const updateNote = async (id: string) => {
    if (!editTitle.trim()) return;
    const { error } = await supabase.from("notes").update({
      title: editTitle.trim(),
      content: editContent.trim(),
    }).eq("id", id);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    setEditingId(null);
    fetchNotes();
    toast({ title: "Đã cập nhật" });
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa ghi chú này?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    fetchNotes();
    toast({ title: "Đã xóa" });
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-10 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ghi chú</h1>
          {!creating && (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Tạo mới
            </Button>
          )}
        </div>

        {creating && (
          <Card className="p-4 mb-6 space-y-3">
            <Input
              placeholder="Tiêu đề..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Nội dung..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={createNote} size="sm"><Save className="w-4 h-4 mr-1" /> Lưu</Button>
              <Button onClick={() => { setCreating(false); setNewTitle(""); setNewContent(""); }} size="sm" variant="ghost"><X className="w-4 h-4 mr-1" /> Hủy</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Đang tải...</p>
        ) : notes.length === 0 && !creating ? (
          <p className="text-muted-foreground text-center py-10">Chưa có ghi chú nào. Hãy tạo ghi chú đầu tiên!</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) =>
              editingId === note.id ? (
                <Card key={note.id} className="p-4 space-y-3">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
                  <div className="flex gap-2">
                    <Button onClick={() => updateNote(note.id)} size="sm"><Save className="w-4 h-4 mr-1" /> Lưu</Button>
                    <Button onClick={() => setEditingId(null)} size="sm" variant="ghost"><X className="w-4 h-4 mr-1" /> Hủy</Button>
                  </div>
                </Card>
              ) : (
                <Card
                  key={note.id}
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors group"
                  onClick={() => startEdit(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{note.title || "Không có tiêu đề"}</h3>
                      {note.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {new Date(note.updated_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
