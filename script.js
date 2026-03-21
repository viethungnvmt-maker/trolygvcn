const featureHeading = document.querySelector(".feature-section .section-heading h2");
const navLinks = document.querySelectorAll('a[href^="#"]');

const modalConfigs = [
  {
    modal: document.getElementById("about-modal"),
    dialog: document.querySelector("#about-modal .about-modal__dialog"),
    triggers: document.querySelectorAll("[data-about-trigger]"),
    closeButtons: document.querySelectorAll("[data-about-close]")
  },
  {
    modal: document.getElementById("contact-modal"),
    dialog: document.querySelector("#contact-modal .contact-modal__dialog"),
    triggers: document.querySelectorAll("[data-contact-trigger]"),
    closeButtons: document.querySelectorAll("[data-contact-close]")
  }
].filter((config) => config.modal);

let activeModal = null;
let lastModalTrigger = null;
const modalHashMap = {
  "#about-modal": "about-modal",
  "#gioi-thieu": "about-modal",
  "#contact-modal": "contact-modal"
};

if (featureHeading) {
  featureHeading.innerHTML = "M\u1ed9t giao di\u1ec7n r\u00f5 r\u00e0ng, hi\u1ec7n \u0111\u1ea1i v\u00e0 s\u1eb5n s\u00e0ng cho m\u1ecdi nhu c\u1ea7u gi\u1ea3ng&nbsp;d\u1ea1y";
}

const getModalConfigById = (modalId) => {
  return modalConfigs.find((config) => config.modal && config.modal.id === modalId) || null;
};

const clearModalHash = () => {
  const currentHash = window.location.hash;

  if (!modalHashMap[currentHash]) {
    return;
  }

  window.history.replaceState(null, "", window.location.pathname + window.location.search);
};

const closeActiveModal = () => {
  if (!activeModal) {
    return;
  }

  activeModal.classList.remove("is-open");
  activeModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  const triggerToFocus = lastModalTrigger;
  activeModal = null;
  lastModalTrigger = null;
  clearModalHash();

  if (triggerToFocus) {
    triggerToFocus.focus();
  }
};

const openModal = (config, trigger) => {
  const { modal, dialog } = config;

  if (!modal) {
    return;
  }

  if (activeModal && activeModal !== modal) {
    activeModal.classList.remove("is-open");
    activeModal.setAttribute("aria-hidden", "true");
  }

  activeModal = modal;
  lastModalTrigger = trigger || null;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (dialog) {
    dialog.focus();
  }
};

const syncModalWithHash = () => {
  const modalId = modalHashMap[window.location.hash];

  if (!modalId) {
    if (activeModal) {
      closeActiveModal();
    }

    return;
  }

  const config = getModalConfigById(modalId);

  if (config) {
    openModal(config);
  }
};

modalConfigs.forEach((config) => {
  config.triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(config, trigger);
    });
  });

  config.closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      closeActiveModal();
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeActiveModal();
  }
});

window.addEventListener("hashchange", syncModalWithHash);
syncModalWithHash();

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.matches("[data-about-trigger], [data-contact-trigger], [data-about-close], [data-contact-close]")) {
      return;
    }

    const targetId = link.getAttribute("href");
    const target = targetId ? document.querySelector(targetId) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
