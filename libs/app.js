// Toggle menu on click
$('.toggle-menu').jPushMenu();

// Resize the JS9 window
function resizeJS9() {
    let wWidth = window.innerWidth / 1.2;
    let wHeight = window.innerHeight - 125;
    $('#JS9-canvas').css('margin-left', (window.innerWidth-wWidth)/2+'px');
    $('.JS9Menubar').attr('data-width', wWidth);
    $('.JS9Toolbar').attr('data-width', wWidth);
    $('.JS9Toolbar').attr('data-height', '30px');
    $('.JS9').attr('data-width', wWidth);
    $('.JS9').attr('data-height', wHeight);
    $('.JS9Colorbar').attr('data-width', wWidth);
}

// Resize JS9 in a div (id must be JS9-canvas)
function resizeJS9InDiv() {
    let wWidth = $('#JS9-canvas').width();
    let wHeight = window.innerHeight - 200;
    $('.JS9Menubar').attr('data-width', wWidth);
    $('.JS9Toolbar').attr('data-width', wWidth);
    $('.JS9Toolbar').attr('data-height', '30px');
    $('.JS9').attr('data-width', wWidth);
    $('.JS9').attr('data-height', wHeight);
    $('.JS9Colorbar').attr('data-width', wWidth);
}

// Trigger resize function depending of the page
let path = window.location.pathname;
let page = path.split("/").pop();
if(page !== 'index.html'){
    document.addEventListener('onload', resizeJS9InDiv());
} else {
    document.addEventListener('onLoad', resizeJS9());
}
// window.addEventListener('resize', () => {location.reload();});       // Reload on resize of window (can't resize JS9 canvas manually)