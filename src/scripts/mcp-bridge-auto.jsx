// mcp-bridge-auto.jsx
// Auto-running MCP Bridge panel for After Effects

// Remove #include directives as we define functions below
/*
#include "createComposition.jsx"
#include "createTextLayer.jsx"
#include "createShapeLayer.jsx"
#include "createSolidLayer.jsx"
#include "setLayerProperties.jsx"
*/

// --- Function Definitions ---

// ExtendScript's Date has no toISOString (that's an ES5 addition the AE JS engine lacks).
function toISOStringSafe(d) {
    function pad(n, width) {
        n = String(n);
        while (n.length < width) n = "0" + n;
        return n;
    }
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1, 2) + "-" + pad(d.getUTCDate(), 2) +
        "T" + pad(d.getUTCHours(), 2) + ":" + pad(d.getUTCMinutes(), 2) + ":" + pad(d.getUTCSeconds(), 2) +
        "." + pad(d.getUTCMilliseconds(), 3) + "Z";
}

// --- createComposition (from createComposition.jsx) ---
function createComposition(args) {
    try {
        var name = args.name || "New Composition";
        var width = parseInt(args.width) || 1920;
        var height = parseInt(args.height) || 1080;
        var pixelAspect = parseFloat(args.pixelAspect) || 1.0;
        var duration = parseFloat(args.duration) || 10.0;
        var frameRate = parseFloat(args.frameRate) || 30.0;
        var bgColor = args.backgroundColor ? [args.backgroundColor.r/255, args.backgroundColor.g/255, args.backgroundColor.b/255] : [0, 0, 0];
        var newComp = app.project.items.addComp(name, width, height, pixelAspect, duration, frameRate);
        if (args.backgroundColor) {
            newComp.bgColor = bgColor;
        }
        return JSON.stringify({
            status: "success", message: "Composition created successfully",
            composition: { name: newComp.name, id: newComp.id, width: newComp.width, height: newComp.height, pixelAspect: newComp.pixelAspect, duration: newComp.duration, frameRate: newComp.frameRate, bgColor: newComp.bgColor }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- createTextLayer (from createTextLayer.jsx) ---
function createTextLayer(args) {
    try {
        var compName = args.compName || "";
        var text = args.text || "Text Layer";
        var position = args.position || [960, 540]; 
        var fontSize = args.fontSize || 72;
        var color = args.color || [1, 1, 1]; 
        var startTime = args.startTime || 0;
        var duration = args.duration || 5; 
        var fontFamily = args.fontFamily || "Arial";
        var alignment = args.alignment || "center"; 
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; } 
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }
        var textLayer = comp.layers.addText(text);
        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var textDocument = textProp.value;
        textDocument.fontSize = fontSize;
        textDocument.fillColor = color;
        textDocument.font = fontFamily;
        if (alignment === "left") { textDocument.justification = ParagraphJustification.LEFT_JUSTIFY; } 
        else if (alignment === "center") { textDocument.justification = ParagraphJustification.CENTER_JUSTIFY; } 
        else if (alignment === "right") { textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY; }
        textProp.setValue(textDocument);
        textLayer.property("Position").setValue(position);
        textLayer.startTime = startTime;
        if (duration > 0) { textLayer.outPoint = startTime + duration; }
        return JSON.stringify({
            status: "success", message: "Text layer created successfully",
            layer: { name: textLayer.name, index: textLayer.index, type: "text", inPoint: textLayer.inPoint, outPoint: textLayer.outPoint, position: textLayer.property("Position").value }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- createShapeLayer (from createShapeLayer.jsx) --- 
function createShapeLayer(args) {
    try {
        var compName = args.compName || "";
        var shapeType = args.shapeType || "rectangle"; 
        var position = args.position || [960, 540]; 
        var size = args.size || [200, 200]; 
        var fillColor = args.fillColor || [1, 0, 0]; 
        var strokeColor = args.strokeColor || [0, 0, 0]; 
        var strokeWidth = args.strokeWidth || 0; 
        var startTime = args.startTime || 0;
        var duration = args.duration || 5; 
        var name = args.name || "Shape Layer";
        var points = args.points || 5; 
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; } 
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = name;
        var contents = shapeLayer.property("Contents"); 
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        var groupContents = shapeGroup.property("Contents"); 
        var shapePathProperty;
        if (shapeType === "rectangle") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Rect");
            shapePathProperty.property("Size").setValue(size);
        } else if (shapeType === "ellipse") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Ellipse");
            shapePathProperty.property("Size").setValue(size);
        } else if (shapeType === "polygon" || shapeType === "star") { 
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Star");
            shapePathProperty.property("Type").setValue(shapeType === "polygon" ? 1 : 2); 
            shapePathProperty.property("Points").setValue(points);
            shapePathProperty.property("Outer Radius").setValue(size[0] / 2);
            if (shapeType === "star") { shapePathProperty.property("Inner Radius").setValue(size[0] / 3); }
        }
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(fillColor);
        fill.property("Opacity").setValue(100);
        if (strokeWidth > 0) {
            var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue(strokeColor);
            stroke.property("Stroke Width").setValue(strokeWidth);
            stroke.property("Opacity").setValue(100);
        }
        shapeLayer.property("Position").setValue(position);
        shapeLayer.startTime = startTime;
        if (duration > 0) { shapeLayer.outPoint = startTime + duration; }
        return JSON.stringify({
            status: "success", message: "Shape layer created successfully",
            layer: { name: shapeLayer.name, index: shapeLayer.index, type: "shape", shapeType: shapeType, inPoint: shapeLayer.inPoint, outPoint: shapeLayer.outPoint, position: shapeLayer.property("Position").value }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- createCamera ---
function createCamera(args) {
    try {
        var compName = args.compName || "";
        var name = args.name || "Camera";
        var zoom = args.zoom || 1777.78; // Default ~50mm equivalent
        var position = args.position; // Optional [x, y, z]
        var pointOfInterest = args.pointOfInterest; // Optional [x, y, z]
        var oneNode = args.oneNode || false; // If true, create a one-node camera (no point of interest)

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }

        var centerPoint = [comp.width / 2, comp.height / 2];
        var cameraLayer = comp.layers.addCamera(name, centerPoint);
        cameraLayer.property("Camera Options").property("Zoom").setValue(zoom);

        if (oneNode) {
            cameraLayer.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
        }

        if (position !== undefined && position !== null) {
            cameraLayer.property("Position").setValue(position);
        }

        if (pointOfInterest !== undefined && pointOfInterest !== null && !oneNode) {
            cameraLayer.property("Point of Interest").setValue(pointOfInterest);
        }

        var result = {
            name: cameraLayer.name,
            index: cameraLayer.index,
            zoom: cameraLayer.property("Camera Options").property("Zoom").value,
            position: cameraLayer.property("Position").value,
            oneNode: oneNode
        };
        if (!oneNode) {
            result.pointOfInterest = cameraLayer.property("Point of Interest").value;
        }

        return JSON.stringify({
            status: "success",
            message: "Camera created successfully",
            layer: result
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- duplicateLayer ---
function duplicateLayer(args) {
    try {
        var compName = args.compName || "";
        var layerIndex = args.layerIndex;
        var layerName = args.layerName || "";
        var newName = args.newName; // optional rename

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }

        var layer = null;
        if (layerIndex !== undefined && layerIndex !== null) {
            if (layerIndex > 0 && layerIndex <= comp.numLayers) { layer = comp.layer(layerIndex); }
            else { throw new Error("Layer index out of bounds: " + layerIndex); }
        } else if (layerName) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).name === layerName) { layer = comp.layer(j); break; }
            }
        }
        if (!layer) { throw new Error("Layer not found: " + (layerName || "index " + layerIndex)); }

        var newLayer = layer.duplicate();
        if (newName) { newLayer.name = newName; }

        return JSON.stringify({
            status: "success",
            message: "Layer duplicated successfully",
            original: { name: layer.name, index: layer.index },
            duplicate: { name: newLayer.name, index: newLayer.index }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- deleteLayer ---
function deleteLayer(args) {
    try {
        var compName = args.compName || "";
        var layerIndex = args.layerIndex;
        var layerName = args.layerName || "";

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }

        var layer = null;
        if (layerIndex !== undefined && layerIndex !== null) {
            if (layerIndex > 0 && layerIndex <= comp.numLayers) { layer = comp.layer(layerIndex); }
            else { throw new Error("Layer index out of bounds: " + layerIndex); }
        } else if (layerName) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).name === layerName) { layer = comp.layer(j); break; }
            }
        }
        if (!layer) { throw new Error("Layer not found: " + (layerName || "index " + layerIndex)); }

        var deletedName = layer.name;
        var deletedIndex = layer.index;
        layer.remove();

        return JSON.stringify({
            status: "success",
            message: "Layer deleted successfully",
            deleted: { name: deletedName, index: deletedIndex }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- setLayerMask: create or modify a mask on a layer ---
function setLayerMask(args) {
    try {
        var compName = args.compName || "";
        var layerIndex = args.layerIndex;
        var layerName = args.layerName || "";
        var maskIndex = args.maskIndex; // optional — if provided, modify existing mask
        var maskPath = args.maskPath; // array of [x, y] points defining the mask shape
        var maskRect = args.maskRect; // shorthand: {top, left, width, height} for rectangular masks
        var maskMode = args.maskMode || "add"; // "add", "subtract", "intersect", "none"
        var maskFeather = args.maskFeather; // optional [x, y] feather
        var maskOpacity = args.maskOpacity; // optional 0-100
        var maskExpansion = args.maskExpansion; // optional pixels
        var maskName = args.maskName; // optional rename

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }

        var layer = null;
        if (layerIndex !== undefined && layerIndex !== null) {
            if (layerIndex > 0 && layerIndex <= comp.numLayers) { layer = comp.layer(layerIndex); }
            else { throw new Error("Layer index out of bounds: " + layerIndex); }
        } else if (layerName) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).name === layerName) { layer = comp.layer(j); break; }
            }
        }
        if (!layer) { throw new Error("Layer not found: " + (layerName || "index " + layerIndex)); }

        // Build the mask shape
        var shapePoints = [];
        if (maskRect) {
            // Rectangle shorthand
            var t = maskRect.top || 0;
            var l = maskRect.left || 0;
            var w = maskRect.width || comp.width;
            var h = maskRect.height || comp.height;
            shapePoints = [[l, t], [l + w, t], [l + w, t + h], [l, t + h]];
        } else if (maskPath && maskPath.length >= 3) {
            shapePoints = maskPath;
        } else {
            throw new Error("Must provide either maskRect or maskPath with at least 3 points");
        }

        // Create the shape object
        var myShape = new Shape();
        var vertices = [];
        for (var p = 0; p < shapePoints.length; p++) {
            vertices.push(shapePoints[p]);
        }
        myShape.vertices = vertices;
        myShape.closed = true;

        var changed = [];
        var mask;

        if (maskIndex !== undefined && maskIndex !== null) {
            // Modify existing mask
            if (maskIndex > 0 && maskIndex <= layer.property("Masks").numProperties) {
                mask = layer.property("Masks").property(maskIndex);
            } else {
                throw new Error("Mask index out of bounds: " + maskIndex);
            }
            mask.property("Mask Path").setValue(myShape);
            changed.push("maskPath");
        } else {
            // Create new mask
            mask = layer.property("Masks").addProperty("Mask");
            mask.property("Mask Path").setValue(myShape);
            changed.push("newMask");
        }

        // Set mask mode
        var modes = {
            "none": MaskMode.NONE,
            "add": MaskMode.ADD,
            "subtract": MaskMode.SUBTRACT,
            "intersect": MaskMode.INTERSECT,
            "lighten": MaskMode.LIGHTEN,
            "darken": MaskMode.DARKEN,
            "difference": MaskMode.DIFFERENCE
        };
        if (modes[maskMode] !== undefined) {
            mask.maskMode = modes[maskMode];
            changed.push("maskMode");
        }

        if (maskFeather !== undefined && maskFeather !== null) {
            mask.property("Mask Feather").setValue(maskFeather);
            changed.push("maskFeather");
        }
        if (maskOpacity !== undefined && maskOpacity !== null) {
            mask.property("Mask Opacity").setValue(maskOpacity);
            changed.push("maskOpacity");
        }
        if (maskExpansion !== undefined && maskExpansion !== null) {
            mask.property("Mask Expansion").setValue(maskExpansion);
            changed.push("maskExpansion");
        }
        if (maskName) {
            mask.name = maskName;
            changed.push("maskName");
        }

        return JSON.stringify({
            status: "success",
            message: "Mask set successfully",
            layer: { name: layer.name, index: layer.index },
            mask: {
                name: mask.name,
                index: mask.propertyIndex,
                mode: maskMode,
                changedProperties: changed
            }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- createSolidLayer (from createSolidLayer.jsx) ---
function createSolidLayer(args) {
    try {
        var compName = args.compName || "";
        var color = args.color || [1, 1, 1]; 
        var name = args.name || "Solid Layer";
        var position = args.position || [960, 540]; 
        var size = args.size; 
        var startTime = args.startTime || 0;
        var duration = args.duration || 5; 
        var isAdjustment = args.isAdjustment || false; 
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; } 
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }
        if (!size) { size = [comp.width, comp.height]; }
        var solidLayer;
        if (isAdjustment) {
            solidLayer = comp.layers.addSolid([0, 0, 0], name, size[0], size[1], 1);
            solidLayer.adjustmentLayer = true;
        } else {
            solidLayer = comp.layers.addSolid(color, name, size[0], size[1], 1);
        }
        solidLayer.property("Position").setValue(position);
        solidLayer.startTime = startTime;
        if (duration > 0) { solidLayer.outPoint = startTime + duration; }
        return JSON.stringify({
            status: "success", message: isAdjustment ? "Adjustment layer created successfully" : "Solid layer created successfully",
            layer: { name: solidLayer.name, index: solidLayer.index, type: isAdjustment ? "adjustment" : "solid", inPoint: solidLayer.inPoint, outPoint: solidLayer.outPoint, position: solidLayer.property("Position").value, isAdjustment: solidLayer.adjustmentLayer }
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- setLayerProperties (modified to handle text properties) ---
function setLayerProperties(args) {
    try {
        var compName = args.compName || "";
        var layerName = args.layerName || "";
        var layerIndex = args.layerIndex; 
        
        // General Properties
        var position = args.position; 
        var scale = args.scale; 
        var rotation = args.rotation; 
        var opacity = args.opacity; 
        var startTime = args.startTime; 
        var duration = args.duration; 

        // Text Specific Properties
        var textContent = args.text; // New: text content
        var fontFamily = args.fontFamily; // New: font family
        var fontSize = args.fontSize; // New: font size
        var fillColor = args.fillColor; // New: font color
        
        // Find the composition (same logic as before)
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; } 
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }
        
        // Find the layer (same logic as before)
        var layer = null;
        if (layerIndex !== undefined && layerIndex !== null) {
            if (layerIndex > 0 && layerIndex <= comp.numLayers) { layer = comp.layer(layerIndex); } 
            else { throw new Error("Layer index out of bounds: " + layerIndex); }
        } else if (layerName) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).name === layerName) { layer = comp.layer(j); break; }
            }
        }
        if (!layer) { throw new Error("Layer not found: " + (layerName || "index " + layerIndex)); }
        
        var changedProperties = [];
        var textDocumentChanged = false;
        var textProp = null;
        var textDocument = null;

        // --- Text Property Handling ---
        if (layer instanceof TextLayer && (textContent !== undefined || fontFamily !== undefined || fontSize !== undefined || fillColor !== undefined)) {
            var sourceTextProp = layer.property("Source Text");
            if (sourceTextProp && sourceTextProp.value) {
                var currentTextDocument = sourceTextProp.value; // Get the current value
                var updated = false;

                if (textContent !== undefined && textContent !== null && currentTextDocument.text !== textContent) {
                    currentTextDocument.text = textContent;
                    changedProperties.push("text");
                    updated = true;
                }
                if (fontFamily !== undefined && fontFamily !== null && currentTextDocument.font !== fontFamily) {
                    // Add basic validation/logging for font existence if needed
                    // try { app.fonts.findFont(fontFamily); } catch (e) { logToPanel("Warning: Font '"+fontFamily+"' might not be installed."); }
                    currentTextDocument.font = fontFamily;
                    changedProperties.push("fontFamily");
                    updated = true;
                }
                if (fontSize !== undefined && fontSize !== null && currentTextDocument.fontSize !== fontSize) {
                    currentTextDocument.fontSize = fontSize;
                    changedProperties.push("fontSize");
                    updated = true;
                }
                // Comparing colors needs care due to potential floating point inaccuracies if set via UI
                // Simple comparison for now
                if (fillColor !== undefined && fillColor !== null && 
                    (currentTextDocument.fillColor[0] !== fillColor[0] || 
                     currentTextDocument.fillColor[1] !== fillColor[1] || 
                     currentTextDocument.fillColor[2] !== fillColor[2])) {
                    currentTextDocument.fillColor = fillColor;
                    changedProperties.push("fillColor");
                    updated = true;
                }

                // Only set the value if something actually changed
                if (updated) {
                    try {
                        sourceTextProp.setValue(currentTextDocument);
                        logToPanel("Applied changes to Text Document for layer: " + layer.name);
                    } catch (e) {
                        logToPanel("ERROR applying Text Document changes: " + e.toString());
                        // Decide if we should throw or just log the error for text properties
                        // For now, just log, other properties might still succeed
                    }
                }
                 // Store the potentially updated document for the return value
                 textDocument = currentTextDocument; 

            } else {
                logToPanel("Warning: Could not access Source Text property for layer: " + layer.name);
            }
        }

        // --- Enabled/Visible ---
        var enabled = args.enabled;
        if (enabled !== undefined && enabled !== null) { layer.enabled = !!enabled; changedProperties.push("enabled"); }

        // --- Blend Mode ---
        var blendMode = args.blendMode;
        if (blendMode !== undefined && blendMode !== null) {
            var modes = {
                "normal": BlendingMode.NORMAL,
                "add": BlendingMode.ADD,
                "multiply": BlendingMode.MULTIPLY,
                "screen": BlendingMode.SCREEN,
                "overlay": BlendingMode.OVERLAY,
                "softLight": BlendingMode.SOFT_LIGHT,
                "hardLight": BlendingMode.HARD_LIGHT,
                "colorDodge": BlendingMode.COLOR_DODGE,
                "colorBurn": BlendingMode.COLOR_BURN,
                "darken": BlendingMode.DARKEN,
                "lighten": BlendingMode.LIGHTEN,
                "difference": BlendingMode.DIFFERENCE,
                "exclusion": BlendingMode.EXCLUSION,
                "hue": BlendingMode.HUE,
                "saturation": BlendingMode.SATURATION,
                "color": BlendingMode.COLOR,
                "luminosity": BlendingMode.LUMINOSITY
            };
            if (modes[blendMode] !== undefined) {
                layer.blendingMode = modes[blendMode];
                changedProperties.push("blendMode");
            }
        }

        // --- Track Matte ---
        var trackMatteType = args.trackMatteType;
        if (trackMatteType !== undefined && trackMatteType !== null) {
            // Values: "none", "alpha", "alphaInverted", "luma", "lumaInverted"
            var matteTypes = {
                "none": TrackMatteType.NO_TRACK_MATTE,
                "alpha": TrackMatteType.ALPHA,
                "alphaInverted": TrackMatteType.ALPHA_INVERTED,
                "luma": TrackMatteType.LUMA,
                "lumaInverted": TrackMatteType.LUMA_INVERTED
            };
            if (matteTypes[trackMatteType] !== undefined) {
                layer.trackMatteType = matteTypes[trackMatteType];
                changedProperties.push("trackMatteType");
            }
        }

        // --- General Property Handling ---
        var threeDLayer = args.threeDLayer;
        if (threeDLayer !== undefined && threeDLayer !== null) { layer.threeDLayer = !!threeDLayer; changedProperties.push("threeDLayer"); }
        if (position !== undefined && position !== null) {
            var posProp = layer.property("Position");
            if (posProp.numKeys > 0) { while (posProp.numKeys > 0) { posProp.removeKey(1); } }
            posProp.setValue(position);
            changedProperties.push("position");
        }
        if (scale !== undefined && scale !== null) { layer.property("Scale").setValue(scale); changedProperties.push("scale"); }
        if (rotation !== undefined && rotation !== null) {
            if (layer.threeDLayer) { 
                // For 3D layers, Z rotation is often what's intended by a single value
                layer.property("Z Rotation").setValue(rotation);
            } else { 
                layer.property("Rotation").setValue(rotation); 
            }
            changedProperties.push("rotation");
        }
        if (opacity !== undefined && opacity !== null) { layer.property("Opacity").setValue(opacity); changedProperties.push("opacity"); }
        if (startTime !== undefined && startTime !== null) { layer.startTime = startTime; changedProperties.push("startTime"); }
        if (duration !== undefined && duration !== null && duration > 0) {
            var actualStartTime = (startTime !== undefined && startTime !== null) ? startTime : layer.startTime;
            layer.outPoint = actualStartTime + duration;
            changedProperties.push("duration");
        }

        // Return success with updated layer details (including text if changed)
        var returnLayerInfo = {
            name: layer.name,
            index: layer.index,
            threeDLayer: layer.threeDLayer,
            position: layer.property("Position").value,
            scale: layer.property("Scale").value,
            rotation: layer.threeDLayer ? layer.property("Z Rotation").value : layer.property("Rotation").value, // Return appropriate rotation
            opacity: layer.property("Opacity").value,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            changedProperties: changedProperties
        };
        // Add text properties to the return object if it was a text layer
        if (layer instanceof TextLayer && textDocument) {
            returnLayerInfo.text = textDocument.text;
            returnLayerInfo.fontFamily = textDocument.font;
            returnLayerInfo.fontSize = textDocument.fontSize;
            returnLayerInfo.fillColor = textDocument.fillColor;
        }

        // *** ADDED LOGGING HERE ***
        logToPanel("Final check before return:");
        logToPanel("  Changed Properties: " + changedProperties.join(", "));
        logToPanel("  Return Layer Info Font: " + (returnLayerInfo.fontFamily || "N/A")); 
        logToPanel("  TextDocument Font: " + (textDocument ? textDocument.font : "N/A"));

        return JSON.stringify({
            status: "success", message: "Layer properties updated successfully",
            layer: returnLayerInfo
        });
    } catch (error) {
        // Error handling remains similar, but add more specific checks if needed
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// --- batchSetLayerProperties: apply properties to multiple layers in one call ---
function batchSetLayerProperties(args) {
    try {
        var compName = args.compName || "";
        var operations = args.operations; // Array of {layerIndex, threeDLayer, position, scale, rotation, opacity, ...}

        if (!operations || !operations.length) {
            throw new Error("No operations provided. Pass an array of {layerIndex, ...properties}");
        }

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }

        var results = [];
        for (var o = 0; o < operations.length; o++) {
            var op = operations[o];
            var layer = null;
            if (op.layerIndex !== undefined && op.layerIndex !== null) {
                if (op.layerIndex > 0 && op.layerIndex <= comp.numLayers) { layer = comp.layer(op.layerIndex); }
                else { results.push({ layerIndex: op.layerIndex, status: "error", message: "Layer index out of bounds" }); continue; }
            } else if (op.layerName) {
                for (var j = 1; j <= comp.numLayers; j++) {
                    if (comp.layer(j).name === op.layerName) { layer = comp.layer(j); break; }
                }
            }
            if (!layer) { results.push({ layerIndex: op.layerIndex, layerName: op.layerName, status: "error", message: "Layer not found" }); continue; }

            var changed = [];
            if (op.threeDLayer !== undefined && op.threeDLayer !== null) { layer.threeDLayer = !!op.threeDLayer; changed.push("threeDLayer"); }
            if (op.position !== undefined && op.position !== null) {
                var posProp = layer.property("Position");
                if (posProp.numKeys > 0) {
                    while (posProp.numKeys > 0) { posProp.removeKey(1); }
                }
                posProp.setValue(op.position);
                changed.push("position");
            }
            if (op.scale !== undefined && op.scale !== null) { layer.property("Scale").setValue(op.scale); changed.push("scale"); }
            if (op.rotation !== undefined && op.rotation !== null) {
                if (layer.threeDLayer) { layer.property("Z Rotation").setValue(op.rotation); }
                else { layer.property("Rotation").setValue(op.rotation); }
                changed.push("rotation");
            }
            if (op.opacity !== undefined && op.opacity !== null) { layer.property("Opacity").setValue(op.opacity); changed.push("opacity"); }
            if (op.blendMode !== undefined && op.blendMode !== null) {
                var bModes = {"normal":BlendingMode.NORMAL,"add":BlendingMode.ADD,"multiply":BlendingMode.MULTIPLY,"screen":BlendingMode.SCREEN,"overlay":BlendingMode.OVERLAY,"softLight":BlendingMode.SOFT_LIGHT,"hardLight":BlendingMode.HARD_LIGHT,"darken":BlendingMode.DARKEN,"lighten":BlendingMode.LIGHTEN,"difference":BlendingMode.DIFFERENCE};
                if (bModes[op.blendMode] !== undefined) { layer.blendingMode = bModes[op.blendMode]; changed.push("blendMode"); }
            }
            if (op.startTime !== undefined && op.startTime !== null) { layer.startTime = op.startTime; changed.push("startTime"); }
            if (op.outPoint !== undefined && op.outPoint !== null) { layer.outPoint = op.outPoint; changed.push("outPoint"); }

            results.push({
                layerIndex: layer.index,
                name: layer.name,
                status: "success",
                threeDLayer: layer.threeDLayer,
                position: layer.property("Position").value,
                changedProperties: changed
            });
        }

        return JSON.stringify({ status: "success", results: results });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

/**
 * Sets a keyframe for a specific property on a layer.
 * Indices are 1-based for After Effects collections.
 * @param {number} compIndex - The index of the composition (1-based).
 * @param {number} layerIndex - The index of the layer within the composition (1-based).
 * @param {string} propertyName - The name of the property (e.g., "Position", "Scale", "Rotation", "Opacity").
 * @param {number} timeInSeconds - The time (in seconds) for the keyframe.
 * @param {any} value - The value for the keyframe (e.g., [x, y] for Position, [w, h] for Scale, angle for Rotation, percentage for Opacity).
 * @returns {string} JSON string indicating success or error.
 */
function setLayerKeyframe(compIndex, layerIndex, propertyName, timeInSeconds, value) {
    try {
        // Use 1-based indices as per After Effects API
        var comp = app.project.items[compIndex];
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, message: "Composition not found at index " + compIndex });
        }
        var layer = comp.layers[layerIndex];
        if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");
        if (!transformGroup) {
             return JSON.stringify({ success: false, message: "Transform properties not found for layer '" + layer.name + "' (type: " + layer.matchName + ")." });
        }

        var property = transformGroup.property(propertyName);
        if (!property) {
            // Check other common property groups if not in Transform
             if (layer.property("Effects") && layer.property("Effects").property(propertyName)) {
                 property = layer.property("Effects").property(propertyName);
             } else if (layer.property("Text") && layer.property("Text").property(propertyName)) {
                 property = layer.property("Text").property(propertyName);
            } // Add more groups if needed (e.g., Masks, Shapes)

            if (!property) {
                 return JSON.stringify({ success: false, message: "Property '" + propertyName + "' not found on layer '" + layer.name + "'." });
            }
        }


        // Ensure the property can be keyframed
        if (!property.canVaryOverTime) {
             return JSON.stringify({ success: false, message: "Property '" + propertyName + "' cannot be keyframed." });
        }

        // Make sure the property is enabled for keyframing
        if (property.numKeys === 0 && !property.isTimeVarying) {
             property.setValueAtTime(comp.time, property.value); // Set initial keyframe if none exist
        }


        property.setValueAtTime(timeInSeconds, value);

        return JSON.stringify({ success: true, message: "Keyframe set for '" + propertyName + "' on layer '" + layer.name + "' at " + timeInSeconds + "s." });
    } catch (e) {
        return JSON.stringify({ success: false, message: "Error setting keyframe: " + e.toString() + " (Line: " + e.line + ")" });
    }
}


/**
 * Sets an expression for a specific property on a layer.
 * @param {number} compIndex - The index of the composition (1-based).
 * @param {number} layerIndex - The index of the layer within the composition (1-based).
 * @param {string} propertyName - The name of the property (e.g., "Position", "Scale", "Rotation", "Opacity").
 * @param {string} expressionString - The JavaScript expression string. Use "" to remove expression.
 * @returns {string} JSON string indicating success or error.
 */
function setLayerExpression(compIndex, layerIndex, propertyName, expressionString) {
    try {
         // Adjust indices to be 0-based for ExtendScript arrays
        var comp = app.project.items[compIndex];
         if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, message: "Composition not found at index " + compIndex });
        }
        var layer = comp.layers[layerIndex];
         if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");
         if (!transformGroup) {
             // Allow expressions on non-transformable layers if property exists elsewhere
             // return JSON.stringify({ success: false, message: "Transform properties not found for layer '" + layer.name + "' (type: " + layer.matchName + ")." });
        }

        var property = transformGroup ? transformGroup.property(propertyName) : null;
         if (!property) {
            // Check other common property groups if not in Transform
             if (layer.property("Effects") && layer.property("Effects").property(propertyName)) {
                 property = layer.property("Effects").property(propertyName);
             } else if (layer.property("Text") && layer.property("Text").property(propertyName)) {
                 property = layer.property("Text").property(propertyName);
             }

            // Search inside individual effects for sub-properties
            if (!property && layer.property("Effects")) {
                var effects = layer.property("Effects");
                for (var ei = 1; ei <= effects.numProperties; ei++) {
                    var eff = effects.property(ei);
                    try {
                        var subProp = eff.property(propertyName);
                        if (subProp) { property = subProp; break; }
                    } catch (e2) {}
                }
            }

            if (!property) {
                 return JSON.stringify({ success: false, message: "Property '" + propertyName + "' not found on layer '" + layer.name + "'." });
            }
        }

        if (!property.canSetExpression) {
            return JSON.stringify({ success: false, message: "Property '" + propertyName + "' does not support expressions." });
        }

        property.expression = expressionString;

        var action = expressionString === "" ? "removed" : "set";
        var expressionError = "";
        try { expressionError = property.expressionError || ""; } catch (eCheck) { expressionError = ""; }

        if (expressionError) {
            return JSON.stringify({
                success: false,
                message: "Expression set for '" + propertyName + "' on layer '" + layer.name + "' but After Effects reports an expression error: " + expressionError,
                expressionError: expressionError
            });
        }

        return JSON.stringify({ success: true, message: "Expression " + action + " for '" + propertyName + "' on layer '" + layer.name + "'." });
    } catch (e) {
        return JSON.stringify({ success: false, message: "Error setting expression: " + e.toString() + " (Line: " + e.line + ")" });
    }
}

