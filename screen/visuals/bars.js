export const name = "Bars";

const config = {
    barCount: 236,
    barSpacing: 2,
    heightMultiplier: 3.0,
};

function getHslComponents(colorString) {
    const el = document.createElement('div');
    el.style.color = colorString;
    document.body.appendChild(el);
    const computedColor = getComputedStyle(el).color;
    document.body.removeChild(el);

    const rgbaMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (!rgbaMatch) {
        return { h: 0, s: 0, l: 0 };
    }

    let r = parseInt(rgbaMatch[1]) / 255;
    let g = parseInt(rgbaMatch[2]) / 255;
    let b = parseInt(rgbaMatch[3]) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}


export function draw(canvasCtx, dataArray, smoothedBass, analyser, themeColors, logicalWidth, logicalHeight) {
    if (analyser.fftSize !== 2048) {
        analyser.fftSize = 2048;
    }
    
    canvasCtx.clearRect(0, 0, logicalWidth, logicalHeight);
    const bufferLength = analyser.frequencyBinCount;
    const centerY = logicalHeight / 2;

    const barWidth = (logicalWidth - (config.barCount * config.barSpacing)) / config.barCount;

    let barX = 0;

    const baseColor = themeColors.visualizer.visuals.bars[0];
    const peakColor = themeColors.visualizer.visuals.bars[1];

    const baseHsl = getHslComponents(baseColor);
    const peakHsl = getHslComponents(peakColor);

    const hueRange = peakHsl.h - baseHsl.h;
    const lightnessRange = peakHsl.l - baseHsl.l;
    const saturationRange = peakHsl.s - baseHsl.s;

    const samplesPerBar = Math.floor(bufferLength / config.barCount); 
    if (samplesPerBar === 0) return;

    for (let i = 0; i < config.barCount; i++) {
        let sum = 0;
        
        for (let j = 0; j < samplesPerBar; j++) {
            const index = i * samplesPerBar + j;
            if (index < bufferLength) {
                sum += dataArray[index];
            }
        }
        const avgFrequency = sum / samplesPerBar;

        const barHeight = avgFrequency * config.heightMultiplier;

        const currentHue = baseHsl.h + (avgFrequency / 255) * hueRange;
        const currentSaturation = baseHsl.s + (avgFrequency / 255) * saturationRange;
        const currentLightness = baseHsl.l + (avgFrequency / 255) * lightnessRange;
        
        canvasCtx.fillStyle = `hsl(${currentHue}, ${currentSaturation}%, ${currentLightness}%)`;
        
        canvasCtx.fillRect(barX, centerY - barHeight / 2, barWidth, barHeight);

        barX += barWidth + config.barSpacing;
    }
}

export function reset() { }