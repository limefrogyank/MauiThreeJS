var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as THREE from 'three';
import { OrthographicCamera, Scene, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
class Panel {
    constructor(parent, moleculeRadius, numberOfItems) {
        this._guid = this.uuidv4();
        this._sphereVectors = [];
        this._lightIterationFactor = 2;
        this._textureMaxSize = 4096;
        this._aoCounter = 0;
        this._aoTextureComplete = false;
        this._isAORendering = false;
        this._moleculeRadius = moleculeRadius;
        this._modelScene = new Scene();
        this._billboardScene = new Scene();
        //this._depthScene = new Scene();
        //this._aoScene = new Scene();
        const fovAngleY = 60.0 * Math.PI / 180.0;
        this._cameraDistance = moleculeRadius / Math.tan(fovAngleY / 2);
        if (parent.clientHeight > parent.clientWidth) {
            this._camera = new OrthographicCamera(-this._moleculeRadius, this._moleculeRadius, this._moleculeRadius * parent.clientHeight / parent.clientWidth, -this._moleculeRadius * parent.clientHeight / parent.clientWidth, -2 * (this._moleculeRadius + this._cameraDistance), 2 * (this._moleculeRadius + this._cameraDistance));
        }
        else {
            this._camera = new OrthographicCamera(-this._moleculeRadius * parent.clientWidth / parent.clientHeight, this._moleculeRadius * parent.clientWidth / parent.clientHeight, this._moleculeRadius, -this._moleculeRadius, -2 * (this._moleculeRadius + this._cameraDistance), 2 * (this._moleculeRadius + this._cameraDistance));
        }
        this._camera.position.z = -this._cameraDistance;
        this._camera.lookAt(new Vector3(0, 0, 0));
        this._renderer = new WebGLRenderer({ preserveDrawingBuffer: true });
        this._renderer.setSize(parent.clientWidth, parent.clientHeight);
        parent.appendChild(this._renderer.domElement);
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._bufferGeometry = new THREE.BufferGeometry();
        this._depthRenderTarget = new WebGLRenderTarget(this._textureMaxSize, this._textureMaxSize);
        this._depthShader = new THREE.ShaderMaterial();
        this._depthShader.vertexColors = true;
        this._depthShader.side = THREE.BackSide;
        this._depthShaderUniforms = {
            rSg: { value: 1.0 }
        };
        this._depthShader.uniforms = this._depthShaderUniforms;
        const numberPerRow = Math.ceil(Math.sqrt(numberOfItems));
        this._aoRenderTarget = new WebGLRenderTarget(this._textureMaxSize, this._textureMaxSize);
        this._aoShader = new THREE.ShaderMaterial();
        this._aoShader.vertexColors = true;
        this._aoShader.side = THREE.BackSide;
        this._aoShader.depthWrite = false;
        this._aoShader.blending = THREE.CustomBlending;
        this._aoShader.blendEquation = THREE.AddEquation;
        this._aoShader.blendSrc = THREE.SrcAlphaFactor;
        this._aoShader.blendDst = THREE.OneFactor;
        this._aoShaderUniforms = {
            rSg: { value: 1.0 },
            sizeOfTexture: { value: Math.floor(this._textureMaxSize / numberPerRow) },
            width: { value: this._textureMaxSize },
            textureSampler: { value: this._depthRenderTarget.texture },
            accumulation: { value: 1 }
        };
        this._aoShader.uniforms = this._aoShaderUniforms;
        this._aoOptimizerShader = new THREE.ShaderMaterial();
        this._aoOptimizerShader.depthWrite = false;
        this._aoOptimizerShader.uniforms = this._aoShaderUniforms;
        this._modelShader = new THREE.ShaderMaterial();
        this._modelShader.vertexColors = true;
        this._modelShader.side = THREE.BackSide;
        //this._modelShader.blending = THREE.NormalBlending;
        this._modelShaderUniforms = {
            rSg: { value: 1.0 },
            sizeOfTexture: { value: Math.floor(this._textureMaxSize / numberPerRow) },
            width: { value: this._textureMaxSize },
            worldViewTranspose: { value: this._camera.matrixWorldInverse.clone().transpose() },
            textureSampler: { value: this._aoRenderTarget.texture }
        };
        this._modelShader.uniforms = this._modelShaderUniforms;
        this._modelMesh = new THREE.Mesh(this._bufferGeometry);
        this._modelMesh.material = this._modelShader;
        this._modelScene.add(this._modelMesh);
        const plane = new THREE.PlaneGeometry(parent.clientWidth, parent.clientHeight);
        this._quad = new THREE.Mesh(plane);
        this._basicMaterial = new THREE.MeshBasicMaterial({ map: this._aoRenderTarget.texture });
        this._quad.material = this._basicMaterial;
        this._billboardScene.add(this._quad);
        //const spriteMaterial = new THREE.SpriteMaterial({ map: this._aoRenderTarget.texture });
        //const sprite = new THREE.Sprite(spriteMaterial);
        //sprite.scale.set(this._textureMaxSize, this._textureMaxSize, 1);
        ////this._billboardScene.add(sprite);
        this._billboardCamera = new OrthographicCamera(-parent.clientWidth / 2, parent.clientWidth / 2, parent.clientHeight / 2, -parent.clientHeight / 2, 1, 10);
        this._billboardCamera.position.z = 10;
        //const halfWidth = parent.clientWidth / 2;
        //const halfHeight = parent.clientHeight / 2;
        //const halfImageWidth = this._textureMaxSize / 2;
        //const halfImageHeight = this._textureMaxSize / 2;
        //sprite.position.set(- halfWidth + halfImageWidth, halfHeight - halfImageHeight, 1);
        this._renderer.clear();
        this._renderer.autoClear = false;
        this._renderer.clear();
    }
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    get id() { return this._guid; }
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (!this._aoTextureComplete) {
            if (!this._isAORendering) {
                this._isAORendering = true;
            }
            this.renderOnePassAO();
            // can present something here while we wait...
            return;
        }
        const view = this._camera.matrix;
        const viewDeterminant = view.determinant();
        this._modelShaderUniforms.rSg.value = Math.pow(viewDeterminant, 0.333333333);
        this._camera.updateMatrixWorld();
        const worldViewTranspose = this._camera.matrixWorldInverse.clone().transpose();
        this._modelShaderUniforms.worldViewTranspose.value = worldViewTranspose;
        //this._modelShader.uniformsNeedUpdate = true;
        this._renderer.clear();
        this._aoRenderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
        this._aoRenderTarget.texture.magFilter = THREE.LinearFilter;
        //this._aoRenderTarget.texture.needsUpdate = true;
        this._renderer.render(this._modelScene, this._camera);
        this._aoRenderTarget.texture.minFilter = THREE.NearestFilter;
        this._aoRenderTarget.texture.magFilter = THREE.NearestFilter;
        //this._aoRenderTarget.texture.needsUpdate = true;
        this._renderer.render(this._billboardScene, this._billboardCamera);
    }
    renderOnePassAO() {
        const cameraVector = this._sphereVectors[this._aoCounter];
        this._camera.position.set(cameraVector.x * this._cameraDistance, cameraVector.y * this._cameraDistance, cameraVector.z * this._cameraDistance);
        this._camera.up.set(0, +1, 0);
        if (cameraVector.y > 0.070710678 || cameraVector.y < -0.70710678) {
            if (Math.abs(cameraVector.x) >= Math.abs(cameraVector.z)) {
                if (cameraVector.x > 0) {
                    this._camera.up.set(-1, 0, 0);
                }
                else {
                    this._camera.up.set(+1, 0, 0);
                }
            }
            else {
                if (cameraVector.z > 0) {
                    this._camera.up.set(0, 0, -1);
                }
                else {
                    this._camera.up.set(0, 0, +1);
                }
            }
        }
        this._camera.lookAt(new Vector3(0, 0, 0));
        const view = this._camera.matrix;
        const viewDeterminant = view.determinant();
        this._depthShaderUniforms.rSg.value = Math.pow(viewDeterminant, 0.333333333);
        //this._depthShader.uniformsNeedUpdate = true;
        this._aoShaderUniforms.rSg.value = Math.pow(viewDeterminant, 0.333333333);
        //this._aoShader.uniformsNeedUpdate = true;
        this._modelMesh.material = this._depthShader;
        this._renderer.setRenderTarget(this._depthRenderTarget);
        this._renderer.setClearColor(THREE.Color.NAMES["green"]);
        this._renderer.clear();
        this._renderer.render(this._modelScene, this._camera);
        this._modelMesh.material = this._aoShader;
        this._renderer.setRenderTarget(this._aoRenderTarget);
        this._aoRenderTarget.depthBuffer = false;
        this._renderer.render(this._modelScene, this._camera);
        this._aoCounter++;
        if (this._aoCounter == this._sphereVectors.length) {
            this._aoTextureComplete = true;
            this._camera.up.set(0, +1, 0);
            this._camera.position.set(0, 0, -this._cameraDistance);
            this._camera.lookAt(new Vector3(0, 0, 0));
            this._renderer.setClearColor(THREE.Color.NAMES["black"]);
            //set quad to optimizer shader
            this._quad.material = this._aoOptimizerShader;
            this._renderer.render(this._billboardScene, this._camera);
            //set quad back to basic shader to use for debug
            this._quad.material = this._basicMaterial;
            //back to canvas
            this._renderer.setRenderTarget(null);
            this._modelMesh.material = this._modelShader;
        }
    }
    start() {
        //create sphere vectors
        let indices = [];
        this._sphereVectors.push(new THREE.Vector3(1, 0, 0));
        this._sphereVectors.push(new THREE.Vector3(0, 0, 1));
        this._sphereVectors.push(new THREE.Vector3(0, -1, 0));
        this._sphereVectors.push(new THREE.Vector3(-1, 0, 0));
        this._sphereVectors.push(new THREE.Vector3(0, 1, 0));
        this._sphereVectors.push(new THREE.Vector3(0, 0, -1));
        //bottom of octahedron
        indices.push(0);
        indices.push(1);
        indices.push(2);
        indices.push(1);
        indices.push(3);
        indices.push(2);
        indices.push(3);
        indices.push(5);
        indices.push(2);
        indices.push(5);
        indices.push(0);
        indices.push(2);
        //top of octahedron
        indices.push(1);
        indices.push(0);
        indices.push(4);
        indices.push(3);
        indices.push(1);
        indices.push(4);
        indices.push(5);
        indices.push(3);
        indices.push(4);
        indices.push(0);
        indices.push(5);
        indices.push(4);
        this.generateSphereVectors(1.0, this._sphereVectors, indices, this._lightIterationFactor);
        this._aoShaderUniforms.accumulation.value = 4.0 / this._sphereVectors.length;
        this.animate();
    }
    generateSphereVectors(radius, vectors, indices, accumulate) {
        /* Assume 'vectors' initially holds vertices for eight triangles (an octahedron) */
        let newIndices = [];
        for (let i = 0; i < indices.length; i += 3) {
            let centerPoint = (vectors[indices[i]].clone().add(vectors[indices[i + 1]]).clone().add(vectors[indices[i + 2]])).clone().divideScalar(3.0);
            vectors.push(centerPoint);
            /* triangle 1*/
            newIndices.push(indices[i + 0]);
            newIndices.push(indices[i + 1]);
            newIndices.push(vectors.length - 1);
            /* triangle 2*/
            newIndices.push(indices[i + 1]);
            newIndices.push(indices[i + 2]);
            newIndices.push(vectors.length - 1);
            /* triangle 3*/
            newIndices.push(vectors.length - 1);
            newIndices.push(indices[i + 2]);
            newIndices.push(indices[i + 0]);
        }
        indices = newIndices;
        if (accumulate == 0) {
            /* We're done. Normalize the vertices,
            multiply by the radius and return. */
            for (let i = 0; i < vectors.length; ++i) {
                vectors[i] = vectors[i].normalize();
                vectors[i] = vectors[i].multiplyScalar(radius);
            }
        }
        else {
            /* Decrease recursion counter and iterate again */
            this.generateSphereVectors(radius, vectors, indices, accumulate - 1);
        }
    }
    setVertexShaderModel(code) {
        this._modelShader.vertexShader = code;
    }
    setFragmentShaderModel(code) {
        this._modelShader.fragmentShader = code;
    }
    setVertexShaderDepth(code) {
        this._depthShader.vertexShader = code;
    }
    setFragmentShaderDepth(code) {
        this._depthShader.fragmentShader = code;
    }
    setVertexShaderAO(code) {
        this._aoShader.vertexShader = code;
    }
    setFragmentShaderAO(code) {
        this._aoShader.fragmentShader = code;
    }
    setVertexShaderAOOptimized(code) {
        this._aoOptimizerShader.vertexShader = code;
    }
    setFragmentShaderAOOptimized(code) {
        this._aoOptimizerShader.fragmentShader = code;
    }
    setVertices(vertices) {
        this._bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        return BINDING.js_to_mono_obj(vertices.length.toString());
    }
    setColors(colors) {
        this._bufferGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        return BINDING.js_to_mono_obj(colors.length.toString());
    }
    setIndices(indices) {
        this._bufferGeometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
        return BINDING.js_to_mono_obj(indices.length.toString());
    }
    setSTs(sts) {
        this._bufferGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(sts, 2));
        return BINDING.js_to_mono_obj(sts.length.toString());
    }
    setRowCols(rowCols) {
        this._bufferGeometry.setAttribute("uv2", new THREE.Float32BufferAttribute(rowCols, 2));
        return BINDING.js_to_mono_obj(rowCols.length.toString());
    }
    setRadius(radius) {
        this._bufferGeometry.setAttribute("uv3", new THREE.Float32BufferAttribute(radius, 2));
        return BINDING.js_to_mono_obj(radius.length.toString());
    }
}
//needs to be on window because this is a module and the unmarshalled setting of the arrays can't access this module
const panels = new Map();
window.panels = panels;
export function createPanel(parent, moleculeRadius, numberOfItems) {
    return __awaiter(this, void 0, void 0, function* () {
        let panel = new Panel(parent, moleculeRadius, numberOfItems);
        panels.set(panel.id, panel);
        let response = yield fetch("./RenderModel.vertex.fx");
        let modelVertex = yield response.text();
        panel.setVertexShaderModel(modelVertex);
        response = yield fetch("./RenderModel.fragment.fx");
        let modelFragment = yield response.text();
        panel.setFragmentShaderModel(modelFragment);
        response = yield fetch("./DepthMap.vertex.fx");
        let depthVertex = yield response.text();
        panel.setVertexShaderDepth(depthVertex);
        response = yield fetch("./DepthMap.fragment.fx");
        let depthFragment = yield response.text();
        panel.setFragmentShaderDepth(depthFragment);
        response = yield fetch("./AOMap.vertex.fx");
        let aoVertex = yield response.text();
        panel.setVertexShaderAO(aoVertex);
        response = yield fetch("./AOMap.fragment.fx");
        let aoFragment = yield response.text();
        panel.setFragmentShaderAO(aoFragment);
        response = yield fetch("./AOMapOptimize.vertex.fx");
        let aoOptimizeVertex = yield response.text();
        panel.setVertexShaderAOOptimized(aoOptimizeVertex);
        response = yield fetch("./AOMapOptimize.fragment.fx");
        let aoOptimizeFragment = yield response.text();
        panel.setFragmentShaderAOOptimized(aoOptimizeFragment);
        return panel.id;
    });
}
export function start(id) {
    let panel = panels.get(id);
    panel === null || panel === void 0 ? void 0 : panel.start();
}
//declare var BINDING: any; //mono functions
//declare var Blazor: any;  //blazor object
//declare var Module: any;  //emscripten object
//export function setFast(panelId: any, identifier: any, value: any):any {
//    try {
//        let panelIdStr = BINDING.conv_string(panelId);
//        let panel = panels.get(panelIdStr);
//        let identifierStr = BINDING.conv_string(identifier);
//        if (identifier == "indices") {
//            let arrInt = toUInt16Array(value);
//            return panel?.setIndices(arrInt);
//        }
//        let arr = toFloat32Array(value);
//        switch (identifierStr) {
//            case "vertices":
//                return panel?.setVertices(arr);
//                break;
//            case "colors":
//                return panel?.setColors(arr);
//                break;
//            //case "indices":
//            //    return panel?.setIndices(arr);
//            //    break;
//            case "sts":
//                return panel?.setSTs(arr);
//                break;
//            case "rowcols":
//                return panel?.setRowCols(arr);
//                break;
//            case "radius":
//                return panel?.setRadius(arr);
//                break;
//        }
//    } catch (ex) {
//        console.log("error", ex);
//    }
//}
//function toFloat32Array(array: any): Float32Array {
//    const dataPtr = Blazor.platform.getArrayEntryPtr(array, 0, 4);
//    const length = Blazor.platform.getArrayLength(array);
//    return new Float32Array(Module.HEAPF32.buffer, dataPtr, length);
//}
//function toUInt16Array(array: any): Uint16Array {
//    const dataPtr = Blazor.platform.getArrayEntryPtr(array, 0, 2);
//    const length = Blazor.platform.getArrayLength(array);
//    return new Uint16Array(Module.HEAPF32.buffer, dataPtr, length);
//}
