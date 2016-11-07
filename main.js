var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()

var client = redis.createClient(6379, '127.0.0.1', {})

var server = app.listen(3000, function () {
	var host = server.address().address
	var port = server.address().port
	var server_entry = "http://"+host+":"+port;
	client.sadd("listservers",server_entry);
	console.log('Example app listening at http://%s:%s', host, port)
});


app.use(function(req, res, next) {	
	var url = req.url;
	console.log(url);
	client.lpush("mylist",url);
	next();
});

app.get('/', function(req, res) {
	res.send('hello world');
});

app.get('/set', function(req, res) {
	console.log("Setting key value");
	client.set("key", "this value will destruct in 10 seconds");
	client.expire("key",10);
	res.send('key set to expire in 10 seconds');
});

app.get('/get', function(req, res) {
	client.get("key", function(err,value){
		if(value)
			res.send(value);
		else
			res.send('key has expired');
	});
  
});

app.get('/recent',function(req,res){
	client.lrange("mylist",0,5,function(err,list){
		console.log(list);
		res.send(list);
	});
});



app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
        	var img = new Buffer(data).toString('base64');
        	client.lpush('images', img)
		});
	}
   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
  {
    res.writeHead(200, {
      'content-type': 'text/html'
    });
    client.lpop('images', function(err, val) {
      if (err) throw err;
      if (val) {
        res.write("<h1>\n<img src='data:my_pic.jpg;base64," + val + "'/>");
      } else {
        res.write("No new image to display")
      }
      res.end();
    })
  }
});

app.get('/spawn',function(req,res){
	var port = Math.round(Math.random() * (4000 - 3000) + 3000);

	var server = app.listen(port, function () {

		var host = server.address().address
		var port = server.address().port
		var server_entry = "http://"+host+":"+port;
		client.sadd("listservers",server_entry);
	    console.log('Example app listening at http://%s:%s', host, port);
	    var message = 'Example app listening at: '+host+":"+port;
	    res.status(200).send(message);

	});
});

app.get('/listservers',function(req,res){
	client.llen("listservers",function(err,len){
		client.smembers("listservers",function(err,list){
			var message = "Number of servers currently running are: " + list.length;
			if(list.length>0){
				message = message + "<br> Servers running are: <br>"
				list.forEach(function(server_entry){
					message = message+"<li>"+server_entry+"</li>"+"<br>";
				});
				res.status(200).send(message);
			}
		});
	});
});

app.get('/destroy',function(req,res){
	client.spop("listservers",function(err,server_entry){
		if(server_entry){
			var message = "Server "+server_entry+" was destroyed";
			res.status(200).send(message);
		}
	});
});
