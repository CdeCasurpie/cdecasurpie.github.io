import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class SmokeEffect {
    constructor() {
        this.containerId = 'canvas-container';
        
        // Configuración de simulación
        this.simWidth = 256;
        this.simHeight = 256;
        this.damping = 0.95;
        this.baseHeight = 120; // Resolución vertical base de la física

        // Referencias Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.uniforms = null;
        this.dataTexture = null;
        
        // Buffers de física
        this.buffer1 = null;
        this.buffer2 = null;

        // Control de animación
        this.animationId = null;
        this.lastMouse = { x: 0, y: 0 };
    }

    render() {
        // Retornamos el contenedor vacío. 
        // El CSS se encargará de pegarlo al fondo (fixed).
        return `<div id="${this.containerId}"></div>`;
    }

    mount() {
        console.log('[SmokeEffect] Iniciando motor de fluidos...');
        const container = document.getElementById(this.containerId);
        
        if (!container) return;

        // 1. Inicializar Three.js
        this.initThree(container);

        // 2. Inicializar Simulación (Buffers y Texturas)
        this.initSimulation();

        // 3. Crear Mesh con Shader
        this.createMesh();

        // 4. Event Listeners
        this.addEventListeners();

        // 5. Iniciar Loop
        this.animate();
    }

    initThree(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: false, // Fondo sólido para mejor performance
            antialias: false // Desactivado para ganar FPS, el shader ya difumina
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar DPR para móviles
        container.appendChild(this.renderer.domElement);
    }

    initSimulation() {
        const aspect = window.innerWidth / window.innerHeight;
        
        // Ajustamos la resolución de la física basada en el aspecto
        this.simHeight = this.baseHeight;
        this.simWidth = Math.floor(this.baseHeight * aspect);

        // Buffers
        const size = this.simWidth * this.simHeight;
        this.buffer1 = new Float32Array(size);
        this.buffer2 = new Float32Array(size);

        // Textura
        if (this.dataTexture) this.dataTexture.dispose();

        this.dataTexture = new THREE.DataTexture(
            this.buffer1, 
            this.simWidth, 
            this.simHeight, 
            THREE.RedFormat, 
            THREE.FloatType
        );
        this.dataTexture.minFilter = THREE.LinearFilter;
        this.dataTexture.magFilter = THREE.LinearFilter;
        this.dataTexture.needsUpdate = true;
    }

    createMesh() {
        // Fragment Shader (Tu código original encapsulado)
        const fragmentShader = `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform sampler2D u_displacementMap;
            uniform vec3 u_color_base;
            uniform vec3 u_color_fluid;

            float random (in vec2 _st) { return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
            
            float noise (in vec2 _st) {
                vec2 i = floor(_st); vec2 f = fract(_st);
                float a = random(i); float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            #define NUM_OCTAVES 5
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
                
                // Lectura de la física
                float waveHeight = texture2D(u_displacementMap, st).r;
                vec2 displacement = vec2(waveHeight) * 0.08;
                vec2 distortedST = st - displacement;

                // Corrección de aspecto para el ruido
                vec2 aspectST = distortedST;
                aspectST.x *= u_resolution.x / u_resolution.y;

                // Generación de humo (FBM)
                vec2 q = vec2(0.);
                q.x = fbm( aspectST + 0.02 * u_time);
                q.y = fbm( aspectST + vec2(1.0));

                vec2 r = vec2(0.);
                r.x = fbm( aspectST + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
                r.y = fbm( aspectST + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

                float smokeIntensity = fbm(aspectST + r);
                
                // Ajuste de contraste y opacidad
                float finalIntensity = pow(smokeIntensity, 3.0) * 0.5;

                vec3 color = mix(u_color_base, u_color_fluid, clamp(finalIntensity, 0.0, 1.0));
                
                // Añadir brillo sutil donde hay movimiento físico
                color += u_color_fluid * smoothstep(0.05, 0.6, waveHeight) * 0.1;

                // Viñeta
                float vignette = 1.0 - smoothstep(0.5, 1.5, length(gl_FragCoord.xy / u_resolution.xy - 0.5));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_displacementMap: { value: this.dataTexture },
            u_color_base: { value: new THREE.Color(0.015, 0.01, 0.015) },
            u_color_fluid: { value: new THREE.Color(0.99, 0.73, 0.78) }
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `void main() { gl_Position = vec4( position, 1.0 ); }`,
            fragmentShader: fragmentShader
        });

        this.scene.add(new THREE.Mesh(geometry, material));
    }

    updatePhysics() {
        const width = this.simWidth;
        const height = this.simHeight;
        
        // Optimización: Usar variables locales dentro del loop para acceso más rápido
        const b1 = this.buffer1;
        const b2 = this.buffer2;

        // Bucle principal de propagación de ondas
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = x + y * width;

                let val = (
                    b1[i - 1] +
                    b1[i + 1] +
                    b1[i - width] +
                    b1[i + width]
                ) / 2;

                val -= b2[i];
                val *= this.damping;
                b2[i] = val;
            }
        }

        // Swap buffers
        this.buffer1 = b2;
        this.buffer2 = b1;

        // Actualizar textura
        this.dataTexture.image.data = this.buffer1;
        this.dataTexture.needsUpdate = true;
    }

    addDisturbance(x, y, strength) {
        let gx = Math.floor(x * this.simWidth);
        let gy = Math.floor((1.0 - y) * this.simHeight);

        const width = this.simWidth;
        const height = this.simHeight;

        if (gx > 2 && gx < width - 3 && gy > 2 && gy < height - 3) {
            const radius = 3;
            for(let i = -radius; i <= radius; i++) {
                for(let j = -radius; j <= radius; j++) {
                    let dist = Math.sqrt(i*i + j*j);
                    if (dist <= radius) {
                         const index = (gx + i) + (gy + j) * width;
                         this.buffer1[index] += strength * (Math.cos(dist / radius * Math.PI / 2));
                    }
                }
            }
        }
    }

    addEventListeners() {
        // Resize
        window.addEventListener('resize', () => {
            if (!this.renderer) return;
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            
            // Reiniciar simulación para ajustar grid
            this.initSimulation();
            this.uniforms.u_displacementMap.value = this.dataTexture;
        });

        // Mouse Move
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            const aspect = window.innerWidth / window.innerHeight;
            const dx = (x - this.lastMouse.x) * aspect;
            const dy = y - this.lastMouse.y;

            const dist = Math.sqrt(dx*dx + dy*dy);
            const strength = Math.min(dist * 150.0, 4.0);

            if (strength > 0.05) {
                this.addDisturbance(x, y, strength);
            }
            this.lastMouse = { x, y };
        });
    }

    animate = () => {
        // Optimización: Si la pestaña no está visible, no renderizamos
        if (document.hidden) {
             this.animationId = requestAnimationFrame(this.animate);
             return;
        }

        this.updatePhysics();
        
        // Actualizar tiempo del shader
        this.uniforms.u_time.value += 0.005;
        
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(this.animate);
    }
}