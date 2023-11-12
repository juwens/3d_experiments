use cgmath::{Matrix4, Vector3, Rad, SquareMatrix, Matrix, num_traits::PrimInt};
use web_sys::{WebGlRenderingContext, WebGlUniformLocation};
use nameof::name_of;

mod mdn;

const VERTEX_SHADER_SOURCE : &'static str = r#"
    attribute vec3 position;
    attribute vec4 color;

    uniform mat4 model;
    uniform mat4 projection;

    varying vec4 vColor;

    void main() {
        vColor = color;
        gl_Position = projection * model * vec4(position, 1.0);
    }
"#;

const FRAGMENT_SHADER_SOURCE : &'static str  = r#"
    precision mediump float;
    varying vec4 vColor;

    void main() {
        gl_FragColor = vColor;
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
"#;

struct ShaderLocations {
    pub model : Option<WebGlUniformLocation>,
    pub projection : Option<WebGlUniformLocation>,
    pub position : u32,
    pub color : u32,
}

pub fn main(gl : &WebGlRenderingContext) {
    println!("Hello, world!");
    let cube = mdn::create_cube_data();
    let buffers = mdn::create_buffers_for_cube(gl.as_ref(), cube);
    let vert_shader = mdn::create_shader(&gl, &VERTEX_SHADER_SOURCE, WebGlRenderingContext::VERTEX_SHADER);
    let frag_shader = mdn::create_shader(&gl, &FRAGMENT_SHADER_SOURCE, WebGlRenderingContext::FRAGMENT_SHADER);
    let prog = mdn::link_program(&gl, &vert_shader, &frag_shader);
    gl.use_program(Option::Some(prog.as_ref()));
    gl.enable(WebGlRenderingContext::DEPTH_TEST);


    let locations = ShaderLocations{
        position: gl.get_attrib_location(&prog, name_of!(position in ShaderLocations)) as u32,
        projection: gl.get_uniform_location(&prog, name_of!(projection in ShaderLocations)),
        model: gl.get_uniform_location(&prog, name_of!(model in ShaderLocations)),
        color: gl.get_attrib_location(&prog, name_of!(color in ShaderLocations)) as u32,
    };
}


struct RenderParams {
    x: f32,
    y: f32,
    z: f32,
    rot_x: Rad<f32>,
    rot_y: Rad<f32>,
    fov: Rad<f32>,
    near: f32,
    far: f32,
}

pub fn draw(gl : &WebGlRenderingContext, state : &RenderParams) {
    let model = [
        Matrix4::from_translation(Vector3::new(state.x, state.y, state.z)), // step 4
        Matrix4::from_angle_y(state.rot_y), // step 3
        Matrix4::from_angle_x(state.rot_x), // step 2
        Matrix4::from_scale(5.),                   // step 1
    ].iter().fold(&cgmath::One::one(), |a, b| &(a * b));

    let projection = cgmath::perspective(state.fov, 1., state.near, state.far);

    // Update the data going to the GPU
    update_attributes_and_uniforms(&gl, ShaderInput {  
        model_transform: &model,
        projection: &projection,
    });

    // Perform the actual draw
    gl.draw_elements_with_i32(
        WebGlRenderingContext::TRIANGLES,
        this.buffers.elementsCount,
        WebGlRenderingContext::UNSIGNED_SHORT,
        0);

    // Run the draw as a loop
    //requestAnimationFrame(this.draw.bind(this));
}

struct ShaderInput<'a> {
    model_transform: &'a Matrix4<f32>,
    projection: &'a Matrix4<f32>,
    locations: &'a ShaderLocations,
}

fn update_attributes_and_uniforms(gl : &WebGlRenderingContext, data : ShaderInput) {
    // Setup the color uniform that will be shared across all triangles
    gl.uniform_matrix4fv_with_f32_array(data.locations.model.as_ref(), false, AsRef::<[f32; 16]>::as_ref(&data.model_transform) );
    gl.uniform_matrix4fv_with_f32_array(data.locations.projection.as_ref(), false, AsRef::<[f32; 16]>::as_ref(&data.projection));

    // Set the positions attribute
    gl.enable_vertex_attrib_array(data.locations.position);
    // gl.bindBuffer(WebGlRenderingContext::ARRAY_BUFFER, this.buffers.positions);
    // gl.vertexAttribPointer(this.handlers.position, 3, WebGlRenderingContext::FLOAT, false, 0, 0);

    // // Set the colors attribute
    gl.enable_vertex_attrib_array(data.locations.color);
    // gl.bindBuffer(WebGlRenderingContext::ARRAY_BUFFER, this.buffers.colors);
    // gl.vertexAttribPointer(this.handlers.color, 4, WebGlRenderingContext::FLOAT, false, 0, 0);

    // gl.bindBuffer(WebGlRenderingContext::ELEMENT_ARRAY_BUFFER, this.buffers.elements);
}