// --- applyEffect (from applyEffect.jsx) ---
function applyEffect(args) {
    try {
        // Extract parameters
        var compIndex = args.compIndex || 1; // Default to first comp
        var layerIndex = args.layerIndex || 1; // Default to first layer
        var effectName = args.effectName; // Name of the effect to apply
        var effectMatchName = args.effectMatchName; // After Effects internal name (more reliable)
        var effectCategory = args.effectCategory || ""; // Optional category for filtering
        var presetPath = args.presetPath; // Optional path to an effect preset
        var effectSettings = args.effectSettings || {}; // Optional effect parameters
        
        if (!effectName && !effectMatchName && !presetPath) {
            throw new Error("You must specify either effectName, effectMatchName, or presetPath");
        }
        
        // Find the composition by index
        var comp = app.project.item(compIndex);
        if (!comp || !(comp instanceof CompItem)) {
            throw new Error("Composition not found at index " + compIndex);
        }
        
        // Find the layer by index
        var layer = comp.layer(layerIndex);
        if (!layer) {
            throw new Error("Layer not found at index " + layerIndex + " in composition '" + comp.name + "'");
        }
        
        var effectResult;
        
        // Apply preset if a path is provided
        if (presetPath) {
            var presetFile = new File(presetPath);
            if (!presetFile.exists) {
                throw new Error("Effect preset file not found: " + presetPath);
            }
            
            // Apply the preset to the layer
            layer.applyPreset(presetFile);
            effectResult = {
                type: "preset",
                name: presetPath.split('/').pop().split('\\').pop(),
                applied: true
            };
        }
        // Apply effect by match name (more reliable method)
        else if (effectMatchName) {
            var effect = layer.Effects.addProperty(effectMatchName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
            
            // Apply settings if provided
            applyEffectSettings(effect, effectSettings);
        }
        // Apply effect by display name
        else {
            // Get the effect from the Effect menu
            var effect = layer.Effects.addProperty(effectName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
            
            // Apply settings if provided
            applyEffectSettings(effect, effectSettings);
        }
        
        return JSON.stringify({
            status: "success",
            message: "Effect applied successfully",
            effect: effectResult,
            layer: {
                name: layer.name,
                index: layerIndex
            },
            composition: {
                name: comp.name,
                index: compIndex
            }
        });
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        });
    }
}

