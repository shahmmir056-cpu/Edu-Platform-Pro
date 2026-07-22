import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Video, Users, Plus, ArrowRight, Calendar, BookOpen, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClassroomLobby() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [joinCode, setJoinCode] = useState("");

  const [form, setForm] = useState({
    name: "",
    title: "",
    subject: "General",
    scheduledDate: "",
    scheduledTime: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim()) return;

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          teacherId: crypto.randomUUID(),
          teacherName: form.name,
          scheduledAt: form.scheduledDate && form.scheduledTime
            ? new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString()
            : undefined,
        }),
      });
      const data = await res.json();
      setLocation(`/virtual-classroom/${data.id}?name=${encodeURIComponent(form.name)}&role=teacher`);
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !form.name.trim()) return;

    try {
      const res = await fetch(`/api/classrooms/code/${joinCode.toUpperCase()}`);
      if (!res.ok) {
        alert("Class not found. Check the code and try again.");
        return;
      }
      const data = await res.json();
      setLocation(`/virtual-classroom/${data.id}?name=${encodeURIComponent(form.name)}&role=student`);
    } catch (err) {
      console.error("Failed to join room:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Hero */}
      <section className="relative px-6 pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground isolate">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="h-full w-full">
            <defs>
              <pattern id="cr-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cr-grid)" />
          </svg>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto relative z-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm font-medium mb-6">
            <Video size={16} /> Virtual Classroom
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight tracking-tight mb-5">
            Teach & Learn,<br />
            <span className="text-accent italic">Live Together.</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Real-time video, interactive whiteboard, screen sharing, polls, and more —
            everything you need for engaging live classes, all in your browser.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="flex-1 px-6 -mt-10 md:-mt-14 relative z-20 pb-20">
        <div className="max-w-5xl mx-auto">
          {mode === "home" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Create */}
              <button
                onClick={() => setMode("create")}
                className="bg-card border border-card-border rounded-2xl p-8 text-left hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <Plus size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Create a Class
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Start a new virtual classroom as a teacher. You'll get a join code to share with students.
                </p>
                <div className="flex items-center text-sm font-bold text-primary">
                  Get Started <ArrowRight size={16} className="ml-1" />
                </div>
              </button>

              {/* Join */}
              <button
                onClick={() => setMode("join")}
                className="bg-card border border-card-border rounded-2xl p-8 text-left hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent-foreground flex items-center justify-center mb-5">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Join a Class
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Enter a class code to join a teacher's virtual classroom as a student.
                </p>
                <div className="flex items-center text-sm font-bold text-primary">
                  Join Now <ArrowRight size={16} className="ml-1" />
                </div>
              </button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate}
              className="glass-card rounded-2xl p-8 max-w-lg mx-auto border-t-4 border-t-primary"
            >
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Create a Class</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Your Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Class Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Physics 101 - Mechanics"
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {["General", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History", "Geography", "Art", "Music"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Date (Optional)</label>
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Time</label>
                    <input
                      type="time"
                      value={form.scheduledTime}
                      onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setMode("home")} className="px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors">
                  Back
                </button>
                <button type="submit" disabled={!form.name.trim() || !form.title.trim()} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                  <Video size={18} /> Start Class
                </button>
              </div>
            </motion.form>
          )}

          {mode === "join" && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleJoin}
              className="glass-card rounded-2xl p-8 max-w-lg mx-auto border-t-4 border-t-accent"
            >
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Join a Class</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Your Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Alex Johnson"
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Class Code</label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123"
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-2xl font-mono font-bold text-center tracking-[0.3em] outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all uppercase"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setMode("home")} className="px-6 py-3 border-2 border-input bg-background hover:bg-muted text-foreground font-bold rounded-xl transition-colors">
                  Back
                </button>
                <button type="submit" disabled={!joinCode.trim() || !form.name.trim()} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                  <ArrowRight size={18} /> Join Class
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
