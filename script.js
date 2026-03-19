gsap.registerPlugin(ScrollTrigger);

// Initial Hero Animation
gsap.from(".elegant-title, .sub-desc, .tagline", {
    y: 40,
    opacity: 0,
    duration: 1.5,
    stagger: 0.15,
    ease: "power3.out",
    delay: 0.3
});

// Animate lines
gsap.utils.toArray('.gold-line').forEach(line => {
    ScrollTrigger.create({
        trigger: line,
        start: "top 90%",
        onEnter: () => gsap.fromTo(line, {width: "0%"}, {width: "100%", duration: 1.5, ease: "power2.out"})
    });
});

// --- 2. THREE.JS OXFORD GYROSCOPE/ASTROLABE SETUP ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 16);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Allow manual rotating
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;

// --- 3. MAJESTIC 3D GEOMETRY ---
const mainGroup = new THREE.Group();
scene.add(mainGroup);

// Elegant Gold Material
const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 1.5
});

// Create Astrolabe Rings (nested Torus)
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.05, 32, 100), goldMaterial);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.08, 32, 100), goldMaterial);
const ring3 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.1, 32, 100), goldMaterial);

// Rotate them internally on different axes so they spin beautifully
ring1.rotation.x = Math.PI * 0.5;
ring2.rotation.y = Math.PI * 0.25;
ring3.rotation.z = Math.PI * 0.3;

mainGroup.add(ring1, ring2, ring3);

// Inner Core - Mathematical geometric shape (Icosahedron) representing data/complex science
const coreGeo = new THREE.IcosahedronGeometry(1.5, 1);
const coreMat = new THREE.MeshStandardMaterial({
    color: 0xF9F6F0,    // Ivory White
    roughness: 0.1,
    metalness: 0.3,
    wireframe: true,    // Wireframe looks highly intellectual/mathematical
    transparent: true,
    opacity: 0.5
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
mainGroup.add(coreMesh);


// Inner glowing mathematical nucleus
const nucleus = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.MeshBasicMaterial({ color: 0xD4AF37 })
);
mainGroup.add(nucleus);

// Add faint mathematical particles around
const particlesGeo = new THREE.BufferGeometry();
const particleCount = 400;
const posArray = new Float32Array(particleCount * 3);
for(let i=0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({
    size: 0.03,
    color: 0xD4AF37,
    transparent: true,
    opacity: 0.3
});
const particles = new THREE.Points(particlesGeo, particleMat);
mainGroup.add(particles);


// --- 4. LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);

const blueLight = new THREE.PointLight(0x002147, 5, 20); // Deep Oxford Blue accent
blueLight.position.set(-5, 5, 0);
scene.add(blueLight);

const goldLight = new THREE.PointLight(0xD4AF37, 2, 15);
goldLight.position.set(0, 0, 0); // Put golden light in the middle
scene.add(goldLight);


// --- 5. SCROLL INTERACTIONS (Move the Astrolabe) ---
// Initially shift the astrolabe to the right, to balance the heavy text on the left
gsap.set(mainGroup.position, { x: 3.5, y: -0.5 });

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
    }
});

// 1. Hero -> Academic Rigour
tl.to(mainGroup.position, { x: -3.5, y: -1, z: 2, ease: "power1.inOut" }, 0);
tl.to(mainGroup.rotation, { x: Math.PI * 0.5, ease: "power1.inOut" }, 0);

// 2. Academic Rigour -> Projects
tl.to(mainGroup.position, { x: 0, y: 1, z: -3, ease: "power1.inOut" }, 0.4);
tl.to(mainGroup.rotation, { y: Math.PI, ease: "power1.inOut" }, 0.4);

// 3. Projects -> Statement
tl.to(mainGroup.position, { x: 0, y: 0, z: 2, ease: "power2.inOut" }, 0.8);
tl.to(mainGroup.scale, { x: 1.2, y: 1.2, z: 1.2, ease: "power2.inOut" }, 0.8);
tl.to(coreMat, { opacity: 1, wireframe: false }, 0.8); // Core becomes solid at the end


// --- 6. RENDER LOOP ---
const clock = new THREE.Clock();

const tick = () => {
    const time = clock.getElapsedTime();

    // Constant mathematical rotation
    ring1.rotation.y = time * 0.15;
    ring2.rotation.x = time * 0.2;
    ring3.rotation.z = time * 0.1;
    
    coreMesh.rotation.x = time * 0.3;
    coreMesh.rotation.y = time * 0.3;
    
    nucleus.rotation.y = time * 0.5;
    nucleus.rotation.z = time * 0.5;

    particles.rotation.y = time * 0.05;

    // Pulse the glowing core slightly
    goldLight.intensity = 2 + Math.sin(time * 2) * 1;

    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();

// --- 7. RESIZE EVENT ---
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
