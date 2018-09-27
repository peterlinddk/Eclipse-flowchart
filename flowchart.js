window.addEventListener("load", sidenVises);

var loading;
var developerMode = true;

// The array of events (effects)
let timeEvents = [];

let timelineNavigator;
let player;

/**************** LOADER ****************/

function sidenVises() {
    loading = {
        svg: false,
        json: false,
        music: false
    };


    player = new Player();
    player.setAudio( document.querySelector("#music") );

    // get an event when the player is ready
    musicPlayer = document.querySelector("#music");
    // TODO: Remove!!
    musicPlayer.volume = 0.2;

    // TODO This probably doesn't work anyway - so remove soon ...
    if( musicPlayer.readyState != 4 ) {
        // Wait for the music to be loaded
        musicPlayer.addEventListener("canplay", musicIsLoaded);
        // NOTE: Sometimes the "canplaythrough" event gets fired first, when loading from cache.
        musicPlayer.addEventListener("canplaythrough", musicIsLoaded);
    } else {
        musicIsLoaded();
    }

    // load SVG
    fetch("flowchart.svg")
    .then(response=>response.text())
    .then(svg => {
        document.querySelector("#svg").insertAdjacentHTML("afterbegin", svg);
        whenSVGisLoaded();
    });

    // load SVG defs
    fetch("svgdefs.svg")
    .then(response=>response.text())
    .then(svg => {
        document.querySelector("#svgdefs").insertAdjacentHTML("afterbegin", svg);
    });

    // load JSON
    fetch("flowchart.json")
    .then(response=>response.json())
    .then(json=>loadJSON(json ));

}

function whenSVGisLoaded() {
    console.log("SVG loaded");
    loading.svg = true;

    // prepare HTML-elements that replaces part of the SVG
    prepareSVG();

    loadingComplete();
}

function loadJSON( data ) {
    console.log("JSON loaded");
    loading.json = true;

    timeEvents = data;

    loadingComplete();
}

function musicIsLoaded() {
    console.log("Music loaded");
    loading.music = true;
    // TODO: These events are probably not working ...
    musicPlayer.removeEventListener("canplay", musicIsLoaded);
    musicPlayer.removeEventListener("canplaythrough", musicIsLoaded);

    loadingComplete();
}

function loadingComplete() {
    if( loading.svg && loading.json && loading.music ) {
        console.log("loading complete!");

        // request fullscreen
        if( !developerMode ) {
            requestFullscreen();

            // Hide navigator and other stuff ...
            document.querySelector("#timeline_navigator").style.display = "none";
            document.querySelector("#buttongroups").style.display = "none";
            document.querySelector("#buttons").style.display = "none";
            document.querySelector("#music").style.display = "none";

        } else {
            document.querySelector("#askforfullscreen").style.display = "none";
            document.querySelector("body").style.overflow = "auto";
        }

        calculateSize();
        window.addEventListener("resize", calculateSize);

        timelineNavigator = new TimelineNavigator();

//        prepareNavigator();

        // activate buttons
        if(developerMode) {
            document.querySelector("button.startrecord").addEventListener("click", startRecording);
            document.querySelector("button.endrecord").addEventListener("click", endRecording);
            document.querySelector("button.playback").addEventListener("click", playback);
            document.querySelector("button.stop").addEventListener("click", stop);
            document.querySelector("button.pause").addEventListener("click", pause);
        }

        document.addEventListener("keydown", keyPressed);

        prepareEffects();

        prepareModifiers();

        
    }
}

/**************** FULLSCREEN and SIZING ****************/

function calculateSize() {
    // redo sizes from SVG to HTML
    prepareSVG();
}

function requestFullscreen() {

    // check if currently in fullscreen - by testing the window-size
    if( window.innerWidth != screen.width ) {
        // show fullscreen-request
        document.querySelector("#askforfullscreen").style.display = "block";
        document.querySelector("#askforfullscreen .goFullScreen").addEventListener("click", goFullscreen);
    }
}

function goFullscreen() {
    var elm = document.documentElement;

    if( elm.requestFullscreen ){
        document.addEventListener("fullscreenchange", goneFullscreen);
        elm.requestFullscreen();
    } else if( elm.webkitRequestFullscreen ) {
        document.addEventListener("webkitfullscreenchange", goneFullscreen);
        elm.webkitRequestFullscreen();
    } else if( elm.mozRequestFullScreen) {
        document.addEventListener("mozfullscreenchange", goneFullscreen);
        elm.mozRequestFullScreen();
    } else if( elm.msRequestFullscreen) {
        document.addEventListener("MSFullscreenChange", goneFullscreen);
        elm.msRequestFullscreen();
    }
}

