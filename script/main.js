let bandColor = true

function changeColorMode(){
    if (bandColor) {
    document.documentElement.style.setProperty('--bg','#262626');
    document.documentElement.style.setProperty('--color','#f0f1f2');
    bandColor = false;
    } else {
        document.documentElement.style.setProperty('--color','#262626');
        document.documentElement.style.setProperty('--bg','#f0f1f2');
        bandColor = true;
    }
}