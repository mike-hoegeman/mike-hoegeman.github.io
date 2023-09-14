/*
 * fretboard.js -- A fretboard digramming gadget
 */
function setAttributes(elem, attrs) {
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

function generateClassValue(elem, classes) {
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

function createSvgElement(tag, attributes = null) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (typeof attributes === 'object') {
        setAttributes(elem, attributes);
    }
    return elem;
}

class Fretboard {
    mergeStaticConsts() {
        const c = this.consts;
        c.numStrings = this.consts.stringIntervals.length;
        c.fretHeight = (this.consts.numStrings - 1) * this.consts.stringSpacing;
        c.sharpGlyph = '♯';
        c.flatGlyph = '♭';
        c.circleRadius = 18;
        c.sign = ['♯', '♭'];
        c.maxFretRange = 17;
        c.leCorbusier = {
            blue: '#4d6aa8',
            green: '#406358',
            red: '#ac443a',
            white: '#ffffff',
            black: '#000000'
        };
        c.intervalNames = new Array(
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
        );
        c.markerStyles = ['fret-number', 'linear-inlay'];
    }

    constructor(opts) {
        this.svg = opts.svg;
        this.opts = opts;
        this.savefile = "fretboard_diagram.svg";

        this.bellAudio = new Audio(
            'sounds/bell.wav'
        );
        this.consts = FRETBOARD_CONSTS[opts.fretboardCfg];
        this.mergeStaticConsts();

        this.state = {
            selected: null,
            visibility: 'transparent',
            startFret: 0,
            endFret: 16,
            enharmonic: 0,
            intervalRoot: null
        };


        // Set end fret according to viewport width
        this.state.endFret = Math.min(Math.floor((window.innerWidth - 2 * this.consts.offsetX ) / this.consts.fretWidth), 16);
        opts.endFret.value = this.state.endFret;

        this.computeDependents();

        this.data = {};
        this.draw();
    }

    savefileName(newname) {
        if (newname === null) {
            return this.savefile;
        }
        newname = newname.replace('*', '');
        newname = newname.replace('.svg', '');
        this.savefile = newname;
        return this.savefile;
    }

    bell() {
        this.bellAudio.play();
    }

    computeDependents() {
        this.state.numFrets = this.state.endFret - this.state.startFret;
        this.state.fretboardWidth = this.consts.fretWidth * this.state.numFrets;
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
        return this.consts.sign[untoggledEnharmonic];
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
        if (end - start > this.consts.maxFretRange) {
            this.drawError(
                "Maximal number of displayable frets is " +
                this.consts.maxFretRange +
                ", <br/> e.g., 1st to " + this.consts.maxFretRange +
                "th or 4th to " +
                (this.consts.maxFretRange + 3) +
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
        const text = createSvgElement('text', {
            x: 400,
            y: 140,
            class: 'error',
        });
        text.innerHTML = message;
        this.svg.appendChild(text);
        setAttributes(this.svg, {
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
        setAttributes(this.svg, {
            width: this.state.fretboardWidth + 2 * this.consts.offsetX,
        })
        // adjust diagram height to number of strings , etc..
        setAttributes(this.svg, {
            height:  
                this.consts.fretHeight +
                this.consts.stringSpacing + // space for marker area 
                (2 * this.consts.offsetY),
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
                case 'KeyB':
                    this.updateNote(selected, 
                        { color: this.consts.leCorbusier.blue });
                    break;
                case 'KeyK':
                    this.updateNote(selected, 
                        { color: this.consts.leCorbusier.black });
                    break;
                case 'KeyG':
                    this.updateNote(selected, 
                        { color: this.consts.leCorbusier.green });
                    break;
                case "KeyW":
                    this.updateNote(selected,
                        { color: this.consts.leCorbusier.white });
                    break;
                case "KeyR":
                    this.updateNote(selected, 
                        { color: this.consts.leCorbusier.red });
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
            // to pup up to update the color for the button
            return;
        } else {
            // regular click use it to update the currently selected 
            // position dot - hide the color picker before it has a chance to
            // pop up
            spObj.hide();
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
            ["M " + this.consts.offsetX + " " + this.consts.offsetY];

        for (let i = this.state.startFret; i < (this.state.endFret + 1); i++) {

            let factor = (i - this.state.startFret) % 2 == 0 ? 1 : -1;
            pathSegments.push("v " + (factor) * this.consts.fretHeight);
            pathSegments.push("m " + this.consts.fretWidth + " " + 0);

            if (i === 0) {
                // nut
                const nutpath = pathSegments.join(" ");
                const nut = createSvgElement('path', {
                    'class': 'fretboard-nut',
                    'd': nutpath,
                });
                this.svg.appendChild(nut);

                // reset path for the rest of the frets
                pathSegments = 
                    ["M " + 
                    (this.consts.offsetX+this.consts.fretWidth) + " " + 
                    (this.consts.offsetY+this.consts.fretHeight)];
            }
        }

        const path = pathSegments.join(" ");
        const frets = createSvgElement('path', {
            'class': 'frets',
            'd': path,
        });
        this.svg.appendChild(frets);
    }

    drawMarkers() {
        const markers = createSvgElement('g', {
            class: 'markers'
        });
        if (this.consts.markerStyles.includes('fret-number')) {
            this.drawFretNumberMarkers(markers);
        }
        if (this.consts.markerStyles.includes('linear-inlay')) {
            this.drawLinearInlayMarkers(markers);
        }
    }

    drawLinearInlayMarkers(markers) {
        const inlayOffsetX = -7; // offset from fret
        const inlayOffsetY = 8; // offset from fret
        var px = this.consts.offsetX + inlayOffsetX;
        var py = this.consts.offsetY + inlayOffsetY;
        const filteredMarkers = this.consts.markers
            .filter(i => i > this.state.startFret && i <= this.state.endFret);
        for (let i = this.state.startFret; i < (this.state.endFret + 1); i++) {
            if (filteredMarkers.includes(i)) {
                var pathSegments = ["M " + px + " " + py];
                const v = this.consts.fretHeight-(inlayOffsetY*2);
                pathSegments.push("v " + v);
                const path = pathSegments.join(" ");
                const marker = createSvgElement('path', {
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
            px += this.consts.fretWidth;
        }
        this.svg.appendChild(markers);
    }

    drawFretNumberMarkers(markers) {
        const filteredMarkers = this.consts.markers
            .filter(i => i > this.state.startFret && i <= this.state.endFret);

        for (let i=this.state.startFret+1; i < (this.state.endFret + 1); i++) {
            var class_i;
            var y_adjust_i;
            if (filteredMarkers.includes(i)) {
                class_i = 'fret-marker';
                y_adjust_i = this.consts.stringSpacing;
            } else {
                class_i = 'small-fret-marker';
                y_adjust_i = this.consts.stringSpacing*.75;
            }

            const marker = createSvgElement('text', {
                class: class_i,
                x: this.consts.offsetX + 
                    (i - 1 - this.state.startFret) * 
                    this.consts.fretWidth + (this.consts.fretWidth /** / 2 **/),
                y: this.consts.offsetY + this.consts.fretHeight + 
                    y_adjust_i,
            });

            // tapping instruments 0 or X fret feature support
            marker.innerHTML = i + this.consts.markerOffset; 
            markers.appendChild(marker);
        }
        this.svg.appendChild(markers);
    }

    drawStrings() {
        var sw = this.consts.minStringSize * 2;
        this.strings = createSvgElement('g', {
            'class': 'strings',
        })
        this.svg.appendChild(this.strings);
        for (let i = 0; i < this.consts.numStrings; i++) {
            let path = "M " + 
                this.consts.offsetX + " " + 
                (this.consts.offsetY + 
                i * this.consts.stringSpacing) + 
                " h " + this.state.fretboardWidth;

            if (this.consts.stringDisplayWidths != null) {
                sw = this.consts.stringDisplayWidths[i];
                if (sw === undefined) {
                    sw = this.consts.minStringSize * 2;
                }
            }

            const string = createSvgElement('path', {
                'class': 'string',
                'd': path,
                'styles': {
                    'stroke-width': sw,
                }
            });
            this.strings.appendChild(string);
        }
    }

    createShape(shape) {
        var shapeElem = null;
        if (shape === 'circle') {
            shapeElem = createSvgElement('circle', {
                'r': this.consts.circleRadius,
            });
        } else if (shape === 'diamond') {
            const ysz = this.consts.circleRadius;
            const xsz = this.consts.circleRadius;
            var x = -0;
            var y = ysz;
            var p = x+","+y;
            x+=xsz; y-=ysz;
                p = p+" "+x+","+y;
            x-=xsz; y-=ysz;
                p = p+" "+x+","+y;
            x-=xsz; y+=ysz;
                p = p+" "+x+","+y;

            shapeElem = createSvgElement('polygon', {
                'shape': shape,
                'points': p,

            });
        } else if (shape === 'triangle') {
            const ysz = this.consts.circleRadius*1.2;
            const xsz = this.consts.circleRadius*1.2;
            var x = -xsz;
            var y = ysz/2;
            var p = x+","+y;
            x+=xsz*2;
                p = p+" "+x+","+y;
            x-=xsz; y-=ysz*1.5
                p = p+" "+x+","+y;

            shapeElem = createSvgElement('polygon', {
                'shape': shape,
                'points': p,

            });
        } else if (shape === 'square') {
            const l=this.consts.circleRadius*2-4
            shapeElem = createSvgElement('rect', {
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
        if (isOpen && !this.consts.showOpenStrings) {
            return;
        }
        const note = createSvgElement('g', {
            'id': noteId,
            'transform': "translate(" + x + "," + y + ")",
            'data-x': x,
            'data-y': y,
        });
        this.notes.appendChild(note);
        note.addEventListener("click", 
            (event) => this.noteClickHandler(event));
        note.addEventListener("dblclick", 
            (event) => this.noteDoubleClickHandler(event));

        const shape = this.createShape('circle');
        if (isOpen) {
            setAttributes(shape, {
                // don't show shape around open notes
                'stroke': 'none',
            })
        }
        note.appendChild(shape);

        // compute name of note
        const text = createSvgElement('text', {
            'data-note': noteName,
        });
        text.innerHTML = noteName;

        note.appendChild(text);

                //color: 'white',
        const update = (noteId in this.data) 
            ?  this.data[noteId] 
            : { 
                type: 'note', 
                color: '#FFFFFF', 
                shape: 'circle', 
                visibility: this.state.visibility
              };
        this.updateNote(note, update);
    }

    computeEnharmonicNoteName(noteId, fret, string) {
        const interval = this.consts.stringIntervals[string] + fret + 1;
        var i = Math.abs(interval % 12);
        var s = this.consts.notes[this.state.enharmonic][i];
        if (s.includes('#')) {
            s = s.replace('#', this.consts.sharpGlyph);
        } else if (s.includes("b")) {
            s = s.replace('b', this.consts.flatGlyph);
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
                this.computeEnharmonicNoteName(noteId, fret, string) ;
            }

            const rc = this.coordFromId(this.state.intervalRoot.id);
            const nc = this.coordFromId(noteId); 
            // dc holds the relative x,y, from root
            const dc = new Array(nc[0]-rc[0], nc[1]-rc[1]);

            //const ni = this.consts.stringIntervals[string] + fret + 1;
            const ni = this.consts.stringIntervals[string];
            const ri = this.consts.stringIntervals[string-dc[1]];

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

            if (i < 0 || i >= this.consts.intervalNames.length) {
                return this.computeEnharmonicNoteName(noteId, fret, string);
            } else {
                if (this.consts.intervalNames[i] === undefined)  {
                    return this.computeEnharmonicNoteName(noteId, fret, string);
                }
                return this.consts.intervalNames[i];
            }


        } else {
            return this.computeEnharmonicNoteName(noteId, fret, string);
        }
    }

    drawNotes() {
        this.notes = createSvgElement('g', {
            'class': 'notes',
        })
        this.svg.appendChild(this.notes);

        // open notes (fret: -1)
        for (let j = 0; j < this.consts.numStrings; j++) {
            const noteId = `o-s${j}`;
            const x = this.consts.offsetX / 2;
            const y = this.consts.offsetY + this.consts.stringSpacing * j;
            const noteName = this.computeNoteName(noteId, -1, j);
            this.drawNote(noteId, x, y, noteName, true);
        }
        // notes on fretboard
        for (let i = this.state.startFret; i < this.state.endFret; i++) {
            for (let j = 0; j < this.consts.numStrings; j++) {
                const noteId = `f${i}-s${j}`;
                const x = this.consts.offsetX + (this.consts.fretWidth / 2) + this.consts.fretWidth * (i - this.state.startFret);
                const y = this.consts.offsetY + this.consts.stringSpacing * j;
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
        setAttributes(this.editableText, {
            x: x - this.consts.circleRadius,
            y: y - this.consts.circleRadius + 4,
            height: 2 * this.consts.circleRadius,
            width: 2 * this.consts.circleRadius,
            class: 'visible',
            styles: {
                display: 'block',
            }
        });

        const selectedText = this.noteText(this.state.selected);
        setAttributes(selectedText, {
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
        this.editableText = createSvgElement('foreignObject', {
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
            setAttributes(selectedText, {
                styles: {
                    display: 'block',
                }
            });
            setAttributes(this.editableText, {
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

    updateNote(elem, update) {
        if (!(elem.id in this.data)) {
            this.data[elem.id] = {};
        }

        if ('shape' in update) {
            // clear shape and reconstruct it
            const newshape = this.createShape(update.shape);
            const oldshape = this.noteShape(elem);
            const oldfill = oldshape.getAttribute('fill');
            newshape.setAttribute('fill', oldfill);
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


        const classValue = generateClassValue(elem, update);
        elem.setAttribute('class', classValue);

        if ('noteText' in update) {
            this.noteText(elem).innerHTML = update.noteText;
        }

        const noteData = this.data[elem.id];
        for (let [key, value] of Object.entries(update)) {
            noteData[key] = value;
        }
    }

    toggleVisibility() {
        this.state.visibility = this.state.visibility === 'hidden' ? 'transparent' : 'hidden';
        for (let note of this.notes.children) {
            if (note.className.baseVal.endsWith('visible') || note.className.baseVal.endsWith('selected')) {
                continue;
            }
            this.updateNote(note, {
                visibility: this.state.visibility,
            })
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
        for (let note of this.notes.children) {
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
        this.consts = FRETBOARD_CONSTS[k];
        this.mergeStaticConsts();
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

/* Button for toggeling unselected notes */

const togglebutton = document.getElementById('visibility');
togglebutton.addEventListener('click', (event) => {
    fretboard.toggleVisibility();
});

/* Save SVG button and save file name */

var svgButton = document.getElementById('save-svg');

var savefileNameInput = document.getElementById('savefile-name');
savefileNameInput.addEventListener('change', () => {
    fretboard.savefileName(savefileNameInput.value);
});

svgButton.addEventListener('click', () => {
    fretboard.clearSelection();
    const filename = fretboard.savefileName(null);
    //
    const svgCopy = inlineCSS(svg);
    var svgData = svgCopy.outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    //
    const a = document.createElement('a');
    a.href = svgUrl;
    a.download = filename != null ? filename : 'fretboard_diagram.svg';
    a.id='svg-link';
    // Click handler releases the object URL after the element has been clicked
    // This is required for one-off downloads of the blob content
    const clickHandler = () => {
        setTimeout(() => {
          URL.revokeObjectURL(svgUrl);
          removeEventListener('click', clickHandler);
        }, 150);
    };
    // Add the click event listener on the anchor element
    // and do the click to kickoff download
    a.addEventListener('click', clickHandler, false);
    a.click();
});

/* 
 * when visual attributes don't come out looking right when saving
 * check this. more properties may need to be added
 */
const PROPERTIES = [
    "fill", "stroke", "stroke-width", "text-anchor", "dominant-baseline",
    "stroke-linecap", "stroke-linejoin"
]

function inlineCSS(svg) {
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
        setAttributes(clonedElements[i], {
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

/* Color selector */

const colorButtons = document.querySelectorAll("button.color");
const colorSps = Spectrum.createMultiple(colorButtons, {
    type: 'color',
    showPaletteOnly: true,
    togglePaletteOnly: true,
    maxSelectionSize: 9,
    hideAfterPalletteSelect: true,
    showButtons: true,
    showAlpha: false,
    chooseText: "Done",
    togglePaletteMoreText: "more <click>, <esc> done",
    palette: [[
        "#000000","#eadbc0","#5e6061","#929494","#a7a8a5","#bcbbb6","#4d6aa8","#8fabc9","#abbdc8","#b6c6ce","#d9e1dd","#3e6e90","#679dae","#8ab5ba","#a8c4c1","#c6d5cc"
    ], [
        "#406e58","#91afa1","#becbb7","#3e6f42","#7fa25a","#abc17a","#c4d39b","#eacfa6","#d46c40","#dc8d67","#eacfb9","#9b3738","#e6cdbf","#8f3a43","#943a4d","#d6afa6"
    ], [
        "#8b4d3e","#cd9886","#dbbeaa","#68443c","#b67b66","#d8b29a","#e2cbb5","#4c423d","#b7a392","#5a5550","#928a7e","#b7ac9d","#ac443a","#eae4d7","#dba3af","#744438"
    ], [
        "#3a3b3b","#b8a136","#428f70","#81868b","#403c3a","#3957a5","#dbb07f","#74393b","#7aa7cb","#92969a","#ddbf99","#45423e","#c45e3a","#313d6b","#60646a","#f2bb1d"
  ]]
});

for (let i = 0; i < colorButtons.length; i++) {

    colorButtons[i].addEventListener('click', (event) => {
        fretboard.updateColorFromButton(event, colorSps[i]);
    });

    // user is resetting the canned color to something custom
    colorButtons[i].addEventListener('move', (event) => {
        fretboard.updateColorButtonValue(event);
    });
}

const intervalizeNoteButton = document.getElementById("intervalize-note");
intervalizeNoteButton.addEventListener('click', (event) => {
    fretboard.intervalizeNote(event);
});

/*
 * 
 */

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
    palette: [[
        "#000000","#eadbc0","#5e6061","#929494","#a7a8a5","#bcbbb6","#4d6aa8","#8fabc9","#abbdc8","#b6c6ce","#d9e1dd","#3e6e90","#679dae","#8ab5ba","#a8c4c1","#c6d5cc"
    ], [
        "#406e58","#91afa1","#becbb7","#3e6f42","#7fa25a","#abc17a","#c4d39b","#eacfa6","#d46c40","#dc8d67","#eacfb9","#9b3738","#e6cdbf","#8f3a43","#943a4d","#d6afa6"
    ], [
        "#8b4d3e","#cd9886","#dbbeaa","#68443c","#b67b66","#d8b29a","#e2cbb5","#4c423d","#b7a392","#5a5550","#928a7e","#b7ac9d","#ac443a","#eae4d7","#dba3af","#744438"
    ], [
        "#3a3b3b","#b8a136","#428f70","#81868b","#403c3a","#3957a5","#dbb07f","#74393b","#7aa7cb","#92969a","#ddbf99","#45423e","#c45e3a","#313d6b","#60646a","#f2bb1d"
  ]]
});


const colorPickerElement = document.getElementById('color-picker');
colorPickerElement.addEventListener('move', (event) => {
    fretboard.updateColor(event);
});

/*
 */
const deleteNoteButton = document.getElementById("delete-note");
deleteNoteButton.addEventListener('click', () => fretboard.deleteNote());

const enharmonicToggle = document.getElementById("enharmonic");
enharmonicToggle.addEventListener('click', () => {
    const sign = fretboard.toggleEnharmonic();
    enharmonicToggle.innerHTML = sign;
});

/* fretboard type selection */
const fretboardTypes = document.getElementById('fretboard-types');
for (const key in FRETBOARD_CONSTS) {
    if (FRETBOARD_CONSTS.hasOwnProperty(key)) {
        var opt = document.createElement('option');
        if (FRETBOARD_CONSTS[key].hasOwnProperty('title')) {
            opt.innerHTML = FRETBOARD_CONSTS[key].title;
        } else {
            opt.innerHTML = key.replaceAll('_', ' ');
        }
        opt.value = key;
        fretboardTypes.appendChild(opt);
    }
}
fretboardTypes.value = fretboard.opts.fretboardCfg;

fretboardTypes.addEventListener('change', (event) => {
    fretboard.changeConfiguration(event);
});
