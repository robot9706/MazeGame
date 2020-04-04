function clouds_createMesh(geom) {
    var meshMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var mesh = new THREE.Mesh(geom, meshMaterial);
    return mesh;
}

function clouds_random(base, dev) {
    return base + (Math.random() * 2 - 1) * dev;
}

function clouds_createBoxMesh() {
    var mesh = clouds_createMesh(new THREE.BoxGeometry(clouds_random(4, 2), clouds_random(4, 2), clouds_random(4, 2)));
    mesh.position.set(clouds_random(0, 5), clouds_random(0, 5), clouds_random(0, 5));
    return mesh;
}

function clouds_randomCloud() {
    var cloudBSP = new ThreeBSP(clouds_createBoxMesh());

    var partCount = Math.round(Math.random() * 10);
    for (var i = 0; i < partCount; i++) {
        var addBSP = new ThreeBSP(clouds_createBoxMesh());
        cloudBSP = cloudBSP.union(addBSP);
    }

    var material = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        specular: 0xaaaaaa
    });
    var result = cloudBSP.toMesh(material);
    result.geometry.computeFaceNormals();

    result.scale.set(0.3, 0.3, 0.3);
    result.castShadow = false;

    return result;
}

function clouds_create(scene) {
    var centerPos = 8;
    var sizeDev = 64;

    for (var i = 0; i < 10; i++) {
        var rndCloud = clouds_randomCloud();
        rndCloud.scale.set(2,2,2);
        rndCloud.position.set(clouds_random(centerPos, sizeDev), 75, clouds_random(centerPos, sizeDev));
        rndCloud.layers.set(1);
        scene.add(rndCloud);
    }
}