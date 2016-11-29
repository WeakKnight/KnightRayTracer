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
    var origin: float3
    var direction: float3
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
/**
 *                     maxVertex
 *       _______________
 *      /               /
 *     / |             /|
 *    /  |            / |
 *    ----------------  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   |           |  |
 *   |   ------------|--
 *   |  /            | /
 *   | /             |/
 *   |/______________/
 *  minVertex
 */
/*
 class Ray
 {
 public:
 Ray(const Vec3f &orig, const Vec3f &dir) : orig(orig), dir(dir)
 {
 invdir = 1 / dir;
 sign[0] = (invdir.x < 0);
 sign[1] = (invdir.y < 0);
 sign[2] = (invdir.z < 0);
 }
 Vec3f orig, dir; // ray orig and dir
 Vec3f invdir;
 int sign[3];
 };
 class AABBox
 {
 public:
 AABBox(const Vec3f &b0, const Vec3f &b1) { bounds[0] = b0, bounds[1] = b1; }
 bool intersect(const Ray &r, float &t) const
 {
 float tmin, tmax, tymin, tymax, tzmin, tzmax;
 
 tmin = (bounds[r.sign[0]].x - r.orig.x) * r.invdir.x;
 tmax = (bounds[1-r.sign[0]].x - r.orig.x) * r.invdir.x;
 tymin = (bounds[r.sign[1]].y - r.orig.y) * r.invdir.y;
 tymax = (bounds[1-r.sign[1]].y - r.orig.y) * r.invdir.y;
 
 if ((tmin > tymax) || (tymin > tmax))
 return false;
 
 if (tymin > tmin)
 tmin = tymin;
 if (tymax < tmax)
 tmax = tymax;
 
 tzmin = (bounds[r.sign[2]].z - r.orig.z) * r.invdir.z;
 tzmax = (bounds[1-r.sign[2]].z - r.orig.z) * r.invdir.z;
 
 if ((tmin > tzmax) || (tzmin > tmax))
 return false;
 
 if (tzmin > tmin)
 tmin = tzmin;
 if (tzmax < tmax)
 tmax = tzmax;
 
 t = tmin;
 
 if (t < 0) {
 t = tmax;
 if (t < 0) return false;
 }
 
 return true;
 }
 Vec3f bounds[2];
 };
 */
/*
 v3 Box::normalAt(const v3 &point) {
 v3 normal;
 v3 localPoint = point - center;
 float min = std::numeric_limits<float>::max();
 float distance = std::abs(size.x - std::abs(localPoint.x));
 if (distance < min) {
 min = distance;
 normal.set(1, 0, 0);
 normal *= SIGN(localPoint.x);
 }
 distance = std::abs(size.y - std::abs(localPoint.y));
 if (distance < min) {
 min = distance;
 normal.set(0, 1, 0);
 normal *= SIGN(localPoint.y);
 }
 distance = std::abs(size.z - std::abs(localPoint.z));
 if (distance < min) {
 min = distance;
 normal.set(0, 0, 1);
 normal *= SIGN(localPoint.z);
 }
 return normal;
 }
 */
class Box:Hitable{
    var material:Material = Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3));
    var bounds = [float3]();
    init(pminVertex:float3,pmaxVertex:float3,pmaterial:Material){
        bounds.append(pminVertex);
        bounds.append(pmaxVertex);
        material = pmaterial;
    }
    func normalAt(point:float3)->float3{
        if(nearlyEqual(value: point.x, compare: bounds[0].x, tolerance: 0.0001)){
            return float3(-1,0,0);
        }
        if(nearlyEqual(value: point.x, compare: bounds[1].x, tolerance: 0.0001)){
            return float3(1,0,0);
        }
        if(nearlyEqual(value: point.y, compare: bounds[0].y, tolerance: 0.0001)){
            return float3(0,-1,0);
        }
        if(nearlyEqual(value: point.y, compare: bounds[1].y, tolerance: 0.0001)){
            return float3(0,1,0);
        }
        if(nearlyEqual(value: point.z, compare: bounds[0].z, tolerance: 0.0001)){
            return float3(0,0,-1);
        }
        if(nearlyEqual(value: point.z, compare: bounds[1].z, tolerance: 0.0001)){
            return float3(0,0,1);
        }
        return float3();
    }
    func hit(ray:Ray) -> HitResult{
        var sign = [Int]();
        let invdir:float3 = float3(1/ray.direction.x,1/ray.direction.y,1/ray.direction.z);
        sign.append(Int(NSNumber(value:(invdir.x)<0)));
        sign.append(Int(NSNumber(value:(invdir.y)<0)));
        sign.append(Int(NSNumber(value:(invdir.z)<0)));
        let result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:material);
        var t:Float = 0;
        var tmin:Float = 0;
        var tmax:Float = 0;
        var tymin:Float = 0;
        var tymax:Float = 0;
        var tzmin:Float = 0;
        var tzmax:Float = 0;
        //
        tmin = (bounds[sign[0]].x - ray.origin.x) * invdir.x;
        tmax = (bounds[1-sign[0]].x - ray.origin.x) * invdir.x;
        tymin = (bounds[sign[1]].y - ray.origin.y) * invdir.y;
        tymax = (bounds[1-sign[1]].y - ray.origin.y) * invdir.y;
        
        if ((tmin > tymax) || (tymin > tmax)){
            return result;
        }
        
        if (tymin > tmin){
            tmin = tymin;
        }
        
        if (tymax < tmax){
            tmax = tymax;
        }
        
        
        tzmin = (bounds[sign[2]].z - ray.origin.z) * invdir.z;
        tzmax = (bounds[1-sign[2]].z - ray.origin.z) * invdir.z;
        
        if ((tmin > tzmax) || (tzmin > tmax)){
            return result;
        }
        
        if (tzmin > tmin){
            tmin = tzmin;
        }
        if (tzmax < tmax){
            tmax = tzmax;
        }
        
        t = tmin;
        
        if (t < 0) {
            t = tmax;
            if (t < 0){
                return result;
            }
        }
        //true
        return HitResult(pisHit:true, pdistance: t,pnormal: normalAt(point: ray.origin + ray.direction*t),phitVector: ray.origin + ray.direction*(t),pmaterial:material);
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
        return Ray(origin: origin, direction: normalize(bottomLeft + s * horizontal + t * vertical - origin))
    }
}
