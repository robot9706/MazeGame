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
    var pickTexture = new THREE.TextureLoader().load("assets/pick.png");
    pickTexture.minFilter = THREE.NearestFilter;
    pickTexture.magFilter = THREE.NearestFilter;
    var pickSpriteMaterial = new THREE.SpriteMaterial({
        map: pickTexture,
        depthTest: false
    });
    pickSprite = new THREE.Sprite(pickSpriteMaterial);
    pickSprite.scale.set(0.3, 0.3, 1);
    pickSprite.visible = false;
    camera.add(pickSprite);
    pickSprite.position.set(0, 0, -2);

    // Generate a maze
    genData = maze_generate(8, 8);
    currentMaze = maze_buildMaze(scene, genData);

    game_selectArtifact();
}

function game_selectArtifact() {
    var artifacts = currentMaze.artifacts;
    if (artifacts.length == 0) {
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
    if (current.artifact === artifactGhost) {
        if (pickedArtifact != null) {
            var pickedID = parseInt(pickedArtifact.artifact.data.name);
            var wantedID = parseInt(artifactGhost.data.name);

            if (pickedID == wantedID) {
                scene.remove(artifactGhost.data);
                scene.remove(pickedArtifact);

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
}