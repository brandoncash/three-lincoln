'use strict';

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

var container, stats;

var camera, cameraTarget, scene, renderer;
var effectComposer;
var environmentMap;
var cubeCamera;
var renderPass, ssaaRenderPass, ssaoPass, texturePass, bloomPass, filmPass;
var statue, statueChild, grid, floor;
var ambientLight, spotlightPrimary, spotlightSecondary;
var clock, textureLoader, loadingManager;
var modifiedMaterialShader;
var raycaster, raycasterLine;
var position = new THREE.Vector3();
var orientation = new THREE.Euler();
var size = new THREE.Vector3( 10, 10, 10 );
var up = new THREE.Vector3( 0, 1, 0 );
var mouseMoved = false;
var intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3()
};
var mouse = new THREE.Vector2();
var mouseHelper;
var decalMaterial, decal, decals = [];

var statues = {
    'tombstone-flavius-helius': {
        title: 'Flavius Helius Tombstone',
    },
    'nymph-preparing-for-the-bath': {
        title: 'Nymph Preparing for the Bath',
        artist: 'Gibson, John',
        material: 'Stone, marble',
        location: 'The Usher Gallery, Lincoln',
        inscription: 'I Gibson ne fecit Roma',
        referencePhoto: 'https://silvertiger4.files.wordpress.com/2015/07/p1080053.jpg', // FIXME: find a cc-0 one
    },
    'venus-kissing-cupid': {
        title: 'Venus Kissing Cupid',
    },
    'the-marble-player': {
        title: 'The Marble Player'
    }
};
var meshes = {};

// NOTE: All from https://cc0textures.com/
var textures = {
    // Preset ones
    'wireframe': { ignore: true },
    'fresnel': { ignore: true },
    'lava': { ignore: true },
    'warpy': { ignore: true },
    'rust': { ignore: true },
    'hyper': { ignore: true },
    'neon': { ignore: true },
    'chrome': { ignore: true },
    'gold': { ignore: true },
    'bronze': { ignore: true },
    'modified': { ignore: true },
    // Texture-only ones
    'Concrete06': {
        aoMap: true,
        roughness: 1.0,
        resolutions: [ 2048 ],
    },
    'Fabric06': {
        resolutions: [ 2048 ],
    },
    'Fabric08': {
        aoMap: true,
        resolutions: [ 2048 ],
    },
    'Fabric09': {
        aoMap: true,
        resolutions: [ 2048 ],
    },
    'Marble01': {
        roughness: 0.9,
        envMapIntensity: 0.1,
        resolutions: [ 2048 ],
    },
    'Marble02': {
        roughness: 0.1,
        envMapIntensity: 0.6,
        resolutions: [ 2048 ],
    },
    'Marble03': {
        roughness: 0.8,
        envMapIntensity: 0.1,
        resolutions: [ 2048 ],
    },
    'Marble04': {
        roughness: 0.8,
        envMapIntensity: 0.1,
        resolutions: [ 2048 ],
    },
    'Marble05': {
        roughness: 0.2,
        envMapIntensity: 0.1,
        resolutions: [ 2048 ],
    },
    'Metal02': {
        metalnessMap: true,
        metalness: 0.7,
        resolutions: [ 2048 ],
    },
    'Metal07': {
        metalnessMap: true,
        metalness: 0.9,
        roughness: 0.0,
        resolutions: [ 2048 ],
    },
    'Metal12': {
        metalnessMap: true,
        metalness: 1.0,
        roughness: 0.0,
        resolutions: [ 2048 ],
    },
    'PaintedMetal02': {
        metalnessMap: true,
        metalness: 0.8,
        roughness: 0.5,
        displacementMap: true,
        resolutions: [ 4096 ],
    },
    'PaintedMetal04': {
        metalnessMap: true,
        metalness: 0.8,
        roughness: 0.5,
        displacementMap: true,
        resolutions: [ 4096 ],
    },
    'Plastic01': {
        roughness: 0.0,
        resolutions: [ 4096 ],
    },
    'Plastic05': {
        roughness: 0.0,
        resolutions: [ 4096 ],
    },
    'Rock05': {
        resolutions: [ 2048 ],
    },
    'Rock08': {
        resolutions: [ 2048 ],
    },
    'Wood06': {
        resolutions: [ 2048 ],
    },
};
var materials = {};
var materialPresets = {
    'marble-yellowing': {
        texture: 'Marble05',
        color: '#ffffaa',
        repeatAmount: 8,
    },
    'gold': {
        texture: 'Metal07',
        color: '#ffffff',
        repeatAmount: 8,
    },
    'cloth': {
        texture: 'Fabric09',
        color: '#ffffff',
        repeatAmount: 5,
    }
};
var lightingPresets = {
    'User': {
        ambient: {
            color: '#ffffff',
            intensity: 0.2,
        },
        primary: {
            color: '#ffffff',
            intensity: 0.5,
            distance: 200,
            angle: Math.PI / 16,
            penumbra: 0.05,
            decay: 2,
            position: { x: 2, y: 2, z: 6 },
        },
        secondary: {
            color: '#ffffff',
            intensity: 0.3,
            distance: 200,
            angle: Math.PI / 16,
            penumbra: 0.05,
            decay: 2,
            position: { x: 10, y: 10, z: 0 },
        },
    },
    'Museum': {
        ambient: {
            color: '#404040',
            intensity: 0.2,
        },
        primary: {
            color: '#ffffff',
            intensity: 0.5,
            distance: 200,
            angle: Math.PI / 16,
            penumbra: 0.05,
            decay: 2,
            position: { x: 2, y: 2, z: 6 },
        },
        secondary: {
            color: '#ffffff',
            intensity: 0.3,
            distance: 200,
            angle: Math.PI / 16,
            penumbra: 0.05,
            decay: 2,
            position: { x: 10, y: 10, z: 0 },
        },
    },
    'Epic': {
        ambient: {
            color: '#780e0e',
            intensity: 0.4,
        },
        primary: {
            color: '#ff2d2d',
            intensity: 0.8,
            distance: 200,
            angle: Math.PI / 16,
            penumbra: 0.05,
            decay: 2,
            position: { x: -10, y: -10, z: 3 },
        },
        secondary: {
            color: '#ffffff',
            intensity: 1.3,
            distance: 200,
            angle: Math.PI / 32,
            penumbra: 0.5,
            decay: 2,
            position: { x: 0, y: 10, z: 0 },
        },
    },
    'Bisexual': {
        ambient: {
            color: '#000000',
            intensity: 0.0
        },
        primary: {
            color: '#0038a8',
            intensity: 2.0,
            distance: 100,
            angle: Math.PI / 16,
            penumbra: 0.8,
            decay: 2,
            position: { x: -10, y: 10, z: 0 },
        },
        secondary: {
            color: '#d70270',
            intensity: 2.0,
            distance: 100,
            angle: Math.PI / 16,
            penumbra: 0.8,
            decay: 2,
            position: { x: 10, y: -2, z: 0 },
        },
    }
};

