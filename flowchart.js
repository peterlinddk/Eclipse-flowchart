$(window).on("load", sidenVises);

function sidenVises() {
    // load SVG
    $("#svg").load("flowchart.svg", whenSVGisLoaded);

    // load JSON
    $.getJSON("flowchart.json", loadJSON);

}

function whenSVGisLoaded() {
    console.log("SVG loaded");
    // prepare the flipper
    prepareFlipper();

    // create arrow-ids
    createArrowIDs();

    // activate buttons
    $("button.startrecord").on("click", startRecording);
    $("button.pause").on("click", pause);
    $("button.endrecord").on("click", endRecording);
    $("button.playback").on("click", playback);
    $("button.stop").on("click", stop);
}

function loadJSON( data ) {
    console.log("JSON loaded");

    timeEvents = data;

    playback();
}

/*************** RECORDER *****************/

var starttime = 0;
var lastObject = null;
var timeEvents = [];

function startRecording() {
    // register event-listeners on screens and divs in the flipper
    document.querySelectorAll("svg #screens>g, #htmlflipper div").forEach( element => element.addEventListener("click", clickOnScreen));

    // start music
    document.querySelector("#music").currentTime = 0;
    document.querySelector("#music").play();

    starttime = Date.now();

    // clear array
    timeEvents = [];
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

    // register the object as clicked!
    target.classList.add("on");

    // de-register the last object, if any
    if( lastObject != null ) {
        lastObject.classList.remove("on");
    }
    lastObject = target;

    var type = "flipper";

    // check the type - screen or flip
    if( target.parentNode.id == "screens" ) {
        type = "screen";
    }

    // create object
    var timeEvent = {
        time: timestamp,
        type: type,
        element: id
    };

    timeEvents.push( timeEvent );

    console.log("logged: ", timeEvent);
}

function pause() {
    if( player.paused ) {
        player.play();
    } else {
        player.pause();
    }
}

function stop() {
    document.querySelector("#music").pause();
    player.currentTime = 0;

    player.removeEventListener("timeupdate", playing);
}

function endRecording() {
    // de-register clicking
    document.querySelectorAll("svg #screens>g, #htmlflipper div").forEach( element => element.removeEventListener("click", clickOnScreen));

    // stop the music
    document.querySelector("#music").pause();

    // create json-array of timeEvents
    var jsondata = JSON.stringify( timeEvents );

    // display the jsondata // TODO: Put in a textarea on the screen
    console.log("JSON:");
    console.log(jsondata);

}

var player;
var eventIndex = 0;
var nextEvent = null;
var lastEvent = null;
var lastEventObject = null;

function playback() {
    player = document.querySelector("#music");

    // register event
    player.addEventListener("timeupdate", playing);

    // start playing music (from beginning)
    player.currentTime = 0;
//    player.currentTime = 15; // NOTE: Skip first 15 seconds
    player.play();

    // TODO: Block play-button!

    // reset event-counter
    eventIndex = 0;
    nextEvent = timeEvents[0];

    lastEventObject = null;
    lastEvent = null;

    prepareLineAnimations();

}

function playing( event ) {
    var curTime = player.currentTime;
//    console.log("time: " + (nextEvent.time-curTime) );

    // if curtime is within 16ms of nextEvent, perform the next event!
    if( nextEvent.time-curTime < 0.5 || curTime > nextEvent.time ) {
        console.log("@" + curTime + " : Perform event ", nextEvent);
        performEvent( nextEvent );



        // highlight arrow to nextEvent
        if( eventIndex < timeEvents.length-1 ) {
            highlightArrow( nextEvent, timeEvents[eventIndex+1]);
        }

        eventIndex++;
        // TODO: Handle end of events!
        if( eventIndex >= timeEvents.length ) {
            // stop playing
            stop();
            // TODO: Re-enable play-button

        }
        nextEvent = timeEvents[eventIndex];



    }
}

function performEvent( timeEvent ) {
    var element = document.querySelector("#"+timeEvent.element);
    element.classList.remove("off");
    element.classList.add("on");


    if( lastEvent != null ) {
        lastEventObject.classList.remove("on");

        if( lastEvent.type == "flipper" ) {
            scrollFlipper();
        }

    }

    lastEvent = timeEvent;
    lastEventObject = element;
}

function highlightArrow( fromEvent, toEvent ) {
    var fromId = fromEvent.element;
    var toId = toEvent.element;
    if( fromEvent.type == "flipper" ) {
        fromId = "flipper";
    }
    if( toEvent.type == "flipper") {
        toId = "flipper";
    }

    // find the arrow
    var arrowId = fromId + "2" + toId;

    // Figure how long the animation should run!
    var time = toEvent.time - fromEvent.time;

    var arrow = document.querySelector("#" + arrowId);

    animateLine( arrow, time );
}




