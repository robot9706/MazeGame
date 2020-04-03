var ID = 0;

function artifact_createMesh(geom) {
    var meshMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var mesh = new THREE.Mesh(geom, meshMaterial);
    return mesh;
}

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
        color: 0x6666FF,
        transparent: true,
        opacity: 0.9,
        specular: 0x222222
    });
    var result = resultBSP.toMesh(material);
    result.geometry.computeFaceNormals();

    result.scale.set(0.4, 0.4, 0.4);

    result.name = (ID++);

    result.castShadow = true;

    return result
}

function artifact_create(sourceData, isGhost) {
    var data = (sourceData != null ? sourceData.clone() : artifact_generateMesh())
    if (sourceData != null) {
        data.material = sourceData.material.clone();
    }

    var material = data.material

    var light = new THREE.PointLight(0x1111FF, 1.75, 1.2);
    data.add(light);

    var artifact = {
        data: data,
        animation: null,
        isGhost: (isGhost != null ? isGhost : false)
    };

    var tweenData = { x: 0, target: artifact }
    var tween = new TWEEN.Tween(tweenData)
        .to({ x: 1 }, 5000)
        .repeat( Infinity )
        .onUpdate(function() {
            tweenData.target.data.position.y = 0.4 + Math.sin(tweenData.x * Math.PI * 2) * 0.1;
            tweenData.target.data.rotation.y = Math.PI * 2 * tweenData.x;

            if (tweenData.target.isGhost) {
                material.opacity = 0.25 + ((Math.sin(tweenData.x * Math.PI * 15) + 1) * 0.3)
            }
        });
    tween.start();

    artifact.animation = tween;
    data.artifact = artifact;

    return artifact;
}