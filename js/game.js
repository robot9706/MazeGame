const MAZE_SIZE = 6;

var currentMaze;

var artifactGhost;
var artifactGhostColorReset = 0;

var isPicking;
var raycaster = new THREE.Raycaster();
var pickedArtifact;

var pickSprite;

function game_start() {
    isPicking = false;

    // Create the pick sprite
    var pickSpriteMaterial = new THREE.SpriteMaterial({
        map: res.pick.data,
        depthTest: false
    });
    pickSprite = new THREE.Sprite(pickSpriteMaterial);
    pickSprite.scale.set(0.3, 0.3, 1);
    pickSprite.visible = false;
    camera.add(pickSprite);
    pickSprite.position.set(0, 0, -2);

    // Generate a maze
    genData = maze_generate(MAZE_SIZE, MAZE_SIZE);
    currentMaze = maze_buildMaze(scene, genData);

    game_selectArtifact();
}

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

function game_selectArtifact() {
    var artifacts = currentMaze.artifacts;
    if (artifacts.length == 0) {
        game_end();
        return;
    }

    var index = Math.floor(Math.random() * artifacts.length);
    var artifact = artifacts[index];

    artifactGhost = artifact_create(artifact.data, true);

    artifactGhost.data.position.set(1.5, 0.5, 1.5)
    scene.add(artifactGhost.data)
}

function game_update(delta) {
    if (artifactGhostColorReset > 0) {
        artifactGhostColorReset -= delta;
        if (artifactGhostColorReset <= 0) {
            artifactGhost.data.material.color.set(ARTIFACT_COLOR);
        }
    }

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var intersects = raycaster.intersectObjects(scene.children);
    var selectedObject = null;
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance >= 1) {
            continue;
        }

        if (intersects[i].object.artifact != null) {
            selectedObject = intersects[i].object;
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
    }
}

function game_artifactPick(current) {
    console.time("A");
    if (current.artifact === artifactGhost) {
        if (pickedArtifact != null) {
            var pickedID = parseInt(pickedArtifact.artifact.data.name);
            var wantedID = parseInt(artifactGhost.data.name);

            if (pickedID == wantedID) {
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
                artifactGhost.data.material.color.set(0xFF0000);
                artifactGhostColorReset = 2;
            }
        } else {
            artifactGhost.data.material.color.set(0xFF0000);
            artifactGhostColorReset = 2;
        }
    } else {
        if (pickedArtifact != null) {
            pickedArtifact.artifact.isGhost = false;
        }

        current.artifact.isGhost = true;
        pickedArtifact = current;
    }
    console.timeEnd("A")
}