//var line = null;
//var arrowhead = null;
//var drawLength = 0;
//var timer = null;
//
//var highlightLength = 50;



function animateLine( arrow, time ) {
    var g = arrow.parentNode;

    var line = arrow.cloneNode(true);

    // create an animation-object
    var lineAnimation = {
        index: lineAnimations.length,
        active: true,
        line: line,
        arrowhead: g.querySelector("polygon").cloneNode(true),
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
            }

            this.line.style.strokeDasharray = [a,b,c,d].join(' ');
            if( b >= this.totalLength ) {
                console.log("End animating line " + line.id);
                this.active = false;

                // remove line
                this.line.parentNode.removeChild(this.line);
                this.arrowhead.parentNode.removeChild(this.arrowhead);
                //clearInterval(timer);

                // remove this from lineAnimations
//                lineAnimations.splice(this.index,1);
            }
        }
    }

    // modify speed, to make it fit the next event
    // speed = pixels pr. second
    // speed = length pr time
    lineAnimation.speed = lineAnimation.totalLength / (time-.4);

    // make it orange ...
    line.style.stroke = "#fb3";


    lineAnimations.push( lineAnimation );


    // make a clone of this line
//    line = origline.cloneNode(true);

    // add the clones to g
    g.appendChild(lineAnimation.line);
    g.appendChild(lineAnimation.arrowhead);

    // there should be a polygon right after
//    var origarrowhead = origline.parentNode.querySelector("polygon");
//    arrowhead = origarrowhead.cloneNode(true);
//    origarrowhead.parentNode.appendChild(arrowhead);

    //arrowhead.style.fill = "#fb3";


//    line.style.stroke = "#fb3";

    // calculate length
    //var length = line.getTotalLength();
//    drawLength = 0;

    // create animation to draw it, bit by bit
//    timer = setInterval(drawArrowLine, 1000/60);
    console.log("Start animating line " + arrow.id);
}

function prepareLineAnimations() {
    lineAnimations = [];
    window.requestAnimationFrame( runLineAnimations );
}

var lineAnimations = [];
var lasttime;

function runLineAnimations() {
    window.requestAnimationFrame( runLineAnimations );

    // calculate deltaTime ...
    var now = Date.now();
    var deltaTime = (now - (lasttime || now))/1000;
    lasttime = now;

    lineAnimations.forEach( lineAnimation => {if(lineAnimation.active) {
        lineAnimation.performAnimation(deltaTime)
    }});


    if( lineAnimations.length > 0 ) {
        for( let i=lineAnimations.length-1; i >= 0; i-- ) {
            if( !lineAnimations[i].active ) {
                lineAnimations.splice(i,1);
            }
//            lineAnimations[i].performAnimation(deltaTime);
        }
    }

//    lineAnimations.forEach( lineAnimation => lineAnimation.performAnimation(deltaTime) );

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

function scrollFlipper() {
    // find the first element in the flipper
    var first = document.querySelector("#htmlflipper div");

    var height = first.offsetHeight;

    document.querySelectorAll("#htmlflipper div").forEach( div => div.classList.add("move"));

    // when done scrolling - remove the first element, and the move-class
    first.addEventListener("animationend", function() {
        first.parentNode.removeChild(first);

        // and reset all the animations
        document.querySelectorAll("#htmlflipper div").forEach( div => div.classList.remove("move") );
    });


/*
    // flip the first element
    first.style.transform = "translateY(-"+height+"px) rotateX(90deg)";

    // find all the other elements, and move them up, by height
    document.querySelectorAll("#htmlflipper div+div").forEach( div => div.style.transform = "translateY(-"+height+"px)");

    // when done scrolling - remove the first element
    first.addEventListener("transitionend", function() {

        document.querySelector("#htmlflipper").style.transition = "transform 0s";

        first.parentNode.removeChild(first);



        // reset all the transforms
        document.querySelectorAll("#htmlflipper div").forEach( div => {
//            div.style.transition = "";
            div.style.transform = "";}
        );
    })
  */
}

/************** ARROWS *************/

// NOTE: Since the arrows don't have IDs in the SVG
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
    "fallapart2turnaround"]

function createArrowIDs() {
    // find all the arrow-elements (g with a path or line)
    var arrows = document.querySelectorAll("#arrows g path, #arrows g line");
    arrows.forEach( (arrow,index) => arrow.id = arrowIDs[index]);
}
