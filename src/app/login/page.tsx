import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = typeof searchParams?.next === "string" ? searchParams.next : "/";

  return (
    <main style={{ maxWidth: 480, margin: "48px auto", padding: 16 }}>
      <h1>Sign in</h1>
      <p style={{ opacity: 0.8 }}>This console is password-protected.</p>
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
