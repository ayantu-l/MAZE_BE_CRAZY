// Home page plays the intro splash once per visit, and a click or key press skips it.
const INTRO_KEY = "mbc_intro_shown";
const INTRO_LENGTH = 3400; 
 
const intro = document.getElementById("intro");

function closeIntro() {
  clearTimeout(introTimer);
  intro.classList.add("leaving");
}
 
let introTimer = null;


  if (sessionStorage.getItem(INTRO_KEY) === "yes") {
    intro.remove();
  } else {
    sessionStorage.setItem(INTRO_KEY, "yes");
    intro.hidden = false;
    document.body.classList.add = ("no-scroll");
    
    intro.offsetWidth;
    intro.classList.add("playing");

 
    introTimer = setTimeout(closeIntro, INTRO_LENGTH);
    intro.addEventListener("click", closeIntro);
    document.addEventListener("keydown", closeIntro, { once: true });
 
  // When the fade will out has finished remove the intro and let the page scroll again
    intro.addEventListener("transitionend", (event) => {
      if (event.target === intro && intro.classList.contains("leaving")) {
        intro.remove();
        document.body.classList.remove("no-scroll");
      }
    });
  }
