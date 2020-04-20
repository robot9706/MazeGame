var skybox;

function skybox_init(scene) {
    var material = new THREE.ShaderMaterial({
        uniforms: {
            TOP_COLOR: {
                value: new THREE.Color(0xF4FAFF)
            },
            BOTTOM_COLOR: {
                value: new THREE.Color(0x76C6FC)
            }
        },
        vertexShader: document.getElementById('sky_vs').textContent,
        fragmentShader: document.getElementById('sky_fs').textContent,
    });
    material.side = THREE.DoubleSide;

    var geometry = new THREE.SphereGeometry(0.5, 32, 32);
    skybox = new THREE.Mesh(geometry, material);
    skybox.scale.set(200, 200, 200);

    scene.add(skybox);
}
