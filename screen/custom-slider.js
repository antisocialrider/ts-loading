export class CustomSlider {
    constructor(elementId, hiddenInputId, onInputCallback) {
        this.wrapper = document.getElementById(elementId);
        this.hiddenInput = document.getElementById(hiddenInputId);
        this.thumb = this.wrapper.querySelector('.custom-slider-thumb');
        this.trackFill = this.wrapper.querySelector('.custom-slider-track-fill');
        this.nameDisplay = this.thumb.querySelector('.custom-slider-name');

        if (!this.wrapper || !this.hiddenInput || !this.thumb || !this.trackFill || !this.nameDisplay) {
            return;
        }
        this.min = parseFloat(this.hiddenInput.min);
        this.max = parseFloat(this.hiddenInput.max);
        this.step = parseFloat(this.hiddenInput.step);
        this.onInputCallback = onInputCallback;
        this.isDragging = false;
        this.value = parseFloat(this.hiddenInput.value);
        this.updatePosition();
        this.thumb.addEventListener('mousedown', this.startDrag);
        this.thumb.addEventListener('touchstart', this.startDrag, { passive: false }); 
        this.wrapper.addEventListener('click', this.handleClick);
        this.wrapper.addEventListener('keydown', this.handleKeydown); 
        this.stopDrag = this.stopDrag.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    startDrag = (e) => {
        e.preventDefault();
        this.isDragging = true;
        this.thumb.classList.add('cursor-grabbing');
        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);
        window.addEventListener('touchmove', this.onDrag, { passive: false });
        window.addEventListener('touchend', this.stopDrag);
    }

    stopDrag = () => {
        this.isDragging = false;
        this.thumb.classList.remove('cursor-grabbing');
        window.removeEventListener('mousemove', this.onDrag);
        window.removeEventListener('mouseup', this.stopDrag);
        window.removeEventListener('touchmove', this.onDrag);
        window.removeEventListener('touchend', this.stopDrag);
    }

    onDrag = (e) => {
        if (!this.isDragging) return;
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        const rect = this.wrapper.getBoundingClientRect();
        let newX = clientX - rect.left;
        newX = Math.max(0, Math.min(newX, rect.width));
        let newValue = (newX / rect.width) * (this.max - this.min) + this.min;
        newValue = Math.round(newValue / this.step) * this.step;
        newValue = parseFloat(newValue.toFixed(2));
        this.setValue(newValue);
    }

    handleClick = (e) => {
        if (e.target === this.thumb || this.isDragging) return; 

        const rect = this.wrapper.getBoundingClientRect();
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        let clickX = clientX - rect.left;

        let newValue = (clickX / rect.width) * (this.max - this.min) + this.min;
        newValue = Math.round(newValue / this.step) * this.step;
        newValue = parseFloat(newValue.toFixed(2));

        this.setValue(newValue);
    }

    handleKeydown = (e) => {
        let newValue = this.value;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            newValue = Math.min(this.max, this.value + this.step);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            newValue = Math.max(this.min, this.value - this.step);
            e.preventDefault();
        }
        if (newValue !== this.value) {
            this.setValue(newValue);
        }
    }

    setValue(newValue) {
        if (newValue === this.value) {
            return;
        }
        this.value = Math.max(this.min, Math.min(this.max, newValue));
        this.hiddenInput.value = this.value;
        this.updatePosition();
        this.onInputCallback(this.value);
    }

    updatePosition() {
        const percentage = (this.value - this.min) / (this.max - this.min);
        const thumbWidth = this.thumb.offsetWidth;
        const wrapperWidth = this.wrapper.offsetWidth;
        const thumbPositionX = percentage * (wrapperWidth - thumbWidth);
        this.thumb.style.left = `${thumbPositionX}px`;
        this.trackFill.style.width = `${thumbPositionX + (thumbWidth / 2)}px`;
    }

    updateValue(newValue) {
        this.setValue(newValue);
    }
}