// Helper function to apply effect settings
function applyEffectSettings(effect, settings) {
    // Skip if no settings are provided
    if (!settings) return;
    var hasKeys = false;
    for (var k in settings) { if (settings.hasOwnProperty(k)) { hasKeys = true; break; } }
    if (!hasKeys) return;
    
    // Iterate through all provided settings
    for (var propName in settings) {
        if (settings.hasOwnProperty(propName)) {
            try {
                // Find the property in the effect
                var property = null;
                
                // Try direct property access first
                try {
                    property = effect.property(propName);
                } catch (e) {
                    // If direct access fails, search through all properties
                    for (var i = 1; i <= effect.numProperties; i++) {
                        var prop = effect.property(i);
                        if (prop.name === propName) {
                            property = prop;
                            break;
                        }
                    }
                }
                
                // Set the property value if found
                if (property && property.setValue) {
                    property.setValue(settings[propName]);
                }
            } catch (e) {
                // Log error but continue with other properties
                $.writeln("Error setting effect property '" + propName + "': " + e.toString());
            }
        }
    }
}

// --- applyEffectTemplate (from applyEffectTemplate.jsx) ---
function applyEffectTemplate(args) {
    try {
        // Extract parameters
        var compIndex = args.compIndex || 1; // Default to first comp
        var layerIndex = args.layerIndex || 1; // Default to first layer
        var templateName = args.templateName; // Name of the template to apply
        var customSettings = args.customSettings || {}; // Optional customizations
        
        if (!templateName) {
            throw new Error("You must specify a templateName");
        }
        
        // Find the composition by index
        var comp = app.project.item(compIndex);
        if (!comp || !(comp instanceof CompItem)) {
            throw new Error("Composition not found at index " + compIndex);
        }
        
        // Find the layer by index
        var layer = comp.layer(layerIndex);
        if (!layer) {
            throw new Error("Layer not found at index " + layerIndex + " in composition '" + comp.name + "'");
        }
        
        // Template definitions
        var templates = {
            // Blur effects
            "gaussian-blur": {
                effectMatchName: "ADBE Gaussian Blur 2",
                settings: {
                    "Blurriness": customSettings.blurriness || 20
                }
            },
            "directional-blur": {
                effectMatchName: "ADBE Directional Blur",
                settings: {
                    "Direction": customSettings.direction || 0,
                    "Blur Length": customSettings.length || 10
                }
            },
            
            // Color correction effects
            "color-balance": {
                effectMatchName: "ADBE Color Balance (HLS)",
                settings: {
                    "Hue": customSettings.hue || 0,
                    "Lightness": customSettings.lightness || 0,
                    "Saturation": customSettings.saturation || 0
                }
            },
            "brightness-contrast": {
                effectMatchName: "ADBE Brightness & Contrast 2",
                settings: {
                    "Brightness": customSettings.brightness || 0,
                    "Contrast": customSettings.contrast || 0,
                    "Use Legacy": false
                }
            },
            "curves": {
                effectMatchName: "ADBE CurvesCustom",
                // Curves are complex and would need special handling
            },
            
            // Stylistic effects
            "glow": {
                effectMatchName: "ADBE Glo2",
                settings: {
                    "Glow Threshold": customSettings.threshold || 50,
                    "Glow Radius": customSettings.radius || 15,
                    "Glow Intensity": customSettings.intensity || 1
                }
            },
            "drop-shadow": {
                effectMatchName: "ADBE Drop Shadow",
                settings: {
                    "Shadow Color": customSettings.color || [0, 0, 0, 1],
                    "Opacity": customSettings.opacity || 50,
                    "Direction": customSettings.direction || 135,
                    "Distance": customSettings.distance || 10,
                    "Softness": customSettings.softness || 10
                }
            },
            
            // Common effect chains
            "cinematic-look": {
                effects: [
                    {
                        effectMatchName: "ADBE CurvesCustom",
                        settings: {}
                    },
                    {
                        effectMatchName: "ADBE Vibrance",
                        settings: {
                            "Vibrance": 15,
                            "Saturation": -5
                        }
                    }
                ]
            },
            "text-pop": {
                effects: [
                    {
                        effectMatchName: "ADBE Drop Shadow",
                        settings: {
                            "Shadow Color": [0, 0, 0, 1],
                            "Opacity": 75,
                            "Distance": 5,
                            "Softness": 10
                        }
                    },
                    {
                        effectMatchName: "ADBE Glo2",
                        settings: {
                            "Glow Threshold": 50,
                            "Glow Radius": 10,
                            "Glow Intensity": 1.5
                        }
                    }
                ]
            }
        };
        
        // Check if the requested template exists
        var template = templates[templateName];
        if (!template) {
            var availableTemplates = Object.keys(templates).join(", ");
            throw new Error("Template '" + templateName + "' not found. Available templates: " + availableTemplates);
        }
        
        var appliedEffects = [];
        
        // Apply single effect or multiple effects based on template structure
        if (template.effectMatchName) {
            // Single effect template
            var effect = layer.Effects.addProperty(template.effectMatchName);
            
            // Apply settings
            for (var propName in template.settings) {
                try {
                    var property = effect.property(propName);
                    if (property) {
                        property.setValue(template.settings[propName]);
                    }
                } catch (e) {
                    $.writeln("Warning: Could not set " + propName + " on effect " + effect.name + ": " + e);
                }
            }
            
            appliedEffects.push({
                name: effect.name,
                matchName: effect.matchName
            });
        } else if (template.effects) {
            // Multiple effects template
            for (var i = 0; i < template.effects.length; i++) {
                var effectData = template.effects[i];
                var effect = layer.Effects.addProperty(effectData.effectMatchName);
                
                // Apply settings
                for (var propName in effectData.settings) {
                    try {
                        var property = effect.property(propName);
                        if (property) {
                            property.setValue(effectData.settings[propName]);
                        }
                    } catch (e) {
                        $.writeln("Warning: Could not set " + propName + " on effect " + effect.name + ": " + e);
                    }
                }
                
                appliedEffects.push({
                    name: effect.name,
                    matchName: effect.matchName
                });
            }
        }
        
        return JSON.stringify({
            status: "success",
            message: "Effect template '" + templateName + "' applied successfully",
            appliedEffects: appliedEffects,
            layer: {
                name: layer.name,
                index: layerIndex
            },
            composition: {
                name: comp.name,
                index: compIndex
            }
        });
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        });
    }
}

