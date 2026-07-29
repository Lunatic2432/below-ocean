export class PhotoMode {
  constructor(renderer, uiManager) {
    this.renderer = renderer;
    this.uiManager = uiManager;
  }

  capture() {
    if (!this.renderer) return;

    const canvas = this.renderer.domElement;
    const width = canvas.width;
    const height = canvas.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;

    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      ctx.drawImage(image, 0, 0, width, height);
      this.drawPhotoFrame(ctx, width, height);
      const dataURL = tempCanvas.toDataURL('image/png');
      this.downloadImage(dataURL);
    };
    image.src = canvas.toDataURL('image/png');
  }

  drawPhotoFrame(ctx, width, height) {
    const border = Math.round(Math.min(width, height) * 0.04);
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(25, 68, 108, 0.4)');
    gradient.addColorStop(1, 'rgba(9, 22, 38, 0.75)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(border, border, width - border * 2, height - border * 2);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(2, border * 0.2);
    ctx.strokeRect(border, border, width - border * 2, height - border * 2);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `${Math.round(border * 0.9)}px Outfit, sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('Below the Ocean', border * 1.2, height - border * 0.9);

    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    ctx.font = `${Math.round(border * 0.7)}px Outfit, sans-serif`;
    ctx.fillText(timestamp, border * 1.2, height - border * 0.9 - Math.round(border * 1.2));
  }

  downloadImage(dataURL) {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'below-the-ocean-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