function goneFullscreen( event ) {
    console.log("Gone fullscreen", event);

    document.removeEventListener("fullscreenchange", goneFullscreen);
    document.removeEventListener("webkitfullscreenchange", goneFullscreen);
    document.removeEventListener("mozfullscreenchange", goneFullscreen);
    document.removeEventListener("MSFullscreenChange", goneFullscreen);

    // hide request for fullscreen
    document.querySelector("#askforfullscreen").style.display = "none";

   // scrollToTopline( true );

    // try again in half a second
    // setTimeout( function() {
    //     scrollToTopline(true);
    // }, 500);

    playback();
}

/**************** USER INTERFACE ****************/

function keyPressed( event ) {
//    console.log("Key: " , event.key);
    if( event.key == " " ) {
        if( player.isPlaying ) {
            pause();
            event.preventDefault();
        }
    }
}

/**************** SVG fixes ****************/

function prepareSVG() {
    // Set sizes for HTML-elements to match the SVG-coordinates

    function matchHTML2SVG( element, svgElement ) {
        // set all the properties on the html from the SVG
        const rect = svgElement.getBoundingClientRect();
        element.style.top = rect.y + "px";
        element.style.left = rect.x + "px";
        element.style.width = rect.width + "px";
        element.style.height = rect.height + "px";
    }

    // look for "matchsvg" in the html-file
    // look at the id - subtract initial html - the rest should be an in in the svg
    // if the svg element is a rect, use that, otherwise find the first rect child ...

    //data-matchsvg="true"
    const matchers = document.querySelectorAll("[data-matchsvg]").forEach( element => {
        const svgid = element.id.substring(4);
        let svgElement = document.querySelector("#"+svgid);
 
        // TEST: This might fail if rect isn't the direct descendant of the id ...
        if( svgElement.tagName.toLowerCase() !== "rect" ) {
            svgElement = svgElement.firstElementChild;
        }
 
        matchHTML2SVG( element, svgElement );
    });
}


/**************** PLAYER ****************/

//var isPlaying = false;

function playback() {
    // jump to topline-position
//    scrollToTopline( true );
    player.playback();
}

function pause() {
        player.pause();
}

function skipTo( newTime ) {
    player.skipTo( newTime );
}

function stop() {
    player.stop();
}

/**************** RECORDER ****************/

var lastObject = null;

function startRecording() {
    // register event-listeners on screens and flipboxes in the flipper
    document.querySelectorAll("svg #screens>g, #htmlflipper .flipbox, .neontext, #effects button, #modifiers button, .turner").forEach( element => element.addEventListener("click", clickOnScreen));

    // mark as recording
    document.querySelector(".record").classList.add("recording");
    timelineNavigator.startRecording();

    // start music
    musicPlayer.play();

    // No, don't clear array - make the recording add to the array of timeevents!
//    timeEvents = [];



}

function clickOnScreen( event ) {
    // get timestamp
    var timestamp = document.querySelector("#music").currentTime;

    // find the id
    var target = event.target;

    // find closest parent with an id
    while( target.id == null || target.id == "" ) {
        target = target.parentNode;
    }
    var id = target.id;

    // find parentId
    var parent = target.parentNode;
    while( parent.id == null || parent.id == "" ) {
        parent = parent.parentNode;
    }
    var parentId = parent.id;


    // register the object as clicked!
    target.classList.add("on");

    // de-register the last object, if any
    if( lastObject != null ) {
        lastObject.classList.remove("on");
    }
    lastObject = target;

    // find the type: screen, flipper, or neontext

    var type = "flipper";

    // check the type - screen or flip
    if( parentId == "screens" ) {
        type = "screen";
    } else if( parentId == "htmlflipper") {
        type = "flipper";
    } else if( parentId == "htmlneontext1" ) {
        type = "neontext1";
    } else if( parentId == "htmlneontext2") {
        type = "neontext2";
    } else if( parentId == "effects") {
        type = "effect";
    } else if( parentId == "modifiers") {
        type = "modifier";
    } else if( id.startsWith("turner") ) {
        type = "turner";
    }

    // create object
    var timeEvent = {
        time: timestamp,
        type: type,
        element: id
    };

    // store object - note that the order may be wrong, must be sorted after recording!
    timeEvents.push( timeEvent );

    // add object to navigator
    timelineNavigator.addTimeEvent( timeEvent );

    console.log("logged: ", timeEvent);
}

function endRecording() {
    // de-register clicking
    document.querySelectorAll("svg #screens>g, #htmlflipper .flipbox").forEach( element => element.removeEventListener("click", clickOnScreen));

    // don't show as recording anymore
    document.querySelector(".record").classList.remove("recording");
    timelineNavigator.endRecording();

    // stop the music
    musicPlayer.pause();

    // replace time with adjusted
    timeEvents.forEach( timeEvent => timeEvent.time = timeEvent.adjusted?timeEvent.adjusted:timeEvent.time );

    // sort the array of timeEvents by timestamp
    timeEvents.sort( (a,b) => a.time-b.time );

    // remove adjusted and adjusterelement from json
    function jsonReplacer(key, value) {
        if( key == "adjusted" || key == "adjusterElement" ) {
            return undefined;
        }

        return value;
    }

    // create json-array of timeEvents
    var jsondata = JSON.stringify( timeEvents, jsonReplacer );

    // display the jsondata // TODO: Put in a textarea on the screen
    console.log("JSON:");
    console.log(jsondata);

}

