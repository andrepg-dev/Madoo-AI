# 110 — "Test email skipped": RESEND_FROM_EMAIL was never set

## Diagnosis

The "Resend is not configured in this environment" toast comes from
`MailService.sendEmail`, which requires BOTH `RESEND_API_KEY` and
`RESEND_FROM_EMAIL`. Prod (and local) had only the API key; the from address
had never been configured anywhere. Prod logs confirmed:
"Resend env missing; email skipped." Frontend needs no Resend config — correct
assumption.

## Fix (env only, no code)

- Prod `/root/Madoo-AI/apps/backend/.env`: added
  `RESEND_FROM_EMAIL=Madoo <no-reply@madooai.com>` (user-confirmed verified
  domain), container restarted, var confirmed inside container, health 200.
- Local `apps/backend/.env`: same var added.

## Note for later

`skipped: true` is also returned when the Resend API call fails (403/etc.),
and the frontend then shows the misleading "not configured" message. If sends
still report skipped, check backend logs for "Resend send failed" — that would
mean the domain isn't actually verified for this API key. Consider splitting
the response into `skipped` vs `failed` someday.

## Verify

Test panel → send test email → toast "Test email sent" + delivery to inbox.
