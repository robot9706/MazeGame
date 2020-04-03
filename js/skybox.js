// Textúrák: https://opengameart.org/content/cloudy-skyboxes

var textures = [
    "sky_side.jpg",
    "sky_side.jpg",
    "bluecloud_up.jpg",
    "sky_side.jpg",
    "sky_side.jpg",
    "sky_side.jpg",
]

var skybox;

function skybox_init(scene) {
    var materialArray = [];

    for (var i = 0; i < 6; i++) {
        var texture = new THREE.TextureLoader().load("assets/" + textures[i]);
        var material = new THREE.MeshBasicMaterial({
            map: texture
        });

        material.side = THREE.BackSide;

        materialArray.push(material);
    }

    var geometry = new THREE.BoxGeometry(500, 500, 500);
    skybox = new THREE.Mesh(geometry, materialArray );

    scene.add(skybox);
}

function skybox_update(camera) {
    skybox.position = camera.position;
}
