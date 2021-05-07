// Bakeoff #2 - Seleção de Alvos e Fatores Humanos
// IPM 2020-21, Semestre 2
// Entrega: até dia 7 de Maio às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 3 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 46;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the simulation and bake-off days

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING;
let continue_button;

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (48 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			 = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)

// Feedback
let comments_input;
let submit_button;
let retry_button;

//sounds used
let miss1;
let miss2;
let miss3;
let miss4;
let miss5;
let sound;

function preload() {
  miss1 = loadSound("guitarHeroFailed1.mp3");
  miss1.setVolume(0.3)
  miss2 = loadSound("guitarHeroFailed2.mp3");
  miss2.setVolume(0.3)
  miss3 = loadSound("guitarHeroFailed3.mp3");
  miss3.setVolume(0.3)
  miss4 = loadSound("guitarHeroFailed4.mp3");
  miss4.setVolume(0.3)
  miss5 = loadSound("guitarHeroFailed5.mp3");
  miss5.setVolume(0.3)
  sound = loadSound("darude.mp3");
}

//Plays a random miss sound
function playRandomMiss() {
  var toPlay = random(0,4.99);
  toPlay = int(toPlay);
  switch (toPlay) {
    case 0:
      miss1.play();
      break;
    case 1:
      miss2.play();
      break;
    case 2:
      miss3.play();
      break;
    case 3:
      miss4.play();
      break;
    case 4:
      miss5.play();
      break;
    default:
      break;
  }
}

// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  randomizeTrials();         // randomize the trial order at the start of execution
  textFont("Arial", 18);     // font size for the majority of the text
  drawUserIDScreen();        // draws the user input screen (student number and display size)
}

// Draws an arrow from base to vec-margin
function drawArrow(base, vec, color, margin) {
  let connectingVector = createVector(vec.x-base.x, vec.y-base.y);
  let weight = 6;
  stroke(color);
  strokeWeight(weight);
  fill(color);
  translate(base.x, base.y);
  rotate(connectingVector.heading());
  line(0, 0, connectingVector.mag() - weight - margin, 0)
  let arrowSize = 15;
  translate(connectingVector.mag() - arrowSize - weight - margin, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
}

// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets)
  {
    // The user is interacting with the 4x4 target grid
    background(color(0,0,0));        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    
    if (current_trial === 0) {
      noStroke();
      text("Click on the yellow ball to start.",width/2 - textWidth("Click on the first yellow ball to start.")/2, 60+display_size*3);
    }

    fill(color(255,255,255));
    textAlign(LEFT);
    noStroke();
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    // Draw all 16 targets
    for (var i = 0; i < 16; i++) drawTarget(i);
    if (current_trial+1 < trials.length && trials[current_trial] != trials[current_trial+1]) {
      let nextTarget = getTargetBounds(trials[current_trial+1]);
      let target = getTargetBounds(trials[current_trial]);
      let v0 = createVector(target.x, target.y);
      let v1 = createVector(nextTarget.x, nextTarget.y);
      drawArrow(v0, v1, "white", nextTarget.w/2);
    }
  }
}

function thank() {
  let opinion = comments_input.value()
  submit_button.remove();
  comments_input.remove();
  text("Thank you for your participation!",width/2, 900);
  
  let c = color(0, 0, 0);
  fill(c);
  noStroke();
  ellipse(width/2,800,width,40,1);

  let db_ref = database.ref("Opinions");
  db_ref.push(opinion);
}

