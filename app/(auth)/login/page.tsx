"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Connexion</h1>
      <p className="mt-2 text-sm text-noir/60">Ravi de vous revoir sur Misswaxbeautycare.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-noir/70">Email</label>
          <input
            {...register("email")}
            type="email"
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm text-noir/70">Mot de passe</label>
          <input
            {...register("password")}
            type="password"
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-noir/60">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-or-dark underline">Créer un compte</Link>
      </p>
    </div>
  );
}
