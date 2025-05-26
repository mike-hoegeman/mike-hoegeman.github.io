/*
 * fretboard.js -- A fretboard digramming gadget
 */

//-----------------------------------------------------------------------------
// reference:
// https://observablehq.com/@taekie/le-corbusier-color-pallete
//
const LeCorbusierQuickColor = {
    vernalGreen: '#7fa25a',
        green: '#7fa25a',
    yellowSun: '#f2bb1d',
        yellow: '#f2bb1d',
    skyAndSea: '#7aa7cb',
        blue: '#7aa7cb',
    orangeApricot: '#dc6c40',
        red: '#dc6c40',

    emeraldGreen: '#428f70',
    powerfulOrange: '#c45e3a',
    blueGrey: '#d9e1dd',
    sandyOrange: '#eacfb9',
    skyOceanWaves: '#c6d5cc',
    mediumGrey: '#929494',
    luminousCerulean: '#679dae',
    luminousPink: '#dba3af',
    ivoryBlack: '#3a3b3b',
    ivoryWhite: '#eae4d7',
    ironGrey: '#536061',
    white: '#ffffff',
    black: '#000000'
};
//
const LeCorbusierPalette = [[
    "#000000","#eadbc0","#5e6061","#929494","#a7a8a5","#bcbbb6","#4d6aa8","#8fabc9","#abbdc8","#b6c6ce","#d9e1dd","#3e6e90","#679dae","#8ab5ba","#a8c4c1","#c6d5cc"
    ], [
    "#406e58","#91afa1","#becbb7","#3e6f42","#7fa25a","#abc17a","#c4d39b","#eacfa6","#d46c40","#dc8d67","#eacfb9","#9b3738","#e6cdbf","#8f3a43","#943a4d","#d6afa6"
    ], [
    "#8b4d3e","#cd9886","#dbbeaa","#68443c","#b67b66","#d8b29a","#e2cbb5","#4c423d","#b7a392","#5a5550","#928a7e","#b7ac9d","#ac443a","#eae4d7","#dba3af","#744438"
    ], [
    "#3a3b3b","#b8a136","#428f70","#81868b","#403c3a","#3957a5","#dbb07f","#74393b","#7aa7cb","#92969a","#ddbf99","#45423e","#c45e3a","#313d6b","#60646a","#f2bb1d"
]];
//
//-----------------------------------------------------------------------------

// Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
const __ColorCache = {}; document.createElement('canvas'); 
const __ColorCvs = document.createElement('canvas'); 
function colorToRGBA(color) {
    // color must be a valid canvas fillStyle. This will cover most anything
    // you'd want to use.
    // Examples:
    // colorToRGBA('red')  # [255, 0, 0, 255]
    // colorToRGBA('#f00') # [255, 0, 0, 255]
    if (color in __ColorCache) {
        return __ColorCache[color];
    }
    __ColorCvs.height = 1;
    __ColorCvs.width = 1;
    var ctx = __ColorCvs.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    __ColorCache[color] = ctx.getImageData(0, 0, 1, 1).data;
    return __ColorCache[color];
}

function byteToHex(num) {
    // Turns a number (0-255) into a 2-character hex number (00-ff)
    return ('0'+num.toString(16)).slice(-2);
}

function colorToHex(color) {
    // Convert any CSS color to a hex representation
    // Examples:
    // colorToHex('red')            # '#ff0000'
    // colorToHex('rgb(255, 0, 0)') # '#ff0000'
    var rgba, hex;
    rgba = colorToRGBA(color);
    hex = [0,1,2].map(
        function(idx) { return byteToHex(rgba[idx]); }
        ).join('');
    return "#"+hex;
}


//
// holds all items that can configure a FretBoard
// part of a saved Fretboard session
// A standard set of these live in FRETBOARD_CATALOG
//
class FretboardConfig {
    constructor() {
        // values with null are required from the supplier of the config
        this.title = null; 
        this.stringDisplayWidths = null;
        this.stringIntervals = null
        this.markers = null; 
        //
        this.octaveNotes = false;
        this.showOpenStrings = true;
        this.markerOffset = 0;

        // Not often changed
        this.offsetX =        40;
        this.offsetY =        40;
        this.fretWidth =      70;
        this.stringSpacing = 40;
        this.markerStyles = ['fret-number', 'linear-inlay'];

        this.color = {
            'app-background': LeCorbusierQuickColor['white'],
            'background': 'none',
            'fret-marker': LeCorbusierQuickColor['black'],
            'small-fret-marker': LeCorbusierQuickColor['mediumGrey'],
            'nut': LeCorbusierQuickColor['ironGrey'],
            'string': LeCorbusierQuickColor['ivoryBlack'],
            'fret': LeCorbusierQuickColor['ivoryBlack'],
            'inlay': LeCorbusierQuickColor['skyOceanWaves'],
            'note-default': LeCorbusierQuickColor['ivoryWhite'],
            'title': LeCorbusierQuickColor['black']
        };
    }
}

class FretboardConfigDerived {
    recalc(fretboardCfg) {
        this.numStrings = fretboardCfg.stringIntervals.length;
        this.fretHeight = (this.numStrings - 1) * fretboardCfg.stringSpacing;
    }
    constructor(fretboardCfg) {
        this.numStrings = null;
        this.fretHeight = null;
        this.recalc(fretboardCfg);
    }
}

class FretboardSvgGroups {
    constructor(fretboardCfg) {
        this.notes = null;
        this.strings = null;
    }
}

class FretboardAnnotation {
    constructor () {
    }
}

class Fretboard {
    //
    // constants ala '#defines'
    //
    DEF = {
        //
        noteNames: [[
            'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
        ],[
            'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
        ]],

        //
        intervalNames: [
            //---------------
            "P1", //unison
            "m2", 
            "M2",
            "m3",
            "M3",
            "P4",
            "TT",
            "P5",
            "m6",
            "M6",
            "m7",
            "M7",
            //---------------
            "O",  // P1^
            "m9",  // m2^
            "M9",  // M2^
            "m10", // m3^
            "M10", // M3^
            "P11", // P4^
            "TT^", // TT^
            "P12", // P5^
            "m13", // m6^
            "M13", // M6^
            "m14", // m7^
            "M14", // M7^
            "O^" // P1^^
            //---------------
        ],
        //
        sharpGlyph:  '♯',
        flatGlyph:   '♭',
        sign:        ['♯', '♭'],
        //
        circleRadius: 18,
        maxFretRange: 17,
        minStringSize: 0.2
    };

