//precision highp float;

// Attributes
//attribute vec3 position;
//attribute vec3 color;

// Varying
varying vec3 vColor;

void main(void) {
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    gl_Position = pos;
    
    vColor = color;

}