$(window).on("load", sidenVises);

var loading;
var developerMode = true;

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
    // prepare the flipper
    prepareFlipper();

    // TODO: Prepare neontexts

    // create arrow-ids
    createArrowIDs();

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

        prepareNavigator();
        // playback

        // activate buttons
        $("button.startrecord").on("click", startRecording);
        document.querySelector("button.pause").addEventListener("click", pause);
        $("button.endrecord").on("click", endRecording);
        $("button.playback").on("click", playback);
        $("button.stop").on("click", stop);

        document.addEventListener("keydown", keyPressed);

        prepareEffects();

        prepareModifiers();


        if( !developerMode ) {
            // Hide navigator and other stuff ...
            document.querySelector("#navigator").style.display = "none";
            document.querySelector("#buttongroups").style.display = "none";
            document.querySelector("#buttons").style.display = "none";
            document.querySelector("#music").style.display = "none";


            playback();
        }


    }
}

function keyPressed( event ) {
//    console.log("Key: " , event.key);
    if( event.key == " " ) {
        if( isPlaying ) {
            pause();
        }
    }
}

/****************************************************************

                        EFFECTS

 ****************************************************************/

function prepareEffects() {

//    document.querySelector("button.showsecondverse").addEventListener("click", showSecondVerse);

//    document.querySelector("button.basskick").addEventListener("click", basskick);
}

function performEffect( timeEvent ) {
    if( timeEvent.element == "basskick") {
        basskick();
    } else if( timeEvent.element == "neonhighlight") {
        neonhighlight();
    }
}

function basskick() {
    document.querySelector("#scene").classList.remove("basskick");
    document.querySelector("#scene").offsetHeight; // force reflow
    document.querySelector("#scene").classList.add("basskick");
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



/***************************************************************

                    MODIFIERS

 ***************************************************************/

function prepareModifiers() {

}

function performModifier( timeEvent ) {
    if( timeEvent.element == "showsecondverse" ) {
        document.querySelector(".second_verse").style.display = "block";
    }
}

/*************** RECORDER *****************/

var lastObject = null;
var timeEvents = [];

function startRecording() {
    // register event-listeners on screens and flipboxes in the flipper
    document.querySelectorAll("svg #screens>g, #htmlflipper .flipbox, .neontext, #effects button, #modifiers button").forEach( element => element.addEventListener("click", clickOnScreen));

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

    // start playing music (from beginning)
    if( developerMode ) {
        // NOTE: Skip first 15 seconds when debugging
        player.currentTime = 15;
    } else {
        player.currentTime = 0;
    }

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
            if( thisEvent.type != "effect" && nextEvent != null ) {
                var index = eventIndex;
                var arrowEvent = nextEvent;
                while( arrowEvent.type == "effect" ) {
                    index++;
                    arrowEvent = timeEvents[index];
                }

                highlightArrow( thisEvent, arrowEvent);
            }
        }
    }
}

var lastlastElement = null;

function performEvent( timeEvent ) {

    if( timeEvent.type == "screen" || timeEvent.type == "flipper" || timeEvent.type.startsWith("neontext")) {
        var element = document.querySelector("#"+timeEvent.element);
        element.classList.remove("off");
        element.offsetHeight; // force reflow
        element.classList.add("on");

        if( lastEvent != null ) {
            if(lastEvent.type == "screen" || lastEvent.type=="flipper" || lastEvent.type=="neontext1") {
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
    if( fromEvent.type == toEvent.type && (fromEvent == "neontext1" || fromEvent == "neontext2") ) {
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
        speed: 100, // in pixels pr. second // TODO: Calculate speed to match distance

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

        navUpdateCursor( deltaTime );
    }
}

function runSoundAnimations( deltaTime ) {
    playing( deltaTime );
}



/************************** FLIPPER *************************/




function prepareFlipper() {
    // find the #flipper rect in the svg
    var rect = document.querySelector("svg #flipper rect");

    // also find the htmlflipper
    var htmlflipper = document.querySelector("#htmlflipper");

    // and set all the properties on the html from the SVG
    htmlflipper.style.top = rect.getAttribute("y") + "px";
    htmlflipper.style.left = rect.getAttribute("x") + "px";

    htmlflipper.style.width = rect.getAttribute("width") + "px";
    htmlflipper.style.height = rect.getAttribute("height") + "px";
}

// HMMM ... this doesn't always look right ... wonder why ...
// TODO: Change flipper to modify classes, but keep object order - change CSS aswell
function scrollFlipper( event ) {
    console.log("scroll on "+ event.target.id);
    event.target.removeEventListener("animationend", scrollFlipper);

    // find the first element in the flipper
    var flipboxes = document.querySelectorAll("#htmlflipper .flipbox");

    var first = flipboxes[0];
    var second = flipboxes[1];

    var height = first.offsetHeight;

    flipboxes.forEach( flipbox => flipbox.classList.add("move"));

    // NOTE: Needs to be a named function, so we can remove it as an event-listener
    function whenDoneScrolling() {
        second.removeEventListener("animationend", whenDoneScrolling);
        var parentNode = first.parentNode;
//        first.parentNode.removeChild(first);

        // don't remove, just make it invisible
        first.classList.add("hide");
        // and move it to last
        parentNode.appendChild(first);

        // and reset all the animations
        document.querySelectorAll("#htmlflipper .flipbox").forEach( flipbox => flipbox.classList.remove("move") );
    }

    // when done scrolling - remove the first element, and the move-class
    second.addEventListener("animationend", whenDoneScrolling);
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
    "foreversgonnastart2tonight"
]

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
    navAdjustEvents();
}

function navZoomOut() {
    eventNavigator.zoomFactor -= 1;
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
