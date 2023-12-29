
function hornsConfigChanged(self){
    console.log('called by ID:', self.id);
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "update horns";

}

function lightsConfigChanged(self){
    console.log('called by ID:', self.id);
    var console_element = document.getElementById("console_textarea");
    console_element.textContent = "update lights";

}

async function logMovies() {
    const response = await fetch("https://dog.ceo/api/breeds/image/random");
    const data = await response.json();
    console.log(data);
  }

async function readLights() {
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;

    const target_addr = 'http://' + ip_addr + ':' + port + '/api/lights/getAll';
    const result = await getRequest(target_addr);

    const state_front_flasher_field = document.getElementById('state_front_flasher');
    const state_back_flasher_field = document.getElementById('state_back_flasher');
    const state_grill_flasher_field = document.getElementById('state_grill_flasher');

    state_front_flasher_field.innerText = result["flasher_bar_front"];
    state_back_flasher_field.innerText = result["flasher_bar_back"];
    state_grill_flasher_field.innerText = result["flasher_grill"];
  }

async function getRequest(target_addr) {
    console.log('request to: ')
    console.log(target_addr);
    const response = await fetch(target_addr, {
        method: 'GET',
        mode: 'cors'
      });
    console.log('received:');
    console.log(response);
    if(response.ok){
        const response_json = await response.json();
        console.log(response_json);
        console.log(response_json['message']);
        return response_json['message'];
    }
    
    return;
    
  }

async function readHorns() {
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;

    /*const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/getAll';
    console.log('request to: ')
    console.log(target_addr);
    const response = await fetch(target_addr, {headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }});
    console.log('received:');
    console.log(response);
    */

    const data = { value: "1" };
    postJSON(data);
  }


async function postJSON(data) {
    try {
    
        const ip_addr = document.getElementById("server_address").value;
        const port = document.getElementById("server_port").value;

        const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/setValue/thw_low_tone';
        console.log('request to: ')
        console.log(target_addr);

      const response = await fetch(target_addr, {
        method: "POST", // or 'PUT'
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
  

document.getElementById("server_address").value = "192.168.0.114";
document.getElementById("server_port").value = "3000";