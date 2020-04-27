import * as THREE from '../build/three.module.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './jsm/loaders/DRACOLoader.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import { TWEEN } from './jsm/libs/tween.module.min.js';
import Stats from './jsm/libs/stats.module.js';
import {
    NodeFrame,
    FloatNode,
    ColorNode,
    ConstNode,
    ExpressionNode,
    MathNode,
    OperatorNode,
    TimerNode,
    PhongNodeMaterial
} from './jsm/nodes/Nodes.js';
var frame = new NodeFrame(), clock = new THREE.Clock();
var turnLeft = false, turnRight = false, isFlash = false;
var camera, scene, renderer, controls;
var stats, carModel, materialsLib;
var spotLight, spotLight2, dirLight, pointLight, pointLight2;
var autoRot = false; var bodyMatNumber = 6;
var carParts = {
    body: [],
    frontLight: [],
    rearLight: [],
    turnSignal: []
};
var wheels = [];
//change camera view 
var targetPosition;
// 
var changeFrontLightButton = document.getElementById('front-light');
var changeRearLightButton = document.getElementById('rear-light');
var autoRotate = document.getElementById('auto-camera');
var loadingScreen = document.getElementById('loading-screen');
//Audio Control 
var listener, sound, audioLoader, isPlay;
var soundControl = document.getElementById('speaker-button');
//Full Screen 
var fullScreenButton = document.getElementById('full-screen');
var isFull = false;
//wheel 
var isRun = false;
var runcar = document.getElementById('run-car');
//change color 
var blueBtn = document.getElementById('select-blue');
var greenBtn = document.getElementById('select-green');
var whiteBtn = document.getElementById('select-white');
var blackBtn = document.getElementById('select-black');
var orangeBtn = document.getElementById('select-orange');
var silverBtn = document.getElementById('select-silver');
var redBtn = document.getElementById('select-red');
//Rear Light 
var gemBackMaterial;
var uniforms, lightShaft, lightShaft2;
//Reset View
var closeBtn = document.getElementById('close-button');
var changeDrBtn = document.getElementById('slider-button');
init();
animate();
playBackgroundMusic();
function init() {
    var container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(-5, 55, 170);
    // camera.position.set(150, 100, 0); 
    scene = new THREE.Scene();
    dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(10, 10, 10);
    dirLight.position.multiplyScalar(100);
    scene.add(dirLight);
    // scene.add(new THREE.AxesHelper(500)); 
    //  scene.fog = new THREE.Fog( 0xd7cbb1, 1, 80 ); 
    new RGBELoader().setDataType(THREE.UnsignedByteType)
        .setPath('textures/equirectangular/').load('quarry_01_1k.hdr', function (texture) {
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();
            envMap.envMapIntensity = 1;
            scene.background = envMap;
            scene.environment = envMap;
        });
    initGarage();
    //initCar();
   // initMaterials();
    initFucntion();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    //check FPS
    stats = new Stats();
    container.appendChild(stats.dom);


    window.addEventListener('resize', onWindowResize, false);
    renderer.setAnimationLoop(render);
    initCamera();
    targetPosition = new THREE.Vector3(150, 100, 0);
    tweenMove(targetPosition, 5000);
}
function resetView() {
    controls.minAzimuthAngle = - Infinity;
    controls.maxAzimuthAngle = Infinity;
    scene.add(dirLight);
    scene.remove(pointLight);
    scene.remove(pointLight2);
    scene.remove(spotLight);
    scene.remove(spotLight2);
    scene.remove(lightShaft);
    scene.remove(lightShaft2);
    scene.remove(spotLight2);
    isRun = false;
    for (var i = 0; i < wheels.length; i++) {
        wheels[i].rotation.x = 1.5707964611537577;
        wheels[i].rotation.y = 0;
    }
    normalLight();
    targetPosition = new THREE.Vector3(150, 100, 0);
    tweenMove(targetPosition, 4000);
}
function startColorCarLight() {
    carParts.rearLight.forEach(part => part.material = new THREE.MeshStandardMaterial({
        color: 0xf43c3c, metalness:
            1.0, roughness: 0
    }));
    carParts.turnSignal.forEach(part => part.material = new THREE.MeshStandardMaterial({
        color: 0xbded37, metalness: 1.0, roughness: 0
    }));
    carParts.frontLight.forEach(part => part.material = new THREE.MeshStandardMaterial({ color: 0xefea79, metalness: 1.0, roughness: 0 }));
}
function initGarage() {
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('js/libs/draco/gltf/');
    var loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load('models/gltf/garage_done.glb', function (gltf) {
        var garage =
            gltf.scene;
        garage.scale.set(0.3, 0.3, 0.3);
        garage.position.set(0, -25, -5);
        garage.receiveShadow = true;
        scene.add(garage);
    });
}
function initCar() {
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('js/libs/draco/gltf/');
    //Load Screen Controller 
    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        //console.log(item, loaded, total);
    };
    manager.onLoad = function () {
        loadingScreen.classList.add('fade-out');
        // optional: remove loader from DOM via event listener 
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    };
    manager.onError = function () {
        //console.log('there has been an error');
    };
    //End Load Screen Controller 
    var loader = new GLTFLoader(manager);
    loader.setDRACOLoader(dracoLoader);
    loader.load('models/gltf/car.glb', function (gltf) {
        carModel = gltf.scene.children[0];
        carModel.scale.set(0.2, 0.2, 0.2);
        carModel.position.set(10, 0, 0);
        carModel.castShadow = true;
        // shadow 
        var texture =
            new THREE.TextureLoader().load('models/gltf/ferrari_ao.png');
        var shadow = new THREE.Mesh(new THREE.PlaneBufferGeometry(0.655 * 4, 1.3 * 4),
            new THREE.MeshBasicMaterial({
                map: texture, opacity: 0.7, transparent: true
            }));
        shadow.rotation.x = - Math.PI / 2;
        shadow.scale.set(170, 170, 170);
        shadow.position.set(-35, 0, 0);
        shadow.renderOrder = 2;
        carModel.add(shadow);
        scene.add(carModel);
        // car parts for material selection 
        carParts.body.push(carModel.getObjectByName('voxe_02'));
        //transparency model 
        var texture = new THREE.TextureLoader().load('textures/carcar_done.png');
        carModel.getObjectByName('dongco_04').material = new THREE.MeshBasicMaterial({
            map: texture, opacity: 1, transparent: false
        });
        carModel.getObjectByName('biensoxe').material = new THREE.MeshBasicMaterial({
            map: texture
        });
        // carParts.body.forEach(part => part.material = bodyMat2); 
        carParts.frontLight.push(
            carModel.getObjectByName('denpha_trai'),
            carModel.getObjectByName('denpha_phai')
        );
        carParts.rearLight.push(
            carModel.getObjectByName('denhau_trai'),
            carModel.getObjectByName('denhau_phai')
        );
        carParts.turnSignal.push(
            carModel.getObjectByName('xinhan_trai'),
            carModel.getObjectByName('xinhan_phai')
        );
        wheels.push(
            carModel.getObjectByName('banhsau_phai'),
            carModel.getObjectByName('banhsau_trai'),
            carModel.getObjectByName('banhtruoc_phai'),
            carModel.getObjectByName('banhtruoc_trai')
        );
        startColorCarLight();
        updateMaterials();

    });
    loader.load('models/gltf/CW.glb', function (gltf) {
        var CW =
            gltf.scene.children[0];
        CW.scale.set(0.3, 0.3, 0.3);
        CW.position.set(-160, 10, -100);
        CW.getObjectByName('Text001').material = new THREE.MeshStandardMaterial({
            color: 0xaa03d, metalness: 1.0, roughness: 0, name: 'orange'
        });
        CW.rotation.x = Math.PI / 2;
        CW.rotation.z = -Math.PI / 3;
        CW.receiveShadow = true;
        scene.add(CW);
    });
}
function initMaterials() {
    materialsLib = {
        main: [
            new THREE.MeshStandardMaterial({ color: 0xff4400, metalness: 1.0, roughness: 0, name: 'orange' }),
            new THREE.MeshStandardMaterial({ color: 0x001166, metalness: 1.0, roughness: 0, name: 'blue' }),
            new THREE.MeshStandardMaterial({ color: 0x990000, metalness: 1.0, roughness: 0, name: 'red' }),
            new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1.0, roughness: 0, name: 'black' }),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0, name: 'white' }),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0, name: 'silver' }),
            new THREE.MeshStandardMaterial({ color: 0x21ce51, metalness: 1.0, roughness: 0, name: 'green' })
        ],
    };
}
function initFucntion() {
    closeBtn.addEventListener('click', function () {
        resetView();
        startColorCarLight();
    });
    autoRotate.addEventListener('click', updateCamera);
    changeFrontLightButton.addEventListener('click', frontLight);
    changeRearLightButton.addEventListener('click', rearLight);
    changeDrBtn.addEventListener('click', changeCameraForDir);
    soundControl.addEventListener('click', backgroundMusicControl);
    runcar.addEventListener('click', runCar);
    orangeBtn.addEventListener('click', function () {
        setColor(0);
    });
    blueBtn.addEventListener('click', function () {
        setColor(1);
    });
    redBtn.addEventListener('click', function () {
        setColor(2);
    });
    blackBtn.addEventListener('click', function () {
        setColor(3);
    });
    whiteBtn.addEventListener('click', function () {
        setColor(4);
    });
    silverBtn.addEventListener('click', function () {
        setColor(5);
    });
    greenBtn.addEventListener('click', function () {
        setColor(6);
    });
}
// set materials to car 
function setColor(temp) {
    var bodyMat = materialsLib.main[temp];
    carParts.body.forEach(part => part.material = bodyMat);
}
function updateMaterials() {
    if (bodyMatNumber < materialsLib.main.length) {
        var bodyMat = materialsLib.main[bodyMatNumber];
        carParts.body.forEach(part => part.material = bodyMat);
        bodyMatNumber++;
    }
    else {
        bodyMatNumber = 0;
        var bodyMat = materialsLib.main[bodyMatNumber];
        carParts.body.forEach(part => part.material = bodyMat);
        bodyMatNumber++;
    }
}
function updateCamera() {
    if (!autoRot) {
        autoRot = true;
        autoRotateCam();
    }
    else {
        autoRot = false;
    }
}
function runCar() {
    autoRot = false;
    targetPosition = new THREE.Vector3(142, 93, 60);
    tweenMove(targetPosition, 5000);
    isRun = true;
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function render() {

    if (isRun) {
        var time = performance.now() / 500;
        for (var i = 0; i < wheels.length; i++) {
            wheels[i].rotation.x = time * Math.PI;
        }
    }
    autoRotateCam();
    TWEEN.update();
    controls.update();
    stats.update();
    renderer.render(scene, camera);
    if (turnLeft) {
        var delta = clock.getDelta();
        frame.update(delta);
        var mesh = carParts.turnSignal[1];
        frame.updateNode(mesh.material);
    }

    else if (turnRight) {
        var delta = clock.getDelta();
        frame.update(delta);
        var mesh = carParts.turnSignal[0];
        frame.updateNode(mesh.material);
    }

}
function frontLight() {
    autoRot = false;
    targetPosition = new THREE.Vector3(117, 110, 120);
    tweenMove(targetPosition, 5000);
    scene.remove(dirLight);
    spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(20, 30, 40);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.05;
    spotLight.decay = 2;
    spotLight.distance = 200;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 480;
    spotLight.shadow.mapSize.height = 480;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    scene.add(spotLight);
    scene.add(spotLight.target);
    spotLight.target.position.x = 20;
    spotLight.target.position.y = 30;
    spotLight.target.position.z = 100;
    spotLight2 = spotLight.clone();
    spotLight2.position.set(-20, 30, 40);
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    spotLight2.target.position.x = - 20;
    spotLight2.target.position.y = 30;
    spotLight2.target.position.z = 100;
    carParts.frontLight.forEach(part => part.material = new THREE.MeshStandardMaterial({ color: 0xf9ff00, metalness: 1.0, roughness: 0 }));
    initLightCar();
    // controls.minAzimuthAngle = - Math.PI / 6;
    // controls.maxAzimuthAngle = Math.PI / 3;
}
function rearLight() {
    autoRot = false;
    targetPosition = new THREE.Vector3(1, 55, -170);
    tweenMove(targetPosition, 5000);
    gemBackMaterial = new THREE.MeshPhysicalMaterial({
        map: null, color: 0xff0000, metalness: 0, roughness: 0, opacity: 1, side: THREE.FrontSide, transparent:
            true, envMapIntensity: 5, premultipliedAlpha: true
        // TODO: Add custom blend mode that modulates background color by this materials color.
    });
    carParts.rearLight.forEach(part => part.material = gemBackMaterial);
    scene.remove(dirLight);
    pointLight = new THREE.PointLight(0xff0000, 2, 50);
    pointLight.position.set(20, 35, -65);
    pointLight2 = new THREE.PointLight(0xff0000, 2, 50);
    pointLight2.position.set(-20, 35, -65);
    scene.add(pointLight);
    scene.add(pointLight2);
    // var sphereSize = 1;
    // var pointLightHelper1 = new THREE.PointLightHelper(pointLight, sphereSize);
    // var pointLightHelper2 = new THREE.PointLightHelper(pointLight2, sphereSize);
    // scene.add(pointLightHelper1);
    // scene.add(pointLightHelper2);

}
function tweenMove(targetPosition, duration) {
    controls.enabled = false;
    var position = new THREE.Vector3().copy(camera.position);
    var tween = new TWEEN.Tween(position)
        .to(targetPosition, duration)
        .easing(TWEEN.Easing.Back.InOut)
        .onUpdate(function () {
            camera.position.copy(position);
            camera.lookAt(controls.target);
        })
        .onComplete(function () {
            camera.position.copy(targetPosition);
            camera.lookAt(controls.target);
            controls.enabled = true;
        }).start();
}
function autoRotateCam() {

    if (autoRot) {
        var timerRotate = -performance.now() * 0.0001;
        camera.position.x = Math.cos(timerRotate) * 150;
        camera.position.z = -Math.sin(timerRotate) * 150;
        camera.position.y = 100;
        camera.lookAt(0, 0, 0);
    }
    else {
        // camera.position.set(150, 100, 0);
    }
    renderer.render(scene, camera);

}
function animate() {
    // TWEEN.update();
    // controls.update();
    // requestAnimationFrame(animate);
    // stats.update();
    // render();
    // if (turnLeft) {
    //     var delta = clock.getDelta();
    //     frame.update(delta);
    //     var mesh = carParts.turnSignal[1];
    //     frame.updateNode(mesh.material);
    // }

    // else if (turnRight) {
    //     var delta = clock.getDelta();
    //     frame.update(delta);
    //     var mesh = carParts.turnSignal[0];
    //     frame.updateNode(mesh.material);
    // }
}
function onTransitionEnd(event) {
    event.target.remove();
}
function playBackgroundMusic() {
    isPlay = true;
    listener = new THREE.AudioListener();
    camera.add(listener);
    // create a global audio source
    sound = new THREE.Audio(listener);
    // load a sound and set it as theAudio object's buffer 
    audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/Point_Green_Getdown.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
        sound.play();
    });
}
function backgroundMusicControl() {
    if (isPlay) {
        sound.pause();
        isPlay = false;
    }
    else {
        sound.play();
        isPlay = true;
    }
} //Full Screen Function 
var elem = document.getElementById("container");
fullScreenButton.addEventListener('click', openFullscreen);
function openFullscreen() {
    if (!isFull) {
        isFull = true;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
        else if (elem.mozRequestFullScreen) {
            /* Firefox */
            elem.mozRequestFullScreen();
        }
        else if (elem.webkitRequestFullscreen) {
            /* Chrome, Safari & Opera*/
            elem.webkitRequestFullscreen();
        }
        else if (elem.msRequestFullscreen) {
            /* IE/Edge */
            elem.msRequestFullscreen();
        }
    } else {
        isFull = false;
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            /* Firefox */
            document.mozCancelFullScreen();
        }
        else if (document.webkitExitFullscreen) {
            /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) {
            /* IE/Edge */
            document.msExitFullscreen();
        }
    }
}
$(document).keyup(function (e) {
    if (e.keyCode === 27) {
        isFull = false;
    }
}); //End of full screen Function 
function initCamera() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.minDistance = 100;
    controls.maxDistance = 200;
    controls.enablePan = false;
    controls.rotateSpeed = 0.1;
    controls.maxPolarAngle = Math.PI / 2.5;
}
function changeCameraForDir() {
    autoRot = false;
    targetPosition = new THREE.Vector3(100, 56, -140);
    tweenMove(targetPosition, 5000);
}
function changeDirector(value) {
    if (value == 10) {
        for (var i = 2; i < 4; i++) {
            wheels[i].rotation.y = 0;
        }
    }
    else if (value < 10) {
        for (var i = 2; i < 4; i++) {
            wheels[i].rotation.y = 1 - (value * 0.1);
        }
    }
    else if (value > 10) {
        for (var i = 2; i < 4; i++) {
            wheels[i].rotation.y = 1 + (-value * 0.1);
        }
    }
}
function initLightCar() {
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load('textures/flareHead.jpg');
    uniforms = {
        // controls how fast the ray attenuates when the camera comes closer
        attenuation: {
            value: 10
        },
        // controls the speed of the animation
        speed: {
            value: 2
        },
        // the color of the ray
        color: {
            value: new THREE.Color(0xf9ff00)
        },
        // the visual representation of the ray highly depends on the used texture
        colorTexture: {
            value: texture
        },
        // global time value for animation
        time: {
            value: 0
        },
        // individual time offset so rays are animated differently if necessary
        timeOffset: {
            value: 0
        }
    };
    var lightShaftMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        side: THREE.DoubleSide
    });
    var lightShaftGeometry = new THREE.PlaneBufferGeometry(1, 3);
    lightShaft = new THREE.Mesh(lightShaftGeometry, lightShaftMaterial);
    lightShaft.position.set(25, 27, 63);
    lightShaft.scale.set(30, 30, 30);
    lightShaft.rotation.set(0, 45, 45);
    lightShaft2 = lightShaft.clone();
    lightShaft2.position.set(-23, 27, 63);
    lightShaft2.scale.set(30, 30, 30);
    lightShaft2.rotation.set(0, -45, 45);
    scene.add(lightShaft);
    scene.add(lightShaft2);
}
function updateMaterial(mesh) {
    if (mesh.material) mesh.material.dispose();
    var mtl = new PhongNodeMaterial();
    var time = new TimerNode();
    var speed = new FloatNode(1);
    var color = new ColorNode(0xbafc00);
    var timeSpeed = new OperatorNode(
        time,
        speed,
        OperatorNode.MUL
    );
    var sinCycleInSecs = new OperatorNode(
        timeSpeed,
        new ConstNode(ConstNode.PI2),
        OperatorNode.MUL
    );
    var cycle = new MathNode(sinCycleInSecs, MathNode.SIN);
    var cycleColor = new OperatorNode(
        cycle,
        color,
        OperatorNode.MUL
    );
    var cos = new MathNode(cycleColor, MathNode.SIN);
    mtl.color = new ColorNode(0);
    mtl.emissive = cos;
    var transformer = new ExpressionNode("position + 0.0 * " + Math.random(), "vec3", []);
    mtl.transform = transformer;
    // build shader ( ignore auto build )
    mtl.build();
    // set material
    mesh.material = mtl;
}
window.fn1 = function fn1(value) {
    changeDirector(value);
}
window.turnLeft1 = function turnLeft1() {
    if (!turnLeft) {
        turnLeft = true;
        turnRight = false;
        isFlash = true;
        updateMaterial(carParts.turnSignal[1]);
        carParts.turnSignal[0].material = new THREE.MeshStandardMaterial({
            color: 0xbded37, metalness: 1.0, roughness: 0
        });
    }
}
window.turnRight1 = function turnRight1() {
    if (!turnRight) {
        turnLeft = false;
        turnRight = true;
        isFlash = true;
        updateMaterial(carParts.turnSignal[0]);
        carParts.turnSignal[1].material = new THREE.MeshStandardMaterial({
            color: 0xbded37, metalness: 1.0, roughness: 0
        });

    }
}
window.normalLight = function normalLight() {
    startColorCarLight();
    turnLeft = false;
    turnRight = false;
}


