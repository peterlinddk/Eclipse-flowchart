/* ScrollTo
 * --------
 * -target : 'top' or the DOM-id of the element whose top to scroll to
 * -speed  : the speed in pixels pr. second to scroll. Undefined defaults to 100. A 0 results in an immediate jump
*/
class ScrollTo extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
        this.target = timeEvent.target;
        this.speed = timeEvent.speed;
        // set to default speed if not specified
        if( this.speed === undefined ) {
            this.speed = 100;
        }
    }

    start() {
        console.log(`Scroll to ${this.target} with speed: ${this.speed}`);

        // find element with target
        if( this.target === "top" ) {
            this.destination = 0;
        } else {
            // This finds the elements current position on the page - will be 0 if scrolled to it!
            const dest_y = document.querySelector("#"+this.target).getBoundingClientRect().top;
            this.destination = dest_y;
        }
        
        if( this.speed === 0 ) {
            // jump immediately - don't animate
//            document.body.scrollTop = this.destination;
//            document.documentElement.scrollTop = this.destination;
            document.querySelector("main").scrollTop = this.destination;
            this.active = false;
        } else {
            // start animation
            this.current = document.querySelector("main").scrollTop || 0;
            this.active = true;
        }

        
    }

    animate( deltaTime ) {
        if( this.active ) {
            // Scrolling up or down
            if( this.current > this.destination ) {
                // scroll up - until reach destination
                this.current -= this.speed * deltaTime;
                if( this.current <= this.destination ) {
                    this.current = this.destination;
                    this.end();
                }
            } else {
                // scroll down - until reach destination
                this.current += this.speed * deltaTime;
                if( this.current >= this.destination ) {
                    this.current = this.destination;
                    this.end();
                }
            }
    
            // NOTE: Why both?
            document.querySelector("main").scrollTop = this.current;
//            document.body.scrollTop = this.current;
            //document.documentElement.scrollTop = this.current;
        }
    }
}