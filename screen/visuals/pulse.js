export const name = "Pulse";

const config = {
    circleCount: 5,
    baseRadius: 40,
    radiusMultiplier: 2.4,
    minThickness: 1,
    maxThickness: 4,
    pulseSpeed: 0.03,
    alphaDecay: 0.01,
    minPulseVisible: 0.2
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

let pulsePhase = 0;
let circlePulseProperties = [];

export function draw(canvasCtx, dataArray, smoothedBass, analyser, themeColors, logicalWidth, logicalHeight) {
    if (analyser.fftSize !== 256) {
        analyser.fftSize = 256;
    }

    canvasCtx.clearRect(0, 0, logicalWidth, logicalHeight);

    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;
    const maxDimension = Math.min(logicalWidth, logicalHeight);
    const maxRadius = maxDimension / 2;

    const baseColor = themeColors.visualizer.visuals.pulse[0];
    const accentColor = themeColors.visualizer.visuals.pulse[1];

    const baseHsl = getHslComponents(baseColor);
    const accentHsl = getHslComponents(accentColor);

    const hueRange = accentHsl.h - baseHsl.h;
    const saturationRange = accentHsl.s - baseHsl.s;
    const lightnessRange = accentHsl.l - baseHsl.l;

    pulsePhase += config.pulseSpeed;

    const currentPulseMagnitude = Math.max(config.minPulseVisible, smoothedBass * config.radiusMultiplier);
    
    const overallAlphaScale = smoothedBass > 0.05 ? 1 : 0.7;

    if (circlePulseProperties.length === 0) {
        for (let i = 0; i < config.circleCount; i++) {
            circlePulseProperties.push({
                pulseOffset: Math.random() * Math.PI * 2,
                initialDelay: Math.random() * config.circleCount
            });
        }
    }

    for (let i = 0; i < config.circleCount; i++) {
        canvasCtx.beginPath();

        const circleProps = circlePulseProperties[i];
        
        const radiusProgress = ((i + pulsePhase + circleProps.pulseOffset + circleProps.initialDelay) / config.circleCount) % 1;
        
        let radius = config.baseRadius + radiusProgress * maxRadius * currentPulseMagnitude;
        radius = Math.min(radius, maxRadius);

        const interpolatedHue = baseHsl.h + radiusProgress * hueRange;
        const interpolatedSaturation = baseHsl.s + radiusProgress * saturationRange;
        const interpolatedLightness = baseHsl.l + radiusProgress * lightnessRange;

        let alpha = Math.max(0, 1 - radiusProgress - (config.alphaDecay * i / config.circleCount));
        alpha = Math.min(1, alpha);
        alpha *= overallAlphaScale;

        canvasCtx.strokeStyle = `hsla(${interpolatedHue}, ${interpolatedSaturation}%, ${interpolatedLightness}%, ${alpha})`;
        canvasCtx.lineWidth = config.minThickness + (1 - radiusProgress) * (config.maxThickness - config.minThickness);

        if (radius > 0 && alpha > 0.01 && canvasCtx.lineWidth > 0) {
             canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
             canvasCtx.stroke();
        }
    }
}

export function reset() {
    pulsePhase = 0;
    circlePulseProperties = [];
}