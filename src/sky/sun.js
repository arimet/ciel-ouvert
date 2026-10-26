import { Vector3 } from 'three'
import { getSunDirectionECEF } from '@takram/three-atmosphere'
import { Ellipsoid, Geodetic, radians } from '@takram/three-geospatial'

const sun = new Vector3()
const up = new Vector3()

export function sunElevationDeg(date, lat, lon) {
  getSunDirectionECEF(date, sun)
  Ellipsoid.WGS84.getSurfaceNormal(new Geodetic(radians(lon), radians(lat), 0).toECEF(), up)
  return Math.asin(sun.dot(up)) * 180 / Math.PI
}