var options = {
    general: {
        backgroundColor: '#000000',
        fogColor: '#000000',
        environment: {
            floorVisible: false,
            gridVisible: true,
            mapEnabled: true,
            environmentMap: 'vondelpark.png',
        }
    },
    model: {
        currentStatue: Object.keys(statues)[0],
        currentLod: 'high',
        rotationSpeed: 0,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    postprocessing: {
        enabled: true,
        antialiasing: 2,
        ambientOcclusion: {
            radius: 22,
            aoClamp: 0.25,
            lumInfluence: 0.7,
        },
        renderer: {
            exposure: 1,
        },
        bloom: {
            bloomStrength: 0.25,
            bloomThreshold: 0,
            bloomRadius: 0.15,
        },
        film: {
            noiseIntensity: 0.0,
            scanlinesIntensity: 0.0,
            scanlinesCount: 2048,
            grayscale: false,
        }
    },
    texture: {
        currentTexture: 'bronze',
        repeatAmount: 8,
        color: '#ffffaa',
    },
    lighting: {
        preset: Object.keys(lightingPresets)[0],
        ...lightingPresets[Object.keys(lightingPresets)[0]]
    }
};

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(options.general.backgroundColor);
    scene.fog = new THREE.Fog(new THREE.Color(options.general.fogColor), 1, 15);

    // Camera
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 15);
    camera.position.set(3, 0.15, 3);
    camera.near = 0.1;

    cameraTarget = new THREE.Vector3(0, 0, 0);

    // Cube camera
    cubeCamera = new THREE.CubeCamera(1, 1000, 256);
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
    scene.add(cubeCamera);

    // Loading manager
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };

    // Load textures
    textureLoader = new THREE.TextureLoader(loadingManager);
    loadEnvironmentMap(options.general.environment.environmentMap);
    loadTextures();

    // Ground
    floor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(40, 40),
        materials[options.texture.currentTexture]
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    floor.visible = options.general.environment.floorVisible;
    scene.add(floor);

    var gridGeometry = new THREE.PlaneBufferGeometry(10, 10, 100, 100);
    var gridMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
    grid = new THREE.Points(gridGeometry, gridMaterial);
    grid.position.y = -1;
    grid.rotation.x = - Math.PI / 2;
    scene.add(grid);

    // Load the statue
    loadingManager.onLoad = () => {
        console.log('loadingManager complete');

        // FIXME: this fires to often but needs to be somewhere(?) to init
        // statue = meshes[options.model.currentStatue + '-' + options.model.currentLod];
        // updateMaterial();

        // scene.add(statue);
    };
    loadStatue();

    // Lights
    initLights();

    // Init postprocessing
    initPostprocessing();

    // Utilities
    // Timer clock
    clock = new THREE.Clock();

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

    // Init gui
    initGui();

    // Controls
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Raycaster
    raycaster = new THREE.Raycaster();
    var raycasterLineGeometry = new THREE.BufferGeometry();
    raycasterLineGeometry.setFromPoints([ new THREE.Vector3(), new THREE.Vector3() ]);
    raycasterLine = new THREE.Line(raycasterLineGeometry, new THREE.LineBasicMaterial());
    scene.add(raycasterLine);

    mouseHelper = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
    mouseHelper.visible = false;
    scene.add(mouseHelper);

    // Set up event listeners
    window.addEventListener('resize', onWindowResize, false);

    controls.addEventListener('change', function() {
        mouseMoved = true;
    });

    window.addEventListener('mousedown', function () {
        mouseMoved = false;
    }, false);

    window.addEventListener('mouseup', function() {
        console.log('mouseup');
        checkIntersection();
        if (!mouseMoved && intersection.intersects) {
            shoot();
        }
    });

    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('touchmove', onTouchMove);
}

