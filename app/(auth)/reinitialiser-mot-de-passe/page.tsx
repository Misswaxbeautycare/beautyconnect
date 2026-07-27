"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
});
type FormInput = z.infer<typeof schema>;

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormInput) {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setError("Une erreur est survenue. Le lien a peut-être expiré, redemandez-en un nouveau.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-noir/60">Choisissez votre nouveau mot de passe.</p>

      {success ? (
        <p className="mt-8 text-sm text-green-700">
          Mot de passe mis à jour ! Redirection vers la connexion...
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-noir/70">Nouveau mot de passe</label>
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
            {isSubmitting ? "Mise à jour..." : "Confirmer le nouveau mot de passe"}
          </Button>
        </form>
      )}
    </div>
  );
}
