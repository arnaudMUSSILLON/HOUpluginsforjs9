// Toggle menu on click
$('.toggle-menu').jPushMenu();

// Resize the JS9 window
function resize() {
    let wWidth = window.innerWidth / 1.2;
    let wHeight = window.innerHeight - 125;

    $('#JS9-canvas').css('margin-left', (window.innerWidth-wWidth)/2+'px');
    $('.JS9Menubar').attr('data-width', wWidth);
    $('.JS9Toolbar').attr('data-width', wWidth);
    $('.JS9').attr('data-width', wWidth);
    $('.JS9').attr('data-height', wHeight);
    $('.JS9Colorbar').attr('data-width', wWidth);
}

document.addEventListener('onload', resize());
window.addEventListener('resize', () => {location.reload();});