/*
 * Raycaster interactions
*/
function onTouchMove(event) {
    var x, y;

    if (event.changedTouches) {
        x = event.changedTouches[ 0 ].pageX;
        y = event.changedTouches[ 0 ].pageY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = - (y / window.innerHeight) * 2 + 1;

    checkIntersection();
}

function checkIntersection() {
    if (!statue) {
        return;
    }

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects([ statue ], true);
    
    if (intersects.length > 0) {
        raycasterLine.visible = true;
        var intersectionPoint = intersects[0].point;
        mouseHelper.position.copy(intersectionPoint);
        intersection.point.copy(intersectionPoint);

        var intersectionNormal = intersects[0].face.normal.clone();
        intersectionNormal.transformDirection(statue.matrixWorld);
        intersectionNormal.multiplyScalar(0.3); // NOTE: This is the distance of the line
        intersectionNormal.add(intersects[0].point);

        intersection.normal.copy(intersects[0].face.normal);
        mouseHelper.lookAt(intersectionNormal);

        var positions = raycasterLine.geometry.attributes.position;
        positions.setXYZ(0, intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
        positions.setXYZ(1, intersectionNormal.x, intersectionNormal.y, intersectionNormal.z);
        positions.needsUpdate = true;

        intersection.intersects = true;
    } else {
        raycasterLine.visible = false;
        intersection.intersects = false;
    }
}

function shoot() {
    const minScale = 0.05;
    const maxScale = 0.2;
    position.copy(intersection.point);
    orientation.copy(mouseHelper.rotation);

    orientation.z = Math.random() * 2 * Math.PI;

    var scale = minScale + Math.random() * (maxScale - minScale);
    size.set(scale, scale, scale);

    var decalGeometry = new THREE.DecalGeometry(statueChild, position, orientation, size);

    var material = decalMaterial.clone();
    material.color.setHex(Math.random() * 0xffffff);
    // material.color.setHex(0xeeeecc); // bird poop

    var newDecal = new THREE.Mesh(decalGeometry, material);

    decals.push(newDecal);
    scene.add(newDecal);
}

function removeDecals() {
    decals.forEach(function(decal) {
        scene.remove(decal);
    });
    decals = [];
}

/**
 * Load the environment map.
 */
function loadEnvironmentMap(environmentMapName) {
    textureLoader.load(`textures/cube/${environmentMapName}`, function (texture) {
        texture.mapping = THREE.UVMapping;
        var sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });

        if (!environmentMap) {
            var sphereGeometry = new THREE.SphereBufferGeometry(3, 32, 16);
            environmentMap = new THREE.Mesh(sphereGeometry, sphereMaterial);
            environmentMap.visible = options.general.environment.mapEnabled;
            environmentMap.geometry.scale(-1, 1, 1);
            scene.add(environmentMap);
        } else {
            environmentMap.material = sphereMaterial;
        }
    });
}

