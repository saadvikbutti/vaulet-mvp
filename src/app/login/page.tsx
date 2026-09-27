import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Welcome back</h1>
        <p className="text-sm text-muted text-center mb-6">Log in to your Vaulets</p>
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <AuthForm mode="login" />
        </div>
        <p className="text-sm text-muted text-center mt-4">
          New here?{" "}
          <Link href="/signup" className="text-accent font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
