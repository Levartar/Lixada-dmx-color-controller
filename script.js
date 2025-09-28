import * as slider from './slider.js';
import * as db from './database.js';

document.addEventListener("DOMContentLoaded", function() {
    // Ensure the UI uses the configured device id from index.html
    if (!window.DMX_DEVICE_ID) {
        // messagingSenderId from your firebase config in index.html
        window.DMX_DEVICE_ID = '290688576796';
    }
    const colorPicker = document.getElementById("color-picker");
    const intensitySlider = document.getElementById("intensity");
    const redSlider = document.getElementById("red");
    const greenSlider = document.getElementById("green");
    const blueSlider = document.getElementById("blue");
    const amberSlider = document.getElementById("amber");
    const violetSlider = document.getElementById("violet");
    const whiteSlider = document.getElementById("white");
    const strobeSlider = document.getElementById("strobe");
    const colorShiftSlider = document.getElementById("color_shift");

    const sliders = [intensitySlider, redSlider, greenSlider, blueSlider, amberSlider, violetSlider, whiteSlider, strobeSlider, colorShiftSlider];


    // Update DMXcolor on ColorPicker change
    function updateColor() {
        const { red, green, blue, amber, violet } = rgbToDmxExtended(colorPicker.value);
        redSlider.value = red;
        greenSlider.value = green;
        blueSlider.value =blue;
        amberSlider.value = amber;
        violetSlider.value = violet;
        sendDMXData();
    }

    // Send DMX Data on each slider change
    function sendDMXData() {
        if (window.__dmx_init_in_progress) return;
        slider.updateAllSliders()
        const data = {
            intensity: parseInt(intensitySlider.value) || 0,
            red: parseInt(redSlider.value) || 0,
            green: parseInt(greenSlider.value) || 0,
            blue: parseInt(blueSlider.value) || 0,
            white: parseInt(whiteSlider.value) || 0,
            amber: parseInt(amberSlider.value) || 0,
            violet: parseInt(violetSlider.value) || 0,
            strobe: parseInt(strobeSlider.value) || 0,
            color_shift: parseInt(colorShiftSlider.value) || 0,
            ts: Date.now()
        };
        console.log('DMX Data:', data);

        db.setState(data);
    }

    // Convert hex color to RGB
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    // Function to convert RGB values to DMX format with white, amber, and violet adjustments
    function rgbToDmxExtended(hex) {
        const { r, g, b } = hexToRgb(hex);
        let white = 0;
        let amber = 0;
        let violet = 0;

        // Calculate the white component for balanced RGB
        //white = Math.min(r, g, b);
        const red = r;
        const green = g;
        const blue = b;

        // Calculate amber and violet tones based on color dominance
        if (red > green && red > blue) {
            amber = Math.min(255, red * 0.5);
        } else if (blue > red && blue > green) {
            violet = Math.min(255, blue * 0.5);
        }

        console.log(red,green,blue,white,amber,violet)

        return {
            red: red,
            green: green,
            blue: blue,
            white: white,
            amber: amber,
            violet: violet
        };
    }

    // Inits
    colorPicker.addEventListener("input", updateColor);
    sliders.forEach(slider => {
        slider.addEventListener("input", sendDMXData);
    });

    slider.updateAllSliders();
    // fetch and apply the last command from Firebase on load (if available)
    (async function() {
        const data = await db.fetchState();
        if (data) applyState(data,sliders);
    })();
});

// Apply a state object to the UI (without emitting it back to Firebase)
function applyState(data,sliders) {
    console.log('Applying initial state from Firebase:', data);
    if (!data) return;
    // avoid triggering writes while applying
    window.__dmx_init_in_progress = true;
    try {
        // selectors are in the enclosing module scope
        sliders.forEach(slider => {
            slider.value = data[slider.id] || 0;
        });
        slider.updateAllSliders();
    } finally {
        // small timeout to ensure any browser events settle
        setTimeout(() => { window.__dmx_init_in_progress = false; }, 50);
    }
}