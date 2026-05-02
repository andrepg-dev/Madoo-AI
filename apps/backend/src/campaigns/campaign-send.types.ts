export const CAMPAIGN_SEND_QUEUE = "campaign-send";
export const CAMPAIGN_SEND_JOB = "campaign-send";

export type CampaignSendJobPayload = {
  workspaceId: string;
  campaignId: string;
  actorUserId: string;
};