// Print and save results at the end of 48 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  if (attempt > 0) {
    
    text("If you have any suggestions or advices that would increase your performance, please write them down below.", width/2, 800);
    comments_input = createInput('');                                 // create input field
    comments_input.position(width/2-200, 830);
    comments_input.size(400,30);
    submit_button = createButton('SUBMIT');
    submit_button.position(width/2 - submit_button.width/2, 900);
    submit_button.mouseReleased(thank);
    retry_button = createButton("RETRY");
    retry_button.position(width/2 - retry_button.width/2, 720);
    retry_button.mouseReleased(continueTest);
  }
  // Print Fitts IDS (one per target, -1 if failed selection)
  // 

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
    } 
  
  // Send data to DB (DO NOT CHANGE!)
    if (BAKE_OFF_DAY)
    {
        if (attempt = 0)
        {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
        }
        // Add user performance results
        let db_ref = database.ref("G"+GROUP_NUMBER);
        db_ref.push(attempt_data);
    }
    else
    {
        // Change the firebase config
        var firebaseConfig = {
            apiKey: "AIzaSyAXD8ZiSlhkJmddixMS1u_orycui6TPa3E",
            authDomain: "bake-off-2-d4b75.firebaseapp.com",
            databaseURL: "https://bake-off-2-d4b75-default-rtdb.europe-west1.firebasedatabase.app/",
            storageBucket: "bake-off-2-d4b75.appspot.com"
        };
        if (attempt === 0)
        {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
        }
        // Add user performance results
        let db_ref = database.ref("Third Iteration");
        db_ref.push(attempt_data);
    }

  if (attempt >= 1)
  {
    var topUserPostsRef = firebase.database().ref("Third Iteration").orderByChild('target_w_penalty').limitToFirst(10);
    text ("Leaderboards", width/2, 280)
    var yIncrease = 25;
    var places = 1;
    topUserPostsRef.on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            var name = childSnapshot.val().assessed_by;
            var score = childSnapshot.val().target_w_penalty;
            text(places + " - " + name+ " with "+ score + " seconds.", width/2, 280+yIncrease);
            places += 1;
            yIncrease += 25;
        });
    });
  }
}



// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);   
    
    // Check to see if the mouse cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2) {
      hits++;
      sound.setVolume(0.1);
      
      let d = dist(target.x, target.y, mouseX, mouseY)/ target.w;
     let res = round(Math.log2(d +1), 3);     
     fitts_IDs[current_trial+1] = res;
      
    }
    else {
      misses++;
      fitts_IDs[current_trial+1] = -1;
      playRandomMiss();
      sound.setVolume(0.01);
    }
    current_trial++;                 // Move on to the next trial/target
    
    if (current_trial === 1) {
      ellipse(width/2, height/4,width,30);
    }
    
    // Check if the user has completed all 48 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      sound.stop();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    } 
  }
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);             

  // Check whether this target is the target the user should be trying to select
  if (trials[current_trial] == i) 
  {
    stroke(color(255,255,255));
    strokeWeight(2);
    fill(color(224, 202, 60));
    // Highlights the target the user should be trying to select
    // with a white border
    if (trials[current_trial + 1 ] == i) {
      stroke(color(217, 196, 76));
      strokeWeight(4);
    }
    circle(target.x, target.y, target.w);
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2) {
      fill(color(196, 178, 122));
      circle(target.x, target.y, target.w);
      cursor(HAND);
    }
    else cursor(ARROW);
    // Remember you are allowed to access  targets (i-1) and (i+1)
    // if this is the target the user should be trying to select
    //
  }
  else if (trials[current_trial + 1] == i) 
  { 
    // Highlights the target the user should be trying to select
    // with a white border
    stroke(color(217, 196, 76));
    strokeWeight(6);
    fill(color(135, 167, 176));
    circle(target.x, target.y, target.w);
    
    // Remember you are allowed to access targets (i-1) and (i+1)
    // if this is the target the user should be trying to select
    //
  }
  else {
    noStroke();
    // Does not draw a border if this is not the target the user
    // should be trying to select
    fill(color(135, 167, 176));
    circle(target.x, target.y, target.w);
    // Draws the target
  }

  if (i == trials[current_trial] && i == trials[current_trial + 1]) {
    //noStroke();
    fill(color(255, 255, 255));
    textAlign(CENTER, CENTER);
    text('x2', target.x, target.y);
  }
}

// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  sound.play();
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  
  continue_button.remove();
  if (attempt > 1) {
    retry_button.remove();
    submit_button.remove();
    comments_input.remove();
  }
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        
  
  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}