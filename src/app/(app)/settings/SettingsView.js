"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoChevronRight, GoSignOut, GoSync, GoTrash } from "react-icons/go";
import PageHeader from "../../components/PageHeader";
import Card, { SectionTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Sheet, { ConfirmSheet } from "../../components/ui/Sheet";
import { TextInput } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import RegeneratePlan from "../../components/RegeneratePlan";
import { STEPS, StepFields, draftFromProfile, profileFromDraft, validateStep } from "../../components/profile/ProfileSteps";
import { EQUIPMENT, EXPERIENCE, goalLabel } from "@/lib/profile";
import { cmToFtIn, kgToDisplay, weightUnit } from "@/lib/units";
import { api } from "@/lib/api";

function summarize(id, p) {
  const u = weightUnit(p.units);
  switch (id) {
    case "goals":
      return p.goals.map(goalLabel).join(", ");
    case "body": {
      const h = p.units === "metric" ? `${Math.round(p.heightCm)} cm` : (({ ft, in: i }) => `${ft}'${i}"`)(cmToFtIn(p.heightCm));
      return `${p.age} y · ${h} · ${kgToDisplay(p.weightKg, p.units)} ${u}`;
    }
    case "experience":
      return EXPERIENCE.find((e) => e.id === p.experience)?.label;
    case "schedule":
      return `${p.daysPerWeek} days · ${p.sessionMinutes} min · ${EQUIPMENT.find((e) => e.id === p.equipment)?.label}`;
    case "limits":
      return p.injuries || "None";
  }
}

const LABELS = { goals: "Goals", body: "Body & units", experience: "Experience & lifts", schedule: "Schedule & equipment", limits: "Injuries & limits" };

export default function SettingsView({ user, profile: initialProfile, planInfo, ai }) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirtyPlan, setDirtyPlan] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [confirm, setConfirm] = useState(null); // "logout" | "delete"
  const [busy, setBusy] = useState(false);

  function openEdit(id) {
    setDraft(draftFromProfile(profile));
    setErrors({});
    setEditing(id);
  }

  async function save() {
    const e = validateStep(editing, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const next = profileFromDraft(draft);
      await api("/api/profile", { method: "PUT", body: { profile: next } });
      setProfile(next);
      setEditing(null);
      setDirtyPlan(true);
      toast("Profile updated");
      router.refresh();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api("/api/profile", { method: "PUT", body: { profile, name: name.trim() } });
      setNameOpen(false);
      toast("Name updated");
      router.refresh();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setBusy(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await api("/api/account", { method: "DELETE" });
      window.location.href = "/signup";
    } catch (err) {
      toast(err.message, "error");
      setBusy(false);
    }
  }

  const step = STEPS.find((s) => s.id === editing);

  return (
    <>
      <PageHeader title="Settings" />

      {dirtyPlan && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent-soft/50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            <strong>Profile changed.</strong> Rebuild your plan so it reflects your new answers.
          </p>
          <Button size="sm" onClick={() => setRegenOpen(true)}>
            Rebuild plan
          </Button>
        </div>
      )}

      <SectionTitle>Profile</SectionTitle>
      <Card className="mb-8 divide-y divide-line">
        <SettingRow label="Name" value={user.name} onClick={() => setNameOpen(true)} />
        {STEPS.map((s) => (
          <SettingRow key={s.id} label={LABELS[s.id]} value={summarize(s.id, profile)} onClick={() => openEdit(s.id)} />
        ))}
      </Card>

      <SectionTitle>Plan</SectionTitle>
      <Card className="mb-8 divide-y divide-line">
        <div className="p-4">
          <p className="font-medium">Current plan</p>
          <p className="text-sm text-muted">
            Built by {planInfo.source === "ai" ? "the AI coach" : "the built-in coach"} on{" "}
            {new Date(planInfo.createdAt.replace(" ", "T") + "Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="p-4">
          <p className="font-medium">AI coach</p>
          <p className="text-sm text-muted">{ai.configured ? `Connected · model ${ai.model}` : "Not configured — the built-in coach is used."}</p>
        </div>
        <button onClick={() => setRegenOpen(true)} className="flex w-full items-center gap-3 p-4 text-left font-medium hover:bg-surface-2">
          <GoSync className="text-accent" /> Build a new plan
        </button>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card className="mb-8 divide-y divide-line">
        <div className="p-4">
          <p className="font-medium">Email</p>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <button onClick={() => setConfirm("logout")} className="flex w-full items-center gap-3 p-4 text-left font-medium hover:bg-surface-2">
          <GoSignOut /> Log out
        </button>
        <button onClick={() => setConfirm("delete")} className="flex w-full items-center gap-3 p-4 text-left font-medium text-danger hover:bg-danger/5">
          <GoTrash /> Delete account
        </button>
      </Card>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={step?.title ?? ""}
        description={step?.subtitle}
        footer={
          <Button block size="lg" onClick={save} loading={saving}>
            Save changes
          </Button>
        }
      >
        {editing && draft && <StepFields id={editing} draft={draft} setDraft={setDraft} errors={errors} />}
      </Sheet>

      <Sheet open={nameOpen} onClose={() => setNameOpen(false)} title="Your name">
        <form onSubmit={saveName} className="space-y-4">
          <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          <Button type="submit" block size="lg" loading={saving}>
            Save
          </Button>
        </form>
      </Sheet>

      <RegeneratePlan
        open={regenOpen}
        onClose={() => {
          setRegenOpen(false);
          setDirtyPlan(false);
        }}
      />

      <ConfirmSheet
        open={confirm === "logout"}
        onClose={() => setConfirm(null)}
        onConfirm={logout}
        loading={busy}
        title="Log out?"
        confirmLabel="Log out"
      />
      <ConfirmSheet
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={deleteAccount}
        loading={busy}
        danger
        title="Delete your account?"
        description="This permanently deletes your profile, plans and all workout history. This can't be undone."
        confirmLabel="Delete forever"
      />
    </>
  );
}

function SettingRow({ label, value, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface-2">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block truncate text-sm text-muted">{value}</span>
      </span>
      <GoChevronRight className="shrink-0 text-muted" />
    </button>
  );
}
