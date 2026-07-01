import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Madoo Admin</h1>
        <p className="login-sub">Sign in with your admin Google account.</p>
        <LoginForm />
      </div>
    </div>
  );
}
