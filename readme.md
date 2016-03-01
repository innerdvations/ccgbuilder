# CSV Composite Graphic Builder for NodeJS

CCG Builder is a tool for using data from a spreadsheet or database to automatically generate a series of graphics.  For example, to produce the graphic assets needed to print a spreadsheet of cards from a collectible card game without having to manually build each individual card.

CCG Builder uses EaselJS which in turn *requires* the Cairo graphics library to be installed on your system.

*Currently very unstable and not feature complete* but most of the basic types are working well enough to use.

## Installation

Follow the instructions for installing Cairo on your system, then run `npm install https://github.com/innerdvations/ccgbuilder.git`


## Usage
There are two input objects required to build images.  A database or list of items that will be compiled (for example, data for each card in a game) and a layout which describes how to turn that data into a finalized image.  You will probably also have graphic assets (such as a standard card border, a unique piece of artwork for each card, icons, etc).

An example that uses nearly every feature can be found in the examples directory.

Here's an example which loads a file called "layout.csv" as the instruction and "items.csv" as the database.
````
var csv = require('csv');
var fs = require('fs');
var ccgbuilder = require('ccgbuilder');

// synchronous csv parsing to simplify things
function csvParseSync(csvData, options){
    var csvParser = new csv.parse(options);
    csvParser.write(csvData, true);
    var parsedData = [];
    var chunk;
    while(chunk = csvParser.read()){
        parsedData.push(chunk);
    }
    return parsedData;  
}

var layout = csvParseSync(fs.readFileSync(__dirname+'/layout.csv'), {columns:true});
var items = csvParseSync(fs.readFileSync(__dirname+'/items.csv'), {columns:true});

ccgbuilder.merge(layout, items);
````

## Layout

If using csv import, ensure that the document is consistent, valid csv, and error-free and contains exactly the headers listed below in layout properties/headers.

If you're passing in a JSON object of your own, make sure that it contains nothing but an array of objects with keys equal to the layout properties/headers listd below. For example:

````
[{filename:"red.png", cardtext:"this one is red", textcolor:"#FF0000"},
{filename:"blue.png", cardtext:"this one is blue", textcolor:"#0000FF"}]
````

Here is an example Google Spreadsheet that can be used as a starting point for your own data.

Any cell can be a) an empty field, b) a reserved term [center, left, right, top, bottom, width, height], c) a column header from the item document, d) a numeric value, or e) a string value, checked for and used in that order. None of the reserved terms should be used as column headers in your database document.


### Layout properties / headers
The following headers must be present in the layout document.

#### type
Must be one of the types listed below in 'Types'

#### val
The value to be used for this field.  If an image, this must resolve to a filename.  If text/textbox/html, this is the content that will be used.

#### x and y (two separate columns)
Blank defaults to 0.
The x/y values relative to the canvas.

#### width and height (two separate columns)
Image: Blank defaults to width/height of the source image
Text/Textbox/HTML: Blank defaults to the measured width/height of the text

The width/height of the item.
If specified for 'image' or 'text', the result will be stretched to this size.
If specified for 'textbox' width will be used as the bounding box dimensions, and text will wrap to stay within. Height will be ignored. (future version may allow hiding overflow or resizing text to make it fit)

#### scaleX and scaleY (two separate columns)
Blank defaults to 1.

Used to scale the image.  Scaling is done after other basic transformations (width/height/regX/regY).

Negative values can be used to flip/mirror image (such as -1), but since it is done after other transformations, you will likely need to flip your regX/regY or x/y positioning to get it to appear where intended.

#### regX and regY  (two separate columns)
Blank defaults to 0.

The offset for this display object's registration point. For example, to make a 100x100px image rotate or position from its center, you would set regX and regY to 50.

Generally if you're using a reserved keyword like "center" or "right" for your x or y coordinates, you will want to use the same keyword here.

#### offsetX and offsetY  (two separate columns)
Additional offsets that are added to x,y
 
Useful for padding or tweaking x/y coordinates that are using calculated positioning (ie, 'center' or 'right').

#### rotate
Blank defaults to 0.

The degrees of rotation to apply to the object.

Remember to use regX and regY to set the point around which to rotate.

#### color
Blank defaults to "#000000"
Only applies to text/textbox.

The color to be used for content.

#### textAlign
Blank defaults to EaselJS default (left).
Only applies to textbox.

The textAlignment to be used.