function loadTextures() {
    loadTexture('Marble01', 2048);

    // Add Fresnel
    var fresnelShader = THREE.FresnelShader;
    var fresnelUniforms = THREE.UniformsUtils.clone(fresnelShader.uniforms);

    fresnelUniforms['tCube'].value = cubeCamera.renderTarget.texture;

    materials['fresnel'] = new THREE.ShaderMaterial({
        uniforms: fresnelUniforms,
        vertexShader: fresnelShader.vertexShader,
        fragmentShader: fresnelShader.fragmentShader
    });
    // End Fresnel

    // Add warpy
    materials['warpy'] = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0 }
        },
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragment_shader1').textContent
    });
    // Add rust
    materials['rust'] = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0 },
            texture: { value: new THREE.TextureLoader().load( 'textures/rust.jpg' ) }
        },
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragment_shader2').textContent
    });
    materials['rust'].uniforms.texture.value.wrapS = materials['rust'].uniforms.texture.value.wrapT = THREE.RepeatWrapping;
    // Add hyper
    materials['hyper'] = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0 }
        },
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragment_shader3').textContent
    });
    // Add neon
    materials['neon'] = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0 }
        },
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragment_shader4').textContent
    });
    // Add chrome
    materials['chrome'] = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        envMap: cubeCamera.renderTarget.texture,
        roughness: 0,
        metalness: 1,
    });
    // Add gold
    materials['gold'] = new THREE.MeshPhongMaterial({
        color: 0xffcc33,
        specular: 0xbbaa99,
        shininess: 80,
        envMap: cubeCamera.renderTarget.texture,
        combine: THREE.MultiplyOperation,
        reflectivity: 0.7,
    });
    // Add bronze
    materials['bronze'] = new THREE.MeshPhongMaterial({
        color: 0x150505,
        specular: 0xee6600,
        shininess: 10,
        envMap: cubeCamera.renderTarget.texture,
        combine: THREE.MixOperation,
        reflectivity: 0.01,
    });

    // Add Wireframe
    materials['wireframe'] = new THREE.MeshBasicMaterial({ wireframe: true });
    // End wireframe

    // Add lava
    var lavaUniforms = {
        fogDensity: { value: 0.45 },
        fogColor: { value: new THREE.Vector3( 0, 0, 0 ) },
        time: { value: 1.0 },
        uvScale: { value: new THREE.Vector2( 3.0, 1.0 ) },
        texture1: { value: textureLoader.load('textures/lava/cloud.png') },
        texture2: { value: textureLoader.load('textures/lava/lavatile.jpg') }
    };

    lavaUniforms.texture1.value.wrapS = lavaUniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    lavaUniforms.texture2.value.wrapS = lavaUniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    materials['lava'] = new THREE.ShaderMaterial({
        uniforms: lavaUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
    // End lava

    materials['modified'] = new THREE.MeshNormalMaterial();
    materials['modified'].onBeforeCompile = function (shader) {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            [
                'float theta = sin( time + position.y ) / 2.0;',
                'float c = cos( theta );',
                'float s = sin( theta );',
                'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
                'vec3 transformed = vec3( position ) * m;',
                'vNormal = vNormal * m;'
            ].join('\n')
        );
        modifiedMaterialShader = shader;
    };

    // Decals
    var decalDiffuse = textureLoader.load('textures/decal/decal-diffuse.png');
    var decalNormal = textureLoader.load('textures/decal/decal-normal.jpg');
    decalMaterial = new THREE.MeshPhongMaterial({
        specular: 0x444444,
        map: decalDiffuse,
        normalMap: decalNormal,
        normalScale: new THREE.Vector2( 1, 1 ),
        shininess: 30,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: - 4,
        wireframe: false
    });
    
}

function loadTexture(texture, resolution) {
    if (textures[texture].ignore) {
        return;
    }
    var textureGroups = ['map', 'normalMap', 'roughnessMap'];
    var texturePrefix = `./textures/${texture}-${resolution}/${texture}`;

    materials[texture] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(options.texture.color),
        map: textureLoader.load(`${texturePrefix}_col.jpg`),
        normalMap: textureLoader.load(`${texturePrefix}_nrm.jpg`),
        roughnessMap: textureLoader.load(`${texturePrefix}_rgh.jpg`),
        envMap: cubeCamera.renderTarget.texture
    });
    if (textures[texture].roughness) {
        materials[texture].roughness = textures[texture].roughness;
    }
    if (textures[texture].envMapIntensity) {
        materials[texture].envMapIntensity = textures[texture].envMapIntensity;
    }
    if (textures[texture].metalness) {
        materials[texture].metalness = textures[texture].metalness;
    }
    if (textures[texture].metalnessMap) {
        materials[texture].metalnessMap = textureLoader.load(`${texturePrefix}_met.jpg`);
        textureGroups.push('metalnessMap');
    }
    if (textures[texture].emissiveMap) {
        materials[texture].emissiveMap = textureLoader.load(`${texturePrefix}_emi.jpg`);
        materials[texture].emissive = new THREE.Color(0xffffff);
        textureGroups.push('emissiveMap');
    }
    if (textures[texture].aoMap) {
        materials[texture].aoMap = textureLoader.load(`${texturePrefix}_AO.jpg`);
        textureGroups.push('aoMap');
    }
    // FIXME: something is wrong with textures here - wrong format? not a displacement map?
    // if (textures[texture].displacementMap) {
    //     materials[texture].displacementMap = textureLoader.load(`${texturePrefix}_disp.jpg`);
    //     materials[texture].displacementScale = 0.01;
    //     textureGroups.push('displacementMap');
    // }

    // Global rules for all textures types (anisotropy, repetition)
    var maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    textureGroups.forEach((group) => {
        materials[texture][group].anisotropy = maxAnisotropy;
        materials[texture][group].wrapS = THREE.RepeatWrapping;
        materials[texture][group].wrapT = THREE.RepeatWrapping;
        materials[texture][group].repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
    });
}

