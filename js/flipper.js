

function scrollFlipper( event ) {
    if( event ) {
        console.log("scroll on "+ event.target.id);
        event.target.removeEventListener("animationend", scrollFlipper);
    }

    // find the first element in the flipper

    var flipboxes = document.querySelectorAll("#htmlflipper .verse.visible .flipbox");

    var first = document.querySelector("#htmlflipper .verse.visible .flipbox.first");
    var second = first.nextElementSibling;

    var height = first.offsetHeight;

    flipboxes.forEach( flipbox => {flipbox.classList.add("move");flipbox.classList.remove("off");});

    // NOTE: Needs to be a named function, so we can remove it as an event-listener
    function whenDoneScrolling() {
        console.log("done scrolling!!");
        first.removeEventListener("animationend", whenDoneScrolling);

        // make first hidden, and make second, first
        first.classList.remove("visible");
        first.classList.add("hidden");

        first.classList.remove("first");
        if( second != null ) {
            second.classList.add("first");
        }

        // and reset all the animations
        document.querySelectorAll("#htmlflipper .flipbox").forEach( flipbox => flipbox.classList.remove("move") );
    }

    // when done scrolling - remove the first element, and the move-class
    first.addEventListener("animationend", whenDoneScrolling);
}


function resetFlipper() {
    // resets the current flipper
    var flipboxes = document.querySelectorAll("#htmlflipper .verse.visible .flipbox");
    flipboxes.forEach(flp=>flp.className="flipbox");
    flipboxes[0].classList.add("first");
    flipboxes[flipboxes.length-1].classList.add("hidden");


}