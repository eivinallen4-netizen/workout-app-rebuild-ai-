import { loadAppData } from "@/lib/session-data";
import { findExercise } from "@/lib/plan";
import PageHeader from "../../../components/PageHeader";
import { EmptyState } from "../../../components/ui/States";
import Button from "../../../components/ui/Button";
import ExerciseDetail from "./ExerciseDetail";

export const metadata = { title: "Exercise" };

export default async function ExercisePage({ params }) {
  const { profile, plan } = await loadAppData();
  const found = findExercise(plan, params.slug);
  if (!found)
    return (
      <>
        <PageHeader title="Exercise not found" back="/plan" />
        <EmptyState title="This exercise isn't in your current plan" action={<Button href="/plan">View your plan</Button>}>
          It may have been swapped or your plan was regenerated.
        </EmptyState>
      </>
    );
  const days = plan.weeklyRoutine.filter((d) => d.exercises.some((e) => e.slug === params.slug)).map((d) => d.day);
  return <ExerciseDetail exercise={found.exercise} days={days} units={profile.units} />;
}
