var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * 抽象shader类，所有shader的基类
         */
        var EgretShader = (function () {
            function EgretShader(gl) {
                // 着色器源码
                this.defaultVertexSrc = "attribute vec2 aVertexPosition;\n" +
                    "attribute vec2 aTextureCoord;\n" +
                    "attribute vec2 aColor;\n" +
                    "uniform vec2 projectionVector;\n" +
                    // "uniform vec2 offsetVector;\n" +
                    "varying vec2 vTextureCoord;\n" +
                    "varying vec4 vColor;\n" +
                    "const vec2 center = vec2(-1.0, 1.0);\n" +
                    "void main(void) {\n" +
                    "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
                    "   vTextureCoord = aTextureCoord;\n" +
                    "   vColor = vec4(aColor.x, aColor.x, aColor.x, aColor.x);\n" +
                    "}";
                this.fragmentSrc = "";
                this.gl = null;
                this.program = null;
                this.uniforms = {
                    projectionVector: { type: '2f', value: { x: 0, y: 0 }, dirty: true }
                };
                this.gl = gl;
            }
            EgretShader.prototype.init = function () {
                var gl = this.gl;
                var program = native2.WebGLUtils.compileProgram(gl, this.defaultVertexSrc, this.fragmentSrc);
                gl.useProgram(program);
                this.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
                this.aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");
                this.colorAttribute = gl.getAttribLocation(program, "aColor");
                if (this.colorAttribute === -1) {
                    this.colorAttribute = 2;
                }
                this.attributes = [this.aVertexPosition, this.aTextureCoord, this.colorAttribute];
                for (var key in this.uniforms) {
                    this.uniforms[key].uniformLocation = gl.getUniformLocation(program, key);
                }
                this.initUniforms();
                this.program = program;
            };
            EgretShader.prototype.initUniforms = function () {
                if (!this.uniforms) {
                    return;
                }
                var gl = this.gl;
                var uniform;
                for (var key in this.uniforms) {
                    uniform = this.uniforms[key];
                    uniform.dirty = true;
                    var type = uniform.type;
                    if (type === 'mat2' || type === 'mat3' || type === 'mat4') {
                        uniform.glMatrix = true;
                        uniform.glValueLength = 1;
                        if (type === 'mat2') {
                            uniform.glFunc = gl.uniformMatrix2fv;
                        }
                        else if (type === 'mat3') {
                            uniform.glFunc = gl.uniformMatrix3fv;
                        }
                        else if (type === 'mat4') {
                            uniform.glFunc = gl.uniformMatrix4fv;
                        }
                    }
                    else {
                        uniform.glFunc = gl['uniform' + type];
                        if (type === '2f' || type === '2i') {
                            uniform.glValueLength = 2;
                        }
                        else if (type === '3f' || type === '3i') {
                            uniform.glValueLength = 3;
                        }
                        else if (type === '4f' || type === '4i') {
                            uniform.glValueLength = 4;
                        }
                        else {
                            uniform.glValueLength = 1;
                        }
                    }
                }
            };
            EgretShader.prototype.syncUniforms = function () {
                if (!this.uniforms) {
                    return;
                }
                var uniform;
                var gl = this.gl;
                for (var key in this.uniforms) {
                    uniform = this.uniforms[key];
                    if (uniform.dirty) {
                        if (uniform.glValueLength === 1) {
                            if (uniform.glMatrix === true) {
                                uniform.glFunc.call(gl, uniform.uniformLocation, uniform.transpose, uniform.value);
                            }
                            else {
                                uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value);
                            }
                        }
                        else if (uniform.glValueLength === 2) {
                            uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y);
                        }
                        else if (uniform.glValueLength === 3) {
                            uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y, uniform.value.z);
                        }
                        else if (uniform.glValueLength === 4) {
                            uniform.glFunc.call(gl, uniform.uniformLocation, uniform.value.x, uniform.value.y, uniform.value.z, uniform.value.w);
                        }
                        uniform.dirty = false;
                    }
                }
            };
            /**
             * 同步视角坐标
             */
            EgretShader.prototype.setProjection = function (projectionX, projectionY) {
                var uniform = this.uniforms.projectionVector;
                if (uniform.value.x != projectionX || uniform.value.y != projectionY) {
                    uniform.value.x = projectionX;
                    uniform.value.y = projectionY;
                    uniform.dirty = true;
                }
            };
            /**
             * 设置attribute pointer
             */
            EgretShader.prototype.setAttribPointer = function (stride) {
                var gl = this.gl;
                gl.vertexAttribPointer(this.aVertexPosition, 2, gl.FLOAT, false, stride, 0);
                gl.vertexAttribPointer(this.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * 4);
                gl.vertexAttribPointer(this.colorAttribute, 1, gl.FLOAT, false, stride, 4 * 4);
            };
            return EgretShader;
        }());
        native2.EgretShader = EgretShader;
        __reflect(EgretShader.prototype, "egret.native2.EgretShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var TextureShader = (function (_super) {
            __extends(TextureShader, _super);
            function TextureShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = "precision lowp float;\n" +
                    "varying vec2 vTextureCoord;\n" +
                    "varying vec4 vColor;\n" +
                    "uniform sampler2D uSampler;\n" +
                    "void main(void) {\n" +
                    "gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;\n" +
                    "}";
                return _this;
                // webGL 默认上链接材质缓存，可以不手动上传uSampler属性
                // private uSampler:WebGLUniformLocation;
                // public init():void {
                // super.init();
                // this.uSampler = gl.getUniformLocation(program, "uSampler");
                // }
            }
            return TextureShader;
        }(native2.EgretShader));
        native2.TextureShader = TextureShader;
        __reflect(TextureShader.prototype, "egret.native2.TextureShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * 测量文本在指定样式下的宽度。
         * @param text 要测量的文本内容。
         * @param fontFamily 字体名称
         * @param fontSize 字体大小
         * @param bold 是否粗体
         * @param italic 是否斜体
         */
        function measureText(text, fontFamily, fontSize, bold, italic) {
            return egret_native.Label.getTextWidth(text, fontSize);
            ;
            // let font:string;
            // var arr:string[];
            // if(fontFamily.indexOf(", ") != -1) {
            //     arr = fontFamily.split(", ");
            // }
            // else if(fontFamily.indexOf(",") != -1) {
            //     arr = fontFamily.split(",");
            // }
            // if(arr) {
            //     let length:number = arr.length;
            //     for(let i = 0 ; i < length ; i++) {
            //         let fontFamily = arr[i];
            //         //暂时先不考虑带有引号的情况
            //         if(fontMapping[fontFamily]) {
            //             font = fontMapping[fontFamily];
            //             break;
            //         }
            //     }
            // }
            // else {
            //     font = fontMapping[fontFamily];
            // }
            // if(!font) {
            //     font= "/system/fonts/DroidSansFallback.ttf";
            // }
            // egret_native.Label.createLabel(font, fontSize, "", 0);
            // return egret_native.Label.getTextSize(text)[0];
        }
        egret.sys.measureText = measureText;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var NativePlayer = (function (_super) {
            __extends(NativePlayer, _super);
            function NativePlayer() {
                var _this = _super.call(this) || this;
                _this.init(NativePlayer.option);
                return _this;
            }
            NativePlayer.prototype.init = function (option) {
                //暂时无法显示重绘区域
                option.showPaintRect = false;
                var stage = new egret.Stage();
                stage.$screen = this;
                stage.$scaleMode = option.scaleMode;
                stage.$maxTouches = option.maxTouches;
                stage.textureScaleFactor = option.textureScaleFactor;
                //设置帧频到native
                stage.frameRate = option.frameRate;
                var buffer = new egret.sys.RenderBuffer(undefined, undefined, true);
                var canvas = buffer.surface;
                this.attachCanvas(canvas);
                var touch = new native2.NativeTouchHandler(stage);
                var player = new egret.sys.Player(buffer, stage, option.entryClassName);
                new native2.NativeHideHandler(stage);
                player.showPaintRect(option.showPaintRect);
                if (option.showFPS || option.showLog) {
                    var styleStr = option.fpsStyles || "";
                    var stylesArr = styleStr.split(",");
                    var styles = {};
                    for (var i = 0; i < stylesArr.length; i++) {
                        var tempStyleArr = stylesArr[i].split(":");
                        styles[tempStyleArr[0]] = tempStyleArr[1];
                    }
                    option.fpsStyles = styles;
                    player.displayFPS(option.showFPS, option.showLog, option.logFilter, option.fpsStyles);
                }
                this.playerOption = option;
                this.$stage = stage;
                this.player = player;
                this.nativeTouch = touch;
                this.webTouchHandler = touch;
                //this.nativeInput = nativeInput;
                this.updateScreenSize();
                this.updateMaxTouches();
                player.start();
            };
            NativePlayer.prototype.updateScreenSize = function () {
                var option = this.playerOption;
                var screenWidth = egret_native.getDeviceWidth();
                var screenHeight = egret_native.getDeviceHeight();
                egret.Capabilities.$boundingClientWidth = screenWidth;
                egret.Capabilities.$boundingClientHeight = screenHeight;
                var stageSize = egret.sys.screenAdapter.calculateStageSize(this.$stage.$scaleMode, screenWidth, screenHeight, option.contentWidth, option.contentHeight);
                var stageWidth = stageSize.stageWidth;
                var stageHeight = stageSize.stageHeight;
                var displayWidth = stageSize.displayWidth;
                var displayHeight = stageSize.displayHeight;
                var top = (screenHeight - displayHeight) / 2;
                var left = (screenWidth - displayWidth) / 2;
                egret_native.setVisibleRect(left, top, displayWidth, displayHeight);
                egret_native.setDesignSize(stageWidth, stageHeight);
                var scalex = displayWidth / stageWidth, scaley = displayHeight / stageHeight;
                this.webTouchHandler.updateScaleMode(scalex, scaley, 0);
                this.webTouchHandler.updateTouchOffset(stageWidth / screenWidth, stageHeight / screenHeight, top, left);
                this.player.updateStageSize(stageWidth, stageHeight);
            };
            NativePlayer.prototype.setContentSize = function (width, height) {
                var option = this.playerOption;
                option.contentWidth = width;
                option.contentHeight = height;
                this.updateScreenSize();
            };
            /**
             * @private
             * 添加canvas
             */
            NativePlayer.prototype.attachCanvas = function (canvas) {
                this.canvas = canvas;
                egret_native.setScreenCanvas(canvas);
            };
            ;
            /**
             * @private
             * 更新触摸数量
             */
            NativePlayer.prototype.updateMaxTouches = function () {
                this.webTouchHandler.$updateMaxTouches();
            };
            return NativePlayer;
        }(egret.HashObject));
        native2.NativePlayer = NativePlayer;
        __reflect(NativePlayer.prototype, "egret.native2.NativePlayer", ["egret.sys.Screen"]);
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @version Egret 2.4
         * @platform Web,Native
         */
        var NativeResourceLoader = (function (_super) {
            __extends(NativeResourceLoader, _super);
            function NativeResourceLoader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                /**
                 * @private
                 */
                _this._downCount = 0;
                /**
                 * @private
                 */
                _this._path = null;
                /**
                 * @private
                 */
                _this._bytesTotal = 0;
                return _this;
            }
            /**
             *
             * @param path
             * @param bytesTotal
             * @version Egret 2.4
             * @platform Web,Native
             */
            NativeResourceLoader.prototype.load = function (path, bytesTotal) {
                this._downCount = 0;
                this._path = path;
                this._bytesTotal = bytesTotal;
                this.reload();
            };
            /**
             * @private
             *
             */
            NativeResourceLoader.prototype.reload = function () {
                if (this._downCount >= 3) {
                    this.downloadFileError();
                    return;
                }
                this._downCount++;
                var promise = egret.PromiseObject.create();
                var self = this;
                promise.onSuccessFunc = function () {
                    self.loadOver();
                };
                promise.onErrorFunc = function () {
                    self.reload();
                };
                promise.downloadingSizeFunc = function (bytesLoaded) {
                    self.downloadingProgress(bytesLoaded);
                };
                egret_native.download(this._path, this._path, promise);
                //}
            };
            /**
             * @private
             *
             * @param bytesLoaded
             */
            NativeResourceLoader.prototype.downloadingProgress = function (bytesLoaded) {
                egret.ProgressEvent.dispatchProgressEvent(this, egret.ProgressEvent.PROGRESS, bytesLoaded, this._bytesTotal);
            };
            /**
             * @private
             *
             */
            NativeResourceLoader.prototype.downloadFileError = function () {
                this.dispatchEvent(new egret.Event(egret.IOErrorEvent.IO_ERROR));
            };
            /**
             * @private
             *
             */
            NativeResourceLoader.prototype.loadOver = function () {
                this.dispatchEvent(new egret.Event(egret.Event.COMPLETE));
            };
            return NativeResourceLoader;
        }(egret.EventDispatcher));
        native2.NativeResourceLoader = NativeResourceLoader;
        __reflect(NativeResourceLoader.prototype, "egret.native2.NativeResourceLoader");
        egret["NativeResourceLoader"] = NativeResourceLoader;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        function convertImageToRenderTexture(texture, rect) {
            var buffer = egret.sys.canvasHitTestBuffer;
            // let w = texture.$getTextureWidth();
            // let h = texture.$getTextureHeight();
            // if (rect == null) {
            //     rect = egret.$TempRectangle;
            //     rect.x = 0;
            //     rect.y = 0;
            //     rect.width = w;
            //     rect.height = h;
            // }
            // rect.x = Math.min(rect.x, w - 1);
            // rect.y = Math.min(rect.y, h - 1);
            // rect.width = Math.min(rect.width, w - rect.x);
            // rect.height = Math.min(rect.height, h - rect.y);
            // let iWidth = rect.width;
            // let iHeight = rect.height;
            var surface = buffer.surface;
            // buffer.resize(iWidth,iHeight);
            // let bitmapData = texture;
            // let offsetX:number = Math.round(bitmapData._offsetX);
            // let offsetY:number = Math.round(bitmapData._offsetY);
            // let bitmapWidth:number = bitmapData._bitmapWidth;
            // let bitmapHeight:number = bitmapData._bitmapHeight;
            // buffer.context.drawImage(bitmapData._bitmapData, bitmapData._bitmapX + rect.x / $TextureScaleFactor, bitmapData._bitmapY + rect.y / $TextureScaleFactor,
            //     bitmapWidth * rect.width / w, bitmapHeight * rect.height / h, offsetX, offsetY, rect.width, rect.height);
            return surface;
        }
        /**
         * @private
         */
        function toDataURL(type, rect) {
            try {
                var renderTexture = convertImageToRenderTexture(this, rect);
                var base64 = renderTexture.toDataURL(type);
                //renderTexture.$dispose();
                return base64;
            }
            catch (e) {
                egret.$error(1033);
                return null;
            }
        }
        function saveToFile(type, filePath, rect) {
            try {
                var renderTexture = convertImageToRenderTexture(this, rect);
                renderTexture.saveToFile(type, filePath);
            }
            catch (e) {
                egret.$error(1033);
            }
        }
        function getPixel32(x, y) {
            egret.$error(1035);
            return null;
        }
        egret.Texture.prototype.toDataURL = toDataURL;
        egret.Texture.prototype.saveToFile = saveToFile;
        egret.Texture.prototype.getPixel32 = getPixel32;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided this the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var NativeTouchHandler = (function (_super) {
            __extends(NativeTouchHandler, _super);
            function NativeTouchHandler(stage) {
                var _this = _super.call(this) || this;
                // private $executeTouchCallback(num:number, ids:Array<any>, xs_array:Array<any>, ys_array:Array<any>, callback:Function) {
                //     for (let i = 0; i < num; i++) {
                //         let id = ids[i];
                //         let x = xs_array[i];
                //         let y = ys_array[i];
                //         callback.call(this.$touch, x, y, id);
                //     }
                // }
                /**
                 * @private
                 */
                _this.scaleX = 1;
                /**
                 * @private
                 */
                _this.scaleY = 1;
                /**
                 * @private
                 */
                _this.rotation = 0;
                /**
                 * @private 更新Stage相对于屏幕的缩放比例，用于计算准确的点击位置。
                 * @platform Native
                 */
                _this.touchScaleX = 1;
                _this.touchScaleY = 1;
                _this.touchOffsetX = 0;
                _this.touchOffsetY = 0;
                _this.$touch = new egret.sys.TouchHandler(stage);
                var _that = _this;
                window.addEventListener("touchstart", function (event) {
                    var l = event.changedTouches.length;
                    for (var i = 0; i < l; i++) {
                        var touch = event.changedTouches[i];
                        var locationX = (touch.pageX - _that.touchOffsetX) * (_that.touchScaleX);
                        var locationY = (touch.pageY - _that.touchOffsetY) * (_that.touchScaleY);
                        _that.$touch.onTouchBegin(locationX, locationY, touch.identifier);
                    }
                });
                window.addEventListener("touchmove", function (event) {
                    var l = event.changedTouches.length;
                    for (var i = 0; i < l; i++) {
                        var touch = event.changedTouches[i];
                        var locationX = (touch.pageX - _that.touchOffsetX) * (_that.touchScaleX);
                        var locationY = (touch.pageY - _that.touchOffsetY) * (_that.touchScaleY);
                        _that.$touch.onTouchMove(locationX, locationY, touch.identifier);
                    }
                });
                window.addEventListener("touchend", function (event) {
                    var l = event.changedTouches.length;
                    for (var i = 0; i < l; i++) {
                        var touch = event.changedTouches[i];
                        var locationX = (touch.pageX - _that.touchOffsetX) * (_that.touchScaleX);
                        var locationY = (touch.pageY - _that.touchOffsetY) * (_that.touchScaleY);
                        _that.$touch.onTouchEnd(locationX, locationY, touch.identifier);
                    }
                });
                window.addEventListener("touchcancel", function (event) {
                    var l = event.changedTouches.length;
                    for (var i = 0; i < l; i++) {
                        var touch = event.changedTouches[i];
                        var locationX = (touch.pageX - _that.touchOffsetX) * (_that.touchScaleX);
                        var locationY = (touch.pageY - _that.touchOffsetY) * (_that.touchScaleY);
                        _that.$touch.onTouchEnd(locationX, locationY, touch.identifier);
                    }
                });
                return _this;
                // egret_native.touchDown = function (num:number, ids:Array<any>, xs_array:Array<any>, ys_array:Array<any>) {
                //     _that.$executeTouchCallback(num, ids, xs_array, ys_array, _that.$touch.onTouchBegin);
                // };
                // egret_native.touchMove = function (num:number, ids:Array<any>, xs_array:Array<any>, ys_array:Array<any>) {
                //     _that.$executeTouchCallback(num, ids, xs_array, ys_array, _that.$touch.onTouchMove);
                // };
                // egret_native.touchUp = function (num:number, ids:Array<any>, xs_array:Array<any>, ys_array:Array<any>) {
                //     _that.$executeTouchCallback(num, ids, xs_array, ys_array, _that.$touch.onTouchEnd);
                // };
                // egret_native.touchCancel = function (num:number, ids:Array<any>, xs_array:Array<any>, ys_array:Array<any>) {
                // };
            }
            /**
             * @private
             * 更新屏幕当前的缩放比例，用于计算准确的点击位置。
             * @param scaleX 水平方向的缩放比例。
             * @param scaleY 垂直方向的缩放比例。
             */
            NativeTouchHandler.prototype.updateScaleMode = function (scaleX, scaleY, rotation) {
                this.scaleX = scaleX;
                this.scaleY = scaleY;
                this.rotation = rotation;
            };
            NativeTouchHandler.prototype.updateTouchOffset = function (scalex, scaley, top, left) {
                this.touchScaleX = scalex;
                this.touchScaleY = scaley;
                this.touchOffsetX = top;
                this.touchOffsetY = left;
            };
            /**
             * @private
             * 更新同时触摸点的数量
             */
            NativeTouchHandler.prototype.$updateMaxTouches = function () {
                this.$touch.$initMaxTouches();
            };
            return NativeTouchHandler;
        }(egret.HashObject));
        native2.NativeTouchHandler = NativeTouchHandler;
        __reflect(NativeTouchHandler.prototype, "egret.native2.NativeTouchHandler");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * XML节点基类
         */
        var XMLNode = (function () {
            /**
             * @private
             */
            function XMLNode(nodeType, parent) {
                this.nodeType = nodeType;
                this.parent = parent;
            }
            return XMLNode;
        }());
        native2.XMLNode = XMLNode;
        __reflect(XMLNode.prototype, "egret.native2.XMLNode");
        /**
         * @private
         * XML节点对象
         */
        var XML = (function (_super) {
            __extends(XML, _super);
            /**
             * @private
             */
            function XML(localName, parent, prefix, namespace, name) {
                var _this = _super.call(this, 1, parent) || this;
                /**
                 * @private
                 * 当前节点上的属性列表
                 */
                _this.attributes = {};
                /**
                 * @private
                 * 当前节点的子节点列表
                 */
                _this.children = [];
                _this.localName = localName;
                _this.prefix = prefix;
                _this.namespace = namespace;
                _this.name = name;
                return _this;
            }
            return XML;
        }(XMLNode));
        native2.XML = XML;
        __reflect(XML.prototype, "egret.native2.XML");
        /**
         * @private
         * XML文本节点
         */
        var XMLText = (function (_super) {
            __extends(XMLText, _super);
            /**
             * @private
             */
            function XMLText(text, parent) {
                var _this = _super.call(this, 3, parent) || this;
                _this.text = text;
                return _this;
            }
            return XMLText;
        }(XMLNode));
        native2.XMLText = XMLText;
        __reflect(XMLText.prototype, "egret.native2.XMLText");
        /**
         * @private
         * 解析字符串为XML对象
         * @param text 要解析的字符串
         */
        function parse(text) {
            var xmlDocStr = egret_native.xmlStr2JsonStr(text);
            //替换换行符
            xmlDocStr = xmlDocStr.replace(/\n/g, "\\n");
            var xmlDoc = JSON.parse(xmlDocStr);
            return parseNode(xmlDoc, null);
        }
        /**
         * @private
         * 解析一个节点
         */
        function parseNode(node, parent) {
            if (node.localName == "parsererror") {
                throw new Error(node.textContent);
            }
            var xml = new XML(node.localName, parent, node.prefix, node.namespace, node.name);
            var nodeAttributes = node.attributes;
            var attributes = xml.attributes;
            for (var key in nodeAttributes) {
                attributes[key] = xml["$" + key] = nodeAttributes[key];
            }
            var childNodes = node.children;
            var length = childNodes.length;
            var children = xml.children;
            for (var i = 0; i < length; i++) {
                var childNode = childNodes[i];
                var nodeType = childNode.nodeType;
                var childXML = null;
                if (nodeType == 1) {
                    childXML = parseNode(childNode, xml);
                }
                else if (nodeType == 3) {
                    var text = childNode.text.trim();
                    if (text) {
                        childXML = new XMLText(text, xml);
                    }
                }
                if (childXML) {
                    children.push(childXML);
                }
            }
            return xml;
        }
        egret.XML = { parse: parse };
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @version Egret 2.4
         * @platform Web,Native
         */
        var PromiseObject = (function () {
            /**
             * @version Egret 2.4
             * @platform Web,Native
             */
            function PromiseObject() {
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onSuccessFunc = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onSuccessThisObject = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onErrorFunc = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onErrorThisObject = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.downloadingSizeFunc = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.downloadingSizeThisObject = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onResponseHeaderFunc = null;
                /**
                 * @version Egret 2.4
                 * @platform Web,Native
                 */
                this.onResponseHeaderThisObject = null;
            }
            /**
             *
             * @version Egret 2.4
             * @platform Web,Native
             */
            PromiseObject.create = function () {
                if (PromiseObject.promiseObjectList.length) {
                    return PromiseObject.promiseObjectList.pop();
                }
                else {
                    return new egret.PromiseObject();
                }
            };
            /**
             * @private
             *
             * @param args
             */
            PromiseObject.prototype.onSuccess = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.onSuccessFunc) {
                    this.onSuccessFunc.apply(this.onSuccessThisObject, args);
                }
                this.destroy();
            };
            /**
             * @private
             *
             * @param args
             */
            PromiseObject.prototype.onError = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.onErrorFunc) {
                    this.onErrorFunc.apply(this.onErrorThisObject, args);
                }
                this.destroy();
            };
            /**
             * @private
             *
             * @param args
             */
            PromiseObject.prototype.downloadingSize = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.downloadingSizeFunc) {
                    this.downloadingSizeFunc.apply(this.downloadingSizeThisObject, args);
                }
            };
            /**
             * @private
             *
             * @param args
             */
            PromiseObject.prototype.onResponseHeader = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.onResponseHeaderFunc) {
                    this.onResponseHeaderFunc.apply(this.onResponseHeaderThisObject, args);
                }
            };
            /**
             * @private
             *
             */
            PromiseObject.prototype.destroy = function () {
                this.onSuccessFunc = undefined;
                this.onSuccessThisObject = undefined;
                this.onErrorFunc = undefined;
                this.onErrorThisObject = undefined;
                this.downloadingSizeFunc = undefined;
                this.downloadingSizeThisObject = undefined;
                this.onResponseHeaderFunc = undefined;
                this.onResponseHeaderThisObject = undefined;
                PromiseObject.promiseObjectList.push(this);
            };
            return PromiseObject;
        }());
        /**
         * @private
         */
        PromiseObject.promiseObjectList = [];
        native2.PromiseObject = PromiseObject;
        __reflect(PromiseObject.prototype, "egret.native2.PromiseObject");
        egret.PromiseObject = PromiseObject;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        var callBackDic = {};
        /**
         * @private
         */
        var NativeExternalInterface = (function () {
            function NativeExternalInterface() {
            }
            NativeExternalInterface.call = function (functionName, value) {
                var data = {};
                data.functionName = functionName;
                data.value = value;
                egret_native.sendInfoToPlugin(JSON.stringify(data));
            };
            NativeExternalInterface.addCallback = function (functionName, listener) {
                callBackDic[functionName] = listener;
            };
            return NativeExternalInterface;
        }());
        native2.NativeExternalInterface = NativeExternalInterface;
        __reflect(NativeExternalInterface.prototype, "egret.native2.NativeExternalInterface", ["egret.ExternalInterface"]);
        /**
         * @private
         * @param info
         */
        function onReceivedPluginInfo(info) {
            var data = JSON.parse(info);
            var functionName = data.functionName;
            var listener = callBackDic[functionName];
            if (listener) {
                var value = data.value;
                listener.call(null, value);
            }
            else {
                egret.$warn(1050, functionName);
            }
        }
        egret.ExternalInterface = NativeExternalInterface;
        egret_native.receivedPluginInfo = onReceivedPluginInfo;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @inheritDoc
         */
        var NaSound = (function (_super) {
            __extends(NaSound, _super);
            /**
             * @private
             * @inheritDoc
             */
            function NaSound() {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.loaded = false;
                return _this;
            }
            Object.defineProperty(NaSound.prototype, "length", {
                get: function () {
                    throw new Error("sound length not supported");
                    //return 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @inheritDoc
             */
            NaSound.prototype.load = function (url) {
                var self = this;
                this.url = url;
                if (true && !url) {
                    egret.$error(3002);
                }
                if (!egret_native.fs.isFileExistSync(url)) {
                    download();
                }
                else {
                    if (__global.setTimeout) {
                        __global.setTimeout(onLoadComplete, 0);
                    }
                    else {
                        egret.$callAsync(onLoadComplete, self);
                    }
                }
                function download() {
                    var promise = native2.PromiseObject.create();
                    promise.onSuccessFunc = onLoadComplete;
                    promise.onErrorFunc = function () {
                        egret.IOErrorEvent.dispatchIOErrorEvent(self);
                    };
                    egret_native.download(url, url, promise);
                }
                function onLoadComplete() {
                    self.loaded = true;
                    self.preload();
                }
            };
            NaSound.prototype.preload = function () {
                var self = this;
                if (self.type == egret.Sound.EFFECT) {
                    var promise = new egret.PromiseObject();
                    promise.onSuccessFunc = function (soundId) {
                        self.dispatchEventWith(egret.Event.COMPLETE);
                    };
                    egret_native.Audio.preloadEffectAsync(self.url, promise);
                }
                else {
                    self.dispatchEventWith(egret.Event.COMPLETE);
                }
            };
            /**
             * @inheritDoc
             */
            NaSound.prototype.play = function (startTime, loops) {
                startTime = +startTime || 0;
                loops = +loops || 0;
                if (true && this.loaded == false) {
                    egret.$error(1049);
                }
                var channel = new native2.NaSoundChannel();
                channel.$url = this.url;
                channel.$loops = loops;
                channel.$type = this.type;
                channel.$startTime = startTime;
                channel.$play();
                egret.sys.$pushSoundChannel(channel);
                return channel;
            };
            /**
             * @inheritDoc
             */
            NaSound.prototype.close = function () {
            };
            return NaSound;
        }(egret.EventDispatcher));
        /**
         * Background music
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 背景音乐
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        NaSound.MUSIC = "music";
        /**
         * EFFECT
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 音效
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        NaSound.EFFECT = "effect";
        native2.NaSound = NaSound;
        __reflect(NaSound.prototype, "egret.native2.NaSound", ["egret.Sound"]);
        if (!__global.Audio) {
            egret.Sound = NaSound;
        }
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @inheritDoc
         */
        var NaSoundChannel = (function (_super) {
            __extends(NaSoundChannel, _super);
            /**
             * @private
             */
            function NaSoundChannel() {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.$startTime = 0;
                //声音是否已经播放完成
                _this.isStopped = false;
                /**
                 * @private
                 */
                _this._startTime = 0;
                return _this;
            }
            NaSoundChannel.prototype.$play = function () {
                this.isStopped = false;
                if (this.$type == egret.Sound.EFFECT) {
                    this._effectId = egret_native.Audio.playEffect(this.$url, this.$loops != 1);
                }
                else {
                    NaSoundChannel.currentPath = this.$url;
                    egret_native.Audio.playBackgroundMusic(this.$url, this.$loops != 1);
                }
                this._startTime = Date.now();
            };
            /**
             * @private
             * @inheritDoc
             */
            NaSoundChannel.prototype.stop = function () {
                if (!this.isStopped) {
                    egret.sys.$popSoundChannel(this);
                }
                this.isStopped = true;
                if (this.$type == egret.Sound.EFFECT) {
                    if (this._effectId) {
                        egret_native.Audio.stopEffect(this._effectId);
                        this._effectId = null;
                    }
                }
                else {
                    if (this.$url == NaSoundChannel.currentPath) {
                        egret_native.Audio.stopBackgroundMusic(false);
                    }
                }
            };
            Object.defineProperty(NaSoundChannel.prototype, "volume", {
                /**
                 * @private
                 * @inheritDoc
                 */
                get: function () {
                    if (this.$type == egret.Sound.EFFECT) {
                        return egret_native.Audio.getEffectsVolume();
                    }
                    else {
                        return egret_native.Audio.getBackgroundMusicVolume();
                    }
                    return 1;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    if (this.$type == egret.Sound.EFFECT) {
                        egret_native.Audio.setEffectsVolume(value);
                    }
                    else {
                        egret_native.Audio.setBackgroundMusicVolume(value);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NaSoundChannel.prototype, "position", {
                /**
                 * @private
                 * @inheritDoc
                 */
                get: function () {
                    return (Date.now() - this._startTime) / 1000;
                },
                enumerable: true,
                configurable: true
            });
            return NaSoundChannel;
        }(egret.EventDispatcher));
        native2.NaSoundChannel = NaSoundChannel;
        __reflect(NaSoundChannel.prototype, "egret.native2.NaSoundChannel", ["egret.SoundChannel", "egret.IEventDispatcher"]);
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @inheritDoc
         */
        var NativeSound = (function (_super) {
            __extends(NativeSound, _super);
            /**
             * @private
             * @inheritDoc
             */
            function NativeSound() {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.loaded = false;
                return _this;
            }
            Object.defineProperty(NativeSound.prototype, "length", {
                get: function () {
                    if (this.originAudio) {
                        return this.originAudio.duration;
                    }
                    throw new Error("sound not loaded!");
                    //return 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @inheritDoc
             */
            NativeSound.prototype.load = function (url) {
                //
                var self = this;
                // self.loaded = true;
                // self.dispatchEventWith(egret.Event.COMPLETE);
                // return;
                //
                this.url = url;
                if (true && !url) {
                    egret.$error(3002);
                }
                var audio = new Audio(url);
                audio.addEventListener("canplaythrough", onCanPlay);
                audio.addEventListener("error", onAudioError);
                this.originAudio = audio;
                if (!egret_native.fs.isFileExistSync(url)) {
                    download();
                }
                else {
                    onAudioLoaded();
                }
                function download() {
                    var promise = native2.PromiseObject.create();
                    promise.onSuccessFunc = onAudioLoaded;
                    promise.onErrorFunc = onAudioError;
                    egret_native.download(url, url, promise);
                }
                function onAudioLoaded() {
                    audio.load();
                    NativeSound.$recycle(url, audio);
                }
                function onCanPlay() {
                    removeListeners();
                    self.loaded = true;
                    self.dispatchEventWith(egret.Event.COMPLETE);
                }
                function onAudioError() {
                    removeListeners();
                    self.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
                }
                function removeListeners() {
                    audio.removeEventListener("canplaythrough", onCanPlay);
                    audio.removeEventListener("error", onAudioError);
                }
            };
            /**
             * @inheritDoc
             */
            NativeSound.prototype.play = function (startTime, loops) {
                startTime = +startTime || 0;
                loops = +loops || 0;
                if (true && this.loaded == false) {
                    egret.$error(1049);
                }
                var audio = NativeSound.$pop(this.url);
                if (audio == null) {
                    audio = new Audio(this.url);
                }
                else {
                    audio.load();
                }
                // audio.autoplay = true;
                var channel = new native2.NativeSoundChannel(audio);
                //let channel = new NativeSoundChannel(null);
                channel.$url = this.url;
                channel.$loops = loops;
                channel.$startTime = startTime;
                channel.$play();
                egret.sys.$pushSoundChannel(channel);
                return channel;
            };
            /**
             * @inheritDoc
             */
            NativeSound.prototype.close = function () {
                if (this.loaded == false && this.originAudio)
                    this.originAudio.src = "";
                if (this.originAudio)
                    this.originAudio = null;
                NativeSound.$clear(this.url);
            };
            NativeSound.$clear = function (url) {
                var array = NativeSound.audios[url];
                if (array) {
                    array.length = 0;
                }
            };
            NativeSound.$pop = function (url) {
                var array = NativeSound.audios[url];
                if (array && array.length > 0) {
                    return array.pop();
                }
                return null;
            };
            NativeSound.$recycle = function (url, audio) {
                var array = NativeSound.audios[url];
                if (NativeSound.audios[url] == null) {
                    array = NativeSound.audios[url] = [];
                }
                array.push(audio);
            };
            return NativeSound;
        }(egret.EventDispatcher));
        /**
         * Background music
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 背景音乐
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        NativeSound.MUSIC = "music";
        /**
         * EFFECT
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 音效
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        NativeSound.EFFECT = "effect";
        /**
         * @private
         */
        NativeSound.audios = {};
        native2.NativeSound = NativeSound;
        __reflect(NativeSound.prototype, "egret.native2.NativeSound", ["egret.Sound"]);
        if (__global.Audio) {
            egret.Sound = NativeSound;
        }
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @inheritDoc
         */
        var NativeSoundChannel = (function (_super) {
            __extends(NativeSoundChannel, _super);
            /**
             * @private
             */
            function NativeSoundChannel(audio) {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.$startTime = 0;
                /**
                 * @private
                 */
                _this.audio = null;
                //声音是否已经播放完成
                _this.isStopped = false;
                /**
                 * @private
                 */
                _this.onPlayEnd = function () {
                    if (_this.$loops == 1) {
                        _this.stop();
                        _this.dispatchEventWith(egret.Event.SOUND_COMPLETE);
                        return;
                    }
                    if (_this.$loops > 0) {
                        _this.$loops--;
                    }
                    /////////////
                    //this.audio.load();
                    _this.$play();
                };
                _this.$volume = 1;
                audio.addEventListener("ended", _this.onPlayEnd);
                _this.audio = audio;
                return _this;
            }
            NativeSoundChannel.prototype.$play = function () {
                //
                //return;
                //
                if (this.isStopped) {
                    egret.$error(1036);
                    return;
                }
                try {
                    this.audio.currentTime = this.$startTime;
                }
                catch (e) {
                }
                finally {
                    this.audio.volume = this.$volume;
                    this.audio.play();
                }
            };
            /**
             * @private
             * @inheritDoc
             */
            NativeSoundChannel.prototype.stop = function () {
                //
                // return;
                //
                if (!this.audio)
                    return;
                if (!this.isStopped) {
                    egret.sys.$popSoundChannel(this);
                }
                this.isStopped = true;
                var audio = this.audio;
                audio.pause();
                audio.removeEventListener("ended", this.onPlayEnd);
                this.audio = null;
                native2.NativeSound.$recycle(this.$url, audio);
            };
            Object.defineProperty(NativeSoundChannel.prototype, "volume", {
                /**
                 * @private
                 * @inheritDoc
                 */
                get: function () {
                    return 1;
                    if (!this.audio)
                        return 1;
                    return this.$volume;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    return;
                    if (this.isStopped) {
                        egret.$error(1036);
                        return;
                    }
                    this.$volume = value;
                    if (!this.audio)
                        return;
                    this.audio.volume = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeSoundChannel.prototype, "position", {
                /**
                 * @private
                 * @inheritDoc
                 */
                get: function () {
                    return 0;
                    if (!this.audio)
                        return 0;
                    return this.audio.currentTime;
                },
                enumerable: true,
                configurable: true
            });
            return NativeSoundChannel;
        }(egret.EventDispatcher));
        native2.NativeSoundChannel = NativeSoundChannel;
        __reflect(NativeSoundChannel.prototype, "egret.native2.NativeSoundChannel", ["egret.SoundChannel", "egret.IEventDispatcher"]);
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * @inheritDoc
         */
        var NativeVideo = (function (_super) {
            __extends(NativeVideo, _super);
            /**
             * @private
             * @inheritDoc
             */
            function NativeVideo(url, cache) {
                if (cache === void 0) { cache = true; }
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.loaded = false;
                /**
                 * @private
                 */
                _this.loading = false;
                /**
                 * @private
                 * */
                _this.loop = false;
                /**
                 * @private
                 * */
                _this.isPlayed = false;
                /**
                 * @private
                 * */
                _this.firstPlay = true;
                /**
                 * @inheritDoc
                 */
                _this.src = "";
                _this._fullscreen = true;
                _this._bitmapData = null;
                /**
                 * @inheritDoc
                 */
                _this.paused = false;
                /**
                 * @private
                 */
                _this.isAddToStage = false;
                /**
                 * @private
                 */
                _this.heightSet = 0;
                /**
                 * @private
                 */
                _this.widthSet = 0;
                _this.$renderNode = new egret.sys.BitmapNode();
                _this.cache = cache;
                if (!__global.Video) {
                    egret.$error(1044);
                }
                if (url) {
                    _this.load(url, cache);
                }
                return _this;
            }
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.load = function (url, cache) {
                if (cache === void 0) { cache = true; }
                if (true && !url) {
                    egret.$error(3002);
                    return;
                }
                if (this.loading) {
                    return;
                }
                if (url.indexOf('/') == 0) {
                    url = url.slice(1, url.length);
                }
                this.src = url;
                this.loading = true;
                this.loaded = false;
                if (cache && !egret_native.fs.isFileExistSync(url)) {
                    var self_1 = this;
                    var promise = egret.PromiseObject.create();
                    promise.onSuccessFunc = function () {
                        self_1.loadEnd();
                    };
                    promise.onErrorFunc = function () {
                        egret.$warn(1048);
                        self_1.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
                    };
                    egret_native.download(url, url, promise);
                }
                else {
                    this.loadEnd();
                }
            };
            /**
             * @private
             * */
            NativeVideo.prototype.loadEnd = function () {
                var video = new __global.Video(this.src);
                video['setVideoRect'](0, 0, 1, 1);
                video['setKeepRatio'](false);
                video.addEventListener("canplaythrough", onCanPlay);
                video.addEventListener("error", onVideoError);
                video.addEventListener("playing", onPlaying);
                video.load();
                var self = this;
                function onCanPlay() {
                    video['setVideoRect'](0, 0, 1, 1);
                    video.play();
                }
                function onPlaying() {
                    video['setVideoRect'](0, 0, 1, 1);
                    __global.setTimeout(function () {
                        video.pause();
                        if (self._fullscreen) {
                            video.fullScreen = true;
                        }
                        video.currentTime = 0;
                        self.originVideo = video;
                        self.loaded = true;
                        self.loading = false;
                        removeListeners();
                        self.dispatchEventWith(egret.Event.COMPLETE);
                        video.addEventListener('pause', function () {
                            self.paused = true;
                        });
                        video.addEventListener('playing', function () {
                            self.paused = false;
                        });
                        video.addEventListener('ended', function () {
                            self.dispatchEventWith(egret.Event.ENDED);
                            if (self.loop) {
                                self.play(0, true);
                            }
                        });
                    }, 1);
                }
                function onVideoError() {
                    removeListeners();
                    self.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
                }
                function removeListeners() {
                    video.removeEventListener("canplaythrough", onCanPlay);
                    video.removeEventListener("error", onVideoError);
                    video.removeEventListener("playing", onPlaying);
                }
            };
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.play = function (startTime, loop) {
                var _this = this;
                if (loop === void 0) { loop = false; }
                this.loop = loop;
                if (!this.loaded) {
                    this.load(this.src);
                    this.once(egret.Event.COMPLETE, function (e) { return _this.play(startTime, loop); }, this);
                    return;
                }
                var haveStartTime = false;
                if (startTime != undefined && startTime != this.originVideo.currentTime) {
                    this.originVideo.currentTime = startTime || 0;
                    haveStartTime = true;
                }
                this.startPlay(haveStartTime);
            };
            /**
             * @private
             * */
            NativeVideo.prototype.startPlay = function (haveStartTime) {
                if (haveStartTime === void 0) { haveStartTime = false; }
                if (!this.isAddToStage || !this.loaded) {
                    return;
                }
                this.firstPlay = false;
                this.setVideoSize();
                this.isPlayed = true;
                if (!haveStartTime && this.paused && this.position != 0) {
                    this.originVideo['resume']();
                }
                else {
                    this.originVideo.play();
                }
                egret.startTick(this.markDirty, this);
            };
            /**
             * @private
             * */
            NativeVideo.prototype.stopPlay = function () {
                egret.stopTick(this.markDirty, this);
                if (this.isPlayed) {
                    this.isPlayed = false;
                    this.originVideo.pause();
                }
            };
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.close = function () {
                if (this.originVideo) {
                    this.originVideo['destroy']();
                }
                this.loaded = false;
                this.loading = false;
                this.originVideo = null;
                this.loop = false;
                this.src = null;
            };
            Object.defineProperty(NativeVideo.prototype, "poster", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    return this.posterUrl;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    var _this = this;
                    this.posterUrl = value;
                    var loader = new native2.NativeImageLoader();
                    loader.load(value);
                    loader.addEventListener(egret.Event.COMPLETE, function () {
                        _this.posterData = loader.data;
                        _this.markDirty();
                        _this.$invalidateContentBounds();
                    }, this);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeVideo.prototype, "fullscreen", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    if (this.originVideo) {
                        return this.originVideo['fullScreen'];
                    }
                    return this._fullscreen;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    this._fullscreen = value;
                    if (this.originVideo) {
                        this.originVideo['fullScreen'] = value;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeVideo.prototype, "volume", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    if (!this.loaded)
                        return 0;
                    return this.originVideo.volume;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    if (!this.loaded)
                        return;
                    this.originVideo.volume = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeVideo.prototype, "position", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    return this.originVideo.currentTime;
                },
                /**
                 * @inheritDoc
                 */
                set: function (value) {
                    if (this.loaded) {
                        this.originVideo.currentTime = value;
                    }
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.pause = function () {
                this.originVideo.pause();
            };
            Object.defineProperty(NativeVideo.prototype, "bitmapData", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    return this._bitmapData;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeVideo.prototype, "length", {
                /**
                 * @inheritDoc
                 */
                get: function () {
                    if (this.loaded) {
                        return this.originVideo.duration;
                    }
                    throw new Error("Video not loaded!");
                    //return 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.$onAddToStage = function (stage, nestLevel) {
                this.isAddToStage = true;
                if (this.originVideo) {
                    this.originVideo["setVideoVisible"](true);
                }
                this.$invalidate();
                this.$invalidateContentBounds();
                _super.prototype.$onAddToStage.call(this, stage, nestLevel);
            };
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.$onRemoveFromStage = function () {
                this.isAddToStage = false;
                if (this.originVideo) {
                    this.stopPlay();
                    this.originVideo["setVideoVisible"](false);
                }
                _super.prototype.$onRemoveFromStage.call(this);
            };
            /**
             * @private
             */
            NativeVideo.prototype.getPlayWidth = function () {
                if (!isNaN(this.widthSet)) {
                    return this.widthSet;
                }
                if (this.bitmapData) {
                    return this.bitmapData.width;
                }
                if (this.posterData) {
                    return this.posterData.width;
                }
                return NaN;
            };
            /**
             * @private
             */
            NativeVideo.prototype.getPlayHeight = function () {
                if (!isNaN(this.heightSet)) {
                    return this.heightSet;
                }
                if (this.bitmapData) {
                    return this.bitmapData.height;
                }
                if (this.posterData) {
                    return this.posterData.height;
                }
                return NaN;
            };
            /**
             * @private
             */
            NativeVideo.prototype.$setHeight = function (value) {
                this.heightSet = +value || 0;
                this.setVideoSize();
                this.$invalidate();
                this.$invalidateContentBounds();
                return _super.prototype.$setHeight.call(this, value);
            };
            /**
             * @private
             */
            NativeVideo.prototype.$setWidth = function (value) {
                this.widthSet = +value || 0;
                this.setVideoSize();
                this.$invalidate();
                this.$invalidateContentBounds();
                return _super.prototype.$setWidth.call(this, value);
            };
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.$setX = function (value) {
                var result = _super.prototype.$setX.call(this, value);
                this.setVideoSize();
                return result;
            };
            /**
             * @inheritDoc
             */
            NativeVideo.prototype.$setY = function (value) {
                var result = _super.prototype.$setY.call(this, value);
                this.setVideoSize();
                return result;
            };
            /**
             * @private
             */
            NativeVideo.prototype.setVideoSize = function () {
                var video = this.originVideo;
                if (video && !this.fullscreen) {
                    if (!this.firstPlay) {
                        video['setVideoRect'](this.x, this.y, this.widthSet, this.heightSet);
                    }
                    else {
                        video['setVideoRect'](this.x, this.y, 0, 0);
                    }
                }
            };
            /**
             * @private
             */
            NativeVideo.prototype.$measureContentBounds = function (bounds) {
                var posterData = this.posterData;
                if (posterData) {
                    bounds.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight());
                }
                else {
                    bounds.setEmpty();
                }
            };
            /**
             * @private
             */
            NativeVideo.prototype.$render = function () {
                var node = this.$renderNode;
                var posterData = this.posterData;
                var width = this.getPlayWidth();
                var height = this.getPlayHeight();
                if (width <= 0 || height <= 0) {
                    return;
                }
                if (!this.isPlayed && posterData) {
                    node.image = posterData;
                    node.drawImage(0, 0, posterData.width, posterData.height, 0, 0, width, height);
                }
                else if (this.isPlayed) {
                    this.setVideoSize();
                }
            };
            NativeVideo.prototype.markDirty = function () {
                this.$invalidate();
                return true;
            };
            return NativeVideo;
        }(egret.DisplayObject));
        native2.NativeVideo = NativeVideo;
        __reflect(NativeVideo.prototype, "egret.native2.NativeVideo", ["egret.Video", "egret.DisplayObject"]);
        //if (__global.Video) {
        //    egret.Video = NativeVideo;
        //} else {
        //    egret.$warn(1044);
        //}
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var NativeHttpRequest = (function (_super) {
            __extends(NativeHttpRequest, _super);
            /**
             * @private
             */
            function NativeHttpRequest() {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this._url = "";
                _this._method = "";
                /**
                 * @private
                 */
                _this.urlData = {};
                _this.responseHeader = "";
                return _this;
            }
            Object.defineProperty(NativeHttpRequest.prototype, "response", {
                /**
                 * @private
                 * 本次请求返回的数据，数据类型根据responseType设置的值确定。
                 */
                get: function () {
                    return this._response;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeHttpRequest.prototype, "responseType", {
                /**
                 * @private
                 * 设置返回的数据格式，请使用 HttpResponseType 里定义的枚举值。设置非法的值或不设置，都将使用HttpResponseType.TEXT。
                 */
                get: function () {
                    return this._responseType;
                },
                set: function (value) {
                    this._responseType = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NativeHttpRequest.prototype, "withCredentials", {
                /**
                 * @private
                 * 表明在进行跨站(cross-site)的访问控制(Access-Control)请求时，是否使用认证信息(例如cookie或授权的header)。 默认为 false。(这个标志不会影响同站的请求)
                 */
                get: function () {
                    return this._withCredentials;
                },
                set: function (value) {
                    this._withCredentials = value;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @private
             * 初始化一个请求.注意，若在已经发出请求的对象上调用此方法，相当于立即调用abort().
             * @param url 该请求所要访问的URL该请求所要访问的URL
             * @param method 请求所使用的HTTP方法， 请使用 HttpMethod 定义的枚举值.
             */
            NativeHttpRequest.prototype.open = function (url, method) {
                if (method === void 0) { method = "GET"; }
                this._url = url;
                this._method = method;
            };
            /**
             * @private
             * 发送请求.
             * @param data 需要发送的数据
             */
            NativeHttpRequest.prototype.send = function (data) {
                var self = this;
                if (self.isNetUrl(self._url)) {
                    self.urlData.type = self._method;
                    //写入POST数据
                    if (self._method == egret.HttpMethod.POST && data) {
                        if (data instanceof ArrayBuffer) {
                            self.urlData.data = data;
                        }
                        else {
                            self.urlData.data = data.toString();
                        }
                    }
                    else {
                        delete self.urlData["data"];
                    }
                    if (self._responseType == egret.HttpResponseType.ARRAY_BUFFER) {
                        self.urlData.binary = true;
                    }
                    else {
                        self.urlData.binary = false;
                    }
                    //写入header信息
                    if (this.headerObj) {
                        self.urlData.header = JSON.stringify(this.headerObj);
                    }
                    else {
                        delete self.urlData.header;
                    }
                    var promise = egret.PromiseObject.create();
                    promise.onSuccessFunc = function (getted_str) {
                        self._response = getted_str;
                        egret.$callAsync(egret.Event.dispatchEvent, egret.Event, self, egret.Event.COMPLETE);
                    };
                    promise.onErrorFunc = function (error_code) {
                        egret.$warn(1019, error_code);
                        egret.Event.dispatchEvent(self, egret.IOErrorEvent.IO_ERROR);
                    };
                    promise.onResponseHeaderFunc = this.onResponseHeader;
                    promise.onResponseHeaderThisObject = this;
                    egret_native.requestHttp(self._url, self.urlData.type, self.urlData.header ? self.urlData.header : "", self.urlData.data ? self.urlData.data : "", self.urlData.binary, promise);
                }
                else if (!native2.FileManager.isFileExistSync(self._url)) {
                    download();
                }
                else {
                    readFileAsync();
                }
                function readFileAsync() {
                    var promise = new egret.PromiseObject();
                    promise.onSuccessFunc = function (content) {
                        self._response = content;
                        egret.Event.dispatchEvent(self, egret.Event.COMPLETE);
                    };
                    promise.onErrorFunc = function () {
                        egret.Event.dispatchEvent(self, egret.IOErrorEvent.IO_ERROR);
                    };
                    if (self._responseType == egret.HttpResponseType.ARRAY_BUFFER) {
                        native2.FileManager.readFileAsync(self._url, promise, "ArrayBuffer");
                    }
                    else {
                        native2.FileManager.readFileAsync(self._url, promise, "String");
                    }
                }
                function download() {
                    var promise = native2.PromiseObject.create();
                    promise.onSuccessFunc = readFileAsync;
                    promise.onErrorFunc = function () {
                        egret.Event.dispatchEvent(self, egret.IOErrorEvent.IO_ERROR);
                    };
                    promise.onResponseHeaderFunc = this.onResponseHeader;
                    promise.onResponseHeaderThisObject = this;
                    egret_native.download(self._url, self._url, promise);
                }
            };
            /**
             * 是否是网络地址
             * @param url
             * @returns {boolean}
             */
            NativeHttpRequest.prototype.isNetUrl = function (url) {
                return url.indexOf("http://") != -1 || url.indexOf("HTTP://") != -1 || url.indexOf("https://") != -1 || url.indexOf("HTTPS://") != -1;
            };
            /**
             * @private
             * 如果请求已经被发送,则立刻中止请求.
             */
            NativeHttpRequest.prototype.abort = function () {
            };
            NativeHttpRequest.prototype.onResponseHeader = function (headers) {
                this.responseHeader = "";
                var obj = JSON.parse(headers);
                for (var key in obj) {
                    this.responseHeader += key + ": " + obj[key] + "\r\n";
                }
            };
            /**
             * @private
             * 返回所有响应头信息(响应头名和值), 如果响应头还没接受,则返回"".
             */
            NativeHttpRequest.prototype.getAllResponseHeaders = function () {
                return this.responseHeader;
            };
            /**
             * @private
             * 给指定的HTTP请求头赋值.在这之前,您必须确认已经调用 open() 方法打开了一个url.
             * @param header 将要被赋值的请求头名称.
             * @param value 给指定的请求头赋的值.
             */
            NativeHttpRequest.prototype.setRequestHeader = function (header, value) {
                if (!this.headerObj) {
                    this.headerObj = {};
                }
                this.headerObj[header] = value;
            };
            /**
             * @private
             * 返回指定的响应头的值, 如果响应头还没被接受,或该响应头不存在,则返回"".
             * @param header 要返回的响应头名称
             */
            NativeHttpRequest.prototype.getResponseHeader = function (header) {
                return "";
            };
            return NativeHttpRequest;
        }(egret.EventDispatcher));
        native2.NativeHttpRequest = NativeHttpRequest;
        __reflect(NativeHttpRequest.prototype, "egret.native2.NativeHttpRequest", ["egret.HttpRequest"]);
        egret.HttpRequest = NativeHttpRequest;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * ImageLoader 类可用于加载图像（JPG、PNG 或 GIF）文件。使用 load() 方法来启动加载。被加载的图像对象数据将存储在 ImageLoader.data 属性上 。
         */
        var NativeImageLoader = (function (_super) {
            __extends(NativeImageLoader, _super);
            function NativeImageLoader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                /**
                 * @private
                 * 使用 load() 方法加载成功的 BitmapData 图像数据。
                 */
                _this.data = null;
                /**
                 * @private
                 * 当从其他站点加载一个图片时，指定是否启用跨域资源共享(CORS)，默认值为null。
                 * 可以设置为"anonymous","use-credentials"或null,设置为其他值将等同于"anonymous"。
                 */
                _this._crossOrigin = null;
                return _this;
            }
            Object.defineProperty(NativeImageLoader.prototype, "crossOrigin", {
                get: function () {
                    return this._crossOrigin;
                },
                set: function (value) {
                    this._crossOrigin = value;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @private
             *
             * @param url
             * @param callback
             */
            NativeImageLoader.prototype.load = function (url) {
                this.check(url);
            };
            NativeImageLoader.prototype.check = function (url) {
                var self = this;
                if (self.isNetUrl(url)) {
                    self.download(url);
                }
                else if (!egret_native.fs.isFileExistSync(native2.FileManager.makeFullPath(url))) {
                    self.download(url);
                }
                else {
                    self.loadTexture(url);
                }
            };
            NativeImageLoader.prototype.download = function (url) {
                var self = this;
                var promise = egret.PromiseObject.create();
                promise.onSuccessFunc = function () {
                    self.loadTexture(url);
                };
                promise.onErrorFunc = function () {
                    self.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
                };
                egret_native.download(url, url, promise);
            };
            NativeImageLoader.prototype.loadTexture = function (url) {
                var self = this;
                var promise = new egret.PromiseObject();
                promise.onSuccessFunc = function (bitmapData) {
                    self.data = new egret.BitmapData(bitmapData);
                    self.dispatchEventWith(egret.Event.COMPLETE);
                };
                promise.onErrorFunc = function () {
                    self.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
                };
                // egret_native.Texture.addTextureAsyn(url, promise);
                egret_native.createImage(native2.FileManager.makeFullPath(url), promise);
            };
            /**
             * 是否是网络地址
             * @param url
             * @returns {boolean}
             */
            NativeImageLoader.prototype.isNetUrl = function (url) {
                return url.indexOf("http://") != -1 || url.indexOf("HTTP://") != -1 || url.indexOf("https://") != -1 || url.indexOf("HTTPS://") != -1;
            };
            return NativeImageLoader;
        }(egret.EventDispatcher));
        /**
         * @private
         * 指定是否启用跨域资源共享,如果ImageLoader实例有设置过crossOrigin属性将使用设置的属性
         */
        NativeImageLoader.crossOrigin = null;
        native2.NativeImageLoader = NativeImageLoader;
        __reflect(NativeImageLoader.prototype, "egret.native2.NativeImageLoader", ["egret.ImageLoader"]);
        egret.ImageLoader = NativeImageLoader;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @classdesc
         * @implements egret.StageText
         * @private
         * @version Egret 2.4
         * @platform Web,Native
         */
        var NativeStageText = (function (_super) {
            __extends(NativeStageText, _super);
            /**
             * @version Egret 2.4
             * @platform Web,Native
             */
            function NativeStageText() {
                var _this = _super.call(this) || this;
                /**
                 * @private
                 */
                _this.textValue = "";
                /**
                 * @private
                 */
                _this.colorValue = 0xffffff;
                /**
                 * @private
                 */
                _this.isFinishDown = false;
                _this.textValue = "";
                return _this;
            }
            /**
             * @private
             *
             * @returns
             */
            NativeStageText.prototype.$getText = function () {
                if (!this.textValue) {
                    this.textValue = "";
                }
                return this.textValue;
            };
            /**
             * @private
             *
             * @param value
             */
            NativeStageText.prototype.$setText = function (value) {
                this.textValue = value;
                return true;
            };
            NativeStageText.prototype.$setColor = function (value) {
                this.colorValue = value;
                return true;
            };
            /**
             * @private
             *
             */
            NativeStageText.prototype.$onBlur = function () {
            };
            //全屏键盘
            NativeStageText.prototype.showScreenKeyboard = function () {
                var self = this;
                self.dispatchEvent(new egret.Event("focus"));
                egret.Event.dispatchEvent(self, "focus", false, { "showing": true });
                egret_native.EGT_TextInput = function (appendText) {
                    if (self.$textfield.multiline) {
                        self.textValue = appendText;
                        self.dispatchEvent(new egret.Event("updateText"));
                        if (self.isFinishDown) {
                            self.isFinishDown = false;
                            self.dispatchEvent(new egret.Event("blur"));
                        }
                    }
                    else {
                        self.textValue = appendText.replace(/[\n|\r]/, "");
                        //关闭软键盘
                        egret_native.TextInputOp.setKeybordOpen(false);
                        self.dispatchEvent(new egret.Event("updateText"));
                        self.dispatchEvent(new egret.Event("blur"));
                    }
                };
                //点击完成
                egret_native.EGT_keyboardFinish = function () {
                    if (self.$textfield.multiline) {
                        self.isFinishDown = true;
                    }
                };
            };
            /**
             * @private
             *
             */
            NativeStageText.prototype.$show = function () {
                var self = this;
                var textfield = this.$textfield;
                var values = textfield.$TextField;
                egret_native.TextInputOp.setKeybordOpen(false);
                egret_native.EGT_getTextEditerContentText = function () {
                    return self.$getText();
                };
                egret_native.EGT_keyboardDidShow = function () {
                    //if (egret_native.TextInputOp.isFullScreenKeyBoard()) {//横屏
                    //}
                    self.showScreenKeyboard();
                    egret_native.EGT_keyboardDidShow = function () {
                    };
                    if (egret_native.TextInputOp.updateConfig) {
                        egret_native.TextInputOp.updateConfig(JSON.stringify({
                            "font_color": values[2 /* textColor */]
                        }));
                    }
                };
                egret_native.EGT_keyboardDidHide = function () {
                };
                egret_native.EGT_deleteBackward = function () {
                };
                var inputType = values[37 /* inputType */];
                var inputMode = values[30 /* multiline */] ? 0 : 6;
                var inputFlag = -1; //textfield.displayAsPassword ? 0 : -1;
                if (inputType == egret.TextFieldInputType.PASSWORD) {
                    inputFlag = 0;
                }
                else if (inputType == egret.TextFieldInputType.TEL) {
                    inputMode = 3;
                }
                var returnType = 1;
                var maxLength = values[21 /* maxChars */] <= 0 ? -1 : values[21 /* maxChars */];
                var node = textfield.$getRenderNode();
                var point = this.$textfield.localToGlobal(0, 0);
                egret_native.TextInputOp.setKeybordOpen(true, JSON.stringify({
                    "inputMode": inputMode,
                    "inputFlag": inputFlag,
                    "returnType": returnType,
                    "maxLength": maxLength,
                    "x": point.x,
                    "y": point.y,
                    "width": textfield.width,
                    "height": textfield.height,
                    "font_size": values[0 /* fontSize */],
                    "font_color": values[2 /* textColor */],
                    "textAlign": values[9 /* textAlign */],
                    "verticalAlign": values[10 /* verticalAlign */]
                }));
            };
            /**
             * @private
             *
             */
            NativeStageText.prototype.$hide = function () {
                egret_native.TextInputOp.setKeybordOpen(false);
                this.dispatchEvent(new egret.Event("blur"));
            };
            NativeStageText.prototype.$resetStageText = function () {
            };
            NativeStageText.prototype.$addToStage = function () {
            };
            NativeStageText.prototype.$removeFromStage = function () {
            };
            NativeStageText.prototype.$setTextField = function (value) {
                this.$textfield = value;
                return true;
            };
            return NativeStageText;
        }(egret.EventDispatcher));
        native2.NativeStageText = NativeStageText;
        __reflect(NativeStageText.prototype, "egret.native2.NativeStageText", ["egret.StageText"]);
        egret.StageText = NativeStageText;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var NativeFps = (function (_super) {
            __extends(NativeFps, _super);
            function NativeFps(stage, showFPS, showLog, logFilter, styles) {
                var _this = _super.call(this) || this;
                _this.arrFps = [];
                _this.arrLog = [];
                if (showFPS || showLog) {
                    _this.panelX = styles["x"] === undefined ? 0 : parseInt(styles['x']);
                    _this.panelY = styles["y"] === undefined ? 0 : parseInt(styles['y']);
                    _this._stage = stage;
                    _this.showFps = showFPS;
                    _this.showLog = showLog;
                    _this.fontColor = styles["textColor"] === undefined ? 0xffffff : parseInt(styles['textColor']);
                    _this.fontSize = styles["size"] === undefined ? 24 : parseInt(styles['size']);
                    _this.bgAlpha = styles["bgAlpha"] || 0.9;
                    _this.shape = new egret.Shape();
                    _this.addChild(_this.shape);
                    if (showFPS)
                        _this.addFps();
                    if (showLog)
                        _this.addLog();
                }
                return _this;
            }
            NativeFps.prototype.addFps = function () {
                var fps = new egret.TextField();
                fps.x = fps.y = 4;
                this.textFps = fps;
                this.addChild(fps);
                fps.lineSpacing = 2;
                fps.size = this.fontSize;
                fps.textColor = this.fontColor;
                fps.textFlow = [
                    { text: "0 FPS " + egret.Capabilities.renderMode + "\n" },
                    { text: "Draw: 0\nDirty: 0%\n" },
                    { text: "Cost: " },
                    { text: "0 ", style: { "textColor": 0x18fefe } },
                    { text: "0 ", style: { "textColor": 0xffff00 } },
                    { text: "0 ", style: { "textColor": 0xff0000 } }
                ];
            };
            NativeFps.prototype.addLog = function () {
                var text = new egret.TextField();
                text.size = this.fontSize;
                text.textColor = this.fontColor;
                text.x = 4;
                this.addChild(text);
                this.textLog = text;
            };
            ;
            NativeFps.prototype.update = function (datas) {
                this.arrFps.push(datas.fps);
                var fpsTotal = 0;
                var lenFps = this.arrFps.length;
                if (lenFps > 101) {
                    lenFps = 101;
                    this.arrFps.shift();
                }
                var fpsMin = this.arrFps[0];
                var fpsMax = this.arrFps[0];
                for (var i = 0; i < lenFps; i++) {
                    var num = this.arrFps[i];
                    fpsTotal += num;
                    if (num < fpsMin)
                        fpsMin = num;
                    else if (num > fpsMax)
                        fpsMax = num;
                }
                this.textFps.textFlow = [
                    { text: datas.fps + " FPS " + egret.Capabilities.renderMode + "\n" },
                    { text: "min" + fpsMin + " max" + fpsMax + " avg" + Math.floor(fpsTotal / lenFps) + "\n" },
                    { text: "Draw: " + datas.draw + "\nDirty: " + datas.dirty + "%\n" },
                    { text: "Cost: " },
                    { text: datas.costTicker + " ", style: { "textColor": 0x18fefe } },
                    { text: datas.costDirty + " ", style: { "textColor": 0xffff00 } },
                    { text: datas.costRender + " ", style: { "textColor": 0xff0000 } }
                ];
                this.updateLayout();
            };
            ;
            NativeFps.prototype.updateInfo = function (info) {
                var fpsHeight = 0;
                if (this.showFps) {
                    fpsHeight = this.textFps.height;
                    this.textLog.y = fpsHeight + 4;
                }
                this.arrLog.push(info);
                this.textLog.text = this.arrLog.join('\n');
                if (this._stage.stageHeight > 0) {
                    if (this.textLog.textWidth > this._stage.stageWidth - 20 - this.panelX) {
                        this.textLog.width = this._stage.stageWidth - 20 - this.panelX;
                    }
                    while (this.textLog.textHeight > this._stage.stageHeight - fpsHeight - 20 - this.panelY) {
                        this.arrLog.shift();
                        this.textLog.text = this.arrLog.join("\n");
                    }
                }
                this.updateLayout();
            };
            NativeFps.prototype.updateLayout = function () {
                if (egret.Capabilities.runtimeType == egret.RuntimeType.NATIVE) {
                    return;
                }
                var g = this.shape.$graphics;
                g.clear();
                g.beginFill(0x000000, this.bgAlpha);
                g.drawRect(0, 0, this.width + 8, this.height + 8);
                g.endFill();
            };
            return NativeFps;
        }(egret.Sprite));
        native2.NativeFps = NativeFps;
        __reflect(NativeFps.prototype, "egret.native2.NativeFps", ["egret.FPSDisplay", "egret.DisplayObject"]);
        egret.FPSDisplay = NativeFps;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        if (true) {
            function setLogLevel(logType) {
                egret_native.loglevel(logType);
            }
            Object.defineProperty(egret.Logger, "logLevel", {
                set: setLogLevel,
                enumerable: true,
                configurable: true
            });
        }
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        var customContext;
        var context = {
            setAutoClear: function (value) {
                native2.WebGLRenderBuffer.autoClear = value;
            },
            save: function () {
                // do nothing
            },
            restore: function () {
                var context = native2.WebGLRenderContext.getInstance(0, 0);
                var gl = context.context;
                if (native2.WebGLRenderContext.$supportCmdBatch) {
                    gl = context.glCmdManager;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, context["vertexBuffer"]);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context["indexBuffer"]);
                gl.activeTexture(gl.TEXTURE0);
                context.shaderManager.currentShader = null;
                context["bindIndices"] = false;
                var buffer = context.$bufferStack[1];
                context["activateBuffer"](buffer);
                gl.enable(gl.BLEND);
                context["setBlendMode"]("source-over");
            }
        };
        function setRendererContext(custom) {
            custom.onStart(context);
            customContext = custom;
        }
        egret.setRendererContext = setRendererContext;
        /**
         * @private
         */
        native2.$supportCanvas = egret_native.Canvas ? true : false;
        native2.$glCmdBatch = false;
        var isRunning = false;
        var playerList = [];
        function runEgret(options) {
            if (isRunning) {
                return;
            }
            isRunning = true;
            if (!options) {
                options = {};
            }
            /**
             * @private
             * 设置当前runtime版本是否支持cmdBatch
             */
            native2.WebGLRenderContext.$supportCmdBatch = native2.$glCmdBatch;
            setRenderMode(options.renderMode);
            if (true) {
                //todo 获得系统语言版本
                var language = "zh_CN";
                if (language in egret.$locale_strings)
                    egret.$language = language;
            }
            try {
                egret.Capabilities.$setNativeCapabilities(egret_native.getVersion());
            }
            catch (e) {
            }
            var ticker = egret.sys.$ticker;
            var mainLoop = function () {
                if (customContext) {
                    customContext.onRender(context);
                }
                ticker.update();
            };
            egret_native.setOnUpdate(mainLoop, ticker);
            if (!egret.sys.screenAdapter) {
                if (options.screenAdapter) {
                    egret.sys.screenAdapter = options.screenAdapter;
                }
                else {
                    egret.sys.screenAdapter = new egret.sys.DefaultScreenAdapter();
                }
            }
            // todo
            var player = new native2.NativePlayer();
            playerList.push(player);
            // 关闭脏矩形
            player.$stage.dirtyRegionPolicy = egret.DirtyRegionPolicy.OFF;
            egret.sys.DisplayList.prototype.setDirtyRegionPolicy = function () {
            };
        }
        /**
         * 设置渲染模式。"auto","webgl","canvas"
         * @param renderMode
         */
        function setRenderMode(renderMode) {
            egret.sys.CanvasRenderBuffer = native2.WebGLRenderBuffer;
            // sys.RenderBuffer = web.WebGLRenderBuffer;
            // sys.systemRenderer = new web.WebGLRenderer();
            // sys.canvasRenderer = new CanvasRenderer();
            // Capabilities.$renderMode = "webgl";
            // TODO rename
            egret.sys.RenderBuffer = native2.WebGLRenderBuffer;
            egret.sys.systemRenderer = new native2.WebGLRenderer();
            egret.sys.canvasRenderer = new native2.WebGLRenderer();
            egret.sys.customHitTestBuffer = new native2.WebGLRenderBuffer(3, 3);
            egret.sys.canvasHitTestBuffer = new native2.WebGLRenderBuffer(3, 3);
            egret.Capabilities.$renderMode = "webgl";
        }
        function updateAllScreens() {
            var length = playerList.length;
            for (var i = 0; i < length; i++) {
                playerList[i].updateScreenSize();
            }
        }
        function toArray(argument) {
            var args = [];
            for (var i = 0; i < argument.length; i++) {
                args.push(argument[i]);
            }
            return args;
        }
        egret.warn = function () {
            console.warn.apply(console, toArray(arguments));
        };
        egret.error = function () {
            console.error.apply(console, toArray(arguments));
        };
        egret.assert = function () {
            console.assert.apply(console, toArray(arguments));
        };
        if (true) {
            egret.log = function () {
                if (true) {
                    var length = arguments.length;
                    var info = "";
                    for (var i = 0; i < length; i++) {
                        info += arguments[i] + " ";
                    }
                    egret.sys.$logToFPS(info);
                }
                console.log.apply(console, toArray(arguments));
            };
        }
        else {
            egret.log = function () {
                console.log.apply(console, toArray(arguments));
            };
        }
        egret.runEgret = runEgret;
        egret.updateAllScreens = updateAllScreens;
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
(function (egret) {
    var native;
    (function (native) {
        native.$supportCanvas = true;
        egret.native.$supportCanvas = egret.native2.$supportCanvas;
    })(native = egret.native || (egret.native = {}));
})(egret || (egret = {}));
(function (egret) {
    var native;
    (function (native) {
        native.$supportGLCmdBatch = false;
        egret.native.$supportGLCmdBatch = egret.native2.$glCmdBatch;
    })(native = egret.native || (egret.native = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * 创建一个canvas。
         */
        function createCanvas(width, height) {
            var canvas = document.createElement("canvas");
            if (!isNaN(width) && !isNaN(height)) {
                canvas.width = width;
                canvas.height = height;
            }
            var context = canvas.getContext("2d");
            if (context["imageSmoothingEnabled"] === undefined) {
                var keys = ["webkitImageSmoothingEnabled", "mozImageSmoothingEnabled", "msImageSmoothingEnabled"];
                var key_1;
                for (var i = keys.length - 1; i >= 0; i--) {
                    key_1 = keys[i];
                    if (context[key_1] !== void 0) {
                        break;
                    }
                }
                try {
                    Object.defineProperty(context, "imageSmoothingEnabled", {
                        get: function () {
                            return this[key_1];
                        },
                        set: function (value) {
                            this[key_1] = value;
                        }
                    });
                }
                catch (e) {
                    context["imageSmoothingEnabled"] = context[key_1];
                }
            }
            return canvas;
        }
        var sharedCanvas;
        /**
         * @private
         * Canvas2D渲染缓冲
         */
        var CanvasRenderBuffer = (function () {
            function CanvasRenderBuffer(width, height, root) {
                // this.surface = createCanvas(width, height);
                // this.context = this.surface.getContext("2d");
            }
            Object.defineProperty(CanvasRenderBuffer.prototype, "width", {
                /**
                 * 渲染缓冲的宽度，以像素为单位。
                 * @readOnly
                 */
                get: function () {
                    return this.surface.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CanvasRenderBuffer.prototype, "height", {
                /**
                 * 渲染缓冲的高度，以像素为单位。
                 * @readOnly
                 */
                get: function () {
                    return this.surface.height;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * 改变渲染缓冲的大小并清空缓冲区
             * @param width 改变后的宽
             * @param height 改变后的高
             * @param useMaxSize 若传入true，则将改变后的尺寸与已有尺寸对比，保留较大的尺寸。
             */
            CanvasRenderBuffer.prototype.resize = function (width, height, useMaxSize) {
                var surface = this.surface;
                if (useMaxSize) {
                    var change = false;
                    if (surface.width < width) {
                        surface.width = width;
                        change = true;
                    }
                    if (surface.height < height) {
                        surface.height = height;
                        change = true;
                    }
                    //尺寸没有变化时,将绘制属性重置
                    if (!change) {
                        this.context.globalCompositeOperation = "source-over";
                        this.context.setTransform(1, 0, 0, 1, 0, 0);
                        this.context.globalAlpha = 1;
                    }
                }
                else {
                    if (surface.width != width) {
                        surface.width = width;
                    }
                    if (surface.height != height) {
                        surface.height = height;
                    }
                }
                this.clear();
            };
            /**
             * 改变渲染缓冲为指定大小，但保留原始图像数据
             * @param width 改变后的宽
             * @param height 改变后的高
             * @param offsetX 原始图像数据在改变后缓冲区的绘制起始位置x
             * @param offsetY 原始图像数据在改变后缓冲区的绘制起始位置y
             */
            CanvasRenderBuffer.prototype.resizeTo = function (width, height, offsetX, offsetY) {
                if (!sharedCanvas) {
                    sharedCanvas = createCanvas();
                }
                var oldContext = this.context;
                var oldSurface = this.surface;
                var newSurface = sharedCanvas;
                var newContext = newSurface.getContext("2d");
                sharedCanvas = oldSurface;
                this.context = newContext;
                this.surface = newSurface;
                newSurface.width = Math.max(width, 257);
                newSurface.height = Math.max(height, 257);
                newContext.setTransform(1, 0, 0, 1, 0, 0);
                newContext.drawImage(oldSurface, offsetX, offsetY);
                oldSurface.height = 1;
                oldSurface.width = 1;
            };
            CanvasRenderBuffer.prototype.setDirtyRegionPolicy = function (state) {
            };
            /**
             * 清空并设置裁切
             * @param regions 矩形列表
             * @param offsetX 矩形要加上的偏移量x
             * @param offsetY 矩形要加上的偏移量y
             */
            CanvasRenderBuffer.prototype.beginClip = function (regions, offsetX, offsetY) {
                offsetX = +offsetX || 0;
                offsetY = +offsetY || 0;
                var context = this.context;
                context.save();
                context.beginPath();
                context.setTransform(1, 0, 0, 1, offsetX, offsetY);
                var length = regions.length;
                for (var i = 0; i < length; i++) {
                    var region = regions[i];
                    context.clearRect(region.minX, region.minY, region.width, region.height);
                    context.rect(region.minX, region.minY, region.width, region.height);
                }
                context.clip();
            };
            /**
             * 取消上一次设置的clip。
             */
            CanvasRenderBuffer.prototype.endClip = function () {
                this.context.restore();
            };
            /**
             * 获取指定区域的像素
             */
            CanvasRenderBuffer.prototype.getPixels = function (x, y, width, height) {
                if (width === void 0) { width = 1; }
                if (height === void 0) { height = 1; }
                return this.context.getImageData(x, y, width, height).data;
            };
            /**
             * 转换成base64字符串，如果图片（或者包含的图片）跨域，则返回null
             * @param type 转换的类型，如: "image/png","image/jpeg"
             */
            CanvasRenderBuffer.prototype.toDataURL = function (type, encoderOptions) {
                return this.surface.toDataURL(type, encoderOptions);
            };
            /**
             * 清空缓冲区数据
             */
            CanvasRenderBuffer.prototype.clear = function () {
                this.context.setTransform(1, 0, 0, 1, 0, 0);
                this.context.clearRect(0, 0, this.surface.width, this.surface.height);
            };
            /**
             * 销毁绘制对象
             */
            CanvasRenderBuffer.prototype.destroy = function () {
                this.surface.width = this.surface.height = 0;
            };
            return CanvasRenderBuffer;
        }());
        native2.CanvasRenderBuffer = CanvasRenderBuffer;
        __reflect(CanvasRenderBuffer.prototype, "egret.native2.CanvasRenderBuffer", ["egret.sys.RenderBuffer"]);
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * 绘制指令管理器
         * 用来维护drawData数组
         */
        var WebGLDrawCmdManager = (function () {
            function WebGLDrawCmdManager() {
                /**
                 * 用于缓存绘制命令的数组
                 */
                this.drawData = [];
                this.drawDataLen = 0;
            }
            /**
             * 压入绘制矩形指令
             */
            WebGLDrawCmdManager.prototype.pushDrawRect = function () {
                if (this.drawDataLen == 0 || this.drawData[this.drawDataLen - 1].type != 1 /* RECT */) {
                    var data = this.drawData[this.drawDataLen] || {};
                    data.type = 1 /* RECT */;
                    data.count = 0;
                    this.drawData[this.drawDataLen] = data;
                    this.drawDataLen++;
                }
                this.drawData[this.drawDataLen - 1].count += 2;
            };
            /**
             * 压入绘制texture指令
             */
            WebGLDrawCmdManager.prototype.pushDrawTexture = function (texture, count, filter, textureWidth, textureHeight) {
                if (count === void 0) { count = 2; }
                if (filter) {
                    // 目前有滤镜的情况下不会合并绘制
                    var data = this.drawData[this.drawDataLen] || {};
                    data.type = 0 /* TEXTURE */;
                    data.texture = texture;
                    data.filter = filter;
                    data.count = count;
                    data.textureWidth = textureWidth;
                    data.textureHeight = textureHeight;
                    this.drawData[this.drawDataLen] = data;
                    this.drawDataLen++;
                }
                else {
                    if (this.drawDataLen == 0 || this.drawData[this.drawDataLen - 1].type != 0 /* TEXTURE */ || texture != this.drawData[this.drawDataLen - 1].texture || this.drawData[this.drawDataLen - 1].filter) {
                        var data = this.drawData[this.drawDataLen] || {};
                        data.type = 0 /* TEXTURE */;
                        data.texture = texture;
                        data.count = 0;
                        this.drawData[this.drawDataLen] = data;
                        this.drawDataLen++;
                    }
                    this.drawData[this.drawDataLen - 1].count += count;
                }
            };
            // lj
            WebGLDrawCmdManager.prototype.pushDrawText = function (texture, count, textColor, stroke, strokeColor, texturesInfo) {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 10 /* FONT */;
                data.texture = texture;
                data.count = count;
                data.textColor = textColor;
                data.stroke = stroke;
                data.strokeColor = strokeColor;
                data.texturesInfo = texturesInfo;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            //-lj
            // TODO 
            WebGLDrawCmdManager.prototype.pushDrawTextForCmdBatch = function (text, length, x, y, textColor, stroke, strokeColor, alpha, transform /*, texturesInfo */) {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 10 /* FONT */;
                data.text = text;
                data.count = length;
                data.x = x;
                data.y = y;
                data.textColor = textColor;
                data.stroke = stroke;
                data.strokeColor = strokeColor;
                //计算出绘制矩阵，之后把矩阵还原回之前的
                var locWorldTransform = transform;
                var originalA = locWorldTransform.a;
                var originalB = locWorldTransform.b;
                var originalC = locWorldTransform.c;
                var originalD = locWorldTransform.d;
                var originalTx = locWorldTransform.tx;
                var originalTy = locWorldTransform.ty;
                var a = locWorldTransform.a;
                var b = locWorldTransform.b;
                var c = locWorldTransform.c;
                var d = locWorldTransform.d;
                var tx = locWorldTransform.tx - 2;
                var ty = locWorldTransform.ty - 2;
                locWorldTransform.a = originalA;
                locWorldTransform.b = originalB;
                locWorldTransform.c = originalC;
                locWorldTransform.d = originalD;
                locWorldTransform.tx = originalTx;
                locWorldTransform.ty = originalTy;
                var w = 0;
                var h = 0;
                // var cacheTextId = this.vertexIndex * this.vertSize * len;
                var vertexIndex = 0;
                var vertSize = 5;
                var numVerts = vertSize * length;
                var vertices = new Float32Array(numVerts);
                for (var i = 0; i < length; i++) {
                    var index = vertexIndex * vertSize;
                    var j = i * 16;
                    // xy
                    vertices[index++] = tx; // + arr[j++];
                    vertices[index++] = ty; // + arr[j++];
                    // uv
                    vertices[index++] = 0; //arr[j++];
                    vertices[index++] = 0; //arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + tx; // + arr[j++];
                    vertices[index++] = b * w + ty; // + arr[j++];
                    // uv
                    vertices[index++] = 0; //arr[j++];
                    vertices[index++] = 0; //arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + c * h + tx; // + arr[j++];
                    vertices[index++] = d * h + b * w + ty; // + arr[j++];
                    // uv
                    vertices[index++] = 0; //arr[j++];
                    vertices[index++] = 0; //arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = c * h + tx; // + arr[j++];
                    vertices[index++] = d * h + ty; // + arr[j++];
                    // uv
                    vertices[index++] = 0; //arr[j++];
                    vertices[index++] = 0; //arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    vertexIndex += 4;
                }
                // data.texturesInfo = texturesInfo;
                data.transformData = vertices;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /**
             * 压入pushMask指令
             */
            WebGLDrawCmdManager.prototype.pushPushMask = function (count) {
                if (count === void 0) { count = 1; }
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 2 /* PUSH_MASK */;
                data.count = count * 2;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /**
             * 压入popMask指令
             */
            WebGLDrawCmdManager.prototype.pushPopMask = function (count) {
                if (count === void 0) { count = 1; }
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 3 /* POP_MASK */;
                data.count = count * 2;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /**
             * 压入混色指令
             */
            WebGLDrawCmdManager.prototype.pushSetBlend = function (value) {
                var len = this.drawDataLen;
                // 有无遍历到有效绘图操作
                var drawState = false;
                for (var i = len - 1; i >= 0; i--) {
                    var data = this.drawData[i];
                    if (data) {
                        if (data.type == 0 /* TEXTURE */ || data.type == 1 /* RECT */) {
                            drawState = true;
                        }
                        // 如果与上一次blend操作之间无有效绘图，上一次操作无效
                        if (!drawState && data.type == 4 /* BLEND */) {
                            this.drawData.splice(i, 1);
                            this.drawDataLen--;
                            continue;
                        }
                        // 如果与上一次blend操作重复，本次操作无效
                        if (data.type == 4 /* BLEND */) {
                            if (data.value == value) {
                                return;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
                var _data = this.drawData[this.drawDataLen] || {};
                _data.type = 4 /* BLEND */;
                _data.value = value;
                this.drawData[this.drawDataLen] = _data;
                this.drawDataLen++;
            };
            /*
             * 压入resize render target命令
             */
            WebGLDrawCmdManager.prototype.pushResize = function (buffer, width, height) {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 5 /* RESIZE_TARGET */;
                data.buffer = buffer;
                data.width = width;
                data.height = height;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /*
             * 压入clear color命令
             */
            WebGLDrawCmdManager.prototype.pushClearColor = function () {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 6 /* CLEAR_COLOR */;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /**
             * 压入激活buffer命令
             */
            WebGLDrawCmdManager.prototype.pushActivateBuffer = function (buffer) {
                var len = this.drawDataLen;
                // 有无遍历到有效绘图操作
                var drawState = false;
                for (var i = len - 1; i >= 0; i--) {
                    var data = this.drawData[i];
                    if (data) {
                        if (data.type != 4 /* BLEND */ && data.type != 7 /* ACT_BUFFER */) {
                            drawState = true;
                        }
                        // 如果与上一次buffer操作之间无有效绘图，上一次操作无效
                        if (!drawState && data.type == 7 /* ACT_BUFFER */) {
                            this.drawData.splice(i, 1);
                            this.drawDataLen--;
                            continue;
                        }
                    }
                }
                var _data = this.drawData[this.drawDataLen] || {};
                _data.type = 7 /* ACT_BUFFER */;
                _data.buffer = buffer;
                _data.width = buffer.rootRenderTarget.width;
                _data.height = buffer.rootRenderTarget.height;
                this.drawData[this.drawDataLen] = _data;
                this.drawDataLen++;
            };
            /*
             * 压入enabel scissor命令
             */
            WebGLDrawCmdManager.prototype.pushEnableScissor = function (x, y, width, height) {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 8 /* ENABLE_SCISSOR */;
                data.x = x;
                data.y = y;
                data.width = width;
                data.height = height;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /*
             * 压入disable scissor命令
             */
            WebGLDrawCmdManager.prototype.pushDisableScissor = function () {
                var data = this.drawData[this.drawDataLen] || {};
                data.type = 9 /* DISABLE_SCISSOR */;
                this.drawData[this.drawDataLen] = data;
                this.drawDataLen++;
            };
            /**
             * 清空命令数组
             */
            WebGLDrawCmdManager.prototype.clear = function () {
                for (var i = 0; i < this.drawDataLen; i++) {
                    var data = this.drawData[i];
                    data.type = 0;
                    data.count = 0;
                    data.texture = null;
                    data.filter = null;
                    data.uv = null;
                    data.value = "";
                    data.buffer = null;
                    data.width = 0;
                    data.height = 0;
                }
                this.drawDataLen = 0;
            };
            return WebGLDrawCmdManager;
        }());
        native2.WebGLDrawCmdManager = WebGLDrawCmdManager;
        __reflect(WebGLDrawCmdManager.prototype, "egret.native2.WebGLDrawCmdManager");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * WebGL渲染缓存
         */
        var WebGLRenderBuffer = (function (_super) {
            __extends(WebGLRenderBuffer, _super);
            function WebGLRenderBuffer(width, height, root) {
                var _this = _super.call(this) || this;
                _this.globalAlpha = 1;
                /**
                 * stencil state
                 * 模版开关状态
                 */
                _this.stencilState = false;
                _this.$stencilList = [];
                _this.stencilHandleCount = 0;
                /**
                 * scissor state
                 * scissor 开关状态
                 */
                _this.$scissorState = false;
                _this.scissorRect = new egret.Rectangle();
                _this.$hasScissor = false;
                // dirtyRegionPolicy hack
                _this.dirtyRegionPolicy = true;
                _this._dirtyRegionPolicy = true; // 默认设置为true，保证第一帧绘制在frameBuffer上
                _this.$drawCalls = 0;
                _this.$computeDrawCall = false;
                _this.globalMatrix = new egret.Matrix();
                _this.savedGlobalMatrix = new egret.Matrix();
                // 获取webglRenderContext
                _this.context = native2.WebGLRenderContext.getInstance(width, height);
                // buffer 对应的 render target
                var glcontext = _this.context.context;
                if (native2.WebGLRenderContext.$supportCmdBatch) {
                    glcontext = _this.context.glCmdManager;
                }
                _this.rootRenderTarget = new native2.WebGLRenderTarget(glcontext, 3, 3);
                if (width && height) {
                    _this.resize(width, height);
                }
                // 如果是第一个加入的buffer，说明是舞台buffer
                _this.root = root;
                // 如果是用于舞台渲染的renderBuffer，则默认添加renderTarget到renderContext中，而且是第一个
                if (_this.root) {
                    _this.context.pushBuffer(_this);
                    // 画布
                    _this.surface = _this.context.surface;
                }
                else {
                    // 由于创建renderTarget造成的frameBuffer绑定，这里重置绑定
                    var lastBuffer = _this.context.activatedBuffer;
                    if (lastBuffer) {
                        lastBuffer.rootRenderTarget.activate();
                    }
                    _this.surface = _this.rootRenderTarget;
                }
                return _this;
            }
            WebGLRenderBuffer.prototype.enableStencil = function () {
                if (!this.stencilState) {
                    this.context.enableStencilTest();
                    this.stencilState = true;
                }
            };
            WebGLRenderBuffer.prototype.disableStencil = function () {
                if (this.stencilState) {
                    this.context.disableStencilTest();
                    this.stencilState = false;
                }
            };
            WebGLRenderBuffer.prototype.restoreStencil = function () {
                if (this.stencilState) {
                    this.context.enableStencilTest();
                }
                else {
                    this.context.disableStencilTest();
                }
            };
            WebGLRenderBuffer.prototype.enableScissor = function (x, y, width, height) {
                if (!this.$scissorState) {
                    this.$scissorState = true;
                    this.scissorRect.setTo(x, y, width, height);
                    this.context.enableScissorTest(this.scissorRect);
                }
            };
            WebGLRenderBuffer.prototype.disableScissor = function () {
                if (this.$scissorState) {
                    this.$scissorState = false;
                    this.scissorRect.setEmpty();
                    this.context.disableScissorTest();
                }
            };
            WebGLRenderBuffer.prototype.restoreScissor = function () {
                if (this.$scissorState) {
                    this.context.enableScissorTest(this.scissorRect);
                }
                else {
                    this.context.disableScissorTest();
                }
            };
            Object.defineProperty(WebGLRenderBuffer.prototype, "width", {
                /**
                 * 渲染缓冲的宽度，以像素为单位。
                 * @readOnly
                 */
                get: function () {
                    return this.rootRenderTarget.width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WebGLRenderBuffer.prototype, "height", {
                /**
                 * 渲染缓冲的高度，以像素为单位。
                 * @readOnly
                 */
                get: function () {
                    return this.rootRenderTarget.height;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * 改变渲染缓冲的大小并清空缓冲区
             * @param width 改变后的宽
             * @param height 改变后的高
             * @param useMaxSize 若传入true，则将改变后的尺寸与已有尺寸对比，保留较大的尺寸。
             */
            WebGLRenderBuffer.prototype.resize = function (width, height, useMaxSize) {
                this.context.pushBuffer(this);
                width = width || 1;
                height = height || 1;
                // render target 尺寸重置
                if (width != this.rootRenderTarget.width || height != this.rootRenderTarget.height) {
                    this.context.drawCmdManager.pushResize(this, width, height);
                    // 同步更改宽高
                    this.rootRenderTarget.width = width;
                    this.rootRenderTarget.height = height;
                }
                // 如果是舞台的渲染缓冲，执行resize，否则surface大小不随之改变
                if (this.root) {
                    this.context.resize(width, height, useMaxSize);
                }
                this.context.clear();
                this.context.popBuffer();
            };
            /**
             * 改变渲染缓冲为指定大小，但保留原始图像数据
             * @param width 改变后的宽
             * @param height 改变后的高
             * @param offsetX 原始图像数据在改变后缓冲区的绘制起始位置x
             * @param offsetY 原始图像数据在改变后缓冲区的绘制起始位置y
             */
            WebGLRenderBuffer.prototype.resizeTo = function (width, height, offsetX, offsetY) {
                this.context.pushBuffer(this);
                var oldWidth = this.rootRenderTarget.width;
                var oldHeight = this.rootRenderTarget.height;
                var tempBuffer = WebGLRenderBuffer.create(oldWidth, oldHeight);
                this.context.pushBuffer(tempBuffer);
                this.context.drawImage(this.rootRenderTarget, 0, 0, oldWidth, oldHeight, 0, 0, oldWidth, oldHeight, oldWidth, oldHeight);
                this.context.popBuffer();
                this.resize(width, height);
                this.setTransform(1, 0, 0, 1, 0, 0);
                this.context.drawImage(tempBuffer.rootRenderTarget, 0, 0, oldWidth, oldHeight, offsetX, offsetY, oldWidth, oldHeight, oldWidth, oldHeight);
                WebGLRenderBuffer.release(tempBuffer);
                this.context.popBuffer();
            };
            WebGLRenderBuffer.prototype.setDirtyRegionPolicy = function (state) {
                this.dirtyRegionPolicy = (state == "on");
            };
            /**
             * 清空并设置裁切
             * @param regions 矩形列表
             * @param offsetX 矩形要加上的偏移量x
             * @param offsetY 矩形要加上的偏移量y
             */
            WebGLRenderBuffer.prototype.beginClip = function (regions, offsetX, offsetY) {
                this.context.pushBuffer(this);
                if (this.root) {
                    // dirtyRegionPolicy hack
                    if (this._dirtyRegionPolicy) {
                        this.rootRenderTarget.useFrameBuffer = true;
                        this.rootRenderTarget.activate();
                    }
                    else {
                        this.rootRenderTarget.useFrameBuffer = false;
                        this.rootRenderTarget.activate();
                        WebGLRenderBuffer.autoClear && this.context.clear();
                    }
                }
                offsetX = +offsetX || 0;
                offsetY = +offsetY || 0;
                this.setTransform(1, 0, 0, 1, offsetX, offsetY);
                var length = regions.length;
                //只有一个区域且刚好为舞台大小时,不设置模板
                if (length == 1 && regions[0].minX == 0 && regions[0].minY == 0 &&
                    regions[0].width == this.rootRenderTarget.width && regions[0].height == this.rootRenderTarget.height) {
                    this.maskPushed = false;
                    this.rootRenderTarget.useFrameBuffer && this.context.clear();
                    this.context.popBuffer();
                    return;
                }
                // 擦除脏矩形区域
                for (var i = 0; i < length; i++) {
                    var region = regions[i];
                    this.context.clearRect(region.minX, region.minY, region.width, region.height);
                }
                // 设置模版
                if (length > 0) {
                    // 对第一个且只有一个mask用scissor处理
                    if (!this.$hasScissor && length == 1) {
                        var region = regions[0];
                        regions = regions.slice(1);
                        var x = region.minX + offsetX;
                        var y = region.minY + offsetY;
                        var width = region.width;
                        var height = region.height;
                        this.context.enableScissor(x, -y - height + this.height, width, height);
                        this.scissorEnabled = true;
                    }
                    else {
                        this.scissorEnabled = false;
                    }
                    if (regions.length > 0) {
                        this.context.pushMask(regions);
                        this.maskPushed = true;
                    }
                    else {
                        this.maskPushed = false;
                    }
                    this.offsetX = offsetX;
                    this.offsetY = offsetY;
                }
                else {
                    this.maskPushed = false;
                }
                this.context.popBuffer();
            };
            /**
             * 取消上一次设置的clip。
             */
            WebGLRenderBuffer.prototype.endClip = function () {
                if (this.maskPushed || this.scissorEnabled) {
                    this.context.pushBuffer(this);
                    if (this.maskPushed) {
                        this.setTransform(1, 0, 0, 1, this.offsetX, this.offsetY);
                        this.context.popMask();
                    }
                    if (this.scissorEnabled) {
                        this.context.disableScissor();
                    }
                    this.context.popBuffer();
                }
            };
            /**
             * 获取指定区域的像素
             */
            WebGLRenderBuffer.prototype.getPixels = function (x, y, width, height) {
                if (width === void 0) { width = 1; }
                if (height === void 0) { height = 1; }
                var pixels = new Uint8Array(4 * width * height);
                var useFrameBuffer = this.rootRenderTarget.useFrameBuffer;
                this.rootRenderTarget.useFrameBuffer = true;
                this.rootRenderTarget.activate();
                this.context.getPixels(x, y, width, height, pixels);
                this.rootRenderTarget.useFrameBuffer = useFrameBuffer;
                this.rootRenderTarget.activate();
                //图像反转
                var result = new Uint8Array(4 * width * height);
                for (var i = 0; i < height; i++) {
                    for (var j = 0; j < width; j++) {
                        result[(width * (height - i - 1) + j) * 4] = pixels[(width * i + j) * 4];
                        result[(width * (height - i - 1) + j) * 4 + 1] = pixels[(width * i + j) * 4 + 1];
                        result[(width * (height - i - 1) + j) * 4 + 2] = pixels[(width * i + j) * 4 + 2];
                        result[(width * (height - i - 1) + j) * 4 + 3] = pixels[(width * i + j) * 4 + 3];
                    }
                }
                return result;
            };
            /**
             * 转换成base64字符串，如果图片（或者包含的图片）跨域，则返回null
             * @param type 转换的类型，如: "image/png","image/jpeg"
             */
            WebGLRenderBuffer.prototype.toDataURL = function (type, encoderOptions) {
                return this.context.surface.toDataURL(type, encoderOptions);
            };
            /**
             * 销毁绘制对象
             */
            WebGLRenderBuffer.prototype.destroy = function () {
                this.context.destroy();
            };
            WebGLRenderBuffer.prototype.onRenderFinish = function () {
                this.$drawCalls = 0;
                // 如果是舞台渲染buffer，判断脏矩形策略
                if (this.root) {
                    // dirtyRegionPolicy hack
                    if (!this._dirtyRegionPolicy && this.dirtyRegionPolicy) {
                        this.drawSurfaceToFrameBuffer(0, 0, this.rootRenderTarget.width, this.rootRenderTarget.height, 0, 0, this.rootRenderTarget.width, this.rootRenderTarget.height, true);
                    }
                    if (this._dirtyRegionPolicy) {
                        this.drawFrameBufferToSurface(0, 0, this.rootRenderTarget.width, this.rootRenderTarget.height, 0, 0, this.rootRenderTarget.width, this.rootRenderTarget.height);
                    }
                    this._dirtyRegionPolicy = this.dirtyRegionPolicy;
                }
            };
            WebGLRenderBuffer.prototype.onRenderFinish2 = function () {
                // 如果是舞台渲染buffer，判断cmdbatch
                if (this.root && native2.WebGLRenderContext.$supportCmdBatch) {
                    this.context.glCmdManager.flushCmd();
                }
            };
            /**
             * 交换frameBuffer中的图像到surface中
             * @param width 宽度
             * @param height 高度
             */
            WebGLRenderBuffer.prototype.drawFrameBufferToSurface = function (sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, clear) {
                if (clear === void 0) { clear = false; }
                this.rootRenderTarget.useFrameBuffer = false;
                this.rootRenderTarget.activate();
                this.context.disableStencilTest(); // 切换frameBuffer注意要禁用STENCIL_TEST
                this.context.disableScissorTest();
                this.setTransform(1, 0, 0, 1, 0, 0);
                this.globalAlpha = 1;
                this.context.setGlobalCompositeOperation("source-over");
                clear && this.context.clear();
                this.context.drawImage(this.rootRenderTarget, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, sourceWidth, sourceHeight);
                this.context.$drawWebGL();
                this.rootRenderTarget.useFrameBuffer = true;
                this.rootRenderTarget.activate();
                this.restoreStencil();
                this.restoreScissor();
            };
            /**
             * 交换surface的图像到frameBuffer中
             * @param width 宽度
             * @param height 高度
             */
            WebGLRenderBuffer.prototype.drawSurfaceToFrameBuffer = function (sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, clear) {
                if (clear === void 0) { clear = false; }
                this.rootRenderTarget.useFrameBuffer = true;
                this.rootRenderTarget.activate();
                this.context.disableStencilTest(); // 切换frameBuffer注意要禁用STENCIL_TEST
                this.context.disableScissorTest();
                this.setTransform(1, 0, 0, 1, 0, 0);
                this.globalAlpha = 1;
                this.context.setGlobalCompositeOperation("source-over");
                clear && this.context.clear();
                this.context.drawImage(this.context.surface, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, sourceWidth, sourceHeight);
                this.context.$drawWebGL();
                this.rootRenderTarget.useFrameBuffer = false;
                this.rootRenderTarget.activate();
                this.restoreStencil();
                this.restoreScissor();
            };
            /**
             * 清空缓冲区数据
             */
            WebGLRenderBuffer.prototype.clear = function () {
                this.context.clear();
            };
            WebGLRenderBuffer.prototype.setTransform = function (a, b, c, d, tx, ty) {
                // this.globalMatrix.setTo(a, b, c, d, tx, ty);
                var matrix = this.globalMatrix;
                matrix.a = a;
                matrix.b = b;
                matrix.c = c;
                matrix.d = d;
                matrix.tx = tx;
                matrix.ty = ty;
            };
            WebGLRenderBuffer.prototype.transform = function (a, b, c, d, tx, ty) {
                // this.globalMatrix.append(a, b, c, d, tx, ty);
                var matrix = this.globalMatrix;
                var a1 = matrix.a;
                var b1 = matrix.b;
                var c1 = matrix.c;
                var d1 = matrix.d;
                if (a != 1 || b != 0 || c != 0 || d != 1) {
                    matrix.a = a * a1 + b * c1;
                    matrix.b = a * b1 + b * d1;
                    matrix.c = c * a1 + d * c1;
                    matrix.d = c * b1 + d * d1;
                }
                matrix.tx = tx * a1 + ty * c1 + matrix.tx;
                matrix.ty = tx * b1 + ty * d1 + matrix.ty;
            };
            WebGLRenderBuffer.prototype.translate = function (dx, dy) {
                // this.globalMatrix.translate(dx, dy);
                var matrix = this.globalMatrix;
                matrix.tx += dx;
                matrix.ty += dy;
            };
            WebGLRenderBuffer.prototype.saveTransform = function () {
                // this.savedGlobalMatrix.copyFrom(this.globalMatrix);
                var matrix = this.globalMatrix;
                var sMatrix = this.savedGlobalMatrix;
                sMatrix.a = matrix.a;
                sMatrix.b = matrix.b;
                sMatrix.c = matrix.c;
                sMatrix.d = matrix.d;
                sMatrix.tx = matrix.tx;
                sMatrix.ty = matrix.ty;
            };
            WebGLRenderBuffer.prototype.restoreTransform = function () {
                // this.globalMatrix.copyFrom(this.savedGlobalMatrix);
                var matrix = this.globalMatrix;
                var sMatrix = this.savedGlobalMatrix;
                matrix.a = sMatrix.a;
                matrix.b = sMatrix.b;
                matrix.c = sMatrix.c;
                matrix.d = sMatrix.d;
                matrix.tx = sMatrix.tx;
                matrix.ty = sMatrix.ty;
            };
            /**
             * 创建一个buffer实例
             */
            WebGLRenderBuffer.create = function (width, height) {
                var buffer = renderBufferPool.pop();
                // width = Math.min(width, 1024);
                // height = Math.min(height, 1024);
                if (buffer) {
                    buffer.resize(width, height);
                    var matrix = buffer.globalMatrix;
                    matrix.a = 1;
                    matrix.b = 0;
                    matrix.c = 0;
                    matrix.d = 1;
                    matrix.tx = 0;
                    matrix.ty = 0;
                }
                else {
                    buffer = new WebGLRenderBuffer(width, height);
                    buffer.$computeDrawCall = false;
                }
                return buffer;
            };
            /**
             * 回收一个buffer实例
             */
            WebGLRenderBuffer.release = function (buffer) {
                renderBufferPool.push(buffer);
            };
            return WebGLRenderBuffer;
        }(egret.HashObject));
        WebGLRenderBuffer.autoClear = true;
        native2.WebGLRenderBuffer = WebGLRenderBuffer;
        __reflect(WebGLRenderBuffer.prototype, "egret.native2.WebGLRenderBuffer", ["egret.sys.RenderBuffer"]);
        var renderBufferPool = []; //渲染缓冲区对象池
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * 创建一个canvas。
         */
        function createCanvas(width, height) {
            // change xs 
            // return any type
            // console.log("createCanvas width = " + width);
            // console.log("createCanvas height = " + height);
            width = isNaN(width) ? 480 : width;
            height = isNaN(height) ? 800 : height;
            var canvas = document.createElement("canvas");
            // canvas.style = {};
            // need ????
            // function $toBitmapData(data) {
            //     data["hashCode"] = data["$hashCode"] = egret.$hashCount++;
            //     return data;
            // }
            // egret.$toBitmapData(canvas);
            return canvas;
            // var canvas: HTMLCanvasElement = document.createElement("canvas");
            // if (!isNaN(width) && !isNaN(height)) {
            //     canvas.width = width;
            //     canvas.height = height;
            // }
            // return canvas;
            // change end
        }
        /**
         * @private
         * WebGL上下文对象，提供简单的绘图接口
         * 抽象出此类，以实现共用一个context
         */
        var WebGLRenderContext = (function () {
            function WebGLRenderContext(width, height) {
                this.glID = null;
                this.projectionX = NaN;
                this.projectionY = NaN;
                this.shaderManager = null;
                this.contextLost = false;
                this.$scissorState = false;
                this.vertSize = 5;
                this.blurFilter = null;
                this.surface = createCanvas(width, height);
                this.initWebGL();
                this.$bufferStack = [];
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                this.vertexBuffer = gl.createBuffer();
                this.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                this.drawCmdManager = new native2.WebGLDrawCmdManager();
                this.vao = new native2.WebGLVertexArrayObject();
                this.setGlobalCompositeOperation("source-over");
            }
            WebGLRenderContext.getInstance = function (width, height) {
                if (this.instance) {
                    return this.instance;
                }
                this.instance = new WebGLRenderContext(width, height);
                return this.instance;
            };
            /**
             * 推入一个RenderBuffer并绑定
             */
            WebGLRenderContext.prototype.pushBuffer = function (buffer) {
                this.$bufferStack.push(buffer);
                if (buffer != this.currentBuffer) {
                    if (this.currentBuffer) {
                    }
                    this.drawCmdManager.pushActivateBuffer(buffer);
                }
                this.currentBuffer = buffer;
            };
            /**
             * 推出一个RenderBuffer并绑定上一个RenderBuffer
             */
            WebGLRenderContext.prototype.popBuffer = function () {
                // 如果只剩下一个buffer，则不执行pop操作
                // 保证舞台buffer永远在最开始
                if (this.$bufferStack.length <= 1) {
                    return;
                }
                var buffer = this.$bufferStack.pop();
                var lastBuffer = this.$bufferStack[this.$bufferStack.length - 1];
                // 重新绑定
                if (buffer != lastBuffer) {
                    // this.$drawWebGL();
                    this.drawCmdManager.pushActivateBuffer(lastBuffer);
                }
                this.currentBuffer = lastBuffer;
            };
            /**
             * 启用RenderBuffer
             */
            WebGLRenderContext.prototype.activateBuffer = function (buffer) {
                buffer.rootRenderTarget.activate();
                if (!this.bindIndices) {
                    this.uploadIndicesArray(this.vao.getIndices());
                    this.bindIndices = true;
                }
                buffer.restoreStencil();
                buffer.restoreScissor();
                this.onResize(buffer.width, buffer.height);
            };
            /**
             * 上传顶点数据
             */
            WebGLRenderContext.prototype.uploadVerticesArray = function (array) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.bufferData(gl.ARRAY_BUFFER, array, gl.STREAM_DRAW);
                // gl.bufferSubData(gl.ARRAY_BUFFER, 0, array);
            };
            /**
             * 上传索引数据
             */
            WebGLRenderContext.prototype.uploadIndicesArray = function (array) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
            };
            /**
             * 销毁绘制对象
             */
            WebGLRenderContext.prototype.destroy = function () {
                this.surface.width = this.surface.height = 0;
            };
            WebGLRenderContext.prototype.onResize = function (width, height) {
                width = width || this.surface.width;
                height = height || this.surface.height;
                this.projectionX = width / 2;
                this.projectionY = -height / 2;
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                if (gl) {
                    gl.viewport(0, 0, width, height);
                }
            };
            /**
             * 改变渲染缓冲的大小并清空缓冲区
             * @param width 改变后的宽
             * @param height 改变后的高
             * @param useMaxSize 若传入true，则将改变后的尺寸与已有尺寸对比，保留较大的尺寸。
             */
            WebGLRenderContext.prototype.resize = function (width, height, useMaxSize) {
                var surface = this.surface;
                if (useMaxSize) {
                    if (surface.width < width) {
                        surface.width = width;
                    }
                    if (surface.height < height) {
                        surface.height = height;
                    }
                }
                else {
                    if (surface.width != width) {
                        surface.width = width;
                    }
                    if (surface.height != height) {
                        surface.height = height;
                    }
                }
                this.onResize();
            };
            WebGLRenderContext.prototype.initWebGL = function () {
                this.onResize();
                // this.surface.addEventListener("webglcontextlost", this.handleContextLost.bind(this), false);
                // this.surface.addEventListener("webglcontextrestored", this.handleContextRestored.bind(this), false);
                this.getWebGLContext();
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                this.shaderManager = new native2.WebGLShaderManager(gl);
            };
            WebGLRenderContext.prototype.handleContextLost = function () {
                this.contextLost = true;
            };
            WebGLRenderContext.prototype.handleContextRestored = function () {
                this.initWebGL();
                //this.shaderManager.setContext(this.context);
                this.contextLost = false;
            };
            WebGLRenderContext.prototype.getWebGLContext = function () {
                var options = {
                    antialias: WebGLRenderContext.antialias,
                    cmdbatch: WebGLRenderContext.$supportCmdBatch,
                    stencil: true,
                };
                var gl;
                //todo 是否使用chrome源码names
                //let contextNames = ["moz-webgl", "webkit-3d", "experimental-webgl", "webgl", "3d"];
                var names = ["webgl", "experimental-webgl"];
                for (var i = 0; i < names.length; i++) {
                    try {
                        gl = this.surface.getContext(names[i], options);
                    }
                    catch (e) {
                    }
                    if (gl) {
                        break;
                    }
                }
                if (!gl) {
                    egret.$error(1021);
                }
                if (options.cmdbatch == true) {
                    this.glCmdManager = new native2.WebGLCmdArrayManager(this.surface, gl);
                    this.glCmdManager.initCacheContext();
                }
                this.setContext(gl);
            };
            WebGLRenderContext.prototype.setContext = function (glcontext) {
                this.context = glcontext;
                glcontext.id = WebGLRenderContext.glContextId++;
                this.glID = glcontext.id;
                var gl = glcontext;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.disable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.enable(gl.BLEND);
                gl.colorMask(true, true, true, true);
                // 目前只使用0号材质单元，默认开启
                gl.activeTexture(gl.TEXTURE0);
            };
            /**
             * 开启模版检测
             */
            WebGLRenderContext.prototype.enableStencilTest = function () {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.enable(gl.STENCIL_TEST);
            };
            /**
             * 关闭模版检测
             */
            WebGLRenderContext.prototype.disableStencilTest = function () {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.disable(gl.STENCIL_TEST);
            };
            /**
             * 开启scissor检测
             */
            WebGLRenderContext.prototype.enableScissorTest = function (rect) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(rect.x, rect.y, rect.width, rect.height);
            };
            /**
             * 关闭scissor检测
             */
            WebGLRenderContext.prototype.disableScissorTest = function () {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.disable(gl.SCISSOR_TEST);
            };
            /**
             * 获取像素信息
             */
            WebGLRenderContext.prototype.getPixels = function (x, y, width, height, pixels) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                // TODO
                // gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            };
            /**
             * 创建一个WebGLTexture
             */
            WebGLRenderContext.prototype.createTexture = function (bitmapData) {
                var gl = this.context;
                var useCmdBatch = false;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                    useCmdBatch = true;
                }
                var texture = gl.createTexture();
                if (!texture) {
                    //先创建texture失败,然后lost事件才发出来..
                    this.contextLost = true;
                    return;
                }
                texture.glContext = gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
                if (useCmdBatch) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmapData);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmapData.source);
                }
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                return texture;
            };
            WebGLRenderContext.prototype.createTextureFromCompressedData = function (data, width, height, levels, internalFormat) {
                return null;
            };
            /**
             * 更新材质的bitmapData
             */
            WebGLRenderContext.prototype.updateTexture = function (texture, bitmapData) {
                //TODO when renderGraphic
                var gl = this.context;
                var useCmdBatch = false;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                    useCmdBatch = true;
                }
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmapData);
            };
            /**
             * 获取一个WebGLTexture
             * 如果有缓存的texture返回缓存的texture，如果没有则创建并缓存texture
             */
            WebGLRenderContext.prototype.getWebGLTexture = function (bitmapData) {
                if (!bitmapData.webGLTexture) {
                    if (bitmapData.format == "image") {
                        bitmapData.webGLTexture = this.createTexture(bitmapData);
                    }
                    else if (bitmapData.format == "pvr") {
                        bitmapData.webGLTexture = this.createTextureFromCompressedData(bitmapData.source.pvrtcData, bitmapData.width, bitmapData.height, bitmapData.source.mipmapsCount, bitmapData.source.format);
                    }
                    if (bitmapData.$deleteSource && bitmapData.webGLTexture) {
                        //native TODO
                        // if(bitmapData.source && bitmapData.source.dispose) {
                        //     bitmapData.source.dispose();
                        // }
                        bitmapData.source = null;
                    }
                }
                return bitmapData.webGLTexture;
            };
            /**
             * 清除矩形区域
             */
            WebGLRenderContext.prototype.clearRect = function (x, y, width, height) {
                if (x != 0 || y != 0 || width != this.surface.width || height != this.surface.height) {
                    var buffer = this.currentBuffer;
                    if (buffer.$hasScissor) {
                        this.setGlobalCompositeOperation("destination-out");
                        this.drawRect(x, y, width, height);
                        this.setGlobalCompositeOperation("source-over");
                    }
                    else {
                        var m = buffer.globalMatrix;
                        if (m.b == 0 && m.c == 0) {
                            x = x * m.a + m.tx;
                            y = y * m.d + m.ty;
                            width = width * m.a;
                            height = height * m.d;
                            this.enableScissor(x, -y - height + buffer.height, width, height);
                            this.clear();
                            this.disableScissor();
                        }
                        else {
                            this.setGlobalCompositeOperation("destination-out");
                            this.drawRect(x, y, width, height);
                            this.setGlobalCompositeOperation("source-over");
                        }
                    }
                }
                else {
                    this.clear();
                }
            };
            /**
             * 设置混色
             */
            WebGLRenderContext.prototype.setGlobalCompositeOperation = function (value) {
                this.drawCmdManager.pushSetBlend(value);
            };
            /**
             * 绘制图片，image参数可以是BitmapData或者renderTarget
             */
            WebGLRenderContext.prototype.drawImage = function (image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, imageSourceWidth, imageSourceHeight) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !image || !buffer) {
                    return;
                }
                var texture;
                if (image["texture"] || (image.source && image.source["texture"])) {
                    // 如果是render target
                    texture = image["texture"] || image.source["texture"];
                    buffer.saveTransform();
                    buffer.transform(1, 0, 0, -1, 0, destHeight + destY * 2); // 翻转
                }
                else if (!image.source && !image.webGLTexture) {
                    return;
                }
                else {
                    texture = this.getWebGLTexture(image);
                }
                if (!texture) {
                    return;
                }
                this.drawTexture(texture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, imageSourceWidth, imageSourceHeight);
                if (image.source && image.source["texture"]) {
                    buffer.restoreTransform();
                }
            };
            /**
             * 绘制Mesh
             */
            WebGLRenderContext.prototype.drawMesh = function (image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, imageSourceWidth, imageSourceHeight, meshUVs, meshVertices, meshIndices, bounds) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !image || !buffer) {
                    return;
                }
                var texture;
                if (image["texture"] || (image.source && image.source["texture"])) {
                    // 如果是render target
                    texture = image["texture"] || image.source["texture"];
                    buffer.saveTransform();
                    buffer.transform(1, 0, 0, -1, 0, destHeight + destY * 2); // 翻转
                }
                else if (!image.source && !image.webGLTexture) {
                    return;
                }
                else {
                    texture = this.getWebGLTexture(image);
                }
                if (!texture) {
                    return;
                }
                this.drawTexture(texture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, imageSourceWidth, imageSourceHeight, meshUVs, meshVertices, meshIndices, bounds);
            };
            /**
             * 绘制材质
             */
            WebGLRenderContext.prototype.drawTexture = function (texture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, textureWidth, textureHeight, meshUVs, meshVertices, meshIndices, bounds) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !texture || !buffer) {
                    return;
                }
                if (meshVertices && meshIndices) {
                    if (this.vao.reachMaxSize(meshVertices.length / 2, meshIndices.length)) {
                        this.$drawWebGL();
                    }
                }
                else {
                    if (this.vao.reachMaxSize()) {
                        this.$drawWebGL();
                    }
                }
                if (meshUVs) {
                    this.vao.changeToMeshIndices();
                }
                var transform = buffer.globalMatrix;
                var alpha = buffer.globalAlpha;
                var count = meshIndices ? meshIndices.length / 3 : 2;
                // 应用$filter，因为只可能是colorMatrixFilter，最后两个参数可不传
                this.drawCmdManager.pushDrawTexture(texture, count, this.$filter);
                this.vao.cacheArrays(transform, alpha, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, textureWidth, textureHeight, meshUVs, meshVertices, meshIndices);
            };
            // TODO
            WebGLRenderContext.prototype.drawTextForCmdBatch = function (text, size, x, y, textColor, stroke, strokeColor) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !buffer) {
                    return;
                }
                var transform = buffer.globalMatrix;
                var alpha = buffer.globalAlpha;
                this.drawCmdManager.pushDrawTextForCmdBatch(text, text.length, x, y, textColor, stroke, strokeColor, alpha, transform);
            };
            /**
             * 绘制矩形（仅用于遮罩擦除等）
             */
            WebGLRenderContext.prototype.drawRect = function (x, y, width, height) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !buffer) {
                    return;
                }
                if (this.vao.reachMaxSize()) {
                    this.$drawWebGL();
                }
                this.drawCmdManager.pushDrawRect();
                this.vao.cacheArrays(buffer.globalMatrix, buffer.globalAlpha, 0, 0, width, height, x, y, width, height, width, height);
            };
            /**
             * 绘制遮罩
             */
            WebGLRenderContext.prototype.pushMask = function (mask) {
                var buffer = this.currentBuffer;
                if (this.contextLost || !buffer) {
                    return;
                }
                buffer.$stencilList.push(mask);
                if (this.vao.reachMaxSize()) {
                    this.$drawWebGL();
                }
                var length = mask.length;
                if (length) {
                    this.drawCmdManager.pushPushMask(length);
                    for (var i = 0; i < length; i++) {
                        var item = mask[i];
                        this.vao.cacheArrays(buffer.globalMatrix, buffer.globalAlpha, 0, 0, item.width, item.height, item.minX, item.minY, item.width, item.height, item.width, item.height);
                    }
                }
                else {
                    this.drawCmdManager.pushPushMask();
                    this.vao.cacheArrays(buffer.globalMatrix, buffer.globalAlpha, 0, 0, mask.width, mask.height, mask.x, mask.y, mask.width, mask.height, mask.width, mask.height);
                }
            };
            /**
             * 恢复遮罩
             */
            WebGLRenderContext.prototype.popMask = function () {
                var buffer = this.currentBuffer;
                if (this.contextLost || !buffer) {
                    return;
                }
                var mask = buffer.$stencilList.pop();
                if (this.vao.reachMaxSize()) {
                    this.$drawWebGL();
                }
                var length = mask.length;
                if (length) {
                    this.drawCmdManager.pushPopMask(length);
                    for (var i = 0; i < length; i++) {
                        var item = mask[i];
                        this.vao.cacheArrays(buffer.globalMatrix, buffer.globalAlpha, 0, 0, item.width, item.height, item.minX, item.minY, item.width, item.height, item.width, item.height);
                    }
                }
                else {
                    this.drawCmdManager.pushPopMask();
                    this.vao.cacheArrays(buffer.globalMatrix, buffer.globalAlpha, 0, 0, mask.width, mask.height, mask.x, mask.y, mask.width, mask.height, mask.width, mask.height);
                }
            };
            /**
             * 清除颜色缓存
             */
            WebGLRenderContext.prototype.clear = function () {
                this.drawCmdManager.pushClearColor();
            };
            /**
             * 开启scissor test
             */
            WebGLRenderContext.prototype.enableScissor = function (x, y, width, height) {
                var buffer = this.currentBuffer;
                this.drawCmdManager.pushEnableScissor(x, y, width, height);
                buffer.$hasScissor = true;
            };
            /**
             * 关闭scissor test
             */
            WebGLRenderContext.prototype.disableScissor = function () {
                var buffer = this.currentBuffer;
                this.drawCmdManager.pushDisableScissor();
                buffer.$hasScissor = false;
            };
            WebGLRenderContext.prototype.$drawWebGL = function () {
                if (this.drawCmdManager.drawDataLen == 0 || this.contextLost) {
                    return;
                }
                this.uploadVerticesArray(this.vao.getVertices());
                // 有mesh，则使用indicesForMesh
                if (this.vao.isMesh()) {
                    this.uploadIndicesArray(this.vao.getMeshIndices());
                }
                var length = this.drawCmdManager.drawDataLen;
                var offset = 0;
                for (var i = 0; i < length; i++) {
                    var data = this.drawCmdManager.drawData[i];
                    offset = this.drawData(data, offset);
                    // 计算draw call
                    if (data.type == 7 /* ACT_BUFFER */) {
                        this.activatedBuffer = data.buffer;
                    }
                    if (data.type == 0 /* TEXTURE */ || data.type == 1 /* RECT */ || data.type == 2 /* PUSH_MASK */ || data.type == 3 /* POP_MASK */) {
                        if (this.activatedBuffer && this.activatedBuffer.$computeDrawCall) {
                            this.activatedBuffer.$drawCalls++;
                        }
                    }
                }
                // 切换回默认indices
                if (this.vao.isMesh()) {
                    this.uploadIndicesArray(this.vao.getIndices());
                }
                if (WebGLRenderContext.$supportCmdBatch) {
                    this.glCmdManager.flushCmd();
                }
                // 清空数据
                this.drawCmdManager.clear();
                this.vao.clear();
            };
            /**
             * 执行绘制命令
             */
            WebGLRenderContext.prototype.drawData = function (data, offset) {
                if (!data) {
                    return;
                }
                var shader;
                switch (data.type) {
                    case 0 /* TEXTURE */:
                        var filter = data.filter;
                        if (filter) {
                            if (filter.type == "colorTransform") {
                                shader = this.shaderManager.colorTransformShader;
                                shader.setMatrix(filter.$matrix);
                            }
                            else if (filter.type == "blur") {
                                shader = this.shaderManager.blurShader;
                                shader.setBlur(filter.$blurX, filter.$blurY);
                                shader.setTextureSize(data.textureWidth, data.textureHeight);
                            }
                            else if (filter.type == "glow") {
                                shader = this.shaderManager.glowShader;
                                shader.setDistance(filter.$distance || 0);
                                shader.setAngle(filter.$angle ? filter.$angle / 180 * Math.PI : 0);
                                shader.setColor(filter.$red / 255, filter.$green / 255, filter.$blue / 255);
                                shader.setAlpha(filter.$alpha);
                                shader.setBlurX(filter.$blurX);
                                shader.setBlurY(filter.$blurY);
                                shader.setStrength(filter.$strength);
                                shader.setInner(filter.$inner ? 1 : 0);
                                shader.setKnockout(filter.$knockout ? 0 : 1);
                                shader.setHideObject(filter.$hideObject ? 1 : 0);
                                shader.setTextureSize(data.textureWidth, data.textureHeight);
                            }
                        }
                        else {
                            shader = this.shaderManager.defaultShader;
                        }
                        shader.setProjection(this.projectionX, this.projectionY);
                        this.shaderManager.activateShader(shader, this.vertSize * 4);
                        shader.syncUniforms();
                        offset += this.drawTextureElements(data, offset);
                        break;
                    case 1 /* RECT */:
                        shader = this.shaderManager.primitiveShader;
                        shader.setProjection(this.projectionX, this.projectionY);
                        this.shaderManager.activateShader(shader, this.vertSize * 4);
                        shader.syncUniforms();
                        offset += this.drawRectElements(data, offset);
                        break;
                    case 2 /* PUSH_MASK */:
                        shader = this.shaderManager.primitiveShader;
                        shader.setProjection(this.projectionX, this.projectionY);
                        this.shaderManager.activateShader(shader, this.vertSize * 4);
                        shader.syncUniforms();
                        offset += this.drawPushMaskElements(data, offset);
                        break;
                    case 3 /* POP_MASK */:
                        shader = this.shaderManager.primitiveShader;
                        shader.setProjection(this.projectionX, this.projectionY);
                        this.shaderManager.activateShader(shader, this.vertSize * 4);
                        shader.syncUniforms();
                        offset += this.drawPopMaskElements(data, offset);
                        break;
                    case 4 /* BLEND */:
                        this.setBlendMode(data.value);
                        break;
                    case 5 /* RESIZE_TARGET */:
                        data.buffer.rootRenderTarget.resize(data.width, data.height);
                        this.onResize(data.width, data.height);
                        break;
                    case 6 /* CLEAR_COLOR */:
                        if (this.activatedBuffer) {
                            var target = this.activatedBuffer.rootRenderTarget;
                            if (target.width != 0 || target.height != 0) {
                                target.clear();
                            }
                        }
                        break;
                    case 7 /* ACT_BUFFER */:
                        this.activateBuffer(data.buffer);
                        break;
                    case 8 /* ENABLE_SCISSOR */:
                        var buffer = this.activatedBuffer;
                        if (buffer) {
                            buffer.enableScissor(data.x, data.y, data.width, data.height);
                        }
                        break;
                    case 9 /* DISABLE_SCISSOR */:
                        buffer = this.activatedBuffer;
                        if (buffer) {
                            buffer.disableScissor();
                        }
                        break;
                    default:
                        break;
                }
                return offset;
            };
            /**
             * 画texture
             **/
            WebGLRenderContext.prototype.drawTextureElements = function (data, offset) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                gl.bindTexture(gl.TEXTURE_2D, data.texture);
                var size = data.count * 3;
                gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, offset * 2);
                return size;
            };
            /**
             * @private
             * 画rect
             **/
            WebGLRenderContext.prototype.drawRectElements = function (data, offset) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                // gl.bindTexture(gl.TEXTURE_2D, null);
                var size = data.count * 3;
                gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, offset * 2);
                return size;
            };
            /**
             * 画push mask
             **/
            WebGLRenderContext.prototype.drawPushMaskElements = function (data, offset) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                var size = data.count * 3;
                var buffer = this.activatedBuffer;
                if (buffer) {
                    if (buffer.stencilHandleCount == 0) {
                        buffer.enableStencil();
                        gl.clear(gl.STENCIL_BUFFER_BIT); // clear
                    }
                    var level = buffer.stencilHandleCount;
                    buffer.stencilHandleCount++;
                    gl.colorMask(false, false, false, false);
                    gl.stencilFunc(gl.EQUAL, level, 0xFF);
                    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
                    // gl.bindTexture(gl.TEXTURE_2D, null);
                    gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, offset * 2);
                    gl.stencilFunc(gl.EQUAL, level + 1, 0xFF);
                    gl.colorMask(true, true, true, true);
                    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
                }
                return size;
            };
            /**
             * 画pop mask
             **/
            WebGLRenderContext.prototype.drawPopMaskElements = function (data, offset) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                var size = data.count * 3;
                var buffer = this.activatedBuffer;
                if (buffer) {
                    buffer.stencilHandleCount--;
                    if (buffer.stencilHandleCount == 0) {
                        buffer.disableStencil(); // skip this draw
                    }
                    else {
                        var level = buffer.stencilHandleCount;
                        gl.colorMask(false, false, false, false);
                        gl.stencilFunc(gl.EQUAL, level + 1, 0xFF);
                        gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
                        // gl.bindTexture(gl.TEXTURE_2D, null);
                        gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, offset * 2);
                        gl.stencilFunc(gl.EQUAL, level, 0xFF);
                        gl.colorMask(true, true, true, true);
                        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
                    }
                }
                return size;
            };
            /**
             * 设置混色
             */
            WebGLRenderContext.prototype.setBlendMode = function (value) {
                var gl = this.context;
                if (WebGLRenderContext.$supportCmdBatch) {
                    gl = this.glCmdManager;
                }
                var blendModeWebGL = WebGLRenderContext.blendModesForGL[value];
                if (blendModeWebGL) {
                    gl.blendFunc(blendModeWebGL[0], blendModeWebGL[1]);
                }
            };
            /**
             * 应用滤镜绘制给定的render target
             * 此方法不会导致input被释放，所以如果需要释放input，需要调用此方法后手动调用release
             */
            WebGLRenderContext.prototype.drawTargetWidthFilters = function (filters, input) {
                var originInput = input, filtersLen = filters.length, output;
                // 应用前面的滤镜
                if (filtersLen > 1) {
                    for (var i = 0; i < filtersLen - 1; i++) {
                        var filter_1 = filters[i];
                        var width = input.rootRenderTarget.width;
                        var height = input.rootRenderTarget.height;
                        output = native2.WebGLRenderBuffer.create(width, height);
                        output.setTransform(1, 0, 0, 1, 0, 0);
                        output.globalAlpha = 1;
                        this.drawToRenderTarget(filter_1, input, output);
                        if (input != originInput) {
                            native2.WebGLRenderBuffer.release(input);
                        }
                        input = output;
                    }
                }
                // 应用最后一个滤镜并绘制到当前场景中
                var filter = filters[filtersLen - 1];
                this.drawToRenderTarget(filter, input, this.currentBuffer);
                // 释放掉用于交换的buffer
                if (input != originInput) {
                    native2.WebGLRenderBuffer.release(input);
                }
            };
            /**
             * 向一个renderTarget中绘制
             * */
            WebGLRenderContext.prototype.drawToRenderTarget = function (filter, input, output) {
                if (this.contextLost) {
                    return;
                }
                if (this.vao.reachMaxSize()) {
                    this.$drawWebGL();
                }
                this.pushBuffer(output);
                var originInput = input, temp, width = input.rootRenderTarget.width, height = input.rootRenderTarget.height;
                // 模糊滤镜实现为blurX与blurY的叠加
                if (filter.type == "blur") {
                    if (!this.blurFilter) {
                        this.blurFilter = new egret.BlurFilter(2, 2);
                    }
                    if (filter.blurX != 0 && filter.blurY != 0) {
                        this.blurFilter.blurX = filter.blurX;
                        this.blurFilter.blurY = 0;
                        temp = native2.WebGLRenderBuffer.create(width, height);
                        temp.setTransform(1, 0, 0, 1, 0, 0);
                        temp.globalAlpha = 1;
                        this.drawToRenderTarget(this.blurFilter, input, temp);
                        if (input != originInput) {
                            native2.WebGLRenderBuffer.release(input);
                        }
                        input = temp;
                        this.blurFilter.blurX = 0;
                        this.blurFilter.blurY = filter.blurY;
                    }
                    else {
                        this.blurFilter.blurX = filter.blurX;
                        this.blurFilter.blurY = filter.blurY;
                    }
                    filter = this.blurFilter;
                }
                // 绘制input结果到舞台
                output.saveTransform();
                output.transform(1, 0, 0, -1, 0, height);
                this.vao.cacheArrays(output.globalMatrix, output.globalAlpha, 0, 0, width, height, 0, 0, width, height, width, height);
                output.restoreTransform();
                var filterData;
                if (filter.type == "blur") {
                    // 实现blurx与blurY分开处理，会借用公用filter
                    // 为了允许公用filter的存在，这里拷贝filter到对象中
                    filterData = { type: "blur", $blurX: filter.$blurX, $blurY: filter.$blurY };
                }
                else {
                    filterData = filter;
                }
                this.drawCmdManager.pushDrawTexture(input["rootRenderTarget"].texture, 2, filterData, width, height);
                // 释放掉input
                if (input != originInput) {
                    native2.WebGLRenderBuffer.release(input);
                }
                this.popBuffer();
            };
            WebGLRenderContext.initBlendMode = function () {
                WebGLRenderContext.blendModesForGL = {};
                WebGLRenderContext.blendModesForGL["source-over"] = [1, 771];
                WebGLRenderContext.blendModesForGL["lighter"] = [1, 1];
                WebGLRenderContext.blendModesForGL["lighter-in"] = [770, 771];
                WebGLRenderContext.blendModesForGL["destination-out"] = [0, 771];
                WebGLRenderContext.blendModesForGL["destination-in"] = [0, 770];
            };
            return WebGLRenderContext;
        }());
        /**
         * 改变渲染缓冲为指定大小，但保留原始图像数据
         * @param width 改变后的宽
         * @param height 改变后的高
         * @param offsetX 原始图像数据在改变后缓冲区的绘制起始位置x
         * @param offsetY 原始图像数据在改变后缓冲区的绘制起始位置y
         */
        // public resizeTo(width:number, height:number, offsetX:number, offsetY:number):void {
        //     this.surface.width = width;
        //     this.surface.height = height;
        // }
        WebGLRenderContext.glContextId = 0;
        WebGLRenderContext.blendModesForGL = null;
        native2.WebGLRenderContext = WebGLRenderContext;
        __reflect(WebGLRenderContext.prototype, "egret.native2.WebGLRenderContext");
        WebGLRenderContext.initBlendMode();
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        var blendModes = ["source-over", "lighter", "destination-out"];
        var defaultCompositeOp = "source-over";
        var BLACK_COLOR = "#000000";
        var CAPS_STYLES = { none: 'butt', square: 'square', round: 'round' };
        var renderBufferPool = []; //渲染缓冲区对象池
        /**
         * @private
         * WebGL渲染器
         */
        var WebGLRenderer = (function () {
            function WebGLRenderer() {
                this.nestLevel = 0; //渲染的嵌套层次，0表示在调用堆栈的最外层。
            }
            /**
             * 渲染一个显示对象
             * @param displayObject 要渲染的显示对象
             * @param buffer 渲染缓冲
             * @param matrix 要对显示对象整体叠加的变换矩阵
             * @param dirtyList 脏矩形列表
             * @param forRenderTexture 绘制目标是RenderTexture的标志
             * @returns drawCall触发绘制的次数
             */
            WebGLRenderer.prototype.render = function (displayObject, buffer, matrix, dirtyList, forRenderTexture) {
                this.nestLevel++;
                var webglBuffer = buffer;
                var webglBufferContext = webglBuffer.context;
                var root = forRenderTexture ? displayObject : null;
                webglBufferContext.pushBuffer(webglBuffer);
                //绘制显示对象
                this.drawDisplayObject(displayObject, webglBuffer, dirtyList, matrix, null, null, root);
                webglBufferContext.$drawWebGL();
                var drawCall = webglBuffer.$drawCalls;
                webglBuffer.onRenderFinish();
                webglBufferContext.popBuffer();
                this.nestLevel--;
                if (this.nestLevel === 0) {
                    //最大缓存6个渲染缓冲
                    if (renderBufferPool.length > 6) {
                        renderBufferPool.length = 6;
                    }
                    var length_1 = renderBufferPool.length;
                    for (var i = 0; i < length_1; i++) {
                        renderBufferPool[i].resize(0, 0);
                    }
                }
                webglBuffer.onRenderFinish2();
                return drawCall;
            };
            /**
             * @private
             * 绘制一个显示对象
             */
            WebGLRenderer.prototype.drawDisplayObject = function (displayObject, buffer, dirtyList, matrix, displayList, clipRegion, root) {
                var drawCalls = 0;
                var node;
                var filterPushed = false;
                if (displayList && !root) {
                    if (displayList.isDirty) {
                        drawCalls += displayList.drawToSurface();
                    }
                    node = displayList.$renderNode;
                }
                else {
                    node = displayObject.$getRenderNode();
                }
                if (node) {
                    if (dirtyList) {
                        var renderRegion = node.renderRegion;
                        if (clipRegion && !clipRegion.intersects(renderRegion)) {
                            node.needRedraw = false;
                        }
                        else if (!node.needRedraw) {
                            var l = dirtyList.length;
                            for (var j = 0; j < l; j++) {
                                if (renderRegion.intersects(dirtyList[j])) {
                                    node.needRedraw = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        node.needRedraw = true;
                    }
                    if (node.needRedraw) {
                        drawCalls++;
                        var renderAlpha = void 0;
                        var m = void 0;
                        if (root) {
                            renderAlpha = displayObject.$getConcatenatedAlphaAt(root, displayObject.$getConcatenatedAlpha());
                            m = egret.Matrix.create().copyFrom(displayObject.$getConcatenatedMatrix());
                            displayObject.$getConcatenatedMatrixAt(root, m);
                            matrix.$preMultiplyInto(m, m);
                            buffer.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                            egret.Matrix.release(m);
                        }
                        else {
                            renderAlpha = node.renderAlpha;
                            m = node.renderMatrix;
                            buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);
                        }
                        buffer.globalAlpha = renderAlpha;
                        this.renderNode(node, buffer);
                        node.needRedraw = false;
                    }
                }
                if (displayList && !root) {
                    return drawCalls;
                }
                var children = displayObject.$children;
                if (children) {
                    var length_2 = children.length;
                    for (var i = 0; i < length_2; i++) {
                        var child = children[i];
                        if (!child.$visible || child.$alpha <= 0 || child.$maskedObject) {
                            continue;
                        }
                        var filters = child.$getFilters();
                        if (filters && filters.length > 0) {
                            drawCalls += this.drawWithFilter(child, buffer, dirtyList, matrix, clipRegion, root);
                        }
                        else if ((child.$blendMode !== 0 ||
                            (child.$mask && (child.$mask.$parentDisplayList || root)))) {
                            drawCalls += this.drawWithClip(child, buffer, dirtyList, matrix, clipRegion, root);
                        }
                        else if (child.$scrollRect || child.$maskRect) {
                            drawCalls += this.drawWithScrollRect(child, buffer, dirtyList, matrix, clipRegion, root);
                        }
                        else {
                            if (child["isFPS"]) {
                                buffer.context.$drawWebGL();
                                buffer.$computeDrawCall = false;
                                this.drawDisplayObject(child, buffer, dirtyList, matrix, child.$displayList, clipRegion, root);
                                buffer.context.$drawWebGL();
                                buffer.$computeDrawCall = true;
                            }
                            else {
                                drawCalls += this.drawDisplayObject(child, buffer, dirtyList, matrix, child.$displayList, clipRegion, root);
                            }
                        }
                    }
                }
                return drawCalls;
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.drawWithFilter = function (displayObject, buffer, dirtyList, matrix, clipRegion, root) {
                var drawCalls = 0;
                var filters = displayObject.$getFilters();
                var hasBlendMode = (displayObject.$blendMode !== 0);
                var compositeOp;
                if (hasBlendMode) {
                    compositeOp = blendModes[displayObject.$blendMode];
                    if (!compositeOp) {
                        compositeOp = defaultCompositeOp;
                    }
                }
                if (filters.length == 1 && filters[0].type == "colorTransform" && !displayObject.$children) {
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(compositeOp);
                    }
                    buffer.context.$filter = filters[0];
                    if ((displayObject.$mask && (displayObject.$mask.$parentDisplayList || root))) {
                        drawCalls += this.drawWithClip(displayObject, buffer, dirtyList, matrix, clipRegion, root);
                    }
                    else if (displayObject.$scrollRect || displayObject.$maskRect) {
                        drawCalls += this.drawWithScrollRect(displayObject, buffer, dirtyList, matrix, clipRegion, root);
                    }
                    else {
                        drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix, displayObject.$displayList, clipRegion, root);
                    }
                    buffer.context.$filter = null;
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    }
                    return drawCalls;
                }
                // 获取显示对象的链接矩阵
                var displayMatrix = egret.Matrix.create();
                displayMatrix.copyFrom(displayObject.$getConcatenatedMatrix());
                if (root) {
                    displayObject.$getConcatenatedMatrixAt(root, displayMatrix);
                }
                // 获取显示对象的矩形区域
                var region;
                region = egret.sys.Region.create();
                var bounds = displayObject.$getOriginalBounds();
                region.updateRegion(bounds, displayMatrix);
                // 为显示对象创建一个新的buffer
                // todo 这里应该计算 region.x region.y
                var displayBuffer = this.createRenderBuffer(region.width, region.height);
                displayBuffer.context.pushBuffer(displayBuffer);
                displayBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
                var offsetM = egret.Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);
                //todo 可以优化减少draw次数
                if ((displayObject.$mask && (displayObject.$mask.$parentDisplayList || root))) {
                    drawCalls += this.drawWithClip(displayObject, displayBuffer, dirtyList, offsetM, region, root);
                }
                else if (displayObject.$scrollRect || displayObject.$maskRect) {
                    drawCalls += this.drawWithScrollRect(displayObject, displayBuffer, dirtyList, offsetM, region, root);
                }
                else {
                    drawCalls += this.drawDisplayObject(displayObject, displayBuffer, dirtyList, offsetM, displayObject.$displayList, region, root);
                }
                egret.Matrix.release(offsetM);
                displayBuffer.context.popBuffer();
                //绘制结果到屏幕
                if (drawCalls > 0) {
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(compositeOp);
                    }
                    drawCalls++;
                    buffer.globalAlpha = 1;
                    buffer.setTransform(1, 0, 0, 1, region.minX + matrix.tx, region.minY + matrix.ty);
                    // 绘制结果的时候，应用滤镜
                    buffer.context.drawTargetWidthFilters(filters, displayBuffer);
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    }
                }
                renderBufferPool.push(displayBuffer);
                egret.sys.Region.release(region);
                egret.Matrix.release(displayMatrix);
                return drawCalls;
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.drawWithClip = function (displayObject, buffer, dirtyList, matrix, clipRegion, root) {
                var drawCalls = 0;
                var hasBlendMode = (displayObject.$blendMode !== 0);
                var compositeOp;
                if (hasBlendMode) {
                    compositeOp = blendModes[displayObject.$blendMode];
                    if (!compositeOp) {
                        compositeOp = defaultCompositeOp;
                    }
                }
                var scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
                var mask = displayObject.$mask;
                if (mask) {
                    var maskRenderNode = mask.$getRenderNode();
                    if (maskRenderNode) {
                        var maskRenderMatrix = maskRenderNode.renderMatrix;
                        //遮罩scaleX或scaleY为0，放弃绘制
                        if ((maskRenderMatrix.a == 0 && maskRenderMatrix.b == 0) || (maskRenderMatrix.c == 0 && maskRenderMatrix.d == 0)) {
                            return drawCalls;
                        }
                    }
                }
                //if (mask && !mask.$parentDisplayList) {
                //    mask = null; //如果遮罩不在显示列表中，放弃绘制遮罩。
                //}
                //计算scrollRect和mask的clip区域是否需要绘制，不需要就直接返回，跳过所有子项的遍历。
                var maskRegion;
                var displayMatrix = egret.Matrix.create();
                displayMatrix.copyFrom(displayObject.$getConcatenatedMatrix());
                if (displayObject.$parentDisplayList) {
                    var displayRoot = displayObject.$parentDisplayList.root;
                    if (displayRoot !== displayObject.$stage) {
                        displayObject.$getConcatenatedMatrixAt(displayRoot, displayMatrix);
                    }
                }
                var bounds;
                if (mask) {
                    bounds = mask.$getOriginalBounds();
                    maskRegion = egret.sys.Region.create();
                    var m = egret.Matrix.create();
                    m.copyFrom(mask.$getConcatenatedMatrix());
                    maskRegion.updateRegion(bounds, m);
                    egret.Matrix.release(m);
                }
                var region;
                if (scrollRect) {
                    region = egret.sys.Region.create();
                    region.updateRegion(scrollRect, displayMatrix);
                }
                if (region && maskRegion) {
                    region.intersect(maskRegion);
                    egret.sys.Region.release(maskRegion);
                }
                else if (!region && maskRegion) {
                    region = maskRegion;
                }
                if (region) {
                    if (region.isEmpty() || (clipRegion && !clipRegion.intersects(region))) {
                        egret.sys.Region.release(region);
                        egret.Matrix.release(displayMatrix);
                        return drawCalls;
                    }
                }
                else {
                    region = egret.sys.Region.create();
                    bounds = displayObject.$getOriginalBounds();
                    region.updateRegion(bounds, displayMatrix);
                }
                var found = false;
                if (!dirtyList) {
                    found = true;
                }
                else {
                    var l = dirtyList.length;
                    for (var j = 0; j < l; j++) {
                        if (region.intersects(dirtyList[j])) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    egret.sys.Region.release(region);
                    egret.Matrix.release(displayMatrix);
                    return drawCalls;
                }
                //没有遮罩,同时显示对象没有子项
                if (!mask && (!displayObject.$children || displayObject.$children.length == 0)) {
                    if (scrollRect) {
                        var m = displayMatrix;
                        buffer.setTransform(m.a, m.b, m.c, m.d, m.tx - region.minX, m.ty - region.minY);
                        buffer.context.pushMask(scrollRect);
                    }
                    //绘制显示对象
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(compositeOp);
                    }
                    drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix, displayObject.$displayList, clipRegion, root);
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    }
                    if (scrollRect) {
                        buffer.context.popMask();
                    }
                    egret.sys.Region.release(region);
                    egret.Matrix.release(displayMatrix);
                    return drawCalls;
                }
                else {
                    //绘制显示对象自身，若有scrollRect，应用clip
                    var displayBuffer = this.createRenderBuffer(region.width, region.height);
                    // let displayContext = displayBuffer.context;
                    displayBuffer.context.pushBuffer(displayBuffer);
                    displayBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
                    var offsetM = egret.Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);
                    drawCalls += this.drawDisplayObject(displayObject, displayBuffer, dirtyList, offsetM, displayObject.$displayList, region, root);
                    //绘制遮罩
                    if (mask) {
                        //如果只有一次绘制或是已经被cache直接绘制到displayContext
                        //webgl暂时无法添加,因为会有边界像素没有被擦除
                        //let maskRenderNode = mask.$getRenderNode();
                        //if (maskRenderNode && maskRenderNode.$getRenderCount() == 1 || mask.$displayList) {
                        //    displayBuffer.context.setGlobalCompositeOperation("destination-in");
                        //    drawCalls += this.drawDisplayObject(mask, displayBuffer, dirtyList, offsetM,
                        //        mask.$displayList, region, root);
                        //}
                        //else {
                        var maskBuffer = this.createRenderBuffer(region.width, region.height);
                        maskBuffer.context.pushBuffer(maskBuffer);
                        maskBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
                        offsetM = egret.Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);
                        drawCalls += this.drawDisplayObject(mask, maskBuffer, dirtyList, offsetM, mask.$displayList, region, root);
                        maskBuffer.context.popBuffer();
                        displayBuffer.context.setGlobalCompositeOperation("destination-in");
                        displayBuffer.setTransform(1, 0, 0, -1, 0, maskBuffer.height);
                        displayBuffer.globalAlpha = 1;
                        var maskBufferWidth = maskBuffer.rootRenderTarget.width;
                        var maskBufferHeight = maskBuffer.rootRenderTarget.height;
                        displayBuffer.context.drawTexture(maskBuffer.rootRenderTarget.texture, 0, 0, maskBufferWidth, maskBufferHeight, 0, 0, maskBufferWidth, maskBufferHeight, maskBufferWidth, maskBufferHeight);
                        displayBuffer.context.setGlobalCompositeOperation("source-over");
                        renderBufferPool.push(maskBuffer);
                    }
                    egret.Matrix.release(offsetM);
                    displayBuffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    displayBuffer.context.popBuffer();
                    //绘制结果到屏幕
                    if (drawCalls > 0) {
                        drawCalls++;
                        if (hasBlendMode) {
                            buffer.context.setGlobalCompositeOperation(compositeOp);
                        }
                        if (scrollRect) {
                            var m = displayMatrix;
                            displayBuffer.setTransform(m.a, m.b, m.c, m.d, m.tx - region.minX, m.ty - region.minY);
                            displayBuffer.context.pushMask(scrollRect);
                        }
                        buffer.globalAlpha = 1;
                        buffer.setTransform(1, 0, 0, -1, region.minX + matrix.tx, region.minY + matrix.ty + displayBuffer.height);
                        var displayBufferWidth = displayBuffer.rootRenderTarget.width;
                        var displayBufferHeight = displayBuffer.rootRenderTarget.height;
                        buffer.context.drawTexture(displayBuffer.rootRenderTarget.texture, 0, 0, displayBufferWidth, displayBufferHeight, 0, 0, displayBufferWidth, displayBufferHeight, displayBufferWidth, displayBufferHeight);
                        if (scrollRect) {
                            displayBuffer.context.popMask();
                        }
                        if (hasBlendMode) {
                            buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                        }
                    }
                    renderBufferPool.push(displayBuffer);
                    egret.sys.Region.release(region);
                    egret.Matrix.release(displayMatrix);
                    return drawCalls;
                }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.drawWithScrollRect = function (displayObject, buffer, dirtyList, matrix, clipRegion, root) {
                var drawCalls = 0;
                var scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
                if (scrollRect.isEmpty()) {
                    return drawCalls;
                }
                var m = egret.Matrix.create();
                m.copyFrom(displayObject.$getConcatenatedMatrix());
                if (root) {
                    displayObject.$getConcatenatedMatrixAt(root, m);
                }
                else if (displayObject.$parentDisplayList) {
                    var displayRoot = displayObject.$parentDisplayList.root;
                    if (displayRoot !== displayObject.$stage) {
                        displayObject.$getConcatenatedMatrixAt(displayRoot, m);
                    }
                }
                var region = egret.sys.Region.create();
                region.updateRegion(scrollRect, m);
                if (region.isEmpty() || (clipRegion && !clipRegion.intersects(region))) {
                    egret.sys.Region.release(region);
                    egret.Matrix.release(m);
                    return drawCalls;
                }
                var found = false;
                if (!dirtyList) {
                    found = true;
                }
                else {
                    var l = dirtyList.length;
                    for (var j = 0; j < l; j++) {
                        if (region.intersects(dirtyList[j])) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    egret.sys.Region.release(region);
                    egret.Matrix.release(m);
                    return drawCalls;
                }
                //绘制显示对象自身
                buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);
                var context = buffer.context;
                var scissor = false;
                if (buffer.$hasScissor || m.b != 0 || m.c != 0) {
                    context.pushMask(scrollRect);
                }
                else {
                    var a = m.a;
                    var d = m.d;
                    var tx = m.tx;
                    var ty = m.ty;
                    var x = scrollRect.x;
                    var y = scrollRect.y;
                    var xMax = x + scrollRect.width;
                    var yMax = y + scrollRect.height;
                    var minX = void 0, minY = void 0, maxX = void 0, maxY = void 0;
                    //优化，通常情况下不缩放的对象占多数，直接加上偏移量即可。
                    if (a == 1.0 && d == 1.0) {
                        minX = x + tx;
                        minY = y + ty;
                        maxX = xMax + tx;
                        maxY = yMax + ty;
                    }
                    else {
                        var x0 = a * x + tx;
                        var y0 = d * y + ty;
                        var x1 = a * xMax + tx;
                        var y1 = d * y + ty;
                        var x2 = a * xMax + tx;
                        var y2 = d * yMax + ty;
                        var x3 = a * x + tx;
                        var y3 = d * yMax + ty;
                        var tmp = 0;
                        if (x0 > x1) {
                            tmp = x0;
                            x0 = x1;
                            x1 = tmp;
                        }
                        if (x2 > x3) {
                            tmp = x2;
                            x2 = x3;
                            x3 = tmp;
                        }
                        minX = (x0 < x2 ? x0 : x2);
                        maxX = (x1 > x3 ? x1 : x3);
                        if (y0 > y1) {
                            tmp = y0;
                            y0 = y1;
                            y1 = tmp;
                        }
                        if (y2 > y3) {
                            tmp = y2;
                            y2 = y3;
                            y3 = tmp;
                        }
                        minY = (y0 < y2 ? y0 : y2);
                        maxY = (y1 > y3 ? y1 : y3);
                    }
                    context.enableScissor(minX + matrix.tx, -matrix.ty - maxY + buffer.height, maxX - minX, maxY - minY);
                    scissor = true;
                }
                drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix, displayObject.$displayList, region, root);
                buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);
                if (scissor) {
                    context.disableScissor();
                }
                else {
                    context.popMask();
                }
                egret.sys.Region.release(region);
                egret.Matrix.release(m);
                return drawCalls;
            };
            /**
             * 将一个RenderNode对象绘制到渲染缓冲
             * @param node 要绘制的节点
             * @param buffer 渲染缓冲
             * @param matrix 要叠加的矩阵
             * @param forHitTest 绘制结果是用于碰撞检测。若为true，当渲染GraphicsNode时，会忽略透明度样式设置，全都绘制为不透明的。
             */
            WebGLRenderer.prototype.drawNodeToBuffer = function (node, buffer, matrix, forHitTest) {
                var webglBuffer = buffer;
                //pushRenderTARGET
                webglBuffer.context.pushBuffer(webglBuffer);
                webglBuffer.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
                this.renderNode(node, buffer, forHitTest);
                webglBuffer.context.$drawWebGL();
                webglBuffer.onRenderFinish();
                //popRenderTARGET
                webglBuffer.context.popBuffer();
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.renderNode = function (node, buffer, forHitTest) {
                switch (node.type) {
                    case 1 /* BitmapNode */:
                        this.renderBitmap(node, buffer);
                        break;
                    case 2 /* TextNode */:
                        this.renderText(node, buffer);
                        break;
                    case 3 /* GraphicsNode */:
                        this.renderGraphics(node, buffer, forHitTest);
                        break;
                    case 4 /* GroupNode */:
                        this.renderGroup(node, buffer);
                        break;
                    case 6 /* SetAlphaNode */:
                        buffer.globalAlpha = node.drawData[0];
                        break;
                    case 7 /* MeshNode */:
                        this.renderMesh(node, buffer);
                        break;
                }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.renderBitmap = function (node, buffer) {
                var image = node.image;
                if (!image) {
                    return;
                }
                //buffer.imageSmoothingEnabled = node.smoothing;
                var data = node.drawData;
                var length = data.length;
                var pos = 0;
                var m = node.matrix;
                var blendMode = node.blendMode;
                var alpha = node.alpha;
                if (m) {
                    buffer.saveTransform();
                    buffer.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                }
                //这里不考虑嵌套
                if (blendMode) {
                    buffer.context.setGlobalCompositeOperation(blendModes[blendMode]);
                }
                var originAlpha;
                if (alpha == alpha) {
                    originAlpha = buffer.globalAlpha;
                    buffer.globalAlpha *= alpha;
                }
                if (node.filter) {
                    buffer.context.$filter = node.filter;
                    while (pos < length) {
                        buffer.context.drawImage(image, data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight);
                    }
                    buffer.context.$filter = null;
                }
                else {
                    while (pos < length) {
                        buffer.context.drawImage(image, data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight);
                    }
                }
                if (blendMode) {
                    buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                }
                if (alpha == alpha) {
                    buffer.globalAlpha = originAlpha;
                }
                if (m) {
                    buffer.restoreTransform();
                }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.renderMesh = function (node, buffer) {
                var image = node.image;
                //buffer.imageSmoothingEnabled = node.smoothing;
                var data = node.drawData;
                var length = data.length;
                var pos = 0;
                var m = node.matrix;
                if (m) {
                    buffer.saveTransform();
                    buffer.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                }
                while (pos < length) {
                    buffer.context.drawMesh(image, data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight, node.uvs, node.vertices, node.indices, node.bounds);
                }
                if (m) {
                    buffer.restoreTransform();
                }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.renderText = function (node, buffer) {
                var width = node.width - node.x;
                var height = node.height - node.y;
                if (node.x || node.y) {
                    buffer.transform(1, 0, 0, 1, node.x, node.y);
                }
                if (!node.$texture) {
                    var canvas = window["canvas"];
                    var context = canvas.getContext("webgl");
                    var gl = context;
                    var texture = gl.createTexture();
                    if (!texture) {
                        //先创建texture失败,然后lost事件才发出来..
                        console.log("------ !texture");
                        return;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    node.$texture = texture;
                }
                if (node.dirtyRender) {
                    egret_native.Label.bindTexture(node.$texture, width, height);
                    var drawData = node.drawData;
                    var length = drawData.length;
                    var pos = 0;
                    while (pos < length) {
                        var x = drawData[pos++];
                        var y = drawData[pos++];
                        var text = drawData[pos++];
                        var format = drawData[pos++];
                        var size = format.size == null ? node.size : format.size;
                        var textColor = format.textColor == null ? node.textColor : format.textColor;
                        var stroke = format.stroke == null ? node.stroke : format.stroke;
                        var strokeColor = format.strokeColor == null ? node.strokeColor : format.strokeColor;
                        egret_native.Label.drawText(x, y, text, size, textColor, stroke, strokeColor);
                    }
                    egret_native.Label.generateTexture();
                    node.$textureWidth = width;
                    node.$textureHeight = height;
                }
                //
                var textureWidth = node.$textureWidth;
                var textureHeight = node.$textureHeight;
                buffer.context.drawTexture(node.$texture, 0, 0, textureWidth, textureHeight, 0, 0, textureWidth, textureHeight, textureWidth, textureHeight);
                if (node.x || node.y) {
                    buffer.transform(1, 0, 0, 1, -node.x, -node.y);
                }
                node.dirtyRender = false;
                return;
                // // lj
                // var drawData = node.drawData;
                // var length = drawData.length;
                // var pos = 0;
                // while (pos < length) {
                //     var x = drawData[pos++];
                //     var y = drawData[pos++];
                //     var text = drawData[pos++];
                //     var format = drawData[pos++];
                //     // context.font = getFontString(node, format);
                //     var textColor = format.textColor == null ? node.textColor : format.textColor;
                //     var strokeColor = format.strokeColor == null ? node.strokeColor : format.strokeColor;
                //     var stroke = format.stroke == null ? node.stroke : format.stroke;
                //     var size = format.size == null ? node.size : format.size;
                //     // context.fillStyle = egret.toColorString(textColor);
                //     // context.strokeStyle = egret.toColorString(strokeColor);
                //     // if (stroke) {
                //         // context.lineWidth = stroke * 2;
                //         // context.strokeText(text, x, y);
                //     // }
                //     // context.fillText(text, x, y);
                //     var atlasAddr = egret_native.Label.createLabel("", size, "", stroke);
                //     var transformDirty = false;
                //     if (x != 0 || y != 0) {
                //         transformDirty = true;
                //         buffer.saveTransform();
                //         buffer.transform(1, 0, 0, 1, x, y);
                //     }
                //     buffer.context.drawText(text, size, 0, 0, textColor, stroke, strokeColor, atlasAddr);
                //     if (transformDirty) {
                //         buffer.restoreTransform();
                //     }
                // }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.renderGraphics = function (node, buffer, forHitTest) {
                // change xs
                // skip graphics render
                // TODO
                return;
                // change end
                var width = node.width;
                var height = node.height;
                if (width <= 0 || height <= 0 || !width || !height || node.drawData.length == 0) {
                    return;
                }
                if (!this.canvasRenderBuffer || !this.canvasRenderBuffer.context) {
                    this.canvasRenderer = new egret.CanvasRenderer();
                    this.canvasRenderBuffer = new native2.CanvasRenderBuffer(width, height);
                }
                else if (node.dirtyRender || forHitTest) {
                    this.canvasRenderBuffer.resize(width, height);
                }
                if (!this.canvasRenderBuffer.context) {
                    return;
                }
                if (node.x || node.y) {
                    if (node.dirtyRender || forHitTest) {
                        this.canvasRenderBuffer.context.translate(-node.x, -node.y);
                    }
                    buffer.transform(1, 0, 0, 1, node.x, node.y);
                }
                var surface = this.canvasRenderBuffer.surface;
                if (forHitTest) {
                    this.canvasRenderer.renderGraphics(node, this.canvasRenderBuffer.context, true);
                    native2.WebGLUtils.deleteWebGLTexture(surface);
                    var texture = buffer.context.getWebGLTexture(surface);
                    buffer.context.drawTexture(texture, 0, 0, width, height, 0, 0, width, height, surface.width, surface.height);
                }
                else {
                    if (node.dirtyRender) {
                        this.canvasRenderer.renderGraphics(node, this.canvasRenderBuffer.context);
                        // 拷贝canvas到texture
                        var texture = node.$texture;
                        if (!texture) {
                            texture = buffer.context.createTexture(surface);
                            node.$texture = texture;
                        }
                        else {
                            // 重新拷贝新的图像
                            buffer.context.updateTexture(texture, surface);
                        }
                        // 保存材质尺寸
                        node.$textureWidth = surface.width;
                        node.$textureHeight = surface.height;
                    }
                    var textureWidth = node.$textureWidth;
                    var textureHeight = node.$textureHeight;
                    buffer.context.drawTexture(node.$texture, 0, 0, textureWidth, textureHeight, 0, 0, textureWidth, textureHeight, textureWidth, textureHeight);
                }
                if (node.x || node.y) {
                    if (node.dirtyRender || forHitTest) {
                        this.canvasRenderBuffer.context.translate(node.x, node.y);
                    }
                    buffer.transform(1, 0, 0, 1, -node.x, -node.y);
                }
                if (!forHitTest) {
                    node.dirtyRender = false;
                }
            };
            WebGLRenderer.prototype.renderGroup = function (groupNode, buffer) {
                var m = groupNode.matrix;
                if (m) {
                    buffer.saveTransform();
                    buffer.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                }
                var children = groupNode.drawData;
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var node = children[i];
                    this.renderNode(node, buffer);
                }
                if (m) {
                    buffer.restoreTransform();
                }
            };
            /**
             * @private
             */
            WebGLRenderer.prototype.createRenderBuffer = function (width, height) {
                var buffer = renderBufferPool.pop();
                if (buffer) {
                    buffer.resize(width, height);
                }
                else {
                    buffer = new native2.WebGLRenderBuffer(width, height);
                    buffer.$computeDrawCall = false;
                }
                return buffer;
            };
            return WebGLRenderer;
        }());
        native2.WebGLRenderer = WebGLRenderer;
        __reflect(WebGLRenderer.prototype, "egret.native2.WebGLRenderer", ["egret.sys.SystemRenderer"]);
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * WebGLRenderTarget类
         * 一个WebGL渲染目标，拥有一个frame buffer和texture
         */
        var WebGLRenderTarget = (function (_super) {
            __extends(WebGLRenderTarget, _super);
            function WebGLRenderTarget(gl, width, height) {
                var _this = _super.call(this) || this;
                // 清除色
                _this.clearColor = [0, 0, 0, 0];
                // 是否启用frame buffer, 默认为true
                _this.useFrameBuffer = true;
                _this.gl = gl;
                // 如果尺寸为 0 chrome会报警
                _this.width = width || 1;
                _this.height = height || 1;
                // 创建材质
                _this.texture = _this.createTexture();
                // 创建frame buffer
                _this.frameBuffer = gl.createFramebuffer();
                //gl.bindFramebuffer(gl.FRAMEBUFFER, _this.frameBuffer);
                // 绑定材质
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, _this.texture, 0);
                // 绑定stencil buffer
                _this.stencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, _this.stencilBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, _this.width, _this.height);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, _this.stencilBuffer);
                return _this;
            }
            /**
             * 重置render target的尺寸
             */
            WebGLRenderTarget.prototype.resize = function (width, height) {
                var gl = this.gl;
                // 设置texture尺寸
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                if (native2.WebGLRenderContext.$supportCmdBatch) {
                    gl.texImage2Di(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
                // gl.bindTexture(gl.TEXTURE_2D, null);
                // 设置render buffer的尺寸
                //gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer); // 是否需要强制绑定？
                // 销毁并重新创建render buffer，防止 renderbufferStorage 引发内存泄漏
                gl.deleteRenderbuffer(this.stencilBuffer);
                this.stencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer); // 是否需要强制绑定？
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
                this.width = width;
                this.height = height;
                // 此处不解绑是否会造成bug？
                // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };
            /**
             * 激活此render target
             */
            WebGLRenderTarget.prototype.activate = function () {
                var gl = this.gl;
                //gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFrameBuffer());
            };
            /**
             * 获取frame buffer
             */
            WebGLRenderTarget.prototype.getFrameBuffer = function () {
                if (!this.useFrameBuffer) {
                    return null;
                }
                return this.frameBuffer;
            };
            /**
             * 创建材质
             * TODO 创建材质的方法可以合并
             */
            WebGLRenderTarget.prototype.createTexture = function () {
                var gl = this.gl;
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                if (native2.WebGLRenderContext.$supportCmdBatch) {
                    gl.texImage2Di(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                return texture;
            };
            /**
             * 清除render target颜色缓存
             */
            WebGLRenderTarget.prototype.clear = function (bind) {
                var gl = this.gl;
                if (bind) {
                    this.activate();
                }
                gl.colorMask(true, true, true, true);
                gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
                gl.clear(gl.COLOR_BUFFER_BIT);
            };
            return WebGLRenderTarget;
        }(egret.HashObject));
        native2.WebGLRenderTarget = WebGLRenderTarget;
        __reflect(WebGLRenderTarget.prototype, "egret.native2.WebGLRenderTarget");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         *
         * @private
         */
        var WebGLShaderManager = (function () {
            function WebGLShaderManager(gl) {
                this.gl = null;
                this.maxAttibs = 10;
                this.attribState = [];
                this.tempAttribState = [];
                this.currentShader = null;
                this.defaultShader = null;
                this.primitiveShader = null;
                this.colorTransformShader = null;
                this.blurShader = null;
                this.glowShader = null;
                this.fontShader = null;
                for (var i = 0; i < this.maxAttibs; i++) {
                    this.attribState[i] = false;
                }
                this.setContext(gl);
            }
            WebGLShaderManager.prototype.setContext = function (gl) {
                this.gl = gl;
                this.primitiveShader = new native2.PrimitiveShader(gl);
                this.defaultShader = new native2.TextureShader(gl);
                this.colorTransformShader = new native2.ColorTransformShader(gl);
                this.glowShader = new native2.GlowShader(gl);
                this.blurShader = new native2.BlurShader(gl);
                this.fontShader = new native2.FontShader(gl);
                this.primitiveShader.init();
                this.defaultShader.init();
                this.colorTransformShader.init();
                this.blurShader.init();
                this.glowShader.init();
                this.fontShader.init();
            };
            WebGLShaderManager.prototype.activateShader = function (shader, stride) {
                if (this.currentShader != shader) {
                    this.gl.useProgram(shader.program);
                    if (this.gl.flushCmd) {
                        this.setAttribForCmdBatch(shader.attributes);
                    }
                    else {
                        this.setAttribs(shader.attributes);
                    }
                    shader.setAttribPointer(stride);
                    this.currentShader = shader;
                }
            };
            WebGLShaderManager.prototype.setAttribForCmdBatch = function (attribs) {
                var i;
                var l;
                var gl = this.gl;
                l = attribs.length;
                for (i = 0; i < l; i++) {
                    gl.enableVertexAttribArray(attribs[i]);
                }
            };
            WebGLShaderManager.prototype.setAttribs = function (attribs) {
                var i;
                var l;
                l = this.tempAttribState.length;
                for (i = 0; i < l; i++) {
                    this.tempAttribState[i] = false;
                }
                l = attribs.length;
                for (i = 0; i < l; i++) {
                    var attribId = attribs[i];
                    this.tempAttribState[attribId] = true;
                }
                var gl = this.gl;
                l = this.attribState.length;
                for (i = 0; i < l; i++) {
                    if (this.attribState[i] !== this.tempAttribState[i]) {
                        this.attribState[i] = this.tempAttribState[i];
                        if (this.tempAttribState[i]) {
                            gl.enableVertexAttribArray(i);
                        }
                        else {
                            gl.disableVertexAttribArray(i);
                        }
                    }
                }
            };
            return WebGLShaderManager;
        }());
        native2.WebGLShaderManager = WebGLShaderManager;
        __reflect(WebGLShaderManager.prototype, "egret.native2.WebGLShaderManager");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var WebGLUtils = (function () {
            function WebGLUtils() {
            }
            WebGLUtils.compileProgram = function (gl, vertexSrc, fragmentSrc) {
                var fragmentShader = WebGLUtils.compileFragmentShader(gl, fragmentSrc);
                var vertexShader = WebGLUtils.compileVertexShader(gl, vertexSrc);
                var shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);
                if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                    egret.$warn(1020);
                }
                return shaderProgram;
            };
            WebGLUtils.compileFragmentShader = function (gl, shaderSrc) {
                return WebGLUtils._compileShader(gl, shaderSrc, gl.FRAGMENT_SHADER);
            };
            WebGLUtils.compileVertexShader = function (gl, shaderSrc) {
                return WebGLUtils._compileShader(gl, shaderSrc, gl.VERTEX_SHADER);
            };
            WebGLUtils._compileShader = function (gl, shaderSrc, shaderType) {
                var shader = gl.createShader(shaderType);
                gl.shaderSource(shader, shaderSrc);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    //egret.info(gl.getShaderInfoLog(shader));
                    return null;
                }
                return shader;
            };
            WebGLUtils.checkCanUseWebGL = function () {
                if (WebGLUtils.canUseWebGL == undefined) {
                    try {
                        var canvas = document.createElement("canvas");
                        WebGLUtils.canUseWebGL = !!window["WebGLRenderingContext"]
                            && !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
                    }
                    catch (e) {
                        WebGLUtils.canUseWebGL = false;
                    }
                }
                return WebGLUtils.canUseWebGL;
            };
            WebGLUtils.deleteWebGLTexture = function (bitmapData) {
                if (bitmapData) {
                    var gl = bitmapData.glContext;
                    if (gl) {
                        gl.deleteTexture(bitmapData);
                    }
                }
            };
            return WebGLUtils;
        }());
        native2.WebGLUtils = WebGLUtils;
        __reflect(WebGLUtils.prototype, "egret.native2.WebGLUtils");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         * 顶点数组管理对象
         * 用来维护顶点数组
         */
        var WebGLVertexArrayObject = (function () {
            function WebGLVertexArrayObject() {
                this.size = 2000;
                this.vertexMaxSize = this.size * 4;
                this.indicesMaxSize = this.size * 6;
                this.vertSize = 5;
                this.vertices = null;
                this.indices = null;
                this.indicesForMesh = null;
                this.vertexIndex = 0;
                this.indexIndex = 0;
                this.hasMesh = false;
                var numVerts = this.vertexMaxSize * this.vertSize;
                var numIndices = this.indicesMaxSize;
                this.vertices = new Float32Array(numVerts);
                this.indices = new Uint16Array(numIndices);
                this.indicesForMesh = new Uint16Array(numIndices);
                for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
                    this.indices[i + 0] = j + 0;
                    this.indices[i + 1] = j + 1;
                    this.indices[i + 2] = j + 2;
                    this.indices[i + 3] = j + 0;
                    this.indices[i + 4] = j + 2;
                    this.indices[i + 5] = j + 3;
                }
            }
            /**
             * 是否达到最大缓存数量
             */
            WebGLVertexArrayObject.prototype.reachMaxSize = function (vertexCount, indexCount) {
                if (vertexCount === void 0) { vertexCount = 4; }
                if (indexCount === void 0) { indexCount = 6; }
                return this.vertexIndex > this.vertexMaxSize - vertexCount || this.indexIndex > this.indicesMaxSize - indexCount;
            };
            /**
             * 获取缓存完成的顶点数组
             */
            WebGLVertexArrayObject.prototype.getVertices = function () {
                var view = this.vertices.subarray(0, this.vertexIndex * this.vertSize);
                return view;
            };
            /**
             * 获取缓存完成的索引数组
             */
            WebGLVertexArrayObject.prototype.getIndices = function () {
                return this.indices;
            };
            /**
             * 获取缓存完成的mesh索引数组
             */
            WebGLVertexArrayObject.prototype.getMeshIndices = function () {
                return this.indicesForMesh;
            };
            /**
             * 切换成mesh索引缓存方式
             */
            WebGLVertexArrayObject.prototype.changeToMeshIndices = function () {
                if (!this.hasMesh) {
                    // 拷贝默认index信息到for mesh中
                    for (var i = 0, l = this.indexIndex; i < l; ++i) {
                        this.indicesForMesh[i] = this.indices[i];
                    }
                    this.hasMesh = true;
                }
            };
            WebGLVertexArrayObject.prototype.isMesh = function () {
                return this.hasMesh;
            };
            /**
             * 默认构成矩形
             */
            // private defaultMeshVertices = [0, 0, 1, 0, 1, 1, 0, 1];
            // private defaultMeshUvs = [
            //     0, 0,
            //     1, 0,
            //     1, 1,
            //     0, 1
            // ];
            // private defaultMeshIndices = [0, 1, 2, 0, 2, 3];
            /**
             * 缓存一组顶点
             */
            WebGLVertexArrayObject.prototype.cacheArrays = function (transform, alpha, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, textureSourceWidth, textureSourceHeight, meshUVs, meshVertices, meshIndices) {
                //计算出绘制矩阵，之后把矩阵还原回之前的
                var locWorldTransform = transform;
                var originalA = locWorldTransform.a;
                var originalB = locWorldTransform.b;
                var originalC = locWorldTransform.c;
                var originalD = locWorldTransform.d;
                var originalTx = locWorldTransform.tx;
                var originalTy = locWorldTransform.ty;
                if (destX != 0 || destY != 0) {
                    locWorldTransform.append(1, 0, 0, 1, destX, destY);
                }
                if (sourceWidth / destWidth != 1 || sourceHeight / destHeight != 1) {
                    locWorldTransform.append(destWidth / sourceWidth, 0, 0, destHeight / sourceHeight, 0, 0);
                }
                var a = locWorldTransform.a;
                var b = locWorldTransform.b;
                var c = locWorldTransform.c;
                var d = locWorldTransform.d;
                var tx = locWorldTransform.tx;
                var ty = locWorldTransform.ty;
                locWorldTransform.a = originalA;
                locWorldTransform.b = originalB;
                locWorldTransform.c = originalC;
                locWorldTransform.d = originalD;
                locWorldTransform.tx = originalTx;
                locWorldTransform.ty = originalTy;
                if (meshVertices) {
                    // 计算索引位置与赋值
                    var vertices = this.vertices;
                    var index = this.vertexIndex * this.vertSize;
                    // 缓存顶点数组
                    var i = 0, iD = 0, l = 0;
                    var u = 0, v = 0, x = 0, y = 0;
                    for (i = 0, l = meshUVs.length; i < l; i += 2) {
                        iD = i * 5 / 2;
                        x = meshVertices[i];
                        y = meshVertices[i + 1];
                        u = meshUVs[i];
                        v = meshUVs[i + 1];
                        // xy
                        vertices[index + iD + 0] = a * x + c * y + tx;
                        vertices[index + iD + 1] = b * x + d * y + ty;
                        // uv
                        vertices[index + iD + 2] = (sourceX + u * sourceWidth) / textureSourceWidth;
                        vertices[index + iD + 3] = (sourceY + v * sourceHeight) / textureSourceHeight;
                        // alpha
                        vertices[index + iD + 4] = alpha;
                    }
                    // 缓存索引数组
                    if (this.hasMesh) {
                        for (var i_1 = 0, l_1 = meshIndices.length; i_1 < l_1; ++i_1) {
                            this.indicesForMesh[this.indexIndex + i_1] = meshIndices[i_1] + this.vertexIndex;
                        }
                    }
                    this.vertexIndex += meshUVs.length / 2;
                    this.indexIndex += meshIndices.length;
                }
                else {
                    var width = textureSourceWidth;
                    var height = textureSourceHeight;
                    var w = sourceWidth;
                    var h = sourceHeight;
                    sourceX = sourceX / width;
                    sourceY = sourceY / height;
                    sourceWidth = sourceWidth / width;
                    sourceHeight = sourceHeight / height;
                    var vertices = this.vertices;
                    var index = this.vertexIndex * this.vertSize;
                    // xy
                    vertices[index++] = tx;
                    vertices[index++] = ty;
                    // uv
                    vertices[index++] = sourceX;
                    vertices[index++] = sourceY;
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + tx;
                    vertices[index++] = b * w + ty;
                    // uv
                    vertices[index++] = sourceWidth + sourceX;
                    vertices[index++] = sourceY;
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + c * h + tx;
                    vertices[index++] = d * h + b * w + ty;
                    // uv
                    vertices[index++] = sourceWidth + sourceX;
                    vertices[index++] = sourceHeight + sourceY;
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = c * h + tx;
                    vertices[index++] = d * h + ty;
                    // uv
                    vertices[index++] = sourceX;
                    vertices[index++] = sourceHeight + sourceY;
                    // alpha
                    vertices[index++] = alpha;
                    // 缓存索引数组
                    if (this.hasMesh) {
                        var indicesForMesh = this.indicesForMesh;
                        indicesForMesh[this.indexIndex + 0] = 0 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 1] = 1 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 2] = 2 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 3] = 0 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 4] = 2 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 5] = 3 + this.vertexIndex;
                    }
                    this.vertexIndex += 4;
                    this.indexIndex += 6;
                }
            };
            // lj
            WebGLVertexArrayObject.prototype.cacheArraysForText = function (transform, alpha, arr, len, size) {
                //计算出绘制矩阵，之后把矩阵还原回之前的
                var locWorldTransform = transform;
                var originalA = locWorldTransform.a;
                var originalB = locWorldTransform.b;
                var originalC = locWorldTransform.c;
                var originalD = locWorldTransform.d;
                var originalTx = locWorldTransform.tx;
                var originalTy = locWorldTransform.ty;
                var a = locWorldTransform.a;
                var b = locWorldTransform.b;
                var c = locWorldTransform.c;
                var d = locWorldTransform.d;
                var tx = locWorldTransform.tx - 2;
                var ty = locWorldTransform.ty - 2;
                locWorldTransform.a = originalA;
                locWorldTransform.b = originalB;
                locWorldTransform.c = originalC;
                locWorldTransform.d = originalD;
                locWorldTransform.tx = originalTx;
                locWorldTransform.ty = originalTy;
                var w = 0;
                var h = 0;
                for (var i = 0; i < len; i++) {
                    var vertices = this.vertices;
                    var index = this.vertexIndex * this.vertSize;
                    var j = i * 16;
                    // xy
                    vertices[index++] = tx + arr[j++];
                    vertices[index++] = ty + arr[j++];
                    // uv
                    vertices[index++] = arr[j++];
                    vertices[index++] = arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + tx + arr[j++];
                    vertices[index++] = b * w + ty + arr[j++];
                    // uv
                    vertices[index++] = arr[j++];
                    vertices[index++] = arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = a * w + c * h + tx + arr[j++];
                    vertices[index++] = d * h + b * w + ty + arr[j++];
                    // uv
                    vertices[index++] = arr[j++];
                    vertices[index++] = arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // xy
                    vertices[index++] = c * h + tx + arr[j++];
                    vertices[index++] = d * h + ty + arr[j++];
                    // uv
                    vertices[index++] = arr[j++];
                    vertices[index++] = arr[j++];
                    // alpha
                    vertices[index++] = alpha;
                    // 缓存索引数组
                    if (this.hasMesh) {
                        var indicesForMesh = this.indicesForMesh;
                        indicesForMesh[this.indexIndex + 0] = 0 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 1] = 1 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 2] = 2 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 3] = 0 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 4] = 2 + this.vertexIndex;
                        indicesForMesh[this.indexIndex + 5] = 3 + this.vertexIndex;
                    }
                    this.vertexIndex += 4;
                    this.indexIndex += 6;
                }
            };
            //-lj
            WebGLVertexArrayObject.prototype.clear = function () {
                this.hasMesh = false;
                this.vertexIndex = 0;
                this.indexIndex = 0;
            };
            return WebGLVertexArrayObject;
        }());
        native2.WebGLVertexArrayObject = WebGLVertexArrayObject;
        __reflect(WebGLVertexArrayObject.prototype, "egret.native2.WebGLVertexArrayObject");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var BlurShader = (function (_super) {
            __extends(BlurShader, _super);
            function BlurShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = "precision mediump float;" +
                    "uniform vec2 blur;" +
                    "uniform sampler2D uSampler;" +
                    "varying vec2 vTextureCoord;" +
                    "uniform vec2 uTextureSize;" +
                    "void main()" +
                    "{" +
                    "const int sampleRadius = 5;" +
                    "const int samples = sampleRadius * 2 + 1;" +
                    "vec2 blurUv = blur / uTextureSize;" +
                    "vec4 color = vec4(0, 0, 0, 0);" +
                    "vec2 uv = vec2(0.0, 0.0);" +
                    "blurUv /= float(sampleRadius);" +
                    "for (int i = -sampleRadius; i <= sampleRadius; i++) {" +
                    "uv.x = vTextureCoord.x + float(i) * blurUv.x;" +
                    "uv.y = vTextureCoord.y + float(i) * blurUv.y;" +
                    "color += texture2D(uSampler, uv);" +
                    '}' +
                    "color /= float(samples);" +
                    "gl_FragColor = color;" +
                    "}";
                _this.uniforms = {
                    projectionVector: { type: '2f', value: { x: 0, y: 0 }, dirty: true },
                    blur: { type: '2f', value: { x: 2, y: 2 }, dirty: true },
                    uTextureSize: { type: '2f', value: { x: 100, y: 100 }, dirty: true }
                };
                return _this;
            }
            BlurShader.prototype.setBlur = function (blurX, blurY) {
                var uniform = this.uniforms.blur;
                if (uniform.value.x != blurX || uniform.value.y != blurY) {
                    uniform.value.x = blurX;
                    uniform.value.y = blurY;
                    uniform.dirty = true;
                }
            };
            /**
             * 设置采样材质的尺寸
             */
            BlurShader.prototype.setTextureSize = function (width, height) {
                var uniform = this.uniforms.uTextureSize;
                if (width != uniform.value.x || height != uniform.value.y) {
                    uniform.value.x = width;
                    uniform.value.y = height;
                    uniform.dirty = true;
                }
            };
            return BlurShader;
        }(native2.TextureShader));
        native2.BlurShader = BlurShader;
        __reflect(BlurShader.prototype, "egret.native2.BlurShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var ColorTransformShader = (function (_super) {
            __extends(ColorTransformShader, _super);
            function ColorTransformShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = "precision mediump float;\n" +
                    "varying vec2 vTextureCoord;\n" +
                    "varying vec4 vColor;\n" +
                    "uniform mat4 matrix;\n" +
                    "uniform vec4 colorAdd;\n" +
                    "uniform sampler2D uSampler;\n" +
                    "void main(void) {\n" +
                    "vec4 texColor = texture2D(uSampler, vTextureCoord);\n" +
                    "if(texColor.a > 0.) {" +
                    // 抵消预乘的alpha通道
                    "texColor = vec4(texColor.rgb / texColor.a, texColor.a);\n" +
                    "}" +
                    "vec4 locColor = clamp(texColor * matrix + colorAdd, 0., 1.);\n" +
                    "gl_FragColor = vColor * vec4(locColor.rgb * locColor.a, locColor.a);\n" +
                    "}";
                _this.uniforms = {
                    projectionVector: { type: '2f', value: { x: 0, y: 0 }, dirty: true },
                    matrix: { type: 'mat4', value: [1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            0, 0, 0, 1], dirty: true },
                    colorAdd: { type: '4f', value: { x: 0, y: 0, z: 0, w: 0 }, dirty: true }
                };
                return _this;
            }
            ColorTransformShader.prototype.setMatrix = function (matrix) {
                var uniform = this.uniforms.matrix;
                if (uniform.value[0] != matrix[0] ||
                    uniform.value[0] != matrix[0] ||
                    uniform.value[1] != matrix[1] ||
                    uniform.value[2] != matrix[2] ||
                    uniform.value[3] != matrix[3] ||
                    uniform.value[4] != matrix[5] ||
                    uniform.value[5] != matrix[6] ||
                    uniform.value[6] != matrix[7] ||
                    uniform.value[7] != matrix[8] ||
                    uniform.value[8] != matrix[10] ||
                    uniform.value[9] != matrix[11] ||
                    uniform.value[10] != matrix[12] ||
                    uniform.value[11] != matrix[13] ||
                    uniform.value[12] != matrix[15] ||
                    uniform.value[13] != matrix[16] ||
                    uniform.value[14] != matrix[17] ||
                    uniform.value[15] != matrix[18]) {
                    uniform.value[0] = matrix[0];
                    uniform.value[1] = matrix[1];
                    uniform.value[2] = matrix[2];
                    uniform.value[3] = matrix[3];
                    uniform.value[4] = matrix[5];
                    uniform.value[5] = matrix[6];
                    uniform.value[6] = matrix[7];
                    uniform.value[7] = matrix[8];
                    uniform.value[8] = matrix[10];
                    uniform.value[9] = matrix[11];
                    uniform.value[10] = matrix[12];
                    uniform.value[11] = matrix[13];
                    uniform.value[12] = matrix[15];
                    uniform.value[13] = matrix[16];
                    uniform.value[14] = matrix[17];
                    uniform.value[15] = matrix[18];
                    uniform.dirty = true;
                }
                var uniform2 = this.uniforms.colorAdd;
                if (uniform2.value.x != matrix[4] / 255.0 ||
                    uniform2.value.y != matrix[9] / 255.0 ||
                    uniform2.value.z != matrix[14] / 255.0 ||
                    uniform2.value.w != matrix[19] / 255.0) {
                    uniform2.value.x = matrix[4] / 255.0;
                    uniform2.value.y = matrix[9] / 255.0;
                    uniform2.value.z = matrix[14] / 255.0;
                    uniform2.value.w = matrix[19] / 255.0;
                    uniform2.dirty = true;
                }
            };
            return ColorTransformShader;
        }(native2.TextureShader));
        native2.ColorTransformShader = ColorTransformShader;
        __reflect(ColorTransformShader.prototype, "egret.native2.ColorTransformShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        var CmdCacheObject = (function (_super) {
            __extends(CmdCacheObject, _super);
            function CmdCacheObject() {
                var _this = _super.call(this) || this;
                // 0x01 WebGLObject
                // 0x02 WebGLBuffer
                // 0x03 WebGLFramebuffer
                // 0x04 WebGLProgram
                // 0x05 WebGLRenderbuffer
                // 0x06 WebGLShader
                // 0x07 WebGLTexture
                // 0x08 WebGLUniformLocation
                // 0x09 WebGLActiveInfo
                // 0x10 WebGLAttribLocation
                _this.$objType = 0x00;
                return _this;
            }
            return CmdCacheObject;
        }(egret.HashObject));
        native2.CmdCacheObject = CmdCacheObject;
        __reflect(CmdCacheObject.prototype, "egret.native2.CmdCacheObject");
        /**
         * @private
         * 缓存WebGL命令管理器
         */
        var WebGLCmdArrayManager = (function () {
            function WebGLCmdArrayManager(canvas, gl) {
                /*
                 * 存储绘制命令的 array buffer
                 **/
                this.maxArrayBufferLen = 80000 * 4;
                this.arrayBuffer = new ArrayBuffer(this.maxArrayBufferLen);
                this.dataView = new DataView(this.arrayBuffer);
                this.arrayBufferLen = 0;
                this.DEPTH_BUFFER_BIT = 0x00000100;
                this.STENCIL_BUFFER_BIT = 0x00000400;
                this.COLOR_BUFFER_BIT = 0x00004000;
                this.POINTS = 0x0000;
                this.LINES = 0x0001;
                this.LINE_LOOP = 0x0002;
                this.LINE_STRIP = 0x0003;
                this.TRIANGLES = 0x0004;
                this.TRIANGLE_STRIP = 0x0005;
                this.TRIANGLE_FAN = 0x0006;
                this.ZERO = 0;
                this.ONE = 1;
                this.SRC_COLOR = 0x0300;
                this.ONE_MINUS_SRC_COLOR = 0x0301;
                this.SRC_ALPHA = 0x0302;
                this.ONE_MINUS_SRC_ALPHA = 0x0303;
                this.DST_ALPHA = 0x0304;
                this.ONE_MINUS_DST_ALPHA = 0x0305;
                this.DST_COLOR = 0x0306;
                this.ONE_MINUS_DST_COLOR = 0x0307;
                this.SRC_ALPHA_SATURATE = 0x0308;
                this.FUNC_ADD = 0x8006;
                this.BLEND_EQUATION = 0x8009;
                this.BLEND_EQUATION_RGB = 0x8009;
                this.BLEND_EQUATION_ALPHA = 0x883D;
                this.FUNC_SUBTRACT = 0x800A;
                this.FUNC_REVERSE_SUBTRACT = 0x800B;
                this.BLEND_DST_RGB = 0x80C8;
                this.BLEND_SRC_RGB = 0x80C9;
                this.BLEND_DST_ALPHA = 0x80CA;
                this.BLEND_SRC_ALPHA = 0x80CB;
                this.CONSTANT_COLOR = 0x8001;
                this.ONE_MINUS_CONSTANT_COLOR = 0x8002;
                this.CONSTANT_ALPHA = 0x8003;
                this.ONE_MINUS_CONSTANT_ALPHA = 0x8004;
                this.BLEND_COLOR = 0x8005;
                this.ARRAY_BUFFER = 0x8892;
                this.ELEMENT_ARRAY_BUFFER = 0x8893;
                this.ARRAY_BUFFER_BINDING = 0x8894;
                this.ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
                this.STREAM_DRAW = 0x88E0;
                this.STATIC_DRAW = 0x88E4;
                this.DYNAMIC_DRAW = 0x88E8;
                this.BUFFER_SIZE = 0x8764;
                this.BUFFER_USAGE = 0x8765;
                this.CURRENT_VERTEX_ATTRIB = 0x8626;
                this.FRONT = 0x0404;
                this.BACK = 0x0405;
                this.FRONT_AND_BACK = 0x0408;
                this.TEXTURE_2D = 0x0DE1;
                this.CULL_FACE = 0x0B44;
                this.BLEND = 0x0BE2;
                this.DITHER = 0x0BD0;
                this.STENCIL_TEST = 0x0B90;
                this.DEPTH_TEST = 0x0B71;
                this.SCISSOR_TEST = 0x0C11;
                this.POLYGON_OFFSET_FILL = 0x8037;
                this.SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
                this.SAMPLE_COVERAGE = 0x80A0;
                this.NO_ERROR = 0;
                this.INVALID_ENUM = 0x0500;
                this.INVALID_VALUE = 0x0501;
                this.INVALID_OPERATION = 0x0502;
                this.OUT_OF_MEMORY = 0x0505;
                this.CW = 0x0900;
                this.CCW = 0x0901;
                this.LINE_WIDTH = 0x0B21;
                this.ALIASED_POINT_SIZE_RANGE = 0x846D;
                this.ALIASED_LINE_WIDTH_RANGE = 0x846E;
                this.CULL_FACE_MODE = 0x0B45;
                this.FRONT_FACE = 0x0B46;
                this.DEPTH_RANGE = 0x0B70;
                this.DEPTH_WRITEMASK = 0x0B72;
                this.DEPTH_CLEAR_VALUE = 0x0B73;
                this.DEPTH_FUNC = 0x0B74;
                this.STENCIL_CLEAR_VALUE = 0x0B91;
                this.STENCIL_FUNC = 0x0B92;
                this.STENCIL_FAIL = 0x0B94;
                this.STENCIL_PASS_DEPTH_FAIL = 0x0B95;
                this.STENCIL_PASS_DEPTH_PASS = 0x0B96;
                this.STENCIL_REF = 0x0B97;
                this.STENCIL_VALUE_MASK = 0x0B93;
                this.STENCIL_WRITEMASK = 0x0B98;
                this.STENCIL_BACK_FUNC = 0x8800;
                this.STENCIL_BACK_FAIL = 0x8801;
                this.STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
                this.STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
                this.STENCIL_BACK_REF = 0x8CA3;
                this.STENCIL_BACK_VALUE_MASK = 0x8CA4;
                this.STENCIL_BACK_WRITEMASK = 0x8CA5;
                this.VIEWPORT = 0x0BA2;
                this.SCISSOR_BOX = 0x0C10;
                this.COLOR_CLEAR_VALUE = 0x0C22;
                this.COLOR_WRITEMASK = 0x0C23;
                this.UNPACK_ALIGNMENT = 0x0CF5;
                this.PACK_ALIGNMENT = 0x0D05;
                this.MAX_TEXTURE_SIZE = 0x0D33;
                this.MAX_VIEWPORT_DIMS = 0x0D3A;
                this.SUBPIXEL_BITS = 0x0D50;
                this.RED_BITS = 0x0D52;
                this.GREEN_BITS = 0x0D53;
                this.BLUE_BITS = 0x0D54;
                this.ALPHA_BITS = 0x0D55;
                this.DEPTH_BITS = 0x0D56;
                this.STENCIL_BITS = 0x0D57;
                this.POLYGON_OFFSET_UNITS = 0x2A00;
                this.POLYGON_OFFSET_FACTOR = 0x8038;
                this.TEXTURE_BINDING_2D = 0x8069;
                this.SAMPLE_BUFFERS = 0x80A8;
                this.SAMPLES = 0x80A9;
                this.SAMPLE_COVERAGE_VALUE = 0x80AA;
                this.SAMPLE_COVERAGE_INVERT = 0x80AB;
                this.COMPRESSED_TEXTURE_FORMATS = 0x86A3;
                this.DONT_CARE = 0x1100;
                this.FASTEST = 0x1101;
                this.NICEST = 0x1102;
                this.GENERATE_MIPMAP_HINT = 0x8192;
                this.BYTE = 0x1400;
                this.UNSIGNED_BYTE = 0x1401;
                this.SHORT = 0x1402;
                this.UNSIGNED_SHORT = 0x1403;
                this.INT = 0x1404;
                this.UNSIGNED_INT = 0x1405;
                this.FLOAT = 0x1406;
                this.DEPTH_COMPONENT = 0x1902;
                this.ALPHA = 0x1906;
                this.RGB = 0x1907;
                this.RGBA = 0x1908;
                this.LUMINANCE = 0x1909;
                this.LUMINANCE_ALPHA = 0x190A;
                this.UNSIGNED_SHORT_4_4_4_4 = 0x8033;
                this.UNSIGNED_SHORT_5_5_5_1 = 0x8034;
                this.UNSIGNED_SHORT_5_6_5 = 0x8363;
                this.FRAGMENT_SHADER = 0x8B30;
                this.VERTEX_SHADER = 0x8B31;
                this.MAX_VERTEX_ATTRIBS = 0x8869;
                this.MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
                this.MAX_VARYING_VECTORS = 0x8DFC;
                this.MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
                this.MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
                this.MAX_TEXTURE_IMAGE_UNITS = 0x8872;
                this.MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
                this.SHADER_TYPE = 0x8B4F;
                this.DELETE_STATUS = 0x8B80;
                this.LINK_STATUS = 0x8B82;
                this.VALIDATE_STATUS = 0x8B83;
                this.ATTACHED_SHADERS = 0x8B85;
                this.ACTIVE_UNIFORMS = 0x8B86;
                this.ACTIVE_ATTRIBUTES = 0x8B89;
                this.SHADING_LANGUAGE_VERSION = 0x8B8C;
                this.CURRENT_PROGRAM = 0x8B8D;
                this.NEVER = 0x0200;
                this.LESS = 0x0201;
                this.EQUAL = 0x0202;
                this.LEQUAL = 0x0203;
                this.GREATER = 0x0204;
                this.NOTEQUAL = 0x0205;
                this.GEQUAL = 0x0206;
                this.ALWAYS = 0x0207;
                this.KEEP = 0x1E00;
                this.REPLACE = 0x1E01;
                this.INCR = 0x1E02;
                this.DECR = 0x1E03;
                this.INVERT = 0x150A;
                this.INCR_WRAP = 0x8507;
                this.DECR_WRAP = 0x8508;
                this.VENDOR = 0x1F00;
                this.RENDERER = 0x1F01;
                this.VERSION = 0x1F02;
                this.NEAREST = 0x2600;
                this.LINEAR = 0x2601;
                this.NEAREST_MIPMAP_NEAREST = 0x2700;
                this.LINEAR_MIPMAP_NEAREST = 0x2701;
                this.NEAREST_MIPMAP_LINEAR = 0x2702;
                this.LINEAR_MIPMAP_LINEAR = 0x2703;
                this.TEXTURE_MAG_FILTER = 0x2800;
                this.TEXTURE_MIN_FILTER = 0x2801;
                this.TEXTURE_WRAP_S = 0x2802;
                this.TEXTURE_WRAP_T = 0x2803;
                this.TEXTURE = 0x1702;
                this.TEXTURE_CUBE_MAP = 0x8513;
                this.TEXTURE_BINDING_CUBE_MAP = 0x8514;
                this.TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
                this.TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
                this.TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
                this.TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
                this.TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
                this.TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
                this.MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
                this.TEXTURE0 = 0x84C0;
                this.TEXTURE1 = 0x84C1;
                this.TEXTURE2 = 0x84C2;
                this.TEXTURE3 = 0x84C3;
                this.TEXTURE4 = 0x84C4;
                this.TEXTURE5 = 0x84C5;
                this.TEXTURE6 = 0x84C6;
                this.TEXTURE7 = 0x84C7;
                this.TEXTURE8 = 0x84C8;
                this.TEXTURE9 = 0x84C9;
                this.TEXTURE10 = 0x84CA;
                this.TEXTURE11 = 0x84CB;
                this.TEXTURE12 = 0x84CC;
                this.TEXTURE13 = 0x84CD;
                this.TEXTURE14 = 0x84CE;
                this.TEXTURE15 = 0x84CF;
                this.TEXTURE16 = 0x84D0;
                this.TEXTURE17 = 0x84D1;
                this.TEXTURE18 = 0x84D2;
                this.TEXTURE19 = 0x84D3;
                this.TEXTURE20 = 0x84D4;
                this.TEXTURE21 = 0x84D5;
                this.TEXTURE22 = 0x84D6;
                this.TEXTURE23 = 0x84D7;
                this.TEXTURE24 = 0x84D8;
                this.TEXTURE25 = 0x84D9;
                this.TEXTURE26 = 0x84DA;
                this.TEXTURE27 = 0x84DB;
                this.TEXTURE28 = 0x84DC;
                this.TEXTURE29 = 0x84DD;
                this.TEXTURE30 = 0x84DE;
                this.TEXTURE31 = 0x84DF;
                this.ACTIVE_TEXTURE = 0x84E0;
                this.REPEAT = 0x2901;
                this.CLAMP_TO_EDGE = 0x812F;
                this.MIRRORED_REPEAT = 0x8370;
                this.FLOAT_VEC2 = 0x8B50;
                this.FLOAT_VEC3 = 0x8B51;
                this.FLOAT_VEC4 = 0x8B52;
                this.INT_VEC2 = 0x8B53;
                this.INT_VEC3 = 0x8B54;
                this.INT_VEC4 = 0x8B55;
                this.BOOL = 0x8B56;
                this.BOOL_VEC2 = 0x8B57;
                this.BOOL_VEC3 = 0x8B58;
                this.BOOL_VEC4 = 0x8B59;
                this.FLOAT_MAT2 = 0x8B5A;
                this.FLOAT_MAT3 = 0x8B5B;
                this.FLOAT_MAT4 = 0x8B5C;
                this.SAMPLER_2D = 0x8B5E;
                this.SAMPLER_CUBE = 0x8B60;
                this.VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
                this.VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
                this.VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
                this.VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
                this.VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
                this.VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
                this.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;
                this.IMPLEMENTATION_COLOR_READ_TYPE = 0x8B9A;
                this.IMPLEMENTATION_COLOR_READ_FORMAT = 0x8B9B;
                this.COMPILE_STATUS = 0x8B81;
                this.LOW_FLOAT = 0x8DF0;
                this.MEDIUM_FLOAT = 0x8DF1;
                this.HIGH_FLOAT = 0x8DF2;
                this.LOW_INT = 0x8DF3;
                this.MEDIUM_INT = 0x8DF4;
                this.HIGH_INT = 0x8DF5;
                this.FRAMEBUFFER = 0x8D40;
                this.RENDERBUFFER = 0x8D41;
                this.RGBA4 = 0x8056;
                this.RGB5_A1 = 0x8057;
                this.RGB565 = 0x8D62;
                this.DEPTH_COMPONENT16 = 0x81A5;
                this.STENCIL_INDEX = 0x1901;
                this.STENCIL_INDEX8 = 0x8D48;
                this.DEPTH_STENCIL = 0x84F9;
                this.RENDERBUFFER_WIDTH = 0x8D42;
                this.RENDERBUFFER_HEIGHT = 0x8D43;
                this.RENDERBUFFER_INTERNAL_FORMAT = 0x8D44;
                this.RENDERBUFFER_RED_SIZE = 0x8D50;
                this.RENDERBUFFER_GREEN_SIZE = 0x8D51;
                this.RENDERBUFFER_BLUE_SIZE = 0x8D52;
                this.RENDERBUFFER_ALPHA_SIZE = 0x8D53;
                this.RENDERBUFFER_DEPTH_SIZE = 0x8D54;
                this.RENDERBUFFER_STENCIL_SIZE = 0x8D55;
                this.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8CD0;
                this.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8CD1;
                this.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8CD2;
                this.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8CD3;
                this.COLOR_ATTACHMENT0 = 0x8CE0;
                this.DEPTH_ATTACHMENT = 0x8D00;
                this.STENCIL_ATTACHMENT = 0x8D20;
                this.DEPTH_STENCIL_ATTACHMENT = 0x821A;
                this.NONE = 0;
                this.FRAMEBUFFER_COMPLETE = 0x8CD5;
                this.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
                this.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
                this.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
                this.FRAMEBUFFER_UNSUPPORTED = 0x8CDD;
                this.FRAMEBUFFER_BINDING = 0x8CA6;
                this.RENDERBUFFER_BINDING = 0x8CA7;
                this.MAX_RENDERBUFFER_SIZE = 0x84E8;
                this.INVALID_FRAMEBUFFER_OPERATION = 0x0506;
                this.UNPACK_FLIP_Y_WEBGL = 0x9240;
                this.UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
                this.CONTEXT_LOST_WEBGL = 0x9242;
                this.UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
                this.BROWSER_DEFAULT_WEBGL = 0x9244;
                /*
                 * 存储字符串的数组
                 */
                this.strArray = new Array();
                this.typedArrays = new Array();
                this._canvas = canvas;
                this._glContext = gl;
            }
            WebGLCmdArrayManager.prototype.initCacheContext = function () {
                var that = this;
                egret_native.Label["bindTexture"] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    that.bindLabelTexture.apply(that, args);
                };
            };
            /*
             * 上传绘制命令到C
             */
            WebGLCmdArrayManager.prototype.flushCmd = function () {
                var supportGLBatch = this._canvas.sendGLArray;
                if (supportGLBatch) {
                    this._canvas.sendGLArray(this.dataView.buffer, this.arrayBufferLen, this.strArray, this.typedArrays);
                }
                this.arrayBufferLen = 0;
                this.strArray.length = 0;
                this.typedArrays.length = 0;
            };
            /*
             * 压入一个字符串并返回索引
             */
            WebGLCmdArrayManager.prototype.pushString = function (str) {
                var array = this.strArray;
                var len = array.length;
                array[len] = str;
                return len;
            };
            /*
             * 压入ArrayBufferView或是ArrayBuffer并返回索引
             */
            WebGLCmdArrayManager.prototype.pushTypedArrays = function (item) {
                var array = this.typedArrays;
                var len = array.length;
                array[len] = item;
                return len;
            };
            // 0x29 clear(mask: number): void;
            WebGLCmdArrayManager.prototype.clear = function (mask) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x29, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, mask, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x48 enable(cap: number): void;
            WebGLCmdArrayManager.prototype.enable = function (cap) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x48, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, cap, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x44 disable(cap: number): void;
            WebGLCmdArrayManager.prototype.disable = function (cap) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x44, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, cap, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x45 disableVertexAttribArray(index: number): void;
            WebGLCmdArrayManager.prototype.disableVertexAttribArray = function (index) {
                if (typeof (index) == "number") {
                    this._glContext.disableVertexAttribArray(index);
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x45, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, index.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x77 scissor(x: number, y: number, width: number, height: number): void;
            WebGLCmdArrayManager.prototype.scissor = function (x, y, width, height) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x77, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, width, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, height, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x74 readPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView | null): void;
            WebGLCmdArrayManager.prototype.readPixels = function (x, y, width, height, format, type, pixels) {
                //TODO
            };
            // 0x75 renderbufferStorage(target: number, internalformat: number, width: number, height: number): void;
            WebGLCmdArrayManager.prototype.renderbufferStorage = function (target, internalformat, width, height) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x75, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, internalformat, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, width, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, height, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x4C framebufferRenderbuffer(target: number, attachment: number, renderbuffertarget: number, renderbuffer: WebGLRenderbuffer | null): void;
            WebGLCmdArrayManager.prototype.framebufferRenderbuffer = function (target, attachment, renderbuffertarget, renderbuffer) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x4C, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, attachment, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, renderbuffertarget, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, renderbuffer.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x4D framebufferTexture2D(target: number, attachment: number, textarget: number, texture: WebGLTexture | null, level: number): void;
            WebGLCmdArrayManager.prototype.framebufferTexture2D = function (target, attachment, textarget, texture, level) {
                if (this.arrayBufferLen + 24 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x4D, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, attachment, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, textarget, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, texture.hashCode, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, level, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x24 blendFunc(sfactor: number, dfactor: number): void;
            WebGLCmdArrayManager.prototype.blendFunc = function (sfactor, dfactor) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x24, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, sfactor, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, dfactor, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x79 stencilFunc(func: number, ref: number, mask: number): void;
            // public stencilFunc(func: number, ref: number, mask: number) {
            // 0x7A stencilFuncSeparate(face: number, func: number, ref: number, mask: number): void;
            // public stencilFuncSeparate(face: number, func: number, ref: number, mask: number) {
            // 0x7D stencilOp(fail: number, zfail: number, zpass: number): void;
            // public stencilOp(fail: number, zfail: number, zpass: number) {
            // 0x7E stencilOpSeparate(face: number, fail: number, zfail: number, zpass: number): void;
            // public stencilOpSeparate(face: number, fail: number, zfail: number, zpass: number) {
            // 0x4A finish(): void;
            WebGLCmdArrayManager.prototype.finish = function () {
                if (this.arrayBufferLen + 4 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x4A, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x4B flush(): void;
            WebGLCmdArrayManager.prototype.flush = function () {
                if (this.arrayBufferLen + 4 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x4B, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x2A clearColor(red: number, green: number, blue: number, alpha: number): void;
            WebGLCmdArrayManager.prototype.clearColor = function (red, green, blue, alpha) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x2A, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, red, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, green, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, blue, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, alpha, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x2D colorMask(red: boolean, green: boolean, blue: boolean, alpha: boolean): void;
            WebGLCmdArrayManager.prototype.colorMask = function (red, green, blue, alpha) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x2D, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (red ? 1 : 0), true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (green ? 1 : 0), true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (blue ? 1 : 0), true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (alpha ? 1 : 0), true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0xA3 viewport(x: number, y: number, width: number, height: number): void;
            WebGLCmdArrayManager.prototype.viewport = function (x, y, width, height) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0xA3, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, width, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, height, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x33 createBuffer(): WebGLBuffer | null;
            WebGLCmdArrayManager.prototype.createBuffer = function () {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x02;
                dataView.setUint32(arrayBufferLen, 0x33, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x34 createFramebuffer(): WebGLFramebuffer | null;
            WebGLCmdArrayManager.prototype.createFramebuffer = function () {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x03;
                dataView.setUint32(arrayBufferLen, 0x34, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x36 createRenderbuffer(): WebGLRenderbuffer | null;
            WebGLCmdArrayManager.prototype.createRenderbuffer = function () {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x05;
                dataView.setUint32(arrayBufferLen, 0x36, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x1D bindBuffer(target: number, buffer: WebGLBuffer | null): void;
            WebGLCmdArrayManager.prototype.bindBuffer = function (target, bufferObj) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x1D, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, bufferObj.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x1E bindFramebuffer(target: number, framebuffer: WebGLFramebuffer | null): void;
            WebGLCmdArrayManager.prototype.bindFramebuffer = function (target, framebuffer) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x1E, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                if (framebuffer == null) {
                    dataView.setUint32(arrayBufferLen, 0xFFFFFFFF, true);
                }
                else {
                    dataView.setUint32(arrayBufferLen, framebuffer.hashCode, true);
                }
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x1F bindRenderbuffer(target: number, renderbuffer: WebGLRenderbuffer | null): void;
            WebGLCmdArrayManager.prototype.bindRenderbuffer = function (target, renderbuffer) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x1F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                if (renderbuffer == null || renderbuffer.hashCode == 0) {
                    dataView.setUint32(arrayBufferLen, 0, true);
                }
                else {
                    dataView.setUint32(arrayBufferLen, renderbuffer.hashCode, true);
                }
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x35 createProgram(): WebGLProgram | null;
            WebGLCmdArrayManager.prototype.createProgram = function () {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x04;
                dataView.setUint32(arrayBufferLen, 0x35, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x98 useProgram(program: WebGLProgram | null): void;
            WebGLCmdArrayManager.prototype.useProgram = function (program) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x98, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            //0x37 createShader(type: number): WebGLShader | null;
            WebGLCmdArrayManager.prototype.createShader = function (type) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x06;
                dataView.setUint32(arrayBufferLen, 0x37, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x2E compileShader(shader: WebGLShader | null): void;
            WebGLCmdArrayManager.prototype.compileShader = function (shader) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x2E, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, shader.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x60 shaderSource(shader: WebGLShader | null, source: string): void;
            WebGLCmdArrayManager.prototype.shaderSource = function (shader, source) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var sourceid = this.pushString(source);
                dataView.setUint32(arrayBufferLen, 0x60, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, shader.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, sourceid, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x5E getShaderParameter(shader: WebGLShader | null, pname: number): any;
            WebGLCmdArrayManager.prototype.getShaderParameter = function (shader, pname) {
                // TODO
                return 1;
            };
            // 0x5B getProgramParameter(program: WebGLProgram | null, pname: number): any;
            WebGLCmdArrayManager.prototype.getProgramParameter = function (program, pname) {
                // TODO
                return 1;
            };
            // 0x5D getShaderInfoLog(shader: WebGLShader | null): string | null;
            WebGLCmdArrayManager.prototype.getShaderInfoLog = function () {
                // TODO
                return "TODO - getShaderInfoLog";
            };
            // 0x1B attachShader(program: WebGLProgram | null, shader: WebGLShader | null): void;
            WebGLCmdArrayManager.prototype.attachShader = function (program, shader) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x1B, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, shader.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x71 linkProgram(program: WebGLProgram | null): void;
            WebGLCmdArrayManager.prototype.linkProgram = function (program) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x71, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x72 pixelStorei(pname: number, param: number): void;
            WebGLCmdArrayManager.prototype.pixelStorei = function (pname, param) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x72, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, pname, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, param, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x38 createTexture(): WebGLTexture | null;
            WebGLCmdArrayManager.prototype.createTexture = function () {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x07;
                dataView.setUint32(arrayBufferLen, 0x38, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x3A deleteBuffer(buffer: WebGLBuffer | null): void;
            WebGLCmdArrayManager.prototype.deleteBuffer = function (buffer) {
                if (buffer == null || buffer.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3A, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, buffer.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x3B deleteFramebuffer(framebuffer: WebGLFramebuffer | null): void;
            WebGLCmdArrayManager.prototype.deleteFramebuffer = function (framebuffer) {
                if (framebuffer == null || framebuffer.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3B, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, framebuffer.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x3C deleteProgram(program: WebGLProgram | null): void;
            WebGLCmdArrayManager.prototype.deleteProgram = function (program) {
                if (program == null || program.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3C, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x3D deleteRenderbuffer(renderbuffer: WebGLRenderbuffer | null): void;
            WebGLCmdArrayManager.prototype.deleteRenderbuffer = function (renderbuffer) {
                if (renderbuffer == null || renderbuffer.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3D, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, renderbuffer.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x3E deleteShader(shader: WebGLShader | null): void;
            WebGLCmdArrayManager.prototype.deleteShader = function (texture) {
                if (texture == null || texture.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3E, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, texture.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x3F deleteTexture(texture: WebGLTexture | null): void;
            WebGLCmdArrayManager.prototype.deleteTexture = function (texture) {
                if (texture == null || texture.hashCode <= 0) {
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x3F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, texture.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x1A activeTexture(texture: number): void;
            WebGLCmdArrayManager.prototype.activeTexture = function (texture) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x1A, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, texture, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x20 bindTexture(target: number, texture: WebGLTexture | null): void;
            WebGLCmdArrayManager.prototype.bindTexture = function (target, texture) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x20, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                if (texture == null) {
                    // TODO check
                    dataView.setUint32(arrayBufferLen, 0xFFFFFFFF, true);
                }
                else {
                    dataView.setUint32(arrayBufferLen, texture.hashCode, true);
                }
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x64 getUniformLocation(program: WebGLProgram | null, name: string): WebGLUniformLocation | null;
            WebGLCmdArrayManager.prototype.getUniformLocation = function (program, name) {
                if (program == null) {
                    return;
                }
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x64, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                var nameid = this.pushString(name);
                dataView.setUint32(arrayBufferLen, nameid, true);
                arrayBufferLen += 4;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x08;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x53 getAttribLocation(program: WebGLProgram | null, name: string): number;
            WebGLCmdArrayManager.prototype.getAttribLocation = function (program, name) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x53, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, program.hashCode, true);
                arrayBufferLen += 4;
                var nameid = this.pushString(name);
                dataView.setUint32(arrayBufferLen, nameid, true);
                arrayBufferLen += 4;
                var webGLObject = new CmdCacheObject();
                webGLObject.$objType = 0x10;
                dataView.setUint32(arrayBufferLen, webGLObject.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
                return webGLObject;
            };
            // 0x50 getActiveAttrib(program: WebGLProgram | null, index: number): WebGLActiveInfo | null;
            WebGLCmdArrayManager.prototype.getActiveAttrib = function (program, index) {
                // TODO
            };
            // 0x65 getVertexAttrib(index: number, pname: number): any;
            // 0x66 getVertexAttribOffset(index: number, pname: number): number;
            WebGLCmdArrayManager.prototype.getVertexAttrib = function (index, pname) {
                // TOOD
            };
            // 0x49 enableVertexAttribArray(index: number): void;
            WebGLCmdArrayManager.prototype.enableVertexAttribArray = function (indx) {
                if (typeof (indx) == "number") {
                    this._glContext.enableVertexAttribArray(indx);
                    return;
                }
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x49, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, indx.hashCode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0xA1 vertexAttrib4fv(indx: number, values: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.vertexAttrib4fv = function (indx, values) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0xA1, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, indx.hashCode, true);
                arrayBufferLen += 4;
                var valId = this.pushTypedArrays(values);
                dataView.setUint32(arrayBufferLen, valId, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0xA2 vertexAttribPointer(indx: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void;
            WebGLCmdArrayManager.prototype.vertexAttribPointer = function (indx, size, type, normalized, stride, offset) {
                if (this.arrayBufferLen + 28 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0xA2, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, indx.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, size, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, normalized ? 1 : 0, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, stride, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, offset, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            WebGLCmdArrayManager.prototype.uniformxv = function (location, v, type) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                var arrayid = this.pushTypedArrays(v);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, arrayid, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x88 uniform1iv(location: WebGLUniformLocation, v: Int32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform1iv = function (location, v) {
                this.uniformxv(location, v, 0x88);
            };
            // 0x8C uniform2iv(location: WebGLUniformLocation, v: Int32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform2iv = function (location, v) {
                this.uniformxv(location, v, 0x8C);
            };
            // 0x90 uniform3iv(location: WebGLUniformLocation, v: Int32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform3iv = function (location, v) {
                this.uniformxv(location, v, 0x90);
            };
            // 0x94 uniform4iv(location: WebGLUniformLocation, v: Int32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform4iv = function (location, v) {
                this.uniformxv(location, v, 0x94);
            };
            // 0x86 uniform1fv(location: WebGLUniformLocation, v: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform1fv = function (location, v) {
                this.uniformxv(location, v, 0x86);
            };
            // 0x8A uniform2fv(location: WebGLUniformLocation, v: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform2fv = function (location, v) {
                this.uniformxv(location, v, 0x8A);
            };
            // 0x8E uniform3fv(location: WebGLUniformLocation, v: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform3fv = function (location, v) {
                this.uniformxv(location, v, 0x8E);
            };
            // 0x92 uniform4fv(location: WebGLUniformLocation, v: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniform4fv = function (location, v) {
                this.uniformxv(location, v, 0x92);
            };
            // 0x85 uniform1f(location: WebGLUniformLocation | null, x: number): void;
            WebGLCmdArrayManager.prototype.uniform1f = function (location, x) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x85, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x87 uniform1i(location: WebGLUniformLocation | null, x: number): void;
            WebGLCmdArrayManager.prototype.uniform1i = function (location, x) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x87, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x89 uniform2f(location: WebGLUniformLocation | null, x: number, y: number): void;
            WebGLCmdArrayManager.prototype.uniform2f = function (location, x, y) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x89, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x8B uniform2i(location: WebGLUniformLocation | null, x: number, y: number): void;
            WebGLCmdArrayManager.prototype.uniform2i = function (location, x, y) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x8B, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x8D uniform3f(location: WebGLUniformLocation | null, x: number, y: number, z: number): void;
            WebGLCmdArrayManager.prototype.uniform3f = function (location, x, y, z) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x8D, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, z, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x8F uniform3i(location: WebGLUniformLocation | null, x: number, y: number, z: number): void;
            WebGLCmdArrayManager.prototype.uniform3i = function (location, x, y, z) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x8F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, z, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x91 uniform4f(location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number): void;
            WebGLCmdArrayManager.prototype.uniform4f = function (location, x, y, z, w) {
                if (this.arrayBufferLen + 24 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x91, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, z, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, w, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x93 uniform4i(location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number): void;
            WebGLCmdArrayManager.prototype.uniform4i = function (location, x, y, z, w) {
                if (this.arrayBufferLen + 24 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x93, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, x, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, y, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, z, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, w, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x95 uniformMatrix2fv(location: WebGLUniformLocation, transpose: boolean, value: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniformMatrix2fv = function (location, transpose, value) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x95, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, transpose ? 1 : 0, true);
                arrayBufferLen += 4;
                var arrayid = 0;
                if (value instanceof Array) {
                    var arrayObj = new Float32Array(value);
                    arrayid = this.pushTypedArrays(arrayObj);
                }
                else {
                    arrayid = this.pushTypedArrays(value);
                }
                dataView.setUint32(arrayBufferLen, arrayid, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x96 uniformMatrix3fv(location: WebGLUniformLocation, transpose: boolean, value: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniformMatrix3fv = function (location, transpose, value) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x96, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, transpose ? 1 : 0, true);
                arrayBufferLen += 4;
                var arrayid = 0;
                if (value instanceof Array) {
                    var arrayObj = new Float32Array(value);
                    arrayid = this.pushTypedArrays(arrayObj);
                }
                else {
                    arrayid = this.pushTypedArrays(value);
                }
                dataView.setUint32(arrayBufferLen, arrayid, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x97 uniformMatrix4fv(location: WebGLUniformLocation, transpose: boolean, value: Float32Array | number[]): void;
            WebGLCmdArrayManager.prototype.uniformMatrix4fv = function (location, transpose, value) {
                if (value == null || value == undefined) {
                    console.log("js warning uniformMatrix4fv");
                    return;
                }
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x97, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, location.hashCode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, transpose ? 1 : 0, true);
                arrayBufferLen += 4;
                var arrayid = 0;
                if (value instanceof Array) {
                    var arrayObj = new Float32Array(value);
                    arrayid = this.pushTypedArrays(arrayObj);
                }
                else {
                    arrayid = this.pushTypedArrays(value);
                }
                dataView.setUint32(arrayBufferLen, arrayid, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x7F texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels?: ArrayBufferView): void;
            WebGLCmdArrayManager.prototype.texImage2Di = function (target, level, internalformat, width, height, border, format, type, pixels) {
                if (this.arrayBufferLen + 40 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x7F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, level, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, internalformat, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, width, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, height, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, border, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, format, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                if (pixels == null) {
                    dataView.setUint32(arrayBufferLen, 0xFFFFFFFF, true);
                }
                else {
                    var arrayid = this.pushTypedArrays(pixels);
                    dataView.setUint32(arrayBufferLen, arrayid, true);
                }
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x80 texImage2D(target: number, level: number, internalformat: number, format: number, type: number, pixels?: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;
            // TODO HTMLCanvasElement
            WebGLCmdArrayManager.prototype.texImage2D = function (target, level, internalformat, format, type, pixels /*BitmapData*/) {
                if (arguments.length == 9) {
                    this.texImage2Di(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8]);
                    return;
                }
                if (this.arrayBufferLen + 32 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x80, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, level, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, internalformat, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, format, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                if (pixels == null) {
                    dataView.setUint32(arrayBufferLen, 0, true);
                    arrayBufferLen += 4;
                    dataView.setUint32(arrayBufferLen, 0, true);
                    arrayBufferLen += 4;
                    this.arrayBufferLen = arrayBufferLen;
                    return;
                }
                var addr = (pixels.___native_p__ ? pixels.___native_p__ : pixels.source.___native_p__);
                if (addr) {
                    dataView.setUint32(arrayBufferLen, (addr / 4294967296) >>> 0, true);
                    arrayBufferLen += 4;
                    dataView.setUint32(arrayBufferLen, (addr & 4294967295) >>> 0, true);
                    arrayBufferLen += 4;
                }
                else {
                    console.log("js error pixels =" + pixels + ".format =" + pixels.format);
                }
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x2F compressedTexImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, data: ArrayBufferView): void;
            WebGLCmdArrayManager.prototype.compressedTexImage2D = function (target, level, internalformat, width, height, border, data) {
                if (this.arrayBufferLen + 32 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x2F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, level, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, internalformat, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, width, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, height, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, border, true);
                arrayBufferLen += 4;
                if (data == null) {
                    dataView.setUint32(arrayBufferLen, 0xFFFFFFFF, true);
                }
                else {
                    var arrayid = this.pushTypedArrays(data);
                    dataView.setUint32(arrayBufferLen, arrayid, true);
                }
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // TODO
            // 0x30 compressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, data: ArrayBufferView): void;
            // 0x39 cullFace(mode: number): void;
            WebGLCmdArrayManager.prototype.cullFace = function (mode) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x39, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, mode, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x40 depthFunc(func: number): void;
            WebGLCmdArrayManager.prototype.depthFunc = function (func) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x40, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, func, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x41 depthMask(flag: boolean): void;
            WebGLCmdArrayManager.prototype.depthMask = function (flag) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x41, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (flag ? 1 : 0), true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x42 depthRange(zNear: number, zFar: number): void;
            WebGLCmdArrayManager.prototype.depthRange = function (zNear, zFar) {
                if (this.arrayBufferLen + 12 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x42, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, zNear, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, zFar, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x81 texParameterf(target: number, pname: number, param: number): void;
            WebGLCmdArrayManager.prototype.texParameterf = function (target, pname, param) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x81, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, pname, true);
                arrayBufferLen += 4;
                dataView.setFloat32(arrayBufferLen, param, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x82 texParameteri(target: number, pname: number, param: number): void;
            WebGLCmdArrayManager.prototype.texParameteri = function (target, pname, param) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x82, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, pname, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, param, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            //0x4F generateMipmap(target: number): void;
            WebGLCmdArrayManager.prototype.generateMipmap = function (target) {
                if (this.arrayBufferLen + 8 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x4F, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x26 bufferData(target: number, arrayData number | ArrayBufferView | ArrayBuffer, usage: number): void;
            WebGLCmdArrayManager.prototype.bufferData = function (target, arrayData, usage) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x26, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                if (arrayData) {
                    var arrayid = this.pushTypedArrays(arrayData);
                    dataView.setUint32(arrayBufferLen, arrayid, true);
                    arrayBufferLen += 4;
                }
                //TODO arrayData: number
                // else{
                //     dataView.setFloat32(arrayBufferLen, target, true);
                //     arrayBufferLen += 4;
                // }
                dataView.setUint32(arrayBufferLen, usage, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x27 bufferSubData(target: number, offset: number, data: ArrayBufferView | ArrayBuffer): void;
            WebGLCmdArrayManager.prototype.bufferSubData = function (target, offset, arrayData) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x27, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, target, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, offset, true);
                arrayBufferLen += 4;
                if (arrayData.byteLength) {
                    var arrayid = this.pushTypedArrays(arrayData);
                    dataView.setUint32(arrayBufferLen, arrayid, true);
                    arrayBufferLen += 4;
                }
                //TODO arrayData: number
                // else
                // {
                //     dataView.setFloat32(arrayBufferLen, target, true);
                //     arrayBufferLen += 4;
                // }
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x46 drawArrays(mode: number, first: number, count: number): void;
            WebGLCmdArrayManager.prototype.drawArrays = function (mode, first, count) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x46, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, mode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, first, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, count, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x47 drawElements(mode: number, count: number, type: number, offset: number): void;
            WebGLCmdArrayManager.prototype.drawElements = function (mode, count, type, offset) {
                if (this.arrayBufferLen + 20 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0x47, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, mode, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, count, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, type, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, offset, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0xFF drawText(str: string, transform: Float32Array, textColor: number, stroke: boolean, strokeColor: number)
            WebGLCmdArrayManager.prototype.drawText = function (str, transform, textColor, stroke, strokeColor) {
                if (this.arrayBufferLen + 24 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0xFF, true);
                arrayBufferLen += 4;
                var strId = this.pushString(str);
                dataView.setUint32(arrayBufferLen, strId, true);
                arrayBufferLen += 4;
                var transformId = this.pushTypedArrays(transform);
                dataView.setUint32(arrayBufferLen, transformId, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, textColor, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, stroke ? 1 : 0, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, strokeColor, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0xFE bindLabelTexture(fontatlasId: number, textureId: number)
            WebGLCmdArrayManager.prototype.bindLabelTexture = function (fontatlasAddr, textureId) {
                if (this.arrayBufferLen + 16 > this.maxArrayBufferLen) {
                    this.flushCmd();
                }
                var dataView = this.dataView;
                var arrayBufferLen = this.arrayBufferLen;
                dataView.setUint32(arrayBufferLen, 0xFE, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (fontatlasAddr / 4294967296) >>> 0, true);
                arrayBufferLen += 4;
                dataView.setUint32(arrayBufferLen, (fontatlasAddr & 4294967295) >>> 0, true);
                arrayBufferLen += 4;
                dataView.setInt32(arrayBufferLen, textureId, true);
                arrayBufferLen += 4;
                this.arrayBufferLen = arrayBufferLen;
            };
            // 0x57 getExtension(name: string): any;
            WebGLCmdArrayManager.prototype.getExtension = function (name) {
                return this._glContext.getExtension(name);
            };
            return WebGLCmdArrayManager;
        }());
        WebGLCmdArrayManager.SIZE_OF_UINT16 = 2;
        WebGLCmdArrayManager.SIZE_OF_UINT32 = 4;
        WebGLCmdArrayManager.SIZE_OF_FLOAT32 = 4;
        native2.WebGLCmdArrayManager = WebGLCmdArrayManager;
        __reflect(WebGLCmdArrayManager.prototype, "egret.native2.WebGLCmdArrayManager");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var GlowShader = (function (_super) {
            __extends(GlowShader, _super);
            function GlowShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = [
                    'precision mediump float;',
                    'varying vec2 vTextureCoord;',
                    'uniform sampler2D uSampler;',
                    'uniform float dist;',
                    'uniform float angle;',
                    'uniform vec4 color;',
                    'uniform float alpha;',
                    'uniform float blurX;',
                    'uniform float blurY;',
                    // 'uniform vec4 quality;',
                    'uniform float strength;',
                    'uniform float inner;',
                    'uniform float knockout;',
                    'uniform float hideObject;',
                    "uniform vec2 uTextureSize;" +
                        'float random(vec3 scale, float seed)',
                    '{',
                    'return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);',
                    '}',
                    'void main(void) {',
                    'vec2 px = vec2(1.0 / uTextureSize.x, 1.0 / uTextureSize.y);',
                    // TODO 自动调节采样次数？
                    'const float linearSamplingTimes = 7.0;',
                    'const float circleSamplingTimes = 12.0;',
                    'vec4 ownColor = texture2D(uSampler, vTextureCoord);',
                    'vec4 curColor;',
                    'float totalAlpha = 0.0;',
                    'float maxTotalAlpha = 0.0;',
                    'float curDistanceX = 0.0;',
                    'float curDistanceY = 0.0;',
                    'float offsetX = dist * cos(angle) * px.x;',
                    'float offsetY = dist * sin(angle) * px.y;',
                    'const float PI = 3.14159265358979323846264;',
                    'float cosAngle;',
                    'float sinAngle;',
                    'float offset = PI * 2.0 / circleSamplingTimes * random(vec3(12.9898, 78.233, 151.7182), 0.0);',
                    'float stepX = blurX * px.x / linearSamplingTimes;',
                    'float stepY = blurY * px.y / linearSamplingTimes;',
                    'for (float a = 0.0; a <= PI * 2.0; a += PI * 2.0 / circleSamplingTimes) {',
                    'cosAngle = cos(a + offset);',
                    'sinAngle = sin(a + offset);',
                    'for (float i = 1.0; i <= linearSamplingTimes; i++) {',
                    'curDistanceX = i * stepX * cosAngle;',
                    'curDistanceY = i * stepY * sinAngle;',
                    'curColor = texture2D(uSampler, vec2(vTextureCoord.x + curDistanceX - offsetX, vTextureCoord.y + curDistanceY + offsetY));',
                    'totalAlpha += (linearSamplingTimes - i) * curColor.a;',
                    'maxTotalAlpha += (linearSamplingTimes - i);',
                    '}',
                    '}',
                    'ownColor.a = max(ownColor.a, 0.0001);',
                    'ownColor.rgb = ownColor.rgb / ownColor.a;',
                    'float outerGlowAlpha = (totalAlpha / maxTotalAlpha) * strength * alpha * (1. - inner) * max(min(hideObject, knockout), 1. - ownColor.a);',
                    'float innerGlowAlpha = ((maxTotalAlpha - totalAlpha) / maxTotalAlpha) * strength * alpha * inner * ownColor.a;',
                    'ownColor.a = max(ownColor.a * knockout * (1. - hideObject), 0.0001);',
                    'vec3 mix1 = mix(ownColor.rgb, color.rgb, innerGlowAlpha / (innerGlowAlpha + ownColor.a));',
                    'vec3 mix2 = mix(mix1, color.rgb, outerGlowAlpha / (innerGlowAlpha + ownColor.a + outerGlowAlpha));',
                    'float resultAlpha = min(ownColor.a + outerGlowAlpha + innerGlowAlpha, 1.);',
                    'gl_FragColor = vec4(mix2 * resultAlpha, resultAlpha);',
                    '}',
                ].join("\n");
                _this.uniforms = {
                    projectionVector: { type: '2f', value: { x: 0, y: 0 }, dirty: true },
                    dist: { type: '1f', value: 15, dirty: true },
                    angle: { type: '1f', value: 1, dirty: true },
                    color: { type: '4f', value: { x: 1, y: 0, z: 0, w: 0 }, dirty: true },
                    alpha: { type: '1f', value: 1, dirty: true },
                    blurX: { type: '1f', value: 1, dirty: true },
                    blurY: { type: '1f', value: 1, dirty: true },
                    strength: { type: '1f', value: 1, dirty: true },
                    inner: { type: '1f', value: 1, dirty: true },
                    knockout: { type: '1f', value: 1, dirty: true },
                    hideObject: { type: '1f', value: 0, dirty: true },
                    uTextureSize: { type: '2f', value: { x: 100, y: 100 }, dirty: true }
                };
                return _this;
            }
            GlowShader.prototype.setDistance = function (distance) {
                var uniform = this.uniforms.dist;
                if (uniform.value != distance) {
                    uniform.value = distance;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setAngle = function (angle) {
                var uniform = this.uniforms.angle;
                if (uniform.value != angle) {
                    uniform.value = angle;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setColor = function (red, green, blue) {
                var uniform = this.uniforms.color;
                if (uniform.value.x != red || uniform.value.y != green || uniform.value.z != blue) {
                    uniform.value.x = red;
                    uniform.value.y = green;
                    uniform.value.z = blue;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setAlpha = function (alpha) {
                var uniform = this.uniforms.alpha;
                if (uniform.value != alpha) {
                    uniform.value = alpha;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setBlurX = function (blurX) {
                var uniform = this.uniforms.blurX;
                if (uniform.value != blurX) {
                    uniform.value = blurX;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setBlurY = function (blurY) {
                var uniform = this.uniforms.blurY;
                if (uniform.value != blurY) {
                    uniform.value = blurY;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setStrength = function (strength) {
                var uniform = this.uniforms.strength;
                if (uniform.value != strength) {
                    uniform.value = strength;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setInner = function (inner) {
                var uniform = this.uniforms.inner;
                if (uniform.value != inner) {
                    uniform.value = inner;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setKnockout = function (knockout) {
                var uniform = this.uniforms.knockout;
                if (uniform.value != knockout) {
                    uniform.value = knockout;
                    uniform.dirty = true;
                }
            };
            GlowShader.prototype.setHideObject = function (hideObject) {
                var uniform = this.uniforms.hideObject;
                if (uniform.value != hideObject) {
                    uniform.value = hideObject;
                    uniform.dirty = true;
                }
            };
            /**
             * 设置采样材质的尺寸
             */
            GlowShader.prototype.setTextureSize = function (width, height) {
                var uniform = this.uniforms.uTextureSize;
                if (width != uniform.value.x || height != uniform.value.y) {
                    uniform.value.x = width;
                    uniform.value.y = height;
                    uniform.dirty = true;
                }
            };
            return GlowShader;
        }(native2.TextureShader));
        native2.GlowShader = GlowShader;
        __reflect(GlowShader.prototype, "egret.native2.GlowShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var PrimitiveShader = (function (_super) {
            __extends(PrimitiveShader, _super);
            function PrimitiveShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = "precision lowp float;\n" +
                    "varying vec2 vTextureCoord;\n" +
                    "varying vec4 vColor;\n" +
                    "void main(void) {\n" +
                    "gl_FragColor = vColor;\n" +
                    "}";
                return _this;
            }
            return PrimitiveShader;
        }(native2.EgretShader));
        native2.PrimitiveShader = PrimitiveShader;
        __reflect(PrimitiveShader.prototype, "egret.native2.PrimitiveShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var NativeHideHandler = (function (_super) {
            __extends(NativeHideHandler, _super);
            function NativeHideHandler(stage) {
                var _this = _super.call(this) || this;
                egret_native.pauseApp = function () {
                    //console.log("pauseApp");
                    stage.dispatchEvent(new egret.Event(egret.Event.DEACTIVATE));
                    // egret_native.Audio.pauseBackgroundMusic();
                    // egret_native.Audio.pauseAllEffects();
                };
                egret_native.resumeApp = function () {
                    //console.log("resumeApp");
                    stage.dispatchEvent(new egret.Event(egret.Event.ACTIVATE));
                    // egret_native.Audio.resumeBackgroundMusic();
                    // egret_native.Audio.resumeAllEffects();
                };
                return _this;
            }
            return NativeHideHandler;
        }(egret.HashObject));
        native2.NativeHideHandler = NativeHideHandler;
        __reflect(NativeHideHandler.prototype, "egret.native2.NativeHideHandler");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    var native2;
    (function (native2) {
        /**
         * @private
         */
        var FontShader = (function (_super) {
            __extends(FontShader, _super);
            function FontShader() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fragmentSrc = "precision lowp float;\n" +
                    "varying vec2 vTextureCoord;\n" +
                    "varying vec4 vColor;\n" +
                    "uniform sampler2D uSampler;\n" +
                    "uniform vec4 uTextColor;\n" +
                    "uniform vec4 uStrokeColor;\n" +
                    "void main(void) {\n" +
                    "   vec4 sample = texture2D(uSampler, vTextureCoord);\n" +
                    "   float fontAlpha = sample.a;\n" +
                    "   float outlineAlpha = sample.r;\n" +
                    "   if (fontAlpha + outlineAlpha > 0.0){\n" +
                    "       vec4 color = uTextColor * fontAlpha + uStrokeColor * outlineAlpha;\n" +
                    "       gl_FragColor = vColor * vec4(color.rgb, max(fontAlpha, outlineAlpha));\n" +
                    "   }\n" +
                    "   else {" +
                    "       discard;" +
                    "   }" +
                    "}\n";
                _this.uniforms = {
                    projectionVector: { type: '2f', value: { x: 0, y: 0 }, dirty: true },
                    uTextColor: { type: '4f', value: { x: 0, y: 0, z: 0, w: 0 }, dirty: true },
                    uStrokeColor: { type: '4f', value: { x: 0, y: 0, z: 0, w: 0 }, dirty: true },
                };
                return _this;
            }
            FontShader.prototype.setTextColor = function (r, g, b, a) {
                var uniform = this.uniforms.uTextColor;
                if (r != uniform.value.x || g != uniform.value.y || b != uniform.value.z || a != uniform.value.w) {
                    uniform.value.x = r;
                    uniform.value.y = g;
                    uniform.value.z = b;
                    uniform.value.w = a;
                    uniform.dirty = true;
                }
            };
            FontShader.prototype.setStrokeColor = function (r, g, b, a) {
                var uniform = this.uniforms.uStrokeColor;
                if (r != uniform.value.x || g != uniform.value.y || b != uniform.value.z || a != uniform.value.w) {
                    uniform.value.x = r;
                    uniform.value.y = g;
                    uniform.value.z = b;
                    uniform.value.w = a;
                    uniform.dirty = true;
                }
            };
            return FontShader;
        }(native2.EgretShader));
        native2.FontShader = FontShader;
        __reflect(FontShader.prototype, "egret.native2.FontShader");
    })(native2 = egret.native2 || (egret.native2 = {}));
})(egret || (egret = {}));
