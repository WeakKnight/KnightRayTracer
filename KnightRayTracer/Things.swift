import Foundation
import simd

public struct Pixel {
    var r: UInt8
    var g: UInt8
    var b: UInt8
    var a: UInt8
    init(red: UInt8, green: UInt8, blue: UInt8) {
        r = red
        g = green
        b = blue
        a = 255
    }
}

struct Ray {
    var origin: float3;
    var direction: float3;
}

struct Light {
    var color:float3
    var origin:float3
}

class HitResult{
    var isHit:Bool = false;
    var distance:Float = 0.0;
    var normal:float3 = float3();
    var hitVector:float3 = float3();
    var material:Material = Lambertian(palbedo:float3(x: 0.0, y: 0.0, z: 0.0));
    init(pisHit:Bool,pdistance:Float,pnormal:float3,phitVector:float3,pmaterial:Material) {
        isHit = pisHit;
        distance = pdistance;
        normal = pnormal;
        hitVector = phitVector;
        material = pmaterial;
    }
}

protocol Hitable {
    func hit(ray:Ray)->HitResult
}

class Sphere:Hitable{
    
    var center:float3 = float3(0.0,0.0,0.0)
    var radius:Float = 0.0;
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3));
    
    init(pcenter:float3, pradius:Float,pmaterial:Material) {
        center = pcenter;
        radius = pradius;
        material = pmaterial;
    }
    
    func hit(ray:Ray) -> HitResult {
        let result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:material);
        let oc = ray.origin - center
        let a = dot(ray.direction, ray.direction)
        let b = dot(oc, ray.direction)
        let c = dot(oc, oc) - radius*radius
        let discriminant = b*b - a*c
        if discriminant > 0 {
            var t = (-b - sqrt(discriminant) ) / a
            if t < 0.001 {
                t = (-b + sqrt(discriminant) ) / a
            }
            if 0.001 < t && t < Float.infinity {
                result.distance = t;
                result.hitVector = ray.origin + ray.direction*result.distance; // r.point_at_parameter(rec.t)
                result.normal = (result.hitVector - center) / float3(radius)
                result.material = material;
                result.isHit = true;
                return result;
            }
        }
        result.isHit = false;
        return result;
    }
}

class Mesh{
    
}

struct Camera {
    let bottomLeft, horizontal, vertical, origin, u, v, w: float3
    init(lookFrom: float3, lookAt: float3, vup: float3, vfov: Float, aspect: Float) {
        let theta = vfov * Float(M_PI) / 180
        let half_height = tan(theta / 2)
        let half_width = aspect * half_height
        origin = lookFrom
        w = normalize(lookFrom - lookAt)
        u = normalize(cross(vup, w))
        v = cross(w, u)
        bottomLeft = origin - half_width * u - half_height * v - w
        horizontal = 2 * half_width * u
        vertical = 2 * half_height * v
    }
    func getRay(s: Float, t: Float) -> Ray {
        return Ray(origin: origin, direction: normalize(bottomLeft + s * horizontal + t * vertical - origin));
    }
}
