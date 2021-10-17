var vertexShaderText = [
    'precision mediump float;',
    
    'attribute vec2 vertPosition;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    
    'void main()',
    '{',
    '	fragColor = vertColor;',
    '	gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
    ].join('\n');


    var fragmentShaderText =
    [
    'precision mediump float;',
    
    'varying vec3 fragColor;',
    
    'void main()',
    '{',
        
    '	gl_FragColor = vec4(fragColor,1.0);',
    '}',
    ].join('\n')
    
    
    var bacteriaVertices = [];
    var loopCount = 0;
    var dimension = 0;
    var dishRad = 0.6;
    var bacteriaWidth = 0.06;
    var randAngleArray = [];
    var center = [0, 0];
    var gamePoints = 0;
    var gameScoreHeader = document.getElementById("game-score");
    var pointsArray = [];
    var colorArray = [[0.078,0.56,0.164]]; //initialized with petry dish
    var killedBacteria = 0;

    var InitClick = function() {
        
        //////////////////////////////////
        //       initialize WebGL       //
        //////////////////////////////////
    
        var canvas = document.getElementById('game-surface');
        var gl = canvas.getContext('webgl');
    
        if (!gl){
            console.log('webgl not supported, falling back on experimental-webgl');
            gl = canvas.getContext('experimental-webgl');
        }
        if (!gl){
            alert('your browser does not support webgl');
        }
    
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        dimension = Math.min(canvas.width, canvas.height);
        gl.viewport(0,0,dimension, dimension);
    
    
        //////////////////////////////////
        // create/compile/link shaders  //
        //////////////////////////////////
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
        gl.shaderSource(vertexShader,vertexShaderText);
        gl.shaderSource(fragmentShader,fragmentShaderText);
    
        gl.compileShader(vertexShader);
        if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
            console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
            return;
        }
        gl.compileShader(fragmentShader);
            if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
            console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
            return;
        }
    
        var program = gl.createProgram();
        gl.attachShader(program,vertexShader);
        gl.attachShader(program,fragmentShader);
    
        gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
            console.error('Error linking program!', gl.getProgramInfo(program));
            return;
        }
        
        //////////////////////////////////
        //    create circle buffer    //
        //////////////////////////////////
    
        canvas.onmousedown = function(e) {
            var mx = e.clientX, my = e.clientY;
            let rect = canvas.getBoundingClientRect();
            x = (mx -rect.left)/dimension;
            y = (my - rect.top)/dimension;
            var newCoords = numToNDC(x,y);
            x=newCoords[0];
            y=newCoords[1];
            for(let i = 0; i<bacteriaVertices.length;i++){
                if(isInBacteria(x,y,i)){
                    if(bacteriaVertices[i].length>=62){
                        if(gamePoints>0){
                            gamePoints--;
                        }
                    }
                    bacteriaVertices.splice(i,1);
                    colorArray.splice(i,1);
                    randAngleArray.splice(i,1);
                    pointsArray.splice(i,1);
                    killedBacteria++;
                    gameScoreHeader.innerHTML=gamePoints;
                }
            }
        }
        
        var x = 0;
        var y = 0;
        var loop = function(){
            if(gamePoints>1){
                playerLoses();
            }
            else if(bacteriaVertices.length==0&&killedBacteria>0){
                playerWins();
            }
            else{
                drawBacteria(gl,program, loopCount);
                drawDish(0,0,gl,program,x,y);
                loopCount++;
                //checking if there are touching bacteria and joining them if there are
               for(let i = 0; i<bacteriaVertices.length;i++){
                    isTouchingAny(i);
                } 
                gameScoreHeader.innerHTML=gamePoints;
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
            
    };
    function drawDish(centerX, centerY, gl, program, x, y){
        //Define circle parameters
        var center = [centerX, centerY];
        var circleVertices = [];

        circleVertices.push(center[0], center[1]);
        for(let i = 0; i <=360; i++){
            circleVertices.push(
                center[0] + dishRad * Math.cos(i * Math.PI / 180),
                center[1] + dishRad * Math.sin(i * Math.PI / 180)
            );
        }
    
        var triangleVertexBufferObject = gl.createBuffer();
        //set the active buffer to the triangle buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
        //gl expecting Float32 Array not Float64
        //gl.STATIC_DRAW means we send the data only once (the triangle vertex position
        //will not change over time)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices),gl.STATIC_DRAW);
    
        var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
        var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        
        gl.vertexAttribPointer(
            positionAttribLocation, //attribute location
            2, //number of elements per attribute
            gl.FLOAT, 
            gl.FALSE,
            2*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
            0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
            );
         gl.vertexAttribPointer(
            colorAttribLocation, //attributeLocation
            3, //number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            5*Float32Array.BYTES_PER_ELEMENT,
            2*Float32Array.BYTES_PER_ELEMENT
        ); 
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.disableVertexAttribArray(colorAttribLocation);
        gl.vertexAttrib4f(colorAttribLocation, 0.5, 0.8, 0.8, 1.0);
        //gl.uniform2fv(motionUniformLocation, motion);
        gl.useProgram(program);
        
        //////////////////////////////////
        //            Drawing           //
        //////////////////////////////////
        gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
    }
    function spreadBacteria(){
        var radius = dishRad+bacteriaWidth;
        var maxLength = 62;
        if(bacteriaVertices.length>0){
            for(let i = 0; i<bacteriaVertices.length;i++){
                if(bacteriaVertices[i].length<=maxLength){
                    bacteriaVertices[i].push(
                        center[0] + radius * Math.cos((randAngleArray[i]+bacteriaVertices[i].length/2)*Math.PI/180),
                        center[1] + radius * Math.sin((randAngleArray[i]+(bacteriaVertices[i].length)/2)*Math.PI/180)
                    )
                    if(bacteriaVertices[i].length<=maxLength){
                        bacteriaVertices[i].splice(2,0,
                            center[0] + radius * Math.cos((randAngleArray[i]-bacteriaVertices[i].length/4)*Math.PI/180)
                        );
                        bacteriaVertices[i].splice(3,0,
                            center[1] + radius * Math.sin((randAngleArray[i]-(bacteriaVertices[i].length)/4)*Math.PI/180)
                        );

                        //setting game score text bar based on time bacteria is allowed to spread
                    }
                }
                else if(!pointsArray[i]){
                    pointsArray[i]=true;
                    gamePoints++;
                    gameScoreHeader.innerHTML=gamePoints;
                }
            }
        }
        else{
            addBacteria(0);
        }
    }
    function addBacteria(i){
        pointsArray.push(false);
        let randAngle = 0;
        do{
            var onTop = false;
            randAngle = Math.random() * 360;
            for(let i = 0; i<bacteriaVertices.length; i++){
                len = bacteriaVertices[i].length;
                var leftAngle = getAngle(bacteriaVertices[i][len-2],bacteriaVertices[i][len-1]);
                var rightAngle = getAngle(bacteriaVertices[i][2],bacteriaVertices[i][3]);
                if(randAngle>=rightAngle&&randAngle<=leftAngle){
                    onTop=true;
                }
            }
        }while(onTop)
            randAngleArray.push(randAngle);
            bacteriaVertices.push([center[0], center[1]]);
            bacteriaVertices[i].push(
                (dishRad+bacteriaWidth) * Math.cos(randAngle*Math.PI / 180),
                (dishRad+bacteriaWidth) * Math.sin(randAngle*Math.PI / 180));
            addColors();
    }
    function drawBacteria(gl, program, loopCount){
        if(loopCount%52==0&&loopCount!=0&&bacteriaVertices.length<10){
            addBacteria(bacteriaVertices.length, 0.65);
        } 
        if (loopCount%28==0&&loopCount!=0){
            spreadBacteria();
        }
        //drawing all bacteria in bacteriaVertices array
        for(let i = 0; i<bacteriaVertices.length; i++){
            var bacteriaAttribLocation = gl.getAttribLocation(program, 'vertColor');
            var bacteriaVertexBufferObject = gl.createBuffer();
            //set the active buffer to the triangle buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, bacteriaVertexBufferObject);
            //gl expecting Float32 Array not Float64
            //gl.STATIC_DRAW means we send the data only once (the triangle vertex position
            //will not change over time)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bacteriaVertices[i]),gl.STATIC_DRAW);
            //setup for bacteria color
           
            
            var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
            
            gl.vertexAttribPointer(
                positionAttribLocation, //attribute location
                2, //number of elements per attribute
                gl.FLOAT, 
                gl.FALSE,
                2*Float32Array.BYTES_PER_ELEMENT,//size of an individual vertex
                0*Float32Array.BYTES_PER_ELEMENT//offset from the beginning of a single vertex to this attribute
                );
             gl.vertexAttribPointer(
                bacteriaAttribLocation, //attributeLocation
                3, //number of elements per attribute
                gl.FLOAT,
                gl.FALSE,
                5*Float32Array.BYTES_PER_ELEMENT,
                2*Float32Array.BYTES_PER_ELEMENT
            );
            gl.enableVertexAttribArray(positionAttribLocation);
            gl.disableVertexAttribArray(bacteriaAttribLocation);
            gl.vertexAttrib4f(bacteriaAttribLocation, colorArray[i][0], colorArray[i][1], colorArray[i][2], 1.0);
            //gl.uniform3fv(u_FragColor, new Float32Array(colorArray[i][0], colorArray[i][1], colorArray[i][2]), 0);
            gl.useProgram(program);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, bacteriaVertices[i].length/2);
        }
    }
    //not working yet
    function isTouchingAny(a){
        if(bacteriaVertices[a].length<62){
            for(let i = 0; i<bacteriaVertices.length; i++){
                if(i!=a){
                    var overlap = false;
                    let centreAngle = getAngle(bacteriaVertices[i][bacteriaVertices[i].length],bacteriaVertices[i][bacteriaVertices[i].length+1]);
                    if(bacteriaVertices[a].length>=bacteriaVertices[i].length){
                        for(let v = 2; v<bacteriaVertices[i].length;v+=2){
                            var aLength = bacteriaVertices[a].length;
                            var iLength = bacteriaVertices[i].length;
                            var aLeftAngle = getAngle(bacteriaVertices[a][aLength-2],bacteriaVertices[a][aLength-1]);
                            var aRightAngle = getAngle(bacteriaVertices[a][2],bacteriaVertices[a][3]);
                            var iLeftAngle = getAngle(bacteriaVertices[i][iLength-2],bacteriaVertices[i][iLength-1]);
                            var iAngle = getAngle(bacteriaVertices[i][v],bacteriaVertices[i][v+1]);
                            if((aLeftAngle<iLeftAngle&&aLeftAngle>iAngle)||(aRightAngle<iLeftAngle&&aRightAngle>iAngle)){
                                if(iAngle>centreAngle){
                                    bacteriaVertices[a].push(bacteriaVertices[i][v], bacteriaVertices[i][v+1]);
                                }else {
                                    bacteriaVertices[a].splice(2, 0, bacteriaVertices[i][v]);
                                    bacteriaVertices[a].splice(3, 0, bacteriaVertices[i][v+1]);
                                    v+=2;
                                }
                                overlap = true;
                            }
                        }
                    }
                }
                if(overlap){
                    bacteriaVertices.splice(i,1);
                    colorArray.splice(i,1);
                    randAngleArray.splice(i,1);
                    pointsArray.splice(i,1);
                    i--;
                }
            }
        }
    }
    function addColors(){
        var colors = [];
        do{
            colors = [Math.random(),Math.random(),Math.random()];
        }while(isInArray(colorArray,colors));
        colorArray.push(colors);
    }
    function isInArray(arr,item){
        var item_as_string = JSON.stringify(item);
        var contains = arr.some(function(ele){
            return JSON.stringify(ele)==item_as_string;
        });
        return contains;
    }
    function isInDish(x,y){
        var d = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
        return d<=dishRad;
    }
    function getAngle(x,y){

        var angle = Math.atan2(y,x)*180/Math.PI;
        if(y<0){
            angle = 360+angle;
        }
        return angle;
    }
    function isInBacteria(x,y,i){
        var len = bacteriaVertices[i].length;
        var leftAngle = getAngle(bacteriaVertices[i][len-2],bacteriaVertices[i][len-1]);
        var rightAngle = getAngle(bacteriaVertices[i][2],bacteriaVertices[i][3]);
        var d = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
        let angle = 0;
        angle = getAngle(x,y);
        if(angle>= rightAngle&&angle<=leftAngle&&d<bacteriaWidth+dishRad&&!isInDish(x,y)){
            return true;
        }
        else if(rightAngle>100+leftAngle){
            if(angle<leftAngle||angle>rightAngle){
                return true;
            }
        }
        return false;
    }
    function numToNDC(x,y){
        var coords = [x,y];
        var oldRange = [[0,1],[1,0]];
        var newRange = [[-1,1],[-1,1]];
        var newCoords = [];
        for(let i =0; i<coords.length;i++){
            var newValue = (coords[i] - oldRange[i][0]) * (newRange[i][1] - newRange[i][0]) / (oldRange[i][1] - oldRange[i][0]) + newRange[i][0];
            newCoords[i] = Math.min(Math.max(newValue, newRange[i][0]) , newRange[i][1]);
        }
        return newCoords;
    }
    function playerWins(){
        alert("You won!! You killed " + killedBacteria + " bacteria! Play again?");
        resetGame();
    }
    function playerLoses(){
        gameScoreHeader.innerHTML="You lost";
        alert("Game Over. You killed " + killedBacteria +" bacteria! Try again?");
        resetGame();
    }
    function resetGame(){
        document.location.reload();
        gamePoints = 0;
        killedBacteria = 0;
    }