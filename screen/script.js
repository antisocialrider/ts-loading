import { CustomSlider } from './custom-slider.js';

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('startButton');
    const container = document.getElementById('container');
    const canvas = document.getElementById('visualizerCanvas');
    const canvasCtx = canvas.getContext('2d');
    const visualStyleContainer = document.getElementById('visual-style-container');
    const messageElement = document.querySelector('p');
    const startControls = document.getElementById('start-controls');
    const activeControls = document.getElementById('active-controls');
    const pauseButton = document.getElementById('pause-button');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const stopButton = document.getElementById('stop-button');
    const volumeSliderWrapper = document.getElementById('volume-slider-wrapper');
    const volumeSliderHiddenInput = document.getElementById('volume-slider');
    const eqToggleBtn = document.getElementById('eq-toggle-btn');
    const eqMenu = document.getElementById('eq-menu');
    const eqResetBtn = document.getElementById('eq-reset-btn');
    const eqBassSliderWrapper = document.getElementById('eq-bass-slider-wrapper');
    const eqBassHiddenInput = document.getElementById('eq-bass');
    const eqLowMidSliderWrapper = document.getElementById('eq-low-mid-slider-wrapper');
    const eqLowMidHiddenInput = document.getElementById('eq-low-mid');
    const eqMidSliderWrapper = document.getElementById('eq-mid-slider-wrapper');
    const eqMidHiddenInput = document.getElementById('eq-mid');
    const currentSongDisplayButton = document.getElementById('current-song-display-button');
    const currentSongTextSpan = document.querySelector('#current-song-display-button .current-song-text');
    const songListContainer = document.getElementById('song-list-container');
    const songChevron = document.getElementById('song-chevron');

    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const eqHighMidSliderWrapper = document.getElementById('eq-high-mid-slider-wrapper');
    const eqHighMidHiddenInput = document.getElementById('eq-high-mid');
    const eqTrebleSliderWrapper = document.getElementById('eq-treble-slider-wrapper');
    const eqTrebleHiddenInput = document.getElementById('eq-treble');
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsIconGear = document.getElementById('settings-icon-gear');
    const settingsIconX = document.getElementById('settings-icon-x');

    const accordionVisualsBtn = document.getElementById('accordion-visuals');
    const accordionThemesBtn = document.getElementById('accordion-themes');
    const accordionBackgroundImagesBtn = document.getElementById('accordion-background-images');
    const sourceDesktopRadio = document.getElementById('source-desktop');
    const sourceFileRadio = document.getElementById('source-file');

    const themeContainer = document.getElementById('theme-container');
    const chevronVisuals = document.getElementById('chevron-visuals');
    const chevronThemes = document.getElementById('chevron-themes');
    const backgroundImagesAccordionSection = document.getElementById('background-image-accordion-section');
    const backgroundImageContainer = document.getElementById('background-image-container');
    const chevronBackgroundImages = document.getElementById('chevron-background-images');
    const noBackgroundImageBtn = document.getElementById('no-background-image-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const loadingStatusText = document.getElementById('loadingStatusText');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const serverInfoPanel = document.getElementById('server-info-panel');
    const dynamicInfoContent = document.getElementById('dynamic-info-content');

    const AppState = {
        visuals: {},
        activeVisualId: null,
        activeThemeId: null,
        themes: {},
        themeColors: null,
        eqVisualGains: [0, 0, 0, 0, 0],
        volumeGain: 0.25,
        backgroundHue: 0,
        backgroundSaturation: 0,
        backgroundLightness: 0,
        activeBackgroundImage: null,
        backgroundImages: [],
        audioFiles: [],
        currentAudioIndex: -1,
        useDesktopAudio: false,
        isSongListOpen: false,
        loadingText: 'Starting loading screen...',
        loadingProgress: 0,
        currentLogMessage: '',
        currentLoadAction: '',
        playerName: 'Connecting...',
        serverName: 'Server Name',
        playerCount: 0,
        serverWelcomeMessage: 'Welcome to ${serverName}, ${playerName}!'
    };

    let audioContext = null;
    let analyser = null;
    let fileSourceNode = null;
    let desktopSourceNode = null;
    let animationFrameId;
    let isStarted = true;
    let isPaused = false;
    let mediaStream = null;
    let smoothedBass = 0;
    let customVolumeSlider;
    let customEqSliders = [];

    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    let saveTimer;
    function debounceSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveSettings, 500);
    }

    function saveSettings() {
        localStorage.setItem('ts_visual_id', AppState.activeVisualId);
        localStorage.setItem('ts_theme_id', AppState.activeThemeId);
        localStorage.setItem('ts_bg_image_url', AppState.activeBackgroundImage || 'none');
        localStorage.setItem('ts_audio_index', AppState.currentAudioIndex.toString());
        localStorage.setItem('ts_volume', AppState.volumeGain.toString());
        localStorage.setItem('ts_eq_gains', JSON.stringify(AppState.eqVisualGains));
        localStorage.setItem('ts_use_desktop_audio', AppState.useDesktopAudio ? 'true' : 'false');
    }

    function loadSettings() {
        const savedVisualId = localStorage.getItem('ts_visual_id');
        if (savedVisualId && AppState.visuals[savedVisualId]) {
            AppState.activeVisualId = savedVisualId;
        }

        const savedThemeId = localStorage.getItem('ts_theme_id');
        if (savedThemeId && AppState.themes[savedThemeId]) {
            AppState.activeThemeId = savedThemeId;
        }

        const savedBgImageUrl = localStorage.getItem('ts_bg_image_url');
        if (savedBgImageUrl !== null) {
            if (savedBgImageUrl === 'none') {
                AppState.activeBackgroundImage = null;
            } else {
                const foundImage = AppState.backgroundImages.find(img => img.url === savedBgImageUrl);
                AppState.activeBackgroundImage = foundImage ? foundImage.url : null;
            }
        }

        const savedAudioIndexStr = localStorage.getItem('ts_audio_index');
        const savedAudioIndex = savedAudioIndexStr ? parseInt(savedAudioIndexStr, 10) : null;
        if (savedAudioIndex !== null && AppState.audioFiles[savedAudioIndex]) {
            AppState.currentAudioIndex = savedAudioIndex;
        }

        const savedVolumeStr = localStorage.getItem('ts_volume');
        const savedVolume = savedVolumeStr ? parseFloat(savedVolumeStr) : null;
        if (savedVolume !== null) {
            AppState.volumeGain = savedVolume;
        }

        const savedEqGains = localStorage.getItem('ts_eq_gains');
        if (savedEqGains) {
            try {
                const parsedGains = JSON.parse(savedEqGains);
                if (Array.isArray(parsedGains) && parsedGains.length === 5 && parsedGains.every(val => typeof val === 'number')) {
                    AppState.eqVisualGains = parsedGains;
                }
            } catch (e) {
                console.error("Error parsing saved EQ gains from localStorage:", e);
            }
        }

        const savedUseDesktopAudio = localStorage.getItem('ts_use_desktop_audio');
        if (savedUseDesktopAudio !== null) {
            AppState.useDesktopAudio = (savedUseDesktopAudio === 'true');
        }
    }

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

    function applyCssVariables(obj, prefix = '') {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'object' && !Array.isArray(value)) {
                    applyCssVariables(value, `${prefix}${key}-`);
                } else if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (typeof item === 'string') {
                            document.documentElement.style.setProperty(`--${prefix}${key}-${index}`, item);
                            try {
                                const tempDiv = document.createElement('div');
                                tempDiv.style.color = item;
                                document.body.appendChild(tempDiv);
                                const computedColor = getComputedStyle(tempDiv).color;
                                document.body.removeChild(tempDiv);
                                const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
                                if (rgbMatch) {
                                    document.documentElement.style.setProperty(`--${prefix}${key}-${index}-rgb`, `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`);
                                }
                            } catch (e) {
                            }
                        }
                    });
                } else if (typeof value === 'string') {
                    document.documentElement.style.setProperty(`--${prefix}${key}`, value);
                    try {
                        const tempDiv = document.createElement('div');
                        tempDiv.style.color = value;
                        document.body.appendChild(tempDiv);
                        const computedColor = getComputedStyle(tempDiv).color;
                        document.body.removeChild(tempDiv);
                        const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
                        if (rgbMatch) {
                            document.documentElement.style.setProperty(`--${prefix}${key}-rgb`, `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`);
                        }
                    } catch (e) {
                    }
                }
            }
        }
    }

    async function loadModulesFromManifest() {
        try {
            const response = await fetch('./manifest.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const manifest = await response.json();

            AppState.activeVisualId = manifest.activeVisualId || 'bars';
            AppState.activeThemeId = manifest.activeThemeId || 'default';
            const defaultBackgroundImageId = manifest.defaultBackgroundImageId || null;
            const defaultAudioFileId = manifest.defaultAudioFileId || null;
            AppState.useDesktopAudio = manifest.useDesktopAudio || false;
            AppState.volumeGain = manifest.defaultVolume !== undefined ? parseFloat(manifest.defaultVolume) : 0.25;

            AppState.visuals = {};
            if (manifest.visuals) {
                const visualPromises = manifest.visuals.map(async (visualConfig) => {
                    const visualPath = `./visuals/${visualConfig.id}.js`;
                    const module = await import(visualPath);
                    AppState.visuals[visualConfig.id] = {
                        id: visualConfig.id,
                        name: module.name,
                        path: visualPath,
                        module: module
                    };
                });
                await Promise.all(visualPromises);
            }

            AppState.themes = {};
            if (manifest.themes) {
                const themePromises = manifest.themes.map(async (themeConfig) => {
                    const themePath = `./colouring/${themeConfig.id}.js`;
                    const module = await import(themePath);
                    AppState.themes[themeConfig.id] = {
                        id: themeConfig.id,
                        name: module.palette.name,
                        path: themePath,
                        previewColors: module.palette.previewColors,
                        module: module
                    };
                });
                await Promise.all(themePromises);
            }

            AppState.backgroundImages = Array.isArray(manifest.backgroundImages)
                ? manifest.backgroundImages.map(img => ({
                    id: img.id,
                    name: img.name,
                    url: `./images/${img.id}.png`
                }))
                : [];

            AppState.audioFiles = Array.isArray(manifest.audioFiles)
                ? manifest.audioFiles.map(audio => ({
                    id: audio.id,
                    name: audio.name,
                    url: `./audio/${audio.id}.mp3`
                }))
                : [];

            if (sourceDesktopRadio && sourceFileRadio) {
                sourceDesktopRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = true;
                    stopVisualization();
                    saveSettings();
                });
                sourceFileRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = false;
                    stopVisualization();
                    saveSettings();
                });
            }

            if (!AppState.useDesktopAudio && AppState.audioFiles.length > 0) {
                const defaultAudioIndex = AppState.audioFiles.findIndex(audio => audio.id === defaultAudioFileId);
                if (defaultAudioIndex !== -1) {
                    AppState.currentAudioIndex = defaultAudioIndex;
                } else {
                    AppState.currentAudioIndex = 0;
                }
            } else {
                AppState.currentAudioIndex = -1;
            }

        } catch (error) {
            console.error("Error loading manifest:", error);
            if (visualStyleContainer) {
                visualStyleContainer.innerHTML = `<p class="p-2 text-sm text-red-500">Could not load visuals.</p>`;
            }
            if (themeContainer) {
                themeContainer.innerHTML = `<p class="p-2 text-sm text-red-500">Could not load themes.</p>`;
            }
            if (backgroundImagesAccordionSection) {
                backgroundImagesAccordionSection.innerHTML = `<p class="p-2 text-sm text-red-500">Could not load background images.</p>`;
            }
        }
    }

    async function loadAndApplyTheme(themeId) {
        const theme = AppState.themes[themeId];
        if (!theme || !theme.module) {
            console.warn(`Theme with ID "${themeId}" not found or module not loaded.`);
            return;
        }

        try {
            AppState.themeColors = theme.module.palette;
            AppState.activeThemeId = themeId;
            applyCssVariables(AppState.themeColors.ui, 'ui-');
            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h;
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l;

            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;

            if (!AppState.activeBackgroundImage) {
                document.body.style.backgroundImage = 'none';
            }

            resizeCanvas();

            document.querySelectorAll('#theme-container button').forEach(btn => {
                btn.classList.remove('theme-button-active');
            });
            const activeButton = document.getElementById(`theme-${themeId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }
            saveSettings();
        } catch (error) {
            console.error("Error applying theme:", error);
        }
    }

    function setupVisualizerButtons() {
        if (!visualStyleContainer) { return; }
        visualStyleContainer.innerHTML = '';
        for (const id in AppState.visuals) {
            const visual = AppState.visuals[id];
            const button = document.createElement('button');
            button.id = `style-${id}`;
            button.textContent = visual.name;
            button.className = 'w-full text-left px-3 py-2 text-sm rounded-md focus:outline-none theme-button-normal theme-accordion-button';
            if (id === AppState.activeVisualId) {
                button.classList.add('theme-button-active');
            }

            button.addEventListener('click', () => {
                AppState.activeVisualId = id;
                document.querySelectorAll('#visual-style-container button').forEach(btn => {
                    btn.classList.remove('theme-button-active');
                });
                button.classList.add('theme-button-active');
                saveSettings();
            });
            visualStyleContainer.appendChild(button);
        }
    }

    function setupThemeButtons() {
        if (!themeContainer) { return; }
        themeContainer.innerHTML = '';
        for (const id in AppState.themes) {
            const theme = AppState.themes[id];
            const button = document.createElement('button');
            button.id = `theme-${id}`;
            button.textContent = theme.name;
            button.className = 'w-full flex flex-row justify-between items-center text-left p-3 rounded-lg focus:outline-none theme-button-normal theme-accordion-button';
            if (theme.previewColors && Array.isArray(theme.previewColors)) {
                const colorSwatchContainer = document.createElement('div');
                colorSwatchContainer.className = 'flex space-x-1';
                theme.previewColors.forEach(color => {
                    const swatch = document.createElement('span');
                    swatch.className = 'w-4 h-4 rounded-full border border-gray-500';
                    swatch.style.backgroundColor = color;
                    colorSwatchContainer.appendChild(swatch);
                });
                button.appendChild(colorSwatchContainer);
            }

            if (id === AppState.activeThemeId) {
                button.classList.add('theme-button-active');
            }
            button.addEventListener('click', () => loadAndApplyTheme(id));
            themeContainer.appendChild(button);
        }
    }

    function setupBackgroundImageButtons() {
        if (!backgroundImageContainer || !backgroundImagesAccordionSection || !noBackgroundImageBtn) {
            console.warn("Missing background image elements (container, section, or no-image button). Skipping setup.");
            return;
        }

        if (AppState.backgroundImages.length > 0) {
            backgroundImagesAccordionSection.classList.remove('hidden');
        } else {
            backgroundImagesAccordionSection.classList.add('hidden');
            if (AppState.activeBackgroundImage !== null) {
                AppState.activeBackgroundImage = null;
                saveSettings();
            }
            applyBackgroundImage(null);
            return;
        }

        const existingButtons = Array.from(backgroundImageContainer.children);
        existingButtons.forEach(child => {
            if (child.id !== 'no-background-image-btn') {
                backgroundImageContainer.removeChild(child);
            }
        });

        if (noBackgroundImageBtn.parentNode === backgroundImageContainer) {
            backgroundImageContainer.removeChild(noBackgroundImageBtn);
        }

        AppState.backgroundImages.forEach(image => {
            const button = document.createElement('button');
            button.id = `bg-image-${image.id}`;
            button.textContent = image.name;
            button.className = 'w-full text-left px-3 py-2 text-sm rounded-md focus:outline-none theme-button-normal theme-accordion-button';

            if (AppState.activeBackgroundImage && AppState.activeBackgroundImage.includes(image.id)) {
                button.classList.add('theme-button-active');
            }

            backgroundImageContainer.appendChild(button);
            button.addEventListener('click', () => applyBackgroundImage(image.url));
        });

        backgroundImageContainer.appendChild(noBackgroundImageBtn);

        if (!AppState.activeBackgroundImage || AppState.activeBackgroundImage === 'none') {
            noBackgroundImageBtn.classList.add('theme-button-active');
        } else {
            noBackgroundImageBtn.classList.remove('theme-button-active');
        }
        noBackgroundImageBtn.addEventListener('click', () => applyBackgroundImage(null));
    }

    function applyBackgroundImage(imageUrl) {
        AppState.activeBackgroundImage = imageUrl;

        document.querySelectorAll('#background-image-container button').forEach(btn => {
            btn.classList.remove('theme-button-active');
        });

        if (imageUrl) {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';

            if (AppState.themeColors) {
                const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
                const hslComponents = getHslComponents(primaryBgColor);
                AppState.backgroundHue = hslComponents.h;
                AppState.backgroundSaturation = hslComponents.s;
                AppState.backgroundLightness = hslComponents.l;
                document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
            }

            const imgFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            const imageId = imgFileName.substring(0, imgFileName.lastIndexOf('.'));
            const activeButton = document.getElementById(`bg-image-${imageId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }

        } else {
            document.body.style.backgroundImage = 'none';
            if (AppState.themeColors) {
                const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
                const hslComponents = getHslComponents(primaryBgColor);
                AppState.backgroundHue = hslComponents.h;
                AppState.backgroundSaturation = hslComponents.s;
                AppState.backgroundLightness = hslComponents.l;
                document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
            } else {
                document.body.style.backgroundColor = '';
            }

            if (noBackgroundImageBtn) {
                noBackgroundImageBtn.classList.add('theme-button-active');
            }
        }
        saveSettings();
    }

    async function initializeAudioGraph() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.smoothingTimeConstant = 0.5;
        }
        if (!fileSourceNode) {
            fileSourceNode = audioContext.createMediaElementSource(audioPlayer);
        }
    }

    async function startAudioSource(type) {
        await initializeAudioGraph();

        if (fileSourceNode) { try { fileSourceNode.disconnect(analyser); } catch (e) { console.warn("Error disconnecting fileSourceNode:", e); } }
        if (desktopSourceNode) { try { desktopSourceNode.disconnect(analyser); } catch (e) { console.warn("Error disconnecting desktopSourceNode:", e); } }

        if (analyser && analyser.context && analyser.context.destination && analyser.context.state !== 'closed') {
            try {
                analyser.disconnect(analyser.context.destination);
            } catch (e) {
                console.warn("Error disconnecting analyser from destination:", e);
            }
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (type === 'file') {
            if (AppState.audioFiles.length === 0 || AppState.currentAudioIndex === -1) {
                if (messageElement) messageElement.textContent = "No audio files available to play.";
                console.warn("No audio files available to play.");
                return;
            }
            const fileUrl = AppState.audioFiles[AppState.currentAudioIndex].url;
            audioPlayer.src = fileUrl;
            fileSourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioPlayer.loop = false;
            audioPlayer.volume = AppState.volumeGain;
            audioPlayer.play().catch(e => {
                console.warn("Autoplay blocked for audio file:", e);
                if (messageElement) messageElement.textContent = "Audio blocked. Click anywhere to start music.";
                document.body.addEventListener('click', async function resumeAudio() {
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }
                    if (audioPlayer.paused) {
                        await audioPlayer.play();
                    }
                    if (messageElement) messageElement.textContent = '';
                    document.body.removeEventListener('click', resumeAudio);
                }, { once: true });
            });
            isPaused = false;
            updateCurrentSongDisplay();
            if (prevButton) prevButton.disabled = false;
            if (nextButton) nextButton.disabled = false;


        } else if (type === 'desktop') {
            try {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                audioPlayer.volume = 0;

                mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                if (mediaStream.getAudioTracks().length === 0) {
                    if (messageElement) messageElement.textContent = 'Audio not shared. Please try again and check the "Share audio" box.';
                    mediaStream.getVideoTracks().forEach(track => track.stop());
                    console.warn("Desktop audio not shared.");
                    return;
                }
                desktopSourceNode = audioContext.createMediaStreamSource(mediaStream);
                desktopSourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                isPaused = false;
                updateCurrentSongDisplay('Desktop Audio');
                if (prevButton) prevButton.disabled = true;
                if (nextButton) nextButton.disabled = true;

            } catch (err) {
                console.error("Could not access desktop audio:", err);
                if (messageElement) messageElement.textContent = 'Could not access desktop audio. Check browser permissions.';
                return;
            }
        }

        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (isStarted) {
            if (messageElement) messageElement.textContent = '';
            showActiveControls();
            resizeCanvas();
            draw();
        }

        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
    }

    function playNextAudio() {
        if (AppState.useDesktopAudio || AppState.audioFiles.length === 0) return;
        let newIndex = (AppState.currentAudioIndex + 1) % AppState.audioFiles.length;
        selectSong(newIndex);
    }

    function playPrevAudio() {
        if (AppState.useDesktopAudio || AppState.audioFiles.length === 0) return;
        let newIndex = (AppState.currentAudioIndex - 1 + AppState.audioFiles.length) % AppState.audioFiles.length;
        selectSong(newIndex);
    }

    function updateCurrentSongDisplay(displayText = null) {
        if (currentSongTextSpan) {
            if (displayText) {
                currentSongTextSpan.textContent = `${displayText}`;
            } else if (!AppState.useDesktopAudio && AppState.currentAudioIndex !== -1 && AppState.audioFiles[AppState.currentAudioIndex]) {
                currentSongTextSpan.textContent = `${AppState.audioFiles[AppState.currentAudioIndex].name}`;
            } else {
                currentSongTextSpan.textContent = 'No audio playing';
            }
        }
    }

    function showActiveControls() {
        if (startControls) startControls.classList.add('hidden');
        if (activeControls) {
            activeControls.classList.remove('hidden');
            activeControls.classList.add('flex');
            if (customVolumeSlider) {
                customVolumeSlider.updatePosition();
            }
            customEqSliders.forEach(slider => {
                if (slider) slider.updatePosition();
            });
        }
    }

    function showStartControls() {
        if (activeControls) {
            activeControls.classList.add('hidden');
            activeControls.classList.remove('flex');
        }
        if (startControls) {
            startControls.classList.remove('hidden');
        }
        closeEqMenu();
        closeSideMenu();
        console.warn("showStartControls() called. This might indicate an audio setup issue, but visualizer should still try to run.");
    }

    function toggleSettingsMenu() {
        if (!settingsMenu || !settingsToggleBtn || !settingsIconGear || !settingsIconX) return;
        const isHidden = settingsMenu.classList.contains('invisible');

        if (isHidden) {
            settingsMenu.classList.remove('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.add('visible', 'opacity-100', 'scale-100');
            settingsToggleBtn.classList.add('theme-button-active', 'rotate-90');
            settingsIconGear.classList.add('opacity-0');
            settingsIconX.classList.remove('opacity-0');
            closeEqMenu();
        } else {
            settingsMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.remove('visible', 'opacity-100', 'scale-100');
            settingsToggleBtn.classList.remove('theme-button-active', 'rotate-90');
            settingsIconGear.classList.remove('opacity-0');
            settingsIconX.classList.add('opacity-0');

            const accordionsToClose = [
                { container: visualStyleContainer, chevron: chevronVisuals },
                { container: themeContainer, chevron: chevronThemes },
                { container: backgroundImageContainer, chevron: chevronBackgroundImages },
            ];

            accordionsToClose.forEach(({ container, chevron }) => {
                if (container && chevron) {
                    container.classList.add('hidden');
                    chevron.classList.remove('rotate-180');
                }
            });
        }
    }

    function closeSideMenu() {
        if (settingsMenu && !settingsMenu.classList.contains('invisible')) {
            settingsMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.remove('visible', 'opacity-100', 'scale-100');
            if (settingsToggleBtn) settingsToggleBtn.classList.remove('rotate-90');
            if (settingsIconGear) settingsIconGear.classList.remove('opacity-0');
            if (settingsIconX) settingsIconX.classList.add('opacity-0');
        }
    }

    function toggleEqPanel() {
        const eqIconNormal = document.getElementById('eq-icon-normal');
        const eqIconX = document.getElementById('eq-icon-x');

        if (!eqMenu || !eqToggleBtn || !eqIconNormal || !eqIconX) return;

        const isHidden = eqMenu.classList.contains('invisible');

        if (isHidden) {
            eqMenu.classList.remove('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.add('visible', 'opacity-100', 'scale-100');
            eqToggleBtn.classList.add('theme-button-active', 'rotate-90');

            eqIconNormal.classList.add('opacity-0');
            eqIconX.classList.remove('opacity-0');
            closeSideMenu();
            customEqSliders.forEach(slider => {
                if (slider) slider.updatePosition();
            });
        } else {
            eqMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.remove('visible', 'opacity-100', 'scale-100');

            eqToggleBtn.classList.remove('theme-button-active', 'rotate-90');

            eqIconNormal.classList.remove('opacity-0');
            eqIconX.classList.add('opacity-0');
        }
    }

    function closeEqMenu() {
        const eqIconNormal = document.getElementById('eq-icon-normal');
        const eqIconX = document.getElementById('eq-icon-x');

        if (eqMenu && !eqMenu.classList.contains('invisible')) {
            eqMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.remove('visible', 'opacity-100', 'scale-100');

            if (eqToggleBtn) {
                eqToggleBtn.classList.remove('theme-button-active', 'rotate-90');
                if (eqIconNormal) eqIconNormal.classList.remove('opacity-0');
                if (eqIconX) eqIconX.classList.add('opacity-0');
            }
        }
    }

    function toggleAccordion(clickedButton, contentContainer, chevronIcon) {
        const allAccordionButtons = [
            accordionVisualsBtn,
            accordionThemesBtn,
            accordionBackgroundImagesBtn
        ].filter(btn => btn !== null);

        const allContentContainers = [
            visualStyleContainer,
            themeContainer,
            backgroundImageContainer
        ].filter(container => container !== null);

        const allChevronIcons = [
            chevronVisuals,
            chevronThemes,
            chevronBackgroundImages
        ].filter(chevron => chevron !== null);

        const clickedIndex = allAccordionButtons.indexOf(clickedButton);

        if (clickedIndex === -1) return;

        allContentContainers.forEach((container, index) => {
            const chevron = allChevronIcons[index];

            if (container && chevron && allAccordionButtons[index]) {
                if (index === clickedIndex) {
                    container.classList.toggle('hidden');
                    chevron.classList.toggle('rotate-180');
                } else {
                    container.classList.add('hidden');
                    chevron.classList.remove('rotate-180');
                }
            }
        });
    }

    async function draw() {
        if (!isStarted || isPaused) return;
        animationFrameId = requestAnimationFrame(draw);

        const visual = AppState.visuals[AppState.activeVisualId];
        if (!visual) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        if (!AppState.themeColors) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const requiredFftSize = 2048;
        if (analyser.fftSize !== requiredFftSize) {
            analyser.fftSize = requiredFftSize;
        }

        const freqDataArrayRaw = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqDataArrayRaw);

        const freqDataTempVol = new Uint8Array(analyser.frequencyBinCount);
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            freqDataTempVol[i] = Math.max(0, Math.min(255, freqDataArrayRaw[i] * AppState.volumeGain));
        }

        const freqDataArrayVisual = new Uint8Array(analyser.frequencyBinCount);
        const eqFrequenciesMapping = [
            { start: 0, end: 10, sliderIndex: 0 },
            { start: 10, end: 30, sliderIndex: 1 },
            { start: 30, end: 80, sliderIndex: 2 },
            { start: 80, end: 150, sliderIndex: 3 },
            { start: 150, end: analyser.frequencyBinCount - 1, sliderIndex: 4 }
        ];

        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            let gainFactor = 1.0;

            for (const mapping of eqFrequenciesMapping) {
                if (i >= mapping.start && i <= mapping.end) {
                    const eqGain = AppState.eqVisualGains[mapping.sliderIndex];
                    gainFactor = Math.pow(10, eqGain / 20);
                    break;
                }
            }
            freqDataArrayVisual[i] = Math.max(0, Math.min(255, freqDataTempVol[i] * gainFactor));
        }

        const bassFrequencies = freqDataArrayVisual.slice(0, 10);
        const averageBass = bassFrequencies.reduce((a, b) => a + b, 0) / bassFrequencies.length;
        const normalizedBass = isNaN(averageBass) ? 0 : averageBass / 255;
        smoothedBass = lerp(smoothedBass, normalizedBass, 0.3);

        if (!AppState.activeBackgroundImage) {
            const pulseMagnitude = 100;
            const baseLightness = AppState.backgroundLightness;

            const currentLightness = baseLightness + (smoothedBass * (100 - baseLightness) * (pulseMagnitude / 100));

            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${Math.min(100, Math.max(0, currentLightness))}%)`;
        } else {
            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
        }

        canvasCtx.save();

        const logicalDrawingWidth = 960;
        const logicalDrawingHeight = 540;

        const scaleX = canvas.clientWidth / logicalDrawingWidth;
        const scaleY = canvas.clientHeight / logicalDrawingHeight;
        const contentScale = Math.min(scaleX, scaleY);

        canvasCtx.scale(window.devicePixelRatio * contentScale, window.devicePixelRatio * contentScale);

        try {
            canvasCtx.clearRect(0, 0, logicalDrawingWidth, logicalDrawingHeight);

            if (!visual.module) {
                visual.module = await import(visual.path);
            }
            visual.module.draw(canvasCtx, freqDataArrayVisual, smoothedBass, analyser, AppState.themeColors, logicalDrawingWidth, logicalDrawingHeight);
        } catch (error) {
            console.error("Error drawing visualizer:", error);
        } finally {
            canvasCtx.restore();
        }
    }

    function resizeCanvas() {
        if (!canvas) return;
        const canvasWrapper = document.getElementById('canvas-aspect-ratio-container');
        if (!canvasWrapper) return;

        canvas.width = canvasWrapper.clientWidth * window.devicePixelRatio;
        canvas.height = canvasWrapper.clientHeight * window.devicePixelRatio;

        for (const id in AppState.visuals) {
            const visual = AppState.visuals[id];
            if (visual.module && typeof visual.module.reset === 'function') {
                visual.module.reset();
            }
        }
    }

    function stopVisualization() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
        if (fileSourceNode) { try { fileSourceNode.disconnect(analyser); } catch (e) { } }
        if (desktopSourceNode) {
            try { desktopSourceNode.disconnect(analyser); } catch (e) { }
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            desktopSourceNode = null;
        }
        if (analyser && analyser.context && analyser.context.destination && analyser.context.state !== 'closed') {
            try {
                analyser.disconnect(analyser.context.destination);
            } catch (e) { }
        }
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend();
        }

        isStarted = false;
        isPaused = false;
        smoothedBass = 0;
        AppState.eqVisualGains = [0, 0, 0, 0, 0];

        if (customVolumeSlider) {
            customVolumeSlider.updateValue(AppState.volumeGain);
        }
        customEqSliders.forEach((slider, i) => {
            if (slider) {
                slider.updateValue(0);
            }
        });

        showStartControls();
        document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
        document.body.style.backgroundImage = 'none';
        if (container) container.style.transform = '';

        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');

        if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        updateCurrentSongDisplay();
    }

    function togglePause() {
        if (!isStarted) return;
        isPaused = !isPaused;
        if (playIcon) playIcon.classList.toggle('hidden', !isPaused);
        if (pauseIcon) pauseIcon.classList.toggle('hidden', isPaused);
        if (isPaused) {
            if (audioContext && audioContext.state === 'running') {
                audioContext.suspend();
            }
            audioPlayer.pause();
        } else {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (!AppState.useDesktopAudio) {
                audioPlayer.play().catch(e => console.error("Error resuming audio:", e));
            }
            draw();
        }
    }

    function applyEqPreset(gains) {
        if (!isStarted) return;
        AppState.eqVisualGains = [...gains];
        customEqSliders.forEach((slider, i) => {
            if (slider) {
                slider.updateValue(gains[i]);
            }
        });
    }

    function selectSong(index) {
        if (index < 0 || index >= AppState.audioFiles.length) return;
        AppState.currentAudioIndex = index;
        startAudioSource('file');
        renderSongList();
        saveSettings();
    }

    function renderSongList() {
        if (!songListContainer) return;

        songListContainer.innerHTML = '';
        if (AppState.audioFiles.length === 0) {
            songListContainer.innerHTML = '<p class="text-center text-xs text-gray-400 p-2">No songs loaded.</p>';
            return;
        }

        AppState.audioFiles.forEach((song, index) => {
            const songButton = document.createElement('button');
            songButton.textContent = song.name;
            songButton.classList.add('song-list-item');
            if (index === AppState.currentAudioIndex) {
                songButton.classList.add('active-song');
            }
            songButton.addEventListener('click', () => {
                selectSong(index);
                toggleSongList();
            });
            songListContainer.appendChild(songButton);
        });
    }

    function toggleSongList() {
        if (!songListContainer || !currentSongDisplayButton || !songChevron) return;

        AppState.isSongListOpen = !AppState.isSongListOpen;

        if (AppState.isSongListOpen) {
            songListContainer.classList.remove('hidden');
            currentSongDisplayButton.classList.add('active');
            songChevron.classList.add('rotate-180');
            renderSongList();
        } else {
            songListContainer.classList.add('hidden');
            currentSongDisplayButton.classList.remove('active');
            songChevron.classList.remove('rotate-180');
        }
    }

    pauseButton.addEventListener('click', togglePause);

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (!AppState.useDesktopAudio) playPrevAudio();
        });
        prevButton.disabled = AppState.useDesktopAudio;
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (!AppState.useDesktopAudio) playNextAudio();
        });
        nextButton.disabled = AppState.useDesktopAudio;
    }

    if (audioPlayer) {
        audioPlayer.onended = () => {
            if (!AppState.useDesktopAudio) {
                playNextAudio();
            }
        };
    }

    eqToggleBtn.addEventListener('click', toggleEqPanel);
    eqResetBtn.addEventListener('click', () => {
        applyEqPreset([0, 0, 0, 0, 0]);
        saveSettings();
    });

    settingsToggleBtn.addEventListener('click', toggleSettingsMenu);

    currentSongDisplayButton.addEventListener('click', toggleSongList);

    if (accordionVisualsBtn) {
        accordionVisualsBtn.addEventListener('click', () => {
            toggleAccordion(accordionVisualsBtn, visualStyleContainer, chevronVisuals);
        });
    }
    if (accordionThemesBtn) {
        accordionThemesBtn.addEventListener('click', () => {
            toggleAccordion(accordionThemesBtn, themeContainer, chevronThemes);
        });
    }
    if (accordionBackgroundImagesBtn) {
        accordionBackgroundImagesBtn.addEventListener('click', () => {
            toggleAccordion(accordionBackgroundImagesBtn, backgroundImageContainer, chevronBackgroundImages);
        });
    }


    initializeAudioGraph();

    if (volumeSliderWrapper && volumeSliderHiddenInput) {
        customVolumeSlider = new CustomSlider(
            'volume-slider-wrapper',
            'volume-slider',
            (newValue) => {
                AppState.volumeGain = newValue;
                if (!AppState.useDesktopAudio && audioPlayer) {
                    audioPlayer.volume = newValue;
                }
                debounceSave();
            }
        );
    }

    const eqSliderWrappers = [
        eqBassSliderWrapper,
        eqLowMidSliderWrapper,
        eqMidSliderWrapper,
        eqHighMidSliderWrapper,
        eqTrebleSliderWrapper
    ];
    const eqHiddenInputs = [
        eqBassHiddenInput,
        eqLowMidHiddenInput,
        eqMidHiddenInput,
        eqHighMidHiddenInput,
        eqTrebleHiddenInput
    ];

    eqSliderWrappers.forEach((wrapper, i) => {
        const hiddenInput = eqHiddenInputs[i];
        if (wrapper && hiddenInput) {
            const slider = new CustomSlider(
                wrapper.id,
                hiddenInput.id,
                (newValue) => {
                    AppState.eqVisualGains[i] = newValue;
                    debounceSave();
                }
            );
            customEqSliders.push(slider);
        }
    });

    await loadModulesFromManifest();
    loadSettings();

    if (customVolumeSlider) {
        customVolumeSlider.updateValue(AppState.volumeGain);
        if (!AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = AppState.volumeGain;
        } else if (AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = 0;
        }
    }

    customEqSliders.forEach((slider, i) => {
        if (slider && i < AppState.eqVisualGains.length) {
            slider.updateValue(AppState.eqVisualGains[i]);
        }
    });
    setupVisualizerButtons();
    await loadAndApplyTheme(AppState.activeThemeId);
    setupThemeButtons();
    setupBackgroundImageButtons();
    applyBackgroundImage(AppState.activeBackgroundImage);

    if (sourceDesktopRadio && sourceFileRadio) {
        sourceDesktopRadio.checked = AppState.useDesktopAudio;
        sourceFileRadio.checked = !AppState.useDesktopAudio;
        if (prevButton) prevButton.disabled = AppState.useDesktopAudio;
        if (nextButton) nextButton.disabled = AppState.useDesktopAudio;
    }

    updateCurrentSongDisplay();
    renderSongList();

    if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
    if (loadingProgressBar) loadingProgressBar.style.width = `${AppState.loadingProgress}%`;

    setTimeout(() => {
        if (window.nuiHandoverData) {
            const handoverData = window.nuiHandoverData;

            if (handoverData.vars) {
                AppState.playerName = handoverData.vars.playerName || 'Player';
                AppState.serverName = handoverData.vars.serverName || 'My Server';
                AppState.playerCount = handoverData.vars.playerCount || 0;
            }
            if (handoverData.config && handoverData.config.serverMessage) {
                AppState.serverWelcomeMessage = handoverData.config.serverMessage;
            }

            if (handoverData.config && handoverData.config.serverInfoModules) {
                renderServerInfoPanel(handoverData.config.serverInfoModules);
            } else {
                console.warn("window.nuiHandoverData.config.serverInfoModules is missing or empty. Rendering default welcome and player count modules.");
                renderServerInfoPanel([
                    { type: 'welcome', enabled: true, order: 10, panelMessageTemplate: AppState.serverWelcomeMessage },
                    { type: 'playerCount', enabled: true, order: 20, prefix: 'Players: ' }
                ]);
            }

        } else {
            console.warn("window.nuiHandoverData is not available after timeout. Server info panel will use default placeholders.");
            renderServerInfoPanel([
                { type: 'welcome', enabled: true, order: 10, panelMessageTemplate: AppState.serverWelcomeMessage },
                { type: 'playerCount', enabled: true, order: 20, prefix: 'Players: ' }
            ]);
        }
    }, 100);

    showActiveControls();
    resizeCanvas();

    const audioSourceType = AppState.useDesktopAudio ? 'desktop' : 'file';

    if (audioSourceType === 'file') {
        if (AppState.audioFiles.length === 0 || AppState.currentAudioIndex === -1) {
            if (messageElement) messageElement.textContent = "No audio files configured. Visualizer running without audio input.";
            console.warn("No audio files configured or default index invalid. Visualizer will run without direct audio input from files.");
            draw();
        } else {
            await startAudioSource(audioSourceType);
        }
    } else if (audioSourceType === 'desktop') {
        await startAudioSource(audioSourceType);
    } else {
        if (messageElement) messageElement.textContent = "No audio source configured. Visualizer running without audio.";
        console.warn("No audio source type configured. Visualizer will run without audio input.");
        draw();
    }

    if (window.invokeNative) {
        window.invokeNative('ready');
    } else {
        console.warn("window.invokeNative is not defined. Running in browser development mode.");
    }

    window.addEventListener('message', (event) => {
        const data = event.data;

        switch (data.eventName) {
            case 'onLogLine':
                AppState.currentLogMessage = data.message;
                AppState.loadingText = `${data.message} ${AppState.loadingProgress > 0 ? '(' + AppState.loadingProgress + '%)' : ''}`;
                if (loadingStatusText) {
                    loadingStatusText.textContent = AppState.loadingText;
                }
                break;

            case 'loadProgress':
                AppState.loadingProgress = Math.max(0, Math.min(100, Math.round(data.loadFraction * 100)));
                if (loadingProgressBar) {
                    loadingProgressBar.style.width = `${AppState.loadingProgress}%`;
                }
                if (loadingStatusText) {
                    loadingStatusText.textContent = `${AppState.currentLogMessage || 'Loading...'} (${AppState.loadingProgress}%)`;
                }
                break;

            case 'startDataFileEntries':
                AppState.currentLoadAction = `Loading ${data.count} data file entries...`;
                AppState.loadingText = AppState.currentLoadAction;
                if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
                break;

            case 'onDataFileEntry':
                AppState.currentLoadAction = `Processing file: ${data.name}`;
                break;

            case 'performMapLoadFunction':
                AppState.currentLoadAction = `Performing map load function ${data.idx}...`;
                AppState.loadingText = AppState.currentLoadAction;
                if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
                break;

            case 'endDataFileEntries':
                AppState.currentLoadAction = `Finished data file entries.`;
                AppState.loadingText = AppState.currentLoadAction;
                if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
                break;

            case 'startInitFunction':
            case 'startInitFunctionOrder':
                AppState.currentLoadAction = `Starting initialization phase: ${data.type}`;
                if (data.order && data.count) {
                    AppState.currentLoadAction += ` (${data.order}/${data.count})`;
                }
                AppState.loadingText = AppState.currentLoadAction;
                if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
                break;

            case 'initFunctionInvoking':
                AppState.currentLoadAction = `Invoking: ${data.name} (${data.idx + 1}/${data.count})`;
                AppState.loadingText = AppState.currentLoadAction;
                if (loadingStatusText) loadingStatusText.textContent = AppState.loadingText;
                break;

            case 'initFunctionInvoked':
                AppState.currentLoadAction = `Finished: ${data.name}`;
                break;
            case 'endInitFunction':
                if (data.message) {
                    AppState.currentLogMessage = data.message;
                } else if (data.name && data.type) {
                    AppState.currentLogMessage = `${data.type}: ${data.name}`;
                } else {
                    AppState.currentLogMessage = data.eventName;
                }
                AppState.loadingText = `${AppState.currentLogMessage} (${AppState.loadingProgress}%)`;
                if (loadingStatusText) {
                    loadingStatusText.textContent = AppState.loadingText;
                }
                break;

            case 'updatePlayerCount':
                AppState.playerCount = data.playerCount;
                if (window.nuiHandoverData && window.nuiHandoverData.config && window.nuiHandoverData.config.serverInfoModules) {
                    renderServerInfoPanel(window.nuiHandoverData.config.serverInfoModules);
                }
                break;

            default:
                break;
        }
    });

    function renderServerInfoPanel(modulesConfig) {
        if (!dynamicInfoContent) {
            console.error("renderServerInfoPanel: dynamicInfoContent element not found!");
            return;
        }

        dynamicInfoContent.innerHTML = '';

        const sortedModules = [...modulesConfig].sort((a, b) => (a.order || 999) - (b.order || 999));

        sortedModules.forEach(module => {
            if (!module.enabled) return;

            let element;
            switch (module.type) {
                case 'welcome':
                    element = document.createElement('div');
                    element.classList.add('info-module-item', 'info-module-welcome');

                    const playerNameSpan = document.createElement('span');
                    playerNameSpan.classList.add('panel-player-name');
                    playerNameSpan.textContent = AppState.playerName;

                    const separatorSpan = document.createElement('span');
                    separatorSpan.classList.add('panel-separator');
                    separatorSpan.textContent = '/';

                    const serverNameSpan = document.createElement('span');
                    serverNameSpan.classList.add('panel-server-name');
                    serverNameSpan.textContent = AppState.serverName;

                    element.appendChild(playerNameSpan);
                    element.appendChild(separatorSpan);
                    element.appendChild(serverNameSpan);
                    break;
                case 'playerCount':
                    element = document.createElement('p');
                    element.classList.add('info-module-item', 'info-module-player-count');
                    element.textContent = `${module.prefix || 'Players: '}${AppState.playerCount}`;
                    break;
                case 'discordLink':
                    element = document.createElement('a');
                    element.classList.add('info-module-item', 'info-module-link');
                    element.href = module.url;
                    element.target = '_blank';
                    element.innerHTML = `<svg class="icon" fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em"><path d="M20.25 0H3.75A3.75 3.75 0 000 3.75v16.5A3.75 3.75 0 003.75 24h16.5a3.75 3.75 0 003.75-3.75V3.75A3.75 3.75 0 0020.25 0zm-5.718 17.587c-.896.657-1.895 1.15-2.837 1.488-.344.116-.693.208-1.047.279-.208.043-.418.067-.63.078-.073.003-.146.005-.22.005-.072 0-.144-.002-.217-.005-.21-.011-.42-.035-.628-.078-.354-.07-.703-.163-1.047-.279-.942-.338-1.941-.831-2.837-1.488-.198-.145-.37-.29-.516-.445-.145-.155-.268-.31-.37-.47a.75.75 0 01.19-.94c.322-.24.787-.197 1.026.126.173.238.36.467.55.688.19.22.385.433.585.632.716.697 1.54.91 2.378.91.838 0 1.662-.213 2.378-.91.2-.199.395-.412.585-.632.19-.22.377-.45.55-.688.238-.323.704-.366 1.026-.126a.75.75 0 01.19.94c-.102.16-.225.315-.37.47-.146.155-.318.3-.516.445zM8.344 9.172a.75.75 0 01.75-.75.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75.75.75 0 01-.75-.75V9.172zm7.312 0a.75.75 0 01.75-.75.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75.75.75 0 01-.75-.75V9.172z"/></svg>`;
                    element.append(document.createTextNode(module.text));
                    break;
                case 'websiteLink':
                    element = document.createElement('a');
                    element.classList.add('info-module-item', 'info-module-link');
                    element.href = module.url;
                    element.target = '_blank';
                    element.innerHTML = `<svg class="icon" fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 2.25c.62 0 1.22.1 1.78.29.35-.61.64-1.25.86-1.9zm-1.78.29c-.56-.19-1.16-.29-1.78-.29-.62 0-1.22.1-1.78.29-.35.61-.64 1.25-.86 1.9zm-4.47 2.1c-.55.67-.97 1.4-1.26 2.16.8.29 1.58.63 2.32.99.39-.75.78-1.5 1.15-2.2zm4.47 2.1c.37-.7.76-1.45 1.15-2.2-.8-.3-1.58-.64-2.32-.99.55.67.97 1.4 1.26 2.16zm-7.79 3.55c.29-.8.64-1.58 1.05-2.32-.75-.39-1.5-.78-2.2-1.15.55.67.97 1.4 1.26 2.16zM2.25 12c0-.62.1-.1.29-.1.35-.61.64-1.25.86-1.9z"/></svg>`;
                    element.append(document.createTextNode(module.text));
                    break;
                case 'customText':
                    element = document.createElement('p');
                    element.classList.add('info-module-item', 'info-module-custom-text');
                    element.textContent = module.message;
                    if (module.style) {
                        if (module.style.includes('italic')) element.style.fontStyle = 'italic';
                        if (module.style.includes('bold')) element.style.fontWeight = 'bold';
                    }
                    break;
                default:
                    console.warn(`Unknown server info module type: ${module.type}`);
                    return;
            }
            dynamicInfoContent.appendChild(element);
        });
    }
});
