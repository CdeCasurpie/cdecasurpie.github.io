/**
 * SmokeEffect Component
 * FIX: Soluciona el problema de mapeo de texturas en pantallas con Zoom/HighDPI.
 */
export class SmokeEffect {
    constructor() {
        this.containerId = 'canvas-container';
        this.THREE = null; 

        // Simulation Configuration
        this.config = {
            simWidth: 128,
            simHeight: 128,
            damping: 0.98,
            cursorRadius: 4,
            mobileBreakpoint: 1024
        };

        // Core Systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.uniforms = null;
        
        // Physics State (Double Buffer)
        this.dataTexture = null;
        this.buffer1 = null;
        this.buffer2 = null;

        // Runtime State
        this.animationId = null;
        this.lastMouse = { x: 0, y: 0 };
        this.isMounted = false;
        this.isLiteMode = false;
    }

    _shouldRunLiteMode() {
        return (window.innerWidth <= this.config.mobileBreakpoint) || ('ontouchstart' in window);
    }

    render() {
        return `<div id="${this.containerId}"></div>`;
    }

    async mount() {
        this.isLiteMode = this._shouldRunLiteMode();

        if (this.isLiteMode) {
            console.info('[SmokeEffect] Lite mode active: Physics engine disabled.');
            return; 
        }

        const container = document.getElementById(this.containerId);
        if (!container) return;

        try {
            this.THREE = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js');
            
            this.isMounted = true;
            this._initializeScene(container);
            this._initializeSimulation();
            this._createCompositeMesh(); // <--- Aquí aplicamos el fix inicial
            this._bindEventListeners();
            this._startAnimationLoop();

        } catch (error) {
            console.error('[SmokeEffect] Failed to load 3D engine:', error);
        }
    }

    _initializeScene(container) {
        this.scene = new this.THREE.Scene();
        this.camera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.renderer = new this.THREE.WebGLRenderer({ 
            alpha: false, 
            antialias: false,
            powerPreference: "high-performance",
            depth: false,
            stencil: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
        
        container.appendChild(this.renderer.domElement);
    }

    _initializeSimulation() {
        const aspect = window.innerWidth / window.innerHeight;
        this.config.simHeight = 128;
        this.config.simWidth = Math.floor(128 * aspect);

        const size = this.config.simWidth * this.config.simHeight;
        
        if (!this.buffer1 || this.buffer1.length !== size) {
            this.buffer1 = new Float32Array(size);
            this.buffer2 = new Float32Array(size);
        }

        if (this.dataTexture) this.dataTexture.dispose();

        this.dataTexture = new this.THREE.DataTexture(
            this.buffer1, 
            this.config.simWidth, 
            this.config.simHeight, 
            this.THREE.RedFormat, 
            this.THREE.FloatType
        );
        
        this.dataTexture.minFilter = this.THREE.LinearFilter;
        this.dataTexture.magFilter = this.THREE.LinearFilter;
        this.dataTexture.needsUpdate = true;
    }

    /**
     * FIX APLICADO: Calculamos la resolución física real (con DPR) para el shader.
     */
    _createCompositeMesh() {
        // Obtenemos el Pixel Ratio configurado en el renderer
        const dpr = this.renderer.getPixelRatio();

        this.uniforms = {
            u_time: { value: 0.0 },
            // MULTIPLICAMOS POR DPR AQUÍ
            u_resolution: { value: new this.THREE.Vector2(
                window.innerWidth * dpr, 
                window.innerHeight * dpr
            )},
            u_displacementMap: { value: this.dataTexture },
            u_color_base: { value: new this.THREE.Color(0.015, 0.01, 0.015) },
            u_color_fluid: { value: new this.THREE.Color(0.99, 0.73, 0.78) }
        };

        const material = new this.THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `void main() { gl_Position = vec4( position, 1.0 ); }`,
            fragmentShader: this._getFragmentShaderSource()
        });

        const geometry = new this.THREE.PlaneGeometry(2, 2);
        this.scene.add(new this.THREE.Mesh(geometry, material));
    }

