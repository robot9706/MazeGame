var inputs = [];

function input_addInput(name, code) {
    inputs.push({
        name: name,
        key: code,
        isDown: false
    })
}

function input_init() {
    input_addInput("FORWARD", 87);
    input_addInput("BACKWARD", 83);
    input_addInput("LEFT", 65);
    input_addInput("RIGHT", 68);
    input_addInput("PICK", 32);

    document.addEventListener("keydown", function(e) {
        //console.log(e.keyCode);
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].key == e.keyCode) {
                inputs[i].isDown = true;
                break;
            }
        }
    });
    document.addEventListener("keyup", function(e) {
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].key == e.keyCode) {
                inputs[i].isDown = false;
                break;
            }
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