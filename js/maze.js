const MASK_LEFT = 0x08;
const MASK_RIGHT = 0x04;
const MASK_UP = 0x02;
const MASK_DOWN = 0x01;

const MAZE_ARTIFACT_COUNT = 6;

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

// Based on the "Recursive backtracker" algorithm
function maze_generate(width, height) {
    // Init the maze
    var cells = [];
    for (var y = 0; y < height; y++) {
        var line = [];
        for (var x = 0; x < width; x++) {
            line.push({
                x: x,
                y: y,
                walls: 15, // All walls set
                visited: false
            });
        }
        cells.push(line);
    }

    // Const
    var startX = 1;
    var startY = 0;

    // Randomize a maze
    var startCell = maze_helperGetCell(cells, startX, startY, width, height);

    var stack = [startCell];

    while (stack.length > 0) {
        var current = stack.pop();

        var x = current.x;
        var y = current.y;

        // Find possible neighbours
        var possible = [];
        if (maze_checkVisit(cells, x - 1, y, width, height)) possible.push({ x: x - 1, y: y, mask: MASK_LEFT, maskInvert: MASK_RIGHT });
        if (maze_checkVisit(cells, x + 1, y, width, height)) possible.push({ x: x + 1, y: y, mask: MASK_RIGHT, maskInvert: MASK_LEFT });
        if (maze_checkVisit(cells, x, y - 1, width, height)) possible.push({ x: x, y: y - 1, mask: MASK_UP, maskInvert: MASK_DOWN });
        if (maze_checkVisit(cells, x, y + 1, width, height)) possible.push({ x: x, y: y + 1, mask: MASK_DOWN, maskInvert: MASK_UP });

        if (possible.length == 0) {
            continue;
        }

        // Select a random neighbour
        var selected = possible[Math.floor(Math.random() * possible.length)];
        var selectedCell = maze_helperGetCell(cells, selected.x, selected.y, width, height);

        // Remove the walls
        current.walls &= (~selected.mask);
        selectedCell.walls &= (~selected.maskInvert);

        // Push the current to the stack
        stack.push(current);

        // Mark the neighbour and push it to the stack
        selectedCell.visited = true;
        stack.push(selectedCell);
    }

    // Create the actual maze data
    realWidth = (width * 2 - 1)
    realHeight = (height * 2 - 1)

    // Init all blocks to walls
    var blocks = [];
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            blocks[x + "-" + y] = true
        }
    }

    // Remove blocks
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

    // Decorate the maze with walls and a starting area
    finalWidth = realWidth + 5
    finalHeight = realHeight + 5

    mapOffset = 3

    var newBlocks = [];

    // Fill the final map
    for (var y = 0; y < finalHeight; y++) {
        for (var x = 0; x < finalWidth; x++) {
            newBlocks[x + "-" + y] = (x <= 1 || y <= 1 || x == finalWidth - 1 || y == finalHeight - 1);
        }
    }

    // Create the spawn
    for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 3; x++) {
            newBlocks[(x + 1) + "-" + (y + 1)] = false
        }
    }

    // Copy the original map
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            newBlocks[(x + mapOffset) + "-" + (y + mapOffset)] = blocks[x + "-" + y]
        }
    }

    // Find possible posotions for loot
    var spawnPos = [];
    for (var y = 0; y < realHeight; y++) {
        for (var x = 0; x < realWidth; x++) {
            if (maze_checkBlock(blocks, x, y, realWidth, realHeight)) continue;

            var countX = 0;
            var countY = 0;
            if (maze_checkBlock(blocks, x - 1, y, realWidth, realHeight)) countX++;
            if (maze_checkBlock(blocks, x + 1, y, realWidth, realHeight)) countX++;
            if (maze_checkBlock(blocks, x, y - 1, realWidth, realHeight)) countY++;
            if (maze_checkBlock(blocks, x, y + 1, realWidth, realHeight)) countY++;

            if (countX + countY == 3 || (countX >= 1 && countY >= 1)) {
                spawnPos.push({
                    x: x + mapOffset,
                    y: y + mapOffset
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

function maze_meshAddFlat(geom, x, z, yOffset = 0) {
    // Vertices
    var baseVertex = geom.vertices.length;
    geom.vertices.push(
        new THREE.Vector3(x, yOffset, z),
        new THREE.Vector3(x + 1, yOffset, z),
        new THREE.Vector3(x + 1, yOffset, z + 1),
        new THREE.Vector3(x, yOffset, z + 1),
    );

    //UVs
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

    // Faces
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

function maze_meshAddWall(geom, x, z, mask) {
    var template = wallTemplates[mask];

    // Vertices
    var baseVertex = geom.vertices.length;

    for (var i = 0; i < template.vertices.length; i++) {
        var vert = template.vertices[i];
        geom.vertices.push(new THREE.Vector3(x + vert.x, vert.y, z + vert.z));
    }

    // Faces
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

function maze_buildMaze(scene, maze) {
    var width = maze.width;
    var height = maze.height;
    var blocks = maze.blocks;

    var floorGeometry = new THREE.Geometry();
    var wallGeometry = new THREE.Geometry();

    floorGeometry.faceVertexUvs[0] = [];
    wallGeometry.faceVertexUvs[0] = [];

    var collision = [];

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var block = blocks[x + "-" + y];
            if (block) {
                // Create walls
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

                // Create collision
                collision[x + "-" + y] = new THREE.Box3(
                    new THREE.Vector3(x, 0, y),
                    new THREE.Vector3(x + 1, 1, y + 1),
                );
            } else {
                maze_meshAddFlat(floorGeometry, x, y); // Add floor
            }
        }
    }

    floorGeometry.uvsNeedUpdate = true;
    wallGeometry.uvsNeedUpdate = true;

    floorGeometry.computeFaceNormals();
    //floorGeometry.computeVertexNormals();

    wallGeometry.computeFaceNormals();
    //wallGeometry.computeVertexNormals();

    var grassTexture = new THREE.TextureLoader().load("assets/grass.png");
    grassTexture.minFilter = THREE.NearestFilter;
    grassTexture.magFilter = THREE.NearestFilter;

    var grassSpecularMap = new THREE.TextureLoader().load("assets/grass_specular.png");
    grassSpecularMap.minFilter = THREE.NearestFilter;
    grassSpecularMap.magFilter = THREE.NearestFilter;

    var bushTexture = new THREE.TextureLoader().load("assets/bush.png");
    bushTexture.minFilter = THREE.NearestFilter;
    bushTexture.magFilter = THREE.NearestFilter;

    var floorMaterial = new THREE.MeshPhongMaterial({
        map: grassTexture,
        specularMap: grassSpecularMap,
        specular: 0x151515
    });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.castShadow = true; 
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    var wallMaterial = new THREE.MeshPhongMaterial({
        map: bushTexture
    });
    var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    // Generate loot
    var lootPos = maze.lootPos

    var artifacts = [];
    for (var i = 0; i < MAZE_ARTIFACT_COUNT; i++)
    {
        if (lootPos.length == 0)
            break;

        var spawnPosIndex;
        var pos;
        for (var j = 0; j < 10; j++)
        {
            spawnPosIndex = Math.floor(Math.random() * lootPos.length);
            pos = lootPos[spawnPosIndex];
            
            if (artifacts.length == 0)
            {
                break;
            }

            var posOk = true;
            var worldPos = new THREE.Vector3(pos.x + 0.5, 0.5, pos.y + 0.5)
            for (var k = 0; k < artifacts.length; k++)
            {
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

    var maze = {
        data: maze,
        meshes: [
            floorMesh,
            wallMesh
        ],
        collision: collision,
        artifacts: artifacts,
    }

    return maze;
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