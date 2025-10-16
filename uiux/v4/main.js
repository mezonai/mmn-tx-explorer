document.addEventListener("DOMContentLoaded", () => {
  const { page } = document.body.dataset;
  const sidebarLinks = document.querySelectorAll("[data-nav]");
  const headerLinks = document.querySelectorAll("[data-top-nav]");

  sidebarLinks.forEach((link) => {
    const target = link.getAttribute("data-nav");
    if (page && page.startsWith(target)) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });

  headerLinks.forEach((link) => {
    const target = link.getAttribute("data-top-nav");
    if (page && page.includes(target)) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });

  const burger = document.querySelector("[data-toggle-sidebar]");
  if (burger) {
    burger.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-collapsed");
    });
  }
});
