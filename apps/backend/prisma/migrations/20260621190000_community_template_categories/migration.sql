ALTER TABLE "CommunityTemplate"
ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "CommunityTemplate"
SET "categories" = CASE
  WHEN "category" IS NULL OR btrim("category") = '' THEN ARRAY['Other']::TEXT[]
  WHEN lower(btrim("category")) = 'event' THEN ARRAY['Events & Webinars']::TEXT[]
  WHEN lower(btrim("category")) = 'engagement' THEN ARRAY['Re-engagement']::TEXT[]
  WHEN lower(btrim("category")) = 'growth' THEN ARRAY['Promotional']::TEXT[]
  WHEN lower(btrim("category")) = 'launch' THEN ARRAY['Product Launch']::TEXT[]
  WHEN lower(btrim("category")) = 'onboarding' THEN ARRAY['Welcome']::TEXT[]
  WHEN lower(btrim("category")) = 'promotion' THEN ARRAY['Promotional']::TEXT[]
  ELSE ARRAY["category"]::TEXT[]
END
WHERE cardinality("categories") = 0;
