use cgmath::{Matrix3, Angle, Matrix4};
use web_sys::{WebGlRenderingContext, WebGlBuffer, WebGlShader, WebGlProgram};

pub struct CubeData {
    pub positions: Vec<f32>,
    pub elements: Vec<i32>,
    pub colors: Vec<f32>,
}

pub fn create_cube_data() -> CubeData {
    let positions = vec![
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];

    let colors_of_faces: [[f32; 4]; 6] = [
        [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
        [1.0, 0.3, 0.3, 1.0],    // Back face: red
        [0.3, 1.0, 0.3, 1.0],    // Top face: green
        [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
        [1.0, 0.3, 1.0, 1.0]     // Left face: purple
    ];

    // length == 96, which is 24 * 4 = 6 (faces) * 4 (v per face) * 4 (num per color)
    // so it seemingly correlates to the indexes in the elements
    let mut colors: Vec<f32> = Vec::new();

    for face_color in colors_of_faces {
        for _ in 0..4 {
            colors.extend(face_color.iter());
        }
    }

    assert_eq!(colors.len(), 24 * 4);

    let elements = vec![
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23    // left
    ];

    assert_eq!(elements.len(), 6 * 6);

    let res = CubeData {
        positions: positions,
        colors: colors,
        elements: elements,
    };

    return res;
}


pub struct CreateBufferResult {
    pub positions: WebGlBuffer,
    pub colors:  WebGlBuffer,
    pub elements:  WebGlBuffer,
    pub n_elements: usize,
}

// https://github.com/rustwasm/wasm-bindgen/blob/main/examples/webgl/src/lib.rs#L44
pub fn create_buffers_for_cube(gl: &WebGlRenderingContext, cube: CubeData) -> CreateBufferResult {
    
    let positions = gl.create_buffer();
    gl.bind_buffer(WebGlRenderingContext::ARRAY_BUFFER, positions.as_ref());
    gl.buffer_data_with_array_buffer_view(
        WebGlRenderingContext::ARRAY_BUFFER,
        &view_f32(cube.positions),
        WebGlRenderingContext::STATIC_DRAW
    );

    let colors = gl.create_buffer();
    gl.bind_buffer(WebGlRenderingContext::ARRAY_BUFFER, colors.as_ref());
    gl.buffer_data_with_array_buffer_view(
            WebGlRenderingContext::ARRAY_BUFFER,
            &view_f32(cube.colors),
            WebGlRenderingContext::STATIC_DRAW);

    let elements = gl.create_buffer();
    let n_elements = cube.elements.len();
    gl.bind_buffer(WebGlRenderingContext::ELEMENT_ARRAY_BUFFER, elements.as_ref());
    gl.buffer_data_with_array_buffer_view(
        WebGlRenderingContext::ELEMENT_ARRAY_BUFFER, 
        &view_i32(cube.elements), 
        WebGlRenderingContext::STATIC_DRAW);

    return CreateBufferResult {
        positions: positions.unwrap(),
        colors: colors.unwrap(),
        elements: elements.unwrap(),
        n_elements,
    };
    
    fn view_f32(mut vec : Vec<f32>) -> js_sys::Float32Array {
        unsafe {
            return js_sys::Float32Array::view_mut_raw(vec.as_mut_ptr(), vec.len());
        }
    }
    
    fn view_i32(mut vec : Vec<i32>) -> js_sys::Int32Array {
        unsafe {
            return js_sys::Int32Array::view_mut_raw(vec.as_mut_ptr(), vec.len());
        }
    }
}

pub fn create_shader(gl : &WebGlRenderingContext, source : &str, type_ : u32) -> WebGlShader {
    // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER

    let shader = gl.create_shader(type_).unwrap();
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);

    if !gl.get_shader_parameter(&shader, WebGlRenderingContext::COMPILE_STATUS) {
        let info = gl.get_shader_info_log(&shader);
        panic!("{:?}", info);
    }

    return shader
}

pub fn link_program(gl: &WebGlRenderingContext, vertex_shader : &WebGlShader, fragment_shader : &WebGlShader) -> WebGlProgram {
    let program = gl.create_program().unwrap();

    gl.attach_shader(&program, vertex_shader);
    gl.attach_shader(&program, fragment_shader);

    gl.link_program(&program);

    if !gl.get_program_parameter(&program, WebGlRenderingContext::LINK_STATUS) {
        let info = gl.get_program_info_log(&program);
        panic!("{:?}", info);
    }

    return program;
}

pub fn perspective_matrix(fov : f32, aspect_ratio : f32, near : f32, far : f32) -> Matrix4<f32> {
    // Construct a perspective matrix

    /*
        Field of view - the angle in radians of what's in view along the Y axis
        Aspect Ratio - the ratio of the canvas, typically canvas.width / canvas.height
        Near - Anything before this point in the Z direction gets clipped (outside of the clip space)
        Far - Anything after this point in the Z direction gets clipped (outside of the clip space)
    */

    let f = 1.0f32 / (fov / 2f32).tan();
    let range_inv = 1f32 / (near - far);

    return Matrix4::new(
        f / aspect_ratio, 0.0, 0.0, 0.0,
        0.0, f, 0.0, 0.0,
        0.0, 0.0, (near + far) * range_inv, -1.0,
        0.0, 0.0, near * far * range_inv * 2.0, 0.0
    );
}

// export class MDN {

//     public static rotateXMatrix(a) : Float16  {
//         var cos = Math.cos;
//         var sin = Math.sin;

//         return [
//             1, 0, 0, 0,
//             0, cos(a), -sin(a), 0,
//             0, sin(a), cos(a), 0,
//             0, 0, 0, 1
//         ];
//     }

//     public static rotateYMatrix(a) : Float16  {
//         var cos = Math.cos;
//         var sin = Math.sin;

//         return [
//             cos(a), 0, sin(a), 0,
//             0, 1, 0, 0,
//             -sin(a), 0, cos(a), 0,
//             0, 0, 0, 1
//         ];
//     }

//     public static rotateZMatrix(a) : Float16  {
//         var cos = Math.cos;
//         var sin = Math.sin;

//         return [
//             cos(a), -sin(a), 0, 0,
//             sin(a), cos(a), 0, 0,
//             0, 0, 1, 0,
//             0, 0, 0, 1
//         ];
//     }

//     public static translateMatrix(x, y, z) : Float16  {
//         return [
//             1, 0, 0, 0,
//             0, 1, 0, 0,
//             0, 0, 1, 0,
//             x, y, z, 1
//         ];
//     }

//     public static scaleMatrix(w, h, d) : Float16  {
//         return [
//             w, 0, 0, 0,
//             0, h, 0, 0,
//             0, 0, d, 0,
//             0, 0, 0, 1
//         ];
//     }

//     public static orthographicMatrix(left, right, bottom, top, near, far) : Float16  {
//         // Each of the parameters represents the plane of the bounding box

//         var lr = 1 / (left - right);
//         var bt = 1 / (bottom - top);
//         var nf = 1 / (near - far);

//         var row4col1 = (left + right) * lr;
//         var row4col2 = (top + bottom) * bt;
//         var row4col3 = (far + near) * nf;

//         return [
//             -2 * lr, 0, 0, 0,
//             0, -2 * bt, 0, 0,
//             0, 0, 2 * nf, 0,
//             row4col1, row4col2, row4col3, 1
//         ];
//     }
// }