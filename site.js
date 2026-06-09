(function () {
  const config = window.THRYLOX_SITE_CONFIG || {};
  const sentSessionEvents = new Set();

  function saveDraft(key, payload) {
    const items = JSON.parse(window.localStorage.getItem(key) || "[]");
    items.push(payload);
    window.localStorage.setItem(key, JSON.stringify(items));
  }

  function isLocalPreview() {
    return (
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
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

  function getSessionId() {
    const storageKey = "thrylox-playtest-session-id";
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const nextId =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "session-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

    window.sessionStorage.setItem(storageKey, nextId);
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
    if (!config.signupEndpoint || isLocalPreview()) {
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
      utmTerm: params.get("utm_term") || "",
      fbclid: params.get("fbclid") || "",
      gclid: params.get("gclid") || "",
      gbraid: params.get("gbraid") || "",
      wbraid: params.get("wbraid") || "",
      ttclid: params.get("ttclid") || "",
      platformCampaignId: params.get("campaign_id") || params.get("campaignid") || "",
      platformAdGroupId: params.get("ad_group_id") || params.get("adgroupid") || "",
      platformAdId: params.get("ad_id") || params.get("adid") || "",
      platformCreativeId: params.get("creative_id") || params.get("creative") || "",
      placement: params.get("placement") || "",
      network: params.get("network") || "",
      device: params.get("device") || ""
    };
  }

  function postFunnelEvent(eventName, trafficContext, deviceId, sessionId, data) {
    const payload = {
      type: "bog_onboarding_event",
      project: config.projectName || "BOG",
      timestamp: new Date().toISOString(),
      source: window.location.href,
      data: Object.assign(
        {
          eventName: eventName,
          campaign: trafficContext.campaign,
          utmSource: trafficContext.utmSource,
          utmMedium: trafficContext.utmMedium,
          utmCampaign: trafficContext.utmCampaign,
          utmContent: trafficContext.utmContent,
          utmTerm: trafficContext.utmTerm,
          fbclid: trafficContext.fbclid,
          gclid: trafficContext.gclid,
          gbraid: trafficContext.gbraid,
          wbraid: trafficContext.wbraid,
          ttclid: trafficContext.ttclid,
          platformCampaignId: trafficContext.platformCampaignId,
          platformAdGroupId: trafficContext.platformAdGroupId,
          platformAdId: trafficContext.platformAdId,
          platformCreativeId: trafficContext.platformCreativeId,
          placement: trafficContext.placement,
          network: trafficContext.network,
          device: trafficContext.device,
          deviceId: deviceId,
          sessionId: sessionId,
          referrer: document.referrer || ""
        },
        data || {}
      )
    };

    if (!config.signupEndpoint || isLocalPreview()) {
      saveDraft("thrylox-bog-playtest-funnel-events", payload);
      return Promise.resolve();
    }

    return fetch(config.signupEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {
      return null;
    });
  }

  function pushDataLayerEvent(eventName, data) {
    if (!eventName) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign(
      {
        event: eventName
      },
      data || {}
    ));
  }

  function postGoogleAdsConversion(label, data) {
    if (!label || typeof window.gtag !== "function") {
      return;
    }

    const conversionId = config.googleAdsConversionId || "";
    if (!conversionId) {
      return;
    }

    window.gtag("event", "conversion", Object.assign(
      {
        send_to: conversionId + "/" + label
      },
      data || {}
    ));
  }

  function markSessionEventSent(storageKey) {
    if (sentSessionEvents.has(storageKey)) {
      return false;
    }

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        sentSessionEvents.add(storageKey);
        return false;
      }

      window.sessionStorage.setItem(storageKey, "1");
    } catch (error) {
    }

    sentSessionEvents.add(storageKey);
    return true;
  }

  function trackEmailScreenViewOnce() {
    if (!markSessionEventSent("thrylox-email-screen-view-sent")) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "email_screen_view",
      screen_name: "email_page"
    });
  }

  function gtagReportConversion(url) {
    postGoogleAdsConversion(config.googleAdsTestFlightClickConversionLabel, {
      value: 1.0,
      currency: "EUR",
      event_callback: function () {
        if (typeof url !== "undefined") {
          window.location = url;
        }
      }
    });
    return false;
  }

  window.gtag_report_conversion = gtagReportConversion;

  function updateOnboardingScale() {
    const app = document.querySelector(".figma-onboarding .onboarding-app");
    if (!app) {
      return;
    }

    const viewportWidth = window.visualViewport && window.visualViewport.width ? window.visualViewport.width : window.innerWidth;
    const viewportHeight = window.visualViewport && window.visualViewport.height ? window.visualViewport.height : window.innerHeight;
    if (!viewportWidth || !viewportHeight) {
      return;
    }

    const activeScreen = app.querySelector(".onboarding-screen.is-active");
    const step = activeScreen ? Number(activeScreen.dataset.step || 0) : 0;
    const widthScale = viewportWidth / 393;
    const fitScale = Math.min(widthScale, viewportHeight / 852);
    const importantBaseBottomByStep = {
      0: 735,
      1: 735,
      2: 792,
      3: 820
    };
    const importantBaseBottom = importantBaseBottomByStep[step] || 852;
    const canFillPhoneWidth = viewportWidth <= 540
      && viewportHeight >= viewportWidth
      && importantBaseBottom * widthScale <= viewportHeight;
    const scale = canFillPhoneWidth ? widthScale : fitScale;
    app.style.setProperty("--onboarding-scale", String(scale));
    app.style.width = 393 * scale + "px";
    app.style.height = canFillPhoneWidth ? viewportHeight + "px" : 852 * scale + "px";
  }

  function triggerHapticFeedback(kind) {
    if (!window.navigator || typeof window.navigator.vibrate !== "function") {
      return;
    }

    const pattern = kind === "start" ? [18, 24, 28] : 16;
    window.navigator.vibrate(pattern);
  }

  function initHapticFeedback() {
    const pressableSelector = [
      ".figma-start-button",
      ".figma-continue-button",
      ".figma-submit-button",
      ".figma-download-link",
      ".figma-link-button"
    ].join(",");

    document.querySelectorAll(pressableSelector).forEach(function (button) {
      button.addEventListener("pointerdown", function () {
        button.classList.add("is-pressing");
        button.classList.remove("is-released");
        if (button.dataset.haptic) {
          triggerHapticFeedback(button.dataset.haptic || "");
        }
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

  function initLazyVideos() {
    const videos = Array.from(document.querySelectorAll("video[data-video-src]"));
    if (!videos.length) {
      return;
    }

    function loadVideo(video) {
      if (video.dataset.videoLoaded === "true") {
        return;
      }

      const source = document.createElement("source");
      source.src = video.dataset.videoSrc || "";
      source.type = video.dataset.videoType || "video/mp4";
      if (!source.src) {
        return;
      }

      video.appendChild(source);
      video.dataset.videoLoaded = "true";
      video.load();
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          return null;
        });
      }
    }

    function startLoading() {
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }

            loadVideo(entry.target);
            observer.unobserve(entry.target);
          });
        }, {
          rootMargin: "240px 0px"
        });

        videos.forEach(function (video) {
          observer.observe(video);
        });
        return;
      }

      videos.forEach(loadVideo);
    }

    const priorityVideos = videos.filter(function (video) {
      return video.dataset.videoPriority === "visible";
    });

    if (priorityVideos.length > 0) {
      window.setTimeout(function () {
        priorityVideos.forEach(loadVideo);
      }, 650);
    }

    var loadingStarted = false;
    function startLoadingOnce() {
      if (loadingStarted) {
        return;
      }

      loadingStarted = true;
      startLoading();
    }

    ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (eventName) {
      window.addEventListener(eventName, startLoadingOnce, { once: true, passive: true });
    });

    window.setTimeout(function () {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startLoadingOnce, { timeout: 1200 });
      } else {
        startLoadingOnce();
      }
    }, 3200);
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
    const trafficContext = readTrafficContext();
    const deviceId = getDeviceId();
    const sessionId = getSessionId();
    const trackedStepEvents = new Set();
    var stepIndex = 0;

    function trackFunnelEvent(eventName, data) {
      return postFunnelEvent(eventName, trafficContext, deviceId, sessionId, data);
    }

    function trackAppStoreEvent(eventName, data) {
      if (!eventName) {
        return Promise.resolve();
      }

      pushDataLayerEvent(eventName, Object.assign(
        {
          page_path: window.location.pathname,
          step_label: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1)
        },
        data || {}
      ));

      return trackFunnelEvent(eventName, data);
    }

    function trackStepView(screen, index) {
      if (screen.classList.contains("onboarding-form-screen")) {
        trackEmailScreenViewOnce();
      }

      const stepNumber = index + 1;
      const eventName = screen.dataset.funnelEvent || "onboarding_screen_" + stepNumber + "_viewed";
      const eventKey = eventName + ":" + stepNumber;
      if (trackedStepEvents.has(eventKey)) {
        return;
      }

      trackedStepEvents.add(eventKey);
      if (eventName.indexOf("appstore_") === 0) {
        pushDataLayerEvent(eventName, {
          page_path: window.location.pathname,
          step_index: index,
          step_number: stepNumber,
          step_label: screen.dataset.funnelStep || "screen_" + stepNumber
        });
      }
      trackFunnelEvent(eventName, {
        stepIndex: index,
        stepNumber: stepNumber,
        stepLabel: screen.dataset.funnelStep || "screen_" + stepNumber
      });
    }

    function setWizardStep(nextIndex) {
      stepIndex = Math.max(0, Math.min(nextIndex, screens.length - 1));
      screens.forEach(function (screen, index) {
        const active = index === stepIndex;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
      });

      const activeScreen = screens[stepIndex];
      trackStepView(activeScreen, stepIndex);
      updateOnboardingScale();
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

    wizard.querySelectorAll("[data-funnel-click]").forEach(function (button) {
      button.addEventListener("click", function () {
        const eventName = button.dataset.funnelClick || "";
        const location = button.dataset.funnelLocation || "";
        if (eventName === "appstore_get_clicked") {
          postGoogleAdsConversion("xXqfCNSmkbocEOSx-uhD");
        }

        trackAppStoreEvent(eventName, {
          buttonId: button.id || "",
          buttonText: (button.textContent || button.getAttribute("aria-label") || "").trim(),
          eventResult: "clicked",
          linkUrl: button.href || "",
          stepIndex: stepIndex,
          stepNumber: stepIndex + 1,
          stepLabel: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1),
          location: location
        });
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
    const submitButton = document.querySelector('[form="playtest-form"]');

    if (openLink) {
      openLink.href = config.publicTestFlightLink || "#";
    }

    document.querySelectorAll("[data-testflight-link]").forEach(function (link) {
      link.addEventListener("click", function () {
        const eventName = link.dataset.funnelEvent || "testflight_link_clicked";
        gtagReportConversion();
        if (eventName.indexOf("appstore_") === 0) {
          pushDataLayerEvent(eventName, {
            button_id: link.id || "",
            link_url: link.href,
            page_path: window.location.pathname,
            step_label: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1)
          });
        }
        trackFunnelEvent(eventName, {
          email: emailField && emailField.value ? emailField.value.trim() : "",
          linkUrl: link.href,
          buttonId: link.id || "",
          stepIndex: stepIndex,
          stepNumber: stepIndex + 1,
          stepLabel: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1)
        });
      });
    });

    if (emailField) {
      var appStoreEmailEnteredTracked = false;
      emailField.addEventListener("input", function () {
        const value = emailField.value.trim();
        const eventName = emailField.dataset.funnelEmailEvent || "";
        if (appStoreEmailEnteredTracked || !value || !eventName) {
          return;
        }

        appStoreEmailEnteredTracked = true;
        trackAppStoreEvent(eventName, {
          fieldId: emailField.id || "",
          emailLength: Math.min(value.length, 320),
          emailHasAt: value.indexOf("@") !== -1,
          eventResult: "entered",
          stepIndex: stepIndex,
          stepNumber: stepIndex + 1,
          stepLabel: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1)
        });
      });
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

    function scrollToSignupSuccess() {
      const target = inlineSuccess || form;
      if (!target || typeof target.scrollIntoView !== "function") {
        return;
      }

      window.requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      });
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
          utmTerm: trafficContext.utmTerm,
          fbclid: trafficContext.fbclid,
          gclid: trafficContext.gclid,
          gbraid: trafficContext.gbraid,
          wbraid: trafficContext.wbraid,
          ttclid: trafficContext.ttclid,
          platformCampaignId: trafficContext.platformCampaignId,
          platformAdGroupId: trafficContext.platformAdGroupId,
          platformAdId: trafficContext.platformAdId,
          platformCreativeId: trafficContext.platformCreativeId,
          placement: trafficContext.placement,
          network: trafficContext.network,
          device: trafficContext.device,
          deviceId: deviceId,
          sessionId: sessionId,
          referrer: document.referrer || ""
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
          trackFunnelEvent("device_access_reused", {
            email: emailField.value.trim(),
            stepIndex: stepIndex,
            stepNumber: stepIndex + 1,
            stepLabel: screens[stepIndex]?.dataset.funnelStep || "screen_" + (stepIndex + 1)
          });
          setWizardStep(formStepIndex);
          scrollToSignupSuccess();
          return;
        }

        const result = await postSignup(payload);
        status.textContent = result.emailSent ? "Invite sent. TestFlight link is ready." : "TestFlight link is ready.";
        rememberDeviceAccess(result.inviteUrl);
        postGoogleAdsConversion(config.googleAdsSignupConversionLabel, {
          value: 1,
          currency: "EUR",
          transaction_id: deviceId + ":" + sessionId
        });
        applySuccessState(result);
        setWizardStep(formStepIndex);
        scrollToSignupSuccess();
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
        scrollToSignupSuccess();
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
    initLazyVideos();
    initPlaytestForm();
  });

  window.addEventListener("resize", updateOnboardingScale);
})();
