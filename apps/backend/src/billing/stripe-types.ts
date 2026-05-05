/**
 * Local type aliases for Stripe SDK v22.
 *
 * The cjs entry of the npm package only exposes the instance type via its
 * declared namespace, so `Stripe.Subscription`, `Stripe.Event`, etc. don't
 * resolve in CommonJS-compiled code. These aliases pull the rich types out
 * of the esm typings (which expose the full class+namespace merge) so the
 * rest of the billing code can stay strongly typed.
 */
import type { Stripe as StripeNS } from "stripe/esm/stripe.esm.node";

export type StripeClient = StripeNS;
export type StripeEvent = StripeNS.Event;
export type StripeSubscription = StripeNS.Subscription;
export type StripeSubscriptionStatus = StripeNS.Subscription.Status;
export type StripeCheckoutSession = StripeNS.Checkout.Session;
export type StripeInvoice = StripeNS.Invoice;
