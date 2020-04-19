var WIDTH, HEIGHT, aspectRatio;
var renderer;
var scene, camera;
var sceneOrtho, cameraOrtho;

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

    // Renderer létrehozása
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

    // Új színtér
    scene = new THREE.Scene();

    // Felhrő réteg fény forrásai
    var cloudDir = new THREE.DirectionalLight(0xffffff, 1, 2);
    cloudDir.position.set(4, 5, 2);
    cloudDir.layers.set(1);
    scene.add(cloudDir);
    scene.add(cloudDir.target);
    cloudDir.target.position.set(0, 0, 0);

    var cloudAmbient = new THREE.AmbientLight(0xDDDDDD);
    cloudAmbient.layers.set(1);
    scene.add(cloudAmbient);

    // Fő réteg fényforrásai
    scene.add(new THREE.AmbientLight(0x888888));

    shadowLight = new THREE.DirectionalLight(0xffffff, 1, 2);
    shadowLight.position.set(4, 5, 2);
    shadowLight.castShadow = true;
    scene.add(shadowLight);
    scene.add(shadowLight.target);

    // Skybox létrehozása
    skybox_init(scene);

    // Felhők létrehozása
    clouds_create(scene);

    // Kamera
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.05, 1000);
    camera.lookAt(new THREE.Vector3(1.5, 0.5, 1.5));

    // UI jelenet
    sceneOrtho = new THREE.Scene();

    // UI camera
    cameraOrtho = new THREE.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, 0, 10);
    cameraOrtho.position.z = 10;

    // FPS kamera vezérlő
    camControls = new THREE.PointerLockControls(camera, document.body);
    scene.add(camControls.getObject());

    camControls.addEventListener("lock", function () {
        document.getElementById("menu").style.display = "none";
    });
    camControls.addEventListener("unlock", function () {
        document.getElementById("menu").style.display = "block";
    });

    window.addEventListener('resize', main_handleWindowResize, false);

    // EnvMap előkészítés
    var envmap = res.envmap.data;
    envmap.mapping = THREE.EquirectangularReflectionMapping;
    envmap.encoding = THREE.sRGBEncoding;

    // Játék indítása
    game_start();

    document.getElementById("btn_loading").style.display = "none";
    document.getElementById("btn_start").style.display = "block";
    document.getElementById("btn_start").addEventListener("click", function (e) {
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

    cameraOrtho.left = -WIDTH / 2;
    cameraOrtho.right = WIDTH / 2;
    cameraOrtho.top = HEIGHT / 2;
    cameraOrtho.bottom = -HEIGHT / 2;
    cameraOrtho.updateProjectionMatrix();
}

var main_render = function () {
    requestAnimationFrame(main_render);

    var delta = clock.getDelta();

    // Komponensek frissítése
    player_update(delta);
    game_update(delta);

    // Fő fényforrás mozgatása a kamerával egy irányba
    var cameraDirection = camControls.getDirection(new THREE.Vector3());
    cameraDirection.y = 0;

    shadowLight.position.copy(camera.position);
    shadowLight.position.add(new THREE.Vector3(4, 5, 2));
    shadowLight.position.addScaledVector(cameraDirection, 5);
    shadowLight.target.position.copy(camera.position);
    shadowLight.target.position.addScaledVector(cameraDirection, 5);

    // TWEEN firssítés
    TWEEN.update();

    // Jelenet rajzolása
    renderer.clear();
    renderer.autoClear = true;
    camera.layers.set(0); // 0. réteg (fő réteg)
    renderer.render(scene, camera);

    renderer.autoClear = false;
    camera.layers.set(1); //1. réteg (felhő réteg)
    renderer.render(scene, camera);

    // HUD réteg
    renderer.clearDepth();
    renderer.render(sceneOrtho, cameraOrtho);
};

Math.lerp = function (value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
};

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}