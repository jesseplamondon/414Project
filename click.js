var vertexShaderText = [
    'precision mediump float;',
    
    'attribute vec2 vertPosition;',
    'attribute vec3 vertColor;',
    'uniform vec2 motion;',
    'varying vec3 fragColor;',
    
    'void main()',
    '{',
    '	fragColor = vertColor;',
    '	gl_Position = vec4(vertPosition + motion, 0.0, 1.0);',
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
    var randAngleArray = [];
    var center = [0, 0];
    var gamePoints = 0;
    var gameScoreHeader = document.getElementById("game-score");
    gameScoreHeader.innerHTML=gamePoints;
    var pointsArray = [];
    var colorArray = [[0.078,0.56,0.164]]; //initialized with petry dish

    var InitClick = function() {
        
        //////////////////////////////////
        //       initialize WebGL       //
        //////////////////////////////////
        console.log('this is working');
    
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
        
        //initialize bacteria creation loop
        var intervalID = window.setInterval(drawBacteria(gl, program), 10000);
        //////////////////////////////////
        //    create circle buffer    //
        //////////////////////////////////
    
        canvas.onmousedown = function(e) {
            var mx = e.clientX, my = e.clientY;
            mx = mx/dimension-0.5;
            my = my/dimension-0.5;
            mx *= 2;
            my *= -2;
            x = mx;
            y = my;
        }
        
        var x = 0;
        var y = 0;
        var loop = function(){
            drawBacteria(gl,program, loopCount);
            drawDish(0,0,gl,program,x,y);
            loopCount++;
            if(gamePoints==2){
                gameScoreHeader.innerHTML="You lost";
                alert("Game Over. Try again?");
                document.location.reload();
                gamePoints = 0;
            }
            requestAnimationFrame(loop);
    
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
    
        var motion = new Float32Array(2);
        motion[0] = 0.5;
        motion[1] = 0.5;
    
        var triangleVertexBufferObject = gl.createBuffer();
        //set the active buffer to the triangle buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
        //gl expecting Float32 Array not Float64
        //gl.STATIC_DRAW means we send the data only once (the triangle vertex position
        //will not change over time)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices),gl.STATIC_DRAW);
    
        var positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
        var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        var motionUniformLocation = gl.getUniformLocation(program, 'motion');
    
        
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
        gl.enableVertexAttribArray(colorAttribLocation);
        //gl.uniform2fv(motionUniformLocation, motion);
        gl.useProgram(program);
        
        //////////////////////////////////
        //            Drawing           //
        //////////////////////////////////
            
        
        
        motion[0] = x;
        motion[1] = y;
        gl.uniform2fv(motionUniformLocation, motion);
    
        gl.clearColor = (0.5, 0.8, 0.8, 1.0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
    }
    function spreadBacteria(){
        var radius = 0.65;
        if(bacteriaVertices.length>0){
            for(let i = 0; i<bacteriaVertices.length;i++){
                if(bacteriaVertices[i].length<30){
                    bacteriaVertices[i].push(
                        center[0] + radius * Math.cos((randAngleArray[i]+bacteriaVertices[i].length/2)*Math.PI/180),
                        center[1] + radius * Math.sin((randAngleArray[i]+(bacteriaVertices[i].length)/2)*Math.PI/180)
                    )
                    bacteriaVertices[i].splice(2,0,
                        center[0] + radius * Math.cos((randAngleArray[i]-bacteriaVertices[i].length/4)*Math.PI/180)
                    );
                    bacteriaVertices[i].splice(3,0,
                        center[1] + radius * Math.sin((randAngleArray[i]-(bacteriaVertices[i].length)/4)*Math.PI/180)
                    );
                    //setting game score text bar based on time bacteria is allowed to spread
                    
                }
                else if(!pointsArray[i]){
                    pointsArray[i]=true;
                    gamePoints++;
                    gameScoreHeader.innerHTML=gamePoints;
                }
            }
        }
        else{
            addBacteria(0, radius);
        }
    }
    function addBacteria(i, radius){
        let randAngle = Math.random() * 360;
        pointsArray.push(false);
            randAngleArray.push(randAngle);
            bacteriaVertices.push([center[0], center[1]]);
            bacteriaVertices[i].push(
                radius * Math.cos(randAngle*Math.PI / 180),
                radius * Math.sin(randAngle*Math.PI / 180)
            );
            addColors();
    }
    function drawBacteria(gl, program, loopCount){
        if(loopCount%100==0&&loopCount!=0&&bacteriaVertices.length<10){
            addBacteria(bacteriaVertices.length, 0.65);
        } 
        if (loopCount%17==0&&loopCount!=0){
            spreadBacteria();
        }
        //drawing all bacteria in bacteriaVertices array
        for(let i = 0; i<bacteriaVertices.length; i++){
            var bacteriaVertexBufferObject = gl.createBuffer();
            //set the active buffer to the triangle buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, bacteriaVertexBufferObject);
            //gl expecting Float32 Array not Float64
            //gl.STATIC_DRAW means we send the data only once (the triangle vertex position
            //will not change over time)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bacteriaVertices[i]),gl.STATIC_DRAW);
            //setup for bacteria color
            
           
            
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
            /* gl.vertexAttribPointer(
                colorAttribLocation, //attributeLocation
                3, //number of elements per attribute
                gl.FLOAT,
                gl.FALSE,
                5*Float32Array.BYTES_PER_ELEMENT,
                2*Float32Array.BYTES_PER_ELEMENT
            ); */
            gl.enableVertexAttribArray(positionAttribLocation);
            gl.enableVertexAttribArray(colorAttribLocation);
            gl.useProgram(program);
            
            gl.drawArrays(gl.TRIANGLE_FAN, 0, bacteriaVertices[i].length/2);
        }
    }
    function addColors(){
        var colors = [];
        do{
            colors = [Math.random(),Math.random(),Math.random()];
        }while(isInArray(colorArray,colors));
        colorArray.push(colors);
        console.log(colorArray);
    }
    function isInArray(arr,item){
        var item_as_string = JSON.stringify(item);
        var contains = arr.some(function(ele){
            return JSON.stringify(ele)==item_as_string;
        });
        return contains;
    }