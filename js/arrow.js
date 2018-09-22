class Arrow {
    constructor( fromEvent, toEvent ) {
        // set default property-values
        this.active = false;
        this.type = null;

        //
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
            this.type = null;
        } else {
            this.type = Symbol("arrow");
            // find the arrow
            var arrowId = fromId + "2" + toId;
    
            // Figure how long the animation should run!
            var time = toEvent.time - fromEvent.time;
    
            var arrow = document.querySelector("#arrows #" + arrowId);
            if( arrow == null ) {
                // NOTE: This should not happen when the SVG is up to date with the arrowIDs
                console.warn("No arrow with id: " + arrowId);
                console.warn("Used from " , fromEvent, " to ", toEvent);
                this.type = null;
                this.active = false;
            } else {
                // create animation settings
                this.prepareAnimation( arrow, time ); // TODO: These parameters should be properties
            }
        }
    }

    prepareAnimation( arrow, time ) {
        var g = arrow.parentNode;

        var line = arrow.cloneNode(true);
        var blurline = arrow.cloneNode(true);
    
        // create an animation-object
        // TODO: Store in a different way
        //this.lineAnimation = {
    //        index: lineAnimations.length,
        this.active = true,
        this.line = line,
        this.blurline = blurline,
        this.arrowhead = g.querySelector("polygon").cloneNode(true),
        this.blurarrowhead = g.querySelector("polygon").cloneNode(true),
        this.totalLength = arrow.getTotalLength(),
        this.highlightLength = 50,
        this.drawLength = 0,
        this.speed = 100, // in pixels pr. second - recalculated to match distance
    
           
        
    
    
    
        // modify speed, to make it fit the next event
        // speed = pixels pr. second
        // speed = length pr time
        this.speed = this.totalLength / (time-.4);
    
        // if speed is very high (5000 is seen, then extend the drawlength)
        if( this.speed > 500 ) {
            this.highlightLength = 50 * (this.speed / 500);
            if( this.highlightLength > this.totalLength) {
                this.highlightLength = this.totalLength
            }
        }
    
        console.log("arrowspeed: " + this.speed);
    
        // make it orange ...
        this.line.style.stroke = "#fb3";
        this.blurline.style.stroke = "#fb3";
        // set strokewidth one larger, to avoid thin black line
        this.line.style.strokeWidth="4";
        // set strokedash to avoid flash of full line
        this.line.style.strokeDasharray = "0 0 0 "+this.totalLength;
        this.blurline.style.strokeDasharray = "0 0 0 "+this.totalLength;
    
    
        // and blur the blurline
        this.blurline.style.filter = "url(#blur4)";
        // make the blurred arrow invisible, and add a stroke to avoid black outline
        this.blurarrowhead.style.opacity = 0;
        this.blurarrowhead.style.stroke = "#fb3";
        this.blurarrowhead.style.fill = "#fb3";
        this.blurarrowhead.style.filter = "url(#blur4)";
    
     //   lineAnimations.push( lineAnimation );
    
        // add the clones to g - blurred first, so it gets below
        g.appendChild(this.blurline);
        g.appendChild(this.line);
    
        g.appendChild(this.blurarrowhead);
        g.appendChild(this.arrowhead);
    
        // status message
        console.log("Start animating line " + arrow.id);
    }

    animate( deltaTime ) {
        
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
                console.log("End animating line " + this.line.id);
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








