// @ts-nocheck
// 视图操作类：画布缩放、平移、fit、get/setTransformData 等

export default class View {
  constructor({ mindMap }) {
    this.mindMap = mindMap
    const draw = mindMap.draw
    const t = draw ? draw.transform() : {}
    this.scale = t.scaleX ?? 1
    this.x = t.translateX ?? 0
    this.y = t.translateY ?? 0
  }

  transform() {
    const draw = this.mindMap.draw
    if (!draw) return
    draw.transform({
      scaleX: this.scale,
      scaleY: this.scale,
      translateX: this.x,
      translateY: this.y
    })
  }

  getTransformData() {
    const draw = this.mindMap.draw
    const transform = draw ? draw.transform() : { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, shear: 0, rotate: 0, originX: 0, originY: 0, a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    return {
      transform: { ...transform },
      state: {
        scale: this.scale,
        x: this.x,
        y: this.y,
        sx: 0,
        sy: 0
      }
    }
  }

  setTransformData(data) {
    if (!data) return
    if (data.transform) {
      this.mindMap.draw.transform(data.transform)
      const t = data.transform
      this.scale = t.scaleX ?? this.scale
      this.x = t.translateX ?? this.x
      this.y = t.translateY ?? this.y
    }
    if (data.state) {
      this.scale = data.state.scale ?? this.scale
      this.x = data.state.x ?? this.x
      this.y = data.state.y ?? this.y
    }
  }

  reset() {
    this.scale = 1
    this.x = 0
    this.y = 0
    this.transform()
  }

  fit(getRect, padding, paddingVal) {
    const mindMap = this.mindMap
    const draw = mindMap.draw
    if (!draw) return
    const width = mindMap.width
    const height = mindMap.height
    let rect
    if (typeof getRect === 'function') {
      rect = getRect()
      if (paddingVal != null) padding = paddingVal
    } else {
      const root = mindMap.renderer?.root?.group
      rect = root ? root.rbox() : draw.rbox()
      padding = padding ?? 50
    }
    const paddingX = padding ?? 0
    const paddingY = padding ?? 0
    const contentW = (rect.width || 0) + paddingX * 2
    const contentH = (rect.height || 0) + paddingY * 2
    if (contentW <= 0 || contentH <= 0) return
    const scale = Math.min(width / contentW, height / contentH)
    const cx = (rect.x || 0) + (rect.width || 0) / 2
    const cy = (rect.y || 0) + (rect.height || 0) / 2
    this.scale = scale
    this.x = width / 2 - cx * scale
    this.y = height / 2 - cy * scale
    this.transform()
  }

  translateX(step) {
    this.x += step
    this.transform()
  }

  translateY(step) {
    this.y += step
    this.transform()
  }

  translateXTo(x) {
    this.x = x
    this.transform()
  }

  translateYTo(y) {
    this.y = y
    this.transform()
  }

  translateXY(ox, oy) {
    this.x += ox
    this.y += oy
    this.transform()
  }

  setScale(scale, cx, cy) {
    const mindMap = this.mindMap
    if (cx == null) cx = mindMap.width / 2
    if (cy == null) cy = mindMap.height / 2
    const ratio = scale / this.scale
    this.x = cx - (cx - this.x) * ratio
    this.y = cy - (cy - this.y) * ratio
    this.scale = scale
    this.transform()
  }

  narrow(cx, cy) {
    const { scaleRatio, minZoomRatio } = this.mindMap.opt
    const minScale = minZoomRatio != null ? minZoomRatio / 100 : 0.2
    let scale = this.scale * (1 - (scaleRatio ?? 0.2))
    if (scale < minScale) scale = minScale
    this.setScale(scale, cx, cy)
  }

  enlarge(cx, cy) {
    const { scaleRatio, maxZoomRatio } = this.mindMap.opt
    const maxScale = maxZoomRatio === -1 ? Infinity : (maxZoomRatio ?? 400) / 100
    let scale = this.scale * (1 + (scaleRatio ?? 0.2))
    if (scale > maxScale) scale = maxScale
    this.setScale(scale, cx, cy)
  }
}
