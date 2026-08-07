import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "Prénom trop court"),
  lastName: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const bookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  additionalServiceIds: z.array(z.string().uuid()).max(10).optional(),
  date: z.string(),
  notes: z.string().optional(),
  paymentType: z.enum(["DEPOSIT", "FULL", "ON_SITE"]),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  durationMin: z.number().int().min(5).max(600),
  price: z.number().positive(),
  depositPct: z.number().int().min(0).max(100).default(30),
  modes: z.array(z.enum(["SALON", "DOMICILE", "DEPLACEMENT"])).min(1).default(["SALON"]),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const salonSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  categoryIds: z.array(z.string().uuid()).min(1, "Choisissez au moins une catégorie"),
  domicileZone: z.string().optional(),
  deplacementZone: z.string().optional(),
});
export type SalonInput = z.infer<typeof salonSchema>;

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  photoUrl: z.string().url().optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const teamMemberSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  role: z.string().optional(),
  photoUrl: z.string().url().optional(),
});
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