    // return null for ok. otherwise return an error string 
    cfgCpy(dstCfg, srcCfg) {
        const protoCfg = new FretboardConfig();
        const protoCfgColor = protoCfg.color;

        //------
        // minimal quality check. make sure required attrs are in src
        for (const protoKey in protoCfg) {
            if (!protoCfg.hasOwnProperty(protoKey)) { continue; }
            //
            if (protoCfg[protoKey] === null) {
                if (!srcCfg.hasOwnProperty(protoKey)) {
                 return "cfgCpy: src cfg  missing required key: " + 
                     protoKey;
                }
            }
        }
        for (const protoKeyColor in protoCfgColor) {
            if (!protoCfgColor.hasOwnProperty(protoKeyColor)) { continue; }
            //
            if (protoCfgColor[protoKeyColor] === null) {
                if (!srcCfg.color.hasOwnProperty(protoKey)) {
                 return "cfgCpy: src cfg.color  missing required key: " + 
                     protoKeyColor;
                }
            }
        }

        // make sure src property is recognized as a property known by
        // FretboardConfig
        for (const srcKey in srcCfg) {
            if (!srcCfg.hasOwnProperty(srcKey)) { continue; }
            if (!protoCfg.hasOwnProperty(srcKey)) {
                return "cfgCpy: src configuration contains unknown key: " + 
                        srcKey;
            }
        }
        for (const srcKeyColor in srcCfg.color) {
            if (!srcCfg.color.hasOwnProperty(srcKeyColor)) { continue; }
            if (!protoCfgColor.hasOwnProperty(srcKeyColor)) {
                return "cfgCpy: src configuration contains unknown key: " + 
                        srcKeyColor;
            }
        }

        //------
        // Nominally ok
        // copy the props from srcCfg to dstCfg
        for (const srcKey in srcCfg) {
            if (!srcCfg.hasOwnProperty(srcKey)) { continue; }
            dstCfg[srcKey] = srcCfg[srcKey];
        }
        for (const srcKeyColor in srcCfg.color) {
            if (!srcCfg.color.hasOwnProperty(srcKeyColor)) { continue; }
            dstCfg.color[srcKeyColor] = srcCfg.color[srcKeyColor];
        }
    }

    constructor(opts) {
        this.opts = opts;
        this.svg = opts.svg;
        this.savefile = "fretboard_diagram.svg";
        this.bellAudio = new Audio('sounds/bell.wav');
        this.isIOS = false
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            this.isIOS = true;
        }

        this.svgGrp = new FretboardSvgGroups();
        this.cfg = new FretboardConfig();
        this.fretboardConfigurator = new FretboardConfigurator(this);
        this.fretboardColors = new FretboardColors(this);
        // holds eveything save-able / load-able besides the 
        // per (string,fret) note data

        // load startup cfg in
        var err = this.cfgCpy(this.cfg, FRETBOARD_CATALOG[opts.fretboardCfg]);
        this.cfg.title = ""; // remove the title - just for selector display 
        if (err != null) {
            console.log("%s",
                "Error loading inital cfg "+opts.fretboardCfg+": "+err);
        }
        /* console.log("LOADED CFG:\n-------\n%s", 
            JSON.stringify(this.cfg,null, "    ")); */
        this.cfgDerived = new FretboardConfigDerived(this.cfg);

        this.state = {
            selectedAnnotation: null,
            selected: null,
            visibility: 'transparent',
            startFret: 0,
            endFret: 16,
            enharmonic: 0,
            intervalRoot: null
        };


        // Set end fret according to viewport width
        this.state.endFret = Math.min(
            Math.floor(
              (window.innerWidth - 2 * this.cfg.offsetX ) / this.cfg.fretWidth
            ), 
          16
        );
        opts.endFret.value = this.state.endFret;

        this.computeDependents();

