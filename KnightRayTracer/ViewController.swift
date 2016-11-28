//
//  ViewController.swift
//  KnightRayTracer
//
//  Created by Knight on 2016/11/28.
//  Copyright © 2016年 Knight. All rights reserved.
//

import Cocoa

class ViewController: NSViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        let rayTrecer = RayTracer();
        let cgImage = rayTrecer.makeTracingResult(width: 800, height: 400, samplerCount: 20);
        let size:NSSize = NSSize.init(width: 800, height: 400);
        let nsImage:NSImage = NSImage.init(cgImage:cgImage , size: size);
        imageView.image = nsImage;
    }

    override var representedObject: Any? {
        didSet {
        }
    }

    @IBOutlet var imageView: NSImageView!
}

