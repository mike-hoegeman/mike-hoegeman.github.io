/*
 *
 *
 */
const FRETBOARD_CONSTS = {
    /*
     * 6 string guitar that uses standard tuning
     * that use a "mateched recriprocal" style tuning
     */
    guitar_standard: {
        showOpenStrings: true,
        offsetX: 40,
        offsetY: 30,
        stringIntervals: [24, 19, 15, 10, 5, 0], // intervals between strings 
        markerOffset: 0,
        markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: [['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
                ['E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb']],
        sign: ['♯', '♭'],
    },

    /*
     * 12 string tapping instruments like the chapman stick or the dragonfly DFA-12
     * that use a "mateched recriprocal" style tuning. (just the melody half of the neck)
     */
    tapping_12_str_matched_reciprocal_melody: {
        showOpenStrings: false, // tapping instruments can't play open strings 
        offsetX: 40,
        offsetY: 30,
        // all_stringIntervals: [25, 20, 15, 10, 5, 0, 25, 20, 15, 10, 5, 0],
        // melody_stringIntervals: [25, 20, 15, 10, 5, 0],
        stringIntervals: [25, 20, 15, 10, 5, 0],
        markerOffset: -1, // tapping instruments have the concept of a possible 0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // tapping instruments typically have inlays every 5 frets
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: [['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
                ['Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A']],
        sign: ['♯', '♭'],
    }
}
FRETBOARD_CONSTS.default = FRETBOARD_CONSTS.tapping_12_str_matched_reciprocal_melody;
