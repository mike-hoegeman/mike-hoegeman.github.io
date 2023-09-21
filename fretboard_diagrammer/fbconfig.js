/*
 * ui for building fretboard configurations
 * in the form of a css/html grid with widget
 * elements
 */

// helper functions for constructing dom 
class MakeElements {
    elemWithAttrs(elemtype, parent=null, attrs=null) {
        const e = document.createElement(elemtype);
        if (attrs !=null) {
            for (let key in attrs) {
                e.setAttribute(key, attrs[key]);
            }
        }
        if (parent != null) {
            parent.appendChild(e);
        }
        return e;
    }
    textNode(text, parent=null, attrs=null) {
        var tnode = document.createTextNode(text);
        if (parent != null) {
            parent.appendChild(tnode);
        }
        if (attrs != null) {
        }
        return tnode;
    }
}

class FretboardConfigurator {

    constructor(fretboard) {
        this.perRowClasses = [
            'fbc-strings-grid-col-interval-note',
            'fbc-strings-grid-col-interval-octave',
            'fbc-strings-grid-col-displaywidth',
        ];
        this.fretboard = fretboard;
        this.mk = new MakeElements();

        this.gridcontainer = this.fbcGridContainer('fbc-main');
        this.kheader();
        this.kreadwritefretboard();
        this.kstringheader();
        this.kopenstrings();
        this.strings = this.kstrings();
        this.fbcStrings(this.strings, 12);
        document.getElementById('numstrings').value=12;
        this.kleftmarkers();
        this.krightmarkers();
    }

    readRequest(event) {
        const e = document.getElementById('read-from-fretboard');
        //this.bell();
        const json = JSON.stringify(this.fretboard.cfg, null, "  ");
        const o = this.fretboard;
        console.log("READREQ: %s:", json);

        //
        document.getElementById('show-open-strings').checked
            = o.cfg.showOpenStrings;
        //
        document.getElementById('include-xfret').checked 
            = o.cfg.markerOffset ? -1 : 0;

        // markers
        document.getElementById('leftmarkers').value
            = o.cfg.markers.toString();

        // per string stuff
        const stringgrid = document.getElementById('fbc-strings-grid');
        // re-size dialog's umber of strings
        var numStrings = o.cfg.stringIntervals.length;
        this.fbcStrings(stringgrid, numStrings);
        //
        var notes = stringgrid.children[0].children;
        var octaves = stringgrid.children[1].children;
        var widths = stringgrid.children[2].children;


        for (let row=0; row<o.cfg.stringIntervals.length; row++) {
            const midinote = o.cfg.stringIntervals[row]; 
            notes[row].value = o.cfg.stringIntervals[row]; 
            widths[row].value = o.cfg.stringDisplayWidths[row]; 

            octaves[row].value = o.computeOctave(-1, row); 
            const sharpmode = 0;
            const nn = o.computeEnharmonicNoteName(-1, row, sharpmode);
            var notename = nn[0];
            if (nn[1] === o.DEF.sharpGlyph) {
                notename += "#"; 
            }
            notes[row].value = notename;

            //var w = parseFloat(widths[row].value);
            //o.cfg.stringDisplayWidths.push(w);
            //var s = notes[row].value+octaves[row].value;
            //var i = this.fretboard.computeNoteOctaveStrToMidi(s);
            //o.cfg.stringIntervals.push(i);
        }

    }

    writeRequest(event) {
        const e = document.getElementById('write-to-fretboard');
        const o = {cfg: new FretboardConfig()};

        o.cfg.title = "definedbyuser";

        o.cfg.showOpenStrings = 
            document.getElementById('show-open-strings').checked;

        o.cfg.markerOffset = 
            document.getElementById('include-xfret').checked ? -1 : 0;

        // per string stuff
        const stringgrid = document.getElementById('fbc-strings-grid');
        var notes = stringgrid.children[0].children;
        var octaves = stringgrid.children[1].children;
        var widths = stringgrid.children[2].children;
        o.cfg.stringIntervals = [];
        o.cfg.stringDisplayWidths = [];
        for (let row=0; row<notes.length; row++) {
            var w = parseFloat(widths[row].value);
            o.cfg.stringDisplayWidths.push(w);

            var s = notes[row].value+octaves[row].value;
            var i = this.fretboard.computeNoteOctaveStrToMidi(s);
            o.cfg.stringIntervals.push(i);
        }

        o.cfg.markers = [];
        if (document.getElementById('leftmarkers').value === "") {
            o.cfg.markers = [];
        } else if (!document.getElementById('leftmarkers').value) {
            o.cfg.markers = [];
        } else {
            var markers =
                document.getElementById('leftmarkers').value.split(",");
            for(let i=0; i < markers.length; i++) { 
                var m = parseInt(markers[i]);
                if (m!=0 && !m) {
                    // crap in input...
                    o.cfg.markers = [];
                    break;
                }
                o.cfg.markers.push(m);
            }
        }
        const json = JSON.stringify(o, null, "  ");
        //console.log("%s", json);
        this.fretboard.loadJsonCfg(json);
        return;
    }

