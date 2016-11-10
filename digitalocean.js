var needle = require("needle");
var os   = require("os");
var sleep = require("sleep");
var fs = require("fs");
var sys = require('sys')
var exec = require('child_process').exec;

//var ec2 = new AWS.EC2({region: 'us-east-1'});


fs.writeFile('inventory','[servers]\n',function(err){
	if(err)
		console.log(err);
});

var private_key_pathDO = '/home/akanksha/.ssh/id_rsa';
//var private_key_pathAWS = '/home/akanksha/DevOps/HW1/my_key_pair.pem';

var config = {
	'token': process.env.DIGITAL_OCEAN_TOKEN,
	'ssh_key_id': process.env.DIGITAL_OCEAN_SSH_KEY_ID
};

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};


/*var params = {
	'ImageId': 'ami-d05e75b8',
    'InstanceType': 't2.micro',
	'MinCount':1,
	'MaxCount':1,
	'KeyName':'my_key_pair'
};*/


var droplet_id = 0;


writeToFile = function(inventory_entry){
	fs.appendFile('inventory',inventory_entry.ip+' ansible_connection=ssh ansible_ssh_user='+inventory_entry.user+' ansible_ssh_private_key_file='+inventory_entry.private_key+'\n',function(err){
	if(err)
		console.log(err);
	});
};


var client = {
	createDroplet: function (onResponse)
	{
		var data = 
		{
			"name": 'achand10-'+os.hostname(),
			"region":'nyc3',
			"size":"512mb",
			"image":'ubuntu-14-04-x64',
			"ssh_keys":[config.ssh_key_id],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Waiting for Digitalocean droplet to be created");
		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	},

	getDroplet : function(dropletId,onResponse){
		needle.get("https://api.digitalocean.com/v2/droplets/"+droplet_id,{headers:headers,json:true}, onResponse);

	}
};


client.createDroplet(function(err, resp, body)
{
	if(!err && resp.statusCode == 202)
	{
		droplet_id = body.droplet.id;
		console.log("Droplet was successfully created with id: "+droplet_id);
		sleep.sleep(60);
		client.getDroplet(droplet_id,function(err,response){
			if(response.body.droplet.status=='active'){
				var ip = response.body.droplet.networks.v4[0].ip_address;

				var inventory_entry1 = {
					'ip':ip,
					'user':'root',
					'private_key':private_key_pathDO
				}
				console.log("Writing entry to inventory file");
				writeToFile(inventory_entry1);
				
			}
		});
	}
});

















