/*
 * a config file that descibes the various available 
 * fretboard configurations
 *
 */


/*
 * Reference:
 *
 * Midi note numbers are used for the stringInterval values
 * of the Fretboard object.
 *
 * Midi notes are in units of semitones.
 *
 * 60 == Midi Note Number for Middle C4
 * 127== Midi Note for G8. upper limit of MIDI note value range
 * 0  == Midi Note for C-2. lower limit of MIDI note value range
 *
 * C1 == low C on a piano  
 * C4 == middle C
 *
 * C1 == the C on the X/0 fret for the low bass string of a 
 *       matched reciprocal 12str
 * C4 == the C on the X/0 fret for the high melody string of 
 *       matched reciprocal 12str
 *
 * E4 -- the high open e on std guitar
 *
 * Given all these numbers above, using midi notes numbers is a practical
 * way to express the stringInterval numbers in a fretboard configuration.
 *
 * Doing this allows us to do some simple arithmetic with 
 * stringIntervals, and a position's fret and string number, 
 * to calculate that positions midi value.
 *
 * So: 
 *   -- if middle C is what your first open string is tuned too. 
 *   then '0' is what your first value in stringIntervals should be. 
 *   internally that will translate to midi 60
 *
 *   -- if your first open string is tuned one semitone lower 
 *   to B below middle C (B2)  then your first value in stringIntervals 
 *   should be 59. 
 *      In fact , this is the case for 12 string 
 *   matched reciprocal which you can see in the catalog below
 *
 * NOTE: Midi is stupid and shifts all the octave numbers down
 * 1, so in midi they refer to middleC usually as 'C3', not C4 
 * we are not using midi octave numbers in this dicussion
 */

var _x = 59;

const FRETBOARD_CATALOG = {

    /* 6 string guitar that uses standard tuning */
    guitar: {
        title: "Guitar",
        showOpenStrings: true,
        stringDisplayWidths: [ 0.4, 0.6, 0.8, 1.0, 1.2, 1.4 ],
        stringIntervals: [_x-7, _x-12, _x-16, _x-21, _x-26, _x-31],
        markerOffset: 0,
        markers: [3, 5, 7, 9, 12, 15, 17, 19, 21],
    },

    /* 12 string tapping instruments like the chapman stick or the
    dragonfly DFA-12 */

    tapping_10_str_matched_reciprocal: {
        title: "Tapper: 10str matched reciprocal",
        showOpenStrings: false, // tapping instruments can't play open strings 
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, //melody
            3.4, 3.0, 2.4, 2.0, 1.0 //bass
        ],
        // like 12 str MR but without low melody and high bass string
        stringIntervals: [
            // melody
            _x, _x-5, _x-10, _x-15, _x-20,
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36, _x-36+7, _x-36+14, _x-36+21, _x-36+28
        ],
        // stringIntervals: [25, 20, 15, 10, 5, 0, 25, 20, 15, 10, 5, 0],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_12_str_matched_reciprocal: {
        title: "Tapper: 12str matched reciprocal",
        showOpenStrings: false, // tapping instruments can't play open strings 

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
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_12_str_matched_reciprocal_melody: {
        title: "Tapper: 12str matched reciprocal melody",
        showOpenStrings: false, // can't play open strings 
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, 1.4, //melody
        ],
        stringIntervals: [
            // melody
            _x, _x-5, _x-10, _x-15, _x-20, _x-25,
        ],
        markerOffset: -1, // 0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_12_str_matched_reciprocal_bass: {
        title: "Tapper: 12str matched reciprocal bass",
        showOpenStrings: false, // can't play open strings 
        stringDisplayWidths: [
            3.4, 3.0, 2.4, 2.0, 1.0, 0.6  //bass
        ],
        stringIntervals: [
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36, _x-36+7, _x-36+14, _x-36+21, _x-36+28, _x-36+35,
        ],
        markerOffset: -1, // 0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // have inlays every 5 frets
    },

    tapping_10_str_classic: {
        title: "Tapper: 10str classic",
        showOpenStrings: false, // tapping instruments can't play open strings 
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, //melody
            3.4, 3.0, 2.4, 2.0, 1.0 //bass
        ],
        // like 12 str classic without low melody string
        // and high bass string
        stringIntervals: [
            // melody
            _x+2, _x+2-5, _x+2-10, _x+2-15, _x+2-20,
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36, _x-36+7, _x-36+14, _x-36+21, _x-36+28
        ],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_12_str_classic: {
        title: "Tapper: 12str classic",
        showOpenStrings: false, // tapping instruments can't play open strings 
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, 1.4, //melody
            3.4, 3.0, 2.4, 2.0, 1.0, 0.6  //bass
        ],
        // 12str matched reciprocal except the melody side is tuned up
        // 2 semitones
        stringIntervals: [
            // melody
            _x+2, _x+2-5, _x+2-10, _x+2-15, _x+2-20, _x+2-25,
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36, _x-36+7, _x-36+14, _x-36+21, _x-36+28, _x-36+35,
        ],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_10_str_full_baritone: {
        title: "Tapper: 10str full baritone",
        showOpenStrings: false, // tapping instruments can't play open strings 
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, //melody
            3.4, 3.0, 2.4, 2.0, 1.0 //bass
        ],
        // like 12 str classic without low melody string
        // and high bass string
        stringIntervals: [
            // melody
            _x+2-5, _x+2-10, _x+2-15, _x+2-20, _x+2-25,
            // bass - shift down 11 semi tones and start doing 5ths 
            _x-36+2, _x-36+9, _x-36+16, _x-36+23, _x-36+30
        ],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    },

    tapping_ns_stick_std: {
        title: "Tapper: Std. N/S Stick",
        showOpenStrings: true, // NS can play open strings
        stringDisplayWidths: [
            0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5
        ],
        stringIntervals: [
            _x-2, _x-7, _x-12, _x-17, _x-22, _x-27, _x-32, _x-37
        ],
        markerOffset: -1, //  0 or 'X' fret in diagrams
        markers: [3, 8, 13, 18], // inlays every 5 frets
    }

}
