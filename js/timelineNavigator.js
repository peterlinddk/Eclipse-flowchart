/* 
  TimelineNavigator
  -----------------
  Contains the timeline with all the events and cursors (play and hover)
  Also has buttons for zooming and scrolling - this is the only object that should be visible to the outside
*/
class TimelineNavigator {
    constructor() {
        this.container = document.querySelector("#timeline_container");

        // TODO: Cleanup

        this.end = player.duration;
        this.zoomFactor = 32;
        this.length = this.end * this.zoomFactor;

        // create timeline
        this.timeline = new Timeline( this );
        this.timeline.setLength( this.length );



        // create cursor_play
        this.cursor_play = this.container.querySelector("#cursor_play");

        this.setupButtonEvents();

        // remember timeline_events (containing all the timeEvents)
        this.timeline_events = this.container.querySelector("#timeline_events");

        this.selectedEvent = null;
        this.selectedEventOffset = 0;

        // build list of timeEvents
        timeEvents.forEach( timeEvent => this.addTimeEvent(timeEvent) );
    }

    setupButtonEvents() {
        document.querySelector("#timeline_buttons .zoomin").addEventListener("click", this.zoomIn.bind(this));
        document.querySelector("#timeline_buttons .zoomout").addEventListener("click", this.zoomOut.bind(this));
    }

   

    play() {
        // TODO: Make class for cursor
        this.cursor_play.classList.remove("paused");
    }

    pause() {
        this.cursor_play.classList.add("paused");
    }

    startRecording() {
        this.cursor_play.classList.add("recording");
    }

    endRecording() {
        this.cursor_play.classList.remove("recording");
    }

    zoomIn() {
        // TODO: Make class for timeline
        // TODO: Don't move when zooming
        this.zoomFactor += 1;
        this.length = this.end * this.zoomFactor;
        this.timeline.setLength(this.length);
        this.reAdjustEvents();
    }

    zoomOut() {
        // TODO: Don't move when zooming
        this.zoomFactor -= 1;
        this.length = this.end * this.zoomFactor;
        this.timeline.setLength(this.length);
        this.reAdjustEvents();
    }
    
    reAdjustEvents() {
        timeEvents.forEach( timeEvent => {
            // calculate position from zoomFactor (maybe changed)
            var pos = timeEvent.time * this.zoomFactor ;
            // set the new position on the adjusterElement
            timeEvent.adjusterElement.style.left = pos + "px";
        });
    }

    getXpos( clientX ) {
        return clientX - this.container.offsetLeft + this.container.scrollLeft;
    }

    getXfromTime( time ) {
        return time * this.zoomFactor;
    }

    getTimeFromX( xpos ) {
        return xpos / this.zoomFactor;
    }

    updateCursor( ) {
        // get time from player
        var curtime = player.currentTime;
    
        var cursorpos = this.getXfromTime(curtime);
    
        this.cursor_play.style.left = cursorpos + "px";
    
        // make sure that the timecursor is in view!
        if( !player.paused ) {
            if( cursorpos > this.container.clientWidth + this.container.scrollLeft-30) {
    //            console.log("Cursor out of view - right");
                this.container.scrollLeft = cursorpos-this.container.clientWidth+30;
            } else if( cursorpos < this.container.scrollLeft ) {
    //            console.log("Cursor out of view - left");
                this.container.scrollLeft = cursorpos-30;
            }
        }
    }


    addTimeEvent( timeEvent ) {
        console.log("addTimeEvent:");
        const timelineEvent = new TimelineEvent( timeEvent, this );
        // add the element to the physical timeline
        this.timeline_events.appendChild(timelineEvent.element);
    }
}

/*
  Timeline
  --------
  The actual timeline with all the events - the timeline doesn't know about scroll or zoom
*/  
class Timeline {
    constructor( timelineNavigator ) {
        this.timelineNavigator = timelineNavigator;

        this.element = timelineNavigator.container.querySelector("#timeline");
        this.cursor_hover = timelineNavigator.container.querySelector("#cursor_hover");
        this.setupMouseEvents();
    }

    setLength( length ) {
        // Setup the length of the entire timeline (changes with zoom!)
        this.element.style.width = length + "px";
    }

    setupMouseEvents() {
        // allow direct click on the timeline to skip time
        this.element.addEventListener("click", this.click.bind(this), false);
        // create timelinecursor
        this.element.addEventListener("mousemove", this.hover.bind(this));
        this.element.addEventListener("mouseover", this.hoverStart.bind(this));
        this.element.addEventListener("mouseout", this.hoverEnd.bind(this));
    }

    click( event ) {
        console.log(`timelineJump ${event.target}`);
    
        // only accept clicks directly on the timeline (not on the events);
        if( event.target == this.element && this.timelineNavigator.selectedEvent == null ) {
            // find out where we clicked on the timeline
            var xpos = this.timelineNavigator.getXpos(event.clientX);
    
            // calculate this to a time
            var newTime = this.timelineNavigator.getTimeFromX( xpos );
            skipTo(newTime);
    
            this.timelineNavigator.updateCursor();
        }
    }

    hoverStart( evt ) {
        this.cursor_hover.style.display = "block";
    }
    
