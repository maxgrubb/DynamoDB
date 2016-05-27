var AWS = require("aws-sdk");
var fs = require('fs');
var express = require('express');
var grubbApp = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var request = require('request');
var bodyParser = require('body-parser');
var https = require('https');
grubbApp.use(bodyParser.urlencoded({ extended: false }));
grubbApp.use(bodyParser.json());
grubbApp.use(express.static('public'));
grubbApp.engine('handlebars', handlebars.engine);
grubbApp.set('view engine', 'handlebars');
grubbApp.set('port', 3002);

AWS.config.update({
        accessKeyId: "",
        secretAccessKey: "",
    region: "us-west-2",
});

var docClient = new AWS.DynamoDB.DocumentClient();

grubbApp.listen(grubbApp.get('port'), function(){
        console.log('Express started on your server on port ' + grubbApp.get('port') + '. Press Ctrl C to stop');
});

grubbApp.get('/',function(req,response,next){

        response.header('Access-Control-Allow-Origin', "*");
if(req.query.secondIndex != null){

        var kexpr = req.query.partKey + " = :";
        var q1 = ":"+req.query.partKey;
        var projexp = req.query.val + ", " + req.query.sortKey;
        var index = req.query.secondIndex;
        var params = {
                TableName: "Wine",
                IndexName: index,
                KeyConditionExpression: kexpr + "q1",
                    ExpressionAttributeValues: {
                     ":q1":req.query.partKeyVal
                    },
                    ProjectionExpression: projexp //"vineyard, yr"
};

docClient.query(params, function(err, data) {
    if (err){
        response.send(JSON.stringify(err, null, 2));
        }
   else{
        response.send(JSON.stringify(data, null, 2));
        }
});


}

else if (req.query.getAll == "true"){

var params = {
    TableName: "Wine"
};

docClient.scan(params, function(data, err) {
    if (err){
        response.send(JSON.stringify(err, null, 2));
        }
   else{
        response.send(JSON.stringify(data, null, 2));
        }
});

}

else if (req.query.vineyard != null) {

var table = "Wine";
var vineyard = req.query.vineyard;
var regn = req.query.regn;



var params = {
    TableName:table,
    Key:{
            "vineyard":vineyard,
            "regn": regn,
    }
};

console.log("getting item...");
docClient.get(params, function(err, data) {
    if (err){
        response.send(JSON.stringify(err, null, 2));
        }
   else{
        response.send(JSON.stringify(err, null, 2));
        }


 });

}

 });

grubbApp.put('/',function(req,response,next){
console.log(req.body.type);

var table = "Wine";
var vineyard = req.body.vineyard;
var type = req.body.type;
var regn = req.body.regn;
var yr = req.body.yr;
var price = req.body.price;

var counter = 0;
if(req.body.regn != null){

var params = {
    TableName:table,
    Key:{
        "vineyard": vineyard,
        "regn": regn
    },
        UpdateExpression: "set regn = :r",
        ExpressionAttributeValues:{
        ":r":regn
    },
        ReturnValues:"UPDATED_NEW"
};



console.log("Updating item...");
docClient.update(params, function(err, data) {
    if (err)
        counter++;

});
}

if(req.body.yr != null){

var params = {
    TableName:table,
    Key:{
        "vineyard": vineyard,
        "regn": regn
    },
        UpdateExpression: "set yr = :y ",
        ExpressionAttributeValues:{
        ":y":req.body.yr
    },
        ReturnValues:"UPDATED_NEW"
};



console.log("Updating item...");
docClient.update(params, function(err, data) {
if (err)
        counter++;

});
}

if(req.body.price != null){

var params = {
    TableName:table,
    Key:{
        "vineyard": vineyard,
        "regn": regn
    },
        UpdateExpression: "set price = :p",
        ExpressionAttributeValues:{
        ":p":price
    },
        ReturnValues:"UPDATED_NEW"
};

console.log("Updating item...");
docClient.update(params, function(err, data) {
    if (err)
        counter++;



});
}


        response.send("Item added");

});

grubbApp.post('/',function(req,response,next){

response.header('Access-Control-Allow-Origin', "*");
if(req.body.secondIndex != null){
var dynamodb = new AWS.DynamoDB();
console.log("adding second index");

var iname = req.body.secondIndex;
var aname1 = req.body.attr1;
var aname2 = req.body.attr2;

var params = {
    TableName: "Wine",
    AttributeDefinitions:[
        {AttributeName: aname1, AttributeType: "S"},
        {AttributeName: aname2, AttributeType: "S"}
    ],
    GlobalSecondaryIndexUpdates: [
        {
            Create: {
                IndexName: iname,
                KeySchema: [
                    {AttributeName: aname1, KeyType: "HASH"},  //Partition key
                    {AttributeName: aname2, KeyType: "RANGE"},  //Sort key
                ],
                Projection: {
                    "ProjectionType": "ALL"
                },
             ProvisionedThroughput: {
                    "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
                }
            }
        }
    ]
};

dynamodb.updateTable(params, function(err, data) {
    if (err){
        console.log(JSON.stringify(err, null, 2));
        response.send(data);
   }
         else{
        console.log(JSON.stringify(data, null, 2));
        response.send(data);
        }
});
}
else{

var table = "Wine";

var vineyard = req.body.vineyard;
var type = req.body.type;
var regn = req.body.regn;
var yr = req.body.yr;
var price = req.body.price;

console.log(req.body);

var params = {
    TableName:table,
    Item:{
        "vineyard": vineyard,
        "type": type,
        "regn": regn,
        "yr": yr,
        "price": price
        }
};

console.log("Adding a new item...");
docClient.put(params, function(err, data) {
    if (err) {
        response.send(err);
    } else {
        response.send("Success! Item has been added");
    }
});
}

});




grubbApp.delete('/',function(request,response,next){

var table = "Wine";

var vineyard = request.body.vineyard;
var regn = request.body.regn;

var params = {
    TableName:table,
    Key:{
        "vineyard": vineyard,
        "regn": regn
    }
};

docClient.delete(params, function(err, data) {

        console.log("deleting item");
    if (err) {
        response.send("Unable to delete item. Error JSON:" + JSON.stringify(err, null, 2));
    } else {
        response.send("Deleted item:" + JSON.stringify(data, null, 2));
    }
});


});