    kheader() {
        const p = document.getElementsByClassName('kheader')[0]; 
        const tn = this.mk.textNode("Fretboard configurator", p);
    }

    kreadwritefretboard() {
        const p = document.getElementsByClassName('kreadwritefretboard')[0]; 

        //read
        const read = this.mk.elemWithAttrs('button', p, {
            id: "read-from-fretboard", 
        });
        this.mk.elemWithAttrs('img', read, {
            src: "svg-icons/readfromfretboard.svg", height: 20
        });
        read.addEventListener("click", (event) => {
            this.readRequest(event);
        });

        //write
        const write = this.mk.elemWithAttrs('button', p, {
            id: "write-to-fretboard", 
        });
        this.mk.elemWithAttrs('img', write, {
            src: "svg-icons/writetofretboard.svg", height: 20
        });
        write.addEventListener("click", (event) => {
            this.writeRequest(event);
        });

    }

    kleftmarkers() {
        const p = document.getElementsByClassName('kleftmarkers')[0]; 
        // 
        var label = this.mk.elemWithAttrs('label', p, { for: "markers", });
        label.innerHTML = "Markers at frets: ";
        const input = this.mk.elemWithAttrs('input', p, {
            type: "text",
            class: "markers-input", 
            id: "leftmarkers",
            value: "3,8,13,18",
            min: 1, max: 200, maxlength: 100, size: 25,
            pattern: '(?:\\d+,\\s*)+\\d+',
        });
        /*
            (?:         # begin group
              \d+       #   digits
              ,\s*      #   ",", optional whitespace
            )+          # end group, repeat
            \d+         # digits (last item in the list)
        */
        input.addEventListener("change", (event) => {
            this.markersChanged(event);
        });

    }

    includeXFretChanged(event) {
    }

    krightmarkers() {
        const p = document.getElementsByClassName('krightmarkers')[0]; 
        var label = this.mk.elemWithAttrs('label', p, { 
            for: "include-xfret", 
        });
        label.innerHTML = "Add X/0 fret: ";
        const checkbox = this.mk.elemWithAttrs('input', p, {
            type: "checkbox",
            id: "include-xfret",
            checked: true,
        });
        checkbox.addEventListener("change", (event) => {
            this.includeXFretChanged(event);
        });
    }

    kstringheader() {
        const p = document.getElementsByClassName('kstringheader')[0]; 

        var label = this.mk.elemWithAttrs('label', p, {
            for: "numstrings",
        });
        label.innerHTML = "# of strings: ";
        const input = this.mk.elemWithAttrs('input', p, {
            type: "number",
            class: "num-input", 
            value: 1,
            id: "numstrings",
            min: 1, max: 20, maxlength: 2, size: 5,
        });
        input.addEventListener("change", (event) => {
            this.numStringsChanged(event);
        });
        return input;
    }

    kopenstrings() {
        const p = document.getElementsByClassName('kopenstrings')[0]; 
        var label = this.mk.elemWithAttrs('label', p, {
            for: "show-open-strings",
        });
        label.innerHTML = "Show open strings: ";
        const checkbox = this.mk.elemWithAttrs('input', p, {
            type: "checkbox",
            id: "show-open-strings",
        });
        checkbox.addEventListener("change", (event) => {
            this.showOpenStringsChanged(event);
        });
        return checkbox;
    }

    kstrings() {
        const p = document.getElementsByClassName('kstrings')[0]; 

        var hgrid = this.mk.elemWithAttrs('div', p, { 
            class: 'fbc-strings-grid',
            id: 'fbc-strings-grid-heading' 
        });
        p.appendChild(hgrid);
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbc-strings-grid-col-interval-note' });
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbc-strings-grid-col-interval-octave' });
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbc-strings-grid-col-displaywidth' });

        // heading icons note, octave, stringwidth
        var l;
        l = this.mk.elemWithAttrs('label', hgrid.children[0], { });
            this.mk.elemWithAttrs('img', l, {
                src: 'svg-icons/note.svg', height: 20
            });
        l = this.mk.elemWithAttrs('label', hgrid.children[1], { });
            this.mk.elemWithAttrs('img', l, {
                src: 'svg-icons/octavelevel.svg', height: 20
            });
        l = this.mk.elemWithAttrs('label', hgrid.children[2], { });
            this.mk.elemWithAttrs('img', l, {
                src: 'svg-icons/stringwidth.svg', height: 20
            });

        var stringsgrid = this.mk.elemWithAttrs('div', p, { 
            class: 'fbc-strings-grid',
            id: 'fbc-strings-grid' 
        });
        p.appendChild(stringsgrid);
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbc-strings-grid-col-interval-note' });
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbc-strings-grid-col-interval-octave' });
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbc-strings-grid-col-displaywidth' });

        return stringsgrid;
    }

