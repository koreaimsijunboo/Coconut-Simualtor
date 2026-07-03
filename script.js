const playBtn = document.getElementById('playBtn');
const modeScreen = document.getElementById('modeScreen');
const startScreen = document.getElementById('startScreen');
const arcadeBtn = document.getElementById('arcadeBtn');
const realisticBtn = document.getElementById('realisticBtn');
const gameScreen = document.getElementById('gameScreen');
const canvasContainer = document.getElementById('canvasContainer');
const scoreEl = document.getElementById('score');
const backBtn = document.getElementById('backBtn');
const realisticOverlay = document.getElementById('realisticOverlay');
const realisticOk = document.getElementById('realisticOk');
const waveSound = document.getElementById('waveSound');

let score = 0;
let scoreTimer = null;
let threeInited = false;
let renderer, scene, camera, controls, coconut;
let animating = false;
let animationId = null;
let mode = null; // 'arcade' or 'realistic'

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

playBtn.addEventListener('click', () => { hide(startScreen); show(modeScreen); });
arcadeBtn.addEventListener('click', () => { hide(modeScreen); show(gameScreen); mode = 'arcade'; score = 0; updateScore(); startArcade(); });
realisticBtn.addEventListener('click', () => {
	hide(modeScreen); show(gameScreen);
	mode = 'realistic'; score = 0; updateScore();
	// hide any existing canvas and show black background
	if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
	canvasContainer.classList.remove('arcadeBeach');
	canvasContainer.style.background = '#000';
	show(realisticOverlay);
});
backBtn.addEventListener('click', () => { show(modeScreen); hide(gameScreen); stopScore(); stopAnimation(); stopWaveSound(); hide(realisticOverlay); realisticOk.disabled = false; mode = null; });
realisticOk.addEventListener('click', () => {
	// Hide the explanatory overlay, prepare realistic black screen, and start scoring.
	hide(realisticOverlay);
	realisticOk.disabled = false;
	score = 0;
	updateScore();

	// If a renderer exists (from arcade), hide its canvas for realistic mode.
	if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
	// Ensure the canvas container is a black background for realistic mode.
	canvasContainer.classList.remove('arcadeBeach');
	canvasContainer.style.background = '#000';
	// Ensure HUD (score) is visible
	const hud = document.getElementById('hud');
	if (hud) hud.style.display = 'flex';

	startWaveSound();
	startScoreTimer(3000);
});

function startScoreTimer(intervalMs = 3000){
	stopScore();
	scoreTimer = setInterval(()=>{ score++; updateScore(); }, intervalMs);
}

function stopScore(){ if(scoreTimer){ clearInterval(scoreTimer); scoreTimer = null; } }

function updateScore(){ scoreEl.textContent = 'Score: ' + score; }

function startWaveSound(){
	if(!waveSound) return;
	waveSound.volume = 0.55;
	waveSound.currentTime = 0;
	waveSound.play().catch(() => {});
}

function stopWaveSound(){
	if(!waveSound) return;
	waveSound.pause();
	waveSound.currentTime = 0;
}

function initThree(){
	if(threeInited) return;
	threeInited = true;

	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	canvasContainer.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87CEEB);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
	camera.position.set(0,3,6);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	// Allow only look-around: disable panning and zooming
	controls.enablePan = false;
	controls.enableZoom = false;
	controls.enableRotate = true;

	const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
	scene.add(hemi);
	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(5,10,7);
	scene.add(dir);

	// sand
	const plane = new THREE.Mesh(
		new THREE.PlaneGeometry(200,200),
		new THREE.MeshStandardMaterial({color:0xF4E3A6})
	);
	plane.rotation.x = -Math.PI/2;
	scene.add(plane);

	// simple water plane placed beyond the sand to give a beach horizon
	const water = new THREE.Mesh(
		new THREE.PlaneGeometry(400,400),
		new THREE.MeshStandardMaterial({color:0x1ca3ff, metalness:0.2, roughness:0.6})
	);
	water.position.set(0,0,-120);
	water.rotation.x = -Math.PI/2;
	scene.add(water);

	const geom = new THREE.SphereGeometry(0.6, 32, 32);
	const mat = new THREE.MeshStandardMaterial({color:0x5C3611, roughness:1, metalness:0});
	coconut = new THREE.Mesh(geom, mat);
	coconut.position.y = 0.6;
	coconut.scale.set(1,0.9,1);
	scene.add(coconut);

	// make the controls orbit around the coconut so mouse only looks around it
	controls.target.copy(coconut.position);

	window.addEventListener('resize', onWindowResize);
}

function startArcade(){
	// Arcade uses a 2D beach image so it still works if WebGL or external scripts fail.
	canvasContainer.style.background = '';
	canvasContainer.classList.add('arcadeBeach');
	if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
	hide(realisticOverlay);
	if(typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined'){
		if(!threeInited) initThree();
		if (renderer && renderer.domElement) renderer.domElement.style.display = 'none';
	}
	// tweak coconut for arcade neon look
	if(coconut && coconut.material){
		coconut.material.color.set(0x7b2cff);
		coconut.material.emissive = new THREE.Color(0x2be6ff);
		coconut.material.emissiveIntensity = 0.08;
	}
	// arcade uses 2s interval
	startWaveSound();
	startScoreTimer(2000);
	startAnimation();
}

function startAnimation(){
	if(!renderer || !scene || !camera || !controls) return;
	if(animating) return;
	animating = true;
	function loop(){
		controls.update();
		if(coconut) coconut.rotation.y += 0.006;
		renderer.render(scene, camera);
		animationId = requestAnimationFrame(loop);
	}
	loop();
}

function stopAnimation(){
	if(!animating) return;
	animating = false;
	if(animationId) cancelAnimationFrame(animationId);
}

function onWindowResize(){
	const w = window.innerWidth;
	const h = window.innerHeight;
	if(camera){ camera.aspect = w/h; camera.updateProjectionMatrix(); }
	if(renderer) renderer.setSize(w,h);
}

updateScore();