    _updateFluidDynamics() {
        const width = this.config.simWidth;
        const height = this.config.simHeight;
        const b1 = this.buffer1;
        const b2 = this.buffer2;
        const damping = this.config.damping;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = x + y * width;
                let val = (b1[i - 1] + b1[i + 1] + b1[i - width] + b1[i + width]) / 2;
                val -= b2[i];
                val *= damping;
                b2[i] = val;
            }
        }

        this.buffer1 = b2;
        this.buffer2 = b1;
        this.dataTexture.image.data = this.buffer1;
        this.dataTexture.needsUpdate = true;
    }

    _addSimulationDisturbance(x, y, strength) {
        let gx = Math.floor(x * this.config.simWidth);
        let gy = Math.floor((1.0 - y) * this.config.simHeight);
        
        const width = this.config.simWidth;
        const height = this.config.simHeight;
        const radius = this.config.cursorRadius;

        if (gx <= radius || gx >= width - radius || gy <= radius || gy >= height - radius) return;

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const dist = Math.sqrt(i * i + j * j);
                if (dist <= radius) {
                    const index = (gx + i) + (gy + j) * width;
                    this.buffer1[index] += strength * (Math.cos(dist / radius * Math.PI / 2));
                }
            }
        }
    }

    _bindEventListeners() {
        window.addEventListener('resize', this._handleResize.bind(this));
        
        if (!this.isLiteMode) {
            document.addEventListener('mousemove', this._handleMouseMove.bind(this));
        }
    }

    /**
     * FIX APLICADO: Actualizamos el shader también al redimensionar.
     */
    _handleResize() {
        if (!this.renderer) return;
        
        // Ajustamos tamaño renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Recalculamos el aspect ratio interno de la simulación
        this._initializeSimulation();
        this.uniforms.u_displacementMap.value = this.dataTexture;

        // IMPORTANTE: Actualizar u_resolution con el nuevo tamaño * DPR
        const dpr = this.renderer.getPixelRatio();
        this.uniforms.u_resolution.value.set(
            window.innerWidth * dpr, 
            window.innerHeight * dpr
        );
    }

    _handleMouseMove(e) {
        if (!this.renderer) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const aspect = rect.width / rect.height;
        const dx = (x - this.lastMouse.x) * aspect;
        const dy = y - this.lastMouse.y;
        
        const velocity = Math.sqrt(dx*dx + dy*dy);
        const strength = Math.min(velocity * 150.0, 4.0);

        if (strength > 0.05) {
            this._addSimulationDisturbance(x, y, strength);
        }
        
        this.lastMouse = { x, y };
    }

    _startAnimationLoop() {
        const render = () => {
            if (!this.isMounted) return;

            if (document.hidden) {
                this.animationId = requestAnimationFrame(render);
                return;
            }

            if (!this.isLiteMode) {
                this._updateFluidDynamics();
            }

            this.uniforms.u_time.value += 0.005;
            this.renderer.render(this.scene, this.camera);
            
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    _getFragmentShaderSource() {
        return `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform sampler2D u_displacementMap;
            uniform vec3 u_color_base;
            uniform vec3 u_color_fluid;

            float random (in vec2 _st) { 
                return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123); 
            }
            
            float noise (in vec2 _st) {
                vec2 i = floor(_st); vec2 f = fract(_st);
                float a = random(i); float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            #define NUM_OCTAVES 4
            float fbm ( in vec2 _st) {
                float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
                mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
                for (int i = 0; i < NUM_OCTAVES; ++i) {
                    v += a * noise(_st); _st = rot * _st * 2.0 + shift; a *= 0.5;
                }
                return v;
            }

            void main() {
                // st ahora irá correctamente de 0.0 a 1.0 gracias al fix del u_resolution
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                
                float waveHeight = texture2D(u_displacementMap, st).r;
                vec2 displacement = vec2(waveHeight) * 0.05; 
                
                vec2 distortedST = st - displacement;
                vec2 aspectST = distortedST;
                aspectST.x *= u_resolution.x / u_resolution.y;

                vec2 q = vec2(0.);
                q.x = fbm( aspectST + 0.01 * u_time);
                q.y = fbm( aspectST + vec2(1.0));

                vec2 r = vec2(0.);
                r.x = fbm( aspectST + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
                r.y = fbm( aspectST + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

                float smokeIntensity = fbm(aspectST + r);
                
                float finalIntensity = pow(smokeIntensity, 3.0) * 0.6;
                vec3 color = mix(u_color_base, u_color_fluid, clamp(finalIntensity, 0.0, 1.0));
                
                color += u_color_fluid * smoothstep(0.05, 0.6, waveHeight) * 0.15;

                float vignette = 1.0 - smoothstep(0.5, 1.5, length(gl_FragCoord.xy / u_resolution.xy - 0.5));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
}