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

        // jump to topline-position
        scrollToTopline( true );
    }
}

/**************** FULLSCREEN and SIZING ****************/

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
        element.style.top = svgElement.getAttribute("y") + "px";
        element.style.left = svgElement.getAttribute("x") + "px";
        element.style.width = svgElement.getAttribute("width") + "px";
        element.style.height = svgElement.getAttribute("height") + "px";
    }

    // first the #flipper
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
        //body_elm.scrollTop = scrollto;
        document.body.scrollTop = scrollto;
        document.documentElement.scrollTop = scrollto;
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
    scroller.current = document.documentElement.scrollTop || document.body.scrollTop || 0;

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
        neontexts.forEach( nt=>{nt.classList.remove("on"); nt.offsetHeight; nt.classList.add("off");});
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

/**************** TEXTS ****************/

/****************************************************************

                        EFFECTS

 ****************************************************************/





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

       // body_elm.scrollTop = scroller.current;
        document.body.scrollTop = scroller.current;
        document.documentElement.scrollTop = scroller.current;
    }
}










/*************** RECORDER *****************/



/************* playback ****************/



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

        runEffectAnimations( deltaTime );

        if( developerMode ) {
            timelineNavigator.updateCursor();
        }

    }
}




/************************** FLIPPER *************************/






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