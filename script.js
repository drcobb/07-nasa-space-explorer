"use strict";

/*
  NASA Space Explorer
  Replace DEMO_KEY with your personal NASA API key before submitting.
*/

const NASA_API_KEY = "dRl7rX3WVXyFZaKq40TDU9FCGSY2vag5pB3E3Vf0";
const NASA_APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";

const dateForm = document.querySelector("#date-form");
const startDateInput = document.querySelector("#start-date");
const endDateInput = document.querySelector("#end-date");
const fetchButton = document.querySelector("#fetch-button");
const formMessage = document.querySelector("#form-message");

const gallery = document.querySelector("#gallery");
const loadingMessage = document.querySelector("#loading-message");
const resultCount = document.querySelector("#result-count");
const spaceFactElement = document.querySelector("#space-fact");

const modal = document.querySelector("#image-modal");
const modalCloseButton = document.querySelector("#modal-close");
const modalTitle = document.querySelector("#modal-title");
const modalDate = document.querySelector("#modal-date");
const modalMedia = document.querySelector("#modal-media");
const modalExplanation = document.querySelector("#modal-explanation");
const modalCopyright = document.querySelector("#modal-copyright");

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "The footprints left by Apollo astronauts could remain on the Moon for millions of years because there is almost no wind or liquid water there.",
  "More than one million Earths could fit inside the Sun.",
  "Neutron stars can rotate hundreds of times every second.",
  "The light from the Sun takes about eight minutes and twenty seconds to reach Earth.",
  "Jupiter is the largest planet in our solar system.",
  "Saturn is less dense than water, although there is no ocean large enough to float it in.",
  "Olympus Mons on Mars is the largest known volcano in our solar system.",
  "The Milky Way is estimated to contain hundreds of billions of stars.",
  "Space is completely silent because sound needs a material such as air to travel through."
];

let lastFocusedElement = null;

/**
 * Convert a Date object into YYYY-MM-DD format without UTC date shifting.
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Create a local Date object from a YYYY-MM-DD value.
 */
function createLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/**
 * Return the number of calendar days between two date strings.
 */
function getDifferenceInDays(startDateString, endDateString) {
  const startDate = createLocalDate(startDateString);
  const endDate = createLocalDate(endDateString);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.round((endDate - startDate) / millisecondsPerDay);
}

/**
 * Set the default range to the most recent nine completed calendar days.
 */
function setDefaultDates() {
  const endDate = new Date();
  const startDate = new Date();

  startDate.setDate(endDate.getDate() - 8);

  startDateInput.value = formatDateForInput(startDate);
  endDateInput.value = formatDateForInput(endDate);

  const today = formatDateForInput(new Date());

  startDateInput.max = today;
  endDateInput.max = today;

  startDateInput.min = "1995-06-16";
  endDateInput.min = "1995-06-24";
}

/**
 * Automatically set the end date to eight days after the selected start date.
 */
function updateEndDateFromStartDate() {
  if (!startDateInput.value) {
    return;
  }

  const selectedStartDate = createLocalDate(startDateInput.value);
  const calculatedEndDate = new Date(selectedStartDate);

  calculatedEndDate.setDate(selectedStartDate.getDate() + 8);

  const today = new Date();

  if (calculatedEndDate > today) {
    showFormMessage(
      "That start date is too recent to create a complete nine-day range.",
      "error"
    );

    return;
  }

  endDateInput.value = formatDateForInput(calculatedEndDate);
  clearFormMessage();
}

/**
 * Display a form status message.
 */
function showFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

/**
 * Clear the current form status message.
 */
function clearFormMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

/**
 * Validate that the selected dates contain exactly nine consecutive days.
 */
