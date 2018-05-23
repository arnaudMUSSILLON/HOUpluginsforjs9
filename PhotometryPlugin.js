/*global $, JS9, document */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var PhotometryPlugin;
// create namespace, and specify some meta-information and params
PhotometryPlugin = {};
PhotometryPlugin.CLASS = "HandsOnUniverse";
PhotometryPlugin.NAME = "Photometry";
PhotometryPlugin.WIDTH =  600;
PhotometryPlugin.HEIGHT = 400;

//constants used by plugin
PhotometryPlugin.SEARCH_SQUARE = 10;
PhotometryPlugin.STAR_RADIUS_MULT = 2;
PhotometryPlugin.SKY_RADIUS_MULT = 5;

//Init memory used by plugin
PhotometryPlugin.action = "";
PhotometryPlugin.regions = [];
PhotometryPlugin.photometry = [];

//Initialisation function of the plugin
PhotometryPlugin.init = function(){
    'use strict';
    PhotometryPlugin.regions = [];
    PhotometryPlugin.photometry = [];
    PhotometryPlugin.reinit(this.div);
};

//Common procedure to init and onPluginDisplay
PhotometryPlugin.reinit = function(div){
    'use strict';
    PhotometryPlugin.action = "";
    PhotometryPlugin.tabDiv = document.createElement("div");
    PhotometryPlugin.txtDiv = document.createElement("div");
    $(div).empty();
    $(div).append(PhotometryPlugin.tabDiv);
    $(div).append(PhotometryPlugin.txtDiv);
    PhotometryPlugin.printInstructionText();
};

//Function to call each time plugin window is open
PhotometryPlugin.onPluginDisplay = function (){
    'use strict';
    var i, j, regions, newRegionTab = [];
    regions = JS9.GetRegions();
    if(regions!==null){
        for(i=0;i<PhotometryPlugin.regions.length;i++){
            for(j=0;j<regions.length;j++){
                if(PhotometryPlugin.regions[i]===regions[j].id){
                    newRegionTab.push(PhotometryPlugin.regions[i]);
                }
            }
        }
    }
    PhotometryPlugin.regions = newRegionTab;
    PhotometryPlugin.reinit(this.div);
};

//Print an instruction message
PhotometryPlugin.printInstructionText = function(message, buttonsTxt){
    'use strict';
    var i;
    if(message===undefined){
        message="Click on the buttons below to begin photometry mesure";
    }if(buttonsTxt===undefined){
        buttonsTxt=["Auto add region","Use region"];
    }
    $(PhotometryPlugin.txtDiv).empty();
    $(PhotometryPlugin.txtDiv).append("<p>"+message+"</p>");
    for(i=0;i<buttonsTxt.length;i++){
        $(PhotometryPlugin.txtDiv).append("<button type='button' onclick='PhotometryPlugin.onClickButton(\""+buttonsTxt[i]+"\")'>"+buttonsTxt[i]+"</button>");
    }
};

PhotometryPlugin.onClickButton = function(button){
    'use strict';
    if(JS9.GetImage()===null){
        PhotometryPlugin.activeClick = false;
        PhotometryPlugin.printInstructionText("An image must be loaded before performing photometry mesures");
        return;
    }
    if(button==="Auto add region"){
        PhotometryPlugin.printInstructionText("Click on a star in the image to mesure photometry",["Cancel"]);
        PhotometryPlugin.action = button;
    }if(button==="Cancel"){
        PhotometryPlugin.action = "";
        PhotometryPlugin.printInstructionText();
    }if(button==="Use region"){
        PhotometryPlugin.printInstructionText("Click on an anulus region to mesure photometry",["Cancel"]);
        PhotometryPlugin.action = button;
    }
};

PhotometryPlugin.onClickImage = function(im, ipos){
    'use strict';
    var i, j, id, nb, val, maxX, maxY, cX, cY, maxVal, hvp, halfValRadius, hvrX, hvrY;
    if(PhotometryPlugin.action!=="Auto add region"){
        return;
    }
    PhotometryPlugin.action = "";
    PhotometryPlugin.printInstructionText();
    maxX = ipos.x;
    maxY = ipos.y;
    maxVal = im.raw.data[maxY * im.raw.width + maxX];
    for(i=ipos.x-PhotometryPlugin.SEARCH_SQUARE;i<ipos.x+PhotometryPlugin.SEARCH_SQUARE;i++){
        for(j=ipos.y-PhotometryPlugin.SEARCH_SQUARE;j<ipos.y+PhotometryPlugin.SEARCH_SQUARE;j++){
            if(i>0 && i<im.raw.width && j>0 && j<im.raw.height){
                val = im.raw.data[j * im.raw.width + i];
                if(val>maxVal){
                    maxVal = val;
                    maxX = i;
                    maxY = j;
                }
            }
        }
    }
    i = 1;
    nb = 0;
    hvp = [undefined, undefined, undefined, undefined];
    while(i<PhotometryPlugin.SEARCH_SQUARE*2 && nb<4){
        if(im.raw.data[(maxY-i)*im.raw.width+maxX]<maxVal/2 && hvp[0]===undefined){
            hvp[0]=i;
            nb++;
        }if(im.raw.data[(maxY+i)*im.raw.width+maxX]<maxVal/2 && hvp[1]===undefined){
            hvp[1]=i-1;
            nb++;
        }if(im.raw.data[maxY*im.raw.width+(maxX-i)]<maxVal/2 && hvp[2]===undefined){
            hvp[2]=i;
            nb++;
        }if(im.raw.data[maxY*im.raw.width+(maxX+i)]<maxVal/2 && hvp[3]===undefined){
            hvp[3]=i-1;
            nb++;
        }
        i++;
    }
    if(nb===4){
        hvrY = (hvp[0] + hvp[1])/2;
        hvrX = (hvp[2] + hvp[3])/2;
        cY = maxY-hvp[0]+hvrY;
        cX = maxX-hvp[2]+hvrX;
        halfValRadius = (hvrX+hvrY)/2;
    }
    if(halfValRadius!==0){
        id = JS9.AddRegions("annulus", {x:cX,y:cY,radii:[halfValRadius*PhotometryPlugin.STAR_RADIUS_MULT, halfValRadius*PhotometryPlugin.SKY_RADIUS_MULT]});
        PhotometryPlugin.regions.push(id);
    }
};

//function to call when a region is modified (created, resized, selected, deleted)
PhotometryPlugin.regionChange = function(im, xreg){
    'use strict';
    var i, mode;
    if(xreg.shape!=="annulus"){
        return;
    }
    mode = xreg.mode;
    if(mode==="remove" || xreg.radii.length!==2){
        for(i=0;i<PhotometryPlugin.regions.length;i++){
            if(PhotometryPlugin.regions[i]===xreg.id){
                PhotometryPlugin.regions.splice(i,1);
                i--;
            }
        }
    }
};

//Register the plugin in JS9
JS9.RegisterPlugin(PhotometryPlugin.CLASS, PhotometryPlugin.NAME, PhotometryPlugin.init,
            {menu:"analysis",
            menuItem: "Photometry",
            onregionschange: PhotometryPlugin.regionChange,
            onplugindisplay: PhotometryPlugin.onPluginDisplay,
            onclick: PhotometryPlugin.onClickImage,
            /*onimagedisplay: PlotProfile.onImageDisplay,*/
            winTitle: "Plot Profile",
            winResize: true,
            winDims: [PhotometryPlugin.WIDTH, PhotometryPlugin.HEIGHT]});