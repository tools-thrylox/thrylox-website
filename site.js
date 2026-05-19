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
      return { ok: true, localOnly: true };
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

    return { ok: true, localOnly: false };
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

  async function copyText(value) {
    if (!value) {
      return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const input = document.createElement("textarea");
    input.value = value;
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
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
    const copyButton = document.getElementById("copy-testflight-link");
    const emailField = document.getElementById("signup-email");

    if (openLink) {
      openLink.href = config.publicTestFlightLink || "#";
    }

    if (copyButton) {
      copyButton.addEventListener("click", async function () {
        const copied = await copyText(config.publicTestFlightLink || "");
        copyButton.textContent = copied ? "Link copied" : "Copy failed";
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      status.textContent = "Preparing access...";

      const payload = {
        type: "bog_testflight_signup",
        project: config.projectName || "BOG",
        timestamp: new Date().toISOString(),
        source: window.location.href,
        deliveryMode: config.deliveryMode || "public_link",
        data: {
          email: emailField.value.trim()
        }
      };

      try {
        await postSignup(payload);
        status.textContent = "Access prepared.";
        if (success) {
          success.hidden = false;
        }
        setWizardStep(4);
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        status.textContent = "Could not prepare access right now. Please try again.";
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
