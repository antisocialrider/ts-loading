export const palette = {
    name: "Black & White",
    previewColors: [
        '#000000',
        '#FFFFFF',
        '#404040',
        '#A0A0A0'
    ],
    ui: {
        backgrounds: ['#000000', 'rgba(30, 30, 30, 0.8)'],
        colours: ['#FFFFFF', '#C0C0C0'],
        texts: ['#FFFFFF', '#A0A0A0'],
        sliders: ['#333333', '#808080', '#666666'],
        buttons: ['#404040', '#606060'],
    },
    visualizer: {
        visuals: {
            default: ['#A0A0A0', '#FFFFFF'],
            bars: ['#A0A0A0', '#FFFFFF'],
            ember: ['#A0A0A0', '#FFFFFF'],
            circular: ['#A0A0A0', '#FFFFFF'],
            pulse: ['#FFFFFF', '#A0A0A0'],
            polygon: ['#A0A0A0', '#FFFFFF'],
        },
        settings: {
            hue: [0, 0],
            lightness: [10, 90],
            saturation: 0,
        }
    }
};