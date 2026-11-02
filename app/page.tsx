import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPage from "@/components/auth/LoginPage";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth/simpleAuth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;

  if (authenticated) redirect("/unified");

  return <LoginPage />;
}
