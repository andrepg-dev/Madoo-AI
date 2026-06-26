# 116 — Share-to-community: version picker, editor uses full modal, image-render check

Three issues reported from testing community sharing.

## 1 + 2 — Editor share lacked categories/description; modal lacked version picker
There were two share flows: the full `ShareToCommunityModal` (home/projects cards, has
categories + description) and a bare quick-publish in the editor `ShareProjectDropdown`
(hardcoded `category:"Other"`, no description, no version). Unified on the full modal and
added a version picker to it.

`apps/client/components/home/project-show-case.tsx`
- `ShareToCommunityModal` is now `export`ed for reuse.
- Added a "Version to publish" `Select` (shown when the email has >1 version); passes
  `variantSeq` into `onSubmit`. Defaults to latest.
- Reset effect now keys on `email?.id` instead of the `email` object, so selections
  (categories/description) aren't wiped by parent re-renders.

`apps/client/components/project/editor/ShareProjectDropdown.tsx`
- Community "Share" now opens `ShareToCommunityModal` (full categories + description +
  version) instead of publishing directly with hardcoded "Other".
- Removed the inline version `Select`; the mutation now takes the full
  `ShareEmailToCommunityInput` from the modal.

(Backend already honors `variantSeq` from #115.)

## 3 — "Pexels images not seen in community render" — investigated, already fixed
Pulled the actual shared template ("Bold ideas deserve a bold stage.") from prod and
rendered its stored `compiledHtml` headless (Chromium) in three modes: direct,
`sandbox=""` (community frame), and `sandbox="allow-same-origin"` (editor frame). The
geometric Pexels background rendered correctly in ALL three. The image is rehosted to our
S3 (`found-images/…`, 200, public) and the `background-image` survives in compiledHtml.
CDN serves 200 regardless of Origin/Referer. So the render is correct now — the missing
image in the earlier screenshot predates the Pexels→S3 rehost (or was a stale cache).
No code change needed.

## Notes
- ShareProjectDropdown now imports project-show-case (a large client module) for the
  modal; acceptable for now, candidate for extracting the modal to its own file later.
- Client typechecks clean.
