var skeletons = [];

function gltfRemoveMetalness(obj) {
    if (obj.children != null) {
        obj.children.forEach(c => {
            gltfRemoveMetalness(c);
        })
    }

    obj.castShadow = true;
    if (obj.material != null) {
        obj.material.metalness = 0;
        obj.material.transparent = true;
        obj.material.map.minFilter = THREE.NearestFilter;
        obj.material.map.magFilter = THREE.NearestFilter;
    }
}

function skeleton_create(pos) {
    var skele = res.skeleton_animated.data
    skele.scene.layers.enable(0);
    skele.scene.layers.enable(2);
    skele.scene.traverse(function(e) {
        e.layers.enable(0);
        e.layers.enable(2);

        gltfRemoveMetalness(e)
    })
    scene.add(skele.scene);
    skele.scene.position.copy(pos)

    var anim = new THREE.AnimationMixer(skele.scene);
    skele.animations.forEach(a => {
        anim.clipAction(a).play();
    })

    var sk = {
        isSkeleton: true,

        model: skele,
        object: skele.scene,
        animation: anim,

        path: null,
        pathTarget: 0,
        pathPlayer: { x: 0, z: 0 },

        stuntime: 0
    }

    skele.scene.tag = sk;

    skeletons.push(sk);

    return sk;
}

function skeleton_handleMove(pos, moveDir, speed, delta) {
    var newPos = new THREE.Vector3();

    //XZ mozgás
    newPos.copy(pos);
    newPos.addScaledVector(moveDir, speed * delta);

    if (!player_checkCollision(newPos)) {
        return newPos;
    }

    //X mozgás
    newPos.copy(pos);
    newPos.addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), speed * delta);

    if (!player_checkCollision(newPos)) {
        return newPos;
    }

    //Z mozgás
    newPos.copy(pos);
    newPos.addScaledVector(new THREE.Vector3(0, 0, moveDir.z), speed * delta);

    if (!player_checkCollision(newPos)) {
        return newPos;
    }

    return null;
}

function skeleton_update(time) {
    var player = camera.position;

    var playerX = Math.floor(player.x);
    var playerZ = Math.floor(player.z);

    if (skeletons.length > 0) {
        skeletons.forEach(s => {
            if (s.stuntime > 0) {
                s.stuntime -= time;
                return;
            }

            var target;

            var dist = s.object.position.distanceTo(player);
            if (dist < 0.9) {
                game_addDeath(1.5 * time);
            }

            if (dist < 1.5) {
                target = new THREE.Vector3(player.x, 0, player.z);
            } else {
                if (s.path != null && s.pathPlayer.x == playerX && s.pathPlayer.z == playerZ && s.pathTarget < s.path.length) {
                    target = new THREE.Vector3(s.path[s.pathTarget].y + 0.5, 0, s.path[s.pathTarget].x + 0.5);
                    var dist = s.object.position.distanceTo(target);

                    if (dist < 0.05) {
                        s.pathTarget++;
                        if (s.pathTarget >= s.path.length) {
                            s.path = null;
                            s.pathTarget = 0;
                        }
                    }
                } else {
                    var skeleX = Math.floor(s.object.position.x);
                    var skeleZ = Math.floor(s.object.position.z);

                    var path = astar.search(currentMaze.pathFind, currentMaze.pathFind.grid[skeleZ][skeleX], currentMaze.pathFind.grid[playerZ][playerX]);
                    s.path = path
                    s.pathTarget = 0
                    s.pathPlayer.x = playerX
                    s.pathPlayer.z = playerZ

                    target = new THREE.Vector3(0,0,0);
                }
            }

            var rotation = s.object.rotation.clone();
            s.object.lookAt(target.x, 0, target.z);
            s.object.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI / 2);
            var targetRotation = s.object.rotation.clone();

            var quat = new THREE.Quaternion();
            quat.setFromEuler(rotation);

            var quatTarget = new THREE.Quaternion();
            quatTarget.setFromEuler(targetRotation);

            quat.slerp(quatTarget, time * 5);

            s.object.setRotationFromQuaternion(quat);

            var dir = new THREE.Vector3();
            dir.copy(target);
            dir.sub(s.object.position);
            dir.normalize();

            var newPos = skeleton_handleMove(s.object.position, dir, 1, time);
            if (newPos != null) {
                s.object.position.copy(newPos);
            }

            s.animation.update(time);
        })
    }
}