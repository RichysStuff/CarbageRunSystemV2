const express = require('express');
const cors = require('cors');
const { Mutex } = require('async-mutex');
// const I2C = require('i2c-bus');  Disable I2C functions until Hardware is build

const mutex = new Mutex();
// const i2c = I2C.openSync(1);
const app = express();
const bodyParser = require('body-parser');
app.use(cors());


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
app.get('/', (req, res) => {
const message_json = {message: 'Hello World'};
res.statusCode = 200;
res.json(message_json);
});

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

//runtime of System. This is used to update the peripheries (shift registers) over an I2C connection.
const intervalId = setInterval(async () => {

   /* prevent race conditions between this function and api calls*/
   try {
      const release = await mutex.acquire();
         
      /* create independant copies that are used to update the shift registers over I2C*/
      const lights_buffered = JSON.parse(JSON.stringify(lights));
      const horns_buffered = JSON.parse(JSON.stringify(horns));;
      
      release();

      // Update the I2C devices using the buffered objects
      // TODO: add I2C write command as soon as hardware side is build an register addresses are defined


   } catch (error) {
      if(release){
         release();
      }

      console.error(error_str_internal_server_error, error);
   }

 }, 100);


/* use environmental variable PORT if assigned externally else use 3000*/
const port = process.env.PORT || 3000;

/*start server and use optional callback to signal start in console*/
// TODO: read ip address from wlan0 interface or ensure that static ip is configured else this might crash
app.listen(port, '192.168.0.114', ()=> console.log(`listening on port ${port}`));



