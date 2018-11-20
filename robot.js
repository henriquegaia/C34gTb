"use strict";
/////////////// Robots ///////////////////
const Robot = class {
    constructor(canvas, sx, struct) {
        this.n = 0;
        this.x = sx * Math.min(canvas.width, canvas.height);
        this.sx = sx;
        this.frame = 0;
        this.dir = 1;
        this.nodes = [];
        this.constraints = [];
        this.images = [];
        this.pace = 28;
        this.friction = 1.0;
        // create nodes
        for (let n in struct.nodes) {
            const node = new Robot.Node(this, struct.nodes[n]);
            struct.nodes[n].id = node;
            this.nodes.push(node);
        }
        // create constraints and textures
        for (let c of struct.constraints) {
            const constraint = new Robot.Constraint(struct, c);
            this.constraints.push(constraint);
            if (c.svg) {
                constraint.decodeSVG(this, struct.svg[c.svg]);
                this.images.push(constraint);
            }
        }
    }
    resize(w, h, s) {
        // windows resize - regenerate SVG cache
        this.x = this.sx * Math.min(w, h);
        this.images.forEach(c => {
            c.cacheSVG(s);
        });
    }
    load(canvas) {
        // initial load
        if (this.n === this.images.length) {
            this.resize(canvas.width, canvas.height, canvas.scale);
            return 1;
        }
        return 0;
    }
    dance(canvas, pointer) {
        // main rendering function
        const width = canvas.width;
        const height = canvas.height;
        const scale = canvas.scale;
        // dance
        if (++this.frame % this.pace === 0) this.dir = -this.dir;
        // dragging
        if (pointer.drag) {
            const d = pointer.drag;
            d.x += ((pointer.x - width * 0.5) / scale - d.x) * 0.5;
            d.y += (pointer.y / scale - pointer.drag.y) * 0.5;
        }
        // Verlet integration
        for (const n of this.nodes) {
            n.integrate(width, height, scale, pointer);
        }
        // solve constraints
        for (let i = 0; i < 5; i++) {
            for (const n of this.constraints) {
                n.solve();
            }
        }
        // draw shapes
        for (const n of this.images) {
            n.draw(width, height, scale);
        }
    }
    down() {
        this.friction = 0.99;
        this.pace = 10;
        this.force(2);
    }
    up() {
        this.friction = 1.0;
        this.pace = 28;
        this.force(0.6);
    }
    force(f) {
        for (const n of this.nodes) {
            n.f = f;
        }
    }
};
Robot.Node = class {
    constructor(robot, node) {
        this.robot = robot;
        this.x = node.x + robot.x;
        this.y = node.y;
        this.w = node.w;
        this.oldX = this.x;
        this.oldY = this.y;
        this.mass = node.mass || 1.0;
        this.func = node.f || null;
        this.f = 0.6;
    }
    integrate(width, height, scale, pointer) {
        // dance functions
        if (this.func !== null) {
            if (!(pointer.drag && pointer.drag.robot === this.robot)) {
                this.func(this.robot.dir);
            }
        }
        // Verlet integration
        const x = this.x;
        const y = this.y;
        this.x += (this.x - this.oldX) * this.robot.friction;
        this.y += (this.y - this.oldY) * this.robot.friction;
        this.oldX = x;
        this.oldY = y;
        // interactions
        if (pointer.isDown) this.down(width, height, scale, pointer);
        else if (pointer.drag !== null) pointer.drag = null;
        // ground contact
        if (this.y > height / scale - this.w) {
            this.x += this.oldX - this.x;
            this.oldX = this.x;
            this.y = height / scale - this.w;
            this.oldY = this.y;
        }
    }
    down(width, height, scale) {
        ctx.beginPath();
        ctx.arc(
            this.x * scale + width * 0.5,
            this.y * scale,
            this.w * scale * 3,
            0,
            2 * Math.PI
        );
        /* DEBUG
            ctx.strokeStyle = "#666";
            ctx.stroke();
        */
        if (pointer.drag === null) {
            if (ctx.isPointInPath(pointer.x, pointer.y)) {
                pointer.drag = this;
            }
        }
    }
    follow() {
        if (pointer.drag && pointer.drag !== this.robot) {
            this.x += ((pointer.x - canvas.width * 0.5) / canvas.scale - this.x) * 0.01;
            this.y += (pointer.y / canvas.scale - this.y) * 0.01;
        }
    }
};
Robot.Constraint = class {
    constructor(struct, c) {
        this.n0 = struct.nodes[c.n0].id;
        this.n1 = struct.nodes[c.n1].id;
        this.img = null;
        this.texture = null;
        this.x = c.x || 0.0;
        this.y = c.y || 0.0;
        this.a = c.a || 0.0;
        const dx = this.n0.x - this.n1.x;
        const dy = this.n0.y - this.n1.y;
        this.dist = dx * dx + dy * dy;
    }
    solve() {
        const dx = this.n1.x - this.n0.x;
        const dy = this.n1.y - this.n0.y;
        const delta = this.dist / (dx * dx + dy * dy + this.dist) - 0.5;
        const m = this.n0.mass + this.n1.mass;
        const m2 = this.n0.mass / m;
        const m1 = this.n1.mass / m;
        this.n1.x += delta * dx * m2;
        this.n1.y += delta * dy * m2;
        this.n0.x -= delta * dx * m1;
        this.n0.y -= delta * dy * m1;
    }
    draw(width, height, scale) {
        const dx = this.n1.x - this.n0.x;
        const dy = this.n1.y - this.n0.y;
        const a = Math.atan2(dy, dx) - Math.PI * 0.5 + this.a;
        ctx.save();
        ctx.translate(this.n0.x * scale + width * 0.5, this.n0.y * scale);
        ctx.rotate(a);
        /* DEBUG
            ctx.strokeStyle = "#666";
            ctx.strokeRect(
                this.x * scale,
                this.y * scale,
                this.texture.width,
                this.texture.height
            );
        */
        ctx.drawImage(this.texture, this.x * scale, this.y * scale);
        ctx.restore();
        /* DEBUG
            ctx.beginPath();
            ctx.moveTo(this.n0.x * scale + width * 0.5, this.n0.y * scale);
            ctx.lineTo(this.n1.x * scale + width * 0.5, this.n1.y * scale);
            ctx.strokeStyle = "#fff";
            ctx.stroke();
        */
    }
    load() {
        this.width = this.img.width;
        this.height = this.img.height;
        const texture = document.createElement("canvas");
        const ctx = texture.getContext("2d");
        texture.width = this.width;
        texture.height = this.height;
        ctx.drawImage(this.img, 0, 0, this.width, this.height);
        this.img = texture;
    }
    decodeSVG(robot, svg) {
        this.texture = document.createElement("canvas");
        this.img = new Image();
        this.img.onload = e => robot.n++;
        this.img.src = "data:image/svg+xml;base64," + window.btoa(svg);
    }
    cacheSVG(scale) {
        const ctx = this.texture.getContext("2d");
        this.texture.width = Math.floor(this.img.width * scale) + 1;
        this.texture.height = Math.floor(this.img.height * scale) + 1;
        ctx.drawImage(this.img, 0, 0, this.texture.width, this.texture.height);
    }
};
