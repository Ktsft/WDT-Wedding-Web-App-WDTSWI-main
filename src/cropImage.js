export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = new Image();
    image.src = imageSrc;
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    // Draw rotated image on the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // return new Promise((resolve) => {
    //     canvas.toBlob((blob) => {
    //         resolve(blob);
    //     }, 'image/jpeg');
    // });
    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg')); // Return base64 data URL instead of Blob
    });
}
