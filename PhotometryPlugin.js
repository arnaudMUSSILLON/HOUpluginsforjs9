/*global $, JS9, document */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var PhotometryPlugin;
// create namespace, and specify some meta-information and params
PhotometryPlugin = {};
PhotometryPlugin.CLASS = "HandsOnUniverse";
PhotometryPlugin.NAME = "Photometry";
PhotometryPlugin.WIDTH =  650;
PhotometryPlugin.HEIGHT = 400;

//constants used by plugin
PhotometryPlugin.SEARCH_SQUARE = 20;
PhotometryPlugin.STAR_RADIUS_MULT = 3;
PhotometryPlugin.MIN_SKY_RADIUS_MULT = 8;
PhotometryPlugin.MAX_SKY_RADIUS_MULT = 10;

//Init memory used by plugin
PhotometryPlugin.action = "";
PhotometryPlugin.photometry = [];
PhotometryPlugin.mainRegion = -1;
PhotometryPlugin.changeLock = false;

//Initialisation function of the plugin
PhotometryPlugin.init = function(){
    'use strict';
    var head = document.getElementsByTagName('head')[0];
    $(head).append("<style> .PhotometryPluginSlider { width: 98%; } </style>");
    PhotometryPlugin.photometry = [];
    PhotometryPlugin.reinit(this.div);
};

//Common procedure to init and onPluginDisplay
PhotometryPlugin.reinit = function(div){
    'use strict';
    PhotometryPlugin.action = "";
    PhotometryPlugin.changeLock = false;
    PhotometryPlugin.tabDiv = document.createElement("DIV");
    PhotometryPlugin.txtDiv = document.createElement("DIV");
    PhotometryPlugin.sliderDiv = document.createElement("DIV");
    $(div).empty();
    $(div).append(PhotometryPlugin.tabDiv);
    $(div).append(PhotometryPlugin.txtDiv);
    $(div).append(PhotometryPlugin.sliderDiv);
    PhotometryPlugin.printInstructionText();
    PhotometryPlugin.printTab();
};

PhotometryPlugin.createSliderDiv = function(min, max, sl1, sl2){
    'use strict';
    $(PhotometryPlugin.sliderDiv).empty();
    if(min===undefined){
        return;
    }
    PhotometryPlugin.slider1 = document.createElement("INPUT");
    PhotometryPlugin.slider1.setAttribute("type","range");
    PhotometryPlugin.slider1.setAttribute("min",min);
    PhotometryPlugin.slider1.setAttribute("max",max);
    PhotometryPlugin.slider1.setAttribute("value",sl1);
    PhotometryPlugin.slider1.setAttribute("step","0.1");
    PhotometryPlugin.slider1.setAttribute("class","PhotometryPluginSlider");
    PhotometryPlugin.slider1.setAttribute("id","PhotometryPluginSlider1");
    PhotometryPlugin.slider1.setAttribute("onchange","PhotometryPlugin.onSliderChange(this,0)");
    PhotometryPlugin.slider1.setAttribute("oninput","PhotometryPlugin.onSliderMove(this,0)");
    PhotometryPlugin.slider1.onchange = PhotometryPlugin.onSliderChange;
    PhotometryPlugin.slider2 = document.createElement("INPUT");
    PhotometryPlugin.slider2.setAttribute("type","range");
    PhotometryPlugin.slider2.setAttribute("min",min);
    PhotometryPlugin.slider2.setAttribute("max",max);
    PhotometryPlugin.slider2.setAttribute("value",sl2);
    PhotometryPlugin.slider2.setAttribute("step","0.1");
    PhotometryPlugin.slider2.setAttribute("class","PhotometryPluginSlider");
    PhotometryPlugin.slider2.setAttribute("id","PhotometryPluginSlider2");
    PhotometryPlugin.slider2.setAttribute("onchange","PhotometryPlugin.onSliderChange(this,1)");
    PhotometryPlugin.slider2.setAttribute("oninput","PhotometryPlugin.onSliderMove(this,1)");
    $(PhotometryPlugin.sliderDiv).append(PhotometryPlugin.slider1);
    $(PhotometryPlugin.sliderDiv).append("<br>");
    $(PhotometryPlugin.sliderDiv).append(PhotometryPlugin.slider2);
};

//Function to call each time plugin window is open
PhotometryPlugin.onPluginDisplay = function (){
    'use strict';
    PhotometryPlugin.photometry = [];
    PhotometryPlugin.reinit(this.div);
};

PhotometryPlugin.onSliderMove = function(slider,nb){
    'use strict';
    var regs, xreg;
    if(nb===0 && parseInt(slider.value,10)>parseInt(PhotometryPlugin.slider2.value,10)){
        PhotometryPlugin.slider2.value = slider.value;
    }if(nb===1 && parseInt(slider.value,10)<parseInt(PhotometryPlugin.slider1.value,10)){
        PhotometryPlugin.slider1.value = slider.value;
    }
    if(PhotometryPlugin.mainRegion===-1){
        return;
    }
    PhotometryPlugin.changeLock = true;
    regs = JS9.GetRegions(PhotometryPlugin.mainRegion);
    if(regs!==null && regs!==undefined && regs.length!==0){
        xreg = regs[0];
        if(xreg.radii.length===3){
            JS9.ChangeRegions(PhotometryPlugin.mainRegion,{radii:[PhotometryPlugin.slider1.value,PhotometryPlugin.slider2.value,xreg.radii[2]]});
        }
    }
    PhotometryPlugin.changeLock = false;
};

