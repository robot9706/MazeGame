var gunsprite;

var gunframes = {
    IDLE: [
        { x: 0, y: 0, w: 79, h: 60 }
    ],
    SHOOT: [
        { x: 0, y: 64, w: 79, h: 73 },
        { x: 0, y: 140, w: 79, h: 82 },
        { x: 83, y: 0, w: 119, h: 121 },
        { x: 206, y: 0, w: 87, h: 151 },
        { x: 297, y: 0, w: 113, h: 131 },
        { x: 206, y: 0, w: 87, h: 151 },
        { x: 83, y: 0, w: 119, h: 121 }
    ]
}

const GUN_FRAME_TIME = 1 / 10;
const GUN_SCALE = 2.0;

var gunstate = "IDLE";
var gunanim = {
    frame: 0,
    time: 0
}

var guntex;

function shotgun_init() {
    guntex = res.shotgun.data;

    // Animáció előkészítése
    Object.keys(gunframes).forEach(e => {
        gunframes[e].forEach(a => {
            a.uvx = a.x / guntex.image.width;
            a.uvy = a.y / guntex.image.height;
            a.uvw = a.w / guntex.image.width;
            a.uvh = a.h / guntex.image.height;
        });
    });

    // Sprite
    var shotgunMaterial = new THREE.SpriteMaterial({
        map: guntex,
        depthTest: false
    });
    gunsprite = new THREE.Sprite(shotgunMaterial);
    sceneOrtho.add(gunsprite);

    shotgun_updateframe();
}

function shotgun_updateframe()
{
    var frame = gunframes[gunstate][gunanim.frame];

    guntex.offset.set(frame.uvx, 1.0 - frame.uvy - frame.uvh);
    guntex.repeat.set(frame.uvw, frame.uvh);

    var height = frame.h * GUN_SCALE;
    var width = frame.w * GUN_SCALE;

    gunsprite.scale.set(width, height, 1);
    gunsprite.position.set(0, -HEIGHT / 2 + height / 2, 1);
}

function shotgun_update(time) 
{
    gunanim.time += time;
    if (gunanim.time >= GUN_FRAME_TIME) {
        gunanim.time = 0;
        gunanim.frame = (gunanim.frame + 1) % gunframes[gunstate].length;

        shotgun_updateframe();

        if (gunstate == "SHOOT" && gunanim.frame == gunframes["SHOOT"].length - 1) {
            gunstate = "IDLE";
        }
    }
}

function shotgun_shot(targetRaytrace)
{
    if (gunstate == "IDLE") {
        gunstate = "SHOOT";

        if (targetRaytrace != null) {
            particles_gun(targetRaytrace.point);

            var test = targetRaytrace.object;
            do {
                if (test.tag != null && test.tag.isSkeleton === true) {
                    test.tag.stuntime = 0.5;

                    break;
                }
                test = test.parent;
            } while (test != null)
        }
    }
}