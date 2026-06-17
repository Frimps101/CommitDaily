import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen pb-16">
      <Header showActions />
      <main className="container max-w-2xl py-6">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <SettingsForm />
      </main>
    </div>
  );
}
