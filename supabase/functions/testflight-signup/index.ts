import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://thrylox.com";
const publicInviteUrl =
  Deno.env.get("PUBLIC_TESTFLIGHT_LINK") ??
  "https://testflight.apple.com/join/g2C5saQ4";
const discordInviteUrl =
  Deno.env.get("DISCORD_INVITE_URL") ??
  "https://discord.gg/sCsABzfj";
const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "raigred@thrylox.com";
const resendFromAddress =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "raigred@thrylox.com";
const resendFromName =
  Deno.env.get("RESEND_FROM_NAME") ?? "Maks @ Thrylox";
const resendFromEmail = resendFromAddress.includes("<")
  ? resendFromAddress
  : `${resendFromName} <${resendFromAddress}>`;
const resendReplyTo =
  Deno.env.get("RESEND_REPLY_TO") ?? supportEmail;

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
type SupabaseWriter = {
  from: (table: string) => any;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders
  });
}

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return entities[character] || character;
  });
}

function nullableText(value: unknown, maxLength = 500) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

function nullableEmail(value: unknown) {
  const email = cleanText(value, 320).toLowerCase();
  return email && emailPattern.test(email) ? email : null;
}

function nullableInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function safeTimestamp(value: unknown) {
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function pagePathFromSource(sourceUrl: string | null) {
  if (!sourceUrl) {
    return null;
  }

  try {
    return new URL(sourceUrl).pathname;
  } catch (_error) {
    return null;
  }
}

function createInviteToken() {
  const firstPart = crypto.randomUUID().replaceAll("-", "");
  const secondPart = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  return `${firstPart}${secondPart}`;
}

function buildDiscordTrackingUrl(request: Request, token: string) {
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set("action", "discord");
  url.searchParams.set("token", token);
  return url.toString();
}

function redirectResponse(url: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Cache-Control": "no-store"
    }
  });
}

async function recordFunnelEvent(
  supabase: SupabaseWriter,
  body: any,
  request: Request,
  eventNameOverride?: string,
  extraEventData: Record<string, unknown> = {}
) {
  const data = body?.data ?? {};
  const sourceUrl = nullableText(body?.source, 2000);
  const eventName = cleanText(eventNameOverride || data?.eventName || body?.eventName, 96);

  if (!eventName) {
    return { ok: false, error: "Missing funnel event name", status: 400 };
  }

  const eventData = {
    type: nullableText(body?.type, 120),
    deliveryMode: nullableText(body?.deliveryMode, 120),
    eventResult: nullableText(data?.eventResult, 120),
    buttonId: nullableText(data?.buttonId, 120),
    linkUrl: nullableText(data?.linkUrl, 2000),
    localTimestamp: nullableText(body?.timestamp, 80),
    ...extraEventData
  };

  const insertResult = await supabase.from("playtest_funnel_events").insert({
    project: cleanText(body?.project || "BOG", 120) || "BOG",
    event_name: eventName,
    event_timestamp: safeTimestamp(body?.timestamp),
    session_id: nullableText(data?.sessionId, 160),
    device_id: nullableText(data?.deviceId, 160),
    email: nullableEmail(data?.email),
    source_url: sourceUrl,
    page_path: pagePathFromSource(sourceUrl),
    referrer: nullableText(data?.referrer, 2000),
    campaign: nullableText(data?.campaign, 240),
    utm_source: nullableText(data?.utmSource, 240),
    utm_medium: nullableText(data?.utmMedium, 240),
    utm_campaign: nullableText(data?.utmCampaign, 240),
    utm_content: nullableText(data?.utmContent, 240),
    fbclid: nullableText(data?.fbclid, 500),
    step_index: nullableInteger(data?.stepIndex),
    step_number: nullableInteger(data?.stepNumber),
    step_label: nullableText(data?.stepLabel, 120),
    event_data: eventData,
    raw_payload: body,
    user_agent: nullableText(request.headers.get("user-agent"), 500)
  });

  if (insertResult.error) {
    console.error("Funnel event insert failed:", insertResult.error.message);
    return { ok: false, error: insertResult.error.message, status: 500 };
  }

  return { ok: true };
}

async function handleFunnelEvent(
  supabase: SupabaseWriter,
  body: any,
  request: Request
) {
  const result = await recordFunnelEvent(supabase, body, request);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, result.status || 500);
  }

  return jsonResponse({ ok: true });
}

