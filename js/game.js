const MAZE_SIZE = 6;

var currentMaze;

var isPicking;
var raycaster = new THREE.Raycaster();
var pickedArtifact;

var pickSprite;

var deathSprite;
var deathReset = false;

var reflectionCamera;

var artifactsFound;
var hasKey = true;

var enemy;

function game_start() {
    isPicking = false;
    artifactsFound = 0;
    hasKey = false;

    // Részecske shader betöltés
    particles_init();

    // Kéz sprite létrehozás
    var pickSpriteMaterial = new THREE.SpriteMaterial({
        map: res.pick.data,
        depthTest: false
    });
    pickSprite = new THREE.Sprite(pickSpriteMaterial);
    pickSprite.scale.set(WIDTH / 20, WIDTH / 20, 1);
    pickSprite.visible = false;
    sceneOrtho.add(pickSprite);
    pickSprite.position.set(0, 0, 2);

    // Piros képernyő
    var deathSpriteMaterial = new THREE.SpriteMaterial({
        color: 0xFF0000,
        depthTest: false,
        transparent: true,
        opacity: 0.0
    });
    deathSprite = new THREE.Sprite(deathSpriteMaterial);
    deathSprite.scale.set(WIDTH, WIDTH, 1);
    deathSprite.position.set(0, 0, 1);
    sceneOrtho.add(deathSprite);

    // Célzó sprite
    var crosshairSpriteMaterial = new THREE.SpriteMaterial({
        map: res.crosshair.data,
        depthTest: false,
        transparent: true,
        opacity: 0.5
    });
    var crosshairSprite = new THREE.Sprite(crosshairSpriteMaterial);
    crosshairSprite.scale.set(4, 4, 1);
    crosshairSprite.position.set(0, 0, 3);
    sceneOrtho.add(crosshairSprite);

    // Víz
    reflectionCamera = new THREE.CubeCamera(1, 32, 512);
    scene.add(reflectionCamera);

    var waterPlane = new THREE.PlaneGeometry(32, 32);
    var waterMaterial = new THREE.MeshPhongMaterial({
        color: 0xaaaaff,
        specular: 0xaaaaaa,
        shininess: 100,
        envMap: reflectionCamera.renderTarget.texture,
        reflectivity: 0.5,

        transparent: true,
        opacity: 0.5,

        normalMap: res.water_normal.data
    });
    var water = new THREE.Mesh(waterPlane, waterMaterial);
    water.rotation.set(-Math.PI / 2, 0, 0);
    water.position.set(MAZE_LAYOUT.layout[0].length / 2, -0.1, MAZE_LAYOUT.layout.length / 2);
    scene.add(water);

    // Fegyver
    shotgun_init();

    // Labirintus generálás
    currentMaze = maze_buildMaze(scene);

    // Játékos elhelyezése
    camera.position.set(MAZE_LAYOUT.playerSpawn.x + 0.5, 0.65, MAZE_LAYOUT.playerSpawn.y + 0.5);
    camera.rotation.set(0, 0, 0);

    // Ellenfél
    enemy = skeleton_create(new THREE.Vector3(MAZE_LAYOUT.enemySpawn.x + 0.5, 0, MAZE_LAYOUT.enemySpawn.y + 0.5));
}

function game_addDeath(val) {
    deathReset = true;
    deathSprite.material.opacity += val;
    if (deathSprite.material.opacity > 1) {
        deathSprite.material.opacity = 1;

        document.getElementById("btn_start").style.display = "none";
        document.getElementById("btn_reset").style.display = "block";

        camControls.unlock();
    }
}

