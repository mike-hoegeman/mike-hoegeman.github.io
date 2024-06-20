/*
 * ui for specifiying fretboard colors
 * in the form of a css/html grid with widget
 * elements
 */

/*
 * Color selector
 */
var FretboardColorsPicker = null;
class FretboardColors {

    constructor(fretboard) {
        this.perRowClasses = [
            'fbcolors-targets-grid-target-name',
            'fbcolors-targets-grid-target-color-box',
            'fbcolors-targets-grid-target-color-hex'
        ];
        this.fretboard = fretboard;
        this.mk = new MakeElements();
        this.gridcontainer = this.fbColorsGridContainer('fbcolors-main');
        //
        this.clrheader();
        this.clrtransparentbackground();
        //
        this.clrtargets()
    }

    getKeys(obj) {
        var keys = [];
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys.sort();
    }

    clrheader() {
        const p = document.getElementsByClassName('clrheader')[0]; 
        var label = this.mk.elemWithAttrs('label', p, { });
        label.innerHTML = "Fretboard Colors";
    }
    clrtransparentbackground() {
        const p = 
          document.getElementsByClassName('clrtransparentbackground')[0]; 
        var label = this.mk.elemWithAttrs('label', p, { 
            for: "transparent-background", 
        });
        label.innerHTML = "Use Transparent Background";
        var checkbox = this.mk.elemWithAttrs('input', p, {
            type: "checkbox",
            id: "transparent-background",
            checked: true,
        });
        checkbox.addEventListener("click", (event) => {
            this.transparentBackgroundChanged(checkbox);
        });
    }
    transparentBackgroundChanged(checkbox) {
        if (checkbox.checked) {
            this.fretboard.cfg.color['background'] = 'none'; 
        } else {
            this.fretboard.cfg.color['background'] = 'white'; 
        }
        this.fretboard.drawBackground();
    }

    clrtargetsRowDivs(pgrid) {
        this.mk.elemWithAttrs('div', pgrid,
            { class: 'fbcolors-targets-grid-col-name' });
        this.mk.elemWithAttrs('div', pgrid,
            { class: 'fbcolors-targets-grid-col-color-box' });
        this.mk.elemWithAttrs('div', pgrid,
            { class: 'fbcolors-targets-grid-col-color-hex' });
    }

    updateTargetFromButton(event, colortarget) {
        const elem = event.target;
        if (this.fretboard.isIOS) {
            this.bell();
            return;
        }

        // get the target element and change the title
        // and background-xxxx style
        if (event.detail.color === '') {
            this.bell();
            return;
        }
        const color = event.detail.color.toHexString();
        // save in configuration
        this.fretboard.cfg.color[colortarget] = color;
        // update button color
        elem.style['background-color'] = color;
        this.fretboard.erase();
        this.fretboard.draw();
        this.updateColorWidgets();
    }

    clrtargets() {
        const p = document.getElementsByClassName('clrtargets')[0]; 

        var hgrid = this.mk.elemWithAttrs('div', p, { 
            class: 'fbcolors-targets-grid',
            id: 'fbcolors-targets-grid' 
        });
        p.appendChild(hgrid);

        //----
        // Make the label/heading row
        this.clrtargetsRowDivs(hgrid);
        var l;
        var hx = 0;
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="For element";
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="use color";
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="with hex value";
        //----


        //----
        // widget row for each target
        const fbc = this.fretboard.cfg.color;
        const keys = this.getKeys(fbc);
        const buttons = [];
        for (let i=0; i<keys.length; i++) {
            var key = keys[i];
            this.clrtargetsRowDivs(hgrid);

            var e;
            e = this.mk.elemWithAttrs('label', hgrid.children[hx++], {});

            e = this.mk.elemWithAttrs('button', hgrid.children[hx++], {
                id: "colortargetbutton"+i
            });
            buttons.push(e);

            e = this.mk.elemWithAttrs('input', hgrid.children[hx++], { 
                type: 'text',
                min: 7, max: 7, maxlength:7, size: 7, 
                value: fbc[key]
            });
        }
        //----
        // make color selector
        if (!this.fretboard.isIOS) {
            FretboardColorsPicker = Spectrum.createMultiple(buttons, {
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
            //----
            // bind buttons to selector
            for (let i=0; i<keys.length; i++) {
                buttons[i].addEventListener('move', (event) => {
                    this.updateTargetFromButton(event, keys[i]);
                });
            }
        }
        //----
        // update the widget data/appearances for each target row
        this.updateColorWidgets();
    }

    updateColorWidgets() {
        const hgrid = document.getElementById('fbcolors-targets-grid'); 
        var hx = 3; // skip past header row
        var e = null;

        const fbc = this.fretboard.cfg.color;
        const keys = this.getKeys(fbc);
        for (let i=0; i<keys.length; i++) {
            var key = keys[i];
            // label
            e = hgrid.children[hx++].children[0];
            e.innerHTML = key;

            // button
            e = hgrid.children[hx++].children[0];
            e.style['background-color'] = fbc[key];

            // text input
            e = hgrid.children[hx++].children[0];
            e.value = fbc[key];
        }
    }

    bell() {
        this.fretboard.bell();
    }

    fbColorsGridContainer(targetId) {
        const p = document.getElementById('fbcolors-main'); 
        var cont = this.mk.elemWithAttrs('div', p,
            { class: 'fbcolors-grid-container' });
        const clrlist = [
            'clrheader', 
            'clrtransparentbackground', 
            'clrtargets',
        ];
        for (let i = 0; i< clrlist.length; i++) {
            cont.appendChild(this.mk.elemWithAttrs('div', p, 
                { class: clrlist[i] }));
        }
        return p;
    }
}
