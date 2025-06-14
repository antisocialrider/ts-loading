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
    const currentSongDisplayButton = document.getElementById('current-song-display-button'); // New accordion button
    const currentSongTextSpan = document.querySelector('#current-song-display-button .current-song-text'); // Span inside the button
    const songListContainer = document.getElementById('song-list-container'); // New song list container
    const songChevron = document.getElementById('song-chevron'); // Chevron icon for the accordion

    // prevButton and nextButton are now outside activeControls
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    // FIX: Corrected variable assignment to prevent TypeError
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
    // Removed direct reference to accordionAudioSourceBtn if it's commented out in HTML
    // const accordionAudioSourceBtn = document.getElementById('accordion-audio-source');
    // const audioSourceContainer = document.getElementById('audio-source-container');
    // const chevronAudioSource = document.getElementById('chevron-audio-source'); // This might be null if audio source is commented.
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
        // NEW: Song accordion state
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
            // ADDED: Read defaultVolume from manifest, fallback to 0.25 if not present
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
            renderSongList(); // ADDED: Initial render of the song list

            setupVisualizerButtons();
            setupThemeButtons();
            setupBackgroundImageButtons(); 
            
            if (sourceDesktopRadio && sourceFileRadio) {
                sourceDesktopRadio.checked = AppState.useDesktopAudio;
                sourceFileRadio.checked = !AppState.useDesktopAudio;

                sourceDesktopRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = true;
                    stopVisualization(); 
                });
                sourceFileRadio.addEventListener('change', () => {
                    AppState.useDesktopAudio = false;
                    stopVisualization(); 
                });
            }

        } catch (error) {
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

        } catch (error) {
            // Error applying theme
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
        // Ensure necessary elements exist before proceeding
        if (!backgroundImageContainer || !backgroundImagesAccordionSection || !noBackgroundImageBtn) {
            console.warn("Missing background image elements (container, section, or no-image button). Skipping setup.");
            return;
        }

        // Check if there are any background images defined in manifest.json
        if (AppState.backgroundImages.length === 0) {
            backgroundImagesAccordionSection.classList.add('hidden'); // Hide the entire section if no images
            applyBackgroundImage(null); // Ensure no background image is active
            return;
        } else {
            backgroundImagesAccordionSection.classList.remove('hidden'); // Show the section if images exist
        }

        // Clear existing buttons *before* adding new ones, keep only 'no-background-image-btn' if present
        const existingButtons = Array.from(backgroundImageContainer.children);
        existingButtons.forEach(child => {
            if (child.id !== 'no-background-image-btn') { // Don't remove the 'No Image' button yet
                backgroundImageContainer.removeChild(child);
            }
        });
        
        // Remove 'no-background-image-btn' from its current position before re-appending it at the end
        if (noBackgroundImageBtn.parentNode === backgroundImageContainer) {
            backgroundImageContainer.removeChild(noBackgroundImageBtn);
        }

        // Loop through background images from AppState and create buttons for each
        AppState.backgroundImages.forEach(image => {
            const button = document.createElement('button');
            button.id = `bg-image-${image.id}`; // Assign a unique ID to the button
            button.textContent = image.name; // Set button text from image name
            button.className = 'w-full text-left px-3 py-2 text-sm rounded-md focus:outline-none theme-button-normal theme-accordion-button'; // Apply base styling
            
            // Check if this image is the currently active one and add 'theme-button-active' class
            // Use .includes() for imageUrl as it might contain path components
            if (AppState.activeBackgroundImage && AppState.activeBackgroundImage.includes(image.id)) {
                button.classList.add('theme-button-active');
            }

            // Append the image button to the container
            backgroundImageContainer.appendChild(button);

            // Add click event listener to the button
            button.addEventListener('click', () => applyBackgroundImage(image.url));
        });

        // Re-add the "No Image (Use Theme Color)" button at the very end of the list
        backgroundImageContainer.appendChild(noBackgroundImageBtn); 
        
        // Set active state for the "No Image" button
        // It's active if AppState.activeBackgroundImage is null or explicitly 'none'
        if (!AppState.activeBackgroundImage || AppState.activeBackgroundImage === 'none') {
            noBackgroundImageBtn.classList.add('theme-button-active');
        } else {
            noBackgroundImageBtn.classList.remove('theme-button-active');
        }
        // Add click event listener for the "No Image" button
        noBackgroundImageBtn.addEventListener('click', () => applyBackgroundImage(null));
    }

    function applyBackgroundImage(imageUrl) {
        AppState.activeBackgroundImage = imageUrl;

        document.querySelectorAll('#background-image-container button').forEach(btn => {
            btn.classList.remove('theme-button-active');
        });

        if (imageUrl) {
            // Apply the background image
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            
            // Set a static background color as a fallback *behind* the image
            // This color is derived from the theme's base background color.
            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h; // Update AppState with current theme's base HSL
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l;
            document.body.style.backgroundColor = `hsl(${AppState.backgroundHue}, ${AppState.backgroundSaturation}%, ${AppState.backgroundLightness}%)`;

            const imgFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            const imageId = imgFileName.substring(0, imgFileName.lastIndexOf('.'));
            const activeButton = document.getElementById(`bg-image-${imageId}`);
            if (activeButton) {
                activeButton.classList.add('theme-button-active');
            }

        } else { // No Image (Use Theme Color) selected
            document.body.style.backgroundImage = 'none';
            
            // CRITICAL FIX: Do NOT set a static HSL background color here.
            // Instead, reset it so the `draw` loop's pulsing effect can take over.
            document.body.style.backgroundColor = ''; // Reset to default (or CSS variable)

            // Ensure AppState's HSL is updated based on the *current theme*
            const primaryBgColor = AppState.themeColors.ui.backgrounds[0];
            const hslComponents = getHslComponents(primaryBgColor);
            AppState.backgroundHue = hslComponents.h;
            AppState.backgroundSaturation = hslComponents.s;
            AppState.backgroundLightness = hslComponents.l; // Set base for pulsing

            if (noBackgroundImageBtn) {
                noBackgroundImageBtn.classList.add('theme-button-active');
            }
        }
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
            try { fileSourceNode.disconnect(analyser); } catch (e) {}
        }
        if (desktopSourceNode) { 
            try { desktopSourceNode.disconnect(analyser); } catch (e) {}
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
                if (messageElement) messageElement.textContent = "No audio files available to play. Please add audio files to the 'audio' folder.";
                showStartControls();
                return;
            }
            const fileUrl = AppState.audioFiles[AppState.currentAudioIndex].url;
            audioPlayer.src = fileUrl;
            fileSourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioPlayer.loop = false;
            audioPlayer.play().catch(e => {
                if (messageElement) messageElement.textContent = "Autoplay blocked. Please click 'Start Listening' to begin audio.";
                showStartControls(); 
            });
            isStarted = true;
            isPaused = false;
            updateCurrentSongDisplay();
            if (prevButton) prevButton.disabled = false;
            if (nextButton) nextButton.disabled = false;
            audioPlayer.volume = AppState.volumeGain;

        } else if (type === 'desktop') {
            try {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                audioPlayer.volume = 0; 

                mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                if (mediaStream.getAudioTracks().length === 0) {
                    if (messageElement) messageElement.textContent = 'Audio not shared. Please try again and check the "Share audio" box.';
                    mediaStream.getVideoTracks().forEach(track => track.stop());
                    showStartControls();
                    return;
                }
                desktopSourceNode = audioContext.createMediaStreamSource(mediaStream);
                desktopSourceNode.connect(analyser);
                isStarted = true;
                isPaused = false;
                updateCurrentSongDisplay('Desktop Audio');
                if (prevButton) prevButton.disabled = true;
                if (nextButton) nextButton.disabled = true;

            } catch (err) {
                if (messageElement) messageElement.textContent = 'Could not access desktop audio. Please check browser permissions and reload.';
                showStartControls();
                return;
            }
        }

        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (isStarted) {
            if(messageElement) messageElement.textContent = '';
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
        } else {
            showStartControls();
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
        if (currentSongTextSpan) { // Update the span inside the button
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
        if (startControls) startControls.classList.remove('hidden');
        closeEqMenu();
        closeSideMenu();
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
                // { container: audioSourceContainer, chevron: accordionAudioSourceBtn } // Removed if commented in HTML
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
        // Corrected arrays to only include existing HTML elements
        const allAccordionButtons = [
            accordionVisualsBtn,
            accordionThemesBtn,
            accordionBackgroundImagesBtn
            // Removed accordionAudioSourceBtn as it's commented out in HTML
        ].filter(btn => btn !== null); // Filter out nulls to ensure array integrity

        const allContentContainers = [
            visualStyleContainer,
            themeContainer,
            backgroundImageContainer
            // Removed audioSourceContainer as it's commented out in HTML
        ].filter(container => container !== null); // Filter out nulls

        // Assuming chevronAudioSource might be null if audio source is commented
        const allChevronIcons = [
            chevronVisuals,
            chevronThemes,
            chevronBackgroundImages
            // Removed chevronAudioSource
        ].filter(chevron => chevron !== null); // Filter out nulls

        const clickedIndex = allAccordionButtons.indexOf(clickedButton);

        if (clickedIndex === -1) return; // If clicked button not found in active list, exit

        allContentContainers.forEach((container, index) => {
            const chevron = allChevronIcons[index];

            if (container && chevron && allAccordionButtons[index]) { // Added check for allAccordionButtons[index]
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

    // --- REMOVED scaleContainer function ---

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
        
        // Logical drawing dimensions (what visualizers were designed for)
        // Keep these consistent if you want internal drawing to always "feel" like 960x540
        const logicalDrawingWidth = 960;
        const logicalDrawingHeight = 540;

        // Calculate a scale factor for the visualizer content to fit the current canvas size
        // This ensures the visualizer content scales correctly to the actual canvas element's size.
        const scaleX = canvas.clientWidth / logicalDrawingWidth;
        const scaleY = canvas.clientHeight / logicalDrawingHeight;
        // Use the smaller scale to fit content without clipping if aspect ratio changes
        const contentScale = Math.min(scaleX, scaleY); 
        
        // First, scale for device pixel ratio, then scale content to fit the current canvas dimensions
        canvasCtx.scale(window.devicePixelRatio * contentScale, window.devicePixelRatio * contentScale);

        try {
            // Clear logical drawing area, using the logical dimensions
            canvasCtx.clearRect(0, 0, logicalDrawingWidth, logicalDrawingHeight);

            if (!visual.module) {
                visual.module = await import(visual.path);
            }
            // Pass the logical dimensions (960x540) to the draw function
            visual.module.draw(canvasCtx, freqDataArrayVisual, smoothedBass, analyser, AppState.themeColors, logicalDrawingWidth, logicalDrawingHeight);
        } catch (error) {
            console.error("Error drawing visualizer:", error);
        } finally {
            canvasCtx.restore();
        }
    }

    // Updated resizeCanvas function
    function resizeCanvas() {
        if (!canvas) return;
        const canvasWrapper = document.getElementById('canvas-aspect-ratio-container');
        if (!canvasWrapper) return;

        // Set canvas internal drawing resolution to match its *displayed* pixel size
        // This ensures crisp visuals for the current responsive size
        canvas.width = canvasWrapper.clientWidth * window.devicePixelRatio;
        canvas.height = canvasWrapper.clientHeight * window.devicePixelRatio;

        // Reset the visualizer modules after canvas resize
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
            try { fileSourceNode.disconnect(analyser); } catch (e) {}
        }
        if (desktopSourceNode) { 
            try { desktopSourceNode.disconnect(analyser); } catch (e) {}
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
        startAudioSource('file'); // Restart audio with new song
        renderSongList(); // Re-render to update active song highlight
    }

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
            songButton.classList.add('song-list-item'); // Add a class for styling individual song items
            if (index === AppState.currentAudioIndex) {
                songButton.classList.add('active-song'); // Highlight active song
            }
            songButton.addEventListener('click', () => {
                selectSong(index);
                toggleSongList(); // Close list after selection
            });
            songListContainer.appendChild(songButton);
        });
    }

    function toggleSongList() {
        if (!songListContainer || !currentSongDisplayButton || !songChevron) return;

        AppState.isSongListOpen = !AppState.isSongListOpen;

        if (AppState.isSongListOpen) {
            songListContainer.classList.remove('hidden');
            currentSongDisplayButton.classList.add('active'); // Style the button when list is open
            songChevron.classList.add('rotate-180'); // Rotate chevron
            renderSongList(); // Render list content when opening
        } else {
            songListContainer.classList.add('hidden');
            currentSongDisplayButton.classList.remove('active');
            songChevron.classList.remove('rotate-180');
        }
    }

    startButton.addEventListener('click', () => {
        if (AppState.useDesktopAudio) {
            startAudioSource('desktop');
        } else {
            if (AppState.audioFiles.length > 0 && AppState.currentAudioIndex !== -1) {
                startAudioSource('file');
            } else {
                if (messageElement) messageElement.textContent = "No audio files available. Please add audio files to the 'audio' folder (e.g., 1.mp3, 2.mp3).";
            }
        }
    });
    stopButton.addEventListener('click', stopVisualization);
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
    eqResetBtn.addEventListener('click', () => applyEqPreset([0, 0, 0, 0, 0]));

    settingsToggleBtn.addEventListener('click', toggleSettingsMenu);

    currentSongDisplayButton.addEventListener('click', toggleSongList);

    // Only add event listeners if the element exists in the DOM
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
    // No listener for accordionAudioSourceBtn if it's commented out in HTML
    // if (accordionAudioSourceBtn) {
    //     accordionAudioSourceBtn.addEventListener('click', () => {
    //         toggleAccordion(accordionAudioSourceBtn, audioSourceContainer, chevronAudioSource);
    //     });
    // }

    initializeAudioGraph();

    if (volumeSliderWrapper && volumeSliderHiddenInput) {
        // Pass AppState.volumeGain (which is now from manifest) to the slider's initial value
        volumeSliderHiddenInput.value = AppState.volumeGain; // Set hidden input value
        customVolumeSlider = new CustomSlider(
            'volume-slider-wrapper',
            'volume-slider', // This ID matches the hidden input
            (newValue) => {
                AppState.volumeGain = newValue;
                if (!AppState.useDesktopAudio && audioPlayer) {
                    audioPlayer.volume = newValue;
                }
            }
        );
        customVolumeSlider.updateValue(AppState.volumeGain); // Ensure visual position matches
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
                }
            );
            customEqSliders.push(slider);
        }
    });

    loadModulesFromManifest();
    window.addEventListener('resize', () => {
        resizeCanvas(); // This will recalculate canvas resolution based on its new CSS size
    });
    window.addEventListener('focus', () => {
        resizeCanvas(); // Ensure canvas attributes are updated on focus
    });

    resizeCanvas(); // Initial call
});