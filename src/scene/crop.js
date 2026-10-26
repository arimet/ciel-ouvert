// Which part of the photo fills the view ("cover"): scale is the visible fraction per axis,
// offset its centre. A wide photo on a narrow screen slides toward focusX instead of centring.
export function cropWindow(viewAspect, photoAspect, focusX = .5) {
  if (viewAspect >= photoAspect) return { scale: [1, photoAspect / viewAspect], offset: [.5, .5] }
  const f = viewAspect / photoAspect
  return { scale: [f, 1], offset: [Math.min(1 - f / 2, Math.max(f / 2, focusX)), .5] }
}