        // attribute data for each fret/string postion pair on the 
        // fretboard
        this.data = {};
        this.draw();
        // pre fill customizer panel with current config 
        this.fretboardConfigurator.readRequest();
    }

    inlineCSS(svg) {
        const svgElements = document.querySelectorAll("#fretboard *");
        var deep = true;
        const clonedSVG = svg.cloneNode(deep);
        const clonedElements = clonedSVG.querySelectorAll("*");
        for (let i = 0; i < svgElements.length; i++) {
            const computedStyle = getComputedStyle(svgElements[i]);
            // remove invisible elements to reduce file size
            const opacity = computedStyle.getPropertyValue('opacity');
            if (opacity === '0') {
                clonedElements[i].remove();
                continue;
            }
            const styles = { opacity: opacity }
            for (let attr of PROPERTIES) {
                let value = computedStyle.getPropertyValue(attr);
                if (value) {
                    styles[attr] = value;
                }
            }
            this.setAttributes(clonedElements[i], {
                'styles': styles,
            });
        }
        return clonedSVG;
    }

    setAttributes(elem, attrs) {
        for (var idx in attrs) {
            if (
                (idx === 'styles' || idx === 'style') && 
                typeof attrs[idx] === 'object'
            ) {
                const styles = [];
                for (var prop in attrs[idx]) { 
                    styles.push(`${prop}: ${attrs[idx][prop]};`); 
                }
                elem.setAttribute('style', styles.join(' '));
            } else if (idx === 'html') {
                elem.innerHTML = attrs[idx];
            } else {
                elem.setAttribute(idx, attrs[idx]);
            }
        }
    }
    generateClassValue(elem, classes) {
        var classValues = elem.className.baseVal.split(" ");
        if ('type' in classes) {
            classValues[0] = classes.type;
        }
        if ('color' in classes) {
            classValues[1] = classes.color;
        }
        if ('shape' in classes) {
            classValues[2] = classes.shape;
        }
        // NOTE! this has to stay last in classValues for 
        // toggleVisibility() to work correctly
        if ('visibility' in classes) {
            classValues[3] = classes.visibility;
        }
        return classValues.join(' ');
    }
    createSvgElement(tag, attributes = null) {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
        if (typeof attributes === 'object') {
            this.setAttributes(elem, attributes);
        }
        return elem;
    }

    savefileName(newname, ext) {
        if (newname === null) {
            return this.savefile;
        }
        newname = newname.replace('*', '');
        newname = newname.replace('.svg', '');
        this.savefile = newname;
        return this.savefile;
    }

    saveBlob(blobData, blobType, filename) {
        //
        if (!filename) {
            this.bell();
            return;
        }
        const blob = new Blob([blobData], { type: blobType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.id='download-link';
        // Click handler releases the object URL after the elem has been clicked
        // This is required for one-off downloads of the blob content
        const clickHandler = () => {
            setTimeout(() => {
              URL.revokeObjectURL(url);
              removeEventListener('click', clickHandler);
            }, 150);
        };
        // Add the click event listener on the anchor element
        // and do the click to kickoff download
        a.addEventListener('click', clickHandler, false);
        a.click();
    }

    loadJsonCfg(jsonData) {
        const obj = JSON.parse(jsonData);
        this.cfg = obj.cfg;
        this.cfgDerived.recalc(this.cfg);
        this.reset();
        this.erase();
        this.data = {};
        this.draw();
    }

    showTitle() {
        if (this.cfg.title === "") {
            this.cfg.title = "*Title*";
        }
        this.titleDoubleClickHandler(null);
    }

    showColors(elem) {
        const main = document.getElementById('fbcolors-main');
        const sc = document.getElementById('show-colors');
        if (main.style.display === 'none') {
            main.style.display = 'block';
            sc.style.background=LeCorbusierQuickColor['sandyOrange'];
        } else {
            sc.style.background='';
            main.style.display = 'none';
        }
        return;
    }

    showConfigurator(elem) {
        const main = document.getElementById('fbcfg-main');
        const sc = document.getElementById('show-configurator');
        if (main.style.display === 'none') {
            main.style.display = 'block';
            sc.style.background=LeCorbusierQuickColor['skyOceanWaves'];
        } else {
            sc.style.background='';
            main.style.display = 'none';
        }
        return;
    }

    readJson(elem) {
        var files = elem.files
        for (let i = 0; i < files.length; i++) {
            var file = files[i];
            var reader = new FileReader();

            // callback functions
            // use closure wrapper to have access to 'this'
            reader.onload = (function(fbHandle){
                return function(e) {
                    var result = e.target.result;
                    const readObj = JSON.parse(result);
                    const mergeCfg = new FretboardConfig(); 

                    var err = fbHandle.cfgCpy(mergeCfg, readObj.cfg);
                    if (err != null) {
                        console.log("%s",
                            "Error loading new cfg " + "xx" + ": "+err);
                    } else {
                        fbHandle.cfg = mergeCfg;
                        fbHandle.cfgDerived.recalc(fbHandle.cfg);
                    }

                    fbHandle.cfg = mergeCfg;
                    fbHandle.cfgDerived.recalc(fbHandle.cfg);
                    fbHandle.reset();
                    fbHandle.erase();
                    fbHandle.data = readObj.data;
                    fbHandle.draw();
                    // fill customize panel with new diagram details
                    fbHandle.fretboardConfigurator.readRequest();
                };
            })(this);

            reader.onerror = function(stuff) {
              console.log("error", stuff);
              console.log (stuff.getMessage());
            }
            // initiate the read
            reader.readAsText(file) //readAsdataURL
        }
        elem.value = '';
    }

    saveJson(filename) {
        const objToSave = this;
        // slice out only the attrs we want to export
        const slice = {
            cfg: objToSave.cfg,
            data: objToSave.data,
            state: objToSave.state,
        };
        const jsonData = JSON.stringify(slice, null, "  ");
        const jsonBlobType = "data:text/json;charset=utf-8";
        this.saveBlob(jsonData, jsonBlobType, filename);
    }

    saveFretboardPrompt() {
        var filename = this.filenameFromCfg();
        filename=prompt("Save this fretboard to:", filename);
        if (filename === null || filename === "") {
            return null;
        } else {
            filename += ".fbjson";
            this.saveJson(filename);
        }
    }

    filenameFromCfg() {
        var fname = "fretboard";
        if (this.cfg.title) {
            fname = this.cfg.title;
        }

        // remove any extension
        var v = fname.split('.');
        if (v.length > 1) {
            v.pop();
            fname = v.join('.');
        }
        // remove any section of the title that is within [] 
        fname = fname.replace(/(\[[^\]]*\])+/g, " ");
        // remove any section of the title that is within <> 
        fname = fname.replace(/(\([^\)]*\))+/g, " ");
        fname = fname.replace(/([\W])+/g, " "); // non word chars to space
        fname = fname.trim();
        fname = fname.replace(/\s+/g, "_"); // space  runs to underscore
        fname = fname.replace(/_$/, ""); // trim trailing _ if any 
        return fname;
    }

    //
    // Save the current fretboard as an svg file
    //
    exportSvgPrompt(svgToSave) {
        svgToSave.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        var text = null;
        var filename = this.filenameFromCfg();
        if (filename.length === 0) {
            filename="fretboard";
        }
        filename=prompt("Export SVG file to:", filename);
        if (filename === null || filename === "") {
                return null;
        } else {
            this.saveSvg(svgToSave, filename);
        }
    }

    saveSvg(svgToSave, filename) {
        this.clearSelection();
        const fn = this.savefileName(filename);
        const svgCopy = this.inlineCSS(svgToSave);
        var svgData = svgCopy.outerHTML;
        const dummy = document.createElement("div");

        // ------------------ 
        // svg recognizes only 5 html entities: 
        //   &amp;, &quot;, &apos;, &lt;, and &gt; 
        // filter out the rest
        //
        var svgData = 
        svgData.replace(/(&(?!(amp|gt|lt|quot|apos))[^;]+;)/g, a => {
            dummy.innerHTML = a;
            return dummy.textContent;
        });
        // ------------------ 

        this.saveBlob(svgData,
	"image/svg+xml;charset=utf-8", fn); dummy.remove();
    }

    bell() {
        this.bellAudio.play();
    }

    computeDependents() {
        this.state.numFrets = this.state.endFret - this.state.startFret;
        this.state.fretboardWidth = this.cfg.fretWidth * this.state.numFrets;
    }

    intervalizeNote (event) {
        if (!this.state.selected) {
            this.bell();
            return;
        }
        this.state.intervalRoot = this.state.selected;
        const rootid = this.state.intervalRoot.id;
        this.erase();
        this.draw();
        return; 
    }

    toggleEnharmonic() {
        this.state.intervalRoot = null;
        const untoggledEnharmonic = this.state.enharmonic;
        this.state.enharmonic = (untoggledEnharmonic + 1) % 2;
        this.erase();
        this.draw();
        return this.DEF.sign[untoggledEnharmonic];
    }

    setFretWindow(fretWindow) {
        const start = fretWindow!=null && 
               'start' in fretWindow ? fretWindow.start : this.state.startFret;
        const end = fretWindow!=null && 
                'end' in fretWindow ? fretWindow.end : this.state.endFret;
        this.erase();
        if (start < 0 || start > 22 || end < 1 || end > 22) {
            this.drawError("Invalid fret value(s)!");
            return;
        }
        if (end <= start) {
            this.drawError("End fret must not be smaller than start fret!");
            this.state.startFret = start;
            this.state.endFret = end;
            return;
        }
        if (end - start > this.DEF.maxFretRange) {
            this.drawError(
                "Maximal number of displayable frets is " +
                this.DEF.maxFretRange +
                ", <br/> e.g., 1st to " + this.DEF.maxFretRange +
                "th or 4th to " +
                (this.DEF.maxFretRange + 3) +
                "th!"
            );
            this.state.startFret = start;
            this.state.endFret = end;
            return;
        }

        this.state.startFret = start;
        this.state.endFret = end;

        this.computeDependents();
        this.draw();
    }

    drawError(message) {
        const text = this.createSvgElement('text', {
            x: 400,
            y: 140,
            class: 'error',
        });
        text.textContent = message;
        this.svg.appendChild(text);
        this.setAttributes(this.svg, {
            width: 800,
        });
    }

    drawAppBackground() {
        var b = document.getElementById('app-body');
        var c = this.cfg.color['app-background']; 
        b.style['background-color'] = c;
    }
    drawBackground() {
        var fb = document.getElementById('fretboard');
        var c = this.cfg.color['background']; 
        /*fb.style['background-color'] = c; */
        fb.style = 'background-color: ' + c + ';';
    }

    draw() {
        this.drawAppBackground();
        this.drawBackground();
        this.drawTitle();
        this.drawFrets();
        this.drawMarkers();
        this.drawStrings();
        this.drawNotes();
        this.addEditableDiv();

        // adjust diagram width to number of selected frets
        this.setAttributes(this.svg, {
            width: this.state.fretboardWidth + 2 * this.cfg.offsetX,
        })
        // adjust diagram height to number of strings , etc..
        this.setAttributes(this.svg, {
            height:  
                this.cfgDerived.fretHeight +
                this.cfg.stringSpacing*0.5 + // space for marker area 
                (2 * this.cfg.offsetY),
        })

        this.svg.addEventListener('click', () => {
            if (this.state.selected) {
                this.clearSelection();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!this.state.selected || !event.code) {
                return;
            }
            const selected = this.state.selected;

            if ((event.key != 'Shift') && (event.shiftKey)) {
                var i=-1;
                switch (event.code) {
                    case "Digit1": i=0; break;
                    case "Digit2": i=1; break;
                    case "Digit3": i=2; break;
                    case "Digit4": i=3; break;
                    case "Digit5": i=4; break;
                    case "Digit6": i=5; break;
                    case "Digit7": i=6; break;
                    case "Digit8": i=7; break;
                    case "Digit9": i=8; break;
                }
                const cc = this.getCustomColorByIndex(i);
                if (cc === null) {
                    this.bell();
                } else {
                    this.updateNote(selected, { color: cc });
                }
                return;
            }

            switch (event.code) {
                case 'Backspace':
                case 'Delete':
                    this.deleteNote()
                    break;
                case 'KeyI':
                    this.intervalizeNote();
                    break;
                case 'KeyF':
                    this.highlightNote(selected, true);
                    break;

                case 'KeyY':
                    this.updateNote(selected, 
                        { color: LeCorbusierQuickColor.yellow });
                    break;
                case 'KeyB':
                    this.updateNote(selected, 
                        { color: LeCorbusierQuickColor.blue });
                    break;
                case 'KeyK':
                    this.updateNote(selected, 
                        { color: LeCorbusierQuickColor.black });
                    break;
                case 'KeyG':
                    this.updateNote(selected, 
                        { color: LeCorbusierQuickColor.green });
                    break;
                case "KeyW":
                    this.updateNote(selected,
                        { color: LeCorbusierQuickColor.ivoryWhite });
                    break;
                case "KeyR":
                    this.updateNote(selected, 
                        { color: LeCorbusierQuickColor.red });
                    break;
                //
                case "KeyX":
                    this.deleteNote();
                    break;

                // finger 1-4 shapes
                case "Digit1":
                    this.updateNote(selected, { shape: "circle" });
                    break;
                case "Digit2":
                    this.updateNote(selected, { shape: "diamond" });
                    break;
                case "Digit3":
                    this.updateNote(selected, { shape: "triangle" });
                    break;
                case "Digit4":
                    this.updateNote(selected, { shape: "square" });
                    break;
            }

        })
    }

    deleteNote() {
        // reset text
        const selected = this.state.selected;
        if (selected) {
            const text = this.noteText(selected);
            if (text) {
                text.textContent = text.getAttribute('data-note');
            }
            this.updateNote(selected, { 
                color: this.cfg.color['note-default'],
                shape: "circle", 
                visibility: this.state.visibility, 
            });
        }
        this.state.selected = null;
    }

    getContrastColor50(hexcolor){
        hexcolor = hexcolor.replace('#', '');
        const i =  parseInt(hexcolor, 16);
        return (i > 0xffffff/2) ? 
            '#000000':
            '#ffffff';
    }

    getCustomColorByIndex(indexNumber) {
        const colorButtons = document.querySelectorAll("button.color");
        if ((indexNumber < 0) || colorButtons.length <= indexNumber) {
            return null;
        }
        const cc = colorButtons[indexNumber].getAttribute('title');
        if (!cc) {
            return null;
        }
        return cc;
    }

    updateColorButtonValue(event) {
        // get the target element and change the title
        // and background-xxxx style
        const elem = event.target;
        if (event.detail.color === '') {
            return;
        }
        const c = event.detail.color.toHexString();
        elem.title = c;
        elem.style = 'background-color: ' + c + ';';
    }

    updateColorFromButton(event, spObj) {
        const elem = event.target;
        if (event.shiftKey) {
            // shift click means allow the spectrum color picker 
            // to pop up to update the color for the button
            return;
        } else {
            // regular click use it to update the currently selected 
            // position dot - hide the color picker before it has a chance to
            // pop up ( if it exists - we dont use it on IOS )
            // as this event hijacking does not work there..
            if (spObj != null) {
                spObj.hide();
            }
        }

        if (!this.state.selected) {
            this.bell();
        } else {
            var c = event.currentTarget.getAttribute("title");
            if (c === null) {
                c = event.currentTarget.getAttribute("data-color");
            }
            this.updateNote(this.state.selected, {
                color: c
            });
        }
    }

    updateColor(event, picker=null) {
        if (event.detail.color === '') {
            return;
        }
        const c = event.detail.color.toHexString();
        if (!this.state.selected) {
            this.bell();
        } else {
            this.updateNote(this.state.selected, { 
                color: c
            });
        }
    }


    updateShape(event) {
        if (this.state.selected) {
            this.updateNote(this.state.selected, { 
                shape: event.currentTarget.getAttribute("title") 
            });
        }
    }

    drawFrets() {
        var pathSegments = 
            ["M " + this.cfg.offsetX + " " + this.cfg.offsetY];

        for (let i = this.state.startFret; i < (this.state.endFret + 1); i++) {

            let factor = (i - this.state.startFret) % 2 == 0 ? 1 : -1;
            pathSegments.push("v " + (factor) * this.cfgDerived.fretHeight);
            pathSegments.push("m " + this.cfg.fretWidth + " " + 0);

            if (i === 0) {
                // nut
                const nutpath = pathSegments.join(" ");
                const nut = this.createSvgElement('path', {
                    'class': 'fretboard-nut',
                    'stroke': this.cfg.color['nut'],
                    'd': nutpath,
                });
                this.svg.appendChild(nut);

                // reset path for the rest of the frets
                pathSegments = 
                    ["M " + 
                    (this.cfg.offsetX+this.cfg.fretWidth) + " " + 
                    (this.cfg.offsetY+this.cfgDerived.fretHeight)];
            }
        }

        const path = pathSegments.join(" ");
        const frets = this.createSvgElement('path', {
            'class': 'frets',
            'stroke': this.cfg.color['fret'],
            'd': path,
        });
        this.svg.appendChild(frets);
    }

    drawMarkers() {
        const markers = this.createSvgElement('g', {
            class: 'markers'
        });
        if (this.cfg.markerStyles.includes('fret-number')) {
            this.drawFretNumberMarkers(markers);
        }
        if (this.cfg.markerStyles.includes('linear-inlay')) {
            this.drawLinearInlayMarkers(markers);
        }
    }

    drawTitle() {
        const xdiv = this.cfg.showOpenStrings ? 2 : 1;
        const x = this.cfg.offsetX/xdiv-5;
        const y = 12;
        const g = this.createSvgElement('g', {
            class: 'annotation',
            id: 'fretboard-title',
            transform: "translate(" + x + "," + y + ")",
            'data-x': x,
            'data-y': y,
        });
        const annotation = this.createSvgElement('text', {
            fill: this.cfg.color['title'],
            stroke: this.cfg.color['title']
        });
        annotation.textContent = this.cfg.title;
        g.addEventListener("dblclick", 
            (event) => this.titleDoubleClickHandler(event));
        g.appendChild(annotation);
        this.svg.appendChild(g);
    }

    drawLinearInlayMarkers(markers) {
        const inlayOffsetX = -7; // offset from fret
        const inlayOffsetY = 8; // offset from fret
        var px = this.cfg.offsetX + inlayOffsetX;
        var py = this.cfg.offsetY + inlayOffsetY;
        const filteredMarkers = this.cfg.markers
            .filter(i => i > this.state.startFret && i <= this.state.endFret);
        for (let i = this.state.startFret; i < (this.state.endFret + 1); i++) {
            if (filteredMarkers.includes(i)) {
                var pathSegments = ["M " + px + " " + py];
                const v = this.cfgDerived.fretHeight-(inlayOffsetY*2);
                pathSegments.push("v " + v);
                const path = pathSegments.join(" ");
                const marker = this.createSvgElement('path', {
                    class: 'linear-inlay-marker',
                    stroke: this.cfg.color['inlay'],
                    d: path,
                });
                markers.appendChild(marker);
            }
            px += this.cfg.fretWidth;
        }
        this.svg.appendChild(markers);
    }

    drawFretNumberMarkers(markers) {
        const filteredMarkers = this.cfg.markers
            .filter(i => i > this.state.startFret && i <= this.state.endFret);

        for (let i=this.state.startFret+1; i < (this.state.endFret + 1); i++) {
            var class_i;
            var y_adjust_i;
            if (filteredMarkers.includes(i)) {
                class_i = 'fret-marker';
                y_adjust_i = this.cfg.stringSpacing;
            } else {
                class_i = 'small-fret-marker';
                y_adjust_i = this.cfg.stringSpacing*.75;
            }

            const marker = this.createSvgElement('text', {
                class: class_i,
                fill: this.cfg.color[class_i],
                x: this.cfg.offsetX + 
                    (i - 1 - this.state.startFret) * 
                    this.cfg.fretWidth + (this.cfg.fretWidth /** / 2 **/),
                y: this.cfg.offsetY + this.cfgDerived.fretHeight + 
                    y_adjust_i,
            });

            // tapping instruments 0 or X fret feature support
            marker.textContent = i + this.cfg.markerOffset; 
            markers.appendChild(marker);
        }
        this.svg.appendChild(markers);
    }

    drawStrings() {
        var sw = this.DEF.minStringSize * 2;
        this.svgGrp.strings = this.createSvgElement('g', {
            'class': 'strings',
        })
        this.svg.appendChild(this.svgGrp.strings);
        for (let i = 0; i < this.cfgDerived.numStrings; i++) {
            let path = "M " + 
                this.cfg.offsetX + " " + 
                (this.cfg.offsetY + 
                i * this.cfg.stringSpacing) + 
                " h " + this.state.fretboardWidth;

            if (this.cfg.stringDisplayWidths != null) {
                sw = this.cfg.stringDisplayWidths[i];
                if (sw === undefined) {
                    sw = this.DEF.minStringSize * 2;
                }
            }

            const string = this.createSvgElement('path', {
                'class': 'string',
                'd': path,
                'stroke' : this.cfg.color['string'],
                'styles': {
                    'stroke-width': sw,
                }
            });
            this.svgGrp.strings.appendChild(string);
        }
    }

    createShape(shape) {
        const classname = 'noteshape';
        var shapeElem = null;
        if (shape === 'circle') {
            shapeElem = this.createSvgElement('circle', {
                'class': classname,
                'shape': shape,
                'r': this.DEF.circleRadius,
            });
        } else if (shape === 'diamond') {
            const ysz = this.DEF.circleRadius;
            const xsz = this.DEF.circleRadius;
            var x = -0;
            var y = ysz;
            var p = x+","+y;
            x+=xsz; y-=ysz;
                p = p+" "+x+","+y;
            x-=xsz; y-=ysz;
                p = p+" "+x+","+y;
            x-=xsz; y+=ysz;
                p = p+" "+x+","+y;

            shapeElem = this.createSvgElement('polygon', {
                'class': classname,
                'shape': shape,
                'points': p,

            });
        } else if (shape === 'triangle') {
            const ysz = this.DEF.circleRadius*1.2;
            const xsz = this.DEF.circleRadius*1.2;
            var x = -xsz;
            var y = ysz/2;
            var p = x+","+y;
            x+=xsz*2;
                p = p+" "+x+","+y;
            x-=xsz; y-=ysz*1.5
                p = p+" "+x+","+y;

            shapeElem = this.createSvgElement('polygon', {
                'class': classname,
                'shape': shape,
                'points': p,

            });
        } else if (shape === 'square') {
            const l=this.DEF.circleRadius*2-4
            shapeElem = this.createSvgElement('rect', {
                'class': classname,
                'shape': shape,
                'width': l,
                'height': l,
                'x': -l/2,
                'y': -l/2
            });
        }
        return shapeElem;
    }

    drawNote(noteId, x, y, noteName, isOpen) {
        if (isOpen && !this.cfg.showOpenStrings) {
            return;
        }
        const note = this.createSvgElement('g', {
            'id': noteId,
            'transform': "translate(" + x + "," + y + ")",
            'data-x': x,
            'data-y': y,
        });

        this.svgGrp.notes.appendChild(note);
        note.addEventListener("click", 
            (event) => this.noteClickHandler(event));
        note.addEventListener("dblclick", 
            (event) => this.noteDoubleClickHandler(event));
        const shape = this.createShape('circle');
        note.appendChild(shape);

        // compute name of note
        const text = this.createSvgElement('text', {
            'data-note': noteName,
        });
        text.textContent = noteName;
        note.appendChild(text);
        var update = (noteId in this.data) 
            ?  this.data[noteId] 
            : { 
                type: 'note', 
                color: this.cfg.color['note-default'],
                shape: 'circle', 
                visibility: this.state.visibility
              };
        this.updateNote(note, update);
        if (isOpen) {
            var shapes = note.getElementsByClassName('noteshape');
            this.setAttributes(shapes[0], {
                'stroke': 'none',
                'fill': 'none'
            });
        }
    }

    // Middle C will return 4
    computeOctave(fret, string) {
        var i = this.computeMidiNote(fret, string);
        i = Math.trunc(i/12)-1;
        return i;
    }

    computeNoteOctaveStrToMidi(nos) {
        var note = nos[0].toUpperCase();
        var sharpflatoffset = 0;
        if (nos.length > 2 && nos[1] === '#') {
            sharpflatoffset = 1;
        } else if (nos.length > 2 && nos[1] === 'b') {
            sharpflatoffset = -1;
        }

        var octave = parseInt(nos[nos.length-1]);
        var offsets = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

        var midicode = offsets[note];
        midicode += (octave+1)*12
        midicode += sharpflatoffset;

        return midicode;
    }
    ttt() {
        var test = [ "C4", "C#4", "Cb4"];
        for (let i = 0; i < test.length; i++) {
        console.log("%s --> %s", test[i], 
            this.computeNoteOctaveStrToMidi(test[i]));
        }
    }


    // Middle C will return 60
    computeMidiNote(fret, string, cfg=null) {
        if (cfg === null) {
            cfg = this.cfg;
        }
        const interval = cfg.stringIntervals[string] + fret + 1;
        return interval;
    }

    computeEnharmonicNoteName(fret, string, which=null) {
        if (which===null) {
            which = this.state.enharmonic;
        }
        const interval = this.cfg.stringIntervals[string] + fret + 1;
        var i = Math.abs(interval % 12);
        var s = this.DEF.noteNames[which][i];
        if (s.includes('#')) {
            s = s.replace('#', this.DEF.sharpGlyph);
        } else if (s.includes("b")) {
            s = s.replace('b', this.DEF.flatGlyph);
        }
        if (this.cfg.octaveNotes === true) {
            s += this.computeOctave(fret, string);
        }
        return s;
    }

    coordFromId(noteId) {
      var s = noteId.replace('-',' ')
      s = s.replace('o','-1').replace('f','').replace('s','');
      return s.split(' ').map(x => +x); // unary + converts x to int;
    }

    computeNoteName(noteId, fret, string) {
        if (this.state.intervalRoot != null) {
            if (noteId === this.state.intervalRoot.id) {
             return "*"+ 
                this.computeEnharmonicNoteName(fret, string) ;
            }

            const rc = this.coordFromId(this.state.intervalRoot.id);
            const nc = this.coordFromId(noteId); 
            // dc holds the relative x,y, from root
            const dc = new Array(nc[0]-rc[0], nc[1]-rc[1]);

            //const ni = this.cfg.stringIntervals[string] + fret + 1;
            const ni = this.cfg.stringIntervals[string];
            const ri = this.cfg.stringIntervals[string-dc[1]];

            var ic = new Array( 
                nc[0]-rc[0],
                ni-ri,
                /* */
            );

            const i = (
                // relative interval along string
                dc[0] + 
                // relative interval between strings
                (ni-ri)
            );

            if (i < 0 || i >= this.DEF.intervalNames.length) {
                return this.computeEnharmonicNoteName(fret, string);
            } else {
                if (this.DEF.intervalNames[i] === undefined)  {
                    return this.computeEnharmonicNoteName(fret, string);
                }
                return this.DEF.intervalNames[i];
            }


        } else {
            return this.computeEnharmonicNoteName(fret, string);
        }
    }

    drawNotes() {
        this.svgGrp.notes = this.createSvgElement('g', {
            'class': 'notes',
        })
        this.svg.appendChild(this.svgGrp.notes);

        // open notes (fret: -1)
        for (let j = 0; j < this.cfgDerived.numStrings; j++) {
            const noteId = `o-s${j}`;
            const x = this.cfg.offsetX / 2;
            const y = this.cfg.offsetY + this.cfg.stringSpacing * j;
            const noteName = this.computeNoteName(noteId, -1, j);
            this.drawNote(noteId, x, y, noteName, true);
        }
        // notes on fretboard
        for (let i = this.state.startFret; i < this.state.endFret; i++) {
            for (let j = 0; j < this.cfgDerived.numStrings; j++) {
                const noteId = `f${i}-s${j}`;
                const x = this.cfg.offsetX + 
                    (this.cfg.fretWidth / 2) + 
                    (this.cfg.fretWidth * (i - this.state.startFret));
                const y = this.cfg.offsetY + this.cfg.stringSpacing * j;
                const noteName = this.computeNoteName(noteId, i, j);
                this.drawNote(noteId, x, y, noteName, false);
            }
        }
    }

    noteClickHandler(event) {
        event.stopPropagation();
        const note = event.currentTarget;
        note.focus();
        if (this.state.selected) {
            this.updateNote(this.state.selected, {
                visibility: 'visible',
            });
        }
        this.updateNote(note, {
            visibility: 'selected',
        });
        this.state.selected = note;
        if (event.ctrlKey) {
            this.editSelectedLabel(note);
        }
    }

    titleDoubleClickHandler(event) {
        var annotation = null;
        if (event != null) {
            event.stopPropagation();
            annotation = event.currentTarget;
        } else {
            annotation = document.getElementById('fretboard-title');
        }
        this.clearSelection();
        this.state.selectedAnnotation = annotation;
        const xdiv = this.cfg.showOpenStrings ? 2 : 1;
        this.editSelectedLabel(this.state.selectedAnnotation, {
                x: this.cfg.offsetX/xdiv-5,
                y:  0,
                width: 700,
                height: 20
        });
    }

    noteDoubleClickHandler(event) {
        event.stopPropagation();
        const note = event.currentTarget;
        this.clearSelection();
        if (this.state.selected) {
            this.updateNote(this.state.selected, {
                visibility: 'visible',
            });
        }
        this.updateNote(note, {
            visibility: 'selected',
        });
        this.state.selected = note;
        this.editSelectedLabel(this.state.selected);
    }

    editSelectedLabel(selected, attrs=null) {
        //const selected = this.state.selected;
        const x = selected.getAttribute('data-x');
        const y = selected.getAttribute('data-y');
        const srcstyles = getComputedStyle(this.elemText(selected));
        const dststyles = {
            // color not fill or stroke for text color in the div
            'color': this.cfg.color['title'],
            'display': 'block',
            'font-size': srcstyles['font-size'],
            'font-family': srcstyles['font-family'],
            'text-align': srcstyles['text-align'],
        };

        if (attrs === null) {
            attrs = {
                class: 'visible',
                x: x - this.DEF.circleRadius,
                y: y - this.DEF.circleRadius / 2,
                height: 2 * this.DEF.circleRadius,
                width: 2 * this.DEF.circleRadius,
                styles: dststyles,
            };
        } else {
            attrs['styles'] = dststyles;
            attrs['class'] =  'visible';
        }

        this.setAttributes(this.editableText, attrs);
        this.setAttributes(this.editableText.childNodes[0], attrs);

        const selectedText = this.elemText(selected);
        // hide in-diagram text. we are about to show the edit field in it's
        // stead
        this.setAttributes(selectedText, {
            styles: {
                display: 'none',
            }
        });

        this.editableText.children[0].textContent = selectedText.textContent;
        this.editableText.children[0].focus();

        // select all text in editable div
        document.execCommand('selectAll', false, null);
    }

    selectedEditable() {
        if (this.state.selectedAnnotation) {
            return this.state.selectedAnnotation;
        }
        if (this.state.selected) {
            return this.state.selected;
        }
        return null;
    }
    stripNbsp(s) {
        return s.replace(/&nbsp;/g, "");
    }

    addEditableDiv() {
        this.editableText = this.createSvgElement('foreignObject', {
            class: 'hidden',
        });
        this.editableText.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        const div = document.createElement('div');
        div.setAttribute('contentEditable', 'true');
        div.setAttribute('id', 'editable-div')
        div.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (event.code === 'Enter') {
                event.target.blur();
            }
        });
        div.addEventListener('blur', (event) => {
            //if (!this.state.selected) { return; }
            const selected = this.selectedEditable();
            if (selected === null) {
                return;
            }
            var selectedText = this.elemText(selected);
            var newText = this.editableText.children[0].innerText;

            // seems chrome puts in nbsp's in input widgets
            // and then refuses to read them in exported svg data.
            newText = this.stripNbsp(newText);

            const cstr = selected.className.baseVal;
            const classlist = cstr.split(/\s+/);
            if (classlist.includes("annotation")) {
                newText = newText.trim();
                this.elemText(selected).textContent = newText;
                this.cfg.title = newText;
            } else {
                // don't allow empty labels
                if (newText.trim()) {
                    this.updateNote(selected, { noteText: newText, });
                }
            }

            this.editableText.children[0].textContent = '';
            this.setAttributes(selectedText, {
                styles: {
                    display: 'block',
                }
            });
            this.setAttributes(this.editableText, {
                styles: {
                    display: 'none',
                }
            });
        })
        this.editableText.appendChild(div);
        this.svg.appendChild(this.editableText);
    }

    noteShape(elem) {
        return elem.childNodes[0];
    }
    noteText(elem) {
        return elem.lastChild;
    }
    elemText(elem) {
        return elem.lastChild;
    }

    highlightNote(note, onOff) {
        this.updateNote(note, {
            visibility: onOff ? 'highlight' : 'visible'
        });
    }

    updateNote(elem, update) {
        if (!(elem.id in this.data)) {
            this.data[elem.id] = {};
        }

        if ('shape' in update) {
            // clear shape and reconstruct it
            const newshape = this.createShape(update.shape);
            const oldshape = this.noteShape(elem);
            const preserves = ['fill', 'stroke'];
            for (let i = 0; i < preserves.length; i++) {
                newshape.setAttribute(
                    preserves[i],
                    oldshape.getAttribute(preserves[i])
                );
            }
            elem.replaceChild(newshape, oldshape);
        }

        if ('color' in update) {
            var c = update.color
            const shape = this.noteShape(elem);
            const text = this.noteText(elem);
            // convert all colors to color hex values
            if ((c.length > 0) && (c.charAt(0) === '#')) {
            } else {
                c = colorToHex(c);
            }

            shape.setAttribute('fill', c);
            // change the text color to contrast with the shape color
            // use style attr here because css will override fill 
            // and stroke attr
            const tc = this.getContrastColor50(c);
            text.setAttribute('style', 'fill: '+tc);
            //text.setAttribute('stroke', tc);
        }


        const classValue = this.generateClassValue(elem, update);
        elem.setAttribute('class', classValue);

        if ('noteText' in update) {
            this.noteText(elem).textContent = update.noteText;
        }

        const noteData = this.data[elem.id];
        for (let [key, value] of Object.entries(update)) {
            noteData[key] = value;
        }
    }

    showOctaveNotes(show = null) {
        if (show === null) {
            // toggle and redraw notes;
            this.cfg.octaveNotes = this.cfg.octaveNotes ? false : true;
        } else {
            this.cfg.octaveNotes = show ? false : true;
        }
    }

    toggleVisibility() {
        this.state.visibility = this.state.visibility === 'hidden' ? 'transparent' : 'hidden';
        for (let note of this.svgGrp.notes.children) {
            if (note.className.baseVal.endsWith('visible') || note.className.baseVal.endsWith('selected')) {
                continue;
            }
            this.updateNote(note, {
                visibility: this.state.visibility,
            });
        }

        for (let [_key, value] of Object.entries(this.data)) {
            if (value['visibility'] === 'visible' || value['visibility'] === 'selected') {
                continue;
            }
            value['visibility'] = this.state.visibility;
        }
    }

    clearSelection() {
        if (this.state.selected) {
            this.updateNote(this.state.selected, {
                visibility: 'visible',
            });
            this.state.selected = null;
        }
        if (this.state.selectedAnnotation) {
            this.state.selectedAnnotation = null;
        }
    }

    erase() {
        this.clearSelection();
        this.svg.innerHTML = "";
    }

    reset() {
        this.state.intervalRoot = null;
        this.data = {};
        const c = this.cfg.color['note-default'];
        for (let note of this.svgGrp.notes.children) {
            // reset text
            const text = this.noteText(note);
            if (text) {
                text.textContent = text.getAttribute('data-note');
            }
            this.updateNote(note, { 
                type: "note", 
                color: c,
                shape: "circle", 
                visibility: this.state.visibility 
            });
            this.state.selected = null;
        }
    }

    stringSlice(stringNo, noteData) {
        var slice = new Object();
        for (const noteTag in noteData) {
            if (!noteData.hasOwnProperty(noteTag)) {
                continue;
            }
            const fs = this.dataKeyToFretAndStringNumber(noteTag);
            if (fs[1] === stringNo) {
                slice[noteTag] = noteData[noteTag]; 
            }
        }
        return slice;
    }

    dataKeyToFretAndStringNumber(dataKey) {
        var v = dataKey.split("-");
        var f;
        var s;
        var fnum = undefined;
        var snum = undefined;
        if (v.length === 2) {
            f = v[0];
            s = v[1];
            //fnum
            if (f.startsWith("o")) {
                // open string
                fnum =- -1;
            } else if (f.startsWith("f")) {
                fnum = parseInt(f.substring(1), 10);
            } else {
                fnum = undefined;
            }

            if (s.startsWith("s")) {
                // snum
                snum = parseInt(s.substring(1), 10);
            } else {
                snum = undefined;
            }
        }
        return new Array(fnum, snum);
    }

    findMidiNoteOnString(midiNote, stringNo, cfg, noteData) {
        var ss = this.stringSlice(stringNo, noteData);
        for (var k in ss) {
            var r = this.dataKeyToFretAndStringNumber(k);
            var midinote_tmp = this.computeMidiNote(r[0], r[1], cfg);
            if (midinote_tmp === midiNote) {
                return [k, ss[k]];
            }
        }
        return null;
    }


    changeConfiguration(event) {
        const k = event.target.value;
        // make a "default value" cfg
        // that way old cfgs with missing values get the default
        // values
        var protocfg = new FretboardConfig();
        // copy the current cfg

        var oldCfg = new FretboardConfig();
        var oldData = JSON.parse(JSON.stringify(this.data));
        this.cfgCpy(oldCfg, this.cfg);
        // delete all unactivated notes

        var err = this.cfgCpy(protocfg, FRETBOARD_CATALOG[k]);
        protocfg.title = ""; // remove the title - just for selector display 
        if (err != null) {
            console.log("%s",
                "Error loading new cfg " + k + ": "+err);
        } else {
            this.cfg = protocfg;
            this.cfgDerived.recalc(this.cfg);
        }

        this.reset();
        this.erase();
        this.cfg.title = oldCfg.title;


        var stray_notes = false;
        var stray_notes_txt = "";

        for (const fs_old in oldData) {
            var r_old;
            var f_old;
            var s_old;
            var midinote_old;
            var midinote_new;
            if (!oldData.hasOwnProperty(fs_old)) {
                continue;
            }
            if ((oldData[fs_old].visibility != 'visible') 
            &&  (oldData[fs_old].visibility != 'selected')) {
                continue;
            }


            if (oldData[fs_old].visibility === 'selected') {
                // if selected make it plain old visible since this 
                // is not live data anymore
                oldData[fs_old].visibility = 'visible';
            }

            r_old = this.dataKeyToFretAndStringNumber(fs_old);
            f_old  = r_old[0];
            s_old = r_old[1];
            midinote_old = this.computeMidiNote(f_old, s_old, oldCfg);
            //console.log("old %s --> %d", fs_old, midinote_old);

            midinote_new = this.computeMidiNote(f_old, s_old, this.cfg);
            //console.log("new %s --> %d", fs_old, midinote_new);

            var kd = null;
            if (midinote_old === midinote_new) {
                // note is still in same place in new cfg. leave it alone.
                console.log("note %d is still in the same place %s", midinote_old, fs_old);
                kd = [fs_old, oldData[fs_old]];
            } else {
                // note is is a different place on the new board
                // try to find a new place for it in the new board...

                // try on same string fyrst
                kd = this.findMidiNoteOnString(midinote_old, s_old, this.cfg, this.data);
                if (kd != null) {
                    //console.log("found %d at %s", midinote_old, kd[0]);  
                } 
                if (kd === null ) {
                    // check string above
                    kd = this.findMidiNoteOnString(midinote_old, s_old-1, this.cfg, this.data);
                    if (kd != null) {
                        //console.log("found %d at %s", midinote_old, kd[0]);  
                    } 
                }
                if (kd === null ) {
                    // check string below
                    kd = this.findMidiNoteOnString(midinote_old, s_old+1, this.cfg, this.data);
                    if (kd != null) {
                        //console.log("found %d at %s", midinote_old, kd[0]);  
                    } 
                }
                if (kd != null) {
                    kd[1] = oldData[fs_old];
                }
            }

            if (kd != null) {
                //console.log("INSERTED %s %s", kd[0], JSON.stringify(kd[1]));  
                this.data[kd[0]] = kd[1];
            } else {
                if (stray_notes === false) {
                    stray_notes_txt += "";
                } else {
                    stray_notes_txt += ", ";
                }
                stray_notes = true;
                stray_notes_txt += "string " + (s_old+1) + " fret "+ (f_old+1); 
            }

        }

        if (stray_notes) {
            window.alert (
                "locations on the fretboard could not be moved: \n" +
                stray_notes_txt
            );
        }

        this.draw();
        // fill customize panel with new diagram details
        this.fretboardConfigurator.readRequest();
    }
}

