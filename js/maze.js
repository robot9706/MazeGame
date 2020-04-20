const MASK_LEFT = 0x08;
const MASK_RIGHT = 0x04;
const MASK_UP = 0x02;
const MASK_DOWN = 0x01;

const MAZE_ARTIFACT_COUNT = 3;
const MAZE_STATUES = [
    {
        key: "monkey",
        count: 2,
    },
    {
        key: "skeleton",
        count: 2
    }
]

function maze_helperGetCell(cells, x, y, w, h) {
    if (x < 0 || y < 0 || x >= w || y >= h) {
        return null;
    }

    return cells[y][x];
}

function maze_checkVisit(cells, x, y, w, h) {
    var visit = maze_helperGetCell(cells, x, y, w, h);
    return (visit != null && !visit.visited);
}

function maze_checkBlock(blocks, x, y, w, h) {
    if (x < 0 || y < 0 || x >= w || y >= h) {
        return false;
    }

    return blocks[x + "-" + y]
}

// "Recursive backtracker" algoritmus alapján egy labirintus generálása
function maze_generate(width, height, lootOffsetX, lootOffsetY) {
    // Cellák előkészítése
    var cells = [];
    for (var y = 0; y < height; y++) {
        var line = [];
        for (var x = 0; x < width; x++) {
            line.push({
                x: x,
                y: y,
                walls: 15, // Minden fal létezik
                visited: false
            });
        }
        cells.push(line);
    }

    // Konstans kezdőpozíció
    var startX = 1;
    var startY = 0;

    // Random labirintus
    var startCell = maze_helperGetCell(cells, startX, startY, width, height);

    var stack = [startCell];

    while (stack.length > 0) {
        var current = stack.pop();

        var x = current.x;
        var y = current.y;

        // Lehetséges szomszédok keresése
        var possible = [];
        if (maze_checkVisit(cells, x - 1, y, width, height)) possible.push({ x: x - 1, y: y, mask: MASK_LEFT, maskInvert: MASK_RIGHT });
        if (maze_checkVisit(cells, x + 1, y, width, height)) possible.push({ x: x + 1, y: y, mask: MASK_RIGHT, maskInvert: MASK_LEFT });
        if (maze_checkVisit(cells, x, y - 1, width, height)) possible.push({ x: x, y: y - 1, mask: MASK_UP, maskInvert: MASK_DOWN });
        if (maze_checkVisit(cells, x, y + 1, width, height)) possible.push({ x: x, y: y + 1, mask: MASK_DOWN, maskInvert: MASK_UP });

        if (possible.length == 0) {
            continue;
        }

        // Random szomszéd kiválasztása
        var selected = possible[Math.floor(Math.random() * possible.length)];
        var selectedCell = maze_helperGetCell(cells, selected.x, selected.y, width, height);

        // Falak törlése
        current.walls &= (~selected.mask);
        selectedCell.walls &= (~selected.maskInvert);

        // A jelenlegi cella mehet vissza a verembe
        stack.push(current);

        // Szomszéd megjelölése és mehet a verembe
        selectedCell.visited = true;
        stack.push(selectedCell);
    }

    // A generált labirintus átalakítása
    realWidth = (width * 2 - 1)
    realHeight = (height * 2 - 1)

    // Minden cella alapból kocka
    var blocks = [];
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            blocks[x + "-" + y] = true
        }
    }

    // Ahova nem kell kocka kitörlöm
    for (var y = 0; y < height; y++) {
        var line = cells[y];
        for (var x = 0; x < width; x++) {
            var realX = x * 2;
            var realY = y * 2;

            var cell = line[x];

            blocks[realX + "-" + realY] = false

            if ((cell.walls & MASK_RIGHT) == 0) {
                if (realX + 1 < realWidth) {
                    blocks[(realX + 1) + "-" + realY] = false;
                }
            }
            if ((cell.walls & MASK_DOWN) == 0) {
                if (realY + 1 < realHeight) {
                    blocks[realX + "-" + (realY + 1)] = false;
                }
            }
        }
    }

    // Lehetséges ereklye és dekoráció helyeinek megkeresése
    var spawnPos = [];
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            if (maze_checkBlock(blocks, x, y, realWidth, realHeight)) continue;

            var countX = 0;
            var countY = 0;
            var dirX = 0;
            var dirY = 0;
            if (maze_checkBlock(blocks, x - 1, y, realWidth, realHeight)) { countX++; dirX--; }
            if (maze_checkBlock(blocks, x + 1, y, realWidth, realHeight)) { countX++; dirX++; }
            if (maze_checkBlock(blocks, x, y - 1, realWidth, realHeight)) { countY++; dirY--; }
            if (maze_checkBlock(blocks, x, y + 1, realWidth, realHeight)) { countY++; dirY++; }

            if (countX + countY == 3 || (countX >= 1 && countY >= 1)) {
                spawnPos.push({
                    x: x + lootOffsetX,
                    y: y + lootOffsetY,
                    isCorner: (countX >= 1 && countY >= 1),
                    corner: {
                        x: dirX,
                        y: (dirX != 0 ? 0 : dirY)
                    }
                })
            }
        }
    }

    return {
        width: realWidth,
        height: realHeight,
        blocks: blocks,
        lootPos: spawnPos
    }
}

