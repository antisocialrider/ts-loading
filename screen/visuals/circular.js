export const name = "Circular";

const config = {
    barCount: 180,
    innerRadius: 20,
    lineWidth: 5,
    heightMultiplier: 2.1,
    corePulseMultiplier: 30,
    radiusPulseMultiplier: 100,
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
    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;
    
    const coreColor = themeColors.visualizer.visuals.circular[0];
    const spokeAccentColor = themeColors.visualizer.visuals.circular[1];

    const coreHsl = getHslComponents(coreColor);
    const spokeAccentHsl = getHslComponents(spokeAccentColor);

    const generalHueStart = themeColors.visualizer.settings.hue[0];
    const generalHueEnd = themeColors.visualizer.settings.hue[1];
    const generalSaturation = themeColors.visualizer.settings.saturation;

    const generalHueRange = generalHueEnd - generalHueStart;


    const ringCount = 3;
    const baseRingRadius = 10;
    for (let i = 1; i <= ringCount; i++) {
        canvasCtx.beginPath();
        const radius = baseRingRadius * i + smoothedBass * (config.corePulseMultiplier / i);
        
        const coreGradient = canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        coreGradient.addColorStop(0, coreColor);
        coreGradient.addColorStop(1, `hsla(${coreHsl.h}, ${coreHsl.s}%, ${coreHsl.l}%, 0)`); 
        
        canvasCtx.strokeStyle = coreGradient;
        canvasCtx.lineWidth = 2;
        canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        canvasCtx.stroke();
    }


    const radius = config.innerRadius + smoothedBass * config.radiusPulseMultiplier;
    const angleStep = (2 * Math.PI) / config.barCount;

    for (let i = 0; i < config.barCount; i++) {
        const dataIndex = Math.floor((i / config.barCount) * bufferLength);
        if (dataIndex >= bufferLength || dataIndex < 0) continue; 
        const barHeight = dataArray[dataIndex] * config.heightMultiplier;
        const angle = i * angleStep;

        const x1 = centerX + radius * Math.cos(angle);
        const y1 = centerY + radius * Math.sin(angle);
        const x2 = centerX + (radius + barHeight) * Math.cos(angle);
        const y2 = centerY + (radius + barHeight) * Math.sin(angle);
        
        const currentHue = generalSaturation === 0 ? spokeAccentHsl.h : generalHueStart + (barHeight / 256) * generalHueRange;

        const gradient = canvasCtx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `hsla(${currentHue}, ${spokeAccentHsl.s}%, ${spokeAccentHsl.l}%, 0)`);
        gradient.addColorStop(0.5, spokeAccentColor);
        gradient.addColorStop(1, `hsla(${currentHue}, ${spokeAccentHsl.s}%, ${spokeAccentHsl.l}%, 0)`);
        canvasCtx.strokeStyle = gradient;
        
        canvasCtx.lineWidth = config.lineWidth;
        canvasCtx.lineCap = 'round';

        canvasCtx.beginPath();
        canvasCtx.moveTo(x1, y1);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.stroke();
    }
}

export function reset() { }