/* Main */

/* Initialize diagram */

const svg = document.getElementById('fretboard');
const endFret = document.getElementById('end-fret');

const fretboard = new Fretboard({
    svg: svg,
    endFret: endFret,
    fretboardCfg: 'guitar'
})

/* Button for toggeling unselected notes */

const togglebutton = document.getElementById('visibility');
togglebutton.addEventListener('click', (event) => {
    fretboard.toggleVisibility();
});

/* 
 * when visual attributes don't come out looking right when saving
 * check this. more properties may need to be added
 */
const PROPERTIES = [
    "fill", "stroke", "stroke-width", "text-anchor", "dominant-baseline",
    "stroke-linecap",
    "font-family", 'font-size', 'font-style'
]

/* Reset button */

const resetButton = document.getElementById('reset');
resetButton.addEventListener('click', (event) => {
    const doReset = window.confirm("Do you really want to reset your diagram?");
    if (doReset) {
        fretboard.reset();
    }
});

/* Fret window */

const startFret = document.getElementById('start-fret');
startFret.addEventListener('input', (event) => {
    fretboard.setFretWindow({ start: event.target.value - 1 });
});

endFret.addEventListener('input', (event) => {
    fretboard.setFretWindow({ end: parseInt(event.target.value) });
});

/* Shape selector */
const shapeButtons = document.querySelectorAll("button.shape");
for (let button of shapeButtons) {
    button.addEventListener('click', (event) => {
        fretboard.updateShape(event);
    });
}

