const express = require('express');
const cors = require('cors');
const { Mutex } = require('async-mutex');
const I2C = require('i2c-bus'); //  Disable I2C functions until Hardware is build
const path = require('path');

const mutex = new Mutex();
const app = express();
const bodyParser = require('body-parser');
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const i2c_dev_addr_0 = 0x21;
const i2c_dev_addr_1 = 0x20;

const i2c_dev_config_reg_addr_port_0 = 0x6;
const i2c_dev_config_reg_addr_port_1 = 0x7;
const i2c_dev_output_reg_addr_port_0 = 0x2;
const i2c_dev_output_reg_addr_port_1 = 0x3;

const channel_to_i2c_map = {	ch0: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 5],  // device addr | port number | bit offset
		ch1: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 4],
		ch2: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 3],  
		ch3: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 2],    
		ch4: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 1],   
		ch5: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, 0],  
		ch6: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 7],  
		ch7: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 6],  
		ch8: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 5],  
		ch9: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 4],  
		ch10: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 3], 
		ch11: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 2], 
		ch12: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 1], 
		ch13: [i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, 0],  
		ch14: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 7], 
		ch15: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 6], 
		ch16: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 5], 
		ch17: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 4], 
		ch18: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 3], 
		ch19: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 2],  
		ch20: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 1],  
		ch21: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, 0],  
		ch22: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 7],  
		ch23: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 6],  
		ch24: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 5],  
		ch25: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 4],  
		ch26: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 3],  
		ch27: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 2],  
		ch28: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 1],  
		ch29: [i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, 0]};

const equip_to_ch_map = {flasher_bar_front: 'ch0',  	// amber Light bar front of vehicle
               		flasher_bar_front_mode: 'ch1', 
			flasher_bar_back: 'ch2',   	// amber Light bar back of vehicle
			flasher_bar_back_mode: 'ch3',
		       flasher_grill: 'ch4',      	// amber flashers in radiator grill
		       flasher_grill_mode: 'ch5',  
		       flasher_roof_back_0: 'ch6',
		       flasher_roof_back_1: 'ch7',
		       flasher_roof_back_2: 'ch8',
		       flasher_roof_back_3: 'ch9',
		       beacon_left: 'ch10',        	// rotating amber beacon left side
		       beacon_right: 'ch11',       // rotating amber beacon right side
		       work_lights_front: 'ch12',  // white working lights on the front of the roof
		       work_lights_back: 'ch13',  // white working lights on the back of the roof
	   	       thw_low_tone: 'ch14',            // long low tone air horn
		       thw_high_tone: 'ch15',           // long high tone air horn
		       quadruple_horn: 'ch16',          // quadruple air horn (train horn sound)
		       melodiy_horn_1: 'ch17',          // longest of melodiy air horns 
		       melodiy_horn_2: 'ch18',          // ---
		       melodiy_horn_3: 'ch19',          // ---
		       melodiy_horn_4: 'ch20',          // ---
		       melodiy_horn_5: 'ch21',          // ---
		       melodiy_horn_6: 'ch22'};          // shortest of melodiy air horns 


/* ensure that request are in json format and that invalid requests
   don't crash the server*/
app.use(bodyParser.json({
  type: 'application/json',
  strict: true,
  limit: 1024 * 1024,
  reviver: (key, value) => {
    if (key === 'name') {
      if (value.length > 50) {
        throw new Error('Invalid name length');
      }
    }
    return value;
  }
}));

// configuration objects. These represent the single source of truth
const lights = {flasher_bar_front: '0',  // amber Light bar front of vehicle
		          flasher_bar_back: '0',   // amber Light bar back of vehicle
                flasher_grill: '0',      // amber flashers in radiator grill  
                flasher_roof_back: '0',  // amber flashers on the back of the roof 
                beacon_left: '0',        // rotating amber beacon left side
                beacon_right: '0',       // rotating amber beacon right side
                work_lights_front: '0',  // white working lights on the front of the roof
                work_lights_back: '0'};  // white working lights on the back of the roof

const horns = {thw_low_tone: '0',            // long low tone air horn
	            thw_high_tone: '0',           // long high tone air horn
               quadruple_horn: '0',          // quadruple air horn (train horn sound)
               melodiy_horn_1: '0',          // longest of melodiy air horns 
               melodiy_horn_2: '0',          // ---
               melodiy_horn_3: '0',          // ---
               melodiy_horn_4: '0',          // ---
               melodiy_horn_5: '0',          // ---
               melodiy_horn_6: '0',          // shortest of melodiy air horns
               
               sequencer_melody: [],         // melodiy encoded in array
               sequencer_horns: '0'};        // acticate sequencer thats plays sequencer_melody with the air horns

