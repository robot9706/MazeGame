var inputs = [];

function input_addInput(name, code) {
    inputs.push({
        name: name,
        key: code,
        isDown: false
    })
}

function input_set(key, value) {
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].key == key) {
            inputs[i].isDown = value;
            break;
        }
    }
}

function input_init() {
    input_addInput("FORWARD", 87);
    input_addInput("BACKWARD", 83);
    input_addInput("LEFT", 65);
    input_addInput("RIGHT", 68);
    input_addInput("RUN", 16);
    input_addInput("PICK", 32);
    input_addInput("PICK_MOUSE", -1);

    document.addEventListener("keydown", function (e) {
        //console.log(e.keyCode);
        input_set(e.keyCode, true);
    });
    document.addEventListener("keyup", function (e) {
        input_set(e.keyCode, false);
    });
    document.addEventListener("mousedown", function (e) {
        if (e.button == 0) {
            input_set(-1, true);
        }
    });
    document.addEventListener("mouseup", function (e) {
        if (e.button == 0) {
            input_set(-1, false);
        }
    });
}

function input_isDown(name) {
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].name == name) {
            return inputs[i].isDown;
        }
    }

    console.warn("Unknown key! " + name);
    return false;
}