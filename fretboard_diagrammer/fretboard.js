/*
 * fretboard.js -- A fretboard digramming gadget
 */

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
        this.offsetY =        30;
        this.fretWidth =      70;
        this.stringSpacing = 40;
        this.markerStyles = ['fret-number', 'linear-inlay'];
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
        leCorbusierQuickColor: {
            yellow: '#f2bb1d',
            blue: '#4d6aa8',
            green: '#406358',
            red: '#ac443a',
            white: '#ffffff',
            black: '#000000'
        },

        //
        leCorbusierPalette: [[
        "#000000","#eadbc0","#5e6061","#929494","#a7a8a5","#bcbbb6","#4d6aa8","#8fabc9","#abbdc8","#b6c6ce","#d9e1dd","#3e6e90","#679dae","#8ab5ba","#a8c4c1","#c6d5cc"
        ], [
        "#406e58","#91afa1","#becbb7","#3e6f42","#7fa25a","#abc17a","#c4d39b","#eacfa6","#d46c40","#dc8d67","#eacfb9","#9b3738","#e6cdbf","#8f3a43","#943a4d","#d6afa6"
        ], [
        "#8b4d3e","#cd9886","#dbbeaa","#68443c","#b67b66","#d8b29a","#e2cbb5","#4c423d","#b7a392","#5a5550","#928a7e","#b7ac9d","#ac443a","#eae4d7","#dba3af","#744438"
        ], [
        "#3a3b3b","#b8a136","#428f70","#81868b","#403c3a","#3957a5","#dbb07f","#74393b","#7aa7cb","#92969a","#ddbf99","#45423e","#c45e3a","#313d6b","#60646a","#f2bb1d"
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
        minStringSize: 0.2,
    };

    // return null for ok. otherwise return an error string 
    cfgCpy(dstCfg, srcCfg) {
        const protoCfg = new FretboardConfig();
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
        // make sure src property is recognized as a property known by
        // FretboardConfig
        for (const srcKey in srcCfg) {
            if (!srcCfg.hasOwnProperty(srcKey)) { continue; }
            if (!protoCfg.hasOwnProperty(srcKey)) {
                return "cfgCpy: src configuration contains unknown key: " + 
                        srcKey;
            }
        }
        //------
        // Nominally ok
        // copy the props from srcCfg to dstCfg
        for (const srcKey in srcCfg) {
            if (!srcCfg.hasOwnProperty(srcKey)) { continue; }
            dstCfg[srcKey] = srcCfg[srcKey];
            /*
            console.log("(%s) %s <<-- %s", 
                dstCfg[srcKey], srcKey, srcCfg[srcKey]);
            */
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
        // holds eveything save-able / load-able besides the 
        // per (string,fret) note data

        // load startup cfg in
        var err = this.cfgCpy(this.cfg, FRETBOARD_CATALOG[opts.fretboardCfg]);
        if (err != null) {
            console.log("%s",
                "Error loading inital cfg "+opts.fretboardCfg+": "+err);
        }
        /*
        console.log("LOADED CFG:\n-------\n%s", 
            JSON.stringify(this.cfg,null, "    "));
        */
        this.cfgDerived = new FretboardConfigDerived(this.cfg);

        this.state = {
            selected: null,
            visibility: 'transparent',
            startFret: 0,
            endFret: 16,
            enharmonic: 0,
            intervalRoot: null
        };


        // Set end fret according to viewport width
        this.state.endFret = Math.min(Math.floor((window.innerWidth - 2 * this.cfg.offsetX ) / this.cfg.fretWidth), 16);
        opts.endFret.value = this.state.endFret;

        this.computeDependents();

        this.data = {};
        this.draw();
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

    saveBlob(blobData, blobType, fileName) {
        //
        if (!fileName) {
            this.bell();
            return;
        }
        const blob = new Blob([blobData], { type: blobType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
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

    showConfigurator(elem) {
        if (elem.checked) {
            document.getElementById('fbc-main').style.display = 'block';
        } else {
            document.getElementById('fbc-main').style.display = 'none';
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
                    const obj = JSON.parse(result);
                    fbHandle.cfg = obj.cfg;
                    fbHandle.cfgDerived.recalc(fbHandle.cfg);
                    fbHandle.reset();
                    fbHandle.erase();
                    fbHandle.data = obj.data;
                    fbHandle.draw();
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
        var filename=prompt("Save this fretboard to:", "fretboard");
        if (filename === null || filename === "") {
            return null;
        } else {
            // trim off any extension
            var v = filename.split('.');
            if (v.length > 1) {
                v.pop()
                filename = v.join('.')
            }
            filename += ".fbjson";
            this.saveJson(filename);
        }
    }

    //
    // Save the current fretboard as an svg file
    //
    exportSvgPrompt(svgToSave) {
        var text = null;
        const filename=prompt("Export SVG file to:", "fretboard");
        if (filename === null || filename === "") {
                return null;
        } else {
            this.saveSvg(svgToSave, filename);
        }
    }
    saveSvg(svgToSave, filename) {
        // svcToSave -- fretboard svg diagram element to save
        this.clearSelection();
        const fn = this.savefileName(filename);
        const svgCopy = this.inlineCSS(svgToSave);
        var svgData = svgCopy.outerHTML;
        this.saveBlob(svgData, "image/svg+xml;charset=utf-8", fn);
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
        const start = 
           fretWindow!=null && 'start' in fretWindow ? fretWindow.start : this.state.startFret;
        const end = 
            fretWindow!=null && 'end' in fretWindow ? fretWindow.end : this.state.endFret;
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
        text.innerHTML = message;
        this.svg.appendChild(text);
        this.setAttributes(this.svg, {
            width: 800,
        });
    }

    draw() {
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
                this.cfg.stringSpacing + // space for marker area 
                (2 * this.cfg.offsetY),
        })

        this.svg.addEventListener('click', () => {
            if (this.state.selected) {
                this.updateNote(this.state.selected, {
                    visibility: 'visible',
                });
                this.state.selected = null;
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
                        { color: this.DEF.leCorbusierQuickColor.yellow });
                    break;
                case 'KeyB':
                    this.updateNote(selected, 
                        { color: this.DEF.leCorbusierQuickColor.blue });
                    break;
                case 'KeyK':
                    this.updateNote(selected, 
                        { color: this.DEF.leCorbusierQuickColor.black });
                    break;
                case 'KeyG':
                    this.updateNote(selected, 
                        { color: this.DEF.leCorbusierQuickColor.green });
                    break;
                case "KeyW":
                    this.updateNote(selected,
                        { color: this.DEF.leCorbusierQuickColor.white });
                    break;
                case "KeyR":
                    this.updateNote(selected, 
                        { color: this.DEF.leCorbusierQuickColor.red });
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
                text.innerHTML = text.getAttribute('data-note');
            }
            this.updateNote(selected, { 
                color: "white", shape: "circle", visibility: this.state.visibility, 
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
                    d: path,
                    /*
                    style:  "stroke: cadetblue; "+
                            "stroke-linecap: round; "+
                            "stroke-linejoin: round; "+
                            "stroke-width: 7;"
                    */
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
                x: this.cfg.offsetX + 
                    (i - 1 - this.state.startFret) * 
                    this.cfg.fretWidth + (this.cfg.fretWidth /** / 2 **/),
                y: this.cfg.offsetY + this.cfgDerived.fretHeight + 
                    y_adjust_i,
            });

            // tapping instruments 0 or X fret feature support
            marker.innerHTML = i + this.cfg.markerOffset; 
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
        text.innerHTML = noteName;
        note.appendChild(text);
        var update = (noteId in this.data) 
            ?  this.data[noteId] 
            : { 
                type: 'note', 
                color: '#FFFFFF', 
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
    computeMidiNote(fret, string) {
        const interval = this.cfg.stringIntervals[string] + fret + 1;
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
                const x = this.cfg.offsetX + (this.cfg.fretWidth / 2) + this.cfg.fretWidth * (i - this.state.startFret);
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
            this.editSelectedLabel();
        }
    }

    noteDoubleClickHandler(event) {
        event.stopPropagation();
        const note = event.currentTarget;
        if (this.state.selected) {
            this.updateNote(this.state.selected, {
                visibility: 'visible',
            });
        }
        this.updateNote(note, {
            visibility: 'selected',
        });
        this.state.selected = note;
        this.editSelectedLabel();
    }

    editSelectedLabel() {
        const selected = this.state.selected;
        const x = selected.getAttribute('data-x');
        const y = selected.getAttribute('data-y');
        this.setAttributes(this.editableText, {
            x: x - this.DEF.circleRadius,
            y: y - this.DEF.circleRadius + 4,
            height: 2 * this.DEF.circleRadius,
            width: 2 * this.DEF.circleRadius,
            class: 'visible',
            styles: {
                display: 'block',
            }
        });

        const selectedText = this.noteText(this.state.selected);
        this.setAttributes(selectedText, {
            styles: {
                display: 'none',
            }
        });

        this.editableText.children[0].innerHTML = selectedText.innerHTML;
        this.editableText.children[0].focus();
        // select all text in editable div
        document.execCommand('selectAll', false, null);
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
            if (!this.state.selected) {
                return;
            }
            const selectedText = this.noteText(this.state.selected);

            var newText = this.editableText.children[0].innerText;
            // don't allow empty labels
            if (newText.trim()) {
                this.updateNote(this.state.selected, {
                    noteText: newText,
                });
            }

            this.editableText.children[0].innerHTML = '';
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
            const c = update.color
            const shape = this.noteShape(elem);
            const text = this.noteText(elem);
            if ((c.length > 0) && (c.charAt(0) === '#')) {
                //delete update.color;
                // literal hex color instead of classified color 
                shape.setAttribute('fill', c);
                // change the text color to contrast with the shape color
                // use style attr here because css will override fill 
                // and stroke attr
                const tc = this.getContrastColor50(c);
                text.setAttribute('style', 'fill: '+tc);
                //text.setAttribute('stroke', tc);

            } else {
                // clear any literal value s
                if (shape.hasAttribute('fill')) {
                    shape.removeAttribute('fill');
                }
                text.style.fill = null;
                text.style.stroke = null;
            }
        }


        const classValue = this.generateClassValue(elem, update);
        elem.setAttribute('class', classValue);

        if ('noteText' in update) {
            this.noteText(elem).innerHTML = update.noteText;
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
    }

    erase() {
        this.clearSelection();
        this.svg.innerHTML = "";
    }

    reset() {
        this.state.intervalRoot = null;
        this.data = {};
        for (let note of this.svgGrp.notes.children) {
            // reset text
            const text = this.noteText(note);
            if (text) {
                text.innerHTML = text.getAttribute('data-note');
            }
            this.updateNote(note,
                { type: "note", color: "white", shape: "circle", visibility: this.state.visibility });
            this.state.selected = null;
        }
    }

    changeConfiguration(event) {
        const k = event.target.value;
        // make a "default value" cfg
        // that way old cfgs with missing values get the default
        // values
        var protocfg = new FretboardConfig();
        var err = this.cfgCpy(protocfg, FRETBOARD_CATALOG[k]);
        if (err != null) {
            console.log("%s",
                "Error loading new cfg " + k + ": "+err);
        } else {
            /*
            console.log("LOADED CFG:\n-------\n%s", 
                JSON.stringify(this.cfg,null, "    "));
            */
            this.cfg = protocfg;
            this.cfgDerived.recalc(this.cfg);
        }
        this.reset();
        this.erase();
        this.draw();
    }
}

/* Main */

/* Initialize diagram */

const svg = document.getElementById('fretboard');
const endFret = document.getElementById('end-fret');

const fretboard = new Fretboard({
    svg: svg,
    endFret: endFret,
    fretboardCfg: 'tapping_12_str_matched_reciprocal'
})
const fretboardConfigurator = new FretboardConfigurator(fretboard);

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

function xxinlineCSS(svg) {
    const svgElements = document.querySelectorAll("#fretboard *");
    const clonedSVG = svg.cloneNode(deep = true);
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
        hideAfterPalletteSelect: true,
        showButtons: true,
        showAlpha: false,
        chooseText: "Done",
        togglePaletteMoreText: "more <click>, <esc> done",
        palette: fretboard.DEF.leCorbusierPalette,
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
    hideAfterPalletteSelect: true,
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
    enharmonicToggle.innerHTML = sign;
});

/* 
 * fretboard type selection 
 */
const fretboardTypes = document.getElementById('fretboard-types');
for (const key in FRETBOARD_CATALOG) {
    if (FRETBOARD_CATALOG.hasOwnProperty(key)) {
        var opt = document.createElement('option');
        if (FRETBOARD_CATALOG[key].hasOwnProperty('title')) {
            opt.innerHTML = FRETBOARD_CATALOG[key].title;
        } else {
            opt.innerHTML = key.replaceAll('_', ' ');
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