// Message constansts for error signaling 
const error_str_key_not_available = 'key is not available in config';
const error_str_value_field_not_included = 'value field is missing in request';
const error_str_internal_server_error = "Internal Server Error";
const response_str_update_successfull = 'value was successfully updated';


/* get request to root of website ,  callback with request and response*/
//TODO: implement static hosting of client side (index.html, ...)
/* app.get('/', (req, res) => {
const message_json = {message: 'Hello World'};
res.statusCode = 200;
res.json(message_json);
});
*/

/*get current configuration*/
app.get('/api/lights/getAll', async (req, res) =>{
   try {
      const release = await mutex.acquire();
         res.statusCode = 200;
         res.json({message: lights});
      release();
   } catch (error) {
      
      if (release) {
         release();
      }
      
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }
})

/*get all available keys in lights Configuration*/
app.get('/api/lights/getKeys', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      res.statusCode = 200;
      res.json({message: Object.keys(lights)}); 
         
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }
});

/*get value of light by key*/
app.get('/api/lights/getValue/:key', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      if (lights.hasOwnProperty(req.params.key)){
         res.statusCode = 200; 
         res.json({message: lights[req.params.key]});
      }else{
         res.statusCode = 404;
         res.json({message: error_str_key_not_available});
      } 
         
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

});

/*set new Value to single element*/
app.post('/api/lights/setValue/:key/', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      const newData = req.body;
      if(lights.hasOwnProperty(req.params.key)){
         if(newData.hasOwnProperty('value')){
         lights[req.params.key]=newData.value;
         res.statusCode = 200;
         res.json({message: response_str_update_successfull});
         }else{
            res.statusCode = 404;
         res.json({message: error_str_value_field_not_included}); 
         };
      }else{
         res.statusCode = 404;
         res.json({message: error_str_key_not_available});
      };   
         
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

});

/*set new Configuration*/
app.post('/api/lights/setConfig', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      const newData = req.body;
      console.log('Write new Config to horns object');
      for (const [key, value] of Object.entries(newData)) {
         
         if(lights.hasOwnProperty(key)){
            lights[key] = value;
            console.log(`changed ${key}: to ${value}`);
         }else{
            res.statusCode = 404;
            res.json({message: `${key}: ${error_str_key_not_available}`});
            release();
            return;
         };

      };
      res.statusCode = 200;
      res.json({message: response_str_update_successfull}); 
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

 });

/*get current configuration*/
app.get('/api/horns/getAll', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      res.statusCode = 200;
      res.json({message: horns});   
         
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }
})

/*get all available keys in horns Configuration*/
app.get('/api/horns/getKeys', async (req, res) =>{
   try {
      const release = await mutex.acquire();
      
      res.statusCode = 200;
      res.json({message: Object.keys(horns)});  
      
      release();
   } catch (error) {
      
      if (release) {
         release();
      }
      
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

});

/*get value of horn by key*/
app.get('/api/horns/getValue/:key', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      if (horns.hasOwnProperty(req.params.key)){
         res.statusCode = 200;
         res.json({message: horns[req.params.key]});
      }else{
         res.statusCode = 404;
         res.json({message: error_str_key_not_available});
      }   
         
      release();
   } catch (error) {
      if (release) {
         release();
      }
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

});

/*set new Configuration*/
app.post('/api/horns/setConfig', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      const newData = req.body;
      console.log('Write new Config to horns object');
      for (const [key, value] of Object.entries(newData)) {
         
         if(horns.hasOwnProperty(key)){
            horns[key] = value;
            console.log(`changed ${key}: to ${value}`);
         }else{
            res.statusCode = 404;
            res.json({message: `${key}: ${error_str_key_not_available}`});
            release();
            return;
         };

      };

      res.statusCode = 200;
      res.json({message: response_str_update_successfull});
      release();
         
   } catch (error) {
      if (release) {
         release();
      }

      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }

 });

/*set new Value to single element*/
app.post('/api/horns/setValue/:key/', async (req, res) =>{
   try {
      const release = await mutex.acquire();

      const newData = req.body;
      if(horns.hasOwnProperty(req.params.key)){
         if(newData.hasOwnProperty('value')){
            horns[req.params.key]=newData.value;
            res.statusCode = 200;
            res.json({message: response_str_update_successfull});
         }else{
            res.statusCode = 404;
            res.json({message: error_str_value_field_not_included});
         };
      }else{
         res.statusCode = 404;
         res.json({message: error_str_key_not_available});
      };  

      release();
   } catch (error) {
      
      if (release) {
         release();
      }
      
      res.statusCode = 500;
      res.json({message: error_str_internal_server_error});
   }
});


