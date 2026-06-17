import { auth } from "@/auth";
import { Landing } from "@/components/Landing";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    return <Landing />;
  }
  return <Dashboard />;
}
