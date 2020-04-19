var res = {
    grass: {
        type: "texture",
        data: null
    },
    grass_specular: {
        type: "texture",
        data: null
    },
    bush: {
        type: "texture",
        data: null
    },
    pick: {
        type: "texture",
        data: null
    },
    monkey: {
        type: "obj",
        data: null
    },
    skeleton: {
        type: "obj",
        data: null
    },
    skeleton_texture: {
        type: "texture",
        data: null
    },
    key: {
        type: "obj",
        data: null
    },
    shotgun: {
        type: "texture",
        data: null
    },
    crosshair: {
        type: "texture",
        data: null
    },
    point_particle: {
        type: "texture",
        data: null
    },
    skeleton_animated: {
        type: "gltf",
        data: null
    },
    rock: {
        type: "texture",
        data: null
    },
    rock_grass: {
        type: "texture",
        data: null
    },
    statue: {
        type: "obj",
        data: null
    },
    envmap: {
        type: "texture",
        data: null
    },
    water_normal: {
        type: "texture",
        data: null
    }
};
var keys = Object.keys(res);

var texLoader = new THREE.TextureLoader();
var objLoader = new THREE.OBJLoader();
var gltfLoader = new THREE.GLTFLoader();

var onDone;

function resources_load(callback) {
    onDone = callback;

    resources_doLoad(0);
}

function resources_doLoad(index) {
    if (index >= keys.length) {
        onDone();
    } else {
        var keyName = keys[index];
        var obj = res[keyName];
        switch (obj.type) {
            case "texture":
                texLoader.load("assets/" + keyName + ".png",
                    function (texture) {
                        texture.minFilter = THREE.NearestFilter;
                        texture.magFilter = THREE.NearestFilter;

                        obj.data = texture;

                        resources_doLoad(index + 1);
                    },
                    undefined,
                    function (error) {
                        console.error(error);
                        resources_doLoad(index + 1);
                    });
                break;
            case "obj":
                objLoader.load("assets/" + keyName + ".obj",
                    function (model) {
                        obj.data = model;
                        resources_doLoad(index + 1);
                    },
                    undefined,
                    function (error) {
                        console.error(error);
                        resources_doLoad(index + 1);
                    });
                break;
            case "gltf":
                gltfLoader.load("assets/" + keyName + ".gltf",
                    function (model) {
                        obj.data = model;
                        resources_doLoad(index + 1);
                    },
                    undefined,
                    function (error) {
                        console.error(error);
                        resources_doLoad(index + 1);
                    });
                break;
            default:
                console.warn("Unknown resource type: " + obj.type);
                resources_doLoad(index + 1);
                break;
        }
    }
}
