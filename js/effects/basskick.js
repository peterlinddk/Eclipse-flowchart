class Basskick extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
    }

    start() {
        const scene = document.querySelector("#scene");
        scene.classList.remove("basskick");
        scene.offsetHeight; // force reflow
        scene.classList.add("basskick");

        // NOTE: Can't use animationend, since it is triggered by every child-animation in the #scene
        // TODO: Should be put in end method
        setTimeout(function() {
            scene.classList.remove("basskick");
        },1300);
    }
}
