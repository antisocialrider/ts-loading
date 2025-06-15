import { CustomSlider } from './custom-slider.js';

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Element References
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

    // Application State Object
    const AppState = {
        visuals: {},
        activeVisualId: null,
        activeThemeId: null,
        themes: {},
        themeColors: null,
        eqVisualGains: [0, 0, 0, 0, 0], // Bass, Low-Mid, Mid, High-Mid, Treble
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

    // Global Variables
    let audioContext = null;
    let analyser = null;
    let fileSourceNode = null;
    let desktopSourceNode = null;
    let animationFrameId;
    let isStarted = false;
    let isPaused = false;
    let mediaStream = null;
    let smoothedBass = 0; // For background pulsing
    let customVolumeSlider;
    let customEqSliders = []; // Array to hold CustomSlider instances for EQ

    // Helper function for linear interpolation (used for smoothedBass)
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    // Debounce function for saving settings to prevent excessive writes
    let saveTimer;
    function debounceSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveSettings, 500);
    }

    // Function to save current AppState to localStorage
    function saveSettings() {
        localStorage.setItem('ts_visual_id', AppState.activeVisualId);
        localStorage.setItem('ts_theme_id', AppState.activeThemeId);
        localStorage.setItem('ts_bg_image_url', AppState.activeBackgroundImage || 'none');
        localStorage.setItem('ts_audio_index', AppState.currentAudioIndex.toString());
        localStorage.setItem('ts_volume', AppState.volumeGain.toString());
        localStorage.setItem('ts_eq_gains', JSON.stringify(AppState.eqVisualGains));
        localStorage.setItem('ts_use_desktop_audio', AppState.useDesktopAudio ? 'true' : 'false');
    }

    // Function to load settings from localStorage into AppState
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

    // Helper function to get HSL components from any CSS color string
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

    // Applies CSS variables from a given object to the document root
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

    // Loads modules and initial configuration from manifest.json
    async function loadModulesFromManifest() {
        try {
            const response = await fetch('./manifest.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const manifest = await response.json();

            // Initial AppState values from manifest (will be overridden by localStorage later)
            AppState.activeVisualId = manifest.activeVisualId || 'bars';
            AppState.activeThemeId = manifest.activeThemeId || 'default';
            const defaultBackgroundImageId = manifest.defaultBackgroundImageId || null;
            const defaultAudioFileId = manifest.defaultAudioFileId || null;
            AppState.useDesktopAudio = manifest.useDesktopAudio || false;
            AppState.volumeGain = manifest.defaultVolume !== undefined ? parseFloat(manifest.defaultVolume) : 0.25;

            // Load Visualizer Modules
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

            // Load Theme Modules
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

            // Load Background Images
            AppState.backgroundImages = Array.isArray(manifest.backgroundImages)
                ? manifest.backgroundImages.map(img => ({
                    id: img.id,
                    name: img.name,
                    url: `./images/${img.id}.png`
                }))
                : [];

            // Load Audio Files
            AppState.audioFiles = Array.isArray(manifest.audioFiles)
                ? manifest.audioFiles.map(audio => ({
                    id: audio.id,
                    name: audio.name,
                    url: `./audio/${audio.id}.mp3`
                }))
                : [];

            // Set up event listeners for audio source radio buttons (only once)
            if (sourceDesktopRadio && sourceFileRadio) {
                sourceDesktopRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = true;
                    stopVisualization(); // Stop and restart with new source
                    saveSettings();
                });
                sourceFileRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = false;
                    stopVisualization(); // Stop and restart with new source
                    saveSettings();
                });
            }

            // Set default audio index if no saved state or first run
            if (!AppState.useDesktopAudio && AppState.audioFiles.length > 0) {
                const defaultAudioIndex = AppState.audioFiles.findIndex(audio => audio.id === defaultAudioFileId);
                if (defaultAudioIndex !== -1) {
                    AppState.currentAudioIndex = defaultAudioIndex;
                } else {
                    AppState.currentAudioIndex = 0; // Fallback to first song
                }
            } else {
                AppState.currentAudioIndex = -1; // No audio file selected for desktop audio or no files available
            }

        } catch (error) {
            console.error("Error loading manifest:", error);
            // Display error messages on UI if elements exist
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

    // Applies the selected theme's colors to CSS variables and updates background
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

            // Set base background color from the theme
            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h;
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l;

            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;

            // If no active background image, ensure background-image CSS property is 'none'
            if (!AppState.activeBackgroundImage) {
                document.body.style.backgroundImage = 'none';
            }

            resizeCanvas(); // Resize canvas in case theme change affects layout

            // Highlight the active theme button
            document.querySelectorAll('#theme-container button').forEach(btn => {
                btn.classList.remove('theme-button-active');
            });
            const activeButton = document.getElementById(`theme-${themeId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }
            saveSettings(); // Save after applying theme to persist choice
        } catch (error) {
            console.error("Error applying theme:", error);
        }
    }

    // Sets up buttons for visualizer styles
    function setupVisualizerButtons() {
        if (!visualStyleContainer) { return; }
        visualStyleContainer.innerHTML = ''; // Clear existing buttons
        for (const id in AppState.visuals) {
            const visual = AppState.visuals[id];
            const button = document.createElement('button');
            button.id = `style-${id}`;
            button.textContent = visual.name;
            button.className = 'w-full text-left px-3 py-2 text-sm rounded-md focus:outline-none theme-button-normal theme-accordion-button';
            if (id === AppState.activeVisualId) { // Highlight if it's the active visualizer
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

    // Sets up buttons for themes
    function setupThemeButtons() {
        if (!themeContainer) { return; }
        themeContainer.innerHTML = ''; // Clear existing buttons
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

            if (id === AppState.activeThemeId) { // Highlight if it's the active theme
                button.classList.add('theme-button-active');
            }
            button.addEventListener('click', () => loadAndApplyTheme(id));
            themeContainer.appendChild(button);
        }
    }

    // Sets up buttons for background images
    function setupBackgroundImageButtons() {
        if (!backgroundImageContainer || !backgroundImagesAccordionSection || !noBackgroundImageBtn) {
            console.warn("Missing background image elements (container, section, or no-image button). Skipping setup.");
            return;
        }

        // Show/hide the background image section based on if images are available
        if (AppState.backgroundImages.length > 0) {
            backgroundImagesAccordionSection.classList.remove('hidden');
        } else {
            backgroundImagesAccordionSection.classList.add('hidden');
            // If no images are available, ensure activeBackgroundImage is null and save it
            if (AppState.activeBackgroundImage !== null) {
                AppState.activeBackgroundImage = null;
                saveSettings();
            }
            applyBackgroundImage(null); // Ensure no background image is displayed
            return;
        }

        // Clear existing buttons, but keep the 'no-background-image-btn' reference
        const existingButtons = Array.from(backgroundImageContainer.children);
        existingButtons.forEach(child => {
            if (child.id !== 'no-background-image-btn') {
                backgroundImageContainer.removeChild(child);
            }
        });

        // Re-append 'no-background-image-btn' to ensure it's always at the end
        if (noBackgroundImageBtn.parentNode === backgroundImageContainer) {
            backgroundImageContainer.removeChild(noBackgroundImageBtn);
        }

        AppState.backgroundImages.forEach(image => {
            const button = document.createElement('button');
            button.id = `bg-image-${image.id}`;
            button.textContent = image.name;
            button.className = 'w-full text-left px-3 py-2 text-sm rounded-md focus:outline-none theme-button-normal theme-accordion-button';

            // Highlight if this image is the active one
            if (AppState.activeBackgroundImage && AppState.activeBackgroundImage.includes(image.id)) {
                button.classList.add('theme-button-active');
            }

            backgroundImageContainer.appendChild(button);
            button.addEventListener('click', () => applyBackgroundImage(image.url));
        });

        backgroundImageContainer.appendChild(noBackgroundImageBtn);

        // Highlight "No Background Image" button if no image is active
        if (!AppState.activeBackgroundImage || AppState.activeBackgroundImage === 'none') {
            noBackgroundImageBtn.classList.add('theme-button-active');
        } else {
            noBackgroundImageBtn.classList.remove('theme-button-active');
        }
        // Ensure its event listener is active (it should be persistent from initial setup)
        noBackgroundImageBtn.addEventListener('click', () => applyBackgroundImage(null));
    }

    // Applies the chosen background image or removes it
    function applyBackgroundImage(imageUrl) {
        AppState.activeBackgroundImage = imageUrl;

        // Remove active class from all background image buttons first
        document.querySelectorAll('#background-image-container button').forEach(btn => {
            btn.classList.remove('theme-button-active');
        });

        if (imageUrl) {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';

            // Set background color to theme's base color when image is present
            // This prevents the pulsating effect from interfering with the image
            if (AppState.themeColors) {
                const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
                const hslComponents = getHslComponents(primaryBgColor);
                AppState.backgroundHue = hslComponents.h;
                AppState.backgroundSaturation = hslComponents.s;
                AppState.backgroundLightness = hslComponents.l;
                document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
            }

            // Highlight the corresponding background image button
            const imgFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            const imageId = imgFileName.substring(0, imgFileName.lastIndexOf('.'));
            const activeButton = document.getElementById(`bg-image-${imageId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }

        } else {
            document.body.style.backgroundImage = 'none';
            // When no background image, apply theme's base background color to allow pulsating
            if (AppState.themeColors) {
                const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
                const hslComponents = getHslComponents(primaryBgColor);
                AppState.backgroundHue = hslComponents.h;
                AppState.backgroundSaturation = hslComponents.s;
                AppState.backgroundLightness = hslComponents.l;
                document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
            } else {
                document.body.style.backgroundColor = ''; // Fallback if theme not loaded yet
            }

            // Highlight "No Background Image" button
            if (noBackgroundImageBtn) {
                noBackgroundImageBtn.classList.add('theme-button-active');
            }
        }
        saveSettings(); // Save the new background image choice
    }

    // Initializes Web Audio API Context and Analyser
    async function initializeAudioGraph() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.smoothingTimeConstant = 0.5; // Smooths out sudden changes
        }
        if (!fileSourceNode) {
            fileSourceNode = audioContext.createMediaElementSource(audioPlayer);
        }
    }

    // Starts the audio source (file or desktop)
    async function startAudioSource(type) {
        await initializeAudioGraph(); // Ensure audio graph is ready

        // Disconnect previous sources
        if (fileSourceNode) { try { fileSourceNode.disconnect(analyser); } catch (e) { console.warn("Error disconnecting fileSourceNode:", e); } }
        if (desktopSourceNode) { try { desktopSourceNode.disconnect(analyser); } catch (e) { console.warn("Error disconnecting desktopSourceNode:", e); } }

        // Disconnect analyser from destination if connected
        if (analyser && analyser.context && analyser.context.destination && analyser.context.state !== 'closed') {
            try {
                analyser.disconnect(analyser.context.destination);
            } catch (e) {
                console.warn("Error disconnecting analyser from destination:", e);
            }
        }

        // Stop existing media stream tracks if any
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
            audioPlayer.volume = AppState.volumeGain; // Set volume from AppState
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
                audioPlayer.pause(); // Pause file audio player
                audioPlayer.currentTime = 0;
                audioPlayer.volume = 0; // Mute audio player if using desktop audio

                mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                if (mediaStream.getAudioTracks().length === 0) {
                    if (messageElement) messageElement.textContent = 'Audio not shared. Please try again and check the "Share audio" box.';
                    mediaStream.getVideoTracks().forEach(track => track.stop()); // Stop video track if no audio
                    console.warn("Desktop audio not shared.");
                    return;
                }
                desktopSourceNode = audioContext.createMediaStreamSource(mediaStream);
                desktopSourceNode.connect(analyser);
                analyser.connect(audioContext.destination); // Connect analyser to speakers for desktop audio
                isPaused = false;
                updateCurrentSongDisplay('Desktop Audio');
                if (prevButton) prevButton.disabled = true; // Disable prev/next for desktop
                if (nextButton) nextButton.disabled = true;

            } catch (err) {
                console.error("Could not access desktop audio:", err);
                if (messageElement) messageElement.textContent = 'Could not access desktop audio. Check browser permissions.';
                return;
            }
        }

        // Resume audio context if suspended (e.g., after user interaction)
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // If visualization is already started, ensure controls and canvas are ready
        if (isStarted) {
            if (messageElement) messageElement.textContent = '';
            showActiveControls();
            resizeCanvas();
            draw(); // Start drawing loop
        }

        // Update play/pause icons
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
    }

    // Plays the next audio file in the list
    function playNextAudio() {
        if (AppState.useDesktopAudio || AppState.audioFiles.length === 0) return;
        let newIndex = (AppState.currentAudioIndex + 1) % AppState.audioFiles.length;
        selectSong(newIndex);
    }

    // Plays the previous audio file in the list
    function playPrevAudio() {
        if (AppState.useDesktopAudio || AppState.audioFiles.length === 0) return;
        let newIndex = (AppState.currentAudioIndex - 1 + AppState.audioFiles.length) % AppState.audioFiles.length;
        selectSong(newIndex);
    }

    // Updates the display showing the current song name
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

    // Shows the active controls and hides start controls
    function showActiveControls() {
        if (startControls) startControls.classList.add('hidden');
        if (activeControls) {
            activeControls.classList.remove('hidden');
            activeControls.classList.add('flex');
            // Update position of volume slider after controls become visible
            if (customVolumeSlider) {
                customVolumeSlider.updatePosition();
            }
            // Update position of EQ sliders if visible
            customEqSliders.forEach(slider => {
                if(slider) slider.updatePosition();
            });
        }
    }

    // Shows the start controls and hides active controls
    function showStartControls() {
        if (activeControls) {
            activeControls.classList.add('hidden');
            activeControls.classList.remove('flex');
        }
        if (startControls) {
            startControls.classList.remove('hidden');
        }
        closeEqMenu(); // Ensure EQ menu is closed
        closeSideMenu(); // Ensure settings menu is closed
        console.warn("showStartControls() called. This might indicate an audio setup issue, but visualizer should still try to run.");
    }

    // Toggles the visibility of the settings menu
    function toggleSettingsMenu() {
        if (!settingsMenu || !settingsToggleBtn || !settingsIconGear || !settingsIconX) return;
        const isHidden = settingsMenu.classList.contains('invisible');

        if (isHidden) {
            settingsMenu.classList.remove('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.add('visible', 'opacity-100', 'scale-100');
            settingsToggleBtn.classList.add('theme-button-active', 'rotate-90');
            settingsIconGear.classList.add('opacity-0');
            settingsIconX.classList.remove('opacity-0');
            closeEqMenu(); // Close EQ menu when settings open
        } else {
            settingsMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.remove('visible', 'opacity-100', 'scale-100');
            settingsToggleBtn.classList.remove('theme-button-active', 'rotate-90');
            settingsIconGear.classList.remove('opacity-0');
            settingsIconX.classList.add('opacity-0');

            // Close all accordions within the settings menu when it closes
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

    // Closes the settings menu if it's open
    function closeSideMenu() {
        if (settingsMenu && !settingsMenu.classList.contains('invisible')) {
            settingsMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            settingsMenu.classList.remove('visible', 'opacity-100', 'scale-100');
            if (settingsToggleBtn) settingsToggleBtn.classList.remove('rotate-90');
            if (settingsIconGear) settingsIconGear.classList.remove('opacity-0');
            if (settingsIconX) settingsIconX.classList.add('opacity-0');
        }
    }

    // Toggles the visibility of the EQ panel
    function toggleEqPanel() {
        const eqIconNormal = document.getElementById('eq-icon-normal');
        const eqIconX = document.getElementById('eq-icon-x');

        if (!eqMenu || !eqToggleBtn || !eqIconNormal || !eqIconX) return;

        const isHidden = eqMenu.classList.contains('invisible');

        if (isHidden) {
            eqMenu.classList.remove('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.add('visible', 'opacity-100', 'scale-100');
            eqToggleBtn.classList.add('theme-button-active', 'rotate-90'); // Add rotation for active state

            eqIconNormal.classList.add('opacity-0');
            eqIconX.classList.remove('opacity-0');
            closeSideMenu(); // Close settings menu when EQ opens
            // Update EQ slider positions in case they weren't visible before
            customEqSliders.forEach(slider => {
                if(slider) slider.updatePosition();
            });
        } else {
            eqMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.remove('visible', 'opacity-100', 'scale-100');

            eqToggleBtn.classList.remove('theme-button-active', 'rotate-90'); // Remove rotation

            eqIconNormal.classList.remove('opacity-0');
            eqIconX.classList.add('opacity-0');
        }
    }

    // Closes the EQ menu if it's open
    function closeEqMenu() {
        const eqIconNormal = document.getElementById('eq-icon-normal');
        const eqIconX = document.getElementById('eq-icon-x');

        if (eqMenu && !eqMenu.classList.contains('invisible')) {
            eqMenu.classList.add('invisible', 'opacity-0', 'scale-95');
            eqMenu.classList.remove('visible', 'opacity-100', 'scale-100');

            if (eqToggleBtn) {
                eqToggleBtn.classList.remove('theme-button-active', 'rotate-90'); // Ensure rotation is removed
                if (eqIconNormal) eqIconNormal.classList.remove('opacity-0');
                if (eqIconX) eqIconX.classList.add('opacity-0');
            }
        }
    }

    // Toggles accordion sections in the settings menu
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

        if (clickedIndex === -1) return; // Should not happen if button exists

        allContentContainers.forEach((container, index) => {
            const chevron = allChevronIcons[index];

            if (container && chevron && allAccordionButtons[index]) {
                if (index === clickedIndex) {
                    // Toggle the clicked accordion
                    container.classList.toggle('hidden');
                    chevron.classList.toggle('rotate-180');
                } else {
                    // Close other accordions
                    container.classList.add('hidden');
                    chevron.classList.remove('rotate-180');
                }
            }
        });
    }

    // Main drawing loop for the visualizer
    async function draw() {
        if (!isStarted || isPaused) return;
        animationFrameId = requestAnimationFrame(draw);

        const visual = AppState.visuals[AppState.activeVisualId];
        if (!visual) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        if (!AppState.themeColors) { // Ensure theme colors are loaded before drawing
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const requiredFftSize = 2048;
        if (analyser.fftSize !== requiredFftSize) {
            analyser.fftSize = requiredFftSize;
        }

        const freqDataArrayRaw = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqDataArrayRaw);

        // Apply global volume gain to raw frequency data
        const freqDataTempVol = new Uint8Array(analyser.frequencyBinCount);
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            freqDataTempVol[i] = Math.max(0, Math.min(255, freqDataArrayRaw[i] * AppState.volumeGain));
        }

        // Apply EQ visual gains to frequency data
        const freqDataArrayVisual = new Uint8Array(analyser.frequencyBinCount);
        // Define frequency ranges for EQ sliders (rough approximations)
        const eqFrequenciesMapping = [
            { start: 0, end: 10, sliderIndex: 0 }, // Bass (approx 0-200 Hz)
            { start: 10, end: 30, sliderIndex: 1 }, // Low-Mid (approx 200-500 Hz)
            { start: 30, end: 80, sliderIndex: 2 }, // Mid (approx 500-2000 Hz)
            { start: 80, end: 150, sliderIndex: 3 }, // High-Mid (approx 2000-5000 Hz)
            { start: 150, end: analyser.frequencyBinCount - 1, sliderIndex: 4 } // Treble (approx 5000 Hz+)
        ];

        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            let gainFactor = 1.0;

            for (const mapping of eqFrequenciesMapping) {
                // Corrected condition for frequency range: i should be >= start and <= end
                if (i >= mapping.start && i <= mapping.end) {
                    const eqGain = AppState.eqVisualGains[mapping.sliderIndex];
                    gainFactor = Math.pow(10, eqGain / 20); // Convert dB gain to linear factor
                    break;
                }
            }
            freqDataArrayVisual[i] = Math.max(0, Math.min(255, freqDataTempVol[i] * gainFactor));
        }

        // Calculate smoothed bass for background pulsating effect
        const bassFrequencies = freqDataArrayVisual.slice(0, 10); // Take first 10 bins for bass
        const averageBass = bassFrequencies.reduce((a, b) => a + b, 0) / bassFrequencies.length;
        const normalizedBass = isNaN(averageBass) ? 0 : averageBass / 255; // Normalize to 0-1
        smoothedBass = lerp(smoothedBass, normalizedBass, 0.3); // Smooth over time

        // Apply pulsating background color if no background image is active
        if (!AppState.activeBackgroundImage) {
            const pulseMagnitude = 100; // Max percentage increase in lightness
            const baseLightness = AppState.backgroundLightness; // Base lightness from theme

            // Calculate current lightness based on smoothed bass
            const currentLightness = baseLightness + (smoothedBass * (100 - baseLightness) * (pulseMagnitude / 100));

            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${Math.min(100, Math.max(0, currentLightness))}%)`;
        } else {
            // When an image is present, maintain theme's base background color
            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
        }

        canvasCtx.save(); // Save canvas state before transformations

        // Define a logical drawing resolution
        const logicalDrawingWidth = 960;
        const logicalDrawingHeight = 540;

        // Calculate scale factors to fit canvas content to actual canvas dimensions
        const scaleX = canvas.clientWidth / logicalDrawingWidth;
        const scaleY = canvas.clientHeight / logicalDrawingHeight;
        const contentScale = Math.min(scaleX, scaleY); // Use min scale to fit content within view

        // Apply scaling for high-DPI displays and content scaling
        canvasCtx.scale(window.devicePixelRatio * contentScale, window.devicePixelRatio * contentScale);

        try {
            canvasCtx.clearRect(0, 0, logicalDrawingWidth, logicalDrawingHeight); // Clear canvas

            // Dynamically import visualizer module if not already loaded (should be loaded by now)
            if (!visual.module) {
                visual.module = await import(visual.path);
            }
            // Call the draw method of the active visualizer module
            visual.module.draw(canvasCtx, freqDataArrayVisual, smoothedBass, analyser, AppState.themeColors, logicalDrawingWidth, logicalDrawingHeight);
        } catch (error) {
            console.error("Error drawing visualizer:", error);
        } finally {
            canvasCtx.restore(); // Restore canvas state
        }
    }

    // Resizes the canvas to fit its container and resets visualizer if needed
    function resizeCanvas() {
        if (!canvas) return;
        const canvasWrapper = document.getElementById('canvas-aspect-ratio-container');
        if (!canvasWrapper) return;

        canvas.width = canvasWrapper.clientWidth * window.devicePixelRatio;
        canvas.height = canvasWrapper.clientHeight * window.devicePixelRatio;

        // Call reset on active visualizer module if it has a reset method
        for (const id in AppState.visuals) {
            const visual = AppState.visuals[id];
            if (visual.module && typeof visual.module.reset === 'function') {
                visual.module.reset();
            }
        }
    }

    // Stops the visualization and resets UI elements
    function stopVisualization() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId); // Stop animation loop
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
        // Disconnect audio nodes
        if (fileSourceNode) { try { fileSourceNode.disconnect(analyser); } catch (e) { } }
        if (desktopSourceNode) {
            try { desktopSourceNode.disconnect(analyser); } catch (e) { }
            if (mediaStream) { // Stop desktop media stream tracks
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
            audioContext.suspend(); // Suspend audio context
        }

        isStarted = false;
        isPaused = false;
        smoothedBass = 0;
        AppState.eqVisualGains = [0, 0, 0, 0, 0]; // Reset EQ gains

        // Reset UI elements to default appearance
        if (customVolumeSlider) {
            customVolumeSlider.updateValue(AppState.volumeGain); // Revert to AppState's volume
        }
        customEqSliders.forEach((slider, i) => {
            if (slider) {
                slider.updateValue(0); // Reset EQ sliders to 0
            }
        });

        showStartControls(); // Show initial start screen
        // Reset background to theme's base color and remove image
        document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;
        document.body.style.backgroundImage = 'none';
        if (container) container.style.transform = ''; // Reset any container transformations

        // Update play/pause icons
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');

        if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        updateCurrentSongDisplay(); // Reset song display
    }

    // Toggles audio pause/play
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
            if (!AppState.useDesktopAudio) { // Only play audio player if not desktop audio
                audioPlayer.play().catch(e => console.error("Error resuming audio:", e));
            }
            draw(); // Resume drawing
        }
    }

    // Applies a preset EQ configuration
    function applyEqPreset(gains) {
        if (!isStarted) return; // Only apply if visualizer is running
        AppState.eqVisualGains = [...gains]; // Update AppState
        customEqSliders.forEach((slider, i) => {
            if (slider) {
                slider.updateValue(gains[i]); // Update slider UI
            }
        });
    }

    // Selects a song by index and starts playing it
    function selectSong(index) {
        if (index < 0 || index >= AppState.audioFiles.length) return;
        AppState.currentAudioIndex = index;
        startAudioSource('file'); // Start playing the selected file
        renderSongList(); // Re-render song list to highlight active song
        saveSettings(); // Save current song index
    }

    // Renders the list of audio files in the song list panel
    function renderSongList() {
        if (!songListContainer) return;

        songListContainer.innerHTML = ''; // Clear previous list
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
                toggleSongList(); // Close song list after selection
            });
            songListContainer.appendChild(songButton);
        });
    }

    // Toggles the visibility of the song list panel
    function toggleSongList() {
        if (!songListContainer || !currentSongDisplayButton || !songChevron) return;

        AppState.isSongListOpen = !AppState.isSongListOpen;

        if (AppState.isSongListOpen) {
            songListContainer.classList.remove('hidden');
            currentSongDisplayButton.classList.add('active'); // Highlight song display button
            songChevron.classList.add('rotate-180'); // Rotate chevron
            renderSongList(); // Ensure song list is up-to-date when opened
        } else {
            songListContainer.classList.add('hidden');
            currentSongDisplayButton.classList.remove('active');
            songChevron.classList.remove('rotate-180');
        }
    }


    // --- Event Listeners Setup ---

    // Pause/Play button
    pauseButton.addEventListener('click', togglePause);

    // Previous/Next song buttons
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (!AppState.useDesktopAudio) playPrevAudio();
        });
        // Disable initially if desktop audio is selected
        prevButton.disabled = AppState.useDesktopAudio;
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (!AppState.useDesktopAudio) playNextAudio();
        });
        // Disable initially if desktop audio is selected
        nextButton.disabled = AppState.useDesktopAudio;
    }

    // Handle audio player song ending
    if (audioPlayer) {
        audioPlayer.onended = () => {
            if (!AppState.useDesktopAudio) {
                playNextAudio();
            }
        };
    }

    // EQ Toggle and Reset buttons
    eqToggleBtn.addEventListener('click', toggleEqPanel);
    eqResetBtn.addEventListener('click', () => {
        applyEqPreset([0, 0, 0, 0, 0]); // Reset EQ to flat
        saveSettings();
    });

    // Settings Menu Toggle
    settingsToggleBtn.addEventListener('click', toggleSettingsMenu);

    // Current Song Display (for toggling song list)
    currentSongDisplayButton.addEventListener('click', toggleSongList);

    // Accordion Buttons for settings panels
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


    // --- Core Application Initialization Sequence ---

    // 1. Initialize audio graph (creates audio context, analyser, etc.)
    initializeAudioGraph();

    // 2. Create CustomSlider instances (they will read initial values from HTML but won't be synced with localStorage yet)
    if (volumeSliderWrapper && volumeSliderHiddenInput) {
        customVolumeSlider = new CustomSlider(
            'volume-slider-wrapper',
            'volume-slider',
            (newValue) => {
                AppState.volumeGain = newValue;
                if (!AppState.useDesktopAudio && audioPlayer) {
                    audioPlayer.volume = newValue;
                }
                debounceSave(); // Save setting after change
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
                    debounceSave(); // Save setting after change
                }
            );
            customEqSliders.push(slider);
        }
    });

    // 3. Load modules from manifest.json. This populates `AppState` with available options and manifest defaults.
    await loadModulesFromManifest();

    // 4. Load saved settings from localStorage. This *overwrites* the manifest defaults in `AppState`
    // with any user-persisted preferences.
    loadSettings();

    // 5. NOW, update ALL UI elements to reflect the final `AppState` values.
    // This is the crucial step to ensure the UI matches the loaded settings.

    // Update Volume Slider UI
    if (customVolumeSlider) {
        customVolumeSlider.updateValue(AppState.volumeGain); // Explicitly set slider position
        if (!AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = AppState.volumeGain; // Set actual audio player volume
        } else if (AppState.useDesktopAudio && audioPlayer) {
            audioPlayer.volume = 0; // Mute if desktop audio is selected
        }
    }

    // Update EQ Sliders UI
    customEqSliders.forEach((slider, i) => {
        if (slider && i < AppState.eqVisualGains.length) {
            slider.updateValue(AppState.eqVisualGains[i]); // Explicitly set slider position for each EQ band
        }
    });

    // Update Visualizer Selection UI (buttons and active state)
    setupVisualizerButtons();

    // Update Theme Selection UI and apply CSS variables (buttons and background color)
    await loadAndApplyTheme(AppState.activeThemeId);
    setupThemeButtons(); // Re-render/re-highlight theme buttons

    // Update Background Image UI (buttons, actual background image)
    setupBackgroundImageButtons();
    applyBackgroundImage(AppState.activeBackgroundImage);

    // Update Audio Source Radio Buttons state
    if (sourceDesktopRadio && sourceFileRadio) {
        sourceDesktopRadio.checked = AppState.useDesktopAudio;
        sourceFileRadio.checked = !AppState.useDesktopAudio;
        // Also update the disabled state of prev/next buttons
        if (prevButton) prevButton.disabled = AppState.useDesktopAudio;
        if (nextButton) nextButton.disabled = AppState.useDesktopAudio;
    }

    // Update Current Song Display and render song list
    updateCurrentSongDisplay();
    renderSongList();


    // 6. Final setup and start visualization
    if (startControls) {
        startControls.classList.add('hidden'); // Hide the start screen
    }

    isStarted = true;
    showActiveControls(); // Show active controls (volume, EQ, etc.)
    resizeCanvas(); // Ensure canvas is correctly sized

    // Determine initial audio source and start visualization
    const audioSourceType = AppState.useDesktopAudio ? 'desktop' : 'file';

    if (audioSourceType === 'file') {
        if (AppState.audioFiles.length === 0 || AppState.currentAudioIndex === -1) {
            if (messageElement) messageElement.textContent = "No audio files configured. Visualizer running without audio input.";
            console.warn("No audio files configured or default index invalid. Visualizer will run without direct audio input from files.");
            draw(); // Start drawing loop even without audio input
        } else {
            await startAudioSource(audioSourceType); // Start audio and drawing
        }
    } else if (audioSourceType === 'desktop') {
        await startAudioSource(audioSourceType); // Request desktop audio and start drawing
    } else {
        if (messageElement) messageElement.textContent = "No audio source configured. Visualizer running without audio.";
        console.warn("No audio source type configured. Visualizer will run without audio input.");
        draw(); // Fallback to drawing without audio if source is undefined
    }

    // Native bridge for FiveM/similar environments
    if (window.invokeNative) {
        window.invokeNative('ready');
    }

    // Global event listeners for responsiveness and messages
    window.addEventListener('resize', () => {
        resizeCanvas(); // Recalculate canvas size on window resize
    });
    window.addEventListener('focus', () => {
        resizeCanvas(); // Recalculate canvas size on window focus (useful if tabbed away)
    });

    resizeCanvas(); // Initial resize on load

    // Listener for messages from external environments (e.g., FiveM)
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.eventName === 'setLoadingText') {
            // Handle loading text update
        } else if (data.eventName === 'setLoadingProgress') {
            // Handle loading progress update
        }
    });
});
