/*
 * a config file that descibes the various available 
 * fretboard configurations
 *
 */
var _x = 61;
const FRETBOARD_CONSTS = {

    /* 6 string guitar that uses standard tuning */
    guitar: {
        title: "Guitar",
        showOpenStrings: true,
        offsetX: 40,
        offsetY: 30,
        stringIntervals: [24, 19, 15, 10, 5, 0], // intervals between strings 
        markerOffset: 0,
        markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: 
          [['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
          ['E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb']]
    },

    /* 12 string tapping instruments like the chapman stick or the
    dragonfly DFA-12 that use a "mateched recriprocal" style tuning.
    (just the melody half of the neck) */

    tapping_12_str_matched_reciprocal: {
        title: "Tapper: 12str matched reciprocal",
        showOpenStrings: false, // tapping instruments can't play open strings 
        offsetX: 40,
        offsetY: 30,
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, 1.4, //melody
            3.4, 3.0, 2.4, 2.0, 1.0, 0.6  //bass
        ],
        stringIntervals: [
            // melody
            _x, _x-5, _x-10, _x-15, _x-20, _x-25,
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36, _x-36+7, _x-36+14, _x-36+21, _x-36+28, _x-36+35,
        ],
        // stringIntervals: [25, 20, 15, 10, 5, 0, 25, 20, 15, 10, 5, 0],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: 
          [['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
          ['Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A']]
    },

    tapping_12_str_matched_reciprocal_melody: {
        title: "Tapper: 12str matched reciprocal melody",
        showOpenStrings: false, // can't play open strings 
        offsetX: 40,
        offsetY: 30,
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, 1.4 //melody
            // 3.4, 3.0, 2.4, 2.0, 1.0, 0.6  //bass
        ],
        stringIntervals: [25, 20, 15, 10, 5, 0],
        markerOffset: -1, // 0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: 
          [['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
          ['Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A']]
    },

    tapping_12_str_matched_reciprocal_bass: {
        title: "Tapper: 12str matched reciprocal bass",
        showOpenStrings: false, // can't play open strings 
        offsetX: 40,
        offsetY: 30,
        stringDisplayWidths: [
            // 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, //melody
            3.4, 3.0, 2.4, 2.0, 1.0, 0.6  //bass
        ],
        stringIntervals: [0, 7, 14, 21, 28, 35],
        markerOffset: -1, // 0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // have inlays every 5 frets
        fretWidth: 70,
        stringSpacing: 40,
        minStringSize: 0.2,
        notes: 
          [['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#'],
          ['B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb']]
    }

}
