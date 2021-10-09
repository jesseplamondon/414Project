function main(){
    
    let canvas = document.getElementById('canvas');
    if(!canvas){
        console.log('Failed');
        return;
    }
    let ctx = canvas.getContext('2d');


    //Draw a blue circle
    ctx.beginPath();
    ctx.fillStyle = 'rgba(202, 231, 193, 1.0)';
    ctx.arc(250, 250, 250, 0, 2 * Math.PI);
    ctx.fill();

    setInterval(spawnBacteria, 3000, ctx);
}

function spawnBacteria(ctx) {
    //generate random color
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    //generate random coordinate on edge
    let randAngle = Math.random() * 2 * Math.PI;
    let randX = (225 * Math.cos(randAngle)) + 250;
    let randY = (225 * Math.sin(randAngle)) + 250;


    ctx.beginPath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
    ctx.arc(randX, randY, 25, 0, 2 * Math.PI);
    ctx.fill();

}