    bell() {
        this.fretboard.bell();
    }
    markersChanged(event) {
        var v = event.target.value.trim();
        var markers = [];
        if (v.length === 0) {
            markers = [];
        } else {
            // ^$ for exact match
            const r=/^(?:\d+,\s*)*\d*$/
            if (!r.test(v)) {
                event.target.value = "? use fret #s e.g: 3, 5, 7, ...";
                this.bell();
                markers = [];
                return;
            } else {
                markers = v.split(/[ ,]+/);
            }
        }
        var s = markers.toString()
        event.target.value = s;
        return markers;
    }

    numStringsChanged(event) {
        const stringgrid = 
          document.getElementById('fbc-strings-grid'); 
        this.fbcStrings(stringgrid, event.target.value);
    }

    showOpenStringsChanged(event) {
    }

    fbcStrings(stringgrid, numStrings) {
        // get current number of strings
        // if the number is smaller than the current number
        // add the difference in
        var notecol = stringgrid.children[0];
        var octavecol = stringgrid.children[1];
        var widthcol = stringgrid.children[2];

        var currNumStrings = notecol.children.length; 
        if (currNumStrings == numStrings) {
            return;
        }
        if (currNumStrings > numStrings) {
            // delete extra ones
            var rows_to_delete = currNumStrings - numStrings;
            for (let i = 0 ; i < rows_to_delete; i++) {
                notecol.removeChild(notecol.lastChild);
                octavecol.removeChild(octavecol.lastChild);
                widthcol.removeChild(widthcol.lastChild);
            }
            return;
        }
        //
        const rows_to_add = numStrings-currNumStrings;
        for (let i = 0 ; i < rows_to_add; i++) {
            this.fbcStringAdd(stringgrid);
        }
    }

    fbcStringAdd(stringgrid) {
        var parent = null;
        parent = stringgrid.childNodes[0];
        var noteopts = 
            [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];
        var snote = this.mk.elemWithAttrs('select', parent,
            { class: 'fbc-string-note' });
            snote.innerHTML = "Note";
        for(let i=0; i<noteopts.length; i++) {
            var o = this.mk.elemWithAttrs('option', snote, {
            });
            o.innerHTML=noteopts[i];
        }
        parent = stringgrid.childNodes[1];
        var octaveopts = [ 0,1,2,3,4,5,6,7,8,9];
        var soctave = this.mk.elemWithAttrs('select', parent, { 
            class: 'fbc-string-octave' 
        });
        //soctave.innerHTML = "Octave";
        for(let i=0; i<octaveopts.length; i++) {
            var o = this.mk.elemWithAttrs('option', soctave, {
                value: octaveopts[i]
            });
            o.innerHTML=octaveopts[i];
        }
        parent = stringgrid.childNodes[2];
        var widthopts = [ 
                 0.2, 0.4, 0.6, 0.8,
            1.0, 1.2, 1.4, 1.6, 1.8,
            2.0, 2.2, 2.4, 2.6, 2.8,
            3.0, 3.2, 3.4, 3.6, 3.8,
            4.0, 4.2, 4.4, 4.6, 4.8,
            5.0
        ];
        var swidth = this.mk.elemWithAttrs('select', parent,
            { class: 'fbc-string-width' });
            swidth.innerHTML = "Width";
        for(let i=0; i<widthopts.length; i++) {
            var o = this.mk.elemWithAttrs('option', swidth, {
            });
            o.innerHTML=widthopts[i];
        }
        return [ snote, soctave ];
    }

    fbcString() {
        const sg = document.getElementById('fbc-strings-grid'); 
        this.fbcStringInterval(sg);
    }

    fbcGridContainer(targetId) {
        const p = document.getElementById('fbc-main'); 
        var cont = this.mk.elemWithAttrs('div', p,
            { class: 'fbc-grid-container' });
        const klist = [
            'kheader', 'kreadwritefretboard', 
            'kstringheader', 'kopenstrings',
            'kstringinterval', 'kstringdisplaywidth',
            'kstrings',
            'kleftmarkers', 'krightmarkers',
            'kfree'
        ];
        for (let i = 0; i< klist.length; i++) {
            cont.appendChild(this.mk.elemWithAttrs('div', p, 
                { class: klist[i] }));
        }
        return p;
    }
}
