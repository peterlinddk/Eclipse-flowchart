/**
 * Organ
 * -----
 * An effect that makes all the arrows glow orange and fade back to normal.
 * Should really be called something better
 * 
 * The entire scene background glows with an orange radiant, animated from alpha 0 to 1 and back again
 * The arrows glow brighly orange (colored through CSS, and with a layer of blurred arrows added to the SVG)
 * 
 */
class Organ extends Effect {
    constructor( timeEvent ) {
        super( timeEvent);
    }

    start() {
        // Clone all the arrows to two new layers - to avoid destroying the originals
        // #arrowsclone - a direct copy on top, just for CSS-styling (color-glow)
        // #arrowsblur  - a version below that, just for blurring-effects

        const arrows_orig = document.querySelector("#arrows");
        const arrows_clone = arrows_orig.cloneNode(true);
        arrows_clone.id = "arrowsclone";
        const arrows_blur = arrows_orig.cloneNode(true);
        arrows_blur.id = "arrowsblur";

        arrows_orig.parentElement.insertBefore(arrows_clone, arrows_orig.nextElementSibling);
        arrows_orig.parentElement.insertBefore(arrows_blur, arrows_orig.nextElementSibling);

        // store variables for glowing and blurring
        this.bgAlpha = 0;   // current alpha-value for the background - animates from 0 to 1 to 0
        this.bgAlphaGrowth = 1/3; // the change pr. second in alpha (constant value, but flips sign)
        this.blurring = 0;  // The current blur (gauss stdDeviation value) - used to select a blur-filter from svgdefs
        this.blurArrows = arrows_blur;

        // start animation
        this.active = true;
    }

    end() {
        super.end();

        // remove arrowsclone and arrowsblur
        const arrows_clone = document.querySelector("#arrowsclone");
        const arrows_blur = document.querySelector("#arrowsblur");

        arrows_clone.parentNode.removeChild(arrows_clone);
        arrows_blur.parentNode.removeChild(arrows_blur);

    }

    animate( deltaTime ) {
        if( this.active ) {
            // modify the alpha-value
            this.bgAlpha += this.bgAlphaGrowth * deltaTime;

            // if it hits 1 - flip the growth-sign.
            if( this.bgAlpha >= 1 && this.bgAlphaGrowth > 0 ) {
//                console.log("alpha is 1");
                this.bgAlpha = 1;
                this.bgAlphaGrowth*=-1;
            } else if( this.bgAlpha < 0 ) {
//                console.log("Alpha is 0");
                this.bgAlphaGrowth*=-1; // NOTE: Is this even necessary?
                // reset the background, to allow for future class-styling
                document.querySelector("#scene").style.background = undefined;
                // end the animation
                this.end();
            }
    
            // animate the background and blurring - if still running
            if( this.active ) {
                // set the scene background to a glowing orange "ball"
                const background = "radial-gradient(ellipse at center, rgba(255,187,51,"+ this.bgAlpha+") 0%,rgba(44,128,91,1) 100%)";
                document.querySelector("#scene").style.background = background;
    
                // apply the blur-filter
                const blur = Math.ceil(this.bgAlpha * 7);
                if( this.blurring != blur ) {
                    // but only if different from the last filter - to avoid reflow and flickering
                    this.blurArrows.style.filter = "url(#blur" + blur + ")";
                    this.blurring = blur;
                }
//                console.log("blurring: " + Math.ceil(blur) );
            }
        }
    }
}