    hoverEnd( evt ) {
        this.cursor_hover.style.display = "none";
    }
    
    hover( evt ) {
        var xpos = this.timelineNavigator.getXpos(evt.clientX);
    
        this.cursor_hover.style.left  = xpos + "px"
    
            // calculate this to a time
        var newTime = this.timelineNavigator.getTimeFromX( xpos );
    
        this.cursor_hover.textContent = newTime;
    }
}

/*
  TimelineEvent
  -------------
  an event on the timeline
*/
class TimelineEvent {
    constructor( timeEvent, timelineNavigator ) {

        this.timelineNavigator = timelineNavigator;

        // create an element
        const elm = document.createElement("div");
        elm.classList.add("event");

        // add class based on type
        elm.classList.add( timeEvent.type );

        // and add the element, and time as data-points
        elm.dataset.element = timeEvent.element;
        elm.dataset.time = timeEvent.time;

        // set position
        elm.style.left = this.timelineNavigator.getXfromTime( timeEvent.time ) + "px";

        // activate eventlisteners for hovering and selecting (for move)
        elm.addEventListener("mouseover", this.startHover.bind(this));
        elm.addEventListener("mouseout", this.endHover.bind(this));
        elm.addEventListener("mousedown", this.select.bind(this));
        elm.addEventListener("mouseup", this.deSelect.bind(this));

        this.element = elm;

   

        // store the created element with the timeEvent
        timeEvent.adjusterElement = elm;
    }

    select( evt ) {
        //    console.log("klik på ", evt);
        this.timelineNavigator.container.addEventListener("mousemove", this.move.bind(this));
    
        // remember the selected event's offset (to avoid jumping a few pixels)
        this.timelineNavigator.selectedEventOffset = evt.offsetX;
    
        this.timelineNavigator.selectedEvent = evt.target;
        this.timelineNavigator.selectedEvent.removeEventListener("mouseover", this.startHover.bind(this));
        this.timelineNavigator.selectedEvent.removeEventListener("mouseout", this.endHover.bind(this));
        this.timelineNavigator.selectedEvent.addEventListener("mouseout", this.deSelect.bind(this));
        // mark event as being dragged
        this.timelineNavigator.selectedEvent.classList.add("dragging");
    }
    
    
    deSelect( evt ) {
    //    console.log("klik af ", evt);
    
        if( this.timelineNavigator.selectedEvent != null ) {
            this.timelineNavigator.selectedEvent.removeEventListener("mouseout", this.deSelect.bind(this));
            this.timelineNavigator.selectedEvent.addEventListener("mouseover", this.startHover.bind(this));
            this.timelineNavigator.selectedEvent.addEventListener("mouseout", this.endHover.bind(this));
            this.timelineNavigator.selectedEvent.classList.remove("dragging");
            this.timelineNavigator.selectedEvent = null;
        }
    
        this.timelineNavigator.container.removeEventListener("mousemove", this.move.bind(this));
    }
    
    move( evt ) {
        if( this.timelineNavigator.selectedEvent != null ) {
    //        console.log("move ", evt );
    
            var xpos = this.timelineNavigator.getXpos(event.clientX) - this.timelineNavigator.selectedEventOffset;
    
            this.timelineNavigator.selectedEvent.style.left = xpos + "px";
    
            var newTime = this.timelineNavigator.getTimeFromX( xpos );
            var timeEvent = timeEvents.find( timeEvent => timeEvent.adjusterElement == this.timelineNavigator.selectedEvent );
    
            timeEvent.adjusted = newTime;
            this.timelineNavigator.selectedEvent.classList.add("adjusted");
    
            this.showPopup(timeEvent, this.timelineNavigator.selectedEvent);
        }
    }

    startHover( evt ) {
        var element = evt.target;
        if( element != highlightedEvent ) {
            // We are hovering above a new element
    
            // find the matching timeEvent
            var timeEvent = timeEvents.find(timeEvent=> timeEvent.adjusterElement == element);
    
            // show eventinfo
            this.showPopup(timeEvent, element);
    
            // remember the element
            highlightedEvent = element;
        }
    }
    
    showPopup( timeEvent, element ) {
        var popup = document.querySelector("#timeline_popup");
        popup.style.display = "block";
    
        // fill popup with data
        popup.querySelector(".data_type").textContent = timeEvent.type;
        popup.querySelector(".data_time").textContent = timeEvent.time;
        popup.querySelector(".data_element").textContent = timeEvent.element;
    
        if( timeEvent.adjusted ) {
            popup.querySelector(".data_adjusted").textContent = timeEvent.adjusted;
            popup.querySelector(".adjusted_time").style.display = "block";
        } else {
            popup.querySelector(".adjusted_time").style.display = "none";
        }
    
        // position the eventinfo correctly
        // find scroll-position of timeline_container
        popup.style.left = element.offsetLeft - this.timelineNavigator.container.scrollLeft + "px";
    }
    
    
    endHover( evt ) {
    
        console.log("stop hover");
        var popup = document.querySelector("#timeline_popup");
        popup.style.display = "none";
    
        highlightedEvent = null;
    }
}


// TODO: Move into navigator, or make a singleton or something ...
var highlightedEvent = null;