use std::f32::consts::PI;

use cgmath::{Matrix4, Rad, Vector3};
use mdn::CreateBufferResult;
use nameof::name_of;
use web_sys::{WebGlProgram, WebGlRenderingContext, WebGlUniformLocation};

mod mdn;

pub fn main(gl: &WebGlRenderingContext) {
    let mut renderer = WebGlRenderer::new(gl);
    renderer.init();
    let params = RenderParams {
        x: 0.,
        y: 0.,
        z: 0.,
        rot_x: Rad(0.0),
        rot_y: Rad(0.0),
        fov: Rad(PI * 0.5),
        near: 1.,
        far: 100.,
    };
    renderer.draw(&params);
}

const VERTEX_SHADER_SOURCE: &'static str = r#"
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

const FRAGMENT_SHADER_SOURCE: &'static str = r#"
    precision mediump float;
    varying vec4 vColor;

    void main() {
        gl_FragColor = vColor;
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
"#;

struct ShaderLocations {
    pub model: Option<WebGlUniformLocation>,
    pub projection: Option<WebGlUniformLocation>,
    pub position: u32,
    pub color: u32,
}

struct WebGlRenderer<'a> {
    gl: &'a WebGlRenderingContext,
    locations: Option<ShaderLocations>,
    buffers: Option<CreateBufferResult>,
    prog: Option<WebGlProgram>,
}

impl<'a> WebGlRenderer<'a> {
    fn new(gl: &'a WebGlRenderingContext) -> Self {
        return Self {
            gl: gl,
            locations: None,
            buffers: None,
            prog: None,
        };
    }

    pub fn init(&mut self) {
        let cube = mdn::create_cube_data();
        let _ = self
            .buffers
            .insert(mdn::create_buffers_for_cube(self.gl.as_ref(), cube));

        let prog = self.prog.insert(WebGlRenderer::setup_shaders(&self.gl));

        let _ = self.locations.insert(ShaderLocations {
            position: self
                .gl
                .get_attrib_location(&prog, name_of!(position in ShaderLocations))
                as u32,
            projection: self
                .gl
                .get_uniform_location(&prog, name_of!(projection in ShaderLocations)),
            model: self
                .gl
                .get_uniform_location(&prog, name_of!(model in ShaderLocations)),
            color: self
                .gl
                .get_attrib_location(&prog, name_of!(color in ShaderLocations))
                as u32,
        });
    }

    fn setup_shaders(gl: &WebGlRenderingContext) -> web_sys::WebGlProgram {
        let vert_shader = mdn::create_shader(
            &gl,
            &VERTEX_SHADER_SOURCE,
            WebGlRenderingContext::VERTEX_SHADER,
        );
        let frag_shader = mdn::create_shader(
            &gl,
            &FRAGMENT_SHADER_SOURCE,
            WebGlRenderingContext::FRAGMENT_SHADER,
        );
        let prog = mdn::link_program(&gl, &vert_shader, &frag_shader);
        gl.use_program(Some(&prog));
        gl.enable(WebGlRenderingContext::DEPTH_TEST);
        return prog;
    }

    pub fn draw(&self, params: &RenderParams) {
        let translations = [
            Matrix4::from_translation(Vector3::new(params.x, params.y, params.z)), // step 4
            Matrix4::from_angle_y(params.rot_y),                                   // step 3
            Matrix4::from_angle_x(params.rot_x),                                   // step 2
            Matrix4::from_scale(5.),                                               // step 1
        ];
        let model_trans = translations
            .iter()
            .fold(cgmath::One::one(), |a, b| a * b);

        let projection = cgmath::perspective(params.fov, 1., params.near, params.far);

        // Update the data going to the GPU
        self.update_attributes_and_uniforms(ShaderInput {
            model_transform: &model_trans,
            projection: &projection,
        });

        // Perform the actual draw
        self.gl.draw_elements_with_i32(
            WebGlRenderingContext::TRIANGLES,
            self.buffers.as_ref().unwrap().n_elements as i32,
            WebGlRenderingContext::UNSIGNED_SHORT,
            0,
        );

        // Run the draw as a loop
        //requestAnimationFrame(this.draw.bind(this));
    }

    fn update_attributes_and_uniforms(&self, data: ShaderInput) {
        // Setup the color uniform that will be shared across all triangles
        self.gl.uniform_matrix4fv_with_f32_array(
            self.locations.as_ref().unwrap().model.as_ref(),
            false,
            AsRef::<[f32; 16]>::as_ref(&data.model_transform),
        );
        self.gl.uniform_matrix4fv_with_f32_array(
            self.locations.as_ref().unwrap().projection.as_ref(),
            false,
            AsRef::<[f32; 16]>::as_ref(&data.projection),
        );

        // Set the positions attribute
        self.gl
            .enable_vertex_attrib_array(self.locations.as_ref().unwrap().position);
        // self.gl.bindBuffer(WebGlRenderingContext::ARRAY_BUFFER, this.buffers.positions);
        // self.gl.vertexAttribPointer(this.handlers.position, 3, WebGlRenderingContext::FLOAT, false, 0, 0);

        // Set the colors attribute
        self.gl
            .enable_vertex_attrib_array(self.locations.as_ref().unwrap().color);
        // self.gl.bindBuffer(WebGlRenderingContext::ARRAY_BUFFER, this.buffers.colors);
        // self.gl.vertexAttribPointer(this.handlers.color, 4, WebGlRenderingContext::FLOAT, false, 0, 0);

        // self.gl.bindBuffer(WebGlRenderingContext::ELEMENT_ARRAY_BUFFER, this.buffers.elements);
    }
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

struct ShaderInput<'a> {
    model_transform: &'a Matrix4<f32>,
    projection: &'a Matrix4<f32>,
}
