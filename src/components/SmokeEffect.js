/**
 * SmokeEffect Component
 * * Renders an interactive smoke effect using Three.js and GLSL.
 * Implements a hybrid CPU/GPU approach:
 * - CPU: Solves fluid dynamics (wave equation) for mouse interaction.
 * - GPU: Renders fractal noise (FBM) distorted by the CPU simulation data.
 * * Features:
 * - Lazy Loading: Three.js is imported only on mount and only for desktop.
 * - Mobile Optimization: Disables fluid physics on mobile devices to save battery/CPU.
 * - Retina Support: Clamps pixel ratio to optimize performance on high-DPI screens.
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
        this.isLiteMode = false; // True if mobile/tablet
    }

    /**
     * Determines if the current environment requires the simplified rendering mode.
     * @returns {boolean}
     */
    _shouldRunLiteMode() {
        return (window.innerWidth <= this.config.mobileBreakpoint) || ('ontouchstart' in window);
    }

    /**
     * Public render method returning the container markup.
     * @returns {string} HTML string
     */
    render() {
        return `<div id="${this.containerId}"></div>`;
    }

    /**
     * Initializes the component lifecycle.
     * Handles lazy loading of dependencies and environment detection.
     */
    async mount() {
        this.isLiteMode = this._shouldRunLiteMode();

        // Optimization: Abort heavy library download on mobile devices
        if (this.isLiteMode) {
            console.info('[SmokeEffect] Lite mode active: Physics engine disabled.');
            return; 
        }

        const container = document.getElementById(this.containerId);
        if (!container) return;

        try {
            // Dynamic Import: Load Three.js only when strictly necessary
            this.THREE = await import('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js');
            
            this.isMounted = true;
            this._initializeScene(container);
            this._initializeSimulation();
            this._createCompositeMesh();
            this._bindEventListeners();
            this._startAnimationLoop();

        } catch (error) {
            console.error('[SmokeEffect] Failed to load 3D engine:', error);
        }
    }

    /**
     * Sets up the Three.js Orthographic Camera and WebGL Renderer.
     * @param {HTMLElement} container 
     */
    _initializeScene(container) {
        this.scene = new this.THREE.Scene();
        
        // Orthographic camera for 2D post-processing effect
        this.camera = new this.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.renderer = new this.THREE.WebGLRenderer({ 
            alpha: false, 
            antialias: false,
            powerPreference: "high-performance",
            depth: false,
            stencil: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Performance Optimization: Cap DPR at 1.5 to avoid overhead on 4K/Retina screens
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
        
        container.appendChild(this.renderer.domElement);
    }

    /**
     * Allocates buffers for the wave equation simulation.
     */
    _initializeSimulation() {
        const aspect = window.innerWidth / window.innerHeight;
        
        // Adjust grid width based on aspect ratio to maintain square cells
        this.config.simHeight = 128;
        this.config.simWidth = Math.floor(128 * aspect);

        const size = this.config.simWidth * this.config.simHeight;
        
        // Memory pooling: Reallocate only if size changes
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
     * Compiles shaders and adds the full-screen quad to the scene.
     */
    _createCompositeMesh() {
        this.uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new this.THREE.Vector2(window.innerWidth, window.innerHeight) },
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

    /**
     * Solves the wave equation for fluid propagation on the CPU.
     * Uses neighbor sampling to propagate energy across the grid.
     */
    _updateFluidDynamics() {
        const width = this.config.simWidth;
        const height = this.config.simHeight;
        const b1 = this.buffer1;
        const b2 = this.buffer2;
        const damping = this.config.damping;

        // Inner loop optimization: Avoid boundary checks for performance
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = x + y * width;
                let val = (b1[i - 1] + b1[i + 1] + b1[i - width] + b1[i + width]) / 2;
                val -= b2[i];
                val *= damping;
                b2[i] = val;
            }
        }

        // Swap buffers
        this.buffer1 = b2;
        this.buffer2 = b1;

        // Upload to GPU
        this.dataTexture.image.data = this.buffer1;
        this.dataTexture.needsUpdate = true;
    }

    /**
     * Injects energy into the simulation grid at specific coordinates.
     * @param {number} x - Normalized X coordinate (0-1)
     * @param {number} y - Normalized Y coordinate (0-1)
     * @param {number} strength - Amplitude of the disturbance
     */
    _addSimulationDisturbance(x, y, strength) {
        let gx = Math.floor(x * this.config.simWidth);
        let gy = Math.floor((1.0 - y) * this.config.simHeight);
        
        const width = this.config.simWidth;
        const height = this.config.simHeight;
        const radius = this.config.cursorRadius;

        // Boundary check
        if (gx <= radius || gx >= width - radius || gy <= radius || gy >= height - radius) return;

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const dist = Math.sqrt(i * i + j * j);
                if (dist <= radius) {
                    const index = (gx + i) + (gy + j) * width;
                    // Cosine falloff for smooth ripples
                    this.buffer1[index] += strength * (Math.cos(dist / radius * Math.PI / 2));
                }
            }
        }
    }

    _bindEventListeners() {
        window.addEventListener('resize', this._handleResize.bind(this));
        
        // Interactive listeners only required for Desktop physics
        if (!this.isLiteMode) {
            document.addEventListener('mousemove', this._handleMouseMove.bind(this));
        }
    }

    _handleResize() {
        if (!this.renderer) return;
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        
        this._initializeSimulation();
        this.uniforms.u_displacementMap.value = this.dataTexture;
    }

    _handleMouseMove(e) {
        if (!this.renderer) return;

        // Viewport Calculation: Using getBoundingClientRect ensures coordinates 
        // are relative to the rendered canvas size, correcting zoom offsets.
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Velocity Calculation
        const aspect = rect.width / rect.height;
        const dx = (x - this.lastMouse.x) * aspect;
        const dy = y - this.lastMouse.y;
        
        const velocity = Math.sqrt(dx*dx + dy*dy);
        const strength = Math.min(velocity * 150.0, 4.0);

        // Threshold to avoid micro-calculations on static mouse
        if (strength > 0.05) {
            this._addSimulationDisturbance(x, y, strength);
        }
        
        this.lastMouse = { x, y };
    }

    _startAnimationLoop() {
        const render = () => {
            if (!this.isMounted) return;

            // Pause if tab is inactive
            if (document.hidden) {
                this.animationId = requestAnimationFrame(render);
                return;
            }

            // Physics Update (Desktop Only)
            if (!this.isLiteMode) {
                this._updateFluidDynamics();
            }

            // Render Update
            this.uniforms.u_time.value += 0.005;
            this.renderer.render(this.scene, this.camera);
            
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    /**
     * Returns the GLSL Fragment Shader source code.
     * Includes Fractal Brownian Motion (FBM) and domain warping logic.
     */
    _getFragmentShaderSource() {
        return `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform sampler2D u_displacementMap;
            uniform vec3 u_color_base;
            uniform vec3 u_color_fluid;

            // --- Pseudo-random generation ---
            float random (in vec2 _st) { 
                return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123); 
            }
            
            // --- 2D Noise Function ---
            float noise (in vec2 _st) {
                vec2 i = floor(_st); vec2 f = fract(_st);
                float a = random(i); float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            // --- Fractal Brownian Motion ---
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
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                
                // Physics Sampling
                float waveHeight = texture2D(u_displacementMap, st).r;
                vec2 displacement = vec2(waveHeight) * 0.05; 
                
                // Domain Warping
                vec2 distortedST = st - displacement;
                vec2 aspectST = distortedST;
                aspectST.x *= u_resolution.x / u_resolution.y;

                // FBM Layering
                vec2 q = vec2(0.);
                q.x = fbm( aspectST + 0.01 * u_time);
                q.y = fbm( aspectST + vec2(1.0));

                vec2 r = vec2(0.);
                r.x = fbm( aspectST + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
                r.y = fbm( aspectST + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

                float smokeIntensity = fbm(aspectST + r);
                
                // Post-processing
                float finalIntensity = pow(smokeIntensity, 3.0) * 0.6;
                vec3 color = mix(u_color_base, u_color_fluid, clamp(finalIntensity, 0.0, 1.0));
                
                // Interactive Highlight
                color += u_color_fluid * smoothstep(0.05, 0.6, waveHeight) * 0.15;

                // Vignette
                float vignette = 1.0 - smoothstep(0.5, 1.5, length(gl_FragCoord.xy / u_resolution.xy - 0.5));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
}