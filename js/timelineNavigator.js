class TimelineNavigator {
    constructor() {
        prepareNavigator();

        this.setupButtonEvents();
    }

    setupButtonEvents() {
        document.querySelector("#timeline_buttons .zoomin").addEventListener("click", this.zoomIn);
        document.querySelector("#timeline_buttons .zoomout").addEventListener("click", this.zoomOut);
    }

    play() {
        // TODO: Make class for cursor
        internal_timelineNavigator.cursor.classList.remove("paused");
    }

    pause() {
        internal_timelineNavigator.cursor.classList.add("paused");
    }

    startRecording() {
        internal_timelineNavigator.cursor.classList.add("recording");
    }

    endRecording() {
        internal_timelineNavigator.cursor.classList.remove("recording");
    }

    zoomIn() {
        // TODO: Make class for timeline
        // TODO: Don't move when zooming
        internal_timelineNavigator.zoomFactor += 1;
        internal_timelineNavigator.length = internal_timelineNavigator.end * internal_timelineNavigator.zoomFactor;
        internal_timelineNavigator.timeline.style.width = internal_timelineNavigator.length + "px";
        navAdjustEvents();
    }

    zoomOut() {
        // TODO: Don't move when zooming
        internal_timelineNavigator.zoomFactor -= 1;
        internal_timelineNavigator.length = internal_timelineNavigator.end * internal_timelineNavigator.zoomFactor;
        internal_timelineNavigator.timeline.style.width = internal_timelineNavigator.length + "px";
        navAdjustEvents();
    }

    addTimeEvent( timeEvent ) {
        internal_timelineNavigator.addTimeEvent( timeEvent );
    }


}

var internal_timelineNavigator;

function prepareNavigator() {

    internal_timelineNavigator = {
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
            return clientX - this.container.offsetLeft + this.container.scrollLeft;
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
            elm.style.left = internal_timelineNavigator.getXfromTime( timeEvent.time ) + "px";

            // activate eventlisteners for hovering and selecting (for move)
            elm.addEventListener("mouseover", navEventHover);
            elm.addEventListener("mouseout", navEventStopHover);
            elm.addEventListener("mousedown", navEventSelect);
            elm.addEventListener("mouseup", navEventDeSelect);

            // add the element to the navigator
            this.timeline_events.appendChild(elm);

            // store the created element with the timeEvent
            timeEvent.adjusterElement = elm;

            return elm;
        }
    };

    internal_timelineNavigator.length = internal_timelineNavigator.end * internal_timelineNavigator.zoomFactor;

    // display: holds the timeline and everything else on the screen
    // container: handles the scrolling, and contains all the timeevents
    // timeline: the actual timeline
//    internal_timelineNavigator.display = document.querySelector("#timedisplay");
    internal_timelineNavigator.container = document.querySelector("#timeline_container");
    internal_timelineNavigator.timeline = internal_timelineNavigator.container.querySelector("#timeline");
    internal_timelineNavigator.timeline_events = internal_timelineNavigator.container.querySelector("#timeline_events");
    internal_timelineNavigator.cursor = internal_timelineNavigator.container.querySelector("#cursor_play");

    // Setup the length of the entire timeline (changes with zoom!)
    internal_timelineNavigator.timeline.style.width = internal_timelineNavigator.length + "px";

    // build list of timeEvents
    timeEvents.forEach( function(timeEvent) {
        internal_timelineNavigator.addTimeEvent( timeEvent );
    });

    
    // allow direct click on the timeline to skip time
    internal_timelineNavigator.timeline.addEventListener("click", navTimelineJump, false);
    // create timelinecursor
    internal_timelineNavigator.timeline.addEventListener("mousemove", navTimeHover);
    internal_timelineNavigator.timeline.addEventListener("mouseover", navTimeHoverShow);
    internal_timelineNavigator.timeline.addEventListener("mouseout", navTimeHoverHide);
}


function navTimeHoverShow( evt ) {
    document.querySelector("#cursor_hover").style.display = "block";
}

function navTimeHoverHide( evt ) {
    document.querySelector("#cursor_hover").style.display = "none";
}

function navTimeHover( evt ) {
    var hoverelm = document.querySelector("#cursor_hover");

    var xpos = internal_timelineNavigator.getXpos(evt.clientX);

    hoverelm.style.left  = xpos + "px"

        // calculate this to a time
    var newTime = internal_timelineNavigator.getTimeFromX( xpos );

    hoverelm.textContent = newTime;

}




