"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ProInscriptionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: "pro",
        },
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/pro/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Créer mon espace pro</h1>
      <p className="mt-2 text-sm text-noir/60">Rejoignez Misswaxbeautycare en tant que professionnel.</p>

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
          <div className="relative mt-1">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-beige-dark px-4 py-3 pr-11 outline-none focus:border-or"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-noir/50">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Création..." : "Créer mon espace pro"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-noir/60">
        Déjà un compte ? <Link href="/login" className="text-or-dark underline">Se connecter</Link>
      </p>
    </div>
  );
}