/* 
 * Color selector 
 */
const colorButtons = document.querySelectorAll("button.color");
var colorSps = null;
if (!fretboard.isIOS) {
    colorSps = Spectrum.createMultiple(colorButtons, {
        type: 'color',
        showPaletteOnly: true,
        togglePaletteOnly: true,
        maxSelectionSize: 9,
        hideAfterPaletteSelect: true,
        showButtons: true,
        showAlpha: false,
        chooseText: "Done",
        togglePaletteMoreText: "more <click>, <esc> done",
        palette: LeCorbusierPalette,
    });
}

for (let i = 0; i < colorButtons.length; i++) {
    colorButtons[i].addEventListener('click', (event) => {
        fretboard.updateColorFromButton(event, 
            colorSps === null ? null : colorSps[i]);
    });
    // user is resetting the canned color to something custom
    colorButtons[i].addEventListener('move', (event) => {
        fretboard.updateColorButtonValue(event);
    });
}

/*
 * Intervalizer button
 */
const intervalizeNoteButton = document.getElementById("intervalize-note");
intervalizeNoteButton.addEventListener('click', (event) => {
    fretboard.intervalizeNote(event);
});

// For use on ios
// as it's problematic to build the color picker into 
// the quickcolor buttons on the platform
if (fretboard.isIOS) {
  const colorPicker = Spectrum.create('#color-picker',{
    type: 'color',
    showPaletteOnly: true,
    togglePaletteOnly: true,
    maxSelectionSize: 9,
    hideAfterPaletteSelect: true,
    showButtons: true,
    showAlpha: false,
    chooseText: "Done",
    togglePaletteMoreText: "more <click>, <esc> done",
    palette: fretboard.DEF.leCorbusierPalette,
  });
  const colorPickerElement = document.getElementById('color-picker');
  colorPickerElement.addEventListener('move', (event) => {
    fretboard.updateColor(event);
  });
  document.getElementById('color-picker').style.display = 'block';
}

/*
 *
 */
const deleteNoteButton = document.getElementById("delete-note");
deleteNoteButton.addEventListener('click', () => fretboard.deleteNote());

/*
 *
 */
const enharmonicToggle = document.getElementById("enharmonic");
enharmonicToggle.addEventListener('click', () => {
    const sign = fretboard.toggleEnharmonic();
    enharmonicToggle.textContent = sign;
});

/* 
 * fretboard type selection 
 */
const fretboardTypes = document.getElementById('fretboard-types');
for (const key in FRETBOARD_CATALOG) {
    if (FRETBOARD_CATALOG.hasOwnProperty(key)) {
        var opt = document.createElement('option');
        if (FRETBOARD_CATALOG[key].hasOwnProperty('title')) {
            opt.textContent = FRETBOARD_CATALOG[key].title;
        } else {
            opt.textContent = key.replaceAll('_', ' ');
        }
        opt.value = key;
        fretboardTypes.appendChild(opt);
    }
}

// init from construction opts
fretboardTypes.value = fretboard.opts.fretboardCfg;
fretboardTypes.addEventListener('change', (event) => {
    fretboard.changeConfiguration(event);
});