let startup_latch = 0;
//runtime of System. This is used to update the peripheries (shift registers) over an I2C connection.
const intervalId = setInterval(async () => {
   let release;
   /* prevent race conditions between this function and api calls*/
   try {
      release = await mutex.acquire();
      
      /* create independant copies that are used to update the shift registers over I2C*/
      const lights_buffered = JSON.parse(JSON.stringify(lights));
      const horns_buffered = JSON.parse(JSON.stringify(horns));;
   
      release();

      // Update the I2C devices using the buffered objects
      // TODO: add I2C write command as soon as hardware side is build an register addresses are defined
      let dev_0_data = 0;
      let dev_1_data = 0;

      for (const light_key in lights_buffered){
	const curr_value = lights_buffered[light_key]; 
	if (equip_to_ch_map.hasOwnProperty(light_key)){
		console.log(`DEBUG: light_key: ${light_key} found in equip_to_ch_map.`);
		
        	const connected_ch = equip_to_ch_map[light_key];
            	if(channel_to_i2c_map.hasOwnProperty(connected_ch)){
            		console.log(`DEBUG: connected_ch: ${connected_ch} found in channel_to_i2c_map.`);
               	   	const [i2c_addr, port_addr, offset] = channel_to_i2c_map[connected_ch];				
               	   	let combined_offset = 0;
                
			if(port_addr == i2c_dev_output_reg_addr_port_0){
				combined_offset = offset;
			}else{
				combined_offset = 8+offset;
			};

			if(i2c_addr == i2c_dev_addr_0){
				dev_0_data |= curr_value<<combined_offset;
			}else{
				dev_1_data |= curr_value<<combined_offset;
			};
            	}else{
               		console.log(`ERROR: connected_ch: ${connected_ch} not found in channel_to_i2c_map. Keys contained were: ${Object.keys(channel_to_i2c_map)}`);
            	}
            }else{
            	console.log(`ERROR: light_key: ${light_key} not found in equip_to_ch_map. Keys contained were: ${Object.keys(equip_to_ch_map)}`);
         }
      }

      for (const horn_key in horns_buffered){
                  const curr_value = horns_buffered[horn_key]; 
                  if (equip_to_ch_map.hasOwnProperty(horn_key)){
                           const connected_ch = equip_to_ch_map[horn_key];
                           if(channel_to_i2c_map.hasOwnProperty(connected_ch)){
                                 const [i2c_addr, port_addr, offset] = channel_to_i2c_map[connected_ch];
                                 let combined_offset = 0;
                                 if(port_addr == i2c_dev_output_reg_addr_port_0){
                                          combined_offset = offset;
                                 }else{
                                          combined_offset = 8+offset;
                                 };

                                 if(i2c_addr == i2c_dev_addr_0){
                                          dev_0_data |= curr_value<<combined_offset;
                                 }else{
                                          dev_1_data |= curr_value<<combined_offset;
                                 };
                           }else{
                                 console.log(`ERROR: connected_ch: ${connected_ch} not found in channel_to_i2c_map. Keys contained were: ${Object.keys(channel_to_i2c_map)}`);
                           }
                  }else{
                           console.log(`ERROR: horn_key: ${horn_key} not found in equip_to_ch_map. Keys contained were: ${Object.keys(equip_to_ch_map)}`);
                  }
         }

      
      const i2c1 = I2C.openSync(1);
      if(startup_latch != 1){
         i2c1.writeByteSync(i2c_dev_addr_0, i2c_dev_config_reg_addr_port_0, 0); // setup ports as output
         i2c1.writeByteSync(i2c_dev_addr_0, i2c_dev_config_reg_addr_port_1, 0);
         i2c1.writeByteSync(i2c_dev_addr_1, i2c_dev_config_reg_addr_port_0, 0);  
         i2c1.writeByteSync(i2c_dev_addr_1, i2c_dev_config_reg_addr_port_1, 0);
         console.log(`wrote configuration. all ports used as outputs`);
         startup_latch = 1;
      }

      i2c1.writeByteSync(i2c_dev_addr_0, i2c_dev_output_reg_addr_port_0, dev_0_data & 0xFF); //write out new data
      i2c1.writeByteSync(i2c_dev_addr_0, i2c_dev_output_reg_addr_port_1, (dev_0_data >> 8) & 0xFF);
      i2c1.writeByteSync(i2c_dev_addr_1, i2c_dev_output_reg_addr_port_0, dev_1_data & 0xFF);
         i2c1.writeByteSync(i2c_dev_addr_1, i2c_dev_output_reg_addr_port_1, (dev_1_data >> 8) & 0xFF);
            i2c1.closeSync();

   } catch (error) {
      
      console.error(error_str_internal_server_error, error);
   }finally {
        if (release) release(); // Ensure release is called if defined
   }

 }, 100);


/* use environmental variable PORT if assigned externally else use 3000*/
const port = process.env.PORT || 3000;

/*start server and use optional callback to signal start in console*/
// TODO: read ip address from wlan0 interface or ensure that static ip is configured else this might crash
app.listen(port, '192.168.0.133', ()=> console.log(`listening on port ${port}`));




