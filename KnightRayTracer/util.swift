//
//  util.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/28.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Foundation
import simd;

func randomVectorInUnitSphere() -> float3 {
    var p = float3()
    repeat {
        p = 2.0 * float3(x: Float(drand48()), y: Float(drand48()), z: Float(drand48())) - float3(x: 1, y: 1, z: 1)
    } while dot(p, p) >= 1.0
    return p
}
