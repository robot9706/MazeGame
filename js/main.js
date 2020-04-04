var WIDTH, HEIGHT, aspectRatio;
var renderer;
var scene, camera;

var clock;

var shadowLight;

function main_init() {
    resources_load(main_start);
}

function main_start() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    aspectRatio = WIDTH / HEIGHT;

    input_init();

    clock = new THREE.Clock();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById("canvas").appendChild(renderer.domElement);

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowCameraNear = 3;
    renderer.shadowCameraFar = 50;
    renderer.shadowCameraFov = 50;
    renderer.shadowMapBias = 0.00005;
    renderer.shadowMapDarkness = 0.2;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;

    // New scene
    scene = new THREE.Scene();

    // Cloud lights
    var cloudDir = new THREE.DirectionalLight(0xffffff, 1, 2);
    cloudDir.position.set(4, 5, 2);
    cloudDir.layers.set(1);
    scene.add(cloudDir);
    scene.add(cloudDir.target);
    cloudDir.target.position.set(0,0,0);

    var cloudAmbient = new THREE.AmbientLight(0xDDDDDD);
    cloudAmbient.layers.set(1);
    scene.add(cloudAmbient);

    // Main lights
    scene.add(new THREE.AmbientLight(0x888888));

    shadowLight = new THREE.DirectionalLight(0xffffff, 1, 2);
    shadowLight.position.set(4, 5, 2);
    shadowLight.castShadow = true;
    scene.add(shadowLight);
    scene.add(shadowLight.target);

    // Create a skybox
    skybox_init(scene);

    // Create clouds
    clouds_create(scene);

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.05, 1000);
    camera.position.x = 2.5;
    camera.position.y = 0.5;
    camera.position.z = 2.5;
    camera.lookAt(new THREE.Vector3(1.5, 0.5, 1.5));

    // Create the camera controller
    camControls = new THREE.PointerLockControls(camera, document.body);
    scene.add(camControls.getObject());

    camControls.addEventListener("lock", function() {
        document.getElementById("menu").style.display = "none";
    });
    camControls.addEventListener("unlock", function() {
        document.getElementById("menu").style.display = "block";
    });

    window.addEventListener('resize', main_handleWindowResize, false);

    // Start the game
    game_start();

    document.getElementById("btn_loading").style.display = "none";
    document.getElementById("btn_start").style.display = "block";
    document.getElementById("btn_start").addEventListener("click", function(e){
        camControls.lock();
    });

    requestAnimationFrame(main_render);
}

function main_handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    renderer.setSize(WIDTH, HEIGHT);
    aspectRatio = WIDTH / HEIGHT;

    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
}

var main_render = function () {
    var delta = clock.getDelta();

    player_update(delta);
    game_update(delta);

    // Move light
    var cameraDirection = camControls.getDirection(new THREE.Vector3());
    cameraDirection.y = 0;

    shadowLight.position.copy(camera.position);
    shadowLight.position.add(new THREE.Vector3(4,5,2));
    shadowLight.position.addScaledVector(cameraDirection, 5);
    shadowLight.target.position.copy(camera.position);
    shadowLight.target.position.addScaledVector(cameraDirection, 5);

    TWEEN.update();

    renderer.autoClear = true;
    camera.layers.set(0);
    renderer.render(scene, camera);

    renderer.autoClear = false;
    camera.layers.set(1);
    renderer.render(scene, camera);

    requestAnimationFrame(main_render);
};

Math.lerp = function (value1, value2, amount) {
	amount = amount < 0 ? 0 : amount;
	amount = amount > 1 ? 1 : amount;
	return value1 + (value2 - value1) * amount;
};