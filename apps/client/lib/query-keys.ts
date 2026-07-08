/**
 * React Query root keys whose data is scoped to the active workspace. When the
 * user switches workspaces these caches must be dropped so each workspace shows
 * its own data instead of the previous one's. Keyed by the first key segment;
 * `removeQueries({ queryKey: [key] })` matches every query with that prefix
 * (e.g. `["email", id]`, `["billing-overview", workspaceId]`).
 */
export const WORKSPACE_SCOPED_QUERY_KEYS = [
  "emails",
  "email",
  "email-chat",
  "email-rating",
  "templates",
  "template-preview",
  "community-templates",
  "community-template",
  "billing-overview",
  "workspace-invites",
  "workspace-members",
] as const;
