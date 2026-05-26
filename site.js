(function () {
  const config = window.THRYLOX_SITE_CONFIG || {};

  function saveDraft(key, payload) {
    const items = JSON.parse(window.localStorage.getItem(key) || "[]");
    items.push(payload);
    window.localStorage.setItem(key, JSON.stringify(items));
  }

  function getDeviceId() {
    const storageKey = "thrylox-playtest-device-id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const nextId =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "device-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

    window.localStorage.setItem(storageKey, nextId);
    return nextId;
  }

  function readDeviceAccess() {
    try {
      return JSON.parse(window.localStorage.getItem("thrylox-playtest-access") || "null");
    } catch (error) {
      return null;
    }
  }

  function rememberDeviceAccess(inviteUrl) {
    window.localStorage.setItem(
      "thrylox-playtest-access",
      JSON.stringify({
        inviteUrl: inviteUrl || config.publicTestFlightLink || "#",
        savedAt: new Date().toISOString()
      })
    );
  }

  async function postSignup(payload) {
    const isLocalPreview =
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!config.signupEndpoint || isLocalPreview) {
      saveDraft("thrylox-bog-playtest-signups", payload);
      return {
        ok: true,
        localOnly: true,
        emailSent: false,
        inviteUrl: config.publicTestFlightLink || "#",
        message: "Your access link is ready below.",
        successTitle: "Access ready.",
        successKicker: "access ready",
        pointTitle: "Direct access ready",
        pointCopy: "We saved your request locally for this preview flow, and you can continue into TestFlight right now."
      };
    }

    const response = await fetch(config.signupEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Signup request failed");
    }

    const result = await response.json().catch(function () {
      return {};
    });

    return {
      ok: true,
      localOnly: false,
      emailSent: Boolean(result.emailSent),
      inviteUrl: result.inviteUrl || config.publicTestFlightLink || "#",
      message: result.message || "Your access link is ready below.",
      successTitle: result.successTitle || "Access ready.",
      successKicker: result.successKicker || "access ready",
      pointTitle: result.pointTitle || "Direct access ready",
      pointCopy: result.pointCopy || "Open TestFlight now and step into the current BOG build."
    };
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function setProjectLinkTargets() {
    document.querySelectorAll("[data-testflight-link]").forEach(function (node) {
      node.href = config.publicTestFlightLink || "#";
    });

    document.querySelectorAll("[data-support-email]").forEach(function (node) {
      node.textContent = config.supportEmail || "info@thrylox.com";
      node.href = "mailto:" + (config.supportEmail || "info@thrylox.com");
    });

    document.querySelectorAll("[data-legal-email]").forEach(function (node) {
      node.textContent = config.legalEmail || "admin@thrylox.com";
      node.href = "mailto:" + (config.legalEmail || "admin@thrylox.com");
    });

    document.querySelectorAll("[data-company-domain]").forEach(function (node) {
      node.textContent = config.companyDomain || "thrylox.com";
    });

    const buildState = document.getElementById("build-state-note");
    if (buildState && config.buildStateNote) {
      buildState.textContent = config.buildStateNote;
    }
  }

  function readTrafficContext() {
    const params = new URLSearchParams(window.location.search);
    return {
      campaign: params.get("campaign") || "",
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      fbclid: params.get("fbclid") || ""
    };
  }

  function updateOnboardingScale() {
    const app = document.querySelector(".figma-onboarding .onboarding-app");
    if (!app) {
      return;
    }

    const scale = Math.min(window.innerWidth / 393, window.innerHeight / 852, 1);
    app.style.setProperty("--onboarding-scale", String(scale));
    app.style.width = 393 * scale + "px";
    app.style.height = 852 * scale + "px";
  }

  function triggerHapticFeedback(kind) {
    if (!window.navigator || typeof window.navigator.vibrate !== "function") {
      return;
    }

    const pattern = kind === "start" ? [18, 24, 28] : 16;
    window.navigator.vibrate(pattern);
  }

  function initHapticFeedback() {
    document.querySelectorAll("[data-haptic]").forEach(function (button) {
      button.addEventListener("pointerdown", function () {
        button.classList.add("is-pressing");
        button.classList.remove("is-released");
        triggerHapticFeedback(button.dataset.haptic || "");
      });

      ["pointerup", "pointercancel", "pointerleave"].forEach(function (eventName) {
        button.addEventListener(eventName, function () {
          if (!button.classList.contains("is-pressing")) {
            return;
          }

          button.classList.remove("is-pressing");
          button.classList.add("is-released");
          window.setTimeout(function () {
            button.classList.remove("is-released");
          }, 240);
        });
      });
    });
  }

  function initPlaytestForm() {
    const form = document.getElementById("playtest-form");
    const wizard = document.getElementById("playtest-onboarding");
    if (!wizard) {
      return;
    }

    const screens = Array.from(wizard.querySelectorAll(".onboarding-screen"));
    const dots = Array.from(document.querySelectorAll(".progress-dot"));
    const skipButtons = Array.from(document.querySelectorAll("[data-skip-to-form]"));
    const prevButtons = Array.from(document.querySelectorAll("[data-prev-step]"));
    const formStepIndex = screens.findIndex(function (screen) {
      return screen.classList.contains("onboarding-form-screen");
    });
    var stepIndex = 0;

    function setWizardStep(nextIndex) {
      stepIndex = Math.max(0, Math.min(nextIndex, screens.length - 1));
      screens.forEach(function (screen, index) {
        const active = index === stepIndex;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
      });

      const activeScreen = screens[stepIndex];
      const progressValue = Number(activeScreen.dataset.progress || stepIndex);
      dots.forEach(function (dot, index) {
        dot.classList.toggle("is-active", index <= progressValue);
      });

      prevButtons.forEach(function (button) {
        const shouldShow = stepIndex > 0 && stepIndex < screens.length - 1;
        button.hidden = !shouldShow;
      });

      skipButtons.forEach(function (button) {
        const shouldHide = stepIndex >= formStepIndex;
        button.hidden = shouldHide;
      });
    }

    wizard.querySelectorAll("[data-next-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        setWizardStep(stepIndex + 1);
      });
    });

    prevButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setWizardStep(stepIndex - 1);
      });
    });

    skipButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (formStepIndex >= 0) {
          setWizardStep(formStepIndex);
        }
      });
    });

    if (!form) {
      setWizardStep(0);
      return;
    }

    const status = document.getElementById("form-status");
    const openLink = document.getElementById("open-testflight-link");
    const emailField = document.getElementById("signup-email");
    const successKicker = document.getElementById("success-kicker");
    const successTitle = document.getElementById("success-title");
    const successMessage = document.getElementById("success-message");
    const successPointTitle = document.getElementById("success-point-title");
    const successPointCopy = document.getElementById("success-point-copy");
    const inlineSuccess = document.getElementById("signup-success-panel");
    const inlineSuccessMessage = document.getElementById("inline-success-message");
    const inlineTestFlightLink = document.getElementById("inline-testflight-link");
    const trafficContext = readTrafficContext();
    const submitButton = document.querySelector('[form="playtest-form"]');
    const deviceId = getDeviceId();

    if (openLink) {
      openLink.href = config.publicTestFlightLink || "#";
    }

    function applySuccessState(result) {
      const inviteUrl = result.inviteUrl || config.publicTestFlightLink || "#";
      if (openLink) {
        openLink.href = inviteUrl;
        openLink.textContent = result.emailSent ? "Open TestFlight now" : "Continue to TestFlight";
      }
      if (inlineTestFlightLink) {
        inlineTestFlightLink.href = inviteUrl;
      }
      if (inlineSuccessMessage) {
        inlineSuccessMessage.textContent = result.message || "Your access link is ready. Open TestFlight below to download the current build.";
      }
      if (inlineSuccess) {
        inlineSuccess.hidden = false;
      }
      form.classList.add("is-success");
      if (emailField) {
        emailField.disabled = true;
      }
      if (successKicker) {
        successKicker.textContent = result.successKicker || "access ready";
      }
      if (successTitle) {
        successTitle.textContent = result.successTitle || "Access ready.";
      }
      if (successMessage) {
        successMessage.textContent = result.message || "Your access link is ready below.";
      }
      if (successPointTitle) {
        successPointTitle.textContent = result.pointTitle || "Direct access ready";
      }
      if (successPointCopy) {
        successPointCopy.textContent = result.pointCopy || "Open TestFlight now and step into the current BOG build.";
      }
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      status.textContent = "Preparing access...";
      if (submitButton) {
        submitButton.setAttribute("aria-busy", "true");
      }

      const payload = {
        type: "bog_testflight_signup",
        project: config.projectName || "BOG",
        timestamp: new Date().toISOString(),
        source: window.location.href,
        deliveryMode: config.deliveryMode || "email_plus_public_fallback",
        data: {
          email: emailField.value.trim(),
          campaign: trafficContext.campaign,
          utmSource: trafficContext.utmSource,
          utmMedium: trafficContext.utmMedium,
          utmCampaign: trafficContext.utmCampaign,
          utmContent: trafficContext.utmContent,
          fbclid: trafficContext.fbclid,
          deviceId: deviceId
        }
      };

      try {
        const savedDeviceAccess = readDeviceAccess();
        if (savedDeviceAccess && savedDeviceAccess.inviteUrl) {
          applySuccessState({
            emailSent: false,
            inviteUrl: savedDeviceAccess.inviteUrl,
            message: "This device already requested access earlier. You can continue right now below.",
            successTitle: "Access already unlocked.",
            successKicker: "device already registered",
            pointTitle: "Device already recognized",
            pointCopy: "To protect inboxes and keep our email limit healthy, we do not send a new invite from the same device every time."
          });
          status.textContent = "Existing access found.";
          setWizardStep(formStepIndex);
          wizard.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        const result = await postSignup(payload);
        status.textContent = result.emailSent ? "Invite sent. TestFlight link is ready." : "TestFlight link is ready.";
        rememberDeviceAccess(result.inviteUrl);
        applySuccessState(result);
        setWizardStep(formStepIndex);
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        applySuccessState({
          emailSent: false,
          inviteUrl: config.publicTestFlightLink || "#",
          message: "We could not send the email right now, but your access link is ready below.",
          successTitle: "Access ready.",
          successKicker: "fallback ready",
          pointTitle: "Fallback invite ready",
          pointCopy: "Use the direct TestFlight link below and we will keep the signup issue visible on our side."
        });
        status.textContent = "Direct TestFlight link is ready.";
        setWizardStep(formStepIndex);
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      } finally {
        if (submitButton) {
          submitButton.removeAttribute("aria-busy");
        }
      }
    });

    const submittedEmail = new URLSearchParams(window.location.search).get("email");
    if (submittedEmail && emailField) {
      emailField.value = submittedEmail;
      setWizardStep(formStepIndex >= 0 ? formStepIndex : 0);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("email");
      window.history.replaceState({}, "", cleanUrl);
      return;
    }

    setWizardStep(0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setCurrentYear();
    setProjectLinkTargets();
    updateOnboardingScale();
    initHapticFeedback();
    initPlaytestForm();
  });

  window.addEventListener("resize", updateOnboardingScale);
})();
