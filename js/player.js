const PLAYER_MOVE_SPEED = 2.5;
const PLAYER_MOVE_SPEED_FAST_MUL = 2;

var playerHeadTime = 0;

function player_checkCollision(atPosition) {
    var mapX = Math.floor(atPosition.x);
    var mapY = Math.floor(atPosition.z);

    var playerBox = new THREE.Box3(
        new THREE.Vector3(atPosition.x - 0.15, atPosition.y - 0.5, atPosition.z - 0.15),
        new THREE.Vector3(atPosition.x + 0.15, atPosition.y + 0.5, atPosition.z + 0.15),
    )

    var maze = maze_getCollisionBoxes(currentMaze, mapX, mapY);

    for (var i = 0; i < maze.length; i++) {
        if (maze[i].intersectsBox(playerBox)) {
            return true;
        }
    }

    return false;
}

function player_handleMove(moveDir, delta) {
    var newPos = new THREE.Vector3();

    var speed = PLAYER_MOVE_SPEED * (input_isDown("RUN") ? PLAYER_MOVE_SPEED_FAST_MUL : 1);

    //XZ mozgás
    newPos.copy(camera.position);
    newPos.addScaledVector(moveDir, speed * delta);

    if (!player_checkCollision(newPos)) {
        camera.position.copy(newPos);
        return;
    }

    //X mozgás
    newPos.copy(camera.position);
    newPos.addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed * delta);

    if (!player_checkCollision(newPos)) {
        camera.position.copy(newPos);
        return;
    }

    //Z mozgás
    newPos.copy(camera.position);
    newPos.addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed * delta);

    if (!player_checkCollision(newPos)) {
        camera.position.copy(newPos);
        return;
    }
}

function player_update(delta) {
    var moveDir = new THREE.Vector3();
    if (input_isDown("FORWARD")) {
        var dir = camControls.getDirection(new THREE.Vector3());
        dir.y = 0;

        moveDir.add(dir);
    }
    if (input_isDown("BACKWARD")) {
        var dir = camControls.getDirection(new THREE.Vector3());
        dir.y = 0;

        moveDir.add(dir.negate());
    }
    if (input_isDown("LEFT")) {
        var dir = camControls.getDirection(new THREE.Vector3());
        dir = new THREE.Vector3(-dir.z, 0, dir.x)

        moveDir.add(dir.negate());
    }
    if (input_isDown("RIGHT")) {
        var dir = camControls.getDirection(new THREE.Vector3());
        dir = new THREE.Vector3(-dir.z, 0, dir.x)

        moveDir.add(dir);
    }

    moveDir.normalize();

    if (moveDir.length() != 0) {
        player_handleMove(moveDir, delta);

        playerHeadTime += delta;
        camera.position.y = 0.5 + Math.sin(playerHeadTime * 10) * 0.03;
    } else {
        playerHeadTime = 0;

        camera.position.y = Math.lerp(camera.position.y, 0.5, delta * 10);
    }
}