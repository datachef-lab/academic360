"use client";

import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

function ForgotPasswordContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
