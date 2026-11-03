"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoArrowLeft, GoCheckCircleFill, GoAlert } from "react-icons/go";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Logo from "../components/Logo";
import { STEPS, StepFields, draftFromProfile, profileFromDraft, validateStep } from "../components/profile/ProfileSteps";
import { api } from "@/lib/api";

const BUILD_MESSAGES = [
  "Analysing your goals…",
  "Balancing training days and recovery…",
  "Choosing exercises for your equipment…",
  "Setting starting weights…",
  "Adding coaching tips…",
  "Almost there…",
];

export default function OnboardingWizard({ name, initialProfile }) {
  const router = useRouter();
  const [step, setStep] = useState(initialProfile ? STEPS.length - 1 : 0);
  const [draft, setDraft] = useState(() => draftFromProfile(initialProfile ?? {}));
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState("form"); // form | building | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    if (phase !== "building") return;
    const t = setInterval(() => setMsgIdx((i) => Math.min(i + 1, BUILD_MESSAGES.length - 1)), 3500);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  function next() {
    const e = validateStep(current.id, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (isLast) build();
    else setStep((s) => s + 1);
  }

  async function build(source = "auto") {
    // Validate everything in case an earlier step was skipped (e.g. returning user).
    for (const [i, s] of STEPS.entries()) {
      const e = validateStep(s.id, draft);
      if (Object.keys(e).length) {
        setStep(i);
        setErrors(e);
        setPhase("form");
        return;
      }
    }
    setPhase("building");
    setMsgIdx(0);
    setError("");
    try {
      await api("/api/profile", { method: "PUT", body: { profile: profileFromDraft(draft) } });
      const res = await api("/api/plan/generate", { method: "POST", body: { source } });
      setResult(res);
      if (res.warning) setPhase("done");
      else finish();
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  function finish() {
    router.replace("/");
    router.refresh();
  }

  if (phase === "building")
    return (
      <CenteredScreen>
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
          <Logo />
        </div>
        <h1 className="text-xl font-bold">Building your plan</h1>
        <p className="mt-2 flex items-center gap-2 text-muted" aria-live="polite">
          <Spinner className="h-4 w-4" /> {BUILD_MESSAGES[msgIdx]}
        </p>
        <p className="mt-6 text-sm text-muted">This can take up to a minute.</p>
      </CenteredScreen>
    );

  if (phase === "done")
    return (
      <CenteredScreen>
        <GoCheckCircleFill className="mb-4 text-accent" size={56} />
        <h1 className="text-2xl font-bold">Your plan is ready</h1>
        {result?.warning && (
          <p className="mt-3 max-w-sm rounded-xl bg-warn/10 p-3 text-left text-sm text-ink">
            <GoAlert className="mr-1.5 inline text-warn" />
            {result.warning}
          </p>
        )}
        <Button size="lg" className="mt-8 w-full max-w-xs" onClick={finish}>
          See today&apos;s workout
        </Button>
      </CenteredScreen>
    );

  if (phase === "error")
    return (
      <CenteredScreen>
        <GoAlert className="mb-4 text-danger" size={48} />
        <h1 className="text-xl font-bold">We couldn&apos;t build your plan</h1>
        <p className="mt-2 max-w-sm text-muted">{error}</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button size="lg" onClick={() => build()}>
            Try again
          </Button>
          <Button variant="secondary" size="lg" onClick={() => build("builtin")}>
            Use the built-in coach
          </Button>
          <Button variant="ghost" onClick={() => setPhase("form")}>
            Edit my answers
          </Button>
        </div>
      </CenteredScreen>
    );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="sticky top-0 z-10 bg-bg/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex h-11 items-center gap-2">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2">
              <GoArrowLeft size={22} />
            </button>
          ) : (
            <span className="w-2" />
          )}
          <span className="flex-1 text-center text-sm font-medium text-muted">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="w-9" />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4">
        {step === 0 && <p className="mb-1 font-medium text-accent">Hi {name.split(" ")[0]} 👋</p>}
        <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>
        <p className="mb-6 mt-1.5 text-muted">{current.subtitle}</p>
        <StepFields id={current.id} draft={draft} setDraft={setDraft} errors={errors} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Button size="lg" block onClick={next}>
            {isLast ? "Build my plan" : "Continue"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function CenteredScreen({ children }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center animate-fade-in">{children}</main>;
}
