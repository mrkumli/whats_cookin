// Mobile nav toggle
const nav = document.getElementById("nav");
const navtoggle = document.getElementById("navtoggle");
navtoggle.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll(".navlinks a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

// Scroll-reveal for stage sections
const stages = document.querySelectorAll("section.stage");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
stages.forEach((s) => revealObserver.observe(s));

// Active state on the timeline rail as sections pass
const railLinks = document.querySelectorAll(".timeline-rail a");
const sectionMap = {};
railLinks.forEach((link) => {
  const id = link.getAttribute("href").slice(1);
  const el = document.getElementById(id);
  if (el) sectionMap[id] = link;
});

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = sectionMap[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        railLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  },
  { rootMargin: "-40% 0px -50% 0px" }
);
Object.keys(sectionMap).forEach((id) =>
  activeObserver.observe(document.getElementById(id))
);
