// Audio system for sound effects using Web Audio API
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
        
        this.initAudio();
    }
    
    initAudio() {
        try {
            // Create audio context (handle browser differences)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    // Resume audio context if needed (required by some browsers)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Generate and play a tone
    playTone(frequency, duration, type = 'sine', volume = null) {
        if (!this.enabled || !this.audioContext) return;
        
        const actualVolume = volume !== null ? volume : this.volume;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure oscillator
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Configure volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(actualVolume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        // Play sound
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Play footstep sound
    playFootstep() {
        if (!this.enabled) return;
        
        // Create a short, low-pitched thud
        this.playTone(80, 0.1, 'triangle', 0.2);
        
        // Add a slight high-frequency click
        setTimeout(() => {
            this.playTone(200, 0.05, 'square', 0.1);
        }, 20);
    }
    
    // Play wall collision sound
    playWallCollision() {
        if (!this.enabled) return;
        
        // Create a harsh collision sound
        this.playTone(150, 0.15, 'sawtooth', 0.3);
        
        // Add a metallic clang
        setTimeout(() => {
            this.playTone(800, 0.1, 'triangle', 0.2);
        }, 30);
    }
    
    // Play victory sound
    playVictory() {
        if (!this.enabled) return;
        
        // Play a victory melody (ascending notes)
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        const noteDuration = 0.3;
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                this.playTone(frequency, noteDuration, 'triangle', 0.4);
            }, index * 200);
        });
        
        // Add a final flourish
        setTimeout(() => {
            this.playTone(523.25, 0.6, 'sine', 0.3);
        }, notes.length * 200);
    }
    
    // Play game start sound
    playGameStart() {
        if (!this.enabled) return;
        
        // Ascending swoosh
        this.playTone(200, 0.3, 'sine', 0.2);
        setTimeout(() => {
            this.playTone(400, 0.2, 'sine', 0.15);
        }, 100);
    }
    
    // Play treasure collection sound
    playTreasureCollect() {
        if (!this.enabled) return;
        
        // Pleasant chime sound
        this.playTone(523.25, 0.2, 'triangle', 0.3); // C5
        setTimeout(() => {
            this.playTone(659.25, 0.2, 'triangle', 0.25); // E5
        }, 50);
        setTimeout(() => {
            this.playTone(783.99, 0.3, 'sine', 0.2); // G5
        }, 100);
    }
    
    // Create white noise for ambient effects
    playWhiteNoise(duration, volume = 0.05) {
        if (!this.enabled || !this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        whiteNoise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        whiteNoise.start(this.audioContext.currentTime);
        whiteNoise.stop(this.audioContext.currentTime + duration);
    }
    
    // Toggle sound on/off
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}