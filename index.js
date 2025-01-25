import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

var keys = [];

// document.addEventListener("keydown", function (event) {
//     keys[event.key] = true;
// });

// document.addEventListener("keyup", function (event) {
//     keys[event.key] = false;
// });

var mouseX = 0;
var mouseY = 0;

window.addEventListener("mousemove", function(event) {
    mouseX = event.clientX - c.getBoundingClientRect().left;
    mouseY = event.clientY - c.getBoundingClientRect().top;
    if (!(mouseX > 0 && mouseY > 0 && mouseX < 512 && mouseY < 512)) {
        mouseDown = false;
    }
});

var mouseDown, mouseButton;

window.addEventListener("mousedown", function(event) {
    if (mouseX > 0 && mouseY > 0 && mouseX < 512 && mouseY < 512) {
        mouseDown = true;
        mouseButton = event.buttons;
    } else {
        mouseDown = false;
    }
});

window.addEventListener("mouseup", function(event) {
    mouseDown = false;
});

var cOther = document.getElementById("otherCanvas");
var ctxOther = cOther.getContext("2d");

var mode = a => {
  a = a.slice().sort((x, y) => x - y);

  var bestStreak = 1;
  var bestElem = a[0];
  var currentStreak = 1;
  var currentElem = a[0];

  for (let i = 1; i < a.length; i++) {
    if (a[i-1] !== a[i]) {
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestElem = currentElem;
      }

      currentStreak = 0;
      currentElem = a[i];
    }

    currentStreak++;
  }

  return currentStreak > bestStreak ? currentElem : bestElem;
};

var camera, scene, renderer;
var cubeList = [];
var controls;

// R L U D F B
function addCube(colorList) {
  const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 ).toNonIndexed();
		
  // vertexColors must be true so vertex colors can be used in the shader
  
  const material = new THREE.MeshBasicMaterial( { vertexColors: true } ); 
  
  // generate color data for each vertex
  
  const positionAttribute = geometry.getAttribute( 'position' );
  
  const colors = [];
  const color = new THREE.Color();
  
  for ( let i = 0; i < positionAttribute.count; i += 6 ) {
  
    color.set( Math.random() * 0xffffff );
    color.set(colorList[i / 6]);
    
    // define the same color for each vertex of a triangle
    
    colors.push( color.r, color.g, color.b );
    colors.push( color.r, color.g, color.b );
    colors.push( color.r, color.g, color.b );
    colors.push( color.r, color.g, color.b );
    colors.push( color.r, color.g, color.b );
    colors.push( color.r, color.g, color.b );
  
  }
  
  // define the new attribute
  
  geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  var mesh = new THREE.Mesh( geometry, material );
  var parentPoint = new THREE.Object3D();
  scene.add(parentPoint);
  parentPoint.add(mesh);
  cubeList.push(mesh);
}

function setObjectPosition(obj, x, y, z) {
  obj.position.x = x;
  obj.position.y = y;
  obj.position.z = z;
}

var c;

function make2x2() {
    // R L U D F B
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    addCube([0xff0000, 0xff8000, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff]);
    setObjectPosition(cubeList[0], 0.1, 0.1, 0.1);
    setObjectPosition(cubeList[1], -0.1, 0.1, 0.1);
    setObjectPosition(cubeList[2], 0.1, -0.1, 0.1);
    setObjectPosition(cubeList[3], -0.1, -0.1, 0.1);
    setObjectPosition(cubeList[4], 0.1, 0.1, -0.1);
    setObjectPosition(cubeList[5], -0.1, 0.1, -0.1);
    setObjectPosition(cubeList[6], 0.1, -0.1, -0.1);
    setObjectPosition(cubeList[7], -0.1, -0.1, -0.1);
}

var composer, outlinePass;

