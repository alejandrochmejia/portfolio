let bandColor = true

function changeColorMode(){
    if (bandColor) {
        document.documentElement.style.setProperty('--bg','#262626');
        document.documentElement.style.setProperty('--color','#f0f1f2');
        bandColor = false;
        document.getElementById('colorChange').name = 'sunny'
    } else {
        document.documentElement.style.setProperty('--color','#262626');
        document.documentElement.style.setProperty('--bg','#f0f1f2');
        bandColor = true;
        document.getElementById('colorChange').name = 'moon'
    }
}

function changeSection(event){
    if (event.target.classList.contains('navSelected')){
        return true
    } else {
        list = document.getElementById("container").children;

        for (let child of list){
            if(child.classList.contains('activedSection')){
                child.classList.remove('activedSection');
                child.classList.add('desactivedSection');
                setTimeout(()=>{
                    child.style.display = 'none'
                },600);
            }
        }
        
        setTimeout(()=>{
            if (event.target.innerHTML == "Home"){
                document.getElementById('home').style.display = 'flex';
                setTimeout(()=>{
                    document.getElementById('home').classList.remove('desactivedSection');
                    document.getElementById('home').classList.add('activedSection');
                },500)
            } else if (event.target.innerHTML == "Info"){
                document.getElementById('info').style.display = 'flex';
                setTimeout(()=>{
                    document.getElementById('info').classList.remove('desactivedSection');
                    document.getElementById('info').classList.add('activedSection');
                },500)
            } else if (event.target.innerHTML == "Projects"){
                document.getElementById('projects').style.display = 'flex';
                setTimeout(()=>{
                    document.getElementById('projects').classList.remove('desactivedSection');
                    document.getElementById('projects').classList.add('activedSection');
                },500)
            } else if (event.target.innerHTML == "Contact"){
                document.getElementById('contact').style.display = 'flex';
                setTimeout(()=>{
                    document.getElementById('contact').classList.remove('desactivedSection');
                    document.getElementById('contact').classList.add('activedSection');
                },500)
            }
        },600);
    }
}

function deselect(){
    elements = document.getElementsByClassName('navSelected');
    elements[0].classList.remove('navSelected')
}

function select(event){
    let element = event.target;
    deselect();
    changeSection(event);
    element.classList.add('navSelected')
}