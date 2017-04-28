$(window).on("load", sidenVises);

function sidenVises() {
    // load SVG
    $("#svg").load("flowchart.svg");

    // activate buttons
    $("button.turnaround").on("click", turnaround);
    $("button.tobrighteyes").on("click", tobrighteyes);
    $("button.brighteyes").on("click", brighteyes);
    $("button.toeverynow").on("click", toeverynow);
    $("button.everynow").on("click", everynow);
}

function turnaround() {
    $("#screens g").removeClass("on");

    $("#screens #turnaround").addClass("on");
    $("#screens #turnaround").removeClass("off");
    console.log("turnaround - toggle");
}

/*
    <button class="toeverynow">&rarr;Every now ...</button>
       <button class="everynow">Every now ...</button>
       */

function toeverynow() {
    animateLine( $("#arrowpaths g path").get(0) );
}

function everynow() {
    $("#screens #turnaround").removeClass("on");
    $("#screens #turnaround").addClass("off");

    $("#screens #everynow").removeClass("off");
    $("#screens #everynow").addClass("on");
}

function brighteyes() {
    $("#screens #turnaround").removeClass("on");
    $("#screens #turnaround").addClass("off");

    $("#screens #brighteyes").addClass("on");
    $("#screens #brighteyes").removeClass("off");
}


function tobrighteyes() {
    // find arrow-line
    var origline = $("#arrowpaths g line").get(0); // NOTE: This sucks without id's ...

    animateLine( origline );
}

var line = null;
var arrowhead = null;
var drawLength = 0;
var timer = null;

var highlightLength = 50;


function animateLine( origline ) {

    // make a clone of this line
    line = origline.cloneNode(true);
    origline.parentNode.appendChild(line);

    // there should be a polygon right after
    var origarrowhead = origline.parentNode.querySelector("polygon");
    arrowhead = origarrowhead.cloneNode(true);
    origarrowhead.parentNode.appendChild(arrowhead);

    //arrowhead.style.fill = "#fb3";


    line.style.stroke = "#fb3";

    // calculate length
    //var length = line.getTotalLength();
    drawLength = 0;

    // create animation to draw it, bit by bit
    timer = setInterval(drawArrowLine, 1000/60);
}

function drawArrowLine() {
    var totalLength = line.getTotalLength();

     drawLength += 2; // pixels pr frame

    // strokeDashArray = "a, b, c, d"
    // a: start, altid 0
    // b: start af highlight, 0 indtil c er større end highlight length
    // c: slut på highlight lengt, indtil c = d
    // d: længden på linjen, altid totalLength

    // c starter med at være 0, og stiger til d.
    // b starter også med at være 0, og stiger i takt med c, men først når c er større end highlightlength
    // b fortsætter med at blive større, ind til b = d
    // så stopper animationen

    var a = 0;
    var b = 0;
    var c = 0;
    var d = totalLength;

    if( drawLength < highlightLength ) {
        c = drawLength;
        b = 0;
    } else {
        b = drawLength-highlightLength;
        c = highlightLength;
    }

    if( b+c > d ) {
        arrowhead.style.fill = "#fb3";
    }


    line.style.strokeDasharray = [a,b,c,d].join(' ');
    if( b >= totalLength ) {
        // remove line
        line.parentNode.removeChild(line);
        arrowhead.parentNode.removeChild(arrowhead);
        clearInterval(timer);
    }
}
