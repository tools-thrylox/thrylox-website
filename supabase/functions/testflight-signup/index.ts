import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://thrylox.com";
const publicInviteUrl =
  Deno.env.get("PUBLIC_TESTFLIGHT_LINK") ??
  "https://testflight.apple.com/join/g2C5saQ4";
const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "info@thrylox.com";
const resendFromEmail =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "playtest@thrylox.com";
const resendReplyTo =
  Deno.env.get("RESEND_REPLY_TO") ?? supportEmail;

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders
  });
}

function buildEmailHtml(email: string) {
  const escapedEmail = email.replace(/[<>&"]/g, "");
  return `
    <div style="font-family:Arial,sans-serif;background:#fcf6d9;color:#132052;padding:32px 20px;">
      <div style="max-width:560px;margin:0 auto;background:#fff9e7;border:1px solid rgba(19,32,82,0.12);padding:32px 24px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#19b8b5;">BOG playtest access</p>
        <h1 style="margin:0 0 16px;font-size:30px;line-height:1;color:#132052;">Your build is ready.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#32457c;">
          Thanks for joining the first external BOG wave, ${escapedEmail}. Your access path is open now.
        </p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#32457c;">
          Open TestFlight with the button below and install the current build whenever you're ready.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${publicInviteUrl}" style="display:inline-block;padding:14px 20px;background:#33c1a1;color:#132052;text-decoration:none;font-weight:700;border-radius:10px;">
            Open TestFlight
          </a>
        </p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#32457c;">If the button doesn't open directly, use this link:</p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
          <a href="${publicInviteUrl}" style="color:#132052;">${publicInviteUrl}</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#32457c;">
          Need help? Reply to this message or contact <a href="mailto:${supportEmail}" style="color:#132052;">${supportEmail}</a>.
        </p>
      </div>
    </div>
  `;
}

function buildEmailText() {
  return [
    "Your BOG playtest access is ready.",
    "",
    `Open TestFlight: ${publicInviteUrl}`,
    "",
    `If you run into access issues, contact ${supportEmail}.`
  ].join("\n");
}

async function sendWithResend(email: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return {
      emailSent: false,
      providerMessageId: null,
      deliveryError: "Missing RESEND_API_KEY"
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      reply_to: resendReplyTo,
      subject: "Your BOG playtest access",
      html: buildEmailHtml(email),
      text: buildEmailText()
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      emailSent: false,
      providerMessageId: null,
      deliveryError:
        result?.message ||
        result?.error?.message ||
        `Resend request failed with status ${response.status}`
    };
  }

  return {
    emailSent: true,
    providerMessageId: result?.id ?? null,
    deliveryError: null
  };
}

function successPayload(emailSent: boolean, deliveryError: string | null) {
  if (emailSent) {
    return {
      ok: true,
      emailSent: true,
      inviteUrl: publicInviteUrl,
      successKicker: "invite sent",
      successTitle: "Check your email.",
      message:
        "Your TestFlight link has been sent to your email. You can also continue right now below.",
      pointTitle: "Email delivered",
      pointCopy:
        "We sent the current BOG access link to your inbox and kept the same path ready on-screen."
    };
  }

  return {
    ok: true,
    emailSent: false,
    inviteUrl: publicInviteUrl,
    successKicker: "fallback ready",
    successTitle: "Access ready.",
    message:
      "We couldn't send the email invite right now, but your direct TestFlight path is ready below.",
    pointTitle: "Direct access ready",
    pointCopy:
      deliveryError ||
      "Use the direct TestFlight link below and we will keep the signup visible on our side."
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ ok: false, error: "Supabase server configuration is incomplete" }, 500);
    }

    const body = await request.json();
    const project = String(body?.project || "BOG").trim() || "BOG";
    const sourceUrl = String(body?.source || "").trim();
    const email = String(body?.data?.email || "").trim().toLowerCase();
    const campaign = String(body?.data?.campaign || "").trim();
    const utmSource = String(body?.data?.utmSource || "").trim();
    const utmMedium = String(body?.data?.utmMedium || "").trim();
    const utmCampaign = String(body?.data?.utmCampaign || "").trim();
    const fbclid = String(body?.data?.fbclid || "").trim();
    const deliveryMode = String(body?.deliveryMode || "email_plus_public_fallback").trim();

    if (!email || !emailPattern.test(email)) {
      return jsonResponse({ ok: false, error: "A valid email is required" }, 400);
    }

    const now = new Date().toISOString();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const existingResult = await supabase
      .from("playtest_signups")
      .select("id, signup_count")
      .eq("project", project)
      .eq("email", email)
      .maybeSingle();

    if (existingResult.error) {
      return jsonResponse({ ok: false, error: existingResult.error.message }, 500);
    }

    const sharedRecord = {
      source_url: sourceUrl,
      campaign,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      fbclid,
      delivery_mode: deliveryMode,
      latest_invite_url: publicInviteUrl,
      consent_timestamp: now,
      last_seen_at: now,
      raw_payload: body
    };

    if (existingResult.data?.id) {
      const updateResult = await supabase
        .from("playtest_signups")
        .update({
          ...sharedRecord,
          signup_count: Number(existingResult.data.signup_count || 1) + 1
        })
        .eq("id", existingResult.data.id);

      if (updateResult.error) {
        return jsonResponse({ ok: false, error: updateResult.error.message }, 500);
      }
    } else {
      const insertResult = await supabase.from("playtest_signups").insert({
        project,
        email,
        ...sharedRecord
      });

      if (insertResult.error) {
        return jsonResponse({ ok: false, error: insertResult.error.message }, 500);
      }
    }

    const delivery = await sendWithResend(email);

    const finalUpdate = await supabase
      .from("playtest_signups")
      .update({
        email_sent: delivery.emailSent,
        email_provider: "resend",
        email_provider_message_id: delivery.providerMessageId,
        delivery_error: delivery.deliveryError
      })
      .eq("project", project)
      .eq("email", email);

    if (finalUpdate.error) {
      return jsonResponse({ ok: false, error: finalUpdate.error.message }, 500);
    }

    return jsonResponse(successPayload(delivery.emailSent, delivery.deliveryError));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected signup error";
    return jsonResponse({
      ok: true,
      emailSent: false,
      inviteUrl: publicInviteUrl,
      successKicker: "fallback ready",
      successTitle: "Access ready.",
      message:
        "We hit a signup issue on our side, but your direct TestFlight path is still ready below.",
      pointTitle: "Direct access ready",
      pointCopy: message
    });
  }
});