PhotometryPlugin.onSliderChange = function(){
    'use strict';
    var regs, xreg, im;
    
    if(PhotometryPlugin.mainRegion===-1){
        return;
    }
    regs = JS9.GetRegions(PhotometryPlugin.mainRegion);
    im = JS9.GetImage();
    if(regs===null || regs===undefined || im===null || im===undefined){
        return;
    }
    xreg = regs[0];
    
    PhotometryPlugin.calculatePhotometry(im,xreg);
    PhotometryPlugin.printTab();
};

PhotometryPlugin.changeMainRegion = function(xreg){
    'use strict';
    if(xreg===undefined || xreg.shape!== "annulus" || xreg.radii.length!==3){
        PhotometryPlugin.mainRegion = -1;
        PhotometryPlugin.createSliderDiv();
    }else{
        PhotometryPlugin.mainRegion = xreg.id;
        PhotometryPlugin.createSliderDiv(0,xreg.radii[2],xreg.radii[0],xreg.radii[1]);
    }
    
};

//Print an instruction message
PhotometryPlugin.printInstructionText = function(message, buttonsTxt){
    'use strict';
    var i;
    if(message===undefined){
        message="Click on the buttons below to begin photometry mesure";
    }if(buttonsTxt===undefined){
        buttonsTxt=["Auto photometry", "New annulus region", "Use annulus region"];
    }
    $(PhotometryPlugin.txtDiv).empty();
    $(PhotometryPlugin.txtDiv).append("<p>"+message+"</p>");
    for(i=0;i<buttonsTxt.length;i++){
        $(PhotometryPlugin.txtDiv).append("<button type='button' onclick='PhotometryPlugin.onClickButton(\""+buttonsTxt[i]+"\")'>"+buttonsTxt[i]+"</button>");
    }
};

PhotometryPlugin.printTab = function(){
    'use strict';
    var i, table, rphoto, td;
    td = "<td align='center'>";
    table = document.createElement("TABLE");
    $(table).append("<tr><th>Star Brightness</th><th>Sky Brightness</th><th>Sky Median</th><th>Number of pixels</th><th>RMS</th><tr>");
    for(i=0;i<PhotometryPlugin.photometry.length;i++){
        rphoto = PhotometryPlugin.photometry[i];
        if(rphoto!==null && rphoto!==undefined){
            $(table).append("<tr>"+td+rphoto.starSum+"</td>"+td+rphoto.skyVal+"</td>"+td+rphoto.skyMed+"</td>"+td+rphoto.starNb+"</td>"+td+rphoto.rms+"</td></tr>");
        }
    }
    $(PhotometryPlugin.tabDiv).empty();
    $(PhotometryPlugin.tabDiv).append(table);
};

PhotometryPlugin.onClickButton = function(button){
    'use strict';
    if(JS9.GetImage()===null){
        PhotometryPlugin.printInstructionText("An image must be loaded before performing photometry mesures");
        return;
    }
    if(button==="Auto photometry"){
        PhotometryPlugin.action = button;
        PhotometryPlugin.printInstructionText("Click on a star in the image to mesure photometry",["Cancel"]);
    }if(button==="Cancel"){
        PhotometryPlugin.action = "";
        PhotometryPlugin.printInstructionText();
    }if(button==="New annulus region"){
        PhotometryPlugin.action = "";
        JS9.AddRegions("annulus", {radii:[PhotometryPlugin.STAR_RADIUS_MULT, PhotometryPlugin.MIN_SKY_RADIUS_MULT, PhotometryPlugin.MAX_SKY_RADIUS_MULT]});
    }if(button==="Use annulus region"){
        PhotometryPlugin.action = button;
        PhotometryPlugin.printInstructionText("Click on a annulus region with 3 circles to use it",["Cancel"]);
    }
};

