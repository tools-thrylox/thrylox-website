(function () {
  const config = window.THRYLOX_SITE_CONFIG || {};

  function saveDraft(key, payload) {
    const items = JSON.parse(window.localStorage.getItem(key) || "[]");
    items.push(payload);
    window.localStorage.setItem(key, JSON.stringify(items));
  }

  async function postSignup(payload) {
    if (!config.signupEndpoint) {
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
      fbclid: params.get("fbclid") || ""
    };
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
    const success = document.getElementById("playtest-success");
    const openLink = document.getElementById("open-testflight-link");
    const emailField = document.getElementById("signup-email");
    const successKicker = document.getElementById("success-kicker");
    const successTitle = document.getElementById("success-title");
    const successMessage = document.getElementById("success-message");
    const successPointTitle = document.getElementById("success-point-title");
    const successPointCopy = document.getElementById("success-point-copy");
    const trafficContext = readTrafficContext();
    const submitButton = document.querySelector('[form="playtest-form"]');

    if (openLink) {
      openLink.href = config.publicTestFlightLink || "#";
    }

    function applySuccessState(result) {
      const inviteUrl = result.inviteUrl || config.publicTestFlightLink || "#";
      if (openLink) {
        openLink.href = inviteUrl;
        openLink.textContent = result.emailSent ? "Open TestFlight now" : "Continue to TestFlight";
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
          fbclid: trafficContext.fbclid
        }
      };

      try {
        const result = await postSignup(payload);
        status.textContent = result.emailSent ? "Invite sent." : "Access prepared.";
        applySuccessState(result);
        if (success) {
          success.hidden = false;
        }
        setWizardStep(4);
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
        status.textContent = "Using direct access fallback.";
        if (success) {
          success.hidden = false;
        }
        setWizardStep(4);
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      } finally {
        if (submitButton) {
          submitButton.removeAttribute("aria-busy");
        }
      }
    });

    setWizardStep(0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setCurrentYear();
    setProjectLinkTargets();
    initPlaytestForm();
  });
})();
