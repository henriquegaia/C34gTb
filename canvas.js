"use strict";
//////////////////////////////////////////
const canvas = {
    init() {
        this.elem = document.querySelector("canvas");
        this.resize();
        window.addEventListener("resize", () => this.resize(), false);
        return this.elem.getContext("2d", { lowLatency: true });
    },
    resize() {
        this.width = this.elem.width = this.elem.offsetWidth;
        this.height = this.elem.height = this.elem.offsetHeight;
        this.scale = Math.min(this.width, this.height) / 1100;
        robots.forEach(robot => robot.resize(this.width, this.height, this.scale));
    },
    clear() {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
        if (projectorColor !== backgroundColor) {
            ctx.fillStyle = projectorColor;
            ctx.beginPath();
            ctx.arc(canvas.width * 0.5, canvas.height * 0.5, canvas.scale * 500, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
};