export const name = "Ember";

const config = {
    flameColumnCount: 15,
    particleDensity: 20,
    particleSize: 6,
    particleJitter: 1.5,
    riseSpeed: 1.8,
    fadeSpeed: 0.018,
    reactivityMultiplier: 2.5
};

let emberParticles = [];

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
    if (analyser.fftSize !== 256) {
        analyser.fftSize = 256;
    }
    canvasCtx.clearRect(0, 0, logicalWidth, logicalHeight);
    const bufferLength = analyser.frequencyBinCount;

    const baseColor = themeColors.visualizer.visuals.ember[0];
    const peakColor = themeColors.visualizer.visuals.ember[1];

    const baseHsl = getHslComponents(baseColor);
    const peakHsl = getHslComponents(peakColor);

    const hueStart = baseHsl.h;
    const hueEnd = peakHsl.h;
    const lightnessMin = baseHsl.l;
    const lightnessMax = peakHsl.l;
    const saturation = baseHsl.s;

    const hueRange = hueEnd - hueStart;
    const lightnessRange = lightnessMax - lightnessMin;

    for (let i = emberParticles.length - 1; i >= 0; i--) {
        const p = emberParticles[i];
        p.y += p.velocityY;
        p.x += p.velocityX;
        p.alpha -= config.fadeSpeed;
        p.radius *= 0.96;

        if (p.alpha <= 0 || p.radius <= 0.5 || p.y < 0) {
            emberParticles.splice(i, 1);
        } else {
            canvasCtx.beginPath();
            const grad = canvasCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            
            const currentParticleSaturation = saturation;

            grad.addColorStop(0, `hsla(${p.startHue - 10}, ${currentParticleSaturation}%, ${lightnessMax}%, ${p.alpha})`);
            grad.addColorStop(0.5, `hsla(${p.startHue}, ${currentParticleSaturation}%, ${p.lightness}%, ${p.alpha * 0.7})`);
            grad.addColorStop(1, `hsla(${p.startHue + 20}, ${currentParticleSaturation}%, ${lightnessMin}%, 0)`);
            
            canvasCtx.fillStyle = grad;
            canvasCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            canvasCtx.fill();
        }
    }

    const barWidth = logicalWidth / config.flameColumnCount;
    const samplesPerBar = Math.floor(bufferLength / config.flameColumnCount);
    if (samplesPerBar === 0) return;

    for (let i = 0; i < config.flameColumnCount; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
            const index = i * samplesPerBar + j;
            if (index < bufferLength) {
                sum += dataArray[index];
            }
        }
        let avgHeight = sum / samplesPerBar;
        
        avgHeight *= config.reactivityMultiplier; 

        const particlesToSpawn = Math.floor(avgHeight / config.particleDensity);
        
        for (let k = 0; k < particlesToSpawn; k++) {
            if (Math.random() < 0.7) {
                const x = (i * barWidth) + (Math.random() * barWidth);
                const y = logicalHeight - (Math.random() * avgHeight * 0.8); 

                const particleStartHue = hueStart + Math.random() * hueRange;
                const particleLightness = lightnessMin + Math.random() * lightnessRange;

                const radius = (Math.random() * config.particleSize + 2) * (1 + avgHeight / 255);
                
                const velocityY = -(Math.random() * config.riseSpeed + 1.0);
                
                const velocityX = (Math.random() - 0.5) * config.particleJitter;

                emberParticles.push({
                    x: x,
                    y: y,
                    radius: radius,
                    velocityY: velocityY,
                    velocityX: velocityX,
                    alpha: Math.random() * 0.6 + 0.4,
                    lightness: particleLightness,
                    startHue: particleStartHue
                });
            }
        }
    }
}

export function reset() {
    emberParticles = [];
}