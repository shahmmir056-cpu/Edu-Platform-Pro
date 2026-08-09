import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, UserPlus, BookOpen, Clock, Brain, MonitorSmartphone, Heart, Calendar } from "lucide-react";
import type { LifeProfile, Subject, LearningStyle } from "../types";
import { defaultProfile } from "../storage";
import { Button, Field, Glass, SectionTitle, SelectInput, Slider, TextInput, TimeInput, Toggle, inputCls, useTheme } from "./ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STYLE_OPTIONS: { value: LearningStyle; label: string }[] = [
  { value: "visual", label: "Visual — I learn by seeing diagrams" },
  { value: "audio", label: "Audio — I learn by listening" },
  { value: "practical", label: "Practical — I learn by doing" },
  { value: "reading-writing", label: "Reading / Writing — I learn by notes" },
];

const steps = [
  { id: "basics", title: "Who are you?", icon: UserPlus, desc: "Tell the AI about yourself" },
  { id: "day", title: "Your Daily Clock", icon: Clock, desc: "School, sleep, travel & routine anchors" },
  { id: "subjects", title: "Your Subjects", icon: BookOpen, desc: "Add subjects, strengths & exam dates" },
  { id: "mind", title: "How Your Brain Works", icon: Brain, desc: "Energy, speed, focus & study style" },
  { id: "environment", title: "Your Environment", icon: MonitorSmartphone, desc: "Devices, screens & distractions" },
  { id: "goals", title: "Your Mission", icon: Heart, desc: "Your target — the AI will build the plan" },
];

