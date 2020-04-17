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
function maze_generate(width, height) {
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

    // Ahova nem kell kocka k9törlöm
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

    // Dekorációk
    finalWidth = realWidth + 5
    finalHeight = realHeight + 5

    mapOffset = 3

    var newBlocks = [];

    // A végleges térkép előkészítése
    for (var y = 0; y < finalHeight; y++) {
        for (var x = 0; x < finalWidth; x++) {
            newBlocks[x + "-" + y] = (x <= 1 || y <= 1 || x == finalWidth - 1 || y == finalHeight - 1);
        }
    }

    // Kezdőzóna
    for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 3; x++) {
            newBlocks[(x + 1) + "-" + (y + 1)] = false
        }
    }

    // Labirintus átmásolása
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            newBlocks[(x + mapOffset) + "-" + (y + mapOffset)] = blocks[x + "-" + y]
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
                    x: x + mapOffset,
                    y: y + mapOffset,
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
        width: finalWidth,
        height: finalHeight,
        blocks: newBlocks,
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
function maze_meshAddWall(geom, x, z, mask) {
    var template = wallTemplates[mask];

    // Vertexek
    var baseVertex = geom.vertices.length;

    for (var i = 0; i < template.vertices.length; i++) {
        var vert = template.vertices[i];
        geom.vertices.push(new THREE.Vector3(x + vert.x, vert.y, z + vert.z));
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

// Labirintus geometria elkészítése
function maze_buildMaze(scene, maze) {
    var width = maze.width;
    var height = maze.height;
    var blocks = maze.blocks;

    var floorGeometry = new THREE.Geometry();
    var wallGeometry = new THREE.Geometry();

    floorGeometry.faceVertexUvs[0] = [];
    wallGeometry.faceVertexUvs[0] = [];

    var collision = [];
    var pathFind = [];
    
    for (var y = 0; y < height; y++) {
        var pathFindLine = [];

        for (var x = 0; x < width; x++) {
            var block = blocks[x + "-" + y];
            if (block) {
                // Falak
                if (!maze_checkBlock(blocks, x - 1, y, width, height)) {
                    maze_meshAddWall(wallGeometry, x - 1, y, MASK_RIGHT);
                }
                if (!maze_checkBlock(blocks, x + 1, y, width, height)) {
                    maze_meshAddWall(wallGeometry, x + 1, y, MASK_LEFT);
                }

                if (!maze_checkBlock(blocks, x, y - 1, width, height)) {
                    maze_meshAddWall(wallGeometry, x, y - 1, MASK_DOWN);
                }
                if (!maze_checkBlock(blocks, x, y + 1, width, height)) {
                    maze_meshAddWall(wallGeometry, x, y + 1, MASK_UP);
                }

                // Ütközés Box3
                collision[x + "-" + y] = new THREE.Box3(
                    new THREE.Vector3(x, 0, y),
                    new THREE.Vector3(x + 1, 1, y + 1),
                );

                pathFindLine.push(0);
            } else {
                maze_meshAddFlat(floorGeometry, x, y); // Padló

                pathFindLine.push(1);
            }
        }

        pathFind.push(pathFindLine);
    }

    floorGeometry.uvsNeedUpdate = true;
    wallGeometry.uvsNeedUpdate = true;

    floorGeometry.computeFaceNormals();

    wallGeometry.computeFaceNormals();

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

    // Ereklyék elhelyezése
    var lootPos = maze.lootPos

    var artifacts = [];
    for (var i = 0; i < MAZE_ARTIFACT_COUNT; i++) {
        if (lootPos.length == 0)
            break;

        var spawnPosIndex;
        var pos;
        for (var j = 0; j < 10; j++) {
            spawnPosIndex = Math.floor(Math.random() * lootPos.length);
            pos = lootPos[spawnPosIndex];

            if (artifacts.length == 0) {
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

        var artifact = artifact_create(null, false);
        artifact.data.position.set(pos.x + 0.5, 0.5, pos.y + 0.5)
        scene.add(artifact.data);

        artifacts.push(artifact);
    }

    // Dekorációk elhelyezése
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

    var maze = {
        data: maze,
        meshes: [
            floorMesh,
            wallMesh
        ],
        collision: collision,
        artifacts: artifacts,
        pathFind: new Graph(pathFind, { diagonal: true })
    }

    return maze;
}

function maze_createStatueMaterial(obj, key) {
    var newMaterial = new THREE.MeshPhongMaterial( { 
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
        obj.rotation.set(0, Math.PI, 0);
    } else if (corner.y < 0) {
        obj.rotation.set(0, Math.PI / 2, 0);
    } else if (corner.y > 0) {
        obj.rotation.set(0, -Math.PI / 2, 0);
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

            boxes.push(cell)
        }
    }

    return boxes;
}