document.addEventListener("DOMContentLoaded", function() {
    // Ensure the UI uses the configured device id from index.html
    if (!window.DMX_DEVICE_ID) {
        // messagingSenderId from your firebase config in index.html
        window.DMX_DEVICE_ID = '290688576796';
    }
    const intensitySlider = document.getElementById("intensity");
    const colorPicker = document.getElementById("color-picker");
    const redSlider = document.getElementById("red");
    const greenSlider = document.getElementById("green");
    const blueSlider = document.getElementById("blue");
    const amberSlider = document.getElementById("amber");
    const violetSlider = document.getElementById("violet");
    const additionalSliders = ["white", "strobe", "color_shift"];

    // Update DMX on color and intensity change
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
        const data = {
            intensity: parseInt(intensitySlider.value) || 0,
            red: parseInt(redSlider.value) || 0,
            green: parseInt(greenSlider.value) || 0,
            blue: parseInt(blueSlider.value) || 0,
            white: parseInt(document.getElementById("white").value) || 0,
            amber: parseInt(amberSlider.value) || 0,
            violet: parseInt(violetSlider.value) || 0,
            strobe: parseInt(document.getElementById("strobe").value) || 0,
            color_shift: parseInt(document.getElementById("color_shift").value) || 0,
            ts: Date.now()
        };

        // If firebase is available, write to the realtime DB under devices/<DEVICE_ID>/last_command
        if (window.firebase && firebase.database) {
            try {
                // DEVICE_ID must be set on the page or use a default
                const DEVICE_ID = window.DMX_DEVICE_ID || '290688576796';
                const dbRef = firebase.database().ref(`devices/${DEVICE_ID}/last_command`);
                dbRef.set(data).catch(err => console.error('Firebase write failed', err));
                return;
            } catch (e) {
                console.error('Firebase write error', e);
            }
        }
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

    // Return extended DMX color values
    return {
        red: red,
        green: green,
        blue: blue,
        white: white,
        amber: amber,
        violet: violet
    };
}

    // Event Listeners for sliders and color picker
    intensitySlider.addEventListener("input", sendDMXData);
    colorPicker.addEventListener("input", updateColor);
    redSlider.addEventListener("input", sendDMXData);
    greenSlider.addEventListener("input", sendDMXData);
    blueSlider.addEventListener("input", sendDMXData);
    additionalSliders.forEach(id => {
        document.getElementById(id).addEventListener("input", sendDMXData);
    });
});