// Egy padló négyzetet készít el
function maze_meshAddFlat(geom, x, z, yOffset = 0) {
    // Vertexek
    var baseVertex = geom.vertices.length;
    geom.vertices.push(
        new THREE.Vector3(x, yOffset, z),
        new THREE.Vector3(x + 1, yOffset, z),
        new THREE.Vector3(x + 1, yOffset, z + 1),
        new THREE.Vector3(x, yOffset, z + 1),
    );

    //UV
    geom.faceVertexUvs[0].push([
        new THREE.Vector2(1, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 1)
    ]);
    geom.faceVertexUvs[0].push([
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 1)
    ]);

    // Face
    geom.faces.push(
        new THREE.Face3(baseVertex + 1, baseVertex, baseVertex + 2),
        new THREE.Face3(baseVertex + 2, baseVertex, baseVertex + 3),
    );
}

var wallTemplates = {
    /* MASK_LEFT */
    8: {
        vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 1, z: 1 },
            { x: 0, y: 1, z: 0 }
        ],
        normalFlip: true
    },
    /* MASK_RIGHT */
    4: {
        vertices: [
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 0, z: 1 },
            { x: 1, y: 1, z: 1 },
            { x: 1, y: 1, z: 0 }
        ],
        normalFlip: false
    },
    /* MASK_UP */
    2: {
        vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 0, y: 1, z: 0 }
        ],
        normalFlip: false
    },
    /* MASK_DOWN */
    1: {
        vertices: [
            { x: 0, y: 0, z: 1 },
            { x: 1, y: 0, z: 1 },
            { x: 1, y: 1, z: 1 },
            { x: 0, y: 1, z: 1 }
        ],
        normalFlip: true
    }
}

// Egy falat készít
function maze_meshAddWall(geom, x, z, mask, yOffset = 0) {
    var template = wallTemplates[mask];

    // Vertexek
    var baseVertex = geom.vertices.length;

    for (var i = 0; i < template.vertices.length; i++) {
        var vert = template.vertices[i];
        geom.vertices.push(new THREE.Vector3(x + vert.x, vert.y + yOffset, z + vert.z));
    }

    // Face
    if (template.normalFlip) {
        geom.faceVertexUvs[0].push([
            new THREE.Vector2(1, 0),
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1)
        ]);
        geom.faceVertexUvs[0].push([
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0, 1)
        ]);

        geom.faces.push(
            new THREE.Face3(baseVertex + 1, baseVertex, baseVertex + 2),
            new THREE.Face3(baseVertex + 2, baseVertex, baseVertex + 3),
        );
    } else {
        geom.faceVertexUvs[0].push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1)
        ]);
        geom.faceVertexUvs[0].push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
        ]);

        geom.faces.push(
            new THREE.Face3(baseVertex, baseVertex + 1, baseVertex + 2),
            new THREE.Face3(baseVertex, baseVertex + 2, baseVertex + 3),
        );
    }
}

function maze_layoutCheck(x, y, w, h, layout, what) {
    if (x < 0 || y < 0 || x >= w || y >= h) {
        return false;
    }

    return (layout[y][x] == what);
}