/**************** ANIMATIONS ****************/

/**************** EFFECTS ****************/





function prepareEffects() {
    // NOTE: Doesn't work with new effect-system - should also be part of the recorder!
    document.querySelectorAll("#effects button").forEach(button=>button.addEventListener("click", function(event) { runEffect(event.target.id);}));
}



/**************** MODIFIERS ****************/

function prepareModifiers() {
    document.querySelectorAll("#modifiers button").forEach(button=>button.addEventListener("click", function(event) { runModifier(event.target.id);}))
}

function performModifier( timeEvent ) {
    runModifier( timeEvent.element );
}

function runModifier( modifierId ) {
    console.log("running modifier: " + modifierId);
    switch( modifierId )
    {
        case "showfirstverse":
            document.querySelector(".first_verse").classList.remove("hidden");
            document.querySelector(".second_verse").classList.add("hidden");
            document.querySelector(".third_verse").classList.add("hidden");

            document.querySelector(".first_verse").classList.add("visible");
            document.querySelector(".second_verse").classList.remove("visible");
            document.querySelector(".third_verse").classList.remove("visible");

            break;
        case "showsecondverse":
            document.querySelector(".first_verse").classList.add("hidden");
            document.querySelector(".second_verse").classList.remove("hidden");
            document.querySelector(".third_verse").classList.add("hidden");

            document.querySelector(".first_verse").classList.remove("visible");
            document.querySelector(".second_verse").classList.add("visible");
            document.querySelector(".third_verse").classList.remove("visible");
            break;
        case "showthirdverse":
            document.querySelector(".first_verse").classList.add("hidden");
            document.querySelector(".second_verse").classList.add("hidden");
            document.querySelector(".third_verse").classList.remove("hidden");

            document.querySelector(".first_verse").classList.remove("visible");
            document.querySelector(".second_verse").classList.remove("visible");
            document.querySelector(".third_verse").classList.add("visible");

            break;
        case "notheres":
            var theres = document.querySelector("svg #theres");
            document.querySelector("svg #nothingican").classList.remove("off");
            theres.offsetHeight;
            theres.classList.add("burnout");
            theres.addEventListener("animationend", removetheres);
            function removetheres() {
                theres.style.display = "none";
                theres.removeEventListener("animationend", removetheres);
            }
            break;
        case "breakgetalittle":
            breakGetALittle();
            break;
        case "you2there":
            // remove "know you'll" - replace by "know there's"
            document.querySelector("svg #knowtheres").style.display = "block";
            document.querySelector("svg #knowtheres").classList.add("fadein");
            document.querySelector("svg #knowyoull").classList.add("fadeout");

//            setTimeout( function() {
//                document.querySelector("svg #knowtheres").style.display = "block";
//                document.querySelector("svg #knowyoull").style.display = "none";
//            }, 1000);

            break;
        case "showbelowthebelt":
            document.querySelector("#svg").classList.add("fadeinbelowthebelt");
            document.querySelector("#svg").offsetHeight;
            document.querySelector("#svg").classList.remove("hidebelowthebelt");

            setTimeout(function() {
                document.querySelector("#svg").classList.remove("fadeinbelowthebelt");
            }, 5000);

            break;

    }
}

function breakGetALittle() {
    // drop know
    var know = document.querySelector("#know");
    know.classList.add("drop");

    // when drop is almost complete - break the get a little
    setTimeout( function() {
        // show the broken one
        document.querySelector("svg #broken_getalittle").style.display = "block";
        // hide the normal one
        document.querySelector("svg #getalittlebit").style.display = "none";

        // Change the arrows from getalittlebit to know
        document.querySelector("#everynow2getalittlebit").id = "everynow2know";
        document.querySelector("#getalittlebit2flipper").id = "know2flipper";

        setTimeout( function() {
            // remove the drop-class, and inset the dropped
            know.classList.add("dropped");
            know.classList.remove("drop");
        }, 600);


    }, 1400);
}


/*************** RECORDER *****************/



var musicPlayer;



var lastText;

/******** TEXTS ***********/
function performTextEvent( timeEvent ) {

    if( lastText != null ) {
        lastText.classList.add("fadeout");
    }

    var textelement = document.querySelector("#" + timeEvent.element);
    textelement.style.display = "block";
    textelement.classList.add("fadein");

    lastText = textelement;
}


/******************** ANIMATIONS ********************/


var lasttime;

function runAnimations() {
    if( player.isPlaying ) {
        window.requestAnimationFrame( runAnimations );

        // calculate deltaTime ...
        var now = Date.now();
        var deltaTime = (now - (lasttime || now))/1000;
        lasttime = now;

        player.animate( deltaTime );

        if( developerMode ) {
            timelineNavigator.updateCursor();
        }

    }
}