async function prepareDiscordInvite(
  supabase: SupabaseWriter,
  body: any,
  request: Request,
  email: string,
  signupId: string | null
) {
  const data = body?.data ?? {};
  const project = cleanText(body?.project || "BOG", 120) || "BOG";
  const now = new Date().toISOString();

  try {
    const existingResult = await supabase
      .from("playtest_discord_invites")
      .select("invite_token")
      .eq("project", project)
      .eq("email", email)
      .maybeSingle();

    if (existingResult.error) {
      console.error("Discord invite lookup failed:", existingResult.error.message);
      return discordInviteUrl;
    }

    if (existingResult.data?.invite_token) {
      const updateResult = await supabase
        .from("playtest_discord_invites")
        .update({
          signup_id: signupId,
          discord_invite_url: discordInviteUrl,
          source_url: nullableText(body?.source, 2000),
          campaign: nullableText(data?.campaign, 240),
          utm_source: nullableText(data?.utmSource, 240),
          utm_medium: nullableText(data?.utmMedium, 240),
          utm_campaign: nullableText(data?.utmCampaign, 240),
          utm_content: nullableText(data?.utmContent, 240),
          fbclid: nullableText(data?.fbclid, 500),
          last_sent_at: now,
          updated_at: now,
          raw_payload: body
        })
        .eq("project", project)
        .eq("email", email);

      if (updateResult.error) {
        console.error("Discord invite update failed:", updateResult.error.message);
      }

      return buildDiscordTrackingUrl(request, existingResult.data.invite_token);
    }

    const inviteToken = createInviteToken();
    const insertResult = await supabase.from("playtest_discord_invites").insert({
      project,
      email,
      signup_id: signupId,
      invite_token: inviteToken,
      discord_invite_url: discordInviteUrl,
      source_url: nullableText(body?.source, 2000),
      campaign: nullableText(data?.campaign, 240),
      utm_source: nullableText(data?.utmSource, 240),
      utm_medium: nullableText(data?.utmMedium, 240),
      utm_campaign: nullableText(data?.utmCampaign, 240),
      utm_content: nullableText(data?.utmContent, 240),
      fbclid: nullableText(data?.fbclid, 500),
      first_sent_at: now,
      last_sent_at: now,
      raw_payload: body
    });

    if (insertResult.error) {
      console.error("Discord invite insert failed:", insertResult.error.message);
      return discordInviteUrl;
    }

    return buildDiscordTrackingUrl(request, inviteToken);
  } catch (error) {
    console.error("Discord invite preparation failed:", error);
    return discordInviteUrl;
  }
}

async function handleDiscordRedirect(
  supabase: SupabaseWriter,
  request: Request
) {
  const url = new URL(request.url);
  const token = cleanText(url.searchParams.get("token"), 160);
  if (!token) {
    return redirectResponse(discordInviteUrl);
  }

  const inviteResult = await supabase
    .from("playtest_discord_invites")
    .select("id, click_count, first_clicked_at, discord_invite_url")
    .eq("invite_token", token)
    .maybeSingle();

  if (inviteResult.error) {
    console.error("Discord invite redirect lookup failed:", inviteResult.error.message);
    return redirectResponse(discordInviteUrl);
  }

  if (!inviteResult.data?.id) {
    return redirectResponse(discordInviteUrl);
  }

  const now = new Date().toISOString();
  const clickCount = Number(inviteResult.data.click_count || 0) + 1;
  const updateResult = await supabase
    .from("playtest_discord_invites")
    .update({
      click_count: clickCount,
      first_clicked_at: inviteResult.data.first_clicked_at || now,
      last_clicked_at: now,
      updated_at: now
    })
    .eq("id", inviteResult.data.id);

  if (updateResult.error) {
    console.error("Discord invite click update failed:", updateResult.error.message);
  }

  return redirectResponse(inviteResult.data.discord_invite_url || discordInviteUrl);
}

