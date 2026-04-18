/**
 * Dororo - Splash/Intro Animation
 * Smooth spiral particle animation with brand reveal
 */

const SplashScreen = (() => {
    let canvas, ctx;
    let animFrame;
    const STAR_COUNT = 2000;
    const stars = [];
    let startTime = 0;
    let animRunning = true;

    // Smooth time tracking
    const CYCLE_DURATION = 12000; // 12 seconds per cycle

    // Constants
    const CHANGE_TIME = 0.32;
    const CAMERA_Z = -400;
    const CAMERA_TRAVEL = 3400;
    const START_Y = 28;
    const VIEW_ZOOM = 100;
    const TRAIL_LEN = 60;

    function ease(p, g) {
        if (p < 0.5) return 0.5 * Math.pow(2 * p, g);
        return 1 - 0.5 * Math.pow(2 * (1 - p), g);
    }

    function easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 4.5;
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
    }

    function map(v, s1, e1, s2, e2) { return s2 + (e2 - s2) * ((v - s1) / (e1 - s1)); }
    function constrain(v, min, max) { return Math.min(Math.max(v, min), max); }
    function lerp(a, b, t) { return a * (1 - t) + b * t; }

    function spiralPath(p) {
        p = constrain(1.2 * p, 0, 1);
        p = ease(p, 1.8);
        const theta = 2 * Math.PI * 6 * Math.sqrt(p);
        const r = 170 * Math.sqrt(p);
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) + START_Y };
    }

    function projectDot(pos, sizeFactor, time) {
        const t2 = constrain(map(time, CHANGE_TIME, 1, 0, 1), 0, 1);
        const camZ = CAMERA_Z + ease(Math.pow(t2, 1.2), 1.8) * CAMERA_TRAVEL;
        if (pos.z > camZ) {
            const depth = pos.z - camZ;
            const x = VIEW_ZOOM * pos.x / depth;
            const y = VIEW_ZOOM * pos.y / depth;
            const sw = 400 * sizeFactor / depth;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(sw / 2, 0.3), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function createStar() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 * Math.random() + 15;
        const rotDir = Math.random() > 0.5 ? 1 : -1;
        const expRate = 1.2 + Math.random() * 0.8;
        const finalScale = 0.7 + Math.random() * 0.6;
        const dx = dist * Math.cos(angle);
        const dy = dist * Math.sin(angle);
        const spiralLoc = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
        let z = (Math.random() * (CAMERA_TRAVEL + CAMERA_Z * 0.5)) + CAMERA_Z * 0.5;
        z = lerp(z, CAMERA_TRAVEL / 2, 0.3 * spiralLoc);
        const swFactor = Math.pow(Math.random(), 2.0);
        return { angle, dist, rotDir, expRate, finalScale, dx, dy, spiralLoc, z, swFactor };
    }

    function renderStar(star, p, time) {
        const sp = spiralPath(star.spiralLoc);
        const q = p - star.spiralLoc;
        if (q <= 0) return;
        const dp = constrain(4 * q, 0, 1);
        let sx, sy;

        if (dp < 0.3) {
            const e = lerp(dp, Math.pow(dp, 2), dp / 0.3);
            sx = lerp(sp.x, sp.x + star.dx * 0.3, e / 0.3);
            sy = lerp(sp.y, sp.y + star.dy * 0.3, e / 0.3);
        } else if (dp < 0.7) {
            const mid = (dp - 0.3) / 0.4;
            const curve = Math.sin(mid * Math.PI) * star.rotDir * 1.5;
            const bx = sp.x + star.dx * 0.3, by = sp.y + star.dy * 0.3;
            const tx = sp.x + star.dx * 0.7, ty = sp.y + star.dy * 0.7;
            sx = lerp(bx, tx, mid) + (-star.dy * 0.4 * curve) * mid;
            sy = lerp(by, ty, mid) + (star.dx * 0.4 * curve) * mid;
        } else {
            const fp = (dp - 0.7) / 0.3;
            const bx = sp.x + star.dx * 0.7, by = sp.y + star.dy * 0.7;
            const td = star.dist * star.expRate * 1.5;
            const sa = star.angle + 1.2 * star.rotDir * fp * Math.PI;
            sx = lerp(bx, sp.x + td * Math.cos(sa), fp);
            sy = lerp(by, sp.y + td * Math.sin(sa), fp);
        }

        const vx = (star.z - CAMERA_Z) * sx / VIEW_ZOOM;
        const vy = (star.z - CAMERA_Z) * sy / VIEW_ZOOM;
        let sm = dp < 0.6 ? 1.0 + dp * 0.2 : lerp(1.2, star.finalScale, (dp - 0.6) / 0.4);
        projectDot({ x: vx, y: vy, z: star.z }, 8.5 * star.swFactor * sm, time);
    }

    function render(time) {
        if (!ctx || !canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;

        ctx.fillStyle = '#050002';
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2);

        const t1 = constrain(map(time, 0, CHANGE_TIME + 0.25, 0, 1), 0, 1);
        const t2 = constrain(map(time, CHANGE_TIME, 1, 0, 1), 0, 1);
        ctx.rotate(-Math.PI * ease(t2, 2.7));

        // Red spiral trail
        for (let i = 0; i < TRAIL_LEN; i++) {
            const f = map(i, 0, TRAIL_LEN, 1.1, 0.1);
            const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
            const pos = spiralPath(t1 - 0.00015 * i);
            const alpha = map(i, 0, TRAIL_LEN, 0.9, 0.15);
            ctx.fillStyle = `rgba(229, 9, 20, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, Math.max(sw / 2, 0.3), 0, Math.PI * 2);
            ctx.fill();
        }

        // Stars
        ctx.fillStyle = 'rgba(255, 210, 210, 0.85)';
        for (const star of stars) renderStar(star, t1, time);

        // Center dot
        if (time > CHANGE_TIME) {
            ctx.fillStyle = '#E50914';
            projectDot({ x: 0, y: CAMERA_Z * START_Y / VIEW_ZOOM, z: CAMERA_TRAVEL }, 2.5, time);
        }

        ctx.restore();
    }

    function animate(timestamp) {
        if (!animRunning) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const time = (elapsed % CYCLE_DURATION) / CYCLE_DURATION;
        render(time);
        animFrame = requestAnimationFrame(animate);
    }

    function init() {
        if (sessionStorage.getItem('splash_done')) { removeSplash(); return; }

        const splash = document.getElementById('splash-screen');
        if (!splash) return;
        canvas = document.getElementById('splash-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        const dpr = window.devicePixelRatio || 1;
        const updateSize = () => {
            const w = window.innerWidth, h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        for (let i = 0; i < STAR_COUNT; i++) stars.push(createStar());
        animFrame = requestAnimationFrame(animate);

        // Fade in text
        setTimeout(() => {
            document.getElementById('splash-title')?.classList.add('visible');
        }, 600);
        setTimeout(() => {
            document.getElementById('splash-credits')?.classList.add('visible');
        }, 1200);
        setTimeout(() => {
            document.getElementById('splash-enter')?.classList.add('visible');
        }, 2200);

        document.getElementById('splash-enter')?.addEventListener('click', dismiss);
        const keyH = (e) => { if (e.key === 'Enter' || e.key === ' ') { dismiss(); window.removeEventListener('keydown', keyH); } };
        window.addEventListener('keydown', keyH);
    }

    function dismiss() {
        const s = document.getElementById('splash-screen');
        if (!s) return;
        s.classList.add('fade-out');
        sessionStorage.setItem('splash_done', '1');
        setTimeout(() => { animRunning = false; cancelAnimationFrame(animFrame); s.remove(); document.body.style.overflow = ''; }, 800);
    }

    function removeSplash() {
        const s = document.getElementById('splash-screen');
        if (s) { s.remove(); document.body.style.overflow = ''; }
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', SplashScreen.init);
