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
        isSongListOpen: false
    };

    let audioContext = null;
    let analyser = null;
    let fileSourceNode = null;
    let desktopSourceNode = null;
    let animationFrameId;
    let isStarted = false;
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
                        }
                    });
                } else if (typeof value === 'string') {
                    document.documentElement.style.setProperty(`--${prefix}${key}`, value);
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

            await loadAndApplyTheme(AppState.activeThemeId);

            if (defaultBackgroundImageId === 'none') {
                applyBackgroundImage(null);
            } else if (defaultBackgroundImageId) {
                const defaultImage = AppState.backgroundImages.find(img => img.id === defaultBackgroundImageId);
                if (defaultImage) {
                    applyBackgroundImage(defaultImage.url);
                } else {
                    applyBackgroundImage(null);
                }
            } else {
                applyBackgroundImage(null);
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
            updateCurrentSongDisplay();
            renderSongList();

            setupVisualizerButtons();
            setupThemeButtons();
            setupBackgroundImageButtons();

            if (sourceDesktopRadio && sourceFileRadio) {
                sourceDesktopRadio.checked = AppState.useDesktopAudio;
                sourceFileRadio.checked = !AppState.useDesktopAudio;

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
            if (theme) {
                saveSettings();
            }
        } catch (error) {
            console.error("Error applying theme:", error);
        }
    }

    function setupVisualizerButtons() {
        if (!visualStyleContainer) {
            return;
        };
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
        if (!themeContainer) {
            return;
        }
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

        if (AppState.backgroundImages.length === 0) {
            backgroundImagesAccordionSection.classList.add('hidden');
            applyBackgroundImage(null);
            return;
        } else {
            backgroundImagesAccordionSection.classList.remove('hidden');
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

            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h;
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l;
            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;

            const imgFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            const imageId = imgFileName.substring(0, imgFileName.lastIndexOf('.'));
            const activeButton = document.getElementById(`bg-image-${imageId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }

        } else {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = '';

            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h;
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l;

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

        if (fileSourceNode) {
            try { fileSourceNode.disconnect(analyser); } catch (e) { }
        }
        if (desktopSourceNode) {
            try { desktopSourceNode.disconnect(analyser); } catch (e) { }
        }

        if (analyser && analyser.context && analyser.context.destination && analyser.context.state !== 'closed') {
            try {
                analyser.disconnect(analyser.context.destination);
            } catch (e) {
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
            if (customVolumeSlider) {
                customVolumeSlider.updateValue(AppState.volumeGain);
            }
            customEqSliders.forEach((slider, i) => {
                if (slider) {
                    slider.updateValue(AppState.eqVisualGains[i]);
                }
            });
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

            eqToggleBtn.classList.add('theme-button-active');

            eqIconNormal.classList.add('opacity-0');
            eqIconX.classList.remove('opacity-0');
            closeSideMenu()
        } else {
            eqMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.remove('visible', 'opacity-100', 'scale-100');

            eqToggleBtn.classList.remove('theme-button-active');
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
                eqToggleBtn.classList.remove('theme-button-active');
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
        if (!visual) return;

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
        if (fileSourceNode) {
            try { fileSourceNode.disconnect(analyser); } catch (e) { }
        }
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
            } catch (e) {
            }
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
        volumeSliderHiddenInput.value = AppState.volumeGain;
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
        customVolumeSlider.updateValue(AppState.volumeGain);
        if (!AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = AppState.volumeGain;
        } else if (AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = 0;
        }
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

    if (startControls) {
        startControls.classList.add('hidden');
    }

    isStarted = true;
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
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    window.addEventListener('focus', () => {
        resizeCanvas();
    });

    resizeCanvas();

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.eventName === 'setLoadingText') {

        } else if (data.eventName === 'setLoadingProgress') {

        }
    });
});