export const palette = {
    name: "Vibrant Pop",
    previewColors: [
        '#1E1E1E',
        '#FF0000',
        '#0000FF',
        '#FFFF00'
    ],
    ui: {
        backgrounds: ['#1E1E1E', 'rgba(30, 30, 30, 0.8)'],
        colours: ['#FF0000', '#00FF00'],
        texts: ['#FFFF00', '#0000FF'],
        sliders: ['#333333', '#FF0000', '#555555'],
        buttons: ['#0000FF', '#0000CC'],
    },
    visualizer: {
        visuals: {
            default: ['#FF0000', '#00FFFF'],
            bars: ['#FF0000', '#00FFFF'],
            ember: ['#00FF00', '#FFFF00'],
            circular: ['#FFFF00', '#FF0000'],
            pulse: ['#FFFF00', '#FF0000'],
            polygon: ['#FF0000', '#00FF00'],
        },
        settings: {
            hue: [0, 360],
            lightness: [30, 90],
            saturation: 100,
        }
    }
};