#### lineHeight
Blank defaults to EaselJS default (size below) * 1.2.
Only applies to textbox.

The lineHeight to be applied to the textbox content.

#### style
Blank defaults to "normal"
Only applies to text/textbox

The CSS font-style/font-variant/font-weight property. Use "italic" or "bold" or "bold italic".

#### size
Blank defaults to 20.

The font size in pixels.

#### font
Blank defaults to "Impact"

The font used.  Should work with any font your system has.

#### baseline
Blank defaults to EaselJS default.
Only applies to text/textbox.

The font baseline. Somewhat unreliable and untested.  Try changing it for tiny text positioning changes, but if it acts strange you're better off just leaving it default and tweaking the x/y offsets.

### optional
Blank is considered false.
Any other value is considered true.

When true, this object is optional and only appears if val is present.  In other words, suppress errors/warnings for missing 'val' on this field.


### Types

#### canvas
Every layout document requires exactly one row with type 'canvas' and values for 'width' and 'height'.  All other fields should be ignored, but leave them blank since they may be used in future versions.

This is the canvas used for the generated image.

Note that it can still be dynamic with a header lookup from the item database.  If every generated image needs to specify its own dimensions, that data can be stored in the database doc with headers 'cardwidth' and 'cardheight', and then this canvas row can have a width of 'cardwidth' and height of 'cardheight'.

#### image
An image resource to be loaded.  val should be either a filename (for an image common to all items, such as a card border or copyright notice) or the name of a header from the database doc.

#### text
A single line of text.  val should be either a header from the database doc, or a string value.  See layout properties for specifics.

#### textbox
Multiline text.  val should be either a header from the database doc, or a string value.  *Width is required*, height is currently ignored but should be left blank as it may be used in the future to enforce heights. See layout properties for specifics.

#### _comment
Any type that begins with underscore _ is completely ignored. Use it to store comments or values used with formulas in your spreadsheet.  For example, if you need 50 pixels of border padding to be applied to several items, you can put _borderpadding in type and 50 in val, and then use spreadsheet formulas (vlookup, sum) to grab that value as needed.

#### spriteSheet
Meta information for a spritesheet to be used in conjunction with bitmapText.
val should resolve to a filename for the spritesheet image to be used.
width and height are the values for an individual frame in your spritesheet.
regX and regY are the values to be used for an individual frame in your spritesheet
font should be the character map, a string of characters in the exact order as the frames of your spritesheet
Frames will be assigned indexes based on their position in the source images (left to right, top to bottom).

Calculated values such as top/left/center cannot be used in any of these fields and must be manually specified.

For example, given the spritesheet in examples/all/img/spritesheet.png
val should be 'img/spritesheet.png', width and height should be 20 since each character is 20x20 in the png, regX and regY should be 0 in order for any calculated positioning in bitmapText to work right, and font should be RGBUW which means that the letter R will be replaced by the first frame (ie, the first 20x20 block in the spritesheet), G will be replaced by the second, and so on.

Sprites of differing sizes are not supported at this time; all characters must have the exact same dimensions.

[See EaselJS spriteSheet for more info.](http://createjs.com/docs/easeljs/classes/SpriteSheet.html)
 
#### bitmaptext
Bitmap Text allows you to turn a text string into a sequence of images, such as having "3BU" become three icons in a row: a 3 symbol, black mana symbol, and blue mana symbol.

Font field should be the id of a spritesheet.

[See EaselJS bitmapText for more info.](http://createjs.com/docs/easeljs/classes/BitmapText.html)

#### square
Not fully implemented. Better to just load premade images.  Use at your own risk.

#### html
Not yet implemented. Will allow simple html in a textbox by converting html to svg and placing it on canvas.


## Database document / items

If using csv import, the database document must contain a header row with no blank or duplicate headers, and one column called 'filename' that contains the filename to use for that item for the final generated image.

You can put whatever data you want in the document, just ensure that it is consistent, valid csv, and error-free.

If you're passing in a JSON object of your own, make sure that it contains nothing but an array of objects with keys equal to headers. For example:

````
[{filename:"red.png", cardtext:"this one is red", textcolor:"#FF0000"},
{filename:"blue.png", cardtext:"this one is blue", textcolor:"#0000FF"}]
````


## Known bugs

* Calculated regX and regY values for text are not perfect and will probably need to be used in conjunction with offsets. We can eventually fix it for text with a given height/width, but difficult to fix for flexible width/height text.
