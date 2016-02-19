var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

var cardgen = {
  merge: function(layout, db) {
    //var i, j, replace = {}, out = [];
    //// rewrite map as an object instead of array
    //for(i in map) {
    //  replace[map[i].key] = map[i].value;
    //}
    
    // break layout into objects and config, with replacements
    var objects = [];
    var canvas_prop;
    var row;
    
    // crunch layout csv into loopable object
    for(i in layout) {
      row = layout[i];
      if(row.type === "image") {
        objects.push(row);
      }
      else if(row.type  === "text") {
        objects.push(row);
      }
      else if(row.type.charAt(0)  === "_") {
        // safely ignore
      }
      else if(row.type  === "canvas") {
        // canvas properties
        canvas_prop = row;
      }
      else {
        throw "invalid layout type";
      }
    }
    
    if(!canvas_prop) throw "missing canvas properties";
    if(!objects.length) throw "no objects to generate image from";
    
    //console.log("layout");
    //console.log(layout);
    //console.log("db");
    //console.log(db);
    //console.log("layout");
    //console.log(layout);
    //console.log("canvas_prop");
    //console.log(canvas_prop);
    
    // loop through database to generate cards
    for(i in db) {
      try {
        var res = this.mergeOne(canvas_prop, objects, db[i]);
      }
      catch(e) {
        console.log("error:"+e);
      }
    }
    
  },
  numProp: function(value, item) {
    var num = parseFloat(value);
    if(!isNaN(num) && num == value) { // make sure it's a number, and it's the same as the string (ie, 40 == "40", but 40 != "40years")
      return num;
    }
    if(isNaN(num)) {
      num =  item[value];
      if(isNaN(num)) return null;
      return num;
    }
  },
  propSrcVal: function(prop, item) {
    if(prop.val) return props.val;
    if(!prop.source_header) throw "missing val or source_header for prop type "+prop.type;
    return item[prop.source_header];
  },
  exists: function(file) {
    var flag = true;
    try{
      fs.accessSync(file, fs.F_OK);
    }catch(e){
      flag = false;
    }
    return flag;
  },
  addImage: function(prop, item, ctx) {
    var graphic = new Image;
    graphic.src = this.propSrcVal(prop, item);
    if(!this.exists(graphic.src)) throw "missing image:"+graphic.src;
    
    var x = this.numProp(prop.posX, item);
    var y =  this.numProp(prop.posY, item);
    var width = this.numProp(prop.width, item);
    var height = this.numProp(prop.height, item);
    if(!x) x = 0;
    if(!y) y = 0;
    if(!width) width = graphic.width;
    if(!height) height = graphic.height;
    console.log("drawing "+graphic.src+" at "+x+","+y+"::"+width+","+height);
    ctx.drawImage(graphic, x, y, width, height);
  },
  addText: function(prop, item, ctx) {
    
  },
  mergeOne: function(canvas_prop, properties, item) {
    var canvasWidth = this.numProp(canvas_prop.width, item);
    var canvasHeight = this.numProp(canvas_prop.height, item);
    var canvas = new Canvas(canvasWidth, canvasHeight);
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = "source-over";

    var prop;
    for(var o in properties) {
      prop = properties[o];
      if(prop.type === "image") {
        this.addImage(prop, item, ctx);
      }
      else if(prop.type === "text") {
        this.addText(prop, item, ctx);
      }
    }
    
    var filename = item.filename;
    if(!filename) throw "missing filename";
    var outname = __dirname + "/" + item.filename;
    var out = fs.createWriteStream(outname)
      , stream = canvas.pngStream();

    stream.on('data', function(chunk){
      out.write(chunk);
    });

    stream.on('end', function(){
      console.log('saved png ' + outname);
    });

  },
  
};

module.exports = cardgen;