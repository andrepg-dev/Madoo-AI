export const CONTACTS_IMPORT_QUEUE = "contacts-import";
export const CONTACTS_IMPORT_JOB = "contacts-import";

export type ContactImportColumnMapping = {
  email: string;
  firstName?: string;
  lastName?: string;
};

export type ContactImportJobPayload = {
  jobId: string;
  workspaceId: string;
  columnMapping: ContactImportColumnMapping;
};

export type ContactImportRowError = {
  row: number;
  email?: string;
  reason: string;
};