// Labirintus geometria elkészítése
function maze_buildMaze(scene) {
    var width = MAZE_LAYOUT.layout[0].length;
    var height = MAZE_LAYOUT.layout.length;

    // Labirintus generálása
    var genW = (MAZE_LAYOUT.maze.w + 1) / 2;
    var genH = (MAZE_LAYOUT.maze.h + 1) / 2;
    var maze = maze_generate(genW, genH, MAZE_LAYOUT.maze.x, MAZE_LAYOUT.maze.y);

    for (var my = 0; my < MAZE_LAYOUT.maze.h; my++) {
        var line = MAZE_LAYOUT.layout[my + MAZE_LAYOUT.maze.y];
        for (var mx = 0; mx < MAZE_LAYOUT.maze.w; mx++) {
            line = line.replaceAt(mx + MAZE_LAYOUT.maze.x, (maze.blocks[mx + "-" + my] ? "1" : "0"));
        }
        MAZE_LAYOUT.layout[my + MAZE_LAYOUT.maze.y] = line;
    }

    // Meshes generálása
    var floorGeometry = new THREE.Geometry();
    var wallGeometry = new THREE.Geometry();
    var waterFloorGeometry = new THREE.Geometry();
    var waterWallGeometry = new THREE.Geometry();
    floorGeometry.faceVertexUvs[0] = [];
    wallGeometry.faceVertexUvs[0] = [];
    waterFloorGeometry.faceVertexUvs[0] = [];
    waterWallGeometry.faceVertexUvs[0] = [];

    var pathFind = [];
    var collision = [];

    for (var y = 0; y < height; y++) {
        var lineTemplate = MAZE_LAYOUT.layout[y];

        var pathFindLine = [];

        for (var x = 0; x < width; x++) {
            var isCollider = false;

            switch (lineTemplate[x]) {
                case "0": // Föld
                    {
                        maze_meshAddFlat(floorGeometry, x, y);

                        isCollider = false;
                    }
                    break;
                case "1": // Fal
                    {
                        if (!maze_layoutCheck(x - 1, y, width, height, MAZE_LAYOUT.layout, "1")) {
                            maze_meshAddWall(wallGeometry, x - 1, y, MASK_RIGHT);
                        }
                        if (!maze_layoutCheck(x + 1, y, width, height, MAZE_LAYOUT.layout, "1")) {
                            maze_meshAddWall(wallGeometry, x + 1, y, MASK_LEFT);
                        }

                        if (!maze_layoutCheck(x, y - 1, width, height, MAZE_LAYOUT.layout, "1")) {
                            maze_meshAddWall(wallGeometry, x, y - 1, MASK_DOWN);
                        }
                        if (!maze_layoutCheck(x, y + 1, width, height, MAZE_LAYOUT.layout, "1")) {
                            maze_meshAddWall(wallGeometry, x, y + 1, MASK_UP);
                        }

                        isCollider = true;
                    }
                    break;
                case "2": // Víz
                    {
                        maze_meshAddFlat(waterFloorGeometry, x, y, -1);

                        if (!maze_layoutCheck(x + 1, y, width, height, MAZE_LAYOUT.layout, "2")) {
                            maze_meshAddWall(waterWallGeometry, x, y, MASK_RIGHT, -1);
                        }

                        if (!maze_layoutCheck(x - 1, y, width, height, MAZE_LAYOUT.layout, "2")) {
                            maze_meshAddWall(waterWallGeometry, x, y, MASK_LEFT, -1);
                        }

                        if (!maze_layoutCheck(x, y + 1, width, height, MAZE_LAYOUT.layout, "2")) {
                            maze_meshAddWall(waterWallGeometry, x, y, MASK_DOWN, -1);
                        }

                        if (!maze_layoutCheck(x, y - 1, width, height, MAZE_LAYOUT.layout, "2")) {
                            maze_meshAddWall(waterWallGeometry, x, y, MASK_UP, -1);
                        }

                        isCollider = true;
                    }
                    break;
            }

            if (isCollider) {
                pathFindLine.push(0);

                collision[x + "-" + y] = [ new THREE.Box3(
                    new THREE.Vector3(x, 0, y),
                    new THREE.Vector3(x + 1, 1, y + 1),
                ) ];
            } else {
                pathFindLine.push(1);
            }
        }

        pathFind.push(pathFindLine);
    }

    floorGeometry.uvsNeedUpdate = true;
    wallGeometry.uvsNeedUpdate = true;
    waterFloorGeometry.uvsNeedUpdate = true;
    waterWallGeometry.uvsNeedUpdate = true;

    floorGeometry.computeFaceNormals();
    wallGeometry.computeFaceNormals();
    waterFloorGeometry.computeFaceNormals();
    waterWallGeometry.computeFaceNormals();

    // Pálya meshek
    var floorMaterial = new THREE.MeshPhongMaterial({
        map: res.grass.data,
        specularMap: res.grass_specular.data,
        specular: 0x151515
    });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    floorMesh.layers.enable(0); // Megjelenítés réteg
    floorMesh.layers.enable(2); // Raycast réteg
    scene.add(floorMesh);

    var wallMaterial = new THREE.MeshPhongMaterial({
        map: res.bush.data
    });
    var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallMesh.layers.enable(0); // Megjelenítés réteg
    wallMesh.layers.enable(2); // Raycast réteg
    scene.add(wallMesh);

    var waterFloorMaterial = new THREE.MeshPhongMaterial({
        map: res.rock.data
    });
    var waterFloorMesh = new THREE.Mesh(waterFloorGeometry, waterFloorMaterial);
    waterFloorMesh.castShadow = true;
    waterFloorMesh.receiveShadow = true;
    waterFloorMesh.layers.enable(0); // Megjelenítés réteg
    waterFloorMesh.layers.enable(2); // Raycast réteg
    scene.add(waterFloorMesh);

    var waterWallMaterial = new THREE.MeshPhongMaterial({
        map: res.rock_grass.data
    });
    var waterWallMesh = new THREE.Mesh(waterWallGeometry, waterWallMaterial);
    waterWallMesh.castShadow = true;
    waterWallMesh.receiveShadow = true;
    waterWallMesh.layers.enable(0); // Megjelenítés réteg
    waterWallMesh.layers.enable(2); // Raycast réteg
    scene.add(waterWallMesh);

    // Ereklyék
    var lootPos = maze.lootPos

    var statueObject = res.statue.data.clone();
    statueObject.position.set(MAZE_LAYOUT.artifact.statue.x + 0.5, 0, MAZE_LAYOUT.artifact.statue.y + 0.5);
    var statueMaterial = new THREE.MeshPhongMaterial({
        color: 0xaaaaff,
        specular: 0x050505,
        shininess: 100,
        envMap: res.envmap.data,
        reflectivity: 0.5
    });
    statueObject.traverse(function(e) {
        e.material = statueMaterial;
    })
    scene.add(statueObject);

    var artifacts = [];
    var artifactGhosts = [];
    for (var e = 0; e < MAZE_LAYOUT.artifact.artifacts.length; e++) {
        var apos = MAZE_LAYOUT.artifact.artifacts[e];

        var artifact = artifact_create(null, true);
        artifact.tag = e;
        artifact.mode = "TARGET";
        artifact.data.position.set(apos.x + 0.5, 0.5, apos.y + 0.5)
        scene.add(artifact.data);
        artifactGhosts.push(artifact);

        var spawnPosIndex;
        var pos;
        for (var j = 0; j < 10; j++) {
            spawnPosIndex = Math.floor(Math.random() * lootPos.length);
            pos = lootPos[spawnPosIndex];

            if (lootPos.length == 0) {
                console.error(":/");
                break;
            }

            var posOk = true;
            var worldPos = new THREE.Vector3(pos.x + 0.5, 0.5, pos.y + 0.5)
            for (var k = 0; k < artifacts.length; k++) {
                var dist = artifacts[k].data.position.distanceTo(worldPos);
                if (dist < 1.2) {
                    posOk = false;
                    break;
                }
            }

            if (posOk) {
                break;
            }
        }

        lootPos.splice(spawnPosIndex, 1);

        var artifactPickup = artifact_create(artifact, false);
        artifactPickup.tag = e;
        artifactPickup.mode = "PICKUP";
        artifactPickup.data.position.set(pos.x + 0.5, 0.5, pos.y + 0.5)
        scene.add(artifactPickup.data);

        artifacts.push(artifactPickup);
    }

    // Dekorációk
    for (var i = 0; i < MAZE_STATUES.length; i++) {
        if (lootPos.length == 0)
            break;

        var statue = MAZE_STATUES[i];
        for (var j = 0; j < statue.count; j++) {
            if (lootPos.length == 0)
                break;

            var spawnPosIndex;
            var pos;

            var tryIt = 0;
            do {
                spawnPosIndex = Math.floor(Math.random() * lootPos.length);
                pos = lootPos[spawnPosIndex];
            } while (!pos.isCorner && tryIt < 10);
            if (!pos.isCorner) {
                continue;
            }

            lootPos.splice(spawnPosIndex, 1);
            var dataCopy = res[statue.key].data.clone();
            dataCopy.position.set(pos.x + 0.5 + pos.corner.x * 0.5, 0.5, pos.y + 0.5 + pos.corner.y * 0.5);
            maze_cornerToRotY(dataCopy, pos.corner);
            maze_createStatueMaterial(dataCopy, statue.key);

            dataCopy.castShadow = true;
            dataCopy.receiveShadow = true;

            scene.add(dataCopy);
        }
    }

    // Kijárat
    var exitDoor = res.exit_door.data.clone();
    exitDoor.name = "EXIT";

    exitDoor.layers.enable(0);
    exitDoor.layers.enable(2);

    exitDoor.position.set(MAZE_LAYOUT.exit.door.x + 0.5, 0.5, MAZE_LAYOUT.exit.door.y + 0.5);

    var exitDoorCollider = new THREE.Box3(
        new THREE.Vector3(MAZE_LAYOUT.exit.door.x, 0, MAZE_LAYOUT.exit.door.y + 0.4),
        new THREE.Vector3(MAZE_LAYOUT.exit.door.x + 1, 1, MAZE_LAYOUT.exit.door.y + 0.6),
    ); 
    collision[MAZE_LAYOUT.exit.door.x + "-" + MAZE_LAYOUT.exit.door.y] = [ exitDoorCollider ];

    var doorMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        map: res.exit_door_texture.data
    });
    exitDoor.material = doorMaterial;
    exitDoor.traverse(function (child) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = doorMaterial;
        child.name = "EXIT";

        child.layers.enable(0);
        child.layers.enable(2);
    });
    scene.add(exitDoor);

    var exitDoorTweenData = { x: 0, collider: exitDoorCollider, object: exitDoor }
    var exitDoorTween = new TWEEN.Tween(exitDoorTweenData)
        .to({ x: 0.9 }, 1000)
        .onUpdate(function () {
            exitDoorTweenData.collider.min.x = MAZE_LAYOUT.exit.door.x + exitDoorTweenData.x;
            exitDoorTweenData.collider.max.x = MAZE_LAYOUT.exit.door.x + 1 + exitDoorTweenData.x;
            exitDoorTweenData.object.position.x = MAZE_LAYOUT.exit.door.x + 0.5 + exitDoorTweenData.x;
        });

    // Kupa
    var cup = res.cup.data
    cup.scene.layers.enable(0);
    cup.scene.layers.enable(2);
    cup.scene.traverse(function(e) {
        e.layers.enable(0);
        e.layers.enable(2);

        if (e.material != null){
            e.material.envMap = res.envmap.data;
            e.material.metalness = 0.5;
        }
    })
    scene.add(cup.scene);
    cup.scene.position.set(MAZE_LAYOUT.exit.cup.x + 0.5, 0, MAZE_LAYOUT.exit.cup.y + 0.5)
    cup.scene.rotation.set(0, Math.PI / 2, 0);

    collision[MAZE_LAYOUT.exit.cup.x + "-" + MAZE_LAYOUT.exit.cup.y] = [ new THREE.Box3(
        new THREE.Vector3(MAZE_LAYOUT.exit.cup.x + 0.2, 0, MAZE_LAYOUT.exit.cup.y + 0.2),
        new THREE.Vector3(MAZE_LAYOUT.exit.cup.x + 0.8, 1, MAZE_LAYOUT.exit.cup.y + 0.8),
    ) ];

    // Pálya kész
    var maze = {
        meshes: [
            floorMesh,
            wallMesh
        ],
        collision: collision,
        artifacts: artifacts,
        artifactGhosts: artifactGhosts,
        statue: statueObject,
        exitDoor: {
            object: exitDoor,
            open: exitDoorTween
        },
        pathFind: new Graph(pathFind, { diagonal: true })
    }

    return maze;
}

