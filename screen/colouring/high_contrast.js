export const palette = {
    name: "High Contrast",
    previewColors: [
        '#000000',
        '#FFD700',
        '#FFFFFF',
        '#000000'
    ],
    ui: {
        backgrounds: ['#000000', 'rgba(0, 0, 0, 0.95)'],
        colours: ['#FFD700', '#FFFFFF'],
        texts: ['#FFFFFF', '#000000'],
        sliders: ['#333333', '#FFD700', '#666666'],
        buttons: ['#FFFFFF', '#DDDDDD'],
    },
    visualizer: {
        visuals: {
            default: ['#FFFFFF', '#FFD700'],
            bars: ['#FFFFFF', '#FFD700'],
            ember: ['#FFFFFF', '#FFD700'],
            circular: ['#FFFFFF', '#FFD700'],
            pulse: ['#FFFFFF', '#FFD700'],
            polygon: ['#FFFFFF', '#FFD700'],
        },
        settings: {
            hue: [50, 50],
            lightness: [10, 95],
            saturation: 100,
        }
    }
};