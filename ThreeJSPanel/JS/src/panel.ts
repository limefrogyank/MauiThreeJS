import _ from 'lodash';
import * as THREE from 'three';
import { Matrix4, OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface IShaderUniforms {
    rSg: THREE.IUniform;
    width: THREE.IUniform;
    sizeOfTexture: THREE.IUniform;
}

class Panel {

    private _guid: string = this.uuidv4();
    private _renderer: WebGLRenderer;
    private _modelScene: Scene;

    private _camera: OrthographicCamera;
    private _bufferGeometryAtoms: THREE.BufferGeometry;
    private _atomsMesh: THREE.Mesh;

    private _modelShader: THREE.ShaderMaterial;
    private _cameraDistance: number;

    private _textureMaxSize: number = 4096;
    private _aoCounter: number = 0;
    
    private _modelShaderUniforms: {
        ["rSg"]: THREE.IUniform,
        ["width"]: THREE.IUniform,
        ["worldViewTranspose"]: THREE.IUniform,
    };

    private _controls: OrbitControls;
    private _moleculeRadius: number;

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public get id() { return this._guid; }


    constructor(parent: HTMLElement, moleculeRadius: number, numberOfItems:number) {
        this._moleculeRadius = moleculeRadius;

        this._modelScene = new Scene();
        const fovAngleY = 60.0 * Math.PI / 180.0;
        this._cameraDistance = moleculeRadius / Math.tan(fovAngleY / 2);

        if (parent.clientHeight > parent.clientWidth) {
            this._camera = new OrthographicCamera(
                -this._moleculeRadius,
                this._moleculeRadius,
                this._moleculeRadius * parent.clientHeight / parent.clientWidth,
                -this._moleculeRadius * parent.clientHeight / parent.clientWidth,
                -2 * (this._moleculeRadius + this._cameraDistance),
                2 * (this._moleculeRadius + this._cameraDistance));
        }
        else {
            this._camera = new OrthographicCamera(
                -this._moleculeRadius * parent.clientWidth / parent.clientHeight,
                this._moleculeRadius * parent.clientWidth / parent.clientHeight,
                this._moleculeRadius ,
                -this._moleculeRadius ,
                -2 *(this._moleculeRadius + this._cameraDistance),
                2 * (this._moleculeRadius + this._cameraDistance));
              
        }

        this._camera.position.z = -this._cameraDistance;
        this._camera.lookAt(new Vector3(0, 0, 0));
        
        this._renderer = new WebGLRenderer({preserveDrawingBuffer:true});
        this._renderer.setSize(parent.clientWidth, parent.clientHeight);
        parent.appendChild(this._renderer.domElement);

        this._controls = new OrbitControls(this._camera, this._renderer.domElement);

        this._bufferGeometryAtoms = new THREE.BufferGeometry();
        

        this._modelShaderUniforms = {
            rSg: { value: 1.0 },
            width: { value: this._textureMaxSize },
            worldViewTranspose: { value: this._camera.matrixWorldInverse.clone().transpose() },
        };

        this._modelShader = new THREE.ShaderMaterial();
        this._modelShader.vertexColors = true;
        this._modelShader.uniforms = this._modelShaderUniforms;

        this._atomsMesh = new THREE.Mesh(this._bufferGeometryAtoms);
        this._atomsMesh.material = this._modelShader;
        this._modelScene.add(this._atomsMesh);

        const plane = new THREE.PlaneGeometry(parent.clientWidth, parent.clientHeight);        
        

       

        this._renderer.clear();
        this._renderer.autoClear = false;
        this._renderer.clear();
        
    }

    animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        const view = this._camera.matrix;
        const viewDeterminant =  view.determinant();
        this._modelShaderUniforms.rSg.value = Math.pow(viewDeterminant, 0.333333333);
        
        this._camera.updateMatrixWorld();
        const worldViewTranspose = this._camera.matrixWorldInverse.clone().transpose();
        this._modelShaderUniforms.worldViewTranspose.value = worldViewTranspose;
                    
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
        this._bufferGeometryAtoms.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        return BINDING.js_to_mono_obj(vertices.length.toString());        
    }
    setColors(colors: Float32Array) {
        this._bufferGeometryAtoms.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        return BINDING.js_to_mono_obj(colors.length.toString());
    }
    setIndices(indices: Uint32Array) {
        this._bufferGeometryAtoms.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        return BINDING.js_to_mono_obj(indices.length.toString());
    }
    setSTs(sts: Float32Array) {
        this._bufferGeometryAtoms.setAttribute("uv", new THREE.Float32BufferAttribute(sts, 2));
        return BINDING.js_to_mono_obj(sts.length.toString());
    }
    setRowCols(rowCols: Float32Array) {
        this._bufferGeometryAtoms.setAttribute("rowCols", new THREE.Float32BufferAttribute(rowCols, 2));
        return BINDING.js_to_mono_obj(rowCols.length.toString());
    }
    setRadius(radius: Float32Array) {
        this._bufferGeometryAtoms.setAttribute("radius", new THREE.Float32BufferAttribute(radius, 1));
        return BINDING.js_to_mono_obj(radius.length.toString());
    }

   
}

//needs to be on window because this is a module and the unmarshalled setting of the arrays can't access this module
const panels = new Map<string, Panel>();  
(window as any).panels = panels;

export async function createPanel(parent: HTMLElement, moleculeRadius: number, numberOfItems:number): Promise<string> {
    let panel = new Panel(parent, moleculeRadius, numberOfItems);  
    panels.set(panel.id, panel);
    console.log("Loading shaders");
    let response = await fetch("./RenderModel.vertex.fx");
    let modelVertex = await response.text();
    panel.setVertexShaderModel(modelVertex);
    response = await fetch("./RenderModel.fragment.fx");
    let modelFragment = await response.text();
    panel.setFragmentShaderModel(modelFragment);

 
    console.log("DONE loading shaders");

    return panel.id;
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
            case "sts":
                return panel?.setSTs(arr);
            case "rowcols":
                return panel?.setRowCols(arr);
            case "radius":
                return panel?.setRadius(arr);
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
            case "sts":
                return panel?.setSTs(arr);
            case "rowcols":
                return panel?.setRowCols(arr);
            case "radius":
                return panel?.setRadius(arr);
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

