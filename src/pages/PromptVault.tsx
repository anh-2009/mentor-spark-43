import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Tag, Trash2, Edit3, Save, X, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["general", "study", "motivation", "coding", "writing", "exam"];

export default function PromptVault() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("general");

  useEffect(() => {
    if (user) loadPrompts();
  }, [user]);

  const loadPrompts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("prompt_vault")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPrompts((data as unknown as Prompt[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setTags(""); setCategory("general");
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Cần có tiêu đề và nội dung"); return; }
    const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      user_id: user!.id,
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
      category,
    };

    if (editingId) {
      const { error } = await supabase.from("prompt_vault").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else { toast.success("Đã cập nhật prompt!"); resetForm(); loadPrompts(); }
    } else {
      const { error } = await supabase.from("prompt_vault").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Đã lưu prompt mới!"); resetForm(); loadPrompts(); }
    }
  };

  const handleEdit = (p: Prompt) => {
    setTitle(p.title); setContent(p.content); setTags(p.tags.join(", ")); setCategory(p.category);
    setEditingId(p.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("prompt_vault").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã xóa prompt"); loadPrompts(); }
  };

  // Get all unique tags
  const allTags = [...new Set(prompts.flatMap((p) => p.tags))];

  // Filter
  const filtered = prompts.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || p.tags.includes(filterTag);
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchTag && matchCat;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 md:px-8 max-w-6xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold gradient-text flex items-center gap-3">
              <BookOpen className="w-8 h-8" /> Prompt Vault
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Lưu trữ và tự động inject prompt vào AI chat</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all neon-glow-subtle">
            <Plus className="w-4 h-4" /> Thêm Prompt
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm prompt..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Tất cả danh mục</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filterTag && <button onClick={() => setFilterTag("")} className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium">✕ {filterTag}</button>}
              {allTags.filter((t) => t !== filterTag).slice(0, 8).map((tag) => (
                <button key={tag} onClick={() => setFilterTag(tag)} className="px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground text-xs hover:border-primary/40 hover:text-foreground transition-all">
                  <Tag className="w-3 h-3 inline mr-1" />{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-strong p-6 rounded-2xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">{editingId ? "Chỉnh sửa Prompt" : "Tạo Prompt Mới"}</h2>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề prompt" className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung prompt... (sẽ được inject vào system message khi phù hợp)" rows={4} className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none" />
                <div className="flex gap-3">
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (phân cách bằng dấu phẩy)" className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                  <Save className="w-4 h-4" /> {editingId ? "Cập nhật" : "Lưu"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt List */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Chưa có prompt nào. Hãy tạo prompt đầu tiên!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-hover p-5 rounded-xl group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground text-sm line-clamp-1">{p.title}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs line-clamp-3 mb-3">{p.content}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">{p.category}</span>
                  {p.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px]">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