function navEventSelect( evt ) {
//    console.log("klik på ", evt);
    internal_timelineNavigator.container.addEventListener("mousemove", navEventMove);

    // remember the selected event's offset (to avoid jumping a few pixels)
    internal_timelineNavigator.selectedEventOffset = evt.offsetX;

    internal_timelineNavigator.selectedEvent = evt.target;
    internal_timelineNavigator.selectedEvent.removeEventListener("mouseover", navEventHover);
    internal_timelineNavigator.selectedEvent.removeEventListener("mouseout", navEventStopHover);
    internal_timelineNavigator.selectedEvent.addEventListener("mouseout", navEventDeSelect);
    // mark event as being dragged
    internal_timelineNavigator.selectedEvent.classList.add("dragging");
}


function navEventDeSelect( evt ) {
//    console.log("klik af ", evt);

    if( internal_timelineNavigator.selectedEvent != null ) {
        internal_timelineNavigator.selectedEvent.removeEventListener("mouseout", navEventDeSelect);
        internal_timelineNavigator.selectedEvent.addEventListener("mouseover", navEventHover);
        internal_timelineNavigator.selectedEvent.addEventListener("mouseout", navEventStopHover);
        internal_timelineNavigator.selectedEvent.classList.remove("dragging");
        internal_timelineNavigator.selectedEvent = null;
    }

    internal_timelineNavigator.container.removeEventListener("mousemove", navEventMove);
}

function navEventMove( evt ) {
    if( internal_timelineNavigator.selectedEvent != null ) {
//        console.log("move ", evt );

        var xpos = internal_timelineNavigator.getXpos(event.clientX) - internal_timelineNavigator.selectedEventOffset;

        internal_timelineNavigator.selectedEvent.style.left = xpos + "px";

        var newTime = internal_timelineNavigator.getTimeFromX( xpos );
        var tev = timeEvents.find( timeEvent => timeEvent.adjusterElement == internal_timelineNavigator.selectedEvent );

        tev.adjusted = newTime;
        internal_timelineNavigator.selectedEvent.classList.add("adjusted");

        navShowEventInfo(tev, internal_timelineNavigator.selectedEvent);
    }
}

var highlightedEvent = null;

function navUpdateCursor( deltaTime ) {
    // get time from player
    var curtime = player.currentTime;

    var cursorpos = internal_timelineNavigator.getXfromTime(curtime);

    internal_timelineNavigator.cursor.style.left = cursorpos + "px";

    // make sure that the timecursor is in view!
    if( !player.paused ) {
        if( cursorpos > internal_timelineNavigator.container.clientWidth + internal_timelineNavigator.container.scrollLeft-10) {
//            console.log("Cursor out of view - right");
            internal_timelineNavigator.container.scrollLeft = cursorpos-internal_timelineNavigator.container.clientWidth+10;
        } else if( cursorpos < internal_timelineNavigator.container.scrollLeft ) {
//            console.log("Cursor out of view - left");
            internal_timelineNavigator.container.scrollLeft = cursorpos-10;
        }
    }


}

function navTimelineJump( event ) {
    //    console.log( event );

    // only accept clicks directly on the timeline (not on the events);
    if( event.target == internal_timelineNavigator.timeline && internal_timelineNavigator.selectedEvent == null ) {
        // find out where we clicked on the timeline
        var xpos = internal_timelineNavigator.getXpos(event.clientX);

        // calculate this to a time
        var newTime = internal_timelineNavigator.getTimeFromX( xpos );
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
    var eventinf = document.querySelector("#timeline_popup");
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
    eventinf.style.left = element.offsetLeft - internal_timelineNavigator.container.scrollLeft + "px";
}


function navEventStopHover( evt ) {

    console.log("stop hover");
    var eventinf = document.querySelector("#timeline_popup");
    eventinf.style.display = "none";

    highlightedEvent = null;
}





function navAdjustEvents() {
    timeEvents.forEach( function(timeEvent) {
        // calculate position from zoomFactor (maybe changed)
        var pos = timeEvent.time * internal_timelineNavigator.zoomFactor ;
        // set the new position on the adjusterElement
        timeEvent.adjusterElement.style.left = pos + "px";
    });
}
