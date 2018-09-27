class Effect {
    constructor( timeEvent ) {
        this.active = false;
    }

    start( timeEvent ) {

    }

    end( timeEvent ) {
        this.active = false;
    }

    animate( deltaTime ) {

    }
}

function runEffect( effectId ) {
    const under = effectId.indexOf("_");
    let effectName = effectId;
    let effectTarget = "";
    if( under != -1 ) {
        effectName = effectId.substring(0,under);
        effectTarget = effectId.substring(under+1);
    }

    // create timeEvent with this effect
    // TODO: Create actual timeevent class!
    const timeEvent = {
        time: Date.now(),
        type: "effect",
        element: effectName,
        target: effectTarget
    };

    const effect = createEffect( timeEvent );
    effect.start();
    // TODO: Handle animatable effects ...
}

function createEffect( timeEvent ) {
    const effectId = timeEvent.element

    console.log("Run effect: " + effectId);
    let effect = null;
    switch( effectId )
    {
        // case "reseteffects": resetEffects();
        //                 break;
        case "basskick":
                        effect = new Basskick( timeEvent );
                        break;
        case "neonhighlight": 
                        effect = new NeonHighlight( timeEvent );
                        break;
        case "thunder": effect = new Thunder( timeEvent );
                        break;
        case "organ":   effect = new Organ( timeEvent );
                        break;
        case "zoomout": effect = new ZoomOut( timeEvent );
                        break;
        case "scrollto":
                        effect = new ScrollTo( timeEvent );
                        break;
        case "movetocenter": 
                      //  effect = new moveToCenter( timeEvent );            
        moveToCenter();
                        break;
        default:        console.error("NO EFFECT named " + effectId);
    
    }
    return effect;
}

function resetEffects() {
    // remove all classes from the scene
    document.querySelector("#scene").className="";

    // remove on or off from everything
    document.querySelectorAll("#scene .off").forEach(elm=>elm.classList.remove("off"));
    document.querySelectorAll("#scene .on").forEach(elm=>elm.classList.remove("on"));
}







function moveToCenter() {
//
//    var svg = document.querySelector("#svg");
//    var scale = window.innerWidth / 1920;
//    var curH = svg.offsetHeight * scale;
//    var availH = window.innerHeight;
//
//    if( availH < curH ) {
//
//    }

    // NOTE: shouldn't be necessary ... - remove after CSS cleanup
    var scene = document.querySelector("#scene");
    scene.style.transformOrigin = "" + window.innerWidth / 2 + "px " + window.innerHeight/2 + "px";



}




