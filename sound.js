"use strict";
//////////////////////////////////////////
const sound = {
    // adapted from https://codepen.io/lukeyphills/pen/GFsqK
    context: null,
    f: false,
    init() {
        if (window.location.href.indexOf("fullcpgrid") > -1) return;
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.AudioContext) return;
        this.context = new this.AudioContext();
        this.volume = this.context.createGain();
        this.oscVolume = this.context.createGain();
        this.finalVolume = this.context.createGain();
        this.filter = this.context.createBiquadFilter();
        this.delay = this.context.createDelay();
        this.feedbackGain = this.context.createGain();
        this.compressor = this.context.createDynamicsCompressor();
        this.n = this.context.createAnalyser();
        this.n.smoothingTimeConstant = .85;
    },
    routeSounds() {
        if (this.context === null) return;
        this.osc = this.context.createOscillator();
        this.osc.type = "sine";
        this.filter.type = "lowpass";
        this.feedbackGain.gain.value = 0.5;
        this.delay.delayTime.value = 0.225;
        this.volume.gain.value = 0.5;
        this.oscVolume.gain.value = 0;
        this.finalVolume.gain.value = 1;
        this.osc.connect(this.oscVolume);
        this.oscVolume.connect(this.filter);
        this.filter.connect(this.compressor);
        this.filter.connect(this.delay);
        this.delay.connect(this.feedbackGain);
        this.delay.connect(this.compressor);
        this.feedbackGain.connect(this.delay);
        this.compressor.connect(this.volume);
        this.volume.connect(this.finalVolume);
        this.finalVolume.connect(this.n);
        this.n.connect(this.context.destination);
        this.osc.start(0);
    },
    play() {
        if (this.context === null) return;
        if (this.f === false) {
            this.routeSounds();
            this.f = true;
        }
        if (this.context.state === 'suspended') this.context.resume();
        this.oscVolume.gain.value = 0.5;
        this.osc.frequency.value = 0;
        this.filter.frequency.value = 1000;
    },
    effect(freq) {
        if (this.context === null) return;
        if (this.f === true && this.context.state !== 'suspended') {
            this.osc.frequency.value = freq;
            this.filter.frequency.value = 1000;
        }
    },
    stop() {
        if (this.context === null) return;
        this.osc.frequency.value = 0;
        this.oscVolume.gain.value = 0;
    }
};