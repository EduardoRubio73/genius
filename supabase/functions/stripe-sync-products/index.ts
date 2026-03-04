import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada. Adicione em Settings → Edge Functions.");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // 1. Ler todos os produtos e preços do Supabase
    const { data: products, error: prodErr } = await admin
      .from("billing_products")
      .select("*")
      .order("sort_order");
    if (prodErr) throw prodErr;

    const { data: prices, error: priceErr } = await admin
      .from("billing_prices")
      .select("*");
    if (priceErr) throw priceErr;

    const summary = { products_created: 0, products_updated: 0, prices_created: 0, prices_updated: 0 };

    // 2. Para cada produto: criar ou atualizar no Stripe
    for (const product of products || []) {
      if (product.stripe_product_id) {
        // Atualizar produto existente no Stripe
        try {
          await stripe.products.update(product.stripe_product_id, {
            name: product.display_name || product.name,
            active: product.is_active,
            metadata: {
              product_id: product.id,
              plan_tier: product.plan_tier,
            },
          });
          summary.products_updated++;
        } catch (e) {
          console.error(`Erro ao atualizar produto ${product.id} no Stripe:`, e);
        }
      } else {
        // Criar produto no Stripe
        try {
          const stripeProduct = await stripe.products.create({
            name: product.display_name || product.name,
            active: true,
            metadata: {
              product_id: product.id,
              plan_tier: product.plan_tier,
            },
          });

          await admin
            .from("billing_products")
            .update({
              stripe_product_id: stripeProduct.id,
              stripe_synced: true,
              stripe_last_synced_at: new Date().toISOString(),
            })
            .eq("id", product.id);

          // Update local reference for price creation
          product.stripe_product_id = stripeProduct.id;
          summary.products_created++;
        } catch (e) {
          console.error(`Erro ao criar produto ${product.id} no Stripe:`, e);
        }
      }
    }

    // 3. Para cada preço: criar ou sincronizar no Stripe
    for (const price of prices || []) {
      const product = (products || []).find((p) => p.id === price.product_id);
      if (!product?.stripe_product_id) {
        console.warn(`Preço ${price.id} sem produto Stripe associado, pulando.`);
        continue;
      }

      if (price.stripe_price_id) {
        // Preço já existe no Stripe — apenas marcar como sincronizado
        await admin
          .from("billing_prices")
          .update({
            stripe_synced: true,
            stripe_last_synced_at: new Date().toISOString(),
          })
          .eq("id", price.id);
        summary.prices_updated++;
      } else {
        // Criar preço no Stripe
        try {
          const priceParams: any = {
            product: product.stripe_product_id,
            unit_amount: price.unit_amount || 0,
            currency: price.currency || "brl",
            active: true,
            metadata: {
              product_id: price.product_id,
              price_id: price.id,
            },
          };

          if (price.recurring_interval) {
            priceParams.recurring = { interval: price.recurring_interval };
          }

          const stripePrice = await stripe.prices.create(priceParams);

          await admin
            .from("billing_prices")
            .update({
              stripe_price_id: stripePrice.id,
              is_active: true,
              stripe_synced: true,
              stripe_last_synced_at: new Date().toISOString(),
            })
            .eq("id", price.id);

          summary.prices_created++;
        } catch (e) {
          console.error(`Erro ao criar preço ${price.id} no Stripe:`, e);
        }
      }
    }

    // 4. Ativar produtos que têm preços ativos
    for (const product of products || []) {
      const hasActivePrice = (prices || []).some(
        (p) => p.product_id === product.id && p.is_active && p.stripe_price_id
      );
      if (hasActivePrice && !product.is_active) {
        await admin
          .from("billing_products")
          .update({ is_active: true })
          .eq("id", product.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("stripe-sync-products error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
