import { z } from "zod";

/** OAuth mail providers that support draft creation. */
export const ConnectionProviderSchema = z.enum(["gmail", "outlook"]);
export type ConnectionProvider = z.infer<typeof ConnectionProviderSchema>;

/** A connected mail account (tokens never leave the backend). */
export const ProviderConnectionDtoSchema = z.object({
  provider: ConnectionProviderSchema,
  accountEmail: z.string().nullable(),
  expiresAt: z.string().nullable(),
  connected: z.literal(true),
});
export type ProviderConnectionDto = z.infer<typeof ProviderConnectionDtoSchema>;

export const ProviderConnectionListSchema = z.array(ProviderConnectionDtoSchema);

/** Response from GET /connections/:provider/authorize-url. */
export const AuthorizeUrlResponseSchema = z.object({
  url: z.string().url(),
});
export type AuthorizeUrlResponse = z.infer<typeof AuthorizeUrlResponseSchema>;

/** Body for POST /connections/:provider/exchange (OAuth code → tokens). */
export const ExchangeConnectionInputSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional(),
  /** Signed anti-CSRF value issued by `GET /connections/:provider/authorize-url`. */
  state: z.string().min(1),
});
export type ExchangeConnectionInput = z.infer<typeof ExchangeConnectionInputSchema>;

/** Response from creating a Gmail/Outlook draft. */
export const CreateDraftResponseSchema = z.object({
  ok: z.literal(true),
  provider: ConnectionProviderSchema,
  openUrl: z.string().url(),
});
export type CreateDraftResponse = z.infer<typeof CreateDraftResponseSchema>;
