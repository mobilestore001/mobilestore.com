from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    },
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"]
)


# ============================================================
# UPLOAD FOLDER
# ============================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ============================================================
# ALLOWED FILE TYPES — IMAGES ONLY
# ============================================================

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "jpe",
    "jfif",
    "png",
    "webp",
    "gif",
    "bmp",
    "avif",
    "heic",
    "heif"
}


def allowed_file(filename):

    if not filename or "." not in filename:
        return False

    extension = (
        filename
        .rsplit(".", 1)[1]
        .lower()
    )

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "status": "online",
        "service": "Mobile Store Upload Server"
    })


# ============================================================
# IMAGE UPLOAD
# ============================================================

@app.route(
    "/upload",
    methods=["POST", "OPTIONS"]
)
def upload_file():

    if request.method == "OPTIONS":

        return jsonify({
            "success": True
        }), 200

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "error": "No file was uploaded."
        }), 400

    file = request.files["file"]

    if not file or not file.filename:

        return jsonify({
            "success": False,
            "error": "No file was selected."
        }), 400

    original_name = secure_filename(
        file.filename
    )

    if not original_name:

        return jsonify({
            "success": False,
            "error": "Invalid filename."
        }), 400

    if not allowed_file(original_name):

        return jsonify({
            "success": False,
            "error": "Only image files are allowed."
        }), 400

    extension = ""

    if "." in original_name:

        extension = (
            "."
            + original_name
            .rsplit(".", 1)[1]
            .lower()
        )

    unique_name = (
        uuid.uuid4().hex
        + extension
    )

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        unique_name
    )

    try:

        file.save(file_path)

    except Exception as error:

        return jsonify({
            "success": False,
            "error": (
                "Could not save file: "
                + str(error)
            )
        }), 500

    if not os.path.exists(file_path):

        return jsonify({
            "success": False,
            "error": "File was not saved."
        }), 500

    # Railway forwards HTTPS requests to the container.
    # Always return the public HTTPS URL.

    file_url = (
        "https://"
        + request.host
        + "/uploads/"
        + unique_name
    )

    return jsonify({

        "success": True,

        "url": file_url,

        "filename": unique_name,

        "originalName": original_name,

        "type": file.content_type or "",

        "size": os.path.getsize(file_path)

    }), 200


# ============================================================
# SERVE UPLOADED IMAGES
# ============================================================

@app.route(
    "/uploads/<path:filename>",
    methods=["GET"]
)
def uploaded_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# ============================================================
# 404
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "Route not found."
    }), 404


# ============================================================
# 500
# ============================================================

@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "success": False,
        "error": "Internal server error."
    }), 500


# ============================================================
# LOCAL SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            8080
        )
    )

    app.run(
        host="0.0.0.0",
        port=port
    )
