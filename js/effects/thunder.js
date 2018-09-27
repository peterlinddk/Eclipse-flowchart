class Thunder extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
    }

    start() {
        const scene = document.querySelector("#scene");
        scene.classList.remove("thunder");
        scene.offsetHeight; // force reflow
        scene.classList.add("thunder");
    //    document.querySelector("body").classList.add("thunder");

        // remove every single .off to avoid flash of turn_off animation
        scene.querySelectorAll(".off").forEach(elm=>elm.classList.remove("off"));
        // and remove flips and unflips as well
        scene.querySelectorAll(".unflip").forEach(elm=>elm.classList.remove("unflip"));
        scene.querySelectorAll(".flip").forEach(elm=>elm.classList.remove("flip"));


        // wait five seconds ... should be done by animate, shouldn't it?
        setTimeout(function() {
            scene.classList.remove("thunder");
    //      document.querySelector("body").classList.remove("thunder");
        }, 5100);
    }
}