// --- End of Function Definitions ---

// --- Bridge test function to verify communication and effects application ---
function bridgeTestEffects(args) {
    try {
        var compIndex = (args && args.compIndex) ? args.compIndex : 1;
        var layerIndex = (args && args.layerIndex) ? args.layerIndex : 1;

        // Apply a light Gaussian Blur
        var blurRes = JSON.parse(applyEffect({
            compIndex: compIndex,
            layerIndex: layerIndex,
            effectMatchName: "ADBE Gaussian Blur 2",
            effectSettings: { "Blurriness": 5 }
        }));

        // Apply a simple drop shadow via template
        var shadowRes = JSON.parse(applyEffectTemplate({
            compIndex: compIndex,
            layerIndex: layerIndex,
            templateName: "drop-shadow"
        }));

        return JSON.stringify({
            status: "success",
            message: "Bridge test effects applied.",
            results: [blurRes, shadowRes]
        });
    } catch (e) {
        return JSON.stringify({ status: "error", message: e.toString() });
    }
}

// JSON polyfill for ExtendScript (when JSON is undefined)
if (typeof JSON === "undefined") {
    JSON = {};
}
if (typeof JSON.parse !== "function") {
    JSON.parse = function (text) {
        // Safe-ish fallback for trusted input (our own command file)
        return eval("(" + text + ")");
    };
}
if (typeof JSON.stringify !== "function") {
    (function () {
        function esc(str) {
            return (str + "")
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t");
        }
        function toJSON(val) {
            if (val === null) return "null";
            var t = typeof val;
            if (t === "number" || t === "boolean") return String(val);
            if (t === "string") return '"' + esc(val) + '"';
            if (val instanceof Array) {
                var a = [];
                for (var i = 0; i < val.length; i++) a.push(toJSON(val[i]));
                return "[" + a.join(",") + "]";
            }
            if (t === "object") {
                var props = [];
                for (var k in val) {
                    if (val.hasOwnProperty(k) && typeof val[k] !== "function" && typeof val[k] !== "undefined") {
                        props.push('"' + esc(k) + '":' + toJSON(val[k]));
                    }
                }
                return "{" + props.join(",") + "}";
            }
            return "null";
        }
        JSON.stringify = function (value, _replacer, _space) {
            return toJSON(value);
        };
    })();
}

