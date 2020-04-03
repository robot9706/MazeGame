var currentMaze;

var artifactGhost;

var isPicking;
var raycaster = new THREE.Raycaster();
var pickedArtifact;

const GAMESTATE_FIND = 0;
const GAMESTATE_FIND_WRONG = 1;
const GAMESTATE_FIND_OK = 2;
var game_state = GAMESTATE_FIND;

function game_start() {
    isPicking = false;

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

function game_update() {
    if (input_isDown("PICK")) {
        if (!isPicking) {
            isPicking = true;

            raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
            var intersects = raycaster.intersectObjects( scene.children );

            for (var i = 0; i < intersects.length; i++) 
            {
                if (intersects[i].distance >= 2) {
                    continue;
                }

                if (intersects[i].object.artifact != null)
                {
                    game_artifactPick(intersects[i].object);
                }
            }
        }
    } else {
        isPicking = false;
    }
}

function game_artifactPick(current) {
    if (current.artifact.isGhost) {
        if (game_state == GAMESTATE_FIND_WRONG) {
            currentMaze.setColor(0xFFFFFF);
            game_state = GAMESTATE_FIND;
        } else if (game_state == GAMESTATE_FIND_OK) {
            scene.remove(artifactGhost.data);
            scene.remove(pickedArtifact);

            artifactGhost.animation.stop();
            pickedArtifact.artifact.animation.stop();

            var artifacts = currentMaze.artifacts;
            for(var i = 0; i < artifacts.length; i++) {
                if(artifacts[i].data === pickedArtifact) {
                    artifacts.splice(i, 1);
                    break;
                }
            }

            pickedArtifact = null;

            game_selectArtifact();

            game_state = GAMESTATE_FIND;
            currentMaze.setColor(0xFFFFFF);
        }
    } else {
        if (game_state == GAMESTATE_FIND) {
            var pickedID = parseInt(current.artifact.data.name);
            var wantedID = parseInt(artifactGhost.data.name);
        
            if (pickedID == wantedID) {
                game_state = GAMESTATE_FIND_OK;

                current.artifact.isGhost = true;

                pickedArtifact = current;
            } else {
                game_state = GAMESTATE_FIND_WRONG;
                currentMaze.setColor(0xFF2222);
            }
        }
    }
}