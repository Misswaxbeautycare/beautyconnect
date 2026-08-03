"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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

    // Si on vient d'une page précise (ex: réservation sur une page salon),
    // on y retourne directement plutôt que d'envoyer systématiquement vers
    // un tableau de bord.
    const redirect = searchParams.get("redirect");
    if (redirect) {
      router.push(redirect);
      router.refresh();
      return;
    }

    // Redirige vers le bon espace selon le rôle — avant ce correctif, tous
    // les comptes (y compris professionnels) atterrissaient sur l'espace client.
    try {
      const res = await fetch("/api/users");
      const body = await res.json();
      router.push(body.role === "PROFESSIONAL" ? "/pro/dashboard" : "/client/dashboard");
    } catch {
      router.push("/client/dashboard");
    }
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
          <div className="flex items-center justify-between">
            <label className="text-sm text-noir/70">Mot de passe</label>
            <Link href="/mot-de-passe-oublie" className="text-xs text-or-dark underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-beige-dark px-4 py-3 pr-11 outline-none focus:border-or"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-noir/50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-noir/60">
        Pas encore de compte ?{" "}
        <Link
          href={searchParams.get("redirect") ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/register"}
          className="text-or-dark underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
