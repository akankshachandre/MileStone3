var redis = require('redis')
var http = require("http");
var exec = require('child_process').exec;


var client = redis.createClient(6379, '127.0.0.1', {})
var http_proxy = require('http-proxy');

var servers;
var proxies = [];

var index = 0;

var selectServer = function(req, res) {
  if(index >= proxies.length-1)
    index = 0;
  else
    index = index + 1;

  return index;
};

var serverCallback = function(req, res) {
  console.log("request received");
  
  client.smembers("listservers",function(err,list){
    proxies = [];
    if(list.length>0)
      servers = list;
    for(var i=0; i<servers.length; i++){
      console.log(servers[i]);
      proxies.push( new http_proxy.createProxyServer({target: servers[i]}));
    }
    index = selectServer();
    var cmd = "echo server selected "+servers[index]+" >> out.txt";
    var child = exec(cmd, function (error, stdout, stderr) {
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });

    var proxy = proxies[index];
    proxy.web(req, res);
});
  

}

var server = http.createServer(serverCallback);
  server.listen(7000, function() {
    var host = this.address().address
    var port = this.address().port
    console.log('Proxy Server listening at http://%s:%s', host, port)
});




