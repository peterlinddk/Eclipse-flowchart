class ZoomOut extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
    }

    start() {
        const scene = document.querySelector("#scene");

        scene.classList.add("zoomout");
        scene.offsetHeight; // force reflow
    }
}