function loadStatue() {
    var objLoader = new THREE.OBJLoader(loadingManager);
    var objName = `${options.model.currentStatue}-${options.model.currentLod}`;

    if (meshes[objName]) {
        // Pull the object from cache
        console.log('- Loaded from cache', objName);
        enableOnlyMesh(objName);
    } else {
        // Load the object
        console.log('- Begin loading ', objName);
        objLoader.load(`./models/${objName}.obj`, function (loadedObject) {
            console.log(' - Loaded obj', objName);
            meshes[objName] = loadedObject;

            meshes[objName].position.set(0.0, -1, 0.0);
            meshes[objName].scale.set(0.3, 0.3, 0.3);

            meshes[objName].castShadow = true;
            meshes[objName].receiveShadow = true;

            enableOnlyMesh(objName);
            scene.add(meshes[objName]);
        }, (xhr) => {
            // Progress
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log('- Model ' + Math.round(percentComplete, 2) + '% downloaded');
            }
        },
        (xhr) => {
            // Error
            console.log('Error', xhr);
        });
    }
}

function enableOnlyMesh(whichMesh) {
    var oldStatue = statue;

    statue = meshes[whichMesh];
    console.log('- Setting statue to ', statue);

    Object.keys(meshes).forEach((mesh) => {
        meshes[mesh].visible = false;
    });
    statue.traverse(function (child) {
        if (child.isMesh) {
            statueChild = child;
        }
    });

    removeDecals();
    updateMaterial();
    statue.visible = true;
    if (oldStatue && oldStatue.rotation) {
        statue.rotation.y = oldStatue.rotation.y;
    }
}

function initPostprocessing() {
    // Set up render pass
    renderPass = new THREE.RenderPass(scene, camera);

    // Set up SSAA pass
    ssaaRenderPass = new THREE.SSAARenderPass(scene, camera);
    ssaaRenderPass.unbiased = true;
    ssaaRenderPass.sampleLevel = options.postprocessing.antialiasing;
    
    // Set up bloom
    bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = options.postprocessing.bloom.bloomThreshold;
    bloomPass.strength = options.postprocessing.bloom.bloomStrength;
    bloomPass.radius = options.postprocessing.bloom.bloomRadius;
    
    // Film pass
    filmPass = new THREE.FilmPass(options.postprocessing.film.noiseIntensity, options.postprocessing.film.scanlinesIntensity, options.postprocessing.film.scanlinesCount, options.postprocessing.film.grayscale);

    // Set up SSAO pass
    ssaoPass = new THREE.SSAOPass(scene, camera);
    ssaoPass.renderToScreen = true;

    // Add passes to effect composer
    effectComposer = new THREE.EffectComposer(renderer);
    effectComposer.addPass(renderPass);
    effectComposer.addPass(ssaaRenderPass);
    effectComposer.addPass(bloomPass);
    effectComposer.addPass(filmPass);
    effectComposer.addPass(ssaoPass);
}

function initLights() {
    // Ambient
    if (!ambientLight) {
        ambientLight = new THREE.AmbientLight();
    }
    ambientLight.color = new THREE.Color(options.lighting.ambient.color);
    ambientLight.intensity = options.lighting.ambient.intensity;
    scene.add(ambientLight);

    // Primary Spotlight
    if (!spotlightPrimary) {
        spotlightPrimary = new THREE.SpotLight();
    }
    spotlightPrimary.color = new THREE.Color(options.lighting.primary.color);
    spotlightPrimary.intensity = options.lighting.primary.intensity;
    spotlightPrimary.angle = options.lighting.primary.angle;
    spotlightPrimary.penumbra = options.lighting.primary.penumbra;
    spotlightPrimary.decay = options.lighting.primary.decay;
    spotlightPrimary.distance = options.lighting.primary.distance;
    spotlightPrimary.position.x = options.lighting.primary.position.x;
    spotlightPrimary.position.y = options.lighting.primary.position.y;
    spotlightPrimary.position.z = options.lighting.primary.position.z;
    

    spotlightPrimary.castShadow = true;
    spotlightPrimary.shadow.mapSize.width = 1024;
    spotlightPrimary.shadow.mapSize.height = 1024;
    spotlightPrimary.shadow.camera.near = 10;
    spotlightPrimary.shadow.camera.far = 200;
    scene.add(spotlightPrimary);

    // Secondary Spotlight
    if (!spotlightSecondary) {
        spotlightSecondary = new THREE.SpotLight();
    }
    spotlightSecondary.color = new THREE.Color(options.lighting.secondary.color);
    spotlightSecondary.intensity = options.lighting.secondary.intensity;
    spotlightSecondary.angle = options.lighting.secondary.angle;
    spotlightSecondary.penumbra = options.lighting.secondary.penumbra;
    spotlightSecondary.decay = options.lighting.secondary.decay;
    spotlightSecondary.distance = options.lighting.secondary.distance;
    spotlightSecondary.position.x = options.lighting.secondary.position.x;
    spotlightSecondary.position.y = options.lighting.secondary.position.y;
    spotlightSecondary.position.z = options.lighting.secondary.position.z;

    spotlightSecondary.castShadow = true;
    spotlightSecondary.shadow.mapSize.width = 1024;
    spotlightSecondary.shadow.mapSize.height = 1024;
    spotlightSecondary.shadow.camera.near = 10;
    spotlightSecondary.shadow.camera.far = 200;
    scene.add(spotlightSecondary);
}

