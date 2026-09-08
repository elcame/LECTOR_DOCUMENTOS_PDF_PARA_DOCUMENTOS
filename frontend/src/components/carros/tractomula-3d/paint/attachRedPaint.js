import { Color } from 'three'

const SHADER_VERSION = 3

function redMaskSnippet(colorExpr) {
  return `
    {
      vec3 _c = ${colorExpr};
      float _maxc = max(_c.r, max(_c.g, _c.b));
      float _minc = min(_c.r, min(_c.g, _c.b));
      float _chroma = _maxc - _minc;
      float _redness = _c.r - max(_c.g, _c.b);
      float _hueRed = 0.0;
      if (_maxc > 0.02 && _chroma > 0.01) {
        _hueRed = clamp(_redness / _chroma, 0.0, 1.0);
      }
      _paintMask = max(_paintMask, smoothstep(0.04, 0.16, _redness));
      _paintMask = max(_paintMask, _hueRed * smoothstep(0.02, 0.10, _chroma) * smoothstep(0.03, 0.12, _maxc));
    }
  `
}

export function attachRedPaint(material, paintHex) {
  if (!material) return
  if (!material.userData.uPaint) {
    material.userData.uPaint = { value: new Color(paintHex) }
  } else {
    material.userData.uPaint.value.set(paintHex)
  }

  if (material.userData.paintShaderVersion === SHADER_VERSION) return

  const previous = material.onBeforeCompile
  material.onBeforeCompile = (shader) => {
    previous?.(shader)
    shader.uniforms.uPaint = material.userData.uPaint
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uPaint;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float _paintMask = 0.0;
        ${redMaskSnippet('diffuseColor.rgb')}
        #ifdef USE_MAP
        vec2 _texel = vec2(0.0009);
        vec3 _n1 = texture2D(map, vMapUv + vec2(_texel.x, 0.0)).rgb;
        vec3 _n2 = texture2D(map, vMapUv - vec2(_texel.x, 0.0)).rgb;
        vec3 _n3 = texture2D(map, vMapUv + vec2(0.0, _texel.y)).rgb;
        vec3 _n4 = texture2D(map, vMapUv - vec2(0.0, _texel.y)).rgb;
        vec3 _n5 = texture2D(map, vMapUv + _texel).rgb;
        vec3 _n6 = texture2D(map, vMapUv - _texel).rgb;
        ${redMaskSnippet('_n1')}
        ${redMaskSnippet('_n2')}
        ${redMaskSnippet('_n3')}
        ${redMaskSnippet('_n4')}
        ${redMaskSnippet('_n5')}
        ${redMaskSnippet('_n6')}
        #endif
        _paintMask = clamp(pow(_paintMask, 0.35), 0.0, 1.0);
        float _lum = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
        vec3 _painted = uPaint * (0.38 + _lum * 1.15);
        diffuseColor.rgb = mix(diffuseColor.rgb, _painted, _paintMask);`,
      )
  }
  material.userData.paintShaderVersion = SHADER_VERSION
  material.customProgramCacheKey = () => `mula-red-paint-v${SHADER_VERSION}`
  material.needsUpdate = true
}
