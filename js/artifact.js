var ID = 0;

const ARTIFACT_COLOR = 0x6666FF;

function artifact_createMesh(geom) {
    var meshMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var mesh = new THREE.Mesh(geom, meshMaterial);
    return mesh;
}

// Random geometriákat felhasználva legyárt egy alakzatot (ThreeBSP intersect)
function artifact_generateMesh() {
    var shape1List = [
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.ConeGeometry(0.5, 1, 16),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
        new THREE.DodecahedronGeometry(0.5, 0)
    ];
    var shape2List = [
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.ConeGeometry(0.5, 1, 16),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
        new THREE.DodecahedronGeometry(0.5, 0)
    ];

    var shape1Idx = Math.floor(Math.random() * shape1List.length);
    var shape2Idx;
    do {
        shape2Idx = Math.floor(Math.random() * shape1List.length);
    } while (shape1Idx == shape2Idx);

    var shape1 = shape1List[shape1Idx];
    var shape2 = shape2List[shape2Idx];

    var mesh1 = artifact_createMesh(shape1);
    var mesh2 = artifact_createMesh(shape2);

    mesh1.position.set(Math.random() * 0.2 + 0.65, Math.random() * 0.2 + 0.65, Math.random() * 0.2 + 0.65)
    mesh2.position.set(Math.random() * 0.2 + 0.45, Math.random() * 0.2 + 0.45, Math.random() * 0.2 + 0.45)

    var scale1 = Math.random() * 0.3 + 1;
    var scale2 = Math.random() * 0.3 + 1;
    mesh1.scale.set(scale1, scale1, scale1)
    mesh2.scale.set(scale2, scale2, scale2)

    var mesh1BSP = new ThreeBSP(mesh1);
    var mesh2BSP = new ThreeBSP(mesh2);

    var resultBSP = mesh1BSP.intersect(mesh2BSP);

    var material = new THREE.MeshPhongMaterial({
        color: ARTIFACT_COLOR,
        transparent: true,
        opacity: 0.9,
        specular: 0x222222
    });
    material.side = THREE.DoubleSide;
    var result = resultBSP.toMesh(material);
    result.geometry.computeFaceNormals();

    result.scale.set(0.4, 0.4, 0.4);

    result.name = (ID++);

    result.castShadow = true;

    return result
}

// Létrehoz egy új rando mereklyét vagy egy létezőnek a másolatát
function artifact_create(sourceArtifact, isGhost) {
    var object = null;
    if (sourceArtifact != null) {
        object = sourceArtifact.mesh.clone();
        object.material = sourceArtifact.mesh.material.clone();
    } else {
        object = artifact_generateMesh();
    }

    var light = new THREE.PointLight(0x1111FF, 1.75, 1.2);
    var particles = particles_artifact();

    var tweenData = { x: 0, target: object, artifact: null }
    var tween = new TWEEN.Tween(tweenData)
        .to({ x: 1 }, 5000)
        .repeat( Infinity )
        .onUpdate(function() {
            tweenData.target.position.y = Math.sin(tweenData.x * Math.PI * 2) * 0.1;
            tweenData.target.rotation.y = Math.PI * 2 * tweenData.x;

            if (tweenData.artifact.isGhost) {
                tweenData.target.material.opacity = 0.25 + ((Math.sin(tweenData.x * Math.PI * 15) + 1) * 0.3)
            } else {
                tweenData.target.material.opacity = 0.9;
            }
        });

    var artifact = {
        data: null,
        mesh: object,
        animation: tween,
        particles: particles,
        light: light,
        isGhost: (isGhost != null ? isGhost : false)
    };
    tweenData.artifact = artifact

    var group = new THREE.Group();
    group.artifact = artifact
    artifact.data = group

    group.add(artifact.mesh)
    group.add(artifact.light)
    group.add(particles)

    group.layers.enable(0); // Megjelenítés
    group.layers.enable(2); // Raycast

    artifact.mesh.position.set(0,0,0);
    artifact.mesh.layers.enable(0)
    artifact.mesh.layers.enable(2)

    group.name = "Artifact"

    tween.start();

    return artifact;
}