function initGui() {
    var gui = new dat.GUI();

    var _fGeneral = gui.addFolder('General');
    _fGeneral.addColor(options.general, 'backgroundColor').onChange(function (value) { scene.background.set(value); });
    _fGeneral.addColor(options.general, 'fogColor').onChange(function (value) { scene.fog.color.set(value); });
    var _fGeneralEnvironment = _fGeneral.addFolder('Environment');
    _fGeneralEnvironment.add(options.general.environment, 'floorVisible').onChange((value) => { floor.visible = value; });
    _fGeneralEnvironment.add(options.general.environment, 'gridVisible').onChange((value) => { grid.visible = value; });
    _fGeneralEnvironment.add(options.general.environment, 'mapEnabled').onChange((value) => { environmentMap.visible = value; });
    _fGeneralEnvironment.add(options.general.environment, 'environmentMap', [
        'pillars_4k.jpg',
        'rundown.jpg',
        'cave.png',
        'georgentor.png',
        'vondelpark.png',
    ]).onChange((value) => { loadEnvironmentMap(value); });

    // Begin post-processing
    var _fPostProcessing = gui.addFolder('Post-processing');
    _fPostProcessing.add(options.postprocessing, 'enabled');
    
    _fPostProcessing.add(options.postprocessing, 'antialiasing', {
        'Level 0: 1 Sample': 0,
        'Level 1: 2 Samples': 1,
        'Level 2: 4 Samples': 2,
        'Level 3: 8 Samples': 3,
        'Level 4: 16 Samples': 4,
        'Level 5: 32 Samples': 5
    }).onChange((level) => { ssaaRenderPass.sampleLevel = options.postprocessing.antialiasing; });

    var _fAmbientOcclusion = _fPostProcessing.addFolder('Ambient Occlusion');
    _fAmbientOcclusion.add(options.postprocessing.ambientOcclusion, 'radius').min(0).max(64).onChange((value) => { ssaoPass.radius = value; });
    _fAmbientOcclusion.add(options.postprocessing.ambientOcclusion, 'aoClamp').min(0).max(1).onChange((value) => { ssaoPass.aoClamp = value; });
    _fAmbientOcclusion.add(options.postprocessing.ambientOcclusion, 'lumInfluence').min(0).max(1).onChange((value) => { ssaoPass.lumInfluence = value; });

    var _fRenderer = _fPostProcessing.addFolder('Renderer');
    _fRenderer.add(options.postprocessing.renderer, 'exposure', 0.1, 2).onChange(function (value) { renderer.toneMappingExposure = Math.pow(value, 4.0); });

    var _fBloom = _fPostProcessing.addFolder('Bloom');
    _fBloom.add(options.postprocessing.bloom, 'bloomThreshold', 0.0, 1.0).onChange(function (value) { bloomPass.threshold = Number(value); });
    _fBloom.add(options.postprocessing.bloom, 'bloomStrength', 0.0, 3.0).onChange(function (value) { bloomPass.strength = Number(value); });
    _fBloom.add(options.postprocessing.bloom, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(function (value) { bloomPass.radius = Number(value); });

    var _fFilm = _fPostProcessing.addFolder('Film');
    _fFilm.add(options.postprocessing.film, 'noiseIntensity', 0.0, 3.0).onChange(function (value) { filmPass.uniforms.nIntensity.value = Number(value); });
    _fFilm.add(options.postprocessing.film, 'scanlinesIntensity', 0.0, 3.0).step(0.1).onChange(function (value) { filmPass.uniforms.sIntensity.value = Number(value); });
    _fFilm.add(options.postprocessing.film, 'scanlinesCount', 0, 4096).step(8).onChange(function (value) { filmPass.uniforms.sCount.value = Number(value); });
    _fFilm.add(options.postprocessing.film, 'grayscale').onChange(function (value) { filmPass.uniforms.grayscale.value = value; });
    // End post-processing

    // Begin model
    var _fModel = gui.addFolder('Model');
    _fModel.add(options.model, 'currentStatue', Object.keys(statues)).onChange((value) => { loadStatue(); });
    _fModel.add(options.model, 'currentLod', ['low', 'high']).onChange((value) => { loadStatue(); });
    _fModel.add(options.model, 'rotationSpeed').min(-100).max(100);

    const _fModelPosition = _fModel.addFolder('Position');
    _fModelPosition.add(options.model.position, 'x').min(-10).max(10).onChange((value) => { this.statue.position.x = value; });
    _fModelPosition.add(options.model.position, 'y').min(-10).max(10).onChange((value) => { this.statue.position.y = value; });
    _fModelPosition.add(options.model.position, 'z').min(-10).max(10).onChange((value) => { this.statue.position.z = value; });
    const _fModelRotation = _fModel.addFolder('Rotation');
    // TODO: make these rotate decals as well
    _fModelRotation.add(options.model.rotation, 'x').min(-10).max(10).onChange((value) => { this.statue.rotation.x = value; });
    _fModelRotation.add(options.model.rotation, 'y').min(-10).max(10).onChange((value) => { this.statue.rotation.y = value; });
    _fModelRotation.add(options.model.rotation, 'z').min(-10).max(10).onChange((value) => { this.statue.rotation.z = value; });
    // End model

    // Begin textures
    var _fTextures = gui.addFolder('Textures');

    _fTextures.add(options.texture, 'currentTexture', Object.keys(textures)).onChange((selectedTexture) => {
        updateMaterial();
    });

    _fTextures.add(options.texture, 'repeatAmount').min(1).max(64).onChange((amount) => {
        Object.keys(textures).forEach((texture) => {
            if (textures[texture].ignore) {
                return;
            }
            materials[texture].map.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            materials[texture].normalMap.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            materials[texture].roughnessMap.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            if (textures[texture].metalnessMap) {
                materials[texture].metalnessMap.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            }
            if (textures[texture].emissiveMap) {
                materials[texture].emissiveMap.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            }
            if (textures[texture].aoMap) {
                materials[texture].aoMap.repeat.set(options.texture.repeatAmount, options.texture.repeatAmount);
            }
        });
    });

    _fTextures.addColor(options.texture, 'color').onChange(function (value) {
        Object.keys(materials).forEach((materialName) => {
            if (textures[materialName].ignore) {
                return;
            }
            materials[materialName].color.set(value);
        });
    });
    // End textures

    // Lighting
    var _fLighting = gui.addFolder('Lighting');
    _fLighting.add(options.lighting, 'preset', Object.keys(lightingPresets)).onChange((value) => {
        options.lighting = {
            preset: value,
            ...lightingPresets[value]
        };
        initLights();
        updateGuiLightingPreset(_fLighting);
    });

    var _fLightingAmbient = _fLighting.addFolder('Ambient');
    _fLightingAmbient.addColor(options.lighting.ambient, 'color').onChange((value) => { ambientLight.color.set(value); });
    _fLightingAmbient.add(options.lighting.ambient, 'intensity').min(0).max(10).onChange((value) => { ambientLight.intensity = value; });

    // Begin Spotlight Primary
    var _fSpotlightPrimary = _fLighting.addFolder('Spotlight Primary');
    _fSpotlightPrimary.addColor(options.lighting.primary, 'color').onChange(function (value) { spotlightPrimary.color.set(value); });
    _fSpotlightPrimary.add(options.lighting.primary, 'intensity', 0, 5).onChange(function (val) { spotlightPrimary.intensity = val; });
    _fSpotlightPrimary.add(options.lighting.primary, 'distance', 50, 200).onChange(function (val) { spotlightPrimary.distance = val; });
    _fSpotlightPrimary.add(options.lighting.primary, 'angle', 0, Math.PI / 3).onChange(function (val) { spotlightPrimary.angle = val; });
    _fSpotlightPrimary.add(options.lighting.primary, 'penumbra', 0, 1).onChange(function (val) { spotlightPrimary.penumbra = val; });
    _fSpotlightPrimary.add(options.lighting.primary, 'decay', 1, 2).onChange(function (val) { spotlightPrimary.decay = val });
    const _fSpotlightPrimaryPosition = _fSpotlightPrimary.addFolder('Position');
    _fSpotlightPrimaryPosition.add(options.lighting.primary.position, 'x').min(-10).max(10).onChange((value) => { this.spotlightPrimary.position.x = value; });
    _fSpotlightPrimaryPosition.add(options.lighting.primary.position, 'y').min(-10).max(10).onChange((value) => { this.spotlightPrimary.position.y = value; });
    _fSpotlightPrimaryPosition.add(options.lighting.primary.position, 'z').min(-10).max(10).onChange((value) => { this.spotlightPrimary.position.z = value; });
    // End Spotlight Primary

    // Begin Spotlight Secondary
    var _fSpotlightSecondary = _fLighting.addFolder('Spotlight Secondary');
    _fSpotlightSecondary.addColor(options.lighting.secondary, 'color').onChange(function (value) { spotlightSecondary.color.set(value); });
    _fSpotlightSecondary.add(options.lighting.secondary, 'intensity', 0, 5).onChange(function (val) { spotlightSecondary.intensity = val; });
    _fSpotlightSecondary.add(options.lighting.secondary, 'distance', 50, 200).onChange(function (val) { spotlightSecondary.distance = val; });
    _fSpotlightSecondary.add(options.lighting.secondary, 'angle', 0, Math.PI / 3).onChange(function (val) { spotlightSecondary.angle = val; });
    _fSpotlightSecondary.add(options.lighting.secondary, 'penumbra', 0, 1).onChange(function (val) { spotlightSecondary.penumbra = val; });
    _fSpotlightSecondary.add(options.lighting.secondary, 'decay', 1, 2).onChange(function (val) { spotlightSecondary.decay = val; });
    const _fSpotlightSecondaryPosition = _fSpotlightSecondary.addFolder('Position');
    _fSpotlightSecondaryPosition.add(options.lighting.secondary.position, 'x').min(-10).max(10).onChange((value) => { this.spotlightSecondary.position.x = value; });
    _fSpotlightSecondaryPosition.add(options.lighting.secondary.position, 'y').min(-10).max(10).onChange((value) => { this.spotlightSecondary.position.y = value; });
    _fSpotlightSecondaryPosition.add(options.lighting.secondary.position, 'z').min(-10).max(10).onChange((value) => { this.spotlightSecondary.position.z = value; });
    // End Spotlight Secondary
}

function updateGuiLightingPreset(gui) {
    console.log('gui', gui);
    Object.keys(gui.__folders).forEach((parentFolder) => {
        console.log('- parentFolder', parentFolder);
        // Find child folders
        Object.keys(gui.__folders[parentFolder].__folders).forEach((childFolder) => {
            console.log('- - childFolder', childFolder);
            // Controllers in this folder
            Object.keys(gui.__folders[parentFolder].__folders[childFolder].__controllers).forEach((controller) => {
                var guiController = gui.__folders[parentFolder].__folders[childFolder].__controllers[controller];
                var controllerValue;
                if (parentFolder === 'Spotlight Primary' && childFolder == 'Position') {
                    controllerValue = options.lighting.primary.position[guiController.property];
                }
                if (parentFolder === 'Spotlight Secondary' && childFolder == 'Position') {
                    controllerValue = options.lighting.secondary.position[guiController.property];
                }
                if (controllerValue) {
                    guiController.setValue(controllerValue);
                }
                console.log('- - :: ', controller, guiController.property, controllerValue);
            });
        });

        // Controllers in this folder
        Object.keys(gui.__folders[parentFolder].__controllers).forEach((controller) => {
            var guiController = gui.__folders[parentFolder].__controllers[controller];
            var controllerValue;
            if (parentFolder === 'Ambient') {
                controllerValue = options.lighting.ambient[guiController.property];
            }
            if (parentFolder === 'Spotlight Primary') {
                controllerValue = options.lighting.primary[guiController.property];
            }
            if (parentFolder === 'Spotlight Secondary') {
                controllerValue = options.lighting.secondary[guiController.property];
            }
            if (controllerValue) {
                guiController.setValue(controllerValue);
            }
            console.log('controller', controller, guiController.property, controllerValue);
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    var width = window.innerWidth;
    var height = window.innerHeight;
    var pixelRatio = renderer.getPixelRatio();
    var newWidth  = Math.floor(width / pixelRatio) || 1;
    var newHeight = Math.floor(height / pixelRatio) || 1;
    effectComposer.setSize(newWidth, newHeight);
}

function updateMaterial() {
    if (!materials[options.texture.currentTexture]) {
        // TODO: find the highest resolution cached; then fall back
        const resolution = textures[options.texture.currentTexture].resolutions.shift();
        loadTexture(options.texture.currentTexture, resolution);
    }

    // Floor
    floor.material = materials[options.texture.currentTexture];
    
    // The statue and all its children
    statue.material = materials[options.texture.currentTexture];
    statue.traverse(function (child) {
        if (child.isMesh) {
            child.material = materials[options.texture.currentTexture];
        }
    });
}

function animate() {
    const delta = clock.getDelta();

    requestAnimationFrame(animate);

    // TODO: request that the textures do this to themselves
    if (materials['lava']) {
        materials['lava'].uniforms.time.value += 0.2 * delta;
    }
    if (materials['warpy']) {
        materials['warpy'].uniforms.time.value = clock.elapsedTime;
    }
    if (materials['rust']) {
        materials['rust'].uniforms.time.value += delta * 5;
    }
    if (materials['neon']) {
        materials['neon'].uniforms.time.value += delta * 5;
    }
    if (materials['hyper']) {
        materials['hyper'].uniforms.time.value += delta * 5;
    }
    if (modifiedMaterialShader) {
        modifiedMaterialShader.uniforms.time.value = performance.now() / 1000;
    }

    camera.lookAt(cameraTarget);

    // Rotate the statue
    var rotationAmount = clock.getElapsedTime() * 0.00001 * options.model.rotationSpeed;
    if (statue && statue.rotation) {
        statue.rotation.y += rotationAmount;
        decals.forEach((decal) => { decal.rotation.y += rotationAmount; });
    }

    render();
    stats.update();
}

function render() {
    if (cubeCamera) {
        cubeCamera.update(renderer, scene);
    }

    if (options.postprocessing.enabled) {
        effectComposer.render();
    } else {
        renderer.render(scene, camera);
    }
}