// Detect AE version (AE 2025 = version 25.x, AE 2026 = version 26.x)
var aeVersion = parseFloat(app.version);
var isAE2025OrLater = aeVersion >= 25.0;

// Always create a floating palette window for AE 2025+
var panel = new Window("palette", "MCP Bridge Auto", undefined);
panel.orientation = "column";
panel.alignChildren = ["fill", "top"];
panel.spacing = 10;
panel.margins = 16;

// Status display
var statusText = panel.add("statictext", undefined, "Waiting for commands...");
statusText.alignment = ["fill", "top"];

// Add log area
var logPanel = panel.add("panel", undefined, "Command Log");
logPanel.orientation = "column";
logPanel.alignChildren = ["fill", "fill"];
var logText = logPanel.add("edittext", undefined, "", {multiline: true, readonly: true});
logText.preferredSize.height = 200;

// AE 2025 warning
if (isAE2025OrLater) {
    var warning = panel.add("statictext", undefined, "AE 2025+: Dockable panels are not supported. Floating window only.");
    warning.graphics.foregroundColor = warning.graphics.newPen(warning.graphics.PenType.SOLID_COLOR, [1,0.3,0,1], 1);
}

// Auto-run checkbox
var autoRunCheckbox = panel.add("checkbox", undefined, "Auto-run commands");
autoRunCheckbox.value = true;

// Check interval (ms) - lower value means AE picks up queued MCP commands faster
var checkInterval = 500;
var isChecking = false;

// Command file path - use Documents folder for reliable access
function getCommandFilePath() {
    var userFolder = Folder.myDocuments;
    var bridgeFolder = new Folder(userFolder.fsName + "/ae-mcp-bridge");
    if (!bridgeFolder.exists) {
        bridgeFolder.create();
    }
    return bridgeFolder.fsName + "/ae_command.json";
}

// Result file path - use Documents folder for reliable access
function getResultFilePath() {
    var userFolder = Folder.myDocuments;
    var bridgeFolder = new Folder(userFolder.fsName + "/ae-mcp-bridge");
    if (!bridgeFolder.exists) {
        bridgeFolder.create();
    }
    return bridgeFolder.fsName + "/ae_mcp_result.json";
}

// --- setCompositionProperties: set duration, frameRate, etc. on active or named comp ---
function setCompositionProperties(args) {
    try {
        var compName = args.compName || "";
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
        if (!comp) {
            if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
            else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
        }
        var changed = [];
        if (args.duration !== undefined && args.duration !== null) { comp.duration = args.duration; changed.push("duration"); }
        if (args.frameRate !== undefined && args.frameRate !== null) { comp.frameRate = args.frameRate; changed.push("frameRate"); }
        if (args.width !== undefined && args.width !== null && args.height !== undefined && args.height !== null) {
            comp.width = args.width; comp.height = args.height; changed.push("dimensions");
        }
        return JSON.stringify({
            status: "success",
            composition: { name: comp.name, duration: comp.duration, frameRate: comp.frameRate, width: comp.width, height: comp.height },
            changedProperties: changed
        });
    } catch (error) {
        return JSON.stringify({ status: "error", message: error.toString() });
    }
}

// Functions for each script type
function getProjectInfo() {
    var project = app.project;
    var result = {
        projectName: project.file ? project.file.name : "Untitled Project",
        path: project.file ? project.file.fsName : "",
        numItems: project.numItems,
        bitsPerChannel: project.bitsPerChannel,
        timeMode: project.timeDisplayType === TimeDisplayType.FRAMES ? "Frames" : "Timecode",
        items: []
    };

    // Count item types
    var countByType = {
        compositions: 0,
        footage: 0,
        folders: 0,
        solids: 0
    };

    // Get item information (limited for performance)
    for (var i = 1; i <= Math.min(project.numItems, 50); i++) {
        var item = project.item(i);
        var itemType = "";
        
        if (item instanceof CompItem) {
            itemType = "Composition";
            countByType.compositions++;
        } else if (item instanceof FolderItem) {
            itemType = "Folder";
            countByType.folders++;
        } else if (item instanceof FootageItem) {
            if (item.mainSource instanceof SolidSource) {
                itemType = "Solid";
                countByType.solids++;
            } else {
                itemType = "Footage";
                countByType.footage++;
            }
        }
        
        result.items.push({
            id: item.id,
            name: item.name,
            type: itemType
        });
    }
    
    result.itemCounts = countByType;

    // Include active composition metadata if available
    if (app.project.activeItem instanceof CompItem) {
        var ac = app.project.activeItem;
        result.activeComp = {
            id: ac.id,
            name: ac.name,
            width: ac.width,
            height: ac.height,
            duration: ac.duration,
            frameRate: ac.frameRate,
            numLayers: ac.numLayers
        };
    }

    return JSON.stringify(result);
}

function listCompositions() {
    var project = app.project;
    var result = {
        compositions: []
    };
    
    // Loop through items in the project
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        
        // Check if the item is a composition
        if (item instanceof CompItem) {
            result.compositions.push({
                id: item.id,
                name: item.name,
                duration: item.duration,
                frameRate: item.frameRate,
                width: item.width,
                height: item.height,
                numLayers: item.numLayers
            });
        }
    }
    
    return JSON.stringify(result);
}

function getLayerInfo() {
    var project = app.project;
    var result = {
        layers: []
    };
    
    // Get the active composition
    var activeComp = null;
    if (app.project.activeItem instanceof CompItem) {
        activeComp = app.project.activeItem;
    } else {
        return JSON.stringify({ error: "No active composition" });
    }
    
    // Loop through layers in the active composition
    for (var i = 1; i <= activeComp.numLayers; i++) {
        var layer = activeComp.layer(i);
        var layerInfo = {
            index: layer.index,
            name: layer.name,
            enabled: layer.enabled,
            locked: layer.locked,
            threeDLayer: layer.threeDLayer,
            position: layer.property("Position").value,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint
        };
        
        result.layers.push(layerInfo);
    }
    
    return JSON.stringify(result);
}

// --- Shared helpers for new commands (batch, reorder, parent, preview, color analysis) ---

// Find a composition by name, falling back to the active composition.
function findCompByName(compName) {
    var comp = null;
    if (compName) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) { comp = item; break; }
        }
    }
    if (!comp) {
        if (app.project.activeItem instanceof CompItem) { comp = app.project.activeItem; }
        else { throw new Error("No composition found with name '" + compName + "' and no active composition"); }
    }
    return comp;
}

// Find a layer within a composition by 1-based index or by name.
function findLayerInComp(comp, layerIndex, layerName) {
    var layer = null;
    if (layerIndex !== undefined && layerIndex !== null) {
        if (layerIndex > 0 && layerIndex <= comp.numLayers) { layer = comp.layer(layerIndex); }
        else { throw new Error("Layer index out of bounds: " + layerIndex); }
    } else if (layerName) {
        for (var j = 1; j <= comp.numLayers; j++) {
            if (comp.layer(j).name === layerName) { layer = comp.layer(j); break; }
        }
    }
    if (!layer) { throw new Error("Layer not found: " + (layerName || "index " + layerIndex)); }
    return layer;
}

// Classify a layer for context-rich snapshots.
function getLayerType(layer) {
    try {
        if (layer instanceof CameraLayer) return "camera";
        if (layer instanceof LightLayer) return "light";
        if (layer instanceof TextLayer) return "text";
        if (layer instanceof ShapeLayer) return "shape";
        if (layer.nullLayer) return "null";
        if (layer instanceof AVLayer) {
            if (layer.adjustmentLayer) return "adjustment";
            var src = layer.source;
            if (src && src instanceof CompItem) return "precomp";
            if (src && src.mainSource && (src.mainSource instanceof SolidSource)) return "solid";
            return "footage";
        }
    } catch (e) {}
    return "layer";
}

