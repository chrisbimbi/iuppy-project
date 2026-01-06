// Enhanced Liquid Glass Fragment Shader
// Crystalline Brutalism - More visible glass effect

#version 460 core

#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    vec2 uv = FlutterFragCoord().xy / uSize;
    
    // Enhanced glass distortion with wave effect
    float wave = sin(uv.y * 15.0 + uTime * 0.8) * cos(uv.x * 15.0 + uTime * 0.6);
    vec2 distortion = vec2(
        wave * 0.008,
        wave * 0.008
    );
    
    vec2 distortedUV = uv + distortion;
    
    // Enhanced chromatic aberration for prism effect
    float offset = 0.005;
    float r = texture(uTexture, distortedUV + vec2(offset, 0.0)).r;
    float g = texture(uTexture, distortedUV).g;
    float b = texture(uTexture, distortedUV - vec2(offset, 0.0)).b;
    
    vec3 color = vec3(r, g, b);
    
    // Add iridescent tint that shifts with position
    vec3 iridescence = vec3(
        0.5 + 0.5 * sin(uv.x * 3.0 + uTime),
        0.5 + 0.5 * sin(uv.y * 3.0 + uTime + 2.0),
        0.5 + 0.5 * sin((uv.x + uv.y) * 3.0 + uTime + 4.0)
    );
    
    // Mix in subtle iridescence
    color = mix(color, iridescence, 0.08);
    
    // Add glass tint
    color = mix(color, vec3(1.0, 1.0, 1.0), 0.1);
    
    fragColor = vec4(color, 1.0);
}
