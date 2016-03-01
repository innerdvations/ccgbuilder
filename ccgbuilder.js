var Canvas = require('canvas');
var fs = require('fs');

// set up node-easel, including creating a global DOM for it
//var getWindow = require('nodejs-dom');
//getWindow(null, true);
require('node-easel');
var Stage = createjs.Stage;
var Shape = createjs.Shape;
var Graphics = createjs.Graphics;

var ccgbuilder = {
   // errorMode "break" skips saving of images with problems, "continue" generates and saves them best as possible even if there are errors, "delete" skips saving and also deletes existing file with the given item's filename
  errorMode: "break",
  layout_items:{},
  merge: function(layout, db) {
    // break layout into config and loopable object array
    var objects = [];
    var canvas_prop;
    var row;
    var id;
    var valid_types = ["image","text","bitmaptext","textbox","html","square","spritesheet","canvas"];
    
    for(i in layout) {
      row = layout[i];
      if(row.type.charAt(0)  === "_") {
        // safely ignore comment line
      }
      else if(row.type  === "canvas") {
        // canvas properties
        canvas_prop = row;
      }
      else if(valid_types.indexOf(row.type.trim().toLowerCase()) > -1) {
        objects.push(row);
      }
      else {
        throw "invalid layout type '"+row.type+"'";
      }
      
      // store them all for later lookup
      id = i;
      if(row.type === "canvas") id = "canvas";
      else if(row.id) id = row.id;
      
      this.layout_items[id] = row;
    }
    
    if(!canvas_prop) throw "missing canvas properties";
    if(!objects.length) throw "no objects to generate image from";
    
    // loop through database to generate cards
    for(i in db) {
      try {
        var res = this.mergeOne(canvas_prop, objects, db[i]);
      }
      catch(e) {
        throw e;
      }
    }
  },
  isBlankStr: function(str) {
    return typeof str === "string" && str.trim() === "";
  },
  propVal: function(field, item, prop, canvas, graphic, skipCalc) {
    var val = prop[field];
    
    // check if it's a special val
    if(this.isSpecialVal(val)) {
      if(skipCalc) return val;
      return this.calcSpecialVal(field, item, prop, canvas, graphic);
    }
    
    // check if it's a column header
    if(item.hasOwnProperty(val)) {
      return item[val];
    }
    
    // check if it's already just a simple numerical value and it's loosely equal
    // (ie, : "0" == 0 but "0 mana" != 0, so we'll catch that)
    var nval = Number(val);
    if(!isNaN(nval) && nval !== null && nval == val) {
      return val;
    }
    
    // if all that fails, it has to be considered just a string
    return val;
  },
  propNumVal: function(field, item, prop, canvas, graphic) {
    return Number(this.propVal(field, item, prop, canvas, graphic));
  },
  propBoolVal: function(field, item, prop, canvas, graphic) {
    if (!this.propVal(field, item, prop, canvas, graphic)) return false;
    if (this.propVal(field, item, prop, canvas, graphic) === "0") return false;
    if (this.propVal(field, item, prop, canvas, graphic) === 0) return false;
    if (this.propVal(field, item, prop, canvas, graphic) === "") return false;
    try {
      if (this.propVal(field, item, prop, canvas, graphic).trim() == "false") return false;
    } catch(e) {}
    
    return true;
  },
  isSpecialVal: function(val) {
    var specials = ["","center","right","left","top","bottom"];
    if(typeof val === "string") {
      
      var res = specials.indexOf(val.trim().toLowerCase()) > -1;
      return res;
    }
    return false;
  },
   // calcSpecialVal doesn't validate input, use isSpecialVal before calling
  calcSpecialVal: function(field, item, prop, canvas, metrics) {
    var val = prop[field].trim().toLowerCase();
    if(!metrics) metrics = {width:0,height:0};

    if(field === "x" || field === "offsetX") {
      if(val === "") return 0;
      if(val === "center") return canvas.width / 2; // half of canvas width
      if(val === "left") return 0;
      if(val === "right") return canvas.width;
      if(val === "height") return metrics.height;
      if(val === "width") return metrics.width;
    }
    else if(field === "y" || field === "offsetY") {
      if(val === "") return 0;
      if(val === "center") return canvas.height / 2; // half of canvas width
      if(val === "top") return 0;
      if(val === "bottom") return canvas.height;
      if(val === "height") return metrics.height;
      if(val === "width") return metrics.width;
    }
    
    // x, y, offsetX, and offsetX are all relative to canvas
    else if(field === "regX") {
      if(val === "") return 0;
      if(val === "center") return metrics.width / 2; // half of item width
      if(val === "left") return 0;
      if(val === "right") return metrics.width; // item width
    }
    else if(field === "regY") {
      if(val === "") return 0;
      if(val === "center") return metrics.height / 2; // half of item height
      if(val === "top") return 0;
      if(val === "bottom") return metrics.height; // item height
    }
    
    // the rest of the fields aren't calculated, but need sensible defaults for when left blank
    else if(field === "width") {
      if(val === "") return metrics.width;
    }
    else if(field === "height") {
      if(val === "") return metrics.height;
    }
    else if(field === "scaleX" || field === "scaleY") {
      if(val === "") return 1;
    }
    else if(field === "rotate") {
      if(val === "") return 0;
    }
    else if(field === "baseline") {
      // "top", "hanging", "middle", "alphabetic", "ideographic", or "bottom"
      if(val === "") return "bottom";
    }
    else if(field === "options" || field === "style") {
      if(val === "") return "";
    }
    else if(field === "lineHeight") {
      if(val === "") return null;
    }
    else if(field === "textAlign") {
      if(val === "") return null;
      return val;
    }
    else if(field === "font") {
      if(val === "") return "Impact";
    }
    else if(field === "size") {
      if(val === "") return "20";
    }
    else if(field === "color") {
      if(val === "") return "#000000";
    }
    else if(field === "optional") {
      if(val === "") return false;
    }
    else if(field === "val") {
      if(val === "") return "";
    }
    
    throw "Couldn't calculate special value '"+val+"' for "+field;
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
  // TODO
  addSquare: function(prop, item, canvas, stage) {
    var graphic = new createjs.Shape();
    var x = this.propNumVal("x", item, prop, canvas, graphic);
    var y =  this.propNumVal("y", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    graphic.graphics.beginFill("DeepSkyBlue").drawRect(0, 0, width, height);
    
    var regX = this.propNumVal("regX", item, prop, canvas, graphic);
    var regY =  this.propNumVal("regY", item, prop, canvas, graphic);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, graphic);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, graphic);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, graphic);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    var rotate = this.propNumVal("rotate", item, prop, canvas, graphic);
    
    graphic.x = x - regX;
    graphic.y = y - regY;
    stage.addChild(graphic);
  },
  addImage: function(prop, item, canvas, stage) {
    var graphic = new Canvas.Image;

    // check that val exists and if it's optional
    var val = this.propVal("val", item, prop, canvas, graphic);
    var optional = this.propBoolVal("optional", item, prop, canvas, graphic);
    if(val.trim() === "" || !val) {
      if(optional) return;
      throw "missing val for image";
    }

    graphic.src = val;
    if(!this.exists(graphic.src)) throw "missing image:"+graphic.src;
    
    var x = this.propNumVal("x", item, prop, canvas, graphic);
    var y =  this.propNumVal("y", item, prop, canvas, graphic);
    var regX = this.propNumVal("regX", item, prop, canvas, graphic);
    var regY =  this.propNumVal("regY", item, prop, canvas, graphic);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, graphic);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, graphic);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, graphic);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    var rotate = this.propNumVal("rotate", item, prop, canvas, graphic);
    
    var obj = new createjs.Bitmap(graphic);
    obj.regX = regX;
    obj.regY = regY;
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    obj.scaleY = scaleY * (height / graphic.height);
    obj.scaleX = scaleX * (width / graphic.width);

    stage.addChild(obj);
  },
  addBitmapText: function(prop, item, canvas, stage) {
    var metrics = {width:0,height:0};
    
    // check that val exists and if it's optional
    var val = this.propVal("val", item, prop, canvas, metrics);
    var optional = this.propBoolVal("optional", item, prop, canvas, metrics);
    if(val.trim() === "" || !val) {
      if(optional) return;
      throw "missing val for bitmaptext";
    }
    
    // load the associated spritesheet for this object
    var ss_id = this.propVal("font", item, prop, canvas, metrics);
    var spritesheet_row = this.layout_items[ss_id];
    if(!ss_id || !spritesheet_row) throw "invalid spritesheet id '"+ss_id+"'";
    
    // set up the spritesheet
    var ss_val = this.propVal("val", item, spritesheet_row, canvas, metrics);
    if(!ss_val) throw "missing val for spritesheet";
    var ss_width = this.propNumVal("width", item, spritesheet_row, canvas, metrics);
    if(!ss_width) throw "missing width for spritesheet";
    var ss_height = this.propNumVal("height", item, spritesheet_row, canvas, metrics);
    if(!ss_height) throw "missing height for spritesheet";
    metrics = {width:ss_width,height:ss_height};
    var ss_regX = this.propNumVal("regX", item, spritesheet_row, canvas, metrics);
    var ss_regY = this.propNumVal("regY", item, spritesheet_row, canvas, metrics);
    var ss_charmap = this.propVal("font", item, spritesheet_row, canvas, metrics);
    if(!ss_charmap) throw "missing spritesheet character map";
    
    // loop through charmap to create animations array for spritemap
    var animations = {};
    for(var i=0; i < ss_charmap.length; i++) {
      animations[ ss_charmap.charAt(i) ] = {frames:[i]};
    }
    
    var ss_graphic = new Canvas.Image;
    ss_graphic.src = ss_val;
    if(!this.exists(ss_graphic.src)) throw "missing spritesheet image:"+ss_graphic.src;
    
		var ss = new createjs.SpriteSheet({
				"images": [ss_graphic],
				"frames": {"regX": ss_regX, "height": ss_height, "regY": ss_regY, "width": ss_width},
        "animations":animations
			});
      
    var obj = new createjs.BitmapText(val, ss);
    
    // get position properties
    metrics = {width:obj.getTransformedBounds().width, height:obj.getTransformedBounds().height};
    var x = this.propNumVal("x", item, prop, canvas, metrics);
    var y =  this.propNumVal("y", item, prop, canvas, metrics);
    var regX = this.propNumVal("regX", item, prop, canvas, metrics);
    var regY =  this.propNumVal("regY", item, prop, canvas, metrics);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, metrics);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, metrics);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, metrics);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, metrics);
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var height = this.propNumVal("height", item, prop, canvas, metrics);
    var rotate = this.propNumVal("rotate", item, prop, canvas, metrics);
    
    obj.regX = regX;
    obj.regY = regY;
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    obj.scaleY = scaleY * (height / metrics.height);
    obj.scaleX = scaleX * (width / metrics.width);
    stage.addChild(obj);
    
  },
  addText: function(prop, item, canvas, stage) {
    var metrics = {width:0,height:0};
    
    // check that val exists and if it's optional
    var val = this.propVal("val", item, prop, canvas, metrics);
    var optional = this.propBoolVal("optional", item, prop, canvas, metrics);
    if(val.trim() === "" || !val) {
      if(optional) return;
      throw "missing val for text";
    }
    
    var font = this.propVal("font", item, prop, canvas, metrics);
    var size = this.propVal("size", item, prop, canvas, metrics);
    var style = this.propVal("style", item, prop, canvas, metrics);
    var color = this.propVal("color", item, prop, canvas, metrics);
    var baseline = this.propVal("baseline", item, prop, canvas, metrics);
    var optional = this.propNumVal("optional", item, prop, canvas, metrics);
    
    var obj = new createjs.Text(val, [style, size+"px", font].join(" "), color);
    obj.baseline = baseline;
    metrics = {width:obj.getTransformedBounds().width, height:obj.getTransformedBounds().height};
    
    var x = this.propNumVal("x", item, prop, canvas, metrics);
    var y =  this.propNumVal("y", item, prop, canvas, metrics);
    var regX = this.propNumVal("regX", item, prop, canvas, metrics);
    var regY =  this.propNumVal("regY", item, prop, canvas, metrics);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, metrics);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, metrics);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, metrics);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, metrics);
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var height = this.propNumVal("height", item, prop, canvas, metrics);
    var rotate = this.propNumVal("rotate", item, prop, canvas, metrics);
    //var options = this.propVal("options", item, prop, canvas, metrics).replace(/ /g, '').toLowerCase().split(",");
    
    if(val === null) throw "text not found";
    
    obj.regX = regX;
    obj.regY = regY;
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    obj.scaleY = scaleY * (height / metrics.height);
    obj.scaleX = scaleX * (width / metrics.width);

    stage.addChild(obj);
  },
  addTextbox: function(prop, item, canvas, stage) {
    var metrics = {width:0,height:0};
    
    // check that val exists and if it's optional
    var val = this.propVal("val", item, prop, canvas, metrics);
    var optional = this.propBoolVal("optional", item, prop, canvas, metrics);
    if(val.trim() === "" || !val) {
      if(optional) return;
      throw "missing val for textbox";
    }
    
    // get basic properties
    var font = this.propVal("font", item, prop, canvas, metrics);
    var size = this.propVal("size", item, prop, canvas, metrics);
    var style = this.propVal("style", item, prop, canvas, metrics);
    var color = this.propVal("color", item, prop, canvas, metrics);

    // create text object
    var obj = new createjs.Text(val, [style, size+"px", font].join(" "), color);
    
    // set line height
    var lineHeight = this.propNumVal("lineHeight", item, prop, canvas, metrics);
    if(lineHeight) obj.lineHeight = lineHeight;
    else obj.lineHeight = obj.getMeasuredLineHeight() * 1.2;  // default line height is hideous, sorry
    
    // text baseline
    var baseline = this.propVal("baseline", item, prop, canvas, metrics);
    obj.textBaseline = baseline;
    
    // width is required that so we can actually make it a wrappable box
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    if(!width) throw "missing width for textbox";
    
    // make the text wrap at width
    obj.lineWidth = width;
    
    var textAlign = this.propVal("textAlign", item, prop, canvas, metrics);
    obj.textAlign = textAlign;
    
    // get the measured height
    metrics = {width:width, height:obj.getTransformedBounds().height};
    
    // position and sizing properties
    var x = this.propNumVal("x", item, prop, canvas, metrics);
    var y =  this.propNumVal("y", item, prop, canvas, metrics);
    var regX = this.propNumVal("regX", item, prop, canvas, metrics);
    var preregX = this.propVal("regX", item, prop, canvas, metrics, true);
    var regY =  this.propNumVal("regY", item, prop, canvas, metrics);
    var preregY =  this.propVal("regY", item, prop, canvas, metrics, true);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, metrics);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, metrics);
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var rotate = this.propNumVal("rotate", item, prop, canvas, metrics);
    //var options = this.propVal("options", item, prop, canvas, metrics).replace(/ /g, '').toLowerCase().split(",");
    
    // text alignment right and center cause changes in regX calculation that we need to work around
    if(textAlign === "center") {
      if(preregX == "left") regX = -1 * width / 2;
      else if(preregX == "center") regX = 0;
      else if(preregX == "right") regX = width / 2;
    }
    if(textAlign === "right") {
      if(preregX == "left") regX = -1 * width;
      else if(preregX == "center") regX = -1 * width / 2;
      else if(preregX == "right") regX = 0;
    }
    
    obj.regX = regX;
    obj.regY = regY;
    
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    // Scale isn't used for textbox right now
    //var scaleX = this.propNumVal("scaleX", item, prop, canvas, metrics);
    //var scaleY =  this.propNumVal("scaleY", item, prop, canvas, metrics);
    //obj.scaleY = scaleY * (height / graphic.height);
    //obj.scaleX = scaleX * (width / graphic.width);

    //console.log("drawing textbox "+val+" at "+obj.x+","+obj.y);
    //console.log(JSON.stringify({x:x,y:y,regX:regX,regY:regY,offsetX:offsetX,offsetY:offsetY}));

    stage.addChild(obj);
  },
  hasOption: function(val, options) {
    if(typeof val === "string") {
      var res = options.indexOf(val.trim().toLowerCase()) > -1;
      return res;
    }
    return false;
  },
  mergeOne: function(canvas_prop, properties, item) {
    var o, prop, filename, pngstream, outstream;
    
    // create canvas
    var canvasWidth = this.propNumVal("width", item, canvas_prop);
    var canvasHeight = this.propNumVal("height", item, canvas_prop);
    if(!canvasWidth || !canvasHeight) throw "missing canvas dimensions";
    
    var canvas = new Canvas(canvasWidth, canvasHeight);

    var stage = new createjs.Stage(canvas);

    var sh = require("shelljs");
    var path = require('path');
    var cwd = sh.pwd();
    if(!item.filename) throw "missing filename";
    filename = path.resolve(cwd, item.filename);
    
    for(o in properties) {
      prop = properties[o];
      try {
        if(prop.type === "image") {
          this.addImage(prop, item, canvas, stage);
        }
        else if(prop.type === "text") {
          this.addText(prop, item, canvas, stage);
        }
        else if(prop.type === "textbox") {
          this.addTextbox(prop, item, canvas, stage);
        }
        else if(prop.type === "html") {
          this.addTextbox(prop, item, canvas, stage);
        }
        else if(prop.type === "bitmaptext") {
          this.addBitmapText(prop, item, canvas, stage);
        }
        else if(prop.type === "square") {
          this.addSquare(prop, item, canvas, stage);
        }
      }
      catch(e) { // we'll catch and keep going so we can generate
        if(this.errorMode === "continue") console.log("Error: "+e);
        else if(this.errorMode === "delete") {
          if(this.exists(filename)) fs.unlinkSync(filename);
          throw e;
        }
        else if(true || this.errorMode === "break") throw e; // default
      }
    }
    
    // draw everything from stage
    stage.update();
    
    outstream = fs.createWriteStream(filename)
    pngstream = canvas.pngStream();
    
    pngstream.on('data', function(chunk){
      outstream.write(chunk);
    });

    pngstream.on('end', function(){
      console.log('saved png ' + filename);
    });
  },
};

module.exports = ccgbuilder;