// Rich snapshot of a composition's current layer stack, used to give the AI
// as much situational context as possible without an extra round trip.
// Recursively walk every property on every layer in a comp and collect any active
// expression errors, so they surface through the bridge instead of only showing as a
// small warning triangle inside After Effects' own UI.
function findExpressionErrors(comp) {
    var errors = [];
    function walk(propGroup, layerName) {
        var count;
        try { count = propGroup.numProperties; } catch (eCount) { return; }
        for (var i = 1; i <= count; i++) {
            var prop;
            try { prop = propGroup.property(i); } catch (eProp) { continue; }
            if (!prop) continue;
            try {
                if (prop.propertyType === PropertyType.PROPERTY) {
                    if (prop.expressionEnabled && prop.expressionError) {
                        errors.push({ layer: layerName, property: prop.name, matchName: prop.matchName, error: prop.expressionError });
                    }
                } else {
                    walk(prop, layerName);
                }
            } catch (eWalk) { /* Some properties throw just by being introspected; skip them. */ }
        }
    }
    for (var li = 1; li <= comp.numLayers; li++) {
        var layer = comp.layer(li);
        try { walk(layer, layer.name); } catch (eLayer) {}
    }
    return errors;
}

function getCompSnapshot(comp) {
    var layers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        var info = { index: l.index, name: l.name, type: getLayerType(l) };
        try { info.enabled = l.enabled; } catch (e) {}
        try { info.locked = l.locked; } catch (e) {}
        try { info.threeDLayer = l.threeDLayer; } catch (e) {}
        try { info.parent = l.parent ? l.parent.name : null; } catch (e) { info.parent = null; }
        try { info.inPoint = l.inPoint; } catch (e) {}
        try { info.outPoint = l.outPoint; } catch (e) {}
        try { info.position = l.property("Position") ? l.property("Position").value : undefined; } catch (e) {}
        try { info.scale = l.property("Scale") ? l.property("Scale").value : undefined; } catch (e) {}
        try { info.opacity = l.property("Opacity") ? l.property("Opacity").value : undefined; } catch (e) {}
        try { info.blendMode = l.blendingMode; } catch (e) {}
        try { info.trackMatteType = l.trackMatteType; } catch (e) {}
        try { info.hasMask = !!(l.property("Masks") && l.property("Masks").numProperties > 0); } catch (e) { info.hasMask = false; }
        try { info.numEffects = l.property("Effects") ? l.property("Effects").numProperties : 0; } catch (e) { info.numEffects = 0; }
        layers.push(info);
    }
    var expressionErrors = [];
    try { expressionErrors = findExpressionErrors(comp); } catch (eExpr) {}

    return {
        compName: comp.name,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate,
        numLayers: comp.numLayers,
        layers: layers,
        expressionErrors: expressionErrors
    };
}

// True if a dispatched command's result object represents a failure,
// regardless of which of the two result shapes used across this file it follows.
function isErrorResult(obj) {
    if (!obj || typeof obj !== "object") return true;
    if (obj.status === "error") return true;
    if (obj.success === false) return true;
    return false;
}

// Central command dispatcher. Always returns a plain object (never a JSON string),
// so it can be reused both for single commands and for batchExecute's loop.
function dispatchCommand(command, args) {
    var raw;
    switch (command) {
        case "getProjectInfo":
            raw = getProjectInfo();
            break;
        case "listCompositions":
            raw = listCompositions();
            break;
        case "getLayerInfo":
            raw = getLayerInfo();
            break;
        case "createComposition":
            raw = createComposition(args);
            break;
        case "createTextLayer":
            raw = createTextLayer(args);
            break;
        case "createShapeLayer":
            raw = createShapeLayer(args);
            break;
        case "createSolidLayer":
            raw = createSolidLayer(args);
            break;
        case "setLayerProperties":
            raw = setLayerProperties(args);
            break;
        case "setLayerKeyframe":
            raw = setLayerKeyframe(args.compIndex, args.layerIndex, args.propertyName, args.timeInSeconds, args.value);
            break;
        case "setLayerExpression":
            raw = setLayerExpression(args.compIndex, args.layerIndex, args.propertyName, args.expressionString);
            break;
        case "applyEffect":
            raw = applyEffect(args);
            break;
        case "applyEffectTemplate":
            raw = applyEffectTemplate(args);
            break;
        case "bridgeTestEffects":
            raw = bridgeTestEffects(args);
            break;
        case "createCamera":
            raw = createCamera(args);
            break;
        case "batchSetLayerProperties":
            raw = batchSetLayerProperties(args);
            break;
        case "setCompositionProperties":
            raw = setCompositionProperties(args);
            break;
        case "duplicateLayer":
            raw = duplicateLayer(args);
            break;
        case "deleteLayer":
            raw = deleteLayer(args);
            break;
        case "setLayerMask":
            raw = setLayerMask(args);
            break;
        case "batchExecute":
            return batchExecute(args);
        case "reorderLayer":
            return reorderLayer(args);
        case "setLayerParent":
            return setLayerParent(args);
        case "renderPreviewFrame":
            return renderPreviewFrame(args);
        case "analyzeLayerColors":
            return analyzeLayerColors(args);
        case "dumpKeyframes":
            return dumpKeyframes(args);
        case "removeEffect":
            return removeEffect(args);
        case "listLayerEffects":
            return listLayerEffects(args);
        default:
            return { status: "error", message: "Unknown command: " + command };
    }
    // Legacy functions above return a JSON string; normalize to an object.
    try {
        return JSON.parse(raw);
    } catch (parseError) {
        return { status: "error", message: "Failed to parse result for '" + command + "': " + parseError.toString(), raw: String(raw) };
    }
}

// --- listLayerEffects: introspect the effects already applied to a layer (names, matchNames,
// current property values/ranges) so callers can discover exact property names/matchNames
// instead of guessing them (there is no scriptable way to enumerate every installed effect
// in ExtendScript, but every effect's own properties ARE fully introspectable once applied). ---
function propertyValueTypeName(t) {
    var names = {};
    try { names[PropertyValueType.NO_VALUE] = "NO_VALUE"; } catch (e) {}
    try { names[PropertyValueType.ThreeD_SPATIAL] = "3D_SPATIAL"; } catch (e) {}
    try { names[PropertyValueType.ThreeD] = "3D"; } catch (e) {}
    try { names[PropertyValueType.TwoD_SPATIAL] = "2D_SPATIAL"; } catch (e) {}
    try { names[PropertyValueType.TwoD] = "2D"; } catch (e) {}
    try { names[PropertyValueType.OneD] = "1D (number)"; } catch (e) {}
    try { names[PropertyValueType.COLOR] = "COLOR"; } catch (e) {}
    try { names[PropertyValueType.CUSTOM_VALUE] = "CUSTOM"; } catch (e) {}
    try { names[PropertyValueType.MARKER] = "MARKER"; } catch (e) {}
    try { names[PropertyValueType.LAYER_INDEX] = "LAYER_INDEX"; } catch (e) {}
    try { names[PropertyValueType.MASK_INDEX] = "MASK_INDEX"; } catch (e) {}
    try { names[PropertyValueType.SHAPE] = "SHAPE"; } catch (e) {}
    try { names[PropertyValueType.TEXT_DOCUMENT] = "TEXT_DOCUMENT"; } catch (e) {}
    return names[t] !== undefined ? names[t] : ("unknown(" + t + ")");
}

function dumpEffectProperty(prop) {
    var info = { name: prop.name, matchName: prop.matchName };
    try {
        info.propertyType = prop.propertyType === PropertyType.PROPERTY ? "PROPERTY"
            : (prop.propertyType === PropertyType.INDEXED_GROUP ? "INDEXED_GROUP" : "NAMED_GROUP");
    } catch (e) {}
    if (prop.propertyType === PropertyType.PROPERTY) {
        try { info.valueType = propertyValueTypeName(prop.propertyValueType); } catch (e) {}
        try { info.value = prop.value; } catch (e) {}
        try { info.canVaryOverTime = prop.canVaryOverTime; } catch (e) {}
        try { info.numKeys = prop.numKeys; } catch (e) {}
        try {
            info.expressionEnabled = prop.expressionEnabled;
            if (prop.expressionEnabled) {
                info.expression = prop.expression;
                info.expressionError = prop.expressionError || "";
            }
        } catch (e) {}
        try { if (prop.minValue !== undefined) info.minValue = prop.minValue; } catch (e) {}
        try { if (prop.maxValue !== undefined) info.maxValue = prop.maxValue; } catch (e) {}
    }
    return info;
}

function listLayerEffects(args) {
    try {
        var comp = findCompByName(args.compName);
        var layer = findLayerInComp(comp, args.layerIndex, args.layerName);
        var effectsGroup = layer.property("Effects");
        if (!effectsGroup) {
            return { status: "success", layer: { name: layer.name, index: layer.index }, effects: [] };
        }
        var effects = [];
        for (var i = 1; i <= effectsGroup.numProperties; i++) {
            var eff = effectsGroup.property(i);
            var effInfo = { index: i, name: eff.name, matchName: eff.matchName, properties: [] };
            try { effInfo.enabled = eff.enabled; } catch (e) {}
            for (var j = 1; j <= eff.numProperties; j++) {
                var p;
                try { p = eff.property(j); } catch (eP) { continue; }
                if (!p) continue;
                effInfo.properties.push(dumpEffectProperty(p));
            }
            effects.push(effInfo);
        }
        return { status: "success", layer: { name: layer.name, index: layer.index }, effects: effects };
    } catch (error) {
        return { status: "error", message: error.toString() + (error.line ? " (line " + error.line + ")" : "") };
    }
}

