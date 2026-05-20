/**
 * CV preview modal (shared with index.html)
 */
(function () {
  const CV_URL =
    "https://res.cloudinary.com/duswpvmeh/image/upload/v1779173731/cv/AOY_1_ggyk7e.pdf";
  const cvModal = document.getElementById("cvModal");
  const cvModalClose = document.getElementById("cvModalClose");
  const cvPreviewFrame = document.getElementById("cvPreviewFrame");
  const cvOpenTriggers = document.querySelectorAll("[data-open-cv]");
  if (!cvModal || !cvPreviewFrame) return;

  function openCvModal(event) {
    if (event) event.preventDefault();
    cvPreviewFrame.src = `${CV_URL}#zoom=90`;
    cvModal.classList.add("open");
    cvModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("custom-cursor-disabled");
    document.body.classList.add("cv-modal-open");
    document.body.style.overflow = "hidden";
  }

  function closeCvModal() {
    cvModal.classList.remove("open");
    cvModal.setAttribute("aria-hidden", "true");
    cvPreviewFrame.src = "";
    document.body.classList.remove("custom-cursor-disabled");
    document.body.classList.remove("cv-modal-open");
    document.body.style.overflow = "";
  }

  cvOpenTriggers.forEach((trigger) => {
    trigger.addEventListener("click", openCvModal);
  });
  if (cvModalClose) cvModalClose.addEventListener("click", closeCvModal);
  cvModal.addEventListener("click", (event) => {
    if (event.target === cvModal) closeCvModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cvModal.classList.contains("open")) {
      closeCvModal();
    }
  });
})();
