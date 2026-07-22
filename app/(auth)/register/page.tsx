"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPro = searchParams.get("type") === "pro";
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error || !authData.user) {
      setError("Impossible de créer le compte. Réessayez.");
      return;
    }

    // Crée le profil applicatif via une route API (utilise la clé service_role côté serveur)
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authId: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: isPro ? "PROFESSIONAL" : "CLIENT",
      }),
    });

    router.push(isPro ? "/pro/dashboard" : "/client/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl text-noir">
        {isPro ? "Créer mon espace professionnel" : "Créer mon compte"}
      </h1>
      <p className="mt-2 text-sm text-noir/60">
        {isPro
          ? "Rejoignez Misswaxbeautycare et développez votre activité."
          : "Rejoignez Misswaxbeautycare en quelques secondes."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-noir/70">Prénom</label>
            <input {...register("firstName")} className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or" />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-sm text-noir/70">Nom</label>
            <input {...register("lastName")} className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or" />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="text-sm text-noir/70">Email</label>
          <input {...register("email")} type="email" className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm text-noir/70">Téléphone</label>
          <input {...register("phone")} className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or" />
        </div>
        <div>
          <label className="text-sm text-noir/70">Mot de passe</label>
          <input {...register("password")} type="password" className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-noir/60">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-or-dark underline">Se connecter</Link>
      </p>
    </div>
  );
}
