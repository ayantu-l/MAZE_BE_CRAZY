
updateNav();
setupLogout();

// Home page: plays the intro splash once per visit, and a click or key press skips it.
const INTRO_KEY = "mbc_intro_shown";
const INTRO_LENGTH = 3400; 
 
const intro = document.getElementById("intro");
 
if (intro) {
  if (sessionStorage.getItem(INTRO_KEY) === "yes") {
    intro.remove();
  } else {
    sessionStorage.setItem(INTRO_KEY, "yes");
    intro.hidden = false;
    document.body.style.overflow = "hidden";
    intro.offsetWidth;
    intro.classList.add("playing");
 
    
    function closeIntro() {
      clearTimeout(introTimer);
      intro.classList.add("leaving");
    }
 
    const introTimer = setTimeout(closeIntro, INTRO_LENGTH);
    intro.addEventListener("click", closeIntro);
    document.addEventListener("keydown", closeIntro, { once: true });
 
  
    intro.addEventListener("transitionend", (event) => {
      if (event.target === intro && intro.classList.contains("leaving")) {
        intro.remove();
        document.body.style.overflow = "";
      }
    });
  }
}