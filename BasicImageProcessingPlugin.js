/*global $, JS9, document */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var BasicImProcPlugin;
// create namespace, and specify some meta-information and params
BasicImProcPlugin = {};
BasicImProcPlugin.AddSubstract = {};
BasicImProcPlugin.SubImage = {};
BasicImProcPlugin.CLASS = "HandsOnUniverse";
BasicImProcPlugin.NAME = "BasicImProc";
BasicImProcPlugin.WIDTH =  250;
BasicImProcPlugin.HEIGHT = 200;

BasicImProcPlugin.SubImage.HALFANGLE = 179.83806486399;
BasicImProcPlugin.SubImage.zeroAngle = 0;

//Initialisation function of the plugin
BasicImProcPlugin.init = function(){
    'use strict';
    $(this.div).empty();
    BasicImProcPlugin.SubImage.div = document.createElement("DIV");
    BasicImProcPlugin.AddSubstract.div = document.createElement("DIV");
    $(this.div).append(BasicImProcPlugin.SubImage.div);
    $(this.div).append(BasicImProcPlugin.AddSubstract.div);
    BasicImProcPlugin.AddSubstract.init();
    BasicImProcPlugin.SubImage.init();
};

BasicImProcPlugin.AddSubstract.init = function(excludeImage){
    'use strict';
    var div = BasicImProcPlugin.AddSubstract.div;
    $(div).empty();
    $(div).append("<b>Add/Substract two images</b>");
    BasicImProcPlugin.AddSubstract.listDiv = document.createElement("DIV");
    $(div).append(BasicImProcPlugin.AddSubstract.listDiv);
    $(div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(1)'>Add</button>");
    $(div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(-1)'>Substract</button>");
    BasicImProcPlugin.AddSubstract.createLists(excludeImage);
};

BasicImProcPlugin.AddSubstract.createLists = function(excludeImage){
    'use strict';
    var images, i, str;
    images = JS9.GetDisplayData();
    BasicImProcPlugin.AddSubstract.list1 = document.createElement("SELECT");
    $(BasicImProcPlugin.AddSubstract.list1).append("<option value=''>Chose an image</option>");
    BasicImProcPlugin.AddSubstract.list2 = document.createElement("SELECT");
    $(BasicImProcPlugin.AddSubstract.list2).append("<option value=''>Chose an image</option>");
    for(i=0;i<images.length;i++){
        str = images[i].id;
        if(str!==excludeImage){
            if(str.length>30){
                str = str.slice(0,30)+"...";
            }
            $(BasicImProcPlugin.AddSubstract.list1).append("<option value='"+images[i].id+"'>"+str+"</option>");
            $(BasicImProcPlugin.AddSubstract.list2).append("<option value='"+images[i].id+"'>"+str+"</option>");
        }
    }
    $(BasicImProcPlugin.AddSubstract.listDiv).empty();
    $(BasicImProcPlugin.AddSubstract.listDiv).append("image 1:");
    $(BasicImProcPlugin.AddSubstract.listDiv).append(BasicImProcPlugin.AddSubstract.list1);
    $(BasicImProcPlugin.AddSubstract.listDiv).append("<br>");
    $(BasicImProcPlugin.AddSubstract.listDiv).append("image 2:");
    $(BasicImProcPlugin.AddSubstract.listDiv).append(BasicImProcPlugin.AddSubstract.list2);
};

BasicImProcPlugin.AddSubstract.onClickButton = function(mul){
    'use strict';
    var im1, im2, newim = {}, prov, bitpix, i, min, max;
    im1 = JS9.LookupImage(BasicImProcPlugin.AddSubstract.list1.value);
    im2 = JS9.LookupImage(BasicImProcPlugin.AddSubstract.list2.value);
    if(im1===null || im1===undefined || im2===null || im2===undefined){
        return;
    }
    if(im1.raw.height!==im2.raw.height || im1.raw.width!==im2.raw.width){
        return;
    }
    if(Math.abs(im1.raw.bitpix)>Math.abs(im2.raw.bitpix)){
        bitpix = im1.raw.bitpix;
    }else{
        bitpix = im2.raw.bitpix;
    }
    newim.naxis = 2;
    newim.naxis1 = im1.raw.width;
    newim.naxis2 = im1.raw.height;
    newim.image = [];
    for(i=0;i<im1.raw.data.length;i++){
        prov = im2.raw.data[i]*mul;
        newim.image[i] = im1.raw.data[i]+prov;
        if(min===undefined || min>newim.image[i]){
            min = newim.image[i];
        }if(max===undefined || max<newim.image[i]){
            max = newim.image[i];
        }
    }
    bitpix = BasicImProcPlugin.AddSubstract.calculateBitPix(min, max, bitpix);
    newim.bitpix = bitpix;
    JS9.Load(newim);
};

BasicImProcPlugin.AddSubstract.calculateBitPix = function(min, max, bitpix){
    'use strict';
    var lmax, lmin, next;
    if(bitpix===8){
        lmax = 255;
        lmin = 0;
        next = 16;
    }if(bitpix===16 || bitpix===32){
        lmax = Math.pow(2,bitpix-1)-1;
        lmin = -Math.pow(2,bitpix-1);
        if(bitpix===16){
            next = 32;
        }else{
            next = -32;
        }
    }if(bitpix===-32){
        max = Math.pow(2,127);
        min = -max;
        next = -64;
    }if(bitpix===-64){
        return -64;
    }
    if(min>lmin && max<lmax){
        return bitpix;
    }else{
        return BasicImProcPlugin.AddSubstract.calculateBitPix(min, max, next);
    }
};


BasicImProcPlugin.SubImage.init = function(){
    'use strict';
    BasicImProcPlugin.SubImage.mainregion = -1;
    BasicImProcPlugin.SubImage.printDiv();
};

BasicImProcPlugin.SubImage.printDiv = function(err){
    'use strict';
    var div = BasicImProcPlugin.SubImage.div;
    $(div).empty();
    $(div).append("<b>create sub image<br></b>");
    if(err==="badangle"){
        $(div).append("Box region should have a angle of 0<br>");
        $(div).append("<button onclick='BasicImProcPlugin.SubImage.resetAngle()'>reset angle</button>");
        return;
    }
    if(BasicImProcPlugin.SubImage.mainregion===-1 || err==="noregion"){
        $(div).append("Create or select a box region to create a sub image");
        return;
    }
    $(div).append("<button type='file' onclick='BasicImProcPlugin.SubImage.onClickButton()'>Create sub-image</button>");
};

BasicImProcPlugin.SubImage.onClickButton = function(){
    'use strict';
    var i, j, regs, xreg, im, xmin, ymin, xmax, ymax, newImage = {};
    regs = JS9.GetRegions(BasicImProcPlugin.SubImage.mainregion);
    im = JS9.GetImage();
    if(regs===null || regs===undefined || regs.length!==1 || im===null || im===undefined){
        return;
    }
    newImage.naxis = 2;
    newImage.image = [];
    xreg = regs[0];
    xmin = Math.floor(xreg.x-xreg.width/2);
    xmax = Math.floor(xreg.x+xreg.width/2);
    ymin = Math.floor(xreg.y-xreg.height/2);
    ymax = Math.floor(xreg.y+xreg.height/2);
    for(j=ymin;j<=ymax;j++){
        for(i=xmin;i<=xmax;i++){
            newImage.image.push(im.raw.data[j * im.raw.width + i]);
        }
    }
    newImage.naxis1 = xmax-xmin+1;
    newImage.naxis2 = ymax-ymin+1;
    newImage.bitpix = im.raw.bitpix;
    newImage.head = BasicImProcPlugin.SubImage.copyWCSFromHeader(im.raw.header, xmin, ymin);
    newImage.head.SIMPLE = true;
    newImage.head.BITPIX = newImage.bitpix;
    newImage.head.NAXIS1 = newImage.naxis1;
    newImage.head.NAXIS2 = newImage.naxis2;
    newImage.head.NAXIS = newImage.naxis;
    JS9.Load(newImage);
};


//http://www.astro.cornell.edu/~vassilis/isocont/node17.html
BasicImProcPlugin.SubImage.copyWCSFromHeader = function(header, dx, dy){
    'use strict';
    var res = {};
    if(header.CTYPE1!==undefined){
        res.CTYPE1 = header.CTYPE1;
    }if(header.CTYPE2!==undefined){
        res.CTYPE2 = header.CTYPE2;
    }if(header.CRVAL1!==undefined){
        res.CRVAL1 = header.CRVAL1;
    }if(header.CRVAL2!==undefined){
        res.CRVAL2 = header.CRVAL2;
    }if(header.CRPIX1!==undefined){
        res.CRPIX1 = header.CRPIX1 - dx;
    }if(header.CRPIX2!==undefined){
        res.CRPIX2 = header.CRPIX2 - dy;
    }if(header.EQUINOX!==undefined){
        res.EQUINOX = header.EQUINOX;
    }if(header.CDELT1!==undefined){
        res.CDELT1 = header.CDELT1;
    }if(header.CDELT2!==undefined){
        res.CDELT2 = header.CDELT2;
    }if(header.CROTA2!==undefined){
        res.CROTA2 = header.CROTA2;
    }if(header.CD001001!==undefined){
        res.CD001001 = header.CD001001;
    }if(header.CD001002!==undefined){
        res.CD001002 = header.CD001002;
    }if(header.CD002001!==undefined){
        res.CD002001 = header.CD002001;
    }if(header.CD002002!==undefined){
        res.CD002002 = header.CD002002;
    }if(header.CDELT1!==undefined){
        res.CDELT1 = header.CDELT1;
    }if(header.CDELT2!==undefined){
        res.CDELT2 = header.CDELT2;
    }if(header.CD1_1!==undefined){
        res.CD1_1 = header.CD1_1;
    }if(header.CD1_2!==undefined){
        res.CD1_2 = header.CD1_2;
    }if(header.CD2_1!==undefined){
        res.CD2_1 = header.CD2_1;
    }if(header.CD2_2!==undefined){
        res.CD2_2 = header.CD2_2;
    }
    return res;
};

BasicImProcPlugin.SubImage.resetAngle = function(){
    'use strict';
    JS9.ChangeRegions(BasicImProcPlugin.SubImage.mainregion,{angle: 0});
    BasicImProcPlugin.SubImage.zeroAngle = JS9.GetRegions(BasicImProcPlugin.SubImage.mainregion)[0].angle;
    BasicImProcPlugin.SubImage.printDiv();
};

BasicImProcPlugin.SubImage.regionchange = function(im,xreg){
    'use strict';
    var err;
    if(xreg.shape!=="box"){
        BasicImProcPlugin.SubImage.mainregion = -1;
    }else{
        BasicImProcPlugin.SubImage.mainregion = xreg.id;
        if(xreg.angle!==0 && xreg.angle!==BasicImProcPlugin.SubImage.zeroAngle){
            err = "badangle";
        }
        if(xreg.mode==="remove"){
            err = "noregion";
            BasicImProcPlugin.SubImage.mainregion = -1;
        }
        BasicImProcPlugin.SubImage.printDiv(err);
    }
};

BasicImProcPlugin.onRegionChange = function(im,xreg){
    'use strict';
    BasicImProcPlugin.SubImage.regionchange(im,xreg);
};

BasicImProcPlugin.onImageLoad = function(){
    'use strict';
    BasicImProcPlugin.AddSubstract.init();
    BasicImProcPlugin.SubImage.init();
};

BasicImProcPlugin.onImageClose = function(im){
    'use strict';
    BasicImProcPlugin.AddSubstract.init(im.id);
    BasicImProcPlugin.SubImage.init();
};


//Register the plugin in JS9
JS9.RegisterPlugin(BasicImProcPlugin.CLASS, BasicImProcPlugin.NAME, BasicImProcPlugin.init,
            {menuItem: "Basic Image Processing",
            onplugindisplay: BasicImProcPlugin.init,
            onimageload: BasicImProcPlugin.onImageLoad,
            onimageclose: BasicImProcPlugin.onImageClose,
            onregionschange: BasicImProcPlugin.onRegionChange,
            winTitle: "Basic Image Processing",
            winResize: true,
            winDims: [BasicImProcPlugin.WIDTH, BasicImProcPlugin.HEIGHT]});