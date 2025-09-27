export function setSliderProgress(slider) {
    if (!slider) return;
    const pct = Math.round(slider.value / 255 * 100);
    slider.style.setProperty('--slider-progress', pct + '%');
}

// initialize progress for a list of elements
export function initSliderProgressList(list) {
    list.forEach(idOrEl => {
        const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
        if (el) setSliderProgress(el);
    });
}

export function updateAllSliders() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => setSliderProgress(slider));
}