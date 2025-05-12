from flask import Flask, request, jsonify
from server.app.interferogram import restore
from PIL import Image
import io
import numpy as np

def create_app():
    app = Flask(__name__)

    @app.route('/api/restore', methods=['POST'])
    def process_image():
        if 'file' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
    
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        try:
            img = Image.open(io.BytesIO(file.read())).convert('L')
            img_array = np.array(img)
        except Exception as e:
            return jsonify({"error": f"Image processing failed: {str(e)}"}), 400
    
        l = request.form.get('lambda')
        mask_radius = request.form.get('radius')
        x_angle = request.form.get('xAngle')
        y_angle = request.form.get('yAngle')
        x_size = request.form.get('xSize')
        y_size = request.form.get('ySize')

        l = float(l) if l is not None and l != '' else None
        mask_radius = int(mask_radius) if mask_radius is not None and mask_radius != '' else None
        x_angle = float(x_angle) if x_angle is not None and x_angle != '' else 0
        y_angle = float(y_angle) if y_angle is not None and y_angle != '' else 0
        x_size = float(x_size) if x_size is not None and x_size != '' else None
        y_size = float(y_size) if y_size is not None and y_size != '' and x_size is None  else None

        size = (x_size, y_size) if x_size is not None or y_size is not None else None
        angle = (x_angle, y_angle) if x_angle != 0 or y_angle != 0 else None

        processed_array, peaks = restore(img_array, wavelength=l, size=size, angle=angle, mask_radius=mask_radius)

        return jsonify({
            "matrix": processed_array.tolist(),
            "peaks": peaks
        })
    
    return app

if __name__ == "__main__":
    app.run(debug=True)