function buildEmailHtml(email: string, discordUrl: string) {
  const escapedEmail = escapeHtml(email);
  const escapedDiscordUrl = escapeHtml(discordUrl);
  return `
    <div style="font-family:Arial,sans-serif;background:#fcf6d9;color:#132052;padding:32px 20px;">
      <div style="max-width:560px;margin:0 auto;background:#fff9e7;border:1px solid rgba(19,32,82,0.12);padding:32px 24px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#19b8b5;">BOG playtest access</p>
        <h1 style="margin:0 0 16px;font-size:30px;line-height:1;color:#132052;">Your build is ready.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#32457c;">
          Hi ${escapedEmail},
        </p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#32457c;">
          Thanks for joining the first external BOG wave. I'm Maks, one of the cofounders at Thrylox, and I really appreciate you taking the time to help us shape BOG early.
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
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#32457c;">
          Join the BOG Discord channel too. We'll use it for build notes, bug reports, balance questions, and quick calls with early testers.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${escapedDiscordUrl}" style="display:inline-block;padding:14px 20px;background:#5865f2;color:#ffffff;text-decoration:none;font-weight:700;border-radius:10px;">
            Join BOG Discord
          </a>
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#32457c;word-break:break-all;">
          Discord invite: <a href="${escapedDiscordUrl}" style="color:#132052;">${escapedDiscordUrl}</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#32457c;">
          Need help? Reply to this message or contact <a href="mailto:${supportEmail}" style="color:#132052;">${supportEmail}</a>.<br><br>Maks<br>Co-founder, Thrylox
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(discordUrl: string) {
  return [
    "Hi,",
    "",
    "Thanks for joining the first external BOG wave.",
    "I'm Maks, one of the cofounders at Thrylox, and I really appreciate you helping us shape BOG early.",
    "",
    "Your BOG playtest access is ready.",
    "",
    `Open TestFlight: ${publicInviteUrl}`,
    "",
    "Join the BOG Discord channel for build notes, bug reports, balance questions, and quick calls with early testers.",
    `Join Discord: ${discordUrl}`,
    "",
    `If you run into access issues, contact ${supportEmail}.`,
    "",
    "Maks",
    "Co-founder, Thrylox"
  ].join("\n");
}

async function sendWithResend(email: string, discordUrl: string) {
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
      html: buildEmailHtml(email, discordUrl),
      text: buildEmailText(discordUrl)
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

function successPayload(
  emailSent: boolean,
  deliveryError: string | null,
  alreadyRegistered = false
) {
  if (alreadyRegistered) {
    return {
      ok: true,
      emailSent,
      inviteUrl: publicInviteUrl,
      successKicker: emailSent
        ? "invite already sent"
        : "email already registered",
      successTitle:
        emailSent
          ? "Check your email."
          : "Access ready.",
      message:
        emailSent
          ? "We already sent your TestFlight link earlier. You can also continue right now below."
          : "This email is already registered. You can continue right now below.",
      pointTitle: "Email already registered",
      pointCopy:
        "To protect inboxes and keep our email limit healthy, we do not re-send the same invite every time."
    };
  }

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

  if (request.method !== "POST" && request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseSecretKey =
      Deno.env.get("SUPABASE_SECRET_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseSecretKey) {
      return jsonResponse({ ok: false, error: "Supabase server configuration is incomplete" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false }
    });

    if (request.method === "GET") {
      const requestUrl = new URL(request.url);
      if (requestUrl.searchParams.get("action") === "discord") {
        return await handleDiscordRedirect(supabase, request);
      }

      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    const body = await request.json();
    const requestType = String(body?.type || "").trim();
    const project = String(body?.project || "BOG").trim() || "BOG";
    const sourceUrl = String(body?.source || "").trim();
    const email = String(body?.data?.email || "").trim().toLowerCase();
    const campaign = String(body?.data?.campaign || "").trim();
    const utmSource = String(body?.data?.utmSource || "").trim();
    const utmMedium = String(body?.data?.utmMedium || "").trim();
    const utmCampaign = String(body?.data?.utmCampaign || "").trim();
    const utmContent = String(body?.data?.utmContent || "").trim();
    const fbclid = String(body?.data?.fbclid || "").trim();
    const deliveryMode = String(body?.deliveryMode || "email_plus_public_fallback").trim();

    if (requestType === "bog_onboarding_event") {
      return await handleFunnelEvent(supabase, body, request);
    }

    if (!email || !emailPattern.test(email)) {
      return jsonResponse({ ok: false, error: "A valid email is required" }, 400);
    }

    const now = new Date().toISOString();

    const existingResult = await supabase
      .from("playtest_signups")
      .select("id, signup_count, email_sent")
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
      utm_content: utmContent,
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

      await recordFunnelEvent(supabase, body, request, "email_submitted", {
        eventResult: "already_registered"
      });

      return jsonResponse(successPayload(Boolean(existingResult.data?.email_sent), null, true));
    }

    const insertResult = await supabase
      .from("playtest_signups")
      .insert({
        project,
        email,
        ...sharedRecord
      })
      .select("id")
      .single();

    if (insertResult.error) {
      return jsonResponse({ ok: false, error: insertResult.error.message }, 500);
    }

    await recordFunnelEvent(supabase, body, request, "email_submitted", {
      eventResult: "created"
    });

    const discordAccessUrl = await prepareDiscordInvite(
      supabase,
      body,
      request,
      email,
      insertResult.data?.id || null
    );

    const delivery = await sendWithResend(email, discordAccessUrl);

    await supabase
      .from("playtest_discord_invites")
      .update({
        email_provider_message_id: delivery.providerMessageId,
        updated_at: new Date().toISOString()
      })
      .eq("project", project)
      .eq("email", email);

    await recordFunnelEvent(
      supabase,
      body,
      request,
      delivery.emailSent ? "email_sent" : "email_delivery_failed",
      {
        eventResult: delivery.emailSent ? "sent" : "failed",
        emailProvider: "resend",
        providerMessageId: delivery.providerMessageId,
        deliveryError: delivery.deliveryError
      }
    );

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
