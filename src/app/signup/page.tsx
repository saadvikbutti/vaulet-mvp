import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Create your account</h1>
        <p className="text-sm text-muted text-center mb-6">Start a shared wallet for your next trip</p>
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <AuthForm mode="signup" />
        </div>
        <p className="text-sm text-muted text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
