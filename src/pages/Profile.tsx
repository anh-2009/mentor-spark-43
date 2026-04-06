import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { User, Camera, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("vi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url);
      setLanguage(data.language || "vi");
    } else {
      setDisplayName(user!.user_metadata?.display_name || "");
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File quá lớn", description: "Vui lòng chọn ảnh dưới 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Lỗi upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const profileData = {
      user_id: user.id,
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl,
      language,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Lỗi lưu", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã lưu!", description: "Hồ sơ của bạn đã được cập nhật." });
    }
    setSaving(false);
  };

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý thông tin và tùy chọn của bạn</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-border">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                    ) : (
                      <Camera className="w-5 h-5 text-foreground" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Click để đổi ảnh đại diện</p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                  maxLength={50}
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>Ngôn ngữ</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save */}
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
