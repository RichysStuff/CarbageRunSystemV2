const express = require('express');
const app = express();
const bodyParser = require('body-parser');

/* ensure that request are in json format and that invalid request
 does not crash the server*/
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

const validStates = ['0', '1'];

const lights = {flasher_bar_front: '0',
		flasher_bar_back: '0',
                flasher_grill: '0',
                beacon_left: '0',
                beacon_right: '0',
                work_lights_front: '0',
                work_lights_back: '0'};

const horns = {thw_low_tone: '0',
	       thw_high_tone: '0',
               quadruple_horn: '0',
               melodie_horn_1: '0',
               melodie_horn_2: '0',
               melodie_horn_3: '0',
               melodie_horn_4: '0',
               melodie_horn_5: '0',
               melodie_horn_6: '0'};

const error_str_key_not_available = 'key is not available in config';
const error_str_value_field_not_included = 'value field is missing in request';
const response_str_update_successfull = 'value was successfully updated';


/* get request to root of website ,  callback with request and response*/
app.get('/', (req, res) => {
const message_json = {message: 'Hello World'};
res.statusCode = 200;
res.json(message_json);
});

/*loopback for debugging */
app.get('/api/loopback/:key', (req, res)=>{
res.statusCode = 200;
res.json({message: req.params.key});
});

/*get current configuration*/
app.get('/api/lights/getAll', (req, res) =>{
res.statusCode = 200;
res.json({message: lights});
})

/*get all available keys in lights Configuration*/
app.get('/api/lights/getKeys', (req, res) =>{
res.statusCode = 200;
res.json({message: Object.keys(lights)});
});

/*get value of light by key*/
app.get('/api/lights/getValue/:key', (req, res)=>{
if (lights.hasOwnProperty(req.params.key)){
   res.statusCode = 200; 
   res.json({message: lights[req.params.key]});
}else{
   res.statusCode = 404;
   res.json({message: error_str_key_not_available});
}

});

/*set new Value to single element*/
app.post('/api/lights/setValue/:key/', (req, res)=>{
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

});

/*get current configuration*/
app.get('/api/horns/getAll', (req, res) =>{
res.statusCode = 200;
res.json({message: horns});
})

/*get all available keys in horns Configuration*/
app.get('/api/horns/getKeys', (req, res) =>{
res.statusCode = 200;
res.json({message: Object.keys(horns)});
});

/*get value of horn by key*/
app.get('/api/horns/getValue/:key', (req, res)=>{
if (horns.hasOwnProperty(req.params.key)){
   res.statusCode = 200;
   res.json({message: horns[req.params.key]});
}else{
   res.statusCode = 404;
   res.json({message: error_str_key_not_available});
}

});

/*set new Value to single element*/
app.post('/api/horns/setValue/:key/', (req, res)=>{
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

});


/* replace hardcoded portnumber if environmental variable is assigned alse 3000*/
const port = process.env.PORT || 3000;

/*start server on port 3000 and use optional callback to signal start in console*/
app.listen(port, ()=> console.log(`listening on port ${port}`));
