import _ from 'lodash';
import * as THREE from 'three';
import { Matrix4, OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//interface IShaderUniforms {
//    rSg: THREE.IUniform;
//    width: THREE.IUniform;
//    sizeOfTexture: THREE.IUniform;
//}

class Panel {

    private _guid: string = this.uuidv4();
    private _renderer: WebGLRenderer;
    private _parent: HTMLElement;
    private _modelScene: Scene;

    private _camera: PerspectiveCamera;
    private _bufferGeometry: THREE.BufferGeometry;
    private _mesh: THREE.Mesh;

    private _modelShader: THREE.ShaderMaterial;
   
    //private _modelShaderUniforms: {
    //    ["rSg"]: THREE.IUniform,
    //    ["width"]: THREE.IUniform,
    //    ["worldViewTranspose"]: THREE.IUniform,
    //};

    private _controls: OrbitControls;

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public get id() { return this._guid; }


    constructor(parent: HTMLElement) {
        this._parent = parent;

        this._modelScene = new Scene();

        let aspectRatio = this._parent.clientWidth / this._parent.clientHeight;
        let fovAngleY = 70.0;

        this._camera = new PerspectiveCamera(fovAngleY, aspectRatio, 0.01, 100.0);
        this._camera.position.set(0, 0.7, 1.5);
        this._camera.up.set(0, 1, 0);
        this._camera.lookAt(new Vector3(0, 0, 0));
        this._camera.updateMatrixWorld();
        this._camera.updateProjectionMatrix();

        this._renderer = new WebGLRenderer({ preserveDrawingBuffer: false });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(parent.clientWidth, parent.clientHeight);
        parent.appendChild(this._renderer.domElement);

        this._controls = new OrbitControls(this._camera, this._renderer.domElement);

        this._bufferGeometry = new THREE.BufferGeometry();

        // // Model,View,Projection is automatically added for you in ThreeJS
        // // if you want more uniforms to pass to your shaders, you can do it like this:
        //this._modelShaderUniforms = {
        //    rSg: { value: 1.0 },
        //    width: { value: this._textureMaxSize },
        //    worldViewTranspose: { value: this._camera.matrixWorldInverse.clone().transpose() },
        //};

        this._modelShader = new THREE.ShaderMaterial();
        this._modelShader.vertexColors = true;
        this._modelShader.side = THREE.BackSide;
        //this._modelShader.uniforms = this._modelShaderUniforms;

        this._mesh = new THREE.Mesh(this._bufferGeometry);
        this._mesh.material = this._modelShader;
        this._modelScene.add(this._mesh);


        this._renderer.clear();
        this._renderer.autoClear = false;
        this._renderer.clear();
        
    }

    animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        // update your uniforms if you have any extra ones
        
        //this._camera.updateMatrixWorld();
        const time = Date.now() * 0.001;

        this._mesh.rotation.x = time * 0.25;
        this._mesh.rotation.y = time * 0.5;
        
        this._renderer.clear();
        this._renderer.render(this._modelScene, this._camera);

    }
       

    start() {

        this.animate();
    }
        
    setVertexShaderModel(code: string) {
        this._modelShader.vertexShader = code;
    }
    setFragmentShaderModel(code: string) {
        this._modelShader.fragmentShader = code;
    }
        
    setVertices(vertices: Float32Array) {
        this._bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    }
    setColors(colors: Float32Array) {
        this._bufferGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    }
    setIndices(indices: Uint32Array) {
        this._bufferGeometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    }
   
}

//needs to be on window because this is a module and the unmarshalled setting of the arrays can't access this module
const panels = new Map<string, Panel>();  
(window as any).panels = panels;

export async function createPanel(parent: HTMLElement): Promise<string> {
    let panel = new Panel(parent);  
    panels.set(panel.id, panel);

     return panel.id;
}

export async function loadShaders(panelId: string, vertexShaderSrc: string, pixelShaderSrc: string) {
    let panel = panels.get(panelId);
    if (panel != undefined) {

        let response = await fetch(vertexShaderSrc);
        let modelVertex = await response.text();
        panel.setVertexShaderModel(modelVertex);

        response = await fetch("./RenderModel.fragment.fx");
        let modelFragment = await response.text();
        panel.setFragmentShaderModel(modelFragment);
    }
}

export function start(id: string) {
    let panel = panels.get(id);
    panel?.start();
}

declare var BINDING: any; //mono functions
declare var Blazor: any;  //blazor object
declare var Module: any;  //emscripten object

export function setSlow(panelId: any, identifier: any, value: any) {
    try {
        let panel = panels.get(panelId);
      
        let arr = value;

        switch (identifier) {
            case "indices":
                return panel?.setIndices(arr);
            case "vertices":
                return panel?.setVertices(arr);
            case "colors":
                return panel?.setColors(arr);
        }

    } catch (ex) {
        console.log("error", ex);
    }
}

export function setFast(panelId: any, identifier: any, value: any):any {
    try {
        let panelIdStr = BINDING.conv_string(panelId);
        let panel = panels.get(panelIdStr);

        let identifierStr = BINDING.conv_string(identifier);
        if (identifierStr == "indices") {
            let arrInt = toUInt32Array(value);
            return panel?.setIndices(arrInt);
        }
        let arr = toFloat32Array(value);

        
        switch (identifierStr) {
            case "vertices":
                return panel?.setVertices(arr);
            case "colors":
                return panel?.setColors(arr);
        }

    } catch (ex) {
        console.log("error", ex);
    }
}

function toFloat32Array(array: any): Float32Array {
    const dataPtr = Blazor.platform.getArrayEntryPtr(array, 0, 4);
    const length = Blazor.platform.getArrayLength(array);
    return new Float32Array(Module.HEAPF32.buffer, dataPtr, length);
}

function toUInt32Array(array: any): Uint32Array {
    const dataPtr = Blazor.platform.getArrayEntryPtr(array, 0, 4);
    const length = Blazor.platform.getArrayLength(array);
    return new Uint32Array(Module.HEAPU32.buffer, dataPtr, length);
}

function toUInt16Array(array: any): Uint16Array {
    const dataPtr = Blazor.platform.getArrayEntryPtr(array, 0, 2);
    const length = Blazor.platform.getArrayLength(array);
    return new Uint16Array(Module.HEAPF32.buffer, dataPtr, length);
}

