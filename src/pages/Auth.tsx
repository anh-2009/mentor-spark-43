import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft, KeyRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AuthStep = "login" | "signup" | "otp" | "forgot" | "forgot-otp" | "reset-pw";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (user) return <Navigate to="/dashboard" replace />;

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setStep("otp");
      startResendCooldown();
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Vui lòng nhập mã OTP 6 chữ số"); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Xác nhận thành công! Đang chuyển hướng...");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đã gửi lại mã OTP!");
      startResendCooldown();
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Vui lòng nhập email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Mã khôi phục đã được gửi đến email!");
      setStep("forgot-otp");
      startResendCooldown();
    }
    setLoading(false);
  };

  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Vui lòng nhập mã 6 chữ số"); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "recovery" });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Xác nhận thành công! Nhập mật khẩu mới.");
      setStep("reset-pw");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đổi mật khẩu thành công!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all";
  const btnClass = "w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all neon-glow-subtle flex items-center justify-center gap-2 text-sm";

  const getTitle = () => {
    switch (step) {
      case "login": return "Welcome back";
      case "signup": return "Create account";
      case "otp": return "Xác nhận email";
      case "forgot": return "Quên mật khẩu";
      case "forgot-otp": return "Nhập mã khôi phục";
      case "reset-pw": return "Đặt mật khẩu mới";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "login": return "Đăng nhập để tiếp tục";
      case "signup": return "Tạo tài khoản mới";
      case "otp": return `Nhập mã OTP 6 chữ số đã gửi đến ${email}`;
      case "forgot": return "Nhập email để nhận mã khôi phục";
      case "forgot-otp": return `Nhập mã 6 chữ số đã gửi đến ${email}`;
      case "reset-pw": return "Nhập mật khẩu mới cho tài khoản";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <div className="grid-pattern fixed inset-0 pointer-events-none opacity-20" />

      <Link
        to="/"
        className="fixed top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 neon-glow-subtle mb-4">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <h1 className="font-display text-2xl font-bold text-foreground">{getTitle()}</h1>
                <p className="text-muted-foreground text-sm mt-1">{getSubtitle()}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN */}
            {step === "login" && (
              <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type={showPw ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => { setStep("forgot"); setOtp(""); }} className="text-xs text-primary hover:underline">Quên mật khẩu?</button>
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Đăng nhập
                </button>
              </motion.form>
            )}

            {/* SIGNUP */}
            {step === "signup" && (
              <motion.form key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSignup} className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type="text" placeholder="Tên hiển thị" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputClass} />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type={showPw ? "text" : "password"} placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Đăng ký
                </button>
              </motion.form>
            )}

            {/* OTP VERIFICATION */}
            {step === "otp" && (
              <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const newOtp = otp.split("");
                        newOtp[i] = val;
                        setOtp(newOtp.join("").slice(0, 6));
                        if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousElementSibling) {
                          (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                        }
                      }}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">Mã hết hạn sau 2 phút</p>
                <button type="submit" disabled={loading || otp.length !== 6} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Xác nhận <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
                </button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD */}
            {step === "forgot" && (
              <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type="email" placeholder="Email đã đăng ký" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Gửi mã khôi phục
                </button>
                <button type="button" onClick={() => setStep("login")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Quay lại đăng nhập
                </button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD OTP */}
            {step === "forgot-otp" && (
              <motion.form key="forgot-otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleVerifyRecoveryOtp} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const newOtp = otp.split("");
                        newOtp[i] = val;
                        setOtp(newOtp.join("").slice(0, 6));
                        if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousElementSibling) {
                          (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                        }
                      }}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Xác nhận
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (resendCooldown > 0) return;
                    await supabase.auth.resetPasswordForEmail(email);
                    toast.success("Đã gửi lại mã!");
                    startResendCooldown();
                  }}
                  disabled={resendCooldown > 0}
                  className="w-full text-sm text-primary hover:underline disabled:text-muted-foreground"
                >
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã"}
                </button>
              </motion.form>
            )}

            {/* RESET PASSWORD */}
            {step === "reset-pw" && (
              <motion.form key="reset-pw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative group">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Đổi mật khẩu
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {(step === "login" || step === "signup") && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">hoặc</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {step === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                <button onClick={() => setStep(step === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
                  {step === "login" ? "Đăng ký" : "Đăng nhập"}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
