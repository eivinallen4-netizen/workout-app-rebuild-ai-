"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sheet from "./ui/Sheet";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";
import { api } from "@/lib/api";

export default function RegeneratePlan({ open, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(null);

  async function run(source) {
    setLoading(source);
    try {
      const res = await api("/api/plan/generate", { method: "POST", body: { source } });
      toast(res.warning ? "Plan rebuilt with the built-in coach" : "New plan ready");
      if (res.warning) toast(res.warning, "error");
      onClose();
      router.refresh();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => !loading && onClose()}
      title="Build a new plan?"
      description="We'll create a fresh week from your current profile and goals. Your workout history is kept."
    >
      <div className="space-y-3">
        <Button block size="lg" onClick={() => run("auto")} loading={loading === "auto"} disabled={!!loading}>
          {loading === "auto" ? "Building with AI… (up to a minute)" : "Build with AI coach"}
        </Button>
        <Button block size="lg" variant="secondary" onClick={() => run("builtin")} loading={loading === "builtin"} disabled={!!loading}>
          Use the built-in coach (instant)
        </Button>
        <p className="text-center text-sm text-muted">Want different goals or schedule? Update them in Settings first.</p>
      </div>
    </Sheet>
  );
}