function init() {
  targetAngle = 0;
  angle = 0;

  instructionPointer = -1;
  instructionSet = [];

    camera = new THREE.PerspectiveCamera( 70, 512 / 512, 0.01, 10 );
    camera.position.x = (1 / Math.sqrt(3));
    camera.position.y = (1 / Math.sqrt(3));
    camera.position.z = (1 / Math.sqrt(3));

    scene = new THREE.Scene();

    make2x2();
    sortCubes();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( 512, 512 );
    
    c = renderer.domElement;
    c.id = "mainCanvas";
    c.tabIndex = "1";
    c.style.zIndex = 0;
    document.getElementById("canvasDiv").insertBefore(c, document.getElementById("otherCanvas"));

    
    c.addEventListener("keydown", function(ev) {
      keys[ev.key] = true;
    });
    c.addEventListener("keyup", function(ev) {
      keys[ev.key] = false;
    });

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = false;
    controls.enableZoom = false;


    composer = new EffectComposer( renderer );
    
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    outlinePass = new OutlinePass( new THREE.Vector2( 512, 512 ), scene, camera );
    outlinePass.edgeStrength = 100;
    outlinePass.edgeGlow = 0;
    outlinePass.edgeThickness = 1;
    // outlinePass.pulsePeriod = 9;
    outlinePass.visibleEdgeColor.set('#00ffff');
    // outlinePass.hiddenEdgeColor.set('#190a05');
    composer.addPass( outlinePass );
    outlinePass.selectedObjects = [];

  window.requestAnimationFrame(loop);
}

// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld = false){
  
  if(pointIsWorld){
      obj.parent.localToWorld(obj.position); // compensate for world coordinate
  }

  // obj.position.sub(point); // remove the offset

  // var q = new THREE.Quaternion();
  // q.setFromAxisAngle(axis, theta);
  // obj.position.applyQuaternion(q); // rotate the POSITION

  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION

  // obj.rotateOnWorldAxis(axis, theta);
  // obj.position.add(point); // re-add the offset

  if(pointIsWorld){
      obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  }

  obj.rotateOnWorldAxis(axis, theta); // rotate the OBJECT
}

function sortCubes() {
  // splicing to then sort y and z
  cubeList.sort((a, b) => a.position.x - b.position.x);
  var half1 = cubeList.slice(0, 4);
  var half2 = cubeList.slice(4, 8);
  half1.sort((a, b) => a.position.y - b.position.y);
  half2.sort((a, b) => a.position.y - b.position.y);
  var quart1 = half1.slice(0, 2);
  var quart2 = half1.slice(2, 4);
  var quart3 = half2.slice(0, 2);
  var quart4 = half2.slice(2, 4);
  quart1.sort((a, b) => a.position.z - b.position.z);
  quart2.sort((a, b) => a.position.z - b.position.z);
  quart3.sort((a, b) => a.position.z - b.position.z);
  quart4.sort((a, b) => a.position.z - b.position.z);
  cubeList = quart1.concat(quart2, quart3, quart4);
}

function resetCube() {
  scene = new THREE.Scene();
  cubeList = [];
  make2x2();
  sortCubes();
  internalCubeState = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];
  turning = false;


  // this stuff has to be here also for some reason
  composer = new EffectComposer( renderer );
    
  const renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );

  outlinePass = new OutlinePass( new THREE.Vector2( 512, 512 ), scene, camera );
  outlinePass.edgeStrength = 100;
  outlinePass.edgeGlow = 0;
  outlinePass.edgeThickness = 1;
  // outlinePass.pulsePeriod = 9;
  outlinePass.visibleEdgeColor.set('#00ffff');
  // outlinePass.hiddenEdgeColor.set('#190a05');
  composer.addPass( outlinePass );
  outlinePass.selectedObjects = [];

}

var speedSelect = document.getElementById("speedSelect");

var targetAngle = 0;
var angle = 0;
var dtheta = 0;
var thetaTolerance = 0.005;

speedSelect.addEventListener("change", function(ev) {
  if (speedSelect.value == "Slow") {
    thetaTolerance = 0.000000001;
  } else if (speedSelect.value == "Normal") {
    thetaTolerance = 0.005;
  } else if (speedSelect.value == "Fast") {
    thetaTolerance = 1;
  }
});

var internalCubeState = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];

