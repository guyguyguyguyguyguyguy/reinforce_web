// Update to webgpu once it is sufficiently supported:
// https://alain.xyz/blog/raw-webgpu


// fundation from https://codepen.io/ixkaito/embed/OJbXBqE?default-tab=js%2Cresult&embed-version=2

const main = () => {
  // Find the canvas element
  const canvas = document.querySelector('#c1');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No html canvas element.');
  }

  // WebGL rendering context
  const gl = canvas.getContext('webgl');

  if (!gl) {
    throw new Error('Unable to initialize WebGL.');
  }

  // Clear color
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // A user-defined function to create and compile shaders
  const initShader = (type: 'VERTEX_SHADER' | 'FRAGMENT_SHADER', source: string) => {
    const shader = gl.createShader(gl[type]);

    if (!shader) {
      throw new Error('Unable to create a shader.');
    }

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  // Vertex shader
  // TODO: add n circles as verticies, have them morph and move dynamically. Then project cool fragment shader patters on to these dyanmic circles
  const vertexShader = initShader('VERTEX_SHADER', `
attribute vec4 a_position;

void main() {
  gl_Position = a_position;
}
`);

  // Fragment shader
  const fragmentShader = initShader('FRAGMENT_SHADER', `
void main() {
  lowp vec4 red = vec4(1, 0, 0, 1);
  lowp vec4 green = vec4(0, 1, 0, 1);
  gl_FragColor = mix(red, green, sin(gl_FragCoord.x / 10.0) * 0.5 + 0.5);
}
`);

  // WebGL program
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Unable to create the program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Unable to link the shaders: ${gl.getProgramInfoLog(program)}`);
  }

  gl.useProgram(program);

  // Vertext buffer
  const positions = [
    -1, -1,
    -1, 1,
    1, -1,
    1, 1,
  ];
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const index = gl.getAttribLocation(program, 'a_position');

  const size = 2;
  const type = gl.FLOAT;
  const normalized = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
  gl.enableVertexAttribArray(index);

  const indicies = [
    0, 1, 2,
    1, 2, 3,
  ];
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicies), gl.STATIC_DRAW);


  // Draw the scene
  gl.drawElements(gl.TRIANGLES, indicies.length, gl.UNSIGNED_SHORT, 0);
  console.log("still here");
}

let canvas1 = document.getElementById("c1");
canvas1.addEventListener("mouseover", main);
canvas1.addEventListener("mouseout", () => { })
// window.onload = main;




