export const palette = {
    name: "Sunset Glow",
    previewColors: [
        '#3A040E',
        '#FF5733',
        '#FF3366',
        '#FFC300'
    ],
    ui: {
        backgrounds: ['#3A040E', 'rgba(58, 4, 14, 0.8)'],
        colours: ['#FF5733', '#FF3366'],
        texts: ['#FFC300', '#F0E68C'],
        sliders: ['#5E161C', '#FF5733', '#8B2E33'],
        buttons: ['#FF3366', '#C70039'],
    },
    visualizer: {
        visuals: {
            default: ['#FF5733', '#FFC300'],
            bars: ['#FF5733', '#FFC300'],
            ember: ['#FFC300', '#FF5733'],
            circular: ['#FFC300', '#FF5733'],
            pulse: ['#FFC300', '#FF5733'],
            polygon: ['#FF5733', '#FFC300'],
        },
        settings: {
            hue: [10, 60],
            lightness: [30, 90],
            saturation: 90,
        }
    }
};