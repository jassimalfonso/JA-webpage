const logo = document.querySelector(".logo");
const banner = document.querySelector(".banner");

logo.addEventListener("click", () => {
	logo.classList.toggle("fade-out");
	banner.classList.toggle("fade-in");
});