export function Onboarding({ initial, onComplete }: { initial?: LifeProfile | null; onComplete: (p: LifeProfile) => void }) {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<LifeProfile>(() => (initial ? { ...initial } : defaultProfile()));
  const [subjectName, setSubjectName] = useState("");
  const [subjectStrength, setSubjectStrength] = useState(3);
  const [subjectExam, setSubjectExam] = useState("");

  const patch = (p: Partial<LifeProfile>) => setProfile((prev) => ({ ...prev, ...p }));

  const addSubject = () => {
    const name = subjectName.trim();
    if (!name) return;
    const subj: Subject = { name, strength: subjectStrength, examDate: subjectExam || undefined };
    setProfile((prev) => ({ ...prev, subjects: [...prev.subjects, subj] }));
    setSubjectName("");
    setSubjectExam("");
  };

  const removeSubject = (name: string) => setProfile((prev) => ({ ...prev, subjects: prev.subjects.filter((s) => s.name !== name) }));

  const valid = profile.name.trim().length > 0 && profile.subjects.length > 0;

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else if (valid) onComplete(profile);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SectionTitle
        eyebrow="M1 · Life Profile"
        title="Build Your Life Profile"
        desc="The AI needs to understand your world before it can architect your days."
      />

      {/* step indicator */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              flex: i === step ? 2.2 : 1,
              background: i <= step ? `linear-gradient(90deg, ${t.primary}, ${t.peach})` : t.inputBorder,
            }}
          />
        ))}
      </div>

      <Glass strong className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})`, color: "#fff" }}
          >
            {(() => {
              const I = steps[step].icon;
              return <I size={18} />;
            })()}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.primary }}>
              Step {step + 1} of {steps.length}
            </div>
            <h3 className="text-lg font-serif" style={{ color: t.text }}>
              {steps[step].title}
            </h3>
          </div>
        </div>

        <div
          className="lg-scroll-y"
          style={{
            maxHeight: "min(58vh, 520px)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
            {/* ── BASICS ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your Name">
                  <TextInput value={profile.name} onChange={(v) => patch({ name: v })} placeholder="e.g. Ayesha" />
                </Field>
                <Field label="Age">
                  <TextInput type="number" value={String(profile.age)} onChange={(v) => patch({ age: Number(v) || 0 })} placeholder="15" />
                </Field>
                <Field label="Grade / Class">
                  <TextInput value={profile.grade} onChange={(v) => patch({ grade: v })} placeholder="e.g. 10th Grade" />
                </Field>
                <Field label="Country">
                  <TextInput value={profile.country} onChange={(v) => patch({ country: v })} placeholder="e.g. Pakistan" />
                </Field>
                <Field label="Timezone">
                  <SelectInput
                    value={profile.timezone || "Asia/Karachi"}
                    onChange={(v) => patch({ timezone: v })}
                    options={[
                      { value: "Asia/Karachi", label: "Asia/Karachi (GMT+5)" },
                      { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
                      { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
                      { value: "Asia/Dhaka", label: "Asia/Dhaka (GMT+6)" },
                      { value: "America/New_York", label: "New York (GMT-5)" },
                      { value: "Europe/London", label: "London (GMT+0)" },
                      { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
                    ]}
                  />
                </Field>
              </div>
            )}

            {/* ── DAILY CLOCK ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Wake Up Time">
                  <TimeInput value={profile.wakeTime} onChange={(v) => patch({ wakeTime: v })} />
                </Field>
                <Field label="Sleep Time">
                  <TimeInput value={profile.sleepTime} onChange={(v) => patch({ sleepTime: v })} />
                </Field>
                <Field label="School Starts">
                  <TimeInput value={profile.schoolStart} onChange={(v) => patch({ schoolStart: v })} />
                </Field>
                <Field label="School Ends">
                  <TimeInput value={profile.schoolEnd} onChange={(v) => patch({ schoolEnd: v })} />
                </Field>
                <Field label="Travel Time (min)">
                  <TextInput type="number" value={String(profile.travelMin)} onChange={(v) => patch({ travelMin: Number(v) || 0 })} />
                </Field>
                <div className="sm:col-span-2">
                  <Toggle checked={profile.hasCoaching} onChange={(v) => patch({ hasCoaching: v })} label="I attend coaching / tuitions after school" />
                </div>
                {profile.hasCoaching && (
                  <>
                    <Field label="Coaching Starts">
                      <TimeInput value={profile.coachingStart || "16:00"} onChange={(v) => patch({ coachingStart: v })} />
                    </Field>
                    <Field label="Coaching Ends">
                      <TimeInput value={profile.coachingEnd || "17:30"} onChange={(v) => patch({ coachingEnd: v })} />
                    </Field>
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: t.muted }}>
                        Coaching Days
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map((d) => {
                          const active = (profile.coachingDays || []).includes(d);
                          return (
                            <button
                              key={d}
                              onClick={() => {
                                const cur = profile.coachingDays || [];
                                patch({ coachingDays: active ? cur.filter((x) => x !== d) : [...cur, d] });
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
                              style={{
                                background: active ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` : t.inputBg,
                                color: active ? "#fff" : t.muted,
                                border: `1px solid ${active ? "transparent" : t.inputBorder}`,
                              }}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <Toggle checked={profile.hasPrayer} onChange={(v) => patch({ hasPrayer: v })} label="I pray daily — protect prayer times" />
                </div>
              </div>
            )}

            {/* ── SUBJECTS ── */}
            {step === 2 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="sm:col-span-1">
                    <TextInput value={subjectName} onChange={setSubjectName} placeholder="Subject name" />
                  </div>
                  <div className="sm:col-span-1">
                    <Slider value={subjectStrength} onChange={setSubjectStrength} label="Strength (1=weak)" />
                  </div>
                  <div className="sm:col-span-1 flex gap-2">
                    <TextInput type="date" value={subjectExam} onChange={setSubjectExam} placeholder="Exam date" />
                    <Button onClick={addSubject} className="shrink-0 px-4">
                      <Sparkles size={15} />
                    </Button>
                  </div>
                </div>
                {profile.subjects.length === 0 && (
                  <p className="text-xs mb-3" style={{ color: t.muted }}>
                    Add at least 2 subjects — the AI balances them by strength & exam proximity.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((s) => (
                    <span
                      key={s.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    >
                      {s.name} · {s.strength}/5
                      {s.examDate && <span className="inline-flex items-center gap-1" style={{ color: t.primary }}><Calendar size={11} /> {s.examDate.slice(5)}</span>}
                      <button onClick={() => removeSubject(s.name)} className="ml-1" style={{ color: t.muted }}>
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── MIND ── */}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Learning Speed">
                  <SelectInput
                    value={profile.learningSpeed}
                    onChange={(v) => patch({ learningSpeed: v as LifeProfile["learningSpeed"] })}
                    options={[
                      { value: "slow", label: "Slow — I need more time" },
                      { value: "medium", label: "Medium" },
                      { value: "fast", label: "Fast — I pick things up quickly" },
                    ]}
                  />
                </Field>
                <Field label="Learning Style">
                  <SelectInput
                    value={profile.learningStyle}
                    onChange={(v) => patch({ learningStyle: v as LearningStyle })}
                    options={STYLE_OPTIONS}
                  />
                </Field>
                <Field label="Study Block Length (min)">
                  <Slider value={profile.studyBlockMin} onChange={(v) => patch({ studyBlockMin: v })} min={15} max={60} step={5} label="Focus session length" />
                </Field>
                <Field label="Break Length (min)">
                  <Slider value={profile.breakMin} onChange={(v) => patch({ breakMin: v })} min={5} max={20} step={5} label="Rest between blocks" />
                </Field>
                <Field label="Energy Level">
                  <Slider value={profile.energyLevel} onChange={(v) => patch({ energyLevel: v })} label="1 = low, 5 = high" />
                </Field>
                <Field label="Stress Level">
                  <Slider value={profile.stressLevel} onChange={(v) => patch({ stressLevel: v })} label="1 = calm, 5 = very stressed" />
                </Field>
                <div className="sm:col-span-2">
                  <Toggle checked={profile.weekendStudy} onChange={(v) => patch({ weekendStudy: v })} label="I can study on weekends" />
                </div>
              </div>
            )}

            {/* ── ENVIRONMENT ── */}
            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Daily Screen Time (hrs)">
                  <Slider value={profile.screenTimeHrs} onChange={(v) => patch({ screenTimeHrs: v })} min={1} max={12} step={1} label="Includes social media" />
                </Field>
                <Field label="Phone Distraction">
                  <Slider value={profile.phoneDistraction} onChange={(v) => patch({ phoneDistraction: v })} label="1 = never picks it up" />
                </Field>
                <div>
                  <Toggle checked={profile.hasInternet} onChange={(v) => patch({ hasInternet: v })} label="I have internet at home" />
                </div>
                <div>
                  <Toggle checked={profile.hasLaptop} onChange={(v) => patch({ hasLaptop: v })} label="I have a laptop / computer" />
                </div>
                <div>
                  <Toggle checked={profile.exerciseDaily} onChange={(v) => patch({ exerciseDaily: v })} label="I exercise most days" />
                </div>
                <div>
                  <Toggle checked={profile.readingDaily} onChange={(v) => patch({ readingDaily: v })} label="I read daily" />
                </div>
                <div>
                  <Toggle checked={profile.codingDaily} onChange={(v) => patch({ codingDaily: v })} label="I practice coding" />
                </div>
                <div>
                  <Toggle checked={profile.languageDaily} onChange={(v) => patch({ languageDaily: v })} label="I learn a language" />
                </div>
              </div>
            )}

            {/* ── GOALS ── */}
            {step === 5 && (
              <div>
                <Field label="Target Score (%)">
                  <Slider value={profile.studyGoal} onChange={(v) => patch({ studyGoal: v })} min={50} max={100} step={5} label="What grade do you want?" />
                </Field>
                <div className="mt-6 rounded-xl p-4" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                  <p className="text-sm" style={{ color: t.text }}>
                    The AI will analyze your <span style={{ color: t.primary }}>{profile.subjects.length || 0} subjects</span>, plan around your daily anchors,
                    place hard subjects in your energy peaks, and adapt live when life happens.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft size={16} /> Back
          </Button>
          <Button onClick={next} disabled={!valid && step === steps.length - 1}>
            {step === steps.length - 1 ? (
              <>
                Build My Life OS <Sparkles size={15} />
              </>
            ) : (
              <>
                Continue <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </Glass>
    </div>
  );
}
