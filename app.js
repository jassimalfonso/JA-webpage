const logo = document.querySelector(".logo");
const banner = document.querySelector(".banner");

logo.addEventListener("click", () => {
	logo.classList.add("fade-out");
	logo.classList.remove("fade-in");
	banner.classList.add("fade-in");
	banner.classList.remove("fade-out");
});

banner.addEventListener("click", () => {
	logo.classList.add("fade-out");
	logo.classList.add("fade-in");
	banner.classList.add("fade-in");
	banner.classList.add("fade-out");
});