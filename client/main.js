let interval_Timer_ID_update_horns;
let interval_Timer_ID_update_lights;

const horn_melody_0 = [1, 2, 3];   // TODO: replace with real sequence
const horn_melody_1 = [3, 4, 5];   // TODO: replace with real sequence
const horn_melody_2 = [6, 7, 8];   // TODO: replace with real sequence

async function startUpdateLights(source) {
    // check if an interval has already been set up
    let interval_ms = 1000;
    switch (source.id) {
        case 'lights_no_update_option':
            interval_ms = 0;
            break;

        case 'lights_500ms_update_option':
            interval_ms = 500;
            break;

        case 'lights_3s_update_option':
            interval_ms = 3000;
            break;

        default:
            break;
    }

    if (interval_ms != 0) {
        stopUpdateLights();
        interval_Timer_ID_update_lights = setInterval(readLights, interval_ms);
    } else if (interval_Timer_ID_update_lights && interval_ms == 0) {
        stopUpdateLights();
    }
}

async function startUpdateHorns(source) {
    // check if an interval has already been set up
    let interval_ms = 1000;
    switch (source.id) {
        case 'horns_no_update_option':
            interval_ms = 0;
            break;

        case 'horns_500ms_update_option':
            interval_ms = 500;
            break;

        case 'horns_3s_update_option':
            interval_ms = 3000;
            break;

        default:
            break;
    }

    if (interval_ms != 0) {
        stopUpdateHorns();
        interval_Timer_ID_update_horns = setInterval(readHorns, interval_ms);
    } else if (interval_Timer_ID_update_horns && interval_ms == 0) {
        stopUpdateHorns();
    }
}

async function setSelectionSequencer(source) {
    // read
    let config = await readHorns();
    let indicator_str = 'undefined';
    
    //modify
    switch (source.id) {
        case 'selection_melody_0':
            config['sequencer_melody'] = horn_melody_0;
            indicator_str = 'melody_0';
            break;

        case 'selection_melody_1':
            config['sequencer_melody'] = horn_melody_1;
            indicator_str = 'melody_1';
            break;

        case 'selection_melody_2':
            config['sequencer_melody'] = horn_melody_2;
            indicator_str = 'melody_2';
            break;

        default:
            break;
    }

    //write
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;
    const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/setConfig';
    await postRequestJSON(target_addr, config);

    //Update Gui
    document.getElementById('selection_sequencer_melody').innerHTML = indicator_str;

}


async function stopUpdateLights() {
    clearInterval(interval_Timer_ID_update_lights);
    interval_Timer_ID_update_lights = null;
}

async function stopUpdateHorns() {
    clearInterval(interval_Timer_ID_update_horns);
    interval_Timer_ID_update_horns = null;
}



async function hornsConfigChanged(source) {
    // read
    let config = await readHorns();

    //modify
    config['sequencer_horns'] = '0';  // ensure Sequencer gets disabled
    
    let target_key = source.id.replace("button_", "");
    config[target_key] = (config[target_key] == '0' ? '1' : '0'); 

    //write
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;
    const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/setConfig';
    await postRequestJSON(target_addr, config);

    // update Gui
    await readHorns();
}

async function lightsConfigChanged(source) {
    // read
    let config = await readLights();

    //modify
    let target_key = source.id.replace("button_", "");
    config[target_key] = (config[target_key] == '0' ? '1' : '0'); 

    //write
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;
    const target_addr = 'http://' + ip_addr + ':' + port + '/api/lights/setConfig';
    await postRequestJSON(target_addr, config);

    // update Gui
    await readLights();
}

async function toggleThwGroup() {
    // read
    let config = await readHorns();

    //modify
    document.getElementById('state_thw_group').innerHTML = (document.getElementById('state_thw_group').innerHTML == 'off' ? 'activ' : 'off'); 
    let state = document.getElementById('state_thw_group').innerHTML;

    config['sequencer_horns'] = '0';  // ensure Sequencer gets disabled
    config['thw_low_tone'] = (state == 'off' ? '0' : '1'); 
    config['thw_high_tone'] = config['thw_low_tone'];

    //write
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;
    const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/setConfig';
    await postRequestJSON(target_addr, config);

    // update Gui
    await readHorns();
    updateGuiThwGroup();
}

async function updateGuiThwGroup(){
    document.getElementById('state_thw_group').className = (document.getElementById('state_thw_group').innerHTML == 'off' ? 'style_off_state' : 'style_activ_state'); 
}


async function toggleAllHorns(){
    // read
    let config = await readHorns();

    //modify
    document.getElementById('state_all_horns').innerHTML = (document.getElementById('state_all_horns').innerHTML == 'off' ? 'activ' : 'off'); 
    let state = document.getElementById('state_all_horns').innerHTML;

    config['sequencer_horns'] = '0';  // ensure Sequencer gets disabled
    const excluded_keys = ['sequencer_horns', 'sequencer_melody'];
    for (const [key, value] of Object.entries(config)) {
        if(excluded_keys.indexOf(key) == -1){
            config[key] = (state == 'off' ? '0' : '1'); 
        }else{
            console.log(`ignored: ${key}`);
        }
    }

    //write
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;
    const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/setConfig';
    await postRequestJSON(target_addr, config);

    // update Gui
    await readHorns();
    updateGuiAllHorns();
}

async function updateGuiAllHorns(){
    document.getElementById('state_all_horns').className = (document.getElementById('state_all_horns').innerHTML == 'off' ? 'style_off_state' : 'style_activ_state'); 
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
    if (response.ok) {
        const response_json = await response.json();
        console.log(response_json);
        console.log(response_json['message']);
        return response_json['message'];
    }

    return;
}

async function postRequestJSON(target_addr, data) {
    try {
        console.log('request to: ')
        console.log(target_addr);

        const response = await fetch(target_addr, {
            method: "POST",
            mode: "cors", 
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

async function readLights() {
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;

    const target_addr = 'http://' + ip_addr + ':' + port + '/api/lights/getAll';
    const result = await getRequest(target_addr);

    try {
        for (const [key, value] of Object.entries(result)) {
            if (value == "1") {
                document.getElementById('state_' + key).innerText = 'activ';
                document.getElementById('state_' + key).className = 'style_activ_state';
            } else {
                document.getElementById('state_' + key).innerText = 'off';
                document.getElementById('state_' + key).className = 'style_off_state';
            }
        };

    } catch (error) {
        console.error(error);
    }

    return result;

}

async function readHorns() {
    const ip_addr = document.getElementById("server_address").value;
    const port = document.getElementById("server_port").value;

    const target_addr = 'http://' + ip_addr + ':' + port + '/api/horns/getAll';
    const result = await getRequest(target_addr);

    try {
        for (const [key, value] of Object.entries(result)) {
            if (key != 'sequencer_melody') {
                if (value == "1") {
                    document.getElementById('state_' + key).innerText = 'activ';
                    document.getElementById('state_' + key).className = 'style_activ_state';
                } else {
                    document.getElementById('state_' + key).innerText = 'off';
                    document.getElementById('state_' + key).className = 'style_off_state';
                }
            }
        };

    } catch (error) {
        console.error(error);
    }

    return result;
}







document.getElementById("server_address").value = "192.168.0.114";
document.getElementById("server_port").value = "3000";