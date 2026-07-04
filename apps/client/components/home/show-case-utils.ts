import {
  COMMUNITY_TEMPLATE_MAX_CATEGORIES,
  type CommunityTemplateCategory,
  type EmailDto,
  type VariableSchemaRoot,
  type VariableSpec,
} from "@madoo/shared";

export type CommunityCategoryFilter = "all" | CommunityTemplateCategory;

export const templateMasonryWeights = [1.25, 1.4, 1.33, 1.43, 1.5] as const;

export const roleLabels: Record<NonNullable<VariableSpec["role"]>, string> = {
  text: "Text",
  url: "URL",
  image: "Image",
  date: "Date",
};

const categorySuggestionRules: Array<{
  category: CommunityTemplateCategory;
  pattern: RegExp;
}> = [
  {
    category: "Abandoned Cart",
    pattern: /\b(abandoned\s+cart|cart\s+recovery)\b/i,
  },
  {
    category: "Browse Abandonment",
    pattern: /\b(browse\s+abandon\w*|browsed|viewed\s+product|still\s+looking)\b/i,
  },
  {
    category: "Back in Stock",
    pattern: /\b(back\s+in\s+stock|restock\w*|now\s+available|in\s+stock\s+again)\b/i,
  },
  {
    category: "Price Drop",
    pattern: /\b(price\s+drop|price\s+cut|now\s+cheaper|lower\s+price|reduced\s+price)\b/i,
  },
  {
    category: "Order Confirmation",
    pattern: /\b(order\s+confirm\w*|order\s+placed|order\s+received|your\s+order)\b/i,
  },
  {
    category: "Shipping & Delivery",
    pattern: /\b(shipp\w*|shipped|on\s+its\s+way|out\s+for\s+delivery|tracking|delivered|delivery)\b/i,
  },
  {
    category: "Receipt / Invoice",
    pattern: /\b(receipt|invoice|payment\s+confirm\w*|paid|billing)\b/i,
  },
  {
    category: "Post-Purchase",
    pattern: /\b(post[-\s]?purchase|after\s+your\s+purchase|how\s+to\s+use|getting\s+started\s+with\s+your)\b/i,
  },
  {
    category: "Cross-sell / Upsell",
    pattern: /\b(cross[-\s]?sell|up[-\s]?sell|you\s+may\s+also\s+like|complete\s+the\s+look|recommended\s+for\s+you|pairs\s+well)\b/i,
  },
  {
    category: "Loyalty & Rewards",
    pattern: /\b(loyalty|rewards?|points|vip|membership|perks|tier)\b/i,
  },
  {
    category: "Birthday & Anniversary",
    pattern: /\b(birthday|anniversary|happy\s+birthday)\b/i,
  },
  {
    category: "Review Request",
    pattern: /\b(review\s+request|leave\s+a\s+review|rate\s+your|how\s+did\s+we\s+do|share\s+your\s+experience)\b/i,
  },
  {
    category: "Sale / Flash Sale",
    pattern: /\b(flash\s+sale|clearance|limited\s+time|ends\s+(tonight|soon|today)|while\s+supplies\s+last|markdown)\b/i,
  },
  {
    category: "Events & Webinars",
    pattern: /\b(event|webinar|conference|workshop|invite|invitation)\b/i,
  },
  {
    category: "Seasonal / Holiday",
    pattern:
      /\b(holiday|christmas|black\s+friday|cyber\s+monday|thanksgiving|new\s+year|valentine|halloween|seasonal)\b/i,
  },
  {
    category: "Product Launch",
    pattern: /\b(launch|new\s+product|release|waitlist)\b/i,
  },
  {
    category: "Survey & Feedback",
    pattern: /\b(survey|feedback|review|rating|nps)\b/i,
  },
  {
    category: "Re-engagement",
    pattern: /\b(re-engage|reengage|winback|inactive|miss\s+you|come\s+back)\b/i,
  },
  {
    category: "Transactional",
    pattern:
      /\b(receipt|invoice|password|reset|account|security|shipping|delivery|order)\b/i,
  },
  {
    category: "Confirmation",
    pattern: /\b(confirm|confirmation|rsvp|booking|reservation)\b/i,
  },
  {
    category: "Promotional",
    pattern: /\b(sale|discount|promo|coupon|offer|deal)\b/i,
  },
  {
    category: "Newsletter",
    pattern: /\b(newsletter|digest|roundup|weekly|monthly)\b/i,
  },
  {
    category: "Welcome",
    pattern: /\b(welcome|onboard|onboarding|get\s+started)\b/i,
  },
  {
    category: "Announcement",
    pattern: /\b(announce|announcement|update|news|feature)\b/i,
  },
  {
    category: "Referral",
    pattern: /\b(referral|refer|invite\s+(a\s+)?friend)\b/i,
  },
  {
    category: "Internal / HR",
    pattern: /\b(hiring|hr|employee|team|internal|policy)\b/i,
  },
  {
    category: "Education / Tutorial",
    pattern: /\b(tutorial|lesson|course|guide|learn|education)\b/i,
  },
  {
    category: "Thank You",
    pattern: /\b(thank\s+you|thanks|appreciation)\b/i,
  },
];

export function getEmailTitle(email: EmailDto): string {
  const latestVariant = email.variants[email.variants.length - 1];
  return (
    latestVariant?.subject || email.title || email.prompt || "Untitled email"
  );
}

export function getEmailSubtitle(email: EmailDto): string {
  const date = new Date(email.updatedAt);
  const formatted = Number.isNaN(date.getTime())
    ? "Updated"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
  return `${email.status.toLowerCase()} - ${formatted}`;
}

export function getCommunitySubtitle(template: {
  authorName?: string | null;
  categories: CommunityTemplateCategory[];
}): string {
  return template.authorName || template.categories[0] || "Community";
}

export function getPreviewUrl(email: EmailDto): string | null {
  return email.variants[email.variants.length - 1]?.previewUrl ?? null;
}

export function getTemplateMasonryWeight(
  _item: unknown,
  index: number,
): number {
  return templateMasonryWeights[index % templateMasonryWeights.length];
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function cloneSchema(schema: VariableSchemaRoot): VariableSchemaRoot {
  return {
    variables: schema.variables.map((variable) => ({ ...variable })),
  };
}

export function inputTypeForRole(role: VariableSpec["role"]): string {
  if (role === "url" || role === "image") return "url";
  if (role === "date") return "date";
  return "text";
}

export function defaultScope(variable: VariableSpec): "dynamic" | "static" {
  return variable.scope ?? "dynamic";
}

export function suggestCommunityCategories(
  email: EmailDto,
): CommunityTemplateCategory[] {
  const latestVariant = email.variants[email.variants.length - 1];
  const text = [
    getEmailTitle(email),
    email.prompt,
    email.audience,
    latestVariant?.subject,
  ]
    .filter(Boolean)
    .join(" ");
  const suggestions: CommunityTemplateCategory[] = [];
  for (const rule of categorySuggestionRules) {
    if (rule.pattern.test(text) && !suggestions.includes(rule.category)) {
      suggestions.push(rule.category);
      if (suggestions.length === COMMUNITY_TEMPLATE_MAX_CATEGORIES) break;
    }
  }
  return suggestions;
}

export function toggleCategorySelection(
  current: CommunityTemplateCategory[],
  category: CommunityTemplateCategory,
): CommunityTemplateCategory[] {
  if (current.includes(category)) {
    return current.filter((item) => item !== category);
  }
  if (current.length >= COMMUNITY_TEMPLATE_MAX_CATEGORIES) return current;
  return [...current, category];
}
