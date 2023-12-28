
function onClickedConnect(){
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "connected";

    logMovies();

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

async function logMovies() {
    const response = await fetch("https://dog.ceo/api/breeds/image/random");
    const data = await response.json();
    console.log(data);
  }