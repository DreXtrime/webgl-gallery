import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new OrbitControls(camera, renderer.domElement);
const tour = new URLSearchParams(window.location.search).has('tour');

controls.enableZoom = false;
controls.enablePan = false;
controls.update();
controls.target.set(0, 1.7, -1);
camera.position.set(0, 1.7, 0);
camera.lookAt(0, 1.7, -1);
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
scene.add(new THREE.AmbientLight(0xffffff, 1));

const artworks = [
    { name: 'Art_1_panel', texture: '/textures/art_1.webp', offset: new THREE.Vector3(2, 0, 0) },
    { name: 'Art_2_panel', texture: '/textures/art_2.webp', offset: new THREE.Vector3(2, 0, 0) },
    { name: 'Art_3_panel', texture: '/textures/art_3.webp', offset: new THREE.Vector3(-2, 0, 0) },
    { name: 'Art_4_panel', texture: '/textures/art_4.webp', offset: new THREE.Vector3(-2, 0, 0) },
    { name: 'Donut', offset: new THREE.Vector3(0.1, 0.2, 0.3) },
    { name: 'Milk_carton', offset: new THREE.Vector3(-0.3, 0, -0.1) },
];

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

loader.load('/models/gallery.glb', (gltf) => {
    scene.add(gltf.scene);
    artworks.forEach(({ name, texture }) => {
        if (!texture) {
            return;
        }
        const object = gltf.scene.getObjectByName(name);
        if (!object) return;
        const tex = textureLoader.load(texture);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.rotation = Math.PI / 2;
        tex.center.set(0.5, 0.5);
        tex.flipY = false;
        object.material = new THREE.MeshBasicMaterial({ map: tex });
    });
});

let currentWaypoint = -1;
let phase = 'idle';
const targetPosition = new THREE.Vector3(0, 1.7, 0);
const targetLookAt = new THREE.Vector3(0, 1.7, -1);

function goToWaypoint(index) {
    scene.updateMatrixWorld(true);
    const { name, offset } = artworks[index];
    const artwork = scene.getObjectByName(name);
    if (!artwork) return;
    const artworkPos = new THREE.Vector3();
    artwork.getWorldPosition(artworkPos);
    targetPosition.copy(artworkPos).add(offset);
    targetLookAt.copy(artworkPos);
    phase = 'turning';
}

function next() {
    currentWaypoint = (currentWaypoint + 1) % artworks.length;
    goToWaypoint(currentWaypoint);
}

function prev() {
    currentWaypoint = (currentWaypoint - 1 + artworks.length) % artworks.length;
    goToWaypoint(currentWaypoint);
}

if (tour) {
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('prev-btn').style.display = 'none';
    controls.enableRotate = false;
    setInterval(next, 5000);
} else {
    document.getElementById('next-btn').addEventListener('click', next);
    document.getElementById('prev-btn').addEventListener('click', prev);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        const overlay = document.getElementById('fade-overlay');
        overlay.style.opacity = '0';
        overlay.addEventListener('transitionend', () => overlay.remove());
    }, 800);
});

const audio = new Audio('https://icecast.err.ee/klassikaraadiomadal.opus');
audio.loop = true;

document.getElementById('music-btn').addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        audio.volume = 0.5;
        document.getElementById('music-btn').textContent = '❚❚';
        if (tour) document.getElementById('music-btn').style.display = 'none';
    } else {
        audio.pause();
        document.getElementById('music-btn').textContent = '▷';
    }
});

function animate() {
    requestAnimationFrame(animate);
    if (phase === 'turning') {
        controls.target.lerp(targetLookAt, 0.04);
        if (controls.target.distanceTo(targetLookAt) < 0.1) phase = 'moving';
    } else if (phase === 'moving') {
        camera.position.lerp(targetPosition, 0.03);
        controls.target.lerp(targetLookAt, 0.05);
        // if (camera.position.distanceTo(targetPosition) < 0.05) phase = 'idle'
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();
