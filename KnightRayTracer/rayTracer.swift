import CoreImage
import simd

class RayTracer{
    public func makeTracingResult(width: Int, height: Int, samplerCount:Int = 10) -> CGImage {
        //---------------make pixels----------------------//
        var pixel = Pixel(red: 0, green: 0, blue: 0)
        var pixels = [Pixel](repeating: pixel,count: width * height)
        //-------------make scene-------------------------//
        let scene = Scene();
        let ground = Sphere(pcenter: float3(x: 0, y: -1000.2, z: -1), pradius: 1000,pmaterial:Lambertian(palbedo:float3(x: 0.9, y: 0.9, z: 0.9)));
        scene.addThing(thing: ground);
        let sphere1 = Sphere(pcenter: float3(0.3,0.0,-1),pradius: 0.2,pmaterial:Lambertian(palbedo:float3(x: 0, y: 0.7, z: 0.3)));
        scene.addThing(thing: sphere1);
        let sphere2 = Sphere(pcenter: float3(-0.1,0.0,-1),pradius: 0.2,pmaterial:Metal(palbedo:float3(x: 0.8, y: 0.3, z: 0.4),pfuzz:0.1));
        scene.addThing(thing: sphere2);
        //
        //i:x
        //j:y
        //let cam = camera()
        let lookFrom = float3(0, 0, 0)
        let lookAt = float3(0,0,-1)
        let vup = float3(0, -1, 0)
        let cam = Camera(lookFrom: lookFrom, lookAt: lookAt, vup: vup, vfov: 50, aspect: Float(width) / Float(height));
        //
        for i in 0..<width {
            for j in 0..<height {
                var col = float3()
                for _ in 0..<samplerCount {
                    let u = (Float(i) + Float(drand48()))/Float(width);
                    let v = (Float(j) + Float(drand48()))/Float(height);
                    let r = cam.getRay(s: u, t: v);
                    col += scene.color(ray: r)
                }
                col /= float3(Float(samplerCount));
                pixel = Pixel(red: UInt8(col.x * 255), green: UInt8(col.y * 255), blue: UInt8(col.z * 255))
                pixels[i + j * width] = pixel
            }
        }
        //---------------make image-----------------------//
        let bitsPerComponent = 8
        let bitsPerPixel = 32
        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue) // alpha is last
        
        let providerRef = CGDataProvider(data: NSData(bytes: pixels, length: pixels.count * MemoryLayout<Pixel>.size))
        let image = CGImage(width: width, height: height, bitsPerComponent: bitsPerComponent, bitsPerPixel: bitsPerPixel, bytesPerRow: width * MemoryLayout<Pixel>.size, space: rgbColorSpace, bitmapInfo: bitmapInfo, provider: providerRef!, decode: nil, shouldInterpolate: true, intent: CGColorRenderingIntent.defaultIntent)
        return image!;
    }
}
