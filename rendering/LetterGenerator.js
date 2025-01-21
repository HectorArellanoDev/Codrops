var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d", {
        willReadFrequently: true
});
canvas.style.position = "absolute";
canvas.style.top = "0px";

// document.body.appendChild(canvas);

function getLetter(letter, fontSize, resolution, verticalOffset = 0.56, image = null) {

        canvas.width = resolution;
        canvas.height = resolution;
        canvas.style.width = `${resolution}px`;
        canvas.style.height = `${resolution}px`;

        if(image == null) {
                
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.font = `${fontSize}px codrops`;
                ctx.fillText(letter, resolution * 0.5, resolution * 0.5 + fontSize * verticalOffset);
        
        } else {

                ctx.drawImage(image, 0, 0);
        }

        return ctx.getImageData(0, 0, resolution, resolution).data;
}

export {getLetter}