function maze_createStatueMaterial(obj, key) {
    var newMaterial = new THREE.MeshPhongMaterial({
        color: 0xaaaaaa,
        specular: 0x888888,
        shininess: 100
    });
    if (key == "skeleton") {
        newMaterial.map = res.skeleton_texture.data;
        newMaterial.transparent = true;
        newMaterial.side = THREE.DoubleSide;
    }
    obj.material = newMaterial;
    obj.traverse(function (child) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = newMaterial;
    });
    obj.material.needsUpdate = true;
    obj.needsUpdate = true;
}

function maze_cornerToRotY(obj, corner) {
    if (corner.x > 0) {
        obj.rotation.set(0, -Math.PI, 0);
    } else if (corner.y < 0) {
        obj.rotation.set(0, -Math.PI / 2, 0);
    } else if (corner.y > 0) {
        obj.rotation.set(0, Math.PI / 2, 0);
    }
}

function maze_getCollisionBoxes(maze, centerX, centerY, range = 2) {
    var boxes = [];

    for (var y = centerY - range; y <= centerY + range; y++) {
        if (y < 0 || y >= maze.height) {
            continue;
        }

        for (var x = centerX - range; x <= centerX + range; x++) {
            if (x < 0 || x >= maze.width) {
                continue;
            }

            var cell = maze.collision[x + "-" + y];

            if (cell == undefined) {
                continue;
            }

            cell.forEach(e => {
                boxes.push(e); 
            });
        }
    }

    return boxes;
}