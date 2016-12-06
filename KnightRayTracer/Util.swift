//
//  util.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/28.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd;

func nearlyEqual(value:Float,compare:Float,tolerance:Float)->Bool{
    if(abs(value - compare)<tolerance){
        return true;
    }
    else{
        return false;
    }
}

func randomVectorInUnitSphere() -> float3 {
    var p = float3()
    repeat {
        p = 2.0 * float3(x: Float(drand48()), y: Float(drand48()), z: Float(drand48())) - float3(x: 1, y: 1, z: 1)
    } while dot(p, p) >= 1.0
    return p
}

func refract(v: float3, n: float3, ni_over_nt: Float) -> float3? {
    let uv = normalize(v)
    let dt = dot(uv, n)
    let discriminant = 1.0 - ni_over_nt * ni_over_nt * (1.0 - dt * dt)
    if discriminant > 0 {
        return ni_over_nt * (uv - n * dt) - n * sqrt(discriminant)
    }
    return nil
}

func schlick(_ cosine: Float, _ index: Float) -> Float {
    var r0 = (1 - index) / (1 + index)
    r0 = r0 * r0
    return r0 + (1 - r0) * powf(1 - cosine, 5)
}
