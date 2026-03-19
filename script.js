gsap.registerPlugin(ScrollTrigger);

// --- 1. UI SETUP & ANIMATIONS ---
gsap.from(".fade-up", { y: 60, opacity: 0, duration: 1.5, stagger: 0.2, ease: "power4.out", delay: 0.2 });
gsap.from(".delay-2", { y: 30, opacity: 0, duration: 1.5, ease: "power3.out", delay: 1.0 });

gsap.utils.toArray('.gold-line').forEach(line => {
    ScrollTrigger.create({ trigger: line, start: "top 90%", onEnter: () => gsap.fromTo(line, {width: "0%"}, {width: "100%", duration: 1.5, ease: "power2.out"}) });
});

gsap.to(".w-1", { y: -200, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom top", scrub: 0.5 } });
gsap.to(".w-2", { y: -300, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom top", scrub: 0.8 } });

const dot = document.getElementById('cursor-dot');
const glow = document.getElementById('cursor-glow');

// Raycaster setup for Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let dotX = mouseX, dotY = mouseY;
let glowX = mouseX, glowY = mouseY;

document.addEventListener('mousemove', (e) => { 
    mouseX = e.clientX; mouseY = e.clientY; 
    // Normalize mouse for Raycaster (-1 to +1)
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.querySelectorAll('a, .gold-btn, .project-card, input, textarea, button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

const circle = document.querySelector('.progress-ring__path');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;
window.addEventListener('scroll', () => {
    const scrollPercent = (document.documentElement.scrollTop || document.body.scrollTop) / ((document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight);
    circle.style.strokeDashoffset = circumference - scrollPercent * circumference;
});


// --- 2. THREE.JS: THE PORTFOLIO VOXEL ENGINE (INTERACTIVE CUBES) ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x00132b, 0.04);

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 18);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;

const mainGroup = new THREE.Group();
scene.add(mainGroup);

// Create the Cubes (Voxels)
const cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
cubeGeometry.computeBoundingBox();

// Materials
const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, roughness: 0.2, metalness: 0.9, flatShading: true
});
const blueMat = new THREE.MeshStandardMaterial({
    color: 0x002147, roughness: 0.1, metalness: 0.5, flatShading: true
});
const highlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xD4AF37, emissiveIntensity: 1.0, roughness: 0.1, metalness: 0.9
});

// We will store actual mesh objects so we can raycast them individually
const cubes = [];
const gridSize = 5; // 5x5x5 = 125 cubes
const gap = 1.2;
const offsetPoint = (gridSize * gap) / 2 - (gap / 2);

// Generate 125 Cubes
for(let x=0; x<gridSize; x++) {
    for(let y=0; y<gridSize; y++) {
        for(let z=0; z<gridSize; z++) {
            // Mix materials
            const isGold = Math.random() > 0.6;
            const mesh = new THREE.Mesh(cubeGeometry, isGold ? goldMat : blueMat);
            
            // Initial Position: A perfect cubic grid
            const px = (x * gap) - offsetPoint;
            const py = (y * gap) - offsetPoint;
            const pz = (z * gap) - offsetPoint;
            
            mesh.position.set(px, py, pz);
            
            // Store original data for interactivity and morphing
            mesh.userData = {
                originalMat: isGold ? goldMat : blueMat,
                targetScale: 1.0,
                // Target states for GSAP morphing!
                posGrid: new THREE.Vector3(px, py, pz),
                posSphere: new THREE.Vector3(),
                posRing: new THREE.Vector3(),
                posChaos: new THREE.Vector3()
            };

            // Calculate Sphere Position
            const radius = 6;
            const phi = Math.acos(-1 + (2 * cubes.length) / 125);
            const theta = Math.sqrt(125 * Math.PI) * phi;
            mesh.userData.posSphere.set(
                radius * Math.cos(theta) * Math.sin(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(phi)
            );

            // Calculate Ring Position
            const rAng = (cubes.length / 125) * Math.PI * 2;
            const rRad = 6 + (Math.random() - 0.5) * 2;
            mesh.userData.posRing.set(Math.cos(rAng) * rRad, (Math.random()-0.5)*2, Math.sin(rAng) * rRad);

            // Calculate Chaos Position
            mesh.userData.posChaos.set((Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*15);

            mainGroup.add(mesh);
            cubes.push(mesh);
        }
    }
}

// Add a delicate outer wireframe wrapper for composition
const wireGeo = new THREE.IcosahedronGeometry(9, 1);
const wireMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.05 });
const wireMesh = new THREE.Mesh(wireGeo, wireMat);
mainGroup.add(wireMesh);


// --- 3. CINEMATIC STUDIO LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const blueRim = new THREE.PointLight(0x00c3ff, 4, 30); 
blueRim.position.set(-8, -5, 4);
scene.add(blueRim);

const goldLight = new THREE.PointLight(0xD4AF37, 3, 30);
goldLight.position.set(8, 5, -5);
scene.add(goldLight);


// --- 4. SCROLL ANIMATIONS (GSAP) ---
// We will animate a global proxy object and apply it to all cubes
const morphProxy = { mix: 0, state: 0 }; 

gsap.set(mainGroup.position, { x: 4, y: 0 });

const tl = gsap.timeline({
    scrollTrigger: { trigger: ".scroll-container", start: "top top", end: "bottom bottom", scrub: 1.5 }
});

// Section 1 to 2 (Grid -> Sphere)
tl.to(morphProxy, { mix: 1, state: 1, ease: "power1.inOut" }, 0);
tl.to(mainGroup.position, { x: -4, y: 0, z: 2, ease: "power1.inOut" }, 0);
tl.to(mainGroup.rotation, { x: Math.PI * 0.25, y: Math.PI * 0.5 }, 0);

// Section 2 to 3 (Sphere -> Ring)
tl.to(morphProxy, { mix: 2, state: 2, ease: "power1.inOut" }, 0.4);
tl.to(mainGroup.position, { x: 0, y: 1, z: -2, ease: "power1.inOut" }, 0.4);
tl.to(mainGroup.rotation, { x: Math.PI * -0.1, y: Math.PI }, 0.4);

// Section 3 to 4 (Ring -> Chaos Explosion)
tl.to(morphProxy, { mix: 3, state: 3, ease: "power2.inOut" }, 0.8);
tl.to(mainGroup.position, { x: 0, y: 0, z: 2, ease: "power2.inOut" }, 0.8);
tl.to(mainGroup.rotation, { x: Math.PI * 0.4, y: Math.PI * 1.5 }, 0.8);


// --- 5. RENDER LOOP & INTERACTIVITY ---
const clock = new THREE.Clock();
let hoveredCube = null;
let targetRotationX = 0;
let targetRotationY = 0;

const tick = () => {
    const time = clock.getElapsedTime();

    // 1. Raycaster Logic (Which cube is the mouse over?)
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    // Reset previous hovered cube
    if(hoveredCube) {
        hoveredCube.userData.targetScale = 1.0;
        hoveredCube.material = hoveredCube.userData.originalMat;
        hoveredCube = null;
    }

    // Set new hovered cube
    if (intersects.length > 0) {
        hoveredCube = intersects[0].object;
        hoveredCube.userData.targetScale = 1.5; // Pop out
        hoveredCube.material = highlightMat;    // Change color to glowing white/gold
    }

    // 2. Animate all Cubes (Morphing + Scaling + Individual rotation)
    for(let i=0; i<cubes.length; i++) {
        const cube = cubes[i];
        
        // Smooth scaling for hover effect
        const currentScale = cube.scale.x;
        const s = currentScale + (cube.userData.targetScale - currentScale) * 0.15;
        cube.scale.set(s, s, s);

        // Calculate Target Position based on Scroll Proxy
        let targetPos;
        if (morphProxy.mix <= 1) {
            targetPos = cube.userData.posGrid.clone().lerp(cube.userData.posSphere, morphProxy.mix);
        } else if (morphProxy.mix <= 2) {
            targetPos = cube.userData.posSphere.clone().lerp(cube.userData.posRing, morphProxy.mix - 1);
        } else {
            targetPos = cube.userData.posRing.clone().lerp(cube.userData.posChaos, morphProxy.mix - 2);
        }

        // Apply smooth movement to target
        cube.position.lerp(targetPos, 0.1);

        // Add a tiny bit of individual random rotation so the 3D grid feels "alive"
        cube.rotation.x = Math.sin(time * 0.5 + i) * 0.2;
        cube.rotation.y = Math.cos(time * 0.5 + i) * 0.2;
    }

    // Rotate the overall group and wireframe slowly
    mainGroup.rotation.y += 0.002;
    wireMesh.rotation.x -= 0.001;
    wireMesh.rotation.y -= 0.002;

    // Hover Compass Tracking (Subtle tilt based on mouse)
    const normalizedMouseX = (mouseX / sizes.width) * 2 - 1;
    const normalizedMouseY = -(mouseY / sizes.height) * 2 + 1;
    
    targetRotationX = normalizedMouseY * 0.1;
    targetRotationY = normalizedMouseX * 0.1;

    mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;
    mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;

    // Custom Cursor Smoothing
    dotX += (mouseX - dotX) * 0.3;
    dotY += (mouseY - dotY) * 0.3;
    glowX += (mouseX - glowX) * 0.15;
    glowY += (mouseY - glowY) * 0.15;
    dot.style.left = dotX + 'px'; dot.style.top = dotY + 'px';
    glow.style.left = glowX + 'px'; glow.style.top = glowY + 'px';

    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
