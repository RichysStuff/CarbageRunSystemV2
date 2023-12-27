
function onClickedConnect(){
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "connected";

}

function onClickedDisconnect(){
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "disconnected";

}

function hornsConfigChanged(){
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "update horns";

}

function lightsConfigChanged(){
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "update lights";

}