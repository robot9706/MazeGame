const PARTICLE_COUNT_GUN = 20;

const PARTICLE_SIZE = 0.05
const PARTICLE_POS_STD = 0.2

const PARTICLE_ARTIFACT_POS_STD = 0.5

var particleAlphaShader;

function particles_init() {
    var uniforms = {
        color: { value: new THREE.Color(0xaaaaff) },
        time: { value: 0.0 },
        map: { type: "t", value: null }
    };

    particleAlphaShader = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById("particlealpha_vs").textContent,
        fragmentShader: document.getElementById("particlealpha_fs").textContent,
        transparent: true,
        blending: THREE.AdditiveBlending,
    });
}

function particles_gun(position) {
    var particles = new THREE.Geometry();
    var material = new THREE.PointsMaterial({
        color: 0xFFFF00,
        size: PARTICLE_SIZE,
        map: res.point_particle.data,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
    });

    for (var p = 0; p < PARTICLE_COUNT_GUN; p++) {
        var pX = Math.random() * PARTICLE_POS_STD - (PARTICLE_POS_STD / 2),
            pY = Math.random() * PARTICLE_POS_STD - (PARTICLE_POS_STD / 2),
            pZ = Math.random() * PARTICLE_POS_STD - (PARTICLE_POS_STD / 2);
        particles.vertices.push(new THREE.Vector3(pX, pY, pZ));
    }

    var particleSystem = new THREE.Points(particles, material);
    particleSystem.position.copy(position);
    particleSystem.sortParticles = true;
    scene.add(particleSystem);

    var tweenData = { x: 0, target: particleSystem, startY: position.y }
    var tween = new TWEEN.Tween(tweenData)
        .to({ x: 1 }, 250)
        .onUpdate(function () {
            tweenData.target.position.y = tweenData.startY + tweenData.x * 0.1
            tweenData.target.material.opacity = (1.0 - tweenData.x) * 0.8
        });
    tween.start();
}

function particles_artifact() {
    var particles = new THREE.BufferGeometry();
    var alphas = new Float32Array(PARTICLE_COUNT_GUN);
    var positions = new Float32Array(PARTICLE_COUNT_GUN * 3);

    for (var p = 0; p < PARTICLE_COUNT_GUN; p++) {
        positions[(p * 3) + 0] = Math.random() * PARTICLE_ARTIFACT_POS_STD - (PARTICLE_ARTIFACT_POS_STD / 2);
        positions[(p * 3) + 1] = Math.random() * PARTICLE_ARTIFACT_POS_STD - (PARTICLE_ARTIFACT_POS_STD / 2);
        positions[(p * 3) + 2] = Math.random() * PARTICLE_ARTIFACT_POS_STD - (PARTICLE_ARTIFACT_POS_STD / 2);

        alphas[p] = Math.random() * Math.PI * 2;
    }
    particles.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var particleSystem = new THREE.Points(particles, particleAlphaShader);
    particleSystem.sortParticles = true;

    particleAlphaShader.uniforms.map.value = res.point_particle.data;

    return particleSystem;
}

function particles_update(time) {
    particleAlphaShader.uniforms.time.value += time;
}