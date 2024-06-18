/*
 * ui for specifiying fretboard colors
 * in the form of a css/html grid with widget
 * elements
 */

class FretboardColors {

    constructor(fretboard) {
        this.perRowClasses = [
            'fbcolors-strings-grid-col-interval-note',
            'fbcolors-strings-grid-col-interval-octave',
            'fbcolors-strings-grid-col-displaywidth',
        ];
        this.fretboard = fretboard;
        this.mk = new MakeElements();
        this.gridcontainer = this.fbColorsGridContainer('fbcolors-main');
        this.clrheader();
        /*
        this.kreadwritefretboard();
        this.kstringheader();
        this.kopenstrings();
        this.strings = this.kstrings();
        this.fbcStrings(this.strings, 12);
        document.getElementById('numstrings').value=12;
        this.kleftmarkers();
        this.krightmarkers();
        */
    }

    clrheader() {
        const p = document.getElementsByClassName('clrheader')[0]; 
        const tn = this.mk.textNode("Fretboard colors", p);
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

    krightmarkers() {
        const p = document.getElementsByClassName('krightmarkers')[0]; 

        var label = this.mk.elemWithAttrs('label', p, { 
            for: "include-xfret", 
        });
        label.innerHTML = "Add X/0 fret: ";
        var checkbox = this.mk.elemWithAttrs('input', p, {
            type: "checkbox",
            id: "include-xfret",
            checked: true,
        });
        checkbox.addEventListener("change", (event) => {
            this.includeXFretChanged(event);
        });

        //----

        label = this.mk.elemWithAttrs('label', p, { 
            for: "transparent-background", 
        });
        label.innerHTML = "Transparent Background";
        checkbox = this.mk.elemWithAttrs('input', p, {
            type: "checkbox",
            id: "transpoarent-background",
            checked: true,
        });
        checkbox.addEventListener("change", (event) => {
            this.transparentBackgroundChanged(event);
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
            class: 'fbcolors-strings-grid',
            id: 'fbcolors-strings-grid-heading' 
        });
        p.appendChild(hgrid);
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbcolors-strings-grid-col-interval-note' });
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbcolors-strings-grid-col-interval-octave' });
        this.mk.elemWithAttrs('div', hgrid,
            { class: 'fbcolors-strings-grid-col-displaywidth' });

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
            class: 'fbcolors-strings-grid',
            id: 'fbcolors-strings-grid' 
        });
        p.appendChild(stringsgrid);
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbcolors-strings-grid-col-interval-note' });
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbcolors-strings-grid-col-interval-octave' });
        this.mk.elemWithAttrs('div', stringsgrid,
            { class: 'fbcolors-strings-grid-col-displaywidth' });

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
          document.getElementById('fbcolors-strings-grid'); 
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
            { class: 'fbcolors-string-note' });
            snote.innerHTML = "Note";
        for(let i=0; i<noteopts.length; i++) {
            var o = this.mk.elemWithAttrs('option', snote, {
            });
            o.innerHTML=noteopts[i];
        }
        parent = stringgrid.childNodes[1];
        var octaveopts = [ 0,1,2,3,4,5,6,7,8,9];
        var soctave = this.mk.elemWithAttrs('select', parent, { 
            class: 'fbcolors-string-octave' 
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
            { class: 'fbcolors-string-width' });
            swidth.innerHTML = "Width";
        for(let i=0; i<widthopts.length; i++) {
            var o = this.mk.elemWithAttrs('option', swidth, {
            });
            o.innerHTML=widthopts[i];
        }
        return [ snote, soctave ];
    }

    fbcString() {
        const sg = document.getElementById('fbcolors-strings-grid'); 
        this.fbcStringInterval(sg);
    }

    fbColorsGridContainer(targetId) {
        const p = document.getElementById('fbcolors-main'); 
        var cont = this.mk.elemWithAttrs('div', p,
            { class: 'fbcolors-grid-container' });
        const clrlist = [
            'clrheader', 
            'clrtargetsheader',
        ];
        for (let i = 0; i< clrlist.length; i++) {
            cont.appendChild(this.mk.elemWithAttrs('div', p, 
                { class: clrlist[i] }));
        }
        return p;
    }
}
