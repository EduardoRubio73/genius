import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
const admin = createClient(supabaseUrl, serviceRoleKey);

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth + super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const { data: isAdmin } = await admin.rpc("is_super_admin").setHeader("Authorization", authHeader);
    if (!isAdmin) {
      return jsonResponse(403, { error: "Forbidden - super admin required" });
    }

    const body = await req.json();
    const orgId = body?.org_id;

    if (!orgId) {
      return jsonResponse(400, { error: "org_id is required" });
    }

    // Get organization with stripe_customer_id
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, name, stripe_customer_id, plan_tier")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return jsonResponse(404, { error: "Organization not found" });
    }

    if (!org.stripe_customer_id) {
      return jsonResponse(400, { error: "Organization has no Stripe customer ID" });
    }

    // List subscriptions for this customer in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: "all",
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return jsonResponse(200, { 
        message: "No subscriptions found in Stripe for this customer",
        customer_id: org.stripe_customer_id,
        synced: 0
      });
    }

    let synced = 0;
    let errors: string[] = [];

    for (const stripeSub of subscriptions.data) {
      const priceId = stripeSub.items.data[0]?.price?.id;
      if (!priceId) {
        errors.push(`Subscription ${stripeSub.id}: no price found`);
        continue;
      }

      // Find local price by stripe_price_id
      const { data: localPrice } = await admin
        .from("billing_prices")
        .select("id, product_id")
        .eq("stripe_price_id", priceId)
        .maybeSingle();

      if (!localPrice) {
        errors.push(`Subscription ${stripeSub.id}: local price not found for ${priceId}`);
        continue;
      }

      const subData = {
        id: stripeSub.id,
        org_id: orgId,
        price_id: localPrice.id,
        status: stripeSub.status as any,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        trial_start: stripeSub.trial_start
          ? new Date(stripeSub.trial_start * 1000).toISOString()
          : null,
        trial_end: stripeSub.trial_end
          ? new Date(stripeSub.trial_end * 1000).toISOString()
          : null,
        cancel_at: stripeSub.cancel_at
          ? new Date(stripeSub.cancel_at * 1000).toISOString()
          : null,
        canceled_at: stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000).toISOString()
          : null,
        ended_at: stripeSub.ended_at
          ? new Date(stripeSub.ended_at * 1000).toISOString()
          : null,
        metadata: { ...stripeSub.metadata, org_id: orgId },
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await admin
        .from("billing_subscriptions")
        .upsert(subData, { onConflict: "id" });

      if (upsertError) {
        errors.push(`Subscription ${stripeSub.id}: ${upsertError.message}`);
      } else {
        synced++;
        console.log("Synced subscription:", stripeSub.id);
      }
    }

    // The trigger sync_org_plan will update the organization automatically
    // But let's also reset credits if there's an active subscription
    const activeStatuses = ["active", "trialing"];
    const hasActiveSub = subscriptions.data.some(s => activeStatuses.includes(s.status));
    
    if (hasActiveSub) {
      // The trigger should have updated plan_tier and plan_credits_total
      // We just need to ensure it ran by checking
      const { data: updatedOrg } = await admin
        .from("organizations")
        .select("plan_tier, plan_credits_total")
        .eq("id", orgId)
        .single();
      
      console.log("Organization after sync:", updatedOrg);
    }

    return jsonResponse(200, {
      message: `Synced ${synced} subscription(s)`,
      customer_id: org.stripe_customer_id,
      synced,
      total_in_stripe: subscriptions.data.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("sync-stripe-subscription error:", error);
    return jsonResponse(500, { error: "Internal server error", details: String(error) });
  }
});
