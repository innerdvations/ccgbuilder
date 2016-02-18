var csv = require('csv');
var parser = csv.parse();


var Canvas = require('canvas')
  , Image = Canvas.Image
  , canvas = new Canvas(600, 1125)
  , ctx = canvas.getContext('2d');

ctx.globalCompositeOperation = "source-over";

var vals = {
  top: 110,
  left:110,
  middle:200,
  right:302,
  bottom:600,
  height:350,
  width:125,
}

var formats = {
  "single":{
    out: "color";
    objects: [
      {type:"img",source:"color",pos:["middle","top"],resize:[width,height*2+50]},
      {type:"text",val:"single color card",font:"20px Impact",color:"#FF0000",pos:[110+vals.height,"top"]},
    ]
  },
  "double":{},
};

var img = new Image;
img.src = "img/red.png";
ctx.drawImage(img, vals.left,vals. top, vals.width, vals.height);

img.src = "img/orange.png";
ctx.drawImage(img, vals.right, vals.top, vals.width, vals.height);

img.src = "img/yellow.png";
ctx.drawImage(img, vals.left, vals.bottom, vals.width, vals.height);

//ctx.font = '30px Impact';
//ctx.rotate(.1);
//ctx.fillText("Awesome!", 50, 100);

//var te = ctx.measureText('Awesome!');
//ctx.strokeStyle = 'rgba(0,0,0,0.5)';
//ctx.beginPath();
//ctx.lineTo(50, 102);
//ctx.lineTo(50 + te.width, 102);
//ctx.stroke();

var fs = require('fs')
  , out = fs.createWriteStream(__dirname + '/out/out.png')
  , stream = canvas.pngStream();

stream.on('data', function(chunk){
  out.write(chunk);
});

stream.on('end', function(){
  console.log('saved png');
});