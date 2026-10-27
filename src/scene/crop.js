// Which part of the photo fills the view ("cover"): scale is the visible fraction per axis,
// offset its centre (GL, origin bottom-left). A wide photo on a narrow screen slides toward focusX instead of centring;
// a tall one on a wide screen slides down just enough to keep focusY (from the top, a sign's foot) in view.
export function cropWindow(viewAspect, photoAspect, focusX = .5, focusY = .5) {
  if (viewAspect >= photoAspect) {
    const s = photoAspect / viewAspect
    const top = Math.min(1 - s, Math.max(.5 - s / 2, focusY + .03 - s))
    return { scale: [1, s], offset: [.5, 1 - top - s / 2] }
  }
  const f = viewAspect / photoAspect
  return { scale: [f, 1], offset: [Math.min(1 - f / 2, Math.max(f / 2, focusX)), .5] }
}

// Fraction of the photo height, from the top, where its sky ends: the bottom of the lowest row
// with at least 0.5 % sky. mask is RGBA image data, dark = sky.
export function lowestSky({ data, width, height }) {
  for (let y = height - 1; y >= 0; y--) {
    let sky = 0
    for (let x = 0; x < width; x++) if (data[(y * width + x) * 4] < 128) sky++
    if (sky >= width * .005) return (y + 1) / height
  }
  return 0
}

// Below its horizon the 3D sky is the dark ground, so the camera looks up enough to put that horizon
// under the photo's lowest sky (plus a margin for the haze line). scaleY is the visible photo height,
// centre the photo height (from the top) at the middle of the screen.
export function horizonPitch(skyBottom, scaleY, minPitch, fov = 50, centre = .5) {
  const onScreen = (skyBottom - centre) / scaleY + .5 + .03
  const pitch = Math.atan((onScreen - .5) * 2 * Math.tan(fov / 2 * Math.PI / 180)) * 180 / Math.PI
  return Math.min(30, Math.max(minPitch, pitch))
}
