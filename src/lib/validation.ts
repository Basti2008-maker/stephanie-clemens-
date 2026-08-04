import { z } from "zod";

const optionalName = z.string().trim().max(100).optional().or(z.literal(""));

export const rsvpSchema = z
  .object({
    firstName: z.string().trim().min(1, "Vorname ist erforderlich.").max(100),
    lastName: z.string().trim().min(1, "Nachname ist erforderlich.").max(100),
    // Zweite Person – nur erforderlich, wenn die Paar-Option gewählt ist.
    isCouple: z.boolean().optional(),
    partnerFirstName: optionalName,
    partnerLastName: optionalName,
    email: z.string().trim().min(1, "E-Mail ist erforderlich.").email("Ungültige E-Mail-Adresse."),
    phone: z.string().trim().min(1, "Telefonnummer ist erforderlich.").max(50),
    street: z.string().trim().min(1, "Straße ist erforderlich.").max(200),
    zipCode: z.string().trim().min(1, "PLZ ist erforderlich.").max(20),
    city: z.string().trim().min(1, "Ort ist erforderlich.").max(100),
    country: z.string().trim().min(1, "Land ist erforderlich.").max(100),
    // Honeypot-Feld gegen Spam-Bots. Muss leer bleiben.
    website: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.isCouple) return;
    if (!data.partnerFirstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partnerFirstName"],
        message: "Vorname ist erforderlich.",
      });
    }
    if (!data.partnerLastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partnerLastName"],
        message: "Nachname ist erforderlich.",
      });
    }
  });

export type RsvpFormValues = z.infer<typeof rsvpSchema>;
