window.addEventListener("load", sidenVises);

var loading;
var developerMode = false;

function sidenVises() {
    loading = {
        svg: false,
        json: false,
        music: false
    };

    // get an event when the player is ready
    player = document.querySelector("#music");
    if( player.readyState != 4 ) {
        player.addEventListener("canplay", musicIsLoaded);
    } else {
        musicIsLoaded();
    }

    // load SVG
    $("#svg").load("flowchart.svg", whenSVGisLoaded);
    // load SVG defs
    $("#svgdefs").load("svgdefs.svg");

    // load JSON
    $.getJSON("flowchart.json", loadJSON);
}

function whenSVGisLoaded() {
    console.log("SVG loaded");
    loading.svg = true;

    // prepare HTML-elements that replaces part of the SVG
    prepareSVG();

    // create arrow-ids
    createArrowIDs();

    // mark everything below the belt with class "belowthebelt"
    markBelowTheBelt();

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
    player.removeEventListener("canplay", musicIsLoaded);
    loadingComplete();
}


function loadingComplete() {
    if( loading.svg && loading.json && loading.music ) {
        console.log("loading complete!");

        // request fullscreen
        if( !developerMode ) {
            requestFullscreen();

            // Hide navigator and other stuff ...
            document.querySelector("#navigator").style.display = "none";
            document.querySelector("#buttongroups").style.display = "none";
            document.querySelector("#buttons").style.display = "none";
            document.querySelector("#music").style.display = "none";

        } else {
            document.querySelector("#askforfullscreen").style.display = "none";
            document.querySelector("body").style.overflow = "auto";
        }

        calculateSize();
        window.addEventListener("resize", calculateSize);

        prepareNavigator();

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

        // jump to topline-position
        scrollToTopline( true );
    }
}


function keyPressed( event ) {
//    console.log("Key: " , event.key);
    if( event.key == " " ) {
        if( isPlaying ) {
            pause();
            event.preventDefault();
        }
    }
}


function calculateSize() {
    // get width of body
    var bo = document.querySelector("body");
    var w = bo.clientWidth;

    var scaling = w / 1920;

    document.querySelector("#scaler").style.transform = "scale("+scaling+")";
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

    scrollToTopline( true );

    // try again in half a second
    setTimeout( function() {
        scrollToTopline(true);
    }, 500);

    playback();
}


/****************************************************************

                        EFFECTS

 ****************************************************************/

function prepareEffects() {
    document.querySelectorAll("#effects button").forEach(button=>button.addEventListener("click", function(event) { runEffect(event.target.id);}));
}

function performEffect( timeEvent ) {
    runEffect( timeEvent.element );
}

function runEffect( effectId ) {
    console.log("Run effect: " + effectId);
    switch( effectId )
    {
        case "reseteffects": resetEffects();
                        break;
        case "basskick": basskick();
                        break;
        case "neonhighlight": neonhighlight();
                        break;
        case "thunder": thunder();
                        break;
        case "organ": organStart();
                        break;
        case "zoomout": zoomout();
                        break;
        case "scrolltotopline": scrollToTopline();
                        break;
        case "scrolltotop": scrollToTop();
                        break;
        case "movetocenter": moveToCenter();
                        break;

    }
}

function resetEffects() {
    // remove all classes from the scene
    document.querySelector("#scene").className="";

    // remove on or off from everything
    document.querySelectorAll("#scene .off").forEach(elm=>elm.classList.remove("off"));
    document.querySelectorAll("#scene .on").forEach(elm=>elm.classList.remove("on"));
}

function basskick() {
    var scene = document.querySelector("#scene");
    scene.classList.remove("basskick");
    scene.offsetHeight; // force reflow
    scene.classList.add("basskick");

    // NOTE: Can't use animationend, since it is triggered by every child-animation in the #scene
    setTimeout(function() {
        scene.classList.remove("basskick");
    },1300);
}

function zoomout() {
    var scene = document.querySelector("#scene");

    scene.classList.add("zoomout");
    scene.offsetHeight; // force reflow
}

function scrollToTopline( jump ) {
    var topline_y = parseFloat( document.querySelector("#topline").getAttribute("y1") );
    var body_elm = document.querySelector("body");
    var scrollto =  body_elm.clientWidth / 1920 * topline_y;

    console.log("scroll to: " + topline_y);
    console.log("which is: " + scrollto );

    if( jump ) {
        console.log("do it!");
        body_elm.scrollTop = scrollto;
    }  else {
        scroller.destination = scrollto;
        scroller.current = body_elm.scrollTop;

        scroller.animate = true;
    }

}