// Játék végénél kulcs megjelenítése
function game_spawnKey() {
    // Szobor, és ereklyék törlése
    enemy.object.visible = false;

    // Kulcs
    var keyGroup = new THREE.Group();
    keyGroup.name = "KEY";

    var key = res.key.data.clone();
    key.name = "KEY";
    keyGroup.add(key);

    var newMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFD700,
        specular: 0x888888,
        specularMap: res.grass_specular.data
    });
    key.material = newMaterial;
    key.traverse(function (child) {
        child.castShadow = true;
        child.material = newMaterial;
        child.name = "KEY";
        child.uvsNeedUpdate = true;

        child.layers.enable(0);
        child.layers.enable(2);
    });
    key.material.needsUpdate = true;
    key.needsUpdate = true;

    key.layers.enable(0);
    key.layers.enable(2);

    var light = new THREE.PointLight(0xFFD700, 0.6, 1);
    keyGroup.add(light);

    keyGroup.position.set(MAZE_LAYOUT.artifact.key.x + 0.5, 0.5, MAZE_LAYOUT.artifact.key.y + 0.5);
    scene.add(keyGroup);

    particles_key(keyGroup.position);

    var tweenData = { x: 0, target: key }
    var tween = new TWEEN.Tween(tweenData)
        .to({ x: 1 }, 5000)
        .repeat(Infinity)
        .onUpdate(function () {
            tweenData.target.position.y = -0.2 + Math.sin(tweenData.x * Math.PI * 2) * 0.1;
            tweenData.target.rotation.y = Math.PI * 2 * tweenData.x;
        });
    tween.start();
}

function game_update(delta) {
    if (delta > 1 / 24) {
        delta = 1 / 24;
        console.warn("Slow game!");
    }

    if (!camControls.isLocked) {
        return;
    }

    if (deathReset) {
        deathReset = false;
    } else {
        deathSprite.material.opacity -= 0.5 * delta;
        if (deathSprite.material.opacity < 0) {
            deathSprite.material.opacity = 0;
        }
    }

    // Víz tükröződés
    reflectionCamera.position.copy(camera.position);
    reflectionCamera.update(renderer, scene);

    // Fegyver
    shotgun_update(delta);

    // Animáció
    skeleton_update(delta);

    // Részecskék
    particles_update(delta);

    // Raycaster segítségével keresek egy ereklyét amire a camera néz
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.layers.set(2);
    var intersects = raycaster.intersectObjects(scene.children, true);
    var selectedObject = null;
    var selectedKey = null;
    var selectedExit = null;
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance >= 1 || intersects[i].object.parent == null || !intersects[i].object.parent.visible) {
            continue;
        }

        if (intersects[i].object.parent.artifact != null) {
            selectedObject = intersects[i].object.parent;
            break;
        }

        if (intersects[i].object.name == "KEY") {
            selectedKey = intersects[i].object;
            break;
        }

        if (intersects[i].object.name == "EXIT" && hasKey) {
            selectedExit = intersects[i].object;
            break;
        }
    }

    pickSprite.visible = (selectedObject != null || selectedKey != null || selectedExit != null);

    if (selectedKey != null) {
        if ((input_isDown("PICK") || input_isDown("PICK_MOUSE"))) {
            selectedKey.visible = false;
            hasKey = true;
        }
    }

    if (selectedExit != null) {
        if ((input_isDown("PICK") || input_isDown("PICK_MOUSE"))) {
            hasKey = false;

            currentMaze.exitDoor.open.start();
        }
    }

    if (selectedObject != null) {
        if ((input_isDown("PICK") || input_isDown("PICK_MOUSE"))) {
            if (!isPicking) {
                isPicking = true;

                game_artifactPick(selectedObject);
            }
        } else {
            isPicking = false;
        }
    } else {
        isPicking = false;
        if ((input_isDown("PICK") || input_isDown("PICK_MOUSE"))) {
            shotgun_shot(intersects.length > 0 ? intersects[0] : null);
        }
    }
}

function game_artifactPick(current) {
    if (current.artifact.mode == "TARGET") {
        if (current.artifact.isGhost) {
            if (pickedArtifact != null && current.artifact.tag == pickedArtifact.artifact.tag) {
                pickedArtifact.artifact.data.visible = false;

                current.artifact.isGhost = false;

                artifactsFound++;

                if (artifactsFound >= currentMaze.artifacts.length) {
                    game_spawnKey();
                }
            } else {
                current.artifact.red.start();
            }
        }
    } else if (current.artifact.mode == "PICKUP") {
        if (pickedArtifact != null) {
            pickedArtifact.artifact.isGhost = false;
        }

        current.artifact.isGhost = true;
        pickedArtifact = current;
    }
}