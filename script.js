import * as slider from './scripts/slider.js';
import * as db from './scripts/database.js';
import { signInUI, addLoginUIEventListener } from './scripts/auth.js';

document.addEventListener("DOMContentLoaded", function() {

    setControlsEnabled(false);
    signInUI();

    // Firebase id
    if (!window.DMX_DEVICE_ID) {
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
    //const colorShiftSlider = document.getElementById("color_shift");

    const sliders = [intensitySlider, redSlider, greenSlider, blueSlider, amberSlider, violetSlider, whiteSlider, strobeSlider];

    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.style.display = 'none';
            setControlsEnabled(true);
            initAfterAuth(sliders);
        } else {
            const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.style.display = 'flex';
            setControlsEnabled(false);
        }
    });

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

    function sendDMXData() {
        if (window.__dmx_init_in_progress) return;
        slider.updateAllSliders()
        const data = {
            ...sliders.reduce((acc, s) => {
                if (!s) return acc;
                return { ...acc, [s.id]: parseInt(s.value) || 0 };
            }, {}),
            ts: Date.now()
        };
        console.log('DMX Data:', data);

        db.setState(data);
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    function rgbToDmxExtended(hex) {
        const { r, g, b } = hexToRgb(hex);
        let w = 0;
        let a = 0;
        let v = 0;

        // Calculate amber and violet tones based on color dominance
        if (r > g && r > b) {
            a = Math.min(255, r * 0.5);
        } else if (b > r && b > g) {
            v = Math.min(255, b * 0.5);
        }

        return {
            red: r,
            green: g,
            blue: b,
            white: w,
            amber: a,
            violet: v
        };
    }

    slider.updateAllSliders();
    getLatestStateFromFirebaseAndApply(sliders);
    addLoginUIEventListener();

    function initAfterAuth() {
        colorPicker.addEventListener("input", updateColor);
        sliders.forEach(slider => {
            slider.addEventListener("input", sendDMXData);
    });
}

});



function getLatestStateFromFirebaseAndApply(sliders) {
    (async function() {
        const data = await db.fetchState();
        if (data) applyState(data,sliders);
    })();
}

function applyState(data,sliders) {
    console.log('Applying initial state from Firebase:', data);
    if (!data) return;
    window.__dmx_init_in_progress = true;
    try {
        sliders.forEach(slider => {
            slider.value = data[slider.id] || 0;
        });
        slider.updateAllSliders();
    } finally {
        setTimeout(() => { window.__dmx_init_in_progress = false; }, 50);
    }
}

// disable controls until signed in
function setControlsEnabled(enabled) {
  const els = document.querySelectorAll('input, button, select, textarea');
  els.forEach(el => {
    if (el.id === 'login-btn' || el.closest('#login-overlay')) return;
    el.disabled = !enabled;
  });
}