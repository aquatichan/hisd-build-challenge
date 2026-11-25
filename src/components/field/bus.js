// Shared, mutable state between the WebGL map and its HTML overlay (no React re-renders per frame).
// Screen positions are in the map element's local pixels.
import { map } from './field.js'

export const bus = {
  ready: false,
  campusX: new Float32Array(map.campuses.length),
  campusY: new Float32Array(map.campuses.length),
  campusOn: new Uint8Array(map.campuses.length),
  landX: new Float32Array(map.landmarks.length),
  landY: new Float32Array(map.landmarks.length),
  hover: -1, // campus under the cursor
  listHover: -1, // campus hovered/focused in the school search
}
