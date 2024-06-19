/*
 * ui for specifiying fretboard colors
 * in the form of a css/html grid with widget
 * elements
 */

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

    clrtargets() {
        const p = document.getElementsByClassName('clrtargets')[0]; 

        var hgrid = this.mk.elemWithAttrs('div', p, { 
            class: 'fbcolors-targets-grid',
            id: 'fbcolors-targets-grid' 
        });
        p.appendChild(hgrid);
        this.clrtargetsRowDivs(hgrid);
        var l;
        var hx = 0;
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="For";
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="Use color";
        l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
        l.innerHTML="With hex value";


        const fbc = this.fretboard.cfg.color;
        for (const key in fbc) {
            if (!fbc.hasOwnProperty(key)) { continue; }

            this.clrtargetsRowDivs(hgrid);

            l = this.mk.elemWithAttrs('label', hgrid.children[hx++], { });
            l.innerHTML=key;
            this.mk.elemWithAttrs('button', hgrid.children[hx++], { 
                style: "background-color: " + fbc[key]
            });
            this.mk.elemWithAttrs('input', hgrid.children[hx++], { 
                type: 'text',
                min: 7, max: 7, maxlength:7, size: 7, 
                value: fbc[key]
            });
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