var turning = false;
var turnMove;
function turn(type) {
  if (!turning) {
    turning = true;
    turnMove = type;
    switch(type) {
      case "R":
      {
        var temp = internalCubeState[12];
        internalCubeState[12] = internalCubeState[14];
        internalCubeState[14] = internalCubeState[15];
        internalCubeState[15] = internalCubeState[13];
        internalCubeState[13] = temp;
        temp = internalCubeState[9];
        internalCubeState[9] = internalCubeState[21];
        internalCubeState[21] = internalCubeState[18];
        internalCubeState[18] = internalCubeState[1];
        internalCubeState[1] = temp;
        temp = internalCubeState[11];
        internalCubeState[11] = internalCubeState[23];
        internalCubeState[23] = internalCubeState[16];
        internalCubeState[16] = internalCubeState[3];
        internalCubeState[3] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "L'": {
        var temp = internalCubeState[4];
        internalCubeState[4] = internalCubeState[5];
        internalCubeState[5] = internalCubeState[7];
        internalCubeState[7] = internalCubeState[6];
        internalCubeState[6] = temp;
        temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[20];
        internalCubeState[20] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[0];
        internalCubeState[0] = temp;
        temp = internalCubeState[10];
        internalCubeState[10] = internalCubeState[22];
        internalCubeState[22] = internalCubeState[17];
        internalCubeState[17] = internalCubeState[2];
        internalCubeState[2] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "U":
      {
        var temp = internalCubeState[0];
        internalCubeState[0] = internalCubeState[2];
        internalCubeState[2] = internalCubeState[3];
        internalCubeState[3] = internalCubeState[1];
        internalCubeState[1] = temp;
        temp = internalCubeState[9];
        internalCubeState[9] = internalCubeState[13];
        internalCubeState[13] = internalCubeState[17];
        internalCubeState[17] = internalCubeState[5];
        internalCubeState[5] = temp;
        temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[12];
        internalCubeState[12] = internalCubeState[16];
        internalCubeState[16] = internalCubeState[4];
        internalCubeState[4] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "D'": {
        var temp = internalCubeState[20];
        internalCubeState[20] = internalCubeState[21];
        internalCubeState[21] = internalCubeState[23];
        internalCubeState[23] = internalCubeState[22];
        internalCubeState[22] = temp;
        temp = internalCubeState[10];
        internalCubeState[10] = internalCubeState[14];
        internalCubeState[14] = internalCubeState[18];
        internalCubeState[18] = internalCubeState[6];
        internalCubeState[6] = temp;
        temp = internalCubeState[11];
        internalCubeState[11] = internalCubeState[15];
        internalCubeState[15] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[7];
        internalCubeState[7] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "F":
      {
        var temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[10];
        internalCubeState[10] = internalCubeState[11];
        internalCubeState[11] = internalCubeState[9];
        internalCubeState[9] = temp;
        temp = internalCubeState[3];
        internalCubeState[3] = internalCubeState[5];
        internalCubeState[5] = internalCubeState[20];
        internalCubeState[20] = internalCubeState[14];
        internalCubeState[14] = temp;
        temp = internalCubeState[2];
        internalCubeState[2] = internalCubeState[7];
        internalCubeState[7] = internalCubeState[21];
        internalCubeState[21] = internalCubeState[12];
        internalCubeState[12] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "B'":
      {
        var temp = internalCubeState[16];
        internalCubeState[16] = internalCubeState[17];
        internalCubeState[17] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[18];
        internalCubeState[18] = temp;
        temp = internalCubeState[13];
        internalCubeState[13] = internalCubeState[0];
        internalCubeState[0] = internalCubeState[6];
        internalCubeState[6] = internalCubeState[23];
        internalCubeState[23] = temp;
        temp = internalCubeState[15];
        internalCubeState[15] = internalCubeState[1];
        internalCubeState[1] = internalCubeState[4];
        internalCubeState[4] = internalCubeState[22];
        internalCubeState[22] = temp;
        angle = 0;
        targetAngle = -(Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "R'": {
        var temp = internalCubeState[12];
        internalCubeState[12] = internalCubeState[13];
        internalCubeState[13] = internalCubeState[15];
        internalCubeState[15] = internalCubeState[14];
        internalCubeState[14] = temp;
        temp = internalCubeState[9];
        internalCubeState[9] = internalCubeState[1];
        internalCubeState[1] = internalCubeState[18];
        internalCubeState[18] = internalCubeState[21];
        internalCubeState[21] = temp;
        temp = internalCubeState[11];
        internalCubeState[11] = internalCubeState[3];
        internalCubeState[3] = internalCubeState[16];
        internalCubeState[16] = internalCubeState[23];
        internalCubeState[23] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "L": {
        var temp = internalCubeState[4];
        internalCubeState[4] = internalCubeState[6];
        internalCubeState[6] = internalCubeState[7];
        internalCubeState[7] = internalCubeState[5];
        internalCubeState[5] = temp;
        temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[0];
        internalCubeState[0] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[20];
        internalCubeState[20] = temp;
        temp = internalCubeState[10];
        internalCubeState[10] = internalCubeState[2];
        internalCubeState[2] = internalCubeState[17];
        internalCubeState[17] = internalCubeState[22];
        internalCubeState[22] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "U'":
      {
        var temp = internalCubeState[0];
        internalCubeState[0] = internalCubeState[1];
        internalCubeState[1] = internalCubeState[3];
        internalCubeState[3] = internalCubeState[2];
        internalCubeState[2] = temp;
        temp = internalCubeState[9];
        internalCubeState[9] = internalCubeState[5];
        internalCubeState[5] = internalCubeState[17];
        internalCubeState[17] = internalCubeState[13];
        internalCubeState[13] = temp;
        temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[4];
        internalCubeState[4] = internalCubeState[16];
        internalCubeState[16] = internalCubeState[12];
        internalCubeState[12] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "D": {
        var temp = internalCubeState[20];
        internalCubeState[20] = internalCubeState[22];
        internalCubeState[22] = internalCubeState[23];
        internalCubeState[23] = internalCubeState[21];
        internalCubeState[21] = temp;
        temp = internalCubeState[10];
        internalCubeState[10] = internalCubeState[6];
        internalCubeState[6] = internalCubeState[18];
        internalCubeState[18] = internalCubeState[14];
        internalCubeState[14] = temp;
        temp = internalCubeState[11];
        internalCubeState[11] = internalCubeState[7];
        internalCubeState[7] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[15];
        internalCubeState[15] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "F'":
      {
        var temp = internalCubeState[8];
        internalCubeState[8] = internalCubeState[9];
        internalCubeState[9] = internalCubeState[11];
        internalCubeState[11] = internalCubeState[10];
        internalCubeState[10] = temp;
        temp = internalCubeState[3];
        internalCubeState[3] = internalCubeState[14];
        internalCubeState[14] = internalCubeState[20];
        internalCubeState[20] = internalCubeState[5];
        internalCubeState[5] = temp;
        temp = internalCubeState[2];
        internalCubeState[2] = internalCubeState[12];
        internalCubeState[12] = internalCubeState[21];
        internalCubeState[21] = internalCubeState[7];
        internalCubeState[7] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      case "B":
      {
        var temp = internalCubeState[16];
        internalCubeState[16] = internalCubeState[18];
        internalCubeState[18] = internalCubeState[19];
        internalCubeState[19] = internalCubeState[17];
        internalCubeState[17] = temp;
        temp = internalCubeState[13];
        internalCubeState[13] = internalCubeState[23];
        internalCubeState[23] = internalCubeState[6];
        internalCubeState[6] = internalCubeState[0];
        internalCubeState[0] = temp;
        temp = internalCubeState[15];
        internalCubeState[15] = internalCubeState[22];
        internalCubeState[22] = internalCubeState[4];
        internalCubeState[4] = internalCubeState[1];
        internalCubeState[1] = temp;
        angle = 0;
        targetAngle = (Math.PI / 2);
        dtheta = (targetAngle - angle) / 10;
        break;
      }
      default: {
        break;
      }
    }
  } else {
    switch(type) {
      case "R":
      case "R'":
      {
        outlinePass.selectedObjects = [cubeList[4], cubeList[5], cubeList[6], cubeList[7]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "R") {
            var temp = cubeList[4];
            cubeList[4] = cubeList[6];
            cubeList[6] = cubeList[7];
            cubeList[7] = cubeList[5];
            cubeList[5] = temp;
          } else {
            var temp = cubeList[4];
            cubeList[4] = cubeList[5];
            cubeList[5] = cubeList[7];
            cubeList[7] = cubeList[6];
            cubeList[6] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[4], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[5], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[6], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[7], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);

        angle += dtheta;
        break;
      }
      case "L":
      case "L'":
      {
        outlinePass.selectedObjects = [cubeList[0], cubeList[1], cubeList[2], cubeList[3]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "L") {
            var temp = cubeList[2];
            cubeList[2] = cubeList[0];
            cubeList[0] = cubeList[1];
            cubeList[1] = cubeList[3];
            cubeList[3] = temp;
          } else {
            var temp = cubeList[2];
            cubeList[2] = cubeList[3];
            cubeList[3] = cubeList[1];
            cubeList[1] = cubeList[0];
            cubeList[0] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[0], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[1], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[2], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);
        rotateAboutPoint(cubeList[3], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), dtheta, false);

        angle += dtheta;
        break;
      }
      case "U":
      case "U'":
      {
        outlinePass.selectedObjects = [cubeList[2], cubeList[3], cubeList[6], cubeList[7]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "U") {
            var temp = cubeList[2];
            cubeList[2] = cubeList[3];
            cubeList[3] = cubeList[7];
            cubeList[7] = cubeList[6];
            cubeList[6] = temp;
          } else {
            var temp = cubeList[2];
            cubeList[2] = cubeList[6];
            cubeList[6] = cubeList[7];
            cubeList[7] = cubeList[3];
            cubeList[3] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[2], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[3], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[6], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[7], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        angle += dtheta;
        break;
      }
      case "D":
      case "D'":
      {
        outlinePass.selectedObjects = [cubeList[0], cubeList[1], cubeList[4], cubeList[5]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "D") {
            var temp = cubeList[0];
            cubeList[0] = cubeList[4];
            cubeList[4] = cubeList[5];
            cubeList[5] = cubeList[1];
            cubeList[1] = temp;
          } else {
            var temp = cubeList[0];
            cubeList[0] = cubeList[1];
            cubeList[1] = cubeList[5];
            cubeList[5] = cubeList[4];
            cubeList[4] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[0], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[1], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[4], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        rotateAboutPoint(cubeList[5], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dtheta, false);
        angle += dtheta;
        break;
      }
      case "F":
      case "F'":
      {
        outlinePass.selectedObjects = [cubeList[1], cubeList[3], cubeList[5], cubeList[7]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "F") {
            var temp = cubeList[3];
            cubeList[3] = cubeList[1];
            cubeList[1] = cubeList[5];
            cubeList[5] = cubeList[7];
            cubeList[7] = temp;
          } else {
            var temp = cubeList[3];
            cubeList[3] = cubeList[7];
            cubeList[7] = cubeList[5];
            cubeList[5] = cubeList[1];
            cubeList[1] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[1], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[3], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[5], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[7], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);

        angle += dtheta;
        break;
      }
      case "B":
      case "B'":
      {
        outlinePass.selectedObjects = [cubeList[0], cubeList[2], cubeList[4], cubeList[6]];
        if (Math.abs(dtheta) < thetaTolerance) {
          dtheta = targetAngle - angle;
          turning = false;

          if (type == "B") {
            var temp = cubeList[2];
            cubeList[2] = cubeList[6];
            cubeList[6] = cubeList[4];
            cubeList[4] = cubeList[0];
            cubeList[0] = temp;
          } else {
            var temp = cubeList[2];
            cubeList[2] = cubeList[0];
            cubeList[0] = cubeList[4];
            cubeList[4] = cubeList[6];
            cubeList[6] = temp;
          }
        } else {
          dtheta = (targetAngle - angle) / 10;
        }
        rotateAboutPoint(cubeList[0], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[2], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[4], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);
        rotateAboutPoint(cubeList[6], new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), dtheta, false);

        angle += dtheta;
        break;
      }
      default: {
        break;
      }
    }
  }
}

function keyTurn() {
  if (!turning && keys["r"]) {
    turn("R");
  }
  if (!turning && keys["R"]) {
    turn("R'");
  }
  if (!turning && keys["l"]) {
    turn("L");
  }
  if (!turning && keys["L"]) {
    turn("L'");
    executeInstruction("L'")
  }
  if (!turning && keys["u"]) {
    turn("U");
  }
  if (!turning && keys["U"]) {
    turn("U'");
  }
  if (!turning && keys["d"]) {
    turn("D");
  }
  if (!turning && keys["D"]) {
    turn("D'");
  }
  if (!turning && keys["f"]) {
    turn("F");
  }
  if (!turning && keys["F"]) {
    turn("F'");
  }
  if (!turning && keys["b"]) {
    turn("B");
  }
  if (!turning && keys["B"]) {
    turn("B'");
  }
}

var programTextInput = document.getElementById("programTextInput");
var makeTurnsButton = document.getElementById("makeTurnsButton");
var runProgramButton = document.getElementById("runProgramButton");

var programText = "";

programTextInput.addEventListener("input", function(ev) {
  programTextInput.value = cleanProgramText(programTextInput.value);
});

// "turn" or "prog"
var makeTurnsOrRunProgram;

makeTurnsButton.addEventListener("click", function(ev) {
  programText = programTextInput.value;
  makeTurnsOrRunProgram = "turn";
  executeProgram(cleanProgramText(programText));
});

runProgramButton.addEventListener("click", function(ev) {
    programText = programTextInput.value;
    makeTurnsOrRunProgram = "prog";
    freeMoveToggle = false;
    freeInputToggle = false;
    resetQueued = false;
    executeProgram(cleanProgramText(programText));
});

function cleanProgramText(programText) {
  var outString = "";
  for (var i = 0; i < programText.length; i++) {
      if (["r", "l", "d", "f", "b"].includes(programText[i])) {
        if (outString.length > 0 && programText[i] != "'") {
          outString += ",";
        }
        outString += "U,U'," + programText[i].toUpperCase() + ",U',U";
    }
    if (["R", "L", "U", "D", "F", "B", "'"].includes(programText[i])) {
          if (outString.length > 0 && programText[i] != "'") {
            outString += ",";
          }
          if (programText[i] == "'" && outString.length > 0 && outString[outString.length - 1] != "'") {
              outString += programText[i];
          } else if (programText[i] != "'") {
              outString += programText[i];
          }
      }
  }
  return outString;
}

var instructionPointer = -1;
function executeProgram(program) {
  program = program.split(",");
  instructionPointer = 0;
  instructionSet = structuredClone(program);
}

var instructionSet = [];

var outputTextElement = document.getElementById("outputText");

var freeMoveToggle = false;
var freeInputToggle = false;
var scrambleMode = false;
var scrambleCount = 0;
var resetQueued = false;
var queueMove = null;
function executeInstruction(instr) {
  switch(instr) {
    case "U": {
      freeMoveToggle = !freeMoveToggle;
      break;
    }
    case "F": {
      resetQueued = true;
      break;
    }
    case "F'": {
      scrambleMode = true;
      scrambleCount = 13 + Math.floor(5 * Math.random());
      break;
    }
    case "R": {
      queueMove = ["U", "L", "F", "R", "B", "D"][mode([internalCubeState[12], internalCubeState[13], internalCubeState[14], internalCubeState[15]])];
      break;
    }
    case "R'": {
      queueMove = ["U'", "L'", "F'", "R'", "B'", "D'"][mode([internalCubeState[12], internalCubeState[13], internalCubeState[14], internalCubeState[15]])];
      break;
    }
    case "L": {
      outputTextElement.innerText += String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0]));
      break;
    }
    case "L'": {
      freeInputToggle = !freeInputToggle;
      break;
    }
    case "D": {
      instructionPointer = instructionSet.length;
      break;
    }
    case "D'": {
      instructionPointer += (internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0])) - 648;
      break;
    }
    case "B": {
      instructionPointer++;
      break;
    }
    case "B'": {
      if (["R","L","U","D","F","B"].includes(String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1])))) {
        if (internalCubeState[0] != 0) {
          instructionSet = [String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1])) + "'"].concat(instructionSet);
        } else {
          instructionSet = [String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]))].concat(instructionSet);
        }
        instructionPointer++;
      }
      programTextInput.value = instructionSet.join(",");
      break;
    }
  }
}