PhotometryPlugin.onClickImage = function(im, ipos){
    'use strict';
    var i, j, nb, val, maxX, maxY, cX, cY, maxVal, hvp, halfValRadius, hvrX, hvrY, a, b;
    if(PhotometryPlugin.action!=="Auto photometry"){
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
            a = -(im.raw.data[(maxY-i)*im.raw.width+maxX]-im.raw.data[(maxY-i+1)*im.raw.width+maxX]);
            b = im.raw.data[(maxY-i)*im.raw.width+maxX] + a*i;
            hvp[0]=-(maxVal/2 - b)/a;
            nb++;
        }if(im.raw.data[(maxY+i)*im.raw.width+maxX]<maxVal/2 && hvp[1]===undefined){
            a = im.raw.data[(maxY+i)*im.raw.width+maxX]-im.raw.data[(maxY+i-1)*im.raw.width+maxX];
            b = im.raw.data[(maxY+i)*im.raw.width+maxX] - a*i;
            hvp[1]=(maxVal/2 - b)/a;
            nb++;
        }if(im.raw.data[maxY*im.raw.width+(maxX-i)]<maxVal/2 && hvp[2]===undefined){
            a = -(im.raw.data[maxY*im.raw.width+(maxX-i)]-im.raw.data[maxY*im.raw.width+(maxX-i+1)]);
            b = im.raw.data[maxY*im.raw.width+(maxX-i)] + a*i;
            hvp[2]=-(maxVal/2 - b)/a;
            nb++;
        }if(im.raw.data[maxY*im.raw.width+(maxX+i)]<maxVal/2 && hvp[3]===undefined){
            a = im.raw.data[maxY*im.raw.width+(maxX+i)]-im.raw.data[maxY*im.raw.width+(maxX+i-1)];
            b = im.raw.data[maxY*im.raw.width+(maxX+i)] - a*i;
            hvp[3]=(maxVal/2 - b)/a;
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
        JS9.AddRegions("annulus", {x:cX,y:cY,radii:[halfValRadius*PhotometryPlugin.STAR_RADIUS_MULT, halfValRadius*PhotometryPlugin.MIN_SKY_RADIUS_MULT, halfValRadius*PhotometryPlugin.MAX_SKY_RADIUS_MULT]});
    }
};

PhotometryPlugin.regionChange = function(im, xreg){
    'use strict';
    var mode;
    if(PhotometryPlugin.changeLock || xreg.shape!=="annulus"){
        return;
    }
    mode = xreg.mode;
    if(mode==="remove" || xreg.radii.length!==3){
        PhotometryPlugin.photometry[xreg.id]=null;
        PhotometryPlugin.printTab();
        PhotometryPlugin.changeMainRegion();
        return;
    }if(mode==="select" && xreg.radii.length===3){
        PhotometryPlugin.changeMainRegion(xreg);
        if(PhotometryPlugin.action!=="Use annulus region"){
            return;
        }else{
            PhotometryPlugin.action = "";
            PhotometryPlugin.printInstructionText();
        }
    }
    if(xreg.radii.length===3){
        PhotometryPlugin.changeMainRegion(xreg);
        PhotometryPlugin.calculatePhotometry(im,xreg);
    }
    PhotometryPlugin.printTab();
};

PhotometryPlugin.calculatePhotometry = function(im, xreg){
    'use strict';
    var res = {}, i, j, c = {}, maxRadius=0;
    if(xreg.shape!=="annulus" || xreg.radii.length!==3){
        return;
    }
    res.skyPix = [];
    res.starSum = 0;
    res.starNb = 0;
    c.x = Math.floor(xreg.x);
    c.y = Math.floor(xreg.y);
    for(i=0;i<xreg.radii.length;i++){
        if(xreg.radii[i]>maxRadius){
            maxRadius = xreg.radii[i];
        }
    }
    for(i=Math.floor(-maxRadius-1); i<Math.floor(maxRadius+2); i++){
        for(j=Math.floor(-maxRadius-1); j<Math.floor(maxRadius+2); j++){
            if(i*i+j*j>=xreg.radii[1]*xreg.radii[1] && i*i+j*j<=xreg.radii[2]*xreg.radii[2]){
                res.skyPix.push(im.raw.data[(c.y+j)*im.raw.width+(c.x+i)]);
            }if(i*i+j*j<=xreg.radii[0]*xreg.radii[0]){
                res.starSum += im.raw.data[(c.y+j)*im.raw.width+(c.x+i)];
                res.starNb++;
            }
        }
    }
    res.skyMed = PhotometryPlugin.median(res.skyPix);
    res.rms = 0;
    for(i=0;i<res.skyPix.length;i++){
        //tab.push()
        res.rms += (res.skyPix[i] - res.skyMed)*(res.skyPix[i] - res.skyMed);
    }
    res.rms = Math.sqrt(res.rms/res.skyPix.length);
    res.skyVal = res.skyMed * res.starNb;
    PhotometryPlugin.photometry[xreg.id] = res;
};

PhotometryPlugin.median = function(values) {
    'use strict';
    values.sort(function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2){
        return values[half];
    }else{
        return (values[half-1] + values[half]) / 2.0;
    }
};

PhotometryPlugin.clearTab = function(){
    'use strict';
    PhotometryPlugin.photometry = [];
    PhotometryPlugin.printTab();
    PhotometryPlugin.printInstructionText();
    PhotometryPlugin.action = "";
};

//Register the plugin in JS9
JS9.RegisterPlugin(PhotometryPlugin.CLASS, PhotometryPlugin.NAME, PhotometryPlugin.init,
            {menu:"analysis",
            menuItem: "Photometry",
            onregionschange: PhotometryPlugin.regionChange,
            onplugindisplay: PhotometryPlugin.onPluginDisplay,
            onclick: PhotometryPlugin.onClickImage,
            onimagedisplay: PhotometryPlugin.clearTab,
            onimageclose: PhotometryPlugin.clearTab,
            winTitle: "Plot Profile",
            winResize: true,
            winDims: [PhotometryPlugin.WIDTH, PhotometryPlugin.HEIGHT]});