// --- removeEffect: remove an effect from a layer by its effect index (1-based) or matchName ---
function removeEffect(args) {
    try {
        var comp = findCompByName(args.compName);
        var layer = findLayerInComp(comp, args.layerIndex, args.layerName);
        var effects = layer.property("Effects");
        if (!effects || effects.numProperties === 0) {
            return { status: "error", message: "Layer '" + layer.name + "' has no effects." };
        }
        var removed = [];
        if (args.effectMatchName) {
            for (var i = effects.numProperties; i >= 1; i--) {
                var eff = effects.property(i);
                if (eff.matchName === args.effectMatchName) { removed.push(eff.name); eff.remove(); }
            }
        } else if (args.effectIndex) {
            var e2 = effects.property(args.effectIndex);
            removed.push(e2.name);
            e2.remove();
        } else {
            // No selector given: clear all effects on the layer.
            for (var j = effects.numProperties; j >= 1; j--) {
                removed.push(effects.property(j).name);
                effects.property(j).remove();
            }
        }
        return { status: "success", message: "Removed effect(s): " + removed.join(", "), layer: { name: layer.name, index: layer.index } };
    } catch (error) {
        return { status: "error", message: error.toString() + (error.line ? " (line " + error.line + ")" : "") };
    }
}

// --- dumpKeyframes: diagnostic dump of existing keyframe times/values for a layer's key properties ---
function dumpKeyframes(args) {
    try {
        var comp = findCompByName(args.compName);
        var propNames = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
        var layers = [];
        var layerIndices = args.layerIndices;
        var i;
        if (!layerIndices || !layerIndices.length) {
            layerIndices = [];
            for (i = 1; i <= comp.numLayers; i++) { layerIndices.push(i); }
        }
        for (var li = 0; li < layerIndices.length; li++) {
            var layer = comp.layer(layerIndices[li]);
            if (!layer) continue;
            var layerDump = { index: layer.index, name: layer.name, inPoint: layer.inPoint, outPoint: layer.outPoint, properties: {} };
            for (var p = 0; p < propNames.length; p++) {
                var prop = layer.property("Transform").property(propNames[p]);
                if (!prop) continue;
                var keys = [];
                for (var k = 1; k <= prop.numKeys; k++) {
                    keys.push({ time: prop.keyTime(k), value: prop.keyValue(k) });
                }
                layerDump.properties[propNames[p]] = {
                    numKeys: prop.numKeys,
                    hasExpression: prop.expressionEnabled === true,
                    expression: prop.expressionEnabled ? prop.expression : "",
                    currentValue: prop.value,
                    keys: keys
                };
            }
            layers.push(layerDump);
        }
        return { status: "success", compName: comp.name, compDuration: comp.duration, compTime: comp.time, layers: layers };
    } catch (error) {
        return { status: "error", message: error.toString() + (error.line ? " (line " + error.line + ")" : "") };
    }
}

// --- batchExecute: run several operations (any command dispatchCommand supports) in one go ---
function batchExecute(args) {
    var operations = args && args.operations;
    if (!operations || !operations.length) {
        return { status: "error", message: "No operations provided. Pass args.operations as an array of {command, args}." };
    }
    var stopOnError = !!(args && args.stopOnError);
    var includeSnapshot = !(args && args.includeSnapshot === false);
    var lastCompName = args ? args.compName : undefined;

    var results = [];
    var successCount = 0;
    var errorCount = 0;

    app.beginUndoGroup("MCP Batch Execute (" + operations.length + " ops)");
    try {
        for (var i = 0; i < operations.length; i++) {
            var op = operations[i] || {};
            var opResult;
            try {
                opResult = dispatchCommand(op.command, op.args || {});
            } catch (e) {
                opResult = { status: "error", message: e.toString() + (e.line ? " (line " + e.line + ")" : "") };
            }
            var failed = isErrorResult(opResult);
            if (failed) { errorCount++; } else { successCount++; }
            results.push({ index: i, command: op.command, status: failed ? "error" : "success", result: opResult });
            if (op.args && op.args.compName) { lastCompName = op.args.compName; }
            if (failed && stopOnError) { break; }
        }
    } finally {
        app.endUndoGroup();
    }

    var response = {
        status: errorCount === 0 ? "success" : (successCount === 0 ? "error" : "partial"),
        totalOperations: operations.length,
        executedOperations: results.length,
        successCount: successCount,
        errorCount: errorCount,
        results: results
    };

    if (includeSnapshot) {
        try {
            response.compSnapshot = getCompSnapshot(findCompByName(lastCompName));
        } catch (e) {
            // No resolvable composition - omit the snapshot rather than failing the whole batch.
        }
    }

    return response;
}

// --- reorderLayer: change a layer's position in the stacking order ---
function reorderLayer(args) {
    try {
        var comp = findCompByName(args.compName);
        var layer = findLayerInComp(comp, args.layerIndex, args.layerName);
        var position = args.position || "end";

        if (position === "beginning") {
            layer.moveToBeginning();
        } else if (position === "end") {
            layer.moveToEnd();
        } else if (position === "before" || position === "after") {
            var refLayer = findLayerInComp(comp, args.referenceLayerIndex, args.referenceLayerName);
            if (position === "before") { layer.moveBefore(refLayer); }
            else { layer.moveAfter(refLayer); }
        } else {
            throw new Error("Invalid position '" + position + "'. Use 'beginning', 'end', 'before', or 'after'.");
        }

        return {
            status: "success",
            message: "Layer reordered successfully",
            layer: { name: layer.name, index: layer.index }
        };
    } catch (error) {
        return { status: "error", message: error.toString() };
    }
}

// --- setLayerParent: set or clear a layer's parent (rigging) ---
function setLayerParent(args) {
    try {
        var comp = findCompByName(args.compName);
        var layer = findLayerInComp(comp, args.layerIndex, args.layerName);

        if (args.parentLayerIndex === undefined && args.parentLayerName === undefined) {
            layer.parent = null;
            return { status: "success", message: "Parent cleared", layer: { name: layer.name, index: layer.index, parent: null } };
        }

        var parentLayer = findLayerInComp(comp, args.parentLayerIndex, args.parentLayerName);
        if (parentLayer.index === layer.index) {
            throw new Error("A layer cannot be its own parent.");
        }
        layer.parent = parentLayer;

        return {
            status: "success",
            message: "Parent set successfully",
            layer: { name: layer.name, index: layer.index, parent: parentLayer.name }
        };
    } catch (error) {
        return { status: "error", message: error.toString() };
    }
}

// --- renderPreviewFrame: rasterize one frame of a composition to PNG via the Render Queue ---
// (There is no direct "screenshot" API in ExtendScript; the Render Queue is the
// documented, scriptable way to get a still frame out of After Effects.)
function renderPreviewFrame(args) {
    var tempComp = null;
    var rqItem = null;
    try {
        var comp = findCompByName(args.compName);
        var time = (args.timeInSeconds !== undefined && args.timeInSeconds !== null) ? parseFloat(args.timeInSeconds) : comp.time;
        if (isNaN(time) || time < 0) { time = 0; }
        var maxTime = Math.max(0, comp.duration - (1 / comp.frameRate));
        if (time > maxTime) { time = maxTime; }

        var renderComp = comp;
        var maxWidth = args.maxWidth ? parseInt(args.maxWidth, 10) : null;
        if (maxWidth && maxWidth > 0 && maxWidth < comp.width) {
            var scale = maxWidth / comp.width;
            var newW = Math.max(2, Math.round(comp.width * scale));
            var newH = Math.max(2, Math.round(comp.height * scale));
            tempComp = app.project.items.addComp("__mcp_preview_temp__", newW, newH, comp.pixelAspect, comp.duration, comp.frameRate);
            var nestedLayer = tempComp.layers.add(comp);
            nestedLayer.property("Transform").property("Scale").setValue([scale * 100, scale * 100]);
            renderComp = tempComp;
        }

        var bridgeDir = Folder.myDocuments.fsName + "/ae-mcp-bridge";
        var previewFolder = new Folder(bridgeDir + "/previews");
        if (!previewFolder.exists) { previewFolder.create(); }

        var baseName = "preview_" + new Date().getTime();

        var rq = app.project.renderQueue;
        rqItem = rq.items.add(renderComp);
        rqItem.timeSpanStart = time;
        rqItem.timeSpanDuration = 1 / renderComp.frameRate;
        rqItem.render = true;

        // This AE install's default templates don't include a PNG Sequence template, and
        // om.getSettings()/setSettings() (the scripting API for forcing the format directly)
        // throws in this AE version. "TIFF Sequence with Alpha" is a real, reliably-present
        // still-image template though, so render to TIFF and let the Node side convert to PNG.
        var om = rqItem.outputModule(1);
        var templates = om.templates;
        var chosen = null;
        var t;
        for (t = 0; t < templates.length; t++) {
            if (/tiff/i.test(templates[t])) { chosen = templates[t]; break; }
        }
        if (!chosen) {
            throw new Error("No TIFF-capable Output Module template found. Available templates: " + templates.join(", "));
        }
        om.applyTemplate(chosen);
        om.file = new File(previewFolder.fsName + "/" + baseName + "_[#####].tif");

        rq.showWindow(false);
        rq.render(); // Blocking - returns once this single frame has been written.

        var matches = previewFolder.getFiles(baseName + "*");
        if (!matches || !matches.length) {
            throw new Error("Render completed but no output file matching '" + baseName + "*' was found in " + previewFolder.fsName);
        }
        matches.sort(function (a, b) { return b.modified - a.modified; });
        var resultFile = matches[0];

        var expressionErrors = [];
        try { expressionErrors = findExpressionErrors(comp); } catch (eExpr) {}

        return {
            status: "success",
            message: "Preview frame rendered successfully" + (expressionErrors.length ? (" (" + expressionErrors.length + " expression error(s) found - see expressionErrors)") : ""),
            file: resultFile.fsName,
            composition: comp.name,
            timeInSeconds: time,
            width: renderComp.width,
            height: renderComp.height,
            expressionErrors: expressionErrors
        };
    } catch (error) {
        return { status: "error", message: error.toString() + (error.line ? " (line " + error.line + ")" : "") };
    } finally {
        if (rqItem) { try { rqItem.remove(); } catch (e) {} }
        if (tempComp) { try { tempComp.remove(); } catch (e) {} }
    }
}