function scrollToTop( time ) {
    var body_elm = document.querySelector("body");
    if( time ) {
        // calculate speed
    } else {
        scroller.speed = 100;
    }
    scroller.destination = 0;
    scroller.current = body_elm.scrollTop;

    scroller.animate = true;
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

    var scene = document.querySelector("#scene");
    scene.style.transformOrigin = "" + window.innerWidth / 2 + "px " + window.innerHeight/2 + "px";



}

function neonhighlight() {
    var neontext2 = document.querySelector("#htmlneontext2");

    var highlight = document.querySelector("#neonhighlighter");
    highlight.classList.remove("on");
    highlight.classList.remove("off");
    highlight.offsetHeight;
    highlight.classList.add("on");

    // if neontext2 has two on-elements, turn them both off
    var neontexts = document.querySelectorAll("#htmlneontext2 span.on");
    if( neontexts.length > 1 ) {
        neontexts.forEach( nt=>{nt.classList.remove("on"); nt.classList.add("off");});
    }

}

function thunder(){
    document.querySelector("#scene").classList.remove("thunder");
    document.querySelector("#scene").offsetHeight; // force reflow
    document.querySelector("#scene").classList.add("thunder");
//    document.querySelector("body").classList.add("thunder");

    // remove every single .off to avoid flash of turn_off animation
    document.querySelectorAll("#scene .off").forEach(elm=>elm.classList.remove("off"));
    // and remove flips and unflips as well
    document.querySelectorAll("#scene .unflip").forEach(elm=>elm.classList.remove("unflip"));
    document.querySelectorAll("#scene .flip").forEach(elm=>elm.classList.remove("flip"));


    // wait five seconds
    setTimeout(function() {
        document.querySelector("#scene").classList.remove("thunder");
  //      document.querySelector("body").classList.remove("thunder");
    }, 5100);

}

function organStart() {
    // highlight all the arrows - make them glow orange

    // create clone of arrows
    var arrows_orig = document.querySelector("#arrows");
    var arrows_clone = arrows_orig.cloneNode(true);
    arrows_clone.id = "arrowsclone";
    var arrows_blur = arrows_orig.cloneNode(true);
    arrows_blur.id = "arrowsblur";

    arrows_orig.parentElement.insertBefore(arrows_clone, arrows_orig.nextElementSibling);
    arrows_orig.parentElement.insertBefore(arrows_blur, arrows_orig.nextElementSibling);

    // make the background glow
    organInfo.bgAlpha = 0;
    organInfo.bgAlphaGrowth = 1/3;
    organInfo.blurring = 0;
    organInfo.blurArrows = arrows_blur;
    organInfo.animate = true;


}

var organInfo = {
    animate: false,
    bgAlpha: 0,
    bgAlphaGrowth: 1/3
}

var scroller = {
    current: 0,
    destination: 0,
    speed: 100
}

function runEffectAnimations( deltaTime ) {

    if( organInfo.animate ) {

        organInfo.bgAlpha += organInfo.bgAlphaGrowth * deltaTime;
        if( organInfo.bgAlpha > 1 && organInfo.bgAlphaGrowth > 0 ) {
//            console.log("alpha is 1");

            organInfo.bgAlpha = 1;
            organInfo.bgAlphaGrowth*=-1;




        } else if( organInfo.bgAlpha < 0 ) {
//            console.log("Alpha is 0");
            organInfo.bgAlphaGrowth*=-1;
            document.querySelector("#scene").style.background = undefined;

            // remove arrowsclone and blur
            var arrows_clone = document.querySelector("#arrowsclone");
            var arrows_blur = document.querySelector("#arrowsblur");

            arrows_clone.parentNode.removeChild(arrows_clone);
            arrows_blur.parentNode.removeChild(arrows_blur);

            organInfo.animate = false;
        }

        if( organInfo.animate ) {
            var background = "radial-gradient(ellipse at center, rgba(255,187,51,"+ organInfo.bgAlpha+") 0%,rgba(44,128,91,1) 100%)";

            document.querySelector("#scene").style.background = background;

            var blur = Math.ceil(organInfo.bgAlpha * 7);
            if( organInfo.blurring != blur ) {
                organInfo.blurring = blur;
                organInfo.blurArrows.style.filter = "url(#blur" + organInfo.blurring + ")";
            }
//            console.log("blurring: " + Math.ceil(blur) );
        }
    }

    if( scroller.animate ) {
        if( scroller.current > scroller.destination ) {
            scroller.current -= scroller.speed * deltaTime;
            if( scroller.current <= scroller.destination ) {
                scroller.current = scroller.destination;
                scroller.animate = false;
            }
        } else {
            scroller.current += scroller.speed * deltaTime;
            if( scroller.current >= scroller.destination ) {
                scroller.current = scroller.destination;
                scroller.animate = false;
            }
        }

        var body_elm = document.querySelector("body");

        body_elm.scrollTop = scroller.current;
    }
}


