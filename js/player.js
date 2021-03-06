/**
 * Player
 * ------
 * The Player runs on requestAnimationFrame, and looks for TimeEvents to run, and arrows (lines) to connect them.
 * 
 */
class Player {
    constructor() {
        this.playing = false;
        this.arrows = []; // NOTE: Replaces 
        this.effects = [];
    }

    get isPlaying() {
        return this.playing;
    }

    setAudio( element ) {
        this.audio = element;
    }

    // TODO: Rename method
    playback() {

        // resetEffects
            // remove all classes from the scene
            document.querySelector("#scene").className="";
        
            // remove on or off from everything
            document.querySelectorAll("#scene .off").forEach(elm=>elm.classList.remove("off"));
            document.querySelectorAll("#scene .on").forEach(elm=>elm.classList.remove("on"));
        

        // reset music
        this.audio.currentTime = 0;
        this.audio.play();

        // remember that we are playing
        this.playing = true;

        // reset events
        this.eventIndex = 0;
        this.nextEvent = timeEvents[0];

        this.lastEvent = null;       // what the heck are the differences?
        this.lastEventObject = null; // between these two?

        // Start animating
        window.requestAnimationFrame( runAnimations ); // TODO: Make this object runAnimations
    }

    pause() {
        if( this.audio.paused ) {
            this.audio.play();
            timelineNavigator.play(); // TODO: Know about this object!
        } else {
            this.audio.pause();
            timelineNavigator.pause();
        }
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.playing = false;
    }

    skipTo( newTime ) {
        console.log("Skip to time: " + newTime);

        // move the actual audio
        this.audio.currentTime = newTime;

        // remove lastevent
        if( this.lastEventObject != null ) {
            this.lastEventObject.classList.remove("on");
        }
        this.lastEvent = null;
        this.lastEventObject = null;

        // find suitable eventindex
        for( let i=0; i < timeEvents.length; i++ ) {
            if( timeEvents[i].time > newTime ) {
                this.eventIndex = i;
                this.nextEvent = timeEvents[i];
                break;
            }
        }
    }

    animate( deltaTime ) {

        // do arrow animations
        this.arrows.forEach( arrow => arrow.animate(deltaTime) );

        // remove non-active arrows
        this.arrows = this.arrows.filter( arrow => arrow.active );

        // find next event

        // do effect animations
        this.effects.forEach( effect => effect.animate(deltaTime) );

        // remove non-active effects
        this.effects = this.effects.filter( effect => effect.active );
       

        let curTime = this.audio.currentTime;
    //    console.log("time: " + (nextEvent.time-curTime) );
    
        if( this.eventIndex < timeEvents.length && this.nextEvent != null ) {
            let nextTime = this.nextEvent.time;
            if( this.nextEvent.adjusted ) {
                nextTime = this.nextEvent.adjusted;
            }
    
            // if curtime is within 16ms of nextEvent, perform the next event!
            if( nextTime-curTime < deltaTime || curTime > nextTime ) {
                const thisEvent = this.nextEvent;
    
                console.log("@" + curTime + " : Perform event ", thisEvent);
                this.performEvent( thisEvent );
    
                // find nextEvent
                this.eventIndex++;
                if( this.eventIndex < timeEvents.length ) {
                    this.nextEvent = timeEvents[this.eventIndex];
                } else {
                    this.nextEvent = null;
                }
    
                // if this event wasn't an effect, then find the next event that isn't an effect, and draw an arrow to it
                if( thisEvent.type != "effect" && thisEvent.type != "modifier" && thisEvent.type != "text" && this.nextEvent != null ) {
                    let index = this.eventIndex;
                    let arrowEvent = this.nextEvent;
                    while( arrowEvent != null && ( arrowEvent.type == "effect" || arrowEvent.type == "modifier" || arrowEvent.type == "text") ) {
                        index++;
                        arrowEvent = timeEvents[index];
                    }
                    if( arrowEvent != null ) {
                        // create an Arrow, and add it to the array of arrows, if it isn't of type null (type null are dummy-arrows, but only the arrow-object itself understands the difference)
                        const arrow = new Arrow(thisEvent, arrowEvent);
                        if(arrow.type != null) {
                            this.arrows.push( arrow );
                        }
                    }
                }
            }
        }
    }

    // perform event
    performEvent( timeEvent ) {

        // TODO: All timeEvent types should be effects - flipper, turner and neontext all alike ...
        if( timeEvent.type == "screen" || timeEvent.type == "flipper"
         || timeEvent.type == "turner" || timeEvent.type.startsWith("neontext")) {
            let element = document.querySelector("#"+timeEvent.element);
    
            if( timeEvent.type == "turner" ) {
                element = document.querySelector("#html"+timeEvent.element);
            }
    
            element.classList.remove("off");
            element.offsetHeight; // force reflow
            element.classList.add("on");
    
            if( this.lastEvent != null ) {
                if(this.lastEvent.type == "screen" || this.lastEvent.type=="flipper"
                || this.lastEvent.type == "turner" || this.lastEvent.type=="neontext1") {
                    this.lastEventObject.classList.remove("on");
                    this.lastEventObject.offsetLeft;
                    this.lastEventObject.classList.add("off");
    
                } else if( this.lastEvent.type == "neontext2" ) {
                  // NOTE: Handled by the neonhighlighter effect
                }
    
                if( this.lastEvent.type == "flipper" ) {
                    // wait for off-animation to finish
                    this.lastEventObject.addEventListener("animationend", scrollFlipper);
                }
    
                if( this.lastEvent.type == "turner" ) {
                    // the actual turner is inside the event-object with the id
                    const turner = this.lastEventObject.querySelector(".turner");
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
    
                this.lastEvent = null;
                this.lastEventObject = null;
            } else {
                this.lastEvent = timeEvent;
                this.lastEventObject = element;
            }
    
    
    
    
        } else if( timeEvent.type == "effect") {

            // create effect from timeEvent
            const effect = createEffect( timeEvent );
            if( effect != null ) { // some effects might not exist in the current configuration - just ignore them
                effect.start(); 
                // only push active effects - that needs animating and other stuff later ...
                if( effect.active ) {
                    this.effects.push( effect );
                }
            }
            
        } else if( timeEvent.type == "modifier") {
            performModifier( timeEvent );
        } else if( timeEvent.type == "text") {
            performTextEvent( timeEvent );
        }
    
    
    
    }

}