// --- analyzeLayerColors: sample a layer (e.g. an imported logo) for a dominant color palette ---
// AVLayer has no scripting-API sampleImage(); it is expression-only. We bridge to it by
// pointing a scratch Color Control effect's expression at sampleImage() and reading the
// evaluated value back via Property.valueAtTime(), which AE's own docs note will wait for
// expressions like sampleImage to finish evaluating.
function analyzeLayerColors(args) {
    var tempLayer = null;
    try {
        var comp = findCompByName(args.compName);
        var layer = findLayerInComp(comp, args.layerIndex, args.layerName);
        var time = (args.timeInSeconds !== undefined && args.timeInSeconds !== null) ? parseFloat(args.timeInSeconds) : comp.time;
        var gridSize = args.gridSize ? Math.max(2, Math.min(12, parseInt(args.gridSize, 10))) : 5;

        if (!layer.sourceRectAtTime) {
            throw new Error("Layer '" + layer.name + "' does not support sourceRectAtTime (not a visual/footage-based layer).");
        }
        var rect = layer.sourceRectAtTime(time, false);

        tempLayer = comp.layers.addSolid([0, 0, 0], "__mcp_color_probe__", 4, 4, comp.pixelAspect);
        tempLayer.enabled = false; // Keep the probe out of the visible/rendered comp.
        var colorControl = tempLayer.property("Effects").addProperty("ADBE Color Control");
        var colorProp = colorControl.property("Color");

        var samples = [];
        var gx, gy;
        for (gy = 0; gy < gridSize; gy++) {
            for (gx = 0; gx < gridSize; gx++) {
                var px = rect.left + (rect.width * (gx + 0.5)) / gridSize;
                var py = rect.top + (rect.height * (gy + 0.5)) / gridSize;
                var expr = "thisComp.layer(" + layer.index + ").sampleImage([" + px + "," + py + "], [1,1], true, " + time + ")";
                colorProp.expression = expr;
                var rgba = colorProp.valueAtTime(time, false);
                if (rgba && rgba.length >= 4 && rgba[3] > 0.1) {
                    samples.push([rgba[0], rgba[1], rgba[2], rgba[3]]);
                }
            }
        }
        colorProp.expression = "";

        if (!samples.length) {
            return {
                status: "success",
                message: "No opaque pixels found to sample (layer may be fully transparent at this time/area).",
                layer: { name: layer.name, index: layer.index },
                sampledPoints: gridSize * gridSize,
                opaqueSamples: 0,
                palette: [],
                averageColor: null
            };
        }

        var sum = [0, 0, 0];
        var s;
        for (s = 0; s < samples.length; s++) {
            sum[0] += samples[s][0]; sum[1] += samples[s][1]; sum[2] += samples[s][2];
        }
        var avg = [sum[0] / samples.length, sum[1] / samples.length, sum[2] / samples.length];

        // Bucket similar colors together (round to the nearest 1/16th per channel) to find dominant colors.
        var buckets = {};
        var bucketStep = 1 / 16;
        var b;
        for (b = 0; b < samples.length; b++) {
            var rr = Math.round(samples[b][0] / bucketStep) * bucketStep;
            var gg = Math.round(samples[b][1] / bucketStep) * bucketStep;
            var bb = Math.round(samples[b][2] / bucketStep) * bucketStep;
            var key = rr.toFixed(3) + "," + gg.toFixed(3) + "," + bb.toFixed(3);
            if (!buckets[key]) { buckets[key] = { rgb: [rr, gg, bb], count: 0 }; }
            buckets[key].count++;
        }
        var bucketList = [];
        for (var k in buckets) { if (buckets.hasOwnProperty(k)) { bucketList.push(buckets[k]); } }
        bucketList.sort(function (a, b2) { return b2.count - a.count; });

        function toHex(v) {
            var n = Math.round(Math.max(0, Math.min(1, v)) * 255);
            var hx = n.toString(16);
            return hx.length === 1 ? "0" + hx : hx;
        }
        function toPaletteEntry(rgb01, count) {
            return {
                rgb01: [rgb01[0], rgb01[1], rgb01[2]],
                rgb255: [Math.round(rgb01[0] * 255), Math.round(rgb01[1] * 255), Math.round(rgb01[2] * 255)],
                hex: "#" + toHex(rgb01[0]) + toHex(rgb01[1]) + toHex(rgb01[2]),
                frequency: count / samples.length,
                sampleCount: count
            };
        }

        var palette = [];
        var maxPaletteEntries = Math.min(5, bucketList.length);
        for (var p = 0; p < maxPaletteEntries; p++) {
            palette.push(toPaletteEntry(bucketList[p].rgb, bucketList[p].count));
        }

        return {
            status: "success",
            message: "Color analysis complete",
            layer: { name: layer.name, index: layer.index },
            sourceRect: rect,
            sampledPoints: gridSize * gridSize,
            opaqueSamples: samples.length,
            averageColor: toPaletteEntry(avg, samples.length),
            palette: palette
        };
    } catch (error) {
        return { status: "error", message: error.toString() + (error.line ? " (line " + error.line + ")" : "") };
    } finally {
        if (tempLayer) { try { tempLayer.remove(); } catch (e) {} }
    }
}

// Execute command
function executeCommand(command, args) {
    logToPanel("Executing command: " + command);
    statusText.text = "Running: " + command;
    panel.update();

    try {
        logToPanel("Dispatching command: " + command);
        var resultObj = dispatchCommand(command, args);
        if (!resultObj || typeof resultObj !== "object") {
            resultObj = { status: "error", message: "Command produced no result" };
        }
        logToPanel("Execution finished for: " + command);

        // Add tracking fields directly on the result object (already a plain object).
        resultObj._responseTimestamp = toISOStringSafe(new Date());
        resultObj._commandExecuted = command;
        var resultString = JSON.stringify(resultObj);

        var resultFile = new File(getResultFilePath());
        resultFile.encoding = "UTF-8"; // Ensure UTF-8 encoding
        logToPanel("Opening result file for writing...");
        var opened = resultFile.open("w");
        if (!opened) {
            logToPanel("ERROR: Failed to open result file for writing: " + resultFile.fsName);
            throw new Error("Failed to open result file for writing.");
        }
        logToPanel("Writing to result file...");
        var written = resultFile.write(resultString);
        if (!written) {
             logToPanel("ERROR: Failed to write to result file (write returned false): " + resultFile.fsName);
             // Still try to close, but log the error
        }
        logToPanel("Closing result file...");
        var closed = resultFile.close();
         if (!closed) {
             logToPanel("ERROR: Failed to close result file: " + resultFile.fsName);
             // Continue, but log the error
        }
        logToPanel("Result file write process complete.");
        
        logToPanel("Command completed successfully: " + command); // Changed log message
        statusText.text = "Command completed: " + command;
        
        // Update command file status
        logToPanel("Updating command status to completed...");
        updateCommandStatus("completed");
        logToPanel("Command status updated.");
        
    } catch (error) {
        var errorMsg = "ERROR in executeCommand for '" + command + "': " + error.toString() + (error.line ? " (line: " + error.line + ")" : "");
        logToPanel(errorMsg); // Log detailed error
        statusText.text = "Error: " + error.toString();
        
        // Write detailed error to result file
        try {
            logToPanel("Attempting to write ERROR to result file...");
            var errorResult = JSON.stringify({ 
                status: "error", 
                command: command,
                message: error.toString(),
                line: error.line,
                fileName: error.fileName
            });
            var errorFile = new File(getResultFilePath());
            errorFile.encoding = "UTF-8";
            if (errorFile.open("w")) {
                errorFile.write(errorResult);
                errorFile.close();
                logToPanel("Successfully wrote ERROR to result file.");
            } else {
                 logToPanel("CRITICAL ERROR: Failed to open result file to write error!");
            }
        } catch (writeError) {
             logToPanel("CRITICAL ERROR: Failed to write error to result file: " + writeError.toString());
        }
        
        // Update command file status even after error
        logToPanel("Updating command status to error...");
        updateCommandStatus("error");
        logToPanel("Command status updated to error.");
    }
}

// Update command file status
function updateCommandStatus(status) {
    try {
        var commandFile = new File(getCommandFilePath());
        if (commandFile.exists) {
            commandFile.open("r");
            var content = commandFile.read();
            commandFile.close();
            
            if (content) {
                var commandData = JSON.parse(content);
                commandData.status = status;
                
                commandFile.open("w");
                commandFile.write(JSON.stringify(commandData));
                commandFile.close();
            }
        }
    } catch (e) {
        logToPanel("Error updating command status: " + e.toString());
    }
}

// Log message to panel
function logToPanel(message) {
    var timestamp = new Date().toLocaleTimeString();
    logText.text = timestamp + ": " + message + "\n" + logText.text;
}

// Check for new commands
function checkForCommands() {
    if (!autoRunCheckbox.value || isChecking) return;
    
    isChecking = true;
    
    try {
        var commandFile = new File(getCommandFilePath());
        if (commandFile.exists) {
            commandFile.open("r");
            var content = commandFile.read();
            commandFile.close();
            
            if (content) {
                var commandData = (typeof JSON !== "undefined" && JSON.parse)
                    ? JSON.parse(content)
                    : eval("(" + content + ")");
                
                // Only execute pending commands
                if (commandData.status === "pending") {
                    // Update status to running
                    updateCommandStatus("running");
                    
                    // Execute the command
                    executeCommand(commandData.command, commandData.args || {});
                }
            }
        }
    } catch (e) {
        logToPanel("Error checking for commands: " + e.toString());
    }
    
    isChecking = false;
}

// Set up timer to check for commands
function startCommandChecker() {
    app.scheduleTask("checkForCommands()", checkInterval, true);
}

// Add manual check button
var checkButton = panel.add("button", undefined, "Check for Commands Now");
checkButton.onClick = function() {
    logToPanel("Manually checking for commands");
    checkForCommands();
};

// Log startup
logToPanel("MCP Bridge Auto started");
logToPanel("Command file: " + getCommandFilePath());
statusText.text = "Ready - Auto-run is " + (autoRunCheckbox.value ? "ON" : "OFF");

// Start the command checker
startCommandChecker();

// Show the panel
panel.center();
panel.show();

