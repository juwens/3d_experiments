use web_sys::WebGlRenderingContext;

mod mdn;

pub fn main(gl : WebGlRenderingContext) {
    println!("Hello, world!");
    let cube = mdn::create_cube_data();
    let buffers = mdn::create_buffers_for_cube(gl.as_ref(), cube);
    println!("{}", buffers.n_elements);
}