function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      valid: false,
      message: "Please choose both a start date and an end date."
    };
  }

  const earliestAllowedDate = createLocalDate("1995-06-16");
  const start = createLocalDate(startDate);
  const end = createLocalDate(endDate);
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (start < earliestAllowedDate) {
    return {
      valid: false,
      message: "NASA APOD dates must begin on or after June 16, 1995."
    };
  }

  if (end > today) {
    return {
      valid: false,
      message: "The end date cannot be later than today."
    };
  }

  if (end < start) {
    return {
      valid: false,
      message: "The end date must come after the start date."
    };
  }

  const difference = getDifferenceInDays(startDate, endDate);

  /*
    A difference of 8 represents 9 total dates because both the
    start and end dates are included.
  */
  if (difference !== 8) {
    return {
      valid: false,
      message:
        "Please select exactly nine consecutive days. The end date must be eight days after the start date."
    };
  }

  return {
    valid: true,
    message: ""
  };
}

/**
 * Display the random fact LevelUp.
 */
function displayRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFactElement.textContent = spaceFacts[randomIndex];
}

/**
 * Show or hide the loading state.
 */
function setLoadingState(isLoading) {
  loadingMessage.classList.toggle("hidden", !isLoading);
  gallery.classList.toggle("hidden", isLoading);
  fetchButton.disabled = isLoading;

  fetchButton.textContent = isLoading
    ? "Contacting NASA..."
    : "Get Space Images";
}

/**
 * Convert a possible YouTube URL into an embeddable URL.
 */
function getEmbeddableVideoUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const videoUrl = new URL(url);

    if (videoUrl.hostname.includes("youtube.com")) {
      if (videoUrl.pathname.includes("/embed/")) {
        return url;
      }

      const videoId = videoUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (videoUrl.hostname === "youtu.be") {
      const videoId = videoUrl.pathname.replace("/", "");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (error) {
    console.warn("The video URL could not be converted:", error);
  }

  return "";
}

/**
 * Build the visual area for one gallery item.
 */
function createGalleryMedia(item) {
  const mediaContainer = document.createElement("div");
  mediaContainer.className = "gallery-media";

  if (item.media_type === "image") {
    const image = document.createElement("img");
    image.src = item.url;
    image.alt = item.title;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.src =
        "https://images-assets.nasa.gov/image/PIA12348/PIA12348~medium.jpg";
      image.alt = "Fallback NASA space image";
    });

    mediaContainer.appendChild(image);
  } else if (item.media_type === "video") {
    if (item.thumbnail_url) {
      const thumbnail = document.createElement("img");
      thumbnail.src = item.thumbnail_url;
      thumbnail.alt = `Video thumbnail for ${item.title}`;
      thumbnail.loading = "lazy";
      mediaContainer.appendChild(thumbnail);
    } else {
      const videoPlaceholder = document.createElement("div");
      videoPlaceholder.className = "video-placeholder";
      videoPlaceholder.setAttribute("aria-hidden", "true");
      videoPlaceholder.textContent = "▶";
      mediaContainer.appendChild(videoPlaceholder);
    }

    const videoBadge = document.createElement("span");
    videoBadge.className = "video-badge";
    videoBadge.textContent = "NASA Video";
    mediaContainer.appendChild(videoBadge);
  }

  return mediaContainer;
}

/**
 * Build one accessible gallery card from API data.
 */
function createGalleryCard(item, index) {
  const article = document.createElement("article");
  article.className = "gallery-card";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "gallery-card-button";
  button.setAttribute(
    "aria-label",
    `Open details for ${item.title}, dated ${item.date}`
  );

  const media = createGalleryMedia(item);

  const content = document.createElement("div");
  content.className = "gallery-card-content";

  const date = document.createElement("p");
  date.className = "gallery-date";
  date.textContent = formatDisplayDate(item.date);

  const title = document.createElement("h3");
  title.textContent = item.title;

  content.append(date, title);
  button.append(media, content);
  article.appendChild(button);

  button.addEventListener("click", () => {
    openModal(item, button);
  });

  article.style.animationDelay = `${index * 60}ms`;

  return article;
}

/**
 * Display all returned API items in the gallery.
 */
function displayGallery(items) {
  gallery.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    showGalleryError("NASA did not return any entries for those dates.");
    return;
  }

  items.forEach((item, index) => {
    const card = createGalleryCard(item, index);
    gallery.appendChild(card);
  });

  resultCount.textContent = `${items.length} NASA ${
    items.length === 1 ? "entry" : "entries"
  }`;

  gallery.classList.remove("hidden");
}

