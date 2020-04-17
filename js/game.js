const MAZE_SIZE = 6;

var currentMaze;

var artifactGhost;
var artifactGhostColorReset = 0;

var isPicking;
var raycaster = new THREE.Raycaster();
var pickedArtifact;

var pickSprite;

var deathSprite;
var deathReset = false;

function game_start() {
    isPicking = false;

    // Részecske shader betöltés
    particles_init();

    // Ellenfél
    skeleton_create(new THREE.Vector3(14.5,0,2.5));

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
    deathSprite.scale.set(WIDTH, WIDTH, 0.5);
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

    // Fegyver
    shotgun_init();

    // Labirintus generálás
    genData = maze_generate(MAZE_SIZE, MAZE_SIZE);
    currentMaze = maze_buildMaze(scene, genData);

    game_selectArtifact();
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
function game_end() {
    var key = res.key.data.clone();

    var newMaterial = new THREE.MeshPhongMaterial( { 
        color: 0xFFD700,
        specular: 0x888888,
        specularMap: res.grass_specular.data
    });
    key.material = newMaterial;
    key.traverse(function (child) {
        child.castShadow = true;
        child.material = newMaterial;

        child.uvsNeedUpdate = true;
    });
    key.material.needsUpdate = true;
    key.needsUpdate = true;

    key.position.set(1.5, 0.5, 1.5);
    scene.add(key);

    var light = new THREE.PointLight(0xFFD700, 0.6, 1);
    key.add(light);

    var tweenData = { x: 0, target: key }
    var tween = new TWEEN.Tween(tweenData)
        .to({ x: 1 }, 5000)
        .repeat( Infinity )
        .onUpdate(function() {
            tweenData.target.position.y = 0.4 + Math.sin(tweenData.x * Math.PI * 2) * 0.1;
            tweenData.target.rotation.y = Math.PI * 2 * tweenData.x;
        });
    tween.start();
}

// Választ egy még nem felvett ereklyét és elhelyezi a kezdő zónába a szellemét
function game_selectArtifact() {
    var artifacts = currentMaze.artifacts;
    if (artifacts.length == 0) {
        game_end();
        return;
    }

    var index = Math.floor(Math.random() * artifacts.length);
    var artifact = artifacts[index];

    artifactGhost = artifact_create(artifact, true);

    artifactGhost.data.position.set(1.5, 0.5, 1.5)
    scene.add(artifactGhost.data)
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

    // Fegyver
    shotgun_update(delta);

    // Animáció
    skeleton_update(delta);

    // Részecskék
    particles_update(delta);

	// Ereklye piros szín visszaállítása
    if (artifactGhostColorReset > 0) {
        artifactGhostColorReset -= delta;
        if (artifactGhostColorReset <= 0) {
            artifactGhost.mesh.material.color.set(ARTIFACT_COLOR);
        }
    }

	// Raycaster segítségével keresek egy ereklyét amire a camera néz
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.layers.set(2);
    var intersects = raycaster.intersectObjects(scene.children, true);
    var selectedObject = null;
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance >= 1 || intersects[i].object.parent == null) {
            continue;
        }

        if (intersects[i].object.parent.artifact != null) {
            selectedObject = intersects[i].object.parent;
            break;
        }
    }

    pickSprite.visible = (selectedObject != null);

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
    if (current.artifact === artifactGhost) { // Szellemre kattintás?
        if (pickedArtifact != null) {
            var pickedID = parseInt(pickedArtifact.artifact.mesh.name);
            var wantedID = parseInt(artifactGhost.mesh.name);

            if (pickedID == wantedID) { // Jó a felvett ereklye?
                artifactGhost.data.visible = false;
                pickedArtifact.visible = false;

                artifactGhost.animation.stop();
                pickedArtifact.artifact.animation.stop();

                var artifacts = currentMaze.artifacts;
                for (var i = 0; i < artifacts.length; i++) {
                    if (artifacts[i].data === pickedArtifact) {
                        artifacts.splice(i, 1);
                        break;
                    }
                }

                pickedArtifact = null;

                game_selectArtifact();
            } else {
                artifactGhost.mesh.material.color.set(0xFF0000);
                artifactGhostColorReset = 2;
            }
        } else {
            artifactGhost.mesh.material.color.set(0xFF0000);
            artifactGhostColorReset = 2;
        }
    } else { // Ereklyére kattintás
        if (pickedArtifact != null) {
            pickedArtifact.artifact.isGhost = false;
        }

        current.artifact.isGhost = true;
        pickedArtifact = current;
    }
}