function main() {
  if (freeInputToggle) {
    keyTurn();
  }

  if (!turning) {
    outlinePass.selectedObjects = [];
  }

  if (!turning && resetQueued) {
    resetCube();
    resetQueued = false;
    if (instructionPointer >= instructionSet.length) {
      instructionPointer = -1;
    }
  }

  if (!turning && queueMove != null) {
    turn(queueMove);
    queueMove = null;
  }

  if (instructionPointer != -1) {
    if (makeTurnsOrRunProgram == "turn") {
      if (!turning) {
        turn(instructionSet[instructionPointer]);
        instructionPointer++;
      }
      if (instructionPointer >= instructionSet.length) {
        instructionPointer = -1;
      }
    } else if (makeTurnsOrRunProgram == "prog") {
      if (!freeInputToggle) {
        if (!scrambleMode) {
          if (!turning) {
            turn(instructionSet[instructionPointer]);
            if ((!freeMoveToggle) || (freeMoveToggle && instructionSet[instructionPointer] == "U")) {
              executeInstruction(instructionSet[instructionPointer]);
            }
            instructionPointer++;
          }
          if (!scrambleMode && !resetQueued && instructionPointer >= instructionSet.length) {
            instructionPointer = -1;
          }
        } else {
          // scramble
          if (scrambleCount > 0) {
            if (!turning) {
              turn(["R", "L", "U", "D", "F", "B", "R'", "L'", "U'", "D'", "F'", "B'"][Math.floor(Math.random() * 12)]) // random
              scrambleCount--;
            }
          } else {
            scrambleMode = false;
            if (instructionPointer >= instructionSet.length) {
              instructionPointer = -1;
            }
          }
        }
      }
    }
  }
  if (turning) {
    turn(turnMove);
  }

  // renderer.render( scene, camera );
  composer.render( scene, camera );

  renderOther();
}

// var freeMoveToggle = false;
// var freeInputToggle = false;
// var scrambleMode = false;
// var scrambleCount = 0;
// var resetQueued = false;
// var queueMove = null;
function renderOther() {
  ctxOther.beginPath();
  ctxOther.fillStyle = (freeMoveToggle) ? "#00ff00ff" : "#ff0000ff";
  ctxOther.fillRect(0, 0, 80, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.font = "15px Arial";
  ctxOther.fillText("Free Move", 4, 15);

  ctxOther.beginPath();
  ctxOther.fillStyle = (freeInputToggle) ? "#00ff00ff" : "#ff0000ff";
  ctxOther.fillRect(0, 20, 42, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.font = "15px Arial";
  ctxOther.fillText("Input", 4, 35);

  ctxOther.beginPath();
  ctxOther.fillStyle = (scrambleMode) ? "#00ff00ff" : "#ff0000ff";
  ctxOther.fillRect(0, 40, 70, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.font = "15px Arial";
  ctxOther.fillText("Scramble", 4, 55);

  ctxOther.beginPath();
  ctxOther.fillStyle = (instructionPointer == -1) ? "#00ff00ff" : "#ff0000ff";
  ctxOther.fillRect(0, 60, 35, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.font = "15px Arial";
  ctxOther.fillText("End", 4, 75);

  // clear bottom text
  ctxOther.beginPath();
  ctxOther.fillStyle = "#000000ff";
  ctxOther.fillRect(0, 472, 512, 20);
  // write utf 8 text
  ctxOther.beginPath();
  ctxOther.font = "15px Arial";
  var a = ctxOther.measureText("Reading Char " + String(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0])) + ": " + String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0])));
  ctxOther.fillStyle = "#ffffffff";
  ctxOther.fillRect(0, 472, 10 + a.width, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.fillText("Reading Char " + String(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0])) + ": " + String.fromCharCode(internalCubeState[3] + (6*internalCubeState[2]) + (36*internalCubeState[1]) + (216*internalCubeState[0])), 4, 487);

  // clear bottom text
  ctxOther.beginPath();
  ctxOther.fillStyle = "#000000ff";
  ctxOther.fillRect(0, 492, 512, 20);
  // write utf 8 text
  ctxOther.beginPath();
  ctxOther.font = "15px Arial";
  var a = ctxOther.measureText("Next Move: " + String(instructionSet[instructionPointer]) + " (" + String(instructionPointer) + ")");
  ctxOther.fillStyle = "#ffffffff";
  ctxOther.fillRect(0, 492, 10 + a.width, 20);
  ctxOther.fillStyle = "#000000ff";
  ctxOther.fillText("Next Move: " + String(instructionSet[instructionPointer]) + " (" + String(instructionPointer) + ")", 4, 507);
}

var deltaTime = 0;
var deltaCorrect = (1 / 8);
var prevTime = Date.now();
function loop() {
    deltaTime = (Date.now() - prevTime) * deltaCorrect;
    prevTime = Date.now();

    main();
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(init);
