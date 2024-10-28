document.addEventListener("DOMContentLoaded", function() {
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
            intensity: parseInt(intensitySlider.value),
            red: parseInt(redSlider.value),
            green: parseInt(greenSlider.value),
            blue: parseInt(blueSlider.value),
            white: parseInt(document.getElementById("white").value),
            amber: parseInt(amberSlider.value),
            violet: parseInt(violetSlider.value),
            strobe: parseInt(document.getElementById("strobe").value),
            color_shift: parseInt(document.getElementById("color_shift").value),
        };

        fetch('http://192.168.0.33:5000/api/set_color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
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
