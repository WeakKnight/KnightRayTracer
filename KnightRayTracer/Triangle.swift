//
//  Triangle.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/29.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd
class Triangle:Hitable{
    var v0:float3 = float3();
    var v1:float3 = float3();
    var v2:float3 = float3();
    var material:Material;
    init(p1:float3,p2:float3,p3:float3,pmaterial:Material) {
        v0 = p1;
        v1 = p2;
        v2 = p3;
        material = pmaterial;
    }
    func hit(ray: Ray) -> HitResult {
        var result = HitResult(pisHit:false, pdistance: -1,pnormal: float3(),phitVector: float3(),pmaterial:material);
        let orig = ray.origin;
        let dir = ray.direction;
        var t:Float = 0;
        let v0v1 = v1 - v0;
        let v0v2 = v2 - v0;
        // no need to normalize
        let N = cross(v0v1, v0v2); // N
        //let area2 = length(N);
        
        // Step 1: finding P
        
        // check if ray and plane are parallel ?
        let NdotRayDirection = dot(N,dir);
        if (abs(NdotRayDirection) < FLT_EPSILON){
            return result;
        }
        // compute d parameter using equation 2
        let d = dot(N,v0);
        
        // compute t (equation 3)
        t = (dot(N,orig) + d) * (1/NdotRayDirection);
        // check if the triangle is in behind the ray
        if (t < 0)
        {
            return result;
        }// the triangle is behind
        
        // compute the intersection point using equation 1
        let P = orig + t * dir;
        
        // Step 2: inside-outside test
        var C = float3(); // vector perpendicular to triangle's plane
        
        // edge 0
        let edge0 = v1 - v0;
        let vp0 = P - v0;
        C = cross(edge0, vp0);
        
        if (dot(N,C) < 0)
        {
            return result; // P is on the right side
        }
        
        // edge 1
        let edge1 = v2 - v1;
        let vp1 = P - v1;
        C = cross(edge1,vp1);
        if (dot(N,C) < 0)
        {
            return result;
        }
        // edge 2
        let edge2 = v0 - v2;
        let vp2 = P - v2;
        C = cross(edge2,vp2);
        if (dot(N,C) < 0)
        {
            return result;
        } // P is on the right side;
        result = HitResult(pisHit:true, pdistance: t,pnormal: normalize(N),phitVector: orig + t*dir,pmaterial:material);
        result.material = material;
        return result;
    }
}
/*
 bool rayTriangleIntersect(
 const Vec3f &orig, const Vec3f &dir,
 const Vec3f &v0, const Vec3f &v1, const Vec3f &v2,
 float &t)
 {
 // compute plane's normal
 Vec3f v0v1 = v1 - v0;
 Vec3f v0v2 = v2 - v0;
 // no need to normalize
 Vec3f N = v0v1.crossProduct(v0v2); // N
 float area2 = N.length();
 
 // Step 1: finding P
 
 // check if ray and plane are parallel ?
 float NdotRayDirection = N.dotProduct(dir);
 if (fabs(NdotRayDirection) < kEpsilon) // almost 0
 return false; // they are parallel so they don't intersect !
 
 // compute d parameter using equation 2
 float d = N.dotProduct(v0);
 
 // compute t (equation 3)
 t = (N.dotProduct(orig) + d) / NdotRayDirection;
 // check if the triangle is in behind the ray
 if (t < 0) return false; // the triangle is behind
 
 // compute the intersection point using equation 1
 Vec3f P = orig + t * dir;
 
 // Step 2: inside-outside test
 Vec3f C; // vector perpendicular to triangle's plane
 
 // edge 0
 Vec3f edge0 = v1 - v0;
 Vec3f vp0 = P - v0;
 C = edge0.crossProduct(vp0);
 if (N.dotProduct(C) < 0) return false; // P is on the right side
 
 // edge 1
 Vec3f edge1 = v2 - v1;
 Vec3f vp1 = P - v1;
 C = edge1.crossProduct(vp1);
 if (N.dotProduct(C) < 0)  return false; // P is on the right side
 
 // edge 2
 Vec3f edge2 = v0 - v2;
 Vec3f vp2 = P - v2;
 C = edge2.crossProduct(vp2);
 if (N.dotProduct(C) < 0) return false; // P is on the right side;
 
 return true; // this ray hits the triangle
 }
 */
