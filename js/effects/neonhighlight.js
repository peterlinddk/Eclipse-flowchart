class NeonHighlight extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
    }

    start() {
        var highlight = document.querySelector("#neonhighlighter");
        // remove any previous setting
        highlight.classList.remove("on");
        highlight.classList.remove("off");
        // force reflow
        highlight.offsetHeight; 
        highlight.classList.add("on");

        // if neontext2 has two on-elements, turn them both off 
        // NOTE: I don't understand why this is here
        var neontexts = document.querySelectorAll("#htmlneontext2 span.on");
        if( neontexts.length > 1 ) {
            neontexts.forEach( nt=>{nt.classList.remove("on"); nt.offsetHeight; nt.classList.add("off");});
        }
    }
}