/***************************************************************

                    MODIFIERS

 ***************************************************************/

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

    // hide know-there
    //document.querySelector("svg #knowtheres").style.display = "none";

        setTimeout( function() {
            // remove the drop-class, and inset the dropped
            know.classList.add("dropped");
            know.classList.remove("drop");
        }, 600);


    }, 1400);
}





/*************** RECORDER *****************/

var lastObject = null;
var timeEvents = [];

function startRecording() {
    // register event-listeners on screens and flipboxes in the flipper
    document.querySelectorAll("svg #screens>g, #htmlflipper .flipbox, .neontext, #effects button, #modifiers button, .turner").forEach( element => element.addEventListener("click", clickOnScreen));

    // mark as recording
    document.querySelector(".record").classList.add("recording");
    document.querySelector("#timecursor").classList.add("recording");

    // start music
    player.play();

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
    eventNavigator.addTimeEvent( timeEvent );

    console.log("logged: ", timeEvent);
}

var isPlaying = false;

function pause() {
    console.log("Pause?");
    if( player.paused ) {
        player.play();
        eventNavigator.cursor.classList.remove("paused");

//        isPlaying = true;
    } else {
        player.pause();
        eventNavigator.cursor.classList.add("paused");

//        isPlaying = false;
    }
}

function endRecording() {
    // de-register clicking
    document.querySelectorAll("svg #screens>g, #htmlflipper .flipbox").forEach( element => element.removeEventListener("click", clickOnScreen));

    // don't show as recording anymore
    document.querySelector(".record").classList.remove("recording");
    document.querySelector("#timecursor").classList.remove("recording");

    // stop the music
    player.pause();

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


/************* playback ****************/

function stop() {
    player.pause();
    player.currentTime = 0;
    isPlaying = false;
}

var player;
var eventIndex = 0;
var nextEvent = null;
var lastEvent = null;
var lastEventObject = null;

function playback() {

    // TODO: Reset effects ...
    scrollToTopline( true );

    // start playing music (from beginning)
/*    if( developerMode ) {
        // NOTE: Skip first 15 seconds when debugging
        player.currentTime = 15;
    } else {
        player.currentTime = 0;
    }*/

    player.currentTime = 0;

    player.play();

    // TODO: Block play-button!
    isPlaying = true;

    // reset event-counter
    eventIndex = 0;
    nextEvent = timeEvents[0];

    lastEventObject = null;
    lastEvent = null;

    prepareAnimations();
}


function skipTo( newTime ) {
    console.log("Skip to time: " + newTime);

    player.currentTime = newTime;

    // remove lastevent
    if( lastEventObject != null ) {
        lastEventObject.classList.remove("on");
    }
    lastEvent = null;
    lastEventObject = null;

    // find suitable eventindex
    for( let i=0; i < timeEvents.length; i++ ) {
        if( timeEvents[i].time > newTime ) {
            eventIndex = i;
            nextEvent = timeEvents[i];
            break;
        }
    }
}


function playing( deltaTime ) {
    var curTime = player.currentTime;
//    console.log("time: " + (nextEvent.time-curTime) );

    if( eventIndex < timeEvents.length && nextEvent != null ) {
        var nextTime = nextEvent.time;
        if( nextEvent.adjusted ) {
            nextTime = nextEvent.adjusted;
        }

        // if curtime is within 16ms of nextEvent, perform the next event!
        if( nextTime-curTime < deltaTime || curTime > nextTime ) {
            var thisEvent = nextEvent;

            console.log("@" + curTime + " : Perform event ", thisEvent);
            performEvent( thisEvent );

            // find nextEvent
            eventIndex++;
            if( eventIndex < timeEvents.length ) {
                nextEvent = timeEvents[eventIndex];
            } else {
                nextEvent = null;
            }

            // if this event wasn't an effect, then find the next event that isn't an effect, and draw an arrow to it
            if( thisEvent.type != "effect" && thisEvent.type != "modifier" && thisEvent.type != "text" && nextEvent != null ) {
                var index = eventIndex;
                var arrowEvent = nextEvent;
                while( arrowEvent != null && ( arrowEvent.type == "effect" || arrowEvent.type == "modifier" || arrowEvent.type == "text") ) {
                    index++;
                    arrowEvent = timeEvents[index];
                }
                if( arrowEvent != null ) {
                    highlightArrow( thisEvent, arrowEvent);
                }
            }
        }
    }
}

var lastlastElement = null;

function performEvent( timeEvent ) {

    if( timeEvent.type == "screen" || timeEvent.type == "flipper"
     || timeEvent.type == "turner" || timeEvent.type.startsWith("neontext")) {
        var element = document.querySelector("#"+timeEvent.element);

        if( timeEvent.type == "turner" ) {
            element = document.querySelector("#html"+timeEvent.element);
        }

        element.classList.remove("off");
        element.offsetHeight; // force reflow
        element.classList.add("on");

        if( lastEvent != null ) {
            if(lastEvent.type == "screen" || lastEvent.type=="flipper"
            || lastEvent.type == "turner" || lastEvent.type=="neontext1") {
                lastEventObject.classList.remove("on");
                lastEventObject.offsetLeft;
                lastEventObject.classList.add("off");

            } else if( lastEvent.type == "neontext2" ) {
              // NOTE: Handled by the neonhighlighter effect
            }

            if( lastEvent.type == "flipper" ) {
                // wait for off-animation to finish
                lastEventObject.addEventListener("animationend", scrollFlipper);
            }

            if( lastEvent.type == "turner" ) {
                // the actual turner is inside the event-object with the id
                var turner = lastEventObject.querySelector(".turner");
                // flip - or unflip - turner in question
                if( turner.classList.contains("flip") ) {
                    turner.classList.remove("flip");
                    turner.offsetLeft;
                    turner.classList.add("unflip");
                } else {
                    turner.classList.remove("unflip");
                    turner.offsetLeft;
                    turner.classList.add("flip");
                }
            }
        }

        // if this event has a hold - then don't let the next event turn it off
        if( timeEvent.hold ) {
            setTimeout( function() {
                console.log("delayed off on ", timeEvent);
                element.classList.remove("on");
                element.offsetHeight; // force reflow
                element.classList.add("off");

            }, timeEvent.hold * 1000);

            lastEvent = null;
            lastEventObject = null;
        } else {
            lastEvent = timeEvent;
            lastEventObject = element;
        }




    } else if( timeEvent.type == "effect") {
        performEffect( timeEvent );
    } else if( timeEvent.type == "modifier") {
        performModifier( timeEvent );
    } else if( timeEvent.type == "text") {
        performTextEvent( timeEvent );
    }



}

function highlightArrow( fromEvent, toEvent ) {
    var fromId = fromEvent.element;
    var toId = toEvent.element;

    console.log("Arrow from: ", fromEvent, "to:", toEvent);

    // if either event was of type flipper, then arrow directly to the flipper!
    if( fromEvent.type == "flipper" ) {
        fromId = "flipper";
    }
    if( toEvent.type == "flipper") {
        toId = "flipper";
    }

    // if either event was of type neontext, then arrow directly to the neontext
    if( fromEvent.type.startsWith("neontext") ) {
        fromId = fromEvent.type;
    }

    if( toEvent.type.startsWith("neontext") ) {
        toId = toEvent.type;
    }


    // if both events are the same neontext, then don't bother with an arrow!
    if( fromEvent.type == toEvent.type && (fromEvent.type == "neontext1" || fromEvent.type == "neontext2") ) {
        console.log("NO ARROW! - don't bother");
    } else {

        // find the arrow
        var arrowId = fromId + "2" + toId;

        // Figure how long the animation should run!
        var time = toEvent.time - fromEvent.time;

        var arrow = document.querySelector("#" + arrowId);
        if( arrow == null ) {
            console.warn("No arrow with id: " + arrowId);
            console.warn("Used from " , fromEvent, " to ", toEvent);
        } else {
            animateLine( arrow, time );
        }



    }
}





function animateLine( arrow, time ) {
    var g = arrow.parentNode;

    var line = arrow.cloneNode(true);
    var blurline = arrow.cloneNode(true);

    // create an animation-object
    var lineAnimation = {
        index: lineAnimations.length,
        active: true,
        line: line,
        blurline: blurline,
        arrowhead: g.querySelector("polygon").cloneNode(true),
        blurarrowhead: g.querySelector("polygon").cloneNode(true),
        totalLength: arrow.getTotalLength(),
        highlightLength: 50,
        drawLength: 0,
        speed: 100, // in pixels pr. second - recalculated to match distance

        performAnimation(deltaTime) {
            this.drawLength += this.speed * deltaTime;

            // strokeDashArray = "a, b, c, d"
            // a: start, altid 0
            // b: start af highlight, 0 indtil c er større end highlight length
            // c: slut på highlight lengt, indtil c = d
            // d: længden på linjen, altid totalLength

            let a = 0;
            let b = 0;
            let c = 0;
            let d = this.totalLength;

            // c starter med at være 0, og stiger til d.
            // b starter også med at være 0, og stiger i takt med c, men først når c er større end highlightlength
            // b fortsætter med at blive større, ind til b = d
            // så stopper animationen

            if( this.drawLength < this.highlightLength ) {
                c = this.drawLength;
                b = 0;
            } else {
                b = this.drawLength-this.highlightLength;
                c = this.highlightLength;
            }

            if( b+c > d ) {
                this.arrowhead.style.fill = "#fb3";
                this.arrowhead.style.stroke = "#fb3";

                // display the blur-arrowhead
                this.blurarrowhead.style.opacity = 1;

            }

            this.line.style.strokeDasharray = [a,b,c,d].join(' ');
            this.blurline.style.strokeDasharray = [a,b,c,d].join(' ');

            if( b >= this.totalLength ) {
                console.log("End animating line " + line.id);
                // mark it as inactive - it will be removed somewhere else
                this.active = false;

                // remove line, blur, arrowhead and blur
                this.line.parentNode.removeChild(this.line);
                this.blurline.parentNode.removeChild(this.blurline);
                this.arrowhead.parentNode.removeChild(this.arrowhead);
                this.blurarrowhead.parentNode.removeChild(this.blurarrowhead);
            }
        }
    }



    // modify speed, to make it fit the next event
    // speed = pixels pr. second
    // speed = length pr time
    lineAnimation.speed = lineAnimation.totalLength / (time-.4);

    // if speed is very high (5000 is seen, then extend the drawlength)
    if( lineAnimation.speed > 500 ) {
        lineAnimation.highlightLength = 50 * (lineAnimation.speed / 500);
        if( lineAnimation.highlightLength > lineAnimation.totalLength) {
            lineAnimation.highlightLength = lineAnimation.totalLength
        }
    }

    console.log("arrowspeed: " + lineAnimation.speed);

    // make it orange ...
    line.style.stroke = "#fb3";
    blurline.style.stroke = "#fb3";
    // set strokewidth one larger, to avoid thin black line
    line.style.strokeWidth="4";
    // set strokedash to avoid flash of full line
    line.style.strokeDasharray = "0 0 0 "+lineAnimation.totalLength;
    blurline.style.strokeDasharray = "0 0 0 "+lineAnimation.totalLength;


    // and blur the blurline
    blurline.style.filter = "url(#blur4)";
    // make the blurred arrow invisible, and add a stroke to avoid black outline
    lineAnimation.blurarrowhead.style.opacity = 0;
    lineAnimation.blurarrowhead.style.stroke = "#fb3";
    lineAnimation.blurarrowhead.style.fill = "#fb3";
    lineAnimation.blurarrowhead.style.filter = "url(#blur4)";

    lineAnimations.push( lineAnimation );

    // add the clones to g - blurred first, so it gets below
    g.appendChild(lineAnimation.blurline);
    g.appendChild(lineAnimation.line);

    g.appendChild(lineAnimation.blurarrowhead);
    g.appendChild(lineAnimation.arrowhead);

    // status message
    console.log("Start animating line " + arrow.id);
}

function prepareLineAnimations() {
    lineAnimations = [];
//    window.requestAnimationFrame( runLineAnimations );
}

var lineAnimations = [];
var lasttime;

function runLineAnimations( deltaTime ) {

    lineAnimations.forEach( lineAnimation => {if(lineAnimation.active) {
        lineAnimation.performAnimation(deltaTime)
    }});


    if( lineAnimations.length > 0 ) {
        for( let i=lineAnimations.length-1; i >= 0; i-- ) {
            if( !lineAnimations[i].active ) {
                lineAnimations.splice(i,1);
            }
        }
    }

}

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

function prepareAnimations() {
    prepareLineAnimations();

    window.requestAnimationFrame( runAnimations );
}

function runAnimations() {
    if( isPlaying ) {
        window.requestAnimationFrame( runAnimations );

        // calculate deltaTime ...
        var now = Date.now();
        var deltaTime = (now - (lasttime || now))/1000;
        lasttime = now;

        runLineAnimations( deltaTime );

        runSoundAnimations( deltaTime );

        runEffectAnimations( deltaTime );

        if( developerMode ) {
            navUpdateCursor( deltaTime );
        }

    }
}

function runSoundAnimations( deltaTime ) {
    playing( deltaTime );
}



/************************** FLIPPER *************************/




function prepareSVG() {
    // Set sizes for HTML-elements to match the SVG-coordinates

    function matchHTML2SVG( htmlselector, svgselector ) {

        let htmlelement = document.querySelector(htmlselector);
        let svgelement = document.querySelector(svgselector);

        // and set all the properties on the html from the SVG
        htmlelement.style.top = svgelement.getAttribute("y") + "px";
        htmlelement.style.left = svgelement.getAttribute("x") + "px";

        htmlelement.style.width = svgelement.getAttribute("width") + "px";
        htmlelement.style.height = svgelement.getAttribute("height") + "px";
    }

    // first the #flipper
    matchHTML2SVG("#htmlflipper", "svg #flipper rect" );

    // then the #neontext1
    matchHTML2SVG("#htmlneontext1", "svg #neontext1 rect" );

    // and neontext2
    matchHTML2SVG("#htmlneontext2", "svg #neontext2 rect" );

    // the two turners
    matchHTML2SVG("#htmlturner_once", "svg rect#turner_once");
    matchHTML2SVG("#htmlturner_butnow", "svg rect#turner_butnow");

    // hide the SVG turners
    document.querySelector("svg rect#turner_once").style.display = "none";
    document.querySelector("svg rect#turner_butnow").style.display = "none";

    // hide the broken getalittle
    document.querySelector("svg #broken_getalittle").style.display = "none";

    // hide know-there
    document.querySelector("svg #knowtheres").style.display = "none";
}


function markBelowTheBelt() {
    var screens = ["andineedyou", "nowtonight", "morethanever", "ireallyneedyou", "tonight", "foreversgonnastart", "neontext1", "neontext2", "htmlneontext1", "htmlneontext2"];
    var arrows = ["fallapart2andineedyou", "andineedyou2nowtonight", "andineedyou2morethanever", "nowtonight2andineedyou", "morethanever2neontext1", "neontext12neontext2", "neontext22ireallyneedyou", "ireallyneedyou2tonight", "tonight2foreversgonnastart", "foreversgonnastart2tonight", "tonight2onceupon"];

    // concatenate the arrays
    var list = screens.concat(arrows);

    // add a class to each element
    list.forEach(elm => document.querySelector("#"+elm).classList.add("belowthebelt"));

}



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


/************** ARROWS *************/

// NOTE: Since the arrows don't (always) have IDs in the SVG
// (the reason being that  Illustrator is weird)
// they are expected to come in this order, and get the IDs
// manually
var arrowIDs = [
    "turnaround2everynow",
    "everynow2getalittlebit",
    "getalittlebit2flipper",
    "flipper2turnaround",
    "turnaround2brighteyes",
    "brighteyes2everynow",
    "everynow2fallapart",
    "fallapart2turnaround",
    "fallapart2andineedyou",
    "andineedyou2nowtonight",
    "nowtonight2andineedyou",
    "andineedyou2morethanever",
    "morethanever2neontext1",
    "neontext12neontext2",
    "neontext22ireallyneedyou",
    "ireallyneedyou2tonight",
    "tonight2foreversgonnastart",
    "foreversgonnastart2tonight",
    "tonight2onceupon",
    "onceupon2turner_once",
    "turner_once2butnow",
    "butnow2turner_butnow",
    "turner_butnow2nothingican",
    "nothingican2do",
    "nothingican2say",
    "do2totaleclipse",
    "say2totaleclipse",
    "totaleclipse2onceupon",
    "brighteyes2turnaround",
    "totaleclipse2totaleclipse"]

function createArrowIDs() {
    // GRRR: The wondrous world of Illustrator export, sometimes creates an ID for arrows,
    // sometimes it doesn't ... It isn't the same every time I export, so it doesn't seem
    // like it is a setting I can change - rather an obscure error in Illustrator ...

    // FIX: Find every arrow with an id, and replace the element with it's child.
    var arrowsWithId = document.querySelectorAll("#arrows>g[id]");
    arrowsWithId.forEach(elm=>elm.replaceWith(elm.firstElementChild));
    // Then re-add IDs for everything ...

    // find all the arrow-elements (g with a path or line)
    var arrows = document.querySelectorAll("#arrows g path, #arrows g line");
    arrows.forEach( (arrow,index) => arrow.id = arrowIDs[index]);
}

/****************************************************************

                        NAVIGATOR

 ****************************************************************/
// NOTE: "navigator" is an existing object, so we can't use that as a name, hence "eventNavigator"

var eventNavigator;

function prepareNavigator() {

    eventNavigator = {
        start: 0,
        end: player.duration,
        length: 0, // length of timeline in pixels
        zoomFactor: 32, // number of pixels pr. second
        display: null,
        container: null,
        timeline: null,
        cursor: null,
        selectedEvent: null,
        selectedEventOffset: 0,
        getXpos( clientX ) {
            return clientX - this.display.offsetLeft + this.container.scrollLeft;
        },
        getXfromTime( time ) {
            return time * this.zoomFactor;
        },
        getTimeFromX( xpos ) {
            return xpos / this.zoomFactor;
        },
        addTimeEvent( timeEvent ) {
            // create element
            var elm = document.createElement("div");
            elm.classList.add("event");

            // add class based on type
            elm.classList.add( timeEvent.type );

            // and add the element, and time as data-points
            elm.dataset.element = timeEvent.element;
            elm.dataset.time = timeEvent.time;

            // set position
            elm.style.left = eventNavigator.getXfromTime( timeEvent.time ) + "px";

            // activate eventlisteners for hovering and selecting (for move)
            elm.addEventListener("mouseover", navEventHover);
            elm.addEventListener("mouseout", navEventStopHover);
            elm.addEventListener("mousedown", navEventSelect);
            elm.addEventListener("mouseup", navEventDeSelect);

            // add the element to the navigator
            this.container.appendChild(elm);

            // store the created element with the timeEvent
            timeEvent.adjusterElement = elm;

            return elm;
        }
    };

    eventNavigator.length = eventNavigator.end * eventNavigator.zoomFactor;

    // display: holds the timeline and everything else on the screen
    // container: handles the scrolling, and contains all the timeevents
    // timeline: the actual timeline
    eventNavigator.display = document.querySelector("#timedisplay");
    eventNavigator.container = document.querySelector("#timeline_container");
    eventNavigator.timeline = document.querySelector("#timeline");
    eventNavigator.cursor = document.querySelector("#timecursor");

    // Setup the length of the entire timeline (changes with zoom!)
    eventNavigator.timeline.style.width = eventNavigator.length + "px";

    // build list of timeEvents
    timeEvents.forEach( function(timeEvent) {
        eventNavigator.addTimeEvent( timeEvent );
    });

    document.querySelector("button.zoomin").addEventListener("click", navZoomIn);
    document.querySelector("button.zoomout").addEventListener("click", navZoomOut);

    // allow direct click on the timeline to skip time
    eventNavigator.timeline.addEventListener("click", navTimelineJump, false);
    // create timelinecursor
    eventNavigator.timeline.addEventListener("mousemove", navTimeHover);
    eventNavigator.timeline.addEventListener("mouseover", navTimeHoverShow);
    eventNavigator.timeline.addEventListener("mouseout", navTimeHoverHide);
}


function navTimeHoverShow( evt ) {
    document.querySelector("#timehover").style.display = "block";
}

function navTimeHoverHide( evt ) {
    document.querySelector("#timehover").style.display = "none";
}

function navTimeHover( evt ) {
    var hoverelm = document.querySelector("#timehover");

    var xpos = eventNavigator.getXpos(evt.clientX);

    hoverelm.style.left  = xpos + "px"

        // calculate this to a time
    var newTime = eventNavigator.getTimeFromX( xpos );

    hoverelm.textContent = newTime;

}




function navEventSelect( evt ) {
//    console.log("klik på ", evt);
    eventNavigator.container.addEventListener("mousemove", navEventMove);

    // remember the selected event's offset (to avoid jumping a few pixels)
    eventNavigator.selectedEventOffset = evt.offsetX;

    eventNavigator.selectedEvent = evt.target;
    eventNavigator.selectedEvent.removeEventListener("mouseover", navEventHover);
    eventNavigator.selectedEvent.removeEventListener("mouseout", navEventStopHover);
    eventNavigator.selectedEvent.addEventListener("mouseout", navEventDeSelect);
    // mark event as being dragged
    eventNavigator.selectedEvent.classList.add("dragging");
}


function navEventDeSelect( evt ) {
//    console.log("klik af ", evt);

    if( eventNavigator.selectedEvent != null ) {
        eventNavigator.selectedEvent.removeEventListener("mouseout", navEventDeSelect);
        eventNavigator.selectedEvent.addEventListener("mouseover", navEventHover);
        eventNavigator.selectedEvent.addEventListener("mouseout", navEventStopHover);
        eventNavigator.selectedEvent.classList.remove("dragging");
        eventNavigator.selectedEvent = null;
    }

    eventNavigator.container.removeEventListener("mousemove", navEventMove);
}

function navEventMove( evt ) {
    if( eventNavigator.selectedEvent != null ) {
//        console.log("move ", evt );

        var xpos = eventNavigator.getXpos(event.clientX) - eventNavigator.selectedEventOffset;

        eventNavigator.selectedEvent.style.left = xpos + "px";

        var newTime = eventNavigator.getTimeFromX( xpos );
        var tev = timeEvents.find( timeEvent => timeEvent.adjusterElement == eventNavigator.selectedEvent );

        tev.adjusted = newTime;
        eventNavigator.selectedEvent.classList.add("adjusted");

        navShowEventInfo(tev, eventNavigator.selectedEvent);
    }
}

var highlightedEvent = null;

function navUpdateCursor( deltaTime ) {
    // get time from player
    var curtime = player.currentTime;

    var cursorpos = eventNavigator.getXfromTime(curtime);

    eventNavigator.cursor.style.left = cursorpos + "px";

    // make sure that the timecursor is in view!
    if( !player.paused ) {
        if( cursorpos > eventNavigator.container.clientWidth + eventNavigator.container.scrollLeft-10) {
//            console.log("Cursor out of view - right");
            eventNavigator.container.scrollLeft = cursorpos-eventNavigator.container.clientWidth+10;
        } else if( cursorpos < eventNavigator.container.scrollLeft ) {
//            console.log("Cursor out of view - left");
            eventNavigator.container.scrollLeft = cursorpos-10;
        }
    }


}

function navTimelineJump( event ) {
    //    console.log( event );

    // only accept clicks directly on the timeline (not on the events);
    if( event.target == eventNavigator.timeline && eventNavigator.selectedEvent == null ) {
        // find out where we clicked on the timeline
        var xpos = eventNavigator.getXpos(event.clientX);

        // calculate this to a time
        var newTime = eventNavigator.getTimeFromX( xpos );
        skipTo(newTime);

        navUpdateCursor();
    }
}

function navEventHover( evt ) {
    var element = evt.target;
    if( element != highlightedEvent ) {
        // We are hovering above a new element

        // find the matching timeEvent
        var tev = timeEvents.find(timeEvent=> timeEvent.adjusterElement == element);

        // show eventinfo
        navShowEventInfo(tev, element);

        // remember the element
        highlightedEvent = element;
    }
}

function navShowEventInfo( tev, element ) {
    var eventinf = document.querySelector("#eventinfo");
    eventinf.style.display = "block";

    // fill eventinfo with data
    eventinf.querySelector(".data_type").textContent = tev.type;
    eventinf.querySelector(".data_time").textContent = tev.time;
    eventinf.querySelector(".data_element").textContent = tev.element;

    if( tev.adjusted ) {
        eventinf.querySelector(".data_adjusted").textContent = tev.adjusted;
        eventinf.querySelector(".adjusted_time").style.display = "block";
    } else {
        eventinf.querySelector(".adjusted_time").style.display = "none";
    }

    // position the eventinfo correctly
    // find scroll-position of timeline_container
    eventinf.style.left = element.offsetLeft - eventNavigator.container.scrollLeft + "px";
}


function navEventStopHover( evt ) {

    console.log("stop hover");
    var eventinf = document.querySelector("#eventinfo");
    eventinf.style.display = "none";

    highlightedEvent = null;
}



function navZoomIn() {
    eventNavigator.zoomFactor += 1;
    eventNavigator.length = eventNavigator.end * eventNavigator.zoomFactor;
    eventNavigator.timeline.style.width = eventNavigator.length + "px";
    navAdjustEvents();
}

function navZoomOut() {
    eventNavigator.zoomFactor -= 1;
    eventNavigator.length = eventNavigator.end * eventNavigator.zoomFactor;
    eventNavigator.timeline.style.width = eventNavigator.length + "px";
    navAdjustEvents();
}

function navAdjustEvents() {
    timeEvents.forEach( function(timeEvent) {
        // calculate position from zoomFactor (maybe changed)
        var pos = timeEvent.time * eventNavigator.zoomFactor ;
        // set the new position on the adjusterElement
        timeEvent.adjusterElement.style.left = pos + "px";
    });
}
