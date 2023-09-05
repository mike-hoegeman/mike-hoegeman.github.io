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
    }

    constructor(opts) {
        this.svg = opts.svg;
        this.opts = opts;

        this.bellAudio = new Audio(
            'sounds/bell.wav'
        );
        this.consts = FRETBOARD_CONSTS[opts.fretboardCfg];
        this.mergeStaticConsts();

        this.state = {
            selected: null,
            visibility: 'transparent',
            startFret: 0,
            endFret: 12,
            enharmonic: 0,
            intervalRoot: null
        };


        // Set end fret according to viewport width
        this.state.endFret = Math.min(Math.floor((window.innerWidth - 2 * this.consts.offsetX ) / this.consts.fretWidth), 12);
        opts.endFret.value = this.state.endFret;

        this.computeDependents();

        this.data = {};
        this.draw();
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
        if (end - start > 16) {
            this.drawError("Maximal number of displayable frets is 16, <br/> e.g., 1st to 16th or 4th to 19th!");
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
            switch (event.code) {
                case 'Backspace':
                case 'Delete':
                    this.deleteNote()
                    break;
                case 'KeyI':
                    this.intervalizeNote();
                    break;
                case 'KeyB':
                    this.updateNote(selected, { color: "blue" });
                    break;
                case 'KeyD':
                    this.updateNote(selected, { color: "black" });
                    break;
                case 'KeyG':
                    this.updateNote(selected, { color: "green" });
                    break;
                case "KeyW":
                    this.updateNote(selected, { color: "white" });
                    break;
                case "KeyR":
                    this.updateNote(selected, { color: "red" });
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
            const text = selected.lastChild;
            if (text) {
                text.innerHTML = text.getAttribute('data-note');
            }
            this.updateNote(selected, { 
                color: "white", shape: "circle", visibility: this.state.visibility, 
            });
        }
        this.state.selected = null;
    }

    updateColor(event) {
        if (this.state.selected) {
            this.updateNote(this.state.selected, { 
                color: event.currentTarget.getAttribute("title") 
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
        var pathSegments = ["M " + this.consts.offsetX + " " + this.consts.offsetY];
        for (let i = this.state.startFret; i < (this.state.endFret + 1); i++) {
            let factor = (i - this.state.startFret) % 2 == 0 ? 1 : -1;
            pathSegments.push("v " + (factor) * this.consts.fretHeight);
            pathSegments.push("m " + this.consts.fretWidth + " " + 0);
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
        const filteredMarkers = this.consts.markers
            .filter(i => i > this.state.startFret && i <= this.state.endFret);
        for (let i of filteredMarkers) {
            const marker = createSvgElement('text', {
                class: 'marker',
                x: this.consts.offsetX + (i - 1 - this.state.startFret) * this.consts.fretWidth + (this.consts.fretWidth / 2),
                y: this.consts.offsetY + this.consts.fretHeight + this.consts.stringSpacing,
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
        note.addEventListener("click", (event) => this.noteClickHandler(event));
        note.addEventListener("dblclick", (event) => this.noteDoubleClickHandler(event));

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

        const update = (noteId in this.data) ? this.data[noteId] : { type: 'note', color: 'white', shape: 'circle', visibility: this.state.visibility };
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

        const selectedText = this.state.selected.lastChild;
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
            const selectedText = this.state.selected.lastChild;

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

    updateNote(elem, update) {
        if (!(elem.id in this.data)) {
            this.data[elem.id] = {};
        }

        if ('shape' in update) {
            // clear shape and reconstruct it
            var newshape = this.createShape(update.shape);
            var oldshape = elem.childNodes[0];
            elem.replaceChild(newshape, oldshape);
        }

        const classValue = generateClassValue(elem, update);
        elem.setAttribute('class', classValue);

        if ('noteText' in update) {
            elem.lastChild.innerHTML = update.noteText;
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
            const text = note.lastChild;
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

var saveFileNameInput = document.getElementById('savefile-name');
saveFileNameInput.addEventListener('change', () => {

});

svgButton.addEventListener('click', () => {
    fretboard.clearSelection();
    //
    const svgCopy = inlineCSS(svg);
    var svgData = svgCopy.outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    //
    const a = document.createElement('a');
    a.href = svgUrl;
    a.download = 'fretboard-diagram.svg';
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
    a.addEventListener('click', clickHandler, false);



    a.click();
});

const PROPERTIES = ["fill", "stroke", "stroke-width", "text-anchor", "dominant-baseline"]

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
for (let button of colorButtons) {
    button.addEventListener('click', (event) => {
        fretboard.updateColor(event);
    });
}

const intervalizeNoteButton = document.getElementById("intervalize-note");
intervalizeNoteButton.addEventListener('click', (event) => {
    fretboard.intervalizeNote(event);
});

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