/**
 * Display a readable gallery error.
 */
function showGalleryError(message) {
  gallery.innerHTML = `
    <div class="gallery-placeholder">
      <span aria-hidden="true">🛰️</span>
      <h3>We lost the signal</h3>
      <p>${message}</p>
    </div>
  `;

  gallery.classList.remove("hidden");
  resultCount.textContent = "";
}

/**
 * Fetch NASA APOD data for the selected date range.
 */
async function fetchSpaceImages(startDate, endDate) {
  const parameters = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate,
    thumbs: "true"
  });

  const requestUrl = `${NASA_APOD_ENDPOINT}?${parameters.toString()}`;

  setLoadingState(true);
  clearFormMessage();
  resultCount.textContent = "";

  try {
    const response = await fetch(requestUrl);

    if (!response.ok) {
      let errorMessage = `NASA returned an error with status ${response.status}.`;

      try {
        const errorData = await response.json();

        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.msg) {
          errorMessage = errorData.msg;
        }
      } catch (jsonError) {
        console.warn("NASA error response was not JSON:", jsonError);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("NASA returned an unexpected data format.");
    }

    displayGallery(data);

    if (data.length === 9) {
      showFormMessage(
        "Mission successful! Nine NASA entries were loaded.",
        "success"
      );
    } else {
      showFormMessage(
        `NASA returned ${data.length} entries instead of nine. Try another range if an entry is unavailable.`,
        "error"
      );
    }
  } catch (error) {
    console.error("NASA APOD request failed:", error);

    showGalleryError(
      "The images could not be loaded. Check your API key, internet connection, selected dates, and browser console."
    );

    showFormMessage(
      `Unable to load NASA data: ${error.message}`,
      "error"
    );
  } finally {
    setLoadingState(false);
  }
}

/**
 * Format a YYYY-MM-DD value into a readable date.
 */
function formatDisplayDate(dateString) {
  const date = createLocalDate(dateString);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

/**
 * Open the modal and insert the selected APOD information.
 */
function openModal(item, triggerElement) {
  lastFocusedElement = triggerElement;

  modalTitle.textContent = item.title;
  modalDate.textContent = formatDisplayDate(item.date);
  modalExplanation.textContent =
    item.explanation || "NASA did not provide an explanation for this entry.";

  modalCopyright.textContent = item.copyright
    ? `Credit: ${item.copyright}`
    : "Credit: NASA Astronomy Picture of the Day";

  modalMedia.innerHTML = "";

  if (item.media_type === "image") {
    const image = document.createElement("img");
    image.src = item.hdurl || item.url;
    image.alt = item.title;
    modalMedia.appendChild(image);
  } else if (item.media_type === "video") {
    const embedUrl = getEmbeddableVideoUrl(item.url);

    if (embedUrl) {
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.title = item.title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else {
      const link = document.createElement("a");
      link.className = "modal-video-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open this NASA video in a new tab";
      modalMedia.appendChild(link);
    }
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  modalCloseButton.focus();
}

/**
 * Close and reset the modal.
 */
function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  modalMedia.innerHTML = "";

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

/**
 * Keep keyboard focus inside the open modal.
 */
function trapModalFocus(event) {
  if (event.key !== "Tab" || modal.classList.contains("hidden")) {
    return;
  }

  const focusableElements = modal.querySelectorAll(
    'button, a[href], iframe, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * Handle the date form submission.
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const validation = validateDateRange(startDate, endDate);

  if (!validation.valid) {
    showFormMessage(validation.message, "error");
    return;
  }

  fetchSpaceImages(startDate, endDate);
}

/* Event listeners */

dateForm.addEventListener("submit", handleFormSubmit);

startDateInput.addEventListener("change", updateEndDateFromStartDate);

modalCloseButton.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }

  trapModalFocus(event);
});

/* Start the app */

setDefaultDates();
displayRandomSpaceFact();