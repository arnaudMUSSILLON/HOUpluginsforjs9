/*global $, JS9 */
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
PhotometryPlugin.SEARCH_SQUARE = 20;
PhotometryPlugin.STAR_RADIUS_MULT = 2;
PhotometryPlugin.SKY_RADIUS_MULT = 5;

//Init memory used by plugin
PhotometryPlugin.activeClick = false;

//Initialisation function of the plugin
PhotometryPlugin.init = function(){
    'use strict';
    //alert(this.div);
    PhotometryPlugin.activeClick = false;
    //PhotometryPlugin.div = this.div;
    PhotometryPlugin.tabDiv = document.createElement("div");
    PhotometryPlugin.txtDiv = document.createElement("div");
    $(this.div).empty();
    $(this.div).append(PhotometryPlugin.tabDiv)
    $(this.div).append(PhotometryPlugin.txtDiv)
    PhotometryPlugin.printInstructionText();
};

//Function to call each time plugin window is open
PhotometryPlugin.onPluginDisplay = function (){
    'use strict';
};

//Print an instruction message
PhotometryPlugin.printInstructionText = function(message, buttonsTxt){
    'use strict';
    var i, tableTxt;
    if(message===undefined){
        message="Click on the buttons below to begin photometry mesure";
    }if(buttonsTxt===undefined){
        buttonsTxt=["Auto add region","aaaaa"];
    }
    $(PhotometryPlugin.txtDiv).empty();
    $(PhotometryPlugin.txtDiv).append("<p>"+message+"</p>");
    tableTxt = "<table><td>";
    /*if(PhotometryPlugin.activeClick){
        $(PhotometryPlugin.div).append("<button type='button' onclick='PhotometryPlugin.onClickButton()'>Cancel</button>");
    }else{
        $(PhotometryPlugin.div).append("<button type='button' onclick='PhotometryPlugin.onClickButton()'>Photometry</button>");
    }*/
    for(i=0;i<buttonsTxt.length;i++){
        console.log("done")
        //$(PhotometryPlugin.txtDiv).append("<tr><button type='button' onclick='PhotometryPlugin.onClickButton()'>"+buttonsTxt[i]+"</button></tr>")
        tableTxt = tableTxt + "<tr><button type='button' onclick='PhotometryPlugin.onClickButton()'>"+buttonsTxt[i]+"</button></tr>";
        $(PhotometryPlugin.txtDiv).append("<button type='button' onclick='PhotometryPlugin.onClickButton()'>"+buttonsTxt[i]+"</button>");
    }
    //$(PhotometryPlugin.txtDiv).append(tableTxt+"</td></table>");
};

PhotometryPlugin.onClickButton = function(){
    if(JS9.GetImage()===null){
        PhotometryPlugin.activeClick = false;
        PhotometryPlugin.printInstructionText("An image must be loaded before performing photometry mesures");
        return;
    }
    if(PhotometryPlugin.activeClick){
        PhotometryPlugin.activeClick = false;
        PhotometryPlugin.printInstructionText();
    }else{
        PhotometryPlugin.activeClick = true;
        PhotometryPlugin.printInstructionText("Click on a star in the image to mesure photometry");
    }
    
};

PhotometryPlugin.onClickImage = function(im, ipos){
    var i, j, k, nb, val, maxX, maxY, maxVal, halfValRadius = 0;
    if(!PhotometryPlugin.activeClick){
        return;
    }
    PhotometryPlugin.activeClick = false;
    PhotometryPlugin.printInstructionText();//TODO remove
    maxX = ipos.x;
    maxY = ipos.y;
    maxVal = im.raw.data[maxY * im.raw.width + maxX]
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
    k=1;
    nb = 0;
    while(k<PhotometryPlugin.SEARCH_SQUARE && nb<3){
        nb = 0;
        for(i=-1;i<=1;i++){
            for(j=-1;j<=1;j++){
                if(i===0 || j===0){
                    var y = (k*j) + maxY;
                    var x = (k*i) + maxX;
                    val = im.raw.data[y * im.raw.width + x];
                    if(val<maxVal/2){
                        nb++;
                    }
                }
            }
        }
        if(nb<3){
            k++;
        }else{
            halfValRadius = k;
        }
    }
    JS9.AddRegions("annulus", {x:maxX,y:maxY,radii:[halfValRadius*PhotometryPlugin.STAR_RADIUS_MULT, halfValRadius*PhotometryPlugin.SKY_RADIUS_MULT]})
}

//function to call when a region is modified (created, resized, selected, deleted)
/*PhotometryPlugin.regionChange = function(im, xreg){
    'use strict';
};*/

//Register the plugin in JS9
JS9.RegisterPlugin(PhotometryPlugin.CLASS, PhotometryPlugin.NAME, PhotometryPlugin.init,
            {menu:"analysis",
            menuItem: "Photometry",
            /*onregionschange: PhotometryPlugin.regionChange,*/
            onplugindisplay: PhotometryPlugin.onPluginDisplay,
            onclick: PhotometryPlugin.onClickImage,
            /*onimagedisplay: PlotProfile.onImageDisplay,*/
            winTitle: "Plot Profile",
            winResize: true,
            winDims: [PhotometryPlugin.WIDTH, PhotometryPlugin.HEIGHT]});