
  /* BASIC FLOCKING BEHAVIOUR use this tutorial
   * https://gamedevelopment.tutsplus.com/tutorials/3-simple-rules-of-flocking-behaviors-alignment-cohesion-and-separation--gamedev-3444
   *
   *  To add:
   *    - round bounding boxes (slightly cleverer maths required)
   *    - change behaviour based on neighbour count
   *    - add different kinds of birds
   *    - more control/information
   *    - uniform grid collision detection
   */

  var agents;                 //list of all agents on the canvas
  var myInterval;             //window timer
  var showBounds = false;
  var boundsWeight = 2.0;
  var alignmentWeight = 0.4;
  var cohesionWeight = 0.1;
  var separationWeight = 1;
  var speedWeight = 0.1;
  var speed;
  var showHideCntrls = false;


  function ctrlsOnOff() {
    //console.log("Cntrls on/off");
    if(showHideCntrls) {
      document.getElementById('controlPanel').style.display="none";
      document.getElementById('control-button').innerHTML="Show controls";
      showHideCntrls = false;
    } else {
      document.getElementById('controlPanel').style.display="inline-grid";
      document.getElementById('control-button').innerHTML="Hide controls";
      showHideCntrls = true;
    }
  }

  function separationChange(val) {
    separationWeight += val;
    if(separationWeight < 0.0) separationWeight = 0.0;
    if(separationWeight > 1.0) separationWeight = 1.0;
    document.getElementById('separationVal').innerHTML = separationWeight.toFixed(2);
    redraw();
  }

  function speedChange(val) {
    speedWeight += val;
    if(speedWeight < 0.0) speedWeight = 0.0;
    if(speedWeight > 1.0) speedWeight = 1.0;
    document.getElementById('speedVal').innerHTML = speedWeight.toFixed(2);
    redraw();
  }

  function boundsChange(val) {
    boundsWeight += val;
    if(boundsWeight < 0.1) boundsWeight = 0.1;
    document.getElementById('boundsVal').innerHTML = boundsWeight.toFixed(2);
    redraw();
  }

  function alignmentChange(val) {
    alignmentWeight += val;
    if(alignmentWeight < 0.0) alignmentWeight = 0.0;
    if(alignmentWeight > 1.0) alignmentWeight = 1.0;
    document.getElementById('alignmentVal').innerHTML = alignmentWeight.toFixed(2);
    redraw();
  }

  function cohesionChange(val) {
    cohesionWeight += val;
    if(cohesionWeight < 0.0) cohesionWeight = 0.0;
    if(cohesionWeight > 1.0) cohesionWeight = 1.0;
    document.getElementById('cohesionVal').innerHTML = cohesionWeight.toFixed(2);
    redraw();
  }

  function showBoundsClicked(evt) {
    //console.log("CB clicked");
    showBounds = evt.checked;
    redraw();
  }



  function add() {
    var ctx = document.getElementById('canvas').getContext('2d');
    agents.push(new Agent(Math.random()*ctx.canvas.width,     //x
                          Math.random()*ctx.canvas.height,    //y
                          Math.random()*360,                  //rotation
                          (Math.random()*2)+1,                //speed - was using a randomised value but removing for alignment // (Math.random()*2)+1,
                          "./images/bird.png"));                       //sprite
    redraw();
  }

  function draw() {
    //console.log("STARTING");
    var ctx = document.getElementById('canvas').getContext('2d');
    ctx.canvas.width = window.innerWidth-20;
    ctx.canvas.height = window.innerHeight*0.9;
    document.getElementById('boundsVal').innerHTML = boundsWeight.toFixed(2);
    document.getElementById('alignmentVal').innerHTML = alignmentWeight.toFixed(2);
    document.getElementById('cohesionVal').innerHTML = cohesionWeight.toFixed(2);
    document.getElementById('speedVal').innerHTML = speedWeight.toFixed(2);
    document.getElementById('separationVal').innerHTML = separationWeight.toFixed(2);
    agents = [];
    // agents = [new Agent(ctx.canvas.width/2,ctx.canvas.height/2,0,1,"bird.png")];
    ctx.canvas.onmousedown = onmousedown;
    // redraw();

    // add 100 to start within
    for(i=0; i<100; i++)
      add();

    // then START
    start();

  }

  function reset() {
    agents=[];
    clearInterval(myInterval);
    redraw();
  };



  function windowToCanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();

    return {
      x: x - bbox.left * (canvas.width  / bbox.width),
      y: y - bbox.top  * (canvas.height / bbox.height)
    };
  }

  function onmousedown(e) {

    /* On a mousedown event all agents are checked to see if they have been clicked on
     * if they have then a selection box is draw around the bird to signify its selection
     *
     * TO ADD:
     *  - An information panel should pop-up showing the properties of the agent selected
     *  - multi-select
     *
     * READ THIS: http://www.informit.com/articles/article.aspx?p=1903884&seqNum=6
     *
    */

    var ctx = document.getElementById('canvas').getContext('2d');
    var loc = windowToCanvas(ctx.canvas, e.clientX, e.clientY);
    //console.log("Mouse clicked: " + loc.x.toFixed(2) + "," + loc.y.toFixed(2));
    //check if any of the existing agents have been clicked (return first one)
    for(var i=0; i<agents.length; i++)
    {
      agents[i].selected = false;
      //console.log(agents[i].image.height + " " + agents[i].y);
      var ag_x = agents[i].x;
      var ag_y = agents[i].y;
      var ag_w = agents[i].image.width;
      var ag_h = agents[i].image.height;
      //console.log( ag_x + "," + ag_y + " " + ag_w + "," + ag_h);

      if(loc.x >= ag_x-(ag_w/2) && loc.x <= (ag_x+(ag_w/2)) && loc.y >=ag_y-(ag_h/2) && loc.y <= (ag_y+(ag_h/2))) {
        //{console.log("X+Y hit");
        agents[i].selected=true;
      }
    }

    redraw();
  }

  function stop() {
    clearInterval(myInterval);
  }



  function start() {
    myInterval = setInterval(function() { update(); }, 20);
  }

  function redraw()  {
    clear();
    for(i=0; i<agents.length; i++) {
        agents[i].draw();
      }
  }

  function update() {

      clear();
      // go through each agent and move/turn, then draw (avoids iterating list twice)

      for(i=0; i<agents.length; i++) {

        // return an array of agents which are within within radius
        var neighbourhood = agents.filter(function (el) { return el.testCircle(agents[i].x, agents[i].y) && el!=agents[i]; });

        if(neighbourhood.length>0) {
          /* If one or more agents in within its radius (or neighbourhood) then there are three flocking behviours to apply
           * 1.  alignment - the agents will change path to an average
           * 2.  cohesion - the agents will try and move to be closer together
           * 3.  seperation - the agents will try and keep a certain distance away from each other
           * 4.  speed - the agents will try and match speed
           */

          /* 1. Alignment
           * This section adds in the weight of the rotation (between 0 and 1), finds the difference between the
           * target and current then adds a proportion based on the alignmentWeight */
          if(alignmentWeight>0) {
            var averageRotation = neighbourhood.reduce(function (total, el) { return total+el.rotation; },0) / neighbourhood.length;
            var differenceRotation = averageRotation - agents[i].rotation;
            var weightedRotation = differenceRotation * alignmentWeight;
            agents[i].rotation+=weightedRotation;

            // Smooth the animation by not letting the agents turn more than 30 degrees
            if(weightedRotation>30)
              weightedRotation = 30;
            else if(weightedRotation<-30)
              weightedRotation = -30;

          }

          /* 2. Cohesion
           *     - find the average new X and Y from the neighbourhood
           *     - find the angle to the new point (rotation)
           *     - apply weighting and add to existing rotation
           */
          if(cohesionWeight>0) {
            var averageLocation_X = neighbourhood.reduce(function (total, el) { return total+el.x; },0) / neighbourhood.length;
            var averageLocation_Y = neighbourhood.reduce(function (total, el) { return total+el.y; },0) / neighbourhood.length;
            var tx = averageLocation_X - agents[i].x;
            var ty = averageLocation_Y - agents[i].y;
            // for some reason the atan function returns the -90 rotated, so use the two known sides, work out the
            // resulting angle and alter so it is correct for this scenario.
            var t_rot = Math.atan2(ty,tx) * (180/Math.PI) + 90;
            if(t_rot<0) t_rot=360+t_rot;
            var diff_rot = t_rot-agents[i].rotation;
            weightedRotation = diff_rot * cohesionWeight;

            // Smooth the animation by not letting the agents turn more than 30 degrees
            if(weightedRotation>30)
              weightedRotation = 30;
            else if(weightedRotation<-30)
              weightedRotation = -30;

            agents[i].rotation+=weightedRotation;
            //console.log("C_r: " + agents[i].rotation.toFixed(0) + " with nbrs: " + neighbourhood.length + " t_x/y: " + tx.toFixed(0) +","+ty.toFixed(0) +  " @ " + t_rot.toFixed(0) + " diff: " + diff_rot);
          }

          /* 3. separation
           *
           *
           */
            var tooCloseAgents = neighbourhood.filter(function (el) { return el.distance<el.innerCollisionRadius; });
            if(tooCloseAgents.length>0) {
                var averageLocation_X = tooCloseAgents.reduce(function(total, el) { return total+el.x; },0) / tooCloseAgents.length;
                var averageLocation_Y = tooCloseAgents.reduce(function(total, el) { return total+el.y; },0) / tooCloseAgents.length;
                var tx = averageLocation_X - agents[i].x;
                var ty = averageLocation_Y - agents[i].y;
                // for some reason the atan function returns the -90 rotated, so use the two known sides, work out the
                // resulting angle and alter so it is correct for this scenario.
                // + 180 to change the direction AWAY from the location of the too close agent
                var t_rot = Math.atan2(ty,tx) * (180/Math.PI) + 90 + 180;
                if(t_rot<0) t_rot=360+t_rot;
                var diff_rot = t_rot-agents[i].rotation;
                weightedRotation = diff_rot * separationWeight;

                // Smooth the animation by not letting the agents turn more than 30 degrees
                if(weightedRotation>30)
                  weightedRotation = 30;
                else if(weightedRotation<-30)
                  weightedRotation = -30;

                agents[i].rotation+=weightedRotation;
            }

          /* 4. speed
           *  - find the average speed of the neighbourhood agents
           *  - alter the speed based on the speed weighting
           */
          if(speedWeight>0) {
            var averageSpeed = neighbourhood.reduce(function (total, el) { return total+el.speed; },0) / neighbourhood.length;
            var diff_speed = averageSpeed-agents[i].speed;
            var weightedSpeed = diff_speed*speedWeight;
            agents[i].speed+=weightedSpeed;
          }


        } else {
          // if no neighbours then randomise rotation
          var rand = Math.random();
          if(rand<0.1)
            agents[i].rotate((Math.random()*30)-15);

        }

        agents[i].forward();

        //console.log(newArry.length);
        // if(newArry.length>1) { console.log("HIT"); };
        agents[i].neighbourCount = neighbourhood.length;
        agents[i].draw();
      }
  }


  function Agent(x, y, rotation, speed, src) {

    this.neighbourCount = 0;
    this.collisionRadius = 100;     // the larger collision boundary (neighbours)
    this.innerCollisionRadius = 30; // inner collision boundary (seperation)
    this.rotation = rotation;
    this.speed = speed;
    this.selected = false;
    this.x = x;
    this.y = y;
    this.image = new Image();
    this.image.src = src;


    this.image.onload = function() {
        redraw();
        //document.getElementById('canvas').getContext('2d').drawImage(this,x-this.width/2,y-this.height/2);
        //document.getElementById('info').innerHTML = "x: " + x + "<br>y: " + y + "<br>r: " + rotation;
    };




  }

  Agent.prototype.testCircle = function(dx,dy) {

        this.distance = 0;

        if( dx>this.x-((this.collisionRadius*boundsWeight)/2) &&
            dx<this.x+((this.collisionRadius*boundsWeight)/2) &&
            dy>this.y-((this.collisionRadius*boundsWeight)/2) &&
            dy<this.y+((this.collisionRadius*boundsWeight)/2))
        {
            // set up distance calc from dx, dy to this.x,this.y
            var a = this.x - dx;
            var b = this.y - dy;
            this.distance = Math.sqrt( a*a + b*b );
            return true;
        } else {
          return false;
        }
  }

  Agent.prototype.forward = function() {

      this.x += this.speed*Math.sin(this.rotation*Math.PI/180);
      this.y -= this.speed*Math.cos(this.rotation*Math.PI/180);



      // if moving takes over the edge of canvas then reposition
      if(this.y<0) {
          this.y = document.getElementById('canvas').height - this.y;
          //this.x = document.getElementById('canvas').width - this.x;
      } else if(this.y>document.getElementById('canvas').height) {
          this.y = this.y-document.getElementById('canvas').height;
          //this.x = document.getElementById('canvas').width - this.x;
      }

      if(this.x<0) {
          this.x = document.getElementById('canvas').width - this.x;
          //this.y = document.getElementById('canvas').height - this.y;
      } else if(this.x>document.getElementById('canvas').width) {
          this.x = this.x-document.getElementById('canvas').width;
          //this.y = document.getElementById('canvas').height - this.y;
      }

    };

    Agent.prototype.rotate = function(degrees) {
        this.rotation += degrees;
        if(this.rotation>359) this.rotation=this.rotation-360;
        if(this.rotation<0) this.rotation=this.rotation+360;
    }

    Agent.prototype.draw = function() {
      var ctx = document.getElementById('canvas').getContext('2d');
      ctx.save();
      ctx.translate(this.x,this.y);

      if(showBounds) {
        // Draw bounding
        ctx.beginPath();
        // ctx.arc(0,0,100,0,2*Math.PI);
        ctx.rect((this.collisionRadius*boundsWeight)/-2,(this.collisionRadius*boundsWeight)/-2,this.collisionRadius*boundsWeight,this.collisionRadius*boundsWeight);
        if(this.neighbourCount>0) {
          // if a neighbour is present then colour in red
          ctx.strokeStyle='red';
        } else {
          // else colour it in black
          ctx.strokeStyle='black';
        }
        ctx.stroke();
      }

      // rotate and draw image
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.image,this.image.width/-2,this.image.height/-2);

      // Draw the select area around selected agents
      if(this.selected) {
        ctx.beginPath();
        ctx.rect( this.image.width/-2,
                  this.image.height/-2,
                  this.image.width,
                  this.image.height);
        ctx.strokeStyle='green';
        ctx.stroke();
      }

      ctx.restore();
      document.getElementById('info').innerHTML = "x: " + this.x + "<br>y: " +this.y+ "<br>r: " + this.rotation;
  }


  function clear() {
    // clear the canvas
    var w = document.getElementById('canvas').width;
    var h = document.getElementById('canvas').height;
    // console.log("W/h:" + w + "/" + h);
    document.getElementById('canvas').getContext('2d').clearRect(0,0,w,h);
  }
