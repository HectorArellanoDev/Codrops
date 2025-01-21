function parseBindings(shader, visibility) {

    shader = shader.split(';');
    let groups = [];

    const groupIdRegex = /group\(([^)]+)\)/;
    const bindingIdRegex = /binding\(([^)]+)\)/;

    shader.forEach((line, i) => {
        if(line.includes("@group")) {

            const groupId = Number(groupIdRegex.exec(line)[1]);
            const bindingId = Number(bindingIdRegex.exec(line)[1]);

            if(groups[groupId] == undefined) groups[groupId] = [];

            //Buffer type
            if(line.includes("uniform") || line.includes("storage")) {

                let _type = "";
                if(line.includes("storage")) _type = line.includes("read_write") ? "storage" : "read-only-storage";
                if(line.includes("uniform")) _type = "uniform";

                groups[groupId][bindingId] = {
                    binding: bindingId,
                    visibility: visibility,
                    buffer: {
                        type: _type
                    }
                }

            }

            //Textures type
            if(line.includes("texture_")) {

                let dimension = "2d";
                if(line.includes("_3d")) dimension = "3d";
                if(line.includes("_1d")) dimension = "1d";
                if(line.includes("_2d") && line.includes("array")) dimension = "2d-array";

                //Texture storage type
                if(line.includes("texture_storage")) {
                    groups[groupId][bindingId] = {
                        binding: bindingId,
                        visibility: visibility,
                        storageTexture: {
                            format: line.includes("unorm")? "rgba8unorm" : "rgba32float",
                            viewDimension: dimension,
                        }
                    }
                } 
                
                //Texture type
                else {

                    let _type = "float";
                    let dimension = "2d";
                    if(line.includes("texture_3d")) dimension = "3d";
                    if(line.includes("texture_1d")) dimension = "1d";
                    if(line.includes("_2d") && line.includes("array")) dimension = "2d-array";

                    groups[groupId][bindingId] = {
                        binding: bindingId,
                        visibility: visibility,
                        texture: {
                            sampleType: _type,
                            viewDimension: dimension
                        }
                    }

                }

            } 

            //Smpler type
            if(line.includes("sampler")) {
                groups[groupId][bindingId] = {
                    binding: bindingId,
                    visibility: visibility,
                    sampler: {
                        type: "filtering",
                    }
                }
            }
        }
    })

    